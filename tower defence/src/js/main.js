// ============================================================
// main.js — 부트스트랩 + 게임 루프
// ============================================================

import { CONFIG } from './data/config.js';
import {
  state, resetState, selectedTowers, clearSelection,
  cycleSpeed, setSpeed, isRunning, showToast,
} from './core/state.js';
import { bindInput } from './core/input.js';
import { tileIndex, isBuildable } from './core/grid.js';
import { summonAt } from './systems/summon.js';
import { render } from './render/renderer.js';
import { initHud, updateHud, hudElements } from './render/hud.js';
import { initScreens, showGame, showTitle, toggleSettings, closeSettings, openConfirm } from './render/screens.js';
import { updateTower, collectKills } from './systems/combat.js';
import { updateWave, skipPrep, startPrep, beginWave } from './systems/wave.js';
import { mergeTo, mergeOptions, mergeLegendary, legendaryStatus } from './systems/merge.js';
import { earn } from './systems/economy.js';
import { buyUpgrade, upgradeCost } from './systems/upgrade.js';
import { summonCost } from './systems/economy.js';
import { startMission, refreshMissions } from './systems/mission.js';
import { SFX } from './systems/audio.js';

const canvas = document.getElementById('game');
canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;
const ctx = canvas.getContext('2d');

// --- 화면(타이틀/게임) + 설정창 ------------------------------------

initScreens({
  // [시작하기] — 새 판을 시작합니다
  start: () => {
    resetState();
    startPrep();
    showGame();
  },
  // [게임 나가기] — 타이틀로 돌아갑니다
  exit: () => {
    showTitle();
    resetState();
    startPrep();
  },
});

// --- HUD 버튼 배선 --------------------------------------------------

initHud({
  merge: (targetTier) => {
    const sel = selectedTowers();
    if (sel.length === 1 && mergeTo(sel[0], targetTier)) SFX.merge(targetTier);
  },
  mission: (id) => {
    if (startMission(id)) SFX.missionStart();
  },
  upgrade: (tier) => requestUpgrade(tier),
});

/**
 * 강화 구매 요청.
 *
 * 초반에 강화에 골드를 전부 써버리면 타워를 한 대도 못 세우고 무너집니다.
 * 그래서 설정된 라운드까지는, 이번 강화로 남은 골드가 소환 비용보다
 * 적어지는 경우 한 번 확인을 받습니다.
 */
function requestUpgrade(tier) {
  const cost = upgradeCost(tier);
  const summon = summonCost();
  const left = state.gold - (cost ?? 0);

  const earlyGame = state.wave <= CONFIG.upgrade.warnUntilWave;
  const wouldBlockSummon = cost !== null && left < summon;

  if (earlyGame && wouldBlockSummon) {
    openConfirm({
      title: '이대로 강화하면 타워를 못 세웁니다',
      message:
        `강화에 <b>${cost}G</b>를 쓰면 남는 골드가 <b>${left}G</b>가 됩니다.<br />` +
        `타워 소환에는 <b>${summon}G</b>가 필요하므로 ` +
        `<span class="warn">한 대도 소환할 수 없습니다.</span><br /><br />` +
        `강화는 타워가 있어야 효과를 봅니다. 먼저 타워를 몇 개 세운 뒤 ` +
        `남는 골드로 강화하는 편이 안전합니다.`,
      okText: '그래도 강화',
      cancelText: '취소 (타워 먼저)',
      onOk: () => { if (buyUpgrade(tier)) SFX.upgrade(); },
    });
    return;
  }

  if (buyUpgrade(tier)) SFX.upgrade();
}

bindInput(canvas);

hudElements.btnWave.addEventListener('click', () => {
  if (!isRunning()) return;
  skipPrep();
});

hudElements.btnSpeed.addEventListener('click', () => cycleSpeed());

hudElements.btnLegend.addEventListener('click', () => {
  const sel = selectedTowers();
  if (sel.length === CONFIG.merge.legendaryRequired && mergeLegendary(sel)) {
    SFX.legendary();
  }
});

// 판매는 되돌릴 수 없으므로 두 번 눌러야 실행됩니다.
// 첫 클릭은 "확인 대기"로 들어가고, 3초 안에 다시 누르지 않으면 저절로 풀립니다.
let sellTimer = null;

function disarmSell() {
  state.sellArmed = null;
  if (sellTimer) { clearTimeout(sellTimer); sellTimer = null; }
}

hudElements.btnSell.addEventListener('click', () => {
  const sel = selectedTowers();
  if (sel.length !== 1) return;
  const t = sel[0];

  // 1단계 — 확인 대기
  if (state.sellArmed !== t.tileIdx) {
    disarmSell();
    state.sellArmed = t.tileIdx;
    showToast('한 번 더 누르면 판매됩니다.', 2);
    SFX.click();
    sellTimer = setTimeout(disarmSell, 3000);
    return;
  }

  // 2단계 — 실제 판매
  disarmSell();
  earn(t.sellValue, t.x, t.y);
  state.towers.delete(t.tileIdx);
  clearSelection();
  SFX.click();
});

hudElements.btnRestart.addEventListener('click', () => {
  SFX.click();
  resetState();
  startPrep();
});

// --- 키보드 ---------------------------------------------------------

window.addEventListener('keydown', (evt) => {
  // ESC — 인게임 설정창 열기/닫기
  if (evt.key === 'Escape') {
    evt.preventDefault();
    toggleSettings();
    return;
  }
  // 설정창·확인창이 열려 있으면 다른 단축키는 막습니다
  if (state.settingsOpen || state.confirmOpen) return;

  const n = Number(evt.key);
  if (CONFIG.speed.options.includes(n)) setSpeed(n);
});

// --- 게임 루프 ------------------------------------------------------

/** 라이프·페이즈 변화를 감지해 효과음을 울립니다 */
let prevLife = 0;
let prevWave = 0;
let prevPhase = '';

function watchForSounds() {
  if (state.life < prevLife) SFX.life();
  if (state.wave > prevWave && state.wave > 0) SFX.waveStart();
  if (state.phase !== prevPhase) {
    if (state.phase === 'over') SFX.gameOver();
    else if (state.phase === 'clear') SFX.gameClear();
    else if (state.phase === 'prep' && prevPhase === 'combat') SFX.waveClear();
  }
  prevLife = state.life;
  prevWave = state.wave;
  prevPhase = state.phase;
}

function update(dt) {
  if (state.toast.timer > 0) state.toast.timer -= dt;

  if (state.phase === 'over' || state.phase === 'clear') {
    tickVisuals(dt);
    return;
  }

  updateWave(dt);

  for (const e of state.enemies) e.update(dt);
  for (const t of state.towers.values()) updateTower(t, dt);

  for (const p of state.projectiles) p.update(dt);
  state.projectiles = state.projectiles.filter((p) => !p.dead);

  collectKills();
  tickVisuals(dt);
}

function tickVisuals(dt) {
  for (const e of state.effects) e.life -= dt;
  state.effects = state.effects.filter((e) => e.life > 0);

  for (const f of state.floaters) {
    f.life -= dt;
    f.y += f.vy * dt;
  }
  state.floaters = state.floaters.filter((f) => f.life > 0);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // 타이틀 화면이거나 설정창이 열려 있으면 시뮬레이션을 멈춥니다
  if (isRunning()) {
    // 배속만큼 시뮬레이션을 반복 실행합니다.
    // dt 에 배속을 곱하지 않는 이유: 한 프레임 이동 거리가 커지면
    // 빠른 투사체가 적을 지나쳐 버려 명중 판정이 새기 때문입니다.
    for (let i = 0; i < state.speed; i++) update(dt);
    watchForSounds();
  }

  if (state.screen === 'playing') {
    render(ctx);
    updateHud();
  }
  requestAnimationFrame(loop);
}

// --- 시작 -----------------------------------------------------------

resetState();
startPrep();
requestAnimationFrame(loop);

// 디버그 / 자동테스트용 훅
// 브라우저 콘솔에서 __GAME__.state, __GAME__.CONFIG 로 값을 바꿀 수 있고,
// __GAME__.api 로 게임 내부 기능을 직접 호출할 수 있습니다.
window.__GAME__ = {
  state,
  CONFIG,
  api: {
    summonAt, mergeTo, mergeOptions, mergeLegendary, legendaryStatus,
    buyUpgrade, upgradeCost, startMission, refreshMissions,
    updateWave, updateTower, collectKills, startPrep, beginWave, resetState,
    tileIndex, isBuildable,
    showGame, showTitle, toggleSettings, closeSettings,
  },
};
