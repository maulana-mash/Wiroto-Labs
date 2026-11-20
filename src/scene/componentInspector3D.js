import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export const INSPECTOR_COMPONENTS = [
  {
    id: 'headlamp',
    category: 'bodi',
    title: 'Lampu Kepala (Headlamp H4)',
    subtitle: 'Unit Lampu Utama Kotak Lensa Kaca Beralur & Soket H4 3-Pin',
    dimensions: {
      width: '≈ 200 mm',
      height: '≈ 140 mm',
      depth: '≈ 120 mm',
      spec: 'Bohlam Halogen H4 12V 60/55W (High / Low Beam)',
    },
    pills: [
      'Lensa kaca beralur (Fluted Lens)',
      'Reflector bowl parabola',
      'Bohlam H4 12V 60/55W',
      'Tudung anti-silau (Glare Shield)',
      'Soket H4 3-Pin',
      'Housing belakang berusuk',
      '4 Mounting tabs (Telinga baut)',
      'Sekrup penyetel arah sinar',
    ],
    pins: [
      { code: 'LO (56b)', color: 'Kuning', desc: 'Input filamen Lampu Dekat (Low Beam 55W) dari pin 87 Relay Low.' },
      { code: 'HI (56a)', color: 'Biru', desc: 'Input filamen Lampu Jauh (High Beam 60W) dari pin 87 Relay High.' },
      { code: 'GND (31)', color: 'Hitam', desc: 'Terminal massa bersama (Common Ground) menuju rangka/negatif Aki.' },
    ],
    guideSteps: [
      'Hubungkan terminal keluaran Sekring ke pin 30 masing-masing Relay (Relay Low & Relay High).',
      'Hubungkan Saklar Kombinasi Dimmer (LOW & HIGH) ke pin pengendali 85 Relay, dan pin 86 ke Ground (GND).',
      'Hubungkan pin beban 87 Relay Low ke terminal LO (Kuning) Headlamp Kiri & Kanan secara paralel.',
      'Hubungkan pin beban 87 Relay High ke terminal HI (Biru) Headlamp Kiri & Kanan, lalu hubungkan GND ke massa.',
    ],
    usageNote:
      'Lampu kepala H4 memiliki dua filamen dalam satu kapsul kaca. Filamen Low Beam dilengkapi tudung penahan (glare shield) di bagian bawah agar pantulan reflektor mengarah ke bawah dan tidak menyilaukan pengendara dari arah berlawanan.',
  },
  {
    id: 'taillamp',
    category: 'bodi',
    title: 'Lampu Sein / Kota / Rem (Tail Lamp)',
    subtitle: 'Rakitan Lampu Kombinasi Belakang 3-Ruang (Amber · Merah · Putih)',
    dimensions: {
      width: '≈ 340 mm',
      height: '≈ 95 mm',
      depth: '≈ 70 mm',
      spec: 'Bohlam Ganda BAY15d 12V 21/5W (Stop/Tail) & BA15s 12V 21W (Sein & Mundur)',
    },
    pills: [
      'Lensa Sein (Amber beralur)',
      'Lensa Kota & Rem (Merah beralur)',
      'Lensa Mundur (Putih bening)',
      'Reflektor 3 kompartemen',
      'Bohlam ganda 21/5W',
      '4 Sekrup pembatas lensa',
      '3 Soket karet belakang',
      'Baut dudukan M6',
    ],
    pins: [
      { code: 'SIGN', color: 'Kuning', desc: 'Input positif Lampu Sein (21W) dari saklar sein kiri/kanan.' },
      { code: 'TAIL (58)', color: 'Merah', desc: 'Input positif Lampu Kota/Senja (filamen 5W) dari saklar lampu kepala.' },
      { code: 'STOP (54)', color: 'Merah', desc: 'Input positif Lampu Rem (filamen 21W) dari saklar pedal rem.' },
      { code: 'REV', color: 'Putih', desc: 'Input positif Lampu Mundur (21W) dari saklar transmisi mundur.' },
      { code: 'GND (31)', color: 'Hitam', desc: 'Terminal massa bersama seluruh dudukan bohlam belakang.' },
    ],
    guideSteps: [
      'Pastikan terminal GND (31) unit lampu kombinasi belakang kiri dan kanan terhubung ke bus Ground (Massa).',
      'Hubungkan keluaran Saklar Lampu Kota ke terminal TAIL untuk menyalakan lampu senja belakang (nyala redup 5W).',
      'Hubungkan keluaran Saklar Rem (Brake Switch) ke terminal STOP untuk menyalakan lampu rem (nyala terang 21W).',
      'Hubungkan keluaran Saklar Sein Kiri/Kanan ke terminal SIGN masing-masing sisi.',
    ],
    usageNote:
      'Ruang tengah (lensa merah) menggunakan bohlam dua filamen (12V 21/5W) dengan dua titik kontak di bagian dasar dan kaki bayonet tidak sejajar agar pemasangan tidak terbalik antara lampu kota (5W) dan lampu rem (21W).',
  },
  {
    id: 'horn',
    category: 'bodi',
    title: 'Klakson Keong (Snail Horn 12V)',
    subtitle: 'Unit Klakson Elektromagnetik Corong Spiral Akustik 12V 410Hz',
    dimensions: {
      width: '≈ 90 mm',
      height: '≈ 85 mm',
      depth: '≈ 75 mm',
      spec: 'Tegangan 12V DC · Frekuensi Dasar 410 Hz (Low Tone) · Arus ~3.5A–4.5A',
    },
    pills: [
      'Rumah keong akustik (Snail shell)',
      'Corong resonator bawah-kiri',
      'Membran baja (Diaphragm)',
      'Kumparan elektromagnetik',
      'Braket penyangga berlubang',
      'Pelat spesifikasi 12V 410Hz',
      '2 Terminal Spade (H+ & H-)',
      'Sekrup kalibrasi nada',
    ],
    pins: [
      { code: 'H+ (87)', color: 'Merah', desc: 'Input arus positif +12V dari terminal 87 Relay Klakson.' },
      { code: 'H- (31)', color: 'Hitam', desc: 'Terminal negatif menuju Ground (Massa Bodi) atau pengendali negatif.' },
    ],
    guideSteps: [
      'Hubungkan keluaran Sekring F1 ke terminal 30 Relay Klakson untuk menyuplai jalur arus beban.',
      'Hubungkan tombol klakson (Horn Switch) ke terminal 85 Relay, dan terminal 86 Relay ke Ground.',
      'Hubungkan terminal 87 Relay Klakson ke pin H+ pada Klakson Keong.',
      'Hubungkan pin H- Klakson Keong ke Ground (GND), lalu tekan Horn Switch untuk menguji bunyi klakson.',
    ],
    usageNote:
      'Di dalam rumah klakson terdapat kumparan magnet listrik dan kontak pemutus (breaker point). Saat arus mengalir, elektromagnet menarik membran baja lalu memutus arus sesaat secara berulang hingga 410 kali per detik (410 Hz).',
  },
  {
    id: 'comboswitch',
    category: 'bodi',
    title: 'Switch Universal (Combination Switch)',
    subtitle: 'Saklar Kombinasi Kolom Kemudi Dua Tuas (Lampu Kepala, Dimmer, Sein, Hazard & Wiper)',
    dimensions: {
      width: '≈ 450 – 480 mm',
      height: '≈ 110 mm',
      depth: '≈ 95 mm',
      spec: 'Unit Saklar Kolom Kemudi Terpadu + Konektor Multi-Pin Nilon 10-Jalur',
    },
    pills: [
      'Bodi tengah kolom kemudi',
      'Lubang poros kemudi (Shaft bore)',
      'Pelat kontak seng/logam',
      'Tuas Kanan (Lampu, Dimmer & Sein)',
      'Tuas Kiri (Wiper & Washer)',
      'Tombol Hazard merah di atas',
      'Karet pelindung poros (Boot)',
      'Konektor kabel putih 10-pin',
    ],
    pins: [
      { code: 'B (+12V)', color: 'Merah', desc: 'Input tegangan +12V untuk saklar lampu kepala & dimmer.' },
      { code: 'LOW (56b)', color: 'Kuning', desc: 'Output pengendali posisi Lampu Dekat menuju pin 85 Relay Low.' },
      { code: 'HIGH (56a)', color: 'Biru', desc: 'Output pengendali posisi Lampu Jauh menuju pin 85 Relay High.' },
      { code: '49a (L)', color: 'Kuning', desc: 'Input sinyal kedip dari terminal L Flasher menuju tuas sein.' },
      { code: 'LH', color: 'Kuning', desc: 'Output lampu sein sisi Kiri (depan, belakang, dan indikator).' },
      { code: 'RH', color: 'Kuning', desc: 'Output lampu sein sisi Kanan (depan, belakang, dan indikator).' },
    ],
    guideSteps: [
      'Pada papan trainer, kedua tuas saklar kombinasi terintegrasi pada satu blok di bagian dek bawah.',
      'Hubungkan pin B saklar dimmer ke sumber +12V (setelah sekring), lalu LOW ke Relay Low (85) dan HIGH ke Relay High (85).',
      'Hubungkan pin L (49a) dari Flasher ke pin 49a saklar sein (dan ke pin 49a saklar Hazard).',
      'Hubungkan pin keluaran LH dan RH ke lampu sein kiri dan kanan pada bagian depan maupun belakang papan.',
    ],
    usageNote:
      'Pada kendaraan asli maupun trainer SMK standar, saklar dimmer lampu kepala, saklar sein kiri/kanan, saklar hazard, dan saklar wiper berada dalam satu rakitan utuh yang mengapit poros batang kemudi.',
  },
  {
    id: 'relayflasher',
    category: 'bodi',
    title: 'Relay 4-Kaki & Flasher (B-L-E)',
    subtitle: 'Komponen Pengendali Elektromagnetik (30-85-86-87) & Unit Pengedip Sein',
    dimensions: {
      width: '≈ 28 × 28 mm (per unit)',
      height: '≈ 40 mm (dengan soket)',
      depth: '≈ 35 mm',
      spec: 'Relay Otomotif 12V DC 40A SPST-NO · Flasher Elektronik 12V 85 Kedipan/Menit',
    },
    pills: [
      'Kumparan Relay (Pin 85 & 86)',
      'Kontak Platina NO (Pin 30 & 87)',
      'Soket Relay kuning',
      'Braket gantung logam',
      'Unit Flasher biru (B-L-E)',
      'Rangkaian osilator pengedip',
      'Indikator LED status aktif',
    ],
    pins: [
      { code: '30', color: 'Merah', desc: 'Input arus beban utama langsung dari keluaran Sekring (+12V).' },
      { code: '85', color: 'Kuning', desc: 'Input arus pengendali kumparan elektromagnet dari saklar kemudi.' },
      { code: '86', color: 'Hitam', desc: 'Output kumparan elektromagnet menuju Ground (Massa 31).' },
      { code: '87', color: 'Merah', desc: 'Output arus beban menuju komponen utama (Headlamp / Klakson).' },
      { code: 'B · L · E', color: 'Merah/Kuning/Hitam', desc: 'Terminal Flasher: B (+12V Masuk), L (Kedip ke Saklar Sein), E (Ground).' },
    ],
    guideSteps: [
      'Ingat aturan emas Relay 4-kaki: pasangan pin 85–86 adalah Kumparan Pengendali (arus kecil), sedangkan 30–87 adalah Kontak Saklar Beban (arus besar).',
      'Jangan pernah menghubungkan pin 30 langsung ke Ground karena akan memutus sekring saat relay bekerja.',
      'Pada Flasher, pastikan pin E terhubung ke Ground agar rangkaian osilator pengedip dapat bekerja saat saklar sein diaktifkan.',
    ],
    usageNote:
      'Penggunaan relay memperpendek jalur kabel berarus besar dari aki ke beban (lampu kepala/klakson) sehingga meminimalkan rugi tegangan (voltage drop) dan menjaga nyala lampu tetap terang maksimal.',
  },
  // ==========================================================================
  // KATEGORI SISTEM AC MOBIL (8 KOMPONEN DARI 3D REFERENSI)
  // ==========================================================================
  {
    id: 'ac_compressor',
    category: 'ac',
    title: 'Kompresor AC & Magnetic Clutch',
    subtitle: 'Pompa Refrigeran R134a Tipe Swash-Plate dengan Kopling Elektromagnetik 12V',
    dimensions: {
      width: '≈ 145 mm',
      height: '≈ 170 mm',
      depth: '≈ 215 mm',
      spec: 'Koil Magnetic Clutch 12V DC (~3.2–4.0 Ohm) · Tekanan Kerja High 180–250 psi',
    },
    pills: [
      'Housing aluminium cor bersirip',
      'Pulley beralur multi-rib (6-PK)',
      'Magnetic Clutch Plate & Hub',
      'Manifold atas (Suction & Discharge)',
      'Konektor koil magnet 12V',
      '4 Kaki dudukan baut kompresor',
    ],
    pins: [
      { code: 'CLU (+)', color: 'Merah', desc: 'Input +12V dari terminal 87 Relay Magnetic Clutch ke kumparan stator kopling.' },
      { code: 'CLU (-)', color: 'Hitam', desc: 'Ground massa bodi kompresor menuju terminal 31 (negatif Aki).' },
      { code: 'S (Suction)', color: 'Biru', desc: 'Port masuk refrigeran gas bertekanan rendah & bersuhu rendah dari Evaporator.' },
      { code: 'D (Discharge)', color: 'Merah', desc: 'Port keluar refrigeran gas bertekanan tinggi & bersuhu tinggi menuju Kondensor.' },
    ],
    guideSteps: [
      'Ukur resistansi koil magnetic clutch menggunakan Multimeter (mode OHM): normal berkisar 3.2 hingga 4.2 Ohm.',
      'Pastikan jalur pengaman seri (Saklar Blower -> Saklar A/C -> Thermostat -> Pressure Switch) memberi sinyal ke Relay Clutch (pin 85).',
      'Saat relay aktif, pelat kopling depan tertarik menempel pada pulley sehingga poros kompresor ikut berputar.',
    ],
    usageNote:
      'Pulley kompresor selalu berputar mengikuti sabuk V-belt selama mesin hidup. Poros kompresor baru ikut berputar ketika kumparan magnetic clutch dialiri arus 12V sehingga gaya magnet menarik pressure plate.',
  },
  {
    id: 'ac_condenser',
    category: 'ac',
    title: 'Kondensor AC (Parallel-Flow)',
    subtitle: 'Penukar Panas Aluminium Aliran Paralel Pelepas Kalor Refrigeran Tekanan Tinggi',
    dimensions: {
      width: '≈ 560 mm',
      height: '≈ 360 mm',
      depth: '≈ 24 mm',
      spec: 'Core Aluminium Parallel-Flow · 17 Pipa Pipih & Sirip Louver · Refrigeran R134a',
    },
    pills: [
      'Core sirip pendingin aluminium',
      '17 Pipa pipih aliran paralel',
      'Tangki header vertikal Kiri & Kanan',
      'Fitting Inlet & Outlet berulir',
      '4 Braket dudukan sudut',
      'Rel pelindung sisi samping',
    ],
    pins: [
      { code: 'INLET', color: 'Merah', desc: 'Masukan gas refrigeran panas tekanan tinggi dari Discharge Kompresor.' },
      { code: 'OUTLET', color: 'Kuning', desc: 'Keluaran refrigeran cair bertekanan tinggi menuju Receiver Drier.' },
      { code: 'FAN (+)/(-)', color: 'Merah/Hitam', desc: 'Kipas pendingin tambahan (Extra Fan) yang bekerja paralel bersama Magnetic Clutch.' },
    ],
    guideSteps: [
      'Kondensor dipasang di bagian paling depan ruang mesin agar menerima aliran udara maksimal saat mobil berjalan.',
      'Extra Fan Kondensor wajib terhubung ke Relay Fan agar kondensasi tetap terjadi saat mobil berhenti (idle).',
      'Jika kipas kondensor mati, tekanan High Side di Manifold Gauge akan melonjak drastis (>300 psi).',
    ],
    usageNote:
      'Di dalam kondensor, refrigeran berwujud gas panas bertekanan tinggi melepaskan panas ke udara luar sehingga berubah wujud (mengembun) menjadi cairan bertekanan tinggi.',
  },
  {
    id: 'ac_evaporator',
    category: 'ac',
    title: 'Evaporator AC (Fin & Tube)',
    subtitle: 'Unit Penyerap Panas Udara Kabin & Pengubah Refrigeran Cair Menjadi Gas Dingin',
    dimensions: {
      width: '≈ 260 mm',
      height: '≈ 195 mm',
      depth: '≈ 75 mm',
      spec: 'Heat Exchanger Fin-and-Tube Aluminium · Suhu Permukaan Optimal 3°C – 7°C',
    },
    pills: [
      'Kisi sirip aluminium rapat',
      'Pipa saluran refrigeran horizontal',
      'Tikungan balik U-Bend',
      'Pelat ujung & rel pengikat',
      'Pipa Inlet (dari TXV) & Outlet (ke Kompresor)',
      'Dudukan sensor Thermostat',
    ],
    pins: [
      { code: 'INLET', color: 'Biru', desc: 'Masukan kabut refrigeran dingin tekanan rendah dari Katup Ekspansi (TXV).' },
      { code: 'OUTLET', color: 'Biru', desc: 'Keluaran uap refrigeran dingin menuju saluran hisap (Suction) Kompresor.' },
    ],
    guideSteps: [
      'Sensor termistor/kapiler Thermostat ditempatkan pada sirip evaporator untuk mencegah pembekuan es (freezing).',
      'Udara kabin ditiupkan oleh Blower Motor melewati celah sirip evaporator yang dingin sehingga suhu keluar ventilasi (T3) turun.',
      'Amati perbedaan suhu T2 (Return) dan T3 (Vent Out) pada Display Suhu Digital di papan trainer AC.',
    ],
    usageNote:
      'Evaporator bekerja berdasarkan prinsip penguapan: cairan refrigeran tekanan rendah menyerap panas laten dari udara kabin hingga seluruhnya menguap menjadi gas sebelum kembali ke kompresor.',
  },
  {
    id: 'ac_blower',
    category: 'ac',
    title: 'Blower Motor & Fan AC',
    subtitle: 'Motor DC 12V & Kipas Impeller Squirrel-Cage Penghembus Udara Kabin',
    dimensions: {
      width: '≈ 185 mm',
      height: '≈ 175 mm',
      depth: '≈ 160 mm',
      spec: 'Motor DC 12V · Impeller 36 Bilah Sentrifugal · Kecepatan Diatur Resistor 3-Tingkat',
    },
    pills: [
      'Casing volute (rumah keong) blower',
      'Impeller squirrel-cage 36 bilah',
      'Motor DC 12V berventilasi',
      'Corong saluran buang (Discharge duct)',
      'Konektor terminal 2-pin motor',
      '4 Kaki isolator karet',
    ],
    pins: [
      { code: 'BLW (+)', color: 'Merah', desc: 'Input tegangan variabel (6V / 9V / 12V) dari keluaran Resistor Blower.' },
      { code: 'BLW (-)', color: 'Hitam', desc: 'Terminal negatif menuju Ground / Massa 31 (atau dikendalikan sisi negatif oleh saklar).' },
    ],
    guideSteps: [
      'Hubungkan keluaran Sekring Blower (20A) ke terminal B Saklar Blower (0-1-2-3).',
      'Hubungkan tingkat kecepatan 1 (L), 2 (M), dan 3 (H) ke Resistor Blower, lalu output resistor ke BLW (+).',
      'Gunakan Multimeter DC V pada pin BLW (+) untuk memverifikasi tegangan naik bertahap pada Speed 1, 2, dan 3.',
    ],
    usageNote:
      'Kecepatan 1 mengalirkan arus melewati seluruh lilitan resistor (tegangan ~6V, hembusan pelan). Kecepatan 3 memintas resistor langsung ke 12V penuh (hembusan maksimal).',
  },
  {
    id: 'ac_expansion',
    category: 'ac',
    title: 'Katup Ekspansi (TXV Blok)',
    subtitle: 'Thermal Expansion Valve Tipe Blok Penurun Tekanan & Pengabut Refrigeran',
    dimensions: {
      width: '≈ 85 mm',
      height: '≈ 65 mm',
      depth: '≈ 55 mm',
      spec: 'Block-Type TXV R134a · Menurunkan Tekanan dari ~200 psi ke ~30 psi',
    },
    pills: [
      'Blok katup aluminium CNC',
      'Diafragma & elemen pengindera suhu',
      'Saluran High Pressure (dari Drier)',
      'Saluran Low Pressure (ke Evaporator)',
      'Tutup heksagonal penyetel superheat',
      'Tanda panah arah aliran refrigeran',
    ],
    pins: [
      { code: 'HP IN', color: 'Merah', desc: 'Masukan refrigeran cair bertekanan tinggi dari Receiver Drier.' },
      { code: 'LP OUT', color: 'Biru', desc: 'Semprotan kabut refrigeran dingin bertekanan rendah menuju Evaporator.' },
      { code: 'SENSING', color: 'Biru', desc: 'Saluran balik gas evaporator yang dideteksi diafragma untuk mengatur bukaan katup.' },
    ],
    guideSteps: [
      'Katup ekspansi dipasang tepat pada saluran masuk-keluar Evaporator (batas sisi tekanan tinggi dan rendah).',
      'Jika saluran ekspansi tersumbat kotoran/es, jarum Low Pressure akan turun mendekati vakum (0 psi).',
      'Amati pembacaan Manifold Gauge Low (25–35 psi) dan High (180–230 psi) saat sistem AC bekerja normal.',
    ],
    usageNote:
      'TXV tipe blok tidak memerlukan pipa kapiler eksternal yang panjang karena saluran balik evaporator langsung melewati bagian atas blok katup untuk menggerakkan diafragma secara otomatis.',
  },
  {
    id: 'ac_drier',
    category: 'ac',
    title: 'Receiver Drier & Sight Glass',
    subtitle: 'Tabung Penyaring Kotoran, Penyerap Uap Air (Desiccant), & Kaca Intip Refrigeran',
    dimensions: {
      width: '≈ 65 mm (diameter)',
      height: '≈ 175 mm',
      depth: '≈ 65 mm',
      spec: 'Filter Mesh + Silica Gel Desiccant · Sight Glass Kaca Intip · Sisi Cairan Tekanan Tinggi',
    },
    pills: [
      'Tabung silinder aluminium/baja',
      'Fitting Inlet (dari Kondensor) & Outlet (ke TXV)',
      'Kaca intip (Sight Glass) aliran refrigeran',
      'Klem braket pemasangan ganda',
      'Port servis / sensor tekanan',
    ],
    pins: [
      { code: 'IN', color: 'Kuning', desc: 'Masukan refrigeran cair tekanan tinggi dari keluaran Kondensor.' },
      { code: 'OUT', color: 'Kuning', desc: 'Keluaran refrigeran cair bersih & kering menuju Katup Ekspansi (TXV).' },
    ],
    guideSteps: [
      'Pasang Receiver Drier secara vertikal (tegak) agar hanya refrigeran fase cair di dasar tabung yang tersedot menuju TXV.',
      'Amati Sight Glass saat kompresor aktif: aliran jernih menandakan isi refrigeran cukup, sedangkan banyak gelembung putih menandakan refrigeran kurang.',
    ],
    usageNote:
      'Uap air di dalam sistem AC dapat membeku di lubang kecil katup ekspansi dan membentuk asam korosif bersama oli kompresor. Bahan desiccant di dalam Receiver Drier menyerap seluruh kelembapan tersebut.',
  },
  {
    id: 'ac_pressure',
    category: 'ac',
    title: 'Dual Pressure Switch AC',
    subtitle: 'Saklar Pengaman Tekanan Ganda (Low Cut-Out < 28 psi & High Cut-Out > 380 psi)',
    dimensions: {
      width: '≈ 34 mm (hex)',
      height: '≈ 72 mm',
      depth: '≈ 34 mm',
      spec: 'Normally Closed (NC) pada Tekanan Normal · Ulir 3/8-24 UNF dengan O-Ring Seal',
    },
    pills: [
      'Port tekanan berulir & seal O-ring',
      'Mur heksagonal pengencang baja',
      'Rumah diafragma pengindera tekanan',
      'Konektor elektrik 2-pin kuningan',
      'Klip pengunci soket',
    ],
    pins: [
      { code: 'PS IN', color: 'Biru', desc: 'Input sinyal kontrol dari keluaran Thermostat (TH OUT).' },
      { code: 'PS OUT', color: 'Biru', desc: 'Output sinyal pengaman menuju pin 85 Relay Magnetic Clutch & Relay Extra Fan.' },
    ],
    guideSteps: [
      'Hubungkan seri antara Thermostat (TH OUT) -> PS IN, dan PS OUT -> pin 85 Relay Clutch.',
      'Uji kontinuitas antara PS IN dan PS OUT dengan Multimeter (mode CONT): normal harus terhubung (bunyi beep).',
      'Klik komponen Pressure Switch pada papan trainer untuk menyimulasikan kondisi gangguan tekanan (OPEN) dan lihat kopling langsung memutus.',
    ],
    usageNote:
      'Dual Pressure Switch melindungi kompresor dari dua bahaya fatal: macet akibat kehabisan refrigeran/oli (Low Pressure) serta pecahnya selang akibat tekanan kondensor berlebih (High Pressure).',
  },
  {
    id: 'ac_panel',
    category: 'ac',
    title: 'Panel Kontrol & Outlet Blower AC',
    subtitle: 'Fascia Dashboard AC dengan Kisi Udara Sentral, Outlet Samping, & Kenop Kontrol',
    dimensions: {
      width: '≈ 420 mm',
      height: '≈ 125 mm',
      depth: '≈ 85 mm',
      spec: 'Unit Fascia Kabin · 2 Kisi Tengah + 2 Outlet Bulat Samping + Kenop Blower & Suhu',
    },
    pills: [
      'Kisi ventilasi ganda ber-louver',
      'Outlet sirkulasi bulat sisi kiri & kanan',
      'Kenop selektor kecepatan Blower (0-1-2-3)',
      'Kenop pengatur suhu Thermostat (Cool-Max)',
      'Slider pengarah aliran udara',
      'Braket dudukan dashboard',
    ],
    pins: [
      { code: 'BLW (0-1-2-3)', color: 'Kuning', desc: 'Selektor putar kecepatan blower yang membagi tegangan lewat resistor.' },
      { code: 'A/C & TEMP', color: 'Biru', desc: 'Pengatur suhu cut-off evaporator dan saklar aktivasi pendinginan kompresor.' },
    ],
    guideSteps: [
      'Pastikan Saklar Blower diputar minimal ke posisi 1 sebelum menekan tombol A/C (sistem interlock keselamatan).',
      'Atur posisi kisi louver untuk merasakan distribusi hembusan udara dingin dari evaporator.',
    ],
    usageNote:
      'Panel kontrol AC mengintegrasikan kendali mekanis arah angin dan kendali elektrik kecepatan blower serta suhu kabin secara ergonomis bagi pengemudi.',
  },
];

export class ComponentInspector3D {
  constructor({ stageContainer, onViewChange }) {
    this.stage = stageContainer;
    this.onViewChange = onViewChange;
    this.activeComponentId = 'headlamp';
    this.isOpen = false;
    this.animFrameId = null;

    this.scaleValue = 1.0;
    this.lensOpacity = 0.32;
    this.isExploded = false;
    this.isWireframe = false;
    this.showLabels = true;

    this.glassMaterials = [];
    this.shellMeshes = [];

    this._initThree();
    this.loadComponent('headlamp');
  }

  _initThree() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x142029, 7.5, 19);

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    this.camera.position.set(3.6, 2.3, 5.6);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.94;
    this.renderer.shadowMap.enabled = true;
    this.stage.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    pmrem.dispose();

    this.scene.add(new THREE.HemisphereLight(0xd9edff, 0x26313a, 1.15));
    const key = new THREE.DirectionalLight(0xffffff, 2.1);
    key.position.set(4, 6, 5);
    key.castShadow = true;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x8ccfff, 1.2);
    fill.position.set(-5, 2, 2);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffd6a0, 1.45);
    rim.position.set(1, 3, -5);
    this.scene.add(rim);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.minDistance = 2.4;
    this.controls.maxDistance = 11.5;
    this.controls.target.set(0, 0, 0);

    this.model = new THREE.Group();
    this.scene.add(this.model);

    this.parts = new THREE.Group();
    this.model.add(this.parts);

    this.exploded = new THREE.Group();
    this.model.add(this.exploded);

    this.labels = new THREE.Group();
    this.model.add(this.labels);

    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x182630,
      metalness: 0.1,
      roughness: 0.82,
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(4.4, 64), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -1.12;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const grid = new THREE.GridHelper(8.4, 24, 0x49606d, 0x293b46);
    grid.position.y = -1.11;
    this.scene.add(grid);

    window.addEventListener('resize', () => this.resize());
  }

  // Parametric geometry helpers (directly ported & expanded from headlamp_trainer_threejs.html)
  _mat(color, metalness = 0, roughness = 0.4, extra = {}) {
    return new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
  }

  _glassMat(colorHex = 0xf1f5f9, opacity = 0.34) {
    const m = new THREE.MeshPhysicalMaterial({
      color: colorHex,
      metalness: 0.04,
      roughness: 0.08,
      ior: 1.52,
      reflectivity: 0.92,
      transparent: true,
      opacity,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      side: THREE.DoubleSide,
    });
    this.glassMaterials.push(m);
    return m;
  }

  _box(parent, name, size, position, material) {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(...position);
    parent.add(g);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  }

  _roundedBox(parent, name, w, h, d, r, material, pos = [0, 0, 0]) {
    const rad = Math.min(r, w * 0.38, h * 0.38);
    const shape = new THREE.Shape();
    const x = -w / 2;
    const y = -h / 2;
    shape.moveTo(x + rad, y);
    shape.lineTo(x + w - rad, y);
    shape.quadraticCurveTo(x + w, y, x + w, y + rad);
    shape.lineTo(x + w, y + h - rad);
    shape.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    shape.lineTo(x + rad, y + h);
    shape.quadraticCurveTo(x, y + h, x, y + h - rad);
    shape.lineTo(x, y + rad);
    shape.quadraticCurveTo(x, y, x + rad, y);

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: d,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      curveSegments: 8,
    });
    geo.center();
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = name;
    mesh.position.set(...pos);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  _cylinder(parent, name, r1, r2, length, pos, rot, material, radial = 32) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, length, radial), material);
    m.name = name;
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  _sphere(parent, name, r, pos, material, scale = [1, 1, 1]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 20), material);
    m.name = name;
    m.position.set(...pos);
    m.scale.set(...scale);
    parent.add(m);
    return m;
  }

  _torus(parent, name, r, tube, pos, rot, material) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 48), material);
    m.name = name;
    m.position.set(...pos);
    m.rotation.set(...rot);
    m.castShadow = true;
    parent.add(m);
    return m;
  }

  _tube(parent, name, points, r, material) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 36, r, 10, false), material);
    m.name = name;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  _pipe(parent, name, a, b, r, material) {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const dir = new THREE.Vector3().subVectors(end, start);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, dir.length(), 20), material);
    m.name = name;
    m.position.copy(start).add(end).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    m.castShadow = true;
    parent.add(m);
    return m;
  }

  _addLabel(text, position) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 112;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(12, 24, 34, 0.88)';
      ctx.beginPath();
      ctx.roundRect(6, 6, 500, 100, 16);
      ctx.fill();
      ctx.strokeStyle = '#58b8e8';
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.font = 'bold 30px "Plus Jakarta Sans", "Inter", sans-serif';
      ctx.fillStyle = '#f1f9ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 56, 476);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
    );
    sprite.position.set(...position);
    sprite.scale.set(1.32, 0.3, 1);
    this.labels.add(sprite);
  }

  _clearModelGroups() {
    for (const grp of [this.parts, this.exploded, this.labels]) {
      while (grp.children.length > 0) {
        grp.remove(grp.children[0]);
      }
    }
    this.glassMaterials = [];
    this.shellMeshes = [];
  }

  loadComponent(componentId) {
    this.activeComponentId = componentId;
    this._clearModelGroups();

    if (componentId === 'headlamp') {
      this._buildHeadlampModel();
    } else if (componentId === 'taillamp') {
      this._buildTailLampModel();
    } else if (componentId === 'horn') {
      this._buildSnailHornModel();
    } else if (componentId === 'comboswitch') {
      this._buildCombinationSwitchModel();
    } else if (componentId === 'relayflasher') {
      this._buildRelayAndFlasherModel();
    } else if (componentId === 'ac_compressor') {
      this._buildAcCompressorModel();
    } else if (componentId === 'ac_condenser') {
      this._buildAcCondenserModel();
    } else if (componentId === 'ac_evaporator') {
      this._buildAcEvaporatorModel();
    } else if (componentId === 'ac_blower') {
      this._buildAcBlowerModel();
    } else if (componentId === 'ac_expansion') {
      this._buildAcExpansionModel();
    } else if (componentId === 'ac_drier') {
      this._buildAcDrierModel();
    } else if (componentId === 'ac_pressure') {
      this._buildAcPressureSwitchModel();
    } else if (componentId === 'ac_panel') {
      this._buildAcPanelModel();
    }

    this._applyControlStates();
    this.setView('perspective');
  }

  // ==========================================================================
  // 1. HEADLAMP H4 MODEL (Exact port of headlamp_trainer_threejs.html)
  // ==========================================================================
  _buildHeadlampModel() {
    const black = this._mat(0x171b1e, 0.25, 0.32);
    const dark = this._mat(0x292d30, 0.35, 0.3);
    const chrome = this._mat(0xb9c2c8, 0.88, 0.2);
    const reflectorMat = this._mat(0xdce2e5, 0.92, 0.14);
    const rubber = this._mat(0x101315, 0, 0.82);
    const brass = this._mat(0xc69a43, 0.78, 0.25);
    const glass = this._glassMat(0xe6f2f5, this.lensOpacity);
    const lensLine = this._mat(0xc9d5d8, 0.45, 0.2, { transparent: true, opacity: 0.32 });
    const red = this._mat(0xd63b25, 0.1, 0.35);
    const screwMat = this._mat(0x8e999e, 0.8, 0.25);

    const W = 2.0;
    const H = 1.4;
    const D = 1.2;

    const shell = this._roundedBox(this.parts, 'Main rear housing', W, H, D, 0.13, black, [0, 0, -0.12]);
    this.shellMeshes.push({ mesh: shell, baseMat: black });

    this._roundedBox(this.parts, 'Front sealing gasket', W * 0.965, H * 0.965, 0.075, 0.12, rubber, [0, 0, 0.49]);
    this._roundedBox(this.parts, 'Chrome front bezel', W * 0.94, H * 0.94, 0.085, 0.115, chrome, [0, 0, 0.545]);
    this._roundedBox(this.parts, 'Reflector assembly', 1.68, 1.12, 0.08, 0.12, reflectorMat, [0, 0, 0.57]);
    const bowl = this._cylinder(
      this.parts,
      'Reflector central bowl',
      0.49,
      0.34,
      0.16,
      [0, 0, 0.58],
      [Math.PI / 2, 0, 0],
      reflectorMat,
      64
    );
    bowl.scale.set(1.32, 0.92, 1);
    this._sphere(this.parts, 'Reflector concave dish', 0.47, [0, 0, 0.59], reflectorMat, [1.34, 0.88, 0.14]);
    this._cylinder(this.parts, 'H4 bulb metal base', 0.15, 0.18, 0.18, [0, 0, 0.56], [Math.PI / 2, 0, 0], brass);
    this._sphere(this.parts, 'H4 bulb glass capsule', 0.095, [0, 0, 0.60], glass, [0.9, 0.9, 1.5]);
    this._cylinder(this.parts, 'H4 bulb retaining collar', 0.205, 0.205, 0.045, [0, 0, 0.58], [Math.PI / 2, 0, 0], chrome);
    this._torus(this.parts, 'Bulb retaining ring', 0.22, 0.018, [0, 0, 0.595], [0, 0, 0], brass);
    this._roundedBox(this.parts, 'Ribbed clear front lens', W * 0.89, H * 0.89, 0.035, 0.1, glass, [0, 0, 0.655]);

    this._box(this.parts, 'Low beam shield', [0.28, 0.1, 0.035], [0, -0.08, 0.56], chrome);
    this._box(this.parts, 'Bulb support left', [0.025, 0.28, 0.035], [-0.2, 0, 0.50], brass);
    this._box(this.parts, 'Bulb support right', [0.025, 0.28, 0.035], [0.2, 0, 0.50], brass);

    // Subtle vertical automotive Fresnel optical lens flutes (no opaque mesh grid!)
    const fluteMat = this._mat(0xf8fafc, 0.15, 0.1, { transparent: true, opacity: 0.16 });
    for (let i = 0; i < 15; i++) {
      const x = -0.74 + i * 0.105;
      this._box(this.parts, 'Vertical lens fluting', [0.012, 1.05, 0.008], [x, 0, 0.655], fluteMat);
    }

    for (let i = 0; i < 7; i++) {
      const y = -0.48 + i * 0.16;
      this._box(this.parts, 'Rear cooling rib', [1.55, 0.035, 0.06], [0, y, -0.78], dark);
    }

    this._cylinder(this.parts, 'Rear bulb socket collar', 0.25, 0.28, 0.18, [0, 0, -0.79], [Math.PI / 2, 0, 0], black);
    this._cylinder(this.parts, 'H4 connector body', 0.19, 0.19, 0.2, [0, 0, -0.96], [Math.PI / 2, 0, 0], dark);
    this._roundedBox(this.parts, 'H4 three pin plug', 0.38, 0.27, 0.18, 0.045, black, [0, -0.02, -1.12]);
    for (const [x, y] of [
      [-0.11, 0.045],
      [0.11, 0.045],
      [0, -0.075],
    ]) {
      this._cylinder(this.parts, 'H4 brass terminal', 0.035, 0.035, 0.035, [x, y, -1.225], [Math.PI / 2, 0, 0], brass, 20);
    }

    const wireMats = [red, this._mat(0x222222), this._mat(0xe0c64a)];
    for (let i = 0; i < 3; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3((i - 1) * 0.08, -0.08, -1.2),
        new THREE.Vector3((i - 1) * 0.11, -0.2, -1.35),
        new THREE.Vector3((i - 1) * 0.15, -0.3, -1.48),
      ]);
      const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.014, 8, false), wireMats[i]);
      this.parts.add(wire);
    }

    const addEar = (x, y, z, rotZ = 0) => {
      const e = this._roundedBox(this.parts, 'Mounting tab', 0.28, 0.22, 0.09, 0.04, black, [x, y, z]);
      e.rotation.z = rotZ;
      this._cylinder(this.parts, 'Mounting bolt hole rim', 0.073, 0.073, 0.018, [x, y, z + 0.052], [Math.PI / 2, 0, 0], chrome, 32);
      this._cylinder(this.parts, 'Mounting bolt hole', 0.044, 0.044, 0.025, [x, y, z + 0.064], [Math.PI / 2, 0, 0], black, 32);
    };
    addEar(-0.7, 0.69, 0.12, -0.12);
    addEar(0.7, 0.69, 0.12, 0.12);
    addEar(-0.72, -0.68, 0.08, 0.12);
    addEar(0.72, -0.68, 0.08, -0.12);

    for (const x of [-0.78, 0.78]) {
      this._cylinder(this.parts, 'Headlamp aiming adjuster', 0.055, 0.055, 0.18, [x, 0.42, -0.8], [Math.PI / 2, 0, 0], brass);
      this._cylinder(this.parts, 'Adjuster screw head', 0.075, 0.075, 0.035, [x, 0.42, -0.91], [Math.PI / 2, 0, 0], screwMat);
    }
    for (const [x, y] of [
      [-0.84, 0.52],
      [0.84, 0.52],
      [-0.84, -0.52],
      [0.84, -0.52],
    ]) {
      this._cylinder(this.parts, 'Bezel screw', 0.025, 0.025, 0.025, [x, y, 0.69], [Math.PI / 2, 0, 0], screwMat, 16);
    }

    // Exploded view layers
    this._roundedBox(this.exploded, 'Exploded rear housing', W, H, D * 0.85, 0.13, black, [0, 0, -0.95]);
    this._roundedBox(this.exploded, 'Exploded socket', 0.42, 0.3, 0.22, 0.04, dark, [0, 0, -1.85]);
    const expBowl = this._cylinder(
      this.exploded,
      'Exploded reflector',
      0.52,
      0.62,
      0.16,
      [0, 0, 0.05],
      [Math.PI / 2, 0, 0],
      reflectorMat,
      48
    );
    expBowl.scale.set(1.25, 0.92, 1);
    this._sphere(this.exploded, 'Exploded H4 bulb', 0.11, [0, 0, 0.55], brass, [0.9, 0.9, 1.7]);
    this._roundedBox(this.exploded, 'Exploded chrome bezel', W * 0.94, H * 0.94, 0.08, 0.11, chrome, [0, 0, 1.05]);
    this._roundedBox(this.exploded, 'Exploded glass lens', W * 0.89, H * 0.89, 0.04, 0.1, glass, [0, 0, 1.55]);

    this._addLabel('Lensa kaca beralur (200x140mm)', [0, 1.04, 0.68]);
    this._addLabel('Reflektor parabola + Bohlam H4', [0, -0.96, 0.52]);
    this._addLabel('Soket H4 3-Pin (LO · HI · GND)', [0.72, -0.55, -1.25]);
  }

  // ==========================================================================
  // 2. TAIL LAMP ASSEMBLY (Lampu Sein / Kota / Rem ≈ 340 x 95 x 70 mm)
  // ==========================================================================
  _buildTailLampModel() {
    const black = this._mat(0x171b1e, 0.25, 0.35);
    const dark = this._mat(0x262b30, 0.3, 0.4);
    const reflectorMat = this._mat(0xdce2e5, 0.92, 0.14);
    const brass = this._mat(0xc69a43, 0.8, 0.25);
    const screwMat = this._mat(0xcbd5e1, 0.85, 0.2);

    const amberGlass = this._glassMat(0xf59e0b, Math.min(0.82, this.lensOpacity + 0.42));
    const redGlass = this._glassMat(0xdc2626, Math.min(0.84, this.lensOpacity + 0.44));
    const clearGlass = this._glassMat(0xe2e8f0, this.lensOpacity + 0.12);

    const W = 3.2;
    const H = 0.95;
    const D = 0.68;

    const shell = this._roundedBox(this.parts, 'Tail lamp rear housing', W, H, D, 0.09, black, [0, 0, -0.08]);
    this.shellMeshes.push({ mesh: shell, baseMat: black });

    // 3 Internal reflector bowls + bulbs (Turn | Stop/Tail | Reverse)
    const chambers = [
      { x: -1.12, w: 0.76, label: 'Turn' },
      { x: 0.0, w: 1.32, label: 'Stop/Tail' },
      { x: 1.15, w: 0.68, label: 'Reverse' },
    ];
    for (const ch of chambers) {
      this._roundedBox(this.parts, 'Chamber reflector', ch.w, H * 0.82, 0.08, 0.05, reflectorMat, [ch.x, 0, 0.22]);
      this._cylinder(this.parts, 'Bulb socket base', 0.09, 0.1, 0.14, [ch.x, 0, 0.26], [Math.PI / 2, 0, 0], brass, 20);
      this._sphere(this.parts, 'Bayonet bulb', 0.085, [ch.x, 0, 0.33], clearGlass, [1, 1, 1.25]);
    }

    // 3 Colored fluted lenses on the front face (+Z)
    this._roundedBox(this.parts, 'Amber Turn Lens', 0.78, H * 0.88, 0.12, 0.05, amberGlass, [-1.12, 0, 0.32]);
    this._roundedBox(this.parts, 'Red Stop/Tail Lens', 1.36, H * 0.88, 0.12, 0.03, redGlass, [0.0, 0, 0.32]);
    this._roundedBox(this.parts, 'Clear Reverse Lens', 0.7, H * 0.88, 0.12, 0.05, clearGlass, [1.16, 0, 0.32]);

    // 4 Front silver lens divider screws
    for (const sx of [-0.71, 0.74]) {
      for (const sy of [0.32, -0.32]) {
        this._cylinder(this.parts, 'Divider screw', 0.028, 0.028, 0.03, [sx, sy, 0.39], [Math.PI / 2, 0, 0], screwMat, 16);
      }
    }

    // Rear (-Z) 3 bulb socket rubber boots, mounting studs & wire harness (matching reference photo!)
    for (const ch of chambers) {
      this._cylinder(this.parts, 'Rear rubber socket', 0.18, 0.21, 0.16, [ch.x, 0, -0.46], [Math.PI / 2, 0, 0], dark, 24);
      this._cylinder(this.parts, 'Socket brass contact', 0.06, 0.06, 0.05, [ch.x, 0, -0.55], [Math.PI / 2, 0, 0], brass, 16);
    }
    for (const sx of [-0.85, 0.85]) {
      this._cylinder(this.parts, 'Mounting stud M6', 0.035, 0.035, 0.26, [sx, 0.18, -0.52], [Math.PI / 2, 0, 0], screwMat, 16);
      this._cylinder(this.parts, 'Hex nut', 0.065, 0.065, 0.05, [sx, 0.18, -0.45], [Math.PI / 2, 0, 0], brass, 6);
    }

    // Exploded view
    this._roundedBox(this.exploded, 'Exp housing', W, H, D * 0.85, 0.09, black, [0, 0, -0.85]);
    this._roundedBox(this.exploded, 'Exp reflector tray', W * 0.92, H * 0.82, 0.08, 0.06, reflectorMat, [0, 0, 0.0]);
    this._roundedBox(this.exploded, 'Exp Amber Lens', 0.78, H * 0.88, 0.12, 0.05, amberGlass, [-1.18, 0, 0.95]);
    this._roundedBox(this.exploded, 'Exp Red Lens', 1.36, H * 0.88, 0.12, 0.03, redGlass, [0.0, 0, 1.05]);
    this._roundedBox(this.exploded, 'Exp Clear Lens', 0.7, H * 0.88, 0.12, 0.05, clearGlass, [1.22, 0, 0.95]);

    this._addLabel('Sein (Amber) · Kota/Rem (Merah) · Mundur (Putih)', [0, 0.82, 0.35]);
    this._addLabel('3 Soket Bohlam Bayonet & Baut M6', [0, -0.78, -0.52]);
  }

  // ==========================================================================
  // 3. SNAIL HORN 12V 410Hz (Klakson Keong ≈ 90 x 85 x 75 mm)
  // ==========================================================================
  _buildSnailHornModel() {
    const blackShell = this._mat(0x15191d, 0.28, 0.32);
    const darkMetal = this._mat(0x252b31, 0.55, 0.35);
    const brass = this._mat(0xc69a43, 0.82, 0.24);
    const copper = this._mat(0xb45309, 0.75, 0.28);
    const chrome = this._mat(0xcbd5e1, 0.85, 0.2);

    // Main round acoustic chamber
    const mainDrum = this._cylinder(
      this.parts,
      'Main acoustic drum',
      0.88,
      0.95,
      0.56,
      [0.12, 0, 0],
      [Math.PI / 2, 0, 0],
      blackShell,
      40
    );
    this.shellMeshes.push({ mesh: mainDrum, baseMat: blackShell });

    // Spiral snail resonance scroll
    this._torus(this.parts, 'Snail spiral scroll', 0.66, 0.25, [0.12, 0, 0.16], [0, 0, 0], blackShell);

    // Flared acoustic trumpet mouth pointing bottom-left (exact match to photo!)
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(-0.58, -0.42, 0.18);
    mouthGroup.rotation.z = 0.54;
    mouthGroup.rotation.x = 0.18;
    this._cylinder(mouthGroup, 'Acoustic flare cone', 0.62, 0.32, 0.72, [0, 0, 0], [0, 0, 0], blackShell, 32);
    this._cylinder(
      mouthGroup,
      'Acoustic dark throat',
      0.54,
      0.26,
      0.73,
      [0, 0.01, 0],
      [0, 0, 0],
      this._mat(0x090b0e, 0.1, 0.9),
      28
    );
    this.parts.add(mouthGroup);

    // Top-right perforated mounting bracket (matching reference photo!)
    this._roundedBox(this.parts, 'Mounting bracket', 0.44, 0.96, 0.09, 0.08, darkMetal, [0.42, 0.82, -0.18]);
    this._cylinder(this.parts, 'Bracket hole rim', 0.12, 0.12, 0.11, [0.42, 1.06, -0.18], [Math.PI / 2, 0, 0], chrome, 24);
    this._cylinder(
      this.parts,
      'Bracket bolt hole',
      0.085,
      0.085,
      0.13,
      [0.42, 1.06, -0.18],
      [Math.PI / 2, 0, 0],
      this._mat(0x0b1116, 0, 0.9),
      24
    );

    // Front circular badge ("12V 410Hz")
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#14181c';
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(128, 128, 114, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 46px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('12V', 128, 108);
      ctx.font = 'bold 40px "JetBrains Mono", monospace';
      ctx.fillText('410Hz', 128, 162);
    }
    const badgeTex = new THREE.CanvasTexture(canvas);
    badgeTex.colorSpace = THREE.SRGBColorSpace;
    const badgeMat = this._mat(0xffffff, 0.2, 0.3, { map: badgeTex });
    this._cylinder(this.parts, 'Center cap backing', 0.5, 0.5, 0.06, [0.12, 0, 0.41], [Math.PI / 2, 0, 0], darkMetal, 32);
    const badgeFace = new THREE.Mesh(new THREE.CircleGeometry(0.49, 32), badgeMat);
    badgeFace.position.set(0.12, 0, 0.445);
    this.parts.add(badgeFace);

    // Rear (-Z) perimeter bolts + 2 brass spade terminals (H+ & H-)
    for (let a = 0; a < 6; a++) {
      const ang = (a * Math.PI) / 3;
      this._cylinder(
        this.parts,
        'Perimeter bolt',
        0.045,
        0.045,
        0.06,
        [0.12 + Math.cos(ang) * 0.82, Math.sin(ang) * 0.82, -0.29],
        [Math.PI / 2, 0, 0],
        brass,
        12
      );
    }
    for (const [tx, ty] of [
      [-0.08, 0.18],
      [0.32, 0.18],
    ]) {
      this._box(this.parts, 'Spade terminal', [0.08, 0.22, 0.26], [tx, ty, -0.42], brass);
    }

    // Exploded view (Rear electromagnet housing | Copper coil | Steel diaphragm | Front Snail Horn)
    this._cylinder(this.exploded, 'Exp rear shell', 0.88, 0.92, 0.32, [0.12, 0, -0.95], [Math.PI / 2, 0, 0], darkMetal, 36);
    this._cylinder(this.exploded, 'Exp copper coil', 0.42, 0.42, 0.28, [0.12, 0, -0.35], [Math.PI / 2, 0, 0], copper, 28);
    this._cylinder(this.exploded, 'Exp steel diaphragm', 0.84, 0.84, 0.03, [0.12, 0, 0.25], [Math.PI / 2, 0, 0], chrome, 36);
    this._torus(this.exploded, 'Exp front snail', 0.66, 0.24, [0.12, 0, 0.92], [0, 0, 0], blackShell);

    this._addLabel('Rumah Keong Akustik (12V 410Hz)', [0.15, 0.85, 0.45]);
    this._addLabel('Corong Resonator (Bawah-Kiri)', [-0.85, -0.85, 0.35]);
    this._addLabel('Braket & Terminal Spade (H+ / H-)', [0.55, 1.32, -0.2]);
  }

  // ==========================================================================
  // 4. COMBINATION SWITCH (Switch Universal ≈ 450-480 x 110 x 95 mm)
  // ==========================================================================
  _buildCombinationSwitchModel() {
    const black = this._mat(0x171b1e, 0.25, 0.34);
    const dark = this._mat(0x252a2e, 0.3, 0.4);
    const zinc = this._mat(0xcbd5e1, 0.78, 0.24);
    const brass = this._mat(0xc69a43, 0.8, 0.25);
    const hazardRed = this._mat(0xdc2626, 0.15, 0.35);
    const whiteNylon = this._mat(0xf1f5f9, 0.05, 0.38);

    // Central steering column housing
    const centerBody = this._roundedBox(this.parts, 'Steering column switch housing', 1.45, 1.05, 0.68, 0.1, black, [0, 0, 0]);
    this.shellMeshes.push({ mesh: centerBody, baseMat: black });

    // Front silver/zinc contact faceplate
    this._roundedBox(this.parts, 'Zinc faceplate', 1.12, 0.88, 0.08, 0.06, zinc, [0, 0, 0.35]);

    // Central steering shaft bore hole (Lubang poros kemudi)
    this._cylinder(this.parts, 'Brass slip ring collar', 0.31, 0.31, 0.1, [0, 0, 0.35], [Math.PI / 2, 0, 0], brass, 32);
    this._cylinder(
      this.parts,
      'Steering column shaft bore',
      0.22,
      0.22,
      0.86,
      [0, 0, 0.02],
      [Math.PI / 2, 0, 0],
      this._mat(0x090c10, 0, 0.9),
      32
    );

    // Top red Hazard switch rocker tab
    this._roundedBox(this.parts, 'Hazard switch tab', 0.32, 0.18, 0.24, 0.03, hazardRed, [0, 0.58, 0.08]);

    // Left (-1) & Right (+1) Stalks extending symmetrically from the central housing
    for (const dir of [-1, 1]) {
      // Rubber accordion boot
      this._cylinder(
        this.parts,
        'Rubber stalk boot',
        0.18,
        0.22,
        0.32,
        [dir * 0.82, 0.02, 0.04],
        [0, 0, -dir * (Math.PI / 2 - 0.12)],
        dark,
        20
      );
      // Tapered lever shaft
      this._cylinder(
        this.parts,
        'Stalk lever arm',
        0.075,
        0.105,
        1.45,
        [dir * 1.62, 0.12, 0.08],
        [0, 0, -dir * (Math.PI / 2 - 0.14)],
        black,
        20
      );
      // Outer rotary switch paddle tip
      this._cylinder(
        this.parts,
        'Rotary stalk tip',
        0.13,
        0.095,
        0.55,
        [dir * 2.48, 0.24, 0.12],
        [0, 0, -dir * (Math.PI / 2 - 0.14)],
        black,
        24
      );
      // White selector indicator rings
      for (const ro of [-0.1, 0.08]) {
        this._cylinder(
          this.parts,
          'Selector ring',
          0.133,
          0.133,
          0.024,
          [dir * (2.48 + ro), 0.24, 0.12],
          [0, 0, -dir * (Math.PI / 2 - 0.14)],
          whiteNylon,
          24
        );
      }
    }

    // White multi-pin nylon connector block & wire harness at bottom-right (matching reference photo!)
    const connPlug = this._roundedBox(
      this.parts,
      'White 10-pin connector',
      0.58,
      0.34,
      0.28,
      0.04,
      whiteNylon,
      [0.62, -0.72, -0.18]
    );
    connPlug.rotation.z = -0.22;

    const wireColors = [0xdc2626, 0xeab308, 0x2563eb, 0x16a34a, 0x18181b];
    for (let i = 0; i < 5; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.35 + i * 0.06, -0.38, -0.12),
        new THREE.Vector3(0.45 + i * 0.06, -0.55, -0.16),
        new THREE.Vector3(0.52 + i * 0.05, -0.68, -0.18),
      ]);
      const wire = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 16, 0.016, 8, false),
        this._mat(wireColors[i], 0.1, 0.5)
      );
      this.parts.add(wire);
    }

    // Exploded view
    this._roundedBox(this.exploded, 'Exp center body', 1.45, 1.05, 0.62, 0.1, black, [0, 0, -0.45]);
    this._roundedBox(this.exploded, 'Exp zinc contact plate', 1.12, 0.88, 0.08, 0.06, zinc, [0, 0, 0.55]);
    this._cylinder(
      this.exploded,
      'Exp left stalk',
      0.09,
      0.12,
      1.8,
      [-2.15, 0.15, 0.1],
      [0, 0, Math.PI / 2 - 0.14],
      black,
      20
    );
    this._cylinder(
      this.exploded,
      'Exp right stalk',
      0.09,
      0.12,
      1.8,
      [2.15, 0.15, 0.1],
      [0, 0, -(Math.PI / 2 - 0.14)],
      black,
      20
    );
    this._roundedBox(this.exploded, 'Exp white connector', 0.58, 0.34, 0.28, 0.04, whiteNylon, [0.75, -1.05, -0.35]);

    this._addLabel('Lubang Poros Kemudi & Pelat Kontak', [0, 0.92, 0.35]);
    this._addLabel('Tuas Kanan (Lampu Kepala, Dimmer & Sein)', [2.1, 0.68, 0.2]);
    this._addLabel('Konektor Putih Multi-Pin (B · LOW · HIGH · 49a · LH · RH)', [0.65, -1.02, -0.15]);
  }

  // ==========================================================================
  // 5. RELAY 4-KAKI (30-85-86-87) & FLASHER UNIT (B-L-E)
  // ==========================================================================
  _buildRelayAndFlasherModel() {
    const black = this._mat(0x1f2937, 0.25, 0.38);
    const blueFlasher = this._mat(0x1e3a8a, 0.25, 0.38);
    const yellowSocket = this._mat(0xeab308, 0.15, 0.42);
    const copper = this._mat(0xb45309, 0.78, 0.25);
    const brass = this._mat(0xc69a43, 0.82, 0.22);
    const chrome = this._mat(0xcbd5e1, 0.85, 0.2);
    const clearCover = this._glassMat(0xe2e8f0, this.lensOpacity + 0.15);

    // LEFT UNIT: 4-Pin Relay (30-85-86-87) with internal copper electromagnet coil & contact armature
    const relayShell = this._roundedBox(this.parts, 'Relay cover', 1.15, 1.15, 0.95, 0.08, clearCover, [-1.05, 0.18, 0]);
    this.shellMeshes.push({ mesh: relayShell, baseMat: black });

    // Internal copper coil & armature inside the relay
    this._cylinder(this.parts, 'Relay electromagnetic coil', 0.26, 0.26, 0.62, [-1.2, 0.18, 0], [0, 0, 0], copper, 28);
    this._box(this.parts, 'Relay L-frame', [0.06, 0.68, 0.32], [-0.82, 0.18, 0], chrome);
    this._box(this.parts, 'Relay movable contact (30-87)', [0.36, 0.05, 0.24], [-1.02, 0.54, 0], brass);

    // Top metal mounting bracket & bottom yellow socket base
    this._roundedBox(this.parts, 'Relay mounting tab', 0.62, 0.45, 0.06, 0.05, chrome, [-1.05, 0.92, -0.44]);
    this._roundedBox(this.parts, 'Relay yellow socket', 1.22, 0.48, 1.02, 0.06, yellowSocket, [-1.05, -0.58, 0]);

    for (const px of [-1.38, -1.16, -0.94, -0.72]) {
      this._box(this.parts, 'Relay blade pin', [0.08, 0.36, 0.03], [px, -0.92, 0], brass);
    }

    // RIGHT UNIT: Flasher (B - L - E)
    const flasherShell = this._roundedBox(this.parts, 'Flasher housing', 1.15, 1.22, 0.95, 0.08, blueFlasher, [1.05, 0.18, 0]);
    this.shellMeshes.push({ mesh: flasherShell, baseMat: blueFlasher });
    this._roundedBox(this.parts, 'Flasher bracket', 0.62, 0.45, 0.06, 0.05, chrome, [1.05, 0.96, -0.44]);
    for (const px of [0.75, 1.05, 1.35]) {
      this._box(this.parts, 'Flasher blade pin', [0.09, 0.38, 0.03], [px, -0.62, 0], brass);
    }

    // Exploded view
    this._roundedBox(this.exploded, 'Exp relay cover', 1.15, 1.15, 0.95, 0.08, black, [-1.05, 0.95, 0]);
    this._cylinder(this.exploded, 'Exp relay coil', 0.28, 0.28, 0.62, [-1.05, 0.05, 0], [0, 0, 0], copper, 28);
    this._roundedBox(this.exploded, 'Exp relay socket', 1.22, 0.48, 1.02, 0.06, yellowSocket, [-1.05, -0.85, 0]);
    this._roundedBox(this.exploded, 'Exp flasher housing', 1.15, 1.22, 0.95, 0.08, blueFlasher, [1.05, 0.45, 0]);

    this._addLabel('Relay 4-Kaki (Kumparan 85-86 & Kontak 30-87)', [-1.05, 1.32, 0.2]);
    this._addLabel('Unit Flasher Pengedip Sein (B · L · E)', [1.05, 1.32, 0.2]);
  }

  // ==========================================================================
  // 6. AC COMPRESSOR & MAGNETIC CLUTCH (Ported from kompresor_ac_threejs_rebuild_v3)
  // ==========================================================================
  _buildAcCompressorModel() {
    const aluminum = this._mat(0xc2cbd1, 0.84, 0.28);
    const castShade = this._mat(0x8d9aa1, 0.78, 0.36);
    const brightAl = this._mat(0xdce4e8, 0.90, 0.20);
    const black = this._mat(0x161b20, 0.24, 0.42);
    const rubber = this._mat(0x111518, 0.04, 0.84);
    const steel = this._mat(0x7c8a92, 0.86, 0.24);
    const brass = this._mat(0xc69a43, 0.80, 0.25);
    const plastic = this._mat(0x28333c, 0.12, 0.55);

    // Main cylindrical aluminum casing & rear head along Z (pulley faces +Z)
    const casing = this._cylinder(this.parts, 'Main compressor housing', 0.66, 0.66, 1.55, [0, 0, -0.12], [Math.PI / 2, 0, 0], aluminum, 48);
    this.shellMeshes.push({ mesh: casing, baseMat: aluminum });
    this._cylinder(this.parts, 'Rear casing flange', 0.685, 0.685, 0.18, [0, 0, -0.93], [Math.PI / 2, 0, 0], castShade, 48);
    this._cylinder(this.parts, 'Rear end cover', 0.59, 0.59, 0.16, [0, 0, -1.08], [Math.PI / 2, 0, 0], aluminum, 48);
    this._cylinder(this.parts, 'Front nose casting', 0.57, 0.57, 0.13, [0, 0, 0.66], [Math.PI / 2, 0, 0], castShade, 48);
    this._torus(this.parts, 'Rear seam', 0.665, 0.024, [0, 0, -0.78], [0, 0, 0], brightAl);
    this._torus(this.parts, 'Front seam', 0.66, 0.022, [0, 0, 0.52], [0, 0, 0], brightAl);

    // 12 longitudinal cooling ribs
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI * 2) / 12;
      const rib = this._box(this.parts, 'Cooling rib', [0.075, 0.075, 1.03], [0.645 * Math.cos(a), 0.645 * Math.sin(a), -0.10], castShade);
      rib.parent.rotation.z = a;
    }

    // Front Magnetic Clutch & Multi-Groove Pulley
    this._cylinder(this.parts, 'Pulley drum', 0.57, 0.57, 0.20, [0, 0, 0.82], [Math.PI / 2, 0, 0], black, 48);
    this._cylinder(this.parts, 'Pulley front rim', 0.535, 0.535, 0.075, [0, 0, 0.965], [Math.PI / 2, 0, 0], rubber, 48);
    for (let i = 0; i < 7; i++) {
      this._torus(this.parts, 'Pulley groove', 0.545, 0.017, [0, 0, 0.87 + i * 0.026], [0, 0, 0], steel);
    }
    this._cylinder(this.parts, 'Magnetic clutch plate', 0.455, 0.455, 0.07, [0, 0, 1.025], [Math.PI / 2, 0, 0], black, 48);
    this._cylinder(this.parts, 'Clutch face', 0.355, 0.355, 0.055, [0, 0, 1.085], [Math.PI / 2, 0, 0], castShade, 48);
    this._cylinder(this.parts, 'Central hub', 0.245, 0.245, 0.075, [0, 0, 1.145], [Math.PI / 2, 0, 0], black, 40);
    this._cylinder(this.parts, 'Shaft cap', 0.145, 0.145, 0.10, [0, 0, 1.22], [Math.PI / 2, 0, 0], brightAl, 32);
    this._cylinder(this.parts, 'Shaft bolt', 0.075, 0.075, 0.11, [0, 0, 1.29], [Math.PI / 2, 0, 0], steel, 24);
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3;
      this._cylinder(this.parts, 'Clutch bolt', 0.035, 0.035, 0.025, [0.385 * Math.cos(a), 0.385 * Math.sin(a), 1.075], [Math.PI / 2, 0, 0], steel, 12);
    }

    // Top Cast Manifold & Suction / Discharge Ports + Hoses
    this._box(this.parts, 'Upper manifold base', [0.92, 0.25, 0.66], [0, 0.60, -0.35], castShade);
    this._box(this.parts, 'Upper manifold cap', [0.68, 0.18, 0.52], [0.03, 0.78, -0.36], aluminum);
    for (const [px, pz, r] of [[-0.32, -0.39, 0.16], [0.34, -0.32, 0.115]]) {
      this._cylinder(this.parts, 'Port boss', r * 1.55, r * 1.55, 0.14, [px, 0.91, pz], [0, 0, 0], castShade, 28);
      this._cylinder(this.parts, 'Hex union', r * 1.20, r * 1.20, 0.10, [px, 1.025, pz], [0, 0, 0], brightAl, 6);
      this._cylinder(this.parts, 'Hose nipple', r * 0.70, r * 0.78, 0.17, [px, 1.16, pz], [0, 0, 0], steel, 24);
      this._torus(this.parts, 'Fitting collar', r * 0.72, 0.016, [px, 1.245, pz], [Math.PI / 2, 0, 0], brass);
    }
    this._tube(this.parts, 'Suction hose', [[-0.32, 1.23, -0.39], [-0.36, 1.39, -0.48], [-0.62, 1.48, -0.66], [-0.92, 1.40, -0.78]], 0.048, rubber);
    this._tube(this.parts, 'Discharge hose', [[0.34, 1.23, -0.32], [0.52, 1.38, -0.25], [0.78, 1.40, -0.42], [1.02, 1.28, -0.60]], 0.038, black);

    // Side Clutch Coil Electrical Connector
    this._box(this.parts, 'Clutch connector', [0.23, 0.20, 0.25], [-0.67, -0.22, 0.05], black);
    this._box(this.parts, 'Electrical plug', [0.13, 0.10, 0.09], [-0.69, -0.22, 0.20], plastic);
    for (let i = 0; i < 3; i++) {
      this._box(this.parts, 'Pin', [0.025, 0.065, 0.025], [-0.75 + i * 0.06, -0.22, 0.255], brass);
    }

    // 4 Mounting Feet
    for (const fx of [-0.43, 0.43]) {
      for (const fz of [-0.63, 0.28]) {
        this._box(this.parts, 'Foot saddle', [0.25, 0.20, 0.28], [fx, -0.58, fz], castShade);
        this._box(this.parts, 'Mounting leg', [0.19, 0.39, 0.20], [fx, -0.79, fz], aluminum);
        this._box(this.parts, 'Mounting pad', [0.34, 0.10, 0.34], [fx, -1.035, fz], castShade);
        this._torus(this.parts, 'Bolt rim', 0.065, 0.012, [fx, -0.978, fz], [Math.PI / 2, 0, 0], brightAl);
      }
    }

    // Exploded view (Rear Head | Main Housing | Stator Coil | Pulley | Clutch Plate)
    this._cylinder(this.exploded, 'Exp rear head', 0.62, 0.64, 0.28, [0, 0, -1.45], [Math.PI / 2, 0, 0], castShade, 36);
    this._cylinder(this.exploded, 'Exp casing', 0.66, 0.66, 1.35, [0, 0, -0.25], [Math.PI / 2, 0, 0], aluminum, 36);
    this._cylinder(this.exploded, 'Exp magnetic coil', 0.42, 0.42, 0.22, [0, 0, 0.72], [Math.PI / 2, 0, 0], brass, 32);
    this._cylinder(this.exploded, 'Exp pulley', 0.57, 0.57, 0.24, [0, 0, 1.25], [Math.PI / 2, 0, 0], black, 36);
    this._cylinder(this.exploded, 'Exp clutch plate', 0.46, 0.46, 0.10, [0, 0, 1.72], [Math.PI / 2, 0, 0], castShade, 36);

    this._addLabel('Pulley & Magnetic Clutch 12V', [0, 0.58, 1.25]);
    this._addLabel('Port Suction (Low) & Discharge (High)', [0, 1.55, -0.35]);
    this._addLabel('Konektor Koil Magnet (CLU+ / CLU-)', [-1.15, -0.22, 0.25]);
  }

  // ==========================================================================
  // 7. AC CONDENSER PARALLEL-FLOW (Ported from kondensor_ac_threejs)
  // ==========================================================================
  _buildAcCondenserModel() {
    const aluminum = this._mat(0xb8c3c8, 0.82, 0.26);
    const bright = this._mat(0xdce2e5, 0.90, 0.20);
    const darkAl = this._mat(0x7c8a91, 0.82, 0.30);
    const steel = this._mat(0x88969c, 0.88, 0.22);
    const brass = this._mat(0xc39a4c, 0.76, 0.25);
    const black = this._mat(0x161b20, 0.20, 0.45);

    const frame = this._box(this.parts, 'Condenser core frame', [3.2, 1.95, 0.22], [0, 0, 0], darkAl);
    this.shellMeshes.push({ mesh: frame, baseMat: darkAl });
    this._box(this.parts, 'Front fin backing', [3.08, 1.84, 0.10], [0, 0, 0.14], aluminum);
    this._box(this.parts, 'Rear fin backing', [3.08, 1.84, 0.10], [0, 0, -0.14], darkAl);

    // Corrugated cooling fin strips (44 lightweight strips)
    for (let i = 0; i < 44; i++) {
      const x = -1.48 + i * 0.068;
      this._box(this.parts, 'Cooling fin', [0.02, 1.80, 0.055], [x, 0, 0.22], bright);
      this._box(this.parts, 'Rear fin', [0.02, 1.80, 0.055], [x, 0, -0.22], aluminum);
    }
    // 15 Horizontal parallel-flow flat refrigerant tubes
    for (let row = 0; row < 15; row++) {
      const y = -0.82 + row * 0.117;
      this._box(this.parts, 'Parallel-flow tube', [3.04, 0.042, 0.10], [0, y, 0.26], steel);
      this._box(this.parts, 'Rear tube', [3.04, 0.042, 0.10], [0, y, -0.26], darkAl);
    }
    // Side header tanks + inlet/outlet top fittings
    for (const x of [-1.70, 1.70]) {
      this._box(this.parts, 'Header tank', [0.26, 2.08, 0.40], [x, 0, 0], aluminum);
      this._box(this.parts, 'Header cap top', [0.29, 0.07, 0.44], [x, 1.04, 0], darkAl);
      this._box(this.parts, 'Header cap bot', [0.29, 0.07, 0.44], [x, -1.04, 0], darkAl);
      for (const y of [-0.94, 0.94]) {
        this._box(this.parts, 'Mounting bracket', [0.38, 0.18, 0.46], [x, y, 0], darkAl);
        this._cylinder(this.parts, 'Bolt hole', 0.06, 0.06, 0.05, [x, y + (y > 0 ? 0.12 : -0.12), 0.24], [Math.PI / 2, 0, 0], black, 20);
      }
    }
    this._cylinder(this.parts, 'Inlet neck', 0.085, 0.085, 0.22, [-1.70, 1.16, 0], [0, 0, 0], aluminum, 24);
    this._cylinder(this.parts, 'Inlet union', 0.068, 0.068, 0.14, [-1.70, 1.32, 0], [0, 0, 0], brass, 6);
    this._tube(this.parts, 'Inlet pipe', [[-1.70, 1.38, 0], [-1.70, 1.54, 0.02], [-1.46, 1.62, 0.02], [-1.28, 1.62, 0.02]], 0.052, aluminum);

    this._cylinder(this.parts, 'Outlet neck', 0.075, 0.075, 0.22, [1.70, 1.16, 0], [0, 0, 0], aluminum, 24);
    this._cylinder(this.parts, 'Outlet union', 0.060, 0.060, 0.14, [1.70, 1.32, 0], [0, 0, 0], brass, 6);
    this._tube(this.parts, 'Outlet pipe', [[1.70, 1.38, 0], [1.70, 1.54, -0.02], [1.46, 1.62, -0.02], [1.28, 1.62, -0.02]], 0.046, aluminum);

    // Exploded view
    this._box(this.exploded, 'Exp left header', [0.26, 2.08, 0.40], [-2.25, 0, 0], aluminum);
    this._box(this.exploded, 'Exp core matrix', [3.0, 1.88, 0.28], [0, 0, 0], bright);
    this._box(this.exploded, 'Exp right header', [0.26, 2.08, 0.40], [2.25, 0, 0], aluminum);

    this._addLabel('Inlet Gas Panas (dari Kompresor)', [-1.65, 1.85, 0.2]);
    this._addLabel('Core Pipa Pipih & Sirip Aluminium', [0, 1.25, 0.3]);
    this._addLabel('Outlet Cairan (ke Receiver Drier)', [1.65, 1.85, 0.2]);
  }

  // ==========================================================================
  // 8. AC EVAPORATOR CORE (Ported from evaporator_ac_threejs)
  // ==========================================================================
  _buildAcEvaporatorModel() {
    const aluminum = this._mat(0xb9c4c9, 0.82, 0.26);
    const bright = this._mat(0xdce2e5, 0.90, 0.20);
    const darkAl = this._mat(0x7f8d93, 0.82, 0.30);
    const steel = this._mat(0x89979d, 0.88, 0.22);
    const brass = this._mat(0xc39a4c, 0.76, 0.25);

    const frame = this._box(this.parts, 'Evaporator frame', [2.35, 1.55, 0.72], [0, 0, 0], darkAl);
    this.shellMeshes.push({ mesh: frame, baseMat: darkAl });

    for (let i = 0; i < 42; i++) {
      const x = -1.04 + i * 0.05;
      this._box(this.parts, 'Evap fin', [0.016, 1.38, 0.78], [x, 0, 0], i % 2 === 0 ? bright : aluminum);
    }
    for (let row = 0; row < 9; row++) {
      const y = -0.60 + row * 0.15;
      this._cylinder(this.parts, 'Front tube', 0.035, 0.035, 2.22, [0, y, 0.30], [0, 0, Math.PI / 2], steel, 16);
      this._cylinder(this.parts, 'Rear tube', 0.035, 0.035, 2.22, [0, y, -0.30], [0, 0, Math.PI / 2], darkAl, 16);
    }
    for (const x of [-1.20, 1.20]) {
      this._box(this.parts, 'End plate', [0.12, 1.62, 0.82], [x, 0, 0], aluminum);
    }
    for (let i = 0; i < 8; i++) {
      const y1 = -0.60 + i * 0.15;
      const y2 = y1 + 0.15;
      this._tube(this.parts, 'U-bend R', [[1.26, y1, 0.30], [1.46, (y1 + y2) / 2, 0.30], [1.26, y2, 0.30]], 0.034, steel);
      this._tube(this.parts, 'U-bend L', [[-1.26, y1, -0.30], [-1.46, (y1 + y2) / 2, -0.30], [-1.26, y2, -0.30]], 0.034, aluminum);
    }
    this._tube(this.parts, 'Evap inlet', [[-1.20, -0.52, 0.28], [-1.44, -0.52, 0.28], [-1.58, -0.34, 0.28], [-1.58, -0.10, 0.28]], 0.072, aluminum);
    this._tube(this.parts, 'Evap outlet', [[-1.20, 0.52, -0.28], [-1.44, 0.52, -0.28], [-1.58, 0.34, -0.28], [-1.58, 0.10, -0.28]], 0.064, steel);
    this._cylinder(this.parts, 'Inlet collar', 0.09, 0.09, 0.12, [-1.58, -0.08, 0.28], [0, 0, 0], brass, 24);
    this._cylinder(this.parts, 'Outlet collar', 0.08, 0.08, 0.12, [-1.58, 0.08, -0.28], [0, 0, 0], brass, 24);
    this._box(this.parts, 'Top rail', [2.48, 0.07, 0.82], [0, 0.81, 0], steel);
    this._box(this.parts, 'Bottom rail', [2.48, 0.07, 0.82], [0, -0.81, 0], steel);

    // Exploded view
    this._box(this.exploded, 'Exp left plate', [0.12, 1.62, 0.82], [-1.75, 0, 0], aluminum);
    this._box(this.exploded, 'Exp core', [2.2, 1.48, 0.72], [0, 0, 0], bright);
    this._box(this.exploded, 'Exp right plate', [0.12, 1.62, 0.82], [1.75, 0, 0], aluminum);

    this._addLabel('Sirip Penyerap Panas Kabin', [0, 1.15, 0.25]);
    this._addLabel('Pipa Inlet (dari TXV) & Outlet', [-1.75, 0.65, 0.35]);
    this._addLabel('Tikungan Balik U-Bend', [1.65, 0.0, 0.35]);
  }

  // ==========================================================================
  // 9. AC BLOWER MOTOR & SQUIRREL-CAGE FAN (Ported from blower_motor_fan_ac_threejs_fixed)
  // ==========================================================================
  _buildAcBlowerModel() {
    const housing = this._mat(0x303b43, 0.35, 0.55);
    const plastic = this._mat(0x171f25, 0.15, 0.58);
    const metal = this._mat(0x9ba8b0, 0.82, 0.28);
    const copper = this._mat(0xb8793d, 0.78, 0.28);
    const blue = this._mat(0x267d9d, 0.45, 0.35);
    const darkHousing = this._mat(0x202a31, 0.45, 0.48);

    // Volute scroll casing + discharge duct
    const volute = this._cylinder(this.parts, 'Volute casing', 1.10, 1.10, 0.62, [-0.25, 0, 0], [Math.PI / 2, 0, 0], housing, 44);
    this.shellMeshes.push({ mesh: volute, baseMat: housing });
    this._cylinder(this.parts, 'Front rim', 0.92, 0.92, 0.08, [-0.25, 0, 0.34], [Math.PI / 2, 0, 0], plastic, 40);
    this._cylinder(this.parts, 'Rear rim', 0.92, 0.92, 0.08, [-0.25, 0, -0.34], [Math.PI / 2, 0, 0], plastic, 40);
    this._cylinder(this.parts, 'Intake ring', 0.70, 0.70, 0.08, [-0.25, 0, 0.40], [Math.PI / 2, 0, 0], metal, 36);
    this._box(this.parts, 'Outlet duct', [0.72, 0.62, 0.58], [0.52, 0.67, 0], housing);
    this._box(this.parts, 'Outlet collar', [0.48, 0.16, 0.48], [0.69, 1.00, 0], plastic);

    // Rear DC motor body + 12 cooling slots
    this._cylinder(this.parts, 'DC Motor cylinder', 0.42, 0.42, 0.82, [-0.25, 0, -0.72], [Math.PI / 2, 0, 0], metal, 32);
    this._cylinder(this.parts, 'Motor end cap', 0.35, 0.35, 0.12, [-0.25, 0, -1.16], [Math.PI / 2, 0, 0], plastic, 28);

    // Squirrel-cage impeller wheel (30 blades)
    this._cylinder(this.parts, 'Impeller rear ring', 0.53, 0.53, 0.09, [-0.25, 0, 0.90], [Math.PI / 2, 0, 0], metal, 32);
    this._cylinder(this.parts, 'Impeller front ring', 0.53, 0.53, 0.09, [-0.25, 0, 1.15], [Math.PI / 2, 0, 0], metal, 32);
    this._cylinder(this.parts, 'Shaft hub', 0.12, 0.12, 0.36, [-0.25, 0, 1.02], [Math.PI / 2, 0, 0], copper, 20);
    for (let i = 0; i < 30; i++) {
      const a = (i * Math.PI * 2) / 30;
      const b = this._box(this.parts, 'Blade', [0.08, 0.05, 0.30], [-0.25 + 0.49 * Math.cos(a), 0.49 * Math.sin(a), 1.02], metal);
      b.parent.rotation.z = a;
    }

    // Mounted top electrical terminal socket + harness
    this._box(this.parts, 'Terminal bracket', [0.42, 0.12, 0.38], [-0.25, 0.43, -0.88], darkHousing);
    this._box(this.parts, 'Terminal block', [0.34, 0.20, 0.30], [-0.25, 0.57, -0.88], plastic);
    this._box(this.parts, 'Socket insert', [0.23, 0.12, 0.055], [-0.25, 0.59, -1.045], blue);
    this._tube(this.parts, 'Motor harness', [[-0.25, 0.59, -1.08], [-0.25, 0.54, -1.24], [-0.25, 0.34, -1.32], [-0.25, 0.22, -1.28]], 0.042, plastic);

    // Exploded view
    this._cylinder(this.exploded, 'Exp motor', 0.42, 0.42, 0.82, [-0.25, 0, -1.25], [Math.PI / 2, 0, 0], metal, 32);
    this._cylinder(this.exploded, 'Exp volute', 1.08, 1.08, 0.62, [-0.25, 0, 0], [Math.PI / 2, 0, 0], housing, 36);
    this._cylinder(this.exploded, 'Exp squirrel cage', 0.54, 0.54, 0.38, [-0.25, 0, 1.35], [Math.PI / 2, 0, 0], metal, 32);

    this._addLabel('Impeller Kipas Squirrel-Cage', [-0.25, 0.85, 1.15]);
    this._addLabel('Corong Buang ke Evaporator', [0.95, 1.25, 0.1]);
    this._addLabel('Motor DC 12V & Soket Terminal', [-0.25, 0.95, -0.95]);
  }

  // ==========================================================================
  // 10. AC EXPANSION VALVE / TXV BLOK (Ported from katup_ekspansi_ac_threejs)
  // ==========================================================================
  _buildAcExpansionModel() {
    const metal = this._mat(0x9aa8b2, 0.80, 0.28);
    const darkMetal = this._mat(0x46545e, 0.80, 0.32);
    const brass = this._mat(0xc18a42, 0.80, 0.26);
    const steel = this._mat(0xd5dce1, 0.88, 0.20);
    const blue = this._mat(0x267d9d, 0.65, 0.28);

    const mainBlock = this._box(this.parts, 'TXV aluminum block', [1.65, 0.92, 1.18], [0, 0, 0], metal);
    this.shellMeshes.push({ mesh: mainBlock, baseMat: metal });
    this._box(this.parts, 'Lower plate', [1.35, 0.12, 0.92], [0, -0.48, 0], darkMetal);

    // Top diaphragm power head
    this._cylinder(this.parts, 'Diaphragm base', 0.49, 0.49, 0.28, [0, 0.64, 0], [0, 0, 0], darkMetal, 36);
    this._cylinder(this.parts, 'Diaphragm dome', 0.43, 0.43, 0.12, [0, 0.81, 0], [0, 0, 0], steel, 36);
    this._cylinder(this.parts, 'Upper cap', 0.32, 0.32, 0.10, [0, 0.91, 0], [0, 0, 0], metal, 32);
    this._cylinder(this.parts, 'Brass seal plug', 0.20, 0.20, 0.08, [0, 0.99, 0], [0, 0, 0], brass, 24);

    // Hex adjustment cap on +X
    this._cylinder(this.parts, 'Hex adjuster', 0.22, 0.22, 0.18, [0.88, 0.03, 0], [0, 0, Math.PI / 2], brass, 6);
    this._cylinder(this.parts, 'Adjuster pin', 0.11, 0.11, 0.12, [1.02, 0.03, 0], [0, 0, Math.PI / 2], steel, 20);

    // Front & Rear Refrigerant Ports
    for (const sz of [1, -1]) {
      this._cylinder(this.parts, 'Port brass', 0.24, 0.24, 0.32, [0, -0.03, sz * 0.72], [Math.PI / 2, 0, 0], brass, 28);
      this._cylinder(this.parts, 'Port collar', 0.17, 0.17, 0.10, [0, -0.03, sz * 0.91], [Math.PI / 2, 0, 0], blue, 24);
    }
    // Dual Side Ports (-X)
    for (const z of [-0.34, 0.34]) {
      this._cylinder(this.parts, 'Side port', 0.19, 0.19, 0.22, [-0.91, -0.13, z], [0, 0, Math.PI / 2], brass, 24);
      this._cylinder(this.parts, 'Side collar', 0.125, 0.125, 0.18, [-1.08, -0.13, z], [0, 0, Math.PI / 2], blue, 24);
      this._cylinder(this.parts, 'Side stub', 0.085, 0.085, 0.22, [-1.22, -0.13, z], [0, 0, Math.PI / 2], brass, 20);
    }
    // Flow arrow on side
    this._pipe(this.parts, 'Flow shaft', [-0.22, 0.08, 0.62], [0.22, 0.08, 0.62], 0.018, blue);
    this._pipe(this.parts, 'Flow tip1', [0.22, 0.08, 0.62], [0.12, 0.16, 0.62], 0.018, blue);
    this._pipe(this.parts, 'Flow tip2', [0.22, 0.08, 0.62], [0.12, 0.0, 0.62], 0.018, blue);

    // Exploded view
    this._cylinder(this.exploded, 'Exp diaphragm', 0.46, 0.46, 0.36, [0, 1.15, 0], [0, 0, 0], steel, 32);
    this._box(this.exploded, 'Exp valve block', [1.65, 0.92, 1.18], [0, 0, 0], metal);
    this._cylinder(this.exploded, 'Exp needle spring', 0.16, 0.16, 0.45, [0, -0.95, 0], [0, 0, 0], brass, 20);

    this._addLabel('Kepala Diafragma Pengindera Suhu', [0, 1.38, 0]);
    this._addLabel('Saluran Masuk (HP) & Keluar (LP)', [-1.35, 0.25, 0.35]);
    this._addLabel('Penyetel Bukaan Katup (Superheat)', [1.25, 0.35, 0]);
  }

  // ==========================================================================
  // 11. AC RECEIVER DRIER & SIGHT GLASS (Ported from receiver_drier_ac_threejs)
  // ==========================================================================
  _buildAcDrierModel() {
    const aluminum = this._mat(0xb8c2c7, 0.82, 0.26);
    const bright = this._mat(0xdce2e5, 0.90, 0.20);
    const darkAl = this._mat(0x78858b, 0.82, 0.30);
    const black = this._mat(0x171c20, 0.18, 0.42);
    const brass = this._mat(0xc39a4c, 0.78, 0.25);
    const steel = this._mat(0x89979d, 0.88, 0.22);
    const glass = this._glassMat(0x7dd3fc, 0.72);

    const can = this._cylinder(this.parts, 'Drier canister', 0.57, 0.57, 1.95, [0, 0, 0], [0, 0, 0], aluminum, 48);
    this.shellMeshes.push({ mesh: can, baseMat: aluminum });
    this._cylinder(this.parts, 'Upper cap', 0.585, 0.585, 0.15, [0, 0.99, 0], [0, 0, 0], darkAl, 48);
    this._cylinder(this.parts, 'Lower cap', 0.585, 0.585, 0.15, [0, -0.99, 0], [0, 0, 0], darkAl, 48);
    this._cylinder(this.parts, 'Top shoulder', 0.48, 0.57, 0.12, [0, 1.10, 0], [0, 0, 0], bright, 48);
    this._cylinder(this.parts, 'Bot shoulder', 0.57, 0.48, 0.12, [0, -1.10, 0], [0, 0, 0], bright, 48);

    // Inlet & Outlet Top Hex Unions
    for (const [dx, r] of [[-0.25, 0.125], [0.25, 0.105]]) {
      this._cylinder(this.parts, 'Port boss', r * 1.4, r * 1.4, 0.22, [dx, 1.23, 0], [0, 0, 0], darkAl, 28);
      this._cylinder(this.parts, 'Hex union', r, r, 0.14, [dx, 1.40, 0], [0, 0, 0], brass, 6);
      this._cylinder(this.parts, 'Pipe stub', r * 0.62, r * 0.62, 0.13, [dx, 1.52, 0], [0, 0, 0], steel, 24);
    }

    // Front Crystal Sight Glass Window
    this._cylinder(this.parts, 'Sight glass bezel', 0.19, 0.19, 0.10, [0.28, 0.32, 0.55], [Math.PI / 2, 0, 0], darkAl, 32);
    this._cylinder(this.parts, 'Sight glass lens', 0.145, 0.145, 0.04, [0.28, 0.32, 0.615], [Math.PI / 2, 0, 0], glass, 32);
    this._torus(this.parts, 'Sight glass ring', 0.16, 0.018, [0.28, 0.32, 0.64], [0, 0, 0], bright);

    // Bracket straps & lower service plug
    for (const sy of [-0.58, 0.58]) {
      this._torus(this.parts, 'Bracket strap', 0.59, 0.045, [0, sy, 0], [Math.PI / 2, 0, 0], black);
      for (const sx of [-0.64, 0.64]) {
        this._box(this.parts, 'Mounting ear', [0.20, 0.16, 0.18], [sx, sy, 0], darkAl);
      }
    }
    this._cylinder(this.parts, 'Service plug', 0.09, 0.09, 0.14, [0, -0.92, 0.56], [Math.PI / 2, 0, 0], brass, 20);

    // Exploded view (Top Ports | Desiccant Bag | Filter Screen | Canister)
    this._cylinder(this.exploded, 'Exp top cap', 0.58, 0.58, 0.25, [0, 1.25, 0], [0, 0, 0], darkAl, 36);
    this._cylinder(this.exploded, 'Exp desiccant', 0.36, 0.36, 0.72, [0, 0.35, 0], [0, 0, 0], bright, 28);
    this._cylinder(this.exploded, 'Exp canister', 0.56, 0.56, 1.15, [0, -0.75, 0], [0, 0, 0], aluminum, 36);

    this._addLabel('Fitting Inlet (Kondensor) & Outlet (TXV)', [0, 1.78, 0]);
    this._addLabel('Sight Glass (Kaca Intip Refrigeran)', [0.85, 0.45, 0.65]);
    this._addLabel('Tabung Desiccant & Filter', [-0.85, -0.25, 0.45]);
  }

  // ==========================================================================
  // 12. AC DUAL PRESSURE SWITCH (Ported from pressure_switch_ac_threejs)
  // ==========================================================================
  _buildAcPressureSwitchModel() {
    const steel = this._mat(0xaab5bc, 0.84, 0.24);
    const dark = this._mat(0x27333b, 0.48, 0.38);
    const black = this._mat(0x151d23, 0.20, 0.52);
    const brass = this._mat(0xc18a42, 0.80, 0.26);
    const blue = this._mat(0x267d9d, 0.48, 0.32);
    const red = this._mat(0xb74d43, 0.35, 0.40);

    // Threaded lower pressure port + O-ring + Hex nut
    this._cylinder(this.parts, 'Threaded port', 0.30, 0.30, 0.34, [0, -0.78, 0], [0, 0, 0], steel, 32);
    for (let i = 0; i < 7; i++) {
      this._torus(this.parts, 'Thread', 0.295, 0.017, [0, -0.91 + i * 0.045, 0], [Math.PI / 2, 0, 0], steel);
    }
    this._torus(this.parts, 'O-ring seal', 0.31, 0.035, [0, -0.68, 0], [Math.PI / 2, 0, 0], black);
    this._cylinder(this.parts, 'Brass shoulder', 0.39, 0.39, 0.16, [0, -0.55, 0], [0, 0, 0], brass, 32);
    this._cylinder(this.parts, 'Hex nut', 0.49, 0.49, 0.22, [0, -0.38, 0], [0, Math.PI / 6, 0], steel, 6);

    // Main cylindrical diaphragm housing
    const body = this._cylinder(this.parts, 'Switch housing', 0.43, 0.43, 0.56, [0, 0.24, 0], [0, 0, 0], dark, 40);
    this.shellMeshes.push({ mesh: body, baseMat: dark });
    this._cylinder(this.parts, 'Upper collar', 0.39, 0.39, 0.12, [0, 0.57, 0], [0, 0, 0], steel, 32);

    // Upper 2-pin electrical connector housing with visible brass terminal blades
    this._box(this.parts, 'Connector housing', [0.70, 0.50, 0.62], [0, 1.03, 0], black);
    this._box(this.parts, 'Socket recess', [0.56, 0.34, 0.09], [0, 1.04, 0.33], dark);
    this._box(this.parts, 'Blue seal insert', [0.40, 0.20, 0.045], [0, 1.04, 0.39], blue);
    for (const bx of [-0.13, 0.13]) {
      this._box(this.parts, 'Brass terminal blade', [0.055, 0.16, 0.04], [bx, 1.04, 0.43], brass);
    }
    for (let i = 0; i < 3; i++) {
      this._cylinder(this.parts, 'ID dot', 0.025, 0.025, 0.02, [-0.16 + i * 0.16, 1.30, 0.02], [0, 0, 0], red, 12);
    }

    // Exploded view
    this._box(this.exploded, 'Exp connector', [0.70, 0.50, 0.62], [0, 1.35, 0], black);
    this._cylinder(this.exploded, 'Exp body', 0.43, 0.43, 0.56, [0, 0.25, 0], [0, 0, 0], dark, 36);
    this._cylinder(this.exploded, 'Exp hex port', 0.46, 0.32, 0.65, [0, -0.85, 0], [0, 0, 0], steel, 6);

    this._addLabel('Konektor Elektrik 2-Pin (PS IN / PS OUT)', [0, 1.62, 0.2]);
    this._addLabel('Rumah Diafragma LP / HP Cut-Out', [0.95, 0.28, 0.2]);
    this._addLabel('Ulir Port Tekanan & Seal O-Ring', [0.85, -0.78, 0.2]);
  }

  // ==========================================================================
  // 13. AC BLOWER CONTROL & OUTLET PANEL (Ported from panel_blower_ac_trainer_threejs)
  // ==========================================================================
  _buildAcPanelModel() {
    const black = this._mat(0x171b1e, 0.18, 0.36);
    const plastic = this._mat(0x252a2e, 0.12, 0.42);
    const dark = this._mat(0x090c0e, 0.05, 0.70);
    const chrome = this._mat(0xb9c4c8, 0.88, 0.20);
    const silver = this._mat(0x89969c, 0.72, 0.28);
    const knobMat = this._mat(0x252b2e, 0.35, 0.28);

    // Dashboard HVAC Fascia body
    const fascia = this._box(this.parts, 'HVAC Fascia housing', [4.2, 1.28, 0.58], [0, 0, 0], black);
    this.shellMeshes.push({ mesh: fascia, baseMat: black });
    this._box(this.parts, 'Front bezel', [4.08, 1.16, 0.12], [0, 0.02, 0.31], plastic);
    this._box(this.parts, 'Lower trim', [3.95, 0.44, 0.045], [0, -0.32, 0.39], dark);

    // Center Dual Louver Air Vents
    for (const cx of [-0.62, 0.62]) {
      this._box(this.parts, 'Vent frame', [1.04, 0.56, 0.07], [cx, 0.26, 0.40], dark);
      for (let i = 0; i < 4; i++) {
        this._box(this.parts, 'Louver slat', [0.94, 0.024, 0.045], [cx, 0.06 + i * 0.13, 0.47], silver);
      }
      this._box(this.parts, 'Vent divider', [0.035, 0.52, 0.06], [cx, 0.26, 0.48], plastic);
      this._box(this.parts, 'Slider tab', [0.055, 0.12, 0.07], [cx - 0.34, 0.26, 0.52], chrome);
    }

    // Outer Circular Directional Air Outlets
    for (const ox of [-1.84, 1.84]) {
      this._cylinder(this.parts, 'Outlet bezel', 0.33, 0.33, 0.07, [ox, 0.16, 0.40], [Math.PI / 2, 0, 0], chrome, 32);
      this._cylinder(this.parts, 'Outlet cup', 0.29, 0.29, 0.08, [ox, 0.16, 0.45], [Math.PI / 2, 0, 0], dark, 32);
      this._torus(this.parts, 'Outlet ring', 0.26, 0.022, [ox, 0.16, 0.50], [0, 0, 0], chrome);
      this._box(this.parts, 'Vane V', [0.032, 0.39, 0.024], [ox, 0.16, 0.52], silver);
      this._box(this.parts, 'Vane H', [0.39, 0.032, 0.024], [ox, 0.16, 0.52], silver);
    }

    // Dual Rotary Control Knobs (Left: Blower Speed 0-1-2-3, Right: Thermostat Temp)
    for (const kx of [-1.30, 1.30]) {
      this._box(this.parts, 'Control plate', [0.32, 0.66, 0.06], [kx, 0.25, 0.41], black);
      this._cylinder(this.parts, 'Knob base', 0.10, 0.115, 0.11, [kx, 0.32, 0.50], [Math.PI / 2, 0, 0], chrome, 28);
      this._cylinder(this.parts, 'Knob cap', 0.075, 0.075, 0.07, [kx, 0.32, 0.57], [Math.PI / 2, 0, 0], knobMat, 28);
      this._box(this.parts, 'Switch indicator', [0.045, 0.09, 0.025], [kx, 0.09, 0.49], chrome);
    }

    // Exploded view
    this._box(this.exploded, 'Exp rear housing', [4.0, 1.15, 0.32], [0, 0, -0.55], plastic);
    this._box(this.exploded, 'Exp front fascia', [4.2, 1.28, 0.22], [0, 0, 0.35], black);
    for (const kx of [-1.30, 1.30]) {
      this._cylinder(this.exploded, 'Exp knob', 0.11, 0.11, 0.16, [kx, 0.32, 1.05], [Math.PI / 2, 0, 0], chrome, 24);
    }

    this._addLabel('Kisi Louver Udara Tengah (Evaporator)', [0, 0.96, 0.45]);
    this._addLabel('Kenop Blower (0-1-2-3)', [-1.30, -0.82, 0.45]);
    this._addLabel('Kenop Thermostat (Suhu)', [1.30, -0.82, 0.45]);
  }

  // ==========================================================================
  // MULTI-VIEW CAMERA PRESETS & INTERACTIVE CONTROLS
  // ==========================================================================
  setView(viewName) {
    const views = {
      front: { p: [0, 0, 5.7], u: [0, 1, 0], label: 'Tampak Depan (Front View)' },
      back: { p: [0, 0, -5.7], u: [0, 1, 0], label: 'Tampak Belakang (Rear View)' },
      left: { p: [-5.7, 0, 0], u: [0, 1, 0], label: 'Tampak Sisi Kiri (Left View)' },
      right: { p: [5.7, 0, 0], u: [0, 1, 0], label: 'Tampak Sisi Kanan (Right View)' },
      top: { p: [0, 5.7, 0], u: [0, 0, -1], label: 'Tampak Atas (Top View)' },
      bottom: { p: [0, -5.7, 0], u: [0, 0, 1], label: 'Tampak Bawah (Bottom View)' },
      perspective: { p: [3.6, 2.3, 5.6], u: [0, 1, 0], label: 'Tampilan Perspektif 3D Interaktif' },
    };
    const v = views[viewName] || views.perspective;
    this.camera.position.set(...v.p);
    this.camera.up.set(...v.u);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    if (this.onViewChange) {
      this.onViewChange(viewName, v.label);
    }
  }

  setScale(val) {
    this.scaleValue = Number(val) || 1;
    this.model.scale.setScalar(this.scaleValue);
  }

  setLensOpacity(val) {
    this.lensOpacity = Number(val) || 0.32;
    for (const m of this.glassMaterials) {
      m.opacity = this.lensOpacity;
    }
  }

  setExploded(checked) {
    this.isExploded = Boolean(checked);
    this._applyControlStates();
  }

  setWireframe(checked) {
    this.isWireframe = Boolean(checked);
    this._applyControlStates();
  }

  setLabelsVisible(checked) {
    this.showLabels = Boolean(checked);
    this._applyControlStates();
  }

  _applyControlStates() {
    this.parts.visible = !this.isExploded;
    this.exploded.visible = this.isExploded;
    this.labels.visible = this.showLabels && !this.isExploded;

    const wireMat = new THREE.MeshBasicMaterial({ color: 0x54c6f0, wireframe: true });
    for (const item of this.shellMeshes) {
      item.mesh.material = this.isWireframe ? wireMat : item.baseMat;
    }
  }

  open() {
    this.isOpen = true;
    this.resize();
    if (!this.animFrameId) {
      const loop = () => {
        if (!this.isOpen) {
          this.animFrameId = null;
          return;
        }
        this.animFrameId = requestAnimationFrame(loop);
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
      };
      this.animFrameId = requestAnimationFrame(loop);
    }
  }

  close() {
    this.isOpen = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resize() {
    if (!this.stage) return;
    const w = this.stage.clientWidth || 720;
    const h = this.stage.clientHeight || 500;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }
}
