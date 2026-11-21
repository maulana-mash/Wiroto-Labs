import { solveLinearDC } from './nodalSolver.js';

export const BATTERY_VOC = 12.6; // Open-circuit 12V automotive battery voltage (fully charged)
export const BATTERY_R_INT = 0.02; // Internal resistance of healthy 12V 45Ah lead-acid battery (Ohms)

// Realistic automotive copper conductor & contact resistances (Ohms) matching real TKR trainer V-drops
const R_BUS_SEG = 0.003;
const R_FUSE_INTACT = 0.012;
const R_IGN_CONTACT = 0.018;
const R_SWITCH_CONTACT = 0.012;
const R_RELAY_CONTACT = 0.012;
const R_FLASHER_CONTACT = 0.018;

// Nominal component load resistances (Ohms)
export const LOAD_RESISTANCES = {
  R1_10: 10.0,
  R2_50: 50.0,
  R3_100: 100.0,
  LAMP_5W: 28.8,
  LAMP_10W: 14.4,
  LAMP_21W: 6.8,
  HEADLAMP_LOW: 2.6,
  HEADLAMP_HIGH: 2.4,
  LAMP_LED: 240.0,
  IND_PILOT: 100.0,
  RELAY_COIL: 78.0,
  FLASHER_COIL: 240.0,
  HORN: 2.0,
  BUZZER: 150.0,
  MOTOR_WASHER: 4.2,
  MOTOR_BLOWER: 2.0,
  BLW_RES_LOW_MED: 1.38,
  BLW_RES_MED_HIGH: 0.68,
  BLW_RES_HIGH_IN: 0.02,
  MAG_CLUTCH: 3.8,
  EXTRA_FAN: 2.4,
};

export function getCableResistance(cable) {
  const typeId = cable?.cableTypeId || '';
  if (typeId === 'alligator-red' || typeId === 'alligator-black') return 0.012;
  if (typeId === 'jumper-10') return 0.008;
  if (typeId === 'jumper-20') return 0.011;
  if (typeId === 'jumper-25') return 0.013;
  if (typeId === 'jumper-30') return 0.015;
  if (typeId === 'jumper-50') return 0.022;
  return 0.012;
}

function brightnessFromVoltage(v, minTurnOn = 2.0) {
  if (!(v >= minTurnOn)) return 0;
  return Math.min(1.05, Math.max(0.14, Math.pow(v / 12.0, 1.35)));
}

export class CircuitSolver {
  constructor(moduleDef) {
    this.setModule(moduleDef);
  }

  setModule(moduleDef) {
    this.module = moduleDef;
    this.switchStates = {};
    this.dimPassActive = false;
    this.ignStartActive = false;
    this.blownFuses = new Set(); // stores fuse channel keys like 'F1', 'F2', etc.
    this.flasherTimer = 0;
    this.flasherOn = true;

    for (const comp of moduleDef.components || []) {
      if (comp.defaultState !== undefined) {
        this.switchStates[comp.id] = comp.defaultState;
      }
    }
  }

  setSwitchState(componentId, stateValue) {
    this.switchStates[componentId] = stateValue;
  }

  getSwitchState(componentId) {
    return this.switchStates[componentId];
  }

  setDimPass(active) {
    this.dimPassActive = Boolean(active);
  }

  setIgnStart(active) {
    this.ignStartActive = Boolean(active);
  }

  resetFuses() {
    this.blownFuses.clear();
  }

  _getFuseChannels() {
    const channels = [];
    const pinIds = new Set((this.module.pins || []).map((p) => p.id));
    const fuseDefs = [
      { key: 'F1', inPin: 'F1_IN', outPin: 'F1_OUT' },
      { key: 'F2', inPin: 'F2_IN', outPin: 'F2_OUT' },
      { key: 'F3', inPin: 'F3_IN', outPin: 'F3_OUT' },
      { key: 'F4', inPin: 'F4_IN', outPin: 'F4_OUT' },
      { key: 'F_BLW', inPin: 'FUSE_BLW_IN', outPin: 'FUSE_BLW_OUT' },
      { key: 'F_AC', inPin: 'FUSE_AC_IN', outPin: 'FUSE_AC_OUT' },
    ];

    for (const fd of fuseDefs) {
      if (pinIds.has(fd.inPin) && pinIds.has(fd.outPin)) {
        const inPinObj = this.module.pins.find((p) => p.id === fd.inPin);
        const compId = inPinObj ? inPinObj.componentId : 'FUSE_1';
        const comp = this.module.components.find((c) => c.id === compId);
        channels.push({
          ...fd,
          componentId: compId,
          position: comp ? comp.pos : [0, 0, 0.5],
        });
      }
    }
    return channels;
  }

  // Returns conductive switch & bus-bar branches WITH realistic contact resistance
  _getSwitchAndBusBranches() {
    const branches = [];
    const pushBr = (a, b, r, kind) => {
      if (a && b) branches.push({ a, b, r, kind });
    };

    for (const comp of this.module.components || []) {
      const state = this.switchStates[comp.id] ?? comp.defaultState;
      const compPins = (this.module.pins || []).filter((p) => p.componentId === comp.id);

      if (comp.type === 'ignition') {
        const pB = compPins.find((p) => p.id.endsWith('_B'))?.id;
        const pACC = compPins.find((p) => p.id.endsWith('_ACC'))?.id;
        const pIG = compPins.find((p) => p.id.endsWith('_IG'))?.id;
        const pST = compPins.find((p) => p.id.endsWith('_ST'))?.id;
        if (this.ignStartActive) {
          pushBr(pB, pIG, R_IGN_CONTACT, 'switch');
          pushBr(pB, pST, R_IGN_CONTACT, 'switch');
        } else if (state === 'IG' || state === 'ON') {
          pushBr(pB, pIG, R_IGN_CONTACT, 'switch');
          pushBr(pB, pACC, R_IGN_CONTACT, 'switch');
        } else if (state === 'ACC') {
          pushBr(pB, pACC, R_IGN_CONTACT, 'switch');
        }
      } else if (comp.type === 'switch_push' || comp.type === 'switch_toggle') {
        if (state === 'ON' && compPins.length >= 2) {
          pushBr(compPins[0].id, compPins[1].id, R_SWITCH_CONTACT, 'switch');
        }
      } else if (comp.type === 'switch_combo') {
        if (comp.id === 'SW_DIMMER') {
          if (state === 'LOW') pushBr('DIM_IN', 'DIM_LOW', R_SWITCH_CONTACT, 'switch');
          if (state === 'HIGH' || this.dimPassActive) pushBr('DIM_IN', 'DIM_HIGH', R_SWITCH_CONTACT, 'switch');
        } else if (comp.id === 'SW_TURN') {
          if (state === 'LEFT') pushBr('TURN_L_IN', 'TURN_LH_OUT', R_SWITCH_CONTACT, 'switch');
          if (state === 'RIGHT') pushBr('TURN_L_IN', 'TURN_RH_OUT', R_SWITCH_CONTACT, 'switch');
        }
      } else if (comp.type === 'switch_hazard') {
        if (state === 'ON') {
          pushBr('HZD_IN', 'HZD_LH', R_SWITCH_CONTACT, 'switch');
          pushBr('HZD_IN', 'HZD_RH', R_SWITCH_CONTACT, 'switch');
        }
      } else if (comp.type === 'switch_blower_rotary') {
        if (state === 'SPEED_1') pushBr('BLW_SW_B', 'BLW_SW_1', R_SWITCH_CONTACT, 'switch');
        if (state === 'SPEED_2') pushBr('BLW_SW_B', 'BLW_SW_2', R_SWITCH_CONTACT, 'switch');
        if (state === 'SPEED_3') pushBr('BLW_SW_B', 'BLW_SW_3', R_SWITCH_CONTACT, 'switch');
      } else if (comp.type === 'switch_ac_push') {
        if (state === 'ON') pushBr('AC_SW_IN', 'AC_SW_OUT', R_SWITCH_CONTACT, 'switch');
      } else if (comp.type === 'thermostat_ac') {
        if (state === 'ON') pushBr('TH_IN', 'TH_OUT', R_SWITCH_CONTACT, 'switch');
      } else if (comp.type === 'pressure_switch_dual') {
        if (state === 'CLOSED') pushBr('PS_IN', 'PS_OUT', R_SWITCH_CONTACT, 'switch');
      }
    }

    // Internal copper bus-bar rails (very low resistance)
    if (this.module.id === 'fig00') {
      pushBr('BUS30_1', 'BUS30_2', R_BUS_SEG, 'bus');
      pushBr('BUS30_2', 'BUS30_3', R_BUS_SEG, 'bus');
      pushBr('BUS31_1', 'BUS31_2', R_BUS_SEG, 'bus');
      pushBr('BUS31_2', 'BUS31_3', R_BUS_SEG, 'bus');
      pushBr('BUS31_3', 'BUS31_4', R_BUS_SEG, 'bus');
      pushBr('BUS31_4', 'BUS31_5', R_BUS_SEG, 'bus');
    } else if (this.module.id === 'ac01' || this.module.id === 'ac02' || this.module.id === 'ac03') {
      pushBr('BUS30_1', 'BUS30_2', R_BUS_SEG, 'bus');
      if (this.module.id === 'ac02' || this.module.id === 'ac03') {
        pushBr('BUS30_2', 'BUS30_3', R_BUS_SEG, 'bus');
      }
      pushBr('BUS31_1', 'BUS31_2', R_BUS_SEG, 'bus');
      pushBr('BUS31_2', 'BUS31_3', R_BUS_SEG, 'bus');
      if (this.module.id === 'ac02' || this.module.id === 'ac03') {
        pushBr('BUS31_3', 'BUS31_4', R_BUS_SEG, 'bus');
      }
    }

    return branches;
  }

  // Keep legacy helper for any external callers
  _getSwitchBridges() {
    return this._getSwitchAndBusBranches().map((b) => [b.a, b.b]);
  }

  _getRelayDefinitions() {
    const relays = [];
    for (const comp of this.module.components || []) {
      if (comp.type === 'relay_4p') {
        const compPins = (this.module.pins || []).filter((p) => p.componentId === comp.id);
        const p30 = compPins.find((p) => p.id.endsWith('_30') || p.id.endsWith('30') || p.id.includes('30'))?.id;
        const p87 = compPins.find((p) => p.id.endsWith('_87') || p.id.endsWith('87') || p.id.includes('87'))?.id;
        const p85 = compPins.find((p) => p.id.endsWith('_85') || p.id.endsWith('85') || p.id.includes('85'))?.id;
        const p86 = compPins.find((p) => p.id.endsWith('_86') || p.id.endsWith('86') || p.id.includes('86'))?.id;
        if (p30 && p87 && p85 && p86) {
          relays.push({ componentId: comp.id, p30, p87, p85, p86, isSpdt: false });
        }
      } else if (comp.type === 'relay_5p') {
        const compPins = (this.module.pins || []).filter((p) => p.componentId === comp.id);
        const p30 = compPins.find((p) => p.id.endsWith('_30') || p.id.endsWith('30'))?.id;
        const p87 = compPins.find((p) => p.id.endsWith('_87') || p.id.endsWith('87'))?.id;
        const p87a = compPins.find((p) => p.id.endsWith('_87A') || p.id.endsWith('87a') || p.id.endsWith('87A'))?.id;
        const p85 = compPins.find((p) => p.id.endsWith('_85') || p.id.endsWith('85'))?.id;
        const p86 = compPins.find((p) => p.id.endsWith('_86') || p.id.endsWith('86'))?.id;
        if (p30 && p85 && p86) {
          relays.push({ componentId: comp.id, p30, p87, p87a, p85, p86, isSpdt: true });
        }
      }
    }
    return relays;
  }

  // Returns all passive resistive component branches (resistors, lamps, coils, motors, actuators)
  _getComponentLoadBranches(relays, includeLed = true) {
    const branches = [];
    const pinSet = new Set((this.module.pins || []).map((p) => p.id));
    const addLoad = (a, b, r, componentId, kind = 'load') => {
      if (pinSet.has(a) && pinSet.has(b)) {
        branches.push({ a, b, r, componentId, kind });
      }
    };

    // Relay coils are always resistive branches (78 Ohms)
    for (const rly of relays) {
      addLoad(rly.p85, rly.p86, LOAD_RESISTANCES.RELAY_COIL, rly.componentId, 'coil');
    }

    for (const comp of this.module.components || []) {
      if (comp.type === 'resistor_bank') {
        addLoad('R1_A', 'R1_B', LOAD_RESISTANCES.R1_10, comp.id, 'resistor');
        addLoad('R2_A', 'R2_B', LOAD_RESISTANCES.R2_50, comp.id, 'resistor');
        addLoad('R3_A', 'R3_B', LOAD_RESISTANCES.R3_100, comp.id, 'resistor');
      } else if (comp.type === 'resistor_blower') {
        // Real series resistor ladder: LOW --(1.32Ω)-- MED --(0.65Ω)-- HIGH --(0.03Ω)-- IN(OUT)
        addLoad('RES_LOW', 'RES_MED', LOAD_RESISTANCES.BLW_RES_LOW_MED, comp.id, 'resistor');
        addLoad('RES_MED', 'RES_HIGH', LOAD_RESISTANCES.BLW_RES_MED_HIGH, comp.id, 'resistor');
        addLoad('RES_HIGH', 'RES_IN', LOAD_RESISTANCES.BLW_RES_HIGH_IN, comp.id, 'resistor');
      } else if (comp.type === 'lamp_small') {
        if (comp.id === 'LAMP_5W') addLoad('L5W_POS', 'L5W_NEG', LOAD_RESISTANCES.LAMP_5W, comp.id);
        if (comp.id === 'LAMP_21W') addLoad('L21W_POS', 'L21W_NEG', LOAD_RESISTANCES.LAMP_21W, comp.id);
      } else if (comp.type === 'lamp_h4') {
        addLoad('H4_LOW', 'H4_GND', LOAD_RESISTANCES.HEADLAMP_LOW, comp.id);
        addLoad('H4_HIGH', 'H4_GND', LOAD_RESISTANCES.HEADLAMP_HIGH, comp.id);
      } else if (comp.type === 'lamp_led') {
        if (includeLed) {
          addLoad('LED_A', 'LED_K', LOAD_RESISTANCES.LAMP_LED, comp.id, 'led');
        }
      } else if (comp.type === 'buzzer') {
        addLoad('BUZ_POS', 'BUZ_NEG', LOAD_RESISTANCES.BUZZER, comp.id);
      } else if (comp.type === 'motor_small') {
        addLoad('MTR_POS', 'MTR_NEG', LOAD_RESISTANCES.MOTOR_WASHER, comp.id);
      } else if (comp.type === 'lamp_test') {
        addLoad('LAMP_POS', 'LAMP_NEG', LOAD_RESISTANCES.LAMP_10W, comp.id);
      } else if (comp.type === 'horn') {
        addLoad('HORN_POS', 'HORN_NEG', LOAD_RESISTANCES.HORN, comp.id);
      } else if (comp.type === 'lamp_red_dual') {
        if (comp.id === 'TAIL_LH') {
          addLoad('LH_SIGN', 'LH_GND', LOAD_RESISTANCES.LAMP_21W, comp.id);
          addLoad('LH_TAIL', 'LH_GND', LOAD_RESISTANCES.LAMP_5W, comp.id);
          addLoad('LH_STOP', 'LH_GND', LOAD_RESISTANCES.LAMP_21W, comp.id);
          addLoad('LH_REV', 'LH_GND', LOAD_RESISTANCES.LAMP_21W, comp.id);
        } else if (comp.id === 'TAIL_RH') {
          addLoad('RH_SIGN', 'RH_GND', LOAD_RESISTANCES.LAMP_21W, comp.id);
          addLoad('RH_TAIL', 'RH_GND', LOAD_RESISTANCES.LAMP_5W, comp.id);
          addLoad('RH_STOP', 'RH_GND', LOAD_RESISTANCES.LAMP_21W, comp.id);
          addLoad('RH_REV', 'RH_GND', LOAD_RESISTANCES.LAMP_21W, comp.id);
        }
      } else if (comp.type === 'licence_lamp') {
        const gndPin = pinSet.has('LIC_GND') ? 'LIC_GND' : 'GND_MID';
        addLoad('LIC_POS', gndPin, LOAD_RESISTANCES.LAMP_5W, comp.id);
      } else if (comp.type === 'headlamp') {
        if (comp.id === 'HL_LH') {
          addLoad('HLL_LOW', 'HLL_GND', LOAD_RESISTANCES.HEADLAMP_LOW, comp.id);
          addLoad('HLL_HIGH', 'HLL_GND', LOAD_RESISTANCES.HEADLAMP_HIGH, comp.id);
        } else if (comp.id === 'HL_RH') {
          addLoad('HLR_LOW', 'HLR_GND', LOAD_RESISTANCES.HEADLAMP_LOW, comp.id);
          addLoad('HLR_HIGH', 'HLR_GND', LOAD_RESISTANCES.HEADLAMP_HIGH, comp.id);
        } else if (comp.id === 'HL_MAIN') {
          addLoad('HL_LOW_POS', 'HL_GND', LOAD_RESISTANCES.HEADLAMP_LOW, comp.id);
          addLoad('HL_HIGH_POS', 'HL_GND', LOAD_RESISTANCES.HEADLAMP_HIGH, comp.id);
        }
      } else if (comp.type === 'lamp_amber') {
        if (comp.id === 'TURN_LH') {
          addLoad('LAMP_LH_POS', 'LAMP_LH_NEG', LOAD_RESISTANCES.LAMP_21W, comp.id);
        } else if (comp.id === 'TURN_RH') {
          addLoad('LAMP_RH_POS', 'LAMP_RH_NEG', LOAD_RESISTANCES.LAMP_21W, comp.id);
        } else if (comp.id === 'SIGN_FRONT_LH') {
          const gndPin = pinSet.has('FD_LH_GND') ? 'FD_LH_GND' : 'LAMP_TURN_GND';
          addLoad('LAMP_LH_POS', gndPin, LOAD_RESISTANCES.LAMP_21W, comp.id);
        } else if (comp.id === 'TURN_LAMPS') {
          addLoad('LAMP_RH_POS', 'LAMP_TURN_GND', LOAD_RESISTANCES.LAMP_21W, comp.id);
        }
      } else if (comp.type === 'indicator_cluster') {
        addLoad('IND_TURN', 'IND_GND', LOAD_RESISTANCES.IND_PILOT, comp.id);
        addLoad('IND_TAIL', 'IND_GND', LOAD_RESISTANCES.IND_PILOT, comp.id);
        addLoad('IND_HI', 'IND_GND', LOAD_RESISTANCES.IND_PILOT, comp.id);
      } else if (comp.type === 'flasher') {
        addLoad('FL_B', 'FL_E', LOAD_RESISTANCES.FLASHER_COIL, comp.id, 'coil');
      } else if (comp.type === 'evaporator_unit') {
        addLoad('MTR_BLW_POS', 'MTR_BLW_GND', LOAD_RESISTANCES.MOTOR_BLOWER, comp.id);
      } else if (comp.type === 'magnetic_clutch') {
        addLoad('CLUTCH_POS', 'CLUTCH_GND', LOAD_RESISTANCES.MAG_CLUTCH, comp.id);
      } else if (comp.type === 'condenser_fan') {
        addLoad('FAN_POS', 'FAN_GND', LOAD_RESISTANCES.EXTRA_FAN, comp.id);
      } else if (comp.type === 'manifold_gauge_unit') {
        // In ac03, magnetic clutch terminals are mounted on the manifold gauge plate
        if (pinSet.has('CLUTCH_POS') && pinSet.has('CLUTCH_GND')) {
          addLoad('CLUTCH_POS', 'CLUTCH_GND', LOAD_RESISTANCES.MAG_CLUTCH, comp.id);
        }
      } else if (comp.type === 'digital_temp_unit') {
        // In ac03, condenser fan terminals are mounted on the digital temp plate
        if (pinSet.has('FAN_POS') && pinSet.has('FAN_GND')) {
          addLoad('FAN_POS', 'FAN_GND', LOAD_RESISTANCES.EXTRA_FAN, comp.id);
        }
      }
    }

    return branches;
  }

  _buildAdjacency(cables, extraBridges = []) {
    const adj = new Map();
    const ensure = (id) => {
      if (!adj.has(id)) adj.set(id, new Set());
    };
    for (const p of this.module.pins || []) {
      ensure(p.id);
    }
    const addEdge = (a, b) => {
      if (!a || !b) return;
      ensure(a);
      ensure(b);
      adj.get(a).add(b);
      adj.get(b).add(a);
    };
    for (const c of cables) {
      addEdge(c.fromPin, c.toPin);
    }
    for (const [a, b] of extraBridges) {
      addEdge(a, b);
    }
    return adj;
  }

  _findReachable(adj, startPin) {
    const visited = new Set();
    if (!adj.has(startPin)) return visited;
    const queue = [startPin];
    visited.add(startPin);
    while (queue.length > 0) {
      const curr = queue.shift();
      for (const nxt of adj.get(curr) || []) {
        if (!visited.has(nxt)) {
          visited.add(nxt);
          queue.push(nxt);
        }
      }
    }
    return visited;
  }

  step(cables = [], deltaSeconds = 0.016) {
    const shortCircuitEvents = [];
    const pinIds = (this.module.pins || []).map((p) => p.id);
    const fuseChannels = this._getFuseChannels();
    const switchAndBusBranches = this._getSwitchAndBusBranches();
    const switchPairs = switchAndBusBranches.map((b) => [b.a, b.b]);
    const relays = this._getRelayDefinitions();
    const cableBranches = cables.map((c) => ({
      a: c.fromPin,
      b: c.toPin,
      r: getCableResistance(c),
      kind: 'cable',
      cableId: c.id,
    }));

    // Helper for checklist evaluation (pure wire connectivity including stacked pins)
    const wireAdj = this._buildAdjacency(cables, []);
    const wireNet = {
      areConnected: (pinA, pinB) => {
        const reach = this._findReachable(wireAdj, pinA);
        return reach.has(pinB);
      },
    };

    const getActiveFuseBranches = () =>
      fuseChannels
        .filter((f) => !this.blownFuses.has(f.key))
        .map((f) => ({ a: f.inPin, b: f.outPin, r: R_FUSE_INTACT, kind: 'fuse', fuseKey: f.key }));

    const getActiveFusePairs = () =>
      fuseChannels
        .filter((f) => !this.blownFuses.has(f.key))
        .map((f) => [f.inPin, f.outPin]);

    // Direct zero-load short-circuit check across each intact fuse
    const checkAndBlowShortedFuses = (relayPairs) => {
      for (const fuse of fuseChannels) {
        if (this.blownFuses.has(fuse.key)) continue;
        const otherFusePairs = fuseChannels
          .filter((f) => f.key !== fuse.key && !this.blownFuses.has(f.key))
          .map((f) => [f.inPin, f.outPin]);

        const adjWithoutThisFuse = this._buildAdjacency(cables, [
          ...switchPairs,
          ...relayPairs,
          ...otherFusePairs,
        ]);

        const posReach = this._findReachable(adjWithoutThisFuse, 'BAT_POS');
        const negReach = this._findReachable(adjWithoutThisFuse, 'BAT_NEG');

        const inIsPos = posReach.has(fuse.inPin);
        const inIsNeg = negReach.has(fuse.inPin);
        const outIsPos = posReach.has(fuse.outPin);
        const outIsNeg = negReach.has(fuse.outPin);

        if ((inIsPos && outIsNeg) || (inIsNeg && outIsPos)) {
          this.blownFuses.add(fuse.key);
          shortCircuitEvents.push({
            fuseId: fuse.componentId,
            fuseKey: fuse.key,
            message: `HUBUNG SINGKAT! Sekring ${fuse.key} putus akibat arus langsung +12V ke Ground tanpa beban.`,
            position: fuse.position,
          });
        }
      }
    };

    // Pass 1: Check short circuits with open relays
    checkAndBlowShortedFuses([]);

    const loadBranchesWithLed = this._getComponentLoadBranches(relays, true);

    // Pass 2: Iteratively solve relay coil energization using real DC nodal voltages
    const relayStates = {};
    let activeRelayBranches = [];
    let activeRelayPairs = [];

    for (let iter = 0; iter < 4; iter++) {
      let changed = false;
      const iterBranches = [
        ...cableBranches,
        ...switchAndBusBranches,
        ...getActiveFuseBranches(),
        ...activeRelayBranches,
        ...loadBranchesWithLed,
      ];
      const { nodeVoltages: iterV } = solveLinearDC({
        pinIds,
        branches: iterBranches,
        vOc: BATTERY_VOC,
        rBat: BATTERY_R_INT,
      });

      for (const rly of relays) {
        const v85 = iterV[rly.p85];
        const v86 = iterV[rly.p86];
        const vCoil =
          v85 !== null && v85 !== undefined && v86 !== null && v86 !== undefined
            ? Math.abs(v85 - v86)
            : 0;
        const coilEnergized = vCoil >= 6.5; // Realistic 12V automotive relay pull-in threshold
        if (Boolean(relayStates[rly.componentId]) !== coilEnergized) {
          relayStates[rly.componentId] = coilEnergized;
          changed = true;
        }
      }

      activeRelayBranches = [];
      activeRelayPairs = [];
      for (const r of relays) {
        if (relayStates[r.componentId]) {
          if (r.p30 && r.p87) {
            activeRelayBranches.push({ a: r.p30, b: r.p87, r: R_RELAY_CONTACT, kind: 'relay_contact' });
            activeRelayPairs.push([r.p30, r.p87]);
          }
        } else if (r.isSpdt && r.p30 && r.p87a) {
          activeRelayBranches.push({ a: r.p30, b: r.p87a, r: R_RELAY_CONTACT, kind: 'relay_contact' });
          activeRelayPairs.push([r.p30, r.p87a]);
        }
      }
      if (!changed) break;
    }

    // Re-check short circuits in case closing a relay created a zero-load short
    if (activeRelayPairs.length > 0) {
      checkAndBlowShortedFuses(activeRelayPairs);
    }

    // Pass 3: Evaluate Flasher (FL_B, FL_L, FL_E) using real load-current sensing
    const flasherBranches = [];
    const hasFlasher = (this.module.components || []).some((c) => c.type === 'flasher');
    let flasherActive = false;

    if (hasFlasher) {
      const preFlasherBranches = [
        ...cableBranches,
        ...switchAndBusBranches,
        ...getActiveFuseBranches(),
        ...activeRelayBranches,
        ...loadBranchesWithLed,
      ];
      const { nodeVoltages: preV } = solveLinearDC({
        pinIds,
        branches: preFlasherBranches,
        vOc: BATTERY_VOC,
        rBat: BATTERY_R_INT,
      });

      const vFlB = preV['FL_B'];
      const vFlE = preV['FL_E'];
      const flasherPowered =
        vFlB !== null && vFlB !== undefined && vFlE !== null && vFlE !== undefined && Math.abs(vFlB - vFlE) >= 6.5;

      if (flasherPowered) {
        // Test whether closing FL_B -> FL_L draws real turn/hazard lamp load current (>= 0.4A)
        const testBranches = [
          ...preFlasherBranches,
          { a: 'FL_B', b: 'FL_L', r: R_FLASHER_CONTACT, kind: 'flasher_test' },
        ];
        const { nodeVoltages: testV } = solveLinearDC({
          pinIds,
          branches: testBranches,
          vOc: BATTERY_VOC,
          rBat: BATTERY_R_INT,
        });
        const flCurrent =
          testV['FL_B'] !== null && testV['FL_L'] !== null
            ? Math.abs(testV['FL_B'] - testV['FL_L']) / R_FLASHER_CONTACT
            : 0;

        if (flCurrent >= 0.4) {
          flasherActive = true;
          this.flasherTimer += deltaSeconds;
          if (this.flasherTimer >= 0.35) {
            this.flasherTimer = 0;
            this.flasherOn = !this.flasherOn;
          }
          if (this.flasherOn) {
            flasherBranches.push({ a: 'FL_B', b: 'FL_L', r: R_FLASHER_CONTACT, kind: 'flasher_contact' });
          }
        } else {
          this.flasherTimer = 0;
          this.flasherOn = true;
        }
      } else {
        this.flasherTimer = 0;
        this.flasherOn = true;
      }
    }

    // Pass 4: Final DC Linear Nodal Solve (with LED polarity check)
    let activeBranches = [
      ...cableBranches,
      ...switchAndBusBranches,
      ...getActiveFuseBranches(),
      ...activeRelayBranches,
      ...flasherBranches,
      ...loadBranchesWithLed,
    ];

    let { nodeVoltages, batteryCurrent } = solveLinearDC({
      pinIds,
      branches: activeBranches,
      vOc: BATTERY_VOC,
      rBat: BATTERY_R_INT,
    });

    // Enforce diode polarity on LAMP_LED: if reverse-biased (LED_A < LED_K), block reverse current
    if (
      nodeVoltages['LED_A'] !== null &&
      nodeVoltages['LED_A'] !== undefined &&
      nodeVoltages['LED_K'] !== null &&
      nodeVoltages['LED_K'] !== undefined &&
      nodeVoltages['LED_A'] < nodeVoltages['LED_K']
    ) {
      const loadBranchesNoLed = this._getComponentLoadBranches(relays, false);
      activeBranches = [
        ...cableBranches,
        ...switchAndBusBranches,
        ...getActiveFuseBranches(),
        ...activeRelayBranches,
        ...flasherBranches,
        ...loadBranchesNoLed,
      ];
      ({ nodeVoltages, batteryCurrent } = solveLinearDC({
        pinIds,
        branches: activeBranches,
        vOc: BATTERY_VOC,
        rBat: BATTERY_R_INT,
      }));
    }

    // Passive network branches (without battery source) for exact Thevenin Ohmmeter / Continuity
    const passiveBranches = [
      ...cableBranches,
      ...switchAndBusBranches,
      ...getActiveFuseBranches(),
      ...activeRelayBranches,
      ...flasherBranches,
      ...loadBranchesWithLed,
    ];

    // Derive legacy posSet / negSet / pinVoltages ('12V' / 'GND' / 'FLOAT') for UI compatibility
    const posSet = new Set();
    const negSet = new Set();
    const pinVoltages = {};
    for (const id of pinIds) {
      const v = nodeVoltages[id];
      if (v === null || v === undefined) {
        pinVoltages[id] = 'FLOAT';
      } else if (v >= 2.0) {
        posSet.add(id);
        pinVoltages[id] = '12V';
      } else {
        negSet.add(id);
        pinVoltages[id] = 'GND';
      }
    }

    const voltageAcross = (pinA, pinB) => {
      const va = nodeVoltages[pinA];
      const vb = nodeVoltages[pinB];
      if (va === null || va === undefined || vb === null || vb === undefined) return 0;
      return Math.abs(va - vb);
    };

    const signedVoltageAcross = (pinA, pinB) => {
      const va = nodeVoltages[pinA];
      const vb = nodeVoltages[pinB];
      if (va === null || va === undefined || vb === null || vb === undefined) return 0;
      return va - vb;
    };

    const isDirectShort =
      nodeVoltages['BAT_POS'] !== null &&
      nodeVoltages['BAT_POS'] !== undefined &&
      nodeVoltages['BAT_POS'] < 1.0;

    // Compute realistic state, voltage drop, current, and proportional brightness for every component
    const componentStates = {};
    for (const comp of this.module.components || []) {
      const state = {
        energized: false,
        voltage: 0,
        current: 0,
        brightness: 0,
        switchState: this.switchStates[comp.id] ?? comp.defaultState,
      };

      if (comp.type === 'fuse_single' || comp.type === 'fuse_dual' || comp.type === 'fuse_quad') {
        const compFuses = fuseChannels.filter((f) => f.componentId === comp.id);
        state.blown = compFuses.some((f) => this.blownFuses.has(f.key));
        state.blownChannels = compFuses.filter((f) => this.blownFuses.has(f.key)).map((f) => f.key);
      } else if (comp.type === 'relay_4p' || comp.type === 'relay_5p') {
        const rDef = relays.find((r) => r.componentId === comp.id);
        const vCoil = rDef ? voltageAcross(rDef.p85, rDef.p86) : 0;
        state.relayClosed = Boolean(relayStates[comp.id]);
        state.energized = state.relayClosed;
        state.voltage = Number(vCoil.toFixed(2));
        state.current = Number((vCoil / LOAD_RESISTANCES.RELAY_COIL).toFixed(3));
      } else if (comp.type === 'resistor_bank') {
        const v1 = voltageAcross('R1_A', 'R1_B');
        const v2 = voltageAcross('R2_A', 'R2_B');
        const v3 = voltageAcross('R3_A', 'R3_B');
        state.voltageDrops = {
          R1: Number(v1.toFixed(2)),
          R2: Number(v2.toFixed(2)),
          R3: Number(v3.toFixed(2)),
        };
        state.energized = v1 > 0.1 || v2 > 0.1 || v3 > 0.1;
      } else if (comp.type === 'resistor_blower') {
        const vDropLow = voltageAcross('RES_LOW', 'RES_IN');
        const vDropMed = voltageAcross('RES_MED', 'RES_IN');
        const vDropHigh = voltageAcross('RES_HIGH', 'RES_IN');
        state.voltage = Number(Math.max(vDropLow, vDropMed, vDropHigh).toFixed(2));
        state.energized = state.voltage > 0.1;
      } else if (comp.type === 'buzzer') {
        const v = isDirectShort ? 0 : voltageAcross('BUZ_POS', 'BUZ_NEG');
        state.voltage = Number(v.toFixed(2));
        state.current = Number((v / LOAD_RESISTANCES.BUZZER).toFixed(3));
        state.energized = v >= 4.0;
      } else if (comp.type === 'motor_small') {
        const v = isDirectShort ? 0 : voltageAcross('MTR_POS', 'MTR_NEG');
        state.voltage = Number(v.toFixed(2));
        state.current = Number((v / LOAD_RESISTANCES.MOTOR_WASHER).toFixed(2));
        state.energized = v >= 2.5;
        state.brightness = brightnessFromVoltage(v, 2.5);
      } else if (comp.type === 'lamp_led') {
        const vSigned = isDirectShort ? 0 : signedVoltageAcross('LED_A', 'LED_K');
        state.voltage = Number(Math.max(0, vSigned).toFixed(2));
        state.current = Number((Math.max(0, vSigned) / LOAD_RESISTANCES.LAMP_LED).toFixed(4));
        state.energized = vSigned >= 1.8;
        state.brightness = brightnessFromVoltage(vSigned, 1.8);
      } else if (comp.type === 'lamp_h4') {
        const vLo = isDirectShort ? 0 : voltageAcross('H4_LOW', 'H4_GND');
        const vHi = isDirectShort ? 0 : voltageAcross('H4_HIGH', 'H4_GND');
        state.lowBeam = vLo >= 2.2;
        state.highBeam = vHi >= 2.2;
        state.lowVoltage = Number(vLo.toFixed(2));
        state.highVoltage = Number(vHi.toFixed(2));
        state.voltage = Number(Math.max(vLo, vHi).toFixed(2));
        state.brightness = brightnessFromVoltage(Math.max(vLo, vHi), 2.2);
        state.energized = state.lowBeam || state.highBeam;
      } else if (comp.id === 'LAMP_5W') {
        const v = isDirectShort ? 0 : voltageAcross('L5W_POS', 'L5W_NEG');
        state.voltage = Number(v.toFixed(2));
        state.current = Number((v / LOAD_RESISTANCES.LAMP_5W).toFixed(2));
        state.energized = v >= 2.2;
        state.brightness = brightnessFromVoltage(v, 2.2);
      } else if (comp.id === 'LAMP_21W') {
        const v = isDirectShort ? 0 : voltageAcross('L21W_POS', 'L21W_NEG');
        state.voltage = Number(v.toFixed(2));
        state.current = Number((v / LOAD_RESISTANCES.LAMP_21W).toFixed(2));
        state.energized = v >= 2.2;
        state.brightness = brightnessFromVoltage(v, 2.2);
      } else if (comp.type === 'flasher') {
        state.energized = flasherActive;
        state.blinkingOn = flasherActive && this.flasherOn;
        state.voltage = Number(voltageAcross('FL_B', 'FL_E').toFixed(2));
      } else if (comp.type === 'lamp_test') {
        const v = isDirectShort ? 0 : voltageAcross('LAMP_POS', 'LAMP_NEG');
        state.voltage = Number(v.toFixed(2));
        state.current = Number((v / LOAD_RESISTANCES.LAMP_10W).toFixed(2));
        state.energized = v >= 2.2;
        state.brightness = brightnessFromVoltage(v, 2.2);
      } else if (comp.type === 'horn') {
        const v = isDirectShort ? 0 : voltageAcross('HORN_POS', 'HORN_NEG');
        state.voltage = Number(v.toFixed(2));
        state.current = Number((v / LOAD_RESISTANCES.HORN).toFixed(2));
        state.energized = v >= 5.0;
      } else if (comp.type === 'lamp_red_dual') {
        const prefix = comp.id === 'TAIL_RH' ? 'RH' : 'LH';
        const gnd = `${prefix}_GND`;
        const vSign = isDirectShort ? 0 : voltageAcross(`${prefix}_SIGN`, gnd);
        const vTail = isDirectShort ? 0 : voltageAcross(`${prefix}_TAIL`, gnd);
        const vStop = isDirectShort ? 0 : voltageAcross(`${prefix}_STOP`, gnd);
        const vRev = isDirectShort ? 0 : voltageAcross(`${prefix}_REV`, gnd);
        state.signOn = vSign >= 2.2;
        state.tailOn = vTail >= 2.2;
        state.stopOn = vStop >= 2.2;
        state.revOn = vRev >= 2.2;
        state.voltage = Number(Math.max(vSign, vTail, vStop, vRev).toFixed(2));
        state.brightness = brightnessFromVoltage(Math.max(vSign, vTail, vStop, vRev), 2.2);
        state.energized = state.signOn || state.tailOn || state.stopOn || state.revOn;
      } else if (comp.type === 'licence_lamp') {
        const v = isDirectShort
          ? 0
          : Math.max(
              voltageAcross('LIC_POS', 'GND_MID'),
              voltageAcross('LIC_POS', 'LIC_GND')
            );
        state.voltage = Number(v.toFixed(2));
        state.current = Number((v / LOAD_RESISTANCES.LAMP_5W).toFixed(2));
        state.energized = v >= 2.2;
        state.brightness = brightnessFromVoltage(v, 2.2);
      } else if (comp.type === 'headlamp') {
        let vLo = 0;
        let vHi = 0;
        if (comp.id === 'HL_LH') {
          vLo = isDirectShort ? 0 : voltageAcross('HLL_LOW', 'HLL_GND');
          vHi = isDirectShort ? 0 : voltageAcross('HLL_HIGH', 'HLL_GND');
        } else if (comp.id === 'HL_RH') {
          vLo = isDirectShort ? 0 : voltageAcross('HLR_LOW', 'HLR_GND');
          vHi = isDirectShort ? 0 : voltageAcross('HLR_HIGH', 'HLR_GND');
        } else if (comp.id === 'HL_MAIN') {
          vLo = isDirectShort ? 0 : voltageAcross('HL_LOW_POS', 'HL_GND');
          vHi = isDirectShort ? 0 : voltageAcross('HL_HIGH_POS', 'HL_GND');
        }
        state.lowBeam = vLo >= 2.2;
        state.highBeam = vHi >= 2.2;
        state.lowVoltage = Number(vLo.toFixed(2));
        state.highVoltage = Number(vHi.toFixed(2));
        state.voltage = Number(Math.max(vLo, vHi).toFixed(2));
        state.brightness = brightnessFromVoltage(Math.max(vLo, vHi), 2.2);
        state.energized = state.lowBeam || state.highBeam;
      } else if (comp.type === 'lamp_amber') {
        if (comp.id === 'TURN_LH') {
          const v = isDirectShort ? 0 : voltageAcross('LAMP_LH_POS', 'LAMP_LH_NEG');
          state.voltage = Number(v.toFixed(2));
          state.energized = v >= 2.2;
          state.brightness = brightnessFromVoltage(v, 2.2);
        } else if (comp.id === 'SIGN_FRONT_LH') {
          const v = isDirectShort
            ? 0
            : Math.max(
                voltageAcross('LAMP_LH_POS', 'FD_LH_GND'),
                voltageAcross('LAMP_LH_POS', 'LAMP_TURN_GND')
              );
          state.voltage = Number(v.toFixed(2));
          state.energized = v >= 2.2;
          state.brightness = brightnessFromVoltage(v, 2.2);
        } else if (comp.id === 'TURN_RH') {
          const v = isDirectShort ? 0 : voltageAcross('LAMP_RH_POS', 'LAMP_RH_NEG');
          state.voltage = Number(v.toFixed(2));
          state.energized = v >= 2.2;
          state.brightness = brightnessFromVoltage(v, 2.2);
        } else if (comp.id === 'TURN_LAMPS') {
          const vLh = isDirectShort
            ? 0
            : Math.max(
                voltageAcross('LAMP_LH_POS', 'FD_LH_GND'),
                voltageAcross('LAMP_LH_POS', 'LAMP_TURN_GND')
              );
          const vRh = isDirectShort ? 0 : voltageAcross('LAMP_RH_POS', 'LAMP_TURN_GND');
          state.lhOn = vLh >= 2.2;
          state.rhOn = vRh >= 2.2;
          state.voltage = Number(vRh.toFixed(2));
          state.energized = state.rhOn;
          state.brightness = brightnessFromVoltage(vRh, 2.2);
        }
      } else if (comp.type === 'indicator_cluster') {
        const vTurn = isDirectShort ? 0 : voltageAcross('IND_TURN', 'IND_GND');
        const vTail = isDirectShort ? 0 : voltageAcross('IND_TAIL', 'IND_GND');
        const vHi = isDirectShort ? 0 : voltageAcross('IND_HI', 'IND_GND');
        state.turnPilot = vTurn >= 2.2;
        state.tailPilot = vTail >= 2.2;
        state.highPilot = vHi >= 2.2;
        state.voltage = Number(Math.max(vTurn, vTail, vHi).toFixed(2));
        state.energized = state.turnPilot || state.tailPilot || state.highPilot;
      } else if (comp.type === 'evaporator_unit') {
        // Real voltage divider across blower resistor ladder + motor (2.0 Ohms)
        const vBlw = isDirectShort ? 0 : voltageAcross('MTR_BLW_POS', 'MTR_BLW_GND');
        const blwPowered = vBlw >= 2.5;
        let speed = 0;
        if (blwPowered) {
          if (vBlw >= 10.2) speed = 3;
          else if (vBlw >= 7.5) speed = 2;
          else speed = 1;
        }
        state.energized = blwPowered;
        state.speed = speed;
        state.voltage = Number(vBlw.toFixed(2));
        state.current = Number((vBlw / LOAD_RESISTANCES.MOTOR_BLOWER).toFixed(2));
      } else if (comp.type === 'magnetic_clutch') {
        const v = isDirectShort ? 0 : voltageAcross('CLUTCH_POS', 'CLUTCH_GND');
        state.voltage = Number(v.toFixed(2));
        state.current = Number((v / LOAD_RESISTANCES.MAG_CLUTCH).toFixed(2));
        state.energized = v >= 6.5;
      } else if (comp.type === 'condenser_fan') {
        const v = isDirectShort ? 0 : voltageAcross('FAN_POS', 'FAN_GND');
        state.voltage = Number(v.toFixed(2));
        state.current = Number((v / LOAD_RESISTANCES.EXTRA_FAN).toFixed(2));
        state.energized = v >= 4.0;
      } else if (comp.type === 'manifold_gauge_unit' || comp.type === 'digital_temp_unit') {
        const vClu = isDirectShort ? 0 : voltageAcross('CLUTCH_POS', 'CLUTCH_GND');
        const vFan = isDirectShort ? 0 : voltageAcross('FAN_POS', 'FAN_GND');
        state.energized = vClu >= 6.5 || vFan >= 4.0;
        state.voltage = Number(Math.max(vClu, vFan).toFixed(2));
      }

      if (comp.id === 'SW_DIMMER') {
        state.dimPassActive = this.dimPassActive;
      }

      if (comp.id === 'IGN_SW') {
        state.ignStartActive = this.ignStartActive;
      }

      componentStates[comp.id] = state;
    }

    if (!this.refrigState) {
      this.refrigState = {
        lowPressurePsi: 80.0,
        highPressurePsi: 80.0,
        tempAmbient: 28.5,
        tempEvapIn: 27.0,
        tempEvapOut: 27.0,
        sightGlass: 'STAGNANT',
      };
    }

    const rawClutchActive = Boolean(
      componentStates['MAG_CLUTCH']?.energized ||
      (!isDirectShort && voltageAcross('CLUTCH_POS', 'CLUTCH_GND') >= 6.5)
    );
    const driveMotorState = this.switchStates['MOTOR_DRIVE_AC'] ?? 'IDLE_800';
    const driveMotorRpm =
      driveMotorState === 'IDLE_800' ? 800 :
      driveMotorState === 'MED_1500' ? 1500 :
      driveMotorState === 'HIGH_2200' ? 2200 : 0;
    const driveMotorOn = driveMotorRpm > 0;
    const blowerSpeed = componentStates['EVAPORATOR_UNIT']?.speed || 0;
    const blowerVoltageDrop = componentStates['EVAPORATOR_UNIT']?.voltage || 0.0;
    const isFanCooling = Boolean(
      componentStates['EXTRA_FAN']?.energized ||
      (!isDirectShort && voltageAcross('FAN_POS', 'FAN_GND') >= 4.0)
    );

    // In ac03, safety interlock requires blower to be ON (speed > 0)
    const clutchActive = rawClutchActive && (this.module.id !== 'ac03' || blowerSpeed > 0);
    const isCompressorPumping = clutchActive && (this.module.id !== 'ac03' || driveMotorOn);

    if (isCompressorPumping) {
      // Higher blower speed yields colder air discharge and crisper suction drop
      const targetLow = Math.max(26.0, 34.0 - blowerSpeed * 2.0);
      const targetHigh = isFanCooling ? 175.0 : 310.0;
      const targetEvapOut = Math.max(4.0, 13.5 - blowerSpeed * 3.0);

      this.refrigState.lowPressurePsi += (targetLow - this.refrigState.lowPressurePsi) * Math.min(1, deltaSeconds * 2.0);
      this.refrigState.highPressurePsi += (targetHigh - this.refrigState.highPressurePsi) * Math.min(1, deltaSeconds * 1.8);
      this.refrigState.tempEvapOut += (targetEvapOut - this.refrigState.tempEvapOut) * Math.min(1, deltaSeconds * 0.9);
      this.refrigState.sightGlass = 'CLEAR';
    } else {
      this.refrigState.lowPressurePsi += (80.0 - this.refrigState.lowPressurePsi) * Math.min(1, deltaSeconds * 1.2);
      this.refrigState.highPressurePsi += (80.0 - this.refrigState.highPressurePsi) * Math.min(1, deltaSeconds * 1.2);
      this.refrigState.tempEvapOut += (this.refrigState.tempEvapIn - this.refrigState.tempEvapOut) * Math.min(1, deltaSeconds * 0.5);
      this.refrigState.sightGlass = 'STAGNANT';
    }

    const checklistStatus = (this.module.checklist || []).map((item) => ({
      id: item.id,
      label: item.label,
      completed: Boolean(typeof item.check === 'function' ? item.check(wireNet) : item.isDone?.(wireNet)),
    }));

    const boardPowered =
      (posSet.has('BOARD_POS') && negSet.has('BOARD_GND')) ||
      (posSet.has('BUS30_1') && negSet.has('BUS31_1')) ||
      (posSet.has('BAT_POS') && negSet.has('BAT_NEG'));

    const batteryVoltage = Number((nodeVoltages['BAT_POS'] ?? BATTERY_VOC).toFixed(2));

    return {
      pinVoltages,
      nodeVoltages,
      batteryVoltage,
      batteryCurrent: Number(batteryCurrent.toFixed(2)),
      activeBranches,
      passiveBranches,
      pinIds,
      componentStates,
      shortCircuitEvents,
      checklistStatus,
      boardPowered,
      posSet,
      negSet,
      refrigeration: {
        lowPressurePsi: this.refrigState.lowPressurePsi,
        highPressurePsi: this.refrigState.highPressurePsi,
        t1Ambient: this.refrigState.tempAmbient,
        t2EvapInlet: this.refrigState.tempEvapIn,
        t3VentDischarge: this.refrigState.tempEvapOut,
        sightGlassState: this.refrigState.sightGlass,
        clutchActive,
        clutchEngaged: clutchActive,
        compressorPumping: isCompressorPumping,
        compressorRpm: clutchActive ? driveMotorRpm : 0,
        driveMotorRpm,
        blowerSpeed,
        blowerVoltageDrop,
        fanRunning: isFanCooling,
      },
    };
  }
}
