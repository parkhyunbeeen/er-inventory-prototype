// ============================================================
// state.js — 게임 상태 단일 저장소
// 모든 상태 변경은 이 파일의 함수를 통해서만 이루어집니다.
// ============================================================

import { CONFIG } from '../data/config.js';
import { MISSIONS } from '../data/missions.js';

/** @typedef {'ready'|'prep'|'combat'|'clear'|'over'} Phase */
/** @typedef {'title'|'playing'} Screen */

/** 미션 상태 초기값 */
function initialMissions() {
  const out = {};
  for (const m of MISSIONS) {
    out[m.id] = {
      /** 'locked' | 'ready' | 'active' | 'done' */
      status: 'locked',
      unlockedWave: 0,
      clears: 0,
    };
  }
  return out;
}

export const state = {
  /** @type {Screen} 타이틀 화면인지 게임 중인지 */
  screen: 'title',

  /** 설정창이 열려 있는지 — 열려 있으면 게임이 일시정지됩니다 */
  settingsOpen: false,

  /** 확인 팝업이 열려 있는지 — 이때도 게임이 멈춥니다 */
  confirmOpen: false,

  /** 효과음 음량 0.0 ~ 1.0 */
  volume: CONFIG.audio.defaultVolume,

  /** @type {Phase} */
  phase: 'ready',

  gold: 0,
  life: 0,
  wave: 0,

  prepTimer: 0,

  /** 게임 진행 배속 (1 / 2 / 3) — 재시작해도 유지됩니다 */
  speed: CONFIG.speed.default,

  /** 등급별 강화 레벨 (인덱스 = 등급 tier 0~4) */
  upgrades: [0, 0, 0, 0, 0],

  /** 미션 진행 상태 (id → { status, unlockedWave, clears }) */
  missions: initialMissions(),

  /** @type {Map<number, import('../entities/Tower.js').Tower>} tileIndex → Tower */
  towers: new Map(),

  /** @type {import('../entities/Enemy.js').Enemy[]} */
  enemies: [],
  /** @type {import('../entities/Projectile.js').Projectile[]} */
  projectiles: [],
  /** @type {object[]} 짧은 시각 효과 */
  effects: [],
  /** @type {object[]} 떠오르는 텍스트 */
  floaters: [],

  /** 선택된 타일 인덱스 목록 (전설 조합 시 최대 3개) */
  selection: [],

  /**
   * 판매 확인 대기 중인 타일 인덱스 (없으면 null).
   * 실수로 파는 걸 막기 위해 판매는 2단계로 진행됩니다.
   */
  sellArmed: null,

  /** 스폰 대기열 */
  spawnQueue: [],
  spawnTimer: 0,

  stats: { killed: 0, merges: 0, summons: 0, legendaries: 0, upgrades: 0, missions: 0 },

  /** UI에 띄울 안내 메시지 */
  toast: { text: '', timer: 0 },
};

export function resetState() {
  // 배속은 플레이어 취향이므로 재시작 시에도 유지
  const keepSpeed = state.speed;
  state.phase = 'prep';
  state.gold = CONFIG.economy.startGold;
  state.life = CONFIG.life.start;
  state.wave = 0;
  state.prepTimer = CONFIG.wave.prepTime;
  state.upgrades = [0, 0, 0, 0, 0];
  state.missions = initialMissions();
  state.towers = new Map();
  state.enemies = [];
  state.projectiles = [];
  state.effects = [];
  state.floaters = [];
  state.selection = [];
  state.sellArmed = null;
  state.spawnQueue = [];
  state.spawnTimer = 0;
  state.stats = { killed: 0, merges: 0, summons: 0, legendaries: 0, upgrades: 0, missions: 0 };
  state.toast = { text: '', timer: 0 };
  state.speed = keepSpeed;
  state.settingsOpen = false;
  state.confirmOpen = false;
}

/** 게임이 실제로 진행되어야 하는 상태인지 (설정창이 열려 있으면 멈춤) */
export function isRunning() {
  return state.screen === 'playing' && !state.settingsOpen && !state.confirmOpen;
}

/** 배속을 다음 단계로 순환시킵니다. */
export function cycleSpeed() {
  const opts = CONFIG.speed.options;
  const next = opts[(opts.indexOf(state.speed) + 1) % opts.length];
  state.speed = next;
  return next;
}

/** 배속을 특정 값으로 설정합니다 (허용된 값일 때만). */
export function setSpeed(value) {
  if (CONFIG.speed.options.includes(value)) state.speed = value;
  return state.speed;
}

export function showToast(text, seconds = 2) {
  state.toast.text = text;
  state.toast.timer = seconds;
}

export function addFloater(x, y, text, color = '#ffffff') {
  state.floaters.push({ x, y, text, color, life: 0.9, vy: -34 });
}

export function addEffect(effect) {
  state.effects.push({ life: 0.35, maxLife: 0.35, ...effect });
}

/** 선택 해제 */
export function clearSelection() {
  state.selection = [];
  state.sellArmed = null;
}

/** 선택된 타워 객체 배열 */
export function selectedTowers() {
  return state.selection
    .map((idx) => state.towers.get(idx))
    .filter(Boolean);
}
