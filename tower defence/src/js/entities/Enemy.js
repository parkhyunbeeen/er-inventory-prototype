// ============================================================
// Enemy.js — 적 개체
// 상태이상: 둔화(slow) / 화상(burn) / 기절(stun)
// ============================================================

import { PATH_POINTS } from '../core/grid.js';
import { ENEMIES } from '../data/enemies.js';

export class Enemy {
  /**
   * @param {string} typeId enemies.js의 키
   * @param {number} hpMult 웨이브 체력 배율
   * @param {number} rewardMult 웨이브 보상 배율
   * @param {string|null} missionId 미션으로 소환된 경우 미션 id
   */
  constructor(typeId, hpMult, rewardMult, missionId = null) {
    const def = ENEMIES[typeId];
    this.def = def;
    this.typeId = typeId;
    this.name = def.name;
    this.shape = def.shape;
    this.color = def.color;
    this.radius = def.radius;
    this.armor = def.armor;
    this.isBoss = !!def.isBoss;
    this.isMission = !!def.isMission;
    this.missionId = missionId;
    this.stunResist = def.stunResist ?? 0;

    this.maxHp = Math.round(def.hp * hpMult);
    this.hp = this.maxHp;
    this.reward = Math.round(def.reward * rewardMult);
    this.baseSpeed = def.speed;

    // 경로 진행 상태
    this.segment = 0;
    this.x = PATH_POINTS[0].x;
    this.y = PATH_POINTS[0].y;
    this.traveled = 0;

    // 상태이상
    this.slow = null;   // { amount, timer }
    this.burn = null;   // { dps, timer }
    this.stun = null;   // { timer }
    this.flash = 0;     // 피격 점멸

    this.dead = false;
    this.escaped = false;
  }

  get speed() {
    if (this.stun) return 0;
    const mult = this.slow ? 1 - this.slow.amount : 1;
    return this.baseSpeed * mult;
  }

  takeDamage(amount, opts = {}) {
    const armor = opts.pierceArmor ? 0 : this.armor;
    const dmg = Math.max(1, Math.round(amount - armor));
    this.hp -= dmg;
    this.flash = 0.08;
    if (this.hp <= 0) this.dead = true;
    return dmg;
  }

  applySlow(amount, duration) {
    if (!this.slow || amount >= this.slow.amount) {
      this.slow = { amount, timer: duration };
    } else {
      this.slow.timer = Math.max(this.slow.timer, duration);
    }
  }

  applyBurn(dps, duration) {
    this.burn = { dps, timer: duration };
  }

  /** 기절 — 저항 비율만큼 지속시간이 줄어듭니다 */
  applyStun(duration) {
    const actual = duration * (1 - this.stunResist);
    if (actual <= 0) return;
    if (!this.stun || actual > this.stun.timer) this.stun = { timer: actual };
  }

  update(dt) {
    if (this.flash > 0) this.flash -= dt;

    if (this.slow) {
      this.slow.timer -= dt;
      if (this.slow.timer <= 0) this.slow = null;
    }
    if (this.stun) {
      this.stun.timer -= dt;
      if (this.stun.timer <= 0) this.stun = null;
    }
    if (this.burn) {
      this.burn.timer -= dt;
      this.hp -= this.burn.dps * dt;
      if (this.hp <= 0) this.dead = true;
      if (this.burn.timer <= 0) this.burn = null;
    }

    // 경로 이동 (기절 중에는 speed 가 0이라 제자리에 묶입니다)
    let move = this.speed * dt;
    while (move > 0 && this.segment < PATH_POINTS.length - 1) {
      const target = PATH_POINTS[this.segment + 1];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist <= move) {
        this.x = target.x;
        this.y = target.y;
        this.traveled += dist;
        move -= dist;
        this.segment++;
      } else {
        this.x += (dx / dist) * move;
        this.y += (dy / dist) * move;
        this.traveled += move;
        move = 0;
      }
    }

    if (this.segment >= PATH_POINTS.length - 1) {
      this.escaped = true;
    }
  }
}
