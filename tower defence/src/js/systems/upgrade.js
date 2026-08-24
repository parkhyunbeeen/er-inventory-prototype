// ============================================================
// upgrade.js — 등급별 강화 (우측 패널)
//
// 등급마다 최대 레벨과 비용이 다릅니다.
//   비용 = costBase × (다음 레벨)
//   일반(최대 5)  : 1, 2, 3, 4, 5
//   고급(최대 10) : 2, 4, 6, 8 …
//   희귀(최대 15) : 3, 6, 9 …
//   영웅(최대 20) : 4, 8, 12 …
//   전설(최대 30) : 5, 10, 15 …
//
// 효과는 해당 등급 타워 전체의 공격력 증가입니다.
// ============================================================

import { CONFIG } from '../data/config.js';
import { RARITIES } from '../data/towers.js';
import { state, showToast, addFloater } from '../core/state.js';
import { spend } from './economy.js';

/** 등급 tier의 강화 정의 */
export function upgradeDef(tier) {
  return CONFIG.upgrade.tiers.find((u) => u.tier === tier);
}

/** 현재 레벨 */
export function upgradeLevel(tier) {
  return state.upgrades[tier] ?? 0;
}

/** 다음 레벨 비용 (만렙이면 null) */
export function upgradeCost(tier) {
  const def = upgradeDef(tier);
  const lv = upgradeLevel(tier);
  if (lv >= def.maxLevel) return null;
  return def.costBase * (lv + 1);
}

/** 해당 등급의 공격력 배율 (1.0 = 강화 없음) */
export function upgradeMultiplier(tier) {
  return 1 + upgradeLevel(tier) * CONFIG.upgrade.damagePerLevel;
}

/** 강화가 반영된 실제 공격력 */
export function towerDamage(tower) {
  return tower.damage * upgradeMultiplier(tower.tier);
}

/**
 * 강화 1레벨 구매.
 * @returns {boolean} 성공 여부
 */
export function buyUpgrade(tier) {
  const def = upgradeDef(tier);
  const cost = upgradeCost(tier);

  if (cost === null) {
    showToast(`${RARITIES[tier].name} 강화는 이미 최대입니다.`, 1.2);
    return false;
  }
  if (!spend(cost)) {
    showToast(`골드가 부족합니다. (${cost}G 필요)`, 1.2);
    return false;
  }

  state.upgrades[tier] = upgradeLevel(tier) + 1;
  state.stats.upgrades++;

  const pct = Math.round(upgradeLevel(tier) * CONFIG.upgrade.damagePerLevel * 100);
  showToast(
    `${RARITIES[tier].name} 강화 Lv.${state.upgrades[tier]}/${def.maxLevel} — 공격력 +${pct}%`,
    1.4
  );
  return true;
}

/** UI 표시용 요약 */
export function upgradeSummary() {
  return CONFIG.upgrade.tiers.map((def) => {
    const lv = upgradeLevel(def.tier);
    const cost = upgradeCost(def.tier);
    return {
      tier: def.tier,
      name: RARITIES[def.tier].name,
      color: RARITIES[def.tier].border,
      level: lv,
      maxLevel: def.maxLevel,
      cost,
      maxed: cost === null,
      bonusPercent: Math.round(lv * CONFIG.upgrade.damagePerLevel * 100),
      affordable: cost !== null && state.gold >= cost,
    };
  });
}
