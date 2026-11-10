import { assert, assertEquals, assertFalse, assertStringIncludes } from "@std/assert";
import { bacaKorpus } from "../src/korpus.ts";
import { susunLaporan } from "../src/laporan.ts";
import { entriHtml, lolos, susunSitus } from "../src/situs.ts";
import { cari, normal } from "../src/cari.ts";
import { tampilkan } from "../src/main.ts";
import { validasiEntri, validasiSumber } from "../src/validasi.ts";
import { entriContoh, sumberContoh } from "./contoh.ts";

const akar = new URL("..", import.meta.url).pathname;
const { korpus, galat } = await bacaKorpus(akar);

Deno.test("kamus sungguhan bersih dan memuat sekitar 30 entri", () => {
  assertEquals(galat, []);
  assert(korpus.entri.length >= 30, `hanya ${korpus.entri.length} entri`);
});

Deno.test("docs/laporan.md sama persis dengan keluaran program", async () => {
  const tersimpan = await Deno.readTextFile(new URL("../docs/laporan.md", import.meta.url));
  assertEquals(tersimpan, susunLaporan(korpus));
});

Deno.test("setiap entri punya sedikitnya satu rujukan dan alasan yang terisi", () => {
  for (const e of korpus.entri) {
    assert(e.rujukan.length >= 1, e.id);
    assert(e.alasan.length > 20, e.id);
    assert(e.yang_hilang.length > 20, e.id);
  }
});

Deno.test("tidak ada entri yang mengaku terverifikasi tanpa bukti", () => {
  for (const s of korpus.pustaka) {
    if (s.status === "katalog") assert(s.bukti?.startsWith("https://"), s.kunci);
  }
  for (const e of korpus.entri) {
    for (const r of e.rujukan) {
      if (r.status === "teks") assert(r.halaman && r.pemeriksa && r.diperiksa, e.id);
    }
  }
});

Deno.test("lolos mengamankan karakter HTML", () => {
  assertEquals(lolos(`<a href="x">&'</a>`), "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
});

Deno.test("entri dengan teks berbahaya tidak menyisipkan HTML mentah", () => {
  const h = validasiEntri(
    entriContoh({ istilah: "<script>alert(1)</script>", definisi: "a<b" }),
    "contoh",
  );
  const s = validasiSumber(sumberContoh(), "uji");
  assertFalse(entriHtml(h.nilai!, [s.nilai!]).includes("<script>"));
});

Deno.test("situs memuat semua entri, lencana status, dan peringatan di atas", () => {
  const html = susunSitus(korpus, "2026-11-10");
  assertStringIncludes(html, "Baca ini dulu");
  assertStringIncludes(html, "Belum terverifikasi");
  for (const e of korpus.entri) assertStringIncludes(html, `id="${e.id}"`);
  assertFalse(html.includes("http://"), "situs tidak boleh memuat sumber luar tanpa enkripsi");
  assertFalse(/<script[^>]+src=/.test(html), "situs tidak boleh memuat skrip luar");
});

Deno.test("setiap tautan 'lihat juga' di situs menuju entri yang ada", () => {
  const html = susunSitus(korpus, "2026-11-10");
  const tujuan = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]);
  const ada = new Set(korpus.entri.map((e) => e.id));
  for (const t of tujuan) assert(ada.has(t), `tautan putus: #${t}`);
});

Deno.test("normal membuang aksen dan huruf besar", () => {
  assertEquals(normal("Gestell"), "gestell");
  assertEquals(normal("concrétisation"), "concretisation");
});

Deno.test("cari menemukan lewat istilah asal, tanpa memandang huruf besar", () => {
  assertEquals(cari(korpus.entri, "GESTELL").map((e) => e.id), ["pembingkaian"]);
  assertEquals(cari(korpus.entri, "concretisation").map((e) => e.id), ["konkretisasi"]);
});

Deno.test("cari menemukan lewat padanan yang ditolak dan mendahulukan cocok persis", () => {
  const hasil = cari(korpus.entri, "alat").map((e) => e.id);
  assert(hasil.includes("perangkat"));
  assertEquals(cari(korpus.entri, "benda fokal")[0].id, "benda-fokal");
});

Deno.test("cari tanpa kata atau tanpa hasil mengembalikan daftar kosong", () => {
  assertEquals(cari(korpus.entri, "  "), []);
  assertEquals(cari(korpus.entri, "zzzzqqq"), []);
});

Deno.test("tampilkan menyebut status verifikasi dan padanan yang ditolak", () => {
  const e = korpus.entri.find((x) => x.id === "perangkat")!;
  const teks = tampilkan(e, korpus.pustaka);
  assertStringIncludes(teks, "Keterandalan: belum");
  assertStringIncludes(teks, "Padanan yang ditolak");
  assertStringIncludes(teks, "isi belum dicocokkan ke teks");
});
