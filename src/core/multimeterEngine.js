// Multimeter Engine for 3D Automotive Bench Simulator
// Provides realistic digital multimeter calculations (DC Voltage, Resistance Ohm, Continuity Beep, DC Ampere)
// Supports two-way synchronization between physical 3D multimeter and floating HUD widget.

export const MULTIMETER_MODES = {
  OFF: 'OFF',
  V_DC: 'V_DC',
  OHM: 'OHM',
  CONTINUITY: 'CONTINUITY',
  A_DC: 'A_DC',
};

// Component nominal internal resistance values (Ohms at 12V cold)
export const COMPONENT_NOMINAL_RESISTANCE = {
  // Resistors
  R_10: 10.0,
  R_50: 50.0,
  R_100: 100.0,
  // Bulbs (R = V^2 / P)
  LAMP_5W: 28.8,
  LAMP_21W: 6.8,
  LAMP_55W: 2.6,
  LAMP_LED: 240.0, // High forward resistance equivalent
  // Coils & Actuators
  RELAY_COIL: 78.0,
  HORN: 1.8,
  BUZZER: 150.0,
  MOTOR: 4.2,
  FUSE_INTACT: 0.1,
  WIRE_IDEAL: 0.05,
};

export class MultimeterEngine {
  constructor() {
    this.mode = MULTIMETER_MODES.V_DC;
    this.redPin = null;
    this.blackPin = null;
    this.active = true;
    this.hudVisible = true;
    this.hudMinimized = false;

    this.reading = {
      display: '0.00',
      unit: 'V',
      overload: false,
      beeping: false,
      isNegative: false,
    };
  }

  setMode(mode) {
    if (Object.values(MULTIMETER_MODES).includes(mode)) {
      this.mode = mode;
    }
  }

  attachRedProbe(pinId) {
    this.redPin = pinId || null;
  }

  attachBlackProbe(pinId) {
    this.blackPin = pinId || null;
  }

  clearProbes() {
    this.redPin = null;
    this.blackPin = null;
  }

  setHudVisible(visible) {
    this.hudVisible = Boolean(visible);
  }

  toggleHud() {
    this.hudVisible = !this.hudVisible;
    return this.hudVisible;
  }

  toggleMinimize() {
    this.hudMinimized = !this.hudMinimized;
    return this.hudMinimized;
  }

  // Calculate measurement based on current solver state and module topology
  update(solverSnapshot, activeModule, cables = []) {
    if (this.mode === MULTIMETER_MODES.OFF) {
      this.reading = {
        display: '    ',
        unit: '',
        overload: false,
        beeping: false,
        isNegative: false,
      };
      return this.reading;
    }

    if (!this.redPin || !this.blackPin) {
      let idleDisplay = '0.00';
      let idleUnit = 'V';
      if (this.mode === MULTIMETER_MODES.OHM) {
        idleDisplay = 'O.L';
        idleUnit = 'MΩ';
      } else if (this.mode === MULTIMETER_MODES.CONTINUITY) {
        idleDisplay = 'O.L';
        idleUnit = 'Ω';
      } else if (this.mode === MULTIMETER_MODES.A_DC) {
        idleDisplay = '0.00';
        idleUnit = 'A';
      }
      this.reading = {
        display: idleDisplay,
        unit: idleUnit,
        overload: idleDisplay === 'O.L',
        beeping: false,
        isNegative: false,
      };
      return this.reading;
    }

    const { posSet = new Set(), negSet = new Set(), boardPowered = false } = solverSnapshot || {};
    const pinVoltages = solverSnapshot?.pinVoltages || {};

    // ------------------------------------------------------------------------
    // MODE 1: DC VOLTAGE (V_DC) — Parallel Potential Difference
    // ------------------------------------------------------------------------
    if (this.mode === MULTIMETER_MODES.V_DC) {
      const redV = posSet.has(this.redPin) ? 12.6 : negSet.has(this.redPin) ? 0.0 : null;
      const blackV = posSet.has(this.blackPin) ? 12.6 : negSet.has(this.blackPin) ? 0.0 : null;

      let vDiff = 0.0;
      let isNegative = false;

      if (redV !== null && blackV !== null) {
        vDiff = redV - blackV;
        if (vDiff < 0) {
          isNegative = true;
          vDiff = Math.abs(vDiff);
        }
        // Small realistic load sag if lights or horn are on
        const hasHeavyLoad = Object.values(solverSnapshot?.componentStates || {}).some(
          (s) => s.energized && (s.highBeam || s.lowBeam || s.relayClosed)
        );
        if (hasHeavyLoad && vDiff > 10.0) {
          vDiff = 11.95;
        }

        // Blower motor voltage drop through resistor network
        const evapUnit = solverSnapshot?.componentStates?.EVAPORATOR_UNIT;
        if (evapUnit && evapUnit.energized && evapUnit.voltage) {
          const isMeasuringBlower =
            (this.redPin === 'MTR_BLW_POS' && this.blackPin === 'MTR_BLW_GND') ||
            (this.redPin === 'MTR_BLW_GND' && this.blackPin === 'MTR_BLW_POS');
          if (isMeasuringBlower) {
            vDiff = evapUnit.voltage;
          }
        }
      } else if (redV !== null && blackV === null) {
        // Black probe is floating
        vDiff = 0.0;
      } else if (redV === null && blackV !== null) {
        // Red probe is floating
        vDiff = 0.0;
      }

      this.reading = {
        display: (isNegative ? '-' : '') + vDiff.toFixed(2),
        unit: 'V',
        overload: false,
        beeping: false,
        isNegative,
      };
      return this.reading;
    }

    // ------------------------------------------------------------------------
    // MODE 2 & 3: RESISTANCE (OHM) & CONTINUITY (BUZZER)
    // ------------------------------------------------------------------------
    if (this.mode === MULTIMETER_MODES.OHM || this.mode === MULTIMETER_MODES.CONTINUITY) {
      // Check if circuit has live power from battery
      const hasLivePower =
        (posSet.has(this.redPin) || posSet.has(this.blackPin)) &&
        boardPowered;

      if (hasLivePower) {
        // Warning: cannot measure resistance on live circuit!
        this.reading = {
          display: 'Err',
          unit: 'LIVE',
          overload: true,
          beeping: false,
          isNegative: false,
        };
        return this.reading;
      }

      // Check if probes are directly shorted or connected on same wire
      const isDirectlyConnected =
        this.redPin === this.blackPin ||
        cables.some(
          (c) =>
            (c.fromPin === this.redPin && c.toPin === this.blackPin) ||
            (c.fromPin === this.blackPin && c.toPin === this.redPin)
        );

      let rVal = null;
      if (isDirectlyConnected) {
        rVal = 0.1;
      } else {
        rVal = this._estimateComponentResistance(this.redPin, this.blackPin, activeModule);
      }

      if (rVal === null || rVal > 2000) {
        this.reading = {
          display: 'O.L',
          unit: this.mode === MULTIMETER_MODES.CONTINUITY ? 'Ω' : 'MΩ',
          overload: true,
          beeping: false,
          isNegative: false,
        };
        return this.reading;
      }

      const isContinuous = rVal < 15.0;
      let displayStr = rVal.toFixed(rVal < 10 ? 1 : 0);
      let unitStr = 'Ω';

      if (rVal >= 1000) {
        displayStr = (rVal / 1000).toFixed(2);
        unitStr = 'kΩ';
      }

      this.reading = {
        display: displayStr,
        unit: unitStr,
        overload: false,
        beeping: this.mode === MULTIMETER_MODES.CONTINUITY && isContinuous,
        isNegative: false,
      };
      return this.reading;
    }

    // ------------------------------------------------------------------------
    // MODE 4: DC CURRENT (A_DC) — Series In-line Measurement
    // ------------------------------------------------------------------------
    if (this.mode === MULTIMETER_MODES.A_DC) {
      // If red probe is at 12V source and black is feeding a load that goes to GND
      let amp = 0.0;
      const redAt12V = posSet.has(this.redPin);
      const blackAt12V = posSet.has(this.blackPin);

      if (redAt12V && !blackAt12V) {
        amp = 1.75; // Typical 21W lamp load current
      } else if (blackAt12V && !redAt12V) {
        amp = -1.75;
      }

      this.reading = {
        display: Math.abs(amp).toFixed(2),
        unit: 'A',
        overload: false,
        beeping: false,
        isNegative: amp < 0,
      };
      return this.reading;
    }

    return this.reading;
  }

  // Lookup nominal component resistance if measuring across its terminals
  _estimateComponentResistance(pinA, pinB, moduleDef) {
    if (!moduleDef) return null;

    const norm = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
    const pair = norm(pinA, pinB);

    // Resistors
    if (pair === norm('R1_A', 'R1_B')) return 10.0;
    if (pair === norm('R2_A', 'R2_B')) return 50.0;
    if (pair === norm('R3_A', 'R3_B')) return 100.0;

    // Lamps
    if (pair === norm('L5W_POS', 'L5W_NEG')) return 28.8;
    if (pair === norm('L21W_POS', 'L21W_NEG')) return 6.8;
    if (pair === norm('H4_LOW', 'H4_GND')) return 2.6;
    if (pair === norm('H4_HIGH', 'H4_GND')) return 2.4;
    if (pair === norm('LED_A', 'LED_K')) return 240.0;

    // Actuators
    if (pair === norm('BUZ_POS', 'BUZ_NEG')) return 150.0;
    if (pair === norm('MTR_POS', 'MTR_NEG')) return 4.2;

    // AC Components
    if (pair === norm('MTR_BLW_POS', 'MTR_BLW_GND')) return 1.4;
    if (pair === norm('CLUTCH_POS', 'CLUTCH_GND')) return 3.8;
    if (pair === norm('FAN_POS', 'FAN_GND')) return 2.4;
    if (pair === norm('PS_IN', 'PS_OUT')) return 0.1;
    if (pair === norm('TH_IN', 'TH_OUT')) return 0.1;
    if (pair === norm('RES_IN', 'RES_LOW')) return 2.2;
    if (pair === norm('RES_IN', 'RES_MED')) return 1.2;
    if (pair === norm('RES_IN', 'RES_HIGH')) return 0.1;
    if (pair === norm('RES_LOW', 'RES_MED')) return 1.0;
    if (pair === norm('RES_MED', 'RES_HIGH')) return 1.1;

    // Relays
    if (
      pair.includes('85') && pair.includes('86')
    ) {
      return 78.0;
    }
    if (pair.includes('30') && (pair.includes('87a') || pair.includes('87A'))) return 0.1; // NC contact
    if (pair.includes('30') && pair.includes('87')) return 9999; // NO contact

    // Fuses
    if (pair.includes('F1_IN') && pair.includes('F1_OUT')) return 0.1;
    if (pair.includes('F2_IN') && pair.includes('F2_OUT')) return 0.1;
    if (pair.includes('F3_IN') && pair.includes('F3_OUT')) return 0.1;
    if (pair.includes('F4_IN') && pair.includes('F4_OUT')) return 0.1;
    if (pair.includes('FUSE_BLW_IN') && pair.includes('FUSE_BLW_OUT')) return 0.1;
    if (pair.includes('FUSE_AC_IN') && pair.includes('FUSE_AC_OUT')) return 0.1;

    // Horn
    if (pair === norm('HORN_POS', 'HORN_NEG')) return 1.8;

    return null;
  }
}
