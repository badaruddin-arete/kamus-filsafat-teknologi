import { assert, assertEquals } from "@std/assert";
import { join } from "@std/path";
import { bacaKorpus, periksaKorpus, tingkatEntri, urutAbjad } from "../src/korpus.ts";
import type { Entri, Sumber } from "../src/jenis.ts";
import { validasiEntri, validasiSumber } from "../src/validasi.ts";
import { entriContoh, sumberContoh } from "./contoh.ts";
import type { Mentah } from "../src/validasi.ts";

function entri(ubah: Mentah = {}): Entri {
  const data = entriContoh(ubah);
  const h = validasiEntri(data, data.id as string);
  if (!h.nilai) throw new Error(h.galat.join("\n"));
  return h.nilai;
}

function sumber(ubah: Mentah = {}): Sumber {
  const h = validasiSumber(sumberContoh(ubah), "uji");
  if (!h.nilai) throw new Error(h.galat.join("\n"));
  return h.nilai;
}

const katalog = { status: "katalog", bukti: "https://contoh.id", diperiksa: "2026-11-10" };
const teks = { status: "teks", halaman: "3", pemeriksa: "P", diperiksa: "2026-11-10" };

Deno.test("korpus kecil yang rapi tidak punya galat", () => {
  const g = periksaKorpus({
    entri: [entri(), entri({ id: "kedua", istilah: "kedua", terkait: ["contoh"] })],
    pustaka: [sumber()],
  });
  assertEquals(g, []);
});

Deno.test("rujukan silang ke entri yang tidak ada ditangkap", () => {
  const g = periksaKorpus({ entri: [entri({ terkait: ["hantu"] })], pustaka: [sumber()] });
  assertEquals(g, ["entri/contoh.toml: entri terkait 'hantu' tidak ada"]);
});

Deno.test("sumber yang tidak ada di pustaka ditangkap", () => {
  const g = periksaKorpus({
    entri: [entri({ rujukan: [{ sumber: "hantu-1999", status: "belum" }] })],
    pustaka: [sumber()],
  });
  assert(g.includes("entri/contoh.toml: sumber 'hantu-1999' tidak ada di pustaka"));
});

Deno.test("istilah ganda ditangkap tanpa memandang huruf besar", () => {
  const g = periksaKorpus({
    entri: [entri(), entri({ id: "lain", istilah: "Contoh" })],
    pustaka: [sumber()],
  });
  assertEquals(g, ["entri/lain.toml: istilah 'Contoh' sudah dipakai entri 'contoh'"]);
});

Deno.test("kunci pustaka ganda dan sumber yang tidak dirujuk ditangkap", () => {
  const g = periksaKorpus({
    entri: [entri()],
    pustaka: [sumber(), sumber(), sumber({ kunci: "yatim-2001" })],
  });
  assert(g.includes("pustaka: kunci 'penulis-2000' ganda"));
  assert(g.includes("pustaka: sumber 'yatim-2001' tidak dirujuk entri mana pun"));
});

Deno.test("rujukan yang sama ditulis dua kali ditangkap", () => {
  const r = { sumber: "penulis-2000", status: "belum" };
  const g = periksaKorpus({ entri: [entri({ rujukan: [r, r] })], pustaka: [sumber()] });
  assertEquals(g, ["entri/contoh.toml: rujukan 'penulis-2000' ditulis dua kali"]);
});

Deno.test("tingkat entri mengikuti mata rantai terlemah", () => {
  const belum = sumber();
  const cocok = sumber(katalog);
  assertEquals(tingkatEntri(entri(), [belum]), "belum");
  assertEquals(tingkatEntri(entri(), [cocok]), "sebagian");
  const e = entri({ rujukan: [{ sumber: "penulis-2000", ...teks }] });
  assertEquals(tingkatEntri(e, [cocok]), "terverifikasi");
  // Isi sudah dicocokkan, tetapi data bukunya belum: tetap 'belum'.
  assertEquals(tingkatEntri(e, [belum]), "belum");
});

Deno.test("urutAbjad mengurutkan tanpa memandang huruf besar", () => {
  const u = urutAbjad([
    entri({ id: "b", istilah: "teknik" }),
    entri({ id: "a", istilah: "Artefak" }),
    entri({ id: "c", istilah: "benda fokal" }),
  ]);
  assertEquals(u.map((e) => e.istilah), ["Artefak", "benda fokal", "teknik"]);
});

async function folderSementara(berkas: Record<string, string>): Promise<string> {
  const akar = await Deno.makeTempDir();
  await Deno.mkdir(join(akar, "entri"));
  await Deno.mkdir(join(akar, "pustaka"));
  for (const [nama, isi] of Object.entries(berkas)) {
    await Deno.writeTextFile(join(akar, nama), isi);
  }
  return akar;
}

const PUSTAKA_TOML = `
[[sumber]]
kunci = "penulis-2000"
penulis = ["Penulis Rekaan"]
tahun = 2000
judul = "Buku Rekaan"
jenis = "buku"
bahasa = "en"
penerbit = "Penerbit Rekaan"
status = "belum"
`;

const ENTRI_TOML = `
id = "contoh"
istilah = "contoh"
asal = { istilah = "example", bahasa = "en" }
definisi = "Definisi."
alasan = "Alasan."
yang_hilang = "Tidak ada."

[[rujukan]]
sumber = "penulis-2000"
status = "belum"

[kbbi]
lema = "contoh"
status = "belum"
`;

Deno.test("bacaKorpus membaca folder kamus dari berkas TOML", async () => {
  const akar = await folderSementara({
    "pustaka/pustaka.toml": PUSTAKA_TOML,
    "entri/contoh.toml": ENTRI_TOML,
  });
  const { korpus, galat } = await bacaKorpus(akar);
  assertEquals(galat, []);
  assertEquals(korpus.entri.map((e) => e.id), ["contoh"]);
  assertEquals(korpus.pustaka.length, 1);
  await Deno.remove(akar, { recursive: true });
});

Deno.test("bacaKorpus melaporkan TOML rusak dengan nama berkas", async () => {
  const akar = await folderSementara({
    "pustaka/pustaka.toml": PUSTAKA_TOML,
    "entri/contoh.toml": ENTRI_TOML,
    "entri/rusak.toml": 'id = "rusak"\nistilah = ',
  });
  const { galat } = await bacaKorpus(akar);
  assertEquals(galat.length, 1);
  assert(galat[0].startsWith("entri/rusak.toml: TOML tidak sah"));
  await Deno.remove(akar, { recursive: true });
});

Deno.test("kamus sungguhan di repo ini lolos semua pemeriksaan", async () => {
  const akar = new URL("..", import.meta.url).pathname;
  const { korpus, galat } = await bacaKorpus(akar);
  assertEquals(galat, []);
  assert(korpus.entri.length >= 1);
});
