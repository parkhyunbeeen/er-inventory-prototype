// ============================================================
// mission.js — 미션 시스템 (좌측 패널)
//
// 흐름
//   1) 라운드가 조건을 만족하면 미션이 'ready' 상태로 열립니다.
//   2) 플레이어가 [도전] 버튼을 누르면 전용 보스가 경로에 소환됩니다.
//   3) 처치하면 보상 골드를 받습니다.
//   4) 놓치면(끝점 도달) 라이프는 깎이지 않고 미션만 실패 → 다시 도전 가능.
// ============================================================

import { MISSIONS, isUnlockedAt, missionReward } from '../data/missions.js';
import { hpScale, rewardScale } from '../data/waves.js';
import { Enemy } from '../entities/Enemy.js';
import { state, showToast, addFloater, addEffect } from '../core/state.js';
import { earn } from './economy.js';
import { SFX } from './audio.js';

/** id로 미션 정의 찾기 */
export function missionDef(id) {
  return MISSIONS.find((m) => m.id === id);
}

/**
 * 라운드가 끝날 때마다 호출 — 개방 조건을 검사합니다.
 * @param {number} wave 방금 클리어한 라운드
 */
export function refreshMissions(wave) {
  for (const def of MISSIONS) {
    const st = state.missions[def.id];

    // 반복 미션: 5의 배수 라운드마다 다시 열림
    if (def.repeatable) {
      if (isUnlockedAt(def, wave) && st.status !== 'active') {
        st.status = 'ready';
        st.unlockedWave = wave;
        showToast(`미션 개방 — ${def.name}`, 1.6);
      }
      continue;
    }

    // 1회성 미션: 아직 안 깼고 조건 라운드에 도달하면 열림
    if (st.status === 'locked' && isUnlockedAt(def, wave)) {
      st.status = 'ready';
      st.unlockedWave = wave;
      showToast(`미션 개방 — ${def.name}`, 1.8);
    }
  }
}

/** 도전 가능 여부 */
export function canStart(id) {
  return state.missions[id]?.status === 'ready' &&
    (state.phase === 'prep' || state.phase === 'combat');
}

/**
 * 미션 시작 — 전용 보스를 경로에 소환합니다.
 * @param {string} id
 */
export function startMission(id) {
  const def = missionDef(id);
  const st = state.missions[id];
  if (!canStart(id)) {
    showToast('지금은 도전할 수 없는 미션입니다.', 1.2);
    return false;
  }

  const wave = Math.max(1, state.wave);
  const enemy = new Enemy(def.enemy, hpScale(wave, true), rewardScale(wave), id);
  state.enemies.push(enemy);

  st.status = 'active';
  showToast(`${def.name} 시작! ${def.icon} ${enemy.name} 등장`, 2);
  return true;
}

/** 미션 보스를 처치했을 때 (combat.js에서 호출) */
export function onMissionEnemyKilled(enemy) {
  const def = missionDef(enemy.missionId);
  const st = state.missions[enemy.missionId];
  if (!def || !st) return;

  const reward = missionReward(def, st.unlockedWave || state.wave);
  earn(reward);
  addFloater(enemy.x, enemy.y - 20, `미션 성공 +${reward}G`, '#4fd1a5');
  addEffect({ type: 'burst', x: enemy.x, y: enemy.y, color: '#4fd1a5', radius: 70, life: 0.6 });
  showToast(`${def.name} 성공! +${reward}G`, 2.2);
  SFX.missionClear();

  st.clears++;
  state.stats.missions++;
  // 반복 미션은 다음 개방 라운드까지 잠금, 1회성은 영구 완료
  st.status = def.repeatable ? 'locked' : 'done';
}

/** 미션 보스를 놓쳤을 때 (wave.js에서 호출) — 라이프는 깎지 않습니다 */
export function onMissionEnemyEscaped(enemy) {
  const def = missionDef(enemy.missionId);
  const st = state.missions[enemy.missionId];
  if (!def || !st) return;

  showToast(`${def.name} 실패 — 다시 도전할 수 있습니다.`, 2);
  st.status = 'ready';
}

/** UI 표시용 요약 */
export function missionSummary() {
  return MISSIONS.map((def) => {
    const st = state.missions[def.id];
    const wave = st.unlockedWave || state.wave;
    let statusText;
    if (st.status === 'ready') statusText = '도전 가능';
    else if (st.status === 'active') statusText = '진행 중';
    else if (st.status === 'done') statusText = '완료';
    else statusText = def.repeatable
      ? `${def.every}라운드마다 개방`
      : `${def.at}라운드 개방`;

    return {
      id: def.id,
      icon: def.icon,
      name: def.name,
      hint: def.hint,
      desc: def.desc,
      status: st.status,
      statusText,
      clears: st.clears,
      reward: missionReward(def, wave),
      canStart: canStart(def.id),
    };
  });
}
