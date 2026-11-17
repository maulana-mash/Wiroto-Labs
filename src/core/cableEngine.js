export const SCALE_CM_PER_UNIT = 2.5;
export const STACK_OFFSET_UNITS = 0.28;

export const CABLE_TYPES = {
  'alligator-red': {
    id: 'alligator-red',
    label: 'Jepit Buaya Merah (+)',
    shortLabel: 'Buaya (+)',
    category: 'alligator',
    polarity: 'pos',
    maxLengthCm: 60,
    allowedColors: ['red'],
    defaultColor: 'red',
    description: 'Kabel jepit buaya arus utama dari kutub Aki (+) ke terminal input papan',
  },
  'alligator-black': {
    id: 'alligator-black',
    label: 'Jepit Buaya Hitam (-)',
    shortLabel: 'Buaya (-)',
    category: 'alligator',
    polarity: 'neg',
    maxLengthCm: 60,
    allowedColors: ['black'],
    defaultColor: 'black',
    description: 'Kabel jepit buaya massa dari kutub Aki (-) ke terminal Ground papan',
  },
  'jumper-10': {
    id: 'jumper-10',
    label: 'Jumper 10 cm',
    shortLabel: '10 cm',
    category: 'jumper',
    maxLengthCm: 10,
    allowedColors: ['red', 'black'],
    defaultColor: 'red',
    description: 'Kabel banana plug sangat pendek (maks. 10 cm) untuk pin berdampingan / sekring',
  },
  'jumper-20': {
    id: 'jumper-20',
    label: 'Jumper 20 cm',
    shortLabel: '20 cm',
    category: 'jumper',
    maxLengthCm: 20,
    allowedColors: ['red', 'black'],
    defaultColor: 'red',
    description: 'Kabel banana plug pendek (maks. 20 cm) untuk jarak pin berdekatan',
  },
  'jumper-25': {
    id: 'jumper-25',
    label: 'Jumper 25 cm',
    shortLabel: '25 cm',
    category: 'jumper',
    maxLengthCm: 25,
    allowedColors: ['red', 'black'],
    defaultColor: 'red',
    description: 'Kabel banana plug menengah (maks. 25 cm)',
    hiddenFromTray: true,
  },
  'jumper-30': {
    id: 'jumper-30',
    label: 'Jumper 30 cm',
    shortLabel: '30 cm',
    category: 'jumper',
    maxLengthCm: 30,
    allowedColors: ['red', 'black'],
    defaultColor: 'red',
    description: 'Kabel banana plug standar (maks. 30 cm)',
  },
  'jumper-50': {
    id: 'jumper-50',
    label: 'Jumper 50 cm',
    shortLabel: '50 cm',
    category: 'jumper',
    maxLengthCm: 50,
    allowedColors: ['red', 'black'],
    defaultColor: 'red',
    description: 'Kabel banana plug panjang (maks. 50 cm) lintas blok komponen',
  },
};

export function computePinDistanceCm(pinA, pinB) {
  if (!pinA || !pinB || !Array.isArray(pinA.pos) || !Array.isArray(pinB.pos)) {
    return 0;
  }
  const dx = pinA.pos[0] - pinB.pos[0];
  const dy = pinA.pos[1] - pinB.pos[1];
  const dz = pinA.pos[2] - pinB.pos[2];
  const distUnits = Math.hypot(dx, dy, dz);
  return Math.round(distUnits * SCALE_CM_PER_UNIT * 10) / 10;
}

export function validateCableConnection({
  pinA,
  pinB,
  cableTypeId,
  color = 'red',
  existingCables = [],
}) {
  const cableSpec = CABLE_TYPES[cableTypeId];
  if (!cableSpec) {
    return {
      ok: false,
      reason: 'INVALID_CABLE_TYPE',
      distanceCm: 0,
      maxLengthCm: 0,
      message: `Tipe kabel "${cableTypeId}" tidak dikenali.`,
    };
  }

  if (!pinA || !pinB) {
    return {
      ok: false,
      reason: 'INVALID_PIN',
      distanceCm: 0,
      maxLengthCm: cableSpec.maxLengthCm,
      message: 'Terminal pin tujuan tidak valid.',
    };
  }

  if (pinA.id === pinB.id) {
    return {
      ok: false,
      reason: 'SAME_PIN',
      distanceCm: 0,
      maxLengthCm: cableSpec.maxLengthCm,
      message: 'Tidak dapat menghubungkan pin ke dirinya sendiri.',
    };
  }

  const distanceCm = computePinDistanceCm(pinA, pinB);
  const maxLengthCm = cableSpec.maxLengthCm;

  const isBatteryA = pinA.terminalType === 'battery_post';
  const isBatteryB = pinB.terminalType === 'battery_post';
  const touchesBattery = isBatteryA || isBatteryB;

  if (touchesBattery && cableSpec.category !== 'alligator') {
    return {
      ok: false,
      reason: 'REQUIRES_ALLIGATOR_CLIP',
      distanceCm,
      maxLengthCm,
      message: 'Kutub Aki 12V wajib menggunakan Kabel Jepit Buaya (Merah + / Hitam -), bukan banana plug biasa.',
    };
  }

  if (!touchesBattery && cableSpec.category === 'alligator') {
    return {
      ok: false,
      reason: 'ALLIGATOR_ONLY_FOR_BATTERY',
      distanceCm,
      maxLengthCm,
      message: 'Kabel Jepit Buaya khusus untuk menghubungkan kutub Aki 12V ke terminal sumber papan.',
    };
  }

  const duplicate = existingCables.some(
    (c) =>
      (c.fromPin === pinA.id && c.toPin === pinB.id) ||
      (c.fromPin === pinB.id && c.toPin === pinA.id)
  );
  if (duplicate) {
    return {
      ok: false,
      reason: 'DUPLICATE_CONNECTION',
      distanceCm,
      maxLengthCm,
      message: `Kabel antara ${pinA.label || pinA.id} dan ${pinB.label || pinB.id} sudah terpasang.`,
    };
  }

  if (distanceCm > maxLengthCm) {
    return {
      ok: false,
      reason: 'CABLE_TOO_SHORT',
      distanceCm,
      maxLengthCm,
      message: `Kabel ${cableSpec.shortLabel} kurang panjang (Jarak: ${distanceCm} cm > ${maxLengthCm} cm). Tumpuk ke pin perantara terlebih dahulu atau ambil kabel lebih panjang!`,
    };
  }

  return {
    ok: true,
    distanceCm,
    maxLengthCm,
    message: `Terhubung (${distanceCm} cm / ${maxLengthCm} cm).`,
  };
}

export class CableManager {
  constructor(pins = []) {
    this.pinMap = new Map();
    this.setPins(pins);
    this.cables = [];
    this.nextId = 1;
  }

  setPins(pins = []) {
    this.pinMap.clear();
    for (const p of pins) {
      this.pinMap.set(p.id, p);
    }
  }

  getPin(pinId) {
    return this.pinMap.get(pinId) || null;
  }

  addCable({ fromPin, toPin, cableTypeId, color }) {
    const pinA = this.getPin(fromPin);
    const pinB = this.getPin(toPin);
    const cableSpec = CABLE_TYPES[cableTypeId];
    const resolvedColor = color || cableSpec?.defaultColor || 'red';

    const validation = validateCableConnection({
      pinA,
      pinB,
      cableTypeId,
      color: resolvedColor,
      existingCables: this.cables,
    });

    if (!validation.ok) {
      return { ok: false, validation };
    }

    const fromStackIndex = this.getPinStackCount(fromPin);
    const toStackIndex = this.getPinStackCount(toPin);

    const cable = {
      id: `wire_${this.nextId++}`,
      fromPin,
      toPin,
      cableTypeId,
      category: cableSpec.category,
      color: resolvedColor,
      distanceCm: validation.distanceCm,
      maxLengthCm: validation.maxLengthCm,
      fromStackIndex,
      toStackIndex,
    };

    this.cables.push(cable);
    this._recomputeAllStacks();

    return { ok: true, cable, validation };
  }

  removeCable(cableId) {
    const idx = this.cables.findIndex((c) => c.id === cableId);
    if (idx === -1) return false;
    this.cables.splice(idx, 1);
    this._recomputeAllStacks();
    return true;
  }

  clearAll() {
    this.cables = [];
  }

  _recomputeAllStacks() {
    const counts = new Map();
    for (const c of this.cables) {
      const fromIdx = counts.get(c.fromPin) || 0;
      c.fromStackIndex = fromIdx;
      counts.set(c.fromPin, fromIdx + 1);

      const toIdx = counts.get(c.toPin) || 0;
      c.toStackIndex = toIdx;
      counts.set(c.toPin, toIdx + 1);
    }
  }

  getPinStackCount(pinId) {
    let count = 0;
    for (const c of this.cables) {
      if (c.fromPin === pinId) count++;
      if (c.toPin === pinId) count++;
    }
    return count;
  }

  getPinPlugStack(pinId) {
    const list = [];
    for (const c of this.cables) {
      if (c.fromPin === pinId) {
        list.push({
          cableId: c.id,
          end: 'from',
          stackIndex: c.fromStackIndex,
          color: c.color,
          category: c.category,
          cableTypeId: c.cableTypeId,
        });
      }
      if (c.toPin === pinId) {
        list.push({
          cableId: c.id,
          end: 'to',
          stackIndex: c.toStackIndex,
          color: c.color,
          category: c.category,
          cableTypeId: c.cableTypeId,
        });
      }
    }
    return list.sort((a, b) => a.stackIndex - b.stackIndex);
  }

  getCables() {
    return [...this.cables];
  }
}
