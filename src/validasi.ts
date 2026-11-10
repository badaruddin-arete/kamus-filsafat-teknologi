/**
 * Validasi satu entri dan satu sumber pustaka.
 *
 * Setiap fungsi menerima data mentah hasil baca TOML dan mengembalikan data
 * yang sudah bertipe bila sah, beserta daftar galat dalam bahasa Indonesia.
 * Bidang yang tidak dikenal selalu ditolak, supaya tidak ada keterangan yang
 * terselip tanpa diperiksa.
 */

import {
  BAHASA,
  BATAS_KATA_KUTIPAN,
  type Ditolak,
  type Entri,
  JENIS_SUMBER,
  type Kbbi,
  type KodeBahasa,
  type Rujukan,
  STATUS_KBBI,
  STATUS_RUJUKAN,
  STATUS_SUMBER,
  type Sumber,
} from "./jenis.ts";
import { doiSah, hitungKata, isbnSah, tanggalSah } from "./nomor.ts";

export type Mentah = Record<string, unknown>;

export interface Hasil<T> {
  nilai?: T;
  galat: string[];
}

const POLA_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function adalahRekaman(x: unknown): x is Mentah {
  return typeof x === "object" && x !== null && !Array.isArray(x) && !(x instanceof Date);
}

/** Pembaca kecil yang mencatat galat sambil mengambil bidang. */
class Pembaca {
  constructor(
    private data: Mentah,
    private tempat: string,
    private galat: string[],
  ) {}

  tolakAsing(izin: readonly string[]): void {
    for (const k of Object.keys(this.data)) {
      if (!izin.includes(k)) this.galat.push(`${this.tempat}: bidang '${k}' tidak dikenal`);
    }
  }

  teks(k: string, wajib = true): string | undefined {
    const v = this.data[k];
    if (v === undefined) {
      if (wajib) this.galat.push(`${this.tempat}: bidang '${k}' wajib diisi`);
      return undefined;
    }
    if (typeof v !== "string") {
      this.galat.push(`${this.tempat}: bidang '${k}' harus berupa teks`);
      return undefined;
    }
    if (v.trim() === "") {
      this.galat.push(`${this.tempat}: bidang '${k}' tidak boleh kosong`);
      return undefined;
    }
    return v.trim();
  }

  /** Tanggal boleh ditulis dengan atau tanpa tanda kutip di TOML. */
  tanggal(k: string, wajib: boolean): string | undefined {
    const v = this.data[k];
    if (v instanceof Date) {
      const t = v.toISOString().slice(0, 10);
      return t;
    }
    const t = this.teks(k, wajib);
    if (t !== undefined && !tanggalSah(t)) {
      this.galat.push(`${this.tempat}: '${k}' harus tanggal YYYY-MM-DD yang ada, bukan '${t}'`);
      return undefined;
    }
    return t;
  }

  daftarTeks(k: string, wajib: boolean): string[] | undefined {
    const v = this.data[k];
    if (v === undefined) {
      if (wajib) this.galat.push(`${this.tempat}: bidang '${k}' wajib diisi`);
      return undefined;
    }
    if (!Array.isArray(v) || v.some((x) => typeof x !== "string" || x.trim() === "")) {
      this.galat.push(`${this.tempat}: bidang '${k}' harus daftar teks yang tidak kosong`);
      return undefined;
    }
    return v.map((x) => (x as string).trim());
  }

  bulat(k: string, wajib: boolean, min: number, maks: number): number | undefined {
    const v = this.data[k];
    if (v === undefined) {
      if (wajib) this.galat.push(`${this.tempat}: bidang '${k}' wajib diisi`);
      return undefined;
    }
    if (typeof v !== "number" || !Number.isInteger(v) || v < min || v > maks) {
      this.galat.push(`${this.tempat}: '${k}' harus bilangan bulat ${min} sampai ${maks}`);
      return undefined;
    }
    return v;
  }

  pilihan<T extends string>(k: string, daftar: readonly T[]): T | undefined {
    const t = this.teks(k);
    if (t === undefined) return undefined;
    if (!(daftar as readonly string[]).includes(t)) {
      this.galat.push(`${this.tempat}: '${k}' harus salah satu dari ${daftar.join(", ")}`);
      return undefined;
    }
    return t as T;
  }

  bahasa(k: string): KodeBahasa | undefined {
    return this.pilihan(k, Object.keys(BAHASA) as KodeBahasa[]);
  }

  rekaman(k: string): Mentah | undefined {
    const v = this.data[k];
    if (v === undefined) {
      this.galat.push(`${this.tempat}: bagian '${k}' wajib ada`);
      return undefined;
    }
    if (!adalahRekaman(v)) {
      this.galat.push(`${this.tempat}: '${k}' harus berupa tabel`);
      return undefined;
    }
    return v;
  }

  daftarRekaman(k: string, wajib: boolean): Mentah[] | undefined {
    const v = this.data[k];
    if (v === undefined) {
      if (wajib) this.galat.push(`${this.tempat}: sedikitnya satu [[${k}]] wajib ada`);
      return wajib ? undefined : [];
    }
    if (!Array.isArray(v) || !v.every(adalahRekaman)) {
      this.galat.push(`${this.tempat}: '${k}' harus daftar tabel [[${k}]]`);
      return undefined;
    }
    if (wajib && v.length === 0) {
      this.galat.push(`${this.tempat}: sedikitnya satu [[${k}]] wajib ada`);
      return undefined;
    }
    return v;
  }
}

const BIDANG_SUMBER = [
  "kunci",
  "penulis",
  "tahun",
  "judul",
  "jenis",
  "bahasa",
  "penerjemah",
  "wadah",
  "penyunting",
  "jilid",
  "nomor",
  "halaman",
  "penerbit",
  "kota",
  "isbn",
  "doi",
  "terbit_asli",
  "status",
  "bukti",
  "diperiksa",
  "catatan",
] as const;

/** Validasi satu [[sumber]] di daftar pustaka. */
export function validasiSumber(data: Mentah, tempat: string): Hasil<Sumber> {
  const galat: string[] = [];
  const b = new Pembaca(data, tempat, galat);
  b.tolakAsing(BIDANG_SUMBER);

  const kunci = b.teks("kunci");
  if (kunci !== undefined && !POLA_ID.test(kunci)) {
    galat.push(`${tempat}: kunci '${kunci}' harus huruf kecil, angka, dan tanda hubung`);
  }
  const tahunIni = 2100;
  const s = {
    kunci,
    penulis: b.daftarTeks("penulis", true),
    tahun: b.bulat("tahun", true, 1800, tahunIni),
    judul: b.teks("judul"),
    jenis: b.pilihan("jenis", JENIS_SUMBER),
    bahasa: b.bahasa("bahasa"),
    penerjemah: b.daftarTeks("penerjemah", false),
    wadah: b.teks("wadah", false),
    penyunting: b.daftarTeks("penyunting", false),
    jilid: b.teks("jilid", false),
    nomor: b.teks("nomor", false),
    halaman: b.teks("halaman", false),
    penerbit: b.teks("penerbit", false),
    kota: b.teks("kota", false),
    isbn: b.teks("isbn", false),
    doi: b.teks("doi", false),
    terbit_asli: b.bulat("terbit_asli", false, 1800, tahunIni),
    status: b.pilihan("status", STATUS_SUMBER),
    bukti: b.teks("bukti", false),
    diperiksa: b.tanggal("diperiksa", false),
    catatan: b.teks("catatan", false),
  };

  if (s.isbn !== undefined && !isbnSah(s.isbn)) {
    galat.push(`${tempat}: ISBN '${s.isbn}' gagal angka periksa`);
  }
  if (s.doi !== undefined && !doiSah(s.doi)) {
    galat.push(`${tempat}: DOI '${s.doi}' tidak berbentuk 10.NNNN/...`);
  }
  if (s.jenis === "buku" && s.penerbit === undefined) {
    galat.push(`${tempat}: buku wajib punya penerbit`);
  }
  if ((s.jenis === "artikel" || s.jenis === "bab") && s.wadah === undefined) {
    galat.push(`${tempat}: ${s.jenis} wajib punya 'wadah' (jurnal atau buku kumpulan)`);
  }
  if (s.jenis === "bab" && s.penerbit === undefined) {
    galat.push(`${tempat}: bab wajib punya penerbit buku kumpulannya`);
  }
  if (s.terbit_asli !== undefined && s.tahun !== undefined && s.terbit_asli > s.tahun) {
    galat.push(`${tempat}: terbit_asli tidak boleh sesudah tahun terbitan yang dirujuk`);
  }
  if (s.status === "katalog") {
    if (s.bukti === undefined || !s.bukti.startsWith("https://")) {
      galat.push(`${tempat}: status 'katalog' wajib punya 'bukti' berupa tautan https`);
    }
    if (s.diperiksa === undefined) {
      galat.push(`${tempat}: status 'katalog' wajib punya tanggal 'diperiksa'`);
    }
    if (s.isbn === undefined && s.doi === undefined) {
      galat.push(`${tempat}: status 'katalog' wajib punya ISBN atau DOI yang dicocokkan`);
    }
  }
  if (s.status === "belum" && (s.bukti !== undefined || s.diperiksa !== undefined)) {
    galat.push(`${tempat}: sumber berstatus 'belum' tidak boleh punya bukti atau tanggal periksa`);
  }

  if (galat.length > 0) return { galat };
  return { nilai: buangKosong(s) as unknown as Sumber, galat };
}

const BIDANG_ENTRI = [
  "id",
  "istilah",
  "asal",
  "definisi",
  "alasan",
  "yang_hilang",
  "ditolak",
  "terkait",
  "rujukan",
  "kbbi",
] as const;

/**
 * Validasi satu entri. `namaBerkas` tanpa ekstensi harus sama dengan `id`,
 * supaya setiap entri mudah ditemukan dari tautannya.
 */
export function validasiEntri(data: Mentah, namaBerkas: string): Hasil<Entri> {
  const tempat = `entri/${namaBerkas}.toml`;
  const galat: string[] = [];
  const b = new Pembaca(data, tempat, galat);
  b.tolakAsing(BIDANG_ENTRI);

  const id = b.teks("id");
  if (id !== undefined) {
    if (!POLA_ID.test(id)) galat.push(`${tempat}: id '${id}' harus huruf kecil dan tanda hubung`);
    if (id !== namaBerkas) galat.push(`${tempat}: id '${id}' tidak sama dengan nama berkas`);
  }
  const istilah = b.teks("istilah");
  const definisi = b.teks("definisi");
  const alasan = b.teks("alasan");
  const yangHilang = b.teks("yang_hilang");
  const terkait = b.daftarTeks("terkait", false) ?? [];

  let asal: Entri["asal"] | undefined;
  const asalMentah = b.rekaman("asal");
  if (asalMentah) {
    const ba = new Pembaca(asalMentah, `${tempat} [asal]`, galat);
    ba.tolakAsing(["istilah", "bahasa"]);
    const i = ba.teks("istilah");
    const bh = ba.bahasa("bahasa");
    if (i !== undefined && bh !== undefined) asal = { istilah: i, bahasa: bh };
  }

  const ditolak: Ditolak[] = [];
  const daftarDitolak = b.daftarRekaman("ditolak", false) ?? [];
  daftarDitolak.forEach((d, n) => {
    const bd = new Pembaca(d, `${tempat} [[ditolak]] ke-${n + 1}`, galat);
    bd.tolakAsing(["padanan", "alasan"]);
    const padanan = bd.teks("padanan");
    const al = bd.teks("alasan");
    if (padanan !== undefined && al !== undefined) {
      if (istilah !== undefined && padanan.toLowerCase() === istilah.toLowerCase()) {
        galat.push(`${tempat}: padanan '${padanan}' tidak bisa dipilih sekaligus ditolak`);
      }
      ditolak.push({ padanan, alasan: al });
    }
  });

  const rujukan: Rujukan[] = [];
  const daftarRujukan = b.daftarRekaman("rujukan", true) ?? [];
  daftarRujukan.forEach((r, n) => {
    const hasil = validasiRujukan(r, `${tempat} [[rujukan]] ke-${n + 1}`);
    galat.push(...hasil.galat);
    if (hasil.nilai) rujukan.push(hasil.nilai);
  });

  let kbbi: Kbbi | undefined;
  const kbbiMentah = b.rekaman("kbbi");
  if (kbbiMentah) {
    const tk = `${tempat} [kbbi]`;
    const bk = new Pembaca(kbbiMentah, tk, galat);
    bk.tolakAsing(["lema", "status", "diperiksa", "bukti"]);
    const lema = bk.teks("lema");
    const status = bk.pilihan("status", STATUS_KBBI);
    const diperiksa = bk.tanggal("diperiksa", false);
    const bukti = bk.teks("bukti", false);
    if (bukti !== undefined && !bukti.startsWith("https://")) {
      galat.push(`${tk}: 'bukti' harus tautan https`);
    }
    if (status !== undefined && status !== "belum" && diperiksa === undefined) {
      galat.push(`${tk}: status '${status}' wajib punya tanggal 'diperiksa'`);
    }
    if (status === "belum" && diperiksa !== undefined) {
      galat.push(`${tk}: status 'belum' tidak boleh punya tanggal 'diperiksa'`);
    }
    if (lema !== undefined && status !== undefined) {
      kbbi = buangKosong({ lema, status, diperiksa, bukti }) as unknown as Kbbi;
    }
  }

  if (id !== undefined && terkait.includes(id)) {
    galat.push(`${tempat}: entri tidak boleh terkait dengan dirinya sendiri`);
  }
  if (new Set(terkait).size !== terkait.length) {
    galat.push(`${tempat}: daftar 'terkait' memuat id ganda`);
  }

  if (galat.length > 0) return { galat };
  return {
    nilai: {
      id: id!,
      istilah: istilah!,
      asal: asal!,
      definisi: definisi!,
      alasan: alasan!,
      yang_hilang: yangHilang!,
      ditolak,
      terkait,
      rujukan,
      kbbi: kbbi!,
    },
    galat,
  };
}

function validasiRujukan(data: Mentah, tempat: string): Hasil<Rujukan> {
  const galat: string[] = [];
  const b = new Pembaca(data, tempat, galat);
  b.tolakAsing(["sumber", "halaman", "status", "pemeriksa", "diperiksa", "kutipan", "catatan"]);
  const r = {
    sumber: b.teks("sumber"),
    halaman: b.teks("halaman", false),
    status: b.pilihan("status", STATUS_RUJUKAN),
    pemeriksa: b.teks("pemeriksa", false),
    diperiksa: b.tanggal("diperiksa", false),
    kutipan: b.teks("kutipan", false),
    catatan: b.teks("catatan", false),
  };
  if (r.status === "teks") {
    for (const k of ["halaman", "pemeriksa", "diperiksa"] as const) {
      if (r[k] === undefined) galat.push(`${tempat}: status 'teks' wajib punya '${k}'`);
    }
  }
  if (r.status === "belum") {
    if (r.kutipan !== undefined) {
      galat.push(`${tempat}: kutipan langsung hanya boleh bila rujukan sudah dicocokkan ke teks`);
    }
    if (r.pemeriksa !== undefined || r.diperiksa !== undefined) {
      galat.push(`${tempat}: rujukan berstatus 'belum' tidak boleh punya pemeriksa atau tanggal`);
    }
  }
  if (r.kutipan !== undefined && hitungKata(r.kutipan) > BATAS_KATA_KUTIPAN) {
    galat.push(`${tempat}: kutipan lebih dari ${BATAS_KATA_KUTIPAN} kata`);
  }
  if (galat.length > 0) return { galat };
  return { nilai: buangKosong(r) as unknown as Rujukan, galat };
}

function buangKosong(o: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined));
}
