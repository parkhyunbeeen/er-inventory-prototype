// ============================================================
// waves.js — 웨이브 편성 규칙 (1 ~ 30 라운드)
//   1~4    : 일반형만 (적응 구간)
//   5~9    : 일반형 + 고속형
//   10     : 보스
//   11~19  : 3종 혼합
//   20     : 보스 2기
//   21~29  : 3종 혼합 (물량 증가)
//   30     : 최종 보스 2기 — 막으면 게임 클리어
//
// 보스는 일반 적보다 완만한 체력 배율(bossHpGrowth)을 씁니다.
// 일반 라운드는 올리고 최종 보스는 낮추기 위한 분리입니다.
// ============================================================

import { CONFIG } from './config.js';

/**
 * 해당 웨이브의 스폰 그룹 목록을 반환합니다.
 * @param {number} n 웨이브 번호 (1부터)
 * @returns {{type:string, count:number, gap:number}[]}
 */
export function waveComposition(n) {
  const groups = [];

  // 보스 웨이브 (10 / 20 / 30)
  if (isBossWave(n)) {
    const bossCount = CONFIG.wave.bossCount[n] ?? Math.floor(n / CONFIG.wave.bossInterval);
    groups.push({ type: 'armor', count: 4 + Math.floor(n / 4), gap: 0.26 });
    groups.push({ type: 'boss', count: bossCount, gap: 1.1 });
    return groups;
  }

  // 일반 라운드 물량 — 후반으로 갈수록 눈에 띄게 늘어납니다
  const base = 6 + Math.round(n * 1.05);

  if (n <= 4) {
    groups.push({ type: 'grunt', count: base, gap: 0.62 });
  } else if (n <= 9) {
    groups.push({ type: 'grunt', count: Math.round(base * 0.6), gap: 0.45 });
    groups.push({ type: 'swift', count: Math.round(base * 0.4), gap: 0.26 });
  } else {
    groups.push({ type: 'grunt', count: Math.round(base * 0.45), gap: 0.26 });
    groups.push({ type: 'swift', count: Math.round(base * 0.3), gap: 0.24 });
    groups.push({ type: 'armor', count: Math.round(base * 0.25), gap: 0.45 });
  }

  return groups;
}

/**
 * 웨이브 n의 적 체력 배율.
 * - 보스는 전용(완만한) 배율을 그대로 사용합니다.
 * - 일반 적은 1~5라운드까지 완만하게 오르다가 6라운드부터 본 배율이 붙습니다.
 *   (초반에 운 나쁘게 무너지는 일을 막고, 중후반 압박은 유지하기 위한 구간 분리)
 */
export function hpScale(n, isBoss = false) {
  if (isBoss) return Math.pow(CONFIG.wave.bossHpGrowth, n - 1);

  const soft = CONFIG.wave.earlySoftWaves;
  if (n <= soft) return Math.pow(CONFIG.wave.earlyGrowth, n - 1);
  return (
    Math.pow(CONFIG.wave.earlyGrowth, soft - 1) *
    Math.pow(CONFIG.wave.hpGrowth, n - soft)
  );
}

/** 웨이브 n의 보상 배율 */
export function rewardScale(n) {
  return Math.pow(CONFIG.wave.rewardGrowth, n - 1);
}

/** 웨이브 클리어 보너스 골드 */
export function clearBonus(n) {
  return CONFIG.economy.waveBonusBase + n * CONFIG.economy.waveBonusPerWave;
}

/** 보스 웨이브 여부 */
export function isBossWave(n) {
  return n % CONFIG.wave.bossInterval === 0;
}
