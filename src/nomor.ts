/**
 * Pemeriksaan nomor terbitan: ISBN (angka periksa), DOI (bentuk), dan tanggal.
 * Pemeriksaan ini hanya menangkap salah ketik. Nomor yang lolos belum tentu
 * milik buku yang dimaksud; itu tugas pencocokan ke katalog.
 */

/** Buang tanda hubung dan spasi. */
export function rapikanIsbn(isbn: string): string {
  return isbn.replace(/[\s-]/g, "").toUpperCase();
}

/** ISBN-10: jumlah (10 - i) * digit habis dibagi 11; digit terakhir boleh X (= 10). */
export function isbn10Sah(isbn: string): boolean {
  const s = rapikanIsbn(isbn);
  if (!/^\d{9}[\dX]$/.test(s)) return false;
  let jumlah = 0;
  for (let i = 0; i < 10; i++) {
    const nilai = s[i] === "X" ? 10 : Number(s[i]);
    jumlah += (10 - i) * nilai;
  }
  return jumlah % 11 === 0;
}

/** ISBN-13: bobot bergantian 1 dan 3, jumlah habis dibagi 10. */
export function isbn13Sah(isbn: string): boolean {
  const s = rapikanIsbn(isbn);
  if (!/^97[89]\d{10}$/.test(s)) return false;
  let jumlah = 0;
  for (let i = 0; i < 13; i++) {
    jumlah += Number(s[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return jumlah % 10 === 0;
}

export function isbnSah(isbn: string): boolean {
  const s = rapikanIsbn(isbn);
  return s.length === 10 ? isbn10Sah(s) : s.length === 13 ? isbn13Sah(s) : false;
}

/** Bentuk DOI menurut Crossref: awalan 10.NNNN, garis miring, lalu akhiran. */
export function doiSah(doi: string): boolean {
  return /^10\.\d{4,9}\/\S+$/.test(doi);
}

/** Tanggal kalender YYYY-MM-DD yang benar-benar ada. */
export function tanggalSah(t: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return false;
  const d = new Date(`${t}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === t;
}

export function hitungKata(teks: string): number {
  return teks.trim().split(/\s+/).filter((k) => k.length > 0).length;
}
