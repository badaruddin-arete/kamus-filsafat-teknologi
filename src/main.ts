/**
 * Perintah baris perintah kamus.
 *
 *   deno task cek              periksa seluruh kamus; keluar dengan kode 1 bila ada galat
 *   deno task cari <kata>      cari entri menurut istilah Indonesia atau istilah asal
 *   deno task tampil <id>      tampilkan satu entri lengkap dengan status verifikasinya
 */

import { bacaKorpus, tingkatEntri, urutAbjad } from "./korpus.ts";
import { BAHASA, type Entri, type Sumber } from "./jenis.ts";
import { cari } from "./cari.ts";

const AKAR = new URL("..", import.meta.url).pathname;

const BANTUAN = `Kamus Filsafat Teknologi

Perintah:
  cek               periksa seluruh kamus
  cari <kata>       cari menurut istilah Indonesia atau istilah asal
  tampil <id>       tampilkan satu entri lengkap
`;

export function rujukanTeks(s: Sumber, halaman?: string): string {
  const penulis = s.penulis.join(" dan ");
  const hlm = halaman ? `, hlm. ${halaman}` : "";
  return `${penulis} (${s.tahun}), ${s.judul}${hlm}`;
}

export function tampilkan(e: Entri, pustaka: Sumber[]): string {
  const peta = new Map(pustaka.map((s) => [s.kunci, s]));
  const baris: string[] = [];
  baris.push(`${e.istilah}  [${e.asal.istilah}, ${BAHASA[e.asal.bahasa]}]`);
  baris.push(`Keterandalan: ${tingkatEntri(e, pustaka)}`);
  baris.push("", e.definisi, "", `Mengapa padanan ini: ${e.alasan}`);
  baris.push(`Yang hilang: ${e.yang_hilang}`);
  if (e.ditolak.length > 0) {
    baris.push("", "Padanan yang ditolak:");
    for (const d of e.ditolak) baris.push(`  - ${d.padanan}: ${d.alasan}`);
  }
  if (e.terkait.length > 0) baris.push("", `Lihat juga: ${e.terkait.join(", ")}`);
  baris.push("", "Rujukan:");
  for (const r of e.rujukan) {
    const s = peta.get(r.sumber)!;
    const ket = r.status === "teks" ? "isi dicocokkan ke teks" : "isi belum dicocokkan ke teks";
    const kat = s.status === "katalog" ? "data buku cocok katalog" : "data buku belum dicocokkan";
    baris.push(`  - ${rujukanTeks(s, r.halaman)} (${ket}; ${kat})`);
  }
  baris.push("", `KBBI daring: lema '${e.kbbi.lema}', status ${e.kbbi.status}`);
  return baris.join("\n");
}

async function utama(args: string[]): Promise<number> {
  const [perintah, ...sisa] = args;
  if (perintah === undefined || perintah === "bantuan" || perintah === "--help") {
    console.log(BANTUAN);
    return perintah === undefined ? 1 : 0;
  }
  const { korpus, galat } = await bacaKorpus(AKAR);

  if (perintah === "cek") {
    if (galat.length > 0) {
      console.error(`${galat.length} galat:`);
      for (const g of galat) console.error(`  ${g}`);
      return 1;
    }
    const hitung = { terverifikasi: 0, sebagian: 0, belum: 0 };
    for (const e of korpus.entri) hitung[tingkatEntri(e, korpus.pustaka)]++;
    console.log(
      `OK: ${korpus.entri.length} entri, ${korpus.pustaka.length} sumber. ` +
        `Terverifikasi ${hitung.terverifikasi}, sebagian ${hitung.sebagian}, belum ${hitung.belum}.`,
    );
    return 0;
  }

  if (galat.length > 0) {
    console.error("Kamus punya galat; jalankan `deno task cek`.");
    return 1;
  }

  if (perintah === "cari") {
    const kata = sisa.join(" ").trim();
    if (kata === "") {
      console.error("Pemakaian: cari <kata>");
      return 1;
    }
    const hasil = cari(urutAbjad(korpus.entri), kata);
    if (hasil.length === 0) {
      console.log(`Tidak ada entri untuk '${kata}'.`);
      return 0;
    }
    for (const e of hasil) {
      console.log(`${e.id.padEnd(24)} ${e.istilah}  [${e.asal.istilah}]`);
    }
    return 0;
  }

  if (perintah === "tampil") {
    const e = korpus.entri.find((x) => x.id === sisa[0]);
    if (!e) {
      console.error(`Entri '${sisa[0] ?? ""}' tidak ada.`);
      return 1;
    }
    console.log(tampilkan(e, korpus.pustaka));
    return 0;
  }

  console.error(`Perintah '${perintah}' tidak dikenal.\n\n${BANTUAN}`);
  return 1;
}

if (import.meta.main) Deno.exit(await utama(Deno.args));
