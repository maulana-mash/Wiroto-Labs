import { CABLE_TYPES, CableManager } from './core/cableEngine.js';
import { MODULES, getModuleById } from './core/modulesData.js';
import { CircuitSolver } from './core/circuitSolver.js';
import { SoundEngine } from './audio/soundEngine.js';
import { TrainerScene3D } from './scene/trainerScene3D.js';
import { ComponentInspector3D, INSPECTOR_COMPONENTS } from './scene/componentInspector3D.js';
import { MULTIMETER_MODES, MultimeterEngine } from './core/multimeterEngine.js';

// Short sidebar group names (full category text stays in module data)
const GROUP_SHORT = {
  '1. DASAR KELISTRIKAN OTOMOTIF': '1. Dasar Kelistrikan',
  '2. KELISTRIKAN BODI OTOMOTIF': '2. Kelistrikan Bodi',
  '3. KELISTRIKAN SISTEM AC': '3. Sistem AC Mobil',
};

// Short titles for the sidebar list
const NAV_TITLE = {
  fig00: 'Dasar & Multimeter',
  fig01: 'Sekring & Beban',
  fig02: 'Relay & Klakson',
  fig03: 'Lampu Kota & Rem',
  fig04: 'Lampu Kepala',
  fig05: 'Sein & Hazard',
  fig06: 'Full Trainer Bodi',
  ac01: 'Kelistrikan Blower',
  ac02: 'Kelistrikan Clutch',
  ac03: 'Full Trainer AC',
};

class AutomotiveBenchApp {
  constructor() {
    this.activeModule = MODULES[0];
    this.cableManager = new CableManager(this.activeModule.pins);
    this.solver = new CircuitSolver(this.activeModule);
    this.sound = new SoundEngine();
    this.multimeter = new MultimeterEngine();
    this.activeProbePicking = null; // 'red' | 'black' | null

    this.selectedCableTypeId = 'jumper-20';
    this.selectedWireColor = 'red';
    this.selectedStartPin = null;

    this.prevRelayStates = {};
    this.prevFlasherBlink = false;
    this.prevChecklistKey = '';
    this.toastTimer = null;

    this._cacheDom();
    this._initScene();
    this._renderSidebar();
    this._renderWireRack();
    this._bindControls();
    this.selectModule(this.activeModule.id);
    this._startLoop();
  }

  _cacheDom() {
    const $ = (id) => document.getElementById(id);
    this.elModuleNav = $('module-nav-list');
    this.elFigBadge = $('active-fig-badge');
    this.elModuleTitle = $('active-module-title');
    this.elModuleDesc = $('module-description-text');
    this.elStatusBattery = $('status-battery');
    this.elStatusFuse = $('status-fuse');
    this.elChecklistCounter = $('checklist-counter');
    this.elChecklistUl = $('wiring-checklist-ul');
    this.elSwitchesList = $('switches-control-list');
    this.elWireRackItems = $('wire-rack-items');
    this.elToast = $('hud-toast');
    this.elToastText = $('hud-text');
    this.elPinTooltip = $('pin-hover-tooltip');
    this.elBtnCancelPin = $('btn-cancel-pin');
    this.elBtnColorRed = $('btn-color-red');
    this.elBtnColorBlack = $('btn-color-black');
    this.elStepsToggle = $('btn-steps-toggle');
    this.elStepsBody = $('steps-body');

    // Toolbox tabs and panels
    this.elTabWires = $('tab-btn-wires');
    this.elTabMeter = $('tab-btn-meter');
    this.elPanelWires = $('toolbox-panel-wires');
    this.elPanelMeter = $('toolbox-panel-meter');
    this.elBtnToggleDmm = $('btn-toggle-multimeter');

    // Multimeter HUD and toolbox controls
    this.elDmmHud = $('multimeter-hud');
    this.elLabelToggleHud = $('label-toggle-hud');
    this.elBtnToolToggleHud = $('btn-tool-toggle-hud');
    this.elBtnToolRedProbe = $('btn-tool-red-probe');
    this.elBtnToolBlackProbe = $('btn-tool-black-probe');
    this.elLabelRedProbe = $('label-red-probe');
    this.elLabelBlackProbe = $('label-black-probe');
    this.elBtnToolClearProbes = $('btn-tool-clear-probes');
    this.elBtnDmmMinimize = $('btn-dmm-minimize');
    this.elBtnDmmClose = $('btn-dmm-close');
    this.elDmmDigits = $('dmm-lcd-digits');
    this.elDmmUnit = $('dmm-lcd-unit');
    this.elDmmSignMinus = $('dmm-sign-minus');
    this.elDmmContIcon = $('dmm-cont-icon');
    this.elDmmModeInd = $('dmm-mode-ind');
    this.elDmmRedPinName = $('dmm-red-pin-name');
    this.elDmmBlackPinName = $('dmm-black-pin-name');
    this.elBtnDmmPickRed = $('btn-dmm-pick-red');
    this.elBtnDmmPickBlack = $('btn-dmm-pick-black');
    this.elBtnDmmResetProbes = $('btn-dmm-reset-probes');

    // Manifold Gauge & AC Telemetry HUD (Bottom-Left)
    this.elManifoldHud = $('manifold-hud');
    this.elBtnToggleManifold = $('btn-toggle-manifold');
    this.elBtnMfgMinimize = $('btn-mfg-minimize');
    this.elBtnMfgClose = $('btn-mfg-close');
    this.elMfgStatusPill = $('mfg-status-pill');
    this.elMfgNeedleLow = $('mfg-needle-low');
    this.elMfgNeedleHigh = $('mfg-needle-high');
    this.elMfgLowPsi = $('mfg-low-psi');
    this.elMfgLowBar = $('mfg-low-bar');
    this.elMfgHighPsi = $('mfg-high-psi');
    this.elMfgHighBar = $('mfg-high-bar');
    this.elMfgSightDot = $('mfg-sight-dot');
    this.elMfgSightState = $('mfg-sight-state');
    this.elMfgRpmVal = $('mfg-rpm-val');
    this.elMfgTempT1 = $('mfg-temp-t1');
    this.elMfgTempT2 = $('mfg-temp-t2');
    this.elMfgTempT3 = $('mfg-temp-t3');
  }

  _initScene() {
    this.scene3D = new TrainerScene3D({
      container: document.getElementById('scene-canvas-container'),
      onPinClick: (pin) => this.handlePinClick(pin),
      onPinHover: (info) => this.handlePinHover(info),
      onComponentInteract: (compId) => this.cycleComponentSwitch(compId),
      onComponentPressStart: (compId) => this.handleComponentPressStart(compId),
      onComponentPressEnd: (compId) => this.handleComponentPressEnd(compId),
      onCableClick: (cableId) => this.removeCableById(cableId),
      onRightClickCancel: () => this.clearSelectedPin(),
    });
  }

  _renderSidebar() {
    this.elModuleNav.innerHTML = '';
    let lastGroup = null;
    for (const mod of MODULES) {
      if (mod.category !== lastGroup) {
        lastGroup = mod.category;
        const g = document.createElement('div');
        g.className = 'nav-group';
        g.textContent = GROUP_SHORT[mod.category] || mod.category;
        this.elModuleNav.appendChild(g);
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-item';
      btn.dataset.moduleId = mod.id;
      btn.title = mod.title;
      const numLabel = mod.id.startsWith('ac') ? mod.id.toUpperCase() : mod.id.replace('fig', '');
      btn.innerHTML = `
        <span class="nav-num">${numLabel}</span>
        <span class="nav-title">${NAV_TITLE[mod.id] || mod.title}</span>
      `;
      btn.addEventListener('click', () => this.selectModule(mod.id));
      this.elModuleNav.appendChild(btn);
    }
  }

  _renderWireRack() {
    this.elWireRackItems.innerHTML = '';
    const specs = Object.values(CABLE_TYPES);
    let addedDivider = false;

    for (const spec of specs) {
      if (spec.hiddenFromTray) continue;
      if (spec.category === 'jumper' && !addedDivider) {
        const d = document.createElement('div');
        d.className = 'tray-divider';
        this.elWireRackItems.appendChild(d);
        addedDivider = true;
      }
      const isAlligator = spec.category === 'alligator';
      const color = isAlligator ? spec.defaultColor : this.selectedWireColor;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `tray-item ${spec.id === this.selectedCableTypeId ? 'is-selected' : ''}`;
      btn.title = spec.description;
      btn.innerHTML = `
        <span class="tray-swatch" style="background:${color === 'red' ? '#d93829' : '#23272b'}"></span>
        <span>${isAlligator ? spec.shortLabel : spec.shortLabel}</span>
      `;
      btn.addEventListener('click', () => {
        this.selectedCableTypeId = spec.id;
        if (isAlligator) {
          this.selectedWireColor = spec.defaultColor;
          this._syncColorButtons();
        }
        this._renderWireRack();
      });
      this.elWireRackItems.appendChild(btn);
    }
  }

  _syncColorButtons() {
    this.elBtnColorRed.classList.toggle('is-active', this.selectedWireColor === 'red');
    this.elBtnColorBlack.classList.toggle('is-active', this.selectedWireColor === 'black');
  }

  _syncProbeButtons() {
    const redPin = this.multimeter?.redPin;
    const blackPin = this.multimeter?.blackPin;

    if (this.elLabelRedProbe) {
      this.elLabelRedProbe.textContent = redPin ? `Probe (+): ${redPin}` : 'Probe (+): Pasang';
    }
    if (this.elLabelBlackProbe) {
      this.elLabelBlackProbe.textContent = blackPin ? `Probe (COM): ${blackPin}` : 'Probe (COM): Pasang';
    }

    if (this.elDmmRedPinName) {
      this.elDmmRedPinName.textContent = redPin || 'Lepas';
      this.elDmmRedPinName.classList.toggle('is-empty', !redPin);
    }
    if (this.elDmmBlackPinName) {
      this.elDmmBlackPinName.textContent = blackPin || 'Lepas';
      this.elDmmBlackPinName.classList.toggle('is-empty', !blackPin);
    }

    if (this.elBtnToolRedProbe) {
      this.elBtnToolRedProbe.classList.toggle('is-picking', this.activeProbePicking === 'red');
    }
    if (this.elBtnToolBlackProbe) {
      this.elBtnToolBlackProbe.classList.toggle('is-picking', this.activeProbePicking === 'black');
    }
    if (this.elBtnDmmPickRed) {
      this.elBtnDmmPickRed.classList.toggle('is-active', this.activeProbePicking === 'red');
    }
    if (this.elBtnDmmPickBlack) {
      this.elBtnDmmPickBlack.classList.toggle('is-active', this.activeProbePicking === 'black');
    }
  }

  _setWireColor(color) {
    this.selectedWireColor = color;
    if (this.selectedCableTypeId.startsWith('alligator-')) {
      this.selectedCableTypeId = color === 'red' ? 'alligator-red' : 'alligator-black';
    }
    this._syncColorButtons();
    this._renderWireRack();
  }

  _bindControls() {
    const $ = (id) => document.getElementById(id);

    $('btn-clear-wires').addEventListener('click', () => {
      this.cableManager.clearAll();
      this.clearSelectedPin();
      this._syncAfterWireChange();
      this.toast('Semua kabel dilepas.');
    });

    $('btn-auto-wire').addEventListener('click', () => {
      this.cableManager.clearAll();
      this.solver.resetFuses();
      this.clearSelectedPin();
      for (const w of this.activeModule.demoWires || []) this.cableManager.addCable(w);
      this.sound.playPlugSnap(false);
      this._syncAfterWireChange();
      this.toast('Contoh rangkaian terpasang. Coba operasikan saklar.', 'ready');
    });

    $('btn-reset-fuses').addEventListener('click', () => {
      this.solver.resetFuses();
      this.toast('Sekring diganti baru.', 'ready');
    });

    const btnExplode = $('btn-exploded-view');
    btnExplode.addEventListener('click', () => {
      const next = !this.scene3D.explodedView;
      this.scene3D.setExplodedView(next);
      btnExplode.classList.toggle('is-active', next);
      btnExplode.setAttribute('aria-pressed', String(next));
    });

    const btnEnvToggle = $('btn-env-toggle');
    const envMenu = $('env-menu');
    const envLabel = $('env-active-label');
    if (btnEnvToggle && envMenu) {
      btnEnvToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = envMenu.hidden;
        envMenu.hidden = !open;
        btnEnvToggle.setAttribute('aria-expanded', String(open));
      });
      document.querySelectorAll('.env-option').forEach((opt) => {
        opt.addEventListener('click', () => {
          const preset = opt.dataset.env;
          document.querySelectorAll('.env-option').forEach((b) => b.classList.remove('is-active'));
          opt.classList.add('is-active');
          if (envLabel) envLabel.textContent = opt.textContent;
          envMenu.hidden = true;
          btnEnvToggle.setAttribute('aria-expanded', 'false');
          this.scene3D.setEnvironmentPreset(preset);
          this.toast(`Suasana: ${opt.textContent}`);
        });
      });
      window.addEventListener('click', () => {
        if (!envMenu.hidden) {
          envMenu.hidden = true;
          btnEnvToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    document.querySelectorAll('[data-cam]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-cam]').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        this.scene3D.setCameraPreset(btn.dataset.cam);
      });
    });

    const btnLabels = $('btn-toggle-labels');
    btnLabels.addEventListener('click', () => {
      const next = !this.scene3D.labelsVisible;
      this.scene3D.setLabelsVisible(next);
      btnLabels.classList.toggle('is-active', next);
    });

    const btnBoardTheme = $('btn-board-theme');
    if (btnBoardTheme) {
      this.boardThemes = [
        { hex: '#e8c56b', name: 'Papan Kuning SMK (Ref. Foto 1 & 4)' },
        { hex: '#f4f6f9', name: 'Papan Putih SMK (Ref. Foto 2 & 3)' },
        { hex: '#f2ece1', name: 'Papan Krem Studio' },
      ];
      this.boardThemeIdx = 0;
      btnBoardTheme.addEventListener('click', () => {
        this.boardThemeIdx = (this.boardThemeIdx + 1) % this.boardThemes.length;
        const theme = this.boardThemes[this.boardThemeIdx];
        this.scene3D.setBoardTheme(theme.hex);
        this.toast(`Tema Papan: ${theme.name}`);
      });
    }

    const btnToolboxMin = $('btn-toolbox-minimize');
    const toolboxTray = $('toolbox-tray');
    if (btnToolboxMin && toolboxTray) {
      btnToolboxMin.addEventListener('click', () => {
        const collapsed = toolboxTray.classList.toggle('is-minimized');
        btnToolboxMin.setAttribute('aria-expanded', String(!collapsed));
      });
    }

    this.elBtnColorRed.addEventListener('click', () => this._setWireColor('red'));
    this.elBtnColorBlack.addEventListener('click', () => this._setWireColor('black'));

    const btnLofi = $('btn-toggle-lofi');
    btnLofi.addEventListener('click', () => {
      const next = !this.sound.lofiEnabled;
      this.sound.setLofiEnabled(next);
      btnLofi.classList.toggle('is-active', next);
      btnLofi.setAttribute('aria-pressed', String(next));
    });

    const btnSfx = $('btn-toggle-sfx');
    btnSfx.addEventListener('click', () => {
      const next = !this.sound.effectsEnabled;
      this.sound.setEffectsEnabled(next);
      btnSfx.classList.toggle('is-active', next);
      btnSfx.setAttribute('aria-pressed', String(next));
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sound.setHornActive(false);
        this.sound.setBoardBuzzerActive(false);
        this.sound.setBlowerSpeed(0);
        this.sound.setEffectsEnabled(false);
      } else {
        const effectsOn = btnSfx.classList.contains('is-active');
        this.sound.setEffectsEnabled(effectsOn);
      }
    });

    this.elStepsToggle.addEventListener('click', () => {
      const open = this.elStepsBody.hidden;
      this.elStepsBody.hidden = !open;
      this.elStepsToggle.setAttribute('aria-expanded', String(open));
    });

    // ------------------------------------------------------------------------
    // TOOLBOX TABS (KABEL vs MULTIMETER)
    // ------------------------------------------------------------------------
    if (this.elTabWires && this.elTabMeter) {
      this.elTabWires.addEventListener('click', () => {
        this.elTabWires.classList.add('is-active');
        this.elTabWires.setAttribute('aria-selected', 'true');
        this.elTabMeter.classList.remove('is-active');
        this.elTabMeter.setAttribute('aria-selected', 'false');
        if (this.elPanelWires) this.elPanelWires.hidden = false;
        if (this.elPanelMeter) this.elPanelMeter.hidden = true;
      });
      this.elTabMeter.addEventListener('click', () => {
        this.elTabMeter.classList.add('is-active');
        this.elTabMeter.setAttribute('aria-selected', 'true');
        this.elTabWires.classList.remove('is-active');
        this.elTabWires.setAttribute('aria-selected', 'false');
        if (this.elPanelMeter) this.elPanelMeter.hidden = false;
        if (this.elPanelWires) this.elPanelWires.hidden = true;
      });
    }

    // ------------------------------------------------------------------------
    // MULTIMETER CONTROLS & HUD INTERACTIONS
    // ------------------------------------------------------------------------
    if (this.elDmmHud) {
      this.elDmmHud.hidden = true;
      this.elDmmHud.classList.add('is-hidden');
    }
    if (this.elLabelToggleHud) this.elLabelToggleHud.textContent = 'Buka HUD';

    const toggleDmmHud = () => {
      if (!this.elDmmHud) return;
      const isHidden = this.elDmmHud.hidden || this.elDmmHud.classList.contains('is-hidden');
      this.elDmmHud.hidden = !isHidden;
      this.elDmmHud.classList.toggle('is-hidden', !isHidden);
      this.multimeter.setHudVisible(isHidden);
      if (this.elBtnToggleDmm) this.elBtnToggleDmm.classList.toggle('is-active', isHidden);
      if (this.elLabelToggleHud) this.elLabelToggleHud.textContent = isHidden ? 'Tutup HUD' : 'Buka HUD';
      this.sound.playToggleClick();
    };

    if (this.elBtnToggleDmm) this.elBtnToggleDmm.addEventListener('click', toggleDmmHud);
    if (this.elBtnToolToggleHud) this.elBtnToolToggleHud.addEventListener('click', toggleDmmHud);

    if (this.elBtnDmmMinimize) {
      this.elBtnDmmMinimize.addEventListener('click', () => {
        const minimized = this.multimeter.toggleMinimize();
        if (this.elDmmHud) this.elDmmHud.classList.toggle('is-minimized', minimized);
      });
    }

    if (this.elBtnDmmClose) {
      this.elBtnDmmClose.addEventListener('click', () => {
        if (this.elDmmHud) {
          this.elDmmHud.hidden = true;
          this.elDmmHud.classList.add('is-hidden');
        }
        this.multimeter.setHudVisible(false);
        if (this.elBtnToggleDmm) this.elBtnToggleDmm.classList.remove('is-active');
        if (this.elLabelToggleHud) this.elLabelToggleHud.textContent = 'Buka HUD';
      });
    }

    // Manifold Gauge & AC Telemetry HUD Controls
    const setManifoldHudVisible = (visible) => {
      if (!this.elManifoldHud) return;
      this.elManifoldHud.hidden = !visible;
      this.elManifoldHud.classList.toggle('is-hidden', !visible);
      if (this.elBtnToggleManifold) {
        this.elBtnToggleManifold.classList.toggle('is-active', visible);
      }
    };
    this._setManifoldHudVisible = setManifoldHudVisible;

    if (this.elBtnToggleManifold) {
      this.elBtnToggleManifold.addEventListener('click', () => {
        const isHidden = !this.elManifoldHud || this.elManifoldHud.hidden || this.elManifoldHud.classList.contains('is-hidden');
        setManifoldHudVisible(isHidden);
        this.sound.playToggleClick();
      });
    }

    if (this.elBtnMfgMinimize) {
      this.elBtnMfgMinimize.addEventListener('click', () => {
        if (!this.elManifoldHud) return;
        this.elManifoldHud.classList.toggle('is-minimized');
        this.sound.playToggleClick();
      });
    }

    if (this.elBtnMfgClose) {
      this.elBtnMfgClose.addEventListener('click', () => {
        setManifoldHudVisible(false);
        this.sound.playToggleClick();
      });
    }

    // Dial Mode Selector Buttons
    document.querySelectorAll('[data-dmm-mode]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.dmmMode;
        this.multimeter.setMode(mode);
        document.querySelectorAll('[data-dmm-mode]').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        this.sound.playToggleClick();
      });
    });

    // Probe Picker Activation
    const startProbePick = (color) => {
      if (this.activeProbePicking === color) {
        this.activeProbePicking = null;
        this.toast('Batal memilih pin probe.');
      } else {
        this.activeProbePicking = color;
        this.toast(`Klik pin terminal untuk Probe ${color === 'red' ? 'Merah (+)' : 'Hitam (COM)'}...`);
      }
      this._syncProbeButtons();
    };

    if (this.elBtnToolRedProbe) this.elBtnToolRedProbe.addEventListener('click', () => startProbePick('red'));
    if (this.elBtnToolBlackProbe) this.elBtnToolBlackProbe.addEventListener('click', () => startProbePick('black'));
    if (this.elBtnDmmPickRed) this.elBtnDmmPickRed.addEventListener('click', () => startProbePick('red'));
    if (this.elBtnDmmPickBlack) this.elBtnDmmPickBlack.addEventListener('click', () => startProbePick('black'));

    const clearProbes = () => {
      this.multimeter.clearProbes();
      this.activeProbePicking = null;
      this._syncProbeButtons();
      this.toast('Kedua probe multimeter dilepas.');
      this.sound.playPlugSnap(false);
    };
    if (this.elBtnToolClearProbes) this.elBtnToolClearProbes.addEventListener('click', clearProbes);
    if (this.elBtnDmmResetProbes) this.elBtnDmmResetProbes.addEventListener('click', clearProbes);

    this._initInspectorPanel();

    this.elBtnCancelPin.addEventListener('click', () => this.clearSelectedPin());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = document.getElementById('inspector-modal');
        if (modal && !modal.hidden) {
          this._setInspectorOpen(false);
        } else {
          this.clearSelectedPin();
        }
      }
    });
  }

  _ensureInspector3D() {
    if (this.inspector3D) return this.inspector3D;
    const $ = (id) => document.getElementById(id);
    const stageContainer = $('inspector-stage-container');
    if (!stageContainer) return null;

    this.inspector3D = new ComponentInspector3D({
      stageContainer,
      onViewChange: (viewName, labelText) => {
        const badge = $('inspector-view-badge');
        if (badge) badge.textContent = labelText;
        document.querySelectorAll('[data-insp-view]').forEach((b) => {
          b.classList.toggle('is-active', b.dataset.inspView === viewName);
        });
      },
    });
    if (this.activeInspectorCompId) {
      this.inspector3D.loadComponent(this.activeInspectorCompId);
    }
    return this.inspector3D;
  }

  _initInspectorPanel() {
    const $ = (id) => document.getElementById(id);
    const modal = $('inspector-modal');
    const btnOpen = $('btn-open-guide-3d');
    const btnClose = $('btn-close-inspector');
    const tabsWrap = $('inspector-comp-tabs');
    const stageContainer = $('inspector-stage-container');
    if (!modal || !btnOpen || !stageContainer) return;

    this.inspector3D = null;
    this.activeInspectorCategory = 'bodi';
    this.activeInspectorCompId = 'headlamp';

    const renderCategoryTabs = (cat) => {
      this.activeInspectorCategory = cat;
      document.querySelectorAll('[data-insp-cat]').forEach((b) => {
        b.classList.toggle('is-active', b.dataset.inspCat === cat);
      });
      tabsWrap.innerHTML = '';
      const filtered = INSPECTOR_COMPONENTS.filter((c) => (c.category || 'bodi') === cat);
      for (const item of filtered) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'insp-tab-btn';
        b.dataset.compId = item.id;
        b.textContent = item.title.split(' (')[0];
        b.addEventListener('click', () => this._selectInspectorComponent(item.id));
        tabsWrap.appendChild(b);
      }
      if (filtered.length > 0 && !filtered.some((c) => c.id === this.activeInspectorCompId)) {
        this._selectInspectorComponent(filtered[0].id);
      } else {
        document.querySelectorAll('.insp-tab-btn').forEach((b) => {
          b.classList.toggle('is-active', b.dataset.compId === this.activeInspectorCompId);
        });
      }
    };
    this._renderInspectorCategoryTabs = renderCategoryTabs;

    document.querySelectorAll('[data-insp-cat]').forEach((btn) => {
      btn.addEventListener('click', () => renderCategoryTabs(btn.dataset.inspCat));
    });

    renderCategoryTabs('bodi');

    btnOpen.addEventListener('click', () => {
      const next = modal.hidden;
      if (next && this.activeModule?.id?.startsWith('ac') && this.activeInspectorCategory !== 'ac') {
        renderCategoryTabs('ac');
      }
      this._setInspectorOpen(next);
    });

    if (btnClose) {
      btnClose.addEventListener('click', () => this._setInspectorOpen(false));
    }

    document.querySelectorAll('[data-insp-view]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this._ensureInspector3D()?.setView(btn.dataset.inspView);
      });
    });

    const scaleInput = $('insp-scale-range');
    const scaleVal = $('insp-scale-val');
    if (scaleInput) {
      scaleInput.addEventListener('input', (e) => {
        const v = Number(e.target.value);
        this._ensureInspector3D()?.setScale(v);
        if (scaleVal) scaleVal.textContent = `${v.toFixed(2)}×`;
      });
    }

    const lensInput = $('insp-lens-range');
    const lensVal = $('insp-lens-val');
    if (lensInput) {
      lensInput.addEventListener('input', (e) => {
        const v = Number(e.target.value);
        this._ensureInspector3D()?.setLensOpacity(v);
        if (lensVal) lensVal.textContent = v.toFixed(2);
      });
    }

    const chkExplode = $('insp-chk-explode');
    if (chkExplode) {
      chkExplode.addEventListener('change', (e) => this._ensureInspector3D()?.setExploded(e.target.checked));
    }

    const chkWire = $('insp-chk-wire');
    if (chkWire) {
      chkWire.addEventListener('change', (e) => this._ensureInspector3D()?.setWireframe(e.target.checked));
    }

    const chkLabels = $('insp-chk-labels');
    if (chkLabels) {
      chkLabels.addEventListener('change', (e) => this._ensureInspector3D()?.setLabelsVisible(e.target.checked));
    }

    this._selectInspectorComponent('headlamp');
  }

  _setInspectorOpen(open) {
    const modal = document.getElementById('inspector-modal');
    const btnOpen = document.getElementById('btn-open-guide-3d');
    if (!modal) return;
    modal.hidden = !open;
    if (btnOpen) btnOpen.classList.toggle('is-active', open);
    if (open) {
      this._ensureInspector3D()?.open();
    } else {
      this.inspector3D?.close();
    }
  }

  _selectInspectorComponent(compId) {
    const spec = INSPECTOR_COMPONENTS.find((c) => c.id === compId) || INSPECTOR_COMPONENTS[0];
    this.activeInspectorCompId = spec.id;
    document.querySelectorAll('.insp-tab-btn').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.compId === spec.id);
    });

    const $ = (id) => document.getElementById(id);
    if ($('inspector-active-title')) $('inspector-active-title').textContent = spec.title;
    if ($('inspector-active-subtitle')) $('inspector-active-subtitle').textContent = spec.subtitle;

    const dimBox = $('inspector-dimensions-box');
    if (dimBox) {
      dimBox.innerHTML = `
        <div><b>Lebar:</b> ${spec.dimensions.width}</div>
        <div><b>Tinggi:</b> ${spec.dimensions.height}</div>
        <div><b>Ketebalan / Kedalaman:</b> ${spec.dimensions.depth}</div>
        <div><b>Spesifikasi Teknis:</b> ${spec.dimensions.spec}</div>
      `;
    }

    const pinsList = $('inspector-pins-list');
    if (pinsList) {
      pinsList.innerHTML = spec.pins
        .map(
          (p) => `
          <div class="insp-pin-row">
            <div class="insp-pin-head">
              <span class="insp-pin-code">${p.code}</span>
              <span class="insp-pin-color">${p.color}</span>
            </div>
            <div>${p.desc}</div>
          </div>
        `
        )
        .join('');
    }

    const guideSteps = $('inspector-guide-steps');
    if (guideSteps) {
      guideSteps.innerHTML = spec.guideSteps.map((s) => `<li>${s}</li>`).join('');
    }

    const noteEl = $('inspector-usage-note');
    if (noteEl) noteEl.textContent = spec.usageNote;

    const pillsEl = $('inspector-pills-list');
    if (pillsEl) {
      pillsEl.innerHTML = spec.pills.map((p) => `<span class="insp-pill">${p}</span>`).join('');
    }

    this.inspector3D?.loadComponent(spec.id);
  }

  selectModule(moduleId) {
    this.activeModule = getModuleById(moduleId);
    this.cableManager = new CableManager(this.activeModule.pins);
    this.solver = new CircuitSolver(this.activeModule);
    this.sound.setHornActive(false);
    this.sound.setBoardBuzzerActive(false);
    this.sound.setBlowerSpeed(0);
    this.prevClutchEngaged = false;
    this.prevRelayStates = {};
    this.prevChecklistKey = '';
    this.clearSelectedPin();
    this.multimeter.clearProbes();
    this.activeProbePicking = null;
    this._syncProbeButtons();

    document.querySelectorAll('.nav-item').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.moduleId === this.activeModule.id);
    });

    this.elFigBadge.textContent = this.activeModule.figLabel;
    this.elModuleTitle.textContent = this.activeModule.title;
    this.elModuleDesc.textContent = this.activeModule.description;

    const isAcModule = moduleId.startsWith('ac');
    const hasManifoldGauge = (this.activeModule.components || []).some(
      (c) => c.type === 'manifold_gauge_unit' || c.type === 'digital_temp_unit'
    );
    if (this.elBtnToggleManifold) {
      this.elBtnToggleManifold.hidden = !isAcModule;
    }

    if (typeof this.scene3D._onResize === 'function') {
      this.scene3D._onResize();
    }
    this.scene3D.loadModule(this.activeModule);
    this._renderSwitchesBar();
    this._syncAfterWireChange();

    if (this._setManifoldHudVisible) {
      // Automatically open Manifold Gauge HUD on AC03 (or any module with Manifold Gauge) and hide on Body modules
      this._setManifoldHudVisible(Boolean(isAcModule && hasManifoldGauge));
      if (this.elManifoldHud && hasManifoldGauge) {
        this.elManifoldHud.classList.remove('is-minimized');
      }
    }

    if (isAcModule) {
      this.toast(`Trainer AC Mobil (R134a): ${this.activeModule.title}`, 'normal', { sticky: true });
    }
  }

  _renderSwitchesBar() {
    this.elSwitchesList.innerHTML = '';
    const switchComps = (this.activeModule.components || []).filter(
      (c) => Array.isArray(c.states) && c.states.length > 0
    );
    const widgets = [];

    for (const comp of switchComps) {
      const current = this.solver.getSwitchState(comp.id);
      const widget = document.createElement('div');
      widget.className = 'switch-widget';

      const name = document.createElement('span');
      name.className = 'switch-name';
      let title = comp.title
        .replace(/^Saklar\s+/i, '')
        .replace(/^Tombol\s+/i, '')
        .replace(/ Utama$/, '');
      if (comp.id === 'HORN_BTN') title = 'Klakson';
      else if (comp.id === 'SW_BRAKE') title = 'Rem';
      else if (comp.id === 'IGN_SW') title = 'Kontak';
      else if (comp.id === 'SW_DIMMER') title = 'Dimmer';
      else if (comp.id === 'SW_TURN') title = 'Sein';
      else if (comp.id === 'SW_HAZARD') title = 'Hazard';
      else if (comp.id === 'SW_BLOWER') title = 'Blower';
      else if (comp.id === 'SW_AC_PUSH') title = 'A/C';
      else if (comp.id === 'THERMOSTAT_AC') title = 'Thermostat';
      else if (comp.id === 'PRESSURE_SWITCH') title = 'Pres. Switch';
      else if (comp.id === 'MOTOR_DRIVE_AC') title = 'Motor Drive';
      name.textContent = title;
      widget.appendChild(name);

      if (comp.momentary) {
        const pushBtn = document.createElement('button');
        pushBtn.type = 'button';
        pushBtn.className = `push-btn ${current === 'ON' ? 'is-pressed' : ''}`;
        pushBtn.dataset.momentaryId = comp.id;
        pushBtn.textContent = comp.id === 'HORN_BTN' ? 'KLAKSON' : comp.id === 'SW_BRAKE' ? 'INJAK REM' : 'TEKAN';
        pushBtn.title = 'Tekan & tahan untuk mengaktifkan; lepas untuk kembali OFF';

        const pressDown = (e) => {
          e.preventDefault();
          if (this.solver.getSwitchState(comp.id) !== 'ON') {
            this.solver.setSwitchState(comp.id, 'ON');
            this.sound.playRelayClick(true);
            pushBtn.classList.add('is-pressed');
          }
        };
        const releaseUp = () => {
          if (this.solver.getSwitchState(comp.id) !== 'OFF') {
            this.solver.setSwitchState(comp.id, 'OFF');
            this.sound.playRelayClick(false);
            pushBtn.classList.remove('is-pressed');
          }
        };

        pushBtn.addEventListener('pointerdown', pressDown);
        pushBtn.addEventListener('pointerup', releaseUp);
        pushBtn.addEventListener('pointerleave', releaseUp);
        pushBtn.addEventListener('pointercancel', releaseUp);
        widget.appendChild(pushBtn);
      } else {
        const seg = document.createElement('div');
        seg.className = 'seg';
        for (const st of comp.states) {
          const b = document.createElement('button');
          b.type = 'button';
          b.className = `seg-btn ${st === current ? 'is-active' : ''}`;
          let label = st;
          if (comp.id === 'IGN_SW') {
            if (st === 'IG') label = 'ON';
            else if (st === 'OFF') label = 'OFF';
            else if (st === 'ACC') label = 'ACC';
          } else if (comp.id === 'SW_TURN') {
            if (st === 'LEFT') label = 'KIRI';
            else if (st === 'OFF') label = 'OFF';
            else if (st === 'RIGHT') label = 'KANAN';
          } else if (comp.id === 'SW_DIMMER') {
            if (st === 'HIGH') label = 'HIGH';
            else if (st === 'OFF') label = 'OFF';
            else if (st === 'LOW') label = 'LOW';
          } else if (comp.id === 'SW_BLOWER') {
            if (st === 'OFF') label = '0';
            else if (st === 'SPEED_1') label = '1';
            else if (st === 'SPEED_2') label = '2';
            else if (st === 'SPEED_3') label = '3';
          } else if (comp.id === 'SW_AC_PUSH') {
            label = st === 'ON' ? 'A/C ON' : 'A/C OFF';
          } else if (comp.id === 'MOTOR_DRIVE_AC') {
            if (st === 'OFF') label = 'OFF';
            else if (st === 'IDLE_800') label = '800';
            else if (st === 'MED_1500') label = '1500';
            else if (st === 'HIGH_2200') label = '2200';
          } else if (comp.id === 'THERMOSTAT_AC') {
            label = st === 'ON' ? 'COOL (ON)' : 'OFF';
          } else if (comp.id === 'PRESSURE_SWITCH') {
            label = st === 'CLOSED' ? 'NORMAL' : 'TRIP';
          }
          b.textContent = label;
          b.addEventListener('click', () => {
            this.solver.setSwitchState(comp.id, st);
            this.sound.playRelayClick(true);
            this._renderSwitchesBar();
          });
          seg.appendChild(b);
        }
        widget.appendChild(seg);
      }

      if (comp.hasStartMomentary) {
        const startBtn = document.createElement('button');
        startBtn.type = 'button';
        startBtn.className = `push-btn push-btn-start ${this.solver.ignStartActive ? 'is-pressed' : ''}`;
        startBtn.dataset.ignStartBtn = 'true';
        startBtn.textContent = 'START';
        startBtn.title = 'Tekan & tahan untuk putar starter (Cranking START); lepas untuk kembali ke ON';

        const startDown = (e) => {
          e.preventDefault();
          if (!this.solver.ignStartActive) {
            this.solver.setIgnStart(true);
            this.sound.playRelayClick(true);
            startBtn.classList.add('is-pressed');
          }
        };
        const startUp = () => {
          if (this.solver.ignStartActive) {
            this.solver.setIgnStart(false);
            this.sound.playRelayClick(false);
            startBtn.classList.remove('is-pressed');
          }
        };

        startBtn.addEventListener('pointerdown', startDown);
        startBtn.addEventListener('pointerup', startUp);
        startBtn.addEventListener('pointerleave', startUp);
        startBtn.addEventListener('pointercancel', startUp);
        widget.appendChild(startBtn);
      }

      if (comp.hasDimPass) {
        const dimBtn = document.createElement('button');
        dimBtn.type = 'button';
        dimBtn.className = `push-btn push-btn-dim ${this.solver.dimPassActive ? 'is-pressed' : ''}`;
        dimBtn.dataset.dimPassBtn = 'true';
        dimBtn.textContent = 'DIM';
        dimBtn.title = 'Tekan & tahan untuk tembak lampu jauh (Pass / Dimmer Flash)';

        const dimDown = (e) => {
          e.preventDefault();
          if (!this.solver.dimPassActive) {
            this.solver.setDimPass(true);
            this.sound.playRelayClick(true);
            dimBtn.classList.add('is-pressed');
          }
        };
        const dimUp = () => {
          if (this.solver.dimPassActive) {
            this.solver.setDimPass(false);
            this.sound.playRelayClick(false);
            dimBtn.classList.remove('is-pressed');
          }
        };

        dimBtn.addEventListener('pointerdown', dimDown);
        dimBtn.addEventListener('pointerup', dimUp);
        dimBtn.addEventListener('pointerleave', dimUp);
        dimBtn.addEventListener('pointercancel', dimUp);
        widget.appendChild(dimBtn);
      }

      widgets.push(widget);
    }

    if (widgets.length > 3) {
      const mid = Math.ceil(widgets.length / 2);
      const row1 = document.createElement('div');
      row1.className = 'switch-row';
      const row2 = document.createElement('div');
      row2.className = 'switch-row';

      for (let i = 0; i < mid; i++) row1.appendChild(widgets[i]);
      for (let i = mid; i < widgets.length; i++) row2.appendChild(widgets[i]);

      this.elSwitchesList.appendChild(row1);
      this.elSwitchesList.appendChild(row2);
    } else {
      for (const w of widgets) {
        this.elSwitchesList.appendChild(w);
      }
    }
  }

  handleComponentPressStart(compId) {
    const comp = (this.activeModule.components || []).find((c) => c.id === compId);
    if (!comp || !comp.momentary) return false;
    this.solver.setSwitchState(compId, 'ON');
    const btn = this.elSwitchesList.querySelector(`[data-momentary-id="${compId}"]`);
    if (btn) btn.classList.add('is-pressed');
    return true;
  }

  handleComponentPressEnd(compId) {
    const comp = (this.activeModule.components || []).find((c) => c.id === compId);
    if (!comp || !comp.momentary) return;
    this.solver.setSwitchState(compId, 'OFF');
    const btn = this.elSwitchesList.querySelector(`[data-momentary-id="${compId}"]`);
    if (btn) btn.classList.remove('is-pressed');
  }

  cycleComponentSwitch(compId) {
    const comp = (this.activeModule.components || []).find((c) => c.id === compId);
    if (!comp) return;
    if (comp.type === 'manifold_gauge_unit' || comp.type === 'digital_temp_unit') {
      if (this._setManifoldHudVisible) {
        this._setManifoldHudVisible(true);
        this.elManifoldHud?.classList.remove('is-minimized');
        this.sound.playToggleClick();
      }
      return;
    }
    if (!Array.isArray(comp.states) || comp.momentary) return;
    const idx = comp.states.indexOf(this.solver.getSwitchState(compId));
    this.solver.setSwitchState(compId, comp.states[(idx + 1) % comp.states.length]);
    this.sound.playRelayClick(true);
    this._renderSwitchesBar();
  }

  handlePinClick(pin) {
    if (!pin) return;

    // Multimeter probe attachment mode
    if (this.activeProbePicking === 'red') {
      this.multimeter.attachRedProbe(pin.id);
      this.activeProbePicking = null;
      this._syncProbeButtons();
      this.sound.playPlugSnap(false);
      this.toast(`Probe Merah (+) terpasang ke <strong>${pin.label || pin.id}</strong>`, 'ready');
      return;
    }
    if (this.activeProbePicking === 'black') {
      this.multimeter.attachBlackProbe(pin.id);
      this.activeProbePicking = null;
      this._syncProbeButtons();
      this.sound.playPlugSnap(false);
      this.toast(`Probe Hitam (COM) terpasang ke <strong>${pin.label || pin.id}</strong>`, 'ready');
      return;
    }

    // First click picks the cable family automatically when it is obvious
    if (!this.selectedStartPin) {
      if (pin.terminalType === 'battery_post') {
        this.selectedCableTypeId = pin.id === 'BAT_POS' ? 'alligator-red' : 'alligator-black';
        this.selectedWireColor = pin.id === 'BAT_POS' ? 'red' : 'black';
        this._syncColorButtons();
        this._renderWireRack();
      } else if (this.selectedCableTypeId.startsWith('alligator-')) {
        this.selectedCableTypeId = 'jumper-20';
        this._renderWireRack();
      }

      this.selectedStartPin = pin;
      this.scene3D.highlightSelectedPin(pin.id);
      const spec = CABLE_TYPES[this.selectedCableTypeId];
      this.toast(`<strong>${pin.label}</strong> &rarr; pilih pin tujuan (${spec.shortLabel})`, 'normal', { sticky: true, cancel: true });
      return;
    }

    if (this.selectedStartPin.id === pin.id) {
      this.clearSelectedPin();
      return;
    }

    const result = this.cableManager.addCable({
      fromPin: this.selectedStartPin.id,
      toPin: pin.id,
      cableTypeId: this.selectedCableTypeId,
      color: this.selectedWireColor,
    });

    if (!result.ok) {
      this.sound.playErrorBuzz();
      this.toast(this._shortError(result.validation), 'error', { sticky: true, cancel: true });
      return;
    }

    const stacked =
      this.cableManager.getPinStackCount(this.selectedStartPin.id) > 1 ||
      this.cableManager.getPinStackCount(pin.id) > 1;
    this.sound.playPlugSnap(stacked);
    this.clearSelectedPin();
    this.toast(`Terpasang ${result.validation.distanceCm} cm${stacked ? ' · ditumpuk' : ''}`, 'ready');
    this._syncAfterWireChange();
  }

  _shortError(v) {
    switch (v.reason) {
      case 'CABLE_TOO_SHORT':
        return `Kurang panjang: ${v.distanceCm} cm &gt; ${v.maxLengthCm} cm. Tumpuk via pin lain.`;
      case 'REQUIRES_ALLIGATOR_CLIP':
        return 'Kutub Aki wajib pakai jepit buaya.';
      case 'ALLIGATOR_ONLY_FOR_BATTERY':
        return 'Jepit buaya hanya untuk kutub Aki.';
      case 'DUPLICATE_CONNECTION':
        return 'Kabel ini sudah terpasang.';
      default:
        return v.message;
    }
  }

  handlePinHover({ pin, point3D, clientX, clientY }) {
    // Smart Pin Callout Tooltip: readable at any camera distance
    if (this.elPinTooltip) {
      if (pin) {
        const comp = (this.activeModule?.components || []).find((c) => c.id === pin.componentId);
        const compTitle = comp ? comp.title : pin.componentId || '';
        const stackCount = this.cableManager ? this.cableManager.getPinStackCount(pin.id) : 0;
        const volt = this.lastSnapshot?.pinVoltages?.[pin.id] || '';
        const dotColor =
          pin.color === 'red'
            ? '#ef4444'
            : pin.color === 'blue'
              ? '#3b82f6'
              : pin.color === 'yellow'
                ? '#f59e0b'
                : '#64748b';
        const metaParts = [];
        if (volt && volt !== 'FLOAT') metaParts.push(volt);
        if (stackCount > 0) metaParts.push(`${stackCount} kabel`);
        const metaHtml = metaParts.length
          ? `<span class="pin-tip-meta">${metaParts.join(' · ')}</span>`
          : '';
        this.elPinTooltip.innerHTML =
          `<span class="pin-tip-dot" style="background:${dotColor}"></span>` +
          `<span class="pin-tip-code">${pin.label}</span>` +
          `<span class="pin-tip-comp">${compTitle}</span>` +
          metaHtml;
        this.elPinTooltip.hidden = false;

        const stageRect = this.elPinTooltip.parentElement?.getBoundingClientRect();
        if (stageRect && typeof clientX === 'number' && typeof clientY === 'number') {
          const left = Math.max(12, Math.min(stageRect.width - 230, clientX - stageRect.left + 14));
          const top = Math.max(12, clientY - stageRect.top - 42);
          this.elPinTooltip.style.transform = `translate(${left.toFixed(0)}px, ${top.toFixed(0)}px)`;
        }
      } else {
        this.elPinTooltip.hidden = true;
      }
    }

    if (!this.selectedStartPin) return;
    const v = this.scene3D.updatePreviewWire({
      startPin: this.selectedStartPin,
      targetPoint3D: point3D,
      targetPin: pin,
      cableTypeId: this.selectedCableTypeId,
      color: this.selectedWireColor,
      existingCables: this.cableManager.getCables(),
    });
    if (pin && pin.id !== this.selectedStartPin.id && v) {
      if (v.ok) {
        this.toast(`<strong>${pin.label}</strong> · ${v.distanceCm} / ${v.maxLengthCm} cm`, 'ready', { sticky: true, cancel: true });
      } else {
        this.toast(this._shortError(v), 'error', { sticky: true, cancel: true });
      }
    }
  }

  clearSelectedPin() {
    this.selectedStartPin = null;
    this.scene3D.highlightSelectedPin(null);
    this.scene3D.clearPreview();
    this.hideToast();
  }

  toast(html, mode = 'normal', { sticky = false, cancel = false } = {}) {
    clearTimeout(this.toastTimer);
    this.elToast.hidden = false;
    this.elToast.classList.remove('is-error', 'is-ready');
    if (mode === 'error') this.elToast.classList.add('is-error');
    if (mode === 'ready') this.elToast.classList.add('is-ready');
    this.elToastText.innerHTML = html;
    this.elBtnCancelPin.hidden = !cancel;
    if (!sticky) this.toastTimer = setTimeout(() => this.hideToast(), 2600);
  }

  hideToast() {
    clearTimeout(this.toastTimer);
    this.elToast.hidden = true;
  }

  removeCableById(cableId) {
    if (this.selectedStartPin) {
      this.clearSelectedPin();
    }
    if (this.cableManager.removeCable(cableId)) {
      this.sound.playPlugSnap(false);
      this._syncAfterWireChange();
      this.toast('Kabel dipotong (Klik Kanan).');
    }
  }

  _syncAfterWireChange() {
    this.scene3D.syncCables(this.cableManager.getCables(), (pinId) =>
      this.cableManager.getPinStackCount(pinId)
    );
  }

  _updateSimulationUI(snapshot) {
    this.elStatusBattery.className = `status-pill ${snapshot.boardPowered ? 'is-ok' : 'is-warn'}`;
    this.elStatusBattery.title = snapshot.boardPowered ? 'Aki 12V terhubung' : 'Aki belum terhubung';

    const anyBlown = Object.values(snapshot.componentStates || {}).some((s) => s.blown);
    this.elStatusFuse.className = `status-pill ${anyBlown ? 'is-danger' : 'is-ok'}`;
    this.elStatusFuse.title = anyBlown ? 'Sekring putus' : 'Sekring normal';

    if (snapshot.shortCircuitEvents.length > 0) {
      this.sound.playShortSpark();
      this.toast(`Hubung singkat! Sekring ${snapshot.shortCircuitEvents[0].fuseKey} putus.`, 'error');
    }

    for (const [compId, st] of Object.entries(snapshot.componentStates || {})) {
      if (st.relayClosed !== undefined) {
        const prev = Boolean(this.prevRelayStates[compId]);
        if (st.relayClosed !== prev) {
          this.sound.playRelayClick(st.relayClosed);
          this.prevRelayStates[compId] = st.relayClosed;
        }
      }
    }

    const flasher = snapshot.componentStates['FLASHER_1'];
    const turnLampsActive = Boolean(
      snapshot.componentStates['TURN_LH']?.energized ||
      snapshot.componentStates['TURN_RH']?.energized ||
      snapshot.componentStates['TURN_LAMPS']?.lhOn ||
      snapshot.componentStates['TURN_LAMPS']?.rhOn ||
      snapshot.componentStates['SIGN_FRONT_LH']?.energized ||
      snapshot.componentStates['TAIL_LH']?.signOn ||
      snapshot.componentStates['TAIL_RH']?.signOn ||
      snapshot.componentStates['IND_CLUSTER']?.turnPilot
    );
    if (flasher && flasher.energized && turnLampsActive && flasher.blinkingOn !== this.prevFlasherBlink) {
      this.sound.playFlasherTick(flasher.blinkingOn);
      this.prevFlasherBlink = flasher.blinkingOn;
    } else if (!flasher || !flasher.energized || !turnLampsActive) {
      this.prevFlasherBlink = false;
    }

    const horn = snapshot.componentStates['HORN_1'];
    this.sound.setHornActive(Boolean(horn && horn.energized));

    // 12V Automotive Buzzer sound
    const buzzer = snapshot.componentStates['BUZZER_12V'];
    this.sound.setBoardBuzzerActive(Boolean(buzzer && buzzer.energized));

    // AC Blower dynamic air sound
    const blowerSpeed = snapshot.refrigeration?.blowerSpeed || 0;
    this.sound.setBlowerSpeed(blowerSpeed);

    // AC Magnetic Clutch mechanical engagement snap
    const clutchEngaged = Boolean(
      snapshot.refrigeration?.clutchEngaged ||
      snapshot.componentStates['MAG_CLUTCH']?.energized
    );
    if (this.prevClutchEngaged === undefined) {
      this.prevClutchEngaged = clutchEngaged;
    } else if (clutchEngaged !== this.prevClutchEngaged) {
      if (clutchEngaged) {
        this.sound.playMagneticClutchEngagement();
      } else {
        this.sound.playMagneticClutchDisengagement();
      }
      this.prevClutchEngaged = clutchEngaged;
    }

    // Digital Multimeter calculation & HUD sync
    const dmmReading = this.multimeter.update(snapshot, this.activeModule, this.cableManager.getCables());
    this.sound.setMultimeterBeep(Boolean(dmmReading.beeping));
    this._updateMultimeterHUD(dmmReading);
    this._updateManifoldHUD(snapshot.refrigeration);
    this.scene3D.syncMultimeter(this.multimeter);

    // Re-render checklist only when it changes
    const list = snapshot.checklistStatus || [];
    const key = list.map((i) => (i.completed ? '1' : '0')).join('');
    if (key === this.prevChecklistKey) return;
    this.prevChecklistKey = key;

    const done = list.filter((i) => i.completed).length;
    this.elChecklistCounter.textContent = `${done}/${list.length}`;
    this.elChecklistCounter.classList.toggle('is-done', list.length > 0 && done === list.length);

    this.elChecklistUl.innerHTML = '';
    for (const item of list) {
      const li = document.createElement('li');
      li.className = `checklist-item ${item.completed ? 'is-done' : ''}`;
      li.innerHTML = `
        <svg class="chk-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4">
          ${item.completed ? '<polyline points="20 6 9 17 4 12" />' : '<circle cx="12" cy="12" r="8" />'}
        </svg>
        <span>${item.label}</span>
      `;
      this.elChecklistUl.appendChild(li);
    }
  }

  _updateMultimeterHUD(reading) {
    if (!this.elDmmHud || this.elDmmHud.hidden) return;

    if (this.elDmmDigits) this.elDmmDigits.textContent = reading.display;
    if (this.elDmmUnit) this.elDmmUnit.textContent = reading.unit;
    if (this.elDmmSignMinus) {
      this.elDmmSignMinus.style.opacity = reading.isNegative ? '1' : '0';
    }
    if (this.elDmmContIcon) {
      this.elDmmContIcon.style.opacity = reading.beeping ? '1' : '0';
    }
    if (this.elDmmModeInd) {
      const modeLabels = {
        OFF: 'OFF',
        V_DC: 'DC V',
        OHM: 'OHM',
        CONTINUITY: 'CONT',
        A_DC: 'DC A',
      };
      this.elDmmModeInd.textContent = modeLabels[this.multimeter.mode] || 'DC';
    }
  }

  _updateManifoldHUD(ref) {
    if (!this.elManifoldHud || this.elManifoldHud.hidden) return;

    const lpPsi = Math.max(0, Math.min(120, ref?.lowPressurePsi ?? 0));
    const hpPsi = Math.max(0, Math.min(500, ref?.highPressurePsi ?? 0));
    const lpBar = lpPsi * 0.0689476;
    const hpBar = hpPsi * 0.0689476;
    const rpm = Math.round(ref?.compressorRpm ?? 0);
    const clutchOn = Boolean(ref?.clutchEngaged);
    const coolingOn = Boolean(clutchOn && rpm > 0);

    // Rotate SVG gauge needles (-135deg to +135deg across 270deg span)
    const lpAngle = -135 + (lpPsi / 120) * 270;
    const hpAngle = -135 + (hpPsi / 500) * 270;
    if (this.elMfgNeedleLow) {
      this.elMfgNeedleLow.setAttribute('transform', `rotate(${lpAngle.toFixed(1)} 60 60)`);
    }
    if (this.elMfgNeedleHigh) {
      this.elMfgNeedleHigh.setAttribute('transform', `rotate(${hpAngle.toFixed(1)} 60 60)`);
    }

    if (this.elMfgLowPsi) this.elMfgLowPsi.textContent = `${lpPsi.toFixed(0)} PSI`;
    if (this.elMfgLowBar) this.elMfgLowBar.textContent = `${lpBar.toFixed(1)} bar`;
    if (this.elMfgHighPsi) this.elMfgHighPsi.textContent = `${hpPsi.toFixed(0)} PSI`;
    if (this.elMfgHighBar) this.elMfgHighBar.textContent = `${hpBar.toFixed(1)} bar`;

    if (this.elMfgStatusPill) {
      this.elMfgStatusPill.textContent = coolingOn ? 'COOLING ON' : rpm > 0 ? 'CLUTCH OFF' : 'STANDBY';
      this.elMfgStatusPill.classList.toggle('is-cooling', coolingOn);
    }

    if (this.elMfgRpmVal) {
      this.elMfgRpmVal.textContent = `${rpm} RPM`;
    }

    if (this.elMfgSightDot) {
      this.elMfgSightDot.classList.toggle('is-flowing', coolingOn);
    }
    if (this.elMfgSightState) {
      this.elMfgSightState.textContent = coolingOn ? 'Mengalir Jernih' : lpPsi > 0 ? 'Setimbang (Equalized)' : 'Diam (Static)';
    }

    const t1 = (ref?.t1Ambient ?? 28.5).toFixed(1);
    const t2 = (ref?.t2EvapInlet ?? 27.0).toFixed(1);
    const t3 = (ref?.t3VentDischarge ?? 27.0).toFixed(1);
    if (this.elMfgTempT1) this.elMfgTempT1.textContent = `${t1}°C`;
    if (this.elMfgTempT2) this.elMfgTempT2.textContent = `${t2}°C`;
    if (this.elMfgTempT3) this.elMfgTempT3.textContent = `${t3}°C`;
  }

  _startLoop() {
    if (this._loopRunning) return;
    this._loopRunning = true;
    let last = performance.now();
    let lastUiUpdate = 0;
    const tick = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!this.inspector3D?.isOpen) {
        const snapshot = this.solver.step(this.cableManager.getCables(), dt);
        this.lastSnapshot = snapshot;
        this.scene3D.syncSimulation(snapshot);
        // Throttle UI DOM updates to ~15 Hz to eliminate main thread DOM thrashing & layout recalc
        if (now - lastUiUpdate > 66) {
          this._updateSimulationUI(snapshot);
          lastUiUpdate = now;
        }
        this.scene3D.renderFrame(dt);
      }
      this._animFrameId = requestAnimationFrame(tick);
    };
    this._animFrameId = requestAnimationFrame(tick);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.automotiveBenchApp = new AutomotiveBenchApp();
});
