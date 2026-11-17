import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const INSPECTOR_COMPONENTS = [
  {
    id: 'headlamp',
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.stage.appendChild(this.renderer.domElement);

    this.scene.add(new THREE.HemisphereLight(0xd9edff, 0x26313a, 2.15));
    const key = new THREE.DirectionalLight(0xffffff, 3.0);
    key.position.set(4, 6, 5);
    key.castShadow = true;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x8ccfff, 1.8);
    fill.position.set(-5, 2, 2);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffd6a0, 2.2);
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

  _glassMat(colorHex = 0xe6f2f5, opacity = 0.34) {
    const m = new THREE.MeshPhysicalMaterial({
      color: colorHex,
      metalness: 0,
      roughness: 0.12,
      transmission: 0.28,
      transparent: true,
      opacity,
      thickness: 0.025,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
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
    this._roundedBox(this.parts, 'Inner dark bezel', W * 0.91, H * 0.91, 0.045, 0.105, black, [0, 0, 0.6]);
    this._roundedBox(this.parts, 'Ribbed clear front lens', W * 0.89, H * 0.89, 0.035, 0.1, glass, [0, 0, 0.635]);

    this._roundedBox(this.parts, 'Reflector assembly', 1.58, 1.03, 0.15, 0.28, reflectorMat, [0, 0, 0.47]);
    const bowl = this._cylinder(
      this.parts,
      'Reflector central bowl',
      0.49,
      0.6,
      0.16,
      [0, 0, 0.38],
      [Math.PI / 2, 0, 0],
      reflectorMat,
      64
    );
    bowl.scale.set(1.28, 0.92, 1);
    this._sphere(this.parts, 'Reflector concave dish', 0.47, [0, 0, 0.475], reflectorMat, [1.34, 0.88, 0.18]);
    this._cylinder(this.parts, 'H4 bulb metal base', 0.15, 0.18, 0.27, [0, 0, 0.28], [Math.PI / 2, 0, 0], brass);
    this._sphere(this.parts, 'H4 bulb glass capsule', 0.085, [0, 0, 0.105], glass, [0.9, 0.9, 1.8]);
    this._cylinder(this.parts, 'H4 bulb retaining collar', 0.205, 0.205, 0.045, [0, 0, 0.37], [Math.PI / 2, 0, 0], chrome);
    this._torus(this.parts, 'Bulb retaining ring', 0.22, 0.018, [0, 0, 0.39], [0, 0, 0], brass);

    this._box(this.parts, 'Low beam shield', [0.28, 0.1, 0.035], [0, -0.08, 0.18], chrome);
    this._box(this.parts, 'Bulb support left', [0.025, 0.28, 0.035], [-0.2, 0, 0.24], brass);
    this._box(this.parts, 'Bulb support right', [0.025, 0.28, 0.035], [0.2, 0, 0.24], brass);

    for (let i = 0; i < 13; i++) {
      const y = -0.48 + i * 0.08;
      this._box(this.parts, 'Horizontal lens fluting', [1.62, 0.009, 0.009], [0, y, 0.665], lensLine);
    }
    for (let i = 0; i < 17; i++) {
      const x = -0.78 + i * 0.0975;
      this._box(this.parts, 'Vertical lens fluting', [0.008, 0.91, 0.008], [x, 0, 0.665], lensLine);
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
    this._cylinder(this.parts, 'Center 12V 410Hz cap', 0.5, 0.5, 0.06, [0.12, 0, 0.41], [Math.PI / 2, 0, 0], badgeMat, 32);

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
