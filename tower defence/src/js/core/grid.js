// ============================================================
// grid.js — 격자 좌표 / 적 이동 경로 관리
// 경로는 아래 WAYPOINTS(타일 좌표)를 잇는 S자 형태입니다.
// ============================================================

import { CONFIG } from '../data/config.js';

const { cols, rows, tile } = CONFIG.grid;

/** 경로 꺾임점 (타일 좌표 [col, row]) — 좌측 진입 → S자 → 우측 탈출 */
const WAYPOINTS = [
  [-1, 1],
  [9, 1],
  [9, 4],
  [2, 4],
  [2, 6],
  [cols, 6],
];

/** 타일 인덱스 ↔ 좌표 변환 */
export function tileIndex(col, row) {
  return row * cols + col;
}
export function indexToTile(idx) {
  return { col: idx % cols, row: Math.floor(idx / cols) };
}

/** 타일 중심의 픽셀 좌표 */
export function tileCenter(col, row) {
  return { x: col * tile + tile / 2, y: row * tile + tile / 2 };
}

/** 픽셀 좌표 → 타일 좌표 (범위 밖이면 null) */
export function pixelToTile(x, y) {
  const col = Math.floor(x / tile);
  const row = Math.floor(y / tile);
  if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
  return { col, row };
}

/** 경로가 지나는 타일 인덱스 집합 */
export const PATH_TILES = (() => {
  const set = new Set();
  for (let i = 0; i < WAYPOINTS.length - 1; i++) {
    const [c1, r1] = WAYPOINTS[i];
    const [c2, r2] = WAYPOINTS[i + 1];
    const dc = Math.sign(c2 - c1);
    const dr = Math.sign(r2 - r1);
    let c = c1;
    let r = r1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (c >= 0 && c < cols && r >= 0 && r < rows) set.add(tileIndex(c, r));
      if (c === c2 && r === r2) break;
      c += dc;
      r += dr;
    }
  }
  return set;
})();

/** 적이 따라가는 픽셀 좌표 경로 */
export const PATH_POINTS = WAYPOINTS.map(([c, r]) => tileCenter(c, r));

/** 경로 전체 길이(px) — 진행도 계산용 */
export const PATH_LENGTH = (() => {
  let total = 0;
  for (let i = 0; i < PATH_POINTS.length - 1; i++) {
    total += Math.hypot(
      PATH_POINTS[i + 1].x - PATH_POINTS[i].x,
      PATH_POINTS[i + 1].y - PATH_POINTS[i].y
    );
  }
  return total;
})();

/** 배치 가능한 타일인지 */
export function isBuildable(col, row) {
  return !PATH_TILES.has(tileIndex(col, row));
}

/** 배치 가능한 전체 슬롯 수 */
export const BUILDABLE_COUNT = cols * rows - PATH_TILES.size;
