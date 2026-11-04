import {
  ATTRIBUTES_DEF,
  SAVING_THROWS_DEF,
  SKILLS_DEF,
  BEYONDER_PATHWAYS,
  COMBAT_STYLE_TYPES,
  PROFICIENCY_CATEGORIES,
  PROFICIENCY_LEVELS,
  STANDARD_PROFICIENCIES_DEF,
  EQUIPMENT_CATEGORIES,
  MUTATION_TYPES,
  MUTATION_SEVERITIES,
  EQUIP_SLOTS_DEF,
  ACTION_TYPES,
  PASSIVE_ABILITY_PRESETS,
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
  DOSSIER_CATEGORIES,
  SHARED_NOTE_CATEGORIES,
  DEFAULT_CAMPAIGN_DOSSIERS,
  DEFAULT_CAMPAIGN_UPDATES,
  DEFAULT_SHARED_NOTES,
  createDefaultWeeklyDowntime
} from '../config/constants.js';
import {
  clamp,
  calcAttrMod,
  formatSigned,
  calcPercentage,
  escapeHtml,
  setInputValueIfNotFocused,
  isUserTypingInContainer
} from '../utils/helpers.js';

let lastAnimatedLogKey = null;
let lastRenderedDiceFeedSignature = '';

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

  const canSeeRolls = true;
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
                ${ACTION_TYPES.filter(a => a.key !== 'livre' && a.key !== 'completa').map(a => {
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

  // Atualiza barra alternadora principal (Ficha do Personagem vs Aba de Campanha vs Painel do Mestre)
  const btnMainSheet = document.getElementById('btnMainView-sheet');
  const btnMainCamp = document.getElementById('btnMainView-campaign');
  const btnMainGM = document.getElementById('btnMainView-gm');
  const campBadge = document.getElementById('campaignHubBadge');

  if (campBadge && activeCamp) {
    const dossiersCount = (activeCamp.dossiers || DEFAULT_CAMPAIGN_DOSSIERS).filter(d => isGMUser || d.visibleToPlayers !== false).length;
    campBadge.textContent = `Sem. ${activeCamp.currentWeek || 1} • ${dossiersCount} Dossiês`;
  }

  const activeMainClass = 'flex-1 sm:flex-initial px-4 py-2.5 rounded-lg font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-brass-400 text-obsidian-950 shadow-lg border border-brass-300';
  const inactiveMainClass = 'flex-1 sm:flex-initial px-4 py-2.5 rounded-lg font-display font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-obsidian-900 hover:bg-brass-500/20 text-brass-200 border border-brass-400/35';

  if (btnMainSheet) {
    btnMainSheet.className = viewMode === 'sheet' ? activeMainClass : inactiveMainClass;
  }
  if (btnMainCamp) {
    btnMainCamp.className = viewMode === 'campaign' ? activeMainClass : inactiveMainClass;
  }
  if (btnMainGM) {
    if (!isGMUser) {
      btnMainGM.classList.add('hidden');
      btnMainGM.classList.remove('flex');
    } else {
      btnMainGM.classList.remove('hidden');
      btnMainGM.classList.add('flex');
      btnMainGM.className = viewMode === 'gm'
        ? 'flex-1 sm:flex-initial px-4 py-2.5 rounded-lg font-display font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-amber-400 text-obsidian-950 shadow-lg border border-amber-300'
        : 'flex-1 sm:flex-initial px-4 py-2.5 rounded-lg font-display font-bold text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 bg-obsidian-900 hover:bg-amber-500/20 text-amber-200 border border-amber-400/35';
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
                • <span class="text-cyan-300 font-semibold" title="Munição Total = Carregada nas Armas + Reserva"><i class="fa-solid fa-bullseye ml-1 mr-0.5"></i>Mun: ${((ch.weapons || []).filter(w => w.isFirearm !== false && (w.isFirearm || w.ammoMax > 0)).reduce((acc, w) => acc + Math.max(0, Number(w.ammoCurrent ?? 0)), 0)) + Math.max(0, Number(ch.totalAmmoReserve ?? 0))}</span>
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

            ${(Array.isArray(ch.activePassives) && ch.activePassives.length > 0) ? `
              <div class="mt-2 pt-2 border-t border-slate-800/80 bg-obsidian-950/90 rounded-lg p-2 space-y-1.5">
                <div class="flex items-center justify-between text-[10px]">
                  <span class="font-display font-bold uppercase text-emerald-300 flex items-center gap-1">
                    <i class="fa-solid fa-eye text-emerald-400 animate-pulse"></i> Passivas Ativas (${ch.activePassives.length})
                  </span>
                  <button onclick="app.gmDeactivateAllPassivesForChar('${ch.id}')" class="px-2 py-0.5 rounded bg-crimson-950 hover:bg-crimson-600 text-crimson-200 hover:text-white border border-crimson-500/40 font-bold text-[9px] transition-all">
                    <i class="fa-solid fa-power-off mr-0.5"></i>Desligar Todas
                  </button>
                </div>
                <div class="flex flex-wrap gap-1">
                  ${ch.activePassives.map((ap, apIdx) => `
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-obsidian-900 border border-emerald-500/40 text-emerald-200 text-[10px] font-semibold">
                      <span>${escapeHtml(ap.name)}</span>
                      <button onclick="app.gmDeactivatePlayerPassive('${ch.id}', ${apIdx})" title="Desligar esta passiva" class="text-slate-400 hover:text-crimson-400 ml-0.5">
                        <i class="fa-solid fa-xmark"></i>
                      </button>
                    </span>
                  `).join('')}
                </div>
              </div>
            ` : ''}
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
export function renderGMCampaignAndDowntimePanel(charactersMap, campaignState, forceRebuild = false) {
  const container = document.getElementById('gmCampaignManagerContent');
  if (!container) return;
  if (!forceRebuild && isUserTypingInContainer(container)) return;

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
    <optgroup label="Perícias (20)">
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
            <button onclick="app.setViewMode('campaign')" class="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-400 text-amber-200 hover:text-obsidian-950 border border-amber-400/50 text-xs font-display font-bold flex items-center gap-1.5 transition-all shadow">
              <i class="fa-solid fa-folder-open"></i> Gerenciar Dossiês, Resumo & Progresso (Aba Campanha)
            </button>
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
            <label class="flex items-center justify-between gap-2 bg-obsidian-950/80 border border-amber-500/40 rounded-xl p-3 cursor-pointer">
              <div>
                <div class="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                  <i class="fa-solid fa-dice-d20 text-amber-400"></i> Liberar Rolagens Livres Fora de Combate
                </div>
                <p class="text-[11px] text-slate-400 mt-0.5">
                  Quando desmarcado, durante a semana os jogadores <strong>só podem rolar dados quando o Mestre pedir um teste no dia ou permitir rejogar</strong> (ou quando o Combate estiver ativo).
                </p>
              </div>
              <input type="checkbox" ${activeCamp.allowFreePlayerRolls === true ? 'checked' : ''}
                onchange="app.updateActiveCampaignField('allowFreePlayerRolls', this.checked)"
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
                              <div class="text-[10px] uppercase tracking-wider text-slate-400 mb-1 flex flex-wrap items-center justify-between gap-1">
                                <div class="flex items-center gap-1.5">
                                  <span>Relato do Jogador:</span>
                                  ${(dayObj.daySubmitted || dt.submittedToGM)
                                    ? '<span class="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold"><i class="fa-solid fa-paper-plane mr-0.5"></i>Dia Enviado</span>'
                                    : '<span class="px-1.5 py-0.2 rounded bg-obsidian-900 text-slate-500 border border-slate-800 text-[9px]">Rascunho</span>'
                                  }
                                </div>
                                ${dayObj.applied ? '<span class="text-emerald-400 font-bold"><i class="fa-solid fa-check mr-0.5"></i>Feedback & Dia Aplicados</span>' : ''}
                              </div>
                              <p class="text-xs ${dayObj.playerActivity ? 'text-slate-200' : 'text-slate-500 italic'}">
                                ${dayObj.playerActivity ? escapeHtml(dayObj.playerActivity) : 'Nenhuma atividade descrita pelo jogador para este dia.'}
                              </p>
                            </div>

                            <div class="bg-obsidian-950/60 p-2.5 rounded-lg border border-slate-800/70 space-y-2">
                              <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                                <div class="sm:col-span-6">
                                  <label class="block text-[9px] uppercase text-brass-300 mb-0.5">Pedir Dado (Opcional)</label>
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
                                <div class="sm:col-span-4 flex flex-col items-end justify-center gap-1">
                                  ${dayObj.playerRollResult ? `
                                    <div class="flex items-center gap-1 flex-wrap justify-end">
                                      <span class="px-2 py-0.5 rounded font-display font-extrabold text-xs ${dayObj.playerRollResult.total >= (dayObj.gmTestDC || 12) ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-crimson-950 text-crimson-300 border border-crimson-500/40'}" title="${escapeHtml(dayObj.playerRollResult.details || '')}">
                                        Dado: ${dayObj.playerRollResult.total} (DT ${dayObj.gmTestDC ?? 12})
                                      </span>
                                      <button onclick="app.gmToggleDowntimeReroll('${ch.id}', '${d.key}')"
                                        title="Permitir ou bloquear que o jogador re-jogue o dado deste dia"
                                        class="px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${dayObj.allowReroll ? 'bg-amber-400 text-obsidian-950 border-amber-300' : 'bg-obsidian-900 hover:bg-amber-950 text-amber-300 border-amber-500/40'}">
                                        <i class="fa-solid ${dayObj.allowReroll ? 'fa-unlock' : 'fa-rotate-right'} mr-0.5"></i>${dayObj.allowReroll ? 'Rejogar Liberado' : 'Permitir Rejogar'}
                                      </button>
                                    </div>
                                  ` : dayObj.gmRequestedTest ? `
                                    <span class="px-2 py-0.5 rounded bg-amber-950/70 text-amber-300 border border-amber-500/30 text-[10px] font-semibold">
                                      Aguardando Jogador Rolar
                                    </span>
                                  ` : `<span class="text-[10px] text-emerald-400/90 font-semibold"><i class="fa-solid fa-bolt mr-1"></i>Sem Dado (Feedback Direto)</span>`}
                                </div>
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

                            <div class="space-y-1.5 pt-1 border-t border-slate-800/80">
                              <label class="block text-[9px] uppercase text-brass-300 font-bold">
                                <i class="fa-solid fa-comment-dots mr-1"></i>Feedback do Mestre sobre o que aconteceu neste dia:
                              </label>
                              <div class="flex items-center gap-2">
                                <input type="text" value="${escapeHtml(dayObj.gmFeedback || '')}"
                                  oninput="app.updateDowntimeDayField('${ch.id}', '${d.key}', 'gmFeedback', this.value)"
                                  placeholder="${dayObj.gmRequestedTest ? 'Escreva o desfecho após o resultado do dado...' : 'Escreva o feedback imediato deste dia (sem necessidade de rolagem)...'}"
                                  class="sheet-input flex-1 px-2.5 py-1.5 rounded text-xs text-slate-100" />
                                <button onclick="app.applySingleDayOutcomeToChar('${ch.id}', '${d.key}')"
                                  title="Enviar este feedback para a ficha do jogador e aplicar efeitos do dia"
                                  class="px-3 py-1.5 rounded-lg ${dayObj.applied ? 'bg-obsidian-800 hover:bg-emerald-600 text-emerald-300 hover:text-obsidian-950 border-emerald-500/40' : 'bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 border-emerald-400'} border text-[10px] font-display font-bold shrink-0 transition-all shadow">
                                  <i class="fa-solid ${dayObj.applied ? 'fa-check-double' : 'fa-paper-plane'} mr-1"></i>${dayObj.applied ? 'Atualizar Feedback' : 'Enviar Feedback'}
                                </button>
                              </div>
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

      <!-- 2B. CORREIO DA SEMANA: APROVAÇÃO DE CARTAS ENTRE JOGADORES (MESTRE) -->
      <div class="victorian-card-gold rounded-xl p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-brass-400/25 pb-3">
          <div>
            <span class="text-[10px] font-display uppercase tracking-widest text-brass-400 block">Correspondências & Mensagens sob o Nevoeiro</span>
            <h3 class="font-display font-bold text-base sm:text-lg text-brass-200 flex items-center gap-2">
              <i class="fa-solid fa-envelope-open-text text-amber-400"></i> Correio da Semana — Aprovação de Cartas entre Jogadores
            </h3>
            <p class="text-xs text-slate-400">
              Todas as cartas enviadas pelos jogadores durante os dias da semana passam por aqui. Aprove para entregar na caixa de entrada do destinatário ou intercepte/recuse.
            </p>
          </div>
          <span class="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-400/40 font-display font-bold text-xs">
            ${(activeCamp.weeklyLetters || []).filter(l => l.status === 'pending').length} Pendente(s) de Aprovação
          </span>
        </div>

        ${(!activeCamp.weeklyLetters || activeCamp.weeklyLetters.length === 0) ? `
          <p class="text-xs text-slate-500 italic text-center py-4">Nenhuma carta foi enviada pelos jogadores nesta campanha ainda.</p>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            ${(activeCamp.weeklyLetters || []).map(letter => {
              const isPending = letter.status === 'pending';
              const isApproved = letter.status === 'approved';
              const statusBadge = isPending
                ? '<span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 text-[10px] font-bold uppercase animate-pulse"><i class="fa-solid fa-hourglass-half mr-1"></i>Aguardando Aprovação</span>'
                : isApproved
                ? '<span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase"><i class="fa-solid fa-check mr-1"></i>Aprovada & Entregue</span>'
                : '<span class="px-2 py-0.5 rounded bg-crimson-950 text-crimson-300 border border-crimson-500/40 text-[10px] font-bold uppercase"><i class="fa-solid fa-ban mr-1"></i>Interceptada / Recusada</span>';

              return `
                <div class="bg-obsidian-950/90 border ${isPending ? 'border-amber-400/70 shadow-lg' : 'border-slate-800'} rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div class="space-y-2">
                    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                      <div class="flex items-center gap-1.5 flex-wrap">
                        <span class="px-2 py-0.5 rounded bg-obsidian-900 border border-brass-400/30 text-brass-300 text-[10px] font-display font-bold">
                          ${escapeHtml(letter.dayLabel || 'Semana')} (Sem. ${letter.weekNumber || 1})
                        </span>
                        ${statusBadge}
                      </div>
                      <button onclick="app.gmDeleteWeeklyLetter('${letter.id}')" title="Excluir carta" class="text-slate-500 hover:text-crimson-400 text-xs">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    </div>

                    <div class="text-xs text-slate-300 flex flex-wrap items-center gap-1.5">
                      <span class="text-slate-400">De:</span>
                      <strong class="text-brass-200">${escapeHtml(letter.fromCharName || 'Remetente')}</strong>
                      <i class="fa-solid fa-arrow-right text-[10px] text-amber-400 mx-1"></i>
                      <span class="text-slate-400">Para:</span>
                      <strong class="text-emerald-300">${escapeHtml(letter.toCharName || 'Destinatário')}</strong>
                    </div>

                    ${letter.subject ? `<div class="text-xs font-display font-bold text-amber-200"><i class="fa-solid fa-feather-pointed mr-1"></i>${escapeHtml(letter.subject)}</div>` : ''}

                    <blockquote class="bg-obsidian-900/95 border-l-2 border-brass-400/60 p-2.5 rounded-r-lg text-xs text-slate-200 italic whitespace-pre-line leading-relaxed">
                      "${escapeHtml(letter.content || '')}"
                    </blockquote>
                  </div>

                  <div class="pt-2 border-t border-slate-800/80 flex items-center justify-end gap-2">
                    ${!isApproved ? `
                      <button onclick="app.gmModerateWeeklyLetter('${letter.id}', 'approved')"
                        class="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-display font-extrabold text-xs flex items-center gap-1.5 shadow transition-all">
                        <i class="fa-solid fa-check"></i> Aprovar & Entregar Carta
                      </button>
                    ` : ''}
                    ${letter.status !== 'rejected' ? `
                      <button onclick="app.gmModerateWeeklyLetter('${letter.id}', 'rejected')"
                        class="px-3 py-1.5 rounded-lg bg-crimson-950/80 hover:bg-crimson-600 text-crimson-200 hover:text-white border border-crimson-500/40 font-display font-bold text-xs flex items-center gap-1.5 transition-all">
                        <i class="fa-solid fa-ban"></i> Recusar / Interceptar
                      </button>
                    ` : ''}
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

export function renderCharacterSheet(char, activeSheetTab, skillSortMode = 'alpha', actionFilterMode = 'all', campaignState = null, currentUser = null, storeUIState = null, charactersMap = null) {
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
  setInputValueIfNotFocused('charBackgroundStory', char.backgroundStory || '');
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
  renderCombatStylesAndProficiencies(char);
  renderMysticList(char, 'powers');
  renderMysticList(char, 'spells');
  renderMutationsList(char);
  renderResistancesAndWeaknesses(char);
  renderEquippedItemsTab(char, charactersMap, campaignState, currentUser);
  renderCampaignStoreTab(char, campaignState, currentUser, storeUIState);
  renderSequenceSummariesList(char, isGMUser);
  renderDowntimeTab(char, campaignState, false, charactersMap, currentUser);
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

export function renderDowntimeTab(char, campaignState, forceRebuild = false, charactersMap = null, currentUser = null) {
  const container = document.getElementById('downtimeTabContainer');
  if (!container || !char) return;
  if (!forceRebuild && isUserTypingInContainer(container)) return;

  const campaigns = campaignState?.campaigns || [];
  const activeCamp = campaigns.find(c => Array.isArray(c.characterIds) && c.characterIds.includes(char.id))
    || campaigns.find(c => c.id === campaignState?.activeCampaignId)
    || campaigns[0];
  const currentWeekNum = activeCamp?.currentWeek || char.weeklyDowntime?.weekNumber || 1;
  if (!char.weeklyDowntime) {
    char.weeklyDowntime = createDefaultWeeklyDowntime(currentWeekNum);
  }
  const dt = char.weeklyDowntime;
  const history = char.downtimeHistory || [];
  const isGMUser = currentUser?.role === 'gm';

  // Personagens destinatários para envio de cartas na campanha
  const campCharIds = new Set(activeCamp?.characterIds || []);
  const allChars = Object.values(charactersMap || {}).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const otherPartyChars = allChars.filter(c => c.id !== char.id && campCharIds.has(c.id));

  const allLetters = Array.isArray(activeCamp?.weeklyLetters) ? activeCamp.weeklyLetters : [];
  // Cartas recebidas por este personagem (APENAS as aprovadas pelo Mestre!)
  const receivedApprovedLetters = allLetters.filter(l => l.toCharId === char.id && l.status === 'approved');
  // Cartas enviadas por este personagem (para acompanhar status de aprovação)
  const sentByMeLetters = allLetters.filter(l => l.fromCharId === char.id);

  container.innerHTML = `
    <div class="space-y-5">
      <!-- 1. CABEÇALHO DO DIÁRIO SEMANAL -->
      <div class="victorian-card-gold rounded-xl p-4 sm:p-5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-brass-400/20 pb-3">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-400/40 font-display font-bold text-[11px]">
                Semana Atual #${currentWeekNum}
              </span>
              ${dt.submittedToGM
                ? `<span class="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold text-[11px]"><i class="fa-solid fa-paper-plane mr-1"></i>Semana Enviada ao Mestre</span>`
                : `<span class="px-2.5 py-0.5 rounded-full bg-obsidian-800 text-slate-300 border border-slate-700 text-[11px]">Envie cada dia ou a semana completa</span>`
              }
            </div>
            <h3 class="font-display font-bold text-base sm:text-lg text-brass-200 mt-1">
              Diário Semanal Entre-Missões & Correio da Campanha
            </h3>
            <p class="text-xs text-slate-400">
              Envie o que <strong>${escapeHtml(char.name)}</strong> fez em cada dia. O Mestre poderá dar o feedback na hora (se não precisar de rolagem) ou pedir um teste de dado antes de narrar o que aconteceu.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button onclick="app.submitWeeklyDowntimeToGM()"
              class="px-4 py-2 rounded-lg font-display font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all ${dt.submittedToGM ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-brass-400 hover:bg-brass-300 text-obsidian-950'}">
              <i class="fa-solid ${dt.submittedToGM ? 'fa-check-double' : 'fa-paper-plane'}"></i>
              <span>${dt.submittedToGM ? 'Atualizar Todos os Dias' : 'Enviar Todos os Dias ao Mestre'}</span>
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

      <!-- 2. DIAS DA SEMANA (FLUXO: ENVIAR DIA -> DADO OPCIONAL COM TRAVA DE REJOGAR -> FEEDBACK DO MESTRE) -->
      <div class="space-y-3">
        ${WEEK_DAYS_DEF.map(d => {
          const dayObj = dt.days?.[d.key] || {
            isMissionDay: false,
            daySubmitted: false,
            playerActivity: '',
            gmRequestedTest: '',
            gmTestDC: 12,
            playerRollResult: null,
            allowReroll: false,
            gmFeedback: '',
            outcomes: [],
            deltas: { potion: 0, hp: 0, san: 0, sp: 0, gold: 0, itemGained: '', clueGained: '' }
          };
          const outcomes = Array.isArray(dayObj.outcomes) ? dayObj.outcomes : [];
          const deltas = dayObj.deltas || {};
          const hasGMResponse = Boolean(
            dayObj.gmFeedback ||
            outcomes.length > 0 ||
            deltas.potion || deltas.hp || deltas.san || deltas.sp || deltas.gold ||
            deltas.itemGained || deltas.clueGained
          );
          const isSent = Boolean(dayObj.daySubmitted || dt.submittedToGM);
          const canRollNow = (!dayObj.playerRollResult || Boolean(dayObj.allowReroll));

          let stepBadgeHtml = '';
          if (dayObj.isMissionDay) {
            stepBadgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-crimson-950 text-crimson-300 border border-crimson-500/40">Dia de Sessão</span>`;
          } else if (hasGMResponse) {
            stepBadgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/40"><i class="fa-solid fa-crown mr-1"></i>Feedback do Mestre Recebido</span>`;
          } else if (dayObj.gmRequestedTest && !dayObj.playerRollResult) {
            stepBadgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/50 animate-pulse"><i class="fa-solid fa-dice-d20 mr-1"></i>Mestre Pediu Rolagem!</span>`;
          } else if (dayObj.playerRollResult) {
            stepBadgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-astral-950 text-astral-300 border border-astral-500/40"><i class="fa-solid fa-check mr-1"></i>Dado Rolado • Aguardando Feedback</span>`;
          } else if (isSent) {
            stepBadgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-500/30"><i class="fa-solid fa-paper-plane mr-1"></i>Dia Enviado ao Mestre</span>`;
          } else {
            stepBadgeHtml = `<span class="px-2 py-0.5 rounded text-[10px] bg-obsidian-900 text-slate-400 border border-slate-800">Rascunho</span>`;
          }

          return `
            <div class="victorian-card rounded-xl p-4 border transition-all space-y-3 ${dayObj.isMissionDay ? 'border-l-4 border-l-crimson-500 bg-crimson-950/10' : (dayObj.gmRequestedTest && !dayObj.playerRollResult ? 'border-l-4 border-l-amber-400' : 'border-l-4 border-l-brass-500/60')}">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="w-7 h-7 rounded-lg bg-obsidian-900 border border-brass-400/30 flex items-center justify-center text-brass-300 text-xs">
                    <i class="fa-solid ${d.icon}"></i>
                  </span>
                  <div>
                    <div class="flex items-center gap-2 flex-wrap">
                      <h4 class="font-display font-bold text-sm text-brass-200">${d.label}</h4>
                      ${stepBadgeHtml}
                    </div>
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
                <div class="space-y-2">
                  <label class="block text-[11px] uppercase tracking-wider text-slate-400">
                    O que seu personagem fez neste dia? (Atuação, estudos, investigações, rituais, descanso)
                  </label>
                  <textarea rows="2"
                    oninput="app.updateDowntimeDayField('${char.id}', '${d.key}', 'playerActivity', this.value, false)"
                    placeholder="Descreva suas ações de ${d.label} e clique em Enviar Dia ao Mestre..."
                    class="sheet-input w-full p-2.5 rounded-lg text-xs text-slate-100 leading-relaxed">${escapeHtml(dayObj.playerActivity || '')}</textarea>
                  <div class="flex justify-end">
                    <button onclick="app.submitSingleDowntimeDay('${char.id}', '${d.key}')"
                      class="px-3.5 py-1.5 rounded-lg font-display font-bold text-xs flex items-center gap-1.5 transition-all ${isSent ? 'bg-obsidian-900 hover:bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-brass-400 hover:bg-brass-300 text-obsidian-950 shadow'}">
                      <i class="fa-solid ${isSent ? 'fa-check' : 'fa-paper-plane'}"></i>
                      <span>${isSent ? `Dia Enviado (Atualizar ${d.short})` : `Enviar ${d.label} ao Mestre`}</span>
                    </button>
                  </div>
                </div>

                ${dayObj.gmRequestedTest ? `
                  <div class="bg-amber-950/40 border border-amber-400/50 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
                    <div class="flex items-center gap-2.5">
                      <i class="fa-solid fa-dice-d20 text-amber-400 text-lg ${!dayObj.playerRollResult ? 'animate-bounce' : ''}"></i>
                      <div>
                        <div class="text-xs font-display font-bold text-amber-200 uppercase">
                          ${dayObj.playerRollResult ? 'Teste da Semana Realizado' : 'O Mestre solicitou um dado para este dia!'}
                        </div>
                        <div class="text-xs text-slate-300">
                          Teste exigido: <strong class="text-brass-200">${escapeHtml(getTestLabelByKey(dayObj.gmRequestedTest))}</strong> • Dificuldade (DT): <strong>${dayObj.gmTestDC ?? 12}</strong>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                      ${dayObj.playerRollResult ? `
                        <div class="px-3 py-1.5 rounded-lg border font-display font-bold text-xs ${dayObj.playerRollResult.total >= (dayObj.gmTestDC || 12) ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200' : 'bg-crimson-950/90 border-crimson-500 text-crimson-200'}">
                          Resultado: ${dayObj.playerRollResult.total} (${escapeHtml(dayObj.playerRollResult.details || '')})
                        </div>
                      ` : ''}

                      ${canRollNow ? `
                        <button onclick="app.rollDowntimeRequestedTest('${char.id}', '${d.key}')"
                          class="px-3.5 py-1.5 rounded-lg bg-brass-400 hover:bg-brass-300 text-obsidian-950 font-display font-extrabold text-xs flex items-center gap-1.5 shadow-md transition-all">
                          <i class="fa-solid fa-dice-d20"></i>
                          <span>${dayObj.playerRollResult ? 'Rejogar Dado (Liberado pelo Mestre)' : 'Rolar Dado Agora'}</span>
                        </button>
                      ` : `
                        <span class="px-3 py-1.5 rounded-lg bg-obsidian-950 border border-slate-800 text-slate-400 font-display font-bold text-[11px] flex items-center gap-1.5" title="O dado já foi rolado. Apenas o Mestre pode liberar uma nova rolagem.">
                          <i class="fa-solid fa-lock text-amber-400"></i> Dado Rolado (Rejogar apenas c/ permissão do Mestre)
                        </span>
                      `}
                    </div>
                  </div>
                ` : ''}

                ${hasGMResponse ? `
                  <div class="bg-obsidian-950/90 border border-brass-400/40 rounded-xl p-3.5 space-y-2 shadow-md">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="text-[10px] font-display font-bold uppercase tracking-wider text-brass-300 flex items-center gap-1.5">
                        <i class="fa-solid fa-crown text-brass-400"></i> Feedback do Mestre — O que aconteceu na ${d.label}:
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
                    ${dayObj.gmFeedback ? `<p class="text-xs text-slate-100 leading-relaxed bg-obsidian-900/80 p-2.5 rounded-lg border border-slate-800">${escapeHtml(dayObj.gmFeedback)}</p>` : ''}
                    ${deltas.clueGained ? `<div class="text-xs text-amber-300"><i class="fa-solid fa-magnifying-glass mr-1"></i><strong>Pista Descoberta:</strong> ${escapeHtml(deltas.clueGained)}</div>` : ''}
                    ${deltas.itemGained ? `<div class="text-xs text-emerald-300"><i class="fa-solid fa-box-open mr-1"></i><strong>Item Obtido:</strong> ${escapeHtml(deltas.itemGained)}</div>` : ''}
                  </div>
                ` : ''}
              `}
            </div>
          `;
        }).join('')}
      </div>

      <!-- 3. CORREIO & CARTAS DA SEMANA ENTRE JOGADORES (COM APROVAÇÃO DO MESTRE) -->
      <div class="victorian-card-gold rounded-xl p-4 sm:p-5 space-y-4">
        <div class="border-b border-brass-400/25 pb-3">
          <span class="text-[10px] font-display uppercase tracking-widest text-brass-400 block">Mensageiros do Mundo Espiritual & Correio a Vapor</span>
          <h3 class="font-display font-bold text-base sm:text-lg text-brass-200 flex items-center gap-2">
            <i class="fa-solid fa-envelope-open-text text-brass-400"></i> Cartas entre Jogadores durante a Semana
          </h3>
          <p class="text-xs text-slate-400">
            Escreva pequenos blocos de texto (cartas, bilhetes ou mensagens via mensageiro espiritual) para outro personagem da campanha. O Mestre avaliará e aprovará a entrega!
          </p>
        </div>

        <!-- Formulário para Enviar Nova Carta -->
        <div class="bg-obsidian-950/85 border border-slate-800 rounded-xl p-4 space-y-3">
          <h4 class="font-display font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <i class="fa-solid fa-feather-pointed text-amber-400"></i> Escrever Nova Carta de ${escapeHtml(char.name)}
          </h4>

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div class="sm:col-span-3">
              <label class="block text-[10px] uppercase text-slate-400 mb-1">Dia do Envio</label>
              <select id="letterDaySelect" class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-brass-200">
                ${WEEK_DAYS_DEF.map(d => `<option value="${d.key}">${d.label}</option>`).join('')}
              </select>
            </div>
            <div class="sm:col-span-4">
              <label class="block text-[10px] uppercase text-emerald-300 font-bold mb-1">Destinatário na Campanha *</label>
              <select id="letterRecipientSelect" class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-200">
                ${otherPartyChars.length === 0
                  ? `<option value="">Nenhum outro personagem na campanha</option>`
                  : otherPartyChars.map(oc => `<option value="${oc.id}">${escapeHtml(oc.name)} (${escapeHtml(oc.player || 'Jogador')})</option>`).join('')
                }
              </select>
            </div>
            <div class="sm:col-span-5">
              <label class="block text-[10px] uppercase text-slate-400 mb-1">Assunto / Selo da Carta (Opcional)</label>
              <input id="letterSubjectInput" type="text" placeholder="Ex: Bilhete Selado / Reunião Urgente..."
                class="sheet-input w-full px-3 py-1.5 rounded-lg text-xs text-amber-200" />
            </div>
          </div>

          <div>
            <label class="block text-[10px] uppercase text-slate-400 mb-1">Mensagem da Carta (Bloco de Texto) *</label>
            <textarea id="letterBodyInput" rows="3" maxlength="800"
              placeholder="Escreva aqui o conteúdo da carta que será submetida à aprovação do Mestre antes de chegar ao destinatário..."
              class="sheet-input w-full p-2.5 rounded-lg text-xs text-slate-100 leading-relaxed"></textarea>
          </div>

          <div class="flex justify-end">
            <button onclick="app.sendWeeklyLetter()"
              class="px-4 py-2 rounded-lg bg-brass-400 hover:bg-brass-300 text-obsidian-950 font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all">
              <i class="fa-solid fa-paper-plane"></i> Enviar Carta (Solicitar Aprovação do Mestre)
            </button>
          </div>
        </div>

        <!-- Caixa de Entrada e Cartas Enviadas -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Cartas Recebidas (Aprovadas pelo Mestre) -->
          <div class="bg-obsidian-950/90 border border-emerald-500/35 rounded-xl p-4 space-y-2.5">
            <h4 class="font-display font-bold text-xs uppercase tracking-wider text-emerald-300 flex items-center justify-between">
              <span><i class="fa-solid fa-inbox mr-1.5"></i>Cartas Recebidas por ${escapeHtml(char.name)}</span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px]">${receivedApprovedLetters.length}</span>
            </h4>
            ${receivedApprovedLetters.length === 0 ? `
              <p class="text-xs text-slate-500 italic py-3 text-center">Nenhuma carta aprovada pelo Mestre chegou até você ainda.</p>
            ` : `
              <div class="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                ${receivedApprovedLetters.map(l => `
                  <div class="bg-obsidian-900/95 border border-brass-400/35 rounded-lg p-3 space-y-1.5 shadow">
                    <div class="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-1">
                      <span class="font-bold text-brass-300"><i class="fa-solid fa-user-pen mr-1"></i>De: ${escapeHtml(l.fromCharName)}</span>
                      <span>${escapeHtml(l.dayLabel || '')} • Sem. ${l.weekNumber || 1}</span>
                    </div>
                    ${l.subject ? `<div class="text-xs font-display font-bold text-amber-200">${escapeHtml(l.subject)}</div>` : ''}
                    <blockquote class="text-xs text-slate-200 italic border-l-2 border-emerald-500/50 pl-2.5 py-0.5 whitespace-pre-line leading-relaxed">
                      "${escapeHtml(l.content || '')}"
                    </blockquote>
                  </div>
                `).join('')}
              </div>
            `}
          </div>

          <!-- Cartas Enviadas por este Personagem (Status de Aprovação) -->
          <div class="bg-obsidian-950/90 border border-slate-800 rounded-xl p-4 space-y-2.5">
            <h4 class="font-display font-bold text-xs uppercase tracking-wider text-brass-300 flex items-center justify-between">
              <span><i class="fa-solid fa-paper-plane mr-1.5"></i>Cartas Enviadas por Você</span>
              <span class="px-2 py-0.5 rounded-full bg-obsidian-800 text-slate-300 text-[10px]">${sentByMeLetters.length}</span>
            </h4>
            ${sentByMeLetters.length === 0 ? `
              <p class="text-xs text-slate-500 italic py-3 text-center">Você ainda não enviou nenhuma carta nesta campanha.</p>
            ` : `
              <div class="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                ${sentByMeLetters.map(l => {
                  const badge = l.status === 'approved'
                    ? '<span class="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold uppercase"><i class="fa-solid fa-check mr-0.5"></i>Entregue</span>'
                    : l.status === 'rejected'
                    ? '<span class="px-1.5 py-0.5 rounded bg-crimson-950 text-crimson-300 border border-crimson-500/40 text-[9px] font-bold uppercase"><i class="fa-solid fa-ban mr-0.5"></i>Interceptada</span>'
                    : '<span class="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40 text-[9px] font-bold uppercase"><i class="fa-solid fa-hourglass-half mr-0.5"></i>Aguardando Mestre</span>';
                  return `
                    <div class="bg-obsidian-900/90 border border-slate-800 rounded-lg p-3 space-y-1">
                      <div class="flex items-center justify-between gap-2 text-[10px]">
                        <span class="text-slate-300">Para: <strong class="text-emerald-300">${escapeHtml(l.toCharName)}</strong> (${escapeHtml(l.dayLabel || '')})</span>
                        ${badge}
                      </div>
                      ${l.subject ? `<div class="text-xs font-bold text-amber-200">${escapeHtml(l.subject)}</div>` : ''}
                      <p class="text-xs text-slate-300 italic line-clamp-3">"${escapeHtml(l.content || '')}"</p>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </div>
      </div>

      <!-- 4. HISTÓRICO DE RESUMOS DE SEMANAS ANTERIORES -->
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

export function renderAttributesSection(char, forceRebuild = false) {
  const container = document.getElementById('attributesContainer');
  if (!container) return;
  if (!forceRebuild && isUserTypingInContainer(container)) {
    ATTRIBUTES_DEF.forEach(attr => {
      const data = char.attributes?.[attr.key] || { value: 10, bonus: 0 };
      const mod = calcAttrMod(data.value, data.bonus);
      const btn = document.getElementById(`attrModBtn_${attr.key}`);
      if (btn) btn.textContent = formatSigned(mod);
    });
    return;
  }
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

        <button id="attrModBtn_${attr.key}" onclick="app.rollAttributeCheck('${attr.key}')" class="my-1 px-4 py-1 rounded-full bg-obsidian-950/90 border border-brass-400/40 font-display font-extrabold text-xl text-brass-200 hover:border-brass-300 transition-all">
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

export function renderSavingThrowsSection(char, forceRebuild = false) {
  const container = document.getElementById('savingThrowsContainer');
  if (!container) return;
  const profBonus = Number(char.proficiencyBonus) || 2;
  if (!forceRebuild && isUserTypingInContainer(container)) {
    SAVING_THROWS_DEF.forEach(sv => {
      const svData = char.savingThrows?.[sv.key] || { proficient: false, bonus: 0 };
      const attrObj = char.attributes?.[sv.defaultAttr] || { value: 10, bonus: 0 };
      const attrMod = calcAttrMod(attrObj.value, attrObj.bonus);
      const total = attrMod + (svData.proficient ? profBonus : 0) + (Number(svData.bonus) || 0);
      const spanEl = document.getElementById(`saveRollTotal_${sv.key}`);
      if (spanEl) spanEl.textContent = formatSigned(total);
    });
    return;
  }

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
            <span id="saveRollTotal_${sv.key}">${formatSigned(total)}</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export function renderSkillsList(char, sortMode = 'alpha', forceRebuild = false) {
  if (!char) return;
  const container = document.getElementById('skillsListContainer');
  if (!container) return;
  const profBonus = Number(char.proficiencyBonus) || 2;
  if (!forceRebuild && isUserTypingInContainer(container)) {
    SKILLS_DEF.forEach(sk => {
      const skData = char.skills?.[sk.id] || { attr: sk.defaultAttr, profLevel: 0, bonus: 0 };
      const chosenAttr = skData.attr || sk.defaultAttr;
      const attrObj = char.attributes?.[chosenAttr] || { value: 10, bonus: 0 };
      const attrMod = calcAttrMod(attrObj.value, attrObj.bonus);
      const total = attrMod + ((skData.profLevel || 0) * profBonus) + (Number(skData.bonus) || 0);
      const spanEl = document.getElementById(`skillRollTotal_${sk.id}`);
      if (spanEl) spanEl.textContent = formatSigned(total);
    });
    return;
  }
  const filterText = (document.getElementById('skillSearchInput')?.value || '').toLowerCase().trim();

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
            <span id="skillRollTotal_${sk.id}">${formatSigned(total)}</span>
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
  const tabs = ['combat', 'equipped', 'powers', 'spells', 'mutations', 'resistances', 'store', 'downtime', 'notes'];
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
    const isAvailable = a.key === 'completa'
      ? (turnActions.padrao !== false && turnActions.bonus !== false)
      : (turnActions[a.key] !== false);
    const subLabel = a.key === 'completa'
      ? (isAvailable ? 'Gasta Padrão + Bônus' : 'Indisponível')
      : (isAvailable ? 'Disponível' : 'Já Utilizada');
    return `
      <button onclick="app.toggleCharacterTurnAction('${char.id}', '${a.key}')"
        class="p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${isAvailable ? a.badgeClass + ' shadow-md' : 'bg-obsidian-950/70 border-slate-800 text-slate-500 opacity-60'}">
        <div class="flex items-center gap-2">
          <i class="fa-solid ${a.icon} text-sm"></i>
          <div>
            <div class="font-display font-bold text-xs">${a.short}</div>
            <div class="text-[10px] opacity-80">${subLabel}</div>
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
    { key: 'completa', label: 'Ação Completa (Padrão+Bônus)' },
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
    const isFire = w.isFirearm !== false && (w.isFirearm || w.ammoMax > 0);
    const ammoInfo = isFire ? ` • Munição: ${w.ammoCurrent ?? 0}/${w.ammoMax ?? 6}` : '';
    const peCost = Math.max(0, Number(w.peCost ?? 0));
    const peInfo = (w.isMysticAttack || peCost > 0) ? ` • Custo: ${peCost} PE` : '';
    allOptions.push({
      actionType: aType,
      category: (w.isMysticAttack || peCost > 0) ? 'Ataque Místico' : 'Arma / Ataque',
      name: w.name || 'Ataque',
      detail: `Atq ${formatSigned(w.attackBonus ?? 0)} • Dano ${w.damage || '1d6'}${ammoInfo}${peInfo}`,
      ctaLabel: peCost > 0 ? `Atacar (-${peCost} PE)` : 'Atacar',
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
      actionType: 'completa',
      category: 'Manobra de Turno Inteiro',
      name: 'Ação Completa (Consome 1 Ação Padrão + 1 Ação Bônus)',
      detail: 'Executa ação complexa, canalização ritualística ou ataque concentrado',
      ctaLabel: 'Gastar Ação Completa',
      onClick: `app.consumeTurnAction('${char.id}', 'completa', 'Ação Completa')`
    },
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

  const isActionSlotAvailable = (aType) => {
    if (aType === 'livre') return true;
    if (aType === 'completa') return turnActions.padrao !== false && turnActions.bonus !== false;
    return turnActions[aType] !== false;
  };

  const filtered = allOptions.filter(opt => {
    if (actionFilterMode === 'all') return true;
    if (actionFilterMode === 'available') {
      return isActionSlotAvailable(opt.actionType);
    }
    return opt.actionType === actionFilterMode;
  });

  if (filtered.length === 0) {
    filteredResultsContainer.innerHTML = `<p class="text-xs text-slate-500 italic py-2 text-center">Nenhuma ação encontrada para este filtro.</p>`;
    return;
  }

  filteredResultsContainer.innerHTML = filtered.map(opt => {
    const meta = getActionTypeMeta(opt.actionType);
    const slotAvailable = isActionSlotAvailable(opt.actionType);

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

export function renderWeaponsList(char, forceRebuild = false) {
  const container = document.getElementById('weaponsListContainer');
  if (!container) return;
  const weapons = char.weapons || [];

  // Painel de Munição Total do Jogador (Carregada nas Armas + Reserva na Mochila)
  const ammoOverviewEl = document.getElementById('playerTotalAmmoOverview');
  if (ammoOverviewEl && (forceRebuild || !isUserTypingInContainer(ammoOverviewEl))) {
    const firearms = weapons.filter(w => w.isFirearm !== false && (w.isFirearm || w.ammoMax > 0));
    const loadedAmmo = firearms.reduce((sum, w) => sum + Math.max(0, Number(w.ammoCurrent ?? 0)), 0);
    const loadedMax = firearms.reduce((sum, w) => sum + Math.max(0, Number(w.ammoMax ?? 6)), 0);
    const reserveAmmo = Math.max(0, Number(char.totalAmmoReserve ?? 0));
    const grandTotalAmmo = loadedAmmo + reserveAmmo;

    ammoOverviewEl.innerHTML = `
      <div class="bg-obsidian-950/90 border border-amber-400/35 rounded-xl p-3.5 space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-400/50 flex items-center justify-center text-amber-300 text-base shrink-0 shadow">
              <i class="fa-solid fa-bullseye"></i>
            </div>
            <div>
              <div class="text-[10px] font-display uppercase tracking-wider text-amber-300 font-bold">
                Controle de Munição Total do Personagem
              </div>
              <div class="flex flex-wrap items-center gap-2 mt-0.5">
                <span class="font-display font-extrabold text-base sm:text-lg text-brass-200">
                  Total: <strong class="text-amber-300">${grandTotalAmmo}</strong> projéteis
                </span>
                <span class="text-xs text-slate-400">
                  (Nas Armas: <strong class="text-slate-200">${loadedAmmo}/${loadedMax}</strong> • Na Reserva: <strong class="text-emerald-300">${reserveAmmo}</strong>)
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[10px] font-display uppercase text-slate-400 mr-1">Munição Reserva:</span>
            <button onclick="app.adjustTotalAmmoReserve(-5)" class="px-2 py-1 rounded bg-obsidian-900 hover:bg-crimson-950 text-crimson-300 border border-slate-700 text-xs font-bold">-5</button>
            <button onclick="app.adjustTotalAmmoReserve(-1)" class="px-2 py-1 rounded bg-obsidian-900 hover:bg-crimson-950 text-crimson-300 border border-slate-700 text-xs font-bold">-1</button>
            <input type="number" min="0" value="${reserveAmmo}"
              onchange="app.setTotalAmmoReserve(Number(this.value))"
              class="sheet-input w-16 text-center py-1 rounded text-xs font-extrabold text-amber-200" />
            <button onclick="app.adjustTotalAmmoReserve(1)" class="px-2 py-1 rounded bg-obsidian-900 hover:bg-emerald-950 text-emerald-300 border border-slate-700 text-xs font-bold">+1</button>
            <button onclick="app.adjustTotalAmmoReserve(5)" class="px-2 py-1 rounded bg-obsidian-900 hover:bg-emerald-950 text-emerald-300 border border-slate-700 text-xs font-bold">+5</button>
          </div>
        </div>

        <div>
          <input type="text" value="${escapeHtml(char.ammoNotes || '')}"
            oninput="app.updateField('ammoNotes', this.value)"
            placeholder="Anotar tipos de munição na reserva (ex: 12x Balas de Caça-Demônios, 6x Balas Purificadoras do Sol)..."
            class="sheet-input w-full px-3 py-1.5 rounded-lg text-xs text-slate-300" />
        </div>
      </div>
    `;
  }
  if (!forceRebuild && isUserTypingInContainer(container)) {
    weapons.forEach((w, idx) => {
      const peCost = Math.max(0, Number(w.peCost ?? 0));
      const peSuffix = (w.isMysticAttack || peCost > 0) && peCost > 0 ? ` • -${peCost} PE` : '';
      const atkSpan = document.getElementById(`weaponAtkBtnLabel_${idx}`);
      if (atkSpan) atkSpan.textContent = `Atacar (${formatSigned(w.attackBonus ?? 0)}${peSuffix})`;
      const dmgSpan = document.getElementById(`weaponDmgBtnLabel_${idx}`);
      if (dmgSpan) dmgSpan.textContent = `Dano (${w.damage || '1d6'})`;
    });
    return;
  }
  if (weapons.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-4">Nenhuma arma ou ataque cadastrado.</p>`;
    return;
  }

  container.innerHTML = weapons.map((w, idx) => {
    const actionKey = w.actionType || 'padrao';
    const isFirearm = w.isFirearm !== false && (w.isFirearm || w.ammoMax > 0);
    const isMystic = Boolean(w.isMysticAttack || Number(w.peCost) > 0);
    const peCost = Math.max(0, Number(w.peCost ?? 0));
    const peSuffix = isMystic && peCost > 0 ? ` • -${peCost} PE` : '';
    const ammoCur = Number(w.ammoCurrent ?? 6);
    const ammoMax = Math.max(1, Number(w.ammoMax ?? 6));

    const bulletsVisual = isFirearm
      ? Array.from({ length: Math.min(ammoMax, 12) }, (_, i) =>
          `<i class="fa-solid fa-circle text-[7px] ${i < ammoCur ? 'text-amber-400' : 'text-slate-700'}"></i>`
        ).join('')
      : '';

    return `
      <div class="bg-obsidian-950/80 border ${isMystic ? 'border-astral-500/40' : 'border-slate-800'} hover:border-brass-400/35 rounded-xl p-3.5 transition-all space-y-2.5">
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <div class="sm:col-span-4">
            <label class="block text-[10px] uppercase text-slate-400">Arma / Ataque Místico</label>
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
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-display uppercase text-brass-300 font-bold"><i class="fa-solid fa-hand-fist mr-1"></i>Empunhadura:</span>
              <select onchange="app.equipCharacterItem('weapons', ${idx}, this.value)"
                class="sheet-input px-2 py-1 rounded text-xs font-bold ${w.equipSlot ? 'text-amber-300 border-amber-400/50 bg-amber-950/40' : 'text-slate-400'}">
                ${EQUIP_SLOTS_DEF.map(sl => `<option value="${sl.key}" ${(w.equipSlot || '') === sl.key ? 'selected' : ''}>${sl.label}</option>`).join('')}
              </select>
            </div>

            <label class="inline-flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" ${isFirearm ? 'checked' : ''} onchange="app.updateCollectionItem('weapons', ${idx}, 'isFirearm', this.checked, true)" class="accent-amber-400 rounded" />
              <span class="font-semibold text-[11px]"><i class="fa-solid fa-gun text-brass-400 mr-1"></i>Arma de Fogo</span>
            </label>

            <label class="inline-flex items-center gap-1.5 text-xs text-astral-300 cursor-pointer">
              <input type="checkbox" ${isMystic ? 'checked' : ''} onchange="app.toggleWeaponMysticPE(${idx}, this.checked)" class="accent-astral-400 rounded" />
              <span class="font-semibold text-[11px]"><i class="fa-solid fa-star-of-life text-astral-400 mr-1"></i>Ataque Místico (Gasta PE)</span>
            </label>

            ${isMystic ? `
              <div class="flex items-center gap-1 bg-obsidian-950/90 px-2 py-0.5 rounded-lg border border-astral-500/40">
                <span class="text-[10px] font-display uppercase text-astral-300 font-bold">Custo PE:</span>
                <input type="number" min="0" value="${peCost}"
                  oninput="app.updateCollectionItem('weapons', ${idx}, 'peCost', Math.max(0, Number(this.value)))"
                  class="sheet-input w-12 text-center py-0.5 rounded text-xs font-extrabold text-astral-200" />
              </div>
            ` : ''}
          </div>

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
          ` : `<span class="text-[11px] text-slate-500 italic">${isMystic ? `Ataque Místico (${peCost} PE por uso)` : 'Arma Branca / Sem Munição'}</span>`}
        </div>

        <div class="flex flex-wrap items-center justify-between gap-2 pt-1">
          <input type="text" value="${escapeHtml(w.type || '')}" oninput="app.updateCollectionItem('weapons', ${idx}, 'type', this.value)"
            placeholder="Tipo de dano, alcance, propriedades místicas..."
            class="sheet-input flex-1 min-w-[180px] px-2.5 py-1 rounded text-xs text-slate-400" />

          <div class="flex items-center gap-1.5">
            ${(isMystic && peCost > 0) ? `
              <button onclick="app.spendWeaponMysticPEOnly(${idx})" title="Apenas descontar o custo de PE deste ataque místico"
                class="px-2.5 py-1.5 rounded-lg bg-astral-900/50 hover:bg-astral-600 text-astral-200 hover:text-white border border-astral-500/40 font-display font-bold text-xs flex items-center gap-1 transition-all">
                <i class="fa-solid fa-star-of-life"></i> -${peCost} PE
              </button>
            ` : ''}
            <button onclick="app.rollWeaponAttack(${idx}, true)" class="px-3 py-1.5 rounded-lg bg-brass-500/20 hover:bg-brass-400 text-brass-200 hover:text-obsidian-950 border border-brass-400/40 font-display font-bold text-xs flex items-center gap-1.5 transition-all">
              <i class="fa-solid fa-dice-d20"></i> <span id="weaponAtkBtnLabel_${idx}">Atacar (${formatSigned(w.attackBonus ?? 0)}${peSuffix})</span>
            </button>
            <button onclick="app.rollWeaponDamage(${idx})" class="px-3 py-1.5 rounded-lg bg-crimson-900/40 hover:bg-crimson-600 text-crimson-200 hover:text-white border border-crimson-500/40 font-display font-bold text-xs flex items-center gap-1.5 transition-all">
              <i class="fa-solid fa-burst"></i> <span id="weaponDmgBtnLabel_${idx}">Dano (${escapeHtml(w.damage || '1d6')})</span>
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

export function renderEquipmentList(char, forceRebuild = false) {
  const container = document.getElementById('equipmentListContainer');
  if (!container) return;
  if (!forceRebuild && isUserTypingInContainer(container)) return;
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
        
        <select onchange="app.updateCollectionItem('equipment', ${idx}, 'category', this.value)" class="sheet-input px-2 py-1.5 rounded text-xs text-eldritch-300">
          ${EQUIPMENT_CATEGORIES.map(cat => `<option value="${cat}" ${item.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
        </select>

        <select onchange="app.equipCharacterItem('equipment', ${idx}, this.value)"
          title="Equipar item na Mão Direita, Mão Esquerda ou Duas Mãos"
          class="sheet-input px-2 py-1.5 rounded text-xs font-bold ${item.equipSlot ? 'text-amber-300 border-amber-400/50 bg-amber-950/40' : 'text-slate-400'}">
          ${EQUIP_SLOTS_DEF.map(sl => `<option value="${sl.key}" ${(item.equipSlot || '') === sl.key ? 'selected' : ''}>${sl.label}</option>`).join('')}
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

export function renderMysticList(char, collectionKey, forceRebuild = false) {
  const isPowers = collectionKey === 'powers';
  const container = document.getElementById(isPowers ? 'powersListContainer' : 'spellsListContainer');
  if (!container) return;
  if (!forceRebuild && isUserTypingInContainer(container)) return;
  const list = char[collectionKey] || [];

  if (list.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-4">Nenhum registro cadastrado.</p>`;
    return;
  }

  container.innerHTML = list.map((item, idx) => {
    const actionKey = item.actionType || 'padrao';
    const isActivePassive = (char.activePassives || []).some(
      ap => (ap.name || '').toLowerCase() === (item.name || '').toLowerCase()
    );

    return `
      <div class="bg-obsidian-950/85 border ${isPowers ? 'border-eldritch-500/30' : 'border-astral-500/30'} rounded-xl p-4 space-y-3">
        <!-- Linha 1: Campos de Edição com bastante espaço -->
        <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div class="sm:col-span-5">
            <label class="block text-[10px] uppercase ${isPowers ? 'text-eldritch-300' : 'text-astral-300'} mb-0.5">${isPowers ? 'Nome do Poder Beyonder' : 'Nome da Magia / Ritual'}</label>
            <input type="text" value="${escapeHtml(item.name || '')}" oninput="app.updateCollectionItem('${collectionKey}', ${idx}, 'name', this.value)"
              class="sheet-input w-full px-3 py-1.5 rounded-lg text-xs font-bold ${isPowers ? 'text-eldritch-200' : 'text-astral-200'}" />
          </div>

          <div class="sm:col-span-3">
            <label class="block text-[10px] uppercase text-brass-300 mb-0.5">Tipo de Ação</label>
            <select onchange="app.updateCollectionItem('${collectionKey}', ${idx}, 'actionType', this.value, true)"
              class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold text-amber-200">
              ${ACTION_TYPES.map(a => `<option value="${a.key}" ${actionKey === a.key ? 'selected' : ''}>${a.label}</option>`).join('')}
            </select>
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[10px] uppercase text-slate-400 mb-0.5">${isPowers ? 'Sequência' : 'Tipo / Nível'}</label>
            <input type="text" value="${escapeHtml((isPowers ? item.sequence : item.level) || '')}"
              oninput="app.updateCollectionItem('${collectionKey}', ${idx}, '${isPowers ? 'sequence' : 'level'}', this.value)"
              class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs text-brass-200" />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-[10px] uppercase text-astral-300 mb-0.5">Custo (PE)</label>
            <input type="number" value="${item.cost ?? 0}" oninput="app.updateCollectionItem('${collectionKey}', ${idx}, 'cost', Number(this.value))"
              class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs text-center font-bold text-astral-300" />
          </div>
        </div>

        <!-- Linha 2: Barra de Controles Separada (Reordenar, Manter Passiva Ativa na Mesa, Usar/Conjurar e Excluir) -->
        <div class="flex flex-wrap items-center justify-between gap-2.5 bg-obsidian-900/75 px-3 py-2 rounded-lg border border-slate-800/90">
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex items-center gap-1">
              <span class="text-[10px] uppercase text-slate-400 mr-1">Ordem:</span>
              <button onclick="app.moveCollectionItem('${collectionKey}', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''}
                title="Mover para cima"
                class="px-2 py-1 rounded bg-obsidian-950 hover:bg-brass-500/25 text-slate-300 hover:text-brass-200 border border-slate-700 text-xs disabled:opacity-30 transition-all">
                <i class="fa-solid fa-arrow-up"></i>
              </button>
              <button onclick="app.moveCollectionItem('${collectionKey}', ${idx}, 1)" ${idx === list.length - 1 ? 'disabled' : ''}
                title="Mover para baixo"
                class="px-2 py-1 rounded bg-obsidian-950 hover:bg-brass-500/25 text-slate-300 hover:text-brass-200 border border-slate-700 text-xs disabled:opacity-30 transition-all">
                <i class="fa-solid fa-arrow-down"></i>
              </button>
            </div>

            <button onclick="app.toggleMysticAsActivePassive('${collectionKey}', ${idx})"
              title="Exibir ou ocultar este poder/magia na aba Passivas Ativas do Oráculo da Mesa"
              class="px-3 py-1 rounded-lg border text-xs font-display font-bold flex items-center gap-1.5 transition-all ${isActivePassive ? 'bg-emerald-500 text-obsidian-950 border-emerald-300 shadow' : 'bg-obsidian-950 hover:bg-eldritch-950 text-eldritch-300 border-slate-700'}">
              <i class="fa-solid fa-eye"></i>
              <span>${isActivePassive ? 'Ativo na Mesa (Desativar)' : 'Manter Ativo na Mesa'}</span>
            </button>
          </div>

          <div class="flex items-center gap-2">
            <button onclick="app.useMysticResource('${collectionKey}', ${idx}, true)"
              class="px-3.5 py-1.5 rounded-lg ${isPowers ? 'bg-eldritch-600/40 hover:bg-eldritch-500 text-eldritch-200 border-eldritch-400/40' : 'bg-astral-600/40 hover:bg-astral-500 text-astral-200 border-astral-400/40'} hover:text-white border font-display text-xs font-bold flex items-center gap-1.5 transition-all">
              <i class="fa-solid ${isPowers ? 'fa-bolt' : 'fa-wand-sparkles'}"></i>
              <span>${isPowers ? 'Usar Poder' : 'Conjurar'} (-${item.cost ?? 0} PE)</span>
            </button>
            <button onclick="app.removeCollectionItem('${collectionKey}', ${idx})" title="Excluir"
              class="p-1.5 rounded-lg bg-obsidian-950 hover:bg-crimson-950 text-slate-500 hover:text-crimson-400 border border-slate-800 text-xs">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <textarea rows="2" oninput="app.updateCollectionItem('${collectionKey}', ${idx}, 'description', this.value)"
          placeholder="Descrição detalhada, alcance e efeitos..."
          class="sheet-input w-full p-2.5 rounded-lg text-xs text-slate-200 leading-relaxed">${escapeHtml(item.description || '')}</textarea>
      </div>
    `;
  }).join('');
}

export function renderMutationsList(char, forceRebuild = false) {
  const container = document.getElementById('mutationsListContainer');
  if (!container) return;
  const mutations = char.mutations || [];

  // Se a quantidade de cards de mutação na tela já é a mesma e não foi pedida reconstrução forçada,
  // atualiza apenas os valores nos campos que NÃO estão em foco para que o texto da descrição nunca suma!
  const existingCards = container.querySelectorAll('[data-mutation-card]');
  if (!forceRebuild && (isUserTypingInContainer(container) || (mutations.length > 0 && existingCards.length === mutations.length))) {
    mutations.forEach((m, idx) => {
      setInputValueIfNotFocused(`mutName_${idx}`, m.name || '');
      setInputValueIfNotFocused(`mutType_${idx}`, m.type || MUTATION_TYPES[0]);
      setInputValueIfNotFocused(`mutSev_${idx}`, m.severity || MUTATION_SEVERITIES[0]);
      setInputValueIfNotFocused(`mutDesc_${idx}`, m.description || '');
    });
    return;
  }

  if (mutations.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-4">Nenhuma mutação física, mental ou espiritual registrada.</p>`;
    return;
  }

  container.innerHTML = mutations.map((m, idx) => `
    <div data-mutation-card="${idx}" class="bg-obsidian-950/85 border border-crimson-500/35 rounded-xl p-4 space-y-2.5">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <input id="mutName_${idx}" type="text" value="${escapeHtml(m.name || '')}" oninput="app.updateCollectionItem('mutations', ${idx}, 'name', this.value)"
          placeholder="Nome da Mutação / Sintoma" class="sheet-input flex-1 min-w-[180px] px-2.5 py-1.5 rounded text-xs font-bold text-crimson-300" />

        <select id="mutType_${idx}" onchange="app.updateCollectionItem('mutations', ${idx}, 'type', this.value)" class="sheet-input px-2.5 py-1.5 rounded text-xs text-eldritch-300">
          ${MUTATION_TYPES.map(t => `<option value="${t}" ${m.type === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>

        <select id="mutSev_${idx}" onchange="app.updateCollectionItem('mutations', ${idx}, 'severity', this.value)" class="sheet-input px-2.5 py-1.5 rounded text-xs text-amber-300">
          ${MUTATION_SEVERITIES.map(s => `<option value="${s}" ${m.severity === s ? 'selected' : ''}>Severidade: ${s}</option>`).join('')}
        </select>

        <button onclick="app.removeCollectionItem('mutations', ${idx})" class="p-1.5 rounded bg-obsidian-900 hover:bg-crimson-950 text-slate-500 hover:text-crimson-400 border border-slate-800 text-xs">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>

      <textarea id="mutDesc_${idx}" rows="2" oninput="app.updateCollectionItem('mutations', ${idx}, 'description', this.value)"
        placeholder="Sintomas visuais, gatilhos de perda de controle e efeitos mecânicos..."
        class="sheet-input w-full p-2.5 rounded text-xs text-slate-200 leading-relaxed">${escapeHtml(m.description || '')}</textarea>
    </div>
  `).join('');
}

export function renderDiceLogs(diceLogs, campaignState = null, activeCharacterId = null, viewMode = 'sheet', currentUser = null) {
  const feed = document.getElementById('diceLogFeed');
  if (!feed) return;

  const canSeeRolls = isCharAllowedInActiveCampaign(activeCharacterId, campaignState, viewMode, currentUser);
  const activeCamp = (campaignState?.campaigns || []).find(c => c.id === campaignState?.activeCampaignId) || (campaignState?.campaigns || [])[0];

  if (!canSeeRolls) {
    const restrictedSig = `restricted::${activeCamp?.id || ''}`;
    if (lastRenderedDiceFeedSignature === restrictedSig) return;
    lastRenderedDiceFeedSignature = restrictedSig;
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
  if (activeCamp && activeCamp.restrictCombatAndDice !== false) {
    const allowedIds = new Set(activeCamp.characterIds || []);
    visibleLogs = visibleLogs.filter(l => {
      if (l.characterId) {
        return allowedIds.has(l.characterId);
      }
      return l.campaignId === activeCamp.id;
    });
  }

  if (visibleLogs.length === 0) {
    const emptySig = `empty::${activeCamp?.id || ''}`;
    if (lastRenderedDiceFeedSignature === emptySig) return;
    lastRenderedDiceFeedSignature = emptySig;
    lastAnimatedLogKey = '';
    feed.innerHTML = `
      <div class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
        <i class="fa-solid fa-dice-d20 text-3xl mb-2 text-slate-600"></i>
        <p class="text-xs">Clique em qualquer perícia, atributo, ataque ou dado para rolar.</p>
      </div>
    `;
    return;
  }

  const topLog = visibleLogs[0];
  const topKey = topLog ? `${topLog.id || ''}_${topLog.timestamp || ''}_${topLog.total || ''}` : '';
  const feedSig = `logs::${activeCamp?.id || ''}::${visibleLogs.length}::${topKey}`;

  // Se a lista de dados não mudou, NÃO reconstrói o HTML nem refaz a animação do dado já jogado!
  if (feedSig === lastRenderedDiceFeedSignature) {
    return;
  }

  const shouldAnimateTop = lastAnimatedLogKey !== null && topKey !== '' && topKey !== lastAnimatedLogKey;
  lastAnimatedLogKey = topKey;
  lastRenderedDiceFeedSignature = feedSig;

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
      <div class="rounded-xl p-3 border ${critClass} ${(idx === 0 && shouldAnimateTop) ? 'animate-dice' : ''}">
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


export function renderResistancesAndWeaknesses(char, forceRebuild = false) {
  if (!char) return;
  const resContainer = document.getElementById('resistancesListContainer');
  const wkContainer = document.getElementById('weaknessesListContainer');
  if (!forceRebuild && (isUserTypingInContainer(resContainer) || isUserTypingInContainer(wkContainer))) return;

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

export function renderGMStoreManager(charactersMap, campaignState, forceRebuild = false) {
  const container = document.getElementById('gmStoreManagerContent');
  if (!container) return;
  if (!forceRebuild && isUserTypingInContainer(container)) return;

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

export function renderCampaignStoreTab(char, campaignState, currentUser, storeUIState = null, forceRebuild = false) {
  const container = document.getElementById('campaignStoreTabContainer');
  if (!container || !char) return;
  if (!forceRebuild && isUserTypingInContainer(container)) return;

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


export function getCharacterEquippedItemsList(char) {
  if (!char) return [];
  const equipped = [];
  const slotMap = {};
  EQUIP_SLOTS_DEF.forEach(s => { slotMap[s.key] = s; });

  (char.weapons || []).forEach((w, idx) => {
    if (w.equipSlot && slotMap[w.equipSlot]) {
      equipped.push({
        source: 'weapons',
        index: idx,
        slotKey: w.equipSlot,
        slotMeta: slotMap[w.equipSlot],
        name: w.name || 'Arma',
        detail: `Atq ${formatSigned(w.attackBonus ?? 0)} • Dano ${w.damage || '1d6'}${w.isFirearm ? ` • Mun: ${w.ammoCurrent ?? 0}/${w.ammoMax ?? 6}` : ''}`,
        category: 'Arma / Combate'
      });
    }
  });

  (char.equipment || []).forEach((eq, idx) => {
    if (eq.equipSlot && slotMap[eq.equipSlot]) {
      equipped.push({
        source: 'equipment',
        index: idx,
        slotKey: eq.equipSlot,
        slotMeta: slotMap[eq.equipSlot],
        name: eq.name || 'Item',
        detail: eq.description || eq.category || 'Equipamento',
        category: eq.category || 'Equipamento'
      });
    }
  });

  return equipped;
}

export function renderEquippedItemsTab(char, charactersMap, campaignState, currentUser) {
  const container = document.getElementById('equippedItemsTabContainer');
  if (!container || !char) return;

  const isGMUser = currentUser?.role === 'gm';
  const myEquipped = getCharacterEquippedItemsList(char);

  const rightHandItem = myEquipped.find(i => i.slotKey === 'mao_direita' || i.slotKey === 'duas_maos');
  const leftHandItem = myEquipped.find(i => i.slotKey === 'mao_esquerda' || i.slotKey === 'duas_maos');
  const isTwoHanded = myEquipped.some(i => i.slotKey === 'duas_maos');

  const activeCamp = (campaignState?.campaigns || []).find(c => c.id === campaignState?.activeCampaignId) || (campaignState?.campaigns || [])[0];
  const campCharIds = new Set(activeCamp?.characterIds || []);
  const allChars = Object.values(charactersMap || {}).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const partyChars = allChars.filter(c => campCharIds.has(c.id));

  container.innerHTML = `
    <div class="space-y-5">
      <!-- 1. EMPUNHADURA ATUAL DO PERSONAGEM SELECIONADO (MÃO DIREITA, MÃO ESQUERDA, DUAS MÃOS) -->
      <div class="victorian-card-gold rounded-xl p-4 sm:p-5 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-brass-400/25 pb-3">
          <div>
            <span class="text-[10px] font-display uppercase tracking-widest text-brass-400 block">Empunhadura Ativa do Personagem</span>
            <h3 class="font-display font-bold text-base sm:text-lg text-brass-200 flex items-center gap-2">
              <i class="fa-solid fa-hands-holding-circle text-brass-400"></i> Mãos & Itens Equipados de ${escapeHtml(char.name)}
            </h3>
          </div>
          ${isTwoHanded ? `
            <span class="px-2.5 py-1 rounded-full bg-crimson-950 text-crimson-200 border border-crimson-400/50 font-display font-bold text-xs">
              <i class="fa-solid fa-hands-holding mr-1"></i> Empunhando com as Duas Mãos
            </span>
          ` : ''}
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Slot Mão Direita -->
          <div class="bg-obsidian-950/90 border ${rightHandItem ? 'border-amber-400/50' : 'border-slate-800'} rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="font-display font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <i class="fa-solid fa-hand-fist text-amber-400"></i> Mão Direita ${isTwoHanded ? '(Duas Mãos)' : ''}
              </span>
              ${rightHandItem ? `
                <button onclick="app.equipCharacterItem('${rightHandItem.source}', ${rightHandItem.index}, '')"
                  class="px-2 py-0.5 rounded bg-obsidian-800 hover:bg-crimson-950 text-slate-300 hover:text-crimson-300 border border-slate-700 text-[10px] font-bold">
                  Guardar
                </button>
              ` : `<span class="text-[10px] text-slate-500">Mão Livre</span>`}
            </div>
            ${rightHandItem ? `
              <div>
                <div class="text-[10px] font-display uppercase text-brass-400">${escapeHtml(rightHandItem.category)}</div>
                <div class="font-display font-bold text-sm text-brass-200 mt-0.5">${escapeHtml(rightHandItem.name)}</div>
                <div class="text-xs text-slate-400 mt-1 line-clamp-2">${escapeHtml(rightHandItem.detail)}</div>
              </div>
            ` : `
              <div class="py-3 text-center text-xs text-slate-500 italic">Nenhum item equipado na Mão Direita.</div>
            `}
          </div>

          <!-- Slot Mão Esquerda -->
          <div class="bg-obsidian-950/90 border ${leftHandItem ? 'border-astral-400/50' : 'border-slate-800'} rounded-xl p-4 flex flex-col justify-between space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <span class="font-display font-bold text-xs uppercase tracking-wider text-astral-300 flex items-center gap-1.5">
                <i class="fa-solid fa-hand text-astral-400"></i> Mão Esquerda ${isTwoHanded ? '(Ocupada - Duas Mãos)' : ''}
              </span>
              ${(leftHandItem && !isTwoHanded) ? `
                <button onclick="app.equipCharacterItem('${leftHandItem.source}', ${leftHandItem.index}, '')"
                  class="px-2 py-0.5 rounded bg-obsidian-800 hover:bg-crimson-950 text-slate-300 hover:text-crimson-300 border border-slate-700 text-[10px] font-bold">
                  Guardar
                </button>
              ` : `<span class="text-[10px] text-slate-500">${isTwoHanded ? 'Duas Mãos' : 'Mão Livre'}</span>`}
            </div>
            ${leftHandItem ? `
              <div>
                <div class="text-[10px] font-display uppercase text-astral-400">${escapeHtml(leftHandItem.category)}</div>
                <div class="font-display font-bold text-sm text-brass-200 mt-0.5">${escapeHtml(leftHandItem.name)}</div>
                <div class="text-xs text-slate-400 mt-1 line-clamp-2">${escapeHtml(leftHandItem.detail)}</div>
              </div>
            ` : `
              <div class="py-3 text-center text-xs text-slate-500 italic">Nenhum item equipado na Mão Esquerda.</div>
            `}
          </div>
        </div>

        <!-- Seleção Rápida para Equipar Armas e Artefatos do Inventário -->
        <div class="pt-2 border-t border-slate-800/80 space-y-2">
          <h4 class="font-display font-bold text-xs uppercase tracking-wider text-slate-300">
            <i class="fa-solid fa-shield-halved text-brass-400 mr-1"></i> Equipar / Trocar Rapidamente do Seu Inventário:
          </h4>
          <div class="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            ${(char.weapons || []).map((w, idx) => `
              <div class="flex flex-wrap items-center justify-between gap-2 bg-obsidian-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs">
                <div class="min-w-0">
                  <span class="px-1.5 py-0.5 rounded bg-crimson-950 text-crimson-300 border border-crimson-500/30 text-[9px] font-bold uppercase mr-1.5">Arma</span>
                  <strong class="text-brass-200">${escapeHtml(w.name || 'Arma')}</strong>
                  <span class="text-slate-400 ml-1 text-[11px]">(${escapeHtml(w.damage || '1d6')})</span>
                </div>
                <select onchange="app.equipCharacterItem('weapons', ${idx}, this.value)"
                  class="sheet-input px-2.5 py-1 rounded text-xs font-bold ${w.equipSlot ? 'text-amber-300 border-amber-400/50' : 'text-slate-400'}">
                  ${EQUIP_SLOTS_DEF.map(sl => `<option value="${sl.key}" ${(w.equipSlot || '') === sl.key ? 'selected' : ''}>${sl.label}</option>`).join('')}
                </select>
              </div>
            `).join('')}

            ${(char.equipment || []).map((eq, idx) => `
              <div class="flex flex-wrap items-center justify-between gap-2 bg-obsidian-950/80 border border-slate-800 rounded-lg px-3 py-2 text-xs">
                <div class="min-w-0">
                  <span class="px-1.5 py-0.5 rounded bg-eldritch-950 text-eldritch-300 border border-eldritch-500/30 text-[9px] font-bold uppercase mr-1.5">${escapeHtml(eq.category || 'Item')}</span>
                  <strong class="text-amber-200">${escapeHtml(eq.name || 'Item')}</strong>
                </div>
                <select onchange="app.equipCharacterItem('equipment', ${idx}, this.value)"
                  class="sheet-input px-2.5 py-1 rounded text-xs font-bold ${eq.equipSlot ? 'text-amber-300 border-amber-400/50' : 'text-slate-400'}">
                  ${EQUIP_SLOTS_DEF.map(sl => `<option value="${sl.key}" ${(eq.equipSlot || '') === sl.key ? 'selected' : ''}>${sl.label}</option>`).join('')}
                </select>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- 2. VISÃO COMPARTILHADA DA MESA: O QUE CADA JOGADOR DA CAMPANHA ESTÁ USANDO -->
      <div class="victorian-card rounded-xl p-4 sm:p-5 space-y-4">
        <div class="border-b border-brass-400/20 pb-2.5">
          <h3 class="font-display font-bold text-base text-brass-200 flex items-center gap-2">
            <i class="fa-solid fa-users-viewfinder text-brass-400"></i> Itens Equipados pelos Jogadores da Campanha
          </h3>
          <p class="text-xs text-slate-400">Veja em tempo real o que cada personagem da mesa está empunhando na Mão Direita, Mão Esquerda ou Duas Mãos</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          ${partyChars.map(pc => {
            const pcEquipped = getCharacterEquippedItemsList(pc);
            return `
              <div class="bg-obsidian-950/90 border ${pc.id === char.id ? 'border-brass-400/60' : 'border-slate-800'} rounded-xl p-3.5 space-y-2.5">
                <div class="flex items-center gap-2.5 border-b border-slate-800/80 pb-2">
                  ${pc.avatarUrl ? `
                    <img src="${escapeHtml(pc.avatarUrl)}" alt="${escapeHtml(pc.name)}" class="w-10 h-10 rounded-lg object-cover border border-brass-400/50 shrink-0" />
                  ` : `
                    <div class="w-10 h-10 rounded-lg bg-obsidian-900 border border-brass-400/30 flex items-center justify-center text-brass-300 text-sm shrink-0">
                      <i class="fa-solid fa-user-secret"></i>
                    </div>
                  `}
                  <div class="min-w-0">
                    <div class="font-display font-bold text-sm text-brass-200 truncate">${escapeHtml(pc.name)}</div>
                    <div class="text-[10px] text-slate-400 truncate">${escapeHtml(pc.pathway || '')} • ${pc.sequence === 'Humana' ? 'Humano' : `Seq. ${pc.sequence}`}</div>
                  </div>
                </div>

                ${pcEquipped.length === 0 ? `
                  <p class="text-xs text-slate-500 italic py-1">Mãos livres (nenhum item equipado no momento).</p>
                ` : `
                  <div class="space-y-1.5">
                    ${pcEquipped.map(eqItem => `
                      <div class="bg-obsidian-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 flex items-center justify-between gap-2">
                        <div class="min-w-0">
                          <span class="px-1.5 py-0.5 rounded text-[9px] font-display font-bold uppercase border ${eqItem.slotMeta.badgeClass}">
                            <i class="fa-solid ${eqItem.slotMeta.icon} mr-1"></i>${escapeHtml(eqItem.slotMeta.short)}
                          </span>
                          <div class="font-bold text-xs text-slate-100 mt-1 truncate">${escapeHtml(eqItem.name)}</div>
                          <div class="text-[10px] text-slate-400 truncate">${escapeHtml(eqItem.detail)}</div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
}

export function renderOraclePassivesSection(char, charactersMap, campaignState, currentUser, activeOracleTab = 'rolls', forceRebuild = false) {
  const btnRolls = document.getElementById('oracleTabBtn-rolls');
  const btnPassives = document.getElementById('oracleTabBtn-passives');
  const panelRolls = document.getElementById('oracleRollsPanel');
  const panelPassives = document.getElementById('oraclePassivesPanel');
  const badge = document.getElementById('activePassivesCountBadge');
  const miniBar = document.getElementById('oracleActivePassivesMiniBar');

  const activeCamp = (campaignState?.campaigns || []).find(c => c.id === campaignState?.activeCampaignId) || (campaignState?.campaigns || [])[0];
  const campCharIds = new Set(activeCamp?.characterIds || []);
  const allChars = Object.values(charactersMap || {}).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const tableChars = allChars.filter(c => campCharIds.has(c.id));

  // Conta todos os poderes/habilidades e magias ativos na mesa
  const charsWithActivePassives = tableChars.filter(c => Array.isArray(c.activePassives) && c.activePassives.length > 0);
  const totalTableActiveCount = charsWithActivePassives.reduce((acc, c) => acc + (c.activePassives?.length || 0), 0);

  if (badge) {
    badge.textContent = String(totalTableActiveCount);
    badge.className = totalTableActiveCount > 0
      ? 'px-1.5 py-0.2 rounded-full bg-emerald-400 text-obsidian-950 text-[9px] font-extrabold animate-pulse'
      : 'px-1.5 py-0.2 rounded-full bg-obsidian-800 text-slate-400 text-[9px] font-bold';
  }

  const activeBtnClass = 'py-1.5 px-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-brass-400 text-obsidian-950 shadow';
  const inactiveBtnClass = 'py-1.5 px-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 text-slate-300 hover:text-brass-200';

  if (btnRolls && btnPassives && panelRolls && panelPassives) {
    btnRolls.className = activeOracleTab === 'passives' ? inactiveBtnClass : activeBtnClass;
    btnPassives.className = activeOracleTab === 'passives' ? activeBtnClass : inactiveBtnClass;

    panelRolls.classList.toggle('hidden', activeOracleTab === 'passives');
    panelPassives.classList.toggle('hidden', activeOracleTab !== 'passives');
  }

  const isGMUser = currentUser?.role === 'gm';

  // Mini-barra visível mesmo na aba de Dados mostrando os poderes/magias ativos na mesa
  if (miniBar) {
    const myActives = Array.isArray(char?.activePassives) ? char.activePassives : [];
    if (myActives.length === 0) {
      miniBar.innerHTML = '';
    } else {
      miniBar.innerHTML = `
        <div class="bg-eldritch-950/60 border border-eldritch-400/40 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2">
          <div class="flex items-center gap-1.5 flex-wrap min-w-0">
            <span class="text-[9px] font-display font-bold uppercase text-eldritch-300 shrink-0">
              <i class="fa-solid fa-eye text-emerald-400 animate-pulse mr-1"></i>Ativas:
            </span>
            ${myActives.map((ap, apIdx) => `
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-obsidian-950 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold max-w-[160px]">
                <span class="truncate">${escapeHtml(ap.name)}</span>
                <button onclick="app.deactivatePassive(${apIdx})" title="Desligar passiva" class="text-slate-400 hover:text-crimson-400 ml-0.5">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </span>
            `).join('')}
          </div>
          <button onclick="app.switchOracleTab('passives')" class="text-[10px] text-brass-300 hover:underline shrink-0 font-semibold">
            Ver Mesa
          </button>
        </div>
      `;
    }
  }

  if (!panelPassives) return;

  panelPassives.innerHTML = `
    <div class="space-y-3">
      <div class="bg-obsidian-950/90 border border-brass-400/35 rounded-xl p-3 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <h4 class="font-display font-bold text-xs uppercase tracking-wider text-brass-200 flex items-center gap-1.5">
            <i class="fa-solid fa-eye text-emerald-400"></i> Poderes, Habilidades & Magias Ativos na Mesa
          </h4>
          ${(isGMUser && charsWithActivePassives.length > 0) ? `
            <button onclick="app.gmClearAllActivePassives()" title="Desligar todas as passivas ativas de todos os jogadores"
              class="px-2.5 py-1 rounded-lg bg-crimson-950 hover:bg-crimson-600 text-crimson-200 hover:text-white border border-crimson-500/40 text-[10px] font-display font-bold flex items-center gap-1 shrink-0 transition-all">
              <i class="fa-solid fa-power-off"></i> Desligar Todas
            </button>
          ` : ''}
        </div>
        <p class="text-[11px] text-slate-400 leading-snug">
          Modo de visualização sincronizado da campanha. ${isGMUser ? 'Como <strong>Mestre</strong>, você pode desligar qualquer passiva ativa a qualquer momento.' : 'Para ativar um poder ou magia, use o botão <strong>"Manter Ativo na Mesa"</strong> na sua ficha.'}
        </p>
      </div>

      ${charsWithActivePassives.length === 0 ? `
        <div class="bg-obsidian-950/80 border border-slate-800 rounded-xl p-6 text-center space-y-2">
          <i class="fa-solid fa-eye-slash text-2xl text-slate-600"></i>
          <p class="text-xs text-slate-400 font-semibold">Nenhum poder, habilidade ou magia ativo na mesa neste momento.</p>
          <p class="text-[11px] text-slate-500">Quando qualquer jogador ativar sua Visão Espiritual, poder ou magia sustentada na ficha, ela aparecerá aqui para todos acompanharem.</p>
        </div>
      ` : `
        <div class="space-y-3">
          ${charsWithActivePassives.map(c => {
            const canTurnOff = isGMUser || (char && c.id === char.id);
            return `
              <div class="bg-obsidian-950/90 border ${char && c.id === char.id ? 'border-emerald-500/50' : 'border-slate-800'} rounded-xl p-3 space-y-2.5 shadow-md">
                <div class="flex items-center gap-2.5 border-b border-slate-800 pb-2">
                  ${c.avatarUrl ? `
                    <img src="${escapeHtml(c.avatarUrl)}" alt="${escapeHtml(c.name)}" class="w-8 h-8 rounded-lg object-cover border border-brass-400/50 shrink-0" />
                  ` : `
                    <div class="w-8 h-8 rounded-lg bg-obsidian-900 border border-brass-400/30 flex items-center justify-center text-brass-300 text-xs shrink-0">
                      <i class="fa-solid fa-user-secret"></i>
                    </div>
                  `}
                  <div class="min-w-0 flex-1">
                    <div class="font-display font-bold text-xs text-brass-200 truncate">${escapeHtml(c.name)}</div>
                    <div class="text-[10px] text-slate-400 truncate">${escapeHtml(c.pathway || '')} • ${c.sequence === 'Humana' ? 'Humano' : `Seq. ${c.sequence}`}</div>
                  </div>
                  <span class="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold shrink-0">
                    ${c.activePassives.length} ativa${c.activePassives.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div class="space-y-2">
                  ${(c.activePassives || []).map((ap, apIdx) => `
                    <div class="bg-obsidian-900/95 border border-emerald-500/30 rounded-lg p-2.5 space-y-1">
                      <div class="flex items-center justify-between gap-2">
                        <div class="flex items-center gap-1.5 min-w-0">
                          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0"></span>
                          <span class="font-display font-bold text-xs text-emerald-200 truncate">${escapeHtml(ap.name)}</span>
                        </div>
                        <div class="flex items-center gap-1.5 shrink-0">
                          <span class="px-1.5 py-0.5 rounded bg-obsidian-950 border border-slate-800 text-[9px] font-bold uppercase ${ap.sourceType === 'spells' ? 'text-astral-300' : 'text-eldritch-300'}">
                            ${escapeHtml(ap.categoryLabel || (ap.sourceType === 'spells' ? 'Magia / Ritual' : 'Poder / Passiva'))}
                          </span>
                          ${canTurnOff ? `
                            <button onclick="app.gmDeactivatePlayerPassive('${c.id}', ${apIdx})"
                              title="Desligar esta passiva"
                              class="px-2 py-0.5 rounded bg-crimson-950/90 hover:bg-crimson-600 text-crimson-200 hover:text-white border border-crimson-500/40 text-[9px] font-bold flex items-center gap-1 transition-all">
                              <i class="fa-solid fa-power-off"></i> Desligar
                            </button>
                          ` : ''}
                        </div>
                      </div>
                      ${ap.description ? `<p class="text-[11px] text-slate-300 leading-snug">${escapeHtml(ap.description)}</p>` : ''}
                      ${(ap.cost ?? 0) > 0 ? `<div class="text-[10px] text-astral-300 font-semibold">Custo: ${ap.cost} PE</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;
}


export function renderCombatStylesAndProficiencies(char, forceRebuild = false) {
  if (!char) return;

  // 1. Estilos de Combate
  const stylesContainer = document.getElementById('combatStylesListContainer');
  if (stylesContainer) {
    const styles = char.combatStyles || [];
    const existingCards = stylesContainer.querySelectorAll('[data-combat-style-card]');
    if (!forceRebuild && (isUserTypingInContainer(stylesContainer) || (styles.length > 0 && existingCards.length === styles.length))) {
      styles.forEach((st, idx) => {
        setInputValueIfNotFocused(`csName_${idx}`, st.name || '');
        setInputValueIfNotFocused(`csType_${idx}`, st.styleType || COMBAT_STYLE_TYPES[0]);
        setInputValueIfNotFocused(`csBonus_${idx}`, st.bonusText || '');
        setInputValueIfNotFocused(`csDesc_${idx}`, st.description || '');
      });
    } else if (styles.length === 0) {
      stylesContainer.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-3">Nenhum estilo de combate registrado. Clique em "Adicionar Estilo" acima.</p>`;
    } else {
      stylesContainer.innerHTML = styles.map((st, idx) => {
        const isActive = st.isActive !== false;
        return `
          <div data-combat-style-card="${idx}" class="bg-obsidian-950/85 border ${isActive ? 'border-brass-400/50 shadow-md' : 'border-slate-800'} rounded-xl p-3.5 space-y-2.5 transition-all">
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              <div class="sm:col-span-5">
                <label class="block text-[10px] uppercase text-brass-300 mb-0.5">Nome do Estilo / Técnica</label>
                <input id="csName_${idx}" type="text" value="${escapeHtml(st.name || '')}"
                  oninput="app.updateCollectionItem('combatStyles', ${idx}, 'name', this.value)"
                  placeholder="Ex: Tiro Tático Vitoriano / Esgrima de Bengala"
                  class="sheet-input w-full px-2.5 py-1.5 rounded text-xs font-bold text-brass-200" />
              </div>
              <div class="sm:col-span-4">
                <label class="block text-[10px] uppercase text-slate-400 mb-0.5">Foco Tático</label>
                <select id="csType_${idx}" onchange="app.updateCollectionItem('combatStyles', ${idx}, 'styleType', this.value)"
                  class="sheet-input w-full px-2 py-1.5 rounded text-xs text-amber-200 font-semibold">
                  ${COMBAT_STYLE_TYPES.map(t => `<option value="${t}" ${st.styleType === t ? 'selected' : ''}>${t}</option>`).join('')}
                </select>
              </div>
              <div class="sm:col-span-3">
                <label class="block text-[10px] uppercase text-emerald-300 mb-0.5">Bônus / Efeito Passivo</label>
                <input id="csBonus_${idx}" type="text" value="${escapeHtml(st.bonusText || '')}"
                  oninput="app.updateCollectionItem('combatStyles', ${idx}, 'bonusText', this.value)"
                  placeholder="Ex: +2 Pontaria / +1 CA"
                  class="sheet-input w-full px-2.5 py-1.5 rounded text-xs font-bold text-emerald-300" />
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 bg-obsidian-900/75 px-3 py-1.5 rounded-lg border border-slate-800">
              <div class="flex items-center gap-1.5">
                <button onclick="app.moveCollectionItem('combatStyles', ${idx}, -1)" ${idx === 0 ? 'disabled' : ''}
                  class="px-2 py-0.5 rounded bg-obsidian-950 hover:bg-brass-500/20 text-slate-400 hover:text-brass-200 border border-slate-700 text-xs disabled:opacity-30">
                  <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button onclick="app.moveCollectionItem('combatStyles', ${idx}, 1)" ${idx === styles.length - 1 ? 'disabled' : ''}
                  class="px-2 py-0.5 rounded bg-obsidian-950 hover:bg-brass-500/20 text-slate-400 hover:text-brass-200 border border-slate-700 text-xs disabled:opacity-30">
                  <i class="fa-solid fa-arrow-down"></i>
                </button>
                <button onclick="app.toggleCombatStyleActive(${idx})"
                  class="px-2.5 py-0.5 rounded text-[11px] font-display font-bold border transition-all flex items-center gap-1.5 ${isActive ? 'bg-emerald-500 text-obsidian-950 border-emerald-300 shadow' : 'bg-obsidian-950 text-slate-400 border-slate-700 hover:text-slate-200'}">
                  <i class="fa-solid ${isActive ? 'fa-check-circle' : 'fa-circle'}"></i>
                  <span>${isActive ? 'Postura Ativa' : 'Inativo'}</span>
                </button>
              </div>
              <button onclick="app.removeCollectionItem('combatStyles', ${idx})"
                class="p-1.5 rounded bg-obsidian-950 hover:bg-crimson-950 text-slate-500 hover:text-crimson-400 border border-slate-800 text-xs">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>

            <textarea id="csDesc_${idx}" rows="2"
              oninput="app.updateCollectionItem('combatStyles', ${idx}, 'description', this.value)"
              placeholder="Descreva as manobras, vantagens táticas e condições deste estilo de combate..."
              class="sheet-input w-full p-2 rounded text-xs text-slate-300 leading-relaxed">${escapeHtml(st.description || '')}</textarea>
          </div>
        `;
      }).join('');
    }
  }

  // 2. Categorias Gerais de Proficiência (Chips interativos)
  const stdProfContainer = document.getElementById('standardProficienciesContainer');
  if (stdProfContainer) {
    const stdMap = char.standardProficiencies || {};
    stdProfContainer.innerHTML = STANDARD_PROFICIENCIES_DEF.map(p => {
      const trained = !!stdMap[p.key];
      return `
        <button onclick="app.toggleStandardProficiency('${p.key}')"
          class="p-2 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${trained ? 'bg-emerald-950/75 border-emerald-500/50 text-emerald-200 shadow' : 'bg-obsidian-950/70 border-slate-800 text-slate-400 hover:border-slate-700'}">
          <div class="min-w-0">
            <div class="text-[9px] uppercase font-display tracking-wider ${trained ? 'text-emerald-400' : 'text-slate-500'}">${escapeHtml(p.group)}</div>
            <div class="text-xs font-bold truncate">${escapeHtml(p.label)}</div>
          </div>
          <span class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${trained ? 'bg-emerald-400 border-emerald-300 text-obsidian-950' : 'border-slate-700'}">
            ${trained ? '<i class="fa-solid fa-check text-[9px]"></i>' : ''}
          </span>
        </button>
      `;
    }).join('');
  }

  // 3. Lista de Proficiências Específicas (Armas, Armaduras, Itens e Kits)
  const profListContainer = document.getElementById('proficienciesListContainer');
  if (profListContainer) {
    const profs = char.proficienciesList || [];
    const existingRows = profListContainer.querySelectorAll('[data-prof-item-row]');
    if (!forceRebuild && (isUserTypingInContainer(profListContainer) || (profs.length > 0 && existingRows.length === profs.length))) {
      profs.forEach((pr, idx) => {
        setInputValueIfNotFocused(`prfName_${idx}`, pr.name || '');
        setInputValueIfNotFocused(`prfCat_${idx}`, pr.category || PROFICIENCY_CATEGORIES[0]);
        setInputValueIfNotFocused(`prfLvl_${idx}`, pr.level || PROFICIENCY_LEVELS[0]);
        setInputValueIfNotFocused(`prfNotes_${idx}`, pr.notes || '');
      });
    } else if (profs.length === 0) {
      profListContainer.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-2">Nenhuma especialização específica cadastrada.</p>`;
    } else {
      profListContainer.innerHTML = profs.map((pr, idx) => `
        <div data-prof-item-row="${idx}" class="bg-obsidian-950/85 border border-slate-800 rounded-xl p-3 space-y-2">
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
            <div class="sm:col-span-5">
              <label class="block text-[9px] uppercase text-slate-400">Item, Arma ou Armadura</label>
              <input id="prfName_${idx}" type="text" value="${escapeHtml(pr.name || '')}"
                oninput="app.updateCollectionItem('proficienciesList', ${idx}, 'name', this.value)"
                placeholder="Ex: Revólveres, Explosivos, Ferramentas de Roubo..."
                class="sheet-input w-full px-2.5 py-1 rounded text-xs font-bold text-brass-200" />
            </div>
            <div class="sm:col-span-3">
              <label class="block text-[9px] uppercase text-slate-400">Categoria</label>
              <select id="prfCat_${idx}" onchange="app.updateCollectionItem('proficienciesList', ${idx}, 'category', this.value)"
                class="sheet-input w-full px-2 py-1 rounded text-xs text-amber-200">
                ${PROFICIENCY_CATEGORIES.map(c => `<option value="${c}" ${pr.category === c ? 'selected' : ''}>${c}</option>`).join('')}
              </select>
            </div>
            <div class="sm:col-span-3">
              <label class="block text-[9px] uppercase text-emerald-300">Grau de Domínio</label>
              <select id="prfLvl_${idx}" onchange="app.updateCollectionItem('proficienciesList', ${idx}, 'level', this.value)"
                class="sheet-input w-full px-2 py-1 rounded text-xs font-bold text-emerald-300">
                ${PROFICIENCY_LEVELS.map(l => `<option value="${l}" ${pr.level === l ? 'selected' : ''}>${l}</option>`).join('')}
              </select>
            </div>
            <div class="sm:col-span-1 flex justify-end pt-3">
              <button onclick="app.removeCollectionItem('proficienciesList', ${idx})"
                class="p-1.5 rounded bg-obsidian-900 hover:bg-crimson-950 text-slate-500 hover:text-crimson-400 border border-slate-800 text-xs">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
          <input id="prfNotes_${idx}" type="text" value="${escapeHtml(pr.notes || '')}"
            oninput="app.updateCollectionItem('proficienciesList', ${idx}, 'notes', this.value)"
            placeholder="Observações, bônus concedidos ou origem do treinamento..."
            class="sheet-input w-full px-2.5 py-1 rounded text-[11px] text-slate-300" />
        </div>
      `).join('');
    }
  }
}


// ---------------------------------------------------------------------------
// 12. ABA DE CAMPANHA DOS JOGADORES (RESUMO, DOSSIÊS COM IMAGENS, PROGRESSO SEMANAL, ANOTAÇÕES COMPARTILHADAS & BACKSTORIES)
// ---------------------------------------------------------------------------
export function renderPlayerCampaignHub(char, charactersMap, campaignState, currentUser, hubState = {}, forceRebuild = false) {
  const container = document.getElementById('playerCampaignHubContainer');
  if (!container) return;
  if (!forceRebuild && isUserTypingInContainer(container)) return;

  const isGMUser = currentUser?.role === 'gm';
  const campaigns = campaignState?.campaigns || [];
  const activeCamp = (char && campaigns.find(c => Array.isArray(c.characterIds) && c.characterIds.includes(char.id)))
    || campaigns.find(c => c.id === campaignState?.activeCampaignId)
    || campaigns[0];

  if (!activeCamp) {
    container.innerHTML = `
      <div class="victorian-card-gold rounded-xl p-8 text-center space-y-3">
        <i class="fa-solid fa-compass text-3xl text-brass-400"></i>
        <h3 class="font-display font-bold text-lg text-brass-200">Nenhuma Campanha Ativa</h3>
        <p class="text-xs text-slate-400">Aguarde o Mestre criar ou ativar uma campanha para visualizar o resumo, dossiês e atualizações.</p>
      </div>
    `;
    return;
  }

  // Garante arrays e campos padrão na campanha ativa
  if (!Array.isArray(activeCamp.dossiers)) {
    activeCamp.dossiers = JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_DOSSIERS));
  }
  if (!Array.isArray(activeCamp.weeklyUpdates)) {
    activeCamp.weeklyUpdates = JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_UPDATES));
  }
  if (!Array.isArray(activeCamp.sharedNotes)) {
    activeCamp.sharedNotes = JSON.parse(JSON.stringify(DEFAULT_SHARED_NOTES));
  }
  if (!activeCamp.campaignSummary) {
    activeCamp.campaignSummary = 'No Reino de Loen, entre a fumaça das máquinas a vapor e os mistérios da Quarta Época, os integrantes da campanha investigam ocorrências sobrenaturais, digerem suas poções Beyonder e enfrentam conspirações ocultas sob o olhar do Nevoeiro Cinza.';
  }
  if (!activeCamp.currentObjectives) {
    activeCamp.currentObjectives = '1. Investigar as pistas recentes descobertas na cidade.\n2. Proteger as âncoras e progredir na digestão da poção.\n3. Compartilhar descobertas e preparar o grupo para a próxima missão.';
  }
  if (!activeCamp.currentArc) {
    activeCamp.currentArc = `Arco Atual • Semana ${activeCamp.currentWeek || 1}`;
  }
  const progressPct = clamp(Number(activeCamp.campaignProgressPct ?? 25), 0, 100);

  const subTab = hubState.subTab || 'resumo';
  const dossierCatFilter = hubState.dossierCat || 'all';
  const dossierSearch = (hubState.dossierSearch || '').toLowerCase().trim();
  const noteCatFilter = hubState.noteCat || 'all';

  const campCharIds = new Set(activeCamp.characterIds || []);
  const allChars = Object.values(charactersMap || {}).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const partyChars = allChars.filter(c => campCharIds.has(c.id));

  const visibleDossiers = activeCamp.dossiers.filter(d => isGMUser || d.visibleToPlayers !== false);
  const filteredDossiers = visibleDossiers.filter(d => {
    const matchCat = dossierCatFilter === 'all' || d.category === dossierCatFilter;
    const matchTxt = !dossierSearch ||
      (d.title || '').toLowerCase().includes(dossierSearch) ||
      (d.subtitle || '').toLowerCase().includes(dossierSearch) ||
      (d.description || '').toLowerCase().includes(dossierSearch);
    return matchCat && matchTxt;
  });

  const filteredNotes = activeCamp.sharedNotes.filter(n => {
    return noteCatFilter === 'all' || n.category === noteCatFilter;
  });

  // Combina atualizações semanais publicadas pelo Mestre + histórico de semanas encerradas
  const combinedUpdates = [
    ...(activeCamp.weeklyUpdates || []).map(u => ({ ...u, _source: 'manual' })),
    ...(activeCamp.weekHistory || []).map(wh => ({
      id: wh.id,
      weekNumber: wh.weekNumber,
      title: wh.title || `Fechamento da Semana ${wh.weekNumber}`,
      arcTag: `Resumo de Passagem de Semana`,
      dateStr: wh.dateStr || `Semana ${wh.weekNumber}`,
      content: wh.generalNarrative || 'Semana concluída pelo Mestre.',
      highlights: '',
      playerSummaries: wh.playerSummaries || [],
      _source: 'weekHistory'
    }))
  ].sort((a, b) => (Number(b.weekNumber) || 0) - (Number(a.weekNumber) || 0));

  const editingDossier = hubState.editingDossierId
    ? activeCamp.dossiers.find(d => d.id === hubState.editingDossierId)
    : null;

  const editingNote = hubState.editingNoteId
    ? activeCamp.sharedNotes.find(n => n.id === hubState.editingNoteId)
    : null;

  const subTabsDef = [
    { key: 'resumo', label: 'Resumo da Campanha', icon: 'fa-compass', count: null },
    { key: 'dossies', label: 'Dossiês (Locais, NPCs, Itens, Criaturas & Caminhos)', icon: 'fa-folder-open', count: visibleDossiers.length },
    { key: 'progresso', label: 'Progresso & Semanas', icon: 'fa-calendar-check', count: combinedUpdates.length },
    { key: 'anotacoes', label: 'Anotações Compartilhadas', icon: 'fa-note-sticky', count: activeCamp.sharedNotes.length },
    { key: 'backstories', label: 'Backstories & Personagens', icon: 'fa-masks-theater', count: partyChars.length }
  ];

  container.innerHTML = `
    <div class="space-y-5">
      <!-- 1. CABEÇALHO GERAL DA CAMPANHA & BARRA DE PROGRESSO -->
      <div class="victorian-card-gold rounded-xl p-4 sm:p-6 space-y-4">
        <div class="flex flex-wrap items-start justify-between gap-4 border-b border-brass-400/25 pb-4">
          <div class="space-y-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-400/40 font-display font-bold text-xs">
                <i class="fa-solid fa-calendar-week mr-1"></i> Semana Atual #${activeCamp.currentWeek || 1}
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-eldritch-950 text-eldritch-300 border border-eldritch-400/40 font-display font-bold text-xs">
                <i class="fa-solid fa-book-bookmark mr-1"></i> ${escapeHtml(activeCamp.currentArc || 'Arco I')}
              </span>
              <span class="px-2.5 py-0.5 rounded-full bg-obsidian-900 text-brass-300 border border-brass-400/30 font-display font-semibold text-xs">
                <i class="fa-solid fa-users mr-1"></i> ${partyChars.length} Integrante(s)
              </span>
            </div>
            <h2 class="font-display font-extrabold text-xl sm:text-2xl text-brass-200 tracking-wide pt-1">
              ${escapeHtml(activeCamp.name || 'Campanha Beyonder')}
            </h2>
            <p class="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              ${escapeHtml(activeCamp.description || '')}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button onclick="app.setViewMode('sheet')" class="px-4 py-2 rounded-lg bg-obsidian-800 hover:bg-brass-400 text-brass-200 hover:text-obsidian-950 border border-brass-400/45 font-display font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow">
              <i class="fa-solid fa-scroll"></i> Voltar para Minha Ficha
            </button>
          </div>
        </div>

        <!-- Barra de Progresso do Arco / Campanha -->
        <div class="bg-obsidian-950/80 border border-slate-800 rounded-xl p-3 space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <span class="font-display font-bold uppercase tracking-wider text-brass-300 flex items-center gap-1.5">
              <i class="fa-solid fa-hourglass-half text-amber-400"></i> Progresso do Arco Atual (${escapeHtml(activeCamp.currentArc || 'Campanha')})
            </span>
            <span class="font-display font-extrabold text-amber-300">${progressPct}% Concluído</span>
          </div>
          <div class="w-full h-2.5 bg-obsidian-900 rounded-full overflow-hidden border border-slate-800">
            <div class="h-full bg-gradient-to-r from-amber-600 via-brass-400 to-emerald-400 transition-all duration-300" style="width: ${progressPct}%"></div>
          </div>
        </div>

        <!-- SUB-ABAS DA CAMPANHA -->
        <div class="flex flex-wrap gap-1.5 pt-1">
          ${subTabsDef.map(st => {
            const isActive = subTab === st.key;
            return `
              <button id="campSubTabBtn-${st.key}" onclick="app.switchCampaignHubSubTab('${st.key}')"
                class="flex-1 min-w-[140px] py-2.5 px-3 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${isActive ? 'bg-brass-400 text-obsidian-950 shadow-md' : 'bg-obsidian-900/85 hover:bg-obsidian-800 text-slate-300 border border-slate-800'}">
                <i class="fa-solid ${st.icon}"></i>
                <span>${st.label}</span>
                ${st.count !== null ? `<span class="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-obsidian-950 text-brass-300' : 'bg-obsidian-950 text-slate-400'}">${st.count}</span>` : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- =====================================================================
           SUB-ABA 1: RESUMO DA CAMPANHA & VISÃO GERAL
           ===================================================================== -->
      ${subTab === 'resumo' ? `
        <div class="space-y-5">
          ${isGMUser ? `
            <!-- Editor Exclusivo do Mestre para o Resumo da Campanha -->
            <div class="victorian-card rounded-xl p-4 sm:p-5 border border-amber-400/45 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                <div>
                  <span class="text-[10px] font-display uppercase tracking-widest text-amber-400 block">Edição Exclusiva do Mestre</span>
                  <h3 class="font-display font-bold text-sm sm:text-base text-brass-200 flex items-center gap-2">
                    <i class="fa-solid fa-crown text-amber-400"></i> Editar Resumo Geral, Objetivos & Progresso da Campanha
                  </h3>
                </div>
                <button onclick="app.gmSaveCampaignOverview()" class="px-4 py-2 rounded-lg bg-brass-400 hover:bg-brass-300 text-obsidian-950 font-display font-extrabold text-xs uppercase flex items-center gap-1.5 shadow">
                  <i class="fa-solid fa-floppy-disk"></i> Salvar Resumo da Campanha
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div class="sm:col-span-5">
                  <label class="block text-[10px] uppercase text-brass-300 mb-1">Título da Campanha</label>
                  <input id="campOverviewNameInput" type="text" value="${escapeHtml(activeCamp.name || '')}" class="sheet-input w-full px-3 py-1.5 rounded-lg text-xs font-bold text-brass-200" />
                </div>
                <div class="sm:col-span-5">
                  <label class="block text-[10px] uppercase text-eldritch-300 mb-1">Capítulo / Arco Atual</label>
                  <input id="campOverviewArcInput" type="text" value="${escapeHtml(activeCamp.currentArc || '')}" placeholder="Ex: Arco I — Sombras sobre Tingen" class="sheet-input w-full px-3 py-1.5 rounded-lg text-xs text-eldritch-200" />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-[10px] uppercase text-amber-300 mb-1">Progresso (%)</label>
                  <input id="campOverviewPctInput" type="number" min="0" max="100" value="${progressPct}" class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs text-center font-bold text-amber-200" />
                </div>
              </div>

              <div>
                <label class="block text-[10px] uppercase text-slate-400 mb-1">Sinopse Curta (Subtítulo)</label>
                <input id="campOverviewDescInput" type="text" value="${escapeHtml(activeCamp.description || '')}" class="sheet-input w-full px-3 py-1.5 rounded-lg text-xs text-slate-200" />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] uppercase text-brass-300 mb-1">Resumo Completo da História & Ambientação da Campanha</label>
                  <textarea id="campOverviewSummaryInput" rows="4" class="sheet-input w-full p-2.5 rounded-lg text-xs text-slate-100 leading-relaxed">${escapeHtml(activeCamp.campaignSummary || '')}</textarea>
                </div>
                <div>
                  <label class="block text-[10px] uppercase text-emerald-300 mb-1">Objetivos Atuais & Missões em Andamento do Grupo</label>
                  <textarea id="campOverviewObjectivesInput" rows="4" class="sheet-input w-full p-2.5 rounded-lg text-xs text-slate-100 leading-relaxed">${escapeHtml(activeCamp.currentObjectives || '')}</textarea>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Painel de Resumo da Campanha e Objetivos para todos os Jogadores -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div class="lg:col-span-7 victorian-card rounded-xl p-5 space-y-3 border-l-4 border-l-brass-400">
              <div class="flex items-center justify-between border-b border-brass-400/20 pb-2.5">
                <h3 class="font-display font-bold text-base sm:text-lg text-brass-200 flex items-center gap-2">
                  <i class="fa-solid fa-book-open text-brass-400"></i> Resumo da Campanha & Contexto Histórico
                </h3>
                <span class="text-[11px] text-slate-400 font-display">Crônica Oficial</span>
              </div>
              <p class="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">${escapeHtml(activeCamp.campaignSummary || '')}</p>
            </div>

            <div class="lg:col-span-5 victorian-card rounded-xl p-5 space-y-3 border-l-4 border-l-emerald-500">
              <div class="flex items-center justify-between border-b border-brass-400/20 pb-2.5">
                <h3 class="font-display font-bold text-base sm:text-lg text-emerald-300 flex items-center gap-2">
                  <i class="fa-solid fa-bullseye text-emerald-400"></i> Objetivos Atuais do Grupo
                </h3>
                <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold uppercase">Em Curso</span>
              </div>
              <p class="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">${escapeHtml(activeCamp.currentObjectives || '')}</p>
            </div>
          </div>

          <!-- Atalhos Rápidos das Seções da Campanha -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div onclick="app.switchCampaignHubSubTab('dossies')" class="victorian-card rounded-xl p-4 cursor-pointer hover:border-brass-400 transition-all flex items-center justify-between gap-3">
              <div>
                <div class="text-[10px] font-display uppercase text-brass-400">Arquivos do Mestre</div>
                <div class="font-display font-bold text-sm text-brass-200 mt-0.5">Dossiês Ilustrados</div>
                <div class="text-xs text-slate-400 mt-0.5">${visibleDossiers.length} locais, NPCs e itens</div>
              </div>
              <div class="w-10 h-10 rounded-xl bg-obsidian-950 border border-brass-400/40 flex items-center justify-center text-brass-300 text-lg">
                <i class="fa-solid fa-folder-open"></i>
              </div>
            </div>

            <div onclick="app.switchCampaignHubSubTab('progresso')" class="victorian-card rounded-xl p-4 cursor-pointer hover:border-amber-400 transition-all flex items-center justify-between gap-3">
              <div>
                <div class="text-[10px] font-display uppercase text-amber-400">Linha do Tempo</div>
                <div class="font-display font-bold text-sm text-brass-200 mt-0.5">Progresso Semanal</div>
                <div class="text-xs text-slate-400 mt-0.5">${combinedUpdates.length} atualização(ões)</div>
              </div>
              <div class="w-10 h-10 rounded-xl bg-obsidian-950 border border-amber-400/40 flex items-center justify-center text-amber-300 text-lg">
                <i class="fa-solid fa-calendar-check"></i>
              </div>
            </div>

            <div onclick="app.switchCampaignHubSubTab('anotacoes')" class="victorian-card rounded-xl p-4 cursor-pointer hover:border-astral-400 transition-all flex items-center justify-between gap-3">
              <div>
                <div class="text-[10px] font-display uppercase text-astral-400">Quadro Cooperativo</div>
                <div class="font-display font-bold text-sm text-brass-200 mt-0.5">Notas Compartilhadas</div>
                <div class="text-xs text-slate-400 mt-0.5">${activeCamp.sharedNotes.length} nota(s) do grupo</div>
              </div>
              <div class="w-10 h-10 rounded-xl bg-obsidian-950 border border-astral-400/40 flex items-center justify-center text-astral-300 text-lg">
                <i class="fa-solid fa-note-sticky"></i>
              </div>
            </div>

            <div onclick="app.switchCampaignHubSubTab('backstories')" class="victorian-card rounded-xl p-4 cursor-pointer hover:border-eldritch-400 transition-all flex items-center justify-between gap-3">
              <div>
                <div class="text-[10px] font-display uppercase text-eldritch-400">Histórias & Perfis</div>
                <div class="font-display font-bold text-sm text-brass-200 mt-0.5">Backstories do Grupo</div>
                <div class="text-xs text-slate-400 mt-0.5">${partyChars.length} personagem(ns)</div>
              </div>
              <div class="w-10 h-10 rounded-xl bg-obsidian-950 border border-eldritch-400/40 flex items-center justify-center text-eldritch-300 text-lg">
                <i class="fa-solid fa-masks-theater"></i>
              </div>
            </div>
          </div>

          <!-- Integrantes da Campanha -->
          <div class="victorian-card rounded-xl p-5 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-brass-400/20 pb-2.5">
              <div>
                <h3 class="font-display font-bold text-base text-brass-200 flex items-center gap-2">
                  <i class="fa-solid fa-users text-brass-400"></i> Personagens Integrantes da Campanha
                </h3>
                <p class="text-xs text-slate-400">Clique em um integrante para ler sua Backstory e informações públicas compartilhadas</p>
              </div>
              <button onclick="app.switchCampaignHubSubTab('backstories')" class="text-xs font-display font-bold text-brass-300 hover:underline">
                Ver Todas as Backstories <i class="fa-solid fa-arrow-right ml-1"></i>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              ${partyChars.map(pc => `
                <div onclick="app.switchCampaignHubSubTab('backstories')" class="bg-obsidian-950/90 border border-slate-800 hover:border-brass-400/50 rounded-xl p-3.5 cursor-pointer transition-all flex items-center gap-3">
                  ${pc.avatarUrl ? `
                    <img src="${escapeHtml(pc.avatarUrl)}" alt="${escapeHtml(pc.name)}" class="w-12 h-14 rounded-lg object-cover border border-brass-400/50 shrink-0" />
                  ` : `
                    <div class="w-12 h-14 rounded-lg bg-obsidian-900 border border-brass-400/30 flex items-center justify-center text-brass-300 text-lg shrink-0">
                      <i class="fa-solid fa-user-secret"></i>
                    </div>
                  `}
                  <div class="min-w-0 flex-1">
                    <div class="text-[10px] font-display uppercase text-eldritch-300 truncate">${escapeHtml(pc.pathway || 'Beyonder')} • ${pc.sequence === 'Humana' ? 'Humano' : `Seq. ${pc.sequence}`}</div>
                    <h4 class="font-display font-bold text-sm text-brass-200 truncate">${escapeHtml(pc.name)}</h4>
                    <div class="text-[11px] text-slate-400 truncate"><i class="fa-solid fa-user text-[9px] mr-1"></i>${escapeHtml(pc.player || 'Jogador')} • ${escapeHtml(pc.organization || 'Independente')}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      ` : ''}

      <!-- =====================================================================
           SUB-ABA 2: DOSSIÊS DO MESTRE (LOCAIS, PERSONAGENS & ITENS COM IMAGENS)
           ===================================================================== -->
      ${subTab === 'dossies' ? `
        <div class="space-y-5">
          ${isGMUser ? `
            <!-- Formulário Exclusivo do Mestre para Criar ou Editar Dossiês com Imagem -->
            <div class="victorian-card-gold rounded-xl p-4 sm:p-5 border border-amber-400/50 space-y-3.5">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-brass-400/25 pb-2.5">
                <div>
                  <span class="text-[10px] font-display uppercase tracking-widest text-amber-400 block">Arquivo Confidencial do Mestre</span>
                  <h3 class="font-display font-bold text-base text-brass-200 flex items-center gap-2">
                    <i class="fa-solid fa-folder-plus text-amber-400"></i> ${editingDossier ? `Editando Dossiê: ${escapeHtml(editingDossier.title)}` : 'Criar Novo Dossiê Ilustrado (Local, Personagem, Item, Criatura ou Caminho Beyonder)'}
                  </h3>
                </div>
                ${editingDossier ? `
                  <button onclick="app.gmCancelEditDossier()" class="px-3 py-1 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 text-xs font-bold">
                    Cancelar Edição
                  </button>
                ` : ''}
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div class="sm:col-span-3">
                  <label class="block text-[10px] uppercase text-brass-300 mb-1">Categoria do Dossiê *</label>
                  <select id="newDossierCategorySelect" class="sheet-input w-full px-3 py-2 rounded-lg text-xs font-bold text-amber-200">
                    <option value="locais" ${(editingDossier?.category || 'locais') === 'locais' ? 'selected' : ''}>Local / Região</option>
                    <option value="personagens" ${editingDossier?.category === 'personagens' ? 'selected' : ''}>Personagem / NPC</option>
                    <option value="itens" ${editingDossier?.category === 'itens' ? 'selected' : ''}>Item / Artefato</option>
                    <option value="criaturas" ${editingDossier?.category === 'criaturas' ? 'selected' : ''}>Criatura / Monstro</option>
                    <option value="caminhos" ${editingDossier?.category === 'caminhos' ? 'selected' : ''}>Caminho Beyonder</option>
                    <option value="organizacoes" ${editingDossier?.category === 'organizacoes' ? 'selected' : ''}>Organização Beyonder / Culto</option>
                  </select>
                </div>
                <div class="sm:col-span-5">
                  <label class="block text-[10px] uppercase text-brass-300 mb-1">Título do Dossiê (Local, NPC, Item, Criatura ou Caminho) *</label>
                  <input id="newDossierTitleInput" type="text" value="${escapeHtml(editingDossier?.title || '')}"
                    placeholder="Ex: Catedral de Santa Selena / Capitão Dunn Smith / Artefato 2-049"
                    class="sheet-input w-full px-3 py-2 rounded-lg text-xs font-bold text-slate-100" />
                </div>
                <div class="sm:col-span-4">
                  <label class="block text-[10px] uppercase text-slate-400 mb-1">Subtítulo / Localização / Classificação</label>
                  <input id="newDossierSubtitleInput" type="text" value="${escapeHtml(editingDossier?.subtitle || '')}"
                    placeholder="Ex: Tingen • Sede dos Falcões Noturnos"
                    class="sheet-input w-full px-3 py-2 rounded-lg text-xs text-slate-300" />
                </div>
              </div>

              <!-- Upload de Imagem ou URL para o Dossiê -->
              <div class="bg-obsidian-950/85 border border-slate-800 rounded-xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div class="flex items-center gap-2.5 flex-1">
                  <button onclick="app.triggerDossierImageUpload('new')" type="button"
                    class="px-3.5 py-2 rounded-lg bg-brass-500/25 hover:bg-brass-400 text-brass-200 hover:text-obsidian-950 border border-brass-400/45 font-display font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all">
                    <i class="fa-solid fa-upload"></i> Enviar Imagem
                  </button>
                  <input id="newDossierImageUrlInput" type="text"
                    value="${escapeHtml(hubState.newDossierDraftImage || editingDossier?.imageUrl || '')}"
                    placeholder="Ou cole aqui a URL da imagem do Local, Personagem ou Item..."
                    class="sheet-input flex-1 px-3 py-1.5 rounded-lg text-xs text-slate-200" />
                </div>
                <label class="inline-flex items-center gap-2 text-xs text-emerald-300 font-semibold cursor-pointer shrink-0 px-2">
                  <input id="newDossierVisibleCheck" type="checkbox" ${(editingDossier ? editingDossier.visibleToPlayers !== false : true) ? 'checked' : ''} class="accent-emerald-400 rounded" />
                  <span>Visível aos Jogadores</span>
                </label>
              </div>

              <div>
                <label class="block text-[10px] uppercase text-slate-300 mb-1">Descrição / Informações Descobertas *</label>
                <textarea id="newDossierDescInput" rows="3"
                  placeholder="Escreva a descrição, história, aparência e segredos revelados para os jogadores..."
                  class="sheet-input w-full p-2.5 rounded-lg text-xs text-slate-100 leading-relaxed">${escapeHtml(editingDossier?.description || '')}</textarea>
              </div>

              <div class="flex justify-end">
                <button onclick="app.gmCreateOrUpdateDossier()" class="px-5 py-2 rounded-lg bg-gradient-to-r from-brass-400 to-amber-500 hover:from-brass-300 hover:to-amber-400 text-obsidian-950 font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all">
                  <i class="fa-solid fa-check"></i> ${editingDossier ? 'Salvar Alterações no Dossiê' : 'Publicar Dossiê na Campanha'}
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Barra de Filtro de Dossiês (Locais, Personagens, Itens) & Busca -->
          <div class="victorian-card rounded-xl p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap gap-1.5">
                ${DOSSIER_CATEGORIES.map(cat => {
                  const active = dossierCatFilter === cat.key;
                  const countInCat = cat.key === 'all'
                    ? visibleDossiers.length
                    : visibleDossiers.filter(d => d.category === cat.key).length;
                  return `
                    <button onclick="app.setCampaignDossierCatFilter('${cat.key}')"
                      class="px-3.5 py-2 rounded-lg font-display font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 border ${active ? 'bg-brass-400 text-obsidian-950 border-brass-300 shadow' : 'bg-obsidian-950 text-slate-300 border-slate-800 hover:border-brass-400/40'}">
                      <i class="fa-solid ${cat.icon}"></i>
                      <span>${cat.label}</span>
                      <span class="px-1.5 py-0.2 rounded-full text-[10px] ${active ? 'bg-obsidian-950 text-brass-300' : 'bg-obsidian-900 text-slate-400'}">${countInCat}</span>
                    </button>
                  `;
                }).join('')}
              </div>

              <div class="relative w-full sm:w-64">
                <i class="fa-solid fa-magnifying-glass text-slate-500 absolute left-3 top-2.5 text-xs"></i>
                <input id="dossierSearchInput" type="text" value="${escapeHtml(hubState.dossierSearch || '')}"
                  oninput="app.setCampaignDossierSearch(this.value)"
                  placeholder="Buscar local, NPC, item, criatura ou caminho..."
                  class="sheet-input pl-8 pr-3 py-1.5 rounded-lg text-xs w-full" />
              </div>
            </div>
          </div>

          <!-- Grid de Cards de Dossiês com Imagens -->
          <div id="campaignDossiersGridContainer">
            ${renderDossiersGridCardsHtml(filteredDossiers, isGMUser)}
          </div>
        </div>
      ` : ''}

      <!-- =====================================================================
           SUB-ABA 3: PROGRESSO DA CAMPANHA & ATUALIZAÇÕES SEMANAIS
           ===================================================================== -->
      ${subTab === 'progresso' ? `
        <div class="space-y-5">
          ${isGMUser ? `
            <!-- Formulário do Mestre para Publicar Nova Atualização Semanal -->
            <div class="victorian-card-gold rounded-xl p-4 sm:p-5 border border-emerald-500/40 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-brass-400/20 pb-2.5">
                <div>
                  <span class="text-[10px] font-display uppercase tracking-widest text-emerald-400 block">Registro de Progresso do Mestre</span>
                  <h3 class="font-display font-bold text-base text-brass-200 flex items-center gap-2">
                    <i class="fa-solid fa-feather-pointed text-emerald-400"></i> Publicar Nova Atualização Semanal da Campanha
                  </h3>
                </div>
                <button onclick="app.openPassWeekModal()" class="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-400 text-emerald-200 hover:text-obsidian-950 border border-emerald-400/40 font-display font-bold text-xs flex items-center gap-1.5 transition-all">
                  <i class="fa-solid fa-forward-fast"></i> Passar a Semana Completa
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div class="sm:col-span-2">
                  <label class="block text-[10px] uppercase text-brass-300 mb-1">Semana #</label>
                  <input id="newUpdateWeekInput" type="number" min="1" value="${activeCamp.currentWeek || 1}" class="sheet-input w-full px-2.5 py-1.5 rounded-lg text-xs text-center font-bold text-amber-200" />
                </div>
                <div class="sm:col-span-6">
                  <label class="block text-[10px] uppercase text-brass-300 mb-1">Título da Atualização / Sessão *</label>
                  <input id="newUpdateTitleInput" type="text" placeholder="Ex: Semana 2 — O Caso da Chaminé Vermelha" class="sheet-input w-full px-3 py-1.5 rounded-lg text-xs font-bold text-slate-100" />
                </div>
                <div class="sm:col-span-4">
                  <label class="block text-[10px] uppercase text-eldritch-300 mb-1">Tag de Arco / Marco</label>
                  <input id="newUpdateArcTagInput" type="text" value="${escapeHtml(activeCamp.currentArc || 'Arco I')}" placeholder="Ex: Arco 1 • Investigação" class="sheet-input w-full px-3 py-1.5 rounded-lg text-xs text-eldritch-200" />
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] uppercase text-slate-300 mb-1">Relato Narrativo da Semana / O que Aconteceu *</label>
                  <textarea id="newUpdateContentInput" rows="3" placeholder="Resuma os principais acontecimentos da semana ou sessão para os jogadores acompanharem o avanço da história..." class="sheet-input w-full p-2.5 rounded-lg text-xs text-slate-100 leading-relaxed"></textarea>
                </div>
                <div>
                  <label class="block text-[10px] uppercase text-amber-300 mb-1">Destaques, Descobertas & Consequências (Opcional)</label>
                  <textarea id="newUpdateHighlightsInput" rows="3" placeholder="• Pista encontrada no porto&#10;• Reunião do Clube de Tarô realizada..." class="sheet-input w-full p-2.5 rounded-lg text-xs text-amber-100 leading-relaxed"></textarea>
                </div>
              </div>

              <div class="flex justify-end">
                <button onclick="app.gmPublishWeeklyUpdate()" class="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-obsidian-950 font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all">
                  <i class="fa-solid fa-paper-plane"></i> Publicar Atualização Semanal
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Linha do Tempo de Atualizações Semanais -->
          <div class="victorian-card rounded-xl p-5 space-y-4">
            <div class="border-b border-brass-400/20 pb-3">
              <h3 class="font-display font-bold text-base sm:text-lg text-brass-200 flex items-center gap-2">
                <i class="fa-solid fa-timeline text-brass-400"></i> Linha do Tempo — Atualizações Semanais da Campanha
              </h3>
              <p class="text-xs text-slate-400">Acompanhe semana a semana o avanço da campanha, os capítulos concluídos e os resumos de passagem de semana</p>
            </div>

            ${combinedUpdates.length === 0 ? `
              <p class="text-xs text-slate-500 italic text-center py-6">Nenhuma atualização semanal registrada ainda nesta campanha.</p>
            ` : `
              <div class="space-y-4">
                ${combinedUpdates.map(up => `
                  <div class="bg-obsidian-950/90 border border-brass-400/35 rounded-xl p-4 sm:p-5 space-y-3 relative">
                    <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-400/40 font-display font-extrabold text-xs">
                          Semana #${up.weekNumber || 1}
                        </span>
                        ${up.arcTag ? `<span class="px-2 py-0.5 rounded bg-eldritch-950 text-eldritch-300 border border-eldritch-500/35 text-[10px] font-bold uppercase">${escapeHtml(up.arcTag)}</span>` : ''}
                        <h4 class="font-display font-bold text-sm sm:text-base text-brass-200">${escapeHtml(up.title || `Semana ${up.weekNumber}`)}</h4>
                      </div>
                      <div class="flex items-center gap-2">
                        <span class="text-[11px] text-slate-400">${escapeHtml(up.dateStr || '')}</span>
                        ${(isGMUser && up._source === 'manual') ? `
                          <button onclick="app.gmDeleteWeeklyUpdate('${up.id}')" title="Remover atualização" class="text-slate-500 hover:text-crimson-400 text-xs px-1">
                            <i class="fa-solid fa-trash"></i>
                          </button>
                        ` : ''}
                      </div>
                    </div>

                    <p class="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">${escapeHtml(up.content || '')}</p>

                    ${up.highlights ? `
                      <div class="bg-obsidian-900/90 border border-amber-400/30 rounded-lg p-3 space-y-1">
                        <div class="text-[10px] font-display font-bold uppercase text-amber-300">
                          <i class="fa-solid fa-star mr-1"></i> Destaques & Descobertas da Semana:
                        </div>
                        <p class="text-xs text-slate-200 whitespace-pre-line leading-relaxed">${escapeHtml(up.highlights)}</p>
                      </div>
                    ` : ''}

                    ${(up.playerSummaries && up.playerSummaries.length > 0) ? `
                      <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                        ${up.playerSummaries.map(ps => `
                          <div class="bg-obsidian-900/95 border border-slate-800 rounded-lg p-2.5 space-y-1">
                            <div class="font-display font-bold text-xs text-brass-300">${escapeHtml(ps.charName)}</div>
                            <div class="text-[10px] text-emerald-300 font-semibold">${escapeHtml(ps.recoveryText || '')}</div>
                            ${ps.eventsText ? `<div class="text-[11px] text-slate-300">${escapeHtml(ps.eventsText)}</div>` : ''}
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      ` : ''}

      <!-- =====================================================================
           SUB-ABA 4: ANOTAÇÕES COMPARTILHADAS ENTRE OS JOGADORES
           ===================================================================== -->
      ${subTab === 'anotacoes' ? `
        <div class="space-y-5">
          <!-- Formulário para Qualquer Jogador Publicar ou Editar Anotação Compartilhada -->
          <div class="victorian-card-gold rounded-xl p-4 sm:p-5 space-y-3.5">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-brass-400/25 pb-2.5">
              <div>
                <span class="text-[10px] font-display uppercase tracking-widest text-astral-300 block">Caderno Coletivo da Mesa</span>
                <h3 class="font-display font-bold text-base text-brass-200 flex items-center gap-2">
                  <i class="fa-solid fa-pen-fancy text-astral-400"></i> ${editingNote ? `Editando Anotação: ${escapeHtml(editingNote.title)}` : 'Compartilhar Nova Anotação com os Outros Jogadores'}
                </h3>
                <p class="text-xs text-slate-400">
                  Publique pistas, teorias sobre a campanha, planos táticos ou anotações de sessão para que todos os jogadores vejam nesta aba.
                </p>
              </div>
              ${editingNote ? `
                <button onclick="app.cancelEditSharedNote()" class="px-3 py-1 rounded-lg bg-obsidian-800 text-slate-300 text-xs font-bold">
                  Cancelar Edição
                </button>
              ` : ''}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div class="sm:col-span-4">
                <label class="block text-[10px] uppercase text-astral-300 mb-1">Categoria da Anotação</label>
                <select id="sharedNoteCategorySelect" class="sheet-input w-full px-3 py-2 rounded-lg text-xs font-bold text-astral-200">
                  ${SHARED_NOTE_CATEGORIES.map(c => `<option value="${c}" ${(editingNote?.category || SHARED_NOTE_CATEGORIES[0]) === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
              </div>
              <div class="sm:col-span-8">
                <label class="block text-[10px] uppercase text-brass-300 mb-1">Título da Anotação / Pista *</label>
                <input id="sharedNoteTitleInput" type="text" value="${escapeHtml(editingNote?.title || '')}"
                  placeholder="Ex: Pistas sobre o culto em Tingen / Ingredientes que precisamos comprar..."
                  class="sheet-input w-full px-3.5 py-2 rounded-lg text-xs font-bold text-slate-100" />
              </div>
            </div>

            <div>
              <label class="block text-[10px] uppercase text-slate-300 mb-1">Conteúdo da Anotação Compartilhada *</label>
              <textarea id="sharedNoteContentInput" rows="3"
                placeholder="Escreva aqui sua anotação para compartilhar com todos os jogadores da campanha..."
                class="sheet-input w-full p-2.5 rounded-lg text-xs text-slate-100 leading-relaxed">${escapeHtml(editingNote?.content || '')}</textarea>
            </div>

            <div class="flex items-center justify-between gap-2">
              <span class="text-[11px] text-slate-400">
                <i class="fa-solid fa-user-pen text-brass-400 mr-1"></i> Publicando como: <strong class="text-brass-200">${escapeHtml(char ? char.name : (currentUser?.name || 'Mestre'))}</strong>
              </span>
              <button onclick="app.addOrUpdateSharedNote()" class="px-5 py-2 rounded-lg bg-gradient-to-r from-astral-500 to-cyan-500 hover:from-astral-400 hover:to-cyan-400 text-obsidian-950 font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all">
                <i class="fa-solid fa-share-nodes"></i> ${editingNote ? 'Salvar Alterações na Nota' : 'Publicar no Mural do Grupo'}
              </button>
            </div>
          </div>

          <!-- Filtro por Categoria de Anotações Compartilhadas -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button onclick="app.setSharedNoteCategoryFilter('all')"
              class="px-3 py-1.5 rounded-lg text-xs font-display font-bold border transition-all ${noteCatFilter === 'all' ? 'bg-brass-400 text-obsidian-950 border-brass-300' : 'bg-obsidian-950 text-slate-300 border-slate-800'}">
              Todas (${activeCamp.sharedNotes.length})
            </button>
            ${SHARED_NOTE_CATEGORIES.map(c => {
              const cnt = activeCamp.sharedNotes.filter(n => n.category === c).length;
              return `
                <button onclick="app.setSharedNoteCategoryFilter('${c}')"
                  class="px-3 py-1.5 rounded-lg text-xs font-display font-bold border transition-all ${noteCatFilter === c ? 'bg-astral-400 text-obsidian-950 border-astral-300' : 'bg-obsidian-950 text-slate-300 border-slate-800 hover:border-astral-400/40'}">
                  ${escapeHtml(c)} (${cnt})
                </button>
              `;
            }).join('')}
          </div>

          <!-- Lista de Anotações Compartilhadas -->
          ${filteredNotes.length === 0 ? `
            <div class="victorian-card rounded-xl p-8 text-center text-xs text-slate-400">
              Nenhuma anotação compartilhada encontrada nesta categoria. Seja o primeiro a compartilhar uma nota acima!
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${filteredNotes.map(note => {
                const authorChar = charactersMap?.[note.authorCharId];
                const avatar = authorChar?.avatarUrl || '';
                const canModify = isGMUser || (char && note.authorCharId === char.id) || (currentUser && note.authorUid && note.authorUid === currentUser.uid);
                return `
                  <div class="victorian-card rounded-xl p-4 flex flex-col justify-between border border-slate-800 hover:border-astral-400/40 space-y-3">
                    <div class="space-y-2.5">
                      <div class="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                        <div class="flex items-center gap-2.5 min-w-0">
                          ${avatar ? `
                            <img src="${escapeHtml(avatar)}" alt="${escapeHtml(note.authorName || '')}" class="w-9 h-9 rounded-lg object-cover border border-brass-400/50 shrink-0" />
                          ` : `
                            <div class="w-9 h-9 rounded-lg bg-obsidian-900 border border-astral-400/35 flex items-center justify-center text-astral-300 text-xs shrink-0">
                              <i class="fa-solid fa-feather-pointed"></i>
                            </div>
                          `}
                          <div class="min-w-0">
                            <div class="flex items-center gap-1.5 flex-wrap">
                              <span class="px-2 py-0.2 rounded bg-astral-950 text-astral-300 border border-astral-500/40 text-[9px] font-display font-bold uppercase">
                                ${escapeHtml(note.category || 'Nota')}
                              </span>
                              <span class="text-[10px] text-slate-400">${escapeHtml(note.dateStr || `Semana ${note.weekNumber || 1}`)}</span>
                            </div>
                            <div class="text-xs font-bold text-brass-200 truncate mt-0.5">
                              Por: ${escapeHtml(note.authorName || 'Jogador')}
                            </div>
                          </div>
                        </div>

                        ${canModify ? `
                          <div class="flex items-center gap-1 shrink-0">
                            <button onclick="app.startEditSharedNote('${note.id}')" title="Editar anotação" class="p-1.5 rounded bg-obsidian-900 hover:bg-brass-500/20 text-slate-400 hover:text-brass-200 border border-slate-800 text-xs">
                              <i class="fa-solid fa-pen"></i>
                            </button>
                            <button onclick="app.deleteSharedNote('${note.id}')" title="Excluir anotação" class="p-1.5 rounded bg-obsidian-900 hover:bg-crimson-950 text-slate-400 hover:text-crimson-300 border border-slate-800 text-xs">
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        ` : ''}
                      </div>

                      <h4 class="font-display font-bold text-sm sm:text-base text-amber-200">${escapeHtml(note.title || 'Anotação')}</h4>
                      <p class="text-xs text-slate-200 leading-relaxed whitespace-pre-line">${escapeHtml(note.content || '')}</p>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      ` : ''}

      <!-- =====================================================================
           SUB-ABA 5: ABA DEDICADA DE BACKSTORIES & INFORMAÇÕES DOS PERSONAGENS
           ===================================================================== -->
      ${subTab === 'backstories' ? `
        <div class="space-y-5">
          ${char ? `
            <!-- Editor da Backstory & Controle de Permissão de Compartilhamento do Personagem Ativo -->
            <div class="victorian-card-gold rounded-xl p-4 sm:p-5 space-y-3.5 border ${char.shareBackstory === true ? 'border-emerald-500/50' : 'border-amber-500/45'}">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-brass-400/25 pb-3">
                <div>
                  <span class="text-[10px] font-display uppercase tracking-widest text-eldritch-300 block">Apresentação & Permissão de Compartilhamento</span>
                  <h3 class="font-display font-bold text-base sm:text-lg text-brass-200 flex items-center gap-2">
                    <i class="fa-solid fa-user-shield text-eldritch-400"></i> Minha Backstory & Informações (${escapeHtml(char.name)})
                  </h3>
                  <p class="text-xs text-slate-400">
                    Sua Backstory <strong>não é compartilhada automaticamente</strong>. Os outros jogadores só poderão visualizá-la se você ativar a permissão de compartilhamento abaixo.
                  </p>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <button onclick="app.syncPublicBackstoryFromSheet()" title="Copiar o texto da caixa de Background da aba Notas da sua ficha para o rascunho abaixo"
                    class="px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-brass-500/20 text-brass-200 border border-brass-400/35 text-xs font-semibold flex items-center gap-1.5 transition-all">
                    <i class="fa-solid fa-copy text-brass-400"></i> Importar Background da Ficha
                  </button>
                  <button onclick="app.saveMyPublicBackstory()"
                    class="px-4 py-1.5 rounded-lg bg-obsidian-800 hover:bg-brass-400 text-brass-200 hover:text-obsidian-950 border border-brass-400/45 font-display font-extrabold text-xs uppercase flex items-center gap-1.5 shadow transition-all">
                    <i class="fa-solid fa-floppy-disk"></i> Salvar Textos
                  </button>
                </div>
              </div>

              <!-- Barra de Permissão do Jogador: Compartilhar vs Manter Oculto -->
              <div class="p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${char.shareBackstory === true ? 'bg-emerald-950/50 border-emerald-500/50' : 'bg-obsidian-950/90 border-amber-500/40'}">
                <div class="flex items-center gap-3">
                  <div class="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0 ${char.shareBackstory === true ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40' : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'}">
                    <i class="fa-solid ${char.shareBackstory === true ? 'fa-lock-open' : 'fa-lock'}"></i>
                  </div>
                  <div>
                    <div class="font-display font-bold text-xs sm:text-sm ${char.shareBackstory === true ? 'text-emerald-200' : 'text-amber-200'}">
                      ${char.shareBackstory === true
                        ? 'Compartilhamento Autorizado por Você (Visível para os Jogadores)'
                        : 'Backstory Privada / Bloqueada (Oculta dos Outros Jogadores)'}
                    </div>
                    <p class="text-[11px] text-slate-400">
                      ${char.shareBackstory === true
                        ? 'Os demais jogadores da campanha podem ler o texto que você escreveu abaixo. Clique ao lado se quiser ocultar novamente.'
                        : 'Nenhum outro jogador consegue ver sua backstory ou informações no momento. Clique ao lado somente quando quiser autorizar a leitura.'}
                    </p>
                  </div>
                </div>

                <button onclick="app.toggleShareMyBackstory()"
                  class="px-4 py-2 rounded-lg font-display font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all shrink-0 ${char.shareBackstory === true ? 'bg-crimson-950 hover:bg-crimson-600 text-crimson-200 hover:text-white border border-crimson-500/50' : 'bg-emerald-500 hover:bg-emerald-400 text-obsidian-950'}">
                  <i class="fa-solid ${char.shareBackstory === true ? 'fa-eye-slash' : 'fa-share-nodes'}"></i>
                  <span>${char.shareBackstory === true ? 'Ocultar / Revogar Permissão' : 'Autorizar & Compartilhar Backstory'}</span>
                </button>
              </div>

              <div>
                <label class="block text-[10px] uppercase text-brass-300 mb-1">Frase Marcante / Lema Público ou Alcunha Conhecida</label>
                <input id="myPublicQuoteInput" type="text"
                  value="${escapeHtml(char.publicQuote || '')}"
                  oninput="app.updatePublicProfileField('publicQuote', this.value)"
                  placeholder="Ex: 'Louvado seja O Tolo!' / Consultor de História e Detetive Particular em Tingen"
                  class="sheet-input w-full px-3.5 py-2 rounded-lg text-xs italic text-amber-200" />
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label class="block text-[10px] uppercase text-amber-300 font-bold mb-1">
                    <i class="fa-solid fa-scroll mr-1"></i> Backstory do Personagem (Só aparece se você autorizar acima)
                  </label>
                  <textarea id="myPublicBackstoryInput" rows="5"
                    oninput="app.updatePublicProfileField('publicBackstory', this.value)"
                    placeholder="Conte a história que deseja compartilhar quando autorizar a visualização..."
                    class="sheet-input w-full p-3 rounded-xl text-xs text-slate-100 leading-relaxed">${escapeHtml(char.publicBackstory || '')}</textarea>
                </div>
                <div>
                  <label class="block text-[10px] uppercase text-eldritch-300 font-bold mb-1">
                    <i class="fa-solid fa-id-card mr-1"></i> Outras Informações (Aparência, Personalidade, Curiosidades & Rumores)
                  </label>
                  <textarea id="myPublicInfoInput" rows="5"
                    oninput="app.updatePublicProfileField('publicInfo', this.value)"
                    placeholder="Descreva a aparência física, vestimentas vitorianas, hábitos ou detalhes que deseja compartilhar com o grupo..."
                    class="sheet-input w-full p-3 rounded-xl text-xs text-slate-100 leading-relaxed">${escapeHtml(char.publicInfo || '')}</textarea>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- Galeria de Backstories & Informações de Todos os Personagens Escalados na Campanha -->
          <div class="space-y-3.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="font-display font-bold text-base sm:text-lg text-brass-200 flex items-center gap-2">
                <i class="fa-solid fa-masks-theater text-brass-400"></i> Backstories & Informações dos Personagens da Campanha (${partyChars.length})
              </h3>
              <span class="text-xs text-slate-400">Exibe apenas as backstories autorizadas pelos próprios jogadores</span>
            </div>

            ${partyChars.length === 0 ? `
              <div class="victorian-card rounded-xl p-8 text-center text-xs text-slate-400">
                Nenhum personagem foi escalado nesta campanha pelo Mestre ainda.
              </div>
            ` : `
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                ${partyChars.map(pc => {
                  const isMine = char && pc.id === char.id;
                  const isShared = pc.shareBackstory === true;
                  const pubBackstory = (pc.publicBackstory && pc.publicBackstory.trim())
                    ? pc.publicBackstory
                    : 'Nenhuma backstory escrita ainda.';
                  const pubInfo = (pc.publicInfo && pc.publicInfo.trim())
                    ? pc.publicInfo
                    : 'Nenhuma informação adicional cadastrada.';
                  const pubQuote = pc.publicQuote || '';

                  return `
                    <div class="victorian-card rounded-xl p-5 border ${isMine ? 'border-brass-400/60' : 'border-slate-800'} flex flex-col justify-between space-y-4">
                      <div class="space-y-3">
                        <div class="flex items-start gap-3.5 border-b border-slate-800 pb-3.5">
                          ${pc.avatarUrl ? `
                            <img src="${escapeHtml(pc.avatarUrl)}" alt="${escapeHtml(pc.name)}"
                              onclick="app.openCharacterAvatarPreview('${pc.id}')"
                              class="w-16 h-20 sm:w-20 sm:h-24 rounded-xl object-cover border-2 border-brass-400/60 shrink-0 shadow-lg cursor-zoom-in" />
                          ` : `
                            <div class="w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-obsidian-950 border border-brass-400/35 flex flex-col items-center justify-center text-brass-300/70 shrink-0">
                              <i class="fa-solid fa-user-secret text-2xl"></i>
                              <span class="text-[9px] uppercase font-display mt-1">Sem Foto</span>
                            </div>
                          `}
                          <div class="min-w-0 flex-1 space-y-1">
                            <div class="flex items-center gap-1.5 flex-wrap">
                              <span class="px-2 py-0.5 rounded bg-eldritch-950 text-eldritch-300 border border-eldritch-500/40 text-[10px] font-display font-bold uppercase">
                                ${escapeHtml(pc.pathway || 'Beyonder')} • ${pc.sequence === 'Humana' ? 'Humano' : `Seq. ${pc.sequence}`}
                              </span>
                              ${pc.organization ? `
                                <span class="px-2 py-0.5 rounded bg-obsidian-950 text-brass-300 border border-brass-400/30 text-[10px] font-semibold">
                                  ${escapeHtml(pc.organization)}
                                </span>
                              ` : ''}
                              ${isShared ? `
                                <span class="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold uppercase">
                                  <i class="fa-solid fa-lock-open mr-1"></i>Compartilhada
                                </span>
                              ` : `
                                <span class="px-2 py-0.5 rounded bg-obsidian-950 text-slate-400 border border-slate-700 text-[9px] font-bold uppercase">
                                  <i class="fa-solid fa-lock mr-1 text-amber-400"></i>Privada
                                </span>
                              `}
                            </div>
                            <h4 class="font-display font-bold text-lg text-brass-200 leading-tight">${escapeHtml(pc.name)}</h4>
                            <div class="text-xs text-slate-400">
                              <i class="fa-solid fa-user text-[10px] mr-1"></i> Jogador(a): <strong class="text-slate-200">${escapeHtml(pc.player || 'Jogador')}</strong>
                              ${pc.potionName ? ` • Título/Poção: <span class="text-amber-200">${escapeHtml(pc.potionName)}</span>` : ''}
                            </div>
                            ${(isShared && pubQuote) ? `
                              <blockquote class="text-xs italic text-amber-200/90 border-l-2 border-brass-400/50 pl-2.5 pt-0.5">
                                "${escapeHtml(pubQuote)}"
                              </blockquote>
                            ` : ''}
                          </div>
                        </div>

                        ${isShared ? `
                          <div class="space-y-3">
                            <div class="bg-obsidian-950/85 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
                              <div class="text-[10px] font-display font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-scroll text-amber-400"></i> Backstory & Origem do Personagem
                              </div>
                              <p class="text-xs text-slate-200 leading-relaxed whitespace-pre-line">${escapeHtml(pubBackstory)}</p>
                            </div>

                            <div class="bg-obsidian-950/85 border border-slate-800/90 rounded-xl p-3.5 space-y-1">
                              <div class="text-[10px] font-display font-bold uppercase tracking-wider text-eldritch-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-id-card text-eldritch-400"></i> Aparência, Personalidade & Outras Informações
                              </div>
                              <p class="text-xs text-slate-200 leading-relaxed whitespace-pre-line">${escapeHtml(pubInfo)}</p>
                            </div>
                          </div>
                        ` : `
                          <div class="bg-obsidian-950/80 border border-slate-800/90 rounded-xl p-5 text-center space-y-1.5">
                            <i class="fa-solid fa-lock text-amber-400/80 text-lg"></i>
                            <div class="font-display font-bold text-xs uppercase tracking-wider text-slate-300">
                              Backstory Mantida em Segredo pelo Jogador
                            </div>
                            <p class="text-[11px] text-slate-400 max-w-md mx-auto">
                              O jogador responsável por <strong>${escapeHtml(pc.name)}</strong> ainda não autorizou o compartilhamento da sua backstory e informações pessoais com o grupo.
                            </p>
                          </div>
                        `}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

export function renderDossiersGridCardsHtml(filteredDossiers, isGMUser = false) {
  if (!filteredDossiers || filteredDossiers.length === 0) {
    return `
      <div class="victorian-card rounded-xl p-8 text-center text-xs text-slate-400">
        Nenhum dossiê encontrado para este filtro. ${isGMUser ? 'Use o formulário acima para criar dossiês sobre Locais, Personagens e Itens com imagens!' : 'O Mestre ainda não revelou dossiês nesta categoria.'}
      </div>
    `;
  }

  const catMap = {};
  DOSSIER_CATEGORIES.forEach(c => { catMap[c.key] = c; });

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${filteredDossiers.map(d => {
        const catMeta = catMap[d.category] || { short: 'Dossiê', icon: 'fa-folder', badgeClass: 'bg-obsidian-900 text-brass-300 border-brass-400/40' };
        const hasImg = Boolean(d.imageUrl && String(d.imageUrl).trim());
        const hiddenForPlayers = d.visibleToPlayers === false;

        return `
          <div class="victorian-card rounded-xl overflow-hidden border ${hiddenForPlayers ? 'border-dashed border-crimson-500/60 opacity-75' : 'border-brass-400/35 hover:border-brass-400'} flex flex-col justify-between transition-all shadow-lg">
            <div>
              <!-- Imagem do Dossiê -->
              <div class="h-44 bg-obsidian-950 relative overflow-hidden border-b border-slate-800 flex items-center justify-center group">
                ${hasImg ? `
                  <img src="${escapeHtml(d.imageUrl)}" alt="${escapeHtml(d.title)}"
                    onclick="app.openDossierImageModal('${d.id}')"
                    class="w-full h-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-300" />
                  <button onclick="app.openDossierImageModal('${d.id}')" title="Ampliar imagem do dossiê"
                    class="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-brass-400 text-brass-200 hover:text-obsidian-950 text-[10px] font-display font-bold flex items-center gap-1 border border-brass-400/40">
                    <i class="fa-solid fa-magnifying-glass-plus"></i> Ampliar
                  </button>
                ` : `
                  <div class="flex flex-col items-center justify-center text-slate-600 gap-1.5">
                    <i class="fa-solid ${catMeta.icon} text-3xl text-brass-400/40"></i>
                    <span class="text-[10px] font-display uppercase tracking-wider">Sem Imagem Anexada</span>
                  </div>
                `}

                <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-display font-extrabold uppercase border shadow ${catMeta.badgeClass}">
                    <i class="fa-solid ${catMeta.icon} mr-1"></i>${escapeHtml(catMeta.short || catMeta.label)}
                  </span>
                  ${hiddenForPlayers ? `
                    <span class="px-2 py-0.5 rounded-full bg-crimson-950 text-crimson-200 border border-crimson-500/50 text-[9px] font-bold uppercase">
                      <i class="fa-solid fa-eye-slash mr-1"></i>Oculto p/ Jogadores
                    </span>
                  ` : ''}
                </div>
              </div>

              <!-- Corpo do Dossiê -->
              <div class="p-4 space-y-2">
                ${d.subtitle ? `<div class="text-[10px] font-display uppercase tracking-wider text-amber-300 font-semibold">${escapeHtml(d.subtitle)}</div>` : ''}
                <h4 class="font-display font-bold text-base text-brass-200 leading-snug">${escapeHtml(d.title || 'Dossiê')}</h4>
                <p class="text-xs text-slate-300 leading-relaxed whitespace-pre-line">${escapeHtml(d.description || '')}</p>
              </div>
            </div>

            ${isGMUser ? `
              <div class="px-4 py-2.5 bg-obsidian-950/90 border-t border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div class="flex items-center gap-1.5">
                  <button onclick="app.triggerDossierImageUpload('${d.id}')" title="Enviar ou trocar imagem deste dossiê"
                    class="px-2.5 py-1 rounded bg-obsidian-800 hover:bg-brass-500/20 text-brass-200 border border-brass-400/35 font-semibold flex items-center gap-1">
                    <i class="fa-solid fa-image"></i> Foto
                  </button>
                  <button onclick="app.gmStartEditDossier('${d.id}')" title="Editar textos e categoria deste dossiê"
                    class="px-2.5 py-1 rounded bg-obsidian-800 hover:bg-amber-500/20 text-amber-200 border border-amber-400/35 font-semibold flex items-center gap-1">
                    <i class="fa-solid fa-pen"></i> Editar
                  </button>
                </div>
                <div class="flex items-center gap-1.5">
                  <button onclick="app.gmToggleDossierVisibility('${d.id}')"
                    title="Revelar ou ocultar este dossiê para os jogadores"
                    class="px-2 py-1 rounded border ${hiddenForPlayers ? 'bg-crimson-950/80 text-crimson-300 border-crimson-500/40' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'}">
                    <i class="fa-solid ${hiddenForPlayers ? 'fa-eye-slash' : 'fa-eye'}"></i>
                  </button>
                  <button onclick="app.gmDeleteDossier('${d.id}')" title="Excluir dossiê"
                    class="px-2 py-1 rounded bg-obsidian-900 hover:bg-crimson-950 text-slate-400 hover:text-crimson-300 border border-slate-800">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}
