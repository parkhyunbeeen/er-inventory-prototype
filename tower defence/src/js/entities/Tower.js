// ============================================================
// Tower.js — 타워 개체
// 일반 타워: familyId + tier(0~3)
// 전설 타워: legendaryId 로 고유 수치 사용 (tier = 4)
//
// 주의: `damage` 는 강화가 적용되지 않은 기본 공격력입니다.
//       실제 피해량은 systems/upgrade.js 의 towerDamage(tower) 로 계산합니다.
// ============================================================

import { CONFIG } from '../data/config.js';
import { FAMILIES, RARITIES, LEGENDARY_TIER } from '../data/towers.js';
import { LEGENDARY_TOWERS } from '../data/legendary.js';
import { indexToTile, tileCenter } from '../core/grid.js';

let nextId = 1;

export class Tower {
  /**
   * @param {number} tileIdx
   * @param {{familyId?:string, tier?:number, legendaryId?:string}} opts
   */
  constructor(tileIdx, opts) {
    this.uid = nextId++;
    this.tileIdx = tileIdx;
    const { col, row } = indexToTile(tileIdx);
    const c = tileCenter(col, row);
    this.x = c.x;
    this.y = c.y;

    this.cooldownTimer = 0;
    this.spawnAnim = 1; // 등장 연출용 (1 → 0)
    this.angle = -Math.PI / 2;

    if (opts.legendaryId) {
      const def = LEGENDARY_TOWERS.find((t) => t.id === opts.legendaryId);
      this.isLegendary = true;
      this.legendaryId = def.id;
      this.familyId = null;
      this.tier = LEGENDARY_TIER;
      this.name = def.name;
      this.shape = def.shape;
      this.color = def.color;
      this.role = def.role;
      this.desc = def.desc;
      this.damage = def.damage;
      this.cooldown = def.cooldown;
      this.range = def.range;
      this.projectileSpeed = def.projectileSpeed ?? 0;
      this.splash = def.splash || 0;
      this.chain = def.chain || null;
      this.slow = def.slow || null;
      this.burn = def.burn || null;
      this.stun = def.stun || null;
      this.pulse = !!def.pulse;
      this.pierceArmor = !!def.pierceArmor;
    } else {
      const fam = FAMILIES[opts.familyId];
      const tier = opts.tier ?? 0;
      const rar = RARITIES[tier];
      this.isLegendary = false;
      this.familyId = fam.id;
      this.tier = tier;
      this.name = `${rar.name} ${fam.name}`;
      this.shape = fam.shape;
      this.color = fam.color;
      this.role = fam.role;
      this.desc = fam.desc;
      this.damage = Math.round(fam.damage * rar.mult);
      this.cooldown =
        fam.cooldown * (1 - CONFIG.rarityBonus.cooldownPerTier * tier);
      this.range = Math.round(
        fam.range * (1 + CONFIG.rarityBonus.rangePerTier * tier)
      );
      this.projectileSpeed = fam.projectileSpeed;
      this.splash = fam.splash || 0;
      this.chain = fam.chain || null;
      this.slow = fam.slow || null;
      this.burn = null;
      this.stun = null;
      this.pulse = false;
      this.pierceArmor = false;
    }
  }

  get rarity() {
    return RARITIES[this.tier];
  }

  /** 판매 환급액 */
  get sellValue() {
    // 이 타워를 만드는 데 들어간 일반 타워 수 × 소환가 × 환급률
    const copies = this.isLegendary
      ? Math.pow(CONFIG.merge.required, 3) * CONFIG.merge.legendaryRequired
      : Math.pow(CONFIG.merge.required, this.tier);
    return Math.round(
      copies * CONFIG.economy.summonCost * CONFIG.economy.sellRatio
    );
  }

  /** 같은 계열 + 같은 등급인지 (합성 재료 판정) */
  matches(other) {
    return (
      !this.isLegendary &&
      !other.isLegendary &&
      this.familyId === other.familyId &&
      this.tier === other.tier
    );
  }
}
