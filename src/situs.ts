/**
 * Pembuat situs statis. Satu berkas index.html tanpa kerangka kerja luar:
 * pencarian memakai JavaScript biasa di peramban, dan tanpa JavaScript pun
 * semua entri tetap terbaca karena sudah ada di halaman.
 */

import { tingkatEntri, urutAbjad } from "./korpus.ts";
import type { Korpus } from "./korpus.ts";
import { BAHASA, type Entri, type Sumber, type Tingkat } from "./jenis.ts";
import { normal } from "./cari.ts";

export function lolos(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const LABEL: Record<Tingkat, string> = {
  terverifikasi: "Terverifikasi",
  sebagian: "Sebagian terverifikasi",
  belum: "Belum terverifikasi",
};

function rujukanHtml(e: Entri, peta: Map<string, Sumber>): string {
  const item = e.rujukan.map((r) => {
    const s = peta.get(r.sumber)!;
    const hlm = r.halaman ? `, hlm. ${lolos(r.halaman)}` : "";
    const isi = r.status === "teks" ? "isi dicocokkan ke teks" : "isi belum dicocokkan ke teks";
    const buku = s.status === "katalog" ? "data buku cocok katalog" : "data buku belum dicocokkan";
    return `<li>${lolos(s.penulis.join(" dan "))} (${s.tahun}), <i>${lolos(s.judul)}</i>${hlm}. ` +
      `<span class="ket">${isi}; ${buku}.</span></li>`;
  });
  return `<ul>${item.join("")}</ul>`;
}

export function entriHtml(e: Entri, pustaka: Sumber[]): string {
  const peta = new Map(pustaka.map((s) => [s.kunci, s]));
  const tingkat = tingkatEntri(e, pustaka);
  const kunciCari = normal(
    [e.istilah, e.asal.istilah, e.id, ...e.ditolak.map((d) => d.padanan)].join(" "),
  );
  const tolak = e.ditolak.length === 0
    ? ""
    : `<h4>Padanan yang ditolak</h4><ul>${
      e.ditolak.map((d) => `<li><b>${lolos(d.padanan)}</b>: ${lolos(d.alasan)}</li>`).join("")
    }</ul>`;
  const terkait = e.terkait.length === 0
    ? ""
    : `<p class="terkait">Lihat juga: ${
      e.terkait.map((t) => `<a href="#${lolos(t)}">${lolos(t)}</a>`).join(", ")
    }</p>`;
  return `<article id="${lolos(e.id)}" data-cari="${lolos(kunciCari)}">
<h3>${lolos(e.istilah)} <span class="asal">${lolos(e.asal.istilah)} (${
    BAHASA[e.asal.bahasa]
  })</span></h3>
<p><span class="lencana ${tingkat}">${LABEL[tingkat]}</span></p>
<p>${lolos(e.definisi)}</p>
<h4>Mengapa padanan ini</h4><p>${lolos(e.alasan)}</p>
<h4>Yang hilang dalam peralihan</h4><p>${lolos(e.yang_hilang)}</p>
${tolak}${terkait}
<h4>Rujukan</h4>${rujukanHtml(e, peta)}
<p class="ket">KBBI daring: lema &ldquo;${lolos(e.kbbi.lema)}&rdquo;, ${
    e.kbbi.status === "belum"
      ? "belum diperiksa"
      : e.kbbi.status === "ada"
      ? "tercatat"
      : "tidak tercatat"
  }.</p>
</article>`;
}

const GAYA =
  `:root{color-scheme:light dark;--lat:#fbfaf7;--tek:#1d1d1b;--pel:#6b6a64;--gar:#d9d6cc;--aks:#7a3b1d;--ok:#2f6b3a;--sedang:#8a6a12;--buruk:#9b2c2c}
@media (prefers-color-scheme:dark){:root{--lat:#171716;--tek:#ecebe6;--pel:#a3a198;--gar:#33322e;--aks:#e0a27c;--ok:#7fc58b;--sedang:#e0c067;--buruk:#f08a8a}}
*{box-sizing:border-box}body{margin:0;background:var(--lat);color:var(--tek);font:17px/1.6 Georgia,"Times New Roman",serif}
main{max-width:46rem;margin:0 auto;padding:1.5rem 1rem 4rem}
h1{font-size:1.8rem;margin:.2rem 0}h3{margin:0 0 .3rem;font-size:1.3rem}h4{margin:1rem 0 .1rem;font-size:.85rem;text-transform:uppercase;letter-spacing:.05em;color:var(--pel)}
a{color:var(--aks)}input{width:100%;padding:.7rem .8rem;font:inherit;border:1px solid var(--gar);border-radius:6px;background:transparent;color:inherit}
article{border-top:1px solid var(--gar);padding:1.2rem 0}.asal{font-size:.9rem;color:var(--pel);font-weight:normal;font-style:italic}
.ket{font-size:.85rem;color:var(--pel)}.lencana{font:600 .75rem system-ui,sans-serif;padding:.15rem .5rem;border-radius:99px;border:1px solid currentColor}
.terverifikasi{color:var(--ok)}.sebagian{color:var(--sedang)}.belum{color:var(--buruk)}
.catatan{border:1px solid var(--gar);border-left:4px solid var(--buruk);padding:.6rem .9rem;margin:1rem 0;font-size:.95rem}
nav{display:flex;flex-wrap:wrap;gap:.2rem .8rem}nav a{font-size:.9rem;white-space:nowrap}footer{margin-top:2rem;font-size:.85rem;color:var(--pel)}p,li{overflow-wrap:anywhere}`;

const SKRIP =
  `const q=document.getElementById('q'),a=[...document.querySelectorAll('article')],h=document.getElementById('hasil');
const n=s=>s.normalize('NFD').replace(/\\p{M}/gu,'').toLowerCase();
q.addEventListener('input',()=>{const k=n(q.value.trim());let c=0;for(const e of a){const t=k===''||e.dataset.cari.includes(k);e.hidden=!t;if(t)c++}h.textContent=k===''?'':c+' entri cocok'});`;

export function susunSitus({ entri, pustaka }: Korpus, tanggal: string): string {
  const urut = urutAbjad(entri);
  const t = { terverifikasi: 0, sebagian: 0, belum: 0 };
  for (const e of entri) t[tingkatEntri(e, pustaka)]++;
  return `<!doctype html>
<html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Kamus Filsafat Teknologi</title>
<meta name="description" content="Istilah filsafat teknologi dalam bahasa Indonesia: padanan, alasan, apa yang hilang, dan status verifikasi tiap rujukan.">
<style>${GAYA}</style></head><body><main>
<h1>Kamus Filsafat Teknologi</h1>
<p>${entri.length} istilah dengan padanan Indonesia, alasan pemilihannya, dan apa yang hilang dalam peralihan bahasa.</p>
<div class="catatan"><b>Baca ini dulu.</b> Dari ${entri.length} entri, ${t.terverifikasi} yang rujukannya sudah dicocokkan ke teks sumber dan katalog.
Sisanya disusun dari pemahaman penyusun dan bantuan AI, dan setiap entri menampilkan statusnya. Jangan mengutip entri berstatus &ldquo;belum&rdquo; seolah sudah diperiksa.
Padanan yang ditandai &ldquo;usulan kamus&rdquo; bukan padanan baku.</div>
<input id="q" type="search" placeholder="Cari istilah Indonesia atau istilah asal" aria-label="Cari istilah"><p class="ket" id="hasil" aria-live="polite"></p>
<nav>${urut.map((e) => `<a href="#${lolos(e.id)}">${lolos(e.istilah)}</a>`).join("")}</nav>
${urut.map((e) => entriHtml(e, pustaka)).join("\n")}
<footer>Dibuat ${
    lolos(tanggal)
  }. Lisensi: All rights reserved; boleh dibaca dan dipelajari, tidak boleh disalin tanpa izin.</footer>
</main><script>${SKRIP}</script></body></html>
`;
}
