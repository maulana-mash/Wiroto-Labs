import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCALE_CM_PER_UNIT,
  computePinDistanceCm,
  validateCableConnection,
  CableManager,
  CABLE_TYPES,
} from '../src/core/cableEngine.js';
import { MODULES, getModuleById } from '../src/core/modulesData.js';

test('computePinDistanceCm converts 3D world distance using 2.5 cm per unit', () => {
  const pinA = { id: 'P1', pos: [0, 0, 0] };
  const pinB = { id: 'P2', pos: [6, 8, 0] }; // 10 units * 2.5 = 25.0 cm
  assert.equal(SCALE_CM_PER_UNIT, 2.5);
  assert.equal(computePinDistanceCm(pinA, pinB), 25.0);
});

test('Cable options support 10, 20, 30, 50 cm with jumper-10 handling short connections', () => {
  const trayJumpers = Object.values(CABLE_TYPES).filter((c) => c.category === 'jumper' && !c.hiddenFromTray);
  const lengths = trayJumpers.map((c) => c.maxLengthCm);
  assert.deepEqual(lengths, [10, 20, 30, 50], 'Tray must offer 10, 20, 30, 50 cm jumper cables');

  const p1 = { id: 'P1', pos: [0, 0, 0], terminalType: 'banana' };
  const p2 = { id: 'P2', pos: [2.4, 0, 0], terminalType: 'banana' }; // 6 cm
  const p3 = { id: 'P3', pos: [6, 0, 0], terminalType: 'banana' }; // 15 cm

  const fit10 = validateCableConnection({ pinA: p1, pinB: p2, cableTypeId: 'jumper-10', color: 'red' });
  assert.equal(fit10.ok, true, 'jumper-10 should connect 6 cm span');

  const overflow10 = validateCableConnection({ pinA: p1, pinB: p3, cableTypeId: 'jumper-10', color: 'red' });
  assert.equal(overflow10.ok, false, 'jumper-10 should reject 15 cm span');
  assert.equal(overflow10.reason, 'CABLE_TOO_SHORT');
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
  assert.ok(MODULES.length >= 6);
  const ids = MODULES.map((m) => m.id);
  assert.ok(['fig01', 'fig02', 'fig03', 'fig04', 'fig05', 'fig06'].every((id) => ids.includes(id)));
  const full = getModuleById('fig06');
  assert.ok(full.components.length >= 12);
  assert.ok(full.pins.some((p) => p.id === 'BAT_POS'));
  assert.ok(full.pins.some((p) => p.id === 'BAT_NEG'));
});
