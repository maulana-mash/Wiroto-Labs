# Automotive Electrical 3D Bench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Web & Windows Desktop 3D Automotive Body Electrical Trainer simulator (`Automotive Bench`) with rotatable Three.js 3D camera, Robotics Bench hand-inked aesthetic, 6 progressive curriculum modules (`Fig. 01` to `Fig. 06`), physical cable length limits (`20 cm`, `25 cm`, `30 cm`, `50 cm`, alligator clips), stackable 3D banana plugs, and a real-time 12V DC circuit & short-circuit solver.

**Architecture:** Modular ES6 application served locally via a zero-dependency Python HTTP server and Windows WebView/App-mode launcher scripts (`run-webview-app.bat`, `run-browser.bat`, `launch.bat`), tested with Node.js built-in test runner (`node --test`). The core electrical & cable-distance logic (`src/core/`) is decoupled from the Three.js 3D scene & Web Audio synthesizer (`src/scene/`, `src/audio/`) so all physics, distance constraints, pin stacking, relay/flasher dynamics, and short-circuit fuse protection are deterministically unit-tested.

**Tech Stack:** HTML5, CSS3 (Robotics Bench Neo-Brutalist Cream/Paper & Ink aesthetic, pure inline SVG icons), Vanilla JavaScript ES Modules, Three.js (`v0.160.0` + `OrbitControls` + `CSS2DRenderer`), Web Audio API (procedural relay click, flasher tick-tock, horn buzz, fuse pop, and lofi ambient synth), Node.js `node:test` for automated unit verification, Python 3 `http.server` for Windows desktop launcher.

**Spec:** `docs/superpowers/specs/2026-11-11-automotive-bench-design.md`

## Global Constraints

- Zero Unicode emojis in any HTML, CSS, or JS UI strings — all icons must be pure inline `<svg>` elements with clean `viewBox`, `stroke`, and `stroke-width`.
- Scale conversion: `1` Three.js world unit = `2.5 cm` physical trainer distance (`SCALE_CM_PER_UNIT = 2.5`).
- Cable catalog lengths:
  - `alligator-red`: max `60 cm`, connects only when at least one endpoint is `BAT+` or `IN+`.
  - `alligator-black`: max `60 cm`, connects only when at least one endpoint is `BAT-` or `GND`.
  - `jumper-20`: max `20 cm` (`red` or `black`).
  - `jumper-25`: max `25 cm` (`red` or `black`).
  - `jumper-30`: max `30 cm` (`red` or `black`).
  - `jumper-50`: max `50 cm` (`red` or `black`).
- Stackable banana plugs: each terminal pin supports unlimited stacked plugs (`stackIndex = 0, 1, 2, ...`); each additional plug connected to the same pin increments its stack height offset by `0.28` world units along the pin normal and shares electrical continuity on that node.
- Curriculum modules in left sidebar:
  - `fig01`: Rangkaian Sekring (Fuse) & Beban Tunggal
  - `fig02`: Rangkaian Relay 4-Kaki (`30-85-86-87`) & Klakson
  - `fig03`: Lampu Kota (Tail/Clearance) & Lampu Rem (Brake Switch)
  - `fig04`: Lampu Kepala Jauh/Dekat (Headlamp Low/High Beam + Dual Relay)
  - `fig05`: Sistem Lampu Sein (Turn Signal) & Hazard (Flasher `B-L-E`)
  - `fig06`: Full Automotive Body Electrical Trainer (Semua Part Terpasang)

## Review Focus

- Connecting two pins whose 3D Euclidean distance in cm exceeds the selected cable's `maxLengthCm` must be rejected with `ok: false, reason: 'CABLE_TOO_SHORT'` and the exact `distanceCm` and `maxLengthCm`.
- Connecting two distant pins via an intermediate pin (stacking two shorter cables on the intermediate pin) must succeed, increment `getPinStackCount(pinId)` to `2` on the intermediate pin, and establish full electrical continuity between the start and end pins.
- Using a regular banana jumper (`jumper-20`, `jumper-25`, `jumper-30`, `jumper-50`) directly on battery lead posts (`BAT+` or `BAT-`) must be rejected with `reason: 'REQUIRES_ALLIGATOR_CLIP'` because the 12V battery posts require alligator clips.
- Creating a direct zero-load path from `+12V` (`BAT+`) through a fuse (`F1`..`F6`) to `GND` (`BAT-`) must immediately mark that fuse as `blown: true`, trigger the `shortCircuitEvents` list, and cut downstream current on that fuse branch.
- Removing a cable from the middle of a stacked pin must recalculate `stackOrder` (`0..n-1`) for the remaining plugs on that pin without leaving gaps.

---

### Task 1: Project Scaffolding, Curriculum Modules Definition, and Cable Distance / Stacking Engine

**Files:**
- Create: `package.json`
- Create: `src/core/cableEngine.js`
- Create: `src/core/modulesData.js`
- Test: `tests/cableEngine.test.js`

**Interfaces:**
- Produces:
  - `SCALE_CM_PER_UNIT = 2.5`
  - `CABLE_TYPES`: map of `{ id, label, category: 'alligator' | 'jumper', maxLengthCm, allowedColors }`
  - `computePinDistanceCm(pinA, pinB) -> number` (rounded to 1 decimal place)
  - `validateCableConnection({ pinA, pinB, cableTypeId, color, existingCables }) -> { ok: boolean, reason?: string, distanceCm: number, maxLengthCm: number, message: string }`
  - `CableManager` class:
    - `addCable({ fromPin, toPin, cableTypeId, color }) -> { ok: boolean, cable?: Object, validation: Object }`
    - `removeCable(cableId) -> boolean`
    - `clearAll() -> void`
    - `getPinStackCount(pinId) -> number`
    - `getPinPlugStack(pinId) -> Array<{ cableId, end: 'from' | 'to', stackIndex: number, color: string, category: string }>`
    - `getCables() -> Array<Object>`
  - `MODULES`: array of 6 curriculum module definitions (`fig01`..`fig06`), each containing `{ id, figLabel, title, subtitle, category, description, components, pins, checklist, demoWires }`

- [ ] **Step 1: Write the failing test in `tests/cableEngine.test.js`**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCALE_CM_PER_UNIT,
  computePinDistanceCm,
  validateCableConnection,
  CableManager,
} from '../src/core/cableEngine.js';
import { MODULES, getModuleById } from '../src/core/modulesData.js';

test('computePinDistanceCm converts 3D world distance using 2.5 cm per unit', () => {
  const pinA = { id: 'P1', pos: [0, 0, 0] };
  const pinB = { id: 'P2', pos: [6, 8, 0] }; // 10 units * 2.5 = 25.0 cm
  assert.equal(SCALE_CM_PER_UNIT, 2.5);
  assert.equal(computePinDistanceCm(pinA, pinB), 25.0);
});

test('validateCableConnection rejects cable when distance exceeds selected length', () => {
  const pinA = { id: 'F1_OUT', pos: [0, 0, 0], terminalType: 'banana' };
  const pinB = { id: 'HL_L_IN', pos: [12, 0, 0], terminalType: 'banana' }; // 30 cm
  const res = validateCableConnection({
    pinA,
    pinB,
    cableTypeId: 'jumper-20',
    color: 'red',
    existingCables: [],
  });
  assert.equal(res.ok, false);
  assert.equal(res.reason, 'CABLE_TOO_SHORT');
  assert.equal(res.distanceCm, 30.0);
  assert.equal(res.maxLengthCm, 20);
});

test('validateCableConnection requires alligator clip on battery posts BAT+ and BAT-', () => {
  const batPos = { id: 'BAT_POS', pos: [0, -6, 2], terminalType: 'battery_post' };
  const boardIn = { id: 'BOARD_POS', pos: [0, 0, 0], terminalType: 'banana' };
  const bad = validateCableConnection({
    pinA: batPos,
    pinB: boardIn,
    cableTypeId: 'jumper-50',
    color: 'red',
    existingCables: [],
  });
  assert.equal(bad.ok, false);
  assert.equal(bad.reason, 'REQUIRES_ALLIGATOR_CLIP');

  const good = validateCableConnection({
    pinA: batPos,
    pinB: boardIn,
    cableTypeId: 'alligator-red',
    color: 'red',
    existingCables: [],
  });
  assert.equal(good.ok, true);
});

test('CableManager supports stacking multiple banana plugs on an intermediate pin and re-indexes on removal', () => {
  const pinA = { id: 'P_START', pos: [0, 0, 0], terminalType: 'banana' };
  const pinMid = { id: 'P_MID', pos: [6, 0, 0], terminalType: 'banana' }; // 15 cm from P_START
  const pinEnd = { id: 'P_END', pos: [12, 0, 0], terminalType: 'banana' }; // 15 cm from P_MID, 30 cm from P_START

  const mgr = new CableManager([pinA, pinMid, pinEnd]);
  const direct = mgr.addCable({ fromPin: 'P_START', toPin: 'P_END', cableTypeId: 'jumper-20', color: 'red' });
  assert.equal(direct.ok, false);

  const first = mgr.addCable({ fromPin: 'P_START', toPin: 'P_MID', cableTypeId: 'jumper-20', color: 'red' });
  const second = mgr.addCable({ fromPin: 'P_MID', toPin: 'P_END', cableTypeId: 'jumper-20', color: 'red' });
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.equal(mgr.getPinStackCount('P_MID'), 2);

  const stack = mgr.getPinPlugStack('P_MID');
  assert.deepEqual(stack.map((s) => s.stackIndex), [0, 1]);

  mgr.removeCable(first.cable.id);
  const stackAfter = mgr.getPinPlugStack('P_MID');
  assert.equal(stackAfter.length, 1);
  assert.equal(stackAfter[0].stackIndex, 0);
});

test('MODULES defines all 6 required automotive curriculum figures including Fig. 06 Full Trainer', () => {
  assert.equal(MODULES.length, 6);
  const ids = MODULES.map((m) => m.id);
  assert.deepEqual(ids, ['fig01', 'fig02', 'fig03', 'fig04', 'fig05', 'fig06']);
  const full = getModuleById('fig06');
  assert.ok(full.components.length >= 12);
  assert.ok(full.pins.some((p) => p.id === 'BAT_POS'));
  assert.ok(full.pins.some((p) => p.id === 'BAT_NEG'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/cableEngine.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../src/core/cableEngine.js`

- [ ] **Step 3: Implement `package.json`, `src/core/cableEngine.js`, and `src/core/modulesData.js`**

Create `package.json` with `"type": "module"` and `"scripts": { "test": "node --test tests/*.test.js" }`. Implement `src/core/cableEngine.js` and `src/core/modulesData.js` with all 6 curriculum modules (`fig01`..`fig06`), 3D coordinates for every component and pin, battery posts in the lower bay, wiring checklists, and demo wire presets.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/cableEngine.test.js`
Expected: PASS (5/5 tests passing)

---

### Task 2: 12V DC Automotive Electrical Circuit Solver (Relays, Flasher, Fuse Blow/Short-Circuit, Loads)

**Files:**
- Create: `src/core/circuitSolver.js`
- Test: `tests/circuitSolver.test.js`

**Interfaces:**
- Consumes: `MODULES`, `getModuleById` from `src/core/modulesData.js`; `CableManager` from `src/core/cableEngine.js`
- Produces:
  - `CircuitSolver` class:
    - `constructor(moduleDef)`
    - `setSwitchState(componentId, stateValue)`
    - `resetFuses()`
    - `step(cables, deltaSeconds) -> SimulationSnapshot`
  - `SimulationSnapshot`:
    - `pinVoltages`: `Record<string, '12V' | 'GND' | 'FLOAT'>`
    - `componentStates`: `Record<string, { energized: boolean, activeMode?: string, blown?: boolean, relayClosed?: boolean, blinkingOn?: boolean }>`
    - `shortCircuitEvents`: `Array<{ fuseId: string | null, message: string, position: [number, number, number] }>`
    - `checklistStatus`: `Array<{ id: string, label: string, completed: boolean }>`
    - `boardPowered`: `boolean`

- [ ] **Step 1: Write the failing test in `tests/circuitSolver.test.js`**

```javascript
import test from 'node:test';
import assert from 'node:assert/strict';
import { getModuleById } from '../src/core/modulesData.js';
import { CableManager } from '../src/core/cableEngine.js';
import { CircuitSolver } from '../src/core/circuitSolver.js';

test('CircuitSolver energizes single lamp via battery alligator clips, ignition switch, and fuse in Fig. 01', () => {
  const mod = getModuleById('fig01');
  const mgr = new CableManager(mod.pins);
  const solver = new CircuitSolver(mod);

  for (const w of mod.demoWires) {
    const res = mgr.addCable(w);
    assert.equal(res.ok, true, `Demo wire ${w.fromPin}->${w.toPin} failed: ${res.validation?.message}`);
  }

  // With ignition OFF, lamp is off
  let snap = solver.step(mgr.getCables(), 0.1);
  assert.equal(snap.boardPowered, true);
  assert.equal(snap.componentStates['LAMP_TEST'].energized, false);

  // Turn ignition to IG and press push switch
  solver.setSwitchState('IGN_SW', 'IG');
  solver.setSwitchState('SW_PUSH', 'ON');
  snap = solver.step(mgr.getCables(), 0.1);
  assert.equal(snap.componentStates['LAMP_TEST'].energized, true);
  assert.ok(snap.checklistStatus.every((c) => c.completed));
});

test('CircuitSolver blows fuse immediately when +12V after fuse is wired directly to GND (short circuit)', () => {
  const mod = getModuleById('fig01');
  const mgr = new CableManager(mod.pins);
  const solver = new CircuitSolver(mod);

  mgr.addCable({ fromPin: 'BAT_POS', toPin: 'BOARD_POS', cableTypeId: 'alligator-red', color: 'red' });
  mgr.addCable({ fromPin: 'BAT_NEG', toPin: 'BOARD_GND', cableTypeId: 'alligator-black', color: 'black' });
  mgr.addCable({ fromPin: 'BOARD_POS', toPin: 'F1_IN', cableTypeId: 'jumper-25', color: 'red' });
  // Direct short from F1_OUT to BOARD_GND
  mgr.addCable({ fromPin: 'F1_OUT', toPin: 'BOARD_GND', cableTypeId: 'jumper-30', color: 'black' });

  const snap = solver.step(mgr.getCables(), 0.1);
  assert.equal(snap.componentStates['FUSE_1'].blown, true);
  assert.equal(snap.shortCircuitEvents.length, 1);
  assert.equal(snap.shortCircuitEvents[0].fuseId, 'FUSE_1');
});

test('CircuitSolver activates 4-pin relay coil (85-86) to close contact (30-87) and sound horn in Fig. 02', () => {
  const mod = getModuleById('fig02');
  const mgr = new CableManager(mod.pins);
  const solver = new CircuitSolver(mod);

  for (const w of mod.demoWires) {
    const res = mgr.addCable(w);
    assert.equal(res.ok, true, `Demo wire ${w.fromPin}->${w.toPin} failed: ${res.validation?.message}`);
  }

  solver.setSwitchState('IGN_SW', 'IG');
  solver.setSwitchState('HORN_BTN', 'OFF');
  let snap = solver.step(mgr.getCables(), 0.1);
  assert.equal(snap.componentStates['RLY_1'].relayClosed, false);
  assert.equal(snap.componentStates['HORN_1'].energized, false);

  solver.setSwitchState('HORN_BTN', 'ON');
  snap = solver.step(mgr.getCables(), 0.1);
  assert.equal(snap.componentStates['RLY_1'].relayClosed, true);
  assert.equal(snap.componentStates['HORN_1'].energized, true);
});

test('All 6 modules have valid demoWires that pass distance validation', () => {
  for (const id of ['fig01', 'fig02', 'fig03', 'fig04', 'fig05', 'fig06']) {
    const mod = getModuleById(id);
    const mgr = new CableManager(mod.pins);
    for (const w of mod.demoWires) {
      const res = mgr.addCable(w);
      assert.equal(res.ok, true, `[${id}] ${w.fromPin}->${w.toPin} (${w.cableTypeId}): ${res.validation?.message}`);
    }
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/circuitSolver.test.js`
Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `../src/core/circuitSolver.js`

- [ ] **Step 3: Implement `src/core/circuitSolver.js`**

Implement iterative two-pass graph propagation:
1. Pass 1 resolves passive internal connections (closed switches, intact fuses, closed relay contacts from previous/current coil evaluation) and checks if any intact fuse bridges `12V` and `GND` through a zero-resistance path — if so, marks that fuse `blown = true` and emits a `shortCircuitEvent`.
2. Pass 2 evaluates relay coils (`85` vs `86` having opposite potentials `12V` and `GND`), updates relay contact closure (`30` to `87`), re-propagates `12V`/`GND` through newly closed relay contacts, evaluates flasher unit (`B` at `12V`, `E` at `GND`, oscillator toggling `L` at `1.4 Hz` when connected to a turn/hazard lamp load), and updates all lamps, horns, and checklist items.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/*.test.js`
Expected: PASS (all tests in `cableEngine.test.js` and `circuitSolver.test.js` pass)

---

### Task 3: Procedural Web Audio Engine & 3D Three.js Trainer Scene (Orbit Camera, Hand-Inked Outline, Stackable Plugs, Catenary Wires, Sparks)

**Files:**
- Create: `src/audio/soundEngine.js`
- Create: `src/scene/trainerScene3D.js`

**Interfaces:**
- Consumes: `SCALE_CM_PER_UNIT`, `computePinDistanceCm` from `src/core/cableEngine.js`
- Produces:
  - `SoundEngine` class (`setEffectsEnabled`, `setLofiEnabled`, `playPlugSnap`, `playRelayClick`, `playFlasherTick`, `setHornActive`, `playShortSpark`)
  - `TrainerScene3D` class:
    - `loadModule(moduleDef)`
    - `syncCables(cables, pinStackGetter)`
    - `syncSimulation(snapshot)`
    - `setCameraPreset(presetName: 'front' | 'isometric' | 'battery' | 'top')`
    - `setBoardTheme(hexColor)`
    - `setWobbleAmount(value)`
    - `setLabelsVisible(visible)`
    - `setExplodedView(exploded)`

- [ ] **Step 1: Implement `src/audio/soundEngine.js`**

Build a zero-asset procedural Web Audio synthesizer generating mechanical banana-plug thuds, electromagnetic relay clicks, thermal flasher tick-tock pulses, dual-tone automotive horn (`400 Hz + 500 Hz`), short-circuit fuse pop/crackle, and an optional warm lofi chord loop matching Robotics Bench.

- [ ] **Step 2: Implement `src/scene/trainerScene3D.js`**

Build the Three.js 3D scene:
- Full 3D trainer stand with tilted upper aluminum/phenolic panel, lower battery shelf holding a detailed 3D 12V Automotive Lead-Acid Battery (`BAT+` red lead post, `BAT-` black lead post), and a 3D Wire Rack on the right side of the lower shelf.
- 3D Automotive Components (`ignition`, `fuse_box`, `relay_4p`, `flasher`, `switch_push`, `switch_toggle`, `switch_combo`, `switch_hazard`, `horn`, `headlamp`, `lamp_amber`, `lamp_red`, `lamp_test`, `power_rail`, `dashboard_cluster`) with dark hand-inked edge outlines (`THREE.EdgesGeometry` + `THREE.LineSegments`).
- 3D Banana sockets with color-coded collars and interactive raycasting.
- Stackable 3D Banana Plugs (`stackIndex * 0.28` height offset along socket normal) and 3D Alligator Clips on the battery posts.
- Smooth 3D catenary/bezier sagging cables (`THREE.TubeGeometry`) plus live drag preview curve with real-time distance badge (`XX.X cm / YY cm`) that turns red if the selected cable is too short.
- Particle emitter for fuse short-circuit sparks & smoke.

---

### Task 4: Robotics Bench UI, Wire Storage Drawer, Interactive Switches, & Windows Standalone Launchers

**Files:**
- Create: `index.html`
- Create: `src/styles/main.css`
- Create: `src/app.js`
- Create: `serve.py`
- Create: `run-webview-app.bat`
- Create: `run-browser.bat`
- Create: `launch.bat`
- Create: `README.md`

**Interfaces:**
- Consumes: `MODULES`, `getModuleById`, `CABLE_TYPES`, `CableManager`, `CircuitSolver`, `TrainerScene3D`, `SoundEngine`

- [ ] **Step 1: Create `index.html` and `src/styles/main.css`**

Implement the Robotics Bench aesthetic (warm archival paper `#f3efe6`, crisp ink borders `#1b1b18`, monospace technical labels, left curriculum roadmap `Fig. 01`..`Fig. 06`, top floating status & action toolbar, right/bottom **Rak Penyimpanan Kabel (Wire Storage)** selector with `Jepit Buaya (+)/(-)`, `20 cm`, `25 cm`, `30 cm`, `50 cm` in `Merah`/`Hitam`, interactive switch control bar, and bottom collapsible `Meet the Board` + `Wiring Checklist` drawer). Use 100% pure inline `<svg>` icons (zero emojis).

- [ ] **Step 2: Create `src/app.js`**

Wire UI state, module switching, wire rack selection, pin click/hover connection workflow (with stackable pin tooltip & live distance indicator), switch state toggling, auto-wire demo, fuse replacement, camera presets, and simulation loop.

- [ ] **Step 3: Create Windows Standalone Launchers (`serve.py`, `run-webview-app.bat`, `run-browser.bat`, `launch.bat`, `README.md`)**

Create the local HTTP server and one-click Windows Desktop App launcher (`msedge --app` / `chrome --app`) so the user can run Automotive Bench either as a standalone Windows Desktop window or in any browser.

- [ ] **Step 4: Run Automated Tests & Live HTTP Verification**

Run: `node --test tests/*.test.js`
Expected: PASS (all unit & integration tests pass, HTTP server serves `index.html` and all ES modules with `200 OK`).
