// ============================================================
// towers.js — 타워 계열(속성) & 등급 정의
// 계열은 [도형 + 본체색], 등급은 [테두리색 + 점 개수]로 구분됩니다.
// ============================================================

/** 타워 계열 4종 — 수치는 모두 [일반] 등급 기준 */
export const FAMILIES = {
  archer: {
    id: 'archer',
    name: '궁수탑',
    shape: 'triangle',
    color: '#3ddc84',
    role: '단일 딜러',
    damage: 8,
    cooldown: 0.6,
    range: 190,
    projectileSpeed: 520,
    desc: '빠른 공속과 긴 사거리. 단일 대상에게 꾸준한 피해.',
  },
  cannon: {
    id: 'cannon',
    name: '포탑',
    shape: 'square',
    color: '#ff9f45',
    role: '광역 딜러',
    damage: 18,
    cooldown: 1.4,
    range: 150,
    projectileSpeed: 340,
    splash: 45,
    desc: '느리지만 착탄 지점 주변에 광역 피해.',
  },
  frost: {
    id: 'frost',
    name: '서리탑',
    shape: 'diamond',
    color: '#5ecbff',
    role: '유틸',
    damage: 5,
    cooldown: 0.9,
    range: 160,
    projectileSpeed: 420,
    slow: { amount: 0.35, duration: 1.5 },
    desc: '피해는 낮지만 명중한 적의 이동 속도를 늦춤.',
  },
  volt: {
    id: 'volt',
    name: '전격탑',
    shape: 'pentagon',
    color: '#b46bff',
    role: '연쇄 딜러',
    damage: 10,
    cooldown: 1.0,
    range: 170,
    projectileSpeed: 600,
    chain: { count: 2, falloff: 0.6, radius: 95 },
    desc: '명중 후 주변의 다른 적에게 전기가 연쇄.',
  },
};

export const FAMILY_IDS = Object.keys(FAMILIES);

/**
 * 등급 5단계.
 * mult = [일반] 대비 공격력 배율 (누적값)
 * 합성 재료 2개 기준이므로 단계당 배율은 2.0을 넘어야 이득 → 약 2.4배로 설정
 */
export const RARITIES = [
  { id: 'common',    name: '일반', border: '#9aa0a6', mult: 1.0,  dots: 1 },
  { id: 'uncommon',  name: '고급', border: '#3ddc84', mult: 2.4,  dots: 2 },
  { id: 'rare',      name: '희귀', border: '#4a9eff', mult: 5.8,  dots: 3 },
  { id: 'epic',      name: '영웅', border: '#b44aff', mult: 14.0, dots: 4 },
  { id: 'legendary', name: '전설', border: '#ffc83d', mult: 0,    dots: 5 },
];

/** 일반 합성으로 도달 가능한 최고 등급 인덱스 (영웅) */
export const MAX_MERGE_TIER = 3;
export const LEGENDARY_TIER = 4;

export function rarityOf(tier) {
  return RARITIES[Math.min(tier, RARITIES.length - 1)];
}
