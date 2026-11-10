import { assert, assertEquals, assertFalse } from "@std/assert";
import {
  doiSah,
  hitungKata,
  isbn10Sah,
  isbn13Sah,
  isbnSah,
  rapikanIsbn,
  tanggalSah,
} from "../src/nomor.ts";

Deno.test("rapikanIsbn membuang tanda hubung dan spasi", () => {
  assertEquals(rapikanIsbn("978-0-306-40615-7"), "9780306406157");
  assertEquals(rapikanIsbn("0 306 40615 2"), "0306406152");
  assertEquals(rapikanIsbn("0-8044-2957-x"), "080442957X");
});

Deno.test("ISBN-10 dengan angka periksa benar diterima", () => {
  // Contoh baku dari pedoman ISBN.
  assert(isbn10Sah("0-306-40615-2"));
  // Angka periksa X bernilai 10.
  assert(isbn10Sah("0-8044-2957-X"));
});

Deno.test("ISBN-10 dengan satu angka salah ketik ditolak", () => {
  assertFalse(isbn10Sah("0-306-40615-3"));
  assertFalse(isbn10Sah("0-306-40651-2")); // dua angka tertukar
  assertFalse(isbn10Sah("030640615")); // kurang satu angka
});

Deno.test("ISBN-13 dengan angka periksa benar diterima", () => {
  assert(isbn13Sah("978-0-306-40615-7"));
});

Deno.test("ISBN-13 salah ketik atau tanpa awalan 978/979 ditolak", () => {
  assertFalse(isbn13Sah("978-0-306-40615-8"));
  assertFalse(isbn13Sah("977-0-306-40615-7"));
});

Deno.test("isbnSah memilih aturan menurut panjang", () => {
  assert(isbnSah("0306406152"));
  assert(isbnSah("9780306406157"));
  assertFalse(isbnSah("12345"));
});

Deno.test("DOI harus berawalan 10. dan punya garis miring", () => {
  assert(doiSah("10.2307/20024652"));
  assert(doiSah("10.1007/978-94-007-0767-1"));
  assertFalse(doiSah("doi:10.2307/20024652"));
  assertFalse(doiSah("10.23/abc"));
  assertFalse(doiSah("10.2307"));
});

Deno.test("tanggal harus ada di kalender", () => {
  assert(tanggalSah("2026-11-10"));
  assert(tanggalSah("2024-02-29"));
  assertFalse(tanggalSah("2026-02-29"));
  assertFalse(tanggalSah("2026-13-01"));
  assertFalse(tanggalSah("10-11-2026"));
});

Deno.test("hitungKata mengabaikan spasi berlebih", () => {
  assertEquals(hitungKata("  satu  dua\ntiga "), 3);
  assertEquals(hitungKata(""), 0);
});
