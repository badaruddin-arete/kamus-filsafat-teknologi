import { assert, assertEquals, assertStringIncludes } from "@std/assert";
import { validasiEntri, validasiSumber } from "../src/validasi.ts";
import { entriContoh, sumberContoh } from "./contoh.ts";

function satuGalat(galat: string[], potongan: string) {
  assert(
    galat.some((g) => g.includes(potongan)),
    `tidak ada galat yang memuat '${potongan}':\n${galat.join("\n")}`,
  );
}

// --- Sumber pustaka ---

Deno.test("sumber contoh sah", () => {
  const h = validasiSumber(sumberContoh(), "uji");
  assertEquals(h.galat, []);
  assertEquals(h.nilai?.kunci, "penulis-2000");
});

Deno.test("sumber tanpa judul ditolak", () => {
  const s = sumberContoh();
  delete s.judul;
  satuGalat(validasiSumber(s, "uji").galat, "'judul' wajib diisi");
});

Deno.test("bidang sumber yang tidak dikenal ditolak", () => {
  satuGalat(
    validasiSumber(sumberContoh({ peringkat: 5 }), "uji").galat,
    "'peringkat' tidak dikenal",
  );
});

Deno.test("ISBN salah ketik ditolak", () => {
  satuGalat(validasiSumber(sumberContoh({ isbn: "0-306-40615-3" }), "uji").galat, "angka periksa");
});

Deno.test("DOI dengan awalan 'doi:' ditolak", () => {
  satuGalat(validasiSumber(sumberContoh({ doi: "doi:10.1/x" }), "uji").galat, "DOI");
});

Deno.test("buku tanpa penerbit ditolak", () => {
  const s = sumberContoh();
  delete s.penerbit;
  satuGalat(validasiSumber(s, "uji").galat, "wajib punya penerbit");
});

Deno.test("artikel tanpa nama jurnal ditolak", () => {
  satuGalat(validasiSumber(sumberContoh({ jenis: "artikel" }), "uji").galat, "'wadah'");
});

Deno.test("status katalog wajib punya tautan bukti dan tanggal", () => {
  const g = validasiSumber(sumberContoh({ status: "katalog" }), "uji").galat;
  satuGalat(g, "'bukti'");
  satuGalat(g, "'diperiksa'");
});

Deno.test("status katalog dengan bukti http biasa ditolak", () => {
  const g = validasiSumber(
    sumberContoh({ status: "katalog", bukti: "http://contoh.id", diperiksa: "2026-11-10" }),
    "uji",
  ).galat;
  satuGalat(g, "tautan https");
});

Deno.test("status katalog tanpa ISBN atau DOI ditolak", () => {
  const s = sumberContoh({
    status: "katalog",
    bukti: "https://contoh.id",
    diperiksa: "2026-11-10",
  });
  delete s.isbn;
  satuGalat(validasiSumber(s, "uji").galat, "ISBN atau DOI");
});

Deno.test("status katalog lengkap diterima, tanggal TOML tanpa kutip juga", () => {
  const h = validasiSumber(
    sumberContoh({
      status: "katalog",
      bukti: "https://contoh.id/buku",
      diperiksa: new Date("2026-11-10T00:00:00Z"),
    }),
    "uji",
  );
  assertEquals(h.galat, []);
  assertEquals(h.nilai?.diperiksa, "2026-11-10");
});

Deno.test("sumber berstatus belum tidak boleh mengaku sudah diperiksa", () => {
  satuGalat(
    validasiSumber(sumberContoh({ diperiksa: "2026-11-10" }), "uji").galat,
    "tidak boleh punya bukti",
  );
});

Deno.test("terbitan asli tidak boleh lebih muda dari terjemahannya", () => {
  satuGalat(validasiSumber(sumberContoh({ terbit_asli: 2010 }), "uji").galat, "terbit_asli");
});

Deno.test("bahasa di luar daftar ditolak", () => {
  satuGalat(validasiSumber(sumberContoh({ bahasa: "jp" }), "uji").galat, "'bahasa'");
});

// --- Entri ---

Deno.test("entri contoh sah", () => {
  const h = validasiEntri(entriContoh(), "contoh");
  assertEquals(h.galat, []);
  assertEquals(h.nilai?.rujukan.length, 1);
});

Deno.test("entri tanpa rujukan ditolak", () => {
  satuGalat(validasiEntri(entriContoh({ rujukan: [] }), "contoh").galat, "[[rujukan]] wajib");
  const e = entriContoh();
  delete e.rujukan;
  satuGalat(validasiEntri(e, "contoh").galat, "[[rujukan]] wajib");
});

Deno.test("id entri harus sama dengan nama berkas", () => {
  satuGalat(validasiEntri(entriContoh(), "lain").galat, "tidak sama dengan nama berkas");
});

Deno.test("id entri harus huruf kecil dan tanda hubung", () => {
  satuGalat(validasiEntri(entriContoh({ id: "Contoh_1" }), "Contoh_1").galat, "huruf kecil");
});

Deno.test("bidang entri yang tidak dikenal ditolak", () => {
  satuGalat(validasiEntri(entriContoh({ skor: 3 }), "contoh").galat, "'skor' tidak dikenal");
});

Deno.test("entri wajib menyebut apa yang hilang dalam terjemahan", () => {
  const e = entriContoh();
  delete e.yang_hilang;
  satuGalat(validasiEntri(e, "contoh").galat, "'yang_hilang' wajib");
});

Deno.test("teks kosong berisi spasi saja ditolak", () => {
  satuGalat(validasiEntri(entriContoh({ alasan: "   " }), "contoh").galat, "tidak boleh kosong");
});

Deno.test("padanan tidak boleh dipilih sekaligus ditolak", () => {
  const g = validasiEntri(
    entriContoh({ ditolak: [{ padanan: "Contoh", alasan: "x" }] }),
    "contoh",
  ).galat;
  satuGalat(g, "dipilih sekaligus ditolak");
});

Deno.test("padanan yang ditolak wajib punya alasan", () => {
  satuGalat(
    validasiEntri(entriContoh({ ditolak: [{ padanan: "teladan" }] }), "contoh").galat,
    "'alasan' wajib",
  );
});

Deno.test("entri tidak boleh terkait dengan dirinya sendiri atau ganda", () => {
  satuGalat(validasiEntri(entriContoh({ terkait: ["contoh"] }), "contoh").galat, "dirinya sendiri");
  satuGalat(validasiEntri(entriContoh({ terkait: ["a", "a"] }), "contoh").galat, "ganda");
});

Deno.test("kutipan langsung ditolak bila rujukan belum dicocokkan ke teks", () => {
  const g = validasiEntri(
    entriContoh({ rujukan: [{ sumber: "penulis-2000", status: "belum", kutipan: "kata kata" }] }),
    "contoh",
  ).galat;
  satuGalat(g, "kutipan langsung hanya boleh");
});

Deno.test("rujukan berstatus teks wajib punya halaman, pemeriksa, dan tanggal", () => {
  const g = validasiEntri(
    entriContoh({ rujukan: [{ sumber: "penulis-2000", status: "teks" }] }),
    "contoh",
  ).galat;
  satuGalat(g, "'halaman'");
  satuGalat(g, "'pemeriksa'");
  satuGalat(g, "'diperiksa'");
});

Deno.test("kutipan lebih dari 40 kata ditolak", () => {
  const panjang = Array(41).fill("kata").join(" ");
  const g = validasiEntri(
    entriContoh({
      rujukan: [{
        sumber: "penulis-2000",
        status: "teks",
        halaman: "12",
        pemeriksa: "Penguji",
        diperiksa: "2026-11-10",
        kutipan: panjang,
      }],
    }),
    "contoh",
  ).galat;
  satuGalat(g, "lebih dari 40 kata");
});

Deno.test("rujukan teks lengkap dengan kutipan pendek diterima", () => {
  const h = validasiEntri(
    entriContoh({
      rujukan: [{
        sumber: "penulis-2000",
        status: "teks",
        halaman: "12",
        pemeriksa: "Penguji",
        diperiksa: "2026-11-10",
        kutipan: "kutipan pendek",
      }],
    }),
    "contoh",
  );
  assertEquals(h.galat, []);
});

Deno.test("status KBBI selain belum wajib punya tanggal periksa", () => {
  satuGalat(
    validasiEntri(entriContoh({ kbbi: { lema: "contoh", status: "ada" } }), "contoh").galat,
    "wajib punya tanggal",
  );
  satuGalat(
    validasiEntri(
      entriContoh({ kbbi: { lema: "contoh", status: "belum", diperiksa: "2026-11-10" } }),
      "contoh",
    ).galat,
    "tidak boleh punya tanggal",
  );
});

Deno.test("galat menyebut nama berkas supaya mudah dicari", () => {
  const g = validasiEntri(entriContoh({ istilah: 5 }), "contoh").galat;
  assertStringIncludes(g[0], "entri/contoh.toml");
});
