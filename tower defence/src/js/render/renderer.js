// ============================================================
// renderer.js — 캔버스 드로잉 총괄
// ============================================================

import { CONFIG } from '../data/config.js';
import { PATH_POINTS, PATH_TILES, tileIndex, isBuildable } from '../core/grid.js';
import { state, selectedTowers } from '../core/state.js';
import { drawTower, drawEnemy } from './shapes.js';

const { cols, rows, tile } = CONFIG.grid;

let hoverTile = null;
export function setHoverTile(t) {
  hoverTile = t;
}

// 게임 판 색 — 잔디(녹색) 계열
const FIELD = {
  base: '#123021',        // 판 배경
  tileA: '#17402a',       // 잔디 밝은 칸
  tileB: '#143a26',       // 잔디 어두운 칸
  pathTile: '#3b3327',    // 경로가 지나는 칸 (흙색)
  pathLine: 'rgba(196,164,110,0.42)', // 경로 띠
  grid: 'rgba(255,255,255,0.05)',
  label: '#cfe6d4',
};

function drawBoard(ctx) {
  // 배경
  ctx.fillStyle = FIELD.base;
  ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);

  // 타일
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tile;
      const y = r * tile;
      const onPath = PATH_TILES.has(tileIndex(c, r));
      ctx.fillStyle = onPath
        ? FIELD.pathTile
        : (c + r) % 2 === 0
        ? FIELD.tileA
        : FIELD.tileB;
      ctx.fillRect(x, y, tile, tile);
      ctx.strokeStyle = FIELD.grid;
      ctx.strokeRect(x + 0.5, y + 0.5, tile - 1, tile - 1);
    }
  }

  // 경로 라인
  ctx.save();
  ctx.strokeStyle = FIELD.pathLine;
  ctx.lineWidth = 26;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  PATH_POINTS.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();
  ctx.restore();

  // 시작/종료 표시
  ctx.save();
  ctx.font = 'bold 12px sans-serif';
  ctx.fillStyle = FIELD.label;
  ctx.fillText('START', 4, PATH_POINTS[0].y - 22);
  ctx.textAlign = 'right';
  ctx.fillText('GOAL', CONFIG.canvas.width - 4, PATH_POINTS[PATH_POINTS.length - 1].y - 22);
  ctx.restore();

  // 마우스 오버 슬롯
  if (hoverTile && isBuildable(hoverTile.col, hoverTile.row)) {
    const occupied = state.towers.has(tileIndex(hoverTile.col, hoverTile.row));
    const cost = CONFIG.economy.summonCost;
    const affordable = state.gold >= cost;

    ctx.save();
    ctx.strokeStyle = occupied
      ? 'rgba(255,255,255,0.4)'
      : affordable
      ? 'rgba(180,255,205,0.95)'
      : 'rgba(255,140,140,0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(hoverTile.col * tile + 2, hoverTile.row * tile + 2, tile - 4, tile - 4);
    ctx.restore();

    // 빈 슬롯이면 소환 가격표를 띄웁니다
    if (!occupied) drawPriceTag(ctx, hoverTile, cost, affordable);
  }
}

/**
 * 빈 슬롯 위에 "🎲 50G" 형태의 가격표를 그립니다.
 * 골드가 모자라면 빨간색으로 바뀌어 지금 못 짓는다는 걸 바로 알 수 있습니다.
 */
function drawPriceTag(ctx, t, cost, affordable) {
  const label = `${cost}G`;
  const cx = t.col * tile + tile / 2;
  // 맨 윗줄이면 타일 아래쪽에, 그 외에는 위쪽에 붙여 화면 밖으로 나가지 않게 합니다
  const above = t.row > 0;
  const cy = above ? t.row * tile - 4 : (t.row + 1) * tile + 20;

  ctx.save();
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const w = ctx.measureText(label).width + 30;
  const h = 22;
  const x = cx - w / 2;
  const y = cy - h / 2;

  // 배경
  ctx.fillStyle = 'rgba(10,16,12,0.9)';
  ctx.strokeStyle = affordable ? 'rgba(93,220,122,0.9)' : 'rgba(255,110,110,0.9)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();

  // 꼬리 (말풍선 느낌)
  ctx.beginPath();
  if (above) {
    ctx.moveTo(cx - 5, y + h);
    ctx.lineTo(cx + 5, y + h);
    ctx.lineTo(cx, y + h + 5);
  } else {
    ctx.moveTo(cx - 5, y);
    ctx.lineTo(cx + 5, y);
    ctx.lineTo(cx, y - 5);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(10,16,12,0.9)';
  ctx.fill();

  // 텍스트 — 주사위 아이콘 + 금액
  ctx.fillStyle = affordable ? '#ffd23d' : '#ff8a8a';
  ctx.fillText(`🎲 ${label}`, cx, cy + 1);
  ctx.restore();
}

/** 둥근 사각형 경로 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawRanges(ctx) {
  for (const t of selectedTowers()) {
    ctx.save();
    ctx.fillStyle = 'rgba(120,180,255,0.07)';
    ctx.strokeStyle = 'rgba(120,180,255,0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.range, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawProjectiles(ctx) {
  for (const p of state.projectiles) {
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawEffects(ctx) {
  for (const e of state.effects) {
    const a = Math.max(0, e.life / e.maxLife);
    ctx.save();
    ctx.globalAlpha = a;
    if (e.type === 'ring' || e.type === 'burst') {
      ctx.strokeStyle = e.color;
      ctx.lineWidth = e.type === 'burst' ? 4 : 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * (1.15 - a * 0.55), 0, Math.PI * 2);
      ctx.stroke();
    } else if (e.type === 'beam') {
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 3;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(e.x1, e.y1);
      ctx.lineTo(e.x2, e.y2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawFloaters(ctx) {
  ctx.save();
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.restore();
}

function drawOverlay(ctx) {
  // 설정창이 열려 있으면 판을 어둡게 덮어 일시정지임을 알립니다
  if (state.settingsOpen) {
    ctx.save();
    ctx.fillStyle = 'rgba(6,12,8,0.6)';
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    ctx.fillStyle = '#dfe9f5';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('일시정지', CONFIG.canvas.width / 2, CONFIG.canvas.height / 2);
    ctx.restore();
  }

  if (state.phase === 'over' || state.phase === 'clear') {
    ctx.save();
    ctx.fillStyle = 'rgba(8,10,16,0.82)';
    ctx.fillRect(0, 0, CONFIG.canvas.width, CONFIG.canvas.height);
    ctx.textAlign = 'center';
    const cx = CONFIG.canvas.width / 2;
    const cy = CONFIG.canvas.height / 2;

    ctx.fillStyle = state.phase === 'clear' ? '#ffc83d' : '#ff5c5c';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillText(state.phase === 'clear' ? 'GAME CLEAR!' : 'GAME OVER', cx, cy - 18);

    ctx.fillStyle = '#c9d3e4';
    ctx.font = '15px sans-serif';
    ctx.fillText(
      `도달 라운드 ${state.wave} · 처치 ${state.stats.killed} · 합성 ${state.stats.merges} · 전설 ${state.stats.legendaries}`,
      cx,
      cy + 16
    );
    ctx.fillStyle = '#7f8ca3';
    ctx.font = '13px sans-serif';
    ctx.fillText('다시 시작하려면 아래 [재시작] 버튼을 누르세요', cx, cy + 44);
    ctx.restore();
  }

  // 토스트
  if (state.toast.timer > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, state.toast.timer * 2);
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    const w = ctx.measureText(state.toast.text).width + 28;
    const x = CONFIG.canvas.width / 2;
    ctx.fillStyle = 'rgba(10,13,20,0.85)';
    ctx.fillRect(x - w / 2, 12, w, 30);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.strokeRect(x - w / 2, 12, w, 30);
    ctx.fillStyle = '#e8eefc';
    ctx.fillText(state.toast.text, x, 32);
    ctx.restore();
  }
}

/** 한 프레임 전체 그리기 */
export function render(ctx) {
  drawBoard(ctx);
  drawRanges(ctx);
  for (const t of state.towers.values()) {
    drawTower(ctx, t, state.selection.includes(t.tileIdx));
  }
  for (const e of state.enemies) drawEnemy(ctx, e);
  drawProjectiles(ctx);
  drawEffects(ctx);
  drawFloaters(ctx);
  drawOverlay(ctx);
}
