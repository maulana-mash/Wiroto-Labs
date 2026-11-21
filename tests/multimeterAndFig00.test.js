import test from 'node:test';
import assert from 'node:assert/strict';
import { getModuleById } from '../src/core/modulesData.js';
import { CableManager } from '../src/core/cableEngine.js';
import { CircuitSolver } from '../src/core/circuitSolver.js';
import { MultimeterEngine } from '../src/core/multimeterEngine.js';

test('Fig. 00 12V Basic Electricity & Multimeter Lab simulates Ohm law, Buzzer, and Lamp', () => {
  const mod = getModuleById('fig00');
  const mgr = new CableManager(mod.pins);
  const solver = new CircuitSolver(mod);
  const meter = new MultimeterEngine();

  for (const w of mod.demoWires) {
    const res = mgr.addCable(w);
    assert.equal(res.ok, true, `Demo wire ${w.fromPin}->${w.toPin} failed: ${res.validation?.message}`);
  }

  // 1. Initially switches are OFF
  let snap = solver.step(mgr.getCables(), 0.05);
  assert.equal(snap.componentStates['LAMP_21W'].energized, false);
  assert.equal(snap.componentStates['BUZZER_12V'].energized, false);

  // 2. Turn Switch 1 ON -> Lamp 21W lights up
  solver.setSwitchState('SW_TOGGLE_1', 'ON');
  snap = solver.step(mgr.getCables(), 0.05);
  assert.equal(snap.componentStates['LAMP_21W'].energized, true);

  // 3. Turn Switch 2 ON -> Buzzer 12V activates
  solver.setSwitchState('SW_TOGGLE_2', 'ON');
  snap = solver.step(mgr.getCables(), 0.05);
  assert.equal(snap.componentStates['BUZZER_12V'].energized, true);
  assert.ok(snap.checklistStatus.every((c) => c.completed));

  // 4. Multimeter V_DC across battery terminals
  meter.setMode('V_DC');
  meter.attachRedProbe('BAT_POS');
  meter.attachBlackProbe('BAT_NEG');
  let reading = meter.update(snap, mod, mgr.getCables());
  assert.equal(reading.unit, 'V');
  assert.ok(parseFloat(reading.display) > 11.0);

  // 5. Multimeter Continuity across Fuse 1 (de-energized)
  meter.setMode('CONTINUITY');
  meter.attachRedProbe('F1_IN');
  meter.attachBlackProbe('F1_OUT');
  snap.boardPowered = false;
  reading = meter.update(snap, mod, mgr.getCables());
  assert.equal(reading.unit, 'Ω');
  assert.equal(reading.beeping, true);

  // 6. Multimeter Ohm across Lamp 21W (with switches OFF to isolate component — standard workshop procedure)
  solver.setSwitchState('SW_TOGGLE_1', 'OFF');
  solver.setSwitchState('SW_TOGGLE_2', 'OFF');
  snap = solver.step(mgr.getCables(), 0.05);
  meter.setMode('OHM');
  meter.attachRedProbe('L21W_POS');
  meter.attachBlackProbe('L21W_NEG');
  reading = meter.update(snap, mod, mgr.getCables());
  assert.equal(reading.display, '6.8');
  assert.equal(reading.unit, 'Ω');
});
