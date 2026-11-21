import test from 'node:test';
import assert from 'node:assert/strict';
import { getModuleById } from '../src/core/modulesData.js';
import { CableManager } from '../src/core/cableEngine.js';
import { CircuitSolver } from '../src/core/circuitSolver.js';
import { MultimeterEngine } from '../src/core/multimeterEngine.js';

function readDmm(dmm, mode, redPin, blackPin, snap, mod, cables) {
  dmm.setMode(mode);
  dmm.attachRedProbe(redPin);
  dmm.attachBlackProbe(blackPin);
  return dmm.update(snap, mod, cables);
}

test('Fig. 00 Resistor Bank supports real series voltage divider & dimmer lamp brightness', () => {
  const mod = getModuleById('fig00');
  const solver = new CircuitSolver(mod);
  const dmm = new MultimeterEngine();

  // Wire BAT_POS -> R1 (10 Ohm) -> Lamp 21W (6.8 Ohm) -> BAT_NEG
  const cables = [
    { fromPin: 'BAT_POS', toPin: 'R1_A', cableTypeId: 'alligator-red', color: 'red' },
    { fromPin: 'R1_B', toPin: 'L21W_POS', cableTypeId: 'jumper-20', color: 'red' },
    { fromPin: 'L21W_NEG', toPin: 'BAT_NEG', cableTypeId: 'alligator-black', color: 'black' },
  ];
  const snap = solver.step(cables, 0.05);

  assert.equal(snap.componentStates['LAMP_21W'].energized, true, 'Lamp 21W in series with 10 Ohm should light up (dimmed)');
  assert.ok(
    snap.componentStates['LAMP_21W'].brightness > 0.2 && snap.componentStates['LAMP_21W'].brightness < 0.6,
    `Series lamp brightness should be dimmed (~0.31), got ${snap.componentStates['LAMP_21W'].brightness}`
  );

  const vBat = parseFloat(readDmm(dmm, 'V_DC', 'BAT_POS', 'BAT_NEG', snap, mod, cables).display);
  const vR1 = parseFloat(readDmm(dmm, 'V_DC', 'R1_A', 'R1_B', snap, mod, cables).display);
  const vLamp = parseFloat(readDmm(dmm, 'V_DC', 'L21W_POS', 'L21W_NEG', snap, mod, cables).display);
  const vDropPos = parseFloat(readDmm(dmm, 'V_DC', 'BAT_POS', 'R1_A', snap, mod, cables).display);
  const vDropMid = parseFloat(readDmm(dmm, 'V_DC', 'R1_B', 'L21W_POS', snap, mod, cables).display);
  const vDropNeg = parseFloat(readDmm(dmm, 'V_DC', 'L21W_NEG', 'BAT_NEG', snap, mod, cables).display);

  // Kirchhoff Voltage Law: sum of drops around loop equals battery terminal voltage
  const sumDrops = vR1 + vLamp + vDropPos + vDropMid + vDropNeg;
  assert.ok(Math.abs(sumDrops - vBat) < 0.04, `KVL violated: sum(${sumDrops.toFixed(2)}) vs Vbat(${vBat})`);
  assert.ok(vR1 > 7.2 && vR1 < 7.7, `V(R1) should be ~7.47V, got ${vR1}`);
  assert.ok(vLamp > 4.9 && vLamp < 5.3, `V(L21W) should be ~5.08V, got ${vLamp}`);
});

test('Fig. 00 LED enforces forward vs reverse diode polarity', () => {
  const mod = getModuleById('fig00');
  const solver = new CircuitSolver(mod);

  // Forward bias: BAT_POS -> LED_A, LED_K -> BAT_NEG
  const fwdCables = [
    { fromPin: 'BAT_POS', toPin: 'LED_A', cableTypeId: 'alligator-red', color: 'red' },
    { fromPin: 'LED_K', toPin: 'BAT_NEG', cableTypeId: 'alligator-black', color: 'black' },
  ];
  const fwdSnap = solver.step(fwdCables, 0.05);
  assert.equal(fwdSnap.componentStates['LAMP_LED'].energized, true);

  // Reverse bias: BAT_POS -> LED_K, LED_A -> BAT_NEG
  const revCables = [
    { fromPin: 'BAT_POS', toPin: 'LED_K', cableTypeId: 'alligator-red', color: 'red' },
    { fromPin: 'LED_A', toPin: 'BAT_NEG', cableTypeId: 'alligator-black', color: 'black' },
  ];
  const revSnap = solver.step(revCables, 0.05);
  assert.equal(revSnap.componentStates['LAMP_LED'].energized, false, 'LED must stay OFF under reverse polarity');
  assert.ok(revSnap.batteryCurrent < 0.01, 'Reverse-biased LED should draw zero current');
});

test('Fig. 04 Dual Headlamp High Beam produces realistic positive/ground V-drops and lower load voltage than battery', () => {
  const mod = getModuleById('fig04');
  const mgr = new CableManager(mod.pins);
  for (const w of mod.demoWires) mgr.addCable(w);
  const solver = new CircuitSolver(mod);
  const dmm = new MultimeterEngine();

  solver.setSwitchState('SW_DIMMER', 'HIGH');
  const cables = mgr.getCables();
  const snap = solver.step(cables, 0.05);

  const vBat = parseFloat(readDmm(dmm, 'V_DC', 'BAT_POS', 'BAT_NEG', snap, mod, cables).display);
  const vLoad = parseFloat(readDmm(dmm, 'V_DC', 'HLL_HIGH', 'HLL_GND', snap, mod, cables).display);
  const vDropPos = parseFloat(readDmm(dmm, 'V_DC', 'BAT_POS', 'HLL_HIGH', snap, mod, cables).display);
  const vDropNeg = parseFloat(readDmm(dmm, 'V_DC', 'HLL_GND', 'BAT_NEG', snap, mod, cables).display);

  assert.ok(vBat < 12.6 && vBat > 12.2, `Battery should sag under dual 60W load, got ${vBat}V`);
  assert.ok(vDropPos > 0.2 && vDropPos < 1.0, `Positive path V-drop should be realistic (0.2-1.0V), got ${vDropPos}V`);
  assert.ok(vDropNeg > 0.1 && vDropNeg < 0.7, `Ground path V-drop should be realistic (0.1-0.7V), got ${vDropNeg}V`);
  assert.ok(vLoad < vBat - 0.3, `Headlamp voltage (${vLoad}V) must be lower than battery (${vBat}V)`);
  assert.ok(Math.abs((vLoad + vDropPos + vDropNeg) - vBat) < 0.03, 'KVL must hold on headlamp branch');
});

test('Multimeter OHM/CONTINUITY measures body lamps, series/parallel resistors, switches ON/OFF, and blown fuses accurately', () => {
  const dmm = new MultimeterEngine();

  // 1. Body lamps on Fig. 04 & Fig. 03 (de-energized)
  const mod4 = getModuleById('fig04');
  const s4 = new CircuitSolver(mod4);
  const snap4 = s4.step([], 0.05);
  assert.equal(readDmm(dmm, 'OHM', 'HLL_LOW', 'HLL_GND', snap4, mod4, []).display, '2.6');
  assert.equal(readDmm(dmm, 'OHM', 'HLR_HIGH', 'HLR_GND', snap4, mod4, []).display, '2.4');

  const mod3 = getModuleById('fig03');
  const s3 = new CircuitSolver(mod3);
  const snap3 = s3.step([], 0.05);
  assert.equal(readDmm(dmm, 'OHM', 'LH_TAIL', 'LH_GND', snap3, mod3, []).display, '29');
  assert.equal(readDmm(dmm, 'OHM', 'LH_STOP', 'LH_GND', snap3, mod3, []).display, '6.8');

  // 2. Switch ON vs OFF continuity on Fig. 01
  const mod1 = getModuleById('fig01');
  const s1 = new CircuitSolver(mod1);
  s1.setSwitchState('SW_PUSH', 'OFF');
  let snap1 = s1.step([], 0.05);
  assert.equal(readDmm(dmm, 'CONTINUITY', 'SW_IN', 'SW_OUT', snap1, mod1, []).display, 'O.L');
  assert.equal(readDmm(dmm, 'CONTINUITY', 'SW_IN', 'SW_OUT', snap1, mod1, []).beeping, false);

  s1.setSwitchState('SW_PUSH', 'ON');
  snap1 = s1.step([], 0.05);
  assert.equal(readDmm(dmm, 'CONTINUITY', 'SW_IN', 'SW_OUT', snap1, mod1, []).beeping, true);

  // 3. Blown fuse reads O.L (not 0.1 Ohm!)
  const mgr1 = new CableManager(mod1.pins);
  mgr1.addCable({ fromPin: 'BAT_POS', toPin: 'BOARD_POS', cableTypeId: 'alligator-red', color: 'red' });
  mgr1.addCable({ fromPin: 'BAT_NEG', toPin: 'BOARD_GND', cableTypeId: 'alligator-black', color: 'black' });
  mgr1.addCable({ fromPin: 'BOARD_POS', toPin: 'F1_IN', cableTypeId: 'jumper-25', color: 'red' });
  mgr1.addCable({ fromPin: 'F1_OUT', toPin: 'BOARD_GND', cableTypeId: 'jumper-30', color: 'black' });
  s1.step(mgr1.getCables(), 0.05); // blows F1
  const snapBlown = s1.step([], 0.05); // disconnect wires to test blown fuse with ohmmeter
  const blownRead = readDmm(dmm, 'CONTINUITY', 'F1_IN', 'F1_OUT', snapBlown, mod1, []);
  assert.equal(blownRead.display, 'O.L', 'Blown fuse must read O.L on Ohm/Continuity');
  assert.equal(blownRead.beeping, false);

  // 4. Series & Parallel resistor combinations on Fig. 00 (R1=10 Ohm, R2=50 Ohm)
  const mod0 = getModuleById('fig00');
  const s0 = new CircuitSolver(mod0);
  const seriesRes = [{ fromPin: 'R1_B', toPin: 'R2_A', cableTypeId: 'jumper-10' }];
  const snapSer = s0.step(seriesRes, 0.05);
  assert.equal(readDmm(dmm, 'OHM', 'R1_A', 'R2_B', snapSer, mod0, seriesRes).display, '60');

  const parallelRes = [
    { fromPin: 'R1_A', toPin: 'R2_A', cableTypeId: 'jumper-10' },
    { fromPin: 'R1_B', toPin: 'R2_B', cableTypeId: 'jumper-10' },
  ];
  const snapPar = s0.step(parallelRes, 0.05);
  assert.equal(readDmm(dmm, 'OHM', 'R1_A', 'R1_B', snapPar, mod0, parallelRes).display, '8.3');
});

test('Multimeter A_DC measures real series current via shunt and reads 0.00A on open floating pin', () => {
  const mod1 = getModuleById('fig01');
  const mgr1 = new CableManager(mod1.pins);
  for (const w of mod1.demoWires) {
    if (w.fromPin === 'F1_OUT' && w.toPin === 'SW_IN') continue; // open series gap for ammeter
    mgr1.addCable(w);
  }
  const solver = new CircuitSolver(mod1);
  solver.setSwitchState('IGN_SW', 'IG');
  solver.setSwitchState('SW_PUSH', 'ON');
  const cables = mgr1.getCables();
  const snap = solver.step(cables, 0.05);
  const dmm = new MultimeterEngine();

  // Bridging the open gap reads real ~0.86A for 10W (14.4 Ohm) lamp
  const aSeries = readDmm(dmm, 'A_DC', 'F1_OUT', 'SW_IN', snap, mod1, cables);
  const ampVal = parseFloat(aSeries.display);
  assert.ok(ampVal > 0.78 && ampVal < 0.94, `Expected ~0.86A for 10W lamp, got ${aSeries.display}A`);

  // Reversed probes show negative current
  const aRev = readDmm(dmm, 'A_DC', 'SW_IN', 'F1_OUT', snap, mod1, cables);
  assert.equal(aRev.isNegative, true);

  // Direct parallel short across live +12V to GND (J1_PIN is wired to BOARD_GND) triggers ammeter O.L protection
  const aShort = readDmm(dmm, 'A_DC', 'F1_OUT', 'J1_PIN', snap, mod1, cables);
  assert.equal(aShort.display, 'O.L', 'Shorting +12V to GND with ammeter should trigger O.L overload');

  // Open switch (no closed path to load) draws 0.00A (not hardcoded 1.75A!)
  solver.setSwitchState('SW_PUSH', 'OFF');
  const snapOpen = solver.step(cables, 0.05);
  const aOpen = readDmm(dmm, 'A_DC', 'F1_OUT', 'SW_IN', snapOpen, mod1, cables);
  assert.equal(aOpen.display, '0.00', 'Open circuit ammeter must read 0.00A');
});
