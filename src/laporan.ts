/**
 * Laporan keadaan kamus: berapa entri, seberapa terverifikasi, dan apa yang
 * masih terbuka. Dibuat oleh program dan diuji sama persis dengan
 * docs/laporan.md, jadi angka di dalamnya tidak pernah basi.
 */

import { tingkatEntri, urutAbjad } from "./korpus.ts";
import type { Korpus } from "./korpus.ts";
import { BAHASA, type KodeBahasa } from "./jenis.ts";

export function susunLaporan({ entri, pustaka }: Korpus): string {
  const t = { terverifikasi: 0, sebagian: 0, belum: 0 };
  for (const e of entri) t[tingkatEntri(e, pustaka)]++;

  const perBahasa = new Map<KodeBahasa, number>();
  for (const e of entri) perBahasa.set(e.asal.bahasa, (perBahasa.get(e.asal.bahasa) ?? 0) + 1);

  const rujukan = entri.flatMap((e) => e.rujukan);
  const teks = rujukan.filter((r) => r.status === "teks").length;
  const dgnHalaman = rujukan.filter((r) => r.halaman !== undefined).length;
  const katalog = pustaka.filter((s) => s.status === "katalog").length;
  const tanpaIsbn = pustaka.filter((s) => s.isbn === undefined && s.doi === undefined).length;

  const kbbi = { belum: 0, ada: 0, "tidak-ada": 0 };
  for (const e of entri) kbbi[e.kbbi.status]++;

  const tanpaDitolak = entri.filter((e) => e.ditolak.length === 0).map((e) => e.istilah);
  const dirujukSatu = entri.filter((e) => e.rujukan.length === 1).length;

  const baris: string[] = [];
  baris.push("# Laporan keadaan kamus", "");
  baris.push(
    "Dibuat oleh `deno task laporan` dan diuji sama persis oleh `deno task uji`. " +
      "Jangan disunting tangan.",
    "",
  );
  baris.push("## Ringkasan", "");
  baris.push("| Hal | Jumlah |", "|---|---|");
  baris.push(`| Entri | ${entri.length} |`);
  baris.push(`| Sumber di pustaka | ${pustaka.length} |`);
  baris.push(
    `| Entri terverifikasi (semua rujukan dicocokkan ke teks dan ke katalog) | ${t.terverifikasi} |`,
  );
  baris.push(`| Entri sebagian (data buku cocok katalog, isi belum dicocokkan) | ${t.sebagian} |`);
  baris.push(`| Entri belum (ada sumber yang datanya belum dicocokkan) | ${t.belum} |`);
  baris.push("");
  baris.push("## Bukti yang sudah dan belum ada", "");
  baris.push("| Hal | Jumlah |", "|---|---|");
  baris.push(`| Rujukan di semua entri | ${rujukan.length} |`);
  baris.push(`| Rujukan yang isinya dicocokkan ke teks sumber | ${teks} |`);
  baris.push(`| Rujukan yang sudah punya nomor halaman | ${dgnHalaman} |`);
  baris.push(
    `| Sumber yang datanya dicocokkan ke katalog penerbit | ${katalog} dari ${pustaka.length} |`,
  );
  baris.push(`| Sumber tanpa ISBN atau DOI | ${tanpaIsbn} |`);
  baris.push(
    `| Padanan yang sudah diperiksa di KBBI daring resmi | ${
      kbbi.ada + kbbi["tidak-ada"]
    } dari ${entri.length} |`,
  );
  baris.push(`| Entri yang bersandar pada satu sumber saja | ${dirujukSatu} |`);
  baris.push("");
  baris.push("## Bahasa asal istilah", "");
  baris.push("| Bahasa | Entri |", "|---|---|");
  for (const [kode, n] of [...perBahasa].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    baris.push(`| ${BAHASA[kode]} | ${n} |`);
  }
  baris.push("");
  baris.push("## Entri tanpa padanan yang ditolak", "");
  baris.push(
    tanpaDitolak.length === 0
      ? "Semua entri mencatat sedikitnya satu padanan yang ditolak."
      : `Entri berikut belum mencatat padanan lain yang dipertimbangkan: ${
        tanpaDitolak.join(", ")
      }.`,
  );
  baris.push("");
  baris.push("## Daftar entri", "");
  baris.push("| Istilah | Asal | Keterandalan | Rujukan |", "|---|---|---|---|");
  for (const e of urutAbjad(entri)) {
    baris.push(
      `| ${e.istilah} | ${e.asal.istilah} | ${tingkatEntri(e, pustaka)} | ${e.rujukan.length} |`,
    );
  }
  baris.push("");
  return baris.join("\n");
}
