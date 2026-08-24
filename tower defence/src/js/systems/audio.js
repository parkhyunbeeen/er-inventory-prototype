// ============================================================
// audio.js — 효과음 (WebAudio 합성)
//
// 외부 사운드 파일 없이 오실레이터로 소리를 만들어 씁니다.
// 컨셉이 정해져 실제 음원이 생기면 playTone 부분만 교체하면 됩니다.
//
// 주의: 브라우저 정책상 오디오는 "사용자가 클릭한 뒤"에만 시작됩니다.
//       그래서 타이틀 화면의 [시작하기] 클릭 시점에 초기화합니다.
// ============================================================

import { state } from '../core/state.js';

let ctx = null;
let master = null;

/** 오디오 컨텍스트 준비 (사용자 클릭 이후에 호출) */
export function initAudio() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = state.volume;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return true;
  } catch {
    return false;
  }
}

/** 0.0 ~ 1.0 */
export function setVolume(v) {
  state.volume = Math.min(1, Math.max(0, v));
  try {
    if (master) master.gain.value = state.volume;
  } catch { /* 무시 */ }
}

export function getVolume() {
  return state.volume;
}

/**
 * 짧은 톤 하나를 재생합니다.
 * @param {object} o
 * @param {number} o.freq  시작 주파수(Hz)
 * @param {number} [o.to]  끝 주파수 (슬라이드)
 * @param {number} o.dur   길이(초)
 * @param {OscillatorType} [o.type]
 * @param {number} [o.gain] 개별 음량
 * @param {number} [o.delay] 지연(초)
 */
function tone({ freq, to, dur = 0.12, type = 'sine', gain = 0.25, delay = 0 }) {
  if (!ctx || state.volume <= 0) return;
  try {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);

    // 아주 짧은 페이드로 딸깍거림(클릭 노이즈)을 방지합니다
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    osc.connect(g);
    g.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  } catch { /* 무시 */ }
}

/** 화음/아르페지오 */
function chord(freqs, opts = {}) {
  freqs.forEach((f, i) => tone({ freq: f, delay: i * (opts.stagger ?? 0.06), ...opts }));
}

// ------------------------------------------------------------
// 효과음 목록 — 게임 코드에서는 SFX.xxx() 로만 부릅니다
// ------------------------------------------------------------
export const SFX = {
  /** UI 버튼 */
  click: () => tone({ freq: 520, to: 620, dur: 0.06, type: 'triangle', gain: 0.14 }),

  /** 타워 소환 */
  summon: () => tone({ freq: 300, to: 620, dur: 0.14, type: 'triangle', gain: 0.2 }),

  /** 일반 합성 — 등급이 높을수록 높은 음 */
  merge: (tier = 1) =>
    chord([330 * (1 + tier * 0.18), 495 * (1 + tier * 0.18)], {
      dur: 0.18, type: 'square', gain: 0.16, stagger: 0.05,
    }),

  /** 전설 완성 — 상행 아르페지오 */
  legendary: () =>
    chord([392, 523, 659, 784, 1047], {
      dur: 0.32, type: 'triangle', gain: 0.22, stagger: 0.08,
    }),

  /** 강화 구매 */
  upgrade: () => tone({ freq: 660, to: 880, dur: 0.1, type: 'sine', gain: 0.18 }),

  /** 미션 시작 */
  missionStart: () =>
    chord([294, 392], { dur: 0.22, type: 'sawtooth', gain: 0.14, stagger: 0.09 }),

  /** 미션 성공 */
  missionClear: () =>
    chord([523, 659, 880], { dur: 0.26, type: 'triangle', gain: 0.22, stagger: 0.09 }),

  /** 라운드 시작 */
  waveStart: () => tone({ freq: 220, to: 330, dur: 0.2, type: 'sawtooth', gain: 0.15 }),

  /** 라운드 클리어 */
  waveClear: () =>
    chord([523, 698], { dur: 0.2, type: 'sine', gain: 0.18, stagger: 0.07 }),

  /** 적이 통과 — 라이프 감소 */
  life: () => tone({ freq: 240, to: 90, dur: 0.28, type: 'sawtooth', gain: 0.26 }),

  /** 게임 오버 */
  gameOver: () =>
    chord([392, 311, 233, 175], { dur: 0.42, type: 'sawtooth', gain: 0.24, stagger: 0.16 }),

  /** 게임 클리어 */
  gameClear: () =>
    chord([523, 659, 784, 1047, 1319], { dur: 0.45, type: 'triangle', gain: 0.24, stagger: 0.12 }),
};
