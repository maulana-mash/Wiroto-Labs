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

test('All curriculum modules have valid demoWires that pass distance validation', () => {
  for (const id of ['fig00', 'fig01', 'fig02', 'fig03', 'fig04', 'fig05', 'fig06']) {
    const mod = getModuleById(id);
    const mgr = new CableManager(mod.pins);
    for (const w of mod.demoWires) {
      const res = mgr.addCable(w);
      assert.equal(res.ok, true, `[${id}] ${w.fromPin}->${w.toPin} (${w.cableTypeId}): ${res.validation?.message}`);
    }
  }
});
