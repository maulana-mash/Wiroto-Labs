import test from 'node:test';
import assert from 'node:assert/strict';
import { MODULES, getModuleById } from '../src/core/modulesData.js';
import { CableManager } from '../src/core/cableEngine.js';
import { CircuitSolver } from '../src/core/circuitSolver.js';
import { MultimeterEngine } from '../src/core/multimeterEngine.js';

test('AC Modules (ac01, ac02, ac03) are registered in curriculum category 3. KELISTRIKAN SISTEM AC', () => {
  const acModules = MODULES.filter((m) => m.category === '3. KELISTRIKAN SISTEM AC');
  assert.equal(acModules.length, 3, 'Should have exactly 3 modules for AC system');

  const ids = acModules.map((m) => m.id);
  assert.deepEqual(ids, ['ac01', 'ac02', 'ac03']);

  for (const mod of acModules) {
    assert.ok(mod.title.length > 5);
    assert.ok(Array.isArray(mod.components) && mod.components.length > 0);
    assert.ok(Array.isArray(mod.pins) && mod.pins.length > 0);
    assert.ok(Array.isArray(mod.demoWires) && mod.demoWires.length > 0);
    assert.ok(Array.isArray(mod.checklist) && mod.checklist.length > 0);
  }
});

test('ac01 Blower & Resistor: validates demo wires, speeds 0-1-2-3 voltage drops and multimeter readings', () => {
  const mod = getModuleById('ac01');
  const mgr = new CableManager(mod.pins);
  const solver = new CircuitSolver(mod);
  const meter = new MultimeterEngine();

  for (const w of mod.demoWires) {
    const res = mgr.addCable(w);
    assert.equal(res.ok, true, `ac01 demo wire failed: ${w.fromPin} -> ${w.toPin}`);
  }

  // Turn ignition ON
  solver.setSwitchState('IGN_SW', 'IG');

  // 1. Speed 0 (OFF)
  solver.setSwitchState('SW_BLOWER', 'OFF');
  let snap = solver.step(mgr.getCables(), 0.1);
  assert.equal(snap.refrigeration?.blowerSpeed, 0);
  assert.equal(snap.refrigeration?.blowerVoltageDrop, 0);

  // 2. Speed 1 (Low speed via full resistance: ~6V)
  solver.setSwitchState('SW_BLOWER', 'SPEED_1');
  snap = solver.step(mgr.getCables(), 0.1);
  assert.equal(snap.refrigeration?.blowerSpeed, 1);
  assert.equal(snap.refrigeration?.blowerVoltageDrop, 6.0);
  assert.equal(snap.componentStates['EVAPORATOR_UNIT']?.speed, 1);

  // Multimeter DC Voltage across Blower Motor (+ to -)
  meter.setMode('V_DC');
  meter.attachRedProbe('MTR_BLW_POS');
  meter.attachBlackProbe('MTR_BLW_GND');
  let read = meter.update(snap, mod, mgr.getCables());
  assert.equal(read.display, '6.00', 'Multimeter should read 6.00V at blower speed 1');

  // 3. Speed 2 (Medium speed: ~9V)
  solver.setSwitchState('SW_BLOWER', 'SPEED_2');
  snap = solver.step(mgr.getCables(), 0.1);
  assert.equal(snap.refrigeration?.blowerSpeed, 2);
  assert.equal(snap.refrigeration?.blowerVoltageDrop, 9.0);
  read = meter.update(snap, mod, mgr.getCables());
  assert.equal(read.display, '9.00', 'Multimeter should read 9.00V at blower speed 2');

  // 4. Speed 3 (High speed direct battery: 12.6V)
  solver.setSwitchState('SW_BLOWER', 'SPEED_3');
  snap = solver.step(mgr.getCables(), 0.1);
  assert.equal(snap.refrigeration?.blowerSpeed, 3);
  assert.equal(snap.refrigeration?.blowerVoltageDrop, 12.6);
  read = meter.update(snap, mod, mgr.getCables());
  assert.equal(read.display, '12.60', 'Multimeter should read 12.60V at blower speed 3');

  // Checklist verification
  assert.ok(snap.checklistStatus.every((c) => c.completed), 'All ac01 checklist steps should be completed');
});

test('ac02 Magnetic Clutch: validates series safety interlocks and relay energization', () => {
  const mod = getModuleById('ac02');
  const mgr = new CableManager(mod.pins);
  const solver = new CircuitSolver(mod);

  for (const w of mod.demoWires) {
    const res = mgr.addCable(w);
    assert.equal(res.ok, true, `ac02 demo wire failed: ${w.fromPin} -> ${w.toPin}`);
  }

  // Initial state: Ignition OFF -> Clutch OFF
  let snap = solver.step(mgr.getCables(), 0.05);
  assert.equal(snap.componentStates['MAG_CLUTCH']?.energized, false);
  assert.equal(snap.componentStates['EXTRA_FAN']?.energized, false);

  // Turn Ignition to IG, but A/C Switch is OFF -> Clutch still OFF
  solver.setSwitchState('IGN_SW', 'IG');
  solver.setSwitchState('SW_AC_PUSH', 'OFF');
  snap = solver.step(mgr.getCables(), 0.05);
  assert.equal(snap.componentStates['MAG_CLUTCH']?.energized, false);

  // Turn A/C Switch ON, but Thermostat is OFF -> Clutch still OFF
  solver.setSwitchState('SW_AC_PUSH', 'ON');
  solver.setSwitchState('THERMOSTAT_AC', 'OFF');
  snap = solver.step(mgr.getCables(), 0.05);
  assert.equal(snap.componentStates['MAG_CLUTCH']?.energized, false);

  // Thermostat ON, but Pressure Switch trips (OPEN) -> Clutch still OFF
  solver.setSwitchState('THERMOSTAT_AC', 'ON');
  solver.setSwitchState('PRESSURE_SWITCH', 'OPEN');
  snap = solver.step(mgr.getCables(), 0.05);
  assert.equal(snap.componentStates['MAG_CLUTCH']?.energized, false);

  // Pressure Switch CLOSED (Normal) -> All interlocks satisfied!
  solver.setSwitchState('PRESSURE_SWITCH', 'CLOSED');
  snap = solver.step(mgr.getCables(), 0.05);

  assert.equal(snap.componentStates['RLY_CLUTCH']?.relayClosed, true, 'Clutch relay should close');
  assert.equal(snap.componentStates['RLY_FAN']?.relayClosed, true, 'Extra Fan relay should close');
  assert.equal(snap.componentStates['MAG_CLUTCH']?.energized, true, 'Magnetic clutch should be energized');
  assert.equal(snap.componentStates['EXTRA_FAN']?.energized, true, 'Condenser extra fan should run');

  // Verify all checklist items passed
  assert.ok(snap.checklistStatus.every((c) => c.completed), 'All ac02 checklist steps should be completed');
});

test('ac03 Full Trainer AC: integrates Blower, Clutch interlock, Manifold Gauges, and Digital Temperatures', () => {
  const mod = getModuleById('ac03');
  const mgr = new CableManager(mod.pins);
  const solver = new CircuitSolver(mod);

  for (const w of mod.demoWires) {
    const res = mgr.addCable(w);
    assert.equal(res.ok, true, `ac03 demo wire failed: ${w.fromPin} -> ${w.toPin}`);
  }

  // Turn Ignition ON, A/C ON, Thermostat ON, Pressure Switch CLOSED
  solver.setSwitchState('IGN_SW', 'IG');
  solver.setSwitchState('SW_AC_PUSH', 'ON');
  solver.setSwitchState('THERMOSTAT_AC', 'ON');
  solver.setSwitchState('PRESSURE_SWITCH', 'CLOSED');
  solver.setSwitchState('MOTOR_DRIVE_AC', 'IDLE_800');

  // 1. With Blower OFF -> Clutch interlock prevents AC from running
  solver.setSwitchState('SW_BLOWER', 'OFF');
  let snap = solver.step(mgr.getCables(), 0.1);
  assert.equal(snap.refrigeration?.blowerSpeed, 0);
  assert.equal(snap.refrigeration?.clutchEngaged, false);
  // Static pressures: ~80 psi on both Low and High sides
  assert.ok(Math.abs(snap.refrigeration?.lowPressurePsi - 80) < 1.0);
  assert.ok(Math.abs(snap.refrigeration?.highPressurePsi - 80) < 1.0);

  // 2. Turn Blower to Speed 2 -> Clutch engages and refrigeration cycle runs!
  solver.setSwitchState('SW_BLOWER', 'SPEED_2');
  snap = solver.step(mgr.getCables(), 0.1);
  assert.equal(snap.refrigeration?.blowerSpeed, 2);
  assert.equal(snap.refrigeration?.clutchEngaged, true);
  assert.equal(snap.refrigeration?.compressorRpm, 800);

  // Run simulation steps to allow refrigeration pressures and temperatures to evolve
  for (let step = 0; step < 20; step++) {
    snap = solver.step(mgr.getCables(), 0.5);
  }

  // Verify dynamic refrigeration physics:
  // Low pressure drops from 80 psi down towards 28-32 psi
  assert.ok(snap.refrigeration.lowPressurePsi < 45, `Low pressure should drop, got ${snap.refrigeration.lowPressurePsi}`);
  // High pressure rises from 80 psi up towards 180-210 psi
  assert.ok(snap.refrigeration.highPressurePsi > 160, `High pressure should rise, got ${snap.refrigeration.highPressurePsi}`);

  // Discharge air temperature (T3) drops significantly below ambient (T1 = 31.5°C)
  assert.ok(snap.refrigeration.t3VentDischarge < 12.0, `Vent temperature should cool down, got ${snap.refrigeration.t3VentDischarge}`);
  assert.equal(snap.refrigeration.sightGlassState, 'CLEAR');

  // 3. Test Drive Motor RPM changes
  solver.setSwitchState('MOTOR_DRIVE_AC', 'HIGH_2200');
  snap = solver.step(mgr.getCables(), 0.1);
  assert.equal(snap.refrigeration.compressorRpm, 2200);

  // 4. Test that increasing blower speed decreases vent temperature (Requirement 6)
  solver.setSwitchState('SW_BLOWER', 'SPEED_1');
  for (let step = 0; step < 25; step++) snap = solver.step(mgr.getCables(), 0.5);
  const tempSpeed1 = snap.refrigeration.t3VentDischarge;

  solver.setSwitchState('SW_BLOWER', 'SPEED_2');
  for (let step = 0; step < 25; step++) snap = solver.step(mgr.getCables(), 0.5);
  const tempSpeed2 = snap.refrigeration.t3VentDischarge;

  solver.setSwitchState('SW_BLOWER', 'SPEED_3');
  for (let step = 0; step < 25; step++) snap = solver.step(mgr.getCables(), 0.5);
  const tempSpeed3 = snap.refrigeration.t3VentDischarge;

  assert.ok(tempSpeed1 > tempSpeed2, `Speed 1 (${tempSpeed1}°C) should be warmer than Speed 2 (${tempSpeed2}°C)`);
  assert.ok(tempSpeed2 > tempSpeed3, `Speed 2 (${tempSpeed2}°C) should be warmer than Speed 3 (${tempSpeed3}°C)`);

  // Verify checklist
  assert.ok(snap.checklistStatus.every((c) => c.completed), 'All ac03 checklist steps should pass');
});
