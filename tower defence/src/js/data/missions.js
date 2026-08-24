// ============================================================
// missions.js — 미션 정의 (좌측 패널)
//
// 미션은 플레이어가 직접 "도전" 버튼을 눌러 전용 보스를 소환하고,
// 그 보스를 처치하면 골드를 받는 선택형 콘텐츠입니다.
// 미션 보스는 라이프를 깎지 않습니다 — 놓치면 미션만 실패하고
// 조건이 다시 충족될 때 재도전할 수 있습니다.
// ============================================================

export const MISSIONS = [
  {
    id: 'midboss',
    name: '중간 보스 토벌',
    icon: '◆',
    enemy: 'midboss',
    /** 5라운드마다 반복 개방 (5 · 10 · 15 · 20 · 25 · 30) */
    every: 5,
    repeatable: true,
    /** 보상 골드 = base + perWave × 개방된 라운드 */
    reward: { base: 180, perWave: 26 },
    hint: '5라운드마다 도전 가능',
    desc: '경로에 중간 보스가 나타납니다. 처치하면 즉시 골드를 받습니다.',
  },
  {
    id: 'elite',
    name: '엘리트 처단',
    icon: '✦',
    enemy: 'elite',
    /** 15라운드부터 1회 개방 */
    at: 15,
    repeatable: false,
    reward: { base: 900, perWave: 0 },
    hint: '15라운드에 개방 · 1회 한정',
    desc: '빠르고 단단한 엘리트. 방어력이 높아 방어 무시 계열이 유리합니다.',
  },
  {
    id: 'gatekeeper',
    name: '문지기 격파',
    icon: '❖',
    enemy: 'gatekeeper',
    /** 25라운드부터 1회 개방 */
    at: 25,
    repeatable: false,
    reward: { base: 2200, perWave: 0 },
    hint: '25라운드에 개방 · 1회 한정',
    desc: '방어력 20의 거대한 문지기. 잡으면 최종 라운드 대비 자금을 크게 확보합니다.',
  },
];

/** 해당 라운드에서 미션이 개방되는지 */
export function isUnlockedAt(mission, wave) {
  if (mission.every) return wave > 0 && wave % mission.every === 0;
  return wave >= mission.at;
}

/** 보상 골드 계산 */
export function missionReward(mission, wave) {
  return Math.round(mission.reward.base + mission.reward.perWave * wave);
}
