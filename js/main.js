import {
  ATTRIBUTES_DEF,
  SAVING_THROWS_DEF,
  SKILLS_DEF,
  DEFAULT_TURN_ACTIONS,
  DEFAULT_COMBAT_STATE,
  DEFAULT_CAMPAIGN_STATE,
  WEEK_DAYS_DEF,
  THEME_PRESETS,
  DEFAULT_USER_THEME,
  createDefaultWeeklyDowntime,
  createCollectionItemTemplate
} from './config/constants.js';
import { createDefaultCharacter, getSampleCharactersList } from './models/characterFactory.js';
import { clamp, calcAttrMod, formatSigned, escapeHtml, setInputValueIfNotFocused, isUserTypingAnywhere } from './utils/helpers.js';
import { toggleSoundState, playDiceSound, playCombatAlarmSound, showToast } from './services/audioAndToast.js';
import { rollSingleDie, evaluateBonusDie, buildD20RollResult, buildFormulaRollResult } from './services/diceEngine.js';
import { StorageService } from './services/storageService.js';
import {
  getActionTypeMeta,
  getTestLabelByKey,
  populatePathwaysDatalist,
  renderSyncStatusBadge,
  applyActiveVisualTheme,
  renderThemeCustomizerModalContent,
  renderAccountManagerModalContent,
  getVisibleCharactersForUser,
  renderTopNavigation,
  renderCombatBar,
  renderGMDashboard,
  renderCharacterSheet,
  renderSavingThrowsSection,
  renderSkillsList,
  renderSheetTabsUI,
  renderPlayerActionEconomyAndFilter,
  renderWeaponsList,
  renderEquipmentList,
  renderMysticList,
  renderMutationsList,
  renderResistancesAndWeaknesses,
  renderCampaignStoreTab,
  renderDiceLogs
} from './ui/renderers.js';

class BeyonderGrimoireController {
  constructor() {
    this.charactersMap = {};
    this.activeCharacterId = null;
    this.viewMode = 'sheet';
    this.activeGMSubTab = 'overview'; // 'overview' | 'campaign'
    this.activeSheetTab = 'combat';
    this.rollMode = 'normal';
    this.skillSortMode = 'alpha'; // 'alpha' | 'attr'
    this.actionFilterMode = 'all';
    this.combatBarExpanded = true;
    this.combatState = { ...DEFAULT_COMBAT_STATE };
    this.campaignState = JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_STATE));
    this.diceLogs = [];
    this.saveTimeout = null;
    this.lastLocalEditTime = 0;
    this.seqProgTargetCharId = null;
    this.deleteTargetCharId = null;
    this.storeUIState = { subTab: 'items', categoryFilter: 'all', searchText: '' };

    this.currentUser = null;
    this.authModalTab = 'login'; // 'login' | 'register'
    this.userTheme = { ...DEFAULT_USER_THEME };
    this.lastCombatActiveFlag = false;

    this.storage = new StorageService({
      onCharactersChanged: (loadedMap) => {
        const activelyTyping = isUserTypingAnywhere() || (Date.now() - this.lastLocalEditTime < 1400);
        if (activelyTyping && this.activeCharacterId && this.charactersMap[this.activeCharacterId] && loadedMap[this.activeCharacterId]) {
          // Mantém a versão local em digitação da ficha ativa para não cancelar o foco/prompt do usuário
          const localActive = this.charactersMap[this.activeCharacterId];
          this.charactersMap = { ...loadedMap, [this.activeCharacterId]: localActive };
          renderTopNavigation(this.charactersMap, this.activeCharacterId, this.viewMode, this.campaignState, this.currentUser);
          renderCombatBar(this.combatState, this.charactersMap, this.viewMode, this.campaignState, this.activeCharacterId, this.currentUser);
          return;
        }
        this.charactersMap = loadedMap;
        this.ensureValidActiveCharacterForUser();
        this.renderAll();
      },
      onLogsChanged: (logs) => {
        this.diceLogs = logs;
        renderDiceLogs(this.diceLogs, this.campaignState, this.activeCharacterId, this.viewMode, this.currentUser);
      },
      onCombatChanged: (combat) => {
        const prevActive = !!this.lastCombatActiveFlag;
        this.combatState = combat || { ...DEFAULT_COMBAT_STATE };
        const nowActive = !!this.combatState.isActive;
        if (prevActive !== nowActive) {
          this.lastCombatActiveFlag = nowActive;
          playCombatAlarmSound(nowActive);
        }
        applyActiveVisualTheme(this.userTheme, nowActive);
        renderCombatBar(this.combatState, this.charactersMap, this.viewMode, this.campaignState, this.activeCharacterId, this.currentUser);
      },
      onCampaignsChanged: (campaigns) => {
        if (campaigns && Array.isArray(campaigns.campaigns)) {
          this.campaignState = campaigns;
        }
        this.renderAll();
      },
      onAuthChanged: (user) => {
        this.currentUser = user;
        if (user && user.theme) {
          this.userTheme = { ...DEFAULT_USER_THEME, ...user.theme };
        } else {
          this.userTheme = { ...DEFAULT_USER_THEME };
        }
        if (!user || user.role !== 'gm') {
          this.viewMode = 'sheet';
        }
        this.ensureValidActiveCharacterForUser();
        applyActiveVisualTheme(this.userTheme, !!this.combatState?.isActive);
        this.syncAuthGateOverlay();
        this.renderAll();
      },
      onStatusChanged: (online, uid) => {
        renderSyncStatusBadge(online, uid);
      }
    });
  }

  async init() {
    populatePathwaysDatalist();
    await this.storage.init();
  }

  isGMUser() {
    return this.currentUser?.role === 'gm';
  }

  ensureValidActiveCharacterForUser() {
    const visible = getVisibleCharactersForUser(this.charactersMap, this.currentUser);
    if (visible.length === 0) {
      this.activeCharacterId = null;
      return;
    }
    const stillVisible = visible.some(ch => ch.id === this.activeCharacterId);
    if (!stillVisible) {
      this.activeCharacterId = visible[0].id;
    }
  }

  getActiveChar() {
    if (!this.activeCharacterId) return null;
    const ch = this.charactersMap[this.activeCharacterId];
    if (!ch) return null;
    if (this.isGMUser()) return ch;
    const visible = getVisibleCharactersForUser(this.charactersMap, this.currentUser);
    return visible.some(v => v.id === ch.id) ? ch : null;
  }

  getActiveCampaign() {
    const list = this.campaignState?.campaigns || [];
    return list.find(c => c.id === this.campaignState?.activeCampaignId) || list[0] || null;
  }

  renderAll() {
    applyActiveVisualTheme(this.userTheme, !!this.combatState?.isActive);
    renderTopNavigation(this.charactersMap, this.activeCharacterId, this.viewMode, this.campaignState, this.currentUser);
    renderCombatBar(this.combatState, this.charactersMap, this.viewMode, this.campaignState, this.activeCharacterId, this.currentUser);

    const gmView = document.getElementById('gmDashboardView');
    const sheetView = document.getElementById('characterSheetView');

    if (this.viewMode === 'gm' && this.isGMUser()) {
      gmView.classList.remove('hidden');
      sheetView.classList.add('hidden');
      renderGMDashboard(this.charactersMap, this.campaignState, this.activeGMSubTab, this.currentUser);
    } else {
      gmView.classList.add('hidden');
      sheetView.classList.remove('hidden');
      renderCharacterSheet(
        this.getActiveChar(),
        this.activeSheetTab,
        this.skillSortMode,
        this.actionFilterMode,
        this.campaignState,
        this.currentUser,
        this.storeUIState
      );
    }
    renderDiceLogs(this.diceLogs, this.campaignState, this.activeCharacterId, this.viewMode, this.currentUser);
  }

  scheduleAutoSave() {
    const char = this.getActiveChar();
    if (!char) return;
    this.lastLocalEditTime = Date.now();

    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(async () => {
      await this.storage.saveCharacter(char, this.charactersMap);
      renderCombatBar(this.combatState, this.charactersMap, this.viewMode, this.campaignState, this.activeCharacterId, this.currentUser);
    }, 650);
  }

  // --- AUTENTICAÇÃO E SEGURANÇA (LOGIN DE JOGADORES E MESTRE) ---
  syncAuthGateOverlay() {
    const modal = document.getElementById('authGateModal');
    if (!modal) return;
    this.syncQuickDemoVisibility();
    if (!this.currentUser) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    } else {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  syncQuickDemoVisibility() {
    let showDemo = true;
    try {
      showDemo = localStorage.getItem('grimorio_beyonder_show_demo_btns_v1') === 'true';
    } catch (_) {}
    const demoBox = document.getElementById('quickDemoLoginSection');
    if (demoBox) {
      demoBox.classList.toggle('hidden', !showDemo);
    }
    const checkEl = document.getElementById('toggleQuickDemoCheck');
    if (checkEl) {
      checkEl.checked = showDemo;
    }
  }

  toggleQuickDemoButtons(enabled) {
    try {
      localStorage.setItem('grimorio_beyonder_show_demo_btns_v1', enabled ? 'true' : 'false');
    } catch (_) {}
    this.syncQuickDemoVisibility();
    if (!enabled) {
      const emailEl = document.getElementById('loginEmailInput');
      const passEl = document.getElementById('loginPasswordInput');
      if (emailEl) emailEl.value = '';
      if (passEl) passEl.value = '';
    }
    showToast(enabled ? 'Botões de demonstração exibidos na tela de login.' : 'Botões de demonstração ocultados para maior segurança!');
  }

  openAuthModal() {
    const modal = document.getElementById('authGateModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  switchAuthModalTab(tab) {
    this.authModalTab = tab;
    const loginForm = document.getElementById('authLoginFormPanel');
    const regForm = document.getElementById('authRegisterFormPanel');
    const btnLogin = document.getElementById('authTabBtn-login');
    const btnReg = document.getElementById('authTabBtn-register');
    const errBox = document.getElementById('authErrorBanner');
    if (errBox) errBox.classList.add('hidden');

    if (tab === 'register') {
      loginForm?.classList.add('hidden');
      regForm?.classList.remove('hidden');
      if (btnReg) btnReg.className = 'flex-1 py-2 rounded-lg font-display font-bold text-xs uppercase bg-brass-400 text-obsidian-950 shadow';
      if (btnLogin) btnLogin.className = 'flex-1 py-2 rounded-lg font-display font-semibold text-xs uppercase text-slate-400 hover:text-slate-200';
    } else {
      regForm?.classList.add('hidden');
      loginForm?.classList.remove('hidden');
      if (btnLogin) btnLogin.className = 'flex-1 py-2 rounded-lg font-display font-bold text-xs uppercase bg-brass-400 text-obsidian-950 shadow';
      if (btnReg) btnReg.className = 'flex-1 py-2 rounded-lg font-display font-semibold text-xs uppercase text-slate-400 hover:text-slate-200';
    }
  }

  toggleRegisterRoleMasterKeyField(roleVal) {
    const box = document.getElementById('registerMasterSecretBox');
    if (!box) return;
    box.classList.toggle('hidden', roleVal !== 'gm');
  }

  showAuthError(msg) {
    const errBox = document.getElementById('authErrorBanner');
    if (!errBox) return;
    errBox.textContent = msg;
    errBox.classList.remove('hidden');
  }

  async handleLoginSubmit() {
    const email = document.getElementById('loginEmailInput')?.value || '';
    const password = document.getElementById('loginPasswordInput')?.value || '';
    const res = await this.storage.loginWithCredentials(email, password);
    if (!res.ok) {
      this.showAuthError(res.error);
      return;
    }
    if (res.user.role === 'gm') {
      this.viewMode = 'gm';
    } else {
      this.viewMode = 'sheet';
    }
    this.renderAll();
    showToast(`Bem-vindo(a), ${res.user.name}! (${res.user.role === 'gm' ? 'Mestre' : 'Jogador'})`);
  }

  async quickDemoLogin(email, password) {
    const emailEl = document.getElementById('loginEmailInput');
    const passEl = document.getElementById('loginPasswordInput');
    if (emailEl) emailEl.value = email;
    if (passEl) passEl.value = password;
    await this.handleLoginSubmit();
  }

  async handleRegisterSubmit() {
    const name = document.getElementById('regNameInput')?.value || '';
    const email = document.getElementById('regEmailInput')?.value || '';
    const password = document.getElementById('regPasswordInput')?.value || '';
    const role = document.getElementById('regRoleSelect')?.value || 'player';
    const masterCode = document.getElementById('regMasterCodeInput')?.value || '';

    const res = await this.storage.registerAccount({ name, email, password, role, masterCode });
    if (!res.ok) {
      this.showAuthError(res.error);
      return;
    }

    if (res.user.role === 'gm') {
      this.viewMode = 'gm';
    } else {
      this.viewMode = 'sheet';
    }
    this.renderAll();
    showToast(`Conta criada com sucesso! Bem-vindo(a), ${res.user.name}.`, 'crit');
  }

  async logout() {
    await this.storage.logoutUser();
    showToast('Sessão encerrada com segurança.');
  }

  async updateMasterSecretCodeFromGM() {
    if (!this.isGMUser()) return;
    const newCode = document.getElementById('gmNewSecretCodeInput')?.value.trim();
    if (!newCode) {
      showToast('Digite um novo código secreto para o Mestre.', 'error');
      return;
    }
    await this.storage.updateMasterInviteCode(newCode);
    document.getElementById('gmNewSecretCodeInput').value = '';
    showToast('Código Secreto do Mestre atualizado com criptografia SHA-256!', 'crit');
  }

  // --- GERENCIADOR DE CONTAS, LOGINS E SENHAS ---
  openAccountManagerModal() {
    if (!this.currentUser) {
      this.openAuthModal();
      return;
    }
    this.syncQuickDemoVisibility();
    const allUsers = this.storage.getAllUsersList();
    renderAccountManagerModalContent(allUsers, this.currentUser);
    const modal = document.getElementById('accountManagerModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeAccountManagerModal() {
    const modal = document.getElementById('accountManagerModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async saveMyOwnAccountChanges() {
    if (!this.currentUser) return;
    const oldEmail = (this.currentUser.email || '').toLowerCase();
    const name = document.getElementById('myAccNameInput')?.value.trim() || this.currentUser.name;
    const email = document.getElementById('myAccEmailInput')?.value.trim() || this.currentUser.email;
    const newPassword = document.getElementById('myAccNewPassInput')?.value || '';

    const res = await this.storage.updateUserAccount(this.currentUser.uid, {
      name,
      email,
      newPassword,
      role: this.currentUser.role
    });

    if (!res.ok) {
      showToast(res.error, 'error');
      return;
    }

    // Atualiza vínculo de e-mail nas fichas do usuário caso tenha trocado o login
    for (const ch of Object.values(this.charactersMap)) {
      if (ch.ownerUid === this.currentUser.uid || (oldEmail && (ch.ownerEmail || '').toLowerCase() === oldEmail)) {
        ch.ownerUid = this.currentUser.uid;
        ch.ownerEmail = res.user.email;
        await this.storage.saveCharacter(ch, this.charactersMap);
      }
    }

    const passInput = document.getElementById('myAccNewPassInput');
    if (passInput) passInput.value = '';
    renderAccountManagerModalContent(this.storage.getAllUsersList(), this.currentUser);
    this.renderAll();
    showToast(`Login atualizado para "${res.user.email}"${newPassword ? ' (com nova senha)' : ''}!`, 'crit');
  }

  async adminSaveAccountChanges(targetUid) {
    if (!this.isGMUser()) return;
    const name = document.getElementById(`admName_${targetUid}`)?.value.trim();
    const email = document.getElementById(`admEmail_${targetUid}`)?.value.trim();
    const newPassword = document.getElementById(`admPass_${targetUid}`)?.value || '';
    const role = document.getElementById(`admRole_${targetUid}`)?.value || 'player';

    const res = await this.storage.updateUserAccount(targetUid, {
      name,
      email,
      newPassword,
      role
    });

    if (!res.ok) {
      showToast(res.error, 'error');
      return;
    }

    for (const ch of Object.values(this.charactersMap)) {
      if (ch.ownerUid === targetUid) {
        ch.ownerEmail = res.user.email;
        await this.storage.saveCharacter(ch, this.charactersMap);
      }
    }

    renderAccountManagerModalContent(this.storage.getAllUsersList(), this.currentUser);
    this.renderAll();
    showToast(`Conta "${res.user.name}" (${res.user.email}) atualizada com sucesso!`, 'crit');
  }

  async adminCreateNewAccount() {
    if (!this.isGMUser()) return;
    const name = document.getElementById('gmCreateAccName')?.value.trim();
    const email = document.getElementById('gmCreateAccEmail')?.value.trim();
    const password = document.getElementById('gmCreateAccPass')?.value || '';
    const role = document.getElementById('gmCreateAccRole')?.value || 'player';

    const res = await this.storage.adminCreateUserAccount({ name, email, password, role });
    if (!res.ok) {
      showToast(res.error, 'error');
      return;
    }

    document.getElementById('gmCreateAccName').value = '';
    document.getElementById('gmCreateAccEmail').value = '';
    document.getElementById('gmCreateAccPass').value = '';

    renderAccountManagerModalContent(this.storage.getAllUsersList(), this.currentUser);
    showToast(`Novo login "${res.user.email}" criado com sucesso!`, 'crit');
  }

  async adminDeleteAccount(targetUid) {
    if (!this.isGMUser()) return;
    const res = await this.storage.deleteUserAccount(targetUid);
    if (!res.ok) {
      showToast(res.error, 'error');
      return;
    }
    renderAccountManagerModalContent(this.storage.getAllUsersList(), this.currentUser);
    showToast('Conta removida com sucesso.');
  }

  // --- PERSONALIZAÇÃO DE TEMAS, CORES E FUNDO POR USUÁRIO ---
  openThemeCustomizerModal() {
    renderThemeCustomizerModalContent(this.userTheme);
    const modal = document.getElementById('themeCustomizerModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeThemeCustomizerModal() {
    const modal = document.getElementById('themeCustomizerModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async selectThemePreset(presetId) {
    const preset = THEME_PRESETS.find(p => p.id === presetId);
    if (!preset) return;
    this.userTheme = {
      ...this.userTheme,
      presetId: preset.id,
      bgBase: preset.bgBase,
      cardBg: preset.cardBg,
      cardGoldBg: preset.cardGoldBg,
      accentColor: preset.accentColor,
      borderColor: preset.borderColor || preset.accentColor,
      accentSecondary: preset.accentSecondary,
      bgPattern: preset.bgPattern
    };
    renderThemeCustomizerModalContent(this.userTheme);
    applyActiveVisualTheme(this.userTheme, !!this.combatState?.isActive);
    await this.storage.saveUserProfileTheme(this.userTheme);
    showToast(`Tema "${preset.name}" aplicado ao seu perfil!`);
  }

  async updateCustomThemeField(field, value) {
    this.userTheme[field] = value;
    this.userTheme.presetId = 'custom';
    applyActiveVisualTheme(this.userTheme, !!this.combatState?.isActive);
    await this.storage.saveUserProfileTheme(this.userTheme);
  }

  async resetUserThemeToDefault() {
    this.userTheme = { ...DEFAULT_USER_THEME };
    renderThemeCustomizerModalContent(this.userTheme);
    applyActiveVisualTheme(this.userTheme, !!this.combatState?.isActive);
    await this.storage.saveUserProfileTheme(this.userTheme);
    showToast('Tema restaurado para o padrão Nevoeiro Cinza.');
  }

  // --- BANCO DE DADOS GRATUITO (FIREBASE) & GUIA DE HOSPEDAGEM GRATUITA ---
  openCloudDatabaseModal() {
    if (this.currentUser && !this.isGMUser()) {
      showToast('Configurações de servidor e backup são exclusivas do Mestre.', 'error');
      return;
    }
    const currentCfg = this.storage.getSavedFirebaseConfig();
    const cfgTextarea = document.getElementById('firebaseConfigJsonInput');
    if (cfgTextarea) {
      cfgTextarea.value = currentCfg ? JSON.stringify(currentCfg, null, 2) : '';
    }
    const modal = document.getElementById('cloudSetupModal');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeCloudDatabaseModal() {
    const modal = document.getElementById('cloudSetupModal');
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async saveAndConnectFirebaseConfig() {
    const raw = document.getElementById('firebaseConfigJsonInput')?.value.trim() || '';
    if (!raw) {
      this.storage.saveCustomFirebaseConfig(null);
      await this.storage.init();
      this.closeCloudDatabaseModal();
      showToast('Configuração de nuvem removida. Usando armazenamento local.');
      return;
    }

    try {
      // Suporta tanto JSON puro quanto colar o trecho const firebaseConfig = { ... }
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Formato inválido');
      const normalized = jsonMatch[0]
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
        .replace(/'/g, '"');
      const parsed = JSON.parse(normalized);
      if (!parsed.apiKey || !parsed.projectId) {
        showToast('O objeto precisa conter ao menos "apiKey" e "projectId" do Firebase.', 'error');
        return;
      }

      this.storage.saveCustomFirebaseConfig(parsed);
      await this.storage.init();
      this.closeCloudDatabaseModal();
      showToast('Conectado ao Firebase Firestore com sucesso!', 'crit');
    } catch (e) {
      showToast('Erro ao ler a configuração do Firebase. Cole o JSON válido do console do Firebase.', 'error');
    }
  }

  downloadDatabaseBackup() {
    const dataStr = this.storage.exportFullBackupJSON(this.charactersMap, this.campaignState, this.combatState);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_grimorio_beyonder_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('Backup completo do banco de dados exportado!');
  }

  // --- CONTROLE DE ABAS DO PAINEL DO MESTRE (PROTEGIDO) ---
  switchGMSubTab(subTab) {
    if (!this.isGMUser()) {
      showToast('Acesso restrito ao Mestre!', 'error');
      return;
    }
    this.activeGMSubTab = subTab;
    renderGMDashboard(this.charactersMap, this.campaignState, this.activeGMSubTab, this.currentUser);
  }

  // --- GESTÃO DE CAMPANHAS DO MESTRE ---
  selectActiveCampaign(campaignId) {
    if (!this.isGMUser() || !campaignId) return;
    this.campaignState.activeCampaignId = campaignId;
    this.renderAll();
    this.storage.saveCampaignState(this.campaignState);
    showToast('Campanha ativa alterada!');
  }

  async updateActiveCampaignField(field, value) {
    if (!this.isGMUser()) return;
    const camp = this.getActiveCampaign();
    if (!camp) return;
    camp[field] = value;
    this.renderAll();
    await this.storage.saveCampaignState(this.campaignState);
  }

  async toggleCharacterInActiveCampaign(charId) {
    if (!this.isGMUser()) {
      showToast('Apenas o Mestre pode escalar fichas na campanha.', 'error');
      return;
    }
    const camp = this.getActiveCampaign();
    if (!camp || !charId) return;
    if (!Array.isArray(camp.characterIds)) camp.characterIds = [];

    const idx = camp.characterIds.indexOf(charId);
    if (idx >= 0) {
      camp.characterIds.splice(idx, 1);
      if (camp.restrictCombatAndDice !== false && this.combatState.participants) {
        this.combatState.participants = this.combatState.participants.filter(p => p.isMonster || p.charId !== charId);
        await this.storage.saveCombatState(this.combatState);
      }
    } else {
      camp.characterIds.push(charId);
    }

    this.renderAll();
    await this.storage.saveCampaignState(this.campaignState);
  }

  openCreateCampaignModal() {
    if (!this.isGMUser()) {
      showToast('Apenas o Mestre pode criar campanhas.', 'error');
      return;
    }
    document.getElementById('modalCampaignName').value = '';
    document.getElementById('modalCampaignDesc').value = '';

    const checklist = document.getElementById('modalCampaignCharsChecklist');
    const allChars = Object.values(this.charactersMap).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    if (checklist) {
      checklist.innerHTML = allChars.map(ch => `
        <label class="flex items-center gap-2.5 p-2 rounded-lg bg-obsidian-950 border border-slate-800 cursor-pointer hover:border-brass-400/40">
          <input type="checkbox" value="${ch.id}" checked class="modal-camp-char-checkbox accent-amber-400 rounded" />
          <div class="min-w-0">
            <div class="text-xs font-bold text-brass-200 truncate">${escapeHtml(ch.name)}</div>
            <div class="text-[10px] text-slate-400 truncate">${escapeHtml(ch.player || 'Jogador')} • ${escapeHtml(ch.pathway)}</div>
          </div>
        </label>
      `).join('');
    }

    const modal = document.getElementById('createCampaignModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeCreateCampaignModal() {
    const modal = document.getElementById('createCampaignModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async confirmCreateCampaign() {
    if (!this.isGMUser()) return;
    const name = document.getElementById('modalCampaignName').value.trim() || 'Nova Campanha Beyonder';
    const description = document.getElementById('modalCampaignDesc').value.trim() || 'Mesa de investigação e ocultismo.';
    const checkedBoxes = document.querySelectorAll('.modal-camp-char-checkbox:checked');
    const characterIds = Array.from(checkedBoxes).map(cb => cb.value);

    const newCamp = {
      id: `camp_${Date.now()}`,
      name,
      description,
      currentWeek: 1,
      characterIds,
      restrictCombatAndDice: true,
      weekHistory: [],
      createdAt: Date.now()
    };

    if (!Array.isArray(this.campaignState.campaigns)) this.campaignState.campaigns = [];
    this.campaignState.campaigns.push(newCamp);
    this.campaignState.activeCampaignId = newCamp.id;

    this.closeCreateCampaignModal();
    this.viewMode = 'gm';
    this.activeGMSubTab = 'campaign';
    this.renderAll();
    await this.storage.saveCampaignState(this.campaignState);
    showToast(`Campanha "${name}" criada com ${characterIds.length} ficha(s)!`);
  }

  async deleteActiveCampaign() {
    if (!this.isGMUser()) return;
    const list = this.campaignState?.campaigns || [];
    if (list.length <= 1) {
      showToast('É necessário manter ao menos uma campanha ativa.', 'error');
      return;
    }
    const active = this.getActiveCampaign();
    if (!active) return;

    this.campaignState.campaigns = list.filter(c => c.id !== active.id);
    this.campaignState.activeCampaignId = this.campaignState.campaigns[0].id;
    this.renderAll();
    await this.storage.saveCampaignState(this.campaignState);
    showToast(`Campanha "${active.name}" removida.`);
  }

  // --- ROTINA SEMANAL (DOWNTIME) ---
  ensureCharDowntime(char) {
    const activeCamp = this.getActiveCampaign();
    const weekNum = activeCamp?.currentWeek || 1;
    if (!char.weeklyDowntime) {
      char.weeklyDowntime = createDefaultWeeklyDowntime(weekNum);
    }
    if (!char.weeklyDowntime.days) {
      char.weeklyDowntime.days = createDefaultWeeklyDowntime(weekNum).days;
    }
    return char.weeklyDowntime;
  }

  updateDowntimeGeneralGoals(val) {
    const char = this.getActiveChar();
    if (!char) return;
    const dt = this.ensureCharDowntime(char);
    dt.generalGoals = val;
    this.scheduleAutoSave();
  }

  updateDowntimeDayField(charId, dayKey, field, value, shouldReRender = false) {
    const char = this.charactersMap[charId] || this.getActiveChar();
    if (!char) return;
    const dt = this.ensureCharDowntime(char);
    if (!dt.days[dayKey]) {
      dt.days[dayKey] = createDefaultWeeklyDowntime(dt.weekNumber || 1).days[dayKey];
    }
    dt.days[dayKey][field] = value;

    if (shouldReRender) {
      this.renderAll();
    }
    this.storage.saveCharacter(char, this.charactersMap);
  }

  updateDowntimeDayDelta(charId, dayKey, deltaField, value) {
    if (!this.isGMUser()) return;
    const char = this.charactersMap[charId];
    if (!char) return;
    const dt = this.ensureCharDowntime(char);
    if (!dt.days[dayKey].deltas) {
      dt.days[dayKey].deltas = { potion: 0, hp: 0, san: 0, sp: 0, gold: 0, itemGained: '', clueGained: '' };
    }
    dt.days[dayKey].deltas[deltaField] = value;
    this.storage.saveCharacter(char, this.charactersMap);
  }

  toggleDowntimeDayOutcome(charId, dayKey, outcomeKey) {
    if (!this.isGMUser()) return;
    const char = this.charactersMap[charId];
    if (!char) return;
    const dt = this.ensureCharDowntime(char);
    const dayObj = dt.days[dayKey];
    if (!Array.isArray(dayObj.outcomes)) dayObj.outcomes = [];

    const idx = dayObj.outcomes.indexOf(outcomeKey);
    if (idx >= 0) {
      dayObj.outcomes.splice(idx, 1);
    } else {
      dayObj.outcomes.push(outcomeKey);
    }

    this.renderAll();
    this.storage.saveCharacter(char, this.charactersMap);
  }

  async submitWeeklyDowntimeToGM() {
    const char = this.getActiveChar();
    if (!char) return;
    const dt = this.ensureCharDowntime(char);
    dt.submittedToGM = true;
    dt.submittedAt = Date.now();

    this.renderAll();
    await this.storage.saveCharacter(char, this.charactersMap);
    showToast(`Semana de ${char.name} enviada para análise do Mestre!`);
  }

  rollDowntimeRequestedTest(charId, dayKey) {
    const char = this.charactersMap[charId] || this.getActiveChar();
    if (!char) return;
    const dt = this.ensureCharDowntime(char);
    const dayObj = dt.days?.[dayKey];
    if (!dayObj || !dayObj.gmRequestedTest) return;

    const testKey = dayObj.gmRequestedTest;
    const dayDef = WEEK_DAYS_DEF.find(d => d.key === dayKey);
    const profBonus = Number(char.proficiencyBonus) || 2;
    let totalMod = 0;

    const attrDef = ATTRIBUTES_DEF.find(a => a.key === testKey);
    const saveDef = SAVING_THROWS_DEF.find(s => `save_${s.key}` === testKey);
    const skillDef = SKILLS_DEF.find(s => s.id === testKey);

    if (attrDef) {
      const aObj = char.attributes?.[attrDef.key] || { value: 10, bonus: 0 };
      totalMod = calcAttrMod(aObj.value, aObj.bonus);
    } else if (saveDef) {
      const svData = char.savingThrows?.[saveDef.key] || { proficient: false, bonus: 0 };
      const aObj = char.attributes?.[saveDef.defaultAttr] || { value: 10, bonus: 0 };
      totalMod = calcAttrMod(aObj.value, aObj.bonus) + (svData.proficient ? profBonus : 0) + (Number(svData.bonus) || 0);
    } else if (skillDef) {
      const skData = char.skills?.[skillDef.id] || { attr: skillDef.defaultAttr, profLevel: 0, bonus: 0 };
      const aObj = char.attributes?.[skData.attr || skillDef.defaultAttr] || { value: 10, bonus: 0 };
      totalMod = calcAttrMod(aObj.value, aObj.bonus) + ((skData.profLevel || 0) * profBonus) + (Number(skData.bonus) || 0);
    }

    const forceBonusDie = !!document.getElementById('useBonusDieNow')?.checked;
    const rollRes = buildD20RollResult({
      character: char,
      title: `Teste de Semana (${dayDef?.short || dayKey}): ${getTestLabelByKey(testKey)}`,
      subtitle: `Solicitado pelo Mestre • DT ${dayObj.gmTestDC ?? 12}`,
      modifier: totalMod,
      rollMode: this.rollMode,
      forceBonusDie
    });

    dayObj.playerRollResult = {
      total: rollRes.total,
      natural: rollRes.naturalRoll,
      details: rollRes.details,
      timestamp: Date.now()
    };

    this.publishRoll({
      ...rollRes,
      characterId: char.id,
      campaignId: this.getActiveCampaign()?.id || null
    });

    this.renderAll();
    this.storage.saveCharacter(char, this.charactersMap);

    const passed = rollRes.total >= (dayObj.gmTestDC || 12);
    showToast(
      `${char.name} rolou ${rollRes.total} (DT ${dayObj.gmTestDC ?? 12}) em ${dayDef?.label || dayKey}: ${passed ? 'Sucesso!' : 'Falha!'}`,
      passed ? 'crit' : 'error'
    );
  }

  async applySingleDayOutcomeToChar(charId, dayKey, silent = false) {
    if (!this.isGMUser()) return;
    const char = this.charactersMap[charId];
    if (!char) return;
    const dt = this.ensureCharDowntime(char);
    const dayObj = dt.days?.[dayKey];
    if (!dayObj || dayObj.isMissionDay) return;

    const deltas = dayObj.deltas || {};
    const dayDef = WEEK_DAYS_DEF.find(d => d.key === dayKey);

    if (Number(deltas.potion)) {
      char.potionProgress = clamp((Number(char.potionProgress) || 0) + Number(deltas.potion), 0, 100);
    }
    if (Number(deltas.hp) && char.vitals?.hp) {
      char.vitals.hp.current = clamp((Number(char.vitals.hp.current) || 0) + Number(deltas.hp), 0, Number(char.vitals.hp.max) || 999);
    }
    if (Number(deltas.san) && char.vitals?.san) {
      char.vitals.san.current = clamp((Number(char.vitals.san.current) || 0) + Number(deltas.san), 0, Number(char.vitals.san.max) || 999);
    }
    if (Number(deltas.sp) && char.vitals?.sp) {
      char.vitals.sp.current = clamp((Number(char.vitals.sp.current) || 0) + Number(deltas.sp), 0, Number(char.vitals.sp.max) || 999);
    }
    if (Number(deltas.gold)) {
      char.currencyGold = Math.max(0, (Number(char.currencyGold) || 0) + Number(deltas.gold));
    }

    if (deltas.itemGained && deltas.itemGained.trim()) {
      if (!Array.isArray(char.equipment)) char.equipment = [];
      const alreadyExists = char.equipment.some(eq => eq.name === deltas.itemGained.trim());
      if (!alreadyExists) {
        char.equipment.push({
          id: `eq_dt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          name: deltas.itemGained.trim(),
          category: 'Instrumento Místico',
          quantity: 1,
          description: `Obtido em ${dayDef?.label || dayKey} (Semana ${dt.weekNumber || 1}). ${dayObj.gmFeedback || ''}`.trim()
        });
      }
    }

    if (deltas.clueGained && deltas.clueGained.trim()) {
      const clueLine = `\n• [Pista - Semana ${dt.weekNumber || 1}, ${dayDef?.label || dayKey}]: ${deltas.clueGained.trim()}`;
      if (!(char.backstory || '').includes(deltas.clueGained.trim())) {
        char.backstory = ((char.backstory || '') + clueLine).trim();
      }
    }

    dayObj.applied = true;
    await this.storage.saveCharacter(char, this.charactersMap);
    if (!silent) {
      this.renderAll();
      showToast(`Consequências de ${dayDef?.label || dayKey} aplicadas em ${char.name}!`);
    }
  }

  // --- PASSAR A SEMANA DA CAMPANHA ---
  openPassWeekModal() {
    if (!this.isGMUser()) {
      showToast('Apenas o Mestre pode passar a semana da campanha.', 'error');
      return;
    }
    const camp = this.getActiveCampaign();
    if (!camp) return;

    const allChars = Object.values(this.charactersMap);
    const campChars = allChars.filter(c => (camp.characterIds || []).includes(c.id));

    document.getElementById('passWeekModalTitleSpan').textContent = `${camp.name} — Encerrar Semana ${camp.currentWeek || 1}`;
    document.getElementById('passWeekGeneralSummaryInput').value = `Com o fim da Semana ${camp.currentWeek || 1}, o Nevoeiro Cinza testemunhou novas investigações, avanços sutis na digestão das poções e o pagamento semanal das organizações.`;

    const playersListContainer = document.getElementById('passWeekPlayersConfigContainer');
    if (playersListContainer) {
      if (campChars.length === 0) {
        playersListContainer.innerHTML = `<p class="text-xs text-slate-400 italic text-center py-4">Nenhum personagem vinculado à campanha ativa.</p>`;
      } else {
        playersListContainer.innerHTML = campChars.map(ch => {
          const hp = ch.vitals?.hp || { current: 20, max: 20 };
          const san = ch.vitals?.san || { current: 80, max: 100 };
          const sp = ch.vitals?.sp || { current: 20, max: 20 };

          const dt = ch.weeklyDowntime || createDefaultWeeklyDowntime(camp.currentWeek || 1);
          const dayNotes = [];
          WEEK_DAYS_DEF.forEach(d => {
            const dObj = dt.days?.[d.key];
            if (!dObj) return;
            if (dObj.isMissionDay) {
              dayNotes.push(`${d.short}: Em Missão`);
            } else if (dObj.playerActivity || dObj.gmFeedback) {
              const part = `${d.short}: ${dObj.gmFeedback || dObj.playerActivity}`;
              dayNotes.push(part);
            }
          });
          const autoSummary = dayNotes.length > 0
            ? dayNotes.join(' | ')
            : 'Descansou, manteve suas âncoras e cumpriu sua rotina cotidiana.';

          const missingHp = Math.max(0, (Number(hp.max) || 20) - (Number(hp.current) || 20));
          const missingSp = Math.max(0, (Number(sp.max) || 20) - (Number(sp.current) || 20));

          return `
            <div class="bg-obsidian-950/90 border border-brass-400/30 rounded-xl p-4 space-y-3" data-pass-char-id="${ch.id}">
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <h4 class="font-display font-bold text-sm text-brass-200">${escapeHtml(ch.name)}</h4>
                  <span class="text-[11px] text-slate-400">${escapeHtml(ch.pathway)} • Seq. ${ch.sequence} (${escapeHtml(ch.potionName || '')})</span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span class="px-2 py-0.5 rounded bg-crimson-950/80 text-crimson-300 border border-crimson-500/30">PV ${hp.current}/${hp.max}</span>
                  <span class="px-2 py-0.5 rounded bg-eldritch-900/80 text-eldritch-300 border border-eldritch-500/30">SAN ${san.current}/${san.max}</span>
                  <span class="px-2 py-0.5 rounded bg-astral-900/80 text-astral-300 border border-astral-500/30">PE ${sp.current}/${sp.max}</span>
                  <span class="px-2 py-0.5 rounded bg-amber-950/80 text-amber-200 border border-amber-400/30">${ch.currencyGold ?? 0} £</span>
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div class="bg-obsidian-900/90 border border-crimson-500/30 rounded-lg p-2.5 space-y-1.5">
                  <label class="flex items-center justify-between text-xs font-bold text-crimson-300 cursor-pointer">
                    <span><i class="fa-solid fa-heart-pulse mr-1"></i>Vida (PV)</span>
                    <input type="checkbox" id="pw_chk_hp_${ch.id}" checked class="accent-crimson-500 rounded" />
                  </label>
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-slate-400">+</span>
                    <input type="number" id="pw_val_hp_${ch.id}" value="${missingHp > 0 ? missingHp : 5}"
                      class="sheet-input w-full text-center py-1 rounded text-xs font-bold text-crimson-200" />
                  </div>
                </div>

                <div class="bg-obsidian-900/90 border border-eldritch-500/30 rounded-lg p-2.5 space-y-1.5">
                  <label class="flex items-center justify-between text-xs font-bold text-eldritch-300 cursor-pointer">
                    <span><i class="fa-solid fa-brain mr-1"></i>Sanidade</span>
                    <input type="checkbox" id="pw_chk_san_${ch.id}" checked class="accent-eldritch-500 rounded" />
                  </label>
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-slate-400">+</span>
                    <input type="number" id="pw_val_san_${ch.id}" value="5"
                      class="sheet-input w-full text-center py-1 rounded text-xs font-bold text-eldritch-200" />
                  </div>
                </div>

                <div class="bg-obsidian-900/90 border border-astral-500/30 rounded-lg p-2.5 space-y-1.5">
                  <label class="flex items-center justify-between text-xs font-bold text-astral-300 cursor-pointer">
                    <span><i class="fa-solid fa-star-of-life mr-1"></i>Espirit. (PE)</span>
                    <input type="checkbox" id="pw_chk_sp_${ch.id}" checked class="accent-astral-500 rounded" />
                  </label>
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-slate-400">+</span>
                    <input type="number" id="pw_val_sp_${ch.id}" value="${missingSp > 0 ? missingSp : 15}"
                      class="sheet-input w-full text-center py-1 rounded text-xs font-bold text-astral-200" />
                  </div>
                </div>

                <div class="bg-obsidian-900/90 border border-amber-400/30 rounded-lg p-2.5 space-y-1.5">
                  <label class="flex items-center justify-between text-xs font-bold text-amber-300 cursor-pointer">
                    <span><i class="fa-solid fa-coins mr-1"></i>Dinheiro (£)</span>
                    <input type="checkbox" id="pw_chk_gold_${ch.id}" checked class="accent-amber-400 rounded" />
                  </label>
                  <div class="flex items-center gap-1">
                    <span class="text-[10px] text-slate-400">+</span>
                    <input type="number" id="pw_val_gold_${ch.id}" value="6"
                      class="sheet-input w-full text-center py-1 rounded text-xs font-bold text-amber-200" />
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-[10px] font-display uppercase tracking-wider text-brass-300 mb-1">
                  Resumo da Semana Entregue ao Jogador:
                </label>
                <textarea id="pw_summary_${ch.id}" rows="2"
                  class="sheet-input w-full p-2 rounded-lg text-xs text-slate-200">${escapeHtml(autoSummary)}</textarea>
              </div>
            </div>
          `;
        }).join('');
      }
    }

    const modal = document.getElementById('passWeekModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closePassWeekModal() {
    const modal = document.getElementById('passWeekModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  applyPassWeekPresetAll(hpVal, sanVal, spVal, goldVal) {
    const camp = this.getActiveCampaign();
    if (!camp) return;
    (camp.characterIds || []).forEach(charId => {
      const hpInput = document.getElementById(`pw_val_hp_${charId}`);
      const sanInput = document.getElementById(`pw_val_san_${charId}`);
      const spInput = document.getElementById(`pw_val_sp_${charId}`);
      const goldInput = document.getElementById(`pw_val_gold_${charId}`);
      if (hpInput) hpInput.value = hpVal;
      if (sanInput) sanInput.value = sanVal;
      if (spInput) spInput.value = spVal;
      if (goldInput) goldInput.value = goldVal;
    });
  }

  async confirmPassWeek() {
    if (!this.isGMUser()) return;
    const camp = this.getActiveCampaign();
    if (!camp) return;

    const currentWeek = camp.currentWeek || 1;
    const generalNarrative = document.getElementById('passWeekGeneralSummaryInput')?.value.trim() || '';
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    const playerSummaries = [];

    for (const charId of (camp.characterIds || [])) {
      const ch = this.charactersMap[charId];
      if (!ch) continue;

      const dt = this.ensureCharDowntime(ch);
      for (const d of WEEK_DAYS_DEF) {
        const dayObj = dt.days?.[d.key];
        if (dayObj && !dayObj.isMissionDay && !dayObj.applied) {
          await this.applySingleDayOutcomeToChar(ch.id, d.key, true);
        }
      }

      const useHp = !!document.getElementById(`pw_chk_hp_${charId}`)?.checked;
      const useSan = !!document.getElementById(`pw_chk_san_${charId}`)?.checked;
      const useSp = !!document.getElementById(`pw_chk_sp_${charId}`)?.checked;
      const useGold = !!document.getElementById(`pw_chk_gold_${charId}`)?.checked;

      const addHp = useHp ? (Number(document.getElementById(`pw_val_hp_${charId}`)?.value) || 0) : 0;
      const addSan = useSan ? (Number(document.getElementById(`pw_val_san_${charId}`)?.value) || 0) : 0;
      const addSp = useSp ? (Number(document.getElementById(`pw_val_sp_${charId}`)?.value) || 0) : 0;
      const addGold = useGold ? (Number(document.getElementById(`pw_val_gold_${charId}`)?.value) || 0) : 0;
      const eventsText = document.getElementById(`pw_summary_${charId}`)?.value.trim() || '';

      const recParts = [];
      if (addHp !== 0 && ch.vitals?.hp) {
        ch.vitals.hp.current = clamp((Number(ch.vitals.hp.current) || 0) + addHp, 0, Number(ch.vitals.hp.max) || 999);
        recParts.push(`${formatSigned(addHp)} PV`);
      }
      if (addSan !== 0 && ch.vitals?.san) {
        ch.vitals.san.current = clamp((Number(ch.vitals.san.current) || 0) + addSan, 0, Number(ch.vitals.san.max) || 999);
        recParts.push(`${formatSigned(addSan)} SAN`);
      }
      if (addSp !== 0 && ch.vitals?.sp) {
        ch.vitals.sp.current = clamp((Number(ch.vitals.sp.current) || 0) + addSp, 0, Number(ch.vitals.sp.max) || 999);
        recParts.push(`${formatSigned(addSp)} PE`);
      }
      if (addGold !== 0) {
        ch.currencyGold = Math.max(0, (Number(ch.currencyGold) || 0) + addGold);
        recParts.push(`${formatSigned(addGold)} Libras (£)`);
      }

      const recoveryText = recParts.length > 0 ? recParts.join(' • ') : 'Sem alteração extra de status';

      if (!Array.isArray(ch.downtimeHistory)) ch.downtimeHistory = [];
      ch.downtimeHistory.unshift({
        id: `dth_${Date.now()}_${charId}`,
        weekNumber: currentWeek,
        campaignName: camp.name,
        date: dateStr,
        recoveryText,
        eventsText,
        generalNarrative
      });

      playerSummaries.push({
        charId: ch.id,
        charName: ch.name,
        recoveryText,
        eventsText
      });

      ch.weeklyDowntime = createDefaultWeeklyDowntime(currentWeek + 1);
      await this.storage.saveCharacter(ch, this.charactersMap);
    }

    if (!Array.isArray(camp.weekHistory)) camp.weekHistory = [];
    camp.weekHistory.unshift({
      id: `wh_${Date.now()}`,
      weekNumber: currentWeek,
      title: `Resumo da Semana ${currentWeek} — ${camp.name}`,
      dateStr,
      generalNarrative,
      playerSummaries
    });

    camp.currentWeek = currentWeek + 1;

    this.closePassWeekModal();
    this.renderAll();
    await this.storage.saveCampaignState(this.campaignState);
    showToast(`Semana ${currentWeek} concluída! Resumos e recuperações entregues aos jogadores.`, 'crit');
  }

  // --- PROGRESSÃO DE SEQUÊNCIA & RESUMO DO QUE FOI ALTERADO NA POÇÃO ---
  openSequenceProgressionModal(charId) {
    if (!this.isGMUser()) {
      showToast('Apenas o Mestre pode registrar o avanço de sequência e resumo da poção.', 'error');
      return;
    }
    const target = this.charactersMap[charId] || this.getActiveChar();
    if (!target) return;

    this.seqProgTargetCharId = target.id;
    const currentSeqNum = parseInt(target.sequence, 10);
    const nextSeq = !Number.isNaN(currentSeqNum) && currentSeqNum > 0 ? String(currentSeqNum - 1) : '8';

    document.getElementById('seqProgCharNameSpan').textContent = `${target.name} (${target.pathway})`;
    document.getElementById('seqProgCurrentBadge').textContent = `Seq. ${target.sequence} — ${target.potionName || 'Beyonder'}`;
    document.getElementById('seqProgNewSequence').value = nextSeq;
    document.getElementById('seqProgNewPotionName').value = '';
    document.getElementById('seqProgChangesOverview').value = '+10 PV Máx • +15 PE Máx • Novos Poderes de Sequência';
    document.getElementById('seqProgSummaryText').value = '';
    document.getElementById('seqProgResetDigestion').checked = true;

    const modal = document.getElementById('sequenceProgressionModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeSequenceProgressionModal() {
    const modal = document.getElementById('sequenceProgressionModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async confirmSequenceProgression() {
    if (!this.isGMUser()) return;
    const char = this.charactersMap[this.seqProgTargetCharId] || this.getActiveChar();
    if (!char) return;

    const fromSequence = char.sequence || '9';
    const fromPotion = char.potionName || 'Iniciado';
    const toSequence = document.getElementById('seqProgNewSequence').value;
    const toPotion = document.getElementById('seqProgNewPotionName').value.trim() || `Sequência ${toSequence}`;
    const changesOverview = document.getElementById('seqProgChangesOverview').value.trim();
    const summary = document.getElementById('seqProgSummaryText').value.trim() || 'A poção remodelou seu corpo espiritual e concedeu novas capacidades místicas.';
    const resetDigestion = document.getElementById('seqProgResetDigestion').checked;

    char.sequence = toSequence;
    char.potionName = toPotion;
    if (resetDigestion) {
      char.potionProgress = 0;
    }

    if (!Array.isArray(char.sequenceSummaries)) char.sequenceSummaries = [];
    const activeCamp = this.getActiveCampaign();
    char.sequenceSummaries.unshift({
      id: `seqsum_${Date.now()}`,
      fromSequence,
      fromPotion,
      toSequence,
      toPotion,
      changesOverview,
      summary,
      date: `Semana ${activeCamp?.currentWeek || 1} • ${new Date().toLocaleDateString('pt-BR')}`
    });

    this.closeSequenceProgressionModal();
    this.renderAll();
    await this.storage.saveCharacter(char, this.charactersMap);
    showToast(`${char.name} avançou para Sequência ${toSequence} (${toPotion})! Resumo entregue na ficha.`, 'crit');
  }

  async removeSequenceSummary(charId, idx) {
    if (!this.isGMUser()) return;
    const char = this.charactersMap[charId] || this.getActiveChar();
    if (!char || !Array.isArray(char.sequenceSummaries)) return;
    char.sequenceSummaries.splice(idx, 1);
    this.renderAll();
    await this.storage.saveCharacter(char, this.charactersMap);
  }

  // --- BARRA DE COMBATE & TEMA MACABRO AUTOMÁTICO ---
  toggleCombatBarCollapse() {
    this.combatBarExpanded = !this.combatBarExpanded;
    const body = document.getElementById('combatBarBody');
    const icon = document.getElementById('combatCollapseIcon');
    if (body) body.classList.toggle('hidden', !this.combatBarExpanded);
    if (icon) icon.className = this.combatBarExpanded ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
  }

  async toggleCombatActiveState() {
    if (!this.isGMUser()) {
      showToast('Apenas o Mestre pode iniciar ou encerrar o combate.', 'error');
      return;
    }
    this.combatState.isActive = !this.combatState.isActive;
    this.lastCombatActiveFlag = this.combatState.isActive;

    if (this.combatState.isActive) {
      this.combatState.round = 1;
      this.combatState.activeTurnIndex = 0;
      playCombatAlarmSound(true);
      showToast('COMBATE INICIADO! A mesa entrou em situação de combate!', 'error');
    } else {
      playCombatAlarmSound(false);
      showToast('Combate encerrado! O tema personalizado de cada jogador foi restaurado.');
    }

    this.renderAll();
    await this.storage.saveCombatState(this.combatState);
  }

  async syncPlayersToCombat() {
    if (!this.isGMUser()) return;
    if (!this.combatState.participants) this.combatState.participants = [];
    const camp = this.getActiveCampaign();
    const allowedIds = camp && camp.restrictCombatAndDice !== false
      ? new Set(camp.characterIds || [])
      : new Set(Object.keys(this.charactersMap));

    this.combatState.participants = this.combatState.participants.filter(p => p.isMonster || allowedIds.has(p.charId));
    const existingCharIds = new Set(this.combatState.participants.filter(p => !p.isMonster).map(p => p.charId));

    Object.values(this.charactersMap).forEach(ch => {
      if (allowedIds.has(ch.id) && !existingCharIds.has(ch.id)) {
        const agiMod = calcAttrMod(ch.attributes?.agi?.value ?? 10, ch.attributes?.agi?.bonus ?? 0);
        this.combatState.participants.push({
          id: `comb_player_${ch.id}`,
          charId: ch.id,
          isMonster: false,
          name: ch.name,
          initiative: 10 + agiMod
        });
      }
    });

    renderCombatBar(this.combatState, this.charactersMap, this.viewMode, this.campaignState, this.activeCharacterId, this.currentUser);
    await this.storage.saveCombatState(this.combatState);
    showToast(`Jogadores da campanha "${camp?.name || 'Ativa'}" sincronizados no Combate!`);
  }

  async addMonsterToCombat() {
    if (!this.isGMUser()) return;
    if (!this.combatState.participants) this.combatState.participants = [];
    const rollInit = rollSingleDie(20) + 2;
    this.combatState.participants.push({
      id: `monster_${Date.now()}`,
      isMonster: true,
      name: 'Nova Ameaça / Monstro',
      enemyType: 'Criatura Beyonder',
      initiative: rollInit,
      hp: { current: 40, max: 40 },
      san: { current: 50, max: 50 },
      isHurt: false,
      isMad: false,
      statsVisibleToPlayers: false,
      isHiddenFromPlayers: false
    });

    renderCombatBar(this.combatState, this.charactersMap, this.viewMode, this.campaignState, this.activeCharacterId, this.currentUser);
    await this.storage.saveCombatState(this.combatState);
    showToast('Inimigo adicionado à iniciativa!');
  }

  async nextCombatTurn() {
    if (!this.isGMUser()) return;
    const camp = this.getActiveCampaign();
    const allowedIds = new Set(camp?.characterIds || []);
    const restrictActive = camp && camp.restrictCombatAndDice !== false;

    const raw = (this.combatState.participants || []).filter(p => !restrictActive || p.isMonster || allowedIds.has(p.charId));
    const list = [...raw].sort((a, b) => (Number(b.initiative) || 0) - (Number(a.initiative) || 0));
    if (list.length === 0) return;

    let nextIdx = (this.combatState.activeTurnIndex || 0) + 1;
    if (nextIdx >= list.length) {
      nextIdx = 0;
      this.combatState.round = (this.combatState.round || 1) + 1;
    }
    this.combatState.activeTurnIndex = nextIdx;

    const activeParticipant = list[nextIdx];
    if (activeParticipant && !activeParticipant.isMonster && activeParticipant.charId) {
      const ch = this.charactersMap[activeParticipant.charId];
      if (ch) {
        ch.turnActions = { ...DEFAULT_TURN_ACTIONS };
        await this.storage.saveCharacter(ch, this.charactersMap);
      }
    }

    this.renderAll();
    await this.storage.saveCombatState(this.combatState);
  }

  async updateCombatParticipant(participantId, field, value) {
    if (!this.isGMUser()) {
      showToast('Apenas o Mestre pode alterar a situação de combate.', 'error');
      return;
    }
    const p = (this.combatState.participants || []).find(item => item.id === participantId);
    if (!p) return;
    p[field] = value;
    renderCombatBar(this.combatState, this.charactersMap, this.viewMode, this.campaignState, this.activeCharacterId, this.currentUser);
    await this.storage.saveCombatState(this.combatState);
  }

  async toggleMonsterFlag(participantId, flagKey) {
    if (!this.isGMUser()) return;
    const p = (this.combatState.participants || []).find(item => item.id === participantId);
    if (!p) return;
    p[flagKey] = !p[flagKey];
    renderCombatBar(this.combatState, this.charactersMap, this.viewMode, this.campaignState, this.activeCharacterId, this.currentUser);
    await this.storage.saveCombatState(this.combatState);
  }

  async adjustMonsterVital(participantId, vitalKey, delta) {
    if (!this.isGMUser()) return;
    const p = (this.combatState.participants || []).find(item => item.id === participantId);
    if (!p || !p[vitalKey]) return;
    p[vitalKey].current = clamp((Number(p[vitalKey].current) || 0) + delta, 0, 9999);
    renderCombatBar(this.combatState, this.charactersMap, this.viewMode, this.campaignState, this.activeCharacterId, this.currentUser);
    await this.storage.saveCombatState(this.combatState);
  }

  async setMonsterVital(participantId, vitalKey, prop, val) {
    if (!this.isGMUser()) return;
    const p = (this.combatState.participants || []).find(item => item.id === participantId);
    if (!p || !p[vitalKey]) return;
    p[vitalKey][prop] = clamp(val, 0, 9999);
    renderCombatBar(this.combatState, this.charactersMap, this.viewMode, this.campaignState, this.activeCharacterId, this.currentUser);
    await this.storage.saveCombatState(this.combatState);
  }

  async removeCombatParticipant(participantId) {
    if (!this.isGMUser()) return;
    this.combatState.participants = (this.combatState.participants || []).filter(p => p.id !== participantId);
    renderCombatBar(this.combatState, this.charactersMap, this.viewMode, this.campaignState, this.activeCharacterId, this.currentUser);
    await this.storage.saveCombatState(this.combatState);
  }

  // --- ECONOMIA DE AÇÕES DO TURNO E FILTROS ---
  toggleCharacterTurnAction(charId, actionKey) {
    const ch = this.charactersMap[charId] || this.getActiveChar();
    if (!ch) return;
    if (!ch.turnActions) ch.turnActions = { ...DEFAULT_TURN_ACTIONS };
    ch.turnActions[actionKey] = !ch.turnActions[actionKey];
    this.renderAll();
    this.storage.saveCharacter(ch, this.charactersMap);
  }

  resetCharacterTurnActions(charId) {
    const ch = this.charactersMap[charId] || this.getActiveChar();
    if (!ch) return;
    ch.turnActions = { ...DEFAULT_TURN_ACTIONS };
    this.renderAll();
    this.storage.saveCharacter(ch, this.charactersMap);
    showToast(`Ações de turno de ${ch.name} restauradas!`);
  }

  consumeTurnAction(charId, actionKey, labelName = 'Ação') {
    const ch = this.charactersMap[charId] || this.getActiveChar();
    if (!ch || actionKey === 'livre') return;
    if (!ch.turnActions) ch.turnActions = { ...DEFAULT_TURN_ACTIONS };
    ch.turnActions[actionKey] = false;
    this.renderAll();
    this.storage.saveCharacter(ch, this.charactersMap);
    const meta = getActionTypeMeta(actionKey);
    showToast(`${ch.name} gastou ${meta.label} (${labelName})`);
  }

  setActionFilterMode(mode) {
    this.actionFilterMode = mode;
    const char = this.getActiveChar();
    if (char) renderPlayerActionEconomyAndFilter(char, this.actionFilterMode);
  }

  setSkillSortMode(mode) {
    this.skillSortMode = mode;
    renderSkillsList(this.getActiveChar(), this.skillSortMode, true);
  }

  // --- NAVEGAÇÃO E VISÃO DO MESTRE (PROTEGIDA POR LOGIN) ---
  setViewMode(mode) {
    if (mode === 'gm' && !this.isGMUser()) {
      showToast('Acesso bloqueado! Apenas usuários autenticados como Mestre podem acessar o Painel do Mestre.', 'error');
      return;
    }
    this.viewMode = (mode === this.viewMode && mode === 'gm') ? 'sheet' : mode;
    this.renderAll();
  }

  handleCharacterSelect(charId) {
    if (!charId) return;
    const visible = getVisibleCharactersForUser(this.charactersMap, this.currentUser);
    if (!this.isGMUser() && !visible.some(c => c.id === charId)) {
      showToast('Você só pode visualizar as fichas criadas pela sua conta.', 'error');
      return;
    }
    this.activeCharacterId = charId;
    this.viewMode = 'sheet';
    this.renderAll();
  }

  openCharacterFromGM(charId) {
    if (!charId || !this.charactersMap[charId]) return;
    const visible = getVisibleCharactersForUser(this.charactersMap, this.currentUser);
    if (!this.isGMUser() && !visible.some(c => c.id === charId)) return;
    this.activeCharacterId = charId;
    this.viewMode = 'sheet';
    this.renderAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  gmQuickVital(charId, vitalKey, delta) {
    if (!this.isGMUser()) return;
    const ch = this.charactersMap[charId];
    if (!ch?.vitals?.[vitalKey]) return;
    ch.vitals[vitalKey].current = clamp((Number(ch.vitals[vitalKey].current) || 0) + delta, 0, 9999);
    this.renderAll();
    this.storage.saveCharacter(ch, this.charactersMap);
  }

  switchSheetTab(tabName) {
    this.activeSheetTab = tabName;
    renderSheetTabsUI(this.activeSheetTab);
  }

  // --- ATUALIZAÇÃO DE CAMPOS E VITAIS ---
  updateField(field, value) {
    const char = this.getActiveChar();
    if (!char) return;

    const normalizedValue = (field === 'potionProgress' || field === 'corruptionLevel')
      ? clamp(value, 0, 100)
      : value;

    char[field] = normalizedValue;

    if (field === 'potionProgress') {
      setInputValueIfNotFocused('charPotionProgress', normalizedValue);
      setInputValueIfNotFocused('charPotionSlider', normalizedValue);
      document.getElementById('potionProgressBar').style.width = `${normalizedValue}%`;
    } else if (field === 'corruptionLevel') {
      setInputValueIfNotFocused('charCorruptionLevel', normalizedValue);
      setInputValueIfNotFocused('charCorruptionSlider', normalizedValue);
      document.getElementById('corruptionProgressBar').style.width = `${normalizedValue}%`;
    } else if (field === 'proficiencyBonus') {
      renderSavingThrowsSection(char);
      renderSkillsList(char, this.skillSortMode);
    } else if (['name', 'pathway', 'sequence'].includes(field)) {
      renderTopNavigation(this.charactersMap, this.activeCharacterId, this.viewMode, this.campaignState, this.currentUser);
    }

    this.scheduleAutoSave();
  }

  adjustPotionProgress(delta) {
    const char = this.getActiveChar();
    if (!char) return;
    this.updateField('potionProgress', (Number(char.potionProgress) || 0) + delta);
  }

  updateVital(vitalKey, prop, val) {
    const char = this.getActiveChar();
    if (!char) return;
    if (!char.vitals) char.vitals = {};
    if (!char.vitals[vitalKey]) char.vitals[vitalKey] = { current: 10, max: 10, temp: 0 };
    char.vitals[vitalKey][prop] = val;
    this.renderAll();
    this.scheduleAutoSave();
  }

  modifyVital(vitalKey, delta) {
    const char = this.getActiveChar();
    if (!char?.vitals?.[vitalKey]) return;
    char.vitals[vitalKey].current = clamp((Number(char.vitals[vitalKey].current) || 0) + delta, 0, 9999);
    this.renderAll();
    this.scheduleAutoSave();
  }

  updateAttribute(attrKey, field, val) {
    const char = this.getActiveChar();
    if (!char) return;
    if (!char.attributes) char.attributes = {};
    if (!char.attributes[attrKey]) char.attributes[attrKey] = { value: 10, bonus: 0 };
    char.attributes[attrKey][field] = val;
    renderCharacterSheet(char, this.activeSheetTab, this.skillSortMode, this.actionFilterMode, this.campaignState, this.currentUser, this.storeUIState);
    this.scheduleAutoSave();
  }

  toggleSaveProficiency(saveKey) {
    const char = this.getActiveChar();
    if (!char) return;
    if (!char.savingThrows) char.savingThrows = {};
    if (!char.savingThrows[saveKey]) char.savingThrows[saveKey] = { proficient: false, bonus: 0 };
    char.savingThrows[saveKey].proficient = !char.savingThrows[saveKey].proficient;
    renderSavingThrowsSection(char, true);
    this.scheduleAutoSave();
  }

  updateSaveBonus(saveKey, val) {
    const char = this.getActiveChar();
    if (!char) return;
    if (!char.savingThrows) char.savingThrows = {};
    if (!char.savingThrows[saveKey]) char.savingThrows[saveKey] = { proficient: false, bonus: 0 };
    char.savingThrows[saveKey].bonus = val;
    renderSavingThrowsSection(char, false);
    this.scheduleAutoSave();
  }

  filterSkills() {
    renderSkillsList(this.getActiveChar(), this.skillSortMode, true);
  }

  cycleSkillProficiency(skillId) {
    const char = this.getActiveChar();
    if (!char) return;
    const def = SKILLS_DEF.find(s => s.id === skillId);
    if (!char.skills) char.skills = {};
    if (!char.skills[skillId]) char.skills[skillId] = { attr: def?.defaultAttr || 'int', profLevel: 0, bonus: 0 };
    char.skills[skillId].profLevel = ((char.skills[skillId].profLevel || 0) + 1) % 3;
    renderSkillsList(char, this.skillSortMode, true);
    this.scheduleAutoSave();
  }

  updateSkillField(skillId, field, value) {
    const char = this.getActiveChar();
    if (!char) return;
    const def = SKILLS_DEF.find(s => s.id === skillId);
    if (!char.skills) char.skills = {};
    if (!char.skills[skillId]) char.skills[skillId] = { attr: def?.defaultAttr || 'int', profLevel: 0, bonus: 0 };
    char.skills[skillId][field] = value;
    renderSkillsList(char, this.skillSortMode, field === 'attr');
    this.scheduleAutoSave();
  }

  // --- COLEÇÕES E CONTROLE DE MUNIÇÃO ---
  renderSpecificCollection(char, collectionKey, forceRebuild = false) {
    const rendererMap = {
      weapons: () => renderWeaponsList(char, forceRebuild),
      equipment: () => renderEquipmentList(char, forceRebuild),
      powers: () => renderMysticList(char, 'powers', forceRebuild),
      spells: () => renderMysticList(char, 'spells', forceRebuild),
      mutations: () => renderMutationsList(char, forceRebuild),
      resistances: () => renderResistancesAndWeaknesses(char, forceRebuild),
      weaknesses: () => renderResistancesAndWeaknesses(char, forceRebuild)
    };
    if (rendererMap[collectionKey]) rendererMap[collectionKey]();
    renderPlayerActionEconomyAndFilter(char, this.actionFilterMode);
  }

  addCollectionItem(collectionKey) {
    const char = this.getActiveChar();
    if (!char) return;
    if (!Array.isArray(char[collectionKey])) char[collectionKey] = [];
    char[collectionKey].push(createCollectionItemTemplate(collectionKey, char));
    this.renderSpecificCollection(char, collectionKey, true);
    this.scheduleAutoSave();
  }

  updateCollectionItem(collectionKey, index, field, value, shouldReRender = false) {
    const char = this.getActiveChar();
    if (!char?.[collectionKey]?.[index]) return;
    char[collectionKey][index][field] = value;
    if (shouldReRender) {
      this.renderSpecificCollection(char, collectionKey, true);
    } else {
      this.renderSpecificCollection(char, collectionKey, false);
    }
    this.scheduleAutoSave();
  }

  removeCollectionItem(collectionKey, index) {
    const char = this.getActiveChar();
    if (!char?.[collectionKey]) return;
    char[collectionKey].splice(index, 1);
    this.renderSpecificCollection(char, collectionKey, true);
    this.scheduleAutoSave();
  }

  adjustWeaponAmmo(idx, delta) {
    const char = this.getActiveChar();
    const w = char?.weapons?.[idx];
    if (!w) return;
    const max = Math.max(1, Number(w.ammoMax ?? 6));
    w.ammoCurrent = clamp((Number(w.ammoCurrent ?? max) + delta), 0, max);
    this.renderSpecificCollection(char, 'weapons', true);
    this.scheduleAutoSave();
  }

  reloadWeapon(idx) {
    const char = this.getActiveChar();
    const w = char?.weapons?.[idx];
    if (!w) return;
    w.ammoCurrent = Math.max(1, Number(w.ammoMax ?? 6));
    this.renderSpecificCollection(char, 'weapons', true);
    this.scheduleAutoSave();
    showToast(`${w.name} recarregada (${w.ammoCurrent}/${w.ammoMax})!`);
  }

  useMysticResource(collectionKey, index, consumeAction = false) {
    const char = this.getActiveChar();
    const item = char?.[collectionKey]?.[index];
    if (!char || !item) return;

    const isPower = collectionKey === 'powers';
    const cost = Number(item.cost) || 0;
    const actionKey = item.actionType || 'padrao';
    const actionMeta = getActionTypeMeta(actionKey);

    if (cost > 0 && char.vitals?.sp) {
      char.vitals.sp.current = Math.max(0, (Number(char.vitals.sp.current) || 0) - cost);
    }

    if (consumeAction && actionKey !== 'livre') {
      if (!char.turnActions) char.turnActions = { ...DEFAULT_TURN_ACTIONS };
      char.turnActions[actionKey] = false;
    }

    this.renderAll();
    this.scheduleAutoSave();

    this.publishRoll({
      characterId: char.id,
      campaignId: this.getActiveCampaign()?.id || null,
      characterName: char.name,
      title: `${isPower ? 'Poder' : 'Magia/Ritual'}: ${item.name}`,
      subtitle: `${actionMeta.label} • Gastou ${cost} PE`,
      formula: actionMeta.short,
      naturalRoll: null,
      total: `-${cost} PE`,
      details: item.description ? item.description.substring(0, 120) : 'Habilidade utilizada.',
      isCrit: false,
      isFail: false
    });

    showToast(`${char.name} utilizou ${item.name} (-${cost} PE • ${actionMeta.short})`);
  }

  // --- ROLAGENS DE DADOS ---
  setRollMode(mode) {
    this.rollMode = mode;
    ['normal', 'advantage', 'disadvantage'].forEach(m => {
      const btn = document.getElementById(`rollMode-${m}`);
      if (!btn) return;
      if (m === mode) {
        btn.className = m === 'advantage'
          ? 'py-1.5 rounded-md text-xs font-bold transition-all bg-emerald-500 text-obsidian-950'
          : m === 'disadvantage'
          ? 'py-1.5 rounded-md text-xs font-bold transition-all bg-crimson-500 text-white'
          : 'py-1.5 rounded-md text-xs font-bold transition-all bg-brass-500 text-obsidian-950';
      } else {
        btn.className = 'py-1.5 rounded-md text-xs font-bold transition-all text-slate-400 hover:text-slate-200';
      }
    });
  }

  async publishRoll(rollEntry) {
    const char = this.getActiveChar();
    const enriched = {
      characterId: rollEntry.characterId ?? (char ? char.id : null),
      campaignId: rollEntry.campaignId ?? (this.getActiveCampaign()?.id || null),
      ...rollEntry
    };
    this.diceLogs = await this.storage.publishDiceLog(enriched, this.diceLogs);
    renderDiceLogs(this.diceLogs, this.campaignState, this.activeCharacterId, this.viewMode, this.currentUser);
  }

  executeD20({ title, subtitle, modifier }) {
    const char = this.getActiveChar();
    const forceBonusDie = !!document.getElementById('useBonusDieNow')?.checked;
    const result = buildD20RollResult({
      character: char,
      title,
      subtitle,
      modifier,
      rollMode: this.rollMode,
      forceBonusDie
    });
    this.publishRoll({
      ...result,
      characterId: char ? char.id : null
    });
  }

  rollAttributeCheck(attrKey) {
    const char = this.getActiveChar();
    if (!char) return;
    const def = ATTRIBUTES_DEF.find(a => a.key === attrKey);
    const data = char.attributes?.[attrKey] || { value: 10, bonus: 0 };
    this.executeD20({
      title: `Teste de ${def ? def.name : attrKey.toUpperCase()}`,
      subtitle: 'Atributo Principal',
      modifier: calcAttrMod(data.value, data.bonus)
    });
  }

  rollInitiative() {
    const char = this.getActiveChar();
    if (!char) return;
    const data = char.attributes?.agi || { value: 10, bonus: 0 };
    const forceBonusDie = !!document.getElementById('useBonusDieNow')?.checked;
    const result = buildD20RollResult({
      character: char,
      title: 'Iniciativa',
      subtitle: 'Reflexo de Combate (AGI)',
      modifier: calcAttrMod(data.value, data.bonus),
      rollMode: this.rollMode,
      forceBonusDie
    });
    this.publishRoll({
      ...result,
      characterId: char.id
    });

    const participant = (this.combatState.participants || []).find(p => p.charId === char.id);
    if (participant && typeof result.total === 'number') {
      participant.initiative = result.total;
      renderCombatBar(this.combatState, this.charactersMap, this.viewMode, this.campaignState, this.activeCharacterId, this.currentUser);
      this.storage.saveCombatState(this.combatState);
    }
  }

  rollSavingThrow(saveKey) {
    const char = this.getActiveChar();
    if (!char) return;
    const def = SAVING_THROWS_DEF.find(s => s.key === saveKey);
    const svData = char.savingThrows?.[saveKey] || { proficient: false, bonus: 0 };
    const attrObj = char.attributes?.[def.defaultAttr] || { value: 10, bonus: 0 };
    const profBonus = Number(char.proficiencyBonus) || 2;
    const totalMod = calcAttrMod(attrObj.value, attrObj.bonus) + (svData.proficient ? profBonus : 0) + (Number(svData.bonus) || 0);

    this.executeD20({
      title: `Resistência: ${def.name}`,
      subtitle: svData.proficient ? 'Proficiente' : 'Teste de Resistência',
      modifier: totalMod
    });
  }

  rollSkillCheck(skillId) {
    const char = this.getActiveChar();
    if (!char) return;
    const def = SKILLS_DEF.find(s => s.id === skillId);
    const skData = char.skills?.[skillId] || { attr: def.defaultAttr, profLevel: 0, bonus: 0 };
    const chosenAttr = skData.attr || def.defaultAttr;
    const attrObj = char.attributes?.[chosenAttr] || { value: 10, bonus: 0 };
    const profBonus = Number(char.proficiencyBonus) || 2;
    const totalMod = calcAttrMod(attrObj.value, attrObj.bonus) + ((skData.profLevel || 0) * profBonus) + (Number(skData.bonus) || 0);
    const trainLabel = skData.profLevel === 2 ? 'Especialista' : (skData.profLevel === 1 ? 'Proficiente' : 'Destreinado');

    this.executeD20({
      title: `Perícia: ${def.name}`,
      subtitle: `${chosenAttr.toUpperCase()} • ${trainLabel}`,
      modifier: totalMod
    });
  }

  rollWeaponAttack(idx, consumeAction = false) {
    const char = this.getActiveChar();
    const w = char?.weapons?.[idx];
    if (!w) return;

    const isFirearm = w.isFirearm !== false && (w.isFirearm || w.ammoMax > 0);
    if (isFirearm) {
      const currentAmmo = Number(w.ammoCurrent ?? 0);
      if (currentAmmo <= 0) {
        showToast(`Sem munição em ${w.name}! Recarregue antes de disparar.`, 'error');
        return;
      }
      w.ammoCurrent = currentAmmo - 1;
    }

    const actionKey = w.actionType || 'padrao';
    const actionMeta = getActionTypeMeta(actionKey);
    if (consumeAction && actionKey !== 'livre') {
      if (!char.turnActions) char.turnActions = { ...DEFAULT_TURN_ACTIONS };
      char.turnActions[actionKey] = false;
    }

    this.renderAll();
    this.scheduleAutoSave();

    const ammoSubtitle = isFirearm ? ` • Munição restante: ${w.ammoCurrent}/${w.ammoMax ?? 6}` : '';
    this.executeD20({
      title: `Ataque: ${w.name}`,
      subtitle: `${actionMeta.short} • ${w.type || 'Ataque'}${ammoSubtitle}`,
      modifier: Number(w.attackBonus) || 0
    });
  }

  rollWeaponDamage(idx) {
    const char = this.getActiveChar();
    const w = char?.weapons?.[idx];
    if (!w) return;

    const result = buildFormulaRollResult({
      characterName: char.name,
      title: `Dano: ${w.name}`,
      subtitle: w.type || 'Rolagem de Dano',
      expr: w.damage || '1d6'
    });

    if (!result) {
      showToast('Formato de dano inválido. Use ex: 1d8+3', 'error');
      return;
    }
    this.publishRoll({
      ...result,
      characterId: char.id
    });
  }

  rollCustomDie(sides) {
    const char = this.getActiveChar();
    const charName = char ? char.name : (this.currentUser?.name || 'Mestre');
    const count = clamp(Number(document.getElementById('customDiceCount')?.value) || 1, 1, 20);
    const mod = Number(document.getElementById('customDiceMod')?.value) || 0;

    if (sides === 20 && count === 1) {
      this.executeD20({
        title: 'Rolagem Livre (1d20)',
        subtitle: 'Oráculo de Dados',
        modifier: mod
      });
      return;
    }

    const rolls = [];
    let sum = 0;
    for (let i = 0; i < count; i++) {
      const r = rollSingleDie(sides);
      rolls.push(r);
      sum += r;
    }

    const forceBonusDie = !!document.getElementById('useBonusDieNow')?.checked;
    const bonusObj = evaluateBonusDie(char, forceBonusDie);
    const total = sum + mod + bonusObj.value;
    playDiceSound(false, false);

    this.publishRoll({
      characterId: char ? char.id : null,
      characterName: charName,
      title: `Rolagem ${count}d${sides}`,
      subtitle: 'Oráculo Customizado',
      formula: `${count}d${sides}${mod !== 0 ? formatSigned(mod) : ''}`,
      naturalRoll: null,
      total,
      details: `Dados: [${rolls.join(', ')}] ${mod !== 0 ? formatSigned(mod) : ''} ${bonusObj.text}`,
      isCrit: false,
      isFail: false
    });
  }

  async clearDiceLogs() {
    if (!this.isGMUser()) {
      showToast('Apenas o Mestre pode limpar o histórico global de dados da mesa.', 'error');
      return;
    }
    await this.storage.clearAllDiceLogs(this.diceLogs);
    this.diceLogs = [];
    renderDiceLogs(this.diceLogs, this.campaignState, this.activeCharacterId, this.viewMode, this.currentUser);
    showToast('Histórico de rolagens limpo');
  }

  // --- MODAIS DE CRIAÇÃO E EXCLUSÃO DE FICHA ---
  toggleSound() {
    toggleSoundState();
  }

  toggleMobileDiceDrawer() {
    document.getElementById('diceSidebar')?.scrollIntoView({ behavior: 'smooth' });
  }

  openNewCharacterModal() {
    document.getElementById('modalCharName').value = '';
    document.getElementById('modalCharPlayer').value = this.currentUser?.name || '';
    document.getElementById('modalCharPathway').value = 'Vidente (Tolo)';
    document.getElementById('modalCharSeq').value = '9';
    document.getElementById('modalCharPotion').value = 'Vidente';
    const modal = document.getElementById('newCharModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeNewCharacterModal() {
    const modal = document.getElementById('newCharModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async confirmCreateCharacter() {
    const name = document.getElementById('modalCharName').value.trim() || 'Novo Beyonder';
    const player = document.getElementById('modalCharPlayer').value.trim() || this.currentUser?.name || 'Jogador';
    const pathway = document.getElementById('modalCharPathway').value.trim() || 'Vidente (Tolo)';
    const sequence = document.getElementById('modalCharSeq').value;
    const potionName = document.getElementById('modalCharPotion').value.trim() || 'Iniciado';

    const activeCamp = this.getActiveCampaign();
    const newChar = createDefaultCharacter({
      ownerUid: this.currentUser?.uid || null,
      ownerEmail: this.currentUser?.email || '',
      name,
      player,
      pathway,
      sequence,
      potionName,
      potionProgress: 0,
      weapons: [],
      equipment: [],
      powers: [],
      spells: [],
      mutations: [],
      resistances: [],
      weaknesses: [],
      weeklyDowntime: createDefaultWeeklyDowntime(activeCamp?.currentWeek || 1)
    });

    this.charactersMap[newChar.id] = newChar;
    this.activeCharacterId = newChar.id;

    // Se quem criou for o Mestre, já adiciona na campanha ativa; se for jogador, fica visível para o Mestre escalar na campanha
    if (this.isGMUser() && activeCamp) {
      if (!Array.isArray(activeCamp.characterIds)) activeCamp.characterIds = [];
      activeCamp.characterIds.push(newChar.id);
      await this.storage.saveCampaignState(this.campaignState);
    }

    this.viewMode = 'sheet';
    this.closeNewCharacterModal();
    this.renderAll();
    await this.storage.saveCharacter(newChar, this.charactersMap);
    showToast(
      this.isGMUser()
        ? `Ficha de ${name} criada e adicionada à campanha!`
        : `Ficha de ${name} criada! O Mestre já pode vê-la e adicioná-la à campanha.`
    );
  }

  async seedSampleCharacters() {
    if (!this.isGMUser()) return;
    const camp = this.getActiveCampaign();
    for (const ch of getSampleCharactersList()) {
      this.charactersMap[ch.id] = ch;
      if (camp && Array.isArray(camp.characterIds) && !camp.characterIds.includes(ch.id)) {
        camp.characterIds.push(ch.id);
      }
      await this.storage.saveCharacter(ch, this.charactersMap);
    }
    if (camp) {
      await this.storage.saveCampaignState(this.campaignState);
    }
    this.ensureValidActiveCharacterForUser();
    this.renderAll();
    showToast('Fichas de exemplo geradas para a mesa!');
  }

  promptDeleteCharacterById(charId) {
    const target = this.charactersMap[charId];
    if (!target) return;
    this.deleteTargetCharId = target.id;
    document.getElementById('deleteCharNameSpan').textContent = target.name;
    const modal = document.getElementById('deleteCharModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  openDeleteCharacterModal() {
    const char = this.getActiveChar();
    if (!char) {
      showToast('Nenhuma ficha selecionada para excluir.', 'error');
      return;
    }
    this.promptDeleteCharacterById(char.id);
  }

  closeDeleteCharacterModal() {
    this.deleteTargetCharId = null;
    const modal = document.getElementById('deleteCharModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }

  async confirmDeleteCharacter() {
    const targetId = this.deleteTargetCharId || this.activeCharacterId;
    const char = targetId ? this.charactersMap[targetId] : this.getActiveChar();
    if (!char) return;
    const deletedId = char.id;
    const deletedName = char.name;

    delete this.charactersMap[deletedId];
    await this.storage.deleteCharacter(deletedId, this.charactersMap);

    (this.campaignState?.campaigns || []).forEach(c => {
      if (Array.isArray(c.characterIds)) {
        c.characterIds = c.characterIds.filter(id => id !== deletedId);
      }
    });
    if (this.isGMUser()) {
      await this.storage.saveCampaignState(this.campaignState);
    }

    this.deleteTargetCharId = null;
    this.ensureValidActiveCharacterForUser();
    this.closeDeleteCharacterModal();
    this.renderAll();
    showToast(`Ficha de ${deletedName} excluída permanentemente.`);
  }

  // --- UPLOAD DE IMAGEM / RETRATO DO PERSONAGEM ---
  triggerCharacterAvatarUpload() {
    const char = this.getActiveChar();
    if (!char) return;
    document.getElementById('charAvatarFileInput')?.click();
  }

  handleCharacterAvatarUpload(event) {
    const file = event?.target?.files?.[0];
    const char = this.getActiveChar();
    if (!file || !char) return;

    if (!file.type.startsWith('image/')) {
      showToast('Selecione um arquivo de imagem válido (PNG, JPG, WEBP).', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = async () => {
        // Redimensiona e comprime via canvas para manter leve no banco Cloud (Firestore) e localStorage
        const maxDim = 340;
        let w = img.width;
        let h = img.height;
        if (w > h && w > maxDim) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else if (h >= w && h > maxDim) {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);

        char.avatarUrl = dataUrl;
        this.renderAll();
        await this.storage.saveCharacter(char, this.charactersMap);
        showToast(`Foto de ${char.name} atualizada com sucesso!`, 'crit');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }

  async updateCharacterAvatarUrl(url) {
    const char = this.getActiveChar();
    if (!char) return;
    char.avatarUrl = String(url || '').trim();
    this.renderAll();
    await this.storage.saveCharacter(char, this.charactersMap);
    if (char.avatarUrl) {
      showToast('URL da imagem do personagem salva!');
    }
  }

  async clearCharacterAvatar() {
    const char = this.getActiveChar();
    if (!char) return;
    char.avatarUrl = '';
    const urlInput = document.getElementById('charAvatarUrlInput');
    if (urlInput) urlInput.value = '';
    this.renderAll();
    await this.storage.saveCharacter(char, this.charactersMap);
    showToast('Imagem do personagem removida.');
  }

  // --- LOJA DA CAMPANHA & ABA DE CONTRIBUIÇÕES ---
  getCampaignForChar(char) {
    const campaigns = this.campaignState?.campaigns || [];
    if (char) {
      const matched = campaigns.find(c => Array.isArray(c.characterIds) && c.characterIds.includes(char.id));
      if (matched) return matched;
    }
    return this.getActiveCampaign();
  }

  openGMStoreManager() {
    if (!this.isGMUser()) {
      showToast('Apenas o Mestre pode personalizar a loja da campanha.', 'error');
      return;
    }
    this.viewMode = 'gm';
    this.activeGMSubTab = 'store';
    this.renderAll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  setStoreSubTab(subTab) {
    this.storeUIState.subTab = subTab;
    renderCampaignStoreTab(this.getActiveChar(), this.campaignState, this.currentUser, this.storeUIState);
  }

  setStoreCategoryFilter(catKey) {
    this.storeUIState.categoryFilter = catKey;
    renderCampaignStoreTab(this.getActiveChar(), this.campaignState, this.currentUser, this.storeUIState);
  }

  setStoreSearchText(txt) {
    this.storeUIState.searchText = txt;
    renderCampaignStoreTab(this.getActiveChar(), this.campaignState, this.currentUser, this.storeUIState);
  }

  async gmAddStoreItem() {
    if (!this.isGMUser()) {
      showToast('Apenas o Mestre pode personalizar os itens da loja.', 'error');
      return;
    }
    const camp = this.getActiveCampaign();
    if (!camp) return;
    if (!Array.isArray(camp.storeItems)) camp.storeItems = [];

    const name = document.getElementById('newStoreItemName')?.value.trim();
    if (!name) {
      showToast('Informe o nome do item para adicionar à loja.', 'error');
      return;
    }
    const category = document.getElementById('newStoreItemCategory')?.value || 'equipamentos';
    const paymentMode = document.getElementById('newStoreItemPaymentMode')?.value || 'both';
    const priceGold = Math.max(0, Number(document.getElementById('newStoreItemGold')?.value) || 0);
    const priceContrib = Math.max(0, Number(document.getElementById('newStoreItemContrib')?.value) || 0);
    const stock = Number(document.getElementById('newStoreItemStock')?.value ?? -1);
    const grade = document.getElementById('newStoreItemGrade')?.value.trim() || 'Item da Campanha';
    const description = document.getElementById('newStoreItemDesc')?.value.trim() || '';

    camp.storeItems.unshift({
      id: `st_${Date.now()}`,
      name,
      category,
      paymentMode,
      priceGold,
      priceContrib,
      stock,
      grade,
      description
    });

    this.renderAll();
    await this.storage.saveCampaignState(this.campaignState);
    showToast(`"${name}" adicionado à Loja da Campanha!`, 'crit');
  }

  async gmUpdateStoreItem(itemId, field, value) {
    if (!this.isGMUser()) return;
    const camp = this.getActiveCampaign();
    const item = (camp?.storeItems || []).find(i => i.id === itemId);
    if (!item) return;
    item[field] = value;
    this.renderAll();
    await this.storage.saveCampaignState(this.campaignState);
  }

  async gmRemoveStoreItem(itemId) {
    if (!this.isGMUser()) return;
    const camp = this.getActiveCampaign();
    if (!camp || !Array.isArray(camp.storeItems)) return;
    camp.storeItems = camp.storeItems.filter(i => i.id !== itemId);
    this.renderAll();
    await this.storage.saveCampaignState(this.campaignState);
    showToast('Item retirado da loja.');
  }

  async gmSetPlayerStoreBalance(charId, field, value) {
    if (!this.isGMUser()) return;
    const ch = this.charactersMap[charId];
    if (!ch) return;
    ch[field] = Math.max(0, Number(value) || 0);
    this.renderAll();
    await this.storage.saveCharacter(ch, this.charactersMap);
    showToast(`Saldo de ${ch.name} atualizado!`);
  }

  async buyCampaignStoreItem(itemId, paymentType = 'gold') {
    const char = this.getActiveChar();
    const camp = this.getCampaignForChar(char);
    if (!char || !camp) return;

    const item = (camp.storeItems || []).find(i => i.id === itemId);
    if (!item) return;
    if (item.stock === 0) {
      showToast('Este item está esgotado na loja.', 'error');
      return;
    }

    const pMode = item.paymentMode || 'both';
    if (paymentType === 'gold' && pMode === 'contrib_only') {
      showToast('Este item só pode ser resgatado com Pontos de Contribuição!', 'error');
      return;
    }
    if (paymentType === 'contrib' && pMode === 'gold_only') {
      showToast('Este item só pode ser comprado com Dinheiro (Libras £)!', 'error');
      return;
    }

    if (paymentType === 'contrib') {
      const costPts = Number(item.priceContrib) || 0;
      const curPts = Number(char.contributionPoints) || 0;
      if (curPts < costPts) {
        showToast(`Pontos de Contribuição insuficientes (${curPts}/${costPts} pts).`, 'error');
        return;
      }
      char.contributionPoints = curPts - costPts;
    } else {
      const costGold = Number(item.priceGold) || 0;
      const curGold = Number(char.currencyGold) || 0;
      if (curGold < costGold) {
        showToast(`Libras de Ouro insuficientes (${curGold}/${costGold} £).`, 'error');
        return;
      }
      char.currencyGold = curGold - costGold;
    }

    if (typeof item.stock === 'number' && item.stock > 0) {
      item.stock -= 1;
    }

    const catToEqMap = {
      armas: 'Instrumento Místico',
      pocoes: 'Amuleto / Ingrediente',
      ingredientes: 'Amuleto / Ingrediente',
      artefatos: 'Artefato Selado Grau 3',
      amuletos: 'Amuleto / Ingrediente',
      equipamentos: 'Equipamento Geral'
    };

    if (!Array.isArray(char.equipment)) char.equipment = [];
    char.equipment.push({
      id: `eq_${Date.now()}`,
      name: item.name,
      category: catToEqMap[item.category] || 'Equipamento Geral',
      quantity: 1,
      description: `${item.grade ? `[${item.grade}] ` : ''}${item.description || 'Adquirido na Loja da Campanha.'}`
    });

    if (!Array.isArray(camp.contributionLogs)) camp.contributionLogs = [];
    camp.contributionLogs.unshift({
      id: `clog_${Date.now()}`,
      charName: char.name,
      actionText: `adquiriu "${item.name}" na Loja`,
      deltaText: paymentType === 'contrib' ? `-${item.priceContrib} pts` : `-${item.priceGold} £`,
      dateStr: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    this.renderAll();
    await this.storage.saveCharacter(char, this.charactersMap);
    await this.storage.saveCampaignStoreTransaction(this.campaignState);

    showToast(`${char.name} adquiriu "${item.name}"! O item foi adicionado à ficha.`, 'crit');
  }

  async submitCustomContribution() {
    const char = this.getActiveChar();
    const camp = this.getCampaignForChar(char);
    if (!char || !camp) return;

    const desc = document.getElementById('customContribDescInput')?.value.trim();
    const donateGold = Math.max(0, Number(document.getElementById('customContribDonateGold')?.value) || 0);
    const ptsGain = Math.max(1, Number(document.getElementById('customContribPointsGain')?.value) || 0);

    if (!desc) {
      showToast('Descreva a contribuição ou entrega realizada.', 'error');
      return;
    }

    if (donateGold > 0) {
      if ((Number(char.currencyGold) || 0) < donateGold) {
        showToast('Você não possui essa quantidade de Libras para doar.', 'error');
        return;
      }
      char.currencyGold = (Number(char.currencyGold) || 0) - donateGold;
    }

    char.contributionPoints = (Number(char.contributionPoints) || 0) + ptsGain;

    if (!Array.isArray(camp.contributionLogs)) camp.contributionLogs = [];
    camp.contributionLogs.unshift({
      id: `clog_${Date.now()}`,
      charName: char.name,
      actionText: `contribuiu: ${desc}${donateGold > 0 ? ` (Doou ${donateGold}£)` : ''}`,
      deltaText: `+${ptsGain} pts`,
      dateStr: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    this.renderAll();
    await this.storage.saveCharacter(char, this.charactersMap);
    await this.storage.saveCampaignStoreTransaction(this.campaignState);

    showToast(`Contribuição registrada! +${ptsGain} Pontos de Contribuição para ${char.name}.`, 'crit');
  }

  async gmAddContributionTask() {
    if (!this.isGMUser()) return;
    const camp = this.getActiveCampaign();
    if (!camp) return;
    if (!Array.isArray(camp.contributionTasks)) camp.contributionTasks = [];

    const title = document.getElementById('newContribTaskTitle')?.value.trim();
    const description = document.getElementById('newContribTaskDesc')?.value.trim() || '';
    const rewardPoints = Math.max(1, Number(document.getElementById('newContribTaskPts')?.value) || 25);

    if (!title) {
      showToast('Informe o título da tarefa de contribuição.', 'error');
      return;
    }

    camp.contributionTasks.unshift({
      id: `ct_${Date.now()}`,
      title,
      category: 'Missão da Campanha',
      rewardPoints,
      rewardGold: 0,
      description
    });

    this.renderAll();
    await this.storage.saveCampaignState(this.campaignState);
    showToast(`Tarefa "${title}" adicionada à aba de Contribuições!`, 'crit');
  }

  async gmRemoveContributionTask(taskId) {
    if (!this.isGMUser()) return;
    const camp = this.getActiveCampaign();
    if (!camp || !Array.isArray(camp.contributionTasks)) return;
    camp.contributionTasks = camp.contributionTasks.filter(t => t.id !== taskId);
    this.renderAll();
    await this.storage.saveCampaignState(this.campaignState);
    showToast('Tarefa de contribuição removida.');
  }

  async completeContributionTask(taskId) {
    const char = this.getActiveChar();
    const camp = this.getCampaignForChar(char);
    if (!char || !camp) return;

    const task = (camp.contributionTasks || []).find(t => t.id === taskId);
    if (!task) return;

    const pts = Number(task.rewardPoints) || 0;
    const gold = Number(task.rewardGold) || 0;
    char.contributionPoints = (Number(char.contributionPoints) || 0) + pts;
    if (gold > 0) {
      char.currencyGold = (Number(char.currencyGold) || 0) + gold;
    }

    if (!Array.isArray(camp.contributionLogs)) camp.contributionLogs = [];
    camp.contributionLogs.unshift({
      id: `clog_${Date.now()}`,
      charName: char.name,
      actionText: `cumpriu "${task.title}"`,
      deltaText: `+${pts} pts${gold > 0 ? ` / +${gold}£` : ''}`,
      dateStr: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    });

    this.renderAll();
    await this.storage.saveCharacter(char, this.charactersMap);
    await this.storage.saveCampaignStoreTransaction(this.campaignState);

    showToast(`${char.name} recebeu +${pts} Pontos de Contribuição!`, 'crit');
  }
}

const app = new BeyonderGrimoireController();
window.app = app;
window.addEventListener('DOMContentLoaded', () => app.init());
