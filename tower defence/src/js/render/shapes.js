// ============================================================
// shapes.js — 도형 드로잉 모듈
//
// ★ 컨셉이 확정되면 이 파일만 스프라이트 드로잉으로 교체하면 됩니다.
//   (다른 파일은 shape 문자열만 넘길 뿐 그리는 방법을 알지 못합니다)
// ============================================================

/** 정n각형 경로 */
function polygon(ctx, x, y, radius, sides, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const a = rotation + (i * Math.PI * 2) / sides;
    const px = x + Math.cos(a) * radius;
    const py = y + Math.sin(a) * radius;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** 별 모양 경로 */
function starPath(ctx, x, y, outer, inner, points, rotation = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = rotation + (i * Math.PI) / points;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** 방패 모양 경로 */
function shieldPath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.85, y - r * 0.5);
  ctx.lineTo(x + r * 0.7, y + r * 0.45);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.7, y + r * 0.45);
  ctx.lineTo(x - r * 0.85, y - r * 0.5);
  ctx.closePath();
}

/** 프리즘(길쭉한 육각) 경로 */
function prismPath(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.8, y - r * 0.35);
  ctx.lineTo(x + r * 0.55, y + r * 0.9);
  ctx.lineTo(x - r * 0.55, y + r * 0.9);
  ctx.lineTo(x - r * 0.8, y - r * 0.35);
  ctx.closePath();
}

/**
 * 지정한 모양의 경로를 만듭니다. (fill/stroke는 호출부에서)
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} shape
 */
export function shapePath(ctx, shape, x, y, r) {
  switch (shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      break;
    case 'triangle':
      polygon(ctx, x, y, r * 1.15, 3);
      break;
    case 'square':
      polygon(ctx, x, y, r * 1.08, 4, Math.PI / 4);
      break;
    case 'diamond':
      polygon(ctx, x, y, r * 1.15, 4);
      break;
    case 'pentagon':
      polygon(ctx, x, y, r, 5);
      break;
    case 'hexagon':
      polygon(ctx, x, y, r, 6);
      break;
    case 'star':
      starPath(ctx, x, y, r * 1.2, r * 0.5, 5);
      break;
    case 'burst':
      starPath(ctx, x, y, r * 1.2, r * 0.62, 8);
      break;
    case 'shield':
      shieldPath(ctx, x, y, r * 1.1);
      break;
    case 'prism':
      prismPath(ctx, x, y, r * 1.1);
      break;
    default:
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
  }
}

/**
 * 타워 한 개를 그립니다.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../entities/Tower.js').Tower} tower
 * @param {boolean} selected
 */
export function drawTower(ctx, tower, selected) {
  const scale = 1 + tower.spawnAnim * 0.35;
  const r = 20 * scale;
  const rar = tower.rarity;

  // 등급 테두리(바깥 링)
  ctx.save();
  if (tower.isLegendary) {
    ctx.shadowColor = rar.border;
    ctx.shadowBlur = 16;
  }
  shapePath(ctx, tower.shape, tower.x, tower.y, r);
  ctx.fillStyle = tower.color;
  ctx.fill();
  ctx.lineWidth = tower.isLegendary ? 4 : 3;
  ctx.strokeStyle = rar.border;
  ctx.stroke();
  ctx.restore();

  // 포신 (조준 방향)
  ctx.save();
  ctx.translate(tower.x, tower.y);
  ctx.rotate(tower.angle);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(r * 0.4, -3, r * 0.75, 6);
  ctx.restore();

  // 등급 표식 (점 / 별)
  ctx.save();
  ctx.fillStyle = rar.border;
  if (tower.isLegendary) {
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', tower.x, tower.y + r + 11);
  } else {
    const n = rar.dots;
    const gap = 6;
    const startX = tower.x - ((n - 1) * gap) / 2;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.arc(startX + i * gap, tower.y + r + 6, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 선택 표시
  if (selected) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.arc(tower.x, tower.y, r + 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * 적 한 마리를 그립니다.
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('../entities/Enemy.js').Enemy} enemy
 */
export function drawEnemy(ctx, enemy) {
  const r = enemy.radius;

  ctx.save();
  shapePath(ctx, enemy.shape, enemy.x, enemy.y, r);
  ctx.fillStyle = enemy.flash > 0 ? '#ffffff' : enemy.color;
  ctx.fill();
  ctx.lineWidth = enemy.isBoss ? 3 : 1.5;
  ctx.strokeStyle = enemy.isMission
    ? '#ffffff'
    : enemy.isBoss
    ? '#ffd23d'
    : 'rgba(0,0,0,0.5)';
  ctx.stroke();
  ctx.restore();

  // 기절 표시 — 노란 링 + 상단 별
  if (enemy.stun) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,210,61,0.95)';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = '#ffd23d';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✳', enemy.x, enemy.y - r - 14);
    ctx.restore();
  }

  // 둔화 표시
  if (enemy.slow) {
    ctx.save();
    ctx.strokeStyle = 'rgba(94,203,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, r + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // 화상 표시
  if (enemy.burn) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,122,61,0.8)';
    ctx.beginPath();
    ctx.arc(enemy.x + r, enemy.y - r, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 미션 보스 이름표
  if (enemy.isMission) {
    ctx.save();
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = enemy.color;
    ctx.fillText(enemy.name, enemy.x, enemy.y + r + 14);
    ctx.restore();
  }

  // 체력바
  const w = Math.max(22, r * 2);
  const ratio = Math.max(0, enemy.hp / enemy.maxHp);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(enemy.x - w / 2, enemy.y - r - 10, w, 4);
  ctx.fillStyle = ratio > 0.5 ? '#5ddc7a' : ratio > 0.25 ? '#ffd23d' : '#ff5c5c';
  ctx.fillRect(enemy.x - w / 2, enemy.y - r - 10, w * ratio, 4);
}
