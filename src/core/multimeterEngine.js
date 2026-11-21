// Multimeter Engine for 3D Automotive Bench Simulator
// Powered by real DC Linear Nodal Analysis (exact V-drop, Thevenin OHM/Continuity, and shunt A_DC).
// Supports two-way synchronization between physical 3D multimeter and floating HUD widget.

import { measureEquivalentResistance, measureSeriesAmmeter } from './nodalSolver.js';
import { BATTERY_VOC, BATTERY_R_INT } from './circuitSolver.js';

export const MULTIMETER_MODES = {
  OFF: 'OFF',
  V_DC: 'V_DC',
  OHM: 'OHM',
  CONTINUITY: 'CONTINUITY',
  A_DC: 'A_DC',
};

// Reference nominal component resistance table (Ohms at 12V cold)
export const COMPONENT_NOMINAL_RESISTANCE = {
  R_10: 10.0,
  R_50: 50.0,
  R_100: 100.0,
  LAMP_5W: 28.8,
  LAMP_10W: 14.4,
  LAMP_21W: 6.8,
  LAMP_55W: 2.6,
  LAMP_60W: 2.4,
  LAMP_LED: 240.0,
  RELAY_COIL: 78.0,
  HORN: 2.0,
  BUZZER: 150.0,
  MOTOR: 4.2,
  MOTOR_BLOWER: 2.0,
  MAG_CLUTCH: 3.8,
  EXTRA_FAN: 2.4,
  FUSE_INTACT: 0.025,
  WIRE_IDEAL: 0.022,
};

export class MultimeterEngine {
  constructor() {
    this.mode = MULTIMETER_MODES.V_DC;
    this.redPin = null;
    this.blackPin = null;
    this.active = true;
    this.hudVisible = false;
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

  // Calculate exact electrical measurement from current Nodal Solver snapshot
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

    const {
      posSet = new Set(),
      negSet = new Set(),
      boardPowered = false,
      nodeVoltages = null,
      passiveBranches = null,
      activeBranches = null,
      pinIds = null,
    } = solverSnapshot || {};

    // ------------------------------------------------------------------------
    // MODE 1: DC VOLTAGE (V_DC) — Exact Potential Difference & Voltage Drops
    // ------------------------------------------------------------------------
    if (this.mode === MULTIMETER_MODES.V_DC) {
      let redV = null;
      let blackV = null;

      if (nodeVoltages) {
        redV = nodeVoltages[this.redPin] ?? null;
        blackV = nodeVoltages[this.blackPin] ?? null;
      } else {
        redV = posSet.has(this.redPin) ? BATTERY_VOC : negSet.has(this.redPin) ? 0.0 : null;
        blackV = posSet.has(this.blackPin) ? BATTERY_VOC : negSet.has(this.blackPin) ? 0.0 : null;
      }

      let vDiff = 0.0;
      let isNegative = false;

      if (redV !== null && blackV !== null) {
        const rawDiff = redV - blackV;
        if (Math.abs(rawDiff) < 0.005) {
          vDiff = 0.0;
          isNegative = false;
        } else if (rawDiff < 0) {
          isNegative = true;
          vDiff = Math.abs(rawDiff);
        } else {
          vDiff = rawDiff;
        }
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
    // MODE 2 & 3: RESISTANCE (OHM) & CONTINUITY (BUZZER) — Exact Thevenin R_eq
    // ------------------------------------------------------------------------
    if (this.mode === MULTIMETER_MODES.OHM || this.mode === MULTIMETER_MODES.CONTINUITY) {
      let hasLivePower = false;
      if (boardPowered) {
        if (nodeVoltages) {
          const vR = nodeVoltages[this.redPin];
          const vB = nodeVoltages[this.blackPin];
          hasLivePower =
            (vR !== null && vR !== undefined && Math.abs(vR) > 0.5) ||
            (vB !== null && vB !== undefined && Math.abs(vB) > 0.5);
        } else {
          hasLivePower = posSet.has(this.redPin) || posSet.has(this.blackPin);
        }
      }

      if (hasLivePower) {
        this.reading = {
          display: 'Err',
          unit: 'LIVE',
          overload: true,
          beeping: false,
          isNegative: false,
        };
        return this.reading;
      }

      let rVal = null;
      if (Array.isArray(passiveBranches)) {
        rVal = measureEquivalentResistance(passiveBranches, this.redPin, this.blackPin);
      } else {
        // Fallback when called without a solver snapshot
        const isDirect =
          this.redPin === this.blackPin ||
          cables.some(
            (c) =>
              (c.fromPin === this.redPin && c.toPin === this.blackPin) ||
              (c.fromPin === this.blackPin && c.toPin === this.redPin)
          );
        rVal = isDirect ? 0.1 : null;
      }

      if (rVal === null || rVal > 200000) {
        this.reading = {
          display: 'O.L',
          unit: this.mode === MULTIMETER_MODES.CONTINUITY ? 'Ω' : 'MΩ',
          overload: true,
          beeping: false,
          isNegative: false,
        };
        return this.reading;
      }

      // Real digital multimeters show ~0.1 Ohm minimum lead/contact floor
      const displayR = rVal < 0.08 ? 0.1 : rVal;
      const isContinuous = displayR < 15.0;
      let displayStr = displayR.toFixed(displayR < 10 ? 1 : 0);
      let unitStr = 'Ω';

      if (displayR >= 1000) {
        displayStr = (displayR / 1000).toFixed(2);
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
    // MODE 4: DC CURRENT (A_DC) — Real Series Shunt Measurement (R_shunt = 0.02Ω)
    // ------------------------------------------------------------------------
    if (this.mode === MULTIMETER_MODES.A_DC) {
      let current = 0.0;
      let overload = false;

      if (Array.isArray(activeBranches)) {
        const allPins = pinIds || (activeModule?.pins || []).map((p) => p.id);
        const res = measureSeriesAmmeter({
          pinIds: allPins,
          branches: activeBranches,
          pinA: this.redPin,
          pinB: this.blackPin,
          vOc: BATTERY_VOC,
          rBat: BATTERY_R_INT,
        });
        current = Math.abs(res.current) < 0.005 ? 0 : res.current;
        overload = res.overload;
      }

      if (overload) {
        this.reading = {
          display: 'O.L',
          unit: 'A',
          overload: true,
          beeping: false,
          isNegative: false,
        };
        return this.reading;
      }

      const isNegative = current < 0;
      this.reading = {
        display: (isNegative ? '-' : '') + Math.abs(current).toFixed(2),
        unit: 'A',
        overload: false,
        beeping: false,
        isNegative,
      };
      return this.reading;
    }

    return this.reading;
  }
}
