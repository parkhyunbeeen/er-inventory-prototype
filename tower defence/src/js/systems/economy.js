// ============================================================
// economy.js — 골드 / 라이프 관리
// ============================================================

import { CONFIG } from '../data/config.js';
import { state, addFloater, showToast } from '../core/state.js';

/** 현재 소환 비용 (고정) */
export function summonCost() {
  return CONFIG.economy.summonCost;
}

export function canAfford(amount) {
  return state.gold >= amount;
}

export function spend(amount) {
  if (!canAfford(amount)) return false;
  state.gold -= amount;
  return true;
}

export function earn(amount, x, y) {
  state.gold += amount;
  if (x !== undefined) addFloater(x, y, `+${amount}`, '#ffd23d');
}

export function loseLife(amount) {
  state.life = Math.max(0, state.life - amount);
  showToast(`적이 통과했습니다! (-${amount})`, 1.2);
  if (state.life <= 0) {
    state.phase = 'over';
  }
}
