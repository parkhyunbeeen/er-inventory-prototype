// ============================================================
// Projectile.js — 투사체
// 타깃을 추적하다 명중하면 onHit 콜백을 실행합니다.
// ============================================================

export class Projectile {
  /**
   * @param {object} cfg
   * @param {number} cfg.x @param {number} cfg.y
   * @param {import('./Enemy.js').Enemy} cfg.target
   * @param {number} cfg.speed
   * @param {string} cfg.color
   * @param {number} cfg.size
   * @param {(target:import('./Enemy.js').Enemy, x:number, y:number)=>void} cfg.onHit
   */
  constructor(cfg) {
    this.x = cfg.x;
    this.y = cfg.y;
    this.target = cfg.target;
    this.speed = cfg.speed;
    this.color = cfg.color;
    this.size = cfg.size ?? 4;
    this.onHit = cfg.onHit;
    this.dead = false;
    this.life = 3; // 안전장치 (초)
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }
    // 타깃이 이미 죽었으면 소멸
    if (!this.target || this.target.dead || this.target.escaped) {
      this.dead = true;
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.hypot(dx, dy);
    const move = this.speed * dt;

    if (dist <= move + this.target.radius) {
      this.x = this.target.x;
      this.y = this.target.y;
      this.dead = true;
      this.onHit(this.target, this.x, this.y);
      return;
    }

    this.x += (dx / dist) * move;
    this.y += (dy / dist) * move;
  }
}
