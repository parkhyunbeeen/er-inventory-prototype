// ============================================================
// merge.js — 합성 시스템
//
// [등급별 분리 합성]
//   기준 타워와 같은 계열·같은 등급 타워를 모아 원하는 상위 등급으로
//   한 번에 올릴 수 있습니다. 필요 개수는 등급 차이에 따라 결정됩니다.
//     required = 2 일 때
//       일반 2개 → 고급 / 일반 4개 → 희귀 / 일반 8개 → 영웅
//       고급 2개 → 희귀 / 고급 4개 → 영웅
//       희귀 2개 → 영웅
//   버튼은 도달 가능한 등급마다 따로 표시됩니다.
//   결과는 항상 "클릭한 타워의 위치"에 생성됩니다.
//
// [전설 합성]
//   영웅 등급 타워 3개의 계열 조합이 legendary.js 조합표에 있을 때만 가능.
//   결과는 "첫 번째로 선택한 타워의 위치"에 생성됩니다.
// ============================================================

import { CONFIG } from '../data/config.js';
import { MAX_MERGE_TIER, FAMILIES, RARITIES } from '../data/towers.js';
import { findLegendary } from '../data/legendary.js';
import { Tower } from '../entities/Tower.js';
import {
  state,
  addEffect,
  addFloater,
  clearSelection,
  showToast,
} from '../core/state.js';

/**
 * 기준 타워와 같은 계열·같은 등급인 다른 타워들을 찾습니다.
 * @param {Tower} base
 * @returns {Tower[]} 재료 후보 (기준 타워 제외, 가까운 순)
 */
export function findMaterials(base) {
  if (!base || base.isLegendary || base.tier >= MAX_MERGE_TIER) return [];
  const list = [];
  for (const tower of state.towers.values()) {
    if (tower.uid === base.uid) continue;
    if (base.matches(tower)) list.push(tower);
  }
  list.sort(
    (a, b) =>
      Math.hypot(a.x - base.x, a.y - base.y) -
      Math.hypot(b.x - base.x, b.y - base.y)
  );
  return list;
}

/** 목표 등급까지 올리는 데 필요한 (기준 등급) 타워 수 */
export function requiredFor(baseTier, targetTier) {
  return Math.pow(CONFIG.merge.required, targetTier - baseTier);
}

/**
 * 기준 타워에서 도달 가능한 모든 합성 선택지를 반환합니다.
 * (고급 조합 / 희귀 조합 / 영웅 조합을 각각 나누어 보여주기 위한 것)
 * @param {Tower} base
 * @returns {{targetTier:number, name:string, color:string, need:number, have:number, ok:boolean}[]}
 */
export function mergeOptions(base) {
  if (!base || base.isLegendary || base.tier >= MAX_MERGE_TIER) return [];

  const have = findMaterials(base).length + 1; // 기준 타워 포함
  const out = [];

  for (let target = base.tier + 1; target <= MAX_MERGE_TIER; target++) {
    const need = requiredFor(base.tier, target);
    out.push({
      targetTier: target,
      name: RARITIES[target].name,
      color: RARITIES[target].border,
      need,
      have: Math.min(have, need),
      ok: have >= need,
    });
  }
  return out;
}

/** 선택 패널 상단에 쓸 상태 요약 */
export function mergeStatus(base) {
  if (!base) return null;
  if (base.isLegendary) {
    return { kind: 'legendary-final', text: '전설은 최종 등급입니다.' };
  }
  if (base.tier >= MAX_MERGE_TIER) {
    return { kind: 'epic', text: '영웅 2개를 더 선택해 전설을 조합하세요.' };
  }
  return { kind: 'normal', options: mergeOptions(base) };
}

/**
 * 지정한 등급으로 합성합니다.
 * @param {Tower} base 클릭한 기준 타워 — 결과가 이 위치에 생성됩니다.
 * @param {number} targetTier 목표 등급 (1=고급, 2=희귀, 3=영웅)
 */
export function mergeTo(base, targetTier) {
  const opt = mergeOptions(base).find((o) => o.targetTier === targetTier);
  if (!opt || !opt.ok) {
    showToast('합성할 재료가 부족합니다.', 1.2);
    return null;
  }

  const materials = findMaterials(base).slice(0, opt.need - 1);

  for (const m of materials) {
    addEffect({
      type: 'beam',
      x1: m.x, y1: m.y, x2: base.x, y2: base.y,
      color: base.color,
    });
    state.towers.delete(m.tileIdx);
  }

  const upgraded = new Tower(base.tileIdx, {
    familyId: base.familyId,
    tier: targetTier,
  });
  state.towers.set(base.tileIdx, upgraded);
  state.stats.merges++;

  addEffect({
    type: 'burst',
    x: upgraded.x, y: upgraded.y,
    color: upgraded.rarity.border,
    radius: 40 + targetTier * 10,
    life: 0.45,
  });
  addFloater(upgraded.x, upgraded.y - 12, `${upgraded.rarity.name}!`, upgraded.rarity.border);

  state.selection = [upgraded.tileIdx];
  return upgraded;
}

/** 한 단계만 올리는 합성 (하위 호환용) */
export function mergeNormal(base) {
  return mergeTo(base, base.tier + 1);
}

/** 전설 조합 상태 조회 — UI 표시용 */
export function legendaryStatus(towers) {
  const need = CONFIG.merge.legendaryRequired;
  const allEpic =
    towers.length > 0 &&
    towers.every((t) => !t.isLegendary && t.tier === MAX_MERGE_TIER);

  if (!allEpic) return null;

  if (towers.length < need) {
    return {
      ok: false,
      have: towers.length,
      need,
      text: `전설 조합 (${towers.length}/${need})`,
    };
  }

  const found = findLegendary(towers.map((t) => t.familyId));
  return {
    ok: !!found,
    have: need,
    need,
    target: found,
    text: found ? `전설 합성 — ${found.name}` : '조합표에 없는 조합입니다',
  };
}

/**
 * 전설 합성 실행.
 * @param {Tower[]} towers 선택된 영웅 타워 3개 (첫 번째 = 결과 위치)
 */
export function mergeLegendary(towers) {
  const status = legendaryStatus(towers);
  if (!status || !status.ok) {
    showToast('조합에 맞는 전설 타워가 없습니다.', 1.5);
    return null;
  }

  const base = towers[0];
  for (const t of towers.slice(1)) {
    addEffect({ type: 'beam', x1: t.x, y1: t.y, x2: base.x, y2: base.y, color: '#ffc83d' });
    state.towers.delete(t.tileIdx);
  }

  const legend = new Tower(base.tileIdx, { legendaryId: status.target.id });
  state.towers.set(base.tileIdx, legend);
  state.stats.merges++;
  state.stats.legendaries++;

  addEffect({ type: 'burst', x: legend.x, y: legend.y, color: '#ffc83d', radius: 70, life: 0.6 });
  addFloater(legend.x, legend.y - 16, `★ ${legend.name}`, '#ffc83d');
  showToast(`전설 타워 [${legend.name}] 완성!`, 2.5);

  clearSelection();
  state.selection = [legend.tileIdx];
  return legend;
}

/** UI용 — 계열 id → 이름 */
export function familyName(id) {
  return FAMILIES[id]?.name ?? id;
}
