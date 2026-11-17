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

  _getSwitchBridges() {
    const bridges = [];
    for (const comp of this.module.components || []) {
      const state = this.switchStates[comp.id] ?? comp.defaultState;
      const compPins = (this.module.pins || []).filter((p) => p.componentId === comp.id);

      if (comp.type === 'ignition') {
        const pB = compPins.find((p) => p.id.endsWith('_B'))?.id;
        const pACC = compPins.find((p) => p.id.endsWith('_ACC'))?.id;
        const pIG = compPins.find((p) => p.id.endsWith('_IG'))?.id;
        const pST = compPins.find((p) => p.id.endsWith('_ST'))?.id;
        if (this.ignStartActive) {
          if (pB && pIG) bridges.push([pB, pIG]);
          if (pB && pST) bridges.push([pB, pST]);
        } else if (state === 'IG' || state === 'ON') {
          if (pB && pIG) bridges.push([pB, pIG]);
          if (pB && pACC) bridges.push([pB, pACC]);
        } else if (state === 'ACC') {
          if (pB && pACC) bridges.push([pB, pACC]);
        }
      } else if (comp.type === 'switch_push' || comp.type === 'switch_toggle') {
        if (state === 'ON' && compPins.length >= 2) {
          bridges.push([compPins[0].id, compPins[1].id]);
        }
      } else if (comp.type === 'switch_combo') {
        if (comp.id === 'SW_DIMMER') {
          if (state === 'LOW') bridges.push(['DIM_IN', 'DIM_LOW']);
          if (state === 'HIGH' || this.dimPassActive) bridges.push(['DIM_IN', 'DIM_HIGH']);
        } else if (comp.id === 'SW_TURN') {
          if (state === 'LEFT') bridges.push(['TURN_L_IN', 'TURN_LH_OUT']);
          if (state === 'RIGHT') bridges.push(['TURN_L_IN', 'TURN_RH_OUT']);
        }
      } else if (comp.type === 'switch_hazard') {
        if (state === 'ON') {
          bridges.push(['HZD_IN', 'HZD_LH']);
          bridges.push(['HZD_IN', 'HZD_RH']);
        }
      } else if (comp.type === 'switch_blower_rotary') {
        if (state === 'SPEED_1') bridges.push(['BLW_SW_B', 'BLW_SW_1']);
        if (state === 'SPEED_2') bridges.push(['BLW_SW_B', 'BLW_SW_2']);
        if (state === 'SPEED_3') bridges.push(['BLW_SW_B', 'BLW_SW_3']);
      } else if (comp.type === 'switch_ac_push') {
        if (state === 'ON') bridges.push(['AC_SW_IN', 'AC_SW_OUT']);
      } else if (comp.type === 'thermostat_ac') {
        if (state === 'ON') bridges.push(['TH_IN', 'TH_OUT']);
      } else if (comp.type === 'pressure_switch_dual') {
        if (state === 'CLOSED') bridges.push(['PS_IN', 'PS_OUT']);
      } else if (comp.type === 'resistor_blower') {
        bridges.push(['RES_LOW', 'RES_MED'], ['RES_MED', 'RES_HIGH'], ['RES_HIGH', 'RES_IN']);
      }
    }

    if (this.module.id === 'fig00') {
      bridges.push(['BUS30_1', 'BUS30_2'], ['BUS30_2', 'BUS30_3']);
      bridges.push(
        ['BUS31_1', 'BUS31_2'],
        ['BUS31_2', 'BUS31_3'],
        ['BUS31_3', 'BUS31_4'],
        ['BUS31_4', 'BUS31_5']
      );
    } else if (this.module.id === 'ac01' || this.module.id === 'ac02' || this.module.id === 'ac03') {
      bridges.push(['BUS30_1', 'BUS30_2']);
      if (this.module.id === 'ac02' || this.module.id === 'ac03') {
        bridges.push(['BUS30_2', 'BUS30_3']);
      }
      bridges.push(
        ['BUS31_1', 'BUS31_2'],
        ['BUS31_2', 'BUS31_3']
      );
      if (this.module.id === 'ac02' || this.module.id === 'ac03') {
        bridges.push(['BUS31_3', 'BUS31_4']);
      }
    }
    return bridges;
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
    const fuseChannels = this._getFuseChannels();
    const switchBridges = this._getSwitchBridges();
    const relays = this._getRelayDefinitions();

    // Helper for checklist evaluation (pure wire connectivity including stacked pins)
    const wireAdj = this._buildAdjacency(cables, []);
    const wireNet = {
      areConnected: (pinA, pinB) => {
        const reach = this._findReachable(wireAdj, pinA);
        return reach.has(pinB);
      },
    };

    // Helper to get currently active fuse bridges
    const getActiveFuseBridges = () =>
      fuseChannels
        .filter((f) => !this.blownFuses.has(f.key))
        .map((f) => [f.inPin, f.outPin]);

    // Check short circuit across each intact fuse before & after relay evaluation
    const checkAndBlowShortedFuses = (relayBridges) => {
      for (const fuse of fuseChannels) {
        if (this.blownFuses.has(fuse.key)) continue;
        // Build graph with all OTHER intact fuses, switches, and relays, plus this fuse
        const otherFuseBridges = fuseChannels
          .filter((f) => f.key !== fuse.key && !this.blownFuses.has(f.key))
          .map((f) => [f.inPin, f.outPin]);

        const adjWithoutThisFuse = this._buildAdjacency(cables, [
          ...switchBridges,
          ...relayBridges,
          ...otherFuseBridges,
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

    // Pass 2: Evaluate relay coils (85 - 86) iteratively (supports cascading relays, e.g. Main Relay)
    const relayStates = {};
    let activeRelayBridges = [];
    let posSet = new Set();
    let negSet = new Set();

    for (let iter = 0; iter < 4; iter++) {
      let changed = false;
      const baseAdj = this._buildAdjacency(cables, [
        ...switchBridges,
        ...getActiveFuseBridges(),
        ...activeRelayBridges,
      ]);
      posSet = this._findReachable(baseAdj, 'BAT_POS');
      negSet = this._findReachable(baseAdj, 'BAT_NEG');

      for (const rly of relays) {
        const coilEnergized =
          (posSet.has(rly.p85) && negSet.has(rly.p86)) ||
          (posSet.has(rly.p86) && negSet.has(rly.p85));
        if (Boolean(relayStates[rly.componentId]) !== coilEnergized) {
          relayStates[rly.componentId] = coilEnergized;
          changed = true;
        }
      }
      activeRelayBridges = [];
      for (const r of relays) {
        if (relayStates[r.componentId]) {
          if (r.p30 && r.p87) activeRelayBridges.push([r.p30, r.p87]);
        } else if (r.isSpdt && r.p30 && r.p87a) {
          activeRelayBridges.push([r.p30, r.p87a]);
        }
      }
      if (!changed) break;
    }

    // Re-check short circuits in case closing a relay caused a direct short to GND
    if (activeRelayBridges.length > 0) {
      checkAndBlowShortedFuses(activeRelayBridges);
    }

    // Pass 3: Evaluate Flasher (FL_B, FL_L, FL_E)
    const flasherBridges = [];
    const hasFlasher = (this.module.components || []).some((c) => c.type === 'flasher');
    let flasherActive = false;

    if (hasFlasher) {
      const preFlasherAdj = this._buildAdjacency(cables, [
        ...switchBridges,
        ...getActiveFuseBridges(),
        ...activeRelayBridges,
      ]);
      const prePos = this._findReachable(preFlasherAdj, 'BAT_POS');
      const preNeg = this._findReachable(preFlasherAdj, 'BAT_NEG');

      if (prePos.has('FL_B') && preNeg.has('FL_E')) {
        // Test if terminal FL_L has a closed circuit through any turn/hazard load to ground
        const testAdj = this._buildAdjacency(cables, [
          ...switchBridges,
          ...getActiveFuseBridges(),
          ...activeRelayBridges,
          ['BAT_POS', 'FL_L'],
        ]);
        const testPos = this._findReachable(testAdj, 'BAT_POS');
        const testNeg = this._findReachable(testAdj, 'BAT_NEG');

        const hasLoad =
          (testPos.has('LAMP_LH_POS') && (testNeg.has('LAMP_LH_NEG') || testNeg.has('FD_LH_GND') || testNeg.has('LAMP_TURN_GND'))) ||
          (testPos.has('LAMP_RH_POS') && (testNeg.has('LAMP_RH_NEG') || testNeg.has('LAMP_TURN_GND'))) ||
          (testPos.has('LH_SIGN') && testNeg.has('LH_GND')) ||
          (testPos.has('RH_SIGN') && testNeg.has('RH_GND'));

        if (hasLoad) {
          flasherActive = true;
          this.flasherTimer += deltaSeconds;
          if (this.flasherTimer >= 0.35) {
            this.flasherTimer = 0;
            this.flasherOn = !this.flasherOn;
          }
          if (this.flasherOn) {
            flasherBridges.push(['FL_B', 'FL_L']);
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

    // Final propagation with all active bridges
    const finalAdj = this._buildAdjacency(cables, [
      ...switchBridges,
      ...getActiveFuseBridges(),
      ...activeRelayBridges,
      ...flasherBridges,
    ]);
    posSet = this._findReachable(finalAdj, 'BAT_POS');
    negSet = this._findReachable(finalAdj, 'BAT_NEG');

    const pinVoltages = {};
    for (const p of this.module.pins || []) {
      if (posSet.has(p.id) && !negSet.has(p.id)) {
        pinVoltages[p.id] = '12V';
      } else if (negSet.has(p.id) && !posSet.has(p.id)) {
        pinVoltages[p.id] = 'GND';
      } else {
        pinVoltages[p.id] = 'FLOAT';
      }
    }

    const isAcross12V = (pinPos, pinNeg) =>
      posSet.has(pinPos) && negSet.has(pinNeg) && !posSet.has('BAT_NEG');

    // Compute component states
    const componentStates = {};
    for (const comp of this.module.components || []) {
      const state = {
        energized: false,
        switchState: this.switchStates[comp.id] ?? comp.defaultState,
      };

      if (comp.type === 'fuse_single' || comp.type === 'fuse_dual' || comp.type === 'fuse_quad') {
        const compFuses = fuseChannels.filter((f) => f.componentId === comp.id);
        state.blown = compFuses.some((f) => this.blownFuses.has(f.key));
        state.blownChannels = compFuses.filter((f) => this.blownFuses.has(f.key)).map((f) => f.key);
      } else if (comp.type === 'relay_4p' || comp.type === 'relay_5p') {
        state.relayClosed = Boolean(relayStates[comp.id]);
        state.energized = state.relayClosed;
      } else if (comp.type === 'buzzer') {
        state.energized = isAcross12V('BUZ_POS', 'BUZ_NEG');
      } else if (comp.type === 'motor_small') {
        state.energized = isAcross12V('MTR_POS', 'MTR_NEG');
      } else if (comp.type === 'lamp_led') {
        state.energized = isAcross12V('LED_A', 'LED_K');
      } else if (comp.type === 'lamp_h4') {
        state.lowBeam = isAcross12V('H4_LOW', 'H4_GND');
        state.highBeam = isAcross12V('H4_HIGH', 'H4_GND');
        state.energized = state.lowBeam || state.highBeam;
      } else if (comp.id === 'LAMP_5W') {
        state.energized = isAcross12V('L5W_POS', 'L5W_NEG');
      } else if (comp.id === 'LAMP_21W') {
        state.energized = isAcross12V('L21W_POS', 'L21W_NEG');
      } else if (comp.type === 'flasher') {
        state.energized = flasherActive;
        state.blinkingOn = flasherActive && this.flasherOn;
      } else if (comp.type === 'lamp_test') {
        state.energized = isAcross12V('LAMP_POS', 'LAMP_NEG') || isAcross12V('LAMP_NEG', 'LAMP_POS');
      } else if (comp.type === 'horn') {
        state.energized = isAcross12V('HORN_POS', 'HORN_NEG') || isAcross12V('HORN_NEG', 'HORN_POS');
      } else if (comp.type === 'lamp_red_dual') {
        if (comp.id === 'TAIL_LH') {
          state.signOn = isAcross12V('LH_SIGN', 'LH_GND');
          state.tailOn = isAcross12V('LH_TAIL', 'LH_GND');
          state.stopOn = isAcross12V('LH_STOP', 'LH_GND');
          state.revOn = isAcross12V('LH_REV', 'LH_GND');
          state.energized = state.signOn || state.tailOn || state.stopOn || state.revOn;
        } else if (comp.id === 'TAIL_RH') {
          state.signOn = isAcross12V('RH_SIGN', 'RH_GND');
          state.tailOn = isAcross12V('RH_TAIL', 'RH_GND');
          state.stopOn = isAcross12V('RH_STOP', 'RH_GND');
          state.revOn = isAcross12V('RH_REV', 'RH_GND');
          state.energized = state.signOn || state.tailOn || state.stopOn || state.revOn;
        }
      } else if (comp.type === 'licence_lamp') {
        state.energized =
          isAcross12V('LIC_POS', 'GND_MID') ||
          isAcross12V('LIC_POS', 'LIC_GND') ||
          isAcross12V('LIC_POS', 'BOARD_GND');
      } else if (comp.type === 'headlamp') {
        if (comp.id === 'HL_LH') {
          state.lowBeam = isAcross12V('HLL_LOW', 'HLL_GND');
          state.highBeam = isAcross12V('HLL_HIGH', 'HLL_GND');
          state.energized = state.lowBeam || state.highBeam;
        } else if (comp.id === 'HL_RH') {
          state.lowBeam = isAcross12V('HLR_LOW', 'HLR_GND');
          state.highBeam = isAcross12V('HLR_HIGH', 'HLR_GND');
          state.energized = state.lowBeam || state.highBeam;
        } else if (comp.id === 'HL_MAIN') {
          state.lowBeam = isAcross12V('HL_LOW_POS', 'HL_GND');
          state.highBeam = isAcross12V('HL_HIGH_POS', 'HL_GND');
          state.energized = state.lowBeam || state.highBeam;
        }
      } else if (comp.type === 'lamp_amber') {
        if (comp.id === 'TURN_LH') {
          state.energized = isAcross12V('LAMP_LH_POS', 'LAMP_LH_NEG');
        } else if (comp.id === 'SIGN_FRONT_LH') {
          state.energized = isAcross12V('LAMP_LH_POS', 'FD_LH_GND') || isAcross12V('LAMP_LH_POS', 'LAMP_TURN_GND');
        } else if (comp.id === 'TURN_RH') {
          state.energized = isAcross12V('LAMP_RH_POS', 'LAMP_RH_NEG');
        } else if (comp.id === 'TURN_LAMPS') {
          state.lhOn = isAcross12V('LAMP_LH_POS', 'LAMP_TURN_GND') || isAcross12V('LAMP_LH_POS', 'FD_LH_GND');
          state.rhOn = isAcross12V('LAMP_RH_POS', 'LAMP_TURN_GND');
          state.energized = state.rhOn;
        }
      } else if (comp.type === 'indicator_cluster') {
        state.turnPilot = isAcross12V('IND_TURN', 'IND_GND');
        state.tailPilot = isAcross12V('IND_TAIL', 'IND_GND');
        state.highPilot = isAcross12V('IND_HI', 'IND_GND');
        state.energized = state.turnPilot || state.tailPilot || state.highPilot;
      } else if (comp.type === 'evaporator_unit') {
        const blwPowered = isAcross12V('MTR_BLW_POS', 'MTR_BLW_GND');
        state.energized = blwPowered;
        const swState = this.switchStates['SW_BLOWER'] ?? 'OFF';
        let speed = 0;
        let voltage = 0.0;
        if (blwPowered) {
          if (swState === 'SPEED_3') {
            speed = 3;
            voltage = 12.6;
          } else if (swState === 'SPEED_2') {
            speed = 2;
            voltage = 9.0;
          } else if (swState === 'SPEED_1') {
            speed = 1;
            voltage = 6.0;
          } else {
            speed = 3;
            voltage = 12.6;
          }
        }
        state.speed = speed;
        state.voltage = voltage;
      } else if (comp.type === 'magnetic_clutch') {
        state.energized = isAcross12V('CLUTCH_POS', 'CLUTCH_GND');
      } else if (comp.type === 'condenser_fan') {
        state.energized = isAcross12V('FAN_POS', 'FAN_GND');
      } else if (comp.type === 'manifold_gauge_unit' || comp.type === 'digital_temp_unit') {
        state.energized = isAcross12V('CLUTCH_POS', 'CLUTCH_GND') || isAcross12V('FAN_POS', 'FAN_GND');
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
      isAcross12V('CLUTCH_POS', 'CLUTCH_GND')
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
      isAcross12V('FAN_POS', 'FAN_GND')
    );

    // In ac03, safety interlock requires blower to be ON (speed > 0)
    const clutchActive = rawClutchActive && (this.module.id !== 'ac03' || blowerSpeed > 0);
    const isCompressorPumping = clutchActive && (this.module.id !== 'ac03' || driveMotorOn);

    if (isCompressorPumping) {
      // Higher blower speed yields colder air discharge and crisper suction drop
      // Speed 1: ~10.5°C, Speed 2: ~7.5°C, Speed 3: ~4.5°C
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

    return {
      pinVoltages,
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
