import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  SCALE_CM_PER_UNIT,
  computePinDistanceCm,
  validateCableConnection,
} from '../core/cableEngine.js';

const PIN_COLOR_HEX = {
  red: 0xd93829,
  black: 0x1e2226,
  yellow: 0xe09f1f,
  blue: 0x2563eb,
};

const WIRE_COLOR_HEX = {
  red: 0xd93829,
  black: 0x23272b,
};

// Compact stack step for small banana plugs
const PLUG_STACK_STEP = 0.18;
const FLOOR_Y = -9.6;

// Map component types/IDs to the authentic uppercase Blue Header Labels seen on SMK Trainers
const BLUE_HEADER_TITLES = {
  headlamp: 'HEAD LAMP',
  lamp_amber: 'SIGN - TAIL LAMP',
  lamp_red_dual: 'SIGN - BRAKE - TAIL - REV LAMP',
  lamp_test: 'INTERIOR LAMP',
  indicator_cluster: 'INDICATOR LAMP',
  licence_lamp: 'LICENCE LAMP',
  horn: 'WIPER / HORN',
  relay_4p: 'RELAY',
  flasher: 'FLASHER',
  fuse_single: 'FUSE',
  fuse_dual: 'FUSE BLOCK',
  fuse_quad: 'FUSE BLOCK',
  ignition: 'IGNITION SWITCH',
  switch_combo: 'COMBINATION SWITCH',
  switch_hazard: 'HAZARD - SIGN',
  switch_push: 'SWITCH',
  switch_toggle: 'TAIL SWITCH',
  power_rail: 'BATTERY',
  junction_post: 'TERMINAL',
  relay_5p: 'RELAY 5-PIN (SPDT)',
  buzzer: '12V BUZZER CHIME',
  resistor_bank: 'RESISTOR BANK (OHM)',
  lamp_h4: 'H4 HALOGEN HEADLAMP',
  motor_small: '12V WASHER MOTOR',
  lamp_led: 'LED TEST DUAL',
  lamp_small: 'AUTOMOTIVE BULB',
  switch_blower_rotary: 'BLOWER SWITCH (0-1-2-3)',
  switch_ac_push: 'A/C SWITCH',
  thermostat_ac: 'THERMOSTAT (TEMP CONTROL)',
  pressure_switch_dual: 'DUAL PRESSURE SWITCH',
  resistor_blower: 'BLOWER RESISTOR',
  evaporator_unit: 'EVAPORATOR & BLOWER',
  magnetic_clutch: 'MAGNETIC CLUTCH 12V',
  condenser_fan: 'CONDENSER EXTRA FAN',
  manifold_gauge_unit: 'MANIFOLD GAUGE',
  digital_temp_unit: 'DIGITAL TEMPERATURE',
  motor_ac_drive: 'ENGINE DRIVE MOTOR',
};

export const ENVIRONMENT_PRESETS = [
  { id: 'kelas_tkr', label: 'Bengkel Kelas TKR' },
  { id: 'bengkel_mobil', label: 'Bengkel Mobil' },
  { id: 'polos_putih', label: 'Polos Putih' },
  { id: 'lapangan', label: 'Di Lapangan' },
];

export class TrainerScene3D {
  constructor({
    container,
    onPinClick,
    onPinHover,
    onComponentInteract,
    onComponentPressStart,
    onComponentPressEnd,
    onCableClick,
    onRightClickCancel,
  }) {
    this.container = container;
    this.onPinClick = onPinClick;
    this.onPinHover = onPinHover;
    this.onComponentInteract = onComponentInteract;
    this.onComponentPressStart = onComponentPressStart;
    this.onComponentPressEnd = onComponentPressEnd;
    this.onCableClick = onCableClick;
    this.onRightClickCancel = onRightClickCancel;

    this.module = null;
    this.pinMeshes = new Map(); // pinId -> Group
    this.pinSurfaceTags = new Map(); // pinId -> Mesh (3D surface-mounted label plate)
    this.componentGroups = new Map(); // compId -> Group
    this.componentVisuals = new Map(); // compId -> { emissiveMeshes, actuators, fuseMeshes, ... }
    this.cableMeshes = new Map(); // cableId -> Group
    this.lastCables = [];
    this.lastPinStackGetter = null;
    this.interactiveTargets = []; // Meshes for raycasting

    this.labelsVisible = true;
    this.explodedView = false;
    this.explodeProgress = 0;
    this.lastSyncedExplode = 0;
    this.wobbleAmount = 0.25;
    this.environmentPreset = 'kelas_tkr';
    // Classic SMK Trainer warm ivory/yellow board tone
    this.boardThemeHex = 0xf4f1e6;
    this.clockTime = 0;
    this.textureCache = new Map();

    this.previewGroup = new THREE.Group();
    this.sparkParticles = [];

    this._initThree();
    this._buildEnvironment(this.environmentPreset);
    this._buildStandFrame();
    this._bindEvents();
  }

  _initThree() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdce5df);

    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 240);
    this.camera.position.set(0, -2.6, 22.0);
    this.camera.up.set(0, 1, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.container.appendChild(this.renderer.domElement);

    // Keep hidden overlay node only for legacy DOM compatibility; all pin & component labels are 3D surface-mounted
    this.labelOverlay = document.createElement('div');
    this.labelOverlay.className = 'scene-label-overlay';
    this.labelOverlay.style.display = 'none';
    this.container.appendChild(this.labelOverlay);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, -1.6, 0.6);
    this.controls.minDistance = 6;
    this.controls.maxDistance = 44;
    // Prevent camera from going below the floor/trainer stand
    this.controls.minPolarAngle = Math.PI * 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.482;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    this.controls.panSpeed = 0.95;
    // Left Click + Drag pans screen left/right/up/down; Single Left Click wires pins; Middle Click rotates; Right Click cuts cables
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.ROTATE,
      RIGHT: null,
    };

    // Warm studio + workshop lighting
    this.ambientLight = new THREE.AmbientLight(0xfffcf5, 1.38);
    this.scene.add(this.ambientLight);

    this.keyLight = new THREE.DirectionalLight(0xfff7e8, 1.48);
    this.keyLight.position.set(10, 16, 22);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 1024;
    this.keyLight.shadow.mapSize.height = 1024;
    this.keyLight.shadow.camera.near = 2;
    this.keyLight.shadow.camera.far = 65;
    const d = 22;
    this.keyLight.shadow.camera.left = -d;
    this.keyLight.shadow.camera.right = d;
    this.keyLight.shadow.camera.top = d;
    this.keyLight.shadow.camera.bottom = -d;
    this.keyLight.shadow.bias = -0.0008;
    this.keyLight.shadow.normalBias = 0.04;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0xdbeafe, 0.6);
    this.rimLight.position.set(-14, -6, 12);
    this.scene.add(this.rimLight);

    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    this.environmentGroup = new THREE.Group();
    this.standGroup = new THREE.Group();
    this.componentsLayer = new THREE.Group();
    this.pinsLayer = new THREE.Group();
    this.cablesLayer = new THREE.Group();
    this.multimeterProbesGroup = new THREE.Group();
    this.effectsLayer = new THREE.Group();

    this.rootGroup.add(this.environmentGroup);
    this.rootGroup.add(this.standGroup);
    this.rootGroup.add(this.componentsLayer);
    this.rootGroup.add(this.pinsLayer);
    this.rootGroup.add(this.cablesLayer);
    this.rootGroup.add(this.multimeterProbesGroup);
    this.rootGroup.add(this.effectsLayer);
    this.rootGroup.add(this.previewGroup);

    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2();
    this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.85);
  }

  _addInkedOutline(mesh, color = 0x191917, opacity = 0.82) {
    if (!mesh || !mesh.geometry) return null;
    // Tier 3 Filter: Background room objects never need inked line segments
    if (this._isBuildingEnvironment) return null;
    if (mesh.userData && mesh.userData.noOutline) return null;

    // Tier 3 Filter: Skip microscopic mechanical details by naming pattern
    const name = (mesh.name || '').toLowerCase();
    if (
      name.includes('screw') ||
      name.includes('bolt') ||
      name.includes('baut') ||
      name.includes('nut') ||
      name.includes('mur') ||
      name.includes('blade') ||
      name.includes('pin') ||
      name.includes('cap') ||
      name.includes('filament') ||
      name.includes('bulb_glass') ||
      name.includes('needle') ||
      name.includes('port')
    ) {
      return null;
    }

    // Tier 3 Filter: Automatically skip sub-parts below 0.38 unit bounding radius
    if (!mesh.geometry.boundingSphere) {
      mesh.geometry.computeBoundingSphere();
    }
    const bs = mesh.geometry.boundingSphere;
    if (bs && bs.radius < 0.38) {
      return null;
    }

    const edges = new THREE.EdgesGeometry(mesh.geometry, 28);
    const lineMat = new THREE.LineBasicMaterial({
      color,
      transparent: opacity < 1,
      opacity,
      toneMapped: false,
    });
    const lines = new THREE.LineSegments(edges, lineMat);
    lines.name = 'inked_outline';
    // CRITICAL FOR 60 FPS: Disable raycasting on line segments to avoid pointer lag
    lines.raycast = () => {};
    lines.frustumCulled = true;
    mesh.add(lines);
    return lines;
  }

  // ============================================================================
  // 4 SELECTABLE 3D ROOM / ENVIRONMENT BACKGROUNDS + SOLID GROUND FLOOR
  // ============================================================================

  setEnvironmentPreset(presetId) {
    this.environmentPreset = presetId || 'kelas_tkr';
    this._buildEnvironment(this.environmentPreset);
  }

  _createFloorTileTexture(style = 'tkr') {
    const key = `floor_tex_${style}`;
    if (this.textureCache.has(key)) return this.textureCache.get(key);
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (style === 'tkr') {
      // SMK TKR Classroom ceramic tiles
      ctx.fillStyle = '#d6d3c9';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#b8b4a9';
      ctx.lineWidth = 4;
      for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
    } else if (style === 'workshop') {
      // Epoxy grey-blue automotive workshop floor
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 5;
      for (let i = 0; i <= 512; i += 128) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
    } else if (style === 'grass') {
      // Outdoor grass turf
      ctx.fillStyle = '#4d7c0f';
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 600; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#65a30d' : '#3f6212';
        ctx.fillRect((i * 73) % 512, (i * 139) % 512, 6, 6);
      }
    } else {
      // Clean white studio floor
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);
    this.textureCache.set(key, tex);
    return tex;
  }

  _buildEnvironment(presetId = 'kelas_tkr') {
    this._isBuildingEnvironment = true;
    while (this.environmentGroup.children.length > 0) {
      this.environmentGroup.remove(this.environmentGroup.children[0]);
    }
    this.scene.fog = null;

    const floorY = FLOOR_Y - 0.04;

    if (presetId === 'polos_putih') {
      // 1. POLOS PUTIH (Clean White Studio Room)
      this.scene.background = new THREE.Color(0xf8fafc);
      this.ambientLight.intensity = 1.48;
      this.keyLight.intensity = 1.35;

      const floorTex = this._createFloorTileTexture('white');
      const floorGeo = new THREE.PlaneGeometry(110, 110);
      floorGeo.rotateX(-Math.PI / 2);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: floorTex,
        roughness: 0.85,
        metalness: 0.02,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.set(0, floorY, 0);
      floor.receiveShadow = true;
      this.environmentGroup.add(floor);

      // Subtle studio platform pad directly under trainer stand
      const padGeo = new THREE.BoxGeometry(28, 0.08, 12);
      const padMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(0, floorY + 0.04, 1.4);
      pad.receiveShadow = true;
      this._addInkedOutline(pad, 0x94a3b8, 0.5);
      this.environmentGroup.add(pad);
      this._isBuildingEnvironment = false;
      return;
    }

    if (presetId === 'lapangan') {
      // 2. DI LAPANGAN (Outdoor Automotive Practice Yard & Grass Field)
      this.scene.background = new THREE.Color(0xbae6fd);
      this.scene.fog = new THREE.Fog(0xbae6fd, 48, 115);
      this.ambientLight.intensity = 1.5;
      this.keyLight.intensity = 1.65;

      // Wide green grass field
      const grassTex = this._createFloorTileTexture('grass');
      const grassGeo = new THREE.PlaneGeometry(160, 160);
      grassGeo.rotateX(-Math.PI / 2);
      const grassMat = new THREE.MeshStandardMaterial({
        color: 0x65a30d,
        map: grassTex,
        roughness: 0.9,
      });
      const grass = new THREE.Mesh(grassGeo, grassMat);
      grass.position.set(0, floorY - 0.02, 0);
      grass.receiveShadow = true;
      this.environmentGroup.add(grass);

      // Paved asphalt practice pad under the trainer stand
      const padGeo = new THREE.BoxGeometry(34, 0.12, 18);
      const padMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 });
      const pad = new THREE.Mesh(padGeo, padMat);
      pad.position.set(0, floorY + 0.04, 1.5);
      pad.receiveShadow = true;
      this._addInkedOutline(pad, 0x1e293b, 0.75);
      this.environmentGroup.add(pad);

      // Yellow safety border line on asphalt pad
      const lineGeo = new THREE.BoxGeometry(32.5, 0.13, 16.5);
      const lineEdges = new THREE.EdgesGeometry(lineGeo);
      const lineSeg = new THREE.LineSegments(
        lineEdges,
        new THREE.LineBasicMaterial({ color: 0xfacc15 })
      );
      lineSeg.position.set(0, floorY + 0.05, 1.5);
      this.environmentGroup.add(lineSeg);

      // 4 Orange traffic cones at the corners of the outdoor practice pad
      const coneMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.45 });
      const baseMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
      for (const [cx, cz] of [
        [-14.5, -5.5],
        [14.5, -5.5],
        [-14.5, 8.5],
        [14.5, 8.5],
      ]) {
        const cGroup = new THREE.Group();
        cGroup.position.set(cx, floorY + 0.1, cz);
        const cb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.9), baseMat);
        const cc = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.36, 1.15, 14), coneMat);
        cc.position.y = 0.62;
        this._addInkedOutline(cc);
        cGroup.add(cb, cc);
        this.environmentGroup.add(cGroup);
      }

      // Stylized trees around the field perimeter
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
      for (const [tx, tz] of [
        [-26, -18],
        [-12, -22],
        [14, -22],
        [28, -18],
      ]) {
        const tree = new THREE.Group();
        tree.position.set(tx, floorY, tz);
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 4.5, 10), trunkMat);
        trunk.position.y = 2.25;
        const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(2.8, 1), foliageMat);
        crown.position.y = 5.6;
        this._addInkedOutline(trunk);
        this._addInkedOutline(crown, 0x14532d, 0.5);
        tree.add(trunk, crown);
        this.environmentGroup.add(tree);
      }
      this._isBuildingEnvironment = false;
      return;
    }

    if (presetId === 'bengkel_mobil') {
      // 3. BENGKEL MOBIL (Automotive Service Workshop Room)
      this.scene.background = new THREE.Color(0xcbd5e1);
      this.ambientLight.intensity = 1.35;
      this.keyLight.intensity = 1.45;

      const floorTex = this._createFloorTileTexture('workshop');
      const floorGeo = new THREE.PlaneGeometry(80, 60);
      floorGeo.rotateX(-Math.PI / 2);
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        map: floorTex,
        roughness: 0.65,
        metalness: 0.1,
      });
      const floor = new THREE.Mesh(floorGeo, floorMat);
      floor.position.set(0, floorY, 0);
      floor.receiveShadow = true;
      this.environmentGroup.add(floor);

      // Yellow safety work-bay border around trainer stand
      const bayGeo = new THREE.PlaneGeometry(29, 12);
      bayGeo.rotateX(-Math.PI / 2);
      const bayMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
      const bay = new THREE.Mesh(bayGeo, bayMat);
      bay.position.set(0, floorY + 0.02, 1.5);
      bay.receiveShadow = true;
      this.environmentGroup.add(bay);

      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
      for (const [sx, sy, sw, sd] of [
        [0, -4.5, 29.2, 0.25],
        [0, 7.5, 29.2, 0.25],
        [-14.5, 1.5, 0.25, 12.2],
        [14.5, 1.5, 0.25, 12.2],
      ]) {
        const st = new THREE.Mesh(new THREE.PlaneGeometry(sw, sd).rotateX(-Math.PI / 2), stripeMat);
        st.position.set(sx, floorY + 0.03, sy);
        this.environmentGroup.add(st);
      }

      // Back & side workshop walls
      const backWallGeo = new THREE.BoxGeometry(72, 28, 0.6);
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
      const backWall = new THREE.Mesh(backWallGeo, wallMat);
      backWall.position.set(0, floorY + 14, -12.5);
      backWall.receiveShadow = true;
      this._addInkedOutline(backWall);
      this.environmentGroup.add(backWall);

      // Dark blue-grey lower wainscot stripe on back wall
      const wainGeo = new THREE.BoxGeometry(72, 6.5, 0.68);
      const wainMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.6 });
      const wain = new THREE.Mesh(wainGeo, wainMat);
      wain.position.set(0, floorY + 3.25, -12.48);
      this.environmentGroup.add(wain);

      // Workshop banner sign on back wall
      const sign = this._createBlueHeaderBadge('BENGKEL SERVIS KELISTRIKAN OTOMOTIF', 14.0, 1.4);
      sign.position.set(0, floorY + 18.5, -12.1);
      this.environmentGroup.add(sign);

      // Red Mechanic Tool Cabinet on the left side of the workshop
      const cabGroup = new THREE.Group();
      cabGroup.position.set(-18.5, floorY, -7.5);
      const cabBody = new THREE.Mesh(
        new THREE.BoxGeometry(4.2, 5.2, 2.4),
        new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.4, metalness: 0.3 })
      );
      cabBody.position.y = 2.6;
      this._addInkedOutline(cabBody);
      cabGroup.add(cabBody);
      for (let dIdx = 0; dIdx < 4; dIdx++) {
        const drw = new THREE.Mesh(
          new THREE.BoxGeometry(3.7, 0.85, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 })
        );
        drw.position.set(0, 1.0 + dIdx * 1.05, 1.22);
        this._addInkedOutline(drw);
        cabGroup.add(drw);
      }
      this.environmentGroup.add(cabGroup);

      // 2-Post Car Lift on the right side of the workshop
      const liftMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4, metalness: 0.35 });
      for (const lx of [16.5, 23.5]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.9, 11.5, 0.9), liftMat);
        post.position.set(lx, floorY + 5.75, -7.5);
        this._addInkedOutline(post);
        this.environmentGroup.add(post);
      }
      const crossBar = new THREE.Mesh(new THREE.BoxGeometry(7.9, 0.6, 0.9), liftMat);
      crossBar.position.set(20.0, floorY + 11.3, -7.5);
      this._addInkedOutline(crossBar);
      this.environmentGroup.add(crossBar);
      this._isBuildingEnvironment = false;
      return;
    }

    // 4. BENGKEL KELAS TKR (Default — Authentic Indonesian SMK TKR Lab Room like Photo 2)
    this.scene.background = new THREE.Color(0xdbe7df);
    this.ambientLight.intensity = 1.4;
    this.keyLight.intensity = 1.45;

    const floorTex = this._createFloorTileTexture('tkr');
    const floorGeo = new THREE.PlaneGeometry(76, 56);
    floorGeo.rotateX(-Math.PI / 2);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0xe7e5dc,
      map: floorTex,
      roughness: 0.72,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, floorY, 0);
    floor.receiveShadow = true;
    this.environmentGroup.add(floor);

    // Yellow safety practice zone border on classroom floor
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xeab308 });
    for (const [sx, sy, sw, sd] of [
      [0, -4.2, 28.0, 0.22],
      [0, 7.2, 28.0, 0.22],
      [-14.0, 1.5, 0.22, 11.6],
      [14.0, 1.5, 0.22, 11.6],
    ]) {
      const st = new THREE.Mesh(new THREE.PlaneGeometry(sw, sd).rotateX(-Math.PI / 2), stripeMat);
      st.position.set(sx, floorY + 0.02, sy);
      this.environmentGroup.add(st);
    }

    // Back wall of SMK TKR Lab (Warm cream upper wall + classic SMK green lower wall)
    const backWall = new THREE.Mesh(
      new THREE.BoxGeometry(70, 26, 0.6),
      new THREE.MeshStandardMaterial({ color: 0xf5f3eb, roughness: 0.82 })
    );
    backWall.position.set(0, floorY + 13, -11.5);
    backWall.receiveShadow = true;
    this._addInkedOutline(backWall);
    this.environmentGroup.add(backWall);

    const greenWainscot = new THREE.Mesh(
      new THREE.BoxGeometry(70, 6.8, 0.66),
      new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.68 })
    );
    greenWainscot.position.set(0, floorY + 3.4, -11.46);
    this._addInkedOutline(greenWainscot);
    this.environmentGroup.add(greenWainscot);

    // Classroom Whiteboard on the back wall
    const wbFrame = new THREE.Mesh(
      new THREE.BoxGeometry(15.5, 6.2, 0.22),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.5, roughness: 0.4 })
    );
    wbFrame.position.set(0, floorY + 15.2, -11.1);
    this._addInkedOutline(wbFrame);
    this.environmentGroup.add(wbFrame);

    const wbSurface = new THREE.Mesh(
      new THREE.BoxGeometry(14.9, 5.6, 0.26),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 })
    );
    wbSurface.position.set(0, floorY + 15.2, -11.08);
    this.environmentGroup.add(wbSurface);

    const labBanner = this._createBlueHeaderBadge(
      'LAB PRAKTIK TEKNIK KENDARAAN RINGAN (TKR)',
      13.5,
      1.15
    );
    labBanner.position.set(0, floorY + 19.4, -11.05);
    this.environmentGroup.add(labBanner);

    // Side wooden practice workbench in the TKR classroom
    const benchGroup = new THREE.Group();
    benchGroup.position.set(-18.5, floorY, -6.8);
    const benchTop = new THREE.Mesh(
      new THREE.BoxGeometry(5.5, 0.35, 3.2),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.65 })
    );
    benchTop.position.y = 3.2;
    this._addInkedOutline(benchTop);
    benchGroup.add(benchTop);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
    for (const [lx, lz] of [
      [-2.4, -1.3],
      [2.4, -1.3],
      [-2.4, 1.3],
      [2.4, 1.3],
    ]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3.2, 0.25), legMat);
      leg.position.set(lx, 1.6, lz);
      this._addInkedOutline(leg);
      benchGroup.add(leg);
    }
    this.environmentGroup.add(benchGroup);
    this._isBuildingEnvironment = false;
  }

  // ============================================================================
  // PROCEDURAL TEXTURES FOR AUTHENTIC SMK TRAINER HARDWARE & SILKSCREEN
  // ============================================================================

  _getFlutedLensTexture(style = 'headlamp') {
    const key = `fluted_${style}`;
    if (this.textureCache.has(key)) return this.textureCache.get(key);

    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    if (style === 'headlamp') {
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0, '#cfd8e3');
      grad.addColorStop(0.5, '#f1f5f9');
      grad.addColorStop(1, '#cbd5e1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);

      for (let x = 0; x < 256; x += 6) {
        ctx.fillStyle = x % 12 === 0 ? 'rgba(255,255,255,0.55)' : 'rgba(71,85,105,0.28)';
        ctx.fillRect(x, 4, 3, 120);
      }
      ctx.strokeStyle = 'rgba(51,65,85,0.35)';
      ctx.lineWidth = 2;
      for (const y of [32, 64, 96]) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(256, y);
        ctx.stroke();
      }
    } else if (style === 'amber') {
      const grad = ctx.createLinearGradient(0, 0, 256, 128);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(0.5, '#fbbf24');
      grad.addColorStop(1, '#d97706');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);

      for (let y = 0; y < 128; y += 8) {
        ctx.fillStyle = y % 16 === 0 ? 'rgba(255,255,255,0.35)' : 'rgba(120,53,15,0.3)';
        ctx.fillRect(0, y, 256, 4);
      }
    } else if (style === 'red') {
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0, '#dc2626');
      grad.addColorStop(0.5, '#ef4444');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);

      for (let x = 0; x < 256; x += 8) {
        ctx.fillStyle = x % 16 === 0 ? 'rgba(255,255,255,0.28)' : 'rgba(69,10,10,0.35)';
        ctx.fillRect(x, 0, 4, 128);
      }
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, 0, 256, 128);
      for (let x = 0; x < 256; x += 8) {
        ctx.fillStyle = x % 16 === 0 ? 'rgba(255,255,255,0.65)' : 'rgba(100,116,139,0.25)';
        ctx.fillRect(x, 0, 4, 128);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textureCache.set(key, tex);
    return tex;
  }

  _createBlueHeaderBadge(text, width = 1.8, height = 0.26) {
    const key = `badge_${text}`;
    let tex = this.textureCache.get(key);
    if (!tex && typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 80;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#1e40af';
        ctx.fillRect(0, 0, 512, 80);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.strokeRect(4, 4, 504, 72);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 34px "Plus Jakarta Sans", "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 42, 480);
      }
      tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.textureCache.set(key, tex);
    }

    const geo = new THREE.BoxGeometry(width, height, 0.04);
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tex || null,
      roughness: 0.35,
      metalness: 0.05,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this._addInkedOutline(mesh, 0x0f172a, 0.7);
    return mesh;
  }

  _getAcDiagramTexture() {
    const key = 'ac_refrigeration_diagram';
    if (this.textureCache.has(key)) return this.textureCache.get(key);
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 340);
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 6;
      ctx.strokeRect(4, 4, 504, 332);

      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('R134a REFRIGERATION CYCLE DIAGRAM', 256, 32);

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(110, 240);
      ctx.lineTo(110, 90);
      ctx.lineTo(256, 90);
      ctx.stroke();

      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(256, 130);
      ctx.lineTo(390, 130);
      ctx.lineTo(390, 220);
      ctx.stroke();

      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(350, 260);
      ctx.lineTo(130, 260);
      ctx.stroke();

      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 2.5;
      ctx.font = 'bold 13px "JetBrains Mono", monospace';

      ctx.fillRect(60, 220, 80, 60);
      ctx.strokeRect(60, 220, 80, 60);
      ctx.fillStyle = '#1e293b';
      ctx.fillText('COMPRESSOR', 100, 255);

      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(216, 70, 80, 60);
      ctx.strokeRect(216, 70, 80, 60);
      ctx.fillStyle = '#991b1b';
      ctx.fillText('CONDENSER', 256, 105);

      ctx.fillStyle = '#fffbeb';
      ctx.fillRect(360, 120, 60, 50);
      ctx.strokeRect(360, 120, 60, 50);
      ctx.fillStyle = '#92400e';
      ctx.fillText('DRIER', 390, 150);

      ctx.fillStyle = '#eff6ff';
      ctx.fillRect(330, 230, 90, 60);
      ctx.strokeRect(330, 230, 90, 60);
      ctx.fillStyle = '#1e40af';
      ctx.fillText('EVAPORATOR', 375, 265);

      ctx.font = '11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#dc2626';
      ctx.fillText('- High Pressure (Gas/Liquid)', 140, 318);
      ctx.fillStyle = '#2563eb';
      ctx.fillText('- Low Pressure (Gas)', 370, 318);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textureCache.set(key, tex);
    return tex;
  }

  _getGaugeDialTexture(isHigh = false) {
    const key = `gauge_dial_${isHigh ? 'high' : 'low'}`;
    if (this.textureCache.has(key)) return this.textureCache.get(key);
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = isHigh ? '#fff1f2' : '#f0f9ff';
      ctx.beginPath();
      ctx.arc(256, 256, 250, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isHigh ? '#b91c1c' : '#1d4ed8';
      ctx.lineWidth = 14;
      ctx.stroke();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(256, 256, 236, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = isHigh ? '#991b1b' : '#1e40af';
      ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(isHigh ? 'HIGH' : 'LOW', 256, 170);
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      ctx.fillStyle = '#475569';
      ctx.fillText('psi / bar', 256, 202);
      ctx.font = 'bold 18px "JetBrains Mono", monospace';
      ctx.fillText('R134a', 256, 320);

      const maxVal = isHigh ? 500 : 120;
      const stepVal = isHigh ? 50 : 10;
      const totalSteps = maxVal / stepVal;

      for (let i = 0; i <= totalSteps; i++) {
        const val = i * stepVal;
        const frac = i / totalSteps;
        const ang = (135 + frac * 270) * (Math.PI / 180);

        const rInner = i % 2 === 0 ? 195 : 210;
        const rOuter = 232;
        const x1 = 256 + Math.cos(ang) * rInner;
        const y1 = 256 + Math.sin(ang) * rInner;
        const x2 = 256 + Math.cos(ang) * rOuter;
        const y2 = 256 + Math.sin(ang) * rOuter;

        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = i % 2 === 0 ? 5 : 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        if (i % 2 === 0) {
          const rText = 168;
          const xt = 256 + Math.cos(ang) * rText;
          const yt = 256 + Math.sin(ang) * rText;
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 20px "JetBrains Mono", monospace';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(val), xt, yt);
        }
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textureCache.set(key, tex);
    return tex;
  }

  _getDigitalTempTexture(t1 = '31.5', t2 = '28.0', t3 = '7.5') {
    if (typeof document === 'undefined') return null;
    const key = `digital_temp_${t1}_${t2}_${t3}`;
    if (this._lastDigitalTempKey === key && this._digitalTempTexture) {
      return this._digitalTempTexture;
    }

    if (!this._digitalTempCanvas) {
      this._digitalTempCanvas = document.createElement('canvas');
      this._digitalTempCanvas.width = 512;
      this._digitalTempCanvas.height = 256;
      this._digitalTempTexture = new THREE.CanvasTexture(this._digitalTempCanvas);
      this._digitalTempTexture.colorSpace = THREE.SRGBColorSpace;
    }

    const ctx = this._digitalTempCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 512, 256);

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.strokeRect(4, 4, 504, 248);

      const displays = [
        { label: 'T1 AMBIENT', val: t1, x: 88, color: '#ef4444' },
        { label: 'T2 RETURN', val: t2, x: 256, color: '#f59e0b' },
        { label: 'T3 VENT OUT', val: t3, x: 424, color: '#38bdf8' },
      ];

      for (const d of displays) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = 'bold 15px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(d.label, d.x, 36);

        ctx.fillStyle = '#020617';
        ctx.fillRect(d.x - 70, 50, 140, 80);
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 3;
        ctx.strokeRect(d.x - 70, 50, 140, 80);

        ctx.fillStyle = d.color;
        ctx.font = 'bold 44px "JetBrains Mono", monospace';
        ctx.fillText(`${d.val}°C`, d.x, 108);

        ctx.font = '12px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Digital Sensor', d.x, 155);
      }
      this._digitalTempTexture.needsUpdate = true;
    }
    this._lastDigitalTempKey = key;
    return this._digitalTempTexture;
  }

  // Surface-mounted 3D pin terminal tag ("tertempel pada trainer, tidak mengambang")
  _getPinSurfaceTexture(label, color = 'red', stackCount = 0) {
    const key = `pintag_${label}_${color}_${stackCount}`;
    if (this.textureCache.has(key)) return this.textureCache.get(key);
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 84;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Crisp silkscreened tag background mounted on the board
      ctx.fillStyle = stackCount > 1 ? '#fef3c7' : '#ffffff';
      ctx.fillRect(0, 0, 256, 84);

      const borderHex =
        color === 'red'
          ? '#b91c1c'
          : color === 'blue'
            ? '#1d4ed8'
            : color === 'yellow'
              ? '#b45309'
              : '#1e293b';
      ctx.strokeStyle = borderHex;
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, 248, 76);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 42px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const display = stackCount > 1 ? `${label} ×${stackCount}` : label;
      ctx.fillText(display, 128, 44, 232);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textureCache.set(key, tex);
    return tex;
  }

  _createPinSurfaceTagMesh(pin, stackCount = 0) {
    const isBatteryPost = pin.terminalType === 'battery_post';
    const textLen = (pin.label || '').length;
    // Auto-clamped compact tag width so labels never overlap adjacent socket terminals
    const tagW = isBatteryPost ? 0.82 : Math.max(0.32, Math.min(0.44, 0.26 + textLen * 0.035));
    const tagH = isBatteryPost ? 0.28 : 0.16;

    const tex = this._getPinSurfaceTexture(pin.label, pin.color, stackCount);
    const geo = new THREE.BoxGeometry(tagW, tagH, 0.02);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: tex || null,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.visible = this.labelsVisible;

    if (isBatteryPost) {
      // Mounted flat on the top-front bevel of the battery cover right in front of the lead post
      mesh.position.set(0, 0.12, 0.38);
    } else {
      // Mounted flat on the component faceplate directly below the pin hole
      mesh.position.set(0, -0.175, 0.092);
    }
    mesh.userData = { pinId: pin.id, pinData: pin };
    return mesh;
  }

  _createBoardSchematicPlate(comp, w, h) {
    const key = `schem_v2_${comp.type}_${comp.id}`;
    let tex = this.textureCache.get(key);
    if (!tex && typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 384;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Warm white/ivory trainer cell card with red-maroon partition border (matching Gambar 2!)
        ctx.fillStyle = '#fcfbf7';
        ctx.fillRect(0, 0, 512, 384);

        // Maroon-red trainer cell partition border (like Gambar 2)
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, 504, 376);

        // Subtle bottom terminal strip guide line where the small pin sockets sit
        ctx.strokeStyle = 'rgba(153, 27, 27, 0.25)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(16, 306);
        ctx.lineTo(496, 306);
        ctx.stroke();

        // Draw schematic symbols in the middle-lower section above the bottom pin row
        ctx.strokeStyle = '#1e293b';
        ctx.fillStyle = '#1e293b';
        ctx.lineWidth = 3.2;
        ctx.font = 'bold 19px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';

        const drawBulbSymbol = (cx, cy, r = 20, label = '') => {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
          const d = r * 0.7;
          ctx.beginPath();
          ctx.moveTo(cx - d, cy - d);
          ctx.lineTo(cx + d, cy + d);
          ctx.moveTo(cx + d, cy - d);
          ctx.lineTo(cx - d, cy + d);
          ctx.stroke();
          if (label) ctx.fillText(label, cx, cy - r - 7);
        };

        if (comp.type === 'headlamp') {
          drawBulbSymbol(175, 265, 19, 'LO');
          drawBulbSymbol(256, 265, 19, 'HI');
          ctx.beginPath();
          ctx.moveTo(345, 248);
          ctx.lineTo(345, 280);
          ctx.moveTo(327, 280);
          ctx.lineTo(363, 280);
          ctx.moveTo(334, 288);
          ctx.lineTo(356, 288);
          ctx.stroke();
        } else if (comp.type === 'relay_4p') {
          ctx.strokeRect(145, 242, 84, 44);
          ctx.beginPath();
          ctx.moveTo(158, 286);
          ctx.lineTo(215, 242);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(295, 286);
          ctx.lineTo(295, 265);
          ctx.lineTo(342, 246);
          ctx.moveTo(352, 265);
          ctx.lineTo(352, 286);
          ctx.stroke();
        } else if (comp.type === 'flasher') {
          ctx.strokeRect(150, 244, 212, 46);
          ctx.fillText('B (49)   L (49a)   E (31)', 256, 273);
        } else if (comp.type === 'fuse_single' || comp.type === 'fuse_dual' || comp.type === 'fuse_quad') {
          ctx.beginPath();
          ctx.moveTo(130, 268);
          ctx.bezierCurveTo(200, 242, 312, 294, 382, 268);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(130, 268, 5, 0, Math.PI * 2);
          ctx.arc(382, 268, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (comp.type === 'switch_push' || comp.type === 'switch_toggle') {
          ctx.beginPath();
          ctx.moveTo(155, 272);
          ctx.lineTo(215, 272);
          ctx.lineTo(290, 245);
          ctx.moveTo(295, 272);
          ctx.lineTo(355, 272);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(215, 272, 5, 0, Math.PI * 2);
          ctx.arc(295, 272, 5, 0, Math.PI * 2);
          ctx.fill();
        } else if (comp.type === 'ignition') {
          ctx.beginPath();
          ctx.moveTo(160, 270);
          ctx.lineTo(235, 270);
          ctx.lineTo(315, 246);
          ctx.stroke();
        } else if (comp.type === 'lamp_red_dual') {
          // 4 Chambers (Gambar 4): SIGN, TAIL, STOP, REV + GND
          drawBulbSymbol(80, 268, 16, 'SIGN');
          drawBulbSymbol(165, 268, 16, 'TAIL');
          drawBulbSymbol(250, 268, 16, 'STOP');
          drawBulbSymbol(335, 268, 16, 'REV');
          ctx.beginPath();
          ctx.moveTo(420, 250);
          ctx.lineTo(420, 282);
          ctx.moveTo(402, 282);
          ctx.lineTo(438, 282);
          ctx.stroke();
        } else if (comp.type === 'licence_lamp') {
          // Licence Lamp (Gambar 1): LIC+ & GND
          drawBulbSymbol(190, 266, 20, 'LIC');
          ctx.beginPath();
          ctx.moveTo(320, 250);
          ctx.lineTo(320, 282);
          ctx.moveTo(302, 282);
          ctx.lineTo(338, 282);
          ctx.stroke();
        } else if (comp.type === 'lamp_amber' || comp.type === 'lamp_test') {
          drawBulbSymbol(210, 266, 20, '');
          ctx.beginPath();
          ctx.moveTo(310, 250);
          ctx.lineTo(310, 282);
          ctx.moveTo(292, 282);
          ctx.lineTo(328, 282);
          ctx.stroke();
        } else if (comp.type === 'horn') {
          ctx.beginPath();
          ctx.strokeRect(195, 250, 34, 30);
          ctx.moveTo(229, 254);
          ctx.lineTo(280, 238);
          ctx.lineTo(280, 292);
          ctx.lineTo(229, 276);
          ctx.closePath();
          ctx.stroke();
        } else if (comp.type === 'indicator_cluster') {
          // 3 Horizontal pilot lamps over 4 pins (TURN, TAIL, HI, GND)
          drawBulbSymbol(100, 268, 16, 'TURN');
          drawBulbSymbol(195, 268, 16, 'TAIL');
          drawBulbSymbol(290, 268, 16, 'HI');
          ctx.beginPath();
          ctx.moveTo(385, 250);
          ctx.lineTo(385, 282);
          ctx.moveTo(368, 282);
          ctx.lineTo(402, 282);
          ctx.stroke();
        } else if (comp.type === 'power_rail') {
          ctx.beginPath();
          ctx.moveTo(256, 238);
          ctx.lineTo(256, 258);
          ctx.moveTo(226, 258);
          ctx.lineTo(286, 258);
          ctx.moveTo(240, 270);
          ctx.lineTo(272, 270);
          ctx.moveTo(256, 270);
          ctx.lineTo(256, 290);
          ctx.stroke();
        } else if (comp.type === 'switch_blower_rotary') {
          ctx.beginPath();
          ctx.arc(256, 260, 24, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillText('0  1  2  3', 256, 230);
        } else if (comp.type === 'switch_ac_push') {
          ctx.strokeRect(216, 240, 80, 48);
          ctx.fillText('A/C', 256, 270);
        } else if (comp.type === 'thermostat_ac') {
          ctx.strokeRect(210, 242, 92, 44);
          ctx.fillText('TEMP', 256, 270);
        } else if (comp.type === 'pressure_switch_dual') {
          ctx.strokeRect(190, 244, 132, 42);
          ctx.fillText('LP / HP', 256, 272);
        } else if (comp.type === 'resistor_blower') {
          ctx.beginPath();
          ctx.moveTo(140, 266);
          for (let i = 0; i < 6; i++) {
            ctx.lineTo(160 + i * 36, i % 2 === 0 ? 250 : 282);
          }
          ctx.lineTo(376, 266);
          ctx.stroke();
          ctx.fillText('L   M   H', 256, 236);
        } else if (comp.type === 'evaporator_unit') {
          ctx.strokeRect(160, 240, 192, 48);
          ctx.fillText('BLOWER & EVAP', 256, 270);
        } else if (comp.type === 'magnetic_clutch') {
          ctx.beginPath();
          ctx.arc(256, 265, 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillText('CLUTCH', 256, 232);
        } else if (comp.type === 'condenser_fan') {
          ctx.beginPath();
          ctx.arc(256, 265, 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillText('FAN', 256, 232);
        } else if (comp.type === 'manifold_gauge_unit') {
          ctx.beginPath();
          ctx.arc(210, 265, 18, 0, Math.PI * 2);
          ctx.arc(302, 265, 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillText('LOW   HIGH', 256, 232);
        } else if (comp.type === 'digital_temp_unit') {
          ctx.strokeRect(170, 244, 172, 40);
          ctx.fillText('T1   T2   T3', 256, 270);
        } else if (comp.type === 'motor_ac_drive') {
          ctx.beginPath();
          ctx.arc(256, 265, 22, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillText('MOTOR M', 256, 272);
        }
      }
      tex = new THREE.CanvasTexture(canvas);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.textureCache.set(key, tex);
    }

    const plateGeo = new THREE.BoxGeometry(w, h, 0.08);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      map: tex || null,
      roughness: 0.72,
      metalness: 0.04,
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, 0, 0.04);
    plate.receiveShadow = true;
    this._addInkedOutline(plate, 0x7f1d1d, 0.75);
    return plate;
  }

  // ============================================================================
  // STAND FRAME, PANEL GRID & CASTER WHEELS (MATCHING PHOTOS 1-4 & GAMBAR 2)
  // ============================================================================

  _buildStandFrame(boardWidth = 21, boardHeight = 8.6) {
    while (this.standGroup.children.length > 0) {
      this.standGroup.remove(this.standGroup.children[0]);
    }

    const isAc = Boolean(this.module?.category?.includes('AC') || this.module?.id?.startsWith('ac'));

    // Yellow outer aluminum/steel frame (matching Gambar 2!) + Maroon-Red stand legs
    // or Anodized Silver Aluminum Extrusion for AC Trainer (matching Gambar 1!)
    const yellowFrameMat = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      roughness: 0.42,
      metalness: 0.25,
    });

    const standRedSteelMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      roughness: 0.48,
      metalness: 0.38,
    });

    const frameMat = isAc
      ? new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.28, metalness: 0.78 })
      : yellowFrameMat;

    const legMat = isAc
      ? new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.32, metalness: 0.75 })
      : standRedSteelMat;

    const boardMat = new THREE.MeshStandardMaterial({
      color: isAc ? 0xf3f4f6 : this.boardThemeHex,
      roughness: 0.78,
      metalness: 0.04,
    });
    this.boardMeshMaterial = boardMat;

    const boardCenterY = isAc ? 0.35 : (this.module?.id === 'fig06' ? 0.05 : 0.2);

    // Upper trainer board panel
    const boardGeo = new THREE.BoxGeometry(boardWidth, boardHeight, 0.45);
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.set(0, boardCenterY, 0.0);
    boardMesh.receiveShadow = true;
    boardMesh.castShadow = true;
    this._addInkedOutline(boardMesh, 0x181816, 0.9);
    this.standGroup.add(boardMesh);

    // Outer border frame around the trainer board
    const trimGeo = new THREE.BoxGeometry(boardWidth + 0.46, boardHeight + 0.46, 0.5);
    const trimBack = new THREE.Mesh(trimGeo, frameMat);
    trimBack.position.set(0, boardCenterY, -0.04);
    this._addInkedOutline(trimBack, 0x111111, 0.95);
    this.standGroup.add(trimBack);

    // Top main trainer header banner
    const bannerTitle = isAc
      ? 'AUTOMOTIVE AIR CONDITIONING SYSTEM TRAINER (R134a)'
      : 'AUTOMOTIVE BODY ELECTRICAL TRAINER';
    const mainBanner = this._createBlueHeaderBadge(
      bannerTitle,
      Math.min(13.5, boardWidth * (isAc ? 0.65 : 0.42)),
      0.32
    );
    mainBanner.position.set(0, boardCenterY + boardHeight / 2 + 0.14, 0.26);
    this.standGroup.add(mainBanner);

    // Schematic poster elevated on the upper header frame above the board (Opsi A)
    if (isAc) {
      const diagW = 4.2;
      const diagH = 1.3;
      const diagY = boardCenterY + boardHeight / 2 + 0.85;
      const diagX = -6.8;

      const diagramGroup = new THREE.Group();

      // Backing board plate with frame
      const backGeo = new THREE.BoxGeometry(diagW + 0.12, diagH + 0.12, 0.08);
      const backMesh = new THREE.Mesh(backGeo, frameMat);
      backMesh.position.set(diagX, diagY, 0.22);
      this._addInkedOutline(backMesh, 0x334155, 0.85);
      diagramGroup.add(backMesh);

      // Steel vertical mounting struts connecting to top frame trim
      for (const sx of [diagX - 1.5, diagX + 1.5]) {
        const strutGeo = new THREE.BoxGeometry(0.16, 0.45, 0.1);
        const strut = new THREE.Mesh(strutGeo, frameMat);
        strut.position.set(sx, boardCenterY + boardHeight / 2 + 0.22, 0.2);
        this._addInkedOutline(strut, 0x334155, 0.8);
        diagramGroup.add(strut);
      }

      // High-resolution diagram canvas texture
      const diagramGeo = new THREE.PlaneGeometry(diagW, diagH);
      const diagramMat = new THREE.MeshBasicMaterial({ map: this._getAcDiagramTexture() });
      const diagram = new THREE.Mesh(diagramGeo, diagramMat);
      diagram.position.set(diagX, diagY, 0.28);
      this._addInkedOutline(diagram, 0x1e3a8a, 0.85);
      diagramGroup.add(diagram);

      this.standGroup.add(diagramGroup);
    }

    // Stand geometry constants
    const isFig06 = Boolean(this.module?.id === 'fig06');
    const SHELF_TOP_Y = isFig06 ? -8.5 : -7.0;
    const SHELF_THICK = 0.35;
    const SHELF_DEPTH = 5.0;
    const SHELF_Z = 2.0;

    // Middle Tabletop Workbench Desk present on ALL trainers (Basic Electricity, Body, & AC)
    const tableThickness = 0.38;
    const tableY = isFig06 ? -5.84 : -3.8;
    const tableGeo = new THREE.BoxGeometry(boardWidth + 0.5, tableThickness, 4.4);
    const tableMat = new THREE.MeshStandardMaterial({
      color: isAc ? 0xcccccc : 0xd1d5db,
      roughness: 0.55,
      metalness: 0.1,
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, tableY, 1.8);
    table.receiveShadow = true;
    this._addInkedOutline(table, 0x334155, 0.8);
    this.standGroup.add(table);

    // Left & Right vertical steel pillars & wheeled trolley base
    const pillarX = boardWidth / 2 - 0.5;
    const pillarTop = boardCenterY;
    const pillarH = pillarTop - FLOOR_Y;
    for (const side of [-1, 1]) {
      const pillarGeo = new THREE.BoxGeometry(0.48, pillarH, 0.48);
      const pillar = new THREE.Mesh(pillarGeo, legMat);
      pillar.position.set(side * pillarX, FLOOR_Y + pillarH / 2, -0.55);
      pillar.castShadow = true;
      this._addInkedOutline(pillar);
      this.standGroup.add(pillar);

      const footGeo = new THREE.BoxGeometry(0.65, 0.45, SHELF_DEPTH + 1.4);
      const foot = new THREE.Mesh(footGeo, legMat);
      foot.position.set(side * pillarX, FLOOR_Y + 0.225, SHELF_Z - 0.3);
      foot.castShadow = true;
      this._addInkedOutline(foot);
      this.standGroup.add(foot);

      const armGeo = new THREE.BoxGeometry(0.38, 0.38, SHELF_DEPTH);
      const arm = new THREE.Mesh(armGeo, legMat);
      arm.position.set(side * pillarX, SHELF_TOP_Y - SHELF_THICK / 2, SHELF_Z);
      this._addInkedOutline(arm);
      this.standGroup.add(arm);

      for (const fz of [SHELF_Z - 2.2, SHELF_Z + 2.2]) {
        const wheelGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16);
        wheelGeo.rotateZ(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.position.set(side * pillarX, FLOOR_Y - 0.15, fz);
        this.standGroup.add(wheel);
      }
    }

    // Lower shelf board where the 12V Battery and 3D wire rack sit (top surface at Y = -7.0)
    const shelfGeo = new THREE.BoxGeometry(boardWidth + 0.4, SHELF_THICK, SHELF_DEPTH);
    const shelfMat = new THREE.MeshStandardMaterial({
      color: 0xd8ceb8,
      roughness: 0.78,
      metalness: 0.05,
    });
    const shelf = new THREE.Mesh(shelfGeo, shelfMat);
    shelf.position.set(0, SHELF_TOP_Y - SHELF_THICK / 2, SHELF_Z);
    shelf.receiveShadow = true;
    this._addInkedOutline(shelf);
    this.standGroup.add(shelf);

    const lipGeo = new THREE.BoxGeometry(boardWidth + 0.46, SHELF_THICK + 0.08, 0.18);
    const lip = new THREE.Mesh(lipGeo, frameMat);
    lip.position.set(0, SHELF_TOP_Y - SHELF_THICK / 2, SHELF_Z + SHELF_DEPTH / 2 + 0.04);
    this._addInkedOutline(lip);
    this.standGroup.add(lip);

    if (isAc) {
      // Build realistic physical refrigeration equipment on lower shelf
      this._buildAcRefrigerationEquipment(SHELF_TOP_Y);
    }

    // 3D wire storage rack standing on the right side of the shelf
    this._build3DWireRackOnShelf(Math.min(6.2, boardWidth * 0.28), SHELF_TOP_Y);

    // 3D Digital Multimeter unit sitting on the middle tabletop workbench
    const tableTopY = isFig06 ? -5.65 : -3.61;
    const mmX = isAc ? 7.8 : (isFig06 ? 1.5 : Math.min(6.8, boardWidth * 0.32));
    const mmZ = isAc ? 2.2 : 2.0;
    this._build3DMultimeterOnShelf(mmX, tableTopY, mmZ);
  }

  _buildAcRefrigerationEquipment(shelfTopY) {
    const equipGroup = new THREE.Group();

    const motorBlueMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.45, metalness: 0.3 });
    const compAlumMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.35, metalness: 0.65 });
    const pulleySteelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.3, metalness: 0.75 });
    const rubberBeltMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.6 });

    // 1. Electric Drive Motor (Blue cast casing with fins)
    const motorGroup = new THREE.Group();
    motorGroup.position.set(-5.5, shelfTopY + 1.25, 1.2);

    const motorBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 2.2, 24).rotateZ(Math.PI / 2),
      motorBlueMat
    );
    this._addInkedOutline(motorBody);
    motorGroup.add(motorBody);

    for (let i = -4; i <= 4; i++) {
      const rib = new THREE.Mesh(
        new THREE.CylinderGeometry(0.89, 0.89, 0.08, 24).rotateZ(Math.PI / 2),
        motorBlueMat
      );
      rib.position.x = i * 0.2;
      motorGroup.add(rib);
    }

    const termBox = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.8), motorBlueMat);
    termBox.position.set(0, 0.95, 0);
    this._addInkedOutline(termBox);
    motorGroup.add(termBox);

    const motorPulley = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.32, 24).rotateZ(Math.PI / 2),
      pulleySteelMat
    );
    motorPulley.position.set(1.3, 0, 0);
    this._addInkedOutline(motorPulley);
    motorGroup.add(motorPulley);
    this.acMotorPulley = motorPulley;

    equipGroup.add(motorGroup);

    // 2. A/C Compressor with Magnetic Clutch (Sanden/Denso style)
    const compGroup = new THREE.Group();
    compGroup.position.set(-0.8, shelfTopY + 1.15, 1.2);

    const compBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.72, 0.72, 1.8, 24).rotateZ(Math.PI / 2),
      compAlumMat
    );
    this._addInkedOutline(compBody);
    compGroup.add(compBody);

    const rearHead = new THREE.Mesh(
      new THREE.CylinderGeometry(0.68, 0.74, 0.4, 20).rotateZ(Math.PI / 2),
      compAlumMat
    );
    rearHead.position.set(-1.0, 0, 0);
    this._addInkedOutline(rearHead);
    compGroup.add(rearHead);

    for (const [pz, hex] of [[-0.25, 0x1d4ed8], [0.25, 0xef4444]]) {
      const port = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.35, 14),
        new THREE.MeshStandardMaterial({ color: hex, roughness: 0.35, metalness: 0.6 })
      );
      port.position.set(-1.0, 0.65, pz);
      this._addInkedOutline(port);
      compGroup.add(port);
    }

    const compPulley = new THREE.Mesh(
      new THREE.CylinderGeometry(0.65, 0.65, 0.32, 24).rotateZ(Math.PI / 2),
      pulleySteelMat
    );
    compPulley.position.set(1.05, 0, 0);
    this._addInkedOutline(compPulley);
    compGroup.add(compPulley);
    this.acCompressorPulley = compPulley;

    const clutchPlate = new THREE.Mesh(
      new THREE.CylinderGeometry(0.52, 0.52, 0.08, 20).rotateZ(Math.PI / 2),
      compAlumMat
    );
    clutchPlate.position.set(1.24, 0, 0);
    this._addInkedOutline(clutchPlate);
    compGroup.add(clutchPlate);
    this.acClutchPlate = clutchPlate;

    equipGroup.add(compGroup);

    // 3. V-Belt between motor pulley and compressor pulley
    const beltLen = 4.7;
    const beltGeo = new THREE.BoxGeometry(beltLen, 0.1, 0.22);
    const beltUpper = new THREE.Mesh(beltGeo, rubberBeltMat);
    beltUpper.position.set(-3.15, shelfTopY + 1.8, 1.2);
    const beltLower = new THREE.Mesh(beltGeo, rubberBeltMat);
    beltLower.position.set(-3.15, shelfTopY + 0.55, 1.2);
    equipGroup.add(beltUpper, beltLower);
    this.acBeltMesh = beltUpper;

    // 4. Condenser Radiator Matrix & Extra Fan on the right of lower shelf
    const condGroup = new THREE.Group();
    condGroup.position.set(6.2, shelfTopY + 1.85, 1.2);

    const condMatrix = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 3.4, 0.35),
      compAlumMat
    );
    this._addInkedOutline(condMatrix);
    condGroup.add(condMatrix);

    const shroud = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.35, 0.32, 28).rotateX(Math.PI / 2),
      blackMat
    );
    shroud.position.set(0, 0, 0.25);
    this._addInkedOutline(shroud);
    condGroup.add(shroud);

    const fanBlades = new THREE.Group();
    fanBlades.position.set(0, 0, 0.35);
    const fanHub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.18, 18).rotateX(Math.PI / 2),
      blackMat
    );
    fanBlades.add(fanHub);
    for (let b = 0; b < 5; b++) {
      const ang = (b * Math.PI * 2) / 5;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.28, 0.04), blackMat);
      blade.position.set(Math.cos(ang) * 0.65, Math.sin(ang) * 0.65, 0);
      blade.rotation.z = ang + 0.35;
      fanBlades.add(blade);
    }
    condGroup.add(fanBlades);
    this.acCondenserFan = fanBlades;

    equipGroup.add(condGroup);

    // 5. Receiver-Drier & Sight Glass
    const drierGroup = new THREE.Group();
    drierGroup.position.set(2.8, shelfTopY + 1.35, 1.2);
    const drierBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 1.9, 20),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.5, metalness: 0.3 })
    );
    this._addInkedOutline(drierBody);
    drierGroup.add(drierBody);

    const sg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.2, 14).rotateX(Math.PI / 2),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.8, roughness: 0.1, metalness: 0.1 })
    );
    sg.position.set(0, 0.75, 0.32);
    drierGroup.add(sg);

    equipGroup.add(drierGroup);

    // 6. Flexible SAE J2064 Hoses
    const hoseMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.85 });
    const h1Curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-1.8, shelfTopY + 1.8, 1.45),
      new THREE.Vector3(2.0, shelfTopY + 3.2, 1.5),
      new THREE.Vector3(4.4, shelfTopY + 3.0, 1.2)
    );
    const hose1 = new THREE.Mesh(new THREE.TubeGeometry(h1Curve, 20, 0.12, 8, false), hoseMat);
    equipGroup.add(hose1);

    const h2Curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(4.4, shelfTopY + 0.6, 1.2),
      new THREE.Vector3(3.6, shelfTopY + 0.4, 1.2),
      new THREE.Vector3(2.8, shelfTopY + 0.5, 1.2)
    );
    const hose2 = new THREE.Mesh(new THREE.TubeGeometry(h2Curve, 16, 0.1, 8, false), hoseMat);
    equipGroup.add(hose2);

    this.standGroup.add(equipGroup);
  }

  _build3DWireRackOnShelf(rackX, shelfTopY) {
    const rackGroup = new THREE.Group();
    rackGroup.position.set(rackX, shelfTopY, 0.9);

    const metalMat = new THREE.MeshStandardMaterial({ color: 0x3b4248, roughness: 0.5, metalness: 0.4 });
    const RACK_H = 1.85;

    for (const sx of [-2.8, 2.8]) {
      const legGeo = new THREE.BoxGeometry(0.18, RACK_H, 0.18);
      const leg = new THREE.Mesh(legGeo, metalMat);
      leg.position.set(sx, RACK_H / 2, 0);
      this._addInkedOutline(leg);
      rackGroup.add(leg);
    }
    const headerGeo = new THREE.BoxGeometry(5.8, 0.2, 0.45);
    const header = new THREE.Mesh(headerGeo, metalMat);
    header.position.set(0, RACK_H, 0);
    this._addInkedOutline(header);
    rackGroup.add(header);

    const lengths = [0.6, 0.8, 1.0, 1.25];
    lengths.forEach((len, idx) => {
      const slotX = -2.1 + idx * 1.4;
      for (const [cIdx, hex] of [0xd93829, 0x23272b].entries()) {
        const strandGeo = new THREE.CylinderGeometry(0.036, 0.036, len, 10);
        const strandMat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.5 });
        const strand = new THREE.Mesh(strandGeo, strandMat);
        strand.position.set(slotX + (cIdx === 0 ? -0.15 : 0.15), RACK_H - 0.1 - len / 2, 0.18);
        rackGroup.add(strand);
      }
    });

    this.standGroup.add(rackGroup);
  }

  _getMultimeterLcdTexture(reading = '0.00', unit = 'V', isNeg = false, beeping = false) {
    if (typeof document === 'undefined') return null;
    const key = `dmm_lcd_${reading}_${unit}_${isNeg}_${beeping}`;
    if (this._lastDmmLcdKey === key && this._dmmLcdTexture) {
      return this._dmmLcdTexture;
    }

    if (!this._dmmLcdCanvas) {
      this._dmmLcdCanvas = document.createElement('canvas');
      this._dmmLcdCanvas.width = 256;
      this._dmmLcdCanvas.height = 128;
      this._dmmLcdTexture = new THREE.CanvasTexture(this._dmmLcdCanvas);
      this._dmmLcdTexture.colorSpace = THREE.SRGBColorSpace;
    }

    const ctx = this._dmmLcdCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#b7cfb7';
      ctx.fillRect(0, 0, 256, 128);

      ctx.strokeStyle = '#8fa88f';
      ctx.lineWidth = 4;
      ctx.strokeRect(2, 2, 252, 124);

      ctx.fillStyle = '#1e2d1e';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      if (isNeg) ctx.fillText('-', 16, 26);
      if (beeping) ctx.fillText('•)))', 36, 26);
      ctx.fillText('AUTO', 190, 26);

      ctx.font = 'bold 52px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(reading, 192, 86);

      ctx.font = 'bold 26px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(unit, 200, 82);
      this._dmmLcdTexture.needsUpdate = true;
    }
    this._lastDmmLcdKey = key;
    return this._dmmLcdTexture;
  }

  _build3DMultimeterOnShelf(meterX, shelfTopY, meterZ = 1.05) {
    if (this.multimeter3DGroup) {
      this.standGroup.remove(this.multimeter3DGroup);
    }
    const dmm = new THREE.Group();
    dmm.position.set(meterX, shelfTopY + 1.25, meterZ);
    dmm.rotation.x = -0.22;

    // 1. Rugged Yellow Holster
    const holsterGeo = new THREE.BoxGeometry(1.48, 2.32, 0.58);
    const holsterMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5, metalness: 0.1 });
    const holster = new THREE.Mesh(holsterGeo, holsterMat);
    holster.castShadow = true;
    this._addInkedOutline(holster);
    dmm.add(holster);

    // 2. Dark Grey Meter Body
    const bodyGeo = new THREE.BoxGeometry(1.36, 2.2, 0.54);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.45 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(0, 0, 0.04);
    this._addInkedOutline(body);
    dmm.add(body);

    // 3. LCD Screen Panel
    const lcdTex = this._getMultimeterLcdTexture('0.00', 'V');
    const lcdGeo = new THREE.PlaneGeometry(1.12, 0.56);
    const lcdMat = new THREE.MeshBasicMaterial({ map: lcdTex });
    const lcd = new THREE.Mesh(lcdGeo, lcdMat);
    lcd.position.set(0, 0.62, 0.32);
    this._addInkedOutline(lcd, 0x111827, 0.85);
    dmm.add(lcd);
    this.multimeterLcdMesh = lcd;

    // 4. Rotary Function Dial Knob
    const dialGeo = new THREE.CylinderGeometry(0.32, 0.35, 0.16, 22);
    dialGeo.rotateX(Math.PI / 2);
    const dialMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3, metalness: 0.2 });
    const dial = new THREE.Mesh(dialGeo, dialMat);
    dial.position.set(0, -0.06, 0.34);
    this._addInkedOutline(dial);

    const notchGeo = new THREE.BoxGeometry(0.06, 0.22, 0.1);
    const notchMat = new THREE.MeshBasicMaterial({ color: 0xf8fafc });
    const notch = new THREE.Mesh(notchGeo, notchMat);
    notch.position.set(0, 0.12, 0.06);
    dial.add(notch);

    dmm.add(dial);
    this.multimeterDialMesh = dial;

    // 5. 4 Banana Input Ports on meter bottom face
    const portDefs = [
      { id: '10A', x: -0.42, color: 0xef4444 },
      { id: 'mA', x: -0.14, color: 0xef4444 },
      { id: 'COM', x: 0.14, color: 0x18181b },
      { id: 'V_OHM', x: 0.42, color: 0xd93829 },
    ];
    for (const p of portDefs) {
      const pGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.12, 14);
      pGeo.rotateX(Math.PI / 2);
      const pMat = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.4 });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(p.x, -0.76, 0.32);
      this._addInkedOutline(pMesh);
      dmm.add(pMesh);

      const bGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.14, 12);
      bGeo.rotateX(Math.PI / 2);
      const bMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
      const bMesh = new THREE.Mesh(bGeo, bMat);
      bMesh.position.set(p.x, -0.76, 0.34);
      dmm.add(bMesh);
    }

    this.standGroup.add(dmm);
    this.multimeter3DGroup = dmm;
  }

  // ============================================================================
  // MODULE LOADING & BESPOKE 3D AUTOMOTIVE COMPONENT HARDWARE BUILDERS
  // ============================================================================

  loadModule(moduleDef) {
    this.module = moduleDef;
    this.pinMeshes.clear();
    this.pinSurfaceTags.clear();
    this.componentGroups.clear();
    this.componentVisuals.clear();
    this.interactiveTargets = [];
    this.clearPreview();

    while (this.componentsLayer.children.length > 0) {
      this.componentsLayer.remove(this.componentsLayer.children[0]);
    }
    while (this.pinsLayer.children.length > 0) {
      this.pinsLayer.remove(this.pinsLayer.children[0]);
    }
    while (this.cablesLayer.children.length > 0) {
      this.cablesLayer.remove(this.cablesLayer.children[0]);
    }
    this.labelOverlay.innerHTML = '';

    const [bw, bh] = moduleDef.boardSize || [21, 8.6];
    this._buildStandFrame(bw, bh);

    // Build 3D components
    for (const comp of moduleDef.components || []) {
      const compGroup = this._createComponentMesh(comp);
      this.componentsLayer.add(compGroup);
      this.componentGroups.set(comp.id, compGroup);
    }

    // Build 3D pins (compact banana sockets & surface-mounted pin tags)
    for (const pin of moduleDef.pins || []) {
      const pinMesh = this._createPinSocketMesh(pin);
      this.pinsLayer.add(pinMesh);
      this.pinMeshes.set(pin.id, pinMesh);
    }

    this._buildTrainerAuxiliaryHardware(moduleDef);
    this.setCameraPreset('front');
    this.renderer.shadowMap.needsUpdate = true;
  }

  _buildTrainerAuxiliaryHardware(moduleDef) {
    this.auxVisuals = {
      pilotRed: null,
      pilotAmber: null,
      pilotBlue: null,
      licenceLens: null,
      wiperArm: null,
      wiperActive: false,
    };

    if (moduleDef.id === 'fig03') {
      const zBase = 0.45;
      const licGroup = new THREE.Group();
      licGroup.position.set(7.4, 0.0, zBase);
      licGroup.userData = { componentId: '__AUX_LICENCE__', baseZ: zBase, baseY: 0.0, type: 'aux' };

      const plate = this._createBoardSchematicPlate(
        { id: 'AUX_LIC', type: 'lamp_test', title: 'LICENCE LAMP' },
        2.2,
        1.75
      );
      licGroup.add(plate);

      const badge = this._createBlueHeaderBadge('LICENCE LAMP', 1.85, 0.22);
      badge.position.set(0, 0.68, 0.1);
      licGroup.add(badge);

      const hoodGeo = new THREE.CylinderGeometry(0.36, 0.42, 0.28, 18, 1, false, 0, Math.PI);
      hoodGeo.rotateZ(-Math.PI / 2);
      hoodGeo.rotateY(Math.PI / 2);
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8dee9, metalness: 0.85, roughness: 0.2 });
      const hood = new THREE.Mesh(hoodGeo, chromeMat);
      hood.position.set(0, 0.18, 0.18);
      this._addInkedOutline(hood);
      licGroup.add(hood);

      const lensGeo = new THREE.SphereGeometry(0.24, 14, 14);
      const lensMat = new THREE.MeshStandardMaterial({
        color: 0xcbd5e1,
        emissive: 0x000000,
        emissiveIntensity: 0,
        roughness: 0.22,
      });
      const lens = new THREE.Mesh(lensGeo, lensMat);
      lens.position.set(0, 0.12, 0.16);
      licGroup.add(lens);
      this.auxVisuals.licenceLens = lens;

      this.componentsLayer.add(licGroup);
      this.componentGroups.set('__AUX_LICENCE__', licGroup);
    }
  }

  _createRoundedBoxMesh(w, h, d, r, material, pos = [0, 0, 0]) {
    const rad = Math.min(r, w * 0.35, h * 0.35);
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
      bevelSegments: 1,
      steps: 1,
      bevelSize: Math.min(0.012, d * 0.15),
      bevelThickness: Math.min(0.012, d * 0.15),
      curveSegments: 4,
    });
    geo.center();
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(...pos);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    return mesh;
  }

  _getSnailHornBadgeTexture() {
    const key = 'snail_horn_12v_410hz';
    if (this.textureCache.has(key)) return this.textureCache.get(key);
    if (typeof document === 'undefined') return null;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#14171a';
      ctx.fillRect(0, 0, 256, 256);

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(128, 128, 112, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 46px "Plus Jakarta Sans", "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('12V', 128, 102);
      ctx.font = 'bold 40px "JetBrains Mono", monospace';
      ctx.fillText('410Hz', 128, 156);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.textureCache.set(key, tex);
    return tex;
  }

  _buildSingleHeadlampUnit(unitW, unitH, zBase, visuals, lowIndex = 0, highIndex = 1) {
    const unit = new THREE.Group();

    const blackMat = new THREE.MeshStandardMaterial({ color: 0x171b1e, metalness: 0.25, roughness: 0.32 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x292d30, metalness: 0.35, roughness: 0.3 });
    const rubberMat = new THREE.MeshStandardMaterial({ color: 0x101315, roughness: 0.82 });
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.88, roughness: 0.18 });
    const reflectorMat = new THREE.MeshStandardMaterial({ color: 0xdce2e5, metalness: 0.92, roughness: 0.14 });
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xc69a43, metalness: 0.78, roughness: 0.25 });
    const screwMat = new THREE.MeshStandardMaterial({ color: 0x8e999e, metalness: 0.8, roughness: 0.25 });

    // 1. Beveled main rear housing (≈ 200 x 140 x 120 mm proportion)
    const shell = this._createRoundedBoxMesh(
      unitW * 0.96,
      unitH * 0.94,
      0.26,
      0.11,
      blackMat,
      [0, 0, zBase + 0.13]
    );
    unit.add(shell);

    // 2. Rear H4 3-pin socket collar & brass terminals (visible in 3D orbit & Exploded view)
    const rearCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.21, 0.12, 20).rotateX(Math.PI / 2),
      blackMat
    );
    rearCollar.position.set(0, 0, zBase - 0.02);
    unit.add(rearCollar);

    const h4Plug = this._createRoundedBoxMesh(0.28, 0.2, 0.12, 0.03, darkMat, [0, -0.01, zBase - 0.1], 0x0f172a, 0.6);
    unit.add(h4Plug);

    for (const [bx, by] of [
      [-0.08, 0.03],
      [0.08, 0.03],
      [0, -0.05],
    ]) {
      const pinBlade = new THREE.Mesh(
        new THREE.BoxGeometry(0.025, 0.045, 0.06),
        brassMat
      );
      pinBlade.position.set(bx, by, zBase - 0.17);
      unit.add(pinBlade);
    }

    // 3. 4 Angled Mounting Ears (Tabs) with chrome bolt hole rims (matching reference photo!)
    const earPositions = [
      [-unitW * 0.35, unitH * 0.5, -0.1],
      [unitW * 0.35, unitH * 0.5, 0.1],
      [-unitW * 0.36, -unitH * 0.5, 0.1],
      [unitW * 0.36, -unitH * 0.5, -0.1],
    ];
    for (const [ex, ey, rotZ] of earPositions) {
      const earMesh = this._createRoundedBoxMesh(
        0.22,
        0.17,
        0.06,
        0.03,
        blackMat,
        [ex, ey, zBase + 0.18],
        0x0f172a,
        0.7
      );
      earMesh.rotation.z = rotZ;
      unit.add(earMesh);

      const holeRim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.052, 0.052, 0.02, 18).rotateX(Math.PI / 2),
        chromeMat
      );
      holeRim.position.set(ex, ey, zBase + 0.22);
      unit.add(holeRim);

      const holeBore = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.026, 16).rotateX(Math.PI / 2),
        blackMat
      );
      holeBore.position.set(ex, ey, zBase + 0.225);
      unit.add(holeBore);
    }

    // 4. Front rubber sealing gasket + Chrome front bezel + Perimeter screws
    const gasket = this._createRoundedBoxMesh(
      unitW * 0.98,
      unitH * 0.96,
      0.06,
      0.11,
      rubberMat,
      [0, 0, zBase + 0.27],
      0x0f172a,
      0.6
    );
    unit.add(gasket);

    const bezel = this._createRoundedBoxMesh(
      unitW,
      unitH,
      0.08,
      0.11,
      chromeMat,
      [0, 0, zBase + 0.33],
      0x334155,
      0.8
    );
    unit.add(bezel);

    for (const [sx, sy] of [
      [-unitW * 0.43, unitH * 0.38],
      [unitW * 0.43, unitH * 0.38],
      [-unitW * 0.43, -unitH * 0.38],
      [unitW * 0.43, -unitH * 0.38],
    ]) {
      const screw = new THREE.Mesh(
        new THREE.CylinderGeometry(0.024, 0.024, 0.025, 12).rotateX(Math.PI / 2),
        screwMat
      );
      screw.position.set(sx, sy, zBase + 0.38);
      unit.add(screw);
    }

    // 5. Parabolic Silver Reflector Bowl + H4 Bulb Capsule + Glare Shield inside
    const reflFrame = this._createRoundedBoxMesh(
      unitW * 0.86,
      unitH * 0.82,
      0.06,
      0.09,
      reflectorMat,
      [0, 0, zBase + 0.31],
      0x475569,
      0.4
    );
    unit.add(reflFrame);

    const bowl = new THREE.Mesh(
      new THREE.CylinderGeometry(unitH * 0.34, unitH * 0.42, 0.08, 20).rotateX(Math.PI / 2),
      reflectorMat
    );
    bowl.scale.set(1.28, 0.92, 1);
    bowl.position.set(0, 0, zBase + 0.33);
    unit.add(bowl);

    // 6. Fluted Glass Front Lens + Upper (LOW BEAM) & Lower (HIGH BEAM) Emissive Lens/Reflector Zones
    const flutedTex = this._getFlutedLensTexture('headlamp');
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      map: flutedTex,
      metalness: 0.25,
      roughness: 0.2,
      transparent: true,
      opacity: 0.36,
    });
    const glassLens = this._createRoundedBoxMesh(
      unitW * 0.88,
      unitH * 0.86,
      0.03,
      0.085,
      glassMat,
      [0, 0, zBase + 0.43]
    );
    unit.add(glassLens);

    // Upper (LOW BEAM) & Lower (HIGH BEAM) high-contrast emissive zones right on the front reflector/lens plane
    // Dark slate-metallic when OFF (#475569) -> vivid golden halogen (#facc15 / #fde047) when ON!
    const zoneW = unitW * 0.82;
    const zoneH = unitH * 0.39;
    const lowGlowMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      map: flutedTex,
      emissive: 0x000000,
      emissiveIntensity: 0,
      metalness: 0.3,
      roughness: 0.2,
    });
    const lowReflectorZone = new THREE.Mesh(new THREE.PlaneGeometry(zoneW, zoneH), lowGlowMat);
    lowReflectorZone.position.set(0, zoneH * 0.51, zBase + 0.452);
    unit.add(lowReflectorZone);
    visuals.emissiveMeshes.push({
      mesh: lowReflectorZone,
      color: 0xfacc15,
      idleColor: 0x475569,
      index: lowIndex,
    });

    const highGlowMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      map: flutedTex,
      emissive: 0x000000,
      emissiveIntensity: 0,
      metalness: 0.3,
      roughness: 0.2,
    });
    const highReflectorZone = new THREE.Mesh(new THREE.PlaneGeometry(zoneW, zoneH), highGlowMat);
    highReflectorZone.position.set(0, -zoneH * 0.51, zBase + 0.452);
    unit.add(highReflectorZone);
    visuals.emissiveMeshes.push({
      mesh: highReflectorZone,
      color: 0xfde047,
      idleColor: 0x475569,
      index: highIndex,
    });

    // Halogen beam flare ring around center bulb (lights up on LOW & expands/brightens on HIGH)
    const flareRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0,
    });
    const flareRing = new THREE.Mesh(new THREE.RingGeometry(0.11, 0.34, 24), flareRingMat);
    flareRing.position.set(0, 0, zBase + 0.468);
    unit.add(flareRing);
    if (!visuals.headlampFlares) visuals.headlampFlares = [];
    visuals.headlampFlares.push({ mesh: flareRing, lowIndex, highIndex });

    // H4 Bulb metal base, glowing halogen glass capsule, low-beam glare shield & brass filament supports
    const bulbBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.1, 14).rotateX(Math.PI / 2),
      brassMat
    );
    bulbBase.position.set(0, 0, zBase + 0.39);
    unit.add(bulbBase);

    const bulbCapsuleMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.1,
      metalness: 0.1,
    });
    const bulbCapsule = new THREE.Mesh(new THREE.SphereGeometry(0.095, 14, 12), bulbCapsuleMat);
    bulbCapsule.scale.set(1.0, 1.0, 1.55);
    bulbCapsule.position.set(0, 0, zBase + 0.475);
    unit.add(bulbCapsule);
    visuals.emissiveMeshes.push({
      mesh: bulbCapsule,
      color: 0xfef08a,
      idleColor: 0x64748b,
      index: lowIndex,
    });

    const glareShield = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.065, 0.03), chromeMat);
    glareShield.position.set(0, -0.06, zBase + 0.485);
    unit.add(glareShield);

    for (const sx of [-0.14, 0.14]) {
      const sup = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.025), brassMat);
      sup.position.set(sx, 0, zBase + 0.42);
      unit.add(sup);
    }

    const ribMat = new THREE.MeshStandardMaterial({
      color: 0xcbd5e1,
      metalness: 0.35,
      roughness: 0.22,
      transparent: true,
      opacity: 0.42,
    });
    const ribW = unitW * 0.82;
    const ribH = unitH * 0.8;
    for (let i = -2; i <= 2; i++) {
      const hRib = new THREE.Mesh(new THREE.BoxGeometry(ribW, 0.008, 0.008), ribMat);
      hRib.position.set(0, i * (ribH / 5), zBase + 0.462);
      unit.add(hRib);
    }
    for (let i = -3; i <= 3; i++) {
      const vRib = new THREE.Mesh(new THREE.BoxGeometry(0.007, ribH, 0.008), ribMat);
      vRib.position.set(i * (ribW / 7), 0, zBase + 0.462);
      unit.add(vRib);
    }

    return unit;
  }

  _buildVerticalAmberSignUnit(unitW, unitH, zBase, visuals, index = 0) {
    const unit = new THREE.Group();

    const housingGeo = new THREE.BoxGeometry(unitW, unitH, 0.22);
    const housingMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, roughness: 0.5, metalness: 0.3 });
    const housing = new THREE.Mesh(housingGeo, housingMat);
    housing.position.set(0, 0, zBase + 0.11);
    housing.castShadow = true;
    this._addInkedOutline(housing);
    unit.add(housing);

    // Clear fluted clearance housing + raised amber side turn block (exact match to Gambar 2 top corners!)
    const clearTex = this._getFlutedLensTexture('clear');
    const mainLensGeo = new THREE.BoxGeometry(unitW * 0.86, unitH * 0.88, 0.15);
    const mainLensMat = new THREE.MeshStandardMaterial({
      color: 0xd1d5db,
      map: clearTex,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.22,
    });
    const mainLens = new THREE.Mesh(mainLensGeo, mainLensMat);
    mainLens.position.set(0, 0, zBase + 0.24);
    this._addInkedOutline(mainLens, 0x475569, 0.7);
    unit.add(mainLens);

    const amberTex = this._getFlutedLensTexture('amber');
    const amberGeo = new THREE.BoxGeometry(unitW * 0.42, unitH * 0.44, 0.22);
    const amberMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      map: amberTex,
      emissive: 0x000000,
      emissiveIntensity: 0,
      roughness: 0.22,
    });
    const amberLens = new THREE.Mesh(amberGeo, amberMat);
    amberLens.position.set(-unitW * 0.2, unitH * 0.12, zBase + 0.28);
    this._addInkedOutline(amberLens, 0x78350f, 0.75);
    unit.add(amberLens);

    visuals.emissiveMeshes.push({
      mesh: amberLens,
      color: 0xf59e0b,
      idleColor: 0xd97706,
      index,
    });
    visuals.emissiveMeshes.push({
      mesh: mainLens,
      color: 0xfef08a,
      idleColor: 0xd1d5db,
      index,
    });

    return unit;
  }

  _createComponentMesh(comp) {
    const group = new THREE.Group();
    const [x, y, z] = comp.pos;
    const [w, h, d] = comp.size || [2.6, 2.0, 0.6];
    group.position.set(x, y, z);
    group.userData = { componentId: comp.id, baseX: x, baseY: y, baseZ: z, type: comp.type };

    const visuals = {
      emissiveMeshes: [],
      fuseMeshes: [],
      actuatorMesh: null,
      statusLed: null,
      hornDiscMesh: null,
      isHornEnergized: false,
    };

    // ==========================================================================
    // 1. 12V AUTOMOTIVE BATTERY (ACCU NS40ZL ON LOWER SHELF)
    // ==========================================================================
    if (comp.type === 'battery_12v') {
      const bodyH = h - 0.36;
      const bodyGeo = new THREE.BoxGeometry(w, bodyH, d);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e242b, roughness: 0.6 });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.position.set(0, -0.18, 0);
      body.castShadow = true;
      body.receiveShadow = true;
      this._addInkedOutline(body);
      group.add(body);

      // Surface-mounted front battery specification plate ("AKI 12V 45Ah")
      const batTex = this._getPinSurfaceTexture('AKI 12V 45Ah', 'yellow', 0);
      const plateGeo = new THREE.PlaneGeometry(w * 0.72, bodyH * 0.52);
      const plateMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, map: batTex });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(0, -0.18, d / 2 + 0.02);
      this._addInkedOutline(plate, 0x1e293b, 0.7);
      group.add(plate);

      // Crimson-red battery cover
      const lidH = 0.36;
      const lidGeo = new THREE.BoxGeometry(w + 0.08, lidH, d + 0.08);
      const lidMat = new THREE.MeshStandardMaterial({ color: 0xc92a2a, roughness: 0.45 });
      const lid = new THREE.Mesh(lidGeo, lidMat);
      lid.position.set(0, h / 2 - lidH / 2, 0);
      lid.castShadow = true;
      this._addInkedOutline(lid);
      group.add(lid);

      // 6 Yellow cell filler caps along the top cover
      for (let i = 0; i < 6; i++) {
        const capGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.14, 14);
        const capMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(-1.5 + i * 0.6, h / 2 + 0.07, -0.35);
        this._addInkedOutline(cap);
        group.add(cap);
      }

      const handleGeo = new THREE.BoxGeometry(w * 0.65, 0.08, 0.18);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.set(0, h / 2 + 0.14, 0.1);
      this._addInkedOutline(handle);
      group.add(handle);
    } else if (comp.variant === 'unified_slave') {
      // Slave half of unified Combination Switch (e.g., SW_TURN sharing the cell of SW_DIMMER in Fig. 06)
      if (this._pendingUnifiedRightStalk) {
        visuals.actuatorMesh = this._pendingUnifiedRightStalk;
        this._pendingUnifiedRightStalk = null;
      }
      this.componentVisuals.set(comp.id, visuals);
      return group;
    } else {
      // ========================================================================
      // 2. PRINTED SMK TRAINER CELL PLATE + SURFACE-MOUNTED BLUE HEADER LABEL
      // ========================================================================
      const schemPlate = this._createBoardSchematicPlate(comp, w, h);
      group.add(schemPlate);

      let headerText = BLUE_HEADER_TITLES[comp.type] || comp.title.toUpperCase();
      if (comp.variant === 'unified_master') headerText = 'COMBINATION SWITCH (DIMMER & TURN SIGNAL)';
      else if (comp.id === 'HORN_BTN') headerText = 'HORN SWITCH';
      else if (comp.id === 'SW_BRAKE') headerText = 'BRAKE SWITCH';
      else if (comp.id === 'SW_TURN') headerText = 'TURN SIGNAL';
      else if (comp.id === 'SW_DIMMER') headerText = 'HIGH - LOW BEAM';
      else if (comp.id === 'RLY_HORN') headerText = 'RELAY 1 (HORN)';
      else if (comp.id === 'RLY_LOW') headerText = 'RELAY 2 (LOW)';
      else if (comp.id === 'RLY_HIGH') headerText = 'RELAY 3 (HIGH)';
      else if (comp.id === 'SIGN_FRONT_LH' || comp.id === 'TURN_LAMPS') headerText = 'SIGN - TAIL LAMP';

      const headerBadge = this._createBlueHeaderBadge(
        headerText,
        Math.min(w * 0.86, comp.variant === 'unified_master' ? 5.4 : 2.8),
        0.21
      );
      headerBadge.position.set(0, h / 2 - 0.15, 0.095);
      group.add(headerBadge);

      const zBase = 0.08;
      // Position 3D hardware neatly between the top blue header badge and the bottom pin socket strip
      const hwY = 0.14;

      // ========================================================================
      // 3. TYPE-SPECIFIC REALISTIC 3D AUTOMOTIVE HARDWARE
      // ========================================================================
      if (comp.type === 'ignition') {
        const basePlateGeo = new THREE.CylinderGeometry(0.55, 0.62, 0.16, 22);
        basePlateGeo.rotateX(Math.PI / 2);
        const darkMetalMat = new THREE.MeshStandardMaterial({
          color: 0x374151,
          metalness: 0.65,
          roughness: 0.35,
        });
        const basePlate = new THREE.Mesh(basePlateGeo, darkMetalMat);
        basePlate.position.set(0, hwY, zBase + 0.08);
        this._addInkedOutline(basePlate);
        group.add(basePlate);

        const bezelGeo = new THREE.CylinderGeometry(0.42, 0.48, 0.32, 22);
        bezelGeo.rotateX(Math.PI / 2);
        const chromeMat = new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          metalness: 0.85,
          roughness: 0.2,
        });
        const bezel = new THREE.Mesh(bezelGeo, chromeMat);
        bezel.position.set(0, hwY, zBase + 0.24);
        this._addInkedOutline(bezel);
        group.add(bezel);

        const keyPivot = new THREE.Group();
        keyPivot.position.set(0, hwY, zBase + 0.42);

        const bladeGeo = new THREE.BoxGeometry(0.09, 0.22, 0.32);
        const blade = new THREE.Mesh(bladeGeo, chromeMat);
        blade.position.set(0, 0, 0.08);
        blade.userData = { interactComponentId: comp.id };
        this._addInkedOutline(blade);
        keyPivot.add(blade);

        const bowGeo = new THREE.BoxGeometry(0.14, 0.56, 0.36);
        const bowMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
        const bow = new THREE.Mesh(bowGeo, bowMat);
        bow.position.set(0, 0, 0.28);
        bow.userData = { interactComponentId: comp.id };
        this._addInkedOutline(bow);
        keyPivot.add(bow);

        group.add(keyPivot);
        this.interactiveTargets.push(blade, bow);
        visuals.actuatorMesh = keyPivot;
      } else if (comp.type === 'fuse_single' || comp.type === 'fuse_dual' || comp.type === 'fuse_quad') {
        const count = comp.type === 'fuse_quad' ? 4 : comp.type === 'fuse_dual' ? 2 : 1;
        const fuseColors = [0xef4444, 0x3b82f6, 0xeab308, 0x22c55e];

        for (let i = 0; i < count; i++) {
          // Arrange blade fuses horizontally in the upper-middle zone above the bottom pin row
          const offsetX =
            count === 1
              ? 0
              : count === 2
                ? (i === 0 ? -0.72 : 0.72)
                : -1.65 + i * 1.1;
          const offsetY = hwY + 0.06;

          const holderGeo = new THREE.BoxGeometry(0.88, 0.42, 0.24);
          const holderMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.65 });
          const holder = new THREE.Mesh(holderGeo, holderMat);
          holder.position.set(offsetX, offsetY, zBase + 0.12);
          holder.castShadow = true;
          this._addInkedOutline(holder);
          group.add(holder);

          const brassMat = new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.25 });
          for (const sx of [-0.34, 0.34]) {
            const clipGeo = new THREE.BoxGeometry(0.1, 0.24, 0.3);
            const clip = new THREE.Mesh(clipGeo, brassMat);
            clip.position.set(offsetX + sx, offsetY, zBase + 0.18);
            group.add(clip);
          }

          const fuseColor = fuseColors[i % fuseColors.length];
          const fuseGeo = new THREE.BoxGeometry(0.64, 0.3, 0.32);
          const fuseMat = new THREE.MeshStandardMaterial({
            color: fuseColor,
            transparent: true,
            opacity: 0.88,
            roughness: 0.22,
          });
          const fuse = new THREE.Mesh(fuseGeo, fuseMat);
          fuse.position.set(offsetX, offsetY, zBase + 0.32);
          fuse.userData = { baseColor: fuseColor };
          this._addInkedOutline(fuse);
          group.add(fuse);

          visuals.fuseMeshes.push(fuse);
        }
      } else if (comp.type === 'relay_4p' || comp.type === 'relay_5p') {
        const is5P = comp.type === 'relay_5p';
        const tabGeo = new THREE.BoxGeometry(0.5, 0.28, 0.06);
        const tabMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.28 });
        const tab = new THREE.Mesh(tabGeo, tabMat);
        tab.position.set(0, hwY + 0.34, zBase + 0.1);
        this._addInkedOutline(tab);
        group.add(tab);

        const sockGeo = new THREE.BoxGeometry(0.96, 0.34, 0.42);
        const sockMat = new THREE.MeshStandardMaterial({ color: is5P ? 0x1f2937 : 0xeab308, roughness: 0.42 });
        const sock = new THREE.Mesh(sockGeo, sockMat);
        sock.position.set(0, hwY - 0.18, zBase + 0.21);
        sock.castShadow = true;
        this._addInkedOutline(sock);
        group.add(sock);

        const cubeGeo = new THREE.BoxGeometry(0.92, 0.54, 0.52);
        const cubeMat = new THREE.MeshStandardMaterial({ color: is5P ? 0x1d4ed8 : 0x1f2937, roughness: 0.48 });
        const cube = new THREE.Mesh(cubeGeo, cubeMat);
        cube.position.set(0, hwY + 0.12, zBase + 0.26);
        cube.castShadow = true;
        this._addInkedOutline(cube);
        group.add(cube);

        const ledGeo = new THREE.SphereGeometry(0.11, 14, 14);
        const ledMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          emissive: 0x000000,
          roughness: 0.25,
        });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(0, hwY + 0.12, zBase + 0.54);
        this._addInkedOutline(led);
        group.add(led);
        visuals.statusLed = led;
      } else if (comp.type === 'flasher') {
        const brkGeo = new THREE.BoxGeometry(0.48, 0.3, 0.06);
        const brkMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.82, roughness: 0.25 });
        const brk = new THREE.Mesh(brkGeo, brkMat);
        brk.position.set(0, hwY + 0.36, zBase + 0.1);
        this._addInkedOutline(brk);
        group.add(brk);

        const bodyGeo = new THREE.BoxGeometry(0.92, 0.64, 0.52);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.45 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, hwY + 0.06, zBase + 0.26);
        body.castShadow = true;
        this._addInkedOutline(body);
        group.add(body);

        const ledGeo = new THREE.SphereGeometry(0.11, 14, 14);
        const ledMat = new THREE.MeshStandardMaterial({
          color: 0x334155,
          emissive: 0x000000,
          roughness: 0.25,
        });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(0, hwY + 0.08, zBase + 0.54);
        this._addInkedOutline(led);
        group.add(led);
        visuals.statusLed = led;
      } else if (comp.type === 'switch_combo') {
        // AUTHENTIC SWITCH UNIVERSAL (COMBINATION SWITCH ≈ 450-480 x 110 x 95 mm)
        // Central steering column housing + zinc plate + center steering shaft hole + both Left & Right stalks!
        const isUnified = comp.variant === 'unified_master';
        const bodyScale = isUnified ? 1.05 : 0.78;
        const blackPlasticMat = new THREE.MeshStandardMaterial({ color: 0x171b1e, roughness: 0.38, metalness: 0.2 });
        const zincPlateMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.78, roughness: 0.24 });
        const brassPinMat = new THREE.MeshStandardMaterial({ color: 0xc69a43, metalness: 0.75, roughness: 0.28 });
        const whitePlugMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.35 });

        // 1. Central black steering column switch housing
        const centerHousing = this._createRoundedBoxMesh(
          1.12 * bodyScale,
          0.76 * bodyScale,
          0.32,
          0.08,
          blackPlasticMat,
          [0, hwY + 0.04, zBase + 0.16]
        );
        group.add(centerHousing);

        // 2. Silver/zinc front contact plate on the central column body
        const zincPlate = this._createRoundedBoxMesh(
          0.84 * bodyScale,
          0.62 * bodyScale,
          0.05,
          0.05,
          zincPlateMat,
          [0, hwY + 0.04, zBase + 0.33]
        );
        group.add(zincPlate);

        // 3. Central steering shaft bore hole & brass slip-ring collar
        const boreRim = new THREE.Mesh(
          new THREE.CylinderGeometry(0.22 * bodyScale, 0.22 * bodyScale, 0.06, 24).rotateX(Math.PI / 2),
          brassPinMat
        );
        boreRim.position.set(0, hwY + 0.04, zBase + 0.35);
        group.add(boreRim);

        const boreHole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.16 * bodyScale, 0.16 * bodyScale, 0.08, 24).rotateX(Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0x090d11 })
        );
        boreHole.position.set(0, hwY + 0.04, zBase + 0.355);
        group.add(boreHole);

        // Top red hazard rocker tab on the steering column housing
        const topHazardTab = this._createRoundedBoxMesh(
          0.24 * bodyScale,
          0.11 * bodyScale,
          0.14,
          0.02,
          new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.35 }),
          [0, hwY + 0.44 * bodyScale, zBase + 0.22]
        );
        group.add(topHazardTab);

        // 4. White multi-pin connector plug & colored harness wires at bottom-right of central body
        const whiteConnector = this._createRoundedBoxMesh(
          0.38 * bodyScale,
          0.22 * bodyScale,
          0.16,
          0.03,
          whitePlugMat,
          [0.52 * bodyScale, hwY - 0.22 * bodyScale, zBase + 0.14],
          0x475569,
          0.65
        );
        whiteConnector.rotation.z = -0.25;
        group.add(whiteConnector);

        // Helper to build Left (-1) or Right (+1) Combination Switch Stalk
        const buildStalkAssembly = (dir, interactId) => {
          const stalkPivot = new THREE.Group();
          stalkPivot.position.set(dir * 0.48 * bodyScale, hwY + 0.04, zBase + 0.22);

          // Rubber accordion boot
          const bootGeo = new THREE.CylinderGeometry(0.12 * bodyScale, 0.15 * bodyScale, 0.22 * bodyScale, 16);
          bootGeo.rotateZ(-dir * (Math.PI / 2 - 0.12));
          const boot = new THREE.Mesh(
            bootGeo,
            new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.72 })
          );
          boot.position.set(dir * 0.1 * bodyScale, 0.01, 0);
          boot.userData = { interactComponentId: interactId };
          this._addInkedOutline(boot);
          stalkPivot.add(boot);

          // Tapered black stalk shaft
          const armLen = (isUnified ? 1.15 : 0.82);
          const armGeo = new THREE.CylinderGeometry(0.055 * bodyScale, 0.075 * bodyScale, armLen, 16);
          armGeo.rotateZ(-dir * (Math.PI / 2 - 0.14));
          const arm = new THREE.Mesh(armGeo, blackPlasticMat);
          arm.position.set(dir * (0.16 + armLen * 0.46), 0.07, 0.04);
          arm.userData = { interactComponentId: interactId };
          this._addInkedOutline(arm);
          stalkPivot.add(arm);

          // Rotary paddle tip at the outer end of the stalk
          const tipLen = isUnified ? 0.42 : 0.3;
          const tipGeo = new THREE.CylinderGeometry(0.095 * bodyScale, 0.072 * bodyScale, tipLen, 18);
          tipGeo.rotateZ(-dir * (Math.PI / 2 - 0.14));
          const tip = new THREE.Mesh(
            tipGeo,
            new THREE.MeshStandardMaterial({ color: 0x0f1419, roughness: 0.3 })
          );
          tip.position.set(dir * (0.16 + armLen + tipLen * 0.32), 0.15, 0.08);
          tip.userData = { interactComponentId: interactId };
          this._addInkedOutline(tip);
          stalkPivot.add(tip);

          // White silkscreened selector ring bands on the stalk tip
          const ringMat = new THREE.MeshBasicMaterial({ color: 0xe2e8f0 });
          for (const rOffset of [-0.06, 0.05]) {
            const ringGeo = new THREE.CylinderGeometry(0.098 * bodyScale, 0.098 * bodyScale, 0.018, 16);
            ringGeo.rotateZ(-dir * (Math.PI / 2 - 0.14));
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.set(dir * (0.16 + armLen + tipLen * 0.32 + rOffset), 0.15, 0.08);
            ring.userData = { interactComponentId: interactId };
            stalkPivot.add(ring);
          }

          group.add(stalkPivot);
          if (interactId) {
            this.interactiveTargets.push(boot, arm, tip);
          }
          return stalkPivot;
        };

        if (isUnified) {
          // Unified Dual-Stalk Combination Switch (Fig. 06): Left Stalk = SW_DIMMER, Right Stalk = SW_TURN
          const leftStalk = buildStalkAssembly(-1, 'SW_DIMMER');
          const rightStalk = buildStalkAssembly(1, 'SW_TURN');
          visuals.actuatorMesh = leftStalk;
          this._pendingUnifiedRightStalk = rightStalk;
        } else {
          // Single-switch module (Fig. 04 or Fig. 05): render both stalks on the real unit, animate the active one
          const isLeftActive = comp.id === 'SW_DIMMER';
          const leftStalk = buildStalkAssembly(-1, comp.id);
          const rightStalk = buildStalkAssembly(1, comp.id);
          visuals.actuatorMesh = isLeftActive ? leftStalk : rightStalk;
        }
      } else if (comp.type === 'switch_hazard') {
        const bezelGeo = new THREE.BoxGeometry(0.95, 0.58, 0.22);
        const bezelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
        const bezel = new THREE.Mesh(bezelGeo, bezelMat);
        bezel.position.set(0, hwY + 0.05, zBase + 0.11);
        this._addInkedOutline(bezel);
        group.add(bezel);

        const btnGeo = new THREE.BoxGeometry(0.72, 0.42, 0.28);
        const btnMat = new THREE.MeshStandardMaterial({
          color: 0xdc2626,
          emissive: 0x000000,
          roughness: 0.35,
        });
        const btn = new THREE.Mesh(btnGeo, btnMat);
        btn.position.set(0, hwY + 0.05, zBase + 0.28);
        btn.userData = { interactComponentId: comp.id, baseZ: zBase + 0.28 };
        this._addInkedOutline(btn);
        group.add(btn);

        const triGeo = new THREE.CircleGeometry(0.14, 3);
        triGeo.rotateZ(Math.PI / 2);
        const triMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const tri = new THREE.Mesh(triGeo, triMat);
        tri.position.set(0, 0, 0.15);
        tri.userData = { interactComponentId: comp.id };
        btn.add(tri);

        this.interactiveTargets.push(btn, tri);
        visuals.actuatorMesh = btn;
      } else if (comp.type === 'switch_push' || comp.type === 'switch_toggle') {
        const collarGeo = new THREE.CylinderGeometry(0.38, 0.44, 0.18, 20);
        collarGeo.rotateX(Math.PI / 2);
        const collarMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          metalness: 0.75,
          roughness: 0.28,
        });
        const collar = new THREE.Mesh(collarGeo, collarMat);
        collar.position.set(0, hwY + 0.05, zBase + 0.09);
        this._addInkedOutline(collar);
        group.add(collar);

        const isBrake = comp.id === 'SW_BRAKE';
        const isToggle = comp.type === 'switch_toggle';
        const capColor = isBrake ? 0xdc2626 : isToggle ? 0xeab308 : 0x1e293b;

        const btnGeo = isToggle
          ? new THREE.CylinderGeometry(0.14, 0.2, 0.4, 16)
          : new THREE.CylinderGeometry(0.28, 0.3, 0.28, 20);
        btnGeo.rotateX(Math.PI / 2);
        const btnMat = new THREE.MeshStandardMaterial({
          color: capColor,
          roughness: 0.38,
          metalness: isToggle ? 0.35 : 0.1,
        });
        const btn = new THREE.Mesh(btnGeo, btnMat);
        btn.position.set(0, hwY + 0.05, zBase + 0.26);
        btn.userData = { interactComponentId: comp.id, baseZ: zBase + 0.26 };
        this._addInkedOutline(btn);
        group.add(btn);
        this.interactiveTargets.push(btn);
        visuals.actuatorMesh = btn;
      } else if (comp.type === 'horn') {
        // AUTHENTIC KLAKSON KEONG (SNAIL HORN 12V 410Hz, ≈ 90 x 85 x 75 mm, matching reference photo!)
        const snailGroup = new THREE.Group();
        snailGroup.position.set(0.06, hwY + 0.02, zBase);

        const blackShellMat = new THREE.MeshStandardMaterial({
          color: 0x14171a,
          roughness: 0.34,
          metalness: 0.25,
        });
        const bracketMat = new THREE.MeshStandardMaterial({
          color: 0x1e242b,
          roughness: 0.42,
          metalness: 0.55,
        });
        const brassMat = new THREE.MeshStandardMaterial({
          color: 0xc69a43,
          metalness: 0.8,
          roughness: 0.25,
        });

        // 1. Top-right perforated steel mounting bracket (matching reference photo!)
        const bracket = this._createRoundedBoxMesh(
          0.26,
          0.52,
          0.06,
          0.05,
          bracketMat,
          [0.24, 0.38, 0.08],
          0x0f172a,
          0.75
        );
        snailGroup.add(bracket);

        const bracketHole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.055, 0.055, 0.08, 16).rotateX(Math.PI / 2),
          new THREE.MeshBasicMaterial({ color: 0xfcfbf7 })
        );
        bracketHole.position.set(0.24, 0.52, 0.08);
        snailGroup.add(bracketHole);

        // 2. Round acoustic snail body + spiral torus scroll
        const mainDrum = new THREE.Mesh(
          new THREE.CylinderGeometry(0.48, 0.52, 0.28, 28).rotateX(Math.PI / 2),
          blackShellMat
        );
        mainDrum.position.set(0.06, 0.02, 0.18);
        mainDrum.castShadow = true;
        this._addInkedOutline(mainDrum);
        snailGroup.add(mainDrum);

        const spiralRing = new THREE.Mesh(
          new THREE.TorusGeometry(0.36, 0.13, 14, 32),
          blackShellMat
        );
        spiralRing.position.set(0.06, 0.02, 0.25);
        snailGroup.add(spiralRing);

        // Perimeter brass screws on rear flange
        for (let a = 0; a < 6; a++) {
          const ang = (a * Math.PI) / 3;
          const screw = new THREE.Mesh(
            new THREE.CylinderGeometry(0.024, 0.024, 0.04, 10).rotateX(Math.PI / 2),
            brassMat
          );
          screw.position.set(0.06 + Math.cos(ang) * 0.45, 0.02 + Math.sin(ang) * 0.45, 0.16);
          snailGroup.add(screw);
        }

        // 3. Flared acoustic trumpet mouth pointing bottom-left (exact match to photo!)
        const mouthGroup = new THREE.Group();
        mouthGroup.position.set(-0.28, -0.18, 0.24);
        mouthGroup.rotation.z = 0.52;
        mouthGroup.rotation.x = 0.22;

        const flareCone = new THREE.Mesh(
          new THREE.CylinderGeometry(0.32, 0.17, 0.36, 24),
          blackShellMat
        );
        this._addInkedOutline(flareCone);
        mouthGroup.add(flareCone);

        const throat = new THREE.Mesh(
          new THREE.CylinderGeometry(0.27, 0.13, 0.37, 20),
          new THREE.MeshBasicMaterial({ color: 0x090b0d })
        );
        throat.position.y = 0.01;
        mouthGroup.add(throat);

        snailGroup.add(mouthGroup);

        // 4. Center circular specification badge ("12V 410Hz") on front hub
        const badgeTex = this._getSnailHornBadgeTexture();
        const centerHubMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: badgeTex || null,
          emissive: 0x000000,
          emissiveIntensity: 0,
          roughness: 0.3,
          metalness: 0.2,
        });
        const centerHub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.28, 0.28, 0.05, 24).rotateX(Math.PI / 2),
          centerHubMat
        );
        centerHub.position.set(0.06, 0.02, 0.34);
        this._addInkedOutline(centerHub, 0x334155, 0.75);
        snailGroup.add(centerHub);

        group.add(snailGroup);

        visuals.emissiveMeshes.push({
          mesh: centerHub,
          color: 0x38bdf8,
          idleColor: 0xffffff,
          index: 0,
        });
        visuals.hornDiscMesh = centerHub;
      } else if (comp.type === 'headlamp') {
        const singleUnit = this._buildSingleHeadlampUnit(w * 0.78, h * 0.46, zBase, visuals, 0, 1);
        singleUnit.position.set(0, hwY + 0.06, 0);
        group.add(singleUnit);
      } else if (comp.type === 'lamp_amber') {
        const singleAmber = this._buildVerticalAmberSignUnit(1.05, 0.96, zBase, visuals, 0);
        singleAmber.position.set(0, hwY + 0.06, 0);
        group.add(singleAmber);
      } else if (comp.type === 'lamp_red_dual') {
        // AUTHENTIC TAIL LAMP ASSEMBLY (Lampu Sein / Kota / Rem ≈ 340 x 95 x 70 mm)
        // Beveled 3-chamber horizontal housing (Amber | Wide Red Tail/Stop | Clear Reverse) + 4 divider screws
        const lampW = Math.min(w * 0.84, 5.2);
        const lampH = 0.82;
        const housingMat = new THREE.MeshStandardMaterial({ color: 0x171b1e, roughness: 0.38, metalness: 0.2 });
        const reflMat = new THREE.MeshStandardMaterial({ color: 0xdce2e5, metalness: 0.9, roughness: 0.15 });
        const screwMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.85, roughness: 0.2 });

        const housing = this._createRoundedBoxMesh(
          lampW,
          lampH,
          0.22,
          0.08,
          housingMat,
          [0, hwY + 0.08, zBase + 0.11]
        );
        group.add(housing);

        // Internal silver reflector tray & miniature bulbs visible through the fluted lenses
        const innerRefl = this._createRoundedBoxMesh(
          lampW * 0.94,
          lampH * 0.82,
          0.04,
          0.05,
          reflMat,
          [0, hwY + 0.08, zBase + 0.2],
          0x334155,
          0.35
        );
        group.add(innerRefl);

        const isRightSide = comp.id === 'TAIL_RH';
        const dir = isRightSide ? -1 : 1;

        const amberTex = this._getFlutedLensTexture('amber');
        const redTex = this._getFlutedLensTexture('red');
        const clearTex = this._getFlutedLensTexture('clear');

        // Chamber 1: Amber Turn Signal Lens (Outer side)
        const ambMat = new THREE.MeshStandardMaterial({
          color: 0xd97706,
          map: amberTex,
          roughness: 0.18,
          transparent: true,
          opacity: 0.92,
        });
        const ambLens = this._createRoundedBoxMesh(
          lampW * 0.23,
          lampH * 0.86,
          0.12,
          0.045,
          ambMat,
          [-dir * (lampW * 0.355), hwY + 0.08, zBase + 0.25],
          0x451a03,
          0.65
        );
        group.add(ambLens);
        visuals.emissiveMeshes.push({
          mesh: ambLens,
          color: 0xf59e0b,
          idleColor: 0xd97706,
          index: 0,
        });

        // Chamber 2A: Red Tail Lamp Lens (Middle-Outer)
        const tailMat = new THREE.MeshStandardMaterial({
          color: 0x991b1b,
          map: redTex,
          emissive: 0x000000,
          emissiveIntensity: 0,
          roughness: 0.18,
          transparent: true,
          opacity: 0.92,
        });
        const tailLens = this._createRoundedBoxMesh(
          lampW * 0.24,
          lampH * 0.86,
          0.13,
          0.03,
          tailMat,
          [-dir * (lampW * 0.115), hwY + 0.08, zBase + 0.255],
          0x450a0a,
          0.65
        );
        group.add(tailLens);
        visuals.emissiveMeshes.push({
          mesh: tailLens,
          color: 0xef4444,
          idleColor: 0x991b1b,
          index: 1,
        });

        // Chamber 2B: Red Stop/Brake Lamp Lens (Middle-Inner)
        const stopMat = new THREE.MeshStandardMaterial({
          color: 0xb91c1c,
          map: redTex,
          emissive: 0x000000,
          emissiveIntensity: 0,
          roughness: 0.18,
          transparent: true,
          opacity: 0.92,
        });
        const stopLens = this._createRoundedBoxMesh(
          lampW * 0.25,
          lampH * 0.86,
          0.13,
          0.03,
          stopMat,
          [dir * (lampW * 0.13), hwY + 0.08, zBase + 0.255],
          0x450a0a,
          0.65
        );
        group.add(stopLens);
        visuals.emissiveMeshes.push({
          mesh: stopLens,
          color: 0xff2e2e,
          idleColor: 0xb91c1c,
          index: 2,
        });

        // Chamber 3: Clear Reverse Lamp Lens (Inner side)
        const revMat = new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          map: clearTex,
          emissive: 0x000000,
          emissiveIntensity: 0,
          roughness: 0.18,
          transparent: true,
          opacity: 0.88,
        });
        const revLens = this._createRoundedBoxMesh(
          lampW * 0.2,
          lampH * 0.86,
          0.12,
          0.045,
          revMat,
          [dir * (lampW * 0.365), hwY + 0.08, zBase + 0.25],
          0x334155,
          0.65
        );
        group.add(revLens);
        visuals.emissiveMeshes.push({
          mesh: revLens,
          color: 0xf8fafc,
          idleColor: 0xe2e8f0,
          index: 3,
        });

        // 4 Silver Lens Divider Screws at chamber borders (matching reference photo!)
        for (const sx of [-dir * (lampW * 0.238), dir * (lampW * 0.26)]) {
          for (const sy of [lampH * 0.32, -lampH * 0.32]) {
            const divScrew = new THREE.Mesh(
              new THREE.CylinderGeometry(0.025, 0.025, 0.03, 12).rotateX(Math.PI / 2),
              screwMat
            );
            divScrew.position.set(sx, hwY + 0.08 + sy, zBase + 0.325);
            group.add(divScrew);
          }
        }
      } else if (comp.type === 'lamp_test') {
        const housingGeo = new THREE.BoxGeometry(1.15, 0.88, 0.2);
        const housingMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.55 });
        const housing = new THREE.Mesh(housingGeo, housingMat);
        housing.position.set(0, hwY + 0.06, zBase + 0.1);
        housing.castShadow = true;
        this._addInkedOutline(housing);
        group.add(housing);

        const clearTex = this._getFlutedLensTexture('clear');
        const domeGeo = new THREE.BoxGeometry(0.96, 0.72, 0.2);
        const domeMat = new THREE.MeshStandardMaterial({
          color: 0xcbd5e1,
          map: clearTex,
          emissive: 0x000000,
          emissiveIntensity: 0,
          roughness: 0.22,
          transparent: true,
          opacity: 0.94,
        });
        const dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(0, hwY + 0.06, zBase + 0.22);
        this._addInkedOutline(dome);
        group.add(dome);

        visuals.emissiveMeshes.push({
          mesh: dome,
          color: 0xfef08a,
          idleColor: 0xcbd5e1,
          index: 0,
        });
      } else if (comp.type === 'indicator_cluster') {
        // 3 Horizontal Pilot Lights (Left: Amber Turn, Middle: Green Tail, Right: Blue High Beam)
        const pilotSpecs = [
          { x: -0.65, y: hwY + 0.16, idle: 0x78350f, active: 0xf59e0b, key: 'pilotAmber' },
          { x: 0.0, y: hwY + 0.16, idle: 0x14532d, active: 0x22c55e, key: 'pilotRed' },
          { x: 0.65, y: hwY + 0.16, idle: 0x1e3a8a, active: 0x3b82f6, key: 'pilotBlue' },
        ];
        for (const p of pilotSpecs) {
          const bezelGeo = new THREE.CylinderGeometry(0.145, 0.175, 0.12, 16);
          bezelGeo.rotateX(Math.PI / 2);
          const bezelMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.8, roughness: 0.25 });
          const bezel = new THREE.Mesh(bezelGeo, bezelMat);
          bezel.position.set(p.x, p.y, zBase + 0.08);
          this._addInkedOutline(bezel);
          group.add(bezel);

          const domeGeo = new THREE.SphereGeometry(0.11, 14, 14);
          const domeMat = new THREE.MeshStandardMaterial({
            color: p.idle,
            emissive: 0x000000,
            emissiveIntensity: 0,
            roughness: 0.2,
          });
          const dome = new THREE.Mesh(domeGeo, domeMat);
          dome.position.set(p.x, p.y, zBase + 0.14);
          group.add(dome);
          if (this.auxVisuals) this.auxVisuals[p.key] = dome;
        }
      } else if (comp.type === 'licence_lamp') {
        // Chrome Domed Licence Plate Lamp in center of Row 3 (matching Gambar 2!)
        const hoodGeo = new THREE.CylinderGeometry(0.34, 0.4, 0.26, 18, 1, false, 0, Math.PI);
        hoodGeo.rotateZ(-Math.PI / 2);
        hoodGeo.rotateY(Math.PI / 2);
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xd8dee9, metalness: 0.85, roughness: 0.2 });
        const hood = new THREE.Mesh(hoodGeo, chromeMat);
        hood.position.set(0, hwY + 0.08, zBase + 0.15);
        this._addInkedOutline(hood);
        group.add(hood);

        const lensGeo = new THREE.SphereGeometry(0.22, 14, 14);
        const lensMat = new THREE.MeshStandardMaterial({
          color: 0xcbd5e1,
          emissive: 0x000000,
          emissiveIntensity: 0,
          roughness: 0.22,
        });
        const lens = new THREE.Mesh(lensGeo, lensMat);
        lens.position.set(0, hwY + 0.02, zBase + 0.14);
        group.add(lens);
        if (this.auxVisuals) this.auxVisuals.licenceLens = lens;
      } else if (comp.type === 'power_rail' || comp.type === 'junction_post') {
        const blockGeo = new THREE.BoxGeometry(w * 0.68, 0.34, 0.2);
        const blockMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
        const block = new THREE.Mesh(blockGeo, blockMat);
        block.position.set(0, hwY + 0.05, zBase + 0.1);
        this._addInkedOutline(block);
        group.add(block);
      } else if (comp.type === 'buzzer') {
        // 12V Piezoelectric Automotive Buzzer / Chime
        const flangeGeo = new THREE.BoxGeometry(1.3, 0.18, 0.08);
        const flangeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });
        const flange = new THREE.Mesh(flangeGeo, flangeMat);
        flange.position.set(0, hwY, zBase + 0.06);
        this._addInkedOutline(flange);
        group.add(flange);

        const bodyGeo = new THREE.CylinderGeometry(0.52, 0.55, 0.45, 24);
        bodyGeo.rotateX(Math.PI / 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, hwY, zBase + 0.28);
        body.castShadow = true;
        this._addInkedOutline(body);
        group.add(body);

        const ventRingGeo = new THREE.RingGeometry(0.12, 0.38, 20);
        const ventRingMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
        const ventRing = new THREE.Mesh(ventRingGeo, ventRingMat);
        ventRing.position.set(0, hwY, zBase + 0.51);
        group.add(ventRing);

        const holeGeo = new THREE.CircleGeometry(0.11, 18);
        const holeMat = new THREE.MeshBasicMaterial({ color: 0x020617 });
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(0, hwY, zBase + 0.512);
        group.add(hole);

        const waveGeo = new THREE.TorusGeometry(0.56, 0.035, 8, 24);
        const waveMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0 });
        const wave = new THREE.Mesh(waveGeo, waveMat);
        wave.position.set(0, hwY, zBase + 0.52);
        group.add(wave);
        visuals.buzzerWave = wave;
        visuals.isBuzzer = true;
      } else if (comp.type === 'resistor_bank') {
        // Ceramic wirewound power resistors with heat sink fins (10Ω, 50Ω, 100Ω)
        const baseMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.65 });
        const leadMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.25 });
        const offsets = [-0.95, 0, 0.95];

        offsets.forEach((ox) => {
          const blockGeo = new THREE.BoxGeometry(0.68, 0.92, 0.38);
          const block = new THREE.Mesh(blockGeo, baseMat);
          block.position.set(ox, hwY, zBase + 0.2);
          block.castShadow = true;
          this._addInkedOutline(block, 0x475569, 0.7);
          group.add(block);

          for (let r = -3; r <= 3; r++) {
            const ribGeo = new THREE.BoxGeometry(0.62, 0.04, 0.05);
            const rib = new THREE.Mesh(ribGeo, baseMat);
            rib.position.set(ox, hwY + r * 0.11, zBase + 0.4);
            group.add(rib);
          }

          for (const ey of [-0.46, 0.46]) {
            const capGeo = new THREE.BoxGeometry(0.72, 0.08, 0.4);
            const cap = new THREE.Mesh(capGeo, leadMat);
            cap.position.set(ox, hwY + ey, zBase + 0.2);
            this._addInkedOutline(cap);
            group.add(cap);
          }
        });
      } else if (comp.type === 'lamp_h4') {
        // H4 Halogen Headlamp Bulb (P43t collar + dual filaments)
        const collarGeo = new THREE.CylinderGeometry(0.65, 0.72, 0.15, 22);
        collarGeo.rotateX(Math.PI / 2);
        const chromeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.88, roughness: 0.18 });
        const collar = new THREE.Mesh(collarGeo, chromeMat);
        collar.position.set(0, hwY, zBase + 0.1);
        this._addInkedOutline(collar);
        group.add(collar);

        const sockGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.28, 20);
        sockGeo.rotateX(Math.PI / 2);
        const sock = new THREE.Mesh(sockGeo, chromeMat);
        sock.position.set(0, hwY, zBase + 0.22);
        this._addInkedOutline(sock);
        group.add(sock);

        const glassGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.72, 18);
        glassGeo.rotateX(Math.PI / 2);
        const glassMat = new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          transparent: true,
          opacity: 0.42,
          roughness: 0.15,
          metalness: 0.1,
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0, hwY, zBase + 0.58);
        this._addInkedOutline(glass, 0x64748b, 0.45);
        group.add(glass);

        const capGeo = new THREE.CylinderGeometry(0.31, 0.31, 0.12, 18);
        capGeo.rotateX(Math.PI / 2);
        const capMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
        const cap = new THREE.Mesh(capGeo, capMat);
        cap.position.set(0, hwY, zBase + 0.95);
        this._addInkedOutline(cap);
        group.add(cap);

        const fil1Geo = new THREE.CylinderGeometry(0.04, 0.04, 0.24, 10);
        const filMat1 = new THREE.MeshStandardMaterial({
          color: 0x71717a,
          emissive: 0x000000,
          roughness: 0.3,
        });
        const fil1 = new THREE.Mesh(fil1Geo, filMat1);
        fil1.position.set(0, hwY + 0.08, zBase + 0.52);
        group.add(fil1);
        visuals.emissiveMeshes.push({ mesh: fil1, color: 0xfacc15, index: 0, idleColor: 0x71717a });

        const fil2Geo = new THREE.CylinderGeometry(0.04, 0.04, 0.24, 10);
        const filMat2 = new THREE.MeshStandardMaterial({
          color: 0x71717a,
          emissive: 0x000000,
          roughness: 0.3,
        });
        const fil2 = new THREE.Mesh(fil2Geo, filMat2);
        fil2.position.set(0, hwY - 0.08, zBase + 0.65);
        group.add(fil2);
        visuals.emissiveMeshes.push({ mesh: fil2, color: 0xfef08a, index: 1, idleColor: 0x71717a });
      } else if (comp.type === 'motor_small') {
        // 12V Windshield Washer Pump & Electric Motor
        const bodyGeo = new THREE.CylinderGeometry(0.44, 0.44, 1.15, 20);
        bodyGeo.rotateZ(Math.PI / 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.45 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(-0.15, hwY, zBase + 0.28);
        body.castShadow = true;
        this._addInkedOutline(body);
        group.add(body);

        for (const bx of [-0.45, 0.15]) {
          const strapGeo = new THREE.CylinderGeometry(0.47, 0.47, 0.1, 20);
          strapGeo.rotateZ(Math.PI / 2);
          const strapMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 });
          const strap = new THREE.Mesh(strapGeo, strapMat);
          strap.position.set(bx, hwY, zBase + 0.28);
          this._addInkedOutline(strap);
          group.add(strap);
        }

        const pumpGeo = new THREE.CylinderGeometry(0.34, 0.38, 0.42, 18);
        pumpGeo.rotateZ(Math.PI / 2);
        const pumpMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 });
        const pump = new THREE.Mesh(pumpGeo, pumpMat);
        pump.position.set(0.62, hwY, zBase + 0.28);
        this._addInkedOutline(pump);
        group.add(pump);

        const spoutGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.36, 12);
        const spoutMat = new THREE.MeshStandardMaterial({ color: 0x3f3f46, roughness: 0.5 });
        const spout = new THREE.Mesh(spoutGeo, spoutMat);
        spout.position.set(0.62, hwY + 0.26, zBase + 0.28);
        this._addInkedOutline(spout);
        group.add(spout);

        const rotorGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 12);
        rotorGeo.rotateZ(Math.PI / 2);
        const rotorMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
        const rotor = new THREE.Mesh(rotorGeo, rotorMat);
        rotor.position.set(0.85, hwY, zBase + 0.28);
        this._addInkedOutline(rotor);
        group.add(rotor);
        visuals.actuatorMesh = rotor;
        visuals.isMotor = true;
      } else if (comp.type === 'lamp_led') {
        // High-Brightness Dual Test LEDs
        const offsets = [-0.45, 0.45];
        const colors = [0x22c55e, 0xef4444];

        offsets.forEach((ox, idx) => {
          const bezelGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.12, 16);
          bezelGeo.rotateX(Math.PI / 2);
          const bezelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
          const bezel = new THREE.Mesh(bezelGeo, bezelMat);
          bezel.position.set(ox, hwY, zBase + 0.1);
          this._addInkedOutline(bezel);
          group.add(bezel);

          const lensGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.25, 16);
          lensGeo.rotateX(Math.PI / 2);
          const idleCol = idx === 0 ? 0x14532d : 0x7f1d1d;
          const lensMat = new THREE.MeshStandardMaterial({
            color: idleCol,
            emissive: 0x000000,
            roughness: 0.2,
          });
          const lens = new THREE.Mesh(lensGeo, lensMat);
          lens.position.set(ox, hwY, zBase + 0.24);
          this._addInkedOutline(lens);
          group.add(lens);

          const domeGeo = new THREE.SphereGeometry(0.18, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
          domeGeo.rotateX(Math.PI / 2);
          const dome = new THREE.Mesh(domeGeo, lensMat);
          dome.position.set(ox, hwY, zBase + 0.36);
          group.add(dome);

          visuals.emissiveMeshes.push({ mesh: lens, color: colors[idx], index: idx, idleColor: idleCol });
        });
      } else if (comp.type === 'lamp_small') {
        // Clear Automotive Bayonet Bulb (BA15s socket)
        const sockGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.3, 18);
        sockGeo.rotateX(Math.PI / 2);
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.75, roughness: 0.35 });
        const sock = new THREE.Mesh(sockGeo, brassMat);
        sock.position.set(0, hwY, zBase + 0.15);
        this._addInkedOutline(sock);
        group.add(sock);

        const glassGeo = new THREE.SphereGeometry(0.44, 20, 20);
        const glassMat = new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          transparent: true,
          opacity: 0.42,
          roughness: 0.15,
          metalness: 0.1,
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0, hwY, zBase + 0.44);
        this._addInkedOutline(glass, 0x64748b, 0.4);
        group.add(glass);

        const filGeo = new THREE.TorusGeometry(0.12, 0.035, 8, 16);
        const filMat = new THREE.MeshStandardMaterial({
          color: 0x52525b,
          emissive: 0x000000,
          roughness: 0.3,
        });
        const fil = new THREE.Mesh(filGeo, filMat);
        fil.position.set(0, hwY, zBase + 0.44);
        group.add(fil);
        visuals.emissiveMeshes.push({ mesh: fil, color: 0xfacc15, index: 0, idleColor: 0x52525b });
      } else if (comp.type === 'switch_blower_rotary') {
        // Rotary Blower Speed Selector Knob (0, 1, 2, 3)
        const bezelGeo = new THREE.CylinderGeometry(0.55, 0.62, 0.14, 24);
        bezelGeo.rotateX(Math.PI / 2);
        const bezelMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 });
        const bezel = new THREE.Mesh(bezelGeo, bezelMat);
        bezel.position.set(0, hwY, zBase + 0.08);
        this._addInkedOutline(bezel);
        group.add(bezel);

        const dialCanvas = document.createElement('canvas');
        dialCanvas.width = 256;
        dialCanvas.height = 256;
        const dctx = dialCanvas.getContext('2d');
        if (dctx) {
          dctx.fillStyle = '#0f172a';
          dctx.beginPath();
          dctx.arc(128, 128, 120, 0, Math.PI * 2);
          dctx.fill();
          dctx.fillStyle = '#f8fafc';
          dctx.font = 'bold 36px "JetBrains Mono", monospace';
          dctx.textAlign = 'center';
          dctx.textBaseline = 'middle';
          dctx.fillText('0', 70, 185);
          dctx.fillText('1', 55, 120);
          dctx.fillText('2', 90, 60);
          dctx.fillText('3', 160, 50);
          dctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
          dctx.fillStyle = '#38bdf8';
          dctx.fillText('FAN', 128, 140);
        }
        const dialTex = new THREE.CanvasTexture(dialCanvas);
        dialTex.colorSpace = THREE.SRGBColorSpace;
        const dialPlate = new THREE.Mesh(
          new THREE.CircleGeometry(0.5, 24),
          new THREE.MeshBasicMaterial({ map: dialTex })
        );
        dialPlate.position.set(0, hwY, zBase + 0.16);
        group.add(dialPlate);

        const knobGeo = new THREE.CylinderGeometry(0.32, 0.36, 0.28, 20);
        knobGeo.rotateX(Math.PI / 2);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.35, metalness: 0.2 });
        const knob = new THREE.Mesh(knobGeo, knobMat);
        knob.position.set(0, hwY, zBase + 0.3);
        knob.userData = { interactComponentId: comp.id, baseZ: zBase + 0.3 };
        this._addInkedOutline(knob);

        const notchGeo = new THREE.BoxGeometry(0.06, 0.22, 0.08);
        const notchMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const notch = new THREE.Mesh(notchGeo, notchMat);
        notch.position.set(0, 0.12, 0.12);
        knob.add(notch);

        group.add(knob);
        this.interactiveTargets.push(knob);
        visuals.actuatorMesh = knob;
      } else if (comp.type === 'switch_ac_push') {
        // Push-button A/C On/Off Switch with internal green LED indicator
        const bezelGeo = new THREE.BoxGeometry(0.95, 0.95, 0.16);
        const bezelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5 });
        const bezel = new THREE.Mesh(bezelGeo, bezelMat);
        bezel.position.set(0, hwY, zBase + 0.09);
        this._addInkedOutline(bezel);
        group.add(bezel);

        const btnGeo = new THREE.BoxGeometry(0.72, 0.72, 0.22);
        const btnMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 });
        const btn = new THREE.Mesh(btnGeo, btnMat);
        btn.position.set(0, hwY, zBase + 0.22);
        btn.userData = { interactComponentId: comp.id, baseZ: zBase + 0.22 };
        this._addInkedOutline(btn);
        group.add(btn);

        const ledGeo = new THREE.BoxGeometry(0.42, 0.12, 0.06);
        const ledMat = new THREE.MeshStandardMaterial({
          color: 0x14532d,
          emissive: 0x000000,
          roughness: 0.2,
        });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(0, -0.16, 0.12);
        btn.add(led);
        visuals.statusLed = led;

        const acBtnCanvas = document.createElement('canvas');
        acBtnCanvas.width = 128;
        acBtnCanvas.height = 64;
        const actx = acBtnCanvas.getContext('2d');
        if (actx) {
          actx.fillStyle = 'rgba(0,0,0,0)';
          actx.fillRect(0, 0, 128, 64);
          actx.fillStyle = '#38bdf8';
          actx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
          actx.textAlign = 'center';
          actx.textBaseline = 'middle';
          actx.fillText('A/C', 64, 32);
        }
        const acBtnTex = new THREE.CanvasTexture(acBtnCanvas);
        const acLabel = new THREE.Mesh(
          new THREE.PlaneGeometry(0.45, 0.22),
          new THREE.MeshBasicMaterial({ map: acBtnTex, transparent: true })
        );
        acLabel.position.set(0, 0.12, 0.12);
        btn.add(acLabel);

        this.interactiveTargets.push(btn);
        visuals.actuatorMesh = btn;
      } else if (comp.type === 'thermostat_ac') {
        // Thermostat Temperature Control Knob (Warm <-> Cold)
        const bezelGeo = new THREE.CylinderGeometry(0.52, 0.58, 0.14, 22);
        bezelGeo.rotateX(Math.PI / 2);
        const bezelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.25 });
        const bezel = new THREE.Mesh(bezelGeo, bezelMat);
        bezel.position.set(0, hwY, zBase + 0.08);
        this._addInkedOutline(bezel);
        group.add(bezel);

        const tCanvas = document.createElement('canvas');
        tCanvas.width = 256;
        tCanvas.height = 256;
        const tctx = tCanvas.getContext('2d');
        if (tctx) {
          tctx.fillStyle = '#0f172a';
          tctx.beginPath();
          tctx.arc(128, 128, 120, 0, Math.PI * 2);
          tctx.fill();
          const grad = tctx.createLinearGradient(40, 128, 216, 128);
          grad.addColorStop(0, '#ef4444');
          grad.addColorStop(0.5, '#facc15');
          grad.addColorStop(1, '#38bdf8');
          tctx.strokeStyle = grad;
          tctx.lineWidth = 16;
          tctx.beginPath();
          tctx.arc(128, 128, 90, Math.PI * 0.8, Math.PI * 2.2);
          tctx.stroke();

          tctx.fillStyle = '#ef4444';
          tctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
          tctx.fillText('WARM', 35, 220);
          tctx.fillStyle = '#38bdf8';
          tctx.fillText('COLD', 180, 220);
        }
        const tTex = new THREE.CanvasTexture(tCanvas);
        const tDisc = new THREE.Mesh(
          new THREE.CircleGeometry(0.48, 22),
          new THREE.MeshBasicMaterial({ map: tTex })
        );
        tDisc.position.set(0, hwY, zBase + 0.16);
        group.add(tDisc);

        const knobGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.26, 20);
        knobGeo.rotateX(Math.PI / 2);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.3 });
        const knob = new THREE.Mesh(knobGeo, knobMat);
        knob.position.set(0, hwY, zBase + 0.29);
        knob.userData = { interactComponentId: comp.id, baseZ: zBase + 0.29 };
        this._addInkedOutline(knob);

        const notchGeo = new THREE.BoxGeometry(0.05, 0.18, 0.08);
        const notch = new THREE.Mesh(notchGeo, new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
        notch.position.set(0, 0.1, 0.11);
        knob.add(notch);

        const tubeCurve = new THREE.TorusGeometry(0.48, 0.03, 8, 24);
        const tubeMat = new THREE.MeshStandardMaterial({ color: 0xc27803, metalness: 0.85, roughness: 0.2 });
        const tube = new THREE.Mesh(tubeCurve, tubeMat);
        tube.position.set(0, hwY, zBase + 0.16);
        group.add(tube);

        group.add(knob);
        this.interactiveTargets.push(knob);
        visuals.actuatorMesh = knob;
      } else if (comp.type === 'pressure_switch_dual') {
        // Dual Pressure Switch (Low / High Cutout) with LED status
        const bodyGeo = new THREE.BoxGeometry(1.2, 0.82, 0.34);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.35 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, hwY, zBase + 0.18);
        this._addInkedOutline(body);
        group.add(body);

        for (const px of [-0.36, 0.36]) {
          const portGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.22, 14);
          portGeo.rotateX(Math.PI / 2);
          const portMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.25 });
          const port = new THREE.Mesh(portGeo, portMat);
          port.position.set(px, hwY - 0.28, zBase + 0.18);
          this._addInkedOutline(port);
          group.add(port);
        }

        const ledGeo = new THREE.SphereGeometry(0.1, 14, 14);
        const ledMat = new THREE.MeshStandardMaterial({
          color: 0x22c55e,
          emissive: 0x22c55e,
          emissiveIntensity: 0.8,
          roughness: 0.2,
        });
        const led = new THREE.Mesh(ledGeo, ledMat);
        led.position.set(0, hwY + 0.18, zBase + 0.36);
        group.add(led);
        visuals.statusLed = led;
        visuals.actuatorMesh = body;
        body.userData = { interactComponentId: comp.id };
        this.interactiveTargets.push(body);
      } else if (comp.type === 'resistor_blower') {
        // Stepped Ceramic Wirewound Blower Resistor Unit
        const cageGeo = new THREE.BoxGeometry(1.4, 0.86, 0.32);
        const cageMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 });
        const cage = new THREE.Mesh(cageGeo, cageMat);
        cage.position.set(0, hwY, zBase + 0.17);
        this._addInkedOutline(cage);
        group.add(cage);

        const wireMat = new THREE.MeshStandardMaterial({ color: 0x78350f, metalness: 0.75, roughness: 0.3 });
        for (let i = 0; i < 3; i++) {
          const cx = -0.42 + i * 0.42;
          const coilGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.58, 12);
          const coil = new THREE.Mesh(coilGeo, wireMat);
          coil.position.set(cx, hwY, zBase + 0.24);
          this._addInkedOutline(coil);
          group.add(coil);
        }

        const slotMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
        for (let r = -2; r <= 2; r++) {
          const s = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.04), slotMat);
          s.position.set(0, hwY + r * 0.12, zBase + 0.34);
          group.add(s);
        }
      } else if (comp.type === 'evaporator_unit') {
        // Under-Dash Evaporator & Blower Housing
        const bodyW = Math.min(w * 0.92, 5.2);
        const bodyH = 1.35;
        const housingMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.55 });
        const housing = this._createRoundedBoxMesh(
          bodyW,
          bodyH,
          0.45,
          0.08,
          housingMat,
          [0, hwY + 0.1, zBase + 0.24]
        );
        housing.castShadow = true;
        group.add(housing);

        const louverMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 });
        const ventW = (bodyW - 0.7) / 4;
        visuals.airStreamLines = [];

        for (let i = 0; i < 4; i++) {
          const vx = -bodyW / 2 + 0.45 + i * (ventW + 0.08);
          const ventY = hwY + 0.12;
          const ventZ = zBase + 0.52;

          const ventFrame = new THREE.Mesh(
            new THREE.BoxGeometry(ventW, 0.72, 0.08),
            new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.7 })
          );
          ventFrame.position.set(vx, ventY, zBase + 0.48);
          this._addInkedOutline(ventFrame);
          group.add(ventFrame);

          for (let b = -2; b <= 2; b++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(ventW * 0.92, 0.035, 0.12), louverMat);
            blade.position.set(vx, ventY + b * 0.11, zBase + 0.5);
            blade.rotation.x = 0.22;
            group.add(blade);
          }

          // 3 thin dynamic wind streamline curves per vent (12 total across 4 vents)
          const offsetsX = [-ventW * 0.28, 0.0, ventW * 0.28];
          for (let s = 0; s < offsetsX.length; s++) {
            const segCount = 18;
            const positions = new Float32Array(segCount * 3);
            const lineGeo = new THREE.BufferGeometry();
            lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const lineMat = new THREE.LineBasicMaterial({
              color: s === 1 ? 0xbae6fd : 0x38bdf8,
              transparent: true,
              opacity: 0.0,
              depthWrite: false,
            });

            const streamLine = new THREE.Line(lineGeo, lineMat);
            group.add(streamLine);

            visuals.airStreamLines.push({
              line: streamLine,
              lineX: vx + offsetsX[s],
              baseY: ventY,
              baseZ: ventZ,
              segCount,
              phaseOffset: i * 0.9 + s * 1.3,
            });
          }
        }
      } else if (comp.type === 'magnetic_clutch') {
        // Component-board Magnetic Clutch representation
        const pulleyGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.28, 28);
        pulleyGeo.rotateX(Math.PI / 2);
        const pulleyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.25 });
        const pulley = new THREE.Mesh(pulleyGeo, pulleyMat);
        pulley.position.set(0, hwY, zBase + 0.15);
        this._addInkedOutline(pulley);
        group.add(pulley);

        const discGeo = new THREE.CylinderGeometry(0.52, 0.52, 0.08, 24);
        discGeo.rotateX(Math.PI / 2);
        const discMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 });
        const disc = new THREE.Mesh(discGeo, discMat);
        disc.position.set(0, hwY, zBase + 0.31);
        this._addInkedOutline(disc);
        group.add(disc);
        visuals.clutchDisc = disc;
        visuals.isClutch = true;

        for (let a = 0; a < 3; a++) {
          const ang = (a * Math.PI * 2) / 3;
          const spring = new THREE.Mesh(
            new THREE.BoxGeometry(0.28, 0.05, 0.03),
            new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
          );
          spring.position.set(Math.cos(ang) * 0.26, hwY + Math.sin(ang) * 0.26, zBase + 0.36);
          spring.rotation.z = ang;
          group.add(spring);
        }
      } else if (comp.type === 'condenser_fan') {
        // Condenser Radiator Matrix + Extra Fan
        const radGeo = new THREE.BoxGeometry(1.6, 1.2, 0.18);
        const radMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.28 });
        const rad = new THREE.Mesh(radGeo, radMat);
        rad.position.set(0, hwY, zBase + 0.1);
        this._addInkedOutline(rad);
        group.add(rad);

        const shroudGeo = new THREE.CylinderGeometry(0.55, 0.58, 0.16, 24);
        shroudGeo.rotateX(Math.PI / 2);
        const shroudMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 });
        const shroud = new THREE.Mesh(shroudGeo, shroudMat);
        shroud.position.set(0, hwY, zBase + 0.2);
        this._addInkedOutline(shroud);
        group.add(shroud);

        const fanGroup = new THREE.Group();
        fanGroup.position.set(0, hwY, zBase + 0.28);
        const hub = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.14, 0.1, 16).rotateX(Math.PI / 2),
          shroudMat
        );
        fanGroup.add(hub);

        const bladeMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.4 });
        for (let b = 0; b < 5; b++) {
          const ang = (b * Math.PI * 2) / 5;
          const blade = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.02), bladeMat);
          blade.position.set(Math.cos(ang) * 0.28, Math.sin(ang) * 0.28, 0);
          blade.rotation.z = ang + 0.35;
          fanGroup.add(blade);
        }
        group.add(fanGroup);
        visuals.fanBlades = fanGroup;
        visuals.isFan = true;
      } else if (comp.type === 'manifold_gauge_unit') {
        // Dual Manifold Gauge Cluster (Low Blue & High Red) with needle meshes
        const manifoldGeo = new THREE.BoxGeometry(1.6, 0.32, 0.22);
        const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.82, roughness: 0.25 });
        const manifold = new THREE.Mesh(manifoldGeo, brassMat);
        manifold.position.set(0, hwY - 0.32, zBase + 0.12);
        this._addInkedOutline(manifold);
        group.add(manifold);

        const lowGaugeGroup = new THREE.Group();
        lowGaugeGroup.position.set(-0.68, hwY + 0.18, zBase + 0.16);
        const lowCup = new THREE.Mesh(
          new THREE.CylinderGeometry(0.54, 0.54, 0.18, 28).rotateX(Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0x1d4ed8, metalness: 0.6, roughness: 0.3 })
        );
        this._addInkedOutline(lowCup);
        lowGaugeGroup.add(lowCup);

        const lowDialTex = this._getGaugeDialTexture(false);
        const lowDial = new THREE.Mesh(
          new THREE.CircleGeometry(0.48, 28),
          new THREE.MeshBasicMaterial({ map: lowDialTex })
        );
        lowDial.position.z = 0.1;
        lowGaugeGroup.add(lowDial);

        const needleMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        const lowNeedleGeo = new THREE.BoxGeometry(0.032, 0.36, 0.02);
        lowNeedleGeo.translate(0, 0.16, 0);
        const lowNeedle = new THREE.Mesh(lowNeedleGeo, needleMat);
        lowNeedle.position.z = 0.12;
        lowGaugeGroup.add(lowNeedle);
        group.add(lowGaugeGroup);
        visuals.lowNeedle = lowNeedle;

        const highGaugeGroup = new THREE.Group();
        highGaugeGroup.position.set(0.68, hwY + 0.18, zBase + 0.16);
        const highCup = new THREE.Mesh(
          new THREE.CylinderGeometry(0.54, 0.54, 0.18, 28).rotateX(Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.6, roughness: 0.3 })
        );
        this._addInkedOutline(highCup);
        highGaugeGroup.add(highCup);

        const highDialTex = this._getGaugeDialTexture(true);
        const highDial = new THREE.Mesh(
          new THREE.CircleGeometry(0.48, 28),
          new THREE.MeshBasicMaterial({ map: highDialTex })
        );
        highDial.position.z = 0.1;
        highGaugeGroup.add(highDial);

        const highNeedleGeo = new THREE.BoxGeometry(0.032, 0.36, 0.02);
        highNeedleGeo.translate(0, 0.16, 0);
        const highNeedle = new THREE.Mesh(highNeedleGeo, needleMat);
        highNeedle.position.z = 0.12;
        highGaugeGroup.add(highNeedle);
        group.add(highGaugeGroup);
        visuals.highNeedle = highNeedle;

        const sgGeo = new THREE.CylinderGeometry(0.14, 0.14, 0.1, 18).rotateX(Math.PI / 2);
        const sgMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.75,
          roughness: 0.15,
          metalness: 0.1,
        });
        const sg = new THREE.Mesh(sgGeo, sgMat);
        sg.position.set(0, hwY - 0.32, zBase + 0.24);
        group.add(sg);
        visuals.sightGlassMesh = sg;
      } else if (comp.type === 'digital_temp_unit') {
        // Digital Temperature Display Box (T1 Ambient, T2 Evap Inlet, T3 Vent Discharge)
        const boxGeo = new THREE.BoxGeometry(Math.min(w * 0.9, 3.2), 1.25, 0.25);
        const boxMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.45 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(0, hwY, zBase + 0.13);
        this._addInkedOutline(box);
        group.add(box);

        const tempTex = this._getDigitalTempTexture('31.5', '28.0', '7.5');
        const tempScreenGeo = new THREE.PlaneGeometry(Math.min(w * 0.86, 3.0), 1.08);
        const tempScreenMat = new THREE.MeshBasicMaterial({ map: tempTex });
        const tempScreen = new THREE.Mesh(tempScreenGeo, tempScreenMat);
        tempScreen.position.set(0, hwY, zBase + 0.26);
        group.add(tempScreen);
        visuals.digitalTempScreen = tempScreen;
      } else if (comp.type === 'motor_ac_drive') {
        // Engine Drive Motor Control Panel with RPM selector (800, 1500, 2200 RPM)
        const panelGeo = new THREE.BoxGeometry(1.6, 1.0, 0.22);
        const panelMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.4 });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(0, hwY, zBase + 0.11);
        this._addInkedOutline(panel);
        group.add(panel);

        const knobGeo = new THREE.CylinderGeometry(0.3, 0.34, 0.24, 20).rotateX(Math.PI / 2);
        const knobMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.35 });
        const knob = new THREE.Mesh(knobGeo, knobMat);
        knob.position.set(0, hwY, zBase + 0.24);
        knob.userData = { interactComponentId: comp.id, baseZ: zBase + 0.24 };
        this._addInkedOutline(knob);

        const mark = new THREE.Mesh(
          new THREE.BoxGeometry(0.05, 0.18, 0.06),
          new THREE.MeshBasicMaterial({ color: 0xfacc15 })
        );
        mark.position.set(0, 0.1, 0.1);
        knob.add(mark);

        group.add(knob);
        this.interactiveTargets.push(knob);
        visuals.actuatorMesh = knob;
      }
    }

    this.componentVisuals.set(comp.id, visuals);
    return group;
  }

  _createPinSocketMesh(pin) {
    const group = new THREE.Group();
    const [x, y, z] = pin.pos;
    group.position.set(x, y, z);

    const isBatteryPost = pin.terminalType === 'battery_post';
    const collarColorKey = pin.color || 'red';

    // Shared reusable geometries across all 78+ pin sockets
    if (!this._pinGeometries) {
      const socketCollarGeo = new THREE.CylinderGeometry(0.115, 0.128, 0.16, 12);
      socketCollarGeo.rotateX(Math.PI / 2);
      const socketBoreGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.19, 8);
      socketBoreGeo.rotateX(Math.PI / 2);
      const socketHitGeo = new THREE.SphereGeometry(0.32, 10, 10);

      const battRingGeo = new THREE.CylinderGeometry(0.26, 0.3, 0.14, 14);
      const battPostGeo = new THREE.CylinderGeometry(0.15, 0.18, 0.38, 14);
      const battHitGeo = new THREE.SphereGeometry(0.44, 10, 10);

      this._pinGeometries = {
        socketCollarGeo,
        socketBoreGeo,
        socketHitGeo,
        battRingGeo,
        battPostGeo,
        battHitGeo,
      };
    }

    // Shared reusable materials across all 78+ pin sockets (drastically reduces GPU state changes)
    if (!this._pinMaterials) {
      this._pinMaterials = {
        red: new THREE.MeshStandardMaterial({ color: PIN_COLOR_HEX.red, roughness: 0.4, metalness: 0.15 }),
        black: new THREE.MeshStandardMaterial({ color: PIN_COLOR_HEX.black, roughness: 0.4, metalness: 0.15 }),
        yellow: new THREE.MeshStandardMaterial({ color: PIN_COLOR_HEX.yellow, roughness: 0.4, metalness: 0.15 }),
        blue: new THREE.MeshStandardMaterial({ color: PIN_COLOR_HEX.blue, roughness: 0.4, metalness: 0.15 }),
        brassBore: new THREE.MeshStandardMaterial({ color: 0xd4af37, metalness: 0.8, roughness: 0.25 }),
        leadPost: new THREE.MeshStandardMaterial({ color: 0x9ca3af, metalness: 0.75, roughness: 0.3 }),
        invisibleHit: new THREE.MeshBasicMaterial({ visible: false }),
      };
    }

    let collarMesh;
    let boreMesh;
    let hitMesh;

    if (isBatteryPost) {
      const ringMat = this._pinMaterials[collarColorKey] || this._pinMaterials.red;
      collarMesh = new THREE.Mesh(this._pinGeometries.battRingGeo, ringMat);
      collarMesh.position.set(0, 0.07, 0);
      collarMesh.userData = { pinId: pin.id, pinData: pin };
      group.add(collarMesh);

      boreMesh = new THREE.Mesh(this._pinGeometries.battPostGeo, this._pinMaterials.leadPost);
      boreMesh.position.set(0, 0.26, 0);
      boreMesh.userData = { pinId: pin.id, pinData: pin };
      group.add(boreMesh);

      hitMesh = new THREE.Mesh(this._pinGeometries.battHitGeo, this._pinMaterials.invisibleHit);
      hitMesh.position.set(0, 0.26, 0);
      hitMesh.userData = { pinId: pin.id, pinData: pin };
      group.add(hitMesh);
    } else {
      const collarMat = this._pinMaterials[collarColorKey] || this._pinMaterials.red;
      collarMesh = new THREE.Mesh(this._pinGeometries.socketCollarGeo, collarMat);
      collarMesh.position.set(0, 0, 0.12);
      collarMesh.userData = { pinId: pin.id, pinData: pin };
      group.add(collarMesh);

      boreMesh = new THREE.Mesh(this._pinGeometries.socketBoreGeo, this._pinMaterials.brassBore);
      boreMesh.position.set(0, 0, 0.13);
      boreMesh.userData = { pinId: pin.id, pinData: pin };
      group.add(boreMesh);

      hitMesh = new THREE.Mesh(this._pinGeometries.socketHitGeo, this._pinMaterials.invisibleHit);
      hitMesh.position.set(0, 0, 0.2);
      hitMesh.userData = { pinId: pin.id, pinData: pin };
      group.add(hitMesh);
    }

    // Surface-mounted 3D pin indicator tag
    const tagMesh = this._createPinSurfaceTagMesh(pin, 0);
    group.add(tagMesh);
    this.pinSurfaceTags.set(pin.id, tagMesh);

    // Highly optimized raycast target list: hitMesh is the primary interaction target
    this.interactiveTargets.push(hitMesh, collarMesh);

    group.userData = { pinId: pin.id, pinData: pin, collarMesh, hitMesh, tagMesh };
    return group;
  }

  _createPlugMesh(pin, stackIndex, color, category, cableId, explodeOffsetZ = 0) {
    const plugGroup = new THREE.Group();
    const [px, py, pz] = pin.pos;
    const hex = WIRE_COLOR_HEX[color] || 0xd93829;

    if (category === 'alligator' && pin.terminalType === 'battery_post') {
      const yOffset = 0.32 + stackIndex * 0.22;
      plugGroup.position.set(px, py + yOffset, pz);
      const jawGeo = new THREE.BoxGeometry(0.34, 0.28, 0.44);
      const jawMat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.45 });
      const jaw = new THREE.Mesh(jawGeo, jawMat);
      jaw.userData = { pinId: pin.id, pinData: pin, cableId };
      plugGroup.add(jaw);
      this.interactiveTargets.push(jaw);

      return {
        mesh: plugGroup,
        tipWorldPos: new THREE.Vector3(px, py + yOffset + 0.14, pz + 0.12),
      };
    }

    const zOffset = 0.22 + explodeOffsetZ + stackIndex * PLUG_STACK_STEP;
    plugGroup.position.set(px, py, pz + zOffset);

    const bodyGeo = new THREE.CylinderGeometry(0.082, 0.096, 0.18, 14);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.userData = { pinId: pin.id, pinData: pin, cableId };
    plugGroup.add(body);

    const tipGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 10);
    tipGeo.rotateX(Math.PI / 2);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.75, roughness: 0.25 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.userData = { pinId: pin.id, pinData: pin, cableId };
    plugGroup.add(tip);

    this.interactiveTargets.push(body, tip);

    return {
      mesh: plugGroup,
      tipWorldPos: new THREE.Vector3(px, py, pz + zOffset + 0.08),
    };
  }

  // ============================================================================
  // CATHEDRAL & ASYMMETRIC CATENARY PHYSICS ENGINE FOR 3D JUMPER WIRES
  // ============================================================================

  _bernstein5(t) {
    const u = 1.0 - t;
    const u2 = u * u;
    const u3 = u2 * u;
    const t2 = t * t;
    const t3 = t2 * t;
    return {
      b0: u3 * u2,
      b1: 5.0 * t * u2 * u2,
      b2: 10.0 * t2 * u3,
      b3: 10.0 * t3 * u2,
      b4: 5.0 * t2 * t2 * u,
      b5: t3 * t2,
    };
  }

  _normalizedCatenary(u, kappa = 1.65) {
    const x = 2.0 * u - 1.0;
    const coshK = Math.cosh(kappa);
    const denom = coshK - 1.0;
    if (denom < 1e-6) {
      return 4.0 * u * (1.0 - u);
    }
    return (coshK - Math.cosh(kappa * x)) / denom;
  }

  _smoothFloorClamp(y, floorY, sharpness = 14.0) {
    const diff = y - floorY;
    if (diff > 0.65) return y;
    if (diff < -0.65) return floorY;
    return floorY + Math.log(1.0 + Math.exp(sharpness * diff)) / sharpness;
  }

  _resolveTerminalNormal(pinVec, otherVec, explicitNormal, options = {}) {
    if (explicitNormal && explicitNormal.isVector3) {
      return explicitNormal.clone().normalize();
    }
    const deskY = options.deskClearanceY ?? -3.45;
    const isNearDesk = pinVec.y < deskY + 1.15;
    const isProtrudingForward = (pinVec.z - otherVec.z) > 0.35 || pinVec.z > 0.45;
    const isBattery = Boolean(
      pinVec.isBattery ||
      pinVec.terminalType === 'battery_post' ||
      pinVec.userData?.isBattery ||
      (isNearDesk && isProtrudingForward)
    );

    // Battery terminals on the workbench desk: exit ascending upward (+Y) and softly forward (+Z)
    if (isBattery) {
      return new THREE.Vector3(0.0, 0.78, 0.62).normalize();
    }

    // Board sockets close to tabletop desk: slight upward tilt to prevent table clipping
    const floorDist = pinVec.y - deskY;
    if (floorDist < 0.55) {
      const pitchUp = THREE.MathUtils.clamp((0.55 - floorDist) * 0.45, 0.0, 0.28);
      return new THREE.Vector3(0.0, pitchUp, 1.0).normalize();
    }

    // Standard trainer board sockets: exit pure perpendicular front (+Z)
    return new THREE.Vector3(0.0, 0.0, 1.0);
  }

  _buildCatenaryCurve(startVec, endVec, maxLengthCm = 30, distanceCm = null, options = {}) {
    const isUnderExplode = this.explodeProgress > 0.02;
    const excessCm = Math.max(0, maxLengthCm - (distanceCm || 15));
    const excessUnits = excessCm / 2.5;

    // Detect if this wire connects the lower shelf to the upper board
    const isShelfToBoard =
      (startVec.y < -4.2 && endVec.y >= -4.2) ||
      (endVec.y < -4.2 && startVec.y >= -4.2);

    if (isUnderExplode) {
      // EXPLODED 3D MODE: Route cables UNDERNEATH the lifted 3D components
      const underZ = 0.24;
      const dropY = -0.32 - Math.min(0.5, excessUnits * 0.05);

      const p1 = new THREE.Vector3(
        THREE.MathUtils.lerp(startVec.x, endVec.x, 0.15),
        startVec.y + dropY * 0.65,
        THREE.MathUtils.lerp(startVec.z, underZ, 0.75)
      );
      const pMid = new THREE.Vector3(
        (startVec.x + endVec.x) * 0.5,
        Math.min(startVec.y, endVec.y) + dropY,
        underZ
      );
      const p2 = new THREE.Vector3(
        THREE.MathUtils.lerp(startVec.x, endVec.x, 0.85),
        endVec.y + dropY * 0.65,
        THREE.MathUtils.lerp(endVec.z, underZ, 0.75)
      );

      if (!isShelfToBoard) {
        p1.y = Math.max(-3.45, p1.y);
        pMid.y = Math.max(-3.45, pMid.y);
        p2.y = Math.max(-3.45, p2.y);
      }

      return new THREE.CatmullRomCurve3([startVec, p1, pMid, p2, endVec]);
    }

    if (isShelfToBoard) {
      // LOWER SHELF-TO-BOARD CABLE:
      const pLower = startVec.y < endVec.y ? startVec : endVec;
      const pUpper = startVec.y < endVec.y ? endVec : startVec;

      const w1 = new THREE.Vector3(
        THREE.MathUtils.lerp(pLower.x, pUpper.x, 0.25),
        pLower.y + 0.8,
        Math.max(pLower.z + 0.35, 3.4)
      );
      const w2 = new THREE.Vector3(
        THREE.MathUtils.lerp(pLower.x, pUpper.x, 0.5),
        -3.3,
        Math.max(3.8, Math.max(pLower.z, pUpper.z) + 0.5)
      );
      const w3 = new THREE.Vector3(
        THREE.MathUtils.lerp(pLower.x, pUpper.x, 0.8),
        THREE.MathUtils.lerp(-3.3, pUpper.y, 0.65),
        THREE.MathUtils.lerp(3.2, pUpper.z + 0.4, 0.7)
      );

      const pts =
        startVec.y < endVec.y
          ? [pLower, w1, w2, w3, pUpper]
          : [pUpper, w3, w2, w1, pLower];

      return new THREE.CatmullRomCurve3(pts, false, 'centripetal', 0.5);
    }

    // -------------------------------------------------------------------------
    // ASYMMETRIC CATENARY & BERNSTEIN ORDE-5 STRAIN-RELIEF ENGINE
    // Works flawlessly for Board-to-Board (horizontal & steep vertical) & Desk-to-Board
    // -------------------------------------------------------------------------
    const isFig06 = Boolean(this.module?.id === 'fig06');
    const defaultDeskY = isFig06 ? -5.50 : -3.45;
    const deskY = options.deskClearanceY ?? defaultDeskY;
    const numSegments = options.segments ?? 24;

    const chordVec = new THREE.Vector3().subVectors(endVec, startVec);
    const worldDist = chordVec.length();

    if (worldDist < 1e-4) {
      const tinyStub = startVec.clone().add(new THREE.Vector3(0, 0, 0.18));
      return new THREE.CatmullRomCurve3([startVec.clone(), tinyStub, endVec.clone()]);
    }

    // 1. World scale calibration & Real Cable Slack calculation
    const hasValidDistCm = typeof distanceCm === 'number' && distanceCm > 0.1;
    const cmToWorld = hasValidDistCm
      ? THREE.MathUtils.clamp(worldDist / distanceCm, 0.03, 0.30)
      : 0.10;

    const effDistanceCm = hasValidDistCm ? distanceCm : (worldDist / cmToWorld);
    const nominalCableCm = (typeof maxLengthCm === 'number' && maxLengthCm > 0)
      ? maxLengthCm
      : Math.max(30, effDistanceCm * 1.25);

    const rawExcessCm = Math.max(0.0, nominalCableCm - effDistanceCm);
    const minElasticFlexCm = Math.min(4.2, effDistanceCm * 0.11);
    const effectiveExcessCm = Math.sqrt(rawExcessCm * rawExcessCm + minElasticFlexCm * minElasticFlexCm);
    const excessWorld = effectiveExcessCm * cmToWorld;
    const rawExcessWorld = rawExcessCm * cmToWorld;
    const slackRatio = effectiveExcessCm / Math.max(effDistanceCm, 8.0);

    // 2. Geometry Span Decomposition
    const dx = chordVec.x;
    const dy = chordVec.y;
    const dz = chordVec.z;
    const absDy = Math.abs(dy);

    const verticality = THREE.MathUtils.clamp(absDy / worldDist, 0.0, 1.0);
    const elevationSkew = THREE.MathUtils.clamp(dy / worldDist, -1.0, 1.0);

    // 3. Banana Plug Exit Normal Vectors (~0.18 - 0.25 unit perpendicular)
    const nStart = this._resolveTerminalNormal(startVec, endVec, options.startNormal, options);
    const nEnd = this._resolveTerminalNormal(endVec, startVec, options.endNormal, options);

    const targetBootExit = THREE.MathUtils.clamp(worldDist * 0.16, 0.18, 0.25);
    const bootExitDist = Math.min(targetBootExit, worldDist * 0.42);

    const archForwardBase = THREE.MathUtils.clamp(
      bootExitDist + 0.12 + Math.tanh(slackRatio * 0.85) * 0.16 + verticality * 0.08,
      bootExitDist + 0.06,
      0.52
    );

    const startArchDist = archForwardBase * (1.0 + 0.35 * nStart.y);
    const endArchDist = archForwardBase * (1.0 + 0.35 * nEnd.y);

    // 4. Gravity Sag (Y) & Forward Belly (Z) Amplitudes
    const totalDeflection = 0.48 * Math.sqrt(worldDist * excessWorld) + 0.30 * excessWorld;
    const horizSagFactor = 1.0 - 0.64 * Math.pow(verticality, 1.45);
    const verticalLoopAllowance = 0.38 * rawExcessWorld * Math.pow(verticality, 1.45);
    let sagAmplitudeY = totalDeflection * horizSagFactor + verticalLoopAllowance;

    // Relative to chord line: ensure belly never sags unnaturally below physical limits
    const minPinY = Math.min(startVec.y, endVec.y);
    const midChordY = 0.5 * (startVec.y + endVec.y);
    const maxDropBelowLowestPin = 0.48 * rawExcessWorld + 0.14 * (1.0 - 0.5 * verticality);
    const maxAllowedSagAtMid = Math.max(0.10, (midChordY - minPinY) + maxDropBelowLowestPin);
    sagAmplitudeY = Math.min(sagAmplitudeY, maxAllowedSagAtMid);

    const extraBellyZ = THREE.MathUtils.clamp(
      (0.08 + 0.18 * Math.tanh(slackRatio * 0.9) + 0.10 * verticality) * Math.min(1.0, worldDist / 1.2),
      0.04,
      0.32
    );

    const horizSpanX = Math.abs(dx);
    const microSwayX = (horizSpanX < 0.35 && verticality > 0.75)
      ? (startVec.x >= 0 ? 1.0 : -1.0) * THREE.MathUtils.clamp((0.35 - horizSpanX) * 0.12, 0.0, 0.045)
      : 0.0;

    const catenaryKappa = 1.35 + Math.min(1.15, slackRatio * 0.85);

    // 5. Sample Points along parameter t in [0, 1]
    const points = [];
    const alpha = 0.22;

    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;

      if (i === 0) {
        points.push(startVec.clone());
        continue;
      }
      if (i === numSegments) {
        points.push(endVec.clone());
        continue;
      }

      const B = this._bernstein5(t);
      const u = alpha * B.b2 + (1.0 - alpha) * B.b3 + B.b4 + B.b5;

      // A. Position on 3D Chord Line
      const px = startVec.x + u * dx;
      const py = startVec.y + u * dy;
      const pz = startVec.z + u * dz;

      // B. Banana Plug Perpendicular Exit Normal Offset
      const plugWeightStart = (bootExitDist * 1.35) * B.b1 + startArchDist * B.b2 + (0.38 * startArchDist) * B.b3;
      const plugWeightEnd = (0.38 * endArchDist) * B.b2 + endArchDist * B.b3 + (bootExitDist * 1.35) * B.b4;

      const exitOffsetX = plugWeightStart * nStart.x + plugWeightEnd * nEnd.x;
      const exitOffsetY = plugWeightStart * nStart.y + plugWeightEnd * nEnd.y;
      const exitOffsetZ = plugWeightStart * nStart.z + plugWeightEnd * nEnd.z;

      // C. Asymmetric Catenary Gravity Sag & Forward Arc
      const catVal = this._normalizedCatenary(u, catenaryKappa);
      const gravityBias = 1.0 - 0.30 * elevationSkew * (2.0 * u - 1.0);
      const sagY = -sagAmplitudeY * catVal * gravityBias;

      const bellyZ = extraBellyZ * this._normalizedCatenary(u, 1.25);
      const swayX = microSwayX * Math.sin(Math.PI * u);

      let finalX = px + exitOffsetX + swayX;
      let rawY = py + exitOffsetY + sagY;
      let finalZ = pz + exitOffsetZ + bellyZ;

      // D. Smooth Tabletop Desk Clearance Protection
      const minPinY = Math.min(startVec.y, endVec.y);
      const pinFloorBound = (startVec.y >= deskY && endVec.y >= deskY)
        ? deskY
        : Math.min(deskY, minPinY);

      const endpointPinLock = Math.sin(Math.PI * u);
      const effectiveFloorY = THREE.MathUtils.lerp(minPinY, pinFloorBound, endpointPinLock);
      const clampedY = this._smoothFloorClamp(rawY, effectiveFloorY, 15.0);

      const floorCompression = Math.max(0.0, clampedY - rawY);
      if (floorCompression > 1e-4) {
        finalZ += floorCompression * 0.42 * endpointPinLock;
      }

      const safeY = (rawY < deskY && startVec.y >= deskY && endVec.y >= deskY)
        ? Math.max(deskY, clampedY)
        : clampedY;

      points.push(new THREE.Vector3(finalX, safeY, finalZ));
    }

    return new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5);
  }

  syncCables(cables = [], pinStackGetter = null) {
    this.lastCables = cables;
    this.lastPinStackGetter = pinStackGetter;
    this.lastSyncedExplode = this.explodeProgress;

    this.interactiveTargets = this.interactiveTargets.filter((m) => !m.userData?.isCablePart);
    while (this.cablesLayer.children.length > 0) {
      this.cablesLayer.remove(this.cablesLayer.children[0]);
    }
    this.cableMeshes.clear();

    const pinMap = new Map((this.module?.pins || []).map((p) => [p.id, p]));
    const explodeZ = this.explodeProgress * 1.45;

    for (const cable of cables) {
      const pinA = pinMap.get(cable.fromPin);
      const pinB = pinMap.get(cable.toPin);
      if (!pinA || !pinB) continue;

      const cableGroup = new THREE.Group();
      const plugA = this._createPlugMesh(
        pinA,
        cable.fromStackIndex || 0,
        cable.color,
        cable.category,
        cable.id,
        pinA.terminalType === 'battery_post' ? 0 : explodeZ
      );
      const plugB = this._createPlugMesh(
        pinB,
        cable.toStackIndex || 0,
        cable.color,
        cable.category,
        cable.id,
        pinB.terminalType === 'battery_post' ? 0 : explodeZ
      );

      plugA.mesh.traverse((child) => {
        if (child.isMesh) child.userData.isCablePart = true;
      });
      plugB.mesh.traverse((child) => {
        if (child.isMesh) child.userData.isCablePart = true;
      });

      cableGroup.add(plugA.mesh);
      cableGroup.add(plugB.mesh);

      const curve = this._buildCatenaryCurve(
        plugA.tipWorldPos,
        plugB.tipWorldPos,
        cable.maxLengthCm,
        cable.distanceCm
      );
      // Slim, realistic jumper wire thickness so even 30+ wires never obscure the board
      const tubeRadius = cable.category === 'alligator' ? 0.056 : 0.034;
      const tubeGeo = new THREE.TubeGeometry(curve, 24, tubeRadius, 6, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: WIRE_COLOR_HEX[cable.color] || 0xd93829,
        roughness: 0.45,
        metalness: 0.08,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      tubeMesh.castShadow = false;
      tubeMesh.userData = { cableId: cable.id, isCablePart: true };
      cableGroup.add(tubeMesh);
      this.interactiveTargets.push(tubeMesh);

      this.cablesLayer.add(cableGroup);
      this.cableMeshes.set(cable.id, cableGroup);
    }

    // Update 3D surface-mounted pin tags with stack count badge (e.g. "F4- ×3")
    for (const pin of this.module?.pins || []) {
      const count = pinStackGetter ? pinStackGetter(pin.id) : 0;
      const tagMesh = this.pinSurfaceTags.get(pin.id);
      if (tagMesh && tagMesh.material) {
        const tex = this._getPinSurfaceTexture(pin.label, pin.color, count);
        if (tex && tagMesh.material.map !== tex) {
          tagMesh.material.map = tex;
          tagMesh.material.needsUpdate = true;
        }
      }
      const pinMeshGroup = this.pinMeshes.get(pin.id);
      if (pinMeshGroup && pinMeshGroup.userData.hitMesh && pin.terminalType !== 'battery_post') {
        pinMeshGroup.userData.hitMesh.position.z = 0.2 + count * PLUG_STACK_STEP;
      }
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  syncMultimeter(dmmEngine) {
    if (!this.multimeter3DGroup) return;

    if (this.multimeterDialMesh) {
      const modeAngles = {
        OFF: 0,
        V_DC: -0.55,
        OHM: -1.25,
        CONTINUITY: -1.85,
        A_DC: 0.65,
      };
      this.multimeterDialMesh.rotation.z = modeAngles[dmmEngine?.mode] || 0;
    }

    if (this.multimeterLcdMesh) {
      const r = dmmEngine?.reading || { display: '0.00', unit: 'V' };
      const tex = this._getMultimeterLcdTexture(r.display, r.unit, r.isNegative, r.beeping);
      if (tex && this.multimeterLcdMesh.material.map !== tex) {
        this.multimeterLcdMesh.material.map = tex;
        this.multimeterLcdMesh.material.needsUpdate = true;
      }
    }

    const dmmProbesKey = `${dmmEngine?.mode}_${dmmEngine?.redPin}_${dmmEngine?.blackPin}_${this.explodeProgress > 0.02 ? 'exp' : 'norm'}`;
    if (this._lastDmmProbesKey !== dmmProbesKey) {
      this._lastDmmProbesKey = dmmProbesKey;
      while (this.multimeterProbesGroup.children.length > 0) {
        const c = this.multimeterProbesGroup.children[0];
        this.multimeterProbesGroup.remove(c);
      }

      if (dmmEngine && dmmEngine.mode !== 'OFF') {
        const pinMap = new Map((this.module?.pins || []).map((p) => [p.id, p]));
        const meterWorldPos = new THREE.Vector3();
        this.multimeter3DGroup.getWorldPosition(meterWorldPos);

        const comJackPos = meterWorldPos.clone().add(new THREE.Vector3(0.14, -0.72, 0.35));
        const vJackPos = meterWorldPos.clone().add(new THREE.Vector3(0.42, -0.72, 0.35));

        if (dmmEngine.redPin) {
          const pin = pinMap.get(dmmEngine.redPin);
          if (pin) this._renderDmmProbeWire(vJackPos, pin, 'red');
        }

        if (dmmEngine.blackPin) {
          const pin = pinMap.get(dmmEngine.blackPin);
          if (pin) this._renderDmmProbeWire(comJackPos, pin, 'black');
        }
      }
    }
  }

  _renderDmmProbeWire(jackPos, pin, color = 'red') {
    const explodeZ = this.explodeProgress * 1.45;
    const pinZ = pin.pos[2] + (pin.terminalType === 'battery_post' ? 0.35 : 0.25 + explodeZ);
    const pinPos = new THREE.Vector3(pin.pos[0], pin.pos[1], pinZ);

    const probeWireGroup = new THREE.Group();

    const handleMat = new THREE.MeshStandardMaterial({
      color: color === 'red' ? 0xef4444 : 0x18181b,
      roughness: 0.4,
    });
    const handleGeo = new THREE.CylinderGeometry(0.065, 0.08, 0.65, 12);
    handleGeo.rotateX(Math.PI / 2);
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.set(pinPos.x, pinPos.y, pinPos.z + 0.38);
    this._addInkedOutline(handle);
    probeWireGroup.add(handle);

    const tipGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.25, 10);
    tipGeo.rotateX(Math.PI / 2);
    const tipMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.2 });
    const tip = new THREE.Mesh(tipGeo, tipMat);
    tip.position.set(pinPos.x, pinPos.y, pinPos.z + 0.1);
    probeWireGroup.add(tip);

    const cableStart = jackPos;
    const cableEnd = new THREE.Vector3(pinPos.x, pinPos.y, pinPos.z + 0.72);
    const dist = cableStart.distanceTo(cableEnd) * 2.5;
    const maxLen = Math.max(120, dist + 40);

    const curve = this._buildCatenaryCurve(cableStart, cableEnd, maxLen, dist);
    const tubeGeo = new THREE.TubeGeometry(curve, 24, 0.038, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: color === 'red' ? 0xd93829 : 0x18181b,
      roughness: 0.5,
      metalness: 0.08,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.castShadow = true;
    probeWireGroup.add(tube);

    this.multimeterProbesGroup.add(probeWireGroup);
  }

  updatePreviewWire({ startPin, targetPoint3D, targetPin, cableTypeId, color, existingCables }) {
    this.clearPreview();
    if (!startPin) return;

    const explodeZ = this.explodeProgress * 1.45;
    const startZ = startPin.pos[2] + (startPin.terminalType === 'battery_post' ? 0.35 : 0.25 + explodeZ);
    const startVec = new THREE.Vector3(startPin.pos[0], startPin.pos[1], startZ);

    const endVec = targetPin
      ? new THREE.Vector3(
          targetPin.pos[0],
          targetPin.pos[1],
          targetPin.pos[2] + (targetPin.terminalType === 'battery_post' ? 0.35 : 0.25 + explodeZ)
        )
      : targetPoint3D;

    if (!endVec) return;

    const fakePinB = targetPin || {
      id: '__CURSOR__',
      pos: [endVec.x, endVec.y, endVec.z],
      terminalType: 'banana',
    };

    const validation = validateCableConnection({
      pinA: startPin,
      pinB: fakePinB,
      cableTypeId,
      color,
      existingCables,
    });

    const isValid = validation.ok;
    const curve = this._buildCatenaryCurve(
      startVec,
      endVec,
      validation.maxLengthCm || 25,
      validation.distanceCm || 15
    );

    const previewGeo = new THREE.TubeGeometry(curve, 22, 0.032, 8, false);
    const previewMat = new THREE.MeshBasicMaterial({
      color: isValid ? (color === 'black' ? 0x334155 : 0x16a34a) : 0xdc2626,
      transparent: true,
      opacity: 0.88,
    });
    const previewMesh = new THREE.Mesh(previewGeo, previewMat);
    this.previewGroup.add(previewMesh);

    return validation;
  }

  clearPreview() {
    while (this.previewGroup.children.length > 0) {
      this.previewGroup.remove(this.previewGroup.children[0]);
    }
  }

  highlightSelectedPin(selectedPinId) {
    for (const [pinId, group] of this.pinMeshes.entries()) {
      const collar = group.userData.collarMesh;
      if (collar && collar.material) {
        collar.material.emissive.setHex(pinId === selectedPinId ? 0xfbbf24 : 0x000000);
        collar.material.emissiveIntensity = pinId === selectedPinId ? 0.75 : 0;
      }
      const tagMesh = group.userData.tagMesh;
      if (tagMesh && tagMesh.material) {
        tagMesh.material.color.setHex(pinId === selectedPinId ? 0xfde047 : 0xffffff);
      }
    }
  }

  syncSimulation(snapshot) {
    if (!snapshot) return;

    for (const [compId, state] of Object.entries(snapshot.componentStates || {})) {
      const vis = this.componentVisuals.get(compId);
      if (!vis) continue;

      if (vis.actuatorMesh && state.switchState !== undefined) {
        const baseZ = vis.actuatorMesh.userData?.baseZ;
        if (compId === 'IGN_SW') {
          if (state.ignStartActive) {
            vis.actuatorMesh.rotation.z = -0.85;
            if (baseZ !== undefined) vis.actuatorMesh.position.z = baseZ - 0.06;
          } else if (state.switchState === 'OFF') {
            vis.actuatorMesh.rotation.z = 0.52;
            if (baseZ !== undefined) vis.actuatorMesh.position.z = baseZ;
          } else if (state.switchState === 'ACC') {
            vis.actuatorMesh.rotation.z = 0.0;
            if (baseZ !== undefined) vis.actuatorMesh.position.z = baseZ;
          } else if (state.switchState === 'IG' || state.switchState === 'ON') {
            vis.actuatorMesh.rotation.z = -0.52;
            if (baseZ !== undefined) vis.actuatorMesh.position.z = baseZ;
          }
        } else if (compId === 'SW_TURN') {
          // Tuas sein: atas = Kiri (LEFT), tengah = OFF, bawah = Kanan (RIGHT)
          if (state.switchState === 'LEFT') {
            vis.actuatorMesh.rotation.z = 0.35;
          } else if (state.switchState === 'RIGHT') {
            vis.actuatorMesh.rotation.z = -0.35;
          } else {
            vis.actuatorMesh.rotation.z = 0.0;
          }
        } else if (compId === 'SW_DIMMER') {
          // Tuas lampu kepala: atas = High, tengah = OFF, bawah = Low
          if (state.switchState === 'HIGH') {
            vis.actuatorMesh.rotation.z = -0.35;
          } else if (state.switchState === 'LOW') {
            vis.actuatorMesh.rotation.z = 0.35;
          } else {
            vis.actuatorMesh.rotation.z = 0.0;
          }
        } else if (compId === 'SW_BLOWER') {
          if (state.switchState === 'SPEED_1') vis.actuatorMesh.rotation.z = -0.785;
          else if (state.switchState === 'SPEED_2') vis.actuatorMesh.rotation.z = -1.57;
          else if (state.switchState === 'SPEED_3') vis.actuatorMesh.rotation.z = -2.35;
          else vis.actuatorMesh.rotation.z = 0.0;
        } else if (compId === 'MOTOR_DRIVE_AC') {
          if (state.switchState === 'IDLE_800') vis.actuatorMesh.rotation.z = -0.785;
          else if (state.switchState === 'MED_1500') vis.actuatorMesh.rotation.z = -1.57;
          else if (state.switchState === 'HIGH_2200') vis.actuatorMesh.rotation.z = -2.35;
          else vis.actuatorMesh.rotation.z = 0.0;
        } else if (compId === 'THERMOSTAT_AC') {
          vis.actuatorMesh.rotation.z = state.switchState === 'OFF' ? 0.0 : -1.8;
        } else {
          if (state.switchState === 'OFF') {
            vis.actuatorMesh.rotation.z = 0;
            if (baseZ !== undefined) vis.actuatorMesh.position.z = baseZ;
          } else if (state.switchState === 'ACC' || state.switchState === 'LOW' || state.switchState === 'LEFT') {
            vis.actuatorMesh.rotation.z = -0.35;
          } else if (state.switchState === 'IG' || state.switchState === 'HIGH' || state.switchState === 'RIGHT') {
            vis.actuatorMesh.rotation.z = 0.38;
          } else if (state.switchState === 'ON') {
            if (baseZ !== undefined) vis.actuatorMesh.position.z = baseZ - 0.08;
            vis.actuatorMesh.rotation.z = 0.25;
          }
        }
      }

      if (vis.statusLed) {
        const active = Boolean(state.relayClosed || state.blinkingOn);
        vis.statusLed.material.color.setHex(active ? 0x22c55e : 0x334155);
        vis.statusLed.material.emissive.setHex(active ? 0x22c55e : 0x000000);
        vis.statusLed.material.emissiveIntensity = active ? 0.95 : 0;
      }

      if (vis.fuseMeshes.length > 0) {
        vis.fuseMeshes.forEach((fMesh, idx) => {
          const fuseKey = `F${idx + 1}`;
          const isBlown = state.blownChannels?.includes(fuseKey) || (idx === 0 && state.blown);
          const baseColor = fMesh.userData?.baseColor || (idx % 2 === 0 ? 0xef4444 : 0x3b82f6);
          fMesh.material.color.setHex(isBlown ? 0x111111 : baseColor);
          fMesh.material.emissive.setHex(isBlown ? 0x7f1d1d : 0x000000);
        });
      }

      if (vis.hornDiscMesh) {
        vis.isHornEnergized = Boolean(state.energized);
      }
      if (vis.isBuzzer) {
        vis.isBuzzerActive = Boolean(state.energized);
      }
      if (vis.isMotor) {
        vis.isMotorRunning = Boolean(state.energized);
      }

      if (vis.headlampFlares) {
        const isLow = Boolean(state.lowBeam);
        const isHigh = Boolean(state.highBeam);
        for (const f of vis.headlampFlares) {
          if (isHigh) {
            f.mesh.material.color.setHex(0xf97316);
            f.mesh.material.opacity = 0.88;
            f.mesh.scale.set(1.38, 1.15, 1);
          } else if (isLow) {
            f.mesh.material.color.setHex(0xf59e0b);
            f.mesh.material.opacity = 0.72;
            f.mesh.scale.set(0.95, 0.85, 1);
          } else {
            f.mesh.material.opacity = 0;
          }
        }
      }

      for (const item of vis.emissiveMeshes) {
        let lit = Boolean(state.energized);
        let activeHex = item.color;
        let intensity = 1.25;

        if (state.lowBeam !== undefined || state.highBeam !== undefined) {
          const isLow = Boolean(state.lowBeam);
          const isHigh = Boolean(state.highBeam);
          if (isHigh) {
            lit = true;
            activeHex = item.index === 0 ? 0xfef08a : 0xfacc15;
            intensity = 1.65;
          } else if (isLow) {
            lit = item.index === 0;
            activeHex = 0xfacc15;
            intensity = 1.45;
          } else {
            lit = false;
          }
        } else if (state.signOn !== undefined || state.tailOn !== undefined || state.stopOn !== undefined || state.revOn !== undefined) {
          if (item.index === 0) lit = Boolean(state.signOn);
          else if (item.index === 1) lit = Boolean(state.tailOn);
          else if (item.index === 2) lit = Boolean(state.stopOn);
          else if (item.index === 3) lit = Boolean(state.revOn);
          else lit = false;
        } else if (state.lhOn !== undefined || state.rhOn !== undefined) {
          lit = Boolean(state.rhOn);
        }

        const idleHex = item.idleColor ?? 0x475569;
        item.mesh.material.color.setHex(lit ? activeHex : idleHex);
        item.mesh.material.emissive.setHex(lit ? activeHex : 0x000000);
        item.mesh.material.emissiveIntensity = lit ? intensity : 0;
      }
    }

    if (this.auxVisuals) {
      const states = snapshot.componentStates || {};
      if (this.auxVisuals.licenceLens) {
        const licenceLit = Boolean(
          states.GND_BUS_1?.energized ||
            states.LICENCE_LAMP?.energized ||
            (states.TAIL_LH?.tailOn && states.GND_BUS_1?.energized)
        );
        this.auxVisuals.licenceLens.material.color.setHex(licenceLit ? 0xfef08a : 0xcbd5e1);
        this.auxVisuals.licenceLens.material.emissive.setHex(licenceLit ? 0xfef08a : 0x000000);
        this.auxVisuals.licenceLens.material.emissiveIntensity = licenceLit ? 1.15 : 0;
      }
      if (this.auxVisuals.pilotRed) {
        const tailOrIgnOn = Boolean(
          states.IND_CLUSTER?.tailPilot ||
            states.TAIL_LH?.tailOn ||
            (snapshot.boardPowered && states.IGN_SW?.switchState === 'IG')
        );
        const m = this.auxVisuals.pilotRed.material;
        m.color.setHex(tailOrIgnOn ? 0x22c55e : 0x14532d);
        m.emissive.setHex(tailOrIgnOn ? 0x22c55e : 0x000000);
        m.emissiveIntensity = tailOrIgnOn ? 1.25 : 0;
      }
      if (this.auxVisuals.pilotAmber) {
        const turnOn = Boolean(
          states.IND_CLUSTER?.turnPilot ||
            states.TURN_LAMPS?.lhOn ||
            states.TURN_LAMPS?.rhOn ||
            states.SIGN_FRONT_LH?.energized
        );
        const m = this.auxVisuals.pilotAmber.material;
        m.color.setHex(turnOn ? 0xf59e0b : 0x78350f);
        m.emissive.setHex(turnOn ? 0xf59e0b : 0x000000);
        m.emissiveIntensity = turnOn ? 1.3 : 0;
      }
      if (this.auxVisuals.pilotBlue) {
        const hiOn = Boolean(
          states.IND_CLUSTER?.highPilot || states.HL_MAIN?.highBeam || states.HL_RH?.highBeam
        );
        const m = this.auxVisuals.pilotBlue.material;
        m.color.setHex(hiOn ? 0x3b82f6 : 0x1e3a8a);
        m.emissive.setHex(hiOn ? 0x3b82f6 : 0x000000);
        m.emissiveIntensity = hiOn ? 1.35 : 0;
      }
    }

    if (snapshot.refrigeration) {
      const ref = snapshot.refrigeration;
      this.acCompressorRpm = ref.compressorRpm || 0;
      this.acIsClutchEngaged = Boolean(ref.clutchEngaged);
      this.acIsFanRunning = Boolean(ref.fanRunning);

      for (const [, vis] of this.componentVisuals.entries()) {
        if (vis.lowNeedle) {
          const lp = Math.max(0, Math.min(120, ref.lowPressurePsi || 0));
          const frac = lp / 120;
          const ang = -2.356 + frac * 4.712;
          vis.lowNeedle.rotation.z = -ang;
        }
        if (vis.highNeedle) {
          const hp = Math.max(0, Math.min(500, ref.highPressurePsi || 0));
          const frac = hp / 500;
          const ang = -2.356 + frac * 4.712;
          vis.highNeedle.rotation.z = -ang;
        }
        if (vis.digitalTempScreen) {
          const t1 = (ref.t1Ambient !== undefined ? ref.t1Ambient : 31.5).toFixed(1);
          const t2 = (ref.t2EvapInlet !== undefined ? ref.t2EvapInlet : 28.0).toFixed(1);
          const t3 = (ref.t3VentDischarge !== undefined ? ref.t3VentDischarge : 7.5).toFixed(1);
          const tex = this._getDigitalTempTexture(t1, t2, t3);
          if (tex && vis.digitalTempScreen.material.map !== tex) {
            vis.digitalTempScreen.material.map = tex;
            vis.digitalTempScreen.material.needsUpdate = true;
          }
        }
        if (vis.airStreamLines) {
          this.acBlowerSpeed = ref.blowerSpeed || 0;
        }
        if (vis.clutchDisc) {
          vis.clutchDisc.position.z = this.acIsClutchEngaged ? 0.27 : 0.31;
        }
      }

      if (this.acClutchPlate) {
        this.acClutchPlate.position.x = this.acIsClutchEngaged ? 1.18 : 1.24;
      }
    }

    for (const evt of snapshot.shortCircuitEvents || []) {
      this.spawnSparkBurst(evt.position);
    }
  }

  spawnSparkBurst(pos = [0, 0, 0.8]) {
    const [x, y, z] = pos;
    for (let i = 0; i < 22; i++) {
      const sparkGeo = new THREE.SphereGeometry(0.08, 6, 6);
      const sparkMat = new THREE.MeshBasicMaterial({
        color: i % 2 === 0 ? 0xfacc15 : 0xf97316,
      });
      const spark = new THREE.Mesh(sparkGeo, sparkMat);
      spark.position.set(x, y, z + 0.5);
      this.effectsLayer.add(spark);
      this.sparkParticles.push({
        mesh: spark,
        vel: new THREE.Vector3(
          (Math.random() - 0.5) * 6,
          (Math.random() - 0.5) * 6,
          2 + Math.random() * 5
        ),
        life: 0.55,
      });
    }
  }

  setCameraPreset(presetName) {
    const isAc = Boolean(this.module?.category?.includes('AC') || this.module?.id?.startsWith('ac'));
    const boardWidth = this.module?.boardSize?.[0] || 21;
    const isWide = boardWidth >= 23;
    const frontZ = isAc ? 24.2 : (isWide ? 25.4 : 22.0);
    const shiftX = isAc ? 0.0 : (isWide ? 0.85 : 0.35);

    if (presetName === 'front') {
      if (isAc) {
        this.camera.position.set(0.0, -1.3, frontZ);
        this.controls.target.set(0.0, -1.0, 0.8);
      } else {
        this.camera.position.set(shiftX, -2.2, frontZ);
        this.controls.target.set(shiftX, -1.7, 0.6);
      }
    } else if (presetName === 'isometric') {
      this.camera.position.set(9.8, -5.2, frontZ - 2.2);
      this.controls.target.set(0.3, -1.8, 0.8);
    } else if (presetName === 'battery') {
      const isFig06 = Boolean(this.module?.id === 'fig06');
      const batTargetY = isFig06 ? -4.7 : -2.66;
      this.camera.position.set(-6.5, batTargetY + 1.2, 10.5);
      this.controls.target.set(isFig06 ? -8.8 : -8.5, batTargetY, 2.2);
    }
    this.controls.update();
  }

  setBoardTheme(hexString) {
    const hex = parseInt(hexString.replace('#', ''), 16);
    this.boardThemeHex = hex;
    if (this.boardMeshMaterial) {
      this.boardMeshMaterial.color.setHex(hex);
    }
  }

  setLabelsVisible(visible) {
    this.labelsVisible = Boolean(visible);
    for (const tagMesh of this.pinSurfaceTags.values()) {
      tagMesh.visible = this.labelsVisible;
    }
  }

  setExplodedView(exploded) {
    this.explodedView = Boolean(exploded);
  }

  setWobbleAmount(value) {
    this.wobbleAmount = Number(value) || 0;
  }

  _bindEvents() {
    const dom = this.renderer.domElement;

    // Prevent browser context menu on right-click so right-click is dedicated to cutting/deleting cables
    dom.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    let pointerDownPos = null;
    let activeMomentaryCompId = null;
    let lastHoverRaycastMs = 0;

    const releaseMomentary = () => {
      if (activeMomentaryCompId) {
        if (this.onComponentPressEnd) this.onComponentPressEnd(activeMomentaryCompId);
        activeMomentaryCompId = null;
        this.controls.enabled = true;
      }
    };

    dom.addEventListener('pointerdown', (e) => {
      pointerDownPos = { x: e.clientX, y: e.clientY, button: e.button };
      if (e.button === 1) {
        e.preventDefault();
        dom.style.cursor = 'grabbing';
        return;
      }
      if (e.button === 0 && this.onComponentPressStart) {
        const rect = dom.getBoundingClientRect();
        this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.pointerNDC, this.camera);
        const hits = this.raycaster.intersectObjects(this.interactiveTargets, false);
        const switchHit = hits.find((h) => h.object.userData?.interactComponentId);
        if (switchHit) {
          const compId = switchHit.object.userData.interactComponentId;
          if (this.onComponentPressStart(compId)) {
            activeMomentaryCompId = compId;
            this.controls.enabled = false;
          }
        }
      }
    });

    dom.addEventListener('pointermove', (e) => {
      // Skip expensive raycasting while panning or rotating camera
      if (e.buttons !== 0) {
        if ((e.buttons & 1) !== 0 && pointerDownPos) {
          const d = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
          if (d > 5) dom.style.cursor = 'grabbing';
        }
        return;
      }

      const now = performance.now();
      if (now - lastHoverRaycastMs < 28) return;
      lastHoverRaycastMs = now;

      const rect = dom.getBoundingClientRect();
      this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointerNDC, this.camera);
      const hits = this.raycaster.intersectObjects(this.interactiveTargets, false);
      const hitPin = hits.find((h) => h.object.userData?.pinData)?.object.userData.pinData || null;

      const planeIntersect = new THREE.Vector3();
      this.raycaster.ray.intersectPlane(this.dragPlane, planeIntersect);

      dom.style.cursor = hits.length > 0 ? 'pointer' : 'default';

      if (this.onPinHover) {
        this.onPinHover({
          pin: hitPin,
          point3D: planeIntersect,
          clientX: e.clientX,
          clientY: e.clientY,
        });
      }
    });

    dom.addEventListener('pointerleave', releaseMomentary);
    dom.addEventListener('pointercancel', releaseMomentary);

    dom.addEventListener('pointerup', (e) => {
      dom.style.cursor = 'default';
      if (activeMomentaryCompId) {
        releaseMomentary();
        pointerDownPos = null;
        return;
      }
      if (!pointerDownPos) return;
      const moved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      pointerDownPos = null;
      if (moved > 7) return;

      const rect = dom.getBoundingClientRect();
      this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointerNDC, this.camera);
      const hits = this.raycaster.intersectObjects(this.interactiveTargets, false);

      // RIGHT CLICK (button === 2): Cut / Delete cable or cancel active wire preview
      if (e.button === 2) {
        const cableHit = hits.find((h) => h.object.userData?.cableId);
        if (cableHit && this.onCableClick) {
          this.onCableClick(cableHit.object.userData.cableId);
        } else if (this.onRightClickCancel) {
          this.onRightClickCancel();
        }
        return;
      }

      // LEFT CLICK (button === 0): Single click takes/connects cables on pins or toggles 3D switches
      if (e.button === 0) {
        if (hits.length === 0) return;
        const pinHit = hits.find((h) => h.object.userData?.pinData);
        if (pinHit && this.onPinClick) {
          this.onPinClick(pinHit.object.userData.pinData);
          return;
        }
        const switchHit = hits.find((h) => h.object.userData?.interactComponentId);
        if (switchHit && this.onComponentInteract) {
          this.onComponentInteract(switchHit.object.userData.interactComponentId);
        }
      }
    });

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.container) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
  }

  renderFrame(deltaSeconds = 0.016) {
    this.clockTime += deltaSeconds;
    this.controls.update();

    // Enforce floor clamp so camera can never dip underneath the trainer stand
    if (this.camera.position.y < FLOOR_Y + 0.55) {
      this.camera.position.y = FLOOR_Y + 0.55;
    }
    if (this.controls.target.y < FLOOR_Y + 1.2) {
      this.controls.target.y = FLOOR_Y + 1.2;
    }

    // Smooth exploded view interpolation
    const targetExplode = this.explodedView ? 1 : 0;
    this.explodeProgress += (targetExplode - this.explodeProgress) * Math.min(1, deltaSeconds * 9);

    for (const [, group] of this.componentGroups.entries()) {
      if (group.userData.type === 'battery_12v') continue;
      group.position.z = group.userData.baseZ + this.explodeProgress * 1.45;
    }

    for (const [, pinGroup] of this.pinMeshes.entries()) {
      if (pinGroup.userData.pinData?.terminalType === 'battery_post') continue;
      pinGroup.position.z = pinGroup.userData.pinData.pos[2] + this.explodeProgress * 1.45;
    }

    // Rebuild cable curves when explodeProgress transitions so cables route underneath lifted components
    if (Math.abs(this.explodeProgress - this.lastSyncedExplode) > 0.015) {
      this.syncCables(this.lastCables, this.lastPinStackGetter);
    }

    // High-frequency acoustic vibration on horn diaphragm when energized
    for (const [, vis] of this.componentVisuals.entries()) {
      if (vis.hornDiscMesh) {
        vis.hornDiscMesh.position.z = vis.isHornEnergized
          ? 0.3 + Math.sin(this.clockTime * 95) * 0.03
          : 0.3;
      }
      if (vis.isMotor && vis.actuatorMesh) {
        if (vis.isMotorRunning) {
          vis.actuatorMesh.rotation.x += deltaSeconds * 28;
        }
      }
      if (vis.isBuzzer && vis.buzzerWave) {
        if (vis.isBuzzerActive) {
          const wavePhase = (this.clockTime * 6) % 1;
          const waveScale = 1.0 + wavePhase * 0.45;
          vis.buzzerWave.scale.set(waveScale, waveScale, 1);
          vis.buzzerWave.material.opacity = (1 - wavePhase) * 0.85;
        } else {
          vis.buzzerWave.material.opacity = 0;
        }
      }
      if (vis.airStreamLines && vis.airStreamLines.length > 0) {
        const speed = this.acBlowerSpeed || 0;
        const targetOpacity = speed === 3 ? 0.95 : speed === 2 ? 0.70 : speed === 1 ? 0.40 : 0.0;
        const travelLen = speed === 3 ? 2.4 : speed === 2 ? 1.7 : speed === 1 ? 1.05 : 0.0;
        const waveFreq = speed === 3 ? 16 : speed === 2 ? 11 : 7;
        const waveAmp = speed === 3 ? 0.15 : speed === 2 ? 0.10 : 0.055;

        for (let idx = 0; idx < vis.airStreamLines.length; idx++) {
          const item = vis.airStreamLines[idx];
          item.line.material.opacity = THREE.MathUtils.lerp(item.line.material.opacity, targetOpacity, 0.15);
          item.line.visible = item.line.material.opacity > 0.02;

          if (item.line.visible && speed > 0) {
            const posAttr = item.line.geometry.getAttribute('position');
            const arr = posAttr.array;
            const N = item.segCount;

            for (let k = 0; k < N; k++) {
              const tNorm = k / (N - 1);
              const curZ = item.baseZ + tNorm * travelLen;
              // Undulating vertically up and down in Y with traveling wave
              const waveY = Math.sin(this.clockTime * waveFreq - tNorm * 7.0 + item.phaseOffset) * (waveAmp * tNorm);
              const flutterX = Math.cos(this.clockTime * (waveFreq * 0.6) + tNorm * 3.5 + item.phaseOffset) * (0.02 * tNorm);

              arr[k * 3 + 0] = item.lineX + flutterX;
              arr[k * 3 + 1] = item.baseY + waveY;
              arr[k * 3 + 2] = curZ;
            }
            posAttr.needsUpdate = true;
          }
        }
      }
      if (vis.isFan && vis.fanBlades && this.acIsFanRunning) {
        vis.fanBlades.rotation.z += deltaSeconds * 30;
      }
      if (vis.isClutch && vis.clutchDisc && this.acIsClutchEngaged) {
        vis.clutchDisc.rotation.z += deltaSeconds * 25;
      }
    }

    // AC Mechanical Drive Animations (lower shelf motor & compressor)
    if (this.acCompressorRpm > 0 && this.acMotorPulley) {
      const rotSpeed = deltaSeconds * (this.acCompressorRpm * 0.012);
      this.acMotorPulley.rotation.x += rotSpeed;
      if (this.acIsClutchEngaged) {
        if (this.acCompressorPulley) this.acCompressorPulley.rotation.x += rotSpeed;
        if (this.acClutchPlate) this.acClutchPlate.rotation.x += rotSpeed;
      }
    }

    if (this.acIsFanRunning && this.acCondenserFan) {
      this.acCondenserFan.rotation.z += deltaSeconds * 35;
    }

    // Update short-circuit spark particles
    for (let i = this.sparkParticles.length - 1; i >= 0; i--) {
      const p = this.sparkParticles[i];
      p.life -= deltaSeconds;
      if (p.life <= 0) {
        this.effectsLayer.remove(p.mesh);
        this.sparkParticles.splice(i, 1);
      } else {
        p.mesh.position.addScaledVector(p.vel, deltaSeconds);
        p.vel.y -= 9.8 * deltaSeconds;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}
