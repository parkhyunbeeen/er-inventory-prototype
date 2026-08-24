// ============================================================
// config.js — 게임 전역 설정값
// 밸런스 조정은 이 파일과 같은 data/ 폴더 안에서만 하면 됩니다.
// ============================================================

export const CONFIG = {
  // --- 격자 / 캔버스 ---
  grid: {
    cols: 12,
    rows: 8,
    tile: 64,
  },

  // --- 합성 규칙 ---
  merge: {
    // 한 등급 올리는 데 필요한 동일 계열·동일 등급 타워 수
    // 2 = 빠른 체감(현재) / 3 = 정통 랜덤TD 방식
    required: 2,
    // 등급을 건너뛰는 합성도 허용합니다.
    // 필요 개수 = required ^ (목표등급 - 현재등급)
    //   일반 2개 → 고급 / 일반 4개 → 희귀 / 일반 8개 → 영웅
    // 전설 조합에 필요한 영웅 타워 수 (조합표는 legendary.js)
    legendaryRequired: 3,
  },

  // --- 경제 ---
  economy: {
    startGold: 200,        // 초반 4회 소환 — 1~3라운드 사고사 방지
    summonCost: 50,        // 소환 비용 (고정)
    sellRatio: 0.5,        // 판매 시 환급 비율
    waveBonusBase: 20,     // 웨이브 클리어 보너스 기본값
    waveBonusPerWave: 4,   // 웨이브당 보너스 증가량
    skipBonusPerSecond: 3, // 준비시간 스킵 시 남은 초당 보너스
    skipBonusMaxSeconds: 5,// 스킵 보너스로 인정되는 최대 초 (밸런스 상한)
  },

  // --- 등급별 강화 (우측 패널) ---
  // 비용 = costBase × (다음 레벨)
  //   일반: 1, 2, 3, 4, 5 …   전설: 5, 10, 15, 20 …
  upgrade: {
    damagePerLevel: 0.05,  // 레벨당 해당 등급 타워 공격력 +5%
    // 이 라운드까지는, 강화 후 남는 골드가 소환 비용보다 적어지면
    // "타워를 못 짓는다"는 확인 팝업을 띄웁니다.
    // 초반에 강화에 전부 써버려 한 대도 못 세우는 사고를 막기 위한 장치입니다.
    warnUntilWave: 1,
    tiers: [
      { tier: 0, maxLevel: 5,  costBase: 1 },
      { tier: 1, maxLevel: 10, costBase: 2 },
      { tier: 2, maxLevel: 15, costBase: 3 },
      { tier: 3, maxLevel: 20, costBase: 4 },
      { tier: 4, maxLevel: 30, costBase: 5 },
    ],
  },

  // --- 라이프 ---
  life: {
    start: 20,
    normalDamage: 1,
    bossDamage: 3,
  },

  // --- 웨이브 ---
  wave: {
    finalWave: 30,         // 최종 라운드 — 이 웨이브를 막으면 클리어
    prepTime: 20,          // 웨이브 간 준비 시간(초)
    hpGrowth: 1.32,        // 6라운드부터 적용되는 일반 적 체력 배율
    earlyGrowth: 1.15,     // 1~5라운드는 완만하게 (초반 사고사 방지)
    earlySoftWaves: 5,
    bossHpGrowth: 1.20,    // 보스 전용(더 완만한) 체력 배율
    rewardGrowth: 1.06,    // 웨이브당 보상 배율
    bossInterval: 10,      // 몇 웨이브마다 보스가 등장하는지 (10/20/30)
    bossCount: { 10: 1, 20: 2, 30: 2 }, // 라운드별 보스 수 (30라운드 하향)
  },

  // --- 사운드 ---
  audio: {
    defaultVolume: 0.5,   // 0.0 ~ 1.0
  },

  // --- 게임 속도 (배속) ---
  // 배속은 정수 배수로만 두고, 루프에서 프레임을 그 횟수만큼 쪼개어 돌립니다.
  // (dt 를 그냥 곱하면 고속 투사체가 적을 통과해 버리는 문제가 생깁니다)
  speed: {
    options: [1, 2, 3],
    default: 1,
  },

  // --- 등급별 부가 보정 (등급 단계 t = 0..3) ---
  rarityBonus: {
    rangePerTier: 0.06,    // 사거리 +6%/단계
    cooldownPerTier: 0.05, // 공격 쿨다운 -5%/단계
  },
};

// 파생값 — 직접 수정하지 마세요
CONFIG.canvas = {
  width: CONFIG.grid.cols * CONFIG.grid.tile,
  height: CONFIG.grid.rows * CONFIG.grid.tile,
};
