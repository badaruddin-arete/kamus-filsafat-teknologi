/**
 * Bentuk data kamus.
 *
 * Satu entri adalah satu keputusan penerjemahan: istilah asing, padanan
 * Indonesia yang dipilih, padanan yang ditolak beserta alasannya, dan apa
 * yang hilang dalam perpindahan itu. Setiap entri wajib bersandar pada
 * sedikitnya satu sumber di daftar pustaka.
 */

/** Bahasa asal istilah yang dikenali kamus. */
export const BAHASA = {
  de: "Jerman",
  en: "Inggris",
  fr: "Prancis",
  el: "Yunani",
  la: "Latin",
} as const;

export type KodeBahasa = keyof typeof BAHASA;

/**
 * Status data pustaka.
 * - `belum`: data buku ditulis dari ingatan penyusun dan belum dicocokkan.
 * - `katalog`: judul, tahun, penerbit, dan ISBN atau DOI sudah dicocokkan ke
 *   halaman penerbit atau katalog resmi, dengan tautan bukti dan tanggal.
 */
export const STATUS_SUMBER = ["belum", "katalog"] as const;
export type StatusSumber = typeof STATUS_SUMBER[number];

/**
 * Status satu rujukan di dalam entri.
 * - `belum`: isi entri belum dicocokkan ke teks sumber.
 * - `teks`: seseorang sudah membuka teks sumber dan mencocokkan halamannya.
 */
export const STATUS_RUJUKAN = ["belum", "teks"] as const;
export type StatusRujukan = typeof STATUS_RUJUKAN[number];

/**
 * Status pemeriksaan padanan di KBBI daring resmi (kbbi.kemdikbud.go.id).
 * - `belum`: belum diperiksa.
 * - `ada`: padanan tercatat sebagai lema atau sublema.
 * - `tidak-ada`: padanan tidak tercatat; kamus ini mengusulkannya.
 */
export const STATUS_KBBI = ["belum", "ada", "tidak-ada"] as const;
export type StatusKbbi = typeof STATUS_KBBI[number];

export const JENIS_SUMBER = ["buku", "artikel", "bab"] as const;
export type JenisSumber = typeof JENIS_SUMBER[number];

export interface Sumber {
  kunci: string;
  penulis: string[];
  tahun: number;
  judul: string;
  jenis: JenisSumber;
  /** Bahasa terbitan yang dirujuk, bukan selalu bahasa asli karya. */
  bahasa: KodeBahasa;
  penerjemah?: string[];
  /** Nama jurnal (artikel) atau judul buku kumpulan (bab). */
  wadah?: string;
  penyunting?: string[];
  jilid?: string;
  nomor?: string;
  halaman?: string;
  penerbit?: string;
  kota?: string;
  isbn?: string;
  doi?: string;
  /** Tahun terbit pertama bila yang dirujuk adalah terjemahan atau edisi baru. */
  terbit_asli?: number;
  status: StatusSumber;
  /** Tautan halaman penerbit atau katalog yang dipakai untuk mencocokkan. */
  bukti?: string;
  diperiksa?: string;
  catatan?: string;
}

export interface Rujukan {
  sumber: string;
  halaman?: string;
  status: StatusRujukan;
  pemeriksa?: string;
  diperiksa?: string;
  /** Kutipan langsung. Hanya boleh bila status `teks`, paling banyak 40 kata. */
  kutipan?: string;
  catatan?: string;
}

export interface Ditolak {
  padanan: string;
  alasan: string;
}

export interface Kbbi {
  lema: string;
  status: StatusKbbi;
  diperiksa?: string;
}

export interface Entri {
  id: string;
  istilah: string;
  asal: { istilah: string; bahasa: KodeBahasa };
  definisi: string;
  alasan: string;
  yang_hilang: string;
  ditolak: Ditolak[];
  terkait: string[];
  rujukan: Rujukan[];
  kbbi: Kbbi;
}

/** Tingkat keterandalan entri, diturunkan dari rujukan dan sumbernya. */
export type Tingkat = "terverifikasi" | "sebagian" | "belum";

export const BATAS_KATA_KUTIPAN = 40;
