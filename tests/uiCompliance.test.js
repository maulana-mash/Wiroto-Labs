import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getModuleById } from '../src/core/modulesData.js';
import { CableManager } from '../src/core/cableEngine.js';
import { CircuitSolver } from '../src/core/circuitSolver.js';

const ROOT = process.cwd();

test('UI files contain zero Unicode emojis and use pure inline SVG icons + Plus Jakarta Sans typography', () => {
  const filesToCheck = [
    'index.html',
    'src/styles/main.css',
    'src/app.js',
    'src/scene/trainerScene3D.js',
    'src/scene/componentInspector3D.js',
    'src/core/cableEngine.js',
    'src/core/modulesData.js',
    'src/core/circuitSolver.js',
    'src/core/nodalSolver.js',
    'src/core/multimeterEngine.js',
  ];

  // Extended pictographic Unicode range for emojis
  const emojiRegex = /\p{Extended_Pictographic}/u;

  for (const rel of filesToCheck) {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    assert.equal(
      emojiRegex.test(content),
      false,
      `File ${rel} contains a forbidden emoji character`
    );
  }

  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  assert.ok(html.includes('<svg'), 'index.html must use inline SVG icons');
  assert.ok(html.includes('Plus+Jakarta+Sans'), 'index.html must load Plus Jakarta Sans headline font');
});

test('Fig. 06 Full Automotive Body Electrical Trainer simulates Horn, Low/High Beam, and Turn/Hazard end-to-end', () => {
  const mod = getModuleById('fig06');
  const mgr = new CableManager(mod.pins);
  const solver = new CircuitSolver(mod);

  for (const w of mod.demoWires) {
    const res = mgr.addCable(w);
    assert.equal(res.ok, true, `Failed wire ${w.fromPin}->${w.toPin}`);
  }

  // Verify pin stacking is used on ground/power distribution in Fig. 06
  assert.ok(mgr.getPinStackCount('F4_OUT') >= 3, 'F4_OUT should have stacked banana plugs');
  assert.ok(mgr.getPinStackCount('GND_MID') >= 3, 'GND_MID should have stacked banana plugs');

  // Turn ignition to IG
  solver.setSwitchState('IGN_SW', 'IG');

  // 1. Test Horn
  solver.setSwitchState('HORN_BTN', 'ON');
  let snap = solver.step(mgr.getCables(), 0.05);
  assert.equal(snap.componentStates['RLY_HORN'].relayClosed, true);
  assert.equal(snap.componentStates['HORN_1'].energized, true);
  solver.setSwitchState('HORN_BTN', 'OFF');

  // 2. Test Headlamp Low & High Beam
  solver.setSwitchState('SW_DIMMER', 'LOW');
  snap = solver.step(mgr.getCables(), 0.05);
  assert.equal(snap.componentStates['RLY_LOW'].relayClosed, true);
  assert.equal(snap.componentStates['HL_MAIN'].lowBeam, true);
  assert.equal(snap.componentStates['HL_MAIN'].highBeam, false);

  solver.setSwitchState('SW_DIMMER', 'HIGH');
  snap = solver.step(mgr.getCables(), 0.05);
  assert.equal(snap.componentStates['RLY_HIGH'].relayClosed, true);
  assert.equal(snap.componentStates['HL_MAIN'].highBeam, true);

  // 3. Test Turn Signal & Hazard
  solver.setSwitchState('SW_TURN', 'LEFT');
  snap = solver.step(mgr.getCables(), 0.05);
  assert.equal(snap.componentStates['FLASHER_1'].energized, true);
  assert.equal(snap.componentStates['TURN_LAMPS'].lhOn, true);
  assert.equal(snap.componentStates['TURN_LAMPS'].rhOn, false);

  solver.setSwitchState('SW_TURN', 'OFF');
  solver.setSwitchState('SW_HAZARD', 'ON');
  snap = solver.step(mgr.getCables(), 0.05);
  assert.equal(snap.componentStates['TURN_LAMPS'].lhOn, true);
  assert.equal(snap.componentStates['TURN_LAMPS'].rhOn, true);

  assert.ok(snap.checklistStatus.every((c) => c.completed));
});
