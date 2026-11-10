# Kamus Filsafat Teknologi: padanan Indonesia yang bisa dipertanggungjawabkan

![tests](https://github.com/badaruddin-arete/kamus-filsafat-teknologi/actions/workflows/tests.yml/badge.svg)

Bisakah istilah filsafat teknologi dialihkan ke bahasa Indonesia tanpa kehilangan maknanya? Dan
kalau ada yang hilang, siapa yang menanggungnya?

Kamus ini memuat 30 istilah, dari _Gestell_ (Heidegger) sampai _device paradigm_ (Borgmann) dan
_affordance_ (Gibson). Setiap entri mencatat padanan yang dipilih, **alasannya**, padanan lain yang
**ditolak**, dan **apa yang hilang** dalam peralihan. Setiap rujukan membawa status verifikasinya,
dan program pemeriksa menolak entri yang tidak punya sumber.

Keadaan terkini, dihitung oleh program: [docs/laporan.md](docs/laporan.md).

## Peringatan lebih dulu

**Belum satu pun entri berstatus terverifikasi.** Semua entri disusun dari pemahaman penyusun dan
bantuan AI atas literatur yang sudah dikenal, dan belum satu rujukan pun dicocokkan ke teks sumber
atau nomor halamannya. Data buku baru dicocokkan sebagian: 7 dari 23 sumber dicocokkan ke halaman
penerbit atau katalog pada 2026-11-10 (tiap catatan menyebut apa yang diperiksa), dan sisanya belum.
Padanan di KBBI VI Daring baru diperiksa untuk 6 dari 30 entri (oleh Badar, 2026-11-10). Entri yang
semua sumbernya sudah cocok katalog tampil "Sebagian terverifikasi": artinya bukunya benar ada
dengan data itu, bukan bahwa isi entri sudah diperiksa. Kutipan langsung dilarang oleh validator
sampai halamannya diperiksa. Mohon jangan mengutip kamus ini seolah isinya sudah diperiksa.

## Gagasan

Paul Ricoeur, dalam _Sur la traduction_ (2004), menyebut sikap penerjemah sebagai _hospitalité
langagière_, keramahan terhadap bahasa asing: menerima tamu tanpa menjinakkannya, dan mengakui bahwa
terjemahan yang sempurna tidak ada. Kamus ini mengambil sikap itu sebagai pegangan. Menerjemahkan
istilah berarti menafsirkannya, dan setiap tafsir menghilangkan sesuatu. Kehilangan itu tidak
disembunyikan, tetapi ditulis di tiap entri.

Contohnya paling jelas pada kata _perangkat_. Borgmann memakai _device_ untuk membedakannya dari
alat yang menuntut keterampilan. Kata "perangkat" dalam bahasa Indonesia berarti kurang lebih alat
perlengkapan, jadi pembedaan Borgmann tidak terbawa oleh katanya. Pembedaan itu harus dijelaskan,
dan kamus ini menjelaskannya.

## Isi satu entri

Satu berkas TOML di [entri/](entri/), misalnya [entri/perangkat.toml](entri/perangkat.toml):

| Bidang            | Isi                                                           |
| ----------------- | ------------------------------------------------------------- |
| `istilah`, `asal` | Padanan Indonesia dan istilah asli beserta bahasanya          |
| `definisi`        | Makna menurut sumber                                          |
| `alasan`          | Mengapa padanan ini dipilih                                   |
| `yang_hilang`     | Apa yang tidak terbawa dalam peralihan (wajib)                |
| `ditolak`         | Padanan lain yang dipertimbangkan, dengan alasan penolakan    |
| `terkait`         | Entri lain yang berhubungan (harus ada)                       |
| `rujukan`         | Sedikitnya satu, ke daftar pustaka, dengan status dan halaman |
| `kbbi`            | Lema KBBI daring yang diperiksa dan statusnya                 |

## Tingkat keterandalan

| Tingkat       | Artinya                                                                                                                     |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Terverifikasi | Semua rujukan dicocokkan ke teks sumber (dengan halaman, nama pemeriksa, tanggal) dan semua sumbernya dicocokkan ke katalog |
| Sebagian      | Data bukunya cocok katalog, tetapi isi entri belum dicocokkan ke teks                                                       |
| Belum         | Ada sumber yang datanya belum dicocokkan ke katalog                                                                         |

Tingkat ini dihitung dari data, tidak ditulis tangan, jadi tidak bisa dinaikkan tanpa bukti.

## Apa yang diperiksa program

`deno task cek` menolak:

- entri tanpa rujukan, tanpa alasan, atau tanpa `yang_hilang`, dan bidang yang tidak dikenal;
- rujukan ke sumber yang tidak ada di pustaka, dan sumber yang tidak dirujuk siapa pun;
- tautan "terkait" yang putus, id atau istilah ganda, dan entri yang terkait dengan dirinya sendiri;
- ISBN yang gagal angka periksa, DOI yang salah bentuk, dan tanggal yang tidak ada di kalender;
- kutipan langsung pada rujukan yang belum dicocokkan ke teks, dan kutipan lebih dari 40 kata;
- sumber berstatus `katalog` tanpa tautan bukti https, tanggal, dan ISBN atau DOI.

Pemeriksaan ini hanya menangkap salah ketik dan kelalaian. Program tidak bisa mengetahui apakah
sebuah halaman benar-benar berisi hal yang ditulis di entri.

## Keputusan desain

| Keputusan                                                                    | Alasan                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ditulis dalam TypeScript dengan Deno, tanpa kerangka kerja                   | Satu bahasa untuk validator dan situs, pengujian bawaan (`deno test`), dan tidak ada folder pustaka yang perlu dipercaya. Pustaka standar `@std` hanya dipakai untuk membaca TOML, jalur berkas, dan pernyataan uji. |
| Satu entri satu berkas TOML                                                  | Dapat dibaca dan disunting manusia, dan riwayat Git menunjukkan siapa mengubah apa.                                                                                                                                  |
| `yang_hilang` wajib                                                          | Inti kamus ini adalah mencatat kehilangan; entri yang mengaku tanpa kehilangan harus menuliskannya juga.                                                                                                             |
| Status verifikasi ada di data, bukan di kata-kata                            | Supaya program bisa menghitung dan situs bisa menampilkannya apa adanya.                                                                                                                                             |
| Dua status terpisah, data buku dan isi rujukan                               | Mencocokkan penerbit dan ISBN jauh lebih mudah daripada mencocokkan halaman. Keduanya tidak boleh dicampur.                                                                                                          |
| Kutipan langsung hanya boleh bila halaman sudah dicocokkan, maksimal 40 kata | Mencegah kutipan dari ingatan dan menjaga hak cipta.                                                                                                                                                                 |
| Angka periksa ISBN dihitung ulang                                            | Menangkap salah ketik; nomor yang lolos belum tentu milik buku yang dimaksud.                                                                                                                                        |
| Situs satu berkas HTML tanpa kerangka kerja dan tanpa skrip luar             | Berjalan di GitHub Pages, tetap terbaca tanpa JavaScript, dan bisa diperiksa seluruhnya.                                                                                                                             |
| Padanan usulan penyusun ditandai "usulan kamus"                              | Pembingkaian dan keterlepasan bukan padanan baku; pembaca berhak tahu.                                                                                                                                               |
| Entri tanpa padanan ditolak dilaporkan, bukan disembunyikan                  | Satu entri (dilema Collingridge) memang nama diri; laporan menyebutnya.                                                                                                                                              |

## Menjalankan

Butuh [Deno](https://deno.com) 2.x.

```bash
deno task cek              # periksa seluruh kamus
deno task cari kotak       # cari menurut istilah Indonesia atau asal
deno task tampil perangkat # satu entri lengkap
deno task laporan          # tulis docs/laporan.md
deno task bangun           # bangun situs statis ke _site/
deno task uji              # jalankan semua uji
```

Situs diterbitkan oleh [pages.yml](.github/workflows/pages.yml) setelah Pages diaktifkan di
Settings.

## Keterbatasan

- **Tidak ada yang terverifikasi.** Lihat Peringatan lebih dulu. Ini keterbatasan terbesar, dan
  kamus ini sengaja tampil sebagai kerja yang belum selesai, bukan referensi yang sudah selesai.
- **Rujukan tanpa halaman.** Belum ada rujukan yang menyebut halaman. Data 16 sumber lain (termasuk
  jilid dan halaman artikel, serta penerjemah) berasal dari ingatan penyusun atau dari laporan
  pemeriksaan yang belum dibuka sendiri; tiap sumber menyebut asal datanya di kolom `catatan`.
- **KBBI baru sebagian diperiksa.** Enam kata sudah dicek di KBBI VI Daring resmi
  (kbbi.kemendikdasmen.go.id) dan tiap entrinya menyimpan tautan serta tanggalnya; dua di antaranya
  (afordansi, konvivialitas) memang tidak tercatat. Sisanya belum, dan ada yang perlu dicek bukan
  hanya kata dasarnya tetapi juga frasanya. Hasil pemeriksaan KBBI datang dari tangkapan layar
  Badar; saya tidak bisa membuka situs itu dari lingkungan penyusunan.
- **Hanya 30 entri, dan satu sudut pandang.** Pilihan istilah condong ke tradisi Heidegger,
  Borgmann, dan studi sains-teknologi. Tradisi lain, termasuk pemikiran dari Asia dan Islam, belum
  tercakup.
- **Padanan adalah usulan.** Tidak ada lembaga bahasa yang menyetujuinya. Badan Bahasa punya
  glosarium resmi yang belum dicocokkan satu per satu.
- **Banyak entri bersandar pada satu sumber.** Menurut laporan, 22 dari 30 entri hanya punya satu
  sumber; pembaca yang serius perlu membuka teks aslinya.
- **Kritik terhadap sumber hanya dicatat sebagian.** Misalnya kritik Joerges atas contoh jembatan
  Winner ada, tetapi kritik lain tidak ditelusuri.
- **Program menjaga bentuk, bukan kebenaran.** Entri yang lolos validasi bisa saja keliru.

## Transparansi bantuan AI

Seluruh kode, entri, dan teks disusun bersama Claude (Anthropic) dalam sesi Claude Code. Kerangka
karya, pilihan bahasa, dan keputusan akhir ditinjau dan disetujui oleh penyusun. **Isi entri adalah
keluaran AI yang belum diperiksa terhadap sumber aslinya**, dan itulah sebabnya semuanya berstatus
belum terverifikasi. Setiap commit yang dibantu memuat baris `Co-Authored-By`.

## Lisensi

Hak cipta © 2026 badaruddin-arete. All rights reserved. Kode dan isi boleh dibaca dan dipelajari,
tetapi tidak boleh disalin, diubah, atau disebarkan tanpa izin tertulis. Lihat [LICENSE](LICENSE).
