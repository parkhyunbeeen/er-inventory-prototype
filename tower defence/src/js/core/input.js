// ============================================================
// input.js — 마우스 입력을 게임 의도로 변환
// ============================================================

import { CONFIG } from '../data/config.js';
import { MAX_MERGE_TIER } from '../data/towers.js';
import { state, clearSelection, isRunning } from './state.js';
import { pixelToTile, tileIndex, isBuildable } from './grid.js';
import { summonAt } from '../systems/summon.js';
import { setHoverTile } from '../render/renderer.js';
import { SFX } from '../systems/audio.js';

function canvasPos(canvas, evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = CONFIG.canvas.width / rect.width;
  const scaleY = CONFIG.canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY,
  };
}

/** 타워 클릭 시 선택 규칙 */
function handleTowerClick(idx) {
  const tower = state.towers.get(idx);
  if (!tower) return;

  // 이미 선택되어 있으면 해제
  if (state.selection.includes(idx)) {
    state.selection = state.selection.filter((i) => i !== idx);
    return;
  }

  const selected = state.selection
    .map((i) => state.towers.get(i))
    .filter(Boolean);

  const isEpic = (t) => !t.isLegendary && t.tier === MAX_MERGE_TIER;

  // 전설 조합 모드: 선택된 것이 모두 영웅이고 새로 누른 것도 영웅이면 추가
  if (
    selected.length > 0 &&
    selected.every(isEpic) &&
    isEpic(tower) &&
    selected.length < CONFIG.merge.legendaryRequired
  ) {
    state.selection.push(idx);
    return;
  }

  // 그 외에는 새로 선택
  state.selection = [idx];
}

export function bindInput(canvas) {
  canvas.addEventListener('mousemove', (evt) => {
    const { x, y } = canvasPos(canvas, evt);
    setHoverTile(pixelToTile(x, y));
  });

  canvas.addEventListener('mouseleave', () => setHoverTile(null));

  // 우클릭 → 선택 해제 (ESC 는 설정창 열기로 옮겼습니다)
  canvas.addEventListener('contextmenu', (evt) => {
    evt.preventDefault();
    clearSelection();
  });

  canvas.addEventListener('click', (evt) => {
    if (!isRunning()) return;
    if (state.phase === 'over' || state.phase === 'clear') return;

    const { x, y } = canvasPos(canvas, evt);
    const t = pixelToTile(x, y);
    if (!t) return;

    const idx = tileIndex(t.col, t.row);

    if (state.towers.has(idx)) {
      handleTowerClick(idx);
      return;
    }

    if (!isBuildable(t.col, t.row)) {
      clearSelection();
      return;
    }

    // 빈 슬롯 → 랜덤 소환
    const tower = summonAt(idx);
    if (tower) SFX.summon();
    state.selection = tower ? [idx] : [];
  });
}
