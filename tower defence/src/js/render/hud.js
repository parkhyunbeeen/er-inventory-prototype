// ============================================================
// hud.js — DOM 기반 UI 갱신
//   상단 지표 / 선택 패널 / 좌측 미션 / 우측 강화
// ============================================================

import { CONFIG } from '../data/config.js';
import { MAX_MERGE_TIER } from '../data/towers.js';
import { legendaryRecipeList } from '../data/legendary.js';
import { state, selectedTowers } from '../core/state.js';
import { mergeStatus, legendaryStatus, familyName } from '../systems/merge.js';
import { towerDamage, upgradeSummary } from '../systems/upgrade.js';
import { summonCost } from '../systems/economy.js';
import { missionSummary } from '../systems/mission.js';

const el = {};

/** 합성/미션/강화 버튼 클릭을 main.js로 넘겨주는 콜백 */
const handlers = { merge: null, mission: null, upgrade: null };

export function initHud(callbacks = {}) {
  Object.assign(handlers, callbacks);

  [
    'gold', 'life', 'wave', 'waveMax',
    'btnWave', 'btnSpeed', 'btnLegend', 'btnSell', 'btnRestart',
    'selTitle', 'selBadge', 'selStats', 'selDesc', 'recipeList', 'statLine',
    'mergeButtons', 'missionList', 'upgradeList', 'summonCost',
  ].forEach((id) => (el[id] = document.getElementById(id)));

  el.waveMax.textContent = CONFIG.wave.finalWave;
  el.recipeList.innerHTML = legendaryRecipeList(familyName)
    .map((t) => `<li>${t}</li>`)
    .join('');

  // 사이드 패널은 이벤트 위임으로 처리 (내용이 매 프레임 갱신되므로)
  el.missionList.addEventListener('click', (evt) => {
    const btn = evt.target.closest('button[data-mission]');
    if (btn && !btn.disabled) handlers.mission?.(btn.dataset.mission);
  });
  el.upgradeList.addEventListener('click', (evt) => {
    const btn = evt.target.closest('button[data-upgrade]');
    if (btn && !btn.disabled) handlers.upgrade?.(Number(btn.dataset.upgrade));
  });
  el.mergeButtons.addEventListener('click', (evt) => {
    const btn = evt.target.closest('button[data-target-tier]');
    if (btn && !btn.disabled) handlers.merge?.(Number(btn.dataset.targetTier));
  });
}

function setBtn(button, { text, enabled, hidden = false }) {
  button.hidden = hidden;
  button.textContent = text;
  button.disabled = !enabled;
}

/** innerHTML을 실제로 바뀔 때만 교체 (매 프레임 재생성 방지) */
function setHtml(node, html) {
  if (node._lastHtml !== html) {
    node.innerHTML = html;
    node._lastHtml = html;
  }
}

// ------------------------------------------------------------
// 좌측: 미션
// ------------------------------------------------------------
function renderMissions() {
  const html = missionSummary()
    .map((m) => {
      const label =
        m.status === 'active' ? '진행 중…'
        : m.status === 'done' ? '완료'
        : m.canStart ? `도전 (보상 ${m.reward}G)`
        : '잠김';
      return `
        <div class="card ${m.status}">
          <div class="card-top">
            <span class="card-name">${m.icon} ${m.name}</span>
            <span class="card-tag">${m.statusText}</span>
          </div>
          <div class="card-meta">${m.hint}${m.clears > 0 ? ` · 클리어 <b>${m.clears}</b>회` : ''}</div>
          <button class="card-btn" data-mission="${m.id}" ${m.canStart ? '' : 'disabled'}>${label}</button>
        </div>`;
    })
    .join('');
  setHtml(el.missionList, html);
}

// ------------------------------------------------------------
// 우측: 강화
// ------------------------------------------------------------
function renderUpgrades() {
  const html = upgradeSummary()
    .map((u) => {
      const pct = (u.level / u.maxLevel) * 100;
      const label = u.maxed ? '최대 강화 완료' : `강화 (${u.cost}G)`;
      return `
        <div class="card">
          <div class="card-top">
            <span class="card-name" style="color:${u.color}">${u.name} 강화</span>
            <span class="card-tag">Lv.${u.level}/${u.maxLevel}</span>
          </div>
          <div class="card-meta">공격력 <b>+${u.bonusPercent}%</b></div>
          <div class="bar"><i style="width:${pct}%;background:${u.color}"></i></div>
          <button class="card-btn" data-upgrade="${u.tier}" ${u.maxed || !u.affordable ? 'disabled' : ''}>${label}</button>
        </div>`;
    })
    .join('');
  setHtml(el.upgradeList, html);
}

// ------------------------------------------------------------
// 중앙: 선택 패널
// ------------------------------------------------------------
function renderMergeButtons(base) {
  if (!base) return setHtml(el.mergeButtons, '');
  const ms = mergeStatus(base);
  if (!ms || ms.kind !== 'normal') return setHtml(el.mergeButtons, '');

  const html = ms.options
    .map(
      (o) => `
      <button class="merge-btn ${o.ok ? 'ready' : ''}"
              data-target-tier="${o.targetTier}"
              style="${o.ok ? `border-color:${o.color};color:${o.color}` : ''}"
              ${o.ok ? '' : 'disabled'}>
        ⬆ ${o.name} 조합
        <small>${o.have} / ${o.need}개</small>
      </button>`
    )
    .join('');
  setHtml(el.mergeButtons, html);
}

function towerStatsHtml(t) {
  const dmg = Math.round(towerDamage(t));
  const boosted = dmg !== t.damage;
  return (
    `공격력 <b>${dmg}</b>${boosted ? ` <span style="color:var(--gold)">(기본 ${t.damage})</span>` : ''}` +
    ` · 공속 <b>${t.cooldown.toFixed(2)}s</b> · 사거리 <b>${t.range}</b>` +
    (t.pulse ? ' · <b>범위 전체 타격</b>' : '') +
    (t.splash ? ` · 범위 <b>${t.splash}</b>` : '') +
    (t.chain ? ` · 연쇄 <b>${t.chain.count}</b>` : '') +
    (t.stun ? ` · 기절 <b>${t.stun.duration}s</b>` : '') +
    (t.slow ? ` · 둔화 <b>${Math.round(t.slow.amount * 100)}%</b>` : '') +
    (t.burn ? ` · 화상 <b>${t.burn.dps}/s</b>` : '') +
    (t.pierceArmor ? ' · <b>방어 무시</b>' : '')
  );
}

// ------------------------------------------------------------
export function updateHud() {
  el.gold.textContent = Math.floor(state.gold);
  el.life.textContent = state.life;
  el.wave.textContent = state.wave;

  // 웨이브 버튼
  if (state.phase === 'prep') {
    setBtn(el.btnWave, { text: `⏩ 바로 시작 (${state.prepTimer.toFixed(1)}s)`, enabled: true });
  } else if (state.phase === 'combat') {
    setBtn(el.btnWave, { text: '⚔ 전투 중...', enabled: false });
  } else {
    setBtn(el.btnWave, { text: '— 종료 —', enabled: false });
  }

  // 소환 가격표 — 골드가 모자라면 붉게 표시
  const cost = summonCost();
  el.summonCost.innerHTML = `🎲 소환 <b>${cost}G</b>`;
  el.summonCost.classList.toggle('short', state.gold < cost);

  // 배속 버튼
  el.btnSpeed.textContent = `${'▶'.repeat(state.speed)} ${state.speed}배속`;
  el.btnSpeed.classList.toggle('active', state.speed > 1);

  el.btnRestart.hidden = !(state.phase === 'over' || state.phase === 'clear');

  el.statLine.textContent =
    `소환 ${state.stats.summons} · 합성 ${state.stats.merges} · 처치 ${state.stats.killed}` +
    ` · 전설 ${state.stats.legendaries} · 미션 ${state.stats.missions}`;

  renderMissions();
  renderUpgrades();

  // --- 선택 패널 ---
  const sel = selectedTowers();

  if (sel.length === 0) {
    el.selTitle.textContent = '선택된 타워 없음';
    el.selBadge.textContent = '';
    el.selBadge.style.background = 'transparent';
    el.selStats.innerHTML =
      `빈 슬롯을 클릭하면 랜덤 타워가 소환됩니다. · 소환 비용 <b style="color:var(--gold)">${summonCost()}G</b>`;
    el.selDesc.textContent = '';
    el.btnLegend.hidden = true;
    el.btnSell.hidden = true;
    renderMergeButtons(null);
    return;
  }

  const base = sel[0];

  if (sel.length === 1) {
    el.selTitle.textContent = base.name;
    el.selBadge.textContent = base.rarity.name;
    el.selBadge.style.background = base.rarity.border;
    el.selStats.innerHTML = towerStatsHtml(base);
    el.selDesc.textContent = base.desc;

    renderMergeButtons(base);

    const ms = mergeStatus(base);
    if (ms && ms.kind === 'epic') {
      setBtn(el.btnLegend, {
        text: `★ 전설 조합 (1/${CONFIG.merge.legendaryRequired}) — 영웅을 더 선택하세요`,
        enabled: false,
      });
    } else {
      el.btnLegend.hidden = true;
    }
  } else {
    // 전설 조합 모드
    renderMergeButtons(null);
    el.selTitle.textContent = `영웅 타워 ${sel.length}개 선택됨`;
    el.selBadge.textContent = '전설 조합';
    el.selBadge.style.background = '#ffc83d';
    el.selStats.textContent = sel.map((t) => t.name).join('  +  ');

    const ls = legendaryStatus(sel);
    if (ls) {
      setBtn(el.btnLegend, { text: `★ ${ls.text}`, enabled: ls.ok });
      el.selDesc.textContent = ls.ok
        ? ls.target.desc
        : `결과 타워는 첫 번째로 선택한 [${sel[0].name}] 위치에 생성됩니다.`;
    } else {
      el.btnLegend.hidden = true;
      el.selDesc.textContent = '';
    }
  }

  // 판매 버튼 (단일 선택일 때만) — 2단계 확인
  if (sel.length === 1) {
    const armed = state.sellArmed === base.tileIdx;
    setBtn(el.btnSell, {
      text: armed
        ? `한 번 더 눌러 판매 (+${base.sellValue}G)`
        : `💰 판매 (+${base.sellValue}G)`,
      enabled: true,
    });
    el.btnSell.classList.toggle('armed', armed);
  } else {
    el.btnSell.hidden = true;
    el.btnSell.classList.remove('armed');
  }
}

export { el as hudElements, MAX_MERGE_TIER };
