/** Data contoh untuk pengujian. Sengaja rekaan, bukan isi kamus. */

import type { Mentah } from "../src/validasi.ts";

export function sumberContoh(ubah: Mentah = {}): Mentah {
  return {
    kunci: "penulis-2000",
    penulis: ["Penulis Rekaan"],
    tahun: 2000,
    judul: "Buku Rekaan",
    jenis: "buku",
    bahasa: "en",
    penerbit: "Penerbit Rekaan",
    isbn: "0-306-40615-2",
    status: "belum",
    ...ubah,
  };
}

export function entriContoh(ubah: Mentah = {}): Mentah {
  return {
    id: "contoh",
    istilah: "contoh",
    asal: { istilah: "example", bahasa: "en" },
    definisi: "Definisi rekaan.",
    alasan: "Alasan rekaan.",
    yang_hilang: "Tidak ada yang hilang dalam contoh.",
    terkait: [],
    rujukan: [{ sumber: "penulis-2000", status: "belum" }],
    kbbi: { lema: "contoh", status: "belum" },
    ...ubah,
  };
}
