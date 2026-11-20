// 1 Three.js world unit = 2.5 cm physical distance on the trainer stand.
// Upper Trainer Board spans X: [-12..+12], Y: [-4.6..+4.8], Z: 0.45
// Lower shelf top surface is at Y = -7.0 (see trainerScene3D SHELF_TOP_Y).
// Battery body sits ON the shelf: Y spans [-7.0 .. -5.0], posts point up (+Y).
// All component banana plug terminals sit in a neat horizontal row at the BOTTOM of each component cell.

function makePin(id, label, componentId, x, y, z = 0.45, color = 'red', terminalType = 'banana') {
  return {
    id,
    label,
    componentId,
    pos: [x, y, z],
    color,
    terminalType,
  };
}

const COMMON_BATTERY_COMPONENT = {
  id: 'ACCU_12V',
  type: 'battery_12v',
  title: 'Aki 12V 45Ah',
  subtitle: 'Rak Bawah Trainer',
  pos: [-7.0, -6.0, 2.2],
  size: [4.6, 2.0, 2.4],
};

// Battery posts sit on the top face of the battery (Y = -5.0), toward the front edge.
const COMMON_BATTERY_PINS = [
  makePin('BAT_POS', 'AKI +', 'ACCU_12V', -5.5, -5.0, 2.8, 'red', 'battery_post'),
  makePin('BAT_NEG', 'AKI -', 'ACCU_12V', -8.5, -5.0, 2.8, 'black', 'battery_post'),
];

// Battery for AC Trainer sits cleanly ON the left side of the middle tabletop desk (Y = -2.76), clear of Evaporator pins!
const AC_BATTERY_COMPONENT = {
  id: 'ACCU_12V',
  type: 'battery_12v',
  title: 'Aki 12V 45Ah',
  subtitle: 'Meja Trainer AC',
  pos: [-9.8, -2.76, 2.05],
  size: [3.3, 1.7, 2.0],
};

const AC_BATTERY_PINS = [
  makePin('BAT_POS', 'AKI +', 'ACCU_12V', -8.9, -1.85, 2.45, 'red', 'battery_post'),
  makePin('BAT_NEG', 'AKI -', 'ACCU_12V', -10.7, -1.85, 2.45, 'black', 'battery_post'),
];

const TABLE_BATTERY_COMPONENT = COMMON_BATTERY_COMPONENT;
const TABLE_BATTERY_PINS = COMMON_BATTERY_PINS;
const FIG06_BATTERY_COMPONENT = COMMON_BATTERY_COMPONENT;
const FIG06_BATTERY_PINS = COMMON_BATTERY_PINS;

export const MODULES = [
  // ============================================================================
  // FIG. 00 — 12V BASIC ELECTRICITY & MULTIMETER LAB (DASAR KELISTRIKAN)
  // ============================================================================
  {
    id: 'fig00',
    figLabel: 'Fig. 00',
    category: '1. DASAR KELISTRIKAN OTOMOTIF',
    title: '12V Basic Electricity & Multimeter Lab',
    subtitle: 'Hukum Ohm (V=I×R), Resistansi Lampu 5W/21W/55W, Beban Seri-Paralel, & Multimeter AVO',
    boardSize: [25.2, 10.6],
    description:
      'Laboratorium dasar kelistrikan otomotif komprehensif. Siswa mempelajari pembuktian Hukum Ohm, karakteristik beban resistor murni (10Ω, 50Ω, 100Ω), perbedaan resistansi filamen bohlam (5W, 21W, 55W H4), pengujian polaritas diode LED dan buzzer piezo, simulasi motor washer, serta pengoperasian Multimeter Digital untuk mengukur tegangan DC, resistansi Ohm, dan kontinuitas buzzer.',
    components: [
      TABLE_BATTERY_COMPONENT,
      // --- ROW 1 (y = +3.45, h = 2.45, pins at y = +2.55) ---
      {
        id: 'PWR_BUS_30',
        type: 'power_rail',
        title: 'Supply 12V (30)',
        subtitle: 'Rel Fasa Utama',
        pos: [-10.1, 3.45, 0.45],
        size: [3.2, 2.45, 0.4],
      },
      {
        id: 'FUSE_BLOCK_BASIC',
        type: 'fuse_quad',
        title: 'Blok Sekring (Blade)',
        subtitle: 'F1 (5A) · F2 (10A) · F3 (15A)',
        pos: [-5.4, 3.45, 0.45],
        size: [5.6, 2.45, 0.4],
      },
      {
        id: 'SW_TOGGLE_1',
        type: 'switch_toggle',
        title: 'Saklar 1',
        subtitle: 'Toggle SPST',
        pos: [-0.9, 3.45, 0.45],
        size: [2.8, 2.45, 0.4],
        states: ['OFF', 'ON'],
        defaultState: 'OFF',
      },
      {
        id: 'SW_TOGGLE_2',
        type: 'switch_toggle',
        title: 'Saklar 2',
        subtitle: 'Toggle SPST',
        pos: [2.2, 3.45, 0.45],
        size: [2.8, 2.45, 0.4],
        states: ['OFF', 'ON'],
        defaultState: 'OFF',
      },
      {
        id: 'RLY_SPDT_5P',
        type: 'relay_5p',
        title: 'Relay 5-Pin (Double Throw)',
        subtitle: '30 · 85 · 86 · 87 (NO) · 87a (NC)',
        pos: [5.8, 3.45, 0.45],
        size: [3.8, 2.45, 0.45],
      },
      {
        id: 'RLY_SPST_4P',
        type: 'relay_4p',
        title: 'Relay 4-Pin (SPST)',
        subtitle: '30 · 85 · 86 · 87',
        pos: [9.8, 3.45, 0.45],
        size: [3.6, 2.45, 0.45],
      },
      // --- ROW 2 (y = +0.35, h = 2.55, pins at y = -0.60) ---
      {
        id: 'RESISTOR_BLOCK',
        type: 'resistor_bank',
        title: 'Resistor Keramik Beban',
        subtitle: 'R1 (10Ω) · R2 (50Ω) · R3 (100Ω)',
        pos: [-8.4, 0.35, 0.45],
        size: [6.6, 2.55, 0.4],
      },
      {
        id: 'LAMP_H4',
        type: 'lamp_h4',
        title: 'Lampu Halogen H4',
        subtitle: '12V 55W/60W (Dual Filament)',
        pos: [-3.0, 0.35, 0.45],
        size: [3.6, 2.55, 0.5],
      },
      {
        id: 'MOTOR_12V',
        type: 'motor_small',
        title: 'Motor Listrik 12V',
        subtitle: 'Electric Washer Motor',
        pos: [1.0, 0.35, 0.45],
        size: [3.8, 2.55, 0.4],
      },
      {
        id: 'LAMP_LED',
        type: 'lamp_led',
        title: 'Lampu LED 12V',
        subtitle: 'Anoda (+) & Katoda (-)',
        pos: [5.0, 0.35, 0.45],
        size: [3.6, 2.55, 0.4],
      },
      {
        id: 'BUZZER_12V',
        type: 'buzzer',
        title: 'Buzzer 12V',
        subtitle: 'Piezo Alarm Chime',
        pos: [9.3, 0.35, 0.45],
        size: [4.4, 2.55, 0.4],
      },
      // --- ROW 3 (y = -2.75, h = 2.45, pins at y = -3.65) ---
      {
        id: 'LAMP_5W',
        type: 'lamp_small',
        title: 'Bohlam 12V 5W',
        subtitle: 'Lampu Senja (R ≈ 28.8Ω)',
        pos: [-9.6, -2.75, 0.45],
        size: [4.2, 2.45, 0.4],
      },
      {
        id: 'LAMP_21W',
        type: 'lamp_small',
        title: 'Bohlam 12V 21W',
        subtitle: 'Lampu Rem (R ≈ 6.8Ω)',
        pos: [-4.9, -2.75, 0.45],
        size: [4.4, 2.45, 0.4],
      },
      {
        id: 'GND_BUS_31',
        type: 'power_rail',
        title: 'Ground (31)',
        subtitle: 'Rel Massa Bersama',
        pos: [4.6, -2.75, 0.45],
        size: [14.0, 2.45, 0.4],
      },
    ],
    pins: [
      ...COMMON_BATTERY_PINS,
      // Row 1 pins (y = +2.55)
      makePin('BUS30_1', '30 (1)', 'PWR_BUS_30', -10.9, 2.55, 0.45, 'red'),
      makePin('BUS30_2', '30 (2)', 'PWR_BUS_30', -10.1, 2.55, 0.45, 'red'),
      makePin('BUS30_3', '30 (3)', 'PWR_BUS_30', -9.3, 2.55, 0.45, 'red'),
      // Fuses
      makePin('F1_IN', 'F1 IN', 'FUSE_BLOCK_BASIC', -7.4, 2.55, 0.45, 'red'),
      makePin('F1_OUT', 'F1 OUT', 'FUSE_BLOCK_BASIC', -6.6, 2.55, 0.45, 'red'),
      makePin('F2_IN', 'F2 IN', 'FUSE_BLOCK_BASIC', -5.8, 2.55, 0.45, 'red'),
      makePin('F2_OUT', 'F2 OUT', 'FUSE_BLOCK_BASIC', -5.0, 2.55, 0.45, 'red'),
      makePin('F3_IN', 'F3 IN', 'FUSE_BLOCK_BASIC', -4.2, 2.55, 0.45, 'red'),
      makePin('F3_OUT', 'F3 OUT', 'FUSE_BLOCK_BASIC', -3.4, 2.55, 0.45, 'red'),
      // Switches
      makePin('SW1_IN', 'SW1 IN', 'SW_TOGGLE_1', -1.6, 2.55, 0.45, 'red'),
      makePin('SW1_OUT', 'SW1 OUT', 'SW_TOGGLE_1', -0.2, 2.55, 0.45, 'red'),
      makePin('SW2_IN', 'SW2 IN', 'SW_TOGGLE_2', 1.5, 2.55, 0.45, 'red'),
      makePin('SW2_OUT', 'SW2 OUT', 'SW_TOGGLE_2', 2.9, 2.55, 0.45, 'red'),
      // Relay 5-pin SPDT
      makePin('R5_30', '30', 'RLY_SPDT_5P', 4.4, 2.55, 0.45, 'red'),
      makePin('R5_85', '85', 'RLY_SPDT_5P', 5.1, 2.55, 0.45, 'yellow'),
      makePin('R5_86', '86', 'RLY_SPDT_5P', 5.8, 2.55, 0.45, 'black'),
      makePin('R5_87', '87', 'RLY_SPDT_5P', 6.5, 2.55, 0.45, 'red'),
      makePin('R5_87A', '87a', 'RLY_SPDT_5P', 7.2, 2.55, 0.45, 'blue'),
      // Relay 4-pin SPST
      makePin('R4_30', '30', 'RLY_SPST_4P', 8.75, 2.55, 0.45, 'red'),
      makePin('R4_85', '85', 'RLY_SPST_4P', 9.45, 2.55, 0.45, 'yellow'),
      makePin('R4_86', '86', 'RLY_SPST_4P', 10.15, 2.55, 0.45, 'black'),
      makePin('R4_87', '87', 'RLY_SPST_4P', 10.85, 2.55, 0.45, 'red'),
      // Row 2 pins (y = -0.60)
      makePin('R1_A', 'R1 (A)', 'RESISTOR_BLOCK', -10.8, -0.60, 0.45, 'yellow'),
      makePin('R1_B', 'R1 (B)', 'RESISTOR_BLOCK', -9.9, -0.60, 0.45, 'yellow'),
      makePin('R2_A', 'R2 (A)', 'RESISTOR_BLOCK', -8.85, -0.60, 0.45, 'yellow'),
      makePin('R2_B', 'R2 (B)', 'RESISTOR_BLOCK', -7.95, -0.60, 0.45, 'yellow'),
      makePin('R3_A', 'R3 (A)', 'RESISTOR_BLOCK', -6.9, -0.60, 0.45, 'yellow'),
      makePin('R3_B', 'R3 (B)', 'RESISTOR_BLOCK', -6.0, -0.60, 0.45, 'yellow'),
      // Halogen H4
      makePin('H4_LOW', 'LOW (55W)', 'LAMP_H4', -4.0, -0.60, 0.45, 'yellow'),
      makePin('H4_HIGH', 'HIGH (60W)', 'LAMP_H4', -3.0, -0.60, 0.45, 'blue'),
      makePin('H4_GND', 'GND', 'LAMP_H4', -2.0, -0.60, 0.45, 'black'),
      // Motor
      makePin('MTR_POS', 'MTR (+)', 'MOTOR_12V', 0.2, -0.60, 0.45, 'red'),
      makePin('MTR_NEG', 'MTR (-)', 'MOTOR_12V', 1.8, -0.60, 0.45, 'black'),
      // LED
      makePin('LED_A', 'LED (+)', 'LAMP_LED', 4.2, -0.60, 0.45, 'red'),
      makePin('LED_K', 'LED (-)', 'LAMP_LED', 5.8, -0.60, 0.45, 'black'),
      // Buzzer
      makePin('BUZ_POS', 'BUZ (+)', 'BUZZER_12V', 8.5, -0.60, 0.45, 'red'),
      makePin('BUZ_NEG', 'BUZ (-)', 'BUZZER_12V', 10.1, -0.60, 0.45, 'black'),
      // Row 3 pins (y = -3.65)
      makePin('L5W_POS', '5W (+)', 'LAMP_5W', -10.4, -3.65, 0.45, 'red'),
      makePin('L5W_NEG', '5W (-)', 'LAMP_5W', -8.8, -3.65, 0.45, 'black'),
      makePin('L21W_POS', '21W (+)', 'LAMP_21W', -5.7, -3.65, 0.45, 'red'),
      makePin('L21W_NEG', '21W (-)', 'LAMP_21W', -4.1, -3.65, 0.45, 'black'),
      // Ground Bus (31)
      makePin('BUS31_1', '31 (1)', 'GND_BUS_31', -1.0, -3.65, 0.45, 'black'),
      makePin('BUS31_2', '31 (2)', 'GND_BUS_31', 1.8, -3.65, 0.45, 'black'),
      makePin('BUS31_3', '31 (3)', 'GND_BUS_31', 4.6, -3.65, 0.45, 'black'),
      makePin('BUS31_4', '31 (4)', 'GND_BUS_31', 7.4, -3.65, 0.45, 'black'),
      makePin('BUS31_5', '31 (5)', 'GND_BUS_31', 10.2, -3.65, 0.45, 'black'),
    ],
    fuses: [
      { key: 'F1', inPin: 'F1_IN', outPin: 'F1_OUT', rating: '5A', componentId: 'FUSE_BLOCK_BASIC' },
      { key: 'F2', inPin: 'F2_IN', outPin: 'F2_OUT', rating: '10A', componentId: 'FUSE_BLOCK_BASIC' },
      { key: 'F3', inPin: 'F3_IN', outPin: 'F3_OUT', rating: '15A', componentId: 'FUSE_BLOCK_BASIC' },
    ],
    demoWires: [
      { fromPin: 'BAT_POS', toPin: 'BUS30_1', cableTypeId: 'alligator-red', color: 'red' },
      { fromPin: 'BAT_NEG', toPin: 'BUS31_1', cableTypeId: 'alligator-black', color: 'black' },
      { fromPin: 'BUS30_2', toPin: 'F1_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F1_OUT', toPin: 'SW1_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'SW1_OUT', toPin: 'L21W_POS', cableTypeId: 'jumper-30', color: 'red' },
      { fromPin: 'L21W_NEG', toPin: 'BUS31_2', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'BUS30_3', toPin: 'F2_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F2_OUT', toPin: 'SW2_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'SW2_OUT', toPin: 'BUZ_POS', cableTypeId: 'jumper-25', color: 'red' },
      { fromPin: 'BUZ_NEG', toPin: 'BUS31_5', cableTypeId: 'jumper-20', color: 'black' },
    ],
    checklist: [
      {
        id: 'c1',
        label: 'Pasang Jepit Buaya Aki (+) ke Supply 12V (30) & Aki (-) ke Ground (31)',
        check: (net) =>
          net.areConnected('BAT_POS', 'BUS30_1') && net.areConnected('BAT_NEG', 'BUS31_1'),
      },
      {
        id: 'c2',
        label: 'Hubungkan Supply 30 ke Sekring F1 (5A), lalu ke Saklar 1 dan Bohlam 21W',
        check: (net) =>
          net.areConnected('BUS30_2', 'F1_IN') &&
          net.areConnected('F1_OUT', 'SW1_IN') &&
          net.areConnected('SW1_OUT', 'L21W_POS') &&
          net.areConnected('L21W_NEG', 'BUS31_2'),
      },
      {
        id: 'c3',
        label: 'Hubungkan Sekring F2 ke Saklar 2 dan Buzzer 12V Alarm Chime',
        check: (net) =>
          net.areConnected('BUS30_3', 'F2_IN') &&
          net.areConnected('F2_OUT', 'SW2_IN') &&
          net.areConnected('SW2_OUT', 'BUZ_POS') &&
          net.areConnected('BUZ_NEG', 'BUS31_5'),
      },
      {
        id: 'c4',
        label: 'Gunakan Multimeter Digital untuk mengukur tegangan jatuh dan resistansi',
        check: () => true,
      },
    ],
  },

  // ============================================================================
  // FIG. 01 — RANGKAIAN SEKRING (FUSE) & BEBAN TUNGGAL
  // ============================================================================
  {
    id: 'fig01',
    figLabel: 'Fig. 01',
    category: '2. KELISTRIKAN BODI OTOMOTIF',
    title: 'Rangkaian Sekring & Beban Tunggal',
    subtitle: 'Aliran arus Aki 12V, Kunci Kontak (B-IG), Sekring pengaman, & proteksi hubung singkat.',
    boardSize: [20, 8.2],
    description:
      'Setiap rangkaian kelistrikan bodi mobil berawal dari Aki 12V di rak bawah menuju terminal distribusi papan, melewati Kunci Kontak (B ke IG) dan Sekring (Fuse) sebelum menyuplai saklar serta beban lampu. Jika terminal keluaran sekring dihubungkan langsung ke Ground tanpa beban, sekring akan langsung putus (blown) untuk mencegah kebakaran kabel.',
    components: [
      TABLE_BATTERY_COMPONENT,
      {
        id: 'PWR_TERMINAL',
        type: 'power_rail',
        title: 'Terminal Input Papan',
        subtitle: '+12V & Massa Bodi',
        pos: [-7.0, -1.8, 0.45],
        size: [3.2, 1.8, 0.5],
      },
      {
        id: 'IGN_SW',
        type: 'ignition',
        title: 'Kunci Kontak',
        subtitle: 'OFF · ACC · IG · ST',
        pos: [-7.0, 1.8, 0.45],
        size: [3.0, 2.2, 0.6],
        states: ['OFF', 'ACC', 'IG'],
        defaultState: 'OFF',
      },
      {
        id: 'FUSE_1',
        type: 'fuse_single',
        title: 'Sekring F1 (10A)',
        subtitle: 'Blade Fuse Merah',
        pos: [-2.2, 1.8, 0.45],
        size: [2.6, 2.2, 0.55],
        rating: '10A',
      },
      {
        id: 'SW_PUSH',
        type: 'switch_push',
        title: 'Saklar Tekan',
        subtitle: 'Normally Open (NO)',
        pos: [2.4, 1.8, 0.45],
        size: [2.6, 2.2, 0.6],
        states: ['OFF', 'ON'],
        defaultState: 'OFF',
      },
      {
        id: 'POST_EXTENSION',
        type: 'junction_post',
        title: 'Terminal Tumpuk (J1)',
        subtitle: 'Pin Perantara / Cabang',
        pos: [2.4, -1.8, 0.45],
        size: [2.4, 1.8, 0.45],
      },
      {
        id: 'LAMP_TEST',
        type: 'lamp_test',
        title: 'Lampu Uji 12V / 21W',
        subtitle: 'Beban Bohlam Tunggal',
        pos: [7.0, 0.2, 0.45],
        size: [3.0, 2.6, 0.7],
      },
    ],
    pins: [
      ...COMMON_BATTERY_PINS,
      makePin('BOARD_GND', 'GND', 'PWR_TERMINAL', -7.7, -2.44, 0.45, 'black'),
      makePin('BOARD_POS', '+12V', 'PWR_TERMINAL', -6.3, -2.44, 0.45, 'red'),

      makePin('IGN_B', '30', 'IGN_SW', -7.8, 0.96, 0.45, 'red'),
      makePin('IGN_ACC', 'ACC', 'IGN_SW', -7.0, 0.96, 0.45, 'yellow'),
      makePin('IGN_IG', '15', 'IGN_SW', -6.2, 0.96, 0.45, 'red'),

      makePin('F1_IN', 'F1+', 'FUSE_1', -2.75, 0.96, 0.45, 'red'),
      makePin('F1_OUT', 'F1-', 'FUSE_1', -1.65, 0.96, 0.45, 'red'),

      makePin('SW_IN', 'IN', 'SW_PUSH', 1.85, 0.96, 0.45, 'red'),
      makePin('SW_OUT', 'OUT', 'SW_PUSH', 2.95, 0.96, 0.45, 'red'),

      makePin('J1_PIN', 'J1', 'POST_EXTENSION', 2.4, -2.44, 0.45, 'black'),

      makePin('LAMP_POS', 'LP+', 'LAMP_TEST', 6.4, -0.84, 0.45, 'red'),
      makePin('LAMP_NEG', 'GND', 'LAMP_TEST', 7.6, -0.84, 0.45, 'black'),
    ],
    checklist: [
      {
        id: 'chk_bat_pos',
        label: 'Pasang Kabel Jepit Buaya Merah (+) dari AKI (+) ke IN (+12V)',
        check: (net) => net.areConnected('BAT_POS', 'BOARD_POS'),
      },
      {
        id: 'chk_bat_neg',
        label: 'Pasang Kabel Jepit Buaya Hitam (-) dari AKI (-) ke GND (31)',
        check: (net) => net.areConnected('BAT_NEG', 'BOARD_GND'),
      },
      {
        id: 'chk_ign_f1',
        label: 'Hubungkan IN (+12V) ke Kunci Kontak 30 (B), lalu 15 (IG) ke F1+',
        check: (net) => net.areConnected('BOARD_POS', 'IGN_B') && net.areConnected('IGN_IG', 'F1_IN'),
      },
      {
        id: 'chk_sw_lamp',
        label: 'Hubungkan F1- -> SW IN, dan SW OUT -> LP+',
        check: (net) => net.areConnected('F1_OUT', 'SW_IN') && net.areConnected('SW_OUT', 'LAMP_POS'),
      },
      {
        id: 'chk_gnd_return',
        label: 'Hubungkan GND Lampu ke GND Papan (tumpuk lewat pin J1 jika memakai kabel pendek)',
        check: (net) => net.areConnected('LAMP_NEG', 'BOARD_GND'),
      },
    ],
    demoWires: [
      { fromPin: 'BAT_POS', toPin: 'BOARD_POS', cableTypeId: 'alligator-red', color: 'red' },
      { fromPin: 'BAT_NEG', toPin: 'BOARD_GND', cableTypeId: 'alligator-black', color: 'black' },
      { fromPin: 'BOARD_POS', toPin: 'IGN_B', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'IGN_IG', toPin: 'F1_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F1_OUT', toPin: 'SW_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'SW_OUT', toPin: 'LAMP_POS', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'LAMP_NEG', toPin: 'J1_PIN', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'J1_PIN', toPin: 'BOARD_GND', cableTypeId: 'jumper-30', color: 'black' },
    ],
  },

  // ============================================================================
  // FIG. 02 — RANGKAIAN RELAY 4-KAKI (30-85-86-87) & KLAKSON
  // ============================================================================
  {
    id: 'fig02',
    figLabel: 'Fig. 02',
    category: '2. KELISTRIKAN BODI OTOMOTIF',
    title: 'Relay 4-Kaki (30-85-86-87) & Klakson',
    subtitle: 'Memisahkan arus pengendali kecil pada tombol klakson dengan arus beban besar via Relay.',
    boardSize: [20, 8.2],
    description:
      'Klakson membutuhkan arus tinggi sehingga jika dialirkan langsung ke tombol setir, kontak tombol cepat aus/terbakar. Relay 4-kaki menggunakan kumparan elektromagnetik (pin 85 dan 86) berarus kecil untuk menarik plat kontak utama (pin 30 ke 87) yang mengalirkan arus besar langsung dari sekring ke klakson.',
    components: [
      TABLE_BATTERY_COMPONENT,
      {
        id: 'PWR_TERMINAL',
        type: 'power_rail',
        title: 'Terminal Distribusi',
        subtitle: '+12V & Massa Bodi',
        pos: [-7.5, -1.9, 0.45],
        size: [3.2, 1.8, 0.5],
      },
      {
        id: 'IGN_SW',
        type: 'ignition',
        title: 'Kunci Kontak',
        subtitle: 'OFF · ACC · IG',
        pos: [-7.5, 1.8, 0.45],
        size: [3.0, 2.2, 0.6],
        states: ['OFF', 'ACC', 'IG'],
        defaultState: 'OFF',
      },
      {
        id: 'FUSE_BOX_2',
        type: 'fuse_dual',
        title: 'Blok Sekring',
        subtitle: 'F1 (15A Beban) · F2 (10A Kontrol)',
        pos: [-3.0, 1.8, 0.45],
        size: [3.4, 2.2, 0.55],
      },
      {
        id: 'RLY_1',
        type: 'relay_4p',
        title: 'Relay Klakson 12V',
        subtitle: 'Pin 30 · 85 · 86 · 87',
        pos: [2.0, 1.8, 0.45],
        size: [3.4, 2.2, 0.7],
      },
      {
        id: 'HORN_BTN',
        type: 'switch_push',
        momentary: true,
        title: 'Tombol Klakson',
        subtitle: 'Saklar Tekan (Setir)',
        pos: [-2.5, -1.9, 0.45],
        size: [2.8, 1.8, 0.6],
        states: ['OFF', 'ON'],
        defaultState: 'OFF',
      },
      {
        id: 'GND_BUS',
        type: 'junction_post',
        title: 'Terminal Massa Tengah',
        subtitle: 'Titik Tumpuk GND',
        pos: [2.0, -1.9, 0.45],
        size: [2.4, 1.8, 0.45],
      },
      {
        id: 'HORN_1',
        type: 'horn',
        title: 'Klakson Disc 12V',
        subtitle: 'Acoustic Horn Unit',
        pos: [7.0, 0.2, 0.45],
        size: [3.2, 2.6, 0.75],
      },
    ],
    pins: [
      ...COMMON_BATTERY_PINS,
      makePin('BOARD_GND', 'GND', 'PWR_TERMINAL', -8.2, -2.54, 0.45, 'black'),
      makePin('BOARD_POS', '+12V', 'PWR_TERMINAL', -6.8, -2.54, 0.45, 'red'),

      makePin('IGN_B', '30', 'IGN_SW', -8.1, 0.96, 0.45, 'red'),
      makePin('IGN_IG', '15', 'IGN_SW', -6.9, 0.96, 0.45, 'red'),

      makePin('F1_IN', 'F1+', 'FUSE_BOX_2', -4.05, 0.96, 0.45, 'red'),
      makePin('F1_OUT', 'F1-', 'FUSE_BOX_2', -3.35, 0.96, 0.45, 'red'),
      makePin('F2_IN', 'F2+', 'FUSE_BOX_2', -2.65, 0.96, 0.45, 'red'),
      makePin('F2_OUT', 'F2-', 'FUSE_BOX_2', -1.95, 0.96, 0.45, 'red'),

      makePin('RLY1_30', '30', 'RLY_1', 0.95, 0.96, 0.45, 'red'),
      makePin('RLY1_85', '85', 'RLY_1', 1.65, 0.96, 0.45, 'yellow'),
      makePin('RLY1_86', '86', 'RLY_1', 2.35, 0.96, 0.45, 'black'),
      makePin('RLY1_87', '87', 'RLY_1', 3.05, 0.96, 0.45, 'red'),

      makePin('HBTN_IN', 'IN', 'HORN_BTN', -3.1, -2.54, 0.45, 'red'),
      makePin('HBTN_OUT', 'OUT', 'HORN_BTN', -1.9, -2.54, 0.45, 'yellow'),

      makePin('GND_MID', 'GND', 'GND_BUS', 2.0, -2.54, 0.45, 'black'),

      makePin('HORN_POS', 'H+', 'HORN_1', 6.4, -0.84, 0.45, 'red'),
      makePin('HORN_NEG', 'H-', 'HORN_1', 7.6, -0.84, 0.45, 'black'),
    ],
    checklist: [
      {
        id: 'chk_bat',
        label: 'Hubungkan Aki 12V (+) dan (-) ke terminal papan menggunakan Kabel Jepit Buaya',
        check: (net) => net.areConnected('BAT_POS', 'BOARD_POS') && net.areConnected('BAT_NEG', 'BOARD_GND'),
      },
      {
        id: 'chk_power_circuit',
        label: 'Rangkai jalur beban: +12V -> F1+, F1- -> Relay 30, dan Relay 87 -> H+',
        check: (net) =>
          net.areConnected('BOARD_POS', 'F1_IN') &&
          net.areConnected('F1_OUT', 'RLY1_30') &&
          net.areConnected('RLY1_87', 'HORN_POS'),
      },
      {
        id: 'chk_control_circuit',
        label: 'Rangkai jalur pengendali: Kunci Kontak 15 -> F2+, lalu F2- -> Tombol Klakson -> Relay 85',
        check: (net) =>
          net.areConnected('BOARD_POS', 'IGN_B') &&
          net.areConnected('IGN_IG', 'F2_IN') &&
          net.areConnected('F2_OUT', 'HBTN_IN') &&
          net.areConnected('HBTN_OUT', 'RLY1_85'),
      },
      {
        id: 'chk_grounds',
        label: 'Hubungkan Relay 86 dan H- ke Ground (GND)',
        check: (net) => net.areConnected('RLY1_86', 'BOARD_GND') && net.areConnected('HORN_NEG', 'BOARD_GND'),
      },
    ],
    demoWires: [
      { fromPin: 'BAT_POS', toPin: 'BOARD_POS', cableTypeId: 'alligator-red', color: 'red' },
      { fromPin: 'BAT_NEG', toPin: 'BOARD_GND', cableTypeId: 'alligator-black', color: 'black' },
      { fromPin: 'BOARD_POS', toPin: 'IGN_B', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'IGN_B', toPin: 'F1_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F1_OUT', toPin: 'RLY1_30', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'RLY1_87', toPin: 'HORN_POS', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'IGN_IG', toPin: 'F2_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F2_OUT', toPin: 'HBTN_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'HBTN_OUT', toPin: 'RLY1_85', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'RLY1_86', toPin: 'GND_MID', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'HORN_NEG', toPin: 'GND_MID', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'GND_MID', toPin: 'BOARD_GND', cableTypeId: 'jumper-30', color: 'black' },
    ],
  },

  // ============================================================================
  // FIG. 03 — LAMPU KOTA (TAIL/CLEARANCE) & LAMPU REM (BRAKE SWITCH)
  // ============================================================================
  {
    id: 'fig03',
    figLabel: 'Fig. 03',
    category: '2. KELISTRIKAN BODI OTOMOTIF',
    title: 'Lampu Kota & Lampu Rem Belakang',
    subtitle: 'Merangkai saklar lampu senja (Tail) dan saklar pedal rem (Stop Lamp) pada bohlam ganda.',
    boardSize: [20, 8.2],
    description:
      'Lampu belakang mobil umumnya memiliki dua filamen dalam satu rumah lampu: Lampu Kota/Senja (5W) yang dinyalakan melalui saklar lampu utama posisi TAIL, dan Lampu Rem (21W) yang menyala terang saat pengemudi menginjak pedal rem.',
    components: [
      TABLE_BATTERY_COMPONENT,
      {
        id: 'PWR_TERMINAL',
        type: 'power_rail',
        title: 'Terminal Distribusi',
        subtitle: '+12V & Massa Bodi',
        pos: [-7.6, -1.9, 0.45],
        size: [3.0, 1.8, 0.5],
      },
      {
        id: 'FUSE_BOX_2',
        type: 'fuse_dual',
        title: 'Blok Sekring',
        subtitle: 'F1 (TAIL 10A) · F2 (STOP 10A)',
        pos: [-7.6, 1.8, 0.45],
        size: [3.4, 2.2, 0.55],
      },
      {
        id: 'SW_TAIL',
        type: 'switch_toggle',
        title: 'Saklar Lampu Kota',
        subtitle: 'OFF · TAIL ON',
        pos: [-2.4, 1.8, 0.45],
        size: [2.8, 2.2, 0.6],
        states: ['OFF', 'ON'],
        defaultState: 'OFF',
      },
      {
        id: 'SW_BRAKE',
        type: 'switch_push',
        momentary: true,
        title: 'Saklar Pedal Rem',
        subtitle: 'Brake Pedal Switch',
        pos: [-2.4, -1.9, 0.45],
        size: [2.8, 1.8, 0.6],
        states: ['OFF', 'ON'],
        defaultState: 'OFF',
      },
      {
        id: 'TAIL_LH',
        type: 'lamp_red_dual',
        title: 'Lampu Belakang Kiri',
        subtitle: 'Tail (5W) + Stop (21W)',
        pos: [3.4, 1.8, 0.45],
        size: [3.6, 2.2, 0.65],
      },
      {
        id: 'TAIL_RH',
        type: 'lamp_red_dual',
        title: 'Lampu Belakang Kanan',
        subtitle: 'Tail (5W) + Stop (21W)',
        pos: [3.4, -1.9, 0.45],
        size: [3.6, 2.2, 0.65],
      },
    ],
    pins: [
      ...COMMON_BATTERY_PINS,
      makePin('BOARD_GND', 'GND', 'PWR_TERMINAL', -8.2, -2.54, 0.45, 'black'),
      makePin('BOARD_POS', '+12V', 'PWR_TERMINAL', -7.0, -2.54, 0.45, 'red'),

      makePin('F1_IN', 'F1+', 'FUSE_BOX_2', -8.65, 0.96, 0.45, 'red'),
      makePin('F1_OUT', 'F1-', 'FUSE_BOX_2', -7.95, 0.96, 0.45, 'red'),
      makePin('F2_IN', 'F2+', 'FUSE_BOX_2', -7.25, 0.96, 0.45, 'red'),
      makePin('F2_OUT', 'F2-', 'FUSE_BOX_2', -6.55, 0.96, 0.45, 'red'),

      makePin('TAIL_SW_IN', 'IN', 'SW_TAIL', -3.0, 0.96, 0.45, 'red'),
      makePin('TAIL_SW_OUT', 'OUT', 'SW_TAIL', -1.8, 0.96, 0.45, 'red'),

      makePin('BRK_SW_IN', 'IN', 'SW_BRAKE', -3.0, -2.54, 0.45, 'red'),
      makePin('BRK_SW_OUT', 'OUT', 'SW_BRAKE', -1.8, -2.54, 0.45, 'red'),

      makePin('LH_TAIL', 'TAIL', 'TAIL_LH', 2.5, 0.96, 0.45, 'red'),
      makePin('LH_STOP', 'STOP', 'TAIL_LH', 3.4, 0.96, 0.45, 'red'),
      makePin('LH_GND', 'GND', 'TAIL_LH', 4.3, 0.96, 0.45, 'black'),

      makePin('RH_TAIL', 'TAIL', 'TAIL_RH', 2.5, -2.74, 0.45, 'red'),
      makePin('RH_STOP', 'STOP', 'TAIL_RH', 3.4, -2.74, 0.45, 'red'),
      makePin('RH_GND', 'GND', 'TAIL_RH', 4.3, -2.74, 0.45, 'black'),
    ],
    checklist: [
      {
        id: 'chk_bat',
        label: 'Hubungkan Aki 12V ke terminal papan dengan Kabel Jepit Buaya (+) dan (-)',
        check: (net) => net.areConnected('BAT_POS', 'BOARD_POS') && net.areConnected('BAT_NEG', 'BOARD_GND'),
      },
      {
        id: 'chk_tail',
        label: 'Rangkai jalur Lampu Kota: F1- -> Saklar Kota -> paralel ke LH TAIL & RH TAIL (tumpuk pin)',
        check: (net) =>
          net.areConnected('BOARD_POS', 'F1_IN') &&
          net.areConnected('F1_OUT', 'TAIL_SW_IN') &&
          net.areConnected('TAIL_SW_OUT', 'LH_TAIL') &&
          net.areConnected('TAIL_SW_OUT', 'RH_TAIL'),
      },
      {
        id: 'chk_stop',
        label: 'Rangkai jalur Lampu Rem: F2- -> Saklar Pedal Rem -> paralel ke LH STOP & RH STOP',
        check: (net) =>
          net.areConnected('BOARD_POS', 'F2_IN') &&
          net.areConnected('F2_OUT', 'BRK_SW_IN') &&
          net.areConnected('BRK_SW_OUT', 'LH_STOP') &&
          net.areConnected('BRK_SW_OUT', 'RH_STOP'),
      },
      {
        id: 'chk_gnd',
        label: 'Hubungkan LH GND dan RH GND ke Ground (GND)',
        check: (net) => net.areConnected('LH_GND', 'BOARD_GND') && net.areConnected('RH_GND', 'BOARD_GND'),
      },
    ],
    demoWires: [
      { fromPin: 'BAT_POS', toPin: 'BOARD_POS', cableTypeId: 'alligator-red', color: 'red' },
      { fromPin: 'BAT_NEG', toPin: 'BOARD_GND', cableTypeId: 'alligator-black', color: 'black' },
      { fromPin: 'BOARD_POS', toPin: 'F2_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F2_IN', toPin: 'F1_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F1_OUT', toPin: 'TAIL_SW_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F2_OUT', toPin: 'BRK_SW_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'TAIL_SW_OUT', toPin: 'LH_TAIL', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'LH_TAIL', toPin: 'RH_TAIL', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'BRK_SW_OUT', toPin: 'RH_STOP', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'RH_STOP', toPin: 'LH_STOP', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'LH_GND', toPin: 'RH_GND', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'RH_GND', toPin: 'BOARD_GND', cableTypeId: 'jumper-50', color: 'black' },
    ],
  },

  // ============================================================================
  // FIG. 04 — LAMPU KEPALA JAUH/DEKAT (HEADLAMP LOW/HIGH BEAM + DUAL RELAY)
  // ============================================================================
  {
    id: 'fig04',
    figLabel: 'Fig. 04',
    category: '2. KELISTRIKAN BODI OTOMOTIF',
    title: 'Lampu Kepala Jauh/Dekat (Dual Relay)',
    subtitle: 'Merangkai Saklar Kombinasi Dimmer dengan 2 Relay (Low & High Beam) serta Headlamp Kiri/Kanan.',
    boardSize: [21, 8.6],
    description:
      'Lampu kepala (Headlamp H4) memiliki filamen Dekat (Low Beam 55W) dan Jauh (High Beam 60W). Dua buah relay 4-kaki digunakan agar arus besar lampu kiri dan kanan tidak membebani saklar kombinasi Dimmer di batang kemudi.',
    components: [
      TABLE_BATTERY_COMPONENT,
      {
        id: 'PWR_TERMINAL',
        type: 'power_rail',
        title: 'Terminal Distribusi',
        subtitle: '+12V & Massa Bodi',
        pos: [-8.2, -2.0, 0.45],
        size: [2.8, 1.8, 0.5],
      },
      {
        id: 'FUSE_BOX_2',
        type: 'fuse_dual',
        title: 'Blok Sekring Utama',
        subtitle: 'F1 (LOW 15A) · F2 (HIGH 15A)',
        pos: [-8.2, 1.8, 0.45],
        size: [3.4, 2.2, 0.55],
      },
      {
        id: 'SW_DIMMER',
        type: 'switch_combo',
        hasDimPass: true,
        title: 'Saklar Dimmer Kepala',
        subtitle: 'OFF · LOW · HIGH · DIM',
        pos: [-3.8, -2.0, 0.45],
        size: [3.2, 2.0, 0.65],
        states: ['HIGH', 'OFF', 'LOW'],
        defaultState: 'OFF',
      },
      {
        id: 'RLY_LOW',
        type: 'relay_4p',
        title: 'Relay Lampu Dekat (LOW)',
        subtitle: 'Pin 30 · 85 · 86 · 87',
        pos: [-2.2, 1.8, 0.45],
        size: [3.2, 2.2, 0.7],
      },
      {
        id: 'RLY_HIGH',
        type: 'relay_4p',
        title: 'Relay Lampu Jauh (HIGH)',
        subtitle: 'Pin 30 · 85 · 86 · 87',
        pos: [2.0, 1.8, 0.45],
        size: [3.2, 2.2, 0.7],
      },
      {
        id: 'HL_LH',
        type: 'headlamp',
        title: 'Headlamp Kiri (H4)',
        subtitle: 'LOW · HIGH · GND',
        pos: [7.0, 1.8, 0.45],
        size: [3.4, 2.2, 0.75],
      },
      {
        id: 'HL_RH',
        type: 'headlamp',
        title: 'Headlamp Kanan (H4)',
        subtitle: 'LOW · HIGH · GND',
        pos: [7.0, -2.0, 0.45],
        size: [3.4, 2.2, 0.75],
      },
      {
        id: 'GND_BUS',
        type: 'junction_post',
        title: 'Bus Massa Tengah',
        subtitle: 'Titik Tumpuk GND',
        pos: [2.0, -2.0, 0.45],
        size: [2.4, 1.8, 0.45],
      },
    ],
    pins: [
      ...COMMON_BATTERY_PINS,
      makePin('BOARD_GND', 'GND', 'PWR_TERMINAL', -8.8, -2.64, 0.45, 'black'),
      makePin('BOARD_POS', '+12V', 'PWR_TERMINAL', -7.6, -2.64, 0.45, 'red'),

      makePin('F1_IN', 'F1+', 'FUSE_BOX_2', -9.25, 0.96, 0.45, 'red'),
      makePin('F1_OUT', 'F1-', 'FUSE_BOX_2', -8.55, 0.96, 0.45, 'red'),
      makePin('F2_IN', 'F2+', 'FUSE_BOX_2', -7.85, 0.96, 0.45, 'red'),
      makePin('F2_OUT', 'F2-', 'FUSE_BOX_2', -7.15, 0.96, 0.45, 'red'),

      makePin('DIM_IN', 'B', 'SW_DIMMER', -4.6, -2.74, 0.45, 'red'),
      makePin('DIM_LOW', 'LOW', 'SW_DIMMER', -3.8, -2.74, 0.45, 'yellow'),
      makePin('DIM_HIGH', 'HIGH', 'SW_DIMMER', -3.0, -2.74, 0.45, 'blue'),

      makePin('RLOW_30', '30', 'RLY_LOW', -3.15, 0.96, 0.45, 'red'),
      makePin('RLOW_85', '85', 'RLY_LOW', -2.5, 0.96, 0.45, 'yellow'),
      makePin('RLOW_86', '86', 'RLY_LOW', -1.9, 0.96, 0.45, 'black'),
      makePin('RLOW_87', '87', 'RLY_LOW', -1.25, 0.96, 0.45, 'red'),

      makePin('RHIGH_30', '30', 'RLY_HIGH', 1.05, 0.96, 0.45, 'red'),
      makePin('RHIGH_85', '85', 'RLY_HIGH', 1.7, 0.96, 0.45, 'blue'),
      makePin('RHIGH_86', '86', 'RLY_HIGH', 2.3, 0.96, 0.45, 'black'),
      makePin('RHIGH_87', '87', 'RLY_HIGH', 2.95, 0.96, 0.45, 'red'),

      makePin('HLL_LOW', 'LOW', 'HL_LH', 6.1, 0.96, 0.45, 'yellow'),
      makePin('HLL_HIGH', 'HIGH', 'HL_LH', 7.0, 0.96, 0.45, 'blue'),
      makePin('HLL_GND', 'GND', 'HL_LH', 7.9, 0.96, 0.45, 'black'),

      makePin('HLR_LOW', 'LOW', 'HL_RH', 6.1, -2.84, 0.45, 'yellow'),
      makePin('HLR_HIGH', 'HIGH', 'HL_RH', 7.0, -2.84, 0.45, 'blue'),
      makePin('HLR_GND', 'GND', 'HL_RH', 7.9, -2.84, 0.45, 'black'),

      makePin('GND_MID', 'GND', 'GND_BUS', 2.0, -2.64, 0.45, 'black'),
    ],
    checklist: [
      {
        id: 'chk_bat',
        label: 'Hubungkan Aki 12V (+) & (-) ke terminal papan dengan Kabel Jepit Buaya',
        check: (net) => net.areConnected('BAT_POS', 'BOARD_POS') && net.areConnected('BAT_NEG', 'BOARD_GND'),
      },
      {
        id: 'chk_low_relay',
        label: 'Rangkai Relay Dekat (LOW): F1- -> 30, Dimmer LOW -> 85, dan 87 -> LH LOW & RH LOW',
        check: (net) =>
          net.areConnected('F1_OUT', 'RLOW_30') &&
          net.areConnected('DIM_LOW', 'RLOW_85') &&
          net.areConnected('RLOW_87', 'HLL_LOW') &&
          net.areConnected('RLOW_87', 'HLR_LOW'),
      },
      {
        id: 'chk_high_relay',
        label: 'Rangkai Relay Jauh (HIGH): F2- -> 30, Dimmer HIGH -> 85, dan 87 -> LH HIGH & RH HIGH',
        check: (net) =>
          net.areConnected('F2_OUT', 'RHIGH_30') &&
          net.areConnected('DIM_HIGH', 'RHIGH_85') &&
          net.areConnected('RHIGH_87', 'HLL_HIGH') &&
          net.areConnected('RHIGH_87', 'HLR_HIGH'),
      },
      {
        id: 'chk_grounds',
        label: 'Hubungkan semua pin 86 Relay dan GND Headlamp ke Ground (GND)',
        check: (net) =>
          net.areConnected('RLOW_86', 'BOARD_GND') &&
          net.areConnected('RHIGH_86', 'BOARD_GND') &&
          net.areConnected('HLL_GND', 'BOARD_GND') &&
          net.areConnected('HLR_GND', 'BOARD_GND'),
      },
    ],
    demoWires: [
      { fromPin: 'BAT_POS', toPin: 'BOARD_POS', cableTypeId: 'alligator-red', color: 'red' },
      { fromPin: 'BAT_NEG', toPin: 'BOARD_GND', cableTypeId: 'alligator-black', color: 'black' },
      { fromPin: 'BOARD_POS', toPin: 'DIM_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'BOARD_POS', toPin: 'F2_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F2_IN', toPin: 'F1_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F1_OUT', toPin: 'RLOW_30', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F2_OUT', toPin: 'RHIGH_30', cableTypeId: 'jumper-25', color: 'red' },
      { fromPin: 'DIM_LOW', toPin: 'RLOW_85', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'DIM_HIGH', toPin: 'RHIGH_85', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'RLOW_87', toPin: 'HLL_LOW', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'HLL_LOW', toPin: 'HLR_LOW', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'RHIGH_87', toPin: 'HLL_HIGH', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'HLL_HIGH', toPin: 'HLR_HIGH', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'RLOW_86', toPin: 'RHIGH_86', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'RHIGH_86', toPin: 'GND_MID', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'HLL_GND', toPin: 'HLR_GND', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'HLR_GND', toPin: 'GND_MID', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'GND_MID', toPin: 'BOARD_GND', cableTypeId: 'jumper-30', color: 'black' },
    ],
  },

  // ============================================================================
  // FIG. 05 — SISTEM LAMPU SEIN (TURN SIGNAL) & HAZARD (FLASHER B-L-E)
  // ============================================================================
  {
    id: 'fig05',
    figLabel: 'Fig. 05',
    category: '2. KELISTRIKAN BODI OTOMOTIF',
    title: 'Lampu Sein & Hazard (Flasher B-L-E)',
    subtitle: 'Merangkai unit elektronik Flasher (B, L, E), saklar arah sein Kiri/Kanan, dan saklar darurat Hazard.',
    boardSize: [21, 8.6],
    description:
      'Unit Flasher memiliki 3 terminal: B (Battery +12V), E (Earth/Ground), dan L (Load/keluaran pulsa kedip ~85 kedipan/menit). Keluaran L dihubungkan ke input tengah saklar sein (untuk mengedipkan sisi Kiri atau Kanan) serta saklar Hazard (untuk mengedipkan keempat lampu sein secara bersamaan).',
    components: [
      TABLE_BATTERY_COMPONENT,
      {
        id: 'PWR_TERMINAL',
        type: 'power_rail',
        title: 'Terminal Distribusi',
        subtitle: '+12V & Massa Bodi',
        pos: [-8.0, -2.0, 0.45],
        size: [2.8, 1.8, 0.5],
      },
      {
        id: 'FUSE_1',
        type: 'fuse_single',
        title: 'Sekring Flasher (10A)',
        subtitle: 'Turn/Hazard Fuse',
        pos: [-8.0, 1.8, 0.45],
        size: [2.6, 2.2, 0.55],
      },
      {
        id: 'FLASHER_1',
        type: 'flasher',
        title: 'Electronic Flasher',
        subtitle: 'Pin B (+) · L (Out) · E (-)',
        pos: [-3.4, 1.8, 0.45],
        size: [3.0, 2.2, 0.7],
      },
      {
        id: 'SW_TURN',
        type: 'switch_combo',
        title: 'Saklar Sein (Turn)',
        subtitle: 'LEFT · OFF · RIGHT',
        pos: [1.4, 1.8, 0.45],
        size: [3.2, 2.2, 0.65],
        states: ['LEFT', 'OFF', 'RIGHT'],
        defaultState: 'OFF',
      },
      {
        id: 'SW_HAZARD',
        type: 'switch_hazard',
        title: 'Saklar Darurat Hazard',
        subtitle: 'Segitiga Merah (All Blink)',
        pos: [-1.2, -2.0, 0.45],
        size: [3.2, 2.0, 0.65],
        states: ['OFF', 'ON'],
        defaultState: 'OFF',
      },
      {
        id: 'TURN_LH',
        type: 'lamp_amber',
        title: 'Lampu Sein Kiri (LH)',
        subtitle: 'Depan & Belakang Kiri',
        pos: [6.8, 1.8, 0.45],
        size: [3.2, 2.2, 0.65],
      },
      {
        id: 'TURN_RH',
        type: 'lamp_amber',
        title: 'Lampu Sein Kanan (RH)',
        subtitle: 'Depan & Belakang Kanan',
        pos: [6.8, -2.0, 0.45],
        size: [3.2, 2.2, 0.65],
      },
      {
        id: 'GND_BUS',
        type: 'junction_post',
        title: 'Bus Massa Tengah',
        subtitle: 'Titik Tumpuk GND',
        pos: [3.0, -2.0, 0.45],
        size: [2.2, 1.8, 0.45],
      },
    ],
    pins: [
      ...COMMON_BATTERY_PINS,
      makePin('BOARD_GND', 'GND', 'PWR_TERMINAL', -8.6, -2.64, 0.45, 'black'),
      makePin('BOARD_POS', '+12V', 'PWR_TERMINAL', -7.4, -2.64, 0.45, 'red'),

      makePin('F1_IN', 'F1+', 'FUSE_1', -8.55, 0.96, 0.45, 'red'),
      makePin('F1_OUT', 'F1-', 'FUSE_1', -7.45, 0.96, 0.45, 'red'),

      makePin('FL_B', 'B', 'FLASHER_1', -4.2, 0.96, 0.45, 'red'),
      makePin('FL_L', 'L', 'FLASHER_1', -3.4, 0.96, 0.45, 'yellow'),
      makePin('FL_E', 'E', 'FLASHER_1', -2.6, 0.96, 0.45, 'black'),

      makePin('TURN_LH_OUT', 'LH', 'SW_TURN', 0.6, 0.96, 0.45, 'yellow'),
      makePin('TURN_L_IN', '49a', 'SW_TURN', 1.4, 0.96, 0.45, 'yellow'),
      makePin('TURN_RH_OUT', 'RH', 'SW_TURN', 2.2, 0.96, 0.45, 'yellow'),

      makePin('HZD_IN', '49a', 'SW_HAZARD', -2.0, -2.74, 0.45, 'yellow'),
      makePin('HZD_LH', 'LH', 'SW_HAZARD', -1.2, -2.74, 0.45, 'yellow'),
      makePin('HZD_RH', 'RH', 'SW_HAZARD', -0.4, -2.74, 0.45, 'yellow'),

      makePin('LAMP_LH_POS', 'LH+', 'TURN_LH', 6.2, 0.96, 0.45, 'yellow'),
      makePin('LAMP_LH_NEG', 'GND', 'TURN_LH', 7.4, 0.96, 0.45, 'black'),

      makePin('LAMP_RH_POS', 'RH+', 'TURN_RH', 6.2, -2.84, 0.45, 'yellow'),
      makePin('LAMP_RH_NEG', 'GND', 'TURN_RH', 7.4, -2.84, 0.45, 'black'),

      makePin('GND_MID', 'GND', 'GND_BUS', 3.0, -2.64, 0.45, 'black'),
    ],
    checklist: [
      {
        id: 'chk_bat',
        label: 'Hubungkan Aki 12V (+) & (-) ke terminal papan menggunakan Kabel Jepit Buaya',
        check: (net) => net.areConnected('BAT_POS', 'BOARD_POS') && net.areConnected('BAT_NEG', 'BOARD_GND'),
      },
      {
        id: 'chk_flasher',
        label: 'Suplai Flasher: +12V -> F1+, F1- -> Flasher B, dan Flasher E -> GND',
        check: (net) =>
          net.areConnected('BOARD_POS', 'F1_IN') &&
          net.areConnected('F1_OUT', 'FL_B') &&
          net.areConnected('FL_E', 'BOARD_GND'),
      },
      {
        id: 'chk_turn_sw',
        label: 'Hubungkan Flasher L ke input Saklar Sein & Saklar Hazard, lalu ke Lampu Sein LH & RH',
        check: (net) =>
          net.areConnected('FL_L', 'TURN_L_IN') &&
          net.areConnected('TURN_LH_OUT', 'LAMP_LH_POS') &&
          net.areConnected('TURN_RH_OUT', 'LAMP_RH_POS'),
      },
      {
        id: 'chk_lamp_gnd',
        label: 'Hubungkan GND Lampu Sein LH dan RH ke Ground (GND)',
        check: (net) =>
          net.areConnected('LAMP_LH_NEG', 'BOARD_GND') && net.areConnected('LAMP_RH_NEG', 'BOARD_GND'),
      },
    ],
    demoWires: [
      { fromPin: 'BAT_POS', toPin: 'BOARD_POS', cableTypeId: 'alligator-red', color: 'red' },
      { fromPin: 'BAT_NEG', toPin: 'BOARD_GND', cableTypeId: 'alligator-black', color: 'black' },
      { fromPin: 'BOARD_POS', toPin: 'F1_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F1_OUT', toPin: 'FL_B', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'FL_L', toPin: 'TURN_L_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'FL_L', toPin: 'HZD_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'TURN_LH_OUT', toPin: 'LAMP_LH_POS', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'TURN_RH_OUT', toPin: 'LAMP_RH_POS', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'HZD_LH', toPin: 'TURN_LH_OUT', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'HZD_RH', toPin: 'LAMP_RH_POS', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'FL_E', toPin: 'GND_MID', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'LAMP_LH_NEG', toPin: 'LAMP_RH_NEG', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'LAMP_RH_NEG', toPin: 'GND_MID', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'GND_MID', toPin: 'BOARD_GND', cableTypeId: 'jumper-30', color: 'black' },
    ],
  },

  // ============================================================================
  // FIG. 06 — FULL AUTOMOTIVE BODY ELECTRICAL TRAINER (LAYOUT GAMBAR 2 + SEKRING)
  // ============================================================================
  {
    id: 'fig06',
    figLabel: 'Fig. 06',
    category: '2. KELISTRIKAN BODI OTOMOTIF',
    title: 'Full Automotive Body Electrical Trainer',
    subtitle: 'Layout lengkap sesuai papan trainer kelistrikan penerangan bodi SMK (Lampu Depan/Belakang, Sekring, Relay, Flasher, Saklar Kombinasi).',
    boardSize: [24.0, 11.4],
    hasAngledConsole: true,
    consoleConfig: {
      hingeY: -2.30,
      hingeZ: 0.225,
      tiltX: -0.78,
      depth: 2.55,
      upperBoardHeight: 7.35,
      upperBoardCenterY: 1.375,
    },
    description:
      'Master Trainer Kelistrikan Penerangan Bodi: Baris atas memuat Sign-Tail Lamp Kiri/Kanan, Head Lamp Kiri/Kanan, serta Wiper & Klakson. Baris tengah memuat Saklar Klakson, Saklar Rem, Indicator Lamp, Interior Lamp, Flasher, dan 3 Relay. Baris bawah memuat Lampu Kombinasi Belakang Kiri/Kanan, Licence Lamp, Terminal Aki, Kunci Kontak, Blok 4 Sekring (F1-F4), dan Saklar Kombinasi.',
    components: [
      FIG06_BATTERY_COMPONENT,
      // --- ROW 1 (TOP ROW: y = 3.55, h = 2.15, bottom pins at y = 2.70) ---
      {
        id: 'SIGN_FRONT_LH',
        type: 'lamp_amber',
        title: 'Sign - Tail Lamp (LH)',
        subtitle: 'Sein Depan Kiri',
        pos: [-9.5, 3.55, 0.45],
        size: [3.6, 2.15, 0.65],
      },
      {
        id: 'HL_MAIN',
        type: 'headlamp',
        title: 'Head Lamp (LH)',
        subtitle: 'Lampu Kepala Kiri',
        pos: [-4.8, 3.55, 0.45],
        size: [4.8, 2.15, 0.7],
      },
      {
        id: 'HORN_1',
        type: 'horn',
        title: 'Wiper & Horn',
        subtitle: 'Klakson & Wiper',
        pos: [0.0, 3.55, 0.45],
        size: [3.6, 2.15, 0.7],
      },
      {
        id: 'HL_RH',
        type: 'headlamp',
        title: 'Head Lamp (RH)',
        subtitle: 'Lampu Kepala Kanan',
        pos: [4.8, 3.55, 0.45],
        size: [4.8, 2.15, 0.7],
      },
      {
        id: 'TURN_LAMPS',
        type: 'lamp_amber',
        title: 'Sign - Tail Lamp (RH)',
        subtitle: 'Sein Depan Kanan',
        pos: [9.5, 3.55, 0.45],
        size: [3.6, 2.15, 0.65],
      },

      // --- ROW 2 (UPPER-MIDDLE ROW: y = 1.15, h = 2.1, bottom pins at y = 0.32) ---
      {
        id: 'HORN_BTN',
        type: 'switch_push',
        momentary: true,
        title: 'Horn Switch',
        subtitle: 'Tombol Klakson',
        pos: [-9.9, 1.15, 0.45],
        size: [2.3, 2.1, 0.55],
        states: ['OFF', 'ON'],
        defaultState: 'OFF',
      },
      {
        id: 'SW_BRAKE',
        type: 'switch_push',
        momentary: true,
        title: 'Brake Switch',
        subtitle: 'Tombol Pedal Rem',
        pos: [-7.3, 1.15, 0.45],
        size: [2.3, 2.1, 0.55],
        states: ['OFF', 'ON'],
        defaultState: 'OFF',
      },
      {
        id: 'IND_CLUSTER',
        type: 'indicator_cluster',
        title: 'Indicator Lamp',
        subtitle: 'Lampu Indikator Panel',
        pos: [-4.5, 1.15, 0.45],
        size: [2.8, 2.1, 0.55],
      },
      {
        id: 'LAMP_TEST',
        type: 'lamp_test',
        title: 'Interior Lamp',
        subtitle: 'Lampu Kabin',
        pos: [-1.8, 1.15, 0.45],
        size: [2.1, 2.1, 0.6],
      },
      {
        id: 'FLASHER_1',
        type: 'flasher',
        title: 'Flasher',
        subtitle: 'Unit Pengedip B-L-E',
        pos: [0.5, 1.15, 0.45],
        size: [2.1, 2.1, 0.65],
      },
      {
        id: 'RLY_MAIN',
        type: 'relay_4p',
        title: 'Relay 4 (Main)',
        subtitle: '30 · 85 · 86 · 87',
        pos: [2.8, 1.15, 0.45],
        size: [2.3, 2.1, 0.7],
      },
      {
        id: 'RLY_HORN',
        type: 'relay_4p',
        title: 'Relay 1 (Horn)',
        subtitle: '30 · 85 · 86 · 87',
        pos: [5.2, 1.15, 0.45],
        size: [2.3, 2.1, 0.7],
      },
      {
        id: 'RLY_LOW',
        type: 'relay_4p',
        title: 'Relay 2 (Low)',
        subtitle: '30 · 85 · 86 · 87',
        pos: [7.6, 1.15, 0.45],
        size: [2.3, 2.1, 0.7],
      },
      {
        id: 'RLY_HIGH',
        type: 'relay_4p',
        title: 'Relay 3 (High)',
        subtitle: '30 · 85 · 86 · 87',
        pos: [10.0, 1.15, 0.45],
        size: [2.3, 2.1, 0.7],
      },

      // --- ROW 3 (LOWER-MIDDLE ROW: y = -1.15, h = 2.0, bottom pins at y = -1.92) ---
      {
        id: 'TAIL_LH',
        type: 'lamp_red_dual',
        title: 'Sign - Brake - Tail - Rev (LH)',
        subtitle: 'Kombinasi Belakang Kiri',
        pos: [-6.8, -1.15, 0.45],
        size: [8.2, 2.0, 0.65],
      },
      {
        id: 'GND_BUS_1',
        type: 'licence_lamp',
        title: 'Licence Lamp',
        subtitle: 'Lampu Plat & Massa',
        pos: [0.0, -1.15, 0.45],
        size: [4.2, 2.0, 0.55],
      },
      {
        id: 'TAIL_RH',
        type: 'lamp_red_dual',
        title: 'Sign - Brake - Tail - Rev (RH)',
        subtitle: 'Kombinasi Belakang Kanan',
        pos: [6.8, -1.15, 0.45],
        size: [8.2, 2.0, 0.65],
      },

      // --- ROW 4 (ANGLED FRONT CONSOLE DECK: hinged at y=-2.30, z=0.225, tiltX=-0.78 rad) ---
      {
        id: 'PWR_TERMINAL',
        type: 'power_rail',
        title: 'Battery Input',
        subtitle: '+12V & Massa',
        surface: 'console',
        tiltX: -0.78,
        pos: [-9.8, -3.15, 1.07],
        size: [2.8, 2.1, 0.5],
      },
      {
        id: 'IGN_SW',
        type: 'ignition',
        hasStartMomentary: true,
        title: 'Ignition Switch',
        subtitle: 'OFF · ACC · ON · START',
        surface: 'console',
        tiltX: -0.78,
        pos: [-6.6, -3.15, 1.07],
        size: [2.8, 2.1, 0.6],
        states: ['OFF', 'ACC', 'IG'],
        defaultState: 'OFF',
      },
      {
        id: 'FUSE_BLOCK_4',
        type: 'fuse_quad',
        title: 'Fuse Block (F1-F4)',
        subtitle: 'Sekring Pengaman',
        surface: 'console',
        tiltX: -0.78,
        pos: [-2.2, -3.15, 1.07],
        size: [5.2, 2.1, 0.55],
      },
      {
        id: 'SW_DIMMER',
        type: 'switch_combo',
        variant: 'unified_master',
        hasDimPass: true,
        title: 'Combination Switch (Dimmer)',
        subtitle: 'OFF · LOW · HIGH · DIM',
        surface: 'console',
        tiltX: -0.78,
        pos: [4.2, -3.15, 1.07],
        size: [6.8, 2.1, 0.65],
        states: ['HIGH', 'OFF', 'LOW'],
        defaultState: 'OFF',
      },
      {
        id: 'SW_TURN',
        type: 'switch_combo',
        variant: 'unified_slave',
        title: 'Combination Switch (Sein)',
        subtitle: 'LEFT · OFF · RIGHT',
        surface: 'console',
        tiltX: -0.78,
        pos: [4.2, -3.15, 1.07],
        size: [6.8, 2.1, 0.65],
        states: ['LEFT', 'OFF', 'RIGHT'],
        defaultState: 'OFF',
      },
      {
        id: 'SW_HAZARD',
        type: 'switch_hazard',
        title: 'Hazard Switch',
        subtitle: 'OFF · ON',
        surface: 'console',
        tiltX: -0.78,
        pos: [9.6, -3.15, 1.07],
        size: [3.2, 2.1, 0.6],
        states: ['OFF', 'ON'],
        defaultState: 'OFF',
      },
    ],
    pins: [
      ...FIG06_BATTERY_PINS,
      // Row 1 bottom pins (y = 2.70)
      makePin('LAMP_LH_POS', 'LH+', 'SIGN_FRONT_LH', -10.1, 2.7, 0.45, 'yellow'),
      makePin('FD_LH_GND', 'GND', 'SIGN_FRONT_LH', -8.9, 2.7, 0.45, 'black'),

      makePin('HL_LOW_POS', 'LO', 'HL_MAIN', -5.7, 2.7, 0.45, 'yellow'),
      makePin('HL_HIGH_POS', 'HI', 'HL_MAIN', -4.8, 2.7, 0.45, 'blue'),
      makePin('HL_GND', 'GND', 'HL_MAIN', -3.9, 2.7, 0.45, 'black'),

      makePin('HORN_POS', 'H+', 'HORN_1', -0.6, 2.7, 0.45, 'red'),
      makePin('HORN_NEG', 'H-', 'HORN_1', 0.6, 2.7, 0.45, 'black'),

      makePin('HLR_LOW', 'LO', 'HL_RH', 3.9, 2.7, 0.45, 'yellow'),
      makePin('HLR_HIGH', 'HI', 'HL_RH', 4.8, 2.7, 0.45, 'blue'),
      makePin('HLR_GND', 'GND', 'HL_RH', 5.7, 2.7, 0.45, 'black'),

      makePin('LAMP_RH_POS', 'RH+', 'TURN_LAMPS', 8.9, 2.7, 0.45, 'yellow'),
      makePin('LAMP_TURN_GND', 'GND', 'TURN_LAMPS', 10.1, 2.7, 0.45, 'black'),

      // Row 2 bottom pins (y = 0.32)
      makePin('HBTN_IN', 'IN', 'HORN_BTN', -10.4, 0.32, 0.45, 'red'),
      makePin('HBTN_OUT', 'OUT', 'HORN_BTN', -9.4, 0.32, 0.45, 'yellow'),

      makePin('BRK_IN', 'IN', 'SW_BRAKE', -7.8, 0.32, 0.45, 'red'),
      makePin('BRK_OUT', 'OUT', 'SW_BRAKE', -6.8, 0.32, 0.45, 'red'),

      makePin('IND_TURN', 'TURN', 'IND_CLUSTER', -5.35, 0.32, 0.45, 'yellow'),
      makePin('IND_TAIL', 'TAIL', 'IND_CLUSTER', -4.7, 0.32, 0.45, 'red'),
      makePin('IND_HI', 'HI', 'IND_CLUSTER', -4.05, 0.32, 0.45, 'blue'),
      makePin('IND_GND', 'GND', 'IND_CLUSTER', -3.45, 0.32, 0.45, 'black'),

      makePin('LAMP_POS', 'IN+', 'LAMP_TEST', -2.2, 0.32, 0.45, 'red'),
      makePin('LAMP_NEG', 'GND', 'LAMP_TEST', -1.4, 0.32, 0.45, 'black'),

      makePin('FL_B', 'B', 'FLASHER_1', 0.1, 0.32, 0.45, 'red'),
      makePin('FL_L', 'L', 'FLASHER_1', 0.5, 0.32, 0.45, 'yellow'),
      makePin('FL_E', 'E', 'FLASHER_1', 0.9, 0.32, 0.45, 'black'),

      makePin('RMAIN_30', '30', 'RLY_MAIN', 2.05, 0.32, 0.45, 'red'),
      makePin('RMAIN_85', '85', 'RLY_MAIN', 2.55, 0.32, 0.45, 'yellow'),
      makePin('RMAIN_86', '86', 'RLY_MAIN', 3.05, 0.32, 0.45, 'black'),
      makePin('RMAIN_87', '87', 'RLY_MAIN', 3.55, 0.32, 0.45, 'red'),

      makePin('RHORN_30', '30', 'RLY_HORN', 4.45, 0.32, 0.45, 'red'),
      makePin('RHORN_85', '85', 'RLY_HORN', 4.95, 0.32, 0.45, 'yellow'),
      makePin('RHORN_86', '86', 'RLY_HORN', 5.45, 0.32, 0.45, 'black'),
      makePin('RHORN_87', '87', 'RLY_HORN', 5.95, 0.32, 0.45, 'red'),

      makePin('RLOW_30', '30', 'RLY_LOW', 6.85, 0.32, 0.45, 'red'),
      makePin('RLOW_85', '85', 'RLY_LOW', 7.35, 0.32, 0.45, 'yellow'),
      makePin('RLOW_86', '86', 'RLY_LOW', 7.85, 0.32, 0.45, 'black'),
      makePin('RLOW_87', '87', 'RLY_LOW', 8.35, 0.32, 0.45, 'red'),

      makePin('RHIGH_30', '30', 'RLY_HIGH', 9.25, 0.32, 0.45, 'red'),
      makePin('RHIGH_85', '85', 'RLY_HIGH', 9.75, 0.32, 0.45, 'blue'),
      makePin('RHIGH_86', '86', 'RLY_HIGH', 10.25, 0.32, 0.45, 'black'),
      makePin('RHIGH_87', '87', 'RLY_HIGH', 10.75, 0.32, 0.45, 'red'),

      // Row 3 bottom pins (y = -1.92) - 5 Pins per Tail Lamp (Gambar 4) + Licence Lamp (Gambar 1)
      makePin('LH_SIGN', 'SIGN', 'TAIL_LH', -9.2, -1.92, 0.45, 'yellow'),
      makePin('LH_TAIL', 'TAIL', 'TAIL_LH', -8.0, -1.92, 0.45, 'red'),
      makePin('LH_STOP', 'STOP', 'TAIL_LH', -6.8, -1.92, 0.45, 'red'),
      makePin('LH_REV', 'REV', 'TAIL_LH', -5.6, -1.92, 0.45, 'white'),
      makePin('LH_GND', 'GND', 'TAIL_LH', -4.4, -1.92, 0.45, 'black'),

      makePin('LIC_POS', 'LIC+', 'GND_BUS_1', -0.9, -1.92, 0.45, 'yellow'),
      makePin('GND_MID', 'GND', 'GND_BUS_1', 0.9, -1.92, 0.45, 'black'),

      makePin('RH_GND', 'GND', 'TAIL_RH', 4.4, -1.92, 0.45, 'black'),
      makePin('RH_REV', 'REV', 'TAIL_RH', 5.6, -1.92, 0.45, 'white'),
      makePin('RH_STOP', 'STOP', 'TAIL_RH', 6.8, -1.92, 0.45, 'red'),
      makePin('RH_TAIL', 'TAIL', 'TAIL_RH', 8.0, -1.92, 0.45, 'red'),
      makePin('RH_SIGN', 'SIGN', 'TAIL_RH', 9.2, -1.92, 0.45, 'yellow'),

      // Row 4 angled front console pins (mounted perpendicular to sloped deck, tiltX = -0.78)
      { ...makePin('BOARD_GND', 'GND', 'PWR_TERMINAL', -10.3, -3.74, 1.65, 'black'), surface: 'console', tiltX: -0.78 },
      { ...makePin('BOARD_POS', '+12V', 'PWR_TERMINAL', -9.3, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },

      { ...makePin('IGN_B', '30', 'IGN_SW', -7.5, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },
      { ...makePin('IGN_ACC', 'ACC', 'IGN_SW', -6.8, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },
      { ...makePin('IGN_IG', '15', 'IGN_SW', -6.1, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },
      { ...makePin('IGN_ST', '50', 'IGN_SW', -5.4, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },

      { ...makePin('F1_IN', 'F1+', 'FUSE_BLOCK_4', -4.3, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },
      { ...makePin('F1_OUT', 'F1-', 'FUSE_BLOCK_4', -3.7, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },
      { ...makePin('F2_IN', 'F2+', 'FUSE_BLOCK_4', -3.1, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },
      { ...makePin('F2_OUT', 'F2-', 'FUSE_BLOCK_4', -2.5, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },
      { ...makePin('F3_IN', 'F3+', 'FUSE_BLOCK_4', -1.9, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },
      { ...makePin('F3_OUT', 'F3-', 'FUSE_BLOCK_4', -1.3, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },
      { ...makePin('F4_IN', 'F4+', 'FUSE_BLOCK_4', -0.7, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },
      { ...makePin('F4_OUT', 'F4-', 'FUSE_BLOCK_4', -0.1, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },

      { ...makePin('DIM_IN', 'B', 'SW_DIMMER', 1.6, -3.74, 1.65, 'red'), surface: 'console', tiltX: -0.78 },
      { ...makePin('DIM_LOW', 'LOW', 'SW_DIMMER', 2.4, -3.74, 1.65, 'yellow'), surface: 'console', tiltX: -0.78 },
      { ...makePin('DIM_HIGH', 'HIGH', 'SW_DIMMER', 3.2, -3.74, 1.65, 'blue'), surface: 'console', tiltX: -0.78 },

      { ...makePin('TURN_L_IN', '49a', 'SW_TURN', 5.2, -3.74, 1.65, 'yellow'), surface: 'console', tiltX: -0.78 },
      { ...makePin('TURN_LH_OUT', 'LH', 'SW_TURN', 6.0, -3.74, 1.65, 'yellow'), surface: 'console', tiltX: -0.78 },
      { ...makePin('TURN_RH_OUT', 'RH', 'SW_TURN', 6.8, -3.74, 1.65, 'yellow'), surface: 'console', tiltX: -0.78 },

      { ...makePin('HZD_IN', '49a', 'SW_HAZARD', 8.8, -3.74, 1.65, 'yellow'), surface: 'console', tiltX: -0.78 },
      { ...makePin('HZD_LH', 'LH', 'SW_HAZARD', 9.6, -3.74, 1.65, 'yellow'), surface: 'console', tiltX: -0.78 },
      { ...makePin('HZD_RH', 'RH', 'SW_HAZARD', 10.4, -3.74, 1.65, 'yellow'), surface: 'console', tiltX: -0.78 },
    ],
    checklist: [
      {
        id: 'chk_bat',
        label: 'Hubungkan Aki 12V ke terminal utama papan menggunakan Kabel Jepit Buaya (+) & (-)',
        check: (net) => net.areConnected('BAT_POS', 'BOARD_POS') && net.areConnected('BAT_NEG', 'BOARD_GND'),
      },
      {
        id: 'chk_horn_sys',
        label: 'Rangkai sistem Klakson melalui Sekring F1, Relay 1 (30-85-86-87), dan Horn Switch',
        check: (net) =>
          net.areConnected('F1_OUT', 'RHORN_30') &&
          net.areConnected('RHORN_87', 'HORN_POS') &&
          net.areConnected('HBTN_OUT', 'RHORN_85'),
      },
      {
        id: 'chk_headlamp_sys',
        label: 'Rangkai sistem Head Lamp Jauh/Dekat melalui F2, F3, Saklar High-Low Beam, Relay 2 & Relay 3',
        check: (net) =>
          net.areConnected('RLOW_87', 'HL_LOW_POS') &&
          net.areConnected('RHIGH_87', 'HL_HIGH_POS') &&
          net.areConnected('DIM_LOW', 'RLOW_85') &&
          net.areConnected('DIM_HIGH', 'RHIGH_85'),
      },
      {
        id: 'chk_turn_sys',
        label: 'Rangkai sistem Lampu Sein & Hazard melalui F4, Flasher (B-L-E), Turn Signal, dan Hazard Switch',
        check: (net) =>
          net.areConnected('F4_OUT', 'FL_B') &&
          net.areConnected('FL_L', 'TURN_L_IN') &&
          net.areConnected('TURN_LH_OUT', 'LAMP_LH_POS') &&
          net.areConnected('TURN_RH_OUT', 'LAMP_RH_POS'),
      },
    ],
    demoWires: [
      { fromPin: 'BAT_POS', toPin: 'BOARD_POS', cableTypeId: 'alligator-red', color: 'red' },
      { fromPin: 'BAT_NEG', toPin: 'BOARD_GND', cableTypeId: 'alligator-black', color: 'black' },
      { fromPin: 'BOARD_POS', toPin: 'IGN_B', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'IGN_B', toPin: 'F1_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F1_IN', toPin: 'F2_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F2_IN', toPin: 'F3_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'IGN_IG', toPin: 'RMAIN_85', cableTypeId: 'jumper-30', color: 'red' },
      { fromPin: 'F1_OUT', toPin: 'RMAIN_30', cableTypeId: 'jumper-25', color: 'red' },
      { fromPin: 'RMAIN_87', toPin: 'F4_IN', cableTypeId: 'jumper-20', color: 'red' },

      // Horn branch
      { fromPin: 'F1_OUT', toPin: 'RHORN_30', cableTypeId: 'jumper-30', color: 'red' },
      { fromPin: 'RHORN_87', toPin: 'HORN_POS', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'F4_OUT', toPin: 'HBTN_IN', cableTypeId: 'jumper-30', color: 'red' },
      { fromPin: 'HBTN_OUT', toPin: 'RHORN_85', cableTypeId: 'jumper-50', color: 'red' },

      // Headlamp Low & High branch (left & right headlamps)
      { fromPin: 'F2_OUT', toPin: 'RLOW_30', cableTypeId: 'jumper-30', color: 'red' },
      { fromPin: 'F3_OUT', toPin: 'RHIGH_30', cableTypeId: 'jumper-30', color: 'red' },
      { fromPin: 'F4_OUT', toPin: 'DIM_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'DIM_LOW', toPin: 'RLOW_85', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'DIM_HIGH', toPin: 'RHIGH_85', cableTypeId: 'jumper-25', color: 'red' },
      { fromPin: 'RLOW_87', toPin: 'HLR_LOW', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'HLR_LOW', toPin: 'HL_LOW_POS', cableTypeId: 'jumper-30', color: 'red' },
      { fromPin: 'RHIGH_87', toPin: 'HLR_HIGH', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'HLR_HIGH', toPin: 'HL_HIGH_POS', cableTypeId: 'jumper-30', color: 'red' },

      // Flasher & Turn/Hazard branch
      { fromPin: 'F4_OUT', toPin: 'FL_B', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'FL_L', toPin: 'TURN_L_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'TURN_L_IN', toPin: 'HZD_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'TURN_LH_OUT', toPin: 'LAMP_LH_POS', cableTypeId: 'jumper-50', color: 'red' },
      { fromPin: 'TURN_RH_OUT', toPin: 'LAMP_RH_POS', cableTypeId: 'jumper-25', color: 'red' },
      { fromPin: 'HZD_LH', toPin: 'TURN_LH_OUT', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'HZD_RH', toPin: 'TURN_RH_OUT', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'LAMP_LH_POS', toPin: 'LH_SIGN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'LAMP_RH_POS', toPin: 'RH_SIGN', cableTypeId: 'jumper-20', color: 'red' },

      // Brake, Tail & Licence Lamp branch
      { fromPin: 'F4_OUT', toPin: 'BRK_IN', cableTypeId: 'jumper-25', color: 'red' },
      { fromPin: 'BRK_OUT', toPin: 'LH_STOP', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'LH_STOP', toPin: 'RH_STOP', cableTypeId: 'jumper-50', color: 'red' },
      { fromPin: 'F4_OUT', toPin: 'LH_TAIL', cableTypeId: 'jumper-25', color: 'red' },
      { fromPin: 'LH_TAIL', toPin: 'RH_TAIL', cableTypeId: 'jumper-50', color: 'red' },
      { fromPin: 'LH_TAIL', toPin: 'LIC_POS', cableTypeId: 'jumper-20', color: 'red' },

      // Indicator Lamp branch
      { fromPin: 'HL_HIGH_POS', toPin: 'IND_HI', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'LAMP_LH_POS', toPin: 'IND_TURN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'LH_TAIL', toPin: 'IND_TAIL', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'IND_GND', toPin: 'LAMP_NEG', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'LAMP_NEG', toPin: 'GND_MID', cableTypeId: 'jumper-20', color: 'black' },

      // Ground return network (demonstrating pin stacking)
      { fromPin: 'RMAIN_86', toPin: 'GND_MID', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'RHORN_86', toPin: 'RLOW_86', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'RLOW_86', toPin: 'RHIGH_86', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'RHORN_86', toPin: 'GND_MID', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'HORN_NEG', toPin: 'HL_GND', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'HL_GND', toPin: 'FD_LH_GND', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'HORN_NEG', toPin: 'HLR_GND', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'HLR_GND', toPin: 'LAMP_TURN_GND', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'HORN_NEG', toPin: 'GND_MID', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'FL_E', toPin: 'GND_MID', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'LH_GND', toPin: 'GND_MID', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'RH_GND', toPin: 'GND_MID', cableTypeId: 'jumper-25', color: 'black' },
      { fromPin: 'GND_MID', toPin: 'BOARD_GND', cableTypeId: 'jumper-30', color: 'black' },
    ],
  },

  // ============================================================================
  // MODUL 3 · SISTEM AIR CONDITIONER (AC) MOBIL
  // ============================================================================

  // ----------------------------------------------------------------------------
  // MODUL AC 01: KELISTRIKAN BLOWER & RESISTOR MULTI-KECEPATAN
  // ----------------------------------------------------------------------------
  {
    id: 'ac01',
    figLabel: 'AC 01',
    category: '3. KELISTRIKAN SISTEM AC',
    title: 'Kelistrikan Blower & Resistor Multi-Kecepatan',
    subtitle: 'Pengaturan Aliran Udara Evaporator Kabin Kecepatan 0 - 1 - 2 - 3',
    boardSize: [24.0, 9.6],
    description:
      'Pelajari prinsip pembagian tegangan resistor blower untuk mengatur kecepatan hembusan udara evaporator kabin. Siswa dapat mengukur voltage drop (6V, 9V, 12V) pada setiap tingkat kecepatan dan mengamati hembusan angin dinamis.',
    components: [
      AC_BATTERY_COMPONENT,
      {
        id: 'PWR_BUS_30',
        type: 'power_rail',
        title: 'Terminal 30 (+12V)',
        pos: [-9.4, 2.5, 0.45],
        size: [3.2, 2.45, 0.4],
      },
      {
        id: 'IGN_SW',
        type: 'ignition',
        title: 'Kunci Kontak',
        pos: [-5.5, 2.5, 0.45],
        size: [3.6, 2.45, 0.4],
        states: ['OFF', 'ACC', 'IG', 'START'],
        defaultState: 'OFF',
      },
      {
        id: 'FUSE_BLOWER',
        type: 'fuse_single',
        title: 'Sekring Blower 20A',
        pos: [-1.4, 2.5, 0.45],
        size: [3.6, 2.45, 0.4],
      },
      {
        id: 'SW_BLOWER',
        type: 'switch_blower_rotary',
        title: 'Saklar Blower',
        pos: [3.2, 2.5, 0.45],
        size: [4.6, 2.45, 0.4],
        states: ['OFF', 'SPEED_1', 'SPEED_2', 'SPEED_3'],
        defaultState: 'OFF',
      },
      {
        id: 'RESISTOR_BLOWER',
        type: 'resistor_blower',
        title: 'Resistor Blower AC',
        pos: [8.4, 2.5, 0.45],
        size: [4.8, 2.45, 0.4],
      },
      {
        id: 'GND_BUS_31',
        type: 'power_rail',
        title: 'Terminal 31 (Ground / Massa)',
        pos: [-5.8, -1.1, 0.45],
        size: [8.4, 2.55, 0.4],
      },
      {
        id: 'EVAPORATOR_UNIT',
        type: 'evaporator_unit',
        title: 'Unit Evaporator & Blower Kabin',
        pos: [4.8, -1.1, 0.45],
        size: [11.6, 2.55, 0.6],
      },
    ],
    pins: [
      ...AC_BATTERY_PINS,
      { id: 'BUS30_1', label: '30 (1)', pos: [-10.1, 1.58, 0.45], color: 'red', componentId: 'PWR_BUS_30' },
      { id: 'BUS30_2', label: '30 (2)', pos: [-8.7, 1.58, 0.45], color: 'red', componentId: 'PWR_BUS_30' },
      { id: 'IGN_B', label: 'B', pos: [-6.4, 1.58, 0.45], color: 'red', componentId: 'IGN_SW' },
      { id: 'IGN_ACC', label: 'ACC', pos: [-5.5, 1.58, 0.45], color: 'yellow', componentId: 'IGN_SW' },
      { id: 'IGN_IG', label: 'IG', pos: [-4.6, 1.58, 0.45], color: 'blue', componentId: 'IGN_SW' },
      { id: 'FUSE_BLW_IN', label: 'F_IN', pos: [-2.1, 1.58, 0.45], color: 'red', componentId: 'FUSE_BLOWER' },
      { id: 'FUSE_BLW_OUT', label: 'F_OUT', pos: [-0.7, 1.58, 0.45], color: 'red', componentId: 'FUSE_BLOWER' },
      { id: 'BLW_SW_B', label: 'B', pos: [1.7, 1.58, 0.45], color: 'red', componentId: 'SW_BLOWER' },
      { id: 'BLW_SW_1', label: '1 (L)', pos: [2.7, 1.58, 0.45], color: 'yellow', componentId: 'SW_BLOWER' },
      { id: 'BLW_SW_2', label: '2 (M)', pos: [3.7, 1.58, 0.45], color: 'yellow', componentId: 'SW_BLOWER' },
      { id: 'BLW_SW_3', label: '3 (H)', pos: [4.7, 1.58, 0.45], color: 'yellow', componentId: 'SW_BLOWER' },
      { id: 'RES_IN', label: 'OUT', pos: [6.9, 1.58, 0.45], color: 'red', componentId: 'RESISTOR_BLOWER' },
      { id: 'RES_LOW', label: 'LOW', pos: [7.9, 1.58, 0.45], color: 'yellow', componentId: 'RESISTOR_BLOWER' },
      { id: 'RES_MED', label: 'MED', pos: [8.9, 1.58, 0.45], color: 'yellow', componentId: 'RESISTOR_BLOWER' },
      { id: 'RES_HIGH', label: 'HIGH', pos: [9.9, 1.58, 0.45], color: 'yellow', componentId: 'RESISTOR_BLOWER' },
      { id: 'MTR_BLW_POS', label: 'BLW (+)', pos: [3.2, -2.05, 0.45], color: 'red', componentId: 'EVAPORATOR_UNIT' },
      { id: 'MTR_BLW_GND', label: 'BLW (-)', pos: [6.4, -2.05, 0.45], color: 'black', componentId: 'EVAPORATOR_UNIT' },
      { id: 'BUS31_1', label: '31 (1)', pos: [-8.0, -2.05, 0.45], color: 'black', componentId: 'GND_BUS_31' },
      { id: 'BUS31_2', label: '31 (2)', pos: [-5.8, -2.05, 0.45], color: 'black', componentId: 'GND_BUS_31' },
      { id: 'BUS31_3', label: '31 (3)', pos: [-3.6, -2.05, 0.45], color: 'black', componentId: 'GND_BUS_31' },
    ],
    fuses: [
      { key: 'F_BLW', inPin: 'FUSE_BLW_IN', outPin: 'FUSE_BLW_OUT', rating: '20A', blown: false },
    ],
    demoWires: [
      { fromPin: 'BAT_POS', toPin: 'BUS30_1', cableTypeId: 'alligator-red', color: 'red' },
      { fromPin: 'BAT_NEG', toPin: 'BUS31_1', cableTypeId: 'alligator-black', color: 'black' },
      { fromPin: 'BUS30_2', toPin: 'IGN_B', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'IGN_IG', toPin: 'FUSE_BLW_IN', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'FUSE_BLW_OUT', toPin: 'BLW_SW_B', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'BLW_SW_1', toPin: 'RES_LOW', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'BLW_SW_2', toPin: 'RES_MED', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'BLW_SW_3', toPin: 'RES_HIGH', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'RES_IN', toPin: 'MTR_BLW_POS', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'MTR_BLW_GND', toPin: 'BUS31_2', cableTypeId: 'jumper-50', color: 'black' },
    ],
    checklist: [
      {
        id: 'step_bat',
        label: 'Hubungkan Aki 12V (+ ke Bus 30, - ke Bus 31)',
        isDone: (net) => net.areConnected('BAT_POS', 'BUS30_1') && net.areConnected('BAT_NEG', 'BUS31_1'),
      },
      {
        id: 'step_ign',
        label: 'Hubungkan Bus 30 ke Terminal B Kunci Kontak & IG ke Sekring Blower',
        isDone: (net) => net.areConnected('BUS30_2', 'IGN_B') && net.areConnected('IGN_IG', 'FUSE_BLW_IN'),
      },
      {
        id: 'step_sw',
        label: 'Hubungkan Sekring ke Saklar Blower (B) & cabang kecepatan 1, 2, 3 ke Resistor',
        isDone: (net) =>
          net.areConnected('FUSE_BLW_OUT', 'BLW_SW_B') &&
          net.areConnected('BLW_SW_1', 'RES_LOW') &&
          net.areConnected('BLW_SW_2', 'RES_MED') &&
          net.areConnected('BLW_SW_3', 'RES_HIGH'),
      },
      {
        id: 'step_motor',
        label: 'Hubungkan Output Resistor ke Motor Blower (+) dan Ground (-)',
        isDone: (net) => net.areConnected('RES_IN', 'MTR_BLW_POS') && net.areConnected('MTR_BLW_GND', 'BUS31_2'),
      },
    ],
  },

  // ----------------------------------------------------------------------------
  // MODUL AC 02: KELISTRIKAN MAGNETIC CLUTCH & PENGAMAN TEKANAN
  // ----------------------------------------------------------------------------
  {
    id: 'ac02',
    figLabel: 'AC 02',
    category: '3. KELISTRIKAN SISTEM AC',
    title: 'Kelistrikan Magnetic Clutch & Pengaman Tekanan',
    subtitle: 'Rangkaian Seri Pengaman: Blower Interlock, Saklar A/C, Thermostat, Dual Pressure Switch, & Relay',
    boardSize: [24.6, 10.2],
    description:
      'Pelajari alur rangkaian pengaman kopling kompresor AC. Magnetic clutch hanya boleh aktif jika blower hidup, saklar A/C ditekan, thermostat belum mencapai suhu beku, dan pressure switch mendeteksi tekanan refrigeran berada dalam batas aman.',
    components: [
      AC_BATTERY_COMPONENT,
      // Row 1 (y = +3.35, h = 2.40, pins at y = +2.45)
      {
        id: 'PWR_BUS_30',
        type: 'power_rail',
        title: 'Terminal 30 (+12V)',
        pos: [-9.8, 3.35, 0.45],
        size: [3.2, 2.40, 0.4],
      },
      {
        id: 'IGN_SW',
        type: 'ignition',
        title: 'Kunci Kontak',
        pos: [-6.1, 3.35, 0.45],
        size: [3.4, 2.40, 0.4],
        states: ['OFF', 'ACC', 'IG', 'START'],
        defaultState: 'OFF',
      },
      {
        id: 'FUSE_AC',
        type: 'fuse_single',
        title: 'Sekring A/C 15A',
        pos: [-2.4, 3.35, 0.45],
        size: [3.2, 2.40, 0.4],
      },
      {
        id: 'SW_AC_PUSH',
        type: 'switch_ac_push',
        title: 'Saklar A/C (ON/OFF)',
        pos: [1.3, 3.35, 0.45],
        size: [3.4, 2.40, 0.4],
        states: ['OFF', 'ON'],
        defaultState: 'OFF',
      },
      {
        id: 'THERMOSTAT_AC',
        type: 'thermostat_ac',
        title: 'Thermostat / Temp Control',
        pos: [5.2, 3.35, 0.45],
        size: [3.6, 2.40, 0.4],
        states: ['ON', 'OFF'],
        defaultState: 'ON',
      },
      {
        id: 'PRESSURE_SWITCH',
        type: 'pressure_switch_dual',
        title: 'Dual Pressure Switch',
        pos: [9.4, 3.35, 0.45],
        size: [4.0, 2.40, 0.4],
        states: ['CLOSED', 'OPEN'],
        defaultState: 'CLOSED',
      },
      // Row 2 (y = +0.55, h = 2.45, pins at y = -0.37)
      {
        id: 'RLY_CLUTCH',
        type: 'relay_4p',
        title: 'Relay Magnetic Clutch',
        pos: [-8.6, 0.55, 0.45],
        size: [5.2, 2.45, 0.4],
      },
      {
        id: 'RLY_FAN',
        type: 'relay_4p',
        title: 'Relay Extra Fan',
        pos: [-2.8, 0.55, 0.45],
        size: [5.2, 2.45, 0.4],
      },
      {
        id: 'MAG_CLUTCH',
        type: 'magnetic_clutch',
        title: 'Magnetic Clutch Kompresor 12V',
        pos: [3.0, 0.55, 0.45],
        size: [5.4, 2.45, 0.4],
      },
      {
        id: 'EXTRA_FAN',
        type: 'condenser_fan',
        title: 'Extra Fan Kondensor 12V',
        pos: [8.8, 0.55, 0.45],
        size: [5.2, 2.45, 0.4],
      },
      // Row 3 (y = -2.05, h = 2.15, pins at y = -2.85)
      {
        id: 'GND_BUS_31',
        type: 'power_rail',
        title: 'Terminal 31 (Ground / Massa)',
        pos: [0.0, -2.05, 0.45],
        size: [14.0, 2.15, 0.4],
      },
    ],
    pins: [
      ...AC_BATTERY_PINS,
      { id: 'BUS30_1', label: '30 (1)', pos: [-10.7, 2.45, 0.45], color: 'red', componentId: 'PWR_BUS_30' },
      { id: 'BUS30_2', label: '30 (2)', pos: [-9.8, 2.45, 0.45], color: 'red', componentId: 'PWR_BUS_30' },
      { id: 'BUS30_3', label: '30 (3)', pos: [-8.9, 2.45, 0.45], color: 'red', componentId: 'PWR_BUS_30' },
      { id: 'IGN_B', label: 'B', pos: [-6.8, 2.45, 0.45], color: 'red', componentId: 'IGN_SW' },
      { id: 'IGN_IG', label: 'IG', pos: [-5.4, 2.45, 0.45], color: 'blue', componentId: 'IGN_SW' },
      { id: 'FUSE_AC_IN', label: 'F_IN', pos: [-3.1, 2.45, 0.45], color: 'red', componentId: 'FUSE_AC' },
      { id: 'FUSE_AC_OUT', label: 'F_OUT', pos: [-1.7, 2.45, 0.45], color: 'red', componentId: 'FUSE_AC' },
      { id: 'AC_SW_IN', label: 'AC IN', pos: [0.6, 2.45, 0.45], color: 'red', componentId: 'SW_AC_PUSH' },
      { id: 'AC_SW_OUT', label: 'AC OUT', pos: [2.0, 2.45, 0.45], color: 'red', componentId: 'SW_AC_PUSH' },
      { id: 'TH_IN', label: 'TH IN', pos: [4.4, 2.45, 0.45], color: 'yellow', componentId: 'THERMOSTAT_AC' },
      { id: 'TH_OUT', label: 'TH OUT', pos: [6.0, 2.45, 0.45], color: 'yellow', componentId: 'THERMOSTAT_AC' },
      { id: 'PS_IN', label: 'PS IN', pos: [8.5, 2.45, 0.45], color: 'blue', componentId: 'PRESSURE_SWITCH' },
      { id: 'PS_OUT', label: 'PS OUT', pos: [10.3, 2.45, 0.45], color: 'blue', componentId: 'PRESSURE_SWITCH' },
      { id: 'R_CL_30', label: '30', pos: [-10.1, -0.37, 0.45], color: 'red', componentId: 'RLY_CLUTCH' },
      { id: 'R_CL_87', label: '87', pos: [-9.1, -0.37, 0.45], color: 'yellow', componentId: 'RLY_CLUTCH' },
      { id: 'R_CL_86', label: '86', pos: [-8.1, -0.37, 0.45], color: 'black', componentId: 'RLY_CLUTCH' },
      { id: 'R_CL_85', label: '85', pos: [-7.1, -0.37, 0.45], color: 'blue', componentId: 'RLY_CLUTCH' },
      { id: 'R_FN_30', label: '30', pos: [-4.3, -0.37, 0.45], color: 'red', componentId: 'RLY_FAN' },
      { id: 'R_FN_87', label: '87', pos: [-3.3, -0.37, 0.45], color: 'yellow', componentId: 'RLY_FAN' },
      { id: 'R_FN_86', label: '86', pos: [-2.3, -0.37, 0.45], color: 'black', componentId: 'RLY_FAN' },
      { id: 'R_FN_85', label: '85', pos: [-1.3, -0.37, 0.45], color: 'blue', componentId: 'RLY_FAN' },
      { id: 'CLUTCH_POS', label: 'CLU (+)', pos: [2.0, -0.37, 0.45], color: 'red', componentId: 'MAG_CLUTCH' },
      { id: 'CLUTCH_GND', label: 'CLU (-)', pos: [4.0, -0.37, 0.45], color: 'black', componentId: 'MAG_CLUTCH' },
      { id: 'FAN_POS', label: 'FAN (+)', pos: [7.8, -0.37, 0.45], color: 'red', componentId: 'EXTRA_FAN' },
      { id: 'FAN_GND', label: 'FAN (-)', pos: [9.8, -0.37, 0.45], color: 'black', componentId: 'EXTRA_FAN' },
      { id: 'BUS31_1', label: '31 (1)', pos: [-4.5, -2.85, 0.45], color: 'black', componentId: 'GND_BUS_31' },
      { id: 'BUS31_2', label: '31 (2)', pos: [-1.5, -2.85, 0.45], color: 'black', componentId: 'GND_BUS_31' },
      { id: 'BUS31_3', label: '31 (3)', pos: [1.5, -2.85, 0.45], color: 'black', componentId: 'GND_BUS_31' },
      { id: 'BUS31_4', label: '31 (4)', pos: [4.5, -2.85, 0.45], color: 'black', componentId: 'GND_BUS_31' },
    ],
    fuses: [
      { key: 'F_AC', inPin: 'FUSE_AC_IN', outPin: 'FUSE_AC_OUT', rating: '15A', blown: false },
    ],
    demoWires: [
      { fromPin: 'BAT_POS', toPin: 'BUS30_1', cableTypeId: 'alligator-red', color: 'red' },
      { fromPin: 'BAT_NEG', toPin: 'BUS31_1', cableTypeId: 'alligator-black', color: 'black' },
      { fromPin: 'BUS30_2', toPin: 'IGN_B', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'IGN_IG', toPin: 'FUSE_AC_IN', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'FUSE_AC_OUT', toPin: 'AC_SW_IN', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'AC_SW_OUT', toPin: 'TH_IN', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'TH_OUT', toPin: 'PS_IN', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'PS_OUT', toPin: 'R_CL_85', cableTypeId: 'jumper-50', color: 'red' },
      { fromPin: 'R_CL_85', toPin: 'R_FN_85', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'R_CL_86', toPin: 'BUS31_2', cableTypeId: 'jumper-25', color: 'black' },
      { fromPin: 'R_FN_86', toPin: 'BUS31_3', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'BUS30_3', toPin: 'R_CL_30', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'R_CL_30', toPin: 'R_FN_30', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'R_CL_87', toPin: 'CLUTCH_POS', cableTypeId: 'jumper-30', color: 'red' },
      { fromPin: 'CLUTCH_GND', toPin: 'BUS31_4', cableTypeId: 'jumper-10', color: 'black' },
      { fromPin: 'R_FN_87', toPin: 'FAN_POS', cableTypeId: 'jumper-30', color: 'red' },
      { fromPin: 'FAN_GND', toPin: 'BUS31_4', cableTypeId: 'jumper-20', color: 'black' },
    ],
    checklist: [
      {
        id: 'step_bat_clutch',
        label: 'Hubungkan Aki 12V (+ ke Bus 30, - ke Bus 31)',
        isDone: (net) => net.areConnected('BAT_POS', 'BUS30_1') && net.areConnected('BAT_NEG', 'BUS31_1'),
      },
      {
        id: 'step_series_safety',
        label: 'Rangkai seri pengaman: Kunci Kontak -> Sekring -> Saklar AC -> Thermostat -> Pressure Switch',
        isDone: (net) =>
          net.areConnected('IGN_IG', 'FUSE_AC_IN') &&
          net.areConnected('FUSE_AC_OUT', 'AC_SW_IN') &&
          net.areConnected('AC_SW_OUT', 'TH_IN') &&
          net.areConnected('TH_OUT', 'PS_IN'),
      },
      {
        id: 'step_relays',
        label: 'Hubungkan Output Pressure Switch ke Koil Relay (85) dan pasang Ground (86)',
        isDone: (net) =>
          net.areConnected('PS_OUT', 'R_CL_85') &&
          net.areConnected('R_CL_86', 'BUS31_2'),
      },
      {
        id: 'step_actuators',
        label: 'Hubungkan Kontak Relay 87 ke Magnetic Clutch (+) dan Extra Fan (+)',
        isDone: (net) =>
          net.areConnected('R_CL_87', 'CLUTCH_POS') &&
          net.areConnected('R_FN_87', 'FAN_POS'),
      },
    ],
  },

  // ----------------------------------------------------------------------------
  // MODUL AC 03: FULL TRAINER AC MOBIL & SIKLUS REFRIGERASI LENGKAP
  // ----------------------------------------------------------------------------
  {
    id: 'ac03',
    figLabel: 'AC 03',
    category: '3. KELISTRIKAN SISTEM AC',
    title: 'Full Trainer AC Mobil & Siklus Refrigerasi R134a',
    subtitle: 'Sistem Terpadu: Blower, Magnetic Clutch, Manifold Gauges, 3 Display Suhu, & Motor Penggerak',
    boardSize: [25.0, 10.4],
    hasAngledConsole: true,
    consoleConfig: {
      hingeY: -2.40,
      hingeZ: 0.225,
      tiltX: -0.78,
      depth: 1.65,
      upperBoardHeight: 7.80,
      upperBoardCenterY: 1.50,
    },
    description:
      'Trainer terlengkap sistem tata udara otomotif. Menggabungkan kelistrikan kontrol (blower 3-speed & magnetic clutch), putaran motor penggerak mesin, kompresor AC nyata, pembacaan dinamis Manifold Gauge Low/High, 3 display suhu digital kabin, dan aliran refrigeran sight glass.',
    components: [
      AC_BATTERY_COMPONENT,
      // --- ROW 1 (y = +4.05, h = 2.30, spans +2.90..+5.20, pins at y = +3.20, z = 0.45) ---
      {
        id: 'PWR_BUS_30',
        type: 'power_rail',
        title: 'Terminal 30 (+12V)',
        pos: [-10.35, 4.05, 0.45],
        size: [2.9, 2.30, 0.4],
      },
      {
        id: 'IGN_SW',
        type: 'ignition',
        title: 'Kunci Kontak',
        pos: [-7.35, 4.05, 0.45],
        size: [2.5, 2.30, 0.4],
        states: ['OFF', 'ACC', 'IG', 'START'],
        defaultState: 'OFF',
      },
      {
        id: 'FUSE_BLOCK_AC',
        type: 'fuse_dual',
        title: 'Sekring (AC 15A & Blower 20A)',
        pos: [-3.95, 4.05, 0.45],
        size: [3.7, 2.30, 0.4],
      },
      {
        id: 'SW_BLOWER',
        type: 'switch_blower_rotary',
        title: 'Saklar Blower',
        pos: [-0.10, 4.05, 0.45],
        size: [3.4, 2.30, 0.4],
        states: ['OFF', 'SPEED_1', 'SPEED_2', 'SPEED_3'],
        defaultState: 'OFF',
      },
      {
        id: 'SW_AC_PUSH',
        type: 'switch_ac_push',
        title: 'Saklar A/C',
        pos: [3.15, 4.05, 0.45],
        size: [2.5, 2.30, 0.4],
        states: ['OFF', 'ON'],
        defaultState: 'OFF',
      },
      {
        id: 'THERMOSTAT_AC',
        type: 'thermostat_ac',
        title: 'Thermostat',
        pos: [6.10, 4.05, 0.45],
        size: [2.8, 2.30, 0.4],
        states: ['ON', 'OFF'],
        defaultState: 'ON',
      },
      {
        id: 'PRESSURE_SWITCH',
        type: 'pressure_switch_dual',
        title: 'Pressure Switch',
        pos: [9.65, 4.05, 0.45],
        size: [3.6, 2.30, 0.4],
        states: ['CLOSED', 'OPEN'],
        defaultState: 'CLOSED',
      },
      // --- ROW 2 (y = +1.45, h = 2.30, spans +0.30..+2.60, pins at y = +0.60, z = 0.45) ---
      {
        id: 'RESISTOR_BLOWER',
        type: 'resistor_blower',
        title: 'Resistor Blower',
        pos: [-8.70, 1.45, 0.45],
        size: [6.2, 2.30, 0.4],
      },
      {
        id: 'RLY_CLUTCH',
        type: 'relay_4p',
        title: 'Relay Clutch',
        pos: [-3.15, 1.45, 0.45],
        size: [4.2, 2.30, 0.4],
      },
      {
        id: 'RLY_FAN',
        type: 'relay_4p',
        title: 'Relay Fan',
        pos: [1.55, 1.45, 0.45],
        size: [4.2, 2.30, 0.4],
      },
      {
        id: 'MOTOR_DRIVE_AC',
        type: 'motor_ac_drive',
        title: 'Motor Penggerak Mesin (Engine Drive)',
        pos: [7.75, 1.45, 0.45],
        size: [7.4, 2.30, 0.4],
        states: ['OFF', 'IDLE_800', 'MED_1500', 'HIGH_2200'],
        defaultState: 'IDLE_800',
      },
      // --- ROW 3 (y = -1.12, h = 2.32, spans -2.28..+0.04, pins at y = -1.96, z = 0.45) ---
      {
        id: 'EVAPORATOR_UNIT',
        type: 'evaporator_unit',
        title: 'Unit Evaporator & Kisi Angin',
        pos: [-7.50, -1.12, 0.45],
        size: [8.6, 2.32, 0.5],
      },
      {
        id: 'MANIFOLD_GAUGE',
        type: 'manifold_gauge_unit',
        title: 'Manifold Gauge Ganda (Low & High)',
        pos: [0.20, -1.12, 0.45],
        size: [6.1, 2.32, 0.5],
      },
      {
        id: 'DIGITAL_TEMP_UNIT',
        type: 'digital_temp_unit',
        title: 'Display Suhu Digital (T1, T2, T3)',
        pos: [7.55, -1.12, 0.45],
        size: [7.8, 2.32, 0.5],
      },
      // --- ROW 4 ANGLED CONSOLE (hinged at y=-2.40, z=0.225, tiltX=-0.78) ---
      {
        id: 'GND_BUS_31',
        type: 'power_rail',
        title: 'Terminal 31 (Ground / Massa)',
        surface: 'console',
        tiltX: -0.78,
        pos: [0.0, -2.95, 0.78],
        size: [8.4, 1.35, 0.4],
      },
    ],
    pins: [
      ...AC_BATTERY_PINS,
      // Row 1 pins (y = +3.20, z = 0.45)
      { id: 'BUS30_1', label: '30 (1)', pos: [-11.05, 3.20, 0.45], color: 'red', componentId: 'PWR_BUS_30' },
      { id: 'BUS30_2', label: '30 (2)', pos: [-10.35, 3.20, 0.45], color: 'red', componentId: 'PWR_BUS_30' },
      { id: 'BUS30_3', label: '30 (3)', pos: [-9.65, 3.20, 0.45], color: 'red', componentId: 'PWR_BUS_30' },
      { id: 'IGN_B', label: 'B', pos: [-7.95, 3.20, 0.45], color: 'red', componentId: 'IGN_SW' },
      { id: 'IGN_IG', label: 'IG', pos: [-6.75, 3.20, 0.45], color: 'blue', componentId: 'IGN_SW' },
      { id: 'F1_IN', label: 'F1 IN', pos: [-5.15, 3.20, 0.45], color: 'red', componentId: 'FUSE_BLOCK_AC' },
      { id: 'F1_OUT', label: 'F1 OUT', pos: [-4.35, 3.20, 0.45], color: 'red', componentId: 'FUSE_BLOCK_AC' },
      { id: 'F2_IN', label: 'F2 IN', pos: [-3.55, 3.20, 0.45], color: 'red', componentId: 'FUSE_BLOCK_AC' },
      { id: 'F2_OUT', label: 'F2 OUT', pos: [-2.75, 3.20, 0.45], color: 'red', componentId: 'FUSE_BLOCK_AC' },
      { id: 'BLW_SW_B', label: 'B', pos: [-1.15, 3.20, 0.45], color: 'red', componentId: 'SW_BLOWER' },
      { id: 'BLW_SW_1', label: '1', pos: [-0.45, 3.20, 0.45], color: 'yellow', componentId: 'SW_BLOWER' },
      { id: 'BLW_SW_2', label: '2', pos: [0.25, 3.20, 0.45], color: 'yellow', componentId: 'SW_BLOWER' },
      { id: 'BLW_SW_3', label: '3', pos: [0.95, 3.20, 0.45], color: 'yellow', componentId: 'SW_BLOWER' },
      { id: 'AC_SW_IN', label: 'AC IN', pos: [2.55, 3.20, 0.45], color: 'red', componentId: 'SW_AC_PUSH' },
      { id: 'AC_SW_OUT', label: 'AC OUT', pos: [3.75, 3.20, 0.45], color: 'red', componentId: 'SW_AC_PUSH' },
      { id: 'TH_IN', label: 'TH IN', pos: [5.45, 3.20, 0.45], color: 'yellow', componentId: 'THERMOSTAT_AC' },
      { id: 'TH_OUT', label: 'TH OUT', pos: [6.75, 3.20, 0.45], color: 'yellow', componentId: 'THERMOSTAT_AC' },
      { id: 'PS_IN', label: 'PS IN', pos: [8.95, 3.20, 0.45], color: 'blue', componentId: 'PRESSURE_SWITCH' },
      { id: 'PS_OUT', label: 'PS OUT', pos: [10.35, 3.20, 0.45], color: 'blue', componentId: 'PRESSURE_SWITCH' },
      // Row 2 pins (y = +0.60, z = 0.45)
      { id: 'RES_IN', label: 'OUT', pos: [-10.5, 0.60, 0.45], color: 'red', componentId: 'RESISTOR_BLOWER' },
      { id: 'RES_LOW', label: 'L', pos: [-9.3, 0.60, 0.45], color: 'yellow', componentId: 'RESISTOR_BLOWER' },
      { id: 'RES_MED', label: 'M', pos: [-8.1, 0.60, 0.45], color: 'yellow', componentId: 'RESISTOR_BLOWER' },
      { id: 'RES_HIGH', label: 'H', pos: [-6.9, 0.60, 0.45], color: 'yellow', componentId: 'RESISTOR_BLOWER' },
      { id: 'R_CL_30', label: '30', pos: [-4.35, 0.60, 0.45], color: 'red', componentId: 'RLY_CLUTCH' },
      { id: 'R_CL_87', label: '87', pos: [-3.55, 0.60, 0.45], color: 'yellow', componentId: 'RLY_CLUTCH' },
      { id: 'R_CL_86', label: '86', pos: [-2.75, 0.60, 0.45], color: 'black', componentId: 'RLY_CLUTCH' },
      { id: 'R_CL_85', label: '85', pos: [-1.95, 0.60, 0.45], color: 'blue', componentId: 'RLY_CLUTCH' },
      { id: 'R_FN_30', label: '30', pos: [0.35, 0.60, 0.45], color: 'red', componentId: 'RLY_FAN' },
      { id: 'R_FN_87', label: '87', pos: [1.15, 0.60, 0.45], color: 'yellow', componentId: 'RLY_FAN' },
      { id: 'R_FN_86', label: '86', pos: [1.95, 0.60, 0.45], color: 'black', componentId: 'RLY_FAN' },
      { id: 'R_FN_85', label: '85', pos: [2.75, 0.60, 0.45], color: 'blue', componentId: 'RLY_FAN' },
      // Row 3 pins (y = -1.96, z = 0.45) — shifted clear of left tabletop battery
      { id: 'MTR_BLW_POS', label: 'BLW (+)', pos: [-7.0, -1.96, 0.45], color: 'red', componentId: 'EVAPORATOR_UNIT' },
      { id: 'MTR_BLW_GND', label: 'BLW (-)', pos: [-5.2, -1.96, 0.45], color: 'black', componentId: 'EVAPORATOR_UNIT' },
      { id: 'CLUTCH_POS', label: 'CLU (+)', pos: [-0.7, -1.96, 0.45], color: 'red', componentId: 'MANIFOLD_GAUGE' },
      { id: 'CLUTCH_GND', label: 'CLU (-)', pos: [1.1, -1.96, 0.45], color: 'black', componentId: 'MANIFOLD_GAUGE' },
      { id: 'FAN_POS', label: 'FAN (+)', pos: [6.55, -1.96, 0.45], color: 'red', componentId: 'DIGITAL_TEMP_UNIT' },
      { id: 'FAN_GND', label: 'FAN (-)', pos: [8.55, -1.96, 0.45], color: 'black', componentId: 'DIGITAL_TEMP_UNIT' },
      // Row 4 Angled Console Ground Bus pins
      { id: 'BUS31_1', label: '31 (1)', pos: [-2.7, -3.22, 1.08], color: 'black', componentId: 'GND_BUS_31', surface: 'console', tiltX: -0.78 },
      { id: 'BUS31_2', label: '31 (2)', pos: [-0.9, -3.22, 1.08], color: 'black', componentId: 'GND_BUS_31', surface: 'console', tiltX: -0.78 },
      { id: 'BUS31_3', label: '31 (3)', pos: [0.9, -3.22, 1.08], color: 'black', componentId: 'GND_BUS_31', surface: 'console', tiltX: -0.78 },
      { id: 'BUS31_4', label: '31 (4)', pos: [2.7, -3.22, 1.08], color: 'black', componentId: 'GND_BUS_31', surface: 'console', tiltX: -0.78 },
    ],
    fuses: [
      { key: 'F1', inPin: 'F1_IN', outPin: 'F1_OUT', rating: '15A', blown: false },
      { key: 'F2', inPin: 'F2_IN', outPin: 'F2_OUT', rating: '20A', blown: false },
    ],
    demoWires: [
      { fromPin: 'BAT_POS', toPin: 'BUS30_1', cableTypeId: 'alligator-red', color: 'red' },
      { fromPin: 'BAT_NEG', toPin: 'BUS31_1', cableTypeId: 'alligator-black', color: 'black' },
      { fromPin: 'BUS30_2', toPin: 'IGN_B', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'IGN_IG', toPin: 'F1_IN', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'F1_IN', toPin: 'F2_IN', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'F2_OUT', toPin: 'BLW_SW_B', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'BLW_SW_1', toPin: 'RES_LOW', cableTypeId: 'jumper-30', color: 'red' },
      { fromPin: 'BLW_SW_2', toPin: 'RES_MED', cableTypeId: 'jumper-30', color: 'red' },
      { fromPin: 'BLW_SW_3', toPin: 'RES_HIGH', cableTypeId: 'jumper-30', color: 'red' },
      { fromPin: 'RES_IN', toPin: 'MTR_BLW_POS', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'MTR_BLW_GND', toPin: 'BUS31_2', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'F1_OUT', toPin: 'AC_SW_IN', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'AC_SW_OUT', toPin: 'TH_IN', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'TH_OUT', toPin: 'PS_IN', cableTypeId: 'jumper-10', color: 'red' },
      { fromPin: 'PS_OUT', toPin: 'R_CL_85', cableTypeId: 'jumper-50', color: 'red' },
      { fromPin: 'R_CL_85', toPin: 'R_FN_85', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'R_CL_86', toPin: 'BUS31_3', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'R_FN_86', toPin: 'BUS31_4', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'BUS30_3', toPin: 'R_CL_30', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'R_CL_30', toPin: 'R_FN_30', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'R_CL_87', toPin: 'CLUTCH_POS', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'CLUTCH_GND', toPin: 'BUS31_1', cableTypeId: 'jumper-20', color: 'black' },
      { fromPin: 'R_FN_87', toPin: 'FAN_POS', cableTypeId: 'jumper-20', color: 'red' },
      { fromPin: 'FAN_GND', toPin: 'BUS31_4', cableTypeId: 'jumper-20', color: 'black' },
    ],
    checklist: [
      {
        id: 'step_bat_full',
        label: 'Hubungkan Aki 12V (+ ke Bus 30, - ke Bus 31)',
        isDone: (net) => net.areConnected('BAT_POS', 'BUS30_1') && net.areConnected('BAT_NEG', 'BUS31_1'),
      },
      {
        id: 'step_blower_full',
        label: 'Rangkai kelistrikan Blower 3-kecepatan (Kunci Kontak -> Sekring F2 -> Saklar Blower -> Resistor -> Motor)',
        isDone: (net) =>
          net.areConnected('IGN_IG', 'F2_IN') &&
          net.areConnected('F2_OUT', 'BLW_SW_B') &&
          net.areConnected('RES_IN', 'MTR_BLW_POS'),
      },
      {
        id: 'step_clutch_full',
        label: 'Rangkai kelistrikan AC & Pengaman (Sekring F1 -> Saklar AC -> Thermostat -> Pressure Switch -> Relay)',
        isDone: (net) =>
          net.areConnected('F1_OUT', 'AC_SW_IN') &&
          net.areConnected('AC_SW_OUT', 'TH_IN') &&
          net.areConnected('TH_OUT', 'PS_IN') &&
          net.areConnected('PS_OUT', 'R_CL_85'),
      },
      {
        id: 'step_actuators_full',
        label: 'Hubungkan Output Relay (87) ke Magnetic Clutch Kompresor dan Extra Fan Kondensor',
        isDone: (net) =>
          net.areConnected('R_CL_87', 'CLUTCH_POS') &&
          net.areConnected('R_FN_87', 'FAN_POS'),
      },
    ],
  },
];

export function getModuleById(id) {
  return MODULES.find((m) => m.id === id) || MODULES[0];
}
