// ============================================================
// summon.js — 랜덤 소환
// 빈 슬롯을 클릭하면 골드를 소모하고 [일반] 등급 타워가 랜덤 계열로 생성됩니다.
// ============================================================

import { FAMILY_IDS } from '../data/towers.js';
import { Tower } from '../entities/Tower.js';
import { state, addEffect, showToast } from '../core/state.js';
import { CONFIG } from '../data/config.js';
import { indexToTile, isBuildable, tileCenter, tileIndex } from '../core/grid.js';
import { summonCost, spend, canAfford } from './economy.js';

/** 소환 가능 여부와 사유 */
export function canSummon(tileIdx) {
  const { col, row } = indexToTile(tileIdx);
  if (!isBuildable(col, row)) return { ok: false, reason: '경로 위에는 배치할 수 없습니다.' };
  if (state.towers.has(tileIdx)) return { ok: false, reason: '이미 타워가 있습니다.' };
  if (!canAfford(summonCost())) return { ok: false, reason: '골드가 부족합니다.' };
  return { ok: true };
}

/**
 * 해당 타일에 랜덤 일반 타워를 소환합니다.
 * @returns {Tower|null}
 */
export function summonAt(tileIdx) {
  const check = canSummon(tileIdx);
  if (!check.ok) {
    showToast(check.reason, 1.2);
    return null;
  }

  spend(summonCost());

  const familyId = FAMILY_IDS[Math.floor(Math.random() * FAMILY_IDS.length)];
  const tower = new Tower(tileIdx, { familyId, tier: 0 });
  state.towers.set(tileIdx, tower);
  state.stats.summons++;

  const { col, row } = indexToTile(tileIdx);
  const c = tileCenter(col, row);
  addEffect({ type: 'ring', x: c.x, y: c.y, color: tower.color, radius: 34 });

  return tower;
}

/** 비어 있는 배치 가능 슬롯이 하나라도 있는지 */
export function hasEmptySlot() {
  const { cols, rows } = CONFIG.grid;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isBuildable(c, r) && !state.towers.has(tileIndex(c, r))) return true;
    }
  }
  return false;
}
