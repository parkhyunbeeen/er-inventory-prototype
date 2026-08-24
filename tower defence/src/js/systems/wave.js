// ============================================================
// wave.js — 웨이브 진행 / 적 스폰
// ============================================================

import { CONFIG } from '../data/config.js';
import {
  waveComposition,
  hpScale,
  rewardScale,
  clearBonus,
  isBossWave,
} from '../data/waves.js';
import { ENEMIES } from '../data/enemies.js';
import { Enemy } from '../entities/Enemy.js';
import { state, showToast } from '../core/state.js';
import { earn, loseLife } from './economy.js';
import { refreshMissions, onMissionEnemyEscaped } from './mission.js';

/** 다음 웨이브를 준비 상태로 전환 */
export function startPrep() {
  if (state.wave >= CONFIG.wave.finalWave) {
    state.phase = 'clear';
    return;
  }
  state.phase = 'prep';
  state.prepTimer = CONFIG.wave.prepTime;
}

/** 준비 시간을 건너뛰고 즉시 웨이브 시작 (남은 시간만큼 보너스) */
export function skipPrep() {
  if (state.phase !== 'prep') return;
  const seconds = Math.min(state.prepTimer, CONFIG.economy.skipBonusMaxSeconds);
  const bonus = Math.floor(seconds * CONFIG.economy.skipBonusPerSecond);
  if (bonus > 0) {
    earn(bonus);
    showToast(`빠른 시작 보너스 +${bonus}G`, 1.4);
  }
  beginWave();
}

/** 웨이브 시작 — 스폰 대기열 구성 */
export function beginWave() {
  state.wave++;
  state.phase = 'combat';
  state.spawnTimer = 0;
  state.spawnQueue = [];

  const n = state.wave;
  const rm = rewardScale(n);

  for (const group of waveComposition(n)) {
    const boss = !!ENEMIES[group.type]?.isBoss;
    const hm = hpScale(n, boss); // 보스는 완만한 배율
    for (let i = 0; i < group.count; i++) {
      state.spawnQueue.push({ type: group.type, hm, rm, gap: group.gap });
    }
  }

  showToast(
    isBossWave(n) ? `⚠ ${n} 라운드 — 보스 등장!` : `${n} 라운드 시작`,
    1.6
  );
}

/** 매 프레임 웨이브 상태 갱신 */
export function updateWave(dt) {
  if (state.phase === 'prep') {
    state.prepTimer -= dt;
    if (state.prepTimer <= 0) beginWave();
    handleEscapes();
    return;
  }

  if (state.phase !== 'combat') return;

  // 스폰
  if (state.spawnQueue.length > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      const next = state.spawnQueue.shift();
      state.enemies.push(new Enemy(next.type, next.hm, next.rm));
      state.spawnTimer = next.gap;
    }
  }

  handleEscapes();

  // 웨이브 종료 판정 — 미션 보스는 라운드 진행을 막지 않습니다
  const remaining = state.enemies.filter((e) => !e.isMission).length;
  if (state.phase === 'combat' && state.spawnQueue.length === 0 && remaining === 0) {
    const bonus = clearBonus(state.wave);
    earn(bonus);
    showToast(`${state.wave} 라운드 클리어! +${bonus}G`, 1.8);

    refreshMissions(state.wave);

    if (state.wave >= CONFIG.wave.finalWave) {
      state.phase = 'clear';
    } else {
      startPrep();
    }
  }
}

/** 끝점에 도달한 적 처리 */
function handleEscapes() {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (!e.escaped) continue;

    if (e.isMission) {
      // 미션 보스는 라이프를 깎지 않고 미션만 실패 처리
      onMissionEnemyEscaped(e);
    } else {
      loseLife(e.isBoss ? CONFIG.life.bossDamage : CONFIG.life.normalDamage);
    }
    state.enemies.splice(i, 1);
  }
}
