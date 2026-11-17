# Automotive Electrical 3D Bench — Design Specification

## 1. Tujuan & Konsep Utama
- Simulator 3D interaktif kelistrikan bodi otomotif bergaya **Robotics Bench** yang berjalan di **Web Browser** dan **Windows Desktop App** (standalone window via `run-webview-app.bat` dan `run-browser.bat`).
- Menggabungkan papan trainer 3D yang bisa diputar kameranya (**360° Orbit Controls** via Three.js / WebGL) dengan mekanik fisik perangkaian kabel nyata:
  - Pengambilan kabel dari **Rak Penyimpanan Kabel (Wire Storage Rack)**.
  - **Aki Accu 12V** terpisah di bagian bawah trainer yang dihubungkan menggunakan **Kabel Jepit Buaya Merah (+)** dan **Hitam (-)**.
  - Batas panjang fisik kabel (**20 cm**, **25 cm**, **30 cm**, **50 cm**).
  - Penumpukan konektor banana plug (**Stackable Banana Plug**) pada satu terminal pin apabila jarak melebihi panjang kabel atau saat melakukan percabangan arus.
- Seluruh ikon antarmuka wajib menggunakan **SVG murni** (tanpa karakter emoji Unicode).

## 2. Kurikulum Modul di Bilah Kiri (Sidebar Roadmap)
- **MODUL 1 · DASAR KELISTRIKAN OTOMOTIF**
  - **Fig. 01 — Rangkaian Sekring (Fuse) & Beban Tunggal:** Memahami aliran arus Aki 12V, Kunci Kontak (`B-IG`), Sekring pengaman (`F1`), Saklar Tekan, dan Lampu Uji 12V, serta proteksi hubung singkat (*short circuit*).
  - **Fig. 02 — Rangkaian Relay 4-Kaki (`30-85-86-87`) & Klakson:** Memahami rangkaian pengendali (*coil* `85-86`) melalui tombol klakson dan rangkaian beban arus besar (`30-87`) untuk membunyikan Klakson.
- **MODUL 2 · SISTEM PENERANGAN & TANDA**
  - **Fig. 03 — Lampu Kota (Tail/Clearance) & Lampu Rem (Brake Switch):** Merangkai lampu senja depan/belakang dan saklar pedal rem (`SW-BRAKE`).
  - **Fig. 04 — Lampu Kepala Jauh/Dekat (Headlamp Low/High Beam + Dual Relay):** Merangkai saklar kombinasi *Dimmer* (`OFF-TAIL-HEAD`, `LOW-HIGH`) dengan 2 Relay (`RLY-LOW`, `RLY-HIGH`) dan lampu utama kiri-kanan (`HL-L`, `HL-R`).
  - **Fig. 05 — Sistem Lampu Sein (Turn Signal) & Hazard (Flasher `B-L-E`):** Merangkai unit *Flasher* kedip otomatis (`B`, `L`, `E`) dengan saklar sein (`L-OFF-R`), saklar darurat *Hazard*, dan 4 lampu sein.
- **MODUL 3 · MASTER TRAINER (FULL STAND)**
  - **Fig. 06 — Full Automotive Body Electrical Trainer (Semua Part Terpasang):** Seluruh komponen kelistrikan bodi terpasang lengkap di atas satu papan trainer besar (Kunci Kontak `B-ACC-IG-ST`, Blok Fuse 6-jalur `F1..F6`, 4x Relay `30-85-86-87`, Flasher `B-L-E`, Saklar Kombinasi Lengkap, Saklar Rem, Saklar Klakson, Saklar Hazard, 2x Klakson, Lampu Depan Kiri/Kanan Low-High, Lampu Sein Depan-Belakang Kiri/Kanan, Lampu Kota, Lampu Rem, dan Lampu Indikator Dashboard). Siswa bebas merangkai seluruh sistem kelistrikan mobil sekaligus.

## 3. Mekanik 3D & Interaksi Kabel
1. **Kamera 3D & Kontrol Visual:**
   - Klik kanan / *drag* ruang kosong untuk memutar kamera 3D (*Orbit*), *scroll* untuk *Zoom*, klik tengah/Shift+drag untuk *Pan*, dan tombol cepat preset kamera (`Tampak Depan`, `Isometrik`, `Fokus Aki & Rak`).
   - Efek visual *3D Toon / Hand-Inked Edge Outline* lengkap dengan slider **Hand-Drawn Wobble**, pilihan warna papan trainer (`#f4efe6` Cream, `#d8e2dc` Sage, `#1d242b` Dark Slate, `#e9edc9` Warm Olive), dan toggle **Labels On/Off**.
   - Tombol aksi papan atas: `Lepas Semua Kabel`, `Rangkai Otomatis (Demo)`, `Ganti Sekring Putus`, dan `Exploded View`.
2. **Aki 12V Terpisah & Rak Penyimpanan Kabel:**
   - **Aki Accu 12V** berada di rak bawah meja trainer dengan kutub positif (`BAT+`) dan negatif (`BAT-`).
   - **Rak Kabel (Wire Storage):** Menampilkan pilihan kabel aktif yang sedang dipegang pengguna:
     - `Jepit Buaya Merah (+)` (khusus menghubungkan `BAT+` ke terminal `IN+` papan, maks 60 cm)
     - `Jepit Buaya Hitam (-)` (khusus menghubungkan `BAT-` ke terminal `GND` papan, maks 60 cm)
     - `Jumper 20 cm` (Merah / Hitam)
     - `Jumper 25 cm` (Merah / Hitam)
     - `Jumper 30 cm` (Merah / Hitam)
     - `Jumper 50 cm` (Merah / Hitam)
3. **Fisika Panjang Kabel & Stackable Banana Plug (Tumpuk Pin):**
   - Koordinat 3D papan dikonversi ke skala fisik **cm** ($1\text{ unit 3D} = 2.5\text{ cm}$).
   - Saat pengguna mengklik Pin X lalu mengarahkan kursor ke Pin Y, sistem menghitung jarak Euclidean 3D dalam **cm** dan menampilkan badge jarak secara *real-time* (misal `24.5 cm / 25 cm`).
   - Jika jarak $> \text{panjang kabel yang dipilih}$, garis pratinjau kabel berubah merah dengan pesan peringatan `"Kabel 20 cm kurang panjang (Jarak: 32 cm) — Tumpuk pada pin perantara atau pilih kabel lebih panjang"` dan koneksi ditolak.
   - Setiap pin dapat menerima beberapa colokan banana plug sekaligus (*stacking*). Setiap plug tambahan pada pin yang sama dirender menumpuk ke atas sepanjang sumbu normal pin (`stackIndex * 0.28` unit 3D) sehingga tampak jelas secara 3D.
4. **Simulasi Mesin Listrik, Suara, & Instruksi Wiring:**
   - Solver graf kelistrikan DC 12V *real-time* (60 Hz / setiap perubahan state):
     - Melacak propagasi potensial `+12V` dari `BAT+` dan `0V (GND)` dari `BAT-` melewati kabel, sekring, kontak saklar, dan kontak relay (`30-87`).
     - Mendeteksi *Short Circuit* (jalur resistansi nol dari `+12V` ke `GND` melalui sekring atau langsung di aki): sekring langsung putus (*blown fuse*) dengan efek partikel percikan api 3D, kepulan asap, dan suara letupan.
     - Menghitung aktivasi kumparan Relay (`85` dan `86` memiliki beda potensial 12V) yang menarik kontak `30-87` dan membunyikan klik mekanis.
     - Menghitung osilasi *Flasher* (`B` mendapat +12V, `E` terhubung ke GND, dan `L` terhubung ke beban lampu $\rightarrow$ berkedip 85 kali/menit dengan bunyi *tik-tak*).
   - Panel bawah menampilkan tab **Meet the Board (Penjelasan & Skema)** dan **Wiring Checklist (Panduan Langkah Demi Langkah)** yang otomatis tercentang saat hubungan pin terpenuhi.
