import type { Entri } from "./jenis.ts";

/** Hilangkan huruf besar dan tanda aksen supaya "Gestell" dan "gestell" sama. */
export function normal(s: string): string {
  return s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/**
 * Cari entri. Cocok bila kata (tanpa memandang huruf besar dan aksen) muncul di
 * istilah Indonesia, istilah asal, id, atau padanan yang ditolak. Hasil yang
 * cocok persis di istilah didahulukan.
 */
export function cari(entri: Entri[], kata: string): Entri[] {
  const k = normal(kata);
  if (k === "") return [];
  const nilai = (e: Entri): number => {
    const ist = normal(e.istilah);
    const asal = normal(e.asal.istilah);
    if (ist === k || asal === k) return 0;
    if (ist.includes(k) || asal.includes(k) || e.id.includes(k)) return 1;
    if (e.ditolak.some((d) => normal(d.padanan).includes(k))) return 2;
    return 3;
  };
  return entri
    .map((e) => ({ e, n: nilai(e) }))
    .filter((x) => x.n < 3)
    .sort((a, b) => a.n - b.n || a.e.istilah.localeCompare(b.e.istilah, "id"))
    .map((x) => x.e);
}
