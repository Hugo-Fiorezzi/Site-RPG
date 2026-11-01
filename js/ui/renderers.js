import {
  ATTRIBUTES_DEF,
  SAVING_THROWS_DEF,
  SKILLS_DEF,
  BEYONDER_PATHWAYS,
  EQUIPMENT_CATEGORIES,
  MUTATION_TYPES,
  MUTATION_SEVERITIES,
  ACTION_TYPES,
  DEFAULT_TURN_ACTIONS,
  WEEK_DAYS_DEF,
  DOWNTIME_OUTCOME_TYPES,
  THEME_PRESETS,
  DEFAULT_USER_THEME,
  STORE_ITEM_CATEGORIES,
  STORE_PAYMENT_MODES,
  DEFAULT_STORE_ITEMS,
  DEFAULT_CONTRIBUTION_TASKS,
  RESISTANCE_DEGREES,
  WEAKNESS_SEVERITIES,
  createDefaultWeeklyDowntime
} from '../config/constants.js';
import {
  clamp,
  calcAttrMod,
  formatSigned,
  calcPercentage,
  escapeHtml,
  setInputValueIfNotFocused
} from '../utils/helpers.js';

export function getActionTypeMeta(actionKey) {
  return ACTION_TYPES.find(a => a.key === actionKey) || ACTION_TYPES[0];
}

export function getTestLabelByKey(testKey) {
  if (!testKey) return '';
  const attr = ATTRIBUTES_DEF.find(a => a.key === testKey);
  if (attr) return `Atributo: ${attr.name} (${attr.short})`;
  const save = SAVING_THROWS_DEF.find(s => `save_${s.key}` === testKey);
  if (save) return `Resistência: ${save.name}`;
  const sk = SKILLS_DEF.find(s => s.id === testKey);
  if (sk) return `Perícia: ${sk.name}`;
  return testKey;
}

export function populatePathwaysDatalist() {
  const datalist = document.getElementById('beyonderPathwaysList');
  if (!datalist) return;
  datalist.innerHTML = BEYONDER_PATHWAYS.map(p => `<option value="${escapeHtml(p)}"></option>`).join('');
}

export function renderSyncStatusBadge(online, uid) {
  const badge = document.getElementById('syncStatusBadge');
  const userSpan = document.getElementById('userDisplayId');
  if (!badge || !userSpan) return;

  if (online && uid) {
    badge.className = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-500/30';
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Banco Cloud Ativo`;
    userSpan.textContent = `Firebase Sincronizado`;
  } else {
    badge.className = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-950/80 text-amber-300 border border-amber-500/30';
    badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Banco Local / Configurar Cloud`;
    userSpan.textContent = `Pronto p/ Vincular Firebase`;
  }
}

// ---------------------------------------------------------------------------
// 0. MOTOR DE PERSONALIZAÇÃO DE TEMA & OVERRIDE DE COMBATE MACABRO
// ---------------------------------------------------------------------------
export function applyActiveVisualTheme(userTheme, isCombatActive) {
  const theme = userTheme || DEFAULT_USER_THEME;
  const root = document.documentElement;

  const borderHex = (theme.borderColor || theme.accentColor || '#d4af37').trim();
  let r = 212, g = 175, b = 55;
  const hexMatch = borderHex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    r = parseInt(hexMatch[1], 16);
    g = parseInt(hexMatch[2], 16);
    b = parseInt(hexMatch[3], 16);
  }

  root.style.setProperty('--theme-bg-base', theme.bgBase || '#07080c');
  root.style.setProperty('--theme-card-bg', theme.cardBg || 'rgba(20, 23, 36, 0.95)');
  root.style.setProperty('--theme-card-gold-bg', theme.cardGoldBg || 'rgba(26, 29, 45, 0.96)');
  root.style.setProperty('--theme-accent', theme.accentColor || '#d4af37');
  root.style.setProperty('--theme-accent-sec', theme.accentSecondary || '#9333ea');
  root.style.setProperty('--theme-border-hex', borderHex);
  root.style.setProperty('--theme-border', `rgba(${r}, ${g}, ${b}, 0.34)`);
  root.style.setProperty('--theme-border-strong', `rgba(${r}, ${g}, ${b}, 0.62)`);
  root.style.setProperty('--theme-border-glow', `rgba(${r}, ${g}, ${b}, 0.18)`);

  if (theme.customBgImage && theme.customBgImage.trim()) {
    const safeUrl = theme.customBgImage.trim().replace(/"/g, '');
    root.style.setProperty('--theme-custom-bg-image', `linear-gradient(rgba(7,8,12,0.82), rgba(7,8,12,0.88)), url("${safeUrl}")`);
  } else {
    root.style.setProperty('--theme-custom-bg-image', 'none');
  }

  document.body.setAttribute('data-bg-pattern', theme.bgPattern || 'nevoeiro');

  // Quando o Mestre inicia o combate, ativa o tema Macabro Sanguinário; quando desliga, restaura o tema escolhido pelo usuário
  const combatBanner = document.getElementById('macabreCombatAlertBanner');
  if (isCombatActive) {
    document.body.classList.add('combat-macabre-mode');
    if (combatBanner) combatBanner.classList.remove('hidden');
  } else {
    document.body.classList.remove('combat-macabre-mode');
    if (combatBanner) combatBanner.classList.add('hidden');
  }
}

export function renderThemeCustomizerModalContent(currentTheme) {
  const container = document.getElementById('themePresetsGridContainer');
  if (!container) return;
  const activeId = currentTheme?.presetId || 'nevoeiro_cinza';

  container.innerHTML = THEME_PRESETS.map(preset => {
    const isSelected = preset.id === activeId;
    return `
      <button onclick="app.selectThemePreset('${preset.id}')"
        class="p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-2.5 ${isSelected ? 'border-brass-400 bg-obsidian-800 shadow-lg' : 'border-slate-800 bg-obsidian-950/80 hover:border-slate-700'}">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
            style="background: ${preset.bgBase}; color: ${preset.accentColor}">
            <i class="fa-solid ${preset.icon}"></i>
          </div>
          <div class="min-w-0">
            <div class="font-display font-bold text-xs text-slate-100 truncate">${escapeHtml(preset.name)}</div>
            <div class="text-[10px] text-slate-400 truncate">${escapeHtml(preset.subtitle)}</div>
          </div>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <span class="w-3.5 h-3.5 rounded-full border border-white/20" style="background:${preset.bgBase}"></span>
          <span class="w-3.5 h-3.5 rounded-full border border-white/20" style="background:${preset.accentColor}"></span>
        </div>
      </button>
    `;
  }).join('');

  setInputValueIfNotFocused('customThemeBgColor', currentTheme?.bgBase || '#07080c');
  setInputValueIfNotFocused('customThemeBorderColor', currentTheme?.borderColor || currentTheme?.accentColor || '#d4af37');
  setInputValueIfNotFocused('customThemeAccentColor', currentTheme?.accentColor || '#d4af37');
  setInputValueIfNotFocused('customThemePatternSelect', currentTheme?.bgPattern || 'nevoeiro');
  setInputValueIfNotFocused('customThemeBgImageUrl', currentTheme?.customBgImage || '');
}

export function isCharAllowedInActiveCampaign(charId, campaignState, viewMode, currentUser) {
  if (viewMode === 'gm' && currentUser?.role === 'gm') return true;
  if (!campaignState || !Array.isArray(campaignState.campaigns)) return true;
  const activeCamp = campaignState.campaigns.find(c => c.id === campaignState.activeCampaignId) || campaignState.campaigns[0];
  if (!activeCamp || activeCamp.restrictCombatAndDice === false) return true;
  if (!charId) return false;
  return Array.isArray(activeCamp.characterIds) && activeCamp.characterIds.includes(charId);
}

// Filtra quais fichas o usuário logado tem permissão de ver/editar
export function getVisibleCharactersForUser(charactersMap, currentUser) {
  const all = Object.values(charactersMap || {}).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  if (!currentUser) return [];
  if (currentUser.role === 'gm') return all; // O Mestre vê todas as fichas criadas!

  // Jogadores só veem e gerenciam as fichas que eles mesmos criaram (ou vinculadas ao e-mail/nome deles)
  return all.filter(ch => {
    if (ch.ownerUid && ch.ownerUid === currentUser.uid) return true;
    if (ch.ownerEmail && currentUser.email && ch.ownerEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
    return false;
  });
}

// ---------------------------------------------------------------------------
// 1. BARRA GLOBAL COMPARTILHADA DE ROLAGENS
// ---------------------------------------------------------------------------
export function renderSharedDiceTicker(diceLogs, campaignState, activeCharacterId, viewMode, currentUser) {
  const ticker = document.getElementById('sharedDiceTickerBar');
  if (!ticker) return;

  const canSeeRolls = isCharAllowedInActiveCampaign(activeCharacterId, campaignState, viewMode, currentUser);
  const activeCamp = (campaignState?.campaigns || []).find(c => c.id === campaignState?.activeCampaignId) || (campaignState?.campaigns || [])[0];

  if (!canSeeRolls) {
    ticker.innerHTML = `
      <div class="flex items-center gap-2 text-xs text-amber-300/90 py-1">
        <i class="fa-solid fa-eye-slash text-amber-400"></i>
        <span>Ficha fora da campanha ativa (<strong>${escapeHtml(activeCamp?.name || 'Campanha')}</strong>): rolagens de dados da mesa ocultas pelo Nevoeiro Cinza.</span>
      </div>
    `;
    return;
  }

  let visibleLogs = diceLogs || [];
  if (activeCamp && activeCamp.restrictCombatAndDice !== false && !(viewMode === 'gm' && currentUser?.role === 'gm')) {
    const allowedIds = new Set(activeCamp.characterIds || []);
    visibleLogs = visibleLogs.filter(l => !l.characterId || allowedIds.has(l.characterId) || l.campaignId === activeCamp.id);
  }

  if (visibleLogs.length === 0) {
    ticker.innerHTML = `
      <div class="flex items-center gap-2 text-xs text-slate-400 py-1">
        <i class="fa-solid fa-dice-d20 text-brass-400"></i>
        <span>Barra de Dados da Mesa: aguardando primeira rolagem dos jogadores da campanha ou do Mestre...</span>
      </div>
    `;
    return;
  }

  const recent = visibleLogs.slice(0, 6);
  ticker.innerHTML = recent.map((log, idx) => {
    const isFirst = idx === 0;
    const borderClass = log.isCrit
      ? 'border-amber-400 bg-amber-950/60 text-amber-200'
      : log.isFail
      ? 'border-crimson-500 bg-crimson-950/60 text-crimson-200'
      : isFirst
      ? 'border-brass-400/70 bg-obsidian-800/95 text-slate-100'
      : 'border-slate-800 bg-obsidian-900/80 text-slate-300 opacity-85';

    return `
      <div class="shrink-0 flex items-center gap-2.5 px-3 py-1.5 rounded-lg border ${borderClass} ${isFirst ? 'animate-dice shadow-lg' : ''}">
        <div class="flex flex-col">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] font-display font-bold text-brass-300 uppercase">${escapeHtml(log.characterName || 'Mesa')}</span>
            <span class="text-[10px] text-slate-400">• ${escapeHtml(log.title || 'Rolagem')}</span>
          </div>
          <span class="text-[10px] text-slate-400 font-mono">${escapeHtml(log.details || log.formula || '')}</span>
        </div>
        <div class="px-2.5 py-0.5 rounded bg-obsidian-950 border border-brass-400/40 font-display font-extrabold text-sm ${log.isCrit ? 'text-amber-300' : (log.isFail ? 'text-crimson-400' : 'text-brass-200')}">
          ${escapeHtml(String(log.total))}
        </div>
      </div>
    `;
  }).join('');
}

// ---------------------------------------------------------------------------
// 2. BARRA DE COMBATE & ORDEM DE INICIATIVA (COM CONTROLE DE INICIAR/ENCERRAR COMBATE)
// ---------------------------------------------------------------------------
export function renderCombatBar(combatState, charactersMap, viewMode, campaignState, activeCharacterId, currentUser) {
  const container = document.getElementById('combatTrackerContent');
  const roundBadge = document.getElementById('combatRoundBadge');
  const campaignBadge = document.getElementById('combatCampaignBadge');
  const statusPill = document.getElementById('combatActiveStatusPill');
  const gmControlsContainer = document.getElementById('combatGMControlsContainer');
  if (!container || !combatState) return;

  const isGMUser = currentUser?.role === 'gm';
  const isGM = isGMUser && viewMode === 'gm';
  const isCombatActive = !!combatState.isActive;
  const activeCamp = (campaignState?.campaigns || []).find(c => c.id === campaignState?.activeCampaignId) || (campaignState?.campaigns || [])[0];
  const allowedIds = new Set(activeCamp?.characterIds || []);
  const restrictActive = activeCamp && activeCamp.restrictCombatAndDice !== false;

  if (campaignBadge) {
    campaignBadge.innerHTML = activeCamp
      ? `<i class="fa-solid fa-compass mr-1 text-brass-400"></i> ${escapeHtml(activeCamp.name)} (Semana ${activeCamp.currentWeek || 1})`
      : 'Sem Campanha';
  }

  if (statusPill) {
    if (isCombatActive) {
      statusPill.className = 'px-2.5 py-0.5 rounded-full bg-crimson-600 text-white border border-rose-300 font-display font-extrabold text-[11px] uppercase animate-pulse flex items-center gap-1.5 shadow-lg shadow-crimson-600/40';
      statusPill.innerHTML = `<i class="fa-solid fa-skull-crossbones"></i> Combate Ativo`;
    } else {
      statusPill.className = 'px-2.5 py-0.5 rounded-full bg-obsidian-900 text-slate-400 border border-slate-700 font-display font-semibold text-[11px] flex items-center gap-1';
      statusPill.innerHTML = `<i class="fa-solid fa-dove text-emerald-400"></i> Em Paz (Fora de Combate)`;
    }
  }

  // Botões exclusivos do Mestre para Iniciar/Desligar Combate, Sincronizar e Adicionar Inimigos
  if (gmControlsContainer) {
    if (isGMUser) {
      gmControlsContainer.innerHTML = `
        <button onclick="app.toggleCombatActiveState()"
          class="px-3.5 py-1.5 rounded-lg font-display font-extrabold text-xs flex items-center gap-1.5 shadow-lg transition-all ${isCombatActive ? 'bg-emerald-500 hover:bg-emerald-400 text-obsidian-950' : 'bg-gradient-to-r from-crimson-600 to-rose-700 hover:from-crimson-500 hover:to-rose-600 text-white border border-rose-400/50'}">
          <i class="fa-solid ${isCombatActive ? 'fa-peace' : 'fa-fire-flame-curved'}"></i>
          <span>${isCombatActive ? 'Encerrar Combate' : 'Iniciar Combate'}</span>
        </button>
        <button onclick="app.syncPlayersToCombat()" class="px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 border border-brass-400/30 text-brass-200 text-xs font-semibold flex items-center gap-1.5 transition-all">
          <i class="fa-solid fa-users"></i> Sincronizar Campanha
        </button>
        <button onclick="app.addMonsterToCombat()" class="px-3 py-1.5 rounded-lg bg-crimson-900/50 hover:bg-crimson-600 text-crimson-200 hover:text-white border border-crimson-500/40 text-xs font-bold flex items-center gap-1.5 transition-all">
          <i class="fa-solid fa-dragon"></i> + Inimigo / Monstro
        </button>
        <button onclick="app.nextCombatTurn()" class="px-3.5 py-1.5 rounded-lg bg-brass-400 hover:bg-brass-300 text-obsidian-950 font-display font-bold text-xs flex items-center gap-1.5 shadow-md transition-all">
          <i class="fa-solid fa-forward-step"></i> Próximo Turno
        </button>
      `;
    } else {
      gmControlsContainer.innerHTML = `
        <span class="text-[11px] text-slate-400 italic px-2">
          <i class="fa-solid fa-crown text-brass-400 mr-1"></i> Controle de turno e combate gerenciado pelo Mestre
        </span>
      `;
    }
  }

  // Se for jogador e a ficha ativa não pertencer à campanha ativa, bloqueia a visualização da aba de combate
  if (!isGMUser && restrictActive && (!activeCharacterId || !allowedIds.has(activeCharacterId))) {
    container.innerHTML = `
      <div class="bg-obsidian-950/90 border border-amber-500/30 rounded-xl p-4 text-center space-y-1.5">
        <div class="text-xs font-display font-bold text-amber-300 uppercase tracking-wider flex items-center justify-center gap-2">
          <i class="fa-solid fa-lock"></i> Combate & Rolagens Restritos à Campanha Ativa
        </div>
        <p class="text-xs text-slate-400">
          Sua ficha atual não está escalada na campanha <strong>"${escapeHtml(activeCamp.name)}"</strong>. Crie sua ficha e peça ao Mestre para adicioná-la à campanha para participar do combate e ver os dados da sessão.
        </p>
      </div>
    `;
    return;
  }

  let rawParticipants = [...(combatState.participants || [])];
  if (restrictActive) {
    rawParticipants = rawParticipants.filter(p => p.isMonster || allowedIds.has(p.charId));
  }

  const participants = rawParticipants.sort((a, b) => (Number(b.initiative) || 0) - (Number(a.initiative) || 0));
  if (roundBadge) roundBadge.textContent = `Rodada ${combatState.round || 1}`;

  if (participants.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-xs text-slate-400">
        Nenhum combatente da campanha ativa na ordem de iniciativa. ${isGMUser ? 'Clique em <strong>"Sincronizar Campanha"</strong> ou <strong>"+ Inimigo/Monstro"</strong>.' : 'Aguardando o Mestre iniciar o encontro.'}
      </div>
    `;
    return;
  }

  const activeIdx = clamp(combatState.activeTurnIndex || 0, 0, Math.max(0, participants.length - 1));

  const cardsHtml = participants.map((p, idx) => {
    const isCurrentTurn = idx === activeIdx;
    const turnHighlight = isCurrentTurn
      ? 'border-2 border-brass-400 shadow-[0_0_20px_rgba(212,175,55,0.25)] bg-obsidian-800/95'
      : 'border border-slate-800 bg-obsidian-950/90';

    if (!p.isMonster) {
      const char = charactersMap[p.charId] || p;
      const hp = char.vitals?.hp || p.hp || { current: 20, max: 20 };
      const sp = char.vitals?.sp || p.sp || { current: 20, max: 20 };
      const san = char.vitals?.san || p.san || { current: 80, max: 100 };
      const actions = char.turnActions || DEFAULT_TURN_ACTIONS;
      const canControlThisChar = isGMUser; // Apenas o Mestre pode editar a situação de combate na Barra de Combate

      return `
        <div class="w-72 shrink-0 rounded-xl p-3 flex flex-col justify-between transition-all ${turnHighlight}">
          <div>
            <div class="flex items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <div class="flex items-center gap-2 min-w-0">
                ${char.avatarUrl ? `
                  <img src="${escapeHtml(char.avatarUrl)}" alt="${escapeHtml(char.name || '')}" class="w-9 h-9 rounded-lg object-cover border border-brass-400/50 shrink-0" />
                ` : `
                  <div class="w-9 h-9 rounded-lg bg-obsidian-900 border border-brass-400/30 flex items-center justify-center text-brass-300 text-xs shrink-0">
                    <i class="fa-solid fa-user"></i>
                  </div>
                `}
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5">
                    ${isCurrentTurn ? '<span class="px-1.5 py-0.5 rounded bg-brass-400 text-obsidian-950 font-extrabold text-[9px] uppercase">Turno Atual</span>' : ''}
                    <span class="text-[10px] font-display uppercase text-emerald-400">Beyonder</span>
                  </div>
                  <h4 class="font-display font-bold text-sm text-brass-200 truncate ${canControlThisChar ? 'cursor-pointer hover:underline' : ''}"
                    onclick="${canControlThisChar ? `app.openCharacterFromGM('${char.id || ''}')` : ''}">
                    ${escapeHtml(char.name || p.name)}
                  </h4>
                </div>
              </div>
              <div class="flex flex-col items-end">
                <span class="text-[9px] uppercase text-slate-400">Iniciativa</span>
                ${canControlThisChar ? `
                  <input type="number" value="${p.initiative ?? 10}" onchange="app.updateCombatParticipant('${p.id}', 'initiative', Number(this.value))"
                    class="sheet-input w-12 text-center py-0.5 rounded font-display font-bold text-xs text-cyan-300" />
                ` : `
                  <span class="font-display font-bold text-sm text-cyan-300">${p.initiative ?? 10}</span>
                `}
              </div>
            </div>

            <div class="grid grid-cols-3 gap-1.5 text-center mb-2.5">
              <div class="bg-obsidian-900/90 border border-crimson-500/30 rounded-lg p-1">
                <div class="text-[9px] text-crimson-400 font-bold">PV</div>
                <div class="text-xs font-bold text-slate-100">${hp.current}/${hp.max}</div>
              </div>
              <div class="bg-obsidian-900/90 border border-eldritch-500/30 rounded-lg p-1">
                <div class="text-[9px] text-eldritch-400 font-bold">SAN</div>
                <div class="text-xs font-bold text-slate-100">${san.current}/${san.max}</div>
              </div>
              <div class="bg-obsidian-900/90 border border-astral-500/30 rounded-lg p-1">
                <div class="text-[9px] text-astral-400 font-bold">PE</div>
                <div class="text-xs font-bold text-slate-100">${sp.current}/${sp.max}</div>
              </div>
            </div>

            <div class="space-y-1">
              <div class="text-[9px] uppercase tracking-wider text-slate-400 flex justify-between">
                <span>Ações no Turno</span>
                ${canControlThisChar ? `<button onclick="app.resetCharacterTurnActions('${char.id}')" class="text-brass-300 hover:underline">Restaurar</button>` : ''}
              </div>
              <div class="grid grid-cols-4 gap-1">
                ${ACTION_TYPES.filter(a => a.key !== 'livre').map(a => {
                  const available = actions[a.key] !== false;
                  return `
                    <button onclick="${canControlThisChar ? `app.toggleCharacterTurnAction('${char.id}', '${a.key}')` : ''}"
                      title="${a.label}: ${available ? 'Disponível' : 'Já Utilizada'}"
                      class="py-1 px-1 rounded text-[9px] font-bold border transition-all flex flex-col items-center gap-0.5 ${available ? a.badgeClass : 'bg-obsidian-950 border-slate-800 text-slate-600 line-through'}">
                      <i class="fa-solid ${a.icon}"></i>
                      <span class="truncate w-full text-center">${a.short}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          ${isGMUser ? `
            <div class="mt-2 pt-1.5 border-t border-slate-800/80 flex justify-end">
              <button onclick="app.removeCombatParticipant('${p.id}')" class="text-[10px] text-slate-500 hover:text-crimson-400">
                <i class="fa-solid fa-xmark"></i> Remover do Combate
              </button>
            </div>
          ` : ''}
        </div>
      `;
    } else {
      if (p.isHiddenFromPlayers && !isGMUser) {
        return '';
      }

      const hpCur = Number(p.hp?.current ?? 30);
      const hpMax = Math.max(1, Number(p.hp?.max ?? 30));
      const sanCur = Number(p.san?.current ?? 50);
      const sanMax = Math.max(1, Number(p.san?.max ?? 50));

      const isHurt = p.isHurt || (hpCur <= hpMax * 0.5);
      const isMad = p.isMad || (sanCur <= sanMax * 0.3);
      const canSeeExactStats = isGMUser || p.statsVisibleToPlayers;

      return `
        <div class="w-80 shrink-0 rounded-xl p-3 flex flex-col justify-between transition-all ${turnHighlight} ${p.isHiddenFromPlayers ? 'opacity-65 border-dashed border-crimson-500/60' : ''}">
          <div>
            <div class="flex items-start justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5 flex-wrap">
                  ${isCurrentTurn ? '<span class="px-1.5 py-0.5 rounded bg-crimson-500 text-white font-extrabold text-[9px] uppercase">Turno Inimigo</span>' : ''}
                  <span class="text-[10px] font-display uppercase text-crimson-400"><i class="fa-solid fa-skull mr-1"></i> Ameaça</span>
                  ${p.isHiddenFromPlayers ? '<span class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px]">Oculto p/ Jogadores</span>' : ''}
                </div>
                ${isGMUser ? `
                  <input type="text" value="${escapeHtml(p.name)}" onchange="app.updateCombatParticipant('${p.id}', 'name', this.value)"
                    class="sheet-input w-full px-2 py-0.5 mt-1 rounded font-display font-bold text-xs text-crimson-200" />
                  <input type="text" value="${escapeHtml(p.enemyType || 'Criatura Beyonder')}" onchange="app.updateCombatParticipant('${p.id}', 'enemyType', this.value)"
                    placeholder="Tipo da Criatura..." class="sheet-input w-full px-2 py-0.5 mt-1 rounded text-[10px] text-slate-300" />
                ` : `
                  <h4 class="font-display font-bold text-sm text-crimson-300 truncate mt-0.5">${escapeHtml(p.name)}</h4>
                  <p class="text-[10px] text-slate-400 truncate">${escapeHtml(p.enemyType || 'Entidade Desconhecida')}</p>
                `}
              </div>

              <div class="flex flex-col items-end">
                <span class="text-[9px] uppercase text-slate-400">Inic.</span>
                ${isGMUser ? `
                  <input type="number" value="${p.initiative ?? 12}" onchange="app.updateCombatParticipant('${p.id}', 'initiative', Number(this.value))"
                    class="sheet-input w-12 text-center py-0.5 rounded font-display font-bold text-xs text-crimson-300" />
                ` : `
                  <span class="font-display font-bold text-sm text-crimson-300">${p.initiative ?? 12}</span>
                `}
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-1.5 mb-2">
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-obsidian-900 border border-slate-700 text-slate-300">
                ${escapeHtml(p.enemyType || 'Criatura')}
              </span>
              <button onclick="${isGMUser ? `app.toggleMonsterFlag('${p.id}', 'isHurt')` : ''}"
                class="px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${isHurt ? 'bg-crimson-950 text-crimson-300 border-crimson-500 animate-pulse' : 'bg-obsidian-900 text-slate-500 border-slate-800'}">
                <i class="fa-solid fa-droplet mr-1"></i> ${isHurt ? 'Machucado' : 'Íntegro'}
              </button>
              <button onclick="${isGMUser ? `app.toggleMonsterFlag('${p.id}', 'isMad')` : ''}"
                class="px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${isMad ? 'bg-eldritch-900 text-eldritch-200 border-eldritch-400 animate-pulse' : 'bg-obsidian-900 text-slate-500 border-slate-800'}">
                <i class="fa-solid fa-eye-low-vision mr-1"></i> ${isMad ? 'Louco / Descontrole' : 'Mente Sã'}
              </button>
            </div>

            ${canSeeExactStats ? `
              <div class="grid grid-cols-2 gap-2 mb-2">
                <div class="bg-obsidian-900/90 border border-crimson-500/30 rounded-lg p-1.5">
                  <div class="flex justify-between text-[9px] text-crimson-400 font-bold mb-1">
                    <span>VIDA (PV)</span>
                    ${isGMUser ? `
                      <div class="flex gap-1">
                        <button onclick="app.adjustMonsterVital('${p.id}', 'hp', -5)" class="px-1 bg-obsidian-950 rounded hover:text-white">-5</button>
                        <button onclick="app.adjustMonsterVital('${p.id}', 'hp', 5)" class="px-1 bg-obsidian-950 rounded hover:text-white">+5</button>
                      </div>
                    ` : ''}
                  </div>
                  ${isGMUser ? `
                    <div class="flex items-center justify-center gap-1">
                      <input type="number" value="${hpCur}" onchange="app.setMonsterVital('${p.id}', 'hp', 'current', Number(this.value))" class="sheet-input w-12 text-center py-0.5 rounded text-xs font-bold" />
                      <span class="text-slate-500 text-xs">/</span>
                      <input type="number" value="${hpMax}" onchange="app.setMonsterVital('${p.id}', 'hp', 'max', Number(this.value))" class="sheet-input w-12 text-center py-0.5 rounded text-xs" />
                    </div>
                  ` : `<div class="text-center font-bold text-xs text-slate-100">${hpCur} / ${hpMax}</div>`}
                </div>

                <div class="bg-obsidian-900/90 border border-eldritch-500/30 rounded-lg p-1.5">
                  <div class="flex justify-between text-[9px] text-eldritch-400 font-bold mb-1">
                    <span>SANIDADE</span>
                    ${isGMUser ? `
                      <div class="flex gap-1">
                        <button onclick="app.adjustMonsterVital('${p.id}', 'san', -5)" class="px-1 bg-obsidian-950 rounded hover:text-white">-5</button>
                        <button onclick="app.adjustMonsterVital('${p.id}', 'san', 5)" class="px-1 bg-obsidian-950 rounded hover:text-white">+5</button>
                      </div>
                    ` : ''}
                  </div>
                  ${isGMUser ? `
                    <div class="flex items-center justify-center gap-1">
                      <input type="number" value="${sanCur}" onchange="app.setMonsterVital('${p.id}', 'san', 'current', Number(this.value))" class="sheet-input w-12 text-center py-0.5 rounded text-xs font-bold" />
                      <span class="text-slate-500 text-xs">/</span>
                      <input type="number" value="${sanMax}" onchange="app.setMonsterVital('${p.id}', 'san', 'max', Number(this.value))" class="sheet-input w-12 text-center py-0.5 rounded text-xs" />
                    </div>
                  ` : `<div class="text-center font-bold text-xs text-slate-100">${sanCur} / ${sanMax}</div>`}
                </div>
              </div>
            ` : `
              <div class="bg-obsidian-900/80 border border-slate-800 rounded-lg p-2 text-center text-[11px] text-slate-400 italic mb-2">
                <i class="fa-solid fa-eye-slash text-brass-400 mr-1"></i> PV e Sanidade exatos ocultos no Nevoeiro Cinza
              </div>
            `}
          </div>

          ${isGMUser ? `
            <div class="mt-1 pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-1 text-[10px]">
              <div class="flex items-center gap-1">
                <button onclick="app.toggleMonsterFlag('${p.id}', 'statsVisibleToPlayers')"
                  title="Permitir ou ocultar PV/SAN numérico para os jogadores"
                  class="px-2 py-0.5 rounded border transition-all ${p.statsVisibleToPlayers ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' : 'bg-obsidian-900 border-slate-700 text-slate-400'}">
                  <i class="fa-solid ${p.statsVisibleToPlayers ? 'fa-eye' : 'fa-eye-slash'} mr-1"></i>
                  ${p.statsVisibleToPlayers ? 'Status Visíveis' : 'Status Ocultos'}
                </button>
                <button onclick="app.toggleMonsterFlag('${p.id}', 'isHiddenFromPlayers')"
                  title="Ocultar este inimigo completamente para os jogadores"
                  class="px-2 py-0.5 rounded border transition-all ${p.isHiddenFromPlayers ? 'bg-crimson-950 border-crimson-500/40 text-crimson-300' : 'bg-obsidian-900 border-slate-700 text-slate-400'}">
                  <i class="fa-solid fa-ghost"></i>
                </button>
              </div>
              <button onclick="app.removeCombatParticipant('${p.id}')" class="text-slate-500 hover:text-crimson-400">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          ` : ''}
        </div>
      `;
    }
  }).join('');

  container.innerHTML = `<div class="flex items-stretch gap-3 overflow-x-auto pb-2">${cardsHtml}</div>`;
}

export function renderTopNavigation(charactersMap, activeCharacterId, viewMode, campaignState, currentUser) {
  const allList = Object.values(charactersMap).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const visibleList = getVisibleCharactersForUser(charactersMap, currentUser);
  const isGMUser = currentUser?.role === 'gm';

  const gmBadge = document.getElementById('gmCountBadge');
  if (gmBadge) gmBadge.textContent = allList.length;

  const activeCamp = (campaignState?.campaigns || []).find(c => c.id === campaignState?.activeCampaignId) || (campaignState?.campaigns || [])[0];
  const campCharIds = new Set(activeCamp?.characterIds || []);

  const select = document.getElementById('characterSelectDropdown');
  if (select) {
    if (visibleList.length === 0) {
      select.innerHTML = `<option value="">Nenhuma ficha criada ainda</option>`;
    } else {
      select.innerHTML = visibleList.map(ch => {
        const seqLabel = ch.sequence === 'Humana' ? 'Humano' : `Seq. ${ch.sequence}`;
        const inCampTag = campCharIds.has(ch.id) ? '★ ' : '';
        const selected = (ch.id === activeCharacterId && viewMode === 'sheet') ? 'selected' : '';
        return `<option value="${ch.id}" ${selected}>${inCampTag}${escapeHtml(ch.name)} (${escapeHtml(ch.pathway)} • ${seqLabel})</option>`;
      }).join('');
    }
  }

  // O botão do Painel do Mestre só aparece para usuários logados como Mestre!
  const gmBtn = document.getElementById('btnToggleGMView');
  if (gmBtn) {
    if (!isGMUser) {
      gmBtn.classList.add('hidden');
    } else {
      gmBtn.classList.remove('hidden');
      gmBtn.className = viewMode === 'gm'
        ? 'px-3.5 py-2 rounded-lg font-display text-xs sm:text-sm font-bold tracking-wide transition-all flex items-center gap-2 border border-brass-400 bg-brass-400 text-obsidian-950 shadow-lg'
        : 'px-3.5 py-2 rounded-lg font-display text-xs sm:text-sm font-semibold tracking-wide transition-all flex items-center gap-2 border border-brass-400/40 bg-obsidian-800 hover:bg-brass-500/20 text-brass-200';
    }
  }

  // Renderiza badge do usuário logado
  const userProfileBadge = document.getElementById('loggedUserBadgeContainer');
  if (userProfileBadge) {
    if (!currentUser) {
      userProfileBadge.innerHTML = `
        <button onclick="app.openAuthModal()" class="px-3 py-1.5 rounded-lg bg-brass-400 text-obsidian-950 font-bold text-xs flex items-center gap-1.5">
          <i class="fa-solid fa-right-to-bracket"></i> Entrar
        </button>
      `;
    } else {
      userProfileBadge.innerHTML = `
        <div class="flex items-center gap-1.5 bg-obsidian-900/95 border border-brass-400/35 rounded-lg px-2.5 py-1.5">
          <span class="px-1.5 py-0.5 rounded text-[9px] font-display font-extrabold uppercase ${isGMUser ? 'bg-amber-400 text-obsidian-950' : 'bg-astral-900 text-astral-200 border border-astral-500/40'}">
            ${isGMUser ? '<i class="fa-solid fa-crown mr-0.5"></i>Mestre' : '<i class="fa-solid fa-user mr-0.5"></i>Jogador'}
          </span>
          <span class="text-xs font-bold text-slate-200 max-w-[120px] truncate">${escapeHtml(currentUser.name || currentUser.email)}</span>
          <button onclick="app.openAccountManagerModal()" title="Minha Conta / Alterar Login e Senha" class="ml-1 text-brass-300 hover:text-brass-100 text-xs px-1">
            <i class="fa-solid fa-user-gear"></i>
          </button>
          <button onclick="app.logout()" title="Sair / Trocar Conta" class="text-slate-400 hover:text-crimson-400 text-xs px-1">
            <i class="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      `;
    }
  }
}

// ---------------------------------------------------------------------------
// 3. PAINEL DO MESTRE: ABAS INTERNAS (PROTEGIDO POR LOGIN DE MESTRE)
// ---------------------------------------------------------------------------
export function renderGMDashboard(charactersMap, campaignState, activeGMSubTab = 'overview', currentUser = null) {
  if (!currentUser || currentUser.role !== 'gm') return;

  const gmTabs = ['overview', 'campaign', 'store'];
  gmTabs.forEach(tabKey => {
    const btn = document.getElementById(`gmTabBtn-${tabKey}`);
    const panel = document.getElementById(`gmSubTab-${tabKey}`);
    if (!btn || !panel) return;
    if (tabKey === activeGMSubTab) {
      btn.className = 'px-4 py-2.5 rounded-lg font-display font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center gap-2 bg-brass-400 text-obsidian-950 shadow-md';
      panel.classList.remove('hidden');
    } else {
      btn.className = 'px-4 py-2.5 rounded-lg font-display font-semibold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center gap-2 bg-obsidian-900 text-slate-300 hover:text-brass-200 border border-brass-400/30';
      panel.classList.add('hidden');
    }
  });

  renderGMCharactersOverviewGrid(charactersMap, campaignState);
  renderGMCampaignAndDowntimePanel(charactersMap, campaignState);
  renderGMStoreManager(charactersMap, campaignState);
}

function renderGMCharactersOverviewGrid(charactersMap, campaignState) {
  const container = document.getElementById('gmCharactersGrid');
  if (!container) return;
  const list = Object.values(charactersMap).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const activeCamp = (campaignState?.campaigns || []).find(c => c.id === campaignState?.activeCampaignId) || (campaignState?.campaigns || [])[0];
  const campCharIds = new Set(activeCamp?.characterIds || []);

  if (list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full victorian-card rounded-xl p-10 text-center space-y-3">
        <i class="fa-solid fa-scroll text-4xl text-brass-400"></i>
        <h3 class="font-display text-lg text-slate-200">Nenhuma Ficha Cadastrada</h3>
        <p class="text-xs text-slate-400">Crie uma nova ficha ou gere os personagens de exemplo para começar a sessão.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(ch => {
    const hp = ch.vitals?.hp || { current: 10, max: 10, temp: 0 };
    const sp = ch.vitals?.sp || { current: 10, max: 10, temp: 0 };
    const san = ch.vitals?.san || { current: 100, max: 100, temp: 0 };

    const hpPct = calcPercentage(hp.current, hp.max);
    const spPct = calcPercentage(sp.current, sp.max);
    const sanPct = calcPercentage(san.current, san.max);
    const potPct = clamp(ch.potionProgress || 0, 0, 100);
    const inCampaign = campCharIds.has(ch.id);
    const weekSubmitted = ch.weeklyDowntime?.submittedToGM;

    return `
      <div class="victorian-card rounded-xl p-5 flex flex-col justify-between hover:border-brass-400 transition-all">
        <div>
          <div class="flex items-start justify-between gap-2 border-b border-slate-800 pb-3 mb-3">
            <div class="flex items-start gap-3 min-w-0">
              ${ch.avatarUrl ? `
                <img src="${escapeHtml(ch.avatarUrl)}" alt="${escapeHtml(ch.name)}" class="w-12 h-14 rounded-lg object-cover border border-brass-400/50 shrink-0 shadow" />
              ` : `
                <div class="w-12 h-14 rounded-lg bg-obsidian-950 border border-brass-400/30 flex items-center justify-center text-brass-400/70 text-lg shrink-0">
                  <i class="fa-solid fa-user-secret"></i>
                </div>
              `}
              <div class="min-w-0">
                <div class="flex items-center gap-1.5 flex-wrap mb-1">
                <span class="text-[10px] font-semibold text-eldritch-400 uppercase tracking-wider">
                  ${escapeHtml(ch.pathway)} • ${ch.sequence === 'Humana' ? 'Humano' : 'Seq. ' + ch.sequence} (${escapeHtml(ch.potionName || '')})
                </span>
                <button onclick="app.toggleCharacterInActiveCampaign('${ch.id}')"
                  title="Clique para adicionar ou remover esta ficha da campanha ativa"
                  class="px-2 py-0.5 rounded text-[9px] font-bold transition-all ${inCampaign ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 hover:bg-crimson-950 hover:text-crimson-300' : 'bg-obsidian-900 text-slate-400 border border-slate-700 hover:border-brass-400 hover:text-brass-200'}">
                  <i class="fa-solid ${inCampaign ? 'fa-campground' : 'fa-plus'} mr-1"></i>${inCampaign ? 'Na Campanha' : 'Add à Campanha'}
                </button>
                ${weekSubmitted
                  ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40"><i class="fa-solid fa-calendar-check mr-1"></i>Semana Enviada</span>`
                  : ''
                }
              </div>
              <h3 class="font-display font-bold text-lg text-brass-200 leading-tight">${escapeHtml(ch.name)}</h3>
              <p class="text-xs text-slate-400">
                <i class="fa-solid fa-user text-[10px] mr-1"></i> Criador: <strong class="text-slate-200">${escapeHtml(ch.player || ch.ownerEmail || 'Jogador')}</strong>
                • <span class="text-amber-300 font-semibold"><i class="fa-solid fa-coins ml-1 mr-0.5"></i>${ch.currencyGold ?? 0} £</span>
                • <span class="text-emerald-300 font-semibold"><i class="fa-solid fa-medal ml-1 mr-0.5"></i>${ch.contributionPoints ?? 0} pts</span>
              </p>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1">
              <span class="px-2.5 py-1 rounded-lg bg-obsidian-950 border border-brass-400/40 font-display font-bold text-xs text-brass-200">
                <i class="fa-solid fa-shield-halved text-brass-400 mr-1"></i> CA ${ch.armorClass ?? 10}
              </span>
              <span class="text-[10px] text-amber-300 font-semibold">
                Prof +${ch.proficiencyBonus ?? 2} ${ch.bonusDie ? `• ${ch.bonusDie}` : ''}
              </span>
            </div>
          </div>

          <div class="space-y-2.5 mb-4">
            ${renderGMVitalBar(ch.id, 'hp', 'Vida (PV)', 'fa-heart-pulse', 'text-crimson-400', 'bg-crimson-500', hp, hpPct)}
            ${renderGMVitalBar(ch.id, 'sp', 'Espiritualidade (PE)', 'fa-star-of-life', 'text-astral-400', 'bg-astral-500', sp, spPct)}
            ${renderGMVitalBar(ch.id, 'san', 'Sanidade (SAN)', 'fa-brain', 'text-eldritch-400', 'bg-eldritch-500', san, sanPct)}

            <div class="pt-1 flex items-center justify-between text-[11px] text-slate-300">
              <span><i class="fa-solid fa-flask text-amber-400 mr-1"></i> Digestão: <strong class="text-brass-200">${potPct}%</strong></span>
              <span><i class="fa-solid fa-biohazard text-crimson-400 mr-1"></i> Corrupção: <strong class="text-crimson-300">${ch.corruptionLevel ?? 0}%</strong></span>
            </div>
          </div>

          <div class="grid grid-cols-6 gap-1 bg-obsidian-950/80 p-2 rounded-lg border border-slate-800/80 text-center mb-4">
            ${ATTRIBUTES_DEF.map(attr => {
              const val = ch.attributes?.[attr.key]?.value ?? 10;
              const mod = calcAttrMod(val, ch.attributes?.[attr.key]?.bonus ?? 0);
              return `
                <div>
                  <div class="text-[9px] text-slate-400 font-display">${attr.short}</div>
                  <div class="text-xs font-bold text-brass-200">${val} <span class="text-[10px] text-slate-400">(${formatSigned(mod)})</span></div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="grid grid-cols-3 gap-1.5">
          <button onclick="app.openCharacterFromGM('${ch.id}')" class="py-2 px-2 rounded-lg bg-gradient-to-r from-brass-500/25 to-brass-600/20 hover:from-brass-500 hover:to-brass-600 text-brass-200 hover:text-obsidian-950 border border-brass-400/40 font-display font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1">
            <i class="fa-solid fa-pen-to-square"></i> Abrir Ficha
          </button>
          <button onclick="app.openSequenceProgressionModal('${ch.id}')" class="py-2 px-2 rounded-lg bg-eldritch-900/50 hover:bg-eldritch-600 text-eldritch-200 hover:text-white border border-eldritch-500/40 font-display font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1">
            <i class="fa-solid fa-flask-vial"></i> Progredir
          </button>
          <button onclick="app.promptDeleteCharacterById('${ch.id}')" class="py-2 px-2 rounded-lg bg-crimson-950/70 hover:bg-crimson-600 text-crimson-200 hover:text-white border border-crimson-500/40 font-display font-bold text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-1">
            <i class="fa-solid fa-trash-can"></i> Excluir Ficha
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderGMVitalBar(charId, key, label, icon, textColor, barColor, vitalObj, pct) {
  return `
    <div>
      <div class="flex justify-between items-center text-xs mb-1">
        <span class="${textColor} font-bold"><i class="fa-solid ${icon} mr-1"></i> ${label}</span>
        <div class="flex items-center gap-1.5">
          <button onclick="app.gmQuickVital('${charId}', '${key}', -1)" class="px-1.5 py-0.2 rounded bg-obsidian-950 border border-slate-700 hover:border-crimson-400 text-crimson-300 text-[11px]">-1</button>
          <span class="font-bold text-slate-100">${vitalObj.current}/${vitalObj.max} ${vitalObj.temp ? `(+${vitalObj.temp})` : ''}</span>
          <button onclick="app.gmQuickVital('${charId}', '${key}', 1)" class="px-1.5 py-0.2 rounded bg-obsidian-950 border border-slate-700 hover:border-emerald-400 text-emerald-300 text-[11px]">+1</button>
        </div>
      </div>
      <div class="w-full h-2 bg-obsidian-950 rounded-full overflow-hidden">
        <div class="h-full ${barColor} transition-all" style="width: ${pct}%"></div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// 3B. ABA DE CAMPANHA DO MESTRE
// ---------------------------------------------------------------------------
export function renderGMCampaignAndDowntimePanel(charactersMap, campaignState) {
  const container = document.getElementById('gmCampaignManagerContent');
  if (!container) return;

  const campaigns = campaignState?.campaigns || [];
  const activeCamp = campaigns.find(c => c.id === campaignState?.activeCampaignId) || campaigns[0];
  const allChars = Object.values(charactersMap).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  if (!activeCamp) {
    container.innerHTML = `
      <div class="victorian-card rounded-xl p-8 text-center space-y-3">
        <i class="fa-solid fa-compass text-3xl text-brass-400"></i>
        <h3 class="font-display font-bold text-lg text-brass-200">Nenhuma Campanha Criada</h3>
        <button onclick="app.openCreateCampaignModal()" class="px-4 py-2 rounded-lg bg-brass-400 text-obsidian-950 font-bold text-xs">
          + Criar Primeira Campanha
        </button>
      </div>
    `;
    return;
  }

  const campCharIds = new Set(activeCamp.characterIds || []);
  const campaignCharacters = allChars.filter(c => campCharIds.has(c.id));

  const testSelectOptionsHtml = (selectedKey) => `
    <option value="">Sem teste solicitado</option>
    <optgroup label="Perícias (21)">
      ${SKILLS_DEF.map(s => `<option value="${s.id}" ${selectedKey === s.id ? 'selected' : ''}>Perícia: ${s.name} (${s.defaultAttr.toUpperCase()})</option>`).join('')}
    </optgroup>
    <optgroup label="Atributos Principais">
      ${ATTRIBUTES_DEF.map(a => `<option value="${a.key}" ${selectedKey === a.key ? 'selected' : ''}>Atributo: ${a.name} (${a.short})</option>`).join('')}
    </optgroup>
    <optgroup label="Testes de Resistência">
      ${SAVING_THROWS_DEF.map(sv => `<option value="save_${sv.key}" ${selectedKey === `save_${sv.key}` ? 'selected' : ''}>Resistência: ${sv.name}</option>`).join('')}
    </optgroup>
  `;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="victorian-card-gold rounded-xl p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-brass-400/20 pb-4">
          <div class="flex flex-wrap items-center gap-3">
            <div>
              <span class="text-[10px] font-display uppercase tracking-widest text-brass-400 block">Campanha Ativa do Mestre</span>
              <div class="flex items-center gap-2 mt-1">
                <select onchange="app.selectActiveCampaign(this.value)" class="sheet-input px-3.5 py-2 rounded-lg font-display font-bold text-sm sm:text-base text-brass-200 min-w-[250px]">
                  ${campaigns.map(c => `<option value="${c.id}" ${c.id === activeCamp.id ? 'selected' : ''}>${escapeHtml(c.name)} (Semana ${c.currentWeek || 1})</option>`).join('')}
                </select>
                <span class="px-3 py-1.5 rounded-lg bg-amber-950/90 border border-amber-400/40 font-display font-bold text-xs text-amber-200">
                  <i class="fa-solid fa-calendar-week mr-1"></i> Semana ${activeCamp.currentWeek || 1}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button onclick="app.openCreateCampaignModal()" class="px-3.5 py-2 rounded-lg bg-obsidian-800 hover:bg-brass-500/20 border border-brass-400/40 text-brass-200 text-xs font-bold flex items-center gap-1.5 transition-all">
              <i class="fa-solid fa-folder-plus text-brass-400"></i> Nova Campanha
            </button>
            <button onclick="app.openPassWeekModal()" class="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-obsidian-950 font-display font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all">
              <i class="fa-solid fa-forward-fast"></i> Passar a Semana & Entregar Resumo
            </button>
            ${campaigns.length > 1 ? `
              <button onclick="app.deleteActiveCampaign()" title="Excluir esta campanha" class="p-2 rounded-lg bg-crimson-950/60 hover:bg-crimson-600 text-crimson-300 hover:text-white border border-crimson-500/40 text-xs transition-all">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div class="lg:col-span-5 space-y-3">
            <div>
              <label class="block text-[11px] font-display uppercase tracking-wider text-brass-300 mb-1">Nome da Campanha</label>
              <input type="text" value="${escapeHtml(activeCamp.name || '')}" onchange="app.updateActiveCampaignField('name', this.value)"
                class="sheet-input w-full px-3 py-2 rounded-lg text-sm font-bold text-slate-100" />
            </div>
            <div>
              <label class="block text-[11px] font-display uppercase tracking-wider text-slate-400 mb-1">Sinopse / Notas da Campanha</label>
              <textarea rows="2" onchange="app.updateActiveCampaignField('description', this.value)"
                class="sheet-input w-full p-2.5 rounded-lg text-xs text-slate-300">${escapeHtml(activeCamp.description || '')}</textarea>
            </div>
            <label class="flex items-center justify-between gap-2 bg-obsidian-950/80 border border-brass-400/30 rounded-xl p-3 cursor-pointer">
              <div>
                <div class="text-xs font-bold text-brass-200 flex items-center gap-1.5">
                  <i class="fa-solid fa-shield-halved text-brass-400"></i> Restringir Combate & Rolagens de Dados
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  Apenas jogadores marcados nesta campanha aparecem na Barra de Combate e veem o feed de dados.
                </p>
              </div>
              <input type="checkbox" ${activeCamp.restrictCombatAndDice !== false ? 'checked' : ''}
                onchange="app.updateActiveCampaignField('restrictCombatAndDice', this.checked)"
                class="accent-amber-400 w-4 h-4 rounded shrink-0" />
            </label>
          </div>

          <div class="lg:col-span-7 bg-obsidian-950/75 border border-slate-800 rounded-xl p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <h4 class="font-display font-bold text-xs sm:text-sm uppercase tracking-wider text-brass-200 flex items-center gap-2">
                  <i class="fa-solid fa-users-gear text-brass-400"></i> Todas as Fichas Criadas — Escalar na Campanha (${campaignCharacters.length}/${allChars.length})
                </h4>
                <p class="text-[11px] text-slate-400">O Mestre visualiza todas as fichas criadas por qualquer jogador e escolhe quais entram na campanha</p>
              </div>
              <button onclick="app.syncPlayersToCombat()" class="px-3 py-1.5 rounded-lg bg-brass-500/20 hover:bg-brass-400 text-brass-200 hover:text-obsidian-950 border border-brass-400/40 text-xs font-bold transition-all">
                <i class="fa-solid fa-swords mr-1"></i> Sincronizar c/ Combate
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              ${allChars.map(ch => {
                const isSelected = campCharIds.has(ch.id);
                return `
                  <div onclick="app.toggleCharacterInActiveCampaign('${ch.id}')"
                    class="p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-2 ${isSelected ? 'bg-obsidian-800/95 border-brass-400 shadow-md' : 'bg-obsidian-950/60 border-slate-800/80 opacity-65 hover:opacity-100'}">
                    <div class="min-w-0">
                      <div class="text-xs font-display font-bold text-brass-200 truncate">${escapeHtml(ch.name)}</div>
                      <div class="text-[10px] text-slate-400 truncate">${escapeHtml(ch.player || ch.ownerEmail || 'Jogador')} • ${escapeHtml(ch.pathway)} (Seq. ${ch.sequence})</div>
                    </div>
                    <div class="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${isSelected ? 'bg-brass-400 border-brass-300 text-obsidian-950' : 'border-slate-600'}">
                      ${isSelected ? '<i class="fa-solid fa-check text-xs"></i>' : ''}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- 2. ANÁLISE DO MESTRE: ROTINA SEMANAL (DOWNTIME) -->
      <div class="victorian-card rounded-xl p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-brass-400/20 pb-3">
          <div>
            <h3 class="font-display font-bold text-base sm:text-lg text-brass-200 flex items-center gap-2">
              <i class="fa-solid fa-calendar-days text-amber-400"></i> Crônicas da Semana ${activeCamp.currentWeek || 1} — Análise de Downtime & Testes
            </h3>
            <p class="text-xs text-slate-400">
              Analise o que cada jogador fez nos dias sem missão, solicite testes de perícia/atributo e defina os efeitos (progresso de poção, pistas, itens, vida, sanidade, libras).
            </p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="app.openPassWeekModal()" class="px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-obsidian-950 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 transition-all">
              <i class="fa-solid fa-scroll"></i> Fechar & Passar Semana
            </button>
          </div>
        </div>

        ${campaignCharacters.length === 0 ? `
          <div class="p-8 text-center text-xs text-slate-400 bg-obsidian-950/60 rounded-xl border border-slate-800">
            Selecione pelo menos uma ficha acima para acompanhar as atividades semanais dos jogadores nesta campanha.
          </div>
        ` : `
          <div class="space-y-6">
            ${campaignCharacters.map(ch => {
              const dt = ch.weeklyDowntime || createDefaultWeeklyDowntime(activeCamp.currentWeek || 1);
              const hp = ch.vitals?.hp || { current: 20, max: 20 };
              const san = ch.vitals?.san || { current: 80, max: 100 };
              const sp = ch.vitals?.sp || { current: 20, max: 20 };

              return `
                <div class="bg-obsidian-950/85 border border-brass-400/30 rounded-xl p-4 sm:p-5 space-y-4">
                  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <h4 class="font-display font-bold text-base text-brass-200">${escapeHtml(ch.name)}</h4>
                        <span class="text-xs text-slate-400">(${escapeHtml(ch.player || 'Jogador')} • ${escapeHtml(ch.pathway)} Seq. ${ch.sequence} - ${escapeHtml(ch.potionName || '')})</span>
                        ${dt.submittedToGM
                          ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40"><i class="fa-solid fa-check-double mr-1"></i>Semana Enviada ao Mestre</span>`
                          : `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/70 text-amber-300 border border-amber-500/30"><i class="fa-solid fa-hourglass-half mr-1"></i>Em Preenchimento</span>`
                        }
                      </div>
                      ${dt.generalGoals ? `
                        <p class="text-xs text-slate-300 mt-1 italic bg-obsidian-900/90 px-3 py-1.5 rounded-lg border border-slate-800">
                          <strong class="text-brass-300 not-italic">Objetivo na Semana:</strong> "${escapeHtml(dt.generalGoals)}"
                        </p>
                      ` : ''}
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                      <div class="flex items-center gap-2 text-xs bg-obsidian-900 px-3 py-1.5 rounded-lg border border-slate-800">
                        <span class="text-crimson-400 font-bold">PV ${hp.current}/${hp.max}</span>
                        <span class="text-slate-600">•</span>
                        <span class="text-eldritch-400 font-bold">SAN ${san.current}/${san.max}</span>
                        <span class="text-slate-600">•</span>
                        <span class="text-astral-400 font-bold">PE ${sp.current}/${sp.max}</span>
                        <span class="text-slate-600">•</span>
                        <span class="text-amber-300 font-bold">Poção ${ch.potionProgress ?? 0}%</span>
                      </div>
                      <button onclick="app.openSequenceProgressionModal('${ch.id}')" class="px-3 py-1.5 rounded-lg bg-eldritch-900/60 hover:bg-eldritch-600 text-eldritch-200 hover:text-white border border-eldritch-400/40 text-xs font-bold flex items-center gap-1.5 transition-all">
                        <i class="fa-solid fa-flask-vial"></i> Avançar Sequência / Resumo da Poção
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    ${WEEK_DAYS_DEF.map(d => {
                      const dayObj = dt.days?.[d.key] || {
                        isMissionDay: false,
                        playerActivity: '',
                        gmRequestedTest: '',
                        gmTestDC: 12,
                        playerRollResult: null,
                        gmFeedback: '',
                        outcomes: [],
                        deltas: { potion: 0, hp: 0, san: 0, sp: 0, gold: 0, itemGained: '', clueGained: '' },
                        applied: false
                      };
                      const deltas = dayObj.deltas || { potion: 0, hp: 0, san: 0, sp: 0, gold: 0, itemGained: '', clueGained: '' };
                      const outcomes = Array.isArray(dayObj.outcomes) ? dayObj.outcomes : [];

                      return `
                        <div class="rounded-xl p-3.5 border transition-all space-y-2.5 ${dayObj.isMissionDay ? 'bg-crimson-950/20 border-crimson-500/40' : 'bg-obsidian-900/85 border-slate-800'}">
                          <div class="flex items-center justify-between gap-2 border-b border-slate-800/90 pb-2">
                            <div class="flex items-center gap-2">
                              <i class="fa-solid ${d.icon} text-brass-400 text-xs"></i>
                              <span class="font-display font-bold text-xs text-brass-200 uppercase">${d.label}</span>
                              ${dayObj.isMissionDay ? `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-crimson-900/80 text-crimson-200 border border-crimson-500/40">Dia de Missão / Sessão</span>` : ''}
                            </div>
                            <label class="inline-flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                              <input type="checkbox" ${dayObj.isMissionDay ? 'checked' : ''}
                                onchange="app.updateDowntimeDayField('${ch.id}', '${d.key}', 'isMissionDay', this.checked, true)"
                                class="accent-crimson-500 rounded" />
                              <span>Dia de Missão</span>
                            </label>
                          </div>

                          ${dayObj.isMissionDay ? `
                            <p class="text-xs text-slate-400 italic py-1">
                              <i class="fa-solid fa-swords text-crimson-400 mr-1"></i> Dia reservado para a missão principal (sessão jogada em mesa).
                              ${dayObj.playerActivity ? `<br><span class="text-slate-300 not-italic">Nota: ${escapeHtml(dayObj.playerActivity)}</span>` : ''}
                            </p>
                          ` : `
                            <div class="bg-obsidian-950/90 p-2.5 rounded-lg border border-slate-800/80">
                              <div class="text-[10px] uppercase tracking-wider text-slate-400 mb-1 flex justify-between">
                                <span>Relato do Jogador:</span>
                                ${dayObj.applied ? '<span class="text-emerald-400 font-bold"><i class="fa-solid fa-check mr-0.5"></i>Aplicado na Ficha</span>' : ''}
                              </div>
                              <p class="text-xs ${dayObj.playerActivity ? 'text-slate-200' : 'text-slate-500 italic'}">
                                ${dayObj.playerActivity ? escapeHtml(dayObj.playerActivity) : 'Nenhuma atividade descrita pelo jogador para este dia.'}
                              </p>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-obsidian-950/60 p-2 rounded-lg border border-slate-800/70">
                              <div class="sm:col-span-7">
                                <label class="block text-[9px] uppercase text-brass-300 mb-0.5">Pedir Teste ao Jogador</label>
                                <select onchange="app.updateDowntimeDayField('${ch.id}', '${d.key}', 'gmRequestedTest', this.value, true)"
                                  class="sheet-input w-full px-2 py-1 rounded text-[11px] text-amber-200">
                                  ${testSelectOptionsHtml(dayObj.gmRequestedTest)}
                                </select>
                              </div>
                              <div class="sm:col-span-2">
                                <label class="block text-[9px] uppercase text-slate-400 mb-0.5">DT / Dif.</label>
                                <input type="number" value="${dayObj.gmTestDC ?? 12}"
                                  onchange="app.updateDowntimeDayField('${ch.id}', '${d.key}', 'gmTestDC', Number(this.value))"
                                  class="sheet-input w-full text-center py-1 rounded text-[11px] font-bold text-brass-200" />
                              </div>
                              <div class="sm:col-span-3 flex flex-col items-end justify-center">
                                ${dayObj.playerRollResult ? `
                                  <span class="text-[9px] uppercase text-slate-400">Rolagem:</span>
                                  <span class="px-2 py-0.5 rounded font-display font-extrabold text-xs ${dayObj.playerRollResult.total >= (dayObj.gmTestDC || 12) ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-crimson-950 text-crimson-300 border border-crimson-500/40'}" title="${escapeHtml(dayObj.playerRollResult.details || '')}">
                                    ${dayObj.playerRollResult.total} (DT ${dayObj.gmTestDC ?? 12})
                                  </span>
                                ` : dayObj.gmRequestedTest ? `
                                  <button onclick="app.rollDowntimeRequestedTest('${ch.id}', '${d.key}')"
                                    class="w-full py-1 px-2 rounded bg-brass-500/20 hover:bg-brass-400 text-brass-200 hover:text-obsidian-950 border border-brass-400/40 text-[10px] font-bold transition-all">
                                    <i class="fa-solid fa-dice-d20 mr-0.5"></i> Rolar
                                  </button>
                                ` : `<span class="text-[10px] text-slate-500 italic">Livre</span>`}
                              </div>
                            </div>

                            <div class="space-y-1">
                              <span class="text-[9px] uppercase tracking-wider text-slate-400 block">Consequências & Descobertas do Dia:</span>
                              <div class="flex flex-wrap gap-1">
                                ${DOWNTIME_OUTCOME_TYPES.map(out => {
                                  const active = outcomes.includes(out.key);
                                  return `
                                    <button onclick="app.toggleDowntimeDayOutcome('${ch.id}', '${d.key}', '${out.key}')"
                                      class="px-2 py-0.5 rounded text-[10px] font-semibold border transition-all flex items-center gap-1 ${active ? out.badgeClass : 'bg-obsidian-950 border-slate-800 text-slate-500 hover:text-slate-300'}">
                                      <i class="fa-solid ${out.icon}"></i> ${out.label}
                                    </button>
                                  `;
                                }).join('')}
                              </div>
                            </div>

                            <div class="grid grid-cols-5 gap-1.5 pt-1">
                              <div>
                                <label class="block text-[9px] text-amber-300 text-center">% Poção</label>
                                <input type="number" value="${deltas.potion ?? 0}"
                                  onchange="app.updateDowntimeDayDelta('${ch.id}', '${d.key}', 'potion', Number(this.value))"
                                  class="sheet-input w-full text-center py-0.5 rounded text-xs font-bold text-amber-200" />
                              </div>
                              <div>
                                <label class="block text-[9px] text-crimson-300 text-center">Δ Vida</label>
                                <input type="number" value="${deltas.hp ?? 0}"
                                  onchange="app.updateDowntimeDayDelta('${ch.id}', '${d.key}', 'hp', Number(this.value))"
                                  class="sheet-input w-full text-center py-0.5 rounded text-xs font-bold text-crimson-200" />
                              </div>
                              <div>
                                <label class="block text-[9px] text-eldritch-300 text-center">Δ SAN</label>
                                <input type="number" value="${deltas.san ?? 0}"
                                  onchange="app.updateDowntimeDayDelta('${ch.id}', '${d.key}', 'san', Number(this.value))"
                                  class="sheet-input w-full text-center py-0.5 rounded text-xs font-bold text-eldritch-200" />
                              </div>
                              <div>
                                <label class="block text-[9px] text-astral-300 text-center">Δ PE</label>
                                <input type="number" value="${deltas.sp ?? 0}"
                                  onchange="app.updateDowntimeDayDelta('${ch.id}', '${d.key}', 'sp', Number(this.value))"
                                  class="sheet-input w-full text-center py-0.5 rounded text-xs font-bold text-astral-200" />
                              </div>
                              <div>
                                <label class="block text-[9px] text-amber-400 text-center">Δ Libras</label>
                                <input type="number" value="${deltas.gold ?? 0}"
                                  onchange="app.updateDowntimeDayDelta('${ch.id}', '${d.key}', 'gold', Number(this.value))"
                                  class="sheet-input w-full text-center py-0.5 rounded text-xs font-bold text-amber-300" />
                              </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              <input type="text" value="${escapeHtml(deltas.clueGained || '')}"
                                onchange="app.updateDowntimeDayDelta('${ch.id}', '${d.key}', 'clueGained', this.value)"
                                placeholder="Pista descoberta (vai p/ Diário)..."
                                class="sheet-input px-2 py-1 rounded text-[11px] text-amber-200" />
                              <input type="text" value="${escapeHtml(deltas.itemGained || '')}"
                                onchange="app.updateDowntimeDayDelta('${ch.id}', '${d.key}', 'itemGained', this.value)"
                                placeholder="Item ganho (adiciona ao Inventário)..."
                                class="sheet-input px-2 py-1 rounded text-[11px] text-emerald-200" />
                            </div>

                            <div class="flex items-center gap-2">
                              <input type="text" value="${escapeHtml(dayObj.gmFeedback || '')}"
                                onchange="app.updateDowntimeDayField('${ch.id}', '${d.key}', 'gmFeedback', this.value)"
                                placeholder="Resposta/narração do Mestre para este dia..."
                                class="sheet-input flex-1 px-2.5 py-1 rounded text-xs text-slate-200" />
                              <button onclick="app.applySingleDayOutcomeToChar('${ch.id}', '${d.key}')"
                                title="Aplicar imediatamente os ajustes deste dia na ficha do jogador"
                                class="px-2.5 py-1 rounded ${dayObj.applied ? 'bg-obsidian-800 text-slate-400 border-slate-700' : 'bg-emerald-600/30 hover:bg-emerald-500 text-emerald-200 hover:text-obsidian-950 border-emerald-500/40'} border text-[10px] font-bold shrink-0 transition-all">
                                <i class="fa-solid ${dayObj.applied ? 'fa-rotate-right' : 'fa-bolt'} mr-1"></i>${dayObj.applied ? 'Reaplicar' : 'Aplicar Dia'}
                              </button>
                            </div>
                          `}
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- 3. HISTÓRICO DE RESUMOS SEMANAIS DA CAMPANHA -->
      <div class="victorian-card rounded-xl p-5 space-y-3">
        <h3 class="font-display font-bold text-base text-brass-200 flex items-center gap-2">
          <i class="fa-solid fa-clock-rotate-left text-brass-400"></i> Histórico de Semanas Concluídas na Campanha
        </h3>
        ${(!activeCamp.weekHistory || activeCamp.weekHistory.length === 0) ? `
          <p class="text-xs text-slate-500 italic">Nenhuma semana encerrada ainda. Use o botão "Passar a Semana & Entregar Resumo" após avaliar as ações dos jogadores.</p>
        ` : `
          <div class="space-y-3">
            ${activeCamp.weekHistory.slice(0, 8).map(wh => `
              <div class="bg-obsidian-950/85 border border-brass-400/25 rounded-xl p-4 space-y-2">
                <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span class="font-display font-bold text-sm text-brass-200">
                    <i class="fa-solid fa-scroll text-brass-400 mr-1.5"></i> ${escapeHtml(wh.title || `Resumo da Semana ${wh.weekNumber}`)}
                  </span>
                  <span class="text-[11px] text-slate-400">${escapeHtml(wh.dateStr || '')}</span>
                </div>
                ${wh.generalNarrative ? `<p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(wh.generalNarrative)}</p>` : ''}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                  ${(wh.playerSummaries || []).map(ps => `
                    <div class="bg-obsidian-900/90 border border-slate-800 rounded-lg p-2.5 space-y-1">
                      <div class="font-display font-bold text-xs text-brass-300">${escapeHtml(ps.charName)}</div>
                      <div class="text-[10px] text-emerald-300 font-semibold">${escapeHtml(ps.recoveryText || '')}</div>
                      ${ps.eventsText ? `<div class="text-[11px] text-slate-300">${escapeHtml(ps.eventsText)}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

export function renderCharacterSheet(char, activeSheetTab, skillSortMode = 'alpha', actionFilterMode = 'all', campaignState = null, currentUser = null, storeUIState = null) {
  const emptyPrompt = document.getElementById('playerNoSheetPrompt');
  const mainSheetContent = document.getElementById('characterSheetMainContent');

  if (!char) {
    if (emptyPrompt) emptyPrompt.classList.remove('hidden');
    if (mainSheetContent) mainSheetContent.classList.add('hidden');
    return;
  }
  if (emptyPrompt) emptyPrompt.classList.add('hidden');
  if (mainSheetContent) mainSheetContent.classList.remove('hidden');

  const isGMUser = currentUser?.role === 'gm';

  // Botões exclusivos de Mestre dentro da ficha (Progredir Sequência)
  document.querySelectorAll('.gm-only-action').forEach(el => {
    el.classList.toggle('hidden', !isGMUser);
  });

  // Retrato / Imagem do Personagem
  const avatarImg = document.getElementById('charAvatarPreviewImg');
  const avatarPh = document.getElementById('charAvatarPlaceholder');
  if (avatarImg && avatarPh) {
    if (char.avatarUrl && String(char.avatarUrl).trim()) {
      avatarImg.src = char.avatarUrl;
      avatarImg.classList.remove('hidden');
      avatarPh.classList.add('hidden');
    } else {
      avatarImg.src = '';
      avatarImg.classList.add('hidden');
      avatarPh.classList.remove('hidden');
    }
  }
  setInputValueIfNotFocused('charAvatarUrlInput', (char.avatarUrl && !char.avatarUrl.startsWith('data:')) ? char.avatarUrl : '');
  setInputValueIfNotFocused('charContributionPointsHeader', char.contributionPoints ?? 0);

  setInputValueIfNotFocused('charName', char.name || '');
  setInputValueIfNotFocused('charPlayer', char.player || '');
  setInputValueIfNotFocused('charOrganization', char.organization || '');
  setInputValueIfNotFocused('charPathway', char.pathway || '');
  setInputValueIfNotFocused('charSequence', char.sequence || '9');
  setInputValueIfNotFocused('charPotionName', char.potionName || '');
  setInputValueIfNotFocused('charPotionProgress', char.potionProgress ?? 0);
  setInputValueIfNotFocused('charPotionSlider', char.potionProgress ?? 0);
  setInputValueIfNotFocused('charActingSummary', char.actingSummary || '');
  document.getElementById('potionProgressBar').style.width = `${clamp(char.potionProgress ?? 0, 0, 100)}%`;

  const hp = char.vitals?.hp || { current: 20, max: 20, temp: 0 };
  const sp = char.vitals?.sp || { current: 20, max: 20, temp: 0 };
  const san = char.vitals?.san || { current: 80, max: 100, temp: 0 };

  setInputValueIfNotFocused('hpCurrent', hp.current);
  setInputValueIfNotFocused('hpMax', hp.max);
  setInputValueIfNotFocused('hpTemp', hp.temp || 0);
  document.getElementById('hpBar').style.width = `${calcPercentage(hp.current, hp.max)}%`;

  setInputValueIfNotFocused('spCurrent', sp.current);
  setInputValueIfNotFocused('spMax', sp.max);
  setInputValueIfNotFocused('spTemp', sp.temp || 0);
  document.getElementById('spBar').style.width = `${calcPercentage(sp.current, sp.max)}%`;

  setInputValueIfNotFocused('sanCurrent', san.current);
  setInputValueIfNotFocused('sanMax', san.max);
  const sanPct = calcPercentage(san.current, san.max);
  document.getElementById('sanBar').style.width = `${sanPct}%`;

  const sanTag = document.getElementById('sanityStatusTag');
  if (sanPct >= 70) {
    sanTag.textContent = 'Estável';
    sanTag.className = 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30';
  } else if (sanPct >= 35) {
    sanTag.textContent = 'Sussurros Mentais';
    sanTag.className = 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/30';
  } else {
    sanTag.textContent = 'Risco de Perda de Controle!';
    sanTag.className = 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-crimson-950 text-crimson-300 border border-crimson-500 animate-pulse';
  }

  setInputValueIfNotFocused('charArmorClass', char.armorClass ?? 10);
  setInputValueIfNotFocused('charProficiencyBonus', char.proficiencyBonus ?? 2);
  setInputValueIfNotFocused('charBonusDie', char.bonusDie || '');
  document.getElementById('charAutoBonusDie').checked = !!char.autoBonusDie;

  const agiMod = calcAttrMod(char.attributes?.agi?.value ?? 10, char.attributes?.agi?.bonus ?? 0);
  document.getElementById('charInitiativeDisplay').textContent = formatSigned(agiMod);

  setInputValueIfNotFocused('currencyGold', char.currencyGold ?? 0);
  setInputValueIfNotFocused('currencySoli', char.currencySoli ?? 0);
  setInputValueIfNotFocused('currencyPenny', char.currencyPenny ?? 0);
  setInputValueIfNotFocused('charCorruptionLevel', char.corruptionLevel ?? 0);
  setInputValueIfNotFocused('charCorruptionSlider', char.corruptionLevel ?? 0);
  document.getElementById('corruptionProgressBar').style.width = `${clamp(char.corruptionLevel ?? 0, 0, 100)}%`;

  setInputValueIfNotFocused('charActingNotes', char.actingNotes || '');
  setInputValueIfNotFocused('charAnchors', char.anchors || '');
  setInputValueIfNotFocused('charBackstory', char.backstory || '');

  const downtimeBadge = document.getElementById('downtimePendingBadge');
  if (downtimeBadge) {
    const days = char.weeklyDowntime?.days || {};
    const pendingTestsCount = Object.values(days).filter(d => !d.isMissionDay && d.gmRequestedTest && !d.playerRollResult).length;
    if (pendingTestsCount > 0) {
      downtimeBadge.textContent = `${pendingTestsCount} Teste${pendingTestsCount > 1 ? 's' : ''}!`;
      downtimeBadge.classList.remove('hidden');
    } else {
      downtimeBadge.classList.add('hidden');
    }
  }

  renderAttributesSection(char);
  renderSavingThrowsSection(char);
  renderSkillsList(char, skillSortMode);
  renderSheetTabsUI(activeSheetTab);
  renderPlayerActionEconomyAndFilter(char, actionFilterMode);
  renderWeaponsList(char);
  renderEquipmentList(char);
  renderMysticList(char, 'powers');
  renderMysticList(char, 'spells');
  renderMutationsList(char);
  renderResistancesAndWeaknesses(char);
  renderCampaignStoreTab(char, campaignState, currentUser, storeUIState);
  renderSequenceSummariesList(char, isGMUser);
  renderDowntimeTab(char, campaignState);
}

export function renderSequenceSummariesList(char, isGMUser = false) {
  const containers = [
    document.getElementById('sequenceSummariesPowersContainer'),
    document.getElementById('sequenceSummariesNotesContainer')
  ].filter(Boolean);

  if (containers.length === 0) return;
  const list = char.sequenceSummaries || [];

  const html = list.length === 0
    ? `
      <div class="bg-obsidian-950/70 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 flex items-center justify-between gap-2">
        <span><i class="fa-solid fa-flask-vial text-brass-400 mr-1.5"></i> Nenhum resumo de avanço de sequência registrado ainda pelo Mestre.</span>
        ${isGMUser ? `
          <button onclick="app.openSequenceProgressionModal('${char.id}')" class="px-2.5 py-1 rounded bg-eldritch-900/50 hover:bg-eldritch-600 text-eldritch-200 hover:text-white border border-eldritch-500/40 text-[11px] font-bold shrink-0">
            + Registrar Evolução da Poção
          </button>
        ` : ''}
      </div>
    `
    : `
      <div class="space-y-2.5">
        ${list.map((item, idx) => `
          <div class="bg-gradient-to-r from-eldritch-900/35 via-obsidian-950 to-obsidian-950 border border-eldritch-500/40 rounded-xl p-3.5 space-y-1.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded bg-eldritch-500/20 border border-eldritch-400/40 text-eldritch-200 font-display font-bold text-[10px] uppercase">
                  <i class="fa-solid fa-angles-up mr-1"></i> Seq. ${escapeHtml(item.fromSequence || '?')} (${escapeHtml(item.fromPotion || '')}) → Seq. ${escapeHtml(item.toSequence || '?')} (${escapeHtml(item.toPotion || '')})
                </span>
                <span class="text-[10px] text-slate-400">${escapeHtml(item.date || '')}</span>
              </div>
              ${isGMUser ? `
                <button onclick="app.removeSequenceSummary('${char.id}', ${idx})" title="Remover registro" class="text-slate-500 hover:text-crimson-400 text-xs">
                  <i class="fa-solid fa-trash"></i>
                </button>
              ` : ''}
            </div>
            ${item.changesOverview ? `
              <div class="text-xs font-bold text-amber-300">
                <i class="fa-solid fa-sparkles mr-1"></i> Alterações na Poção: ${escapeHtml(item.changesOverview)}
              </div>
            ` : ''}
            <p class="text-xs text-slate-200 leading-relaxed whitespace-pre-line">${escapeHtml(item.summary || '')}</p>
          </div>
        `).join('')}
      </div>
    `;

  containers.forEach(c => { c.innerHTML = html; });
}

export function renderDowntimeTab(char, campaignState) {
  const container = document.getElementById('downtimeTabContainer');
  if (!container || !char) return;

  const activeCamp = (campaignState?.campaigns || []).find(c => c.id === campaignState?.activeCampaignId) || (campaignState?.campaigns || [])[0];
  const currentWeekNum = activeCamp?.currentWeek || char.weeklyDowntime?.weekNumber || 1;
  if (!char.weeklyDowntime) {
    char.weeklyDowntime = createDefaultWeeklyDowntime(currentWeekNum);
  }
  const dt = char.weeklyDowntime;
  const history = char.downtimeHistory || [];

  container.innerHTML = `
    <div class="space-y-5">
      <div class="victorian-card-gold rounded-xl p-4 sm:p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-brass-400/20 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-400/40 font-display font-bold text-[11px]">
                Semana Atual #${currentWeekNum}
              </span>
              ${dt.submittedToGM
                ? `<span class="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]"><i class="fa-solid fa-paper-plane mr-1"></i>Enviado ao Mestre</span>`
                : `<span class="px-2.5 py-0.5 rounded-full bg-obsidian-800 text-slate-300 border border-slate-700 text-[11px]">Rascunho Aberto</span>`
              }
            </div>
            <h3 class="font-display font-bold text-base sm:text-lg text-brass-200 mt-1">
              Diário Semanal Entre-Missões (Downtime)
            </h3>
            <p class="text-xs text-slate-400">
              Relate ao Mestre o que <strong>${escapeHtml(char.name)}</strong> fez nos dias da semana fora de missão. O Mestre analisará cada dia, poderá solicitar testes e indicará avanço na poção, pistas descobertas, itens, perda/ganho de vida ou sanidade.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button onclick="app.submitWeeklyDowntimeToGM()"
              class="px-4 py-2 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all ${dt.submittedToGM ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-brass-400 hover:bg-brass-300 text-obsidian-950'}">
              <i class="fa-solid ${dt.submittedToGM ? 'fa-check-double' : 'fa-paper-plane'}"></i>
              <span>${dt.submittedToGM ? 'Atualizar Envio ao Mestre' : 'Enviar Semana para o Mestre'}</span>
            </button>
          </div>
        </div>

        <div>
          <label class="block text-[11px] font-display uppercase tracking-wider text-brass-300 mb-1">
            <i class="fa-solid fa-bullseye mr-1"></i> Foco Principal / Intenção de Atuação na Semana
          </label>
          <input type="text" value="${escapeHtml(dt.generalGoals || '')}"
            oninput="app.updateDowntimeGeneralGoals(this.value)"
            placeholder="Ex: Digerir a poção no Clube de Adivinhação, investigar rumores no porto, manter âncoras familiares..."
            class="sheet-input w-full px-3.5 py-2 rounded-lg text-xs sm:text-sm text-slate-100" />
        </div>
      </div>

      <div class="space-y-3">
        ${WEEK_DAYS_DEF.map(d => {
          const dayObj = dt.days?.[d.key] || {
            isMissionDay: false,
            playerActivity: '',
            gmRequestedTest: '',
            gmTestDC: 12,
            playerRollResult: null,
            gmFeedback: '',
            outcomes: [],
            deltas: { potion: 0, hp: 0, san: 0, sp: 0, gold: 0, itemGained: '', clueGained: '' }
          };
          const outcomes = Array.isArray(dayObj.outcomes) ? dayObj.outcomes : [];
          const deltas = dayObj.deltas || {};
          const hasGMResponse = dayObj.gmFeedback || outcomes.length > 0 || deltas.potion || deltas.hp || deltas.san || deltas.sp || deltas.gold || deltas.itemGained || deltas.clueGained;

          return `
            <div class="victorian-card rounded-xl p-4 border transition-all space-y-3 ${dayObj.isMissionDay ? 'border-l-4 border-l-crimson-500 bg-crimson-950/10' : (dayObj.gmRequestedTest && !dayObj.playerRollResult ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-brass-500/60')}">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div class="flex items-center gap-2">
                  <span class="w-7 h-7 rounded-lg bg-obsidian-900 border border-brass-400/30 flex items-center justify-center text-brass-300 text-xs">
                    <i class="fa-solid ${d.icon}"></i>
                  </span>
                  <div>
                    <h4 class="font-display font-bold text-sm text-brass-200">${d.label}</h4>
                    <span class="text-[10px] text-slate-400">
                      ${dayObj.isMissionDay ? 'Dia em Missão Oficial (Sessão)' : 'Dia Livre / Entre-Missões'}
                    </span>
                  </div>
                </div>

                <label class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-obsidian-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" ${dayObj.isMissionDay ? 'checked' : ''}
                    onchange="app.updateDowntimeDayField('${char.id}', '${d.key}', 'isMissionDay', this.checked, true)"
                    class="accent-crimson-500 rounded" />
                  <span>Estava em Missão (Dia de Sessão)</span>
                </label>
              </div>

              ${dayObj.isMissionDay ? `
                <div class="bg-obsidian-950/70 border border-crimson-500/30 rounded-lg p-3 text-xs text-slate-300 flex items-center justify-between gap-2">
                  <span><i class="fa-solid fa-swords text-crimson-400 mr-1.5"></i> Neste dia seu personagem estava em missão ativa (sessão de jogo).</span>
                  <input type="text" value="${escapeHtml(dayObj.playerActivity || '')}"
                    oninput="app.updateDowntimeDayField('${char.id}', '${d.key}', 'playerActivity', this.value, false)"
                    placeholder="Resumo opcional da missão deste dia..."
                    class="sheet-input w-64 px-2.5 py-1 rounded text-xs" />
                </div>
              ` : `
                <div>
                  <label class="block text-[11px] uppercase tracking-wider text-slate-400 mb-1">
                    O que seu personagem fez neste dia? (Atuação, estudos, investigações, rituais, descanso)
                  </label>
                  <textarea rows="2"
                    oninput="app.updateDowntimeDayField('${char.id}', '${d.key}', 'playerActivity', this.value, false)"
                    placeholder="Descreva suas ações de ${d.label} para o Mestre analisar..."
                    class="sheet-input w-full p-2.5 rounded-lg text-xs text-slate-100 leading-relaxed">${escapeHtml(dayObj.playerActivity || '')}</textarea>
                </div>

                ${dayObj.gmRequestedTest ? `
                  <div class="bg-amber-950/40 border border-amber-400/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5">
                      <i class="fa-solid fa-dice-d20 text-amber-400 text-lg animate-bounce"></i>
                      <div>
                        <div class="text-xs font-display font-bold text-amber-200 uppercase">
                          O Mestre solicitou um teste para esta atividade!
                        </div>
                        <div class="text-xs text-slate-300">
                          Teste exigido: <strong class="text-brass-200">${escapeHtml(getTestLabelByKey(dayObj.gmRequestedTest))}</strong> • Dificuldade (DT): <strong>${dayObj.gmTestDC ?? 12}</strong>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center gap-2">
                      ${dayObj.playerRollResult ? `
                        <div class="px-3 py-1.5 rounded-lg border font-display font-bold text-xs ${dayObj.playerRollResult.total >= (dayObj.gmTestDC || 12) ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200' : 'bg-crimson-950/90 border-crimson-500 text-crimson-200'}">
                          Resultado: ${dayObj.playerRollResult.total} (${escapeHtml(dayObj.playerRollResult.details || '')})
                        </div>
                      ` : ''}
                      <button onclick="app.rollDowntimeRequestedTest('${char.id}', '${d.key}')"
                        class="px-3.5 py-1.5 rounded-lg bg-brass-400 hover:bg-brass-300 text-obsidian-950 font-display font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all">
                        <i class="fa-solid fa-dice-d20"></i> ${dayObj.playerRollResult ? 'Rolar Novamente' : 'Rolar Teste Agora'}
                      </button>
                    </div>
                  </div>
                ` : ''}

                ${hasGMResponse ? `
                  <div class="bg-obsidian-950/90 border border-brass-400/35 rounded-xl p-3 space-y-2">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="text-[10px] font-display font-bold uppercase tracking-wider text-brass-300 flex items-center gap-1.5">
                        <i class="fa-solid fa-crown text-brass-400"></i> Avaliação & Desdobramentos do Mestre:
                      </span>
                      <div class="flex flex-wrap gap-1">
                        ${outcomes.map(oKey => {
                          const meta = DOWNTIME_OUTCOME_TYPES.find(t => t.key === oKey);
                          if (!meta) return '';
                          return `<span class="px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeClass}"><i class="fa-solid ${meta.icon} mr-1"></i>${meta.label}</span>`;
                        }).join('')}
                        ${deltas.potion ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-500/40">Poção ${formatSigned(deltas.potion)}%</span>` : ''}
                        ${deltas.hp ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-crimson-950 text-crimson-300 border border-crimson-500/40">PV ${formatSigned(deltas.hp)}</span>` : ''}
                        ${deltas.san ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-eldritch-900 text-eldritch-200 border border-eldritch-500/40">SAN ${formatSigned(deltas.san)}</span>` : ''}
                        ${deltas.sp ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-astral-900 text-astral-200 border border-astral-500/40">PE ${formatSigned(deltas.sp)}</span>` : ''}
                        ${deltas.gold ? `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-200 border border-amber-400/40">Libras ${formatSigned(deltas.gold)} £</span>` : ''}
                      </div>
                    </div>
                    ${dayObj.gmFeedback ? `<p class="text-xs text-slate-200 leading-relaxed">${escapeHtml(dayObj.gmFeedback)}</p>` : ''}
                    ${deltas.clueGained ? `<div class="text-xs text-amber-300"><i class="fa-solid fa-magnifying-glass mr-1"></i><strong>Pista Descoberta:</strong> ${escapeHtml(deltas.clueGained)}</div>` : ''}
                    ${deltas.itemGained ? `<div class="text-xs text-emerald-300"><i class="fa-solid fa-box-open mr-1"></i><strong>Item Obtido:</strong> ${escapeHtml(deltas.itemGained)}</div>` : ''}
                  </div>
                ` : ''}
              `}
            </div>
          `;
        }).join('')}
      </div>

      <div class="victorian-card rounded-xl p-4 sm:p-5 space-y-3">
        <h3 class="font-display font-bold text-sm sm:text-base text-brass-200 uppercase tracking-wider flex items-center gap-2">
          <i class="fa-solid fa-scroll text-brass-400"></i> Resumos de Semanas Anteriores (Entregues pelo Mestre)
        </h3>
        ${history.length === 0 ? `
          <p class="text-xs text-slate-500 italic">Nenhum resumo de passagem de semana recebido ainda.</p>
        ` : `
          <div class="space-y-3">
            ${history.map(h => `
              <div class="bg-obsidian-950/85 border border-brass-400/30 rounded-xl p-3.5 space-y-1.5">
                <div class="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <span class="font-display font-bold text-xs text-brass-200">Semana ${h.weekNumber} • ${escapeHtml(h.campaignName || 'Campanha')}</span>
                  <span class="text-[10px] text-slate-400">${escapeHtml(h.date || '')}</span>
                </div>
                ${h.recoveryText ? `<div class="text-xs font-bold text-emerald-300"><i class="fa-solid fa-heart-circle-plus mr-1"></i>Recuperação & Finanças: ${escapeHtml(h.recoveryText)}</div>` : ''}
                ${h.eventsText ? `<p class="text-xs text-slate-200 leading-relaxed whitespace-pre-line">${escapeHtml(h.eventsText)}</p>` : ''}
                ${h.generalNarrative ? `<p class="text-[11px] text-slate-400 italic border-t border-slate-800/80 pt-1.5 mt-1">${escapeHtml(h.generalNarrative)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        `}
      </div>
    </div>
  `;
}

export function renderAttributesSection(char) {
  const container = document.getElementById('attributesContainer');
  container.innerHTML = ATTRIBUTES_DEF.map(attr => {
    const data = char.attributes?.[attr.key] || { value: 10, bonus: 0 };
    const mod = calcAttrMod(data.value, data.bonus);

    return `
      <div class="attr-shield rounded-xl p-3 flex flex-col items-center justify-between text-center relative">
        <div class="flex items-center justify-between w-full mb-1">
          <span class="text-[10px] font-display uppercase tracking-wider text-brass-300 font-bold">
            <i class="fa-solid ${attr.icon} mr-1 text-brass-400"></i>${attr.name}
          </span>
          <button onclick="app.rollAttributeCheck('${attr.key}')" title="Rolar Teste de ${attr.name}"
            class="w-6 h-6 rounded-md bg-brass-500/20 hover:bg-brass-400 text-brass-200 hover:text-obsidian-950 flex items-center justify-center transition-all">
            <i class="fa-solid fa-dice-d20 text-xs"></i>
          </button>
        </div>

        <button onclick="app.rollAttributeCheck('${attr.key}')" class="my-1 px-4 py-1 rounded-full bg-obsidian-950/90 border border-brass-400/40 font-display font-extrabold text-xl text-brass-200 hover:border-brass-300 transition-all">
          ${formatSigned(mod)}
        </button>

        <div class="flex items-center justify-center gap-1.5 mt-1.5 w-full">
          <div class="flex flex-col items-center">
            <span class="text-[9px] text-slate-400 uppercase">Valor</span>
            <input type="number" value="${data.value}"
              oninput="app.updateAttribute('${attr.key}', 'value', Number(this.value))"
              class="sheet-input w-12 text-center py-0.5 rounded text-xs font-bold text-slate-100" />
          </div>
          <div class="flex flex-col items-center">
            <span class="text-[9px] text-slate-400 uppercase">Bônus</span>
            <input type="number" value="${data.bonus || 0}"
              oninput="app.updateAttribute('${attr.key}', 'bonus', Number(this.value))"
              class="sheet-input w-12 text-center py-0.5 rounded text-xs font-semibold text-cyan-300" />
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export function renderSavingThrowsSection(char) {
  const container = document.getElementById('savingThrowsContainer');
  const profBonus = Number(char.proficiencyBonus) || 2;

  container.innerHTML = SAVING_THROWS_DEF.map(sv => {
    const svData = char.savingThrows?.[sv.key] || { proficient: false, bonus: 0 };
    const attrObj = char.attributes?.[sv.defaultAttr] || { value: 10, bonus: 0 };
    const attrMod = calcAttrMod(attrObj.value, attrObj.bonus);
    const total = attrMod + (svData.proficient ? profBonus : 0) + (Number(svData.bonus) || 0);

    return `
      <div class="flex items-center justify-between gap-2 bg-obsidian-950/75 border ${svData.proficient ? 'border-brass-400/50' : 'border-slate-800/80'} rounded-lg px-2.5 py-2">
        <div class="flex items-center gap-2 min-w-0">
          <button onclick="app.toggleSaveProficiency('${sv.key}')" title="Marcar/Desmarcar Proficiência"
            class="w-4 h-4 rounded-full border flex items-center justify-center transition-all ${svData.proficient ? 'bg-brass-400 border-brass-300 text-obsidian-950' : 'border-slate-600 hover:border-brass-400'}">
            ${svData.proficient ? '<i class="fa-solid fa-check text-[9px]"></i>' : ''}
          </button>
          <span class="text-xs font-medium text-slate-200 truncate">${sv.name}</span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <input type="number" value="${svData.bonus || 0}" title="Bônus Adicional"
            oninput="app.updateSaveBonus('${sv.key}', Number(this.value))"
            class="sheet-input w-10 text-center py-0.5 rounded text-[11px] text-slate-300" />
          
          <button onclick="app.rollSavingThrow('${sv.key}')"
            class="px-2 py-1 rounded bg-obsidian-800 hover:bg-brass-400 text-brass-200 hover:text-obsidian-950 border border-brass-400/30 font-display font-bold text-xs flex items-center gap-1 transition-all min-w-[52px] justify-center">
            <i class="fa-solid fa-dice-d20 text-[10px]"></i>
            <span>${formatSigned(total)}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function renderSkillsList(char, sortMode = 'alpha') {
  if (!char) return;
  const container = document.getElementById('skillsListContainer');
  const filterText = (document.getElementById('skillSearchInput')?.value || '').toLowerCase().trim();
  const profBonus = Number(char.proficiencyBonus) || 2;

  const btnAlpha = document.getElementById('btnSortSkillsAlpha');
  const btnAttr = document.getElementById('btnSortSkillsAttr');
  if (btnAlpha && btnAttr) {
    btnAlpha.className = sortMode === 'alpha'
      ? 'px-2 py-1 rounded text-[10px] font-bold bg-brass-400 text-obsidian-950'
      : 'px-2 py-1 rounded text-[10px] font-semibold bg-obsidian-900 text-slate-400 hover:text-slate-200 border border-slate-800';
    btnAttr.className = sortMode === 'attr'
      ? 'px-2 py-1 rounded text-[10px] font-bold bg-brass-400 text-obsidian-950'
      : 'px-2 py-1 rounded text-[10px] font-semibold bg-obsidian-900 text-slate-400 hover:text-slate-200 border border-slate-800';
  }

  const filteredSkills = SKILLS_DEF.filter(sk => sk.name.toLowerCase().includes(filterText));

  const renderSingleSkillRow = (sk) => {
    const skData = char.skills?.[sk.id] || { attr: sk.defaultAttr, profLevel: 0, bonus: 0 };
    const chosenAttr = skData.attr || sk.defaultAttr;
    const attrObj = char.attributes?.[chosenAttr] || { value: 10, bonus: 0 };
    const attrMod = calcAttrMod(attrObj.value, attrObj.bonus);
    const total = attrMod + ((skData.profLevel || 0) * profBonus) + (Number(skData.bonus) || 0);

    const profBadgeClass = skData.profLevel === 2
      ? 'bg-amber-400 border-amber-300 text-obsidian-950'
      : skData.profLevel === 1
      ? 'bg-brass-400/80 border-brass-300 text-obsidian-950'
      : 'bg-obsidian-900 border-slate-600 text-transparent hover:border-brass-400';

    return `
      <div class="flex items-center justify-between gap-2 bg-obsidian-950/75 hover:bg-obsidian-900/90 border ${skData.profLevel > 0 ? 'border-brass-400/40' : 'border-slate-800/80'} rounded-lg px-2.5 py-1.5 transition-all">
        <div class="flex items-center gap-2 min-w-0 flex-1">
          <button onclick="app.cycleSkillProficiency('${sk.id}')" title="Alternar: Destreinado -> Proficiente -> Especialista"
            class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 text-[9px] font-extrabold transition-all ${profBadgeClass}">
            ${skData.profLevel === 2 ? 'E' : (skData.profLevel === 1 ? 'P' : '')}
          </button>
          <span class="text-xs font-medium text-slate-100 truncate">${sk.name}</span>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <select onchange="app.updateSkillField('${sk.id}', 'attr', this.value)"
            class="bg-obsidian-900 border border-slate-700/80 rounded px-1.5 py-0.5 text-[10px] font-display font-bold text-brass-300 uppercase focus:outline-none">
            ${ATTRIBUTES_DEF.map(a => `<option value="${a.key}" ${a.key === chosenAttr ? 'selected' : ''}>${a.short}</option>`).join('')}
          </select>

          <input type="number" value="${skData.bonus || 0}" title="Outros Bônus nesta perícia"
            oninput="app.updateSkillField('${sk.id}', 'bonus', Number(this.value))"
            class="sheet-input w-10 text-center py-0.5 rounded text-[11px] text-slate-300" />

          <button onclick="app.rollSkillCheck('${sk.id}')"
            class="px-2.5 py-1 rounded bg-obsidian-800 hover:bg-brass-400 text-brass-200 hover:text-obsidian-950 border border-brass-400/35 font-display font-bold text-xs flex items-center gap-1.5 transition-all min-w-[56px] justify-center">
            <i class="fa-solid fa-dice-d20 text-[10px]"></i>
            <span>${formatSigned(total)}</span>
          </button>
        </div>
      </div>
    `;
  };

  if (sortMode === 'attr') {
    container.innerHTML = ATTRIBUTES_DEF.map(attr => {
      const groupSkills = filteredSkills
        .filter(sk => (char.skills?.[sk.id]?.attr || sk.defaultAttr) === attr.key)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      if (groupSkills.length === 0) return '';
      return `
        <div class="pt-2 first:pt-0">
          <div class="text-[10px] font-display font-bold uppercase tracking-wider text-brass-400 px-1 mb-1 flex items-center gap-1.5">
            <i class="fa-solid ${attr.icon}"></i> ${attr.name} (${attr.short})
          </div>
          <div class="space-y-1.5">
            ${groupSkills.map(renderSingleSkillRow).join('')}
          </div>
        </div>
      `;
    }).join('');
  } else {
    const sortedAlpha = [...filteredSkills].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    container.innerHTML = sortedAlpha.map(renderSingleSkillRow).join('');
  }
}

export function renderSheetTabsUI(activeSheetTab) {
  const tabs = ['combat', 'powers', 'spells', 'mutations', 'resistances', 'store', 'downtime', 'notes'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabBtn-${t}`);
    const content = document.getElementById(`tabContent-${t}`);
    if (!btn || !content) return;
    if (t === activeSheetTab) {
      btn.className = 'sheet-tab-btn flex-1 min-w-[110px] py-2.5 px-3 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-brass-400 text-obsidian-950 shadow-md';
      content.classList.remove('hidden');
    } else {
      btn.className = 'sheet-tab-btn flex-1 min-w-[110px] py-2.5 px-3 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-obsidian-900/70 hover:bg-obsidian-800 text-slate-300 border border-slate-800';
      content.classList.add('hidden');
    }
  });
}

export function renderPlayerActionEconomyAndFilter(char, actionFilterMode = 'all') {
  const slotsContainer = document.getElementById('playerTurnActionSlots');
  const filterButtonsContainer = document.getElementById('playerActionFilterButtons');
  const filteredResultsContainer = document.getElementById('playerFilteredActionsList');
  if (!slotsContainer || !filterButtonsContainer || !filteredResultsContainer) return;

  const turnActions = char.turnActions || DEFAULT_TURN_ACTIONS;

  slotsContainer.innerHTML = ACTION_TYPES.filter(a => a.key !== 'livre').map(a => {
    const isAvailable = turnActions[a.key] !== false;
    return `
      <button onclick="app.toggleCharacterTurnAction('${char.id}', '${a.key}')"
        class="p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${isAvailable ? a.badgeClass + ' shadow-md' : 'bg-obsidian-950/70 border-slate-800 text-slate-500 opacity-60'}">
        <div class="flex items-center gap-2">
          <i class="fa-solid ${a.icon} text-sm"></i>
          <div>
            <div class="font-display font-bold text-xs">${a.short}</div>
            <div class="text-[10px] opacity-80">${isAvailable ? 'Disponível' : 'Já Utilizada'}</div>
          </div>
        </div>
        <span class="w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-400' : 'bg-slate-700'}"></span>
      </button>
    `;
  }).join('');

  const filters = [
    { key: 'all', label: 'Todas' },
    { key: 'available', label: 'Apenas Disponíveis no Turno' },
    { key: 'padrao', label: 'Ação Padrão' },
    { key: 'bonus', label: 'Ação Bônus' },
    { key: 'movimento', label: 'Movimento' },
    { key: 'oportunidade', label: 'Oportunidade' }
  ];

  filterButtonsContainer.innerHTML = filters.map(f => `
    <button onclick="app.setActionFilterMode('${f.key}')"
      class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${actionFilterMode === f.key ? 'bg-brass-400 text-obsidian-950 border-brass-300' : 'bg-obsidian-900 text-slate-300 border-slate-800 hover:border-brass-400/40'}">
      ${f.label}
    </button>
  `).join('');

  const allOptions = [];

  (char.weapons || []).forEach((w, idx) => {
    const aType = w.actionType || 'padrao';
    const ammoInfo = w.isFirearm ? ` • Munição: ${w.ammoCurrent ?? 0}/${w.ammoMax ?? 6}` : '';
    allOptions.push({
      actionType: aType,
      category: 'Arma / Ataque',
      name: w.name || 'Ataque',
      detail: `Atq ${formatSigned(w.attackBonus ?? 0)} • Dano ${w.damage || '1d6'}${ammoInfo}`,
      ctaLabel: 'Atacar',
      onClick: `app.rollWeaponAttack(${idx}, true)`
    });
  });

  (char.powers || []).forEach((p, idx) => {
    const aType = p.actionType || 'padrao';
    allOptions.push({
      actionType: aType,
      category: 'Poder Beyonder',
      name: p.name || 'Poder',
      detail: `${p.sequence || 'Beyonder'} • Custo: ${p.cost ?? 0} PE`,
      ctaLabel: 'Ativar',
      onClick: `app.useMysticResource('powers', ${idx}, true)`
    });
  });

  (char.spells || []).forEach((sp, idx) => {
    const aType = sp.actionType || 'padrao';
    allOptions.push({
      actionType: aType,
      category: 'Magia / Ritual',
      name: sp.name || 'Magia',
      detail: `${sp.level || 'Ocultismo'} • Custo: ${sp.cost ?? 0} PE`,
      ctaLabel: 'Conjurar',
      onClick: `app.useMysticResource('spells', ${idx}, true)`
    });
  });

  allOptions.push(
    {
      actionType: 'movimento',
      category: 'Manobra Básica',
      name: 'Deslocamento Tático / Buscar Cobertura',
      detail: 'Move-se pelo cenário ou posiciona-se atrás de cobertura',
      ctaLabel: 'Gastar Movimento',
      onClick: `app.consumeTurnAction('${char.id}', 'movimento', 'Deslocamento Tático')`
    },
    {
      actionType: 'oportunidade',
      category: 'Reação Básica',
      name: 'Ataque de Oportunidade / Esquiva Reativa',
      detail: 'Reação desencadeada por brecha inimiga ou perigo iminente',
      ctaLabel: 'Gastar Reação',
      onClick: `app.consumeTurnAction('${char.id}', 'oportunidade', 'Reação de Oportunidade')`
    }
  );

  const filtered = allOptions.filter(opt => {
    if (actionFilterMode === 'all') return true;
    if (actionFilterMode === 'available') {
      return opt.actionType === 'livre' || turnActions[opt.actionType] !== false;
    }
    return opt.actionType === actionFilterMode;
  });

  if (filtered.length === 0) {
    filteredResultsContainer.innerHTML = `<p class="text-xs text-slate-500 italic py-2 text-center">Nenhuma ação encontrada para este filtro.</p>`;
    return;
  }

  filteredResultsContainer.innerHTML = filtered.map(opt => {
    const meta = getActionTypeMeta(opt.actionType);
    const slotAvailable = opt.actionType === 'livre' || turnActions[opt.actionType] !== false;

    return `
      <div class="flex flex-wrap items-center justify-between gap-2 bg-obsidian-950/85 border ${slotAvailable ? 'border-slate-800' : 'border-slate-900 opacity-55'} rounded-lg px-3 py-2">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${meta.badgeClass}">
            <i class="fa-solid ${meta.icon} mr-1"></i>${meta.short}
          </span>
          <div class="min-w-0">
            <div class="text-xs font-bold text-slate-100 truncate">${escapeHtml(opt.name)}</div>
            <div class="text-[10px] text-slate-400 truncate">${escapeHtml(opt.category)} • ${escapeHtml(opt.detail)}</div>
          </div>
        </div>
        <button onclick="${opt.onClick}" class="px-2.5 py-1 rounded bg-obsidian-800 hover:bg-brass-400 text-brass-200 hover:text-obsidian-950 border border-brass-400/30 font-display font-bold text-[11px] transition-all shrink-0">
          ${opt.ctaLabel}
        </button>
      </div>
    `;
  }).join('');
}

export function renderWeaponsList(char) {
  const container = document.getElementById('weaponsListContainer');
  const weapons = char.weapons || [];
  if (weapons.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-4">Nenhuma arma ou ataque cadastrado.</p>`;
    return;
  }

  container.innerHTML = weapons.map((w, idx) => {
    const actionKey = w.actionType || 'padrao';
    const isFirearm = w.isFirearm !== false && (w.isFirearm || w.ammoMax > 0);
    const ammoCur = Number(w.ammoCurrent ?? 6);
    const ammoMax = Math.max(1, Number(w.ammoMax ?? 6));

    const bulletsVisual = isFirearm
      ? Array.from({ length: Math.min(ammoMax, 12) }, (_, i) =>
          `<i class="fa-solid fa-circle text-[7px] ${i < ammoCur ? 'text-amber-400' : 'text-slate-700'}"></i>`
        ).join('')
      : '';

    return `
      <div class="bg-obsidian-950/80 border border-slate-800 hover:border-brass-400/35 rounded-xl p-3.5 transition-all space-y-2.5">
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <div class="sm:col-span-4">
            <label class="block text-[10px] uppercase text-slate-400">Arma / Ataque</label>
            <input type="text" value="${escapeHtml(w.name || '')}" oninput="app.updateCollectionItem('weapons', ${idx}, 'name', this.value)"
              class="sheet-input w-full px-2.5 py-1.5 rounded text-xs font-bold text-brass-200" />
          </div>

          <div class="sm:col-span-3">
            <label class="block text-[10px] uppercase text-brass-300">Tipo de Ação</label>
            <select onchange="app.updateCollectionItem('weapons', ${idx}, 'actionType', this.value, true)"
              class="sheet-input w-full px-2 py-1.5 rounded text-xs font-semibold text-amber-200">
              ${ACTION_TYPES.map(a => `<option value="${a.key}" ${actionKey === a.key ? 'selected' : ''}>${a.label}</option>`).join('')}
            </select>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[10px] uppercase text-slate-400">Bônus Atq</label>
            <input type="number" value="${w.attackBonus ?? 0}" oninput="app.updateCollectionItem('weapons', ${idx}, 'attackBonus', Number(this.value))"
              class="sheet-input w-full px-2 py-1.5 rounded text-xs text-center font-bold text-amber-300" />
          </div>

          <div class="sm:col-span-3">
            <label class="block text-[10px] uppercase text-slate-400">Fórmula de Dano</label>
            <input type="text" value="${escapeHtml(w.damage || '1d6')}" oninput="app.updateCollectionItem('weapons', ${idx}, 'damage', this.value)"
              class="sheet-input w-full px-2.5 py-1.5 rounded text-xs text-center font-bold text-crimson-300" />
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 bg-obsidian-900/70 px-3 py-2 rounded-lg border border-slate-800/90">
          <label class="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
            <input type="checkbox" ${isFirearm ? 'checked' : ''} onchange="app.updateCollectionItem('weapons', ${idx}, 'isFirearm', this.checked, true)" class="accent-amber-400 rounded" />
            <span class="font-semibold text-[11px]"><i class="fa-solid fa-gun text-brass-400 mr-1"></i>Arma de Fogo (Munição)</span>
          </label>

          ${isFirearm ? `
            <div class="flex flex-wrap items-center gap-2">
              <div class="flex items-center gap-1 mr-1" title="Tambor / Pente">${bulletsVisual}</div>
              <div class="flex items-center gap-1 text-xs">
                <button onclick="app.adjustWeaponAmmo(${idx}, -1)" class="px-2 py-0.5 rounded bg-obsidian-950 hover:bg-crimson-950 text-crimson-300 border border-slate-700 font-bold">-1</button>
                <input type="number" min="0" value="${ammoCur}" onchange="app.updateCollectionItem('weapons', ${idx}, 'ammoCurrent', Number(this.value), true)"
                  class="sheet-input w-12 text-center py-0.5 rounded text-xs font-extrabold ${ammoCur === 0 ? 'text-crimson-400 border-crimson-500' : 'text-amber-300'}" />
                <span class="text-slate-500">/</span>
                <input type="number" min="1" value="${ammoMax}" onchange="app.updateCollectionItem('weapons', ${idx}, 'ammoMax', Number(this.value), true)"
                  class="sheet-input w-12 text-center py-0.5 rounded text-xs text-slate-300" />
                <button onclick="app.adjustWeaponAmmo(${idx}, 1)" class="px-2 py-0.5 rounded bg-obsidian-950 hover:bg-emerald-950 text-emerald-300 border border-slate-700 font-bold">+1</button>
              </div>
              <button onclick="app.reloadWeapon(${idx})" class="px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-400 text-amber-200 hover:text-obsidian-950 border border-amber-400/40 text-[11px] font-bold transition-all">
                <i class="fa-solid fa-rotate-right mr-1"></i>Recarregar
              </button>
            </div>
          ` : `<span class="text-[11px] text-slate-500 italic">Arma Branca / Sem Munição</span>`}
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
          <input type="text" value="${escapeHtml(w.type || '')}" oninput="app.updateCollectionItem('weapons', ${idx}, 'type', this.value)"
            placeholder="Tipo de dano, alcance, propriedades místicas..."
            class="sheet-input flex-1 min-w-[180px] px-2.5 py-1 rounded text-xs text-slate-400" />

          <div class="flex items-center gap-1.5">
            <button onclick="app.rollWeaponAttack(${idx}, true)" class="px-3 py-1.5 rounded-lg bg-brass-500/20 hover:bg-brass-400 text-brass-200 hover:text-obsidian-950 border border-brass-400/40 font-display font-bold text-xs flex items-center gap-1.5 transition-all">
              <i class="fa-solid fa-dice-d20"></i> Atacar (${formatSigned(w.attackBonus ?? 0)})
            </button>
            <button onclick="app.rollWeaponDamage(${idx})" class="px-3 py-1.5 rounded-lg bg-crimson-900/40 hover:bg-crimson-600 text-crimson-200 hover:text-white border border-crimson-500/40 font-display font-bold text-xs flex items-center gap-1.5 transition-all">
              <i class="fa-solid fa-burst"></i> Dano (${escapeHtml(w.damage || '1d6')})
            </button>
            <button onclick="app.removeCollectionItem('weapons', ${idx})" class="p-1.5 rounded-lg bg-obsidian-900 hover:bg-crimson-950 text-slate-500 hover:text-crimson-400 border border-slate-800 text-xs">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

export function renderEquipmentList(char) {
  const container = document.getElementById('equipmentListContainer');
  const items = char.equipment || [];
  if (items.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-4">Nenhum equipamento ou artefato selado registrado.</p>`;
    return;
  }

  container.innerHTML = items.map((item, idx) => `
    <div class="bg-obsidian-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <input type="text" value="${escapeHtml(item.name || '')}" oninput="app.updateCollectionItem('equipment', ${idx}, 'name', this.value)"
          placeholder="Nome do Item ou Artefato Selado" class="sheet-input flex-1 min-w-[180px] px-2.5 py-1.5 rounded text-xs font-bold text-amber-200" />
        
        <select onchange="app.updateCollectionItem('equipment', ${idx}, 'category', this.value)" class="sheet-input px-2.5 py-1.5 rounded text-xs text-eldritch-300">
          ${EQUIPMENT_CATEGORIES.map(cat => `<option value="${cat}" ${item.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>

        <div class="flex items-center gap-1">
          <span class="text-[10px] text-slate-400">Qtd:</span>
          <input type="number" value="${item.quantity ?? 1}" oninput="app.updateCollectionItem('equipment', ${idx}, 'quantity', Number(this.value))"
            class="sheet-input w-14 text-center py-1 rounded text-xs font-bold" />
        </div>

        <button onclick="app.removeCollectionItem('equipment', ${idx})" class="p-1.5 rounded bg-obsidian-900 hover:bg-crimson-950 text-slate-500 hover:text-crimson-400 border border-slate-800 text-xs">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <textarea rows="2" oninput="app.updateCollectionItem('equipment', ${idx}, 'description', this.value)"
        placeholder="Propriedades, habilidades e efeitos colaterais / condições de selamento..."
        class="sheet-input w-full p-2 rounded text-xs text-slate-300">${escapeHtml(item.description || '')}</textarea>
    </div>
  `).join('');
}

export function renderMysticList(char, collectionKey) {
  const isPowers = collectionKey === 'powers';
  const container = document.getElementById(isPowers ? 'powersListContainer' : 'spellsListContainer');
  const list = char[collectionKey] || [];

  if (list.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-4">Nenhum registro cadastrado.</p>`;
    return;
  }

  container.innerHTML = list.map((item, idx) => {
    const actionKey = item.actionType || 'padrao';
    return `
      <div class="bg-obsidian-950/85 border ${isPowers ? 'border-eldritch-500/30' : 'border-astral-500/30'} rounded-xl p-4 space-y-2.5">
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <div class="sm:col-span-4">
            <label class="block text-[10px] uppercase ${isPowers ? 'text-eldritch-300' : 'text-astral-300'}">${isPowers ? 'Nome do Poder Beyonder' : 'Nome da Magia / Ritual'}</label>
            <input type="text" value="${escapeHtml(item.name || '')}" oninput="app.updateCollectionItem('${collectionKey}', ${idx}, 'name', this.value)"
              class="sheet-input w-full px-2.5 py-1.5 rounded text-xs font-bold ${isPowers ? 'text-eldritch-200' : 'text-astral-200'}" />
          </div>

          <div class="sm:col-span-3">
            <label class="block text-[10px] uppercase text-brass-300">Tipo de Ação</label>
            <select onchange="app.updateCollectionItem('${collectionKey}', ${idx}, 'actionType', this.value, true)"
              class="sheet-input w-full px-2 py-1.5 rounded text-xs font-semibold text-amber-200">
              ${ACTION_TYPES.map(a => `<option value="${a.key}" ${actionKey === a.key ? 'selected' : ''}>${a.label}</option>`).join('')}
            </select>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[10px] uppercase text-slate-400">${isPowers ? 'Sequência' : 'Tipo / Nível'}</label>
            <input type="text" value="${escapeHtml((isPowers ? item.sequence : item.level) || '')}"
              oninput="app.updateCollectionItem('${collectionKey}', ${idx}, '${isPowers ? 'sequence' : 'level'}', this.value)"
              class="sheet-input w-full px-2 py-1.5 rounded text-xs text-brass-200" />
          </div>

          <div class="sm:col-span-1">
            <label class="block text-[10px] uppercase text-astral-300">PE</label>
            <input type="number" value="${item.cost ?? 0}" oninput="app.updateCollectionItem('${collectionKey}', ${idx}, 'cost', Number(this.value))"
              class="sheet-input w-full px-1.5 py-1.5 rounded text-xs text-center font-bold text-astral-300" />
          </div>

          <div class="sm:col-span-2 flex items-end justify-end gap-1.5 pt-3">
            <button onclick="app.useMysticResource('${collectionKey}', ${idx}, true)"
              class="flex-1 py-1.5 px-2 rounded-lg ${isPowers ? 'bg-eldritch-600/40 hover:bg-eldritch-500 text-eldritch-200 border-eldritch-400/40' : 'bg-astral-600/40 hover:bg-astral-500 text-astral-200 border-astral-400/40'} hover:text-white border text-xs font-bold flex items-center justify-center gap-1 transition-all">
              <i class="fa-solid ${isPowers ? 'fa-bolt' : 'fa-wand-sparkles'}"></i> ${isPowers ? 'Usar' : 'Conjurar'}
            </button>
            <button onclick="app.removeCollectionItem('${collectionKey}', ${idx})" class="p-1.5 rounded-lg bg-obsidian-900 hover:bg-crimson-950 text-slate-500 hover:text-crimson-400 border border-slate-800 text-xs">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <textarea rows="2" oninput="app.updateCollectionItem('${collectionKey}', ${idx}, 'description', this.value)"
          placeholder="Descrição detalhada, alcance e efeitos..."
          class="sheet-input w-full p-2.5 rounded text-xs text-slate-200 leading-relaxed">${escapeHtml(item.description || '')}</textarea>
      </div>
    `;
  }).join('');
}

export function renderMutationsList(char) {
  const container = document.getElementById('mutationsListContainer');
  const mutations = char.mutations || [];
  if (mutations.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-4">Nenhuma mutação física, mental ou espiritual registrada.</p>`;
    return;
  }

  container.innerHTML = mutations.map((m, idx) => `
    <div class="bg-obsidian-950/85 border border-crimson-500/35 rounded-xl p-4 space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <input type="text" value="${escapeHtml(m.name || '')}" oninput="app.updateCollectionItem('mutations', ${idx}, 'name', this.value)"
          placeholder="Nome da Mutação / Sintoma" class="sheet-input flex-1 min-w-[180px] px-2.5 py-1.5 rounded text-xs font-bold text-crimson-300" />

        <select onchange="app.updateCollectionItem('mutations', ${idx}, 'type', this.value)" class="sheet-input px-2.5 py-1.5 rounded text-xs text-eldritch-300">
          ${MUTATION_TYPES.map(t => `<option value="${t}" ${m.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>

        <select onchange="app.updateCollectionItem('mutations', ${idx}, 'severity', this.value)" class="sheet-input px-2.5 py-1.5 rounded text-xs text-amber-300">
          ${MUTATION_SEVERITIES.map(s => `<option value="${s}" ${m.severity === s ? 'selected' : ''}>Severidade: ${s}</option>`).join('')}
        </select>

        <button onclick="app.removeCollectionItem('mutations', ${idx})" class="p-1.5 rounded bg-obsidian-900 hover:bg-crimson-950 text-slate-500 hover:text-crimson-400 border border-slate-800 text-xs">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>

      <textarea rows="2" oninput="app.updateCollectionItem('mutations', ${idx}, 'description', this.value)"
        placeholder="Sintomas visuais, gatilhos de perda de controle e efeitos mecânicos..."
        class="sheet-input w-full p-2.5 rounded text-xs text-slate-200 leading-relaxed">${escapeHtml(m.description || '')}</textarea>
    </div>
  `).join('');
}

export function renderDiceLogs(diceLogs, campaignState = null, activeCharacterId = null, viewMode = 'sheet', currentUser = null) {
  renderSharedDiceTicker(diceLogs, campaignState, activeCharacterId, viewMode, currentUser);

  const feed = document.getElementById('diceLogFeed');
  if (!feed) return;

  const canSeeRolls = isCharAllowedInActiveCampaign(activeCharacterId, campaignState, viewMode, currentUser);
  const activeCamp = (campaignState?.campaigns || []).find(c => c.id === campaignState?.activeCampaignId) || (campaignState?.campaigns || [])[0];

  if (!canSeeRolls) {
    feed.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-6 text-amber-300/80">
        <i class="fa-solid fa-lock text-3xl mb-2 text-amber-400"></i>
        <p class="text-xs font-bold">Rolagens Restritas à Campanha</p>
        <p class="text-[11px] text-slate-400 mt-1">
          Apenas as fichas incluídas pelo Mestre em <strong>${escapeHtml(activeCamp?.name || 'Campanha')}</strong> visualizam os rolamentos de dados da sessão.
        </p>
      </div>
    `;
    return;
  }

  let visibleLogs = diceLogs || [];
  if (activeCamp && activeCamp.restrictCombatAndDice !== false && !(viewMode === 'gm' && currentUser?.role === 'gm')) {
    const allowedIds = new Set(activeCamp.characterIds || []);
    visibleLogs = visibleLogs.filter(l => !l.characterId || allowedIds.has(l.characterId) || l.campaignId === activeCamp.id);
  }

  if (visibleLogs.length === 0) {
    feed.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
        <i class="fa-solid fa-dice-d20 text-3xl mb-2 text-slate-600"></i>
        <p class="text-xs">Clique em qualquer perícia, atributo, ataque ou dado para rolar.</p>
      </div>
    `;
    return;
  }

  feed.innerHTML = visibleLogs.map((log, idx) => {
    const critClass = log.isCrit ? 'crit-success' : (log.isFail ? 'crit-fail' : 'bg-obsidian-950/90 border-slate-800/90');
    const badgeHtml = log.isCrit
      ? `<span class="px-1.5 py-0.5 rounded bg-amber-400 text-obsidian-950 font-extrabold text-[10px] uppercase">Crítico 20!</span>`
      : log.isFail
      ? `<span class="px-1.5 py-0.5 rounded bg-crimson-500 text-white font-extrabold text-[10px] uppercase">Falha Crítica 1!</span>`
      : '';

    const timeStr = new Date(log.timestamp || Date.now()).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    return `
      <div class="rounded-xl p-3 border ${critClass} ${idx === 0 ? 'animate-dice' : ''}">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[11px] font-display font-bold text-brass-300 truncate">${escapeHtml(log.characterName || 'Beyonder')}</span>
              <span class="text-[10px] text-slate-500">• ${timeStr}</span>
              ${badgeHtml}
            </div>
            <h4 class="font-display font-bold text-xs text-slate-100 mt-0.5">${escapeHtml(log.title || 'Rolagem')}</h4>
            <p class="text-[10px] text-slate-400">${escapeHtml(log.subtitle || '')}</p>
          </div>

          <div class="text-right shrink-0">
            <div class="px-3 py-1 rounded-lg bg-obsidian-900 border border-brass-400/40 font-display font-extrabold text-xl ${log.isCrit ? 'text-amber-300' : (log.isFail ? 'text-crimson-400' : 'text-brass-200')}">
              ${escapeHtml(String(log.total))}
            </div>
          </div>
        </div>

        <div class="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span class="truncate">${escapeHtml(log.details || '')}</span>
          <span class="text-slate-500 shrink-0 ml-2">${escapeHtml(log.formula || '')}</span>
        </div>
      </div>
    `;
  }).join('');
}

export function renderAccountManagerModalContent(allUsers, currentUser) {
  if (!currentUser) return;
  const isGM = currentUser.role === 'gm';

  setInputValueIfNotFocused('myAccNameInput', currentUser.name || '');
  setInputValueIfNotFocused('myAccEmailInput', currentUser.email || '');

  const gmSection = document.getElementById('gmAccountsAdminSection');
  const gmListContainer = document.getElementById('gmAllAccountsListContainer');
  if (!gmSection || !gmListContainer) return;

  if (!isGM) {
    gmSection.classList.add('hidden');
    return;
  }

  gmSection.classList.remove('hidden');

  gmListContainer.innerHTML = (allUsers || []).map(u => {
    const isSelf = u.uid === currentUser.uid;
    const roleBadge = u.role === 'gm'
      ? '<span class="px-2 py-0.5 rounded bg-amber-400 text-obsidian-950 font-display font-extrabold text-[10px] uppercase"><i class="fa-solid fa-crown mr-1"></i>Mestre</span>'
      : '<span class="px-2 py-0.5 rounded bg-astral-950 text-astral-300 border border-astral-500/40 font-display font-bold text-[10px] uppercase"><i class="fa-solid fa-user mr-1"></i>Jogador</span>';

    return `
      <div class="bg-obsidian-950/90 border ${isSelf ? 'border-brass-400/60' : 'border-slate-800'} rounded-xl p-3 space-y-2.5">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div class="flex items-center gap-2">
            ${roleBadge}
            <span class="text-xs font-bold text-slate-200">${escapeHtml(u.name || 'Sem Nome')}</span>
            ${isSelf ? '<span class="text-[10px] text-brass-300 font-semibold">(Sua Conta Atual)</span>' : ''}
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-mono text-slate-500">ID: ${escapeHtml(u.uid)}</span>
            ${!isSelf ? `
              <button onclick="app.adminDeleteAccount('${u.uid}')" title="Excluir esta conta" class="px-2 py-0.5 rounded bg-crimson-950/70 hover:bg-crimson-600 text-crimson-300 hover:text-white border border-crimson-500/40 text-[10px] font-bold transition-all">
                <i class="fa-solid fa-trash-can mr-1"></i> Excluir
              </button>
            ` : ''}
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
          <div>
            <label class="block text-[10px] uppercase text-slate-400 mb-0.5">Nome na Mesa</label>
            <input id="admName_${u.uid}" type="text" value="${escapeHtml(u.name || '')}" class="sheet-input w-full px-2.5 py-1.5 rounded text-xs" />
          </div>
          <div>
            <label class="block text-[10px] uppercase text-brass-300 mb-0.5">Login (E-mail / Usuário)</label>
            <input id="admEmail_${u.uid}" type="text" value="${escapeHtml(u.email || '')}" class="sheet-input w-full px-2.5 py-1.5 rounded text-xs font-mono text-brass-200" />
          </div>
          <div>
            <label class="block text-[10px] uppercase text-amber-300 mb-0.5">Nova Senha (Opcional)</label>
            <input id="admPass_${u.uid}" type="password" placeholder="Deixe vazio p/ manter" class="sheet-input w-full px-2.5 py-1.5 rounded text-xs" />
          </div>
          <div class="flex items-center gap-1.5">
            <select id="admRole_${u.uid}" class="sheet-input px-2 py-1.5 rounded text-xs font-bold text-slate-200 flex-1">
              <option value="player" ${u.role !== 'gm' ? 'selected' : ''}>Jogador</option>
              <option value="gm" ${u.role === 'gm' ? 'selected' : ''}>Mestre</option>
            </select>
            <button onclick="app.adminSaveAccountChanges('${u.uid}')" class="px-3 py-1.5 rounded-lg bg-brass-400 hover:bg-brass-300 text-obsidian-950 font-display font-bold text-xs shrink-0 transition-all">
              <i class="fa-solid fa-floppy-disk mr-1"></i> Salvar
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}


export function renderResistancesAndWeaknesses(char) {
  if (!char) return;
  const resContainer = document.getElementById('resistancesListContainer');
  const wkContainer = document.getElementById('weaknessesListContainer');

  if (resContainer) {
    const resList = char.resistances || [];
    if (resList.length === 0) {
      resContainer.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-4">Nenhuma resistência ou imunidade registrada na ficha.</p>`;
    } else {
      resContainer.innerHTML = resList.map((r, idx) => `
        <div class="bg-obsidian-950/85 border border-emerald-500/35 rounded-xl p-3.5 space-y-2.5">
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            <div class="sm:col-span-4">
              <label class="block text-[10px] uppercase text-emerald-300">Elemento / Fonte Protegida</label>
              <input type="text" value="${escapeHtml(r.name || '')}" oninput="app.updateCollectionItem('resistances', ${idx}, 'name', this.value)"
                placeholder="Ex: Dano Mental, Fogo, Corrupção..."
                class="sheet-input w-full px-2.5 py-1.5 rounded text-xs font-bold text-emerald-200" />
            </div>
            <div class="sm:col-span-4">
              <label class="block text-[10px] uppercase text-slate-400">Grau de Proteção</label>
              <select onchange="app.updateCollectionItem('resistances', ${idx}, 'degree', this.value)"
                class="sheet-input w-full px-2 py-1.5 rounded text-xs font-semibold text-brass-200">
                ${RESISTANCE_DEGREES.map(deg => `<option value="${deg}" ${r.degree === deg ? 'selected' : ''}>${deg}</option>`).join('')}
              </select>
            </div>
            <div class="sm:col-span-3">
              <label class="block text-[10px] uppercase text-slate-400">Redução / Bônus</label>
              <input type="text" value="${escapeHtml(r.value || '')}" oninput="app.updateCollectionItem('resistances', ${idx}, 'value', this.value)"
                placeholder="Ex: RD 5 / +2 Vontade"
                class="sheet-input w-full px-2.5 py-1.5 rounded text-xs font-bold text-cyan-300" />
            </div>
            <div class="sm:col-span-1 flex justify-end pt-4">
              <button onclick="app.removeCollectionItem('resistances', ${idx})" class="p-1.5 rounded bg-obsidian-900 hover:bg-crimson-950 text-slate-500 hover:text-crimson-400 border border-slate-800 text-xs">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <input type="text" value="${escapeHtml(r.source || '')}" oninput="app.updateCollectionItem('resistances', ${idx}, 'source', this.value)"
                placeholder="Origem (Ex: Poção Seq. 8, Artefato...)"
                class="sheet-input w-full px-2.5 py-1 rounded text-[11px] text-amber-200" />
            </div>
            <div class="sm:col-span-2">
              <input type="text" value="${escapeHtml(r.description || '')}" oninput="app.updateCollectionItem('resistances', ${idx}, 'description', this.value)"
                placeholder="Detalhes e condições da resistência..."
                class="sheet-input w-full px-2.5 py-1 rounded text-xs text-slate-300" />
            </div>
          </div>
        </div>
      `).join('');
    }
  }

  if (wkContainer) {
    const wkList = char.weaknesses || [];
    if (wkList.length === 0) {
      wkContainer.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-4">Nenhuma fraqueza ou vulnerabilidade registrada na ficha.</p>`;
    } else {
      wkContainer.innerHTML = wkList.map((w, idx) => `
        <div class="bg-obsidian-950/85 border border-crimson-500/35 rounded-xl p-3.5 space-y-2.5">
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            <div class="sm:col-span-4">
              <label class="block text-[10px] uppercase text-crimson-300">Fraqueza / Vulnerabilidade</label>
              <input type="text" value="${escapeHtml(w.name || '')}" oninput="app.updateCollectionItem('weaknesses', ${idx}, 'name', this.value)"
                placeholder="Ex: Luz Solar, Raios, Artefato 3-0782..."
                class="sheet-input w-full px-2.5 py-1.5 rounded text-xs font-bold text-crimson-200" />
            </div>
            <div class="sm:col-span-4">
              <label class="block text-[10px] uppercase text-slate-400">Severidade / Tipo</label>
              <select onchange="app.updateCollectionItem('weaknesses', ${idx}, 'severity', this.value)"
                class="sheet-input w-full px-2 py-1.5 rounded text-xs font-semibold text-amber-200">
                ${WEAKNESS_SEVERITIES.map(sev => `<option value="${sev}" ${w.severity === sev ? 'selected' : ''}>${sev}</option>`).join('')}
              </select>
            </div>
            <div class="sm:col-span-3">
              <label class="block text-[10px] uppercase text-slate-400">Penalidade / Efeito</label>
              <input type="text" value="${escapeHtml(w.penalty || '')}" oninput="app.updateCollectionItem('weaknesses', ${idx}, 'penalty', this.value)"
                placeholder="Ex: -2 Testes / +50% Dano"
                class="sheet-input w-full px-2.5 py-1.5 rounded text-xs font-bold text-rose-300" />
            </div>
            <div class="sm:col-span-1 flex justify-end pt-4">
              <button onclick="app.removeCollectionItem('weaknesses', ${idx})" class="p-1.5 rounded bg-obsidian-900 hover:bg-crimson-950 text-slate-500 hover:text-crimson-400 border border-slate-800 text-xs">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <input type="text" value="${escapeHtml(w.source || '')}" oninput="app.updateCollectionItem('weaknesses', ${idx}, 'source', this.value)"
                placeholder="Origem (Ex: Maldição, Efeito Negativo...)"
                class="sheet-input w-full px-2.5 py-1 rounded text-[11px] text-eldritch-300" />
            </div>
            <div class="sm:col-span-2">
              <input type="text" value="${escapeHtml(w.description || '')}" oninput="app.updateCollectionItem('weaknesses', ${idx}, 'description', this.value)"
                placeholder="Como a fraqueza se manifesta ou como contê-la..."
                class="sheet-input w-full px-2.5 py-1 rounded text-xs text-slate-300" />
            </div>
          </div>
        </div>
      `).join('');
    }
  }
}

export function renderGMStoreManager(charactersMap, campaignState) {
  const container = document.getElementById('gmStoreManagerContent');
  if (!container) return;

  const campaigns = campaignState?.campaigns || [];
  const activeCamp = campaigns.find(c => c.id === campaignState?.activeCampaignId) || campaigns[0];
  if (!activeCamp) {
    container.innerHTML = `<div class="victorian-card rounded-xl p-6 text-center text-xs text-slate-400">Crie uma campanha para personalizar a loja.</div>`;
    return;
  }

  if (!Array.isArray(activeCamp.storeItems)) {
    activeCamp.storeItems = JSON.parse(JSON.stringify(DEFAULT_STORE_ITEMS));
  }
  if (!Array.isArray(activeCamp.contributionTasks)) {
    activeCamp.contributionTasks = JSON.parse(JSON.stringify(DEFAULT_CONTRIBUTION_TASKS));
  }
  if (!Array.isArray(activeCamp.contributionLogs)) {
    activeCamp.contributionLogs = [];
  }

  const campChars = (activeCamp.characterIds || []).map(id => charactersMap[id]).filter(Boolean);

  container.innerHTML = `
    <div class="space-y-6">
      <!-- CABEÇALHO DO EDITOR DE LOJA DO MESTRE -->
      <div class="victorian-card-gold rounded-xl p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span class="text-[10px] font-display uppercase tracking-widest text-brass-400 block">
              Edição Exclusiva do Mestre • Sincronizado com Todas as Fichas da Campanha
            </span>
            <h3 class="font-display font-bold text-lg text-brass-200 flex items-center gap-2">
              <i class="fa-solid fa-store text-brass-400"></i> Personalizar Loja & Contribuições — ${escapeHtml(activeCamp.name)}
            </h3>
            <p class="text-xs text-slate-400 mt-0.5">
              Adicione, edite ou retire itens, escolha se cada item pode ser adquirido <strong>apenas com dinheiro (£)</strong>, <strong>apenas com pontos de contribuição</strong> ou <strong>ambos</strong>. Todas as alterações aparecem imediatamente na aba Loja das fichas dos jogadores desta campanha.
            </p>
          </div>
          ${campaigns.length > 1 ? `
            <div class="flex items-center gap-2">
              <span class="text-xs text-slate-400">Campanha:</span>
              <select onchange="app.selectActiveCampaign(this.value)" class="sheet-input px-3 py-1.5 rounded-lg text-xs font-bold text-brass-200">
                ${campaigns.map(c => `<option value="${c.id}" ${c.id === activeCamp.id ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
              </select>
            </div>
          ` : ''}
        </div>
      </div>

      <!-- 1. ADICIONAR NOVO ITEM NA LOJA DA CAMPANHA -->
      <div class="victorian-card rounded-xl p-5 border border-brass-400/40 space-y-3.5">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
          <h4 class="font-display font-bold text-sm uppercase tracking-wider text-brass-200 flex items-center gap-2">
            <i class="fa-solid fa-plus-circle text-brass-400"></i> Adicionar Novo Item à Loja da Campanha
          </h4>
          <span class="text-[11px] text-slate-400">Estoque <code>-1</code> = Ilimitado</span>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div class="sm:col-span-4">
            <label class="block text-[10px] uppercase text-slate-300 mb-1">Nome do Item *</label>
            <input id="newStoreItemName" type="text" placeholder="Ex: Fórmula de Sem Rosto / Bala Exorcista"
              class="sheet-input w-full px-3 py-1.5 rounded-lg text-xs font-bold text-brass-200" />
          </div>
          <div class="sm:col-span-3">
            <label class="block text-[10px] uppercase text-slate-300 mb-1">Tipo / Categoria</label>
            <select id="newStoreItemCategory" class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs text-amber-200">
              ${STORE_ITEM_CATEGORIES.filter(c => c.key !== 'all').map(c => `<option value="${c.key}">${c.label}</option>`).join('')}
            </select>
          </div>
          <div class="sm:col-span-5">
            <label class="block text-[10px] uppercase text-brass-300 font-bold mb-1">Forma de Resgate Permitida *</label>
            <select id="newStoreItemPaymentMode" class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-300">
              ${STORE_PAYMENT_MODES.map(pm => `<option value="${pm.key}">${pm.label}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-12 gap-3 items-end">
          <div class="sm:col-span-2">
            <label class="block text-[10px] uppercase text-amber-300 mb-1">Preço em Libras (£)</label>
            <input id="newStoreItemGold" type="number" min="0" value="15"
              class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs text-center font-bold text-amber-200" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-[10px] uppercase text-emerald-300 mb-1">Preço Contrib. (Pts)</label>
            <input id="newStoreItemContrib" type="number" min="0" value="40"
              class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs text-center font-bold text-emerald-200" />
          </div>
          <div class="sm:col-span-2">
            <label class="block text-[10px] uppercase text-slate-400 mb-1">Estoque (-1=Ilim.)</label>
            <input id="newStoreItemStock" type="number" min="-1" value="-1"
              class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs text-center" />
          </div>
          <div class="col-span-2 sm:col-span-3">
            <label class="block text-[10px] uppercase text-eldritch-300 mb-1">Grau / Sequência</label>
            <input id="newStoreItemGrade" type="text" placeholder="Ex: Seq. 7 / Artefato Grau 3"
              class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs text-eldritch-200" />
          </div>
          <div class="col-span-2 sm:col-span-3">
            <button onclick="app.gmAddStoreItem()" class="w-full py-2 px-4 rounded-lg bg-brass-400 hover:bg-brass-300 text-obsidian-950 font-display font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all">
              <i class="fa-solid fa-plus"></i> Adicionar à Loja
            </button>
          </div>
        </div>

        <div>
          <label class="block text-[10px] uppercase text-slate-400 mb-1">Descrição dos Efeitos, Bônus ou Condições de Uso</label>
          <input id="newStoreItemDesc" type="text" placeholder="Descreva os efeitos do item que aparecerão na vitrine para os jogadores..."
            class="sheet-input w-full px-3 py-1.5 rounded-lg text-xs text-slate-200" />
        </div>
      </div>

      <!-- 2. ITENS ATUAIS DA LOJA (EDITAR OU RETIRAR) -->
      <div class="victorian-card rounded-xl p-5 space-y-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <h4 class="font-display font-bold text-sm uppercase tracking-wider text-brass-200 flex items-center gap-2">
            <i class="fa-solid fa-boxes-stacked text-brass-400"></i> Itens Cadastrados na Loja (${activeCamp.storeItems.length})
          </h4>
          <span class="text-xs text-slate-400">Edite qualquer campo para atualizar instantaneamente nas fichas dos jogadores</span>
        </div>

        ${activeCamp.storeItems.length === 0 ? `
          <p class="text-xs text-slate-500 italic text-center py-6">A loja desta campanha está vazia. Adicione itens acima.</p>
        ` : `
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            ${activeCamp.storeItems.map(item => {
              const pMode = item.paymentMode || 'both';
              return `
                <div class="bg-obsidian-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
                  <div class="flex items-center justify-between gap-2">
                    <input type="text" value="${escapeHtml(item.name || '')}"
                      onchange="app.gmUpdateStoreItem('${item.id}', 'name', this.value)"
                      class="sheet-input flex-1 px-2.5 py-1 rounded font-display font-bold text-sm text-brass-200" />
                    <button onclick="app.gmRemoveStoreItem('${item.id}')" title="Retirar este item da loja"
                      class="px-2.5 py-1 rounded-lg bg-crimson-950/80 hover:bg-crimson-600 text-crimson-200 hover:text-white border border-crimson-500/40 text-xs font-bold flex items-center gap-1 shrink-0 transition-all">
                      <i class="fa-solid fa-trash-can"></i> Retirar
                    </button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label class="block text-[9px] uppercase text-slate-400">Tipo de Item</label>
                      <select onchange="app.gmUpdateStoreItem('${item.id}', 'category', this.value)"
                        class="sheet-input w-full px-2 py-1 rounded text-xs text-amber-200">
                        ${STORE_ITEM_CATEGORIES.filter(c => c.key !== 'all').map(c => `<option value="${c.key}" ${item.category === c.key ? 'selected' : ''}>${c.label}</option>`).join('')}
                      </select>
                    </div>
                    <div>
                      <label class="block text-[9px] uppercase text-brass-300 font-bold">Modo de Resgate</label>
                      <select onchange="app.gmUpdateStoreItem('${item.id}', 'paymentMode', this.value)"
                        class="sheet-input w-full px-2 py-1 rounded text-xs font-bold ${pMode === 'contrib_only' ? 'text-emerald-300' : (pMode === 'gold_only' ? 'text-amber-300' : 'text-slate-200')}">
                        ${STORE_PAYMENT_MODES.map(pm => `<option value="${pm.key}" ${pMode === pm.key ? 'selected' : ''}>${pm.label}</option>`).join('')}
                      </select>
                    </div>
                    <div>
                      <label class="block text-[9px] uppercase text-eldritch-300">Grau / Sequência</label>
                      <input type="text" value="${escapeHtml(item.grade || '')}"
                        onchange="app.gmUpdateStoreItem('${item.id}', 'grade', this.value)"
                        class="sheet-input w-full px-2 py-1 rounded text-xs text-eldritch-200" />
                    </div>
                  </div>

                  <div class="grid grid-cols-3 gap-2">
                    <div class="${pMode === 'contrib_only' ? 'opacity-40' : ''}">
                      <label class="block text-[9px] uppercase text-amber-300">Preço Libras (£)</label>
                      <input type="number" min="0" value="${item.priceGold ?? 0}"
                        onchange="app.gmUpdateStoreItem('${item.id}', 'priceGold', Number(this.value))"
                        class="sheet-input w-full px-2 py-1 rounded text-xs font-bold text-amber-200 text-center" />
                    </div>
                    <div class="${pMode === 'gold_only' ? 'opacity-40' : ''}">
                      <label class="block text-[9px] uppercase text-emerald-300">Preço Contrib. (Pts)</label>
                      <input type="number" min="0" value="${item.priceContrib ?? 0}"
                        onchange="app.gmUpdateStoreItem('${item.id}', 'priceContrib', Number(this.value))"
                        class="sheet-input w-full px-2 py-1 rounded text-xs font-bold text-emerald-200 text-center" />
                    </div>
                    <div>
                      <label class="block text-[9px] uppercase text-slate-400">Estoque (-1=Ilim.)</label>
                      <input type="number" min="-1" value="${item.stock ?? -1}"
                        onchange="app.gmUpdateStoreItem('${item.id}', 'stock', Number(this.value))"
                        class="sheet-input w-full px-2 py-1 rounded text-xs text-center font-bold" />
                    </div>
                  </div>

                  <textarea rows="2" onchange="app.gmUpdateStoreItem('${item.id}', 'description', this.value)"
                    placeholder="Descrição do item..."
                    class="sheet-input w-full p-2 rounded text-xs text-slate-300">${escapeHtml(item.description || '')}</textarea>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>

      <!-- 3. QUADRO DE CONTRIBUIÇÕES DA CAMPANHA & SALDO DOS JOGADORES -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div class="lg:col-span-7 victorian-card rounded-xl p-5 space-y-3.5">
          <h4 class="font-display font-bold text-sm uppercase tracking-wider text-emerald-300 flex items-center gap-2">
            <i class="fa-solid fa-hand-holding-heart text-emerald-400"></i> Tarefas & Recompensas da Aba de Contribuições
          </h4>
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-obsidian-950/80 p-3 rounded-xl border border-slate-800">
            <div class="sm:col-span-4">
              <label class="block text-[10px] uppercase text-slate-400 mb-0.5">Título da Tarefa *</label>
              <input id="newContribTaskTitle" type="text" placeholder="Ex: Entregar Artefato" class="sheet-input w-full px-2.5 py-1.5 rounded text-xs font-bold" />
            </div>
            <div class="sm:col-span-4">
              <label class="block text-[10px] uppercase text-slate-400 mb-0.5">Descrição</label>
              <input id="newContribTaskDesc" type="text" placeholder="Detalhes da entrega..." class="sheet-input w-full px-2.5 py-1.5 rounded text-xs" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-[10px] uppercase text-emerald-300 mb-0.5">+Pts Contrib.</label>
              <input id="newContribTaskPts" type="number" value="50" class="sheet-input w-full px-2 py-1.5 rounded text-xs text-center font-bold text-emerald-300" />
            </div>
            <div class="sm:col-span-2">
              <button onclick="app.gmAddContributionTask()" class="w-full py-1.5 px-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-display font-bold text-xs">
                + Criar
              </button>
            </div>
          </div>

          <div class="space-y-2">
            ${activeCamp.contributionTasks.map(task => `
              <div class="flex items-center justify-between gap-2 bg-obsidian-950/85 border border-slate-800 rounded-lg p-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">+${task.rewardPoints ?? 0} pts</span>
                    <strong class="text-xs text-brass-200 truncate">${escapeHtml(task.title)}</strong>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">${escapeHtml(task.description || '')}</p>
                </div>
                <button onclick="app.gmRemoveContributionTask('${task.id}')" class="p-1.5 rounded bg-obsidian-900 hover:bg-crimson-950 text-slate-400 hover:text-crimson-300 border border-slate-800 text-xs shrink-0">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="lg:col-span-5 victorian-card rounded-xl p-5 space-y-3.5">
          <h4 class="font-display font-bold text-sm uppercase tracking-wider text-amber-300 flex items-center gap-2">
            <i class="fa-solid fa-coins text-amber-400"></i> Saldos dos Jogadores na Campanha
          </h4>
          <p class="text-xs text-slate-400">Ajuste rapidamente as Libras (£) e os Pontos de Contribuição das fichas escaladas:</p>
          <div class="space-y-2">
            ${campChars.map(ch => `
              <div class="bg-obsidian-950/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
                <div class="min-w-0">
                  <div class="font-display font-bold text-xs text-brass-200 truncate">${escapeHtml(ch.name)}</div>
                  <div class="text-[10px] text-slate-400">${escapeHtml(ch.player || 'Jogador')}</div>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-amber-300 font-bold">£:</span>
                    <input type="number" value="${ch.currencyGold ?? 0}"
                      onchange="app.gmSetPlayerStoreBalance('${ch.id}', 'currencyGold', Number(this.value))"
                      class="sheet-input w-16 text-center py-0.5 rounded text-xs font-bold text-amber-200" />
                  </div>
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-emerald-300 font-bold">Pts:</span>
                    <input type="number" value="${ch.contributionPoints ?? 0}"
                      onchange="app.gmSetPlayerStoreBalance('${ch.id}', 'contributionPoints', Number(this.value))"
                      class="sheet-input w-16 text-center py-0.5 rounded text-xs font-bold text-emerald-300" />
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderCampaignStoreTab(char, campaignState, currentUser, storeUIState = null) {
  const container = document.getElementById('campaignStoreTabContainer');
  if (!container || !char) return;

  const isGMUser = currentUser?.role === 'gm';
  const ui = storeUIState || { subTab: 'items', categoryFilter: 'all', searchText: '' };
  const campaigns = campaignState?.campaigns || [];
  // Encontra a campanha à qual esta ficha pertence (ou a campanha ativa da mesa)
  const charCamp = campaigns.find(c => Array.isArray(c.characterIds) && c.characterIds.includes(char.id))
    || campaigns.find(c => c.id === campaignState?.activeCampaignId)
    || campaigns[0];

  if (!charCamp) return;

  if (!Array.isArray(charCamp.storeItems)) {
    charCamp.storeItems = JSON.parse(JSON.stringify(DEFAULT_STORE_ITEMS));
  }
  if (!Array.isArray(charCamp.contributionTasks)) {
    charCamp.contributionTasks = JSON.parse(JSON.stringify(DEFAULT_CONTRIBUTION_TASKS));
  }
  if (!Array.isArray(charCamp.contributionLogs)) {
    charCamp.contributionLogs = [];
  }

  const filterCat = ui.categoryFilter || 'all';
  const searchTxt = (ui.searchText || '').toLowerCase().trim();
  const filteredItems = charCamp.storeItems.filter(it => {
    const matchesCat = filterCat === 'all' || it.category === filterCat;
    const matchesSearch = !searchTxt ||
      (it.name || '').toLowerCase().includes(searchTxt) ||
      (it.description || '').toLowerCase().includes(searchTxt) ||
      (it.grade || '').toLowerCase().includes(searchTxt);
    return matchesCat && matchesSearch;
  });

  const catMetaMap = {};
  STORE_ITEM_CATEGORIES.forEach(c => { catMetaMap[c.key] = c; });

  container.innerHTML = `
    <div class="space-y-4">
      <!-- CABEÇALHO DA LOJA DA CAMPANHA NAS FICHAS -->
      <div class="victorian-card-gold rounded-xl p-4 sm:p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-brass-400/25 pb-3">
          <div>
            <span class="text-[10px] font-display uppercase tracking-widest text-brass-400 block">
              Loja Oficial Sincronizada — ${escapeHtml(charCamp.name)}
            </span>
            <h3 class="font-display font-bold text-lg text-brass-200 flex items-center gap-2">
              <i class="fa-solid fa-store text-brass-400"></i> Loja da Campanha & Contribuições
            </h3>
          </div>

          <!-- Saldos Atuais da Ficha Selecionada + Atalho para o Mestre Editar no Painel do Mestre -->
          <div class="flex flex-wrap items-center gap-2.5">
            ${isGMUser ? `
              <button onclick="app.openGMStoreManager()" class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-400 text-amber-200 hover:text-obsidian-950 border border-amber-400/40 font-display font-bold text-xs flex items-center gap-1.5 transition-all">
                <i class="fa-solid fa-crown"></i> Editar Loja no Painel do Mestre
              </button>
            ` : ''}
            <div class="bg-obsidian-950/90 border border-amber-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <i class="fa-solid fa-coins text-amber-400 text-sm"></i>
              <div>
                <div class="text-[9px] uppercase text-slate-400 font-display">Libras de Ouro</div>
                <div class="text-sm font-display font-extrabold text-amber-300">${char.currencyGold ?? 0} £</div>
              </div>
            </div>
            <div class="bg-obsidian-950/90 border border-emerald-500/40 rounded-xl px-3 py-1.5 flex items-center gap-2">
              <i class="fa-solid fa-medal text-emerald-400 text-sm"></i>
              <div>
                <div class="text-[9px] uppercase text-slate-400 font-display">Pontos de Contribuição</div>
                <div class="text-sm font-display font-extrabold text-emerald-300">${char.contributionPoints ?? 0} pts</div>
              </div>
            </div>
          </div>
        </div>

        <!-- SUB-ABAS DA LOJA: CATÁLOGO DE ITENS vs ABA DE CONTRIBUIÇÕES -->
        <div class="flex flex-wrap items-center gap-2">
          <button onclick="app.setStoreSubTab('items')"
            class="px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${ui.subTab !== 'contributions' ? 'bg-brass-400 text-obsidian-950 shadow-md' : 'bg-obsidian-900 text-slate-300 hover:text-brass-200 border border-slate-800'}">
            <i class="fa-solid fa-cart-shopping"></i> Catálogo de Itens (${charCamp.storeItems.length})
          </button>
          <button onclick="app.setStoreSubTab('contributions')"
            class="px-4 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 ${ui.subTab === 'contributions' ? 'bg-emerald-500 text-obsidian-950 shadow-md' : 'bg-obsidian-900 text-slate-300 hover:text-emerald-300 border border-slate-800'}">
            <i class="fa-solid fa-hand-holding-heart"></i> Aba de Contribuições (${charCamp.contributionTasks.length})
          </button>
        </div>
      </div>

      ${ui.subTab !== 'contributions' ? `
        <!-- =================================================================
             SUB-ABA 1: VITRINE DE ITENS DA LOJA (SOMENTE COMPRA/RESGATE NAS FICHAS)
             ================================================================= -->
        <div class="space-y-4">
          <div class="victorian-card rounded-xl p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-display font-bold uppercase tracking-wider text-brass-300">
                <i class="fa-solid fa-filter mr-1"></i> Filtrar por Tipo de Item:
              </span>
              <div class="relative w-full sm:w-64">
                <i class="fa-solid fa-magnifying-glass text-slate-500 absolute left-2.5 top-2 text-xs"></i>
                <input type="text" value="${escapeHtml(ui.searchText || '')}"
                  oninput="app.setStoreSearchText(this.value)"
                  placeholder="Buscar item, fórmula ou artefato..."
                  class="sheet-input pl-7 pr-2.5 py-1 rounded-lg text-xs w-full" />
              </div>
            </div>

            <div class="flex flex-wrap gap-1.5">
              ${STORE_ITEM_CATEGORIES.map(cat => `
                <button onclick="app.setStoreCategoryFilter('${cat.key}')"
                  class="px-3 py-1.5 rounded-lg text-xs font-display font-bold transition-all flex items-center gap-1.5 border ${filterCat === cat.key ? 'bg-brass-400 text-obsidian-950 border-brass-300 shadow' : 'bg-obsidian-950 text-slate-300 border-slate-800 hover:border-brass-400/40'}">
                  <i class="fa-solid ${cat.icon}"></i>
                  <span>${cat.label}</span>
                </button>
              `).join('')}
            </div>
          </div>

          ${filteredItems.length === 0 ? `
            <div class="victorian-card rounded-xl p-8 text-center text-xs text-slate-400">
              Nenhum item encontrado para este filtro na Loja da Campanha.
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              ${filteredItems.map(item => {
                const catMeta = catMetaMap[item.category] || { label: 'Item', icon: 'fa-box' };
                const outOfStock = item.stock === 0;
                const stockLabel = item.stock < 0 ? 'Estoque Ilimitado' : `Disponível: ${item.stock}`;
                const pMode = item.paymentMode || 'both';
                const allowGold = (pMode === 'both' || pMode === 'gold_only') && (item.priceGold ?? 0) > 0;
                const allowContrib = (pMode === 'both' || pMode === 'contrib_only') && (item.priceContrib ?? 0) > 0;

                const modeBadge = pMode === 'contrib_only'
                  ? `<span class="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-display font-bold uppercase"><i class="fa-solid fa-medal mr-1"></i>Apenas Contribuição</span>`
                  : pMode === 'gold_only'
                  ? `<span class="px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 text-[10px] font-display font-bold uppercase"><i class="fa-solid fa-coins mr-1"></i>Apenas Dinheiro (£)</span>`
                  : '';

                return `
                  <div class="victorian-card rounded-xl p-4 flex flex-col justify-between border ${outOfStock ? 'border-slate-800 opacity-60' : 'border-brass-400/30 hover:border-brass-400'} transition-all space-y-3">
                    <div class="space-y-2">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="px-2 py-0.5 rounded bg-obsidian-950 border border-brass-400/35 text-brass-300 text-[10px] font-display font-bold uppercase">
                          <i class="fa-solid ${catMeta.icon} mr-1"></i>${escapeHtml(catMeta.label)}
                        </span>
                        ${item.grade ? `<span class="px-2 py-0.5 rounded bg-eldritch-950 border border-eldritch-500/35 text-eldritch-300 text-[10px] font-semibold">${escapeHtml(item.grade)}</span>` : ''}
                        ${modeBadge}
                        <span class="text-[10px] font-semibold ${outOfStock ? 'text-crimson-400' : 'text-slate-400'}">• ${stockLabel}</span>
                      </div>
                      <h4 class="font-display font-bold text-sm sm:text-base text-brass-200">${escapeHtml(item.name)}</h4>
                      <p class="text-xs text-slate-300 leading-relaxed">${escapeHtml(item.description || '')}</p>
                    </div>

                    <div class="pt-2.5 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2">
                      <div class="flex items-center gap-3 text-xs">
                        ${allowGold ? `
                          <span class="font-display font-bold text-amber-300"><i class="fa-solid fa-coins mr-1"></i>${item.priceGold} £</span>
                        ` : ''}
                        ${allowContrib ? `
                          <span class="font-display font-bold text-emerald-300"><i class="fa-solid fa-medal mr-1"></i>${item.priceContrib} pts</span>
                        ` : ''}
                      </div>

                      <div class="flex items-center gap-1.5">
                        ${allowGold ? `
                          <button onclick="app.buyCampaignStoreItem('${item.id}', 'gold')" ${outOfStock ? 'disabled' : ''}
                            class="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-400 text-amber-200 hover:text-obsidian-950 border border-amber-400/40 font-display font-bold text-xs transition-all disabled:opacity-40">
                            <i class="fa-solid fa-coins mr-1"></i>Comprar (${item.priceGold}£)
                          </button>
                        ` : ''}
                        ${allowContrib ? `
                          <button onclick="app.buyCampaignStoreItem('${item.id}', 'contrib')" ${outOfStock ? 'disabled' : ''}
                            class="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-400 text-emerald-200 hover:text-obsidian-950 border border-emerald-400/40 font-display font-bold text-xs transition-all disabled:opacity-40">
                            <i class="fa-solid fa-medal mr-1"></i>Resgatar (${item.priceContrib} pts)
                          </button>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      ` : `
        <!-- =================================================================
             SUB-ABA 2: ABA DE CONTRIBUIÇÕES DA CAMPANHA / ORGANIZAÇÃO
             ================================================================= -->
        <div class="space-y-4">
          <div class="victorian-card rounded-xl p-4 space-y-3 border border-emerald-500/35">
            <h4 class="font-display font-bold text-xs sm:text-sm uppercase tracking-wider text-emerald-300 flex items-center gap-2">
              <i class="fa-solid fa-hand-holding-dollar text-emerald-400"></i> Registrar Entrega ou Contribuição de ${escapeHtml(char.name)}
            </h4>
            <p class="text-xs text-slate-400">
              Registre entregas de ingredientes, relatórios de investigação, doações em Libras ou serviços prestados para somar Pontos de Contribuição.
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
              <div class="sm:col-span-6">
                <label class="block text-[10px] uppercase text-slate-400 mb-0.5">Descrição da Contribuição / Entrega *</label>
                <input id="customContribDescInput" type="text" placeholder="Ex: Entreguei característica Beyonder / Relatório de missão..."
                  class="sheet-input w-full px-3 py-1.5 rounded text-xs text-slate-100" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[10px] uppercase text-amber-300 mb-0.5">Doar Libras (£)</label>
                <input id="customContribDonateGold" type="number" min="0" value="0"
                  class="sheet-input w-full px-2 py-1.5 rounded text-xs text-center font-bold text-amber-200" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-[10px] uppercase text-emerald-300 mb-0.5">Pontos Ganhos</label>
                <input id="customContribPointsGain" type="number" min="1" value="25"
                  class="sheet-input w-full px-2 py-1.5 rounded text-xs text-center font-bold text-emerald-300" />
              </div>
              <div class="sm:col-span-2">
                <button onclick="app.submitCustomContribution()" class="w-full py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-display font-extrabold text-xs flex items-center justify-center gap-1.5 shadow">
                  <i class="fa-solid fa-check"></i> Contribuir
                </button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${charCamp.contributionTasks.map(task => `
              <div class="victorian-card rounded-xl p-4 flex flex-col justify-between border border-slate-800 hover:border-emerald-500/40 space-y-3">
                <div>
                  <span class="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-display font-bold uppercase">
                    <i class="fa-solid fa-medal mr-1"></i>+${task.rewardPoints ?? 0} pts ${(task.rewardGold ?? 0) > 0 ? `• +${task.rewardGold}£` : ''}
                  </span>
                  <h5 class="font-display font-bold text-sm text-brass-200 mt-1.5">${escapeHtml(task.title)}</h5>
                  <p class="text-xs text-slate-400 mt-1">${escapeHtml(task.description || '')}</p>
                </div>
                <div class="pt-2 border-t border-slate-800/80 flex justify-end">
                  <button onclick="app.completeContributionTask('${task.id}')"
                    class="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-400 text-emerald-200 hover:text-obsidian-950 border border-emerald-400/40 font-display font-bold text-xs flex items-center gap-1.5 transition-all">
                    <i class="fa-solid fa-award"></i> Cumprir & Receber (+${task.rewardPoints ?? 0} pts)
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="victorian-card rounded-xl p-4 space-y-2.5">
            <h4 class="font-display font-bold text-xs uppercase tracking-wider text-brass-300 flex items-center gap-2">
              <i class="fa-solid fa-clock-rotate-left text-brass-400"></i> Histórico Recente de Contribuições & Aquisições da Campanha
            </h4>
            ${charCamp.contributionLogs.length === 0 ? `
              <p class="text-xs text-slate-500 italic">Nenhum registro de contribuição ou aquisição realizado ainda.</p>
            ` : `
              <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                ${charCamp.contributionLogs.slice(0, 20).map(log => `
                  <div class="flex flex-wrap items-center justify-between gap-2 bg-obsidian-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs">
                    <div>
                      <strong class="text-brass-200">${escapeHtml(log.charName || 'Beyonder')}</strong>
                      <span class="text-slate-300 ml-1">${escapeHtml(log.actionText || '')}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold ${log.deltaText?.startsWith('+') ? 'text-emerald-300' : 'text-amber-300'}">${escapeHtml(log.deltaText || '')}</span>
                      <span class="text-[10px] text-slate-500">${escapeHtml(log.dateStr || '')}</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `}
    </div>
  `;
}
