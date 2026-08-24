// ============================================================
// legendary.js — 전설 타워 조합표
// [영웅] 등급 타워 3개를 선택했을 때, 계열 조합이 아래 recipe와
// 일치하는 항목이 있을 경우에만 전설 타워를 만들 수 있습니다.
//
// 기본 계열이 4종이므로 3개를 뽑는 조합은 4가지 → 전설도 4종.
// 4종의 역할이 서로 겹치지 않도록 나눴습니다.
//   폭풍의 첨탑 : 범위 기절 — 적을 한곳에 묶는 제어기
//   빙하 성벽   : 범위 둔화 + 광역 피해 — 진격 속도를 꺾는 지연기
//   작열 요새   : 대형 폭발 + 화상 — 뭉친 적을 녹이는 광역 딜러
//   공허 프리즘 : 방어 무시 연쇄 — 장갑·보스 전용 단일 딜러
// ============================================================

export const LEGENDARY_TOWERS = [
  {
    id: 'storm_spire',
    name: '폭풍의 첨탑',
    recipe: ['archer', 'volt', 'frost'],
    shape: 'star',
    color: '#ffe08a',
    role: '범위 기절 (제어)',
    // pulse = 투사체를 쏘지 않고 사거리 전체를 주기적으로 내리치는 방식
    pulse: true,
    damage: 90,
    cooldown: 1.6,
    range: 200,
    stun: { duration: 1.1 },
    desc: '주기적으로 사거리 안의 모든 적을 내리쳐 기절시킵니다. 적이 한곳에 묶이면서 뒤따라오는 적들이 쌓이고, 광역 타워가 한 번에 정리할 수 있게 됩니다.',
  },
  {
    id: 'blaze_fort',
    name: '작열 요새',
    recipe: ['cannon', 'volt', 'archer'],
    shape: 'burst',
    color: '#ff7a3d',
    role: '대형 광역 (섬멸)',
    damage: 300,
    cooldown: 1.1,
    range: 200,
    projectileSpeed: 420,
    splash: 85,
    burn: { dps: 70, duration: 3 },
    desc: '넓은 폭발과 함께 지면을 태워 지속 피해를 남깁니다. 기절로 뭉쳐둔 적을 한 번에 정리하는 주력 딜러입니다.',
  },
  {
    id: 'glacier_wall',
    name: '빙하 성벽',
    recipe: ['cannon', 'frost', 'archer'],
    shape: 'shield',
    color: '#9fe8ff',
    role: '범위 둔화 (지연)',
    damage: 150,
    cooldown: 0.8,
    range: 215,
    projectileSpeed: 460,
    splash: 70,
    slow: { amount: 0.6, duration: 2.2 },
    desc: '착탄 범위의 적을 크게 얼려 진격을 늦춥니다. 기절이 풀린 뒤에도 적이 흩어지지 않게 붙잡아 둡니다.',
  },
  {
    id: 'void_prism',
    name: '공허 프리즘',
    recipe: ['cannon', 'frost', 'volt'],
    shape: 'prism',
    color: '#c98bff',
    role: '방어 무시 (대보스)',
    damage: 230,
    cooldown: 0.7,
    range: 220,
    projectileSpeed: 820,
    chain: { count: 4, falloff: 0.85, radius: 140 },
    pierceArmor: true,
    desc: '적의 방어력을 완전히 무시하는 4연쇄 광선. 장갑형과 보스에게 특히 강합니다.',
  },
];

/** 계열 id 배열을 정렬된 키 문자열로 변환 */
function recipeKey(familyIds) {
  return [...familyIds].sort().join('+');
}

const RECIPE_MAP = new Map(
  LEGENDARY_TOWERS.map((t) => [recipeKey(t.recipe), t])
);

/**
 * 영웅 타워들의 계열 조합에 맞는 전설 타워를 찾습니다.
 * @param {string[]} familyIds 예: ['archer','frost','volt']
 * @returns {object|null} 조합표에 없으면 null
 */
export function findLegendary(familyIds) {
  return RECIPE_MAP.get(recipeKey(familyIds)) || null;
}

/** UI 안내용 — 전체 조합표 텍스트 배열 */
export function legendaryRecipeList(familyNameOf) {
  return LEGENDARY_TOWERS.map(
    (t) => `<b>${t.name}</b> (${t.role}) = ${t.recipe.map(familyNameOf).join(' + ')}`
  );
}
