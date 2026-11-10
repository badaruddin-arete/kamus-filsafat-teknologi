/**
 * Pemeriksaan seluruh kamus: hal-hal yang tidak terlihat dari satu berkas saja,
 * seperti rujukan silang yang putus, istilah ganda, dan sumber yang tidak
 * pernah dirujuk.
 */

import { parse } from "@std/toml";
import { basename, join } from "@std/path";
import type { Entri, Sumber, Tingkat } from "./jenis.ts";
import { type Mentah, validasiEntri, validasiSumber } from "./validasi.ts";

export interface Korpus {
  entri: Entri[];
  pustaka: Sumber[];
}

/** Periksa hubungan antarentri dan antara entri dengan pustaka. */
export function periksaKorpus({ entri, pustaka }: Korpus): string[] {
  const galat: string[] = [];
  const kunci = new Map<string, Sumber>();
  for (const s of pustaka) {
    if (kunci.has(s.kunci)) galat.push(`pustaka: kunci '${s.kunci}' ganda`);
    kunci.set(s.kunci, s);
  }

  const ids = new Set<string>();
  const istilah = new Map<string, string>();
  for (const e of entri) {
    if (ids.has(e.id)) galat.push(`entri: id '${e.id}' ganda`);
    ids.add(e.id);
    const k = e.istilah.toLowerCase();
    const lain = istilah.get(k);
    if (lain !== undefined) {
      galat.push(`entri/${e.id}.toml: istilah '${e.istilah}' sudah dipakai entri '${lain}'`);
    } else {
      istilah.set(k, e.id);
    }
  }

  const dirujuk = new Set<string>();
  for (const e of entri) {
    for (const t of e.terkait) {
      if (!ids.has(t)) galat.push(`entri/${e.id}.toml: entri terkait '${t}' tidak ada`);
    }
    const sumberDiEntri = new Set<string>();
    for (const r of e.rujukan) {
      if (!kunci.has(r.sumber)) {
        galat.push(`entri/${e.id}.toml: sumber '${r.sumber}' tidak ada di pustaka`);
      }
      const k = `${r.sumber}|${r.halaman ?? ""}`;
      if (sumberDiEntri.has(k)) {
        galat.push(`entri/${e.id}.toml: rujukan '${r.sumber}' ditulis dua kali`);
      }
      sumberDiEntri.add(k);
      dirujuk.add(r.sumber);
    }
  }
  for (const s of pustaka) {
    if (!dirujuk.has(s.kunci)) {
      galat.push(`pustaka: sumber '${s.kunci}' tidak dirujuk entri mana pun`);
    }
  }
  return galat;
}

/**
 * Tingkat keterandalan entri:
 * - `terverifikasi`: semua rujukan dicocokkan ke teks dan semua sumbernya ke katalog.
 * - `sebagian`: data semua sumbernya cocok dengan katalog, tetapi isinya belum dicocokkan.
 * - `belum`: ada sumber yang datanya belum dicocokkan ke katalog.
 */
export function tingkatEntri(e: Entri, pustaka: Sumber[]): Tingkat {
  const peta = new Map(pustaka.map((s) => [s.kunci, s]));
  const sumberCocok = e.rujukan.every((r) => peta.get(r.sumber)?.status === "katalog");
  if (!sumberCocok) return "belum";
  return e.rujukan.every((r) => r.status === "teks") ? "terverifikasi" : "sebagian";
}

export interface HasilBaca {
  korpus: Korpus;
  galat: string[];
}

/** Baca `entri/*.toml` dan `pustaka/pustaka.toml` dari folder akar kamus. */
export async function bacaKorpus(akar: string): Promise<HasilBaca> {
  const galat: string[] = [];
  const pustaka: Sumber[] = [];
  const entri: Entri[] = [];

  const berkasPustaka = join(akar, "pustaka", "pustaka.toml");
  const dataPustaka = await bacaToml(berkasPustaka, "pustaka/pustaka.toml", galat);
  if (dataPustaka) {
    const daftar = dataPustaka["sumber"];
    const asing = Object.keys(dataPustaka).filter((k) => k !== "sumber");
    for (const k of asing) galat.push(`pustaka/pustaka.toml: bagian '${k}' tidak dikenal`);
    if (!Array.isArray(daftar)) {
      galat.push("pustaka/pustaka.toml: harus berisi daftar [[sumber]]");
    } else {
      daftar.forEach((d, n) => {
        const tempat = `pustaka/pustaka.toml [[sumber]] ke-${n + 1}`;
        const h = validasiSumber(d as Mentah, tempat);
        galat.push(...h.galat);
        if (h.nilai) pustaka.push(h.nilai);
      });
    }
  }

  const folder = join(akar, "entri");
  const nama: string[] = [];
  for await (const f of Deno.readDir(folder)) {
    if (f.isFile && f.name.endsWith(".toml")) nama.push(f.name);
  }
  nama.sort();
  for (const n of nama) {
    const data = await bacaToml(join(folder, n), `entri/${n}`, galat);
    if (!data) continue;
    const h = validasiEntri(data, basename(n, ".toml"));
    galat.push(...h.galat);
    if (h.nilai) entri.push(h.nilai);
  }

  const korpus = { entri, pustaka };
  if (galat.length === 0) galat.push(...periksaKorpus(korpus));
  return { korpus, galat };
}

async function bacaToml(berkas: string, tempat: string, galat: string[]): Promise<Mentah | null> {
  let teks: string;
  try {
    teks = await Deno.readTextFile(berkas);
  } catch {
    galat.push(`${tempat}: berkas tidak bisa dibaca`);
    return null;
  }
  try {
    return parse(teks) as Mentah;
  } catch (e) {
    const pesan = e instanceof Error ? e.message.split("\n")[0] : String(e);
    galat.push(`${tempat}: TOML tidak sah (${pesan})`);
    return null;
  }
}

/** Urutkan menurut abjad Indonesia sederhana (tanpa memperhatikan huruf besar). */
export function urutAbjad(entri: Entri[]): Entri[] {
  return [...entri].sort((a, b) => a.istilah.localeCompare(b.istilah, "id"));
}
