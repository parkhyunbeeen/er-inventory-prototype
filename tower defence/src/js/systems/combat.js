// ============================================================
// combat.js — 타깃팅 / 발사 / 피해 처리
//
// 두 가지 공격 방식이 있습니다.
//   1) 투사체형 — 타깃을 향해 발사체가 날아가 명중 판정
//   2) 파동형(pulse) — 사거리 전체를 즉시 내리침 (폭풍의 첨탑)
// ============================================================

import { Projectile } from '../entities/Projectile.js';
import { state, addEffect } from '../core/state.js';
import { earn } from './economy.js';
import { towerDamage } from './upgrade.js';
import { onMissionEnemyKilled } from './mission.js';

/** 사거리 안에서 가장 앞선(경로 진행도 최대) 적 찾기 */
function findTarget(tower) {
  let best = null;
  let bestProgress = -1;
  for (const e of state.enemies) {
    if (e.dead || e.escaped) continue;
    const d = Math.hypot(e.x - tower.x, e.y - tower.y);
    if (d > tower.range) continue;
    if (e.traveled > bestProgress) {
      bestProgress = e.traveled;
      best = e;
    }
  }
  return best;
}

/** 사거리 안에 적이 하나라도 있는지 (파동형용) */
function enemiesInRange(tower) {
  const list = [];
  for (const e of state.enemies) {
    if (e.dead || e.escaped) continue;
    if (Math.hypot(e.x - tower.x, e.y - tower.y) <= tower.range) list.push(e);
  }
  return list;
}

/** 상태이상 적용 (둔화 / 화상 / 기절) */
function applyStatus(tower, enemy) {
  if (tower.slow) enemy.applySlow(tower.slow.amount, tower.slow.duration);
  if (tower.burn) enemy.applyBurn(tower.burn.dps, tower.burn.duration);
  if (tower.stun) enemy.applyStun(tower.stun.duration);
}

/** 명중 시 효과 적용 (투사체형) */
function applyHit(tower, target, x, y) {
  const opts = { pierceArmor: tower.pierceArmor };
  const dmg = towerDamage(tower);

  // 스플래시
  if (tower.splash > 0) {
    addEffect({ type: 'burst', x, y, color: tower.color, radius: tower.splash, life: 0.25 });
    for (const e of state.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - x, e.y - y);
      if (d <= tower.splash) {
        const falloff = d <= tower.splash * 0.4 ? 1 : 0.6;
        e.takeDamage(dmg * falloff, opts);
        applyStatus(tower, e);
      }
    }
    return;
  }

  // 단일 타격
  target.takeDamage(dmg, opts);
  applyStatus(tower, target);

  // 연쇄
  if (tower.chain) {
    let chainDmg = dmg * tower.chain.falloff;
    let from = target;
    const hitSet = new Set([target]);
    for (let i = 0; i < tower.chain.count; i++) {
      let next = null;
      let nearest = Infinity;
      for (const e of state.enemies) {
        if (e.dead || hitSet.has(e)) continue;
        const d = Math.hypot(e.x - from.x, e.y - from.y);
        if (d < nearest && d <= tower.chain.radius) {
          nearest = d;
          next = e;
        }
      }
      if (!next) break;
      addEffect({
        type: 'beam',
        x1: from.x, y1: from.y, x2: next.x, y2: next.y,
        color: tower.color, life: 0.15,
      });
      next.takeDamage(chainDmg, opts);
      applyStatus(tower, next);
      hitSet.add(next);
      from = next;
      chainDmg *= tower.chain.falloff;
    }
  }
}

/** 파동형 공격 — 사거리 전체를 즉시 타격 + 기절 */
function firePulse(tower, targets) {
  const opts = { pierceArmor: tower.pierceArmor };
  const dmg = towerDamage(tower);

  addEffect({
    type: 'ring',
    x: tower.x, y: tower.y,
    color: tower.color,
    radius: tower.range,
    life: 0.4,
  });

  for (const e of targets) {
    e.takeDamage(dmg, opts);
    applyStatus(tower, e);
  }
}

/** 타워 1개의 사격 갱신 */
export function updateTower(tower, dt) {
  if (tower.spawnAnim > 0) tower.spawnAnim = Math.max(0, tower.spawnAnim - dt * 3);
  if (tower.cooldownTimer > 0) tower.cooldownTimer -= dt;

  // --- 파동형 (폭풍의 첨탑) ---
  if (tower.pulse) {
    if (tower.cooldownTimer > 0) return;
    const targets = enemiesInRange(tower);
    if (targets.length === 0) return;
    tower.cooldownTimer = tower.cooldown;
    firePulse(tower, targets);
    return;
  }

  // --- 투사체형 ---
  const target = findTarget(tower);
  if (!target) return;

  tower.angle = Math.atan2(target.y - tower.y, target.x - tower.x);

  if (tower.cooldownTimer > 0) return;
  tower.cooldownTimer = tower.cooldown;

  state.projectiles.push(
    new Projectile({
      x: tower.x,
      y: tower.y,
      target,
      speed: tower.projectileSpeed,
      color: tower.color,
      size: tower.isLegendary ? 7 : 3 + tower.tier,
      onHit: (t, hx, hy) => applyHit(tower, t, hx, hy),
    })
  );
}

/** 처치된 적 정리 + 보상 지급 */
export function collectKills() {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    if (e.dead) {
      earn(e.reward, e.x, e.y);
      state.stats.killed++;
      addEffect({ type: 'burst', x: e.x, y: e.y, color: e.color, radius: e.radius * 1.8, life: 0.22 });
      if (e.missionId) onMissionEnemyKilled(e);
      state.enemies.splice(i, 1);
    }
  }
}
