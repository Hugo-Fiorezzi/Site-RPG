import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  addDoc
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getSampleCharactersList } from "../models/characterFactory.js";
import { DEFAULT_COMBAT_STATE, DEFAULT_CAMPAIGN_STATE, DEFAULT_USER_THEME } from "../config/constants.js";
import { sha256Hash } from "../utils/helpers.js";

const LOCAL_CHARS_KEY = 'grimorio_beyonder_characters_v1';
const LOCAL_LOGS_KEY = 'grimorio_beyonder_dicelogs_v1';
const LOCAL_COMBAT_KEY = 'grimorio_beyonder_combat_v1';
const LOCAL_CAMPAIGNS_KEY = 'grimorio_beyonder_campaigns_v1';
const LOCAL_USERS_KEY = 'grimorio_beyonder_users_v1';
const LOCAL_SESSION_KEY = 'grimorio_beyonder_session_v1';
const LOCAL_FIREBASE_CFG_KEY = 'grimorio_beyonder_firebase_config_v1';
const LOCAL_GM_SECRET_HASH_KEY = 'grimorio_beyonder_gm_secret_hash_v1';

export class StorageService {
  constructor({
    onCharactersChanged,
    onLogsChanged,
    onCombatChanged,
    onCampaignsChanged,
    onAuthChanged,
    onStatusChanged
  }) {
    this.db = null;
    this.auth = null;
    this.currentUser = null;
    this.isCloudConnected = false;
    this.appId = typeof __app_id !== 'undefined' ? __app_id : 'lotm-beyonder-rpg-table';

    this.onCharactersChanged = onCharactersChanged;
    this.onLogsChanged = onLogsChanged;
    this.onCombatChanged = onCombatChanged;
    this.onCampaignsChanged = onCampaignsChanged || (() => {});
    this.onAuthChanged = onAuthChanged || (() => {});
    this.onStatusChanged = onStatusChanged;

    this.unsubscribeFns = [];
  }

  getSavedFirebaseConfig() {
    try {
      if (typeof __firebase_config !== 'undefined' && __firebase_config) {
        return typeof __firebase_config === 'string' ? JSON.parse(__firebase_config) : __firebase_config;
      }
      const saved = localStorage.getItem(LOCAL_FIREBASE_CFG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  }

  saveCustomFirebaseConfig(configObj) {
    try {
      if (!configObj) {
        localStorage.removeItem(LOCAL_FIREBASE_CFG_KEY);
      } else {
        localStorage.setItem(LOCAL_FIREBASE_CFG_KEY, JSON.stringify(configObj));
      }
    } catch (_) {}
  }

  async ensureDefaultAccountsAndMasterKey() {
    try {
      let secretHash = localStorage.getItem(LOCAL_GM_SECRET_HASH_KEY);
      if (!secretHash) {
        secretHash = await sha256Hash('tolo');
        localStorage.setItem(LOCAL_GM_SECRET_HASH_KEY, secretHash);
      }

      let usersMap = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || 'null');
      if (!usersMap || Object.keys(usersMap).length === 0) {
        const gmPassHash = await sha256Hash('mestre123');
        const playerPassHash = await sha256Hash('jogador123');

        usersMap = {
          user_gm_default: {
            uid: 'user_gm_default',
            name: 'Mestre (O Tolo)',
            email: 'mestre@grimorio.rpg',
            role: 'gm',
            passwordHash: gmPassHash,
            theme: { ...DEFAULT_USER_THEME }
          },
          user_player_audrey: {
            uid: 'user_player_audrey',
            name: 'Jogadora 1 (Audrey)',
            email: 'audrey@grimorio.rpg',
            role: 'player',
            passwordHash: playerPassHash,
            theme: { ...DEFAULT_USER_THEME, presetId: 'noite_eterna', bgBase: '#050814', accentColor: '#38bdf8' }
          },
          user_player_alger: {
            uid: 'user_player_alger',
            name: 'Jogador 2 (Alger)',
            email: 'alger@grimorio.rpg',
            role: 'player',
            passwordHash: playerPassHash,
            theme: { ...DEFAULT_USER_THEME, presetId: 'mar_sonia', bgBase: '#040d0f', accentColor: '#10b981' }
          }
        };
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersMap));
      }
    } catch (_) {}
  }

  async verifyMasterInviteCode(codeInput) {
    const inputHash = await sha256Hash(String(codeInput || '').toLowerCase().trim());
    let storedHash = null;
    try {
      storedHash = localStorage.getItem(LOCAL_GM_SECRET_HASH_KEY);
    } catch (_) {}
    if (!storedHash) {
      storedHash = await sha256Hash('tolo');
    }
    return inputHash === storedHash;
  }

  async updateMasterInviteCode(newCode) {
    const clean = String(newCode || '').toLowerCase().trim();
    if (!clean) return false;
    const newHash = await sha256Hash(clean);
    try {
      localStorage.setItem(LOCAL_GM_SECRET_HASH_KEY, newHash);
    } catch (_) {}
    if (this.isCloudConnected && this.db) {
      try {
        const secDoc = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'security_settings', 'gm_config');
        await setDoc(secDoc, { masterCodeHash: newHash, updatedAt: Date.now() }, { merge: true });
      } catch (_) {}
    }
    return true;
  }

  async init() {
    await this.ensureDefaultAccountsAndMasterKey();

    try {
      const firebaseConfig = this.getSavedFirebaseConfig();
      if (firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId) {
        const existingApps = getApps();
        const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig);
        this.auth = getAuth(app);
        this.db = getFirestore(app);

        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(this.auth, __initial_auth_token);
        } else if (!this.auth.currentUser) {
          try {
            await signInAnonymously(this.auth);
          } catch (_) {
            // Caso Anonymous Auth esteja desativado e apenas Email/Password esteja ativo no Firebase
          }
        }

        this.isCloudConnected = true;
        this.onStatusChanged(true, this.auth.currentUser?.uid || 'Firebase Cloud');
        this.setupCloudListeners();
        this.restoreUserSession();
      } else {
        this.setupLocalPersistence();
        this.restoreUserSession();
      }
    } catch (err) {
      console.warn('Usando persistência local segura:', err);
      this.setupLocalPersistence();
      this.restoreUserSession();
    }
  }

  restoreUserSession() {
    try {
      const savedSession = JSON.parse(localStorage.getItem(LOCAL_SESSION_KEY) || 'null');
      if (savedSession && savedSession.uid) {
        const usersMap = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
        const fullProfile = usersMap[savedSession.uid] || savedSession;
        this.currentUser = fullProfile;
        this.onAuthChanged(this.currentUser);
        return;
      }
    } catch (_) {}
    this.currentUser = null;
    this.onAuthChanged(null);
  }

  async loginWithCredentials(email, password) {
    const cleanEmail = String(email || '').toLowerCase().trim();
    const passHash = await sha256Hash(password);

    // 1. Se conectado ao Firebase com Email/Password Auth, tenta autenticar ou validar no Firestore
    if (this.isCloudConnected && this.db) {
      try {
        if (this.auth) {
          try {
            await signInWithEmailAndPassword(this.auth, cleanEmail, password);
          } catch (_) {
            // Continua para validação via coleção de perfis do Firestore (permite funcionar mesmo só com Anonymous Auth habilitado)
          }
        }
        const userIdKey = `u_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;
        const userDocRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'users', userIdKey);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.passwordHash === passHash) {
            this.currentUser = data;
            try {
              localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(data));
            } catch (_) {}
            this.onAuthChanged(this.currentUser);
            return { ok: true, user: data };
          }
          return { ok: false, error: 'Senha incorreta para esta conta.' };
        }
      } catch (_) {}
    }

    // 2. Validação na base de usuários sincronizada / Local
    try {
      const usersMap = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
      const found = Object.values(usersMap).find(u => (u.email || '').toLowerCase() === cleanEmail);
      if (!found) {
        return { ok: false, error: 'Usuário não encontrado. Cadastre sua conta ou use os acessos rápidos.' };
      }
      if (found.passwordHash !== passHash) {
        return { ok: false, error: 'Senha incorreta.' };
      }

      this.currentUser = found;
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(found));
      this.onAuthChanged(this.currentUser);
      return { ok: true, user: found };
    } catch (e) {
      return { ok: false, error: 'Erro ao validar credenciais.' };
    }
  }

  async registerAccount({ name, email, password, role, masterCode }) {
    const cleanName = String(name || '').trim() || 'Beyonder';
    const cleanEmail = String(email || '').toLowerCase().trim();
    if (!cleanEmail || !password) {
      return { ok: false, error: 'Preencha e-mail/usuário e senha.' };
    }

    let finalRole = 'player';
    if (role === 'gm') {
      const validMaster = await this.verifyMasterInviteCode(masterCode);
      if (!validMaster) {
        return { ok: false, error: 'Código Secreto do Mestre inválido! Apenas o Mestre com a chave correta pode criar conta de Mestre.' };
      }
      finalRole = 'gm';
    }

    const passHash = await sha256Hash(password);
    const uid = `u_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    const newUserProfile = {
      uid,
      name: cleanName,
      email: cleanEmail,
      role: finalRole,
      passwordHash: passHash,
      theme: { ...DEFAULT_USER_THEME },
      createdAt: Date.now()
    };

    try {
      const usersMap = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
      const existing = Object.values(usersMap).find(u => (u.email || '').toLowerCase() === cleanEmail);
      if (existing) {
        return { ok: false, error: 'Já existe uma conta cadastrada com este e-mail/usuário.' };
      }
      usersMap[uid] = newUserProfile;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersMap));
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(newUserProfile));
    } catch (_) {}

    if (this.isCloudConnected && this.db) {
      try {
        if (this.auth) {
          try {
            await createUserWithEmailAndPassword(this.auth, cleanEmail, password);
          } catch (_) {}
        }
        const userDocRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'users', uid);
        await setDoc(userDocRef, newUserProfile);
      } catch (_) {}
    }

    this.currentUser = newUserProfile;
    this.onAuthChanged(this.currentUser);
    return { ok: true, user: newUserProfile };
  }

  async logoutUser() {
    this.currentUser = null;
    try {
      localStorage.removeItem(LOCAL_SESSION_KEY);
    } catch (_) {}
    if (this.isCloudConnected && this.auth) {
      try {
        await signOut(this.auth);
        await signInAnonymously(this.auth);
      } catch (_) {}
    }
    this.onAuthChanged(null);
  }

  async saveUserProfileTheme(themeObj) {
    if (!this.currentUser) return;
    this.currentUser.theme = { ...themeObj };

    try {
      localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(this.currentUser));
      const usersMap = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
      if (usersMap[this.currentUser.uid]) {
        usersMap[this.currentUser.uid].theme = { ...themeObj };
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersMap));
      }
    } catch (_) {}

    if (this.isCloudConnected && this.db) {
      try {
        const userDocRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'users', this.currentUser.uid);
        await setDoc(userDocRef, { theme: this.currentUser.theme, updatedAt: Date.now() }, { merge: true });
      } catch (_) {}
    }
  }

  setupLocalPersistence() {
    this.isCloudConnected = false;
    this.onStatusChanged(false, null);

    let savedChars = null;
    try {
      savedChars = JSON.parse(localStorage.getItem(LOCAL_CHARS_KEY) || 'null');
    } catch (_) {}

    if (!savedChars || Object.keys(savedChars).length === 0) {
      savedChars = {};
      getSampleCharactersList().forEach(ch => {
        savedChars[ch.id] = ch;
      });
      try {
        localStorage.setItem(LOCAL_CHARS_KEY, JSON.stringify(savedChars));
      } catch (_) {}
    }

    let savedCombat = null;
    try {
      savedCombat = JSON.parse(localStorage.getItem(LOCAL_COMBAT_KEY) || 'null');
    } catch (_) {}

    if (!savedCombat) {
      savedCombat = { ...DEFAULT_COMBAT_STATE };
      try {
        localStorage.setItem(LOCAL_COMBAT_KEY, JSON.stringify(savedCombat));
      } catch (_) {}
    }

    let savedCampaigns = null;
    try {
      savedCampaigns = JSON.parse(localStorage.getItem(LOCAL_CAMPAIGNS_KEY) || 'null');
    } catch (_) {}

    if (!savedCampaigns || !Array.isArray(savedCampaigns.campaigns)) {
      savedCampaigns = JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_STATE));
      try {
        localStorage.setItem(LOCAL_CAMPAIGNS_KEY, JSON.stringify(savedCampaigns));
      } catch (_) {}
    }

    let savedLogs = [];
    try {
      savedLogs = JSON.parse(localStorage.getItem(LOCAL_LOGS_KEY) || '[]');
    } catch (_) {}

    this.onCharactersChanged(savedChars);
    this.onCombatChanged(savedCombat);
    this.onCampaignsChanged(savedCampaigns);
    this.onLogsChanged(savedLogs);

    window.addEventListener('storage', (e) => {
      try {
        if (e.key === LOCAL_CHARS_KEY && e.newValue) {
          this.onCharactersChanged(JSON.parse(e.newValue));
        } else if (e.key === LOCAL_LOGS_KEY && e.newValue) {
          this.onLogsChanged(JSON.parse(e.newValue));
        } else if (e.key === LOCAL_COMBAT_KEY && e.newValue) {
          this.onCombatChanged(JSON.parse(e.newValue));
        } else if (e.key === LOCAL_CAMPAIGNS_KEY && e.newValue) {
          this.onCampaignsChanged(JSON.parse(e.newValue));
        }
      } catch (_) {}
    });
  }

  setupCloudListeners() {
    this.unsubscribeFns.forEach(fn => {
      try { fn(); } catch (_) {}
    });
    this.unsubscribeFns = [];

    const charsColRef = collection(this.db, 'artifacts', this.appId, 'public', 'data', 'characters');
    const unsubChars = onSnapshot(charsColRef, async (snapshot) => {
      const loaded = {};
      snapshot.forEach(docSnap => {
        loaded[docSnap.id] = docSnap.data();
      });

      if (Object.keys(loaded).length === 0) {
        for (const sample of getSampleCharactersList()) {
          loaded[sample.id] = sample;
          await this.saveCharacter(sample, loaded);
        }
      }
      try {
        localStorage.setItem(LOCAL_CHARS_KEY, JSON.stringify(loaded));
      } catch (_) {}
      this.onCharactersChanged(loaded);
    });
    this.unsubscribeFns.push(unsubChars);

    const logsColRef = collection(this.db, 'artifacts', this.appId, 'public', 'data', 'dice_logs');
    const unsubLogs = onSnapshot(logsColRef, (snapshot) => {
      const list = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      this.onLogsChanged(list.slice(0, 40));
    });
    this.unsubscribeFns.push(unsubLogs);

    const combatDocRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'combat_tracker', 'active_combat');
    const unsubCombat = onSnapshot(combatDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        try {
          localStorage.setItem(LOCAL_COMBAT_KEY, JSON.stringify(data));
        } catch (_) {}
        this.onCombatChanged(data);
      } else {
        await this.saveCombatState(DEFAULT_COMBAT_STATE);
        this.onCombatChanged(DEFAULT_COMBAT_STATE);
      }
    });
    this.unsubscribeFns.push(unsubCombat);

    const campaignsDocRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'campaigns_tracker', 'active_campaigns');
    const unsubCamp = onSnapshot(campaignsDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        try {
          localStorage.setItem(LOCAL_CAMPAIGNS_KEY, JSON.stringify(data));
        } catch (_) {}
        this.onCampaignsChanged(data);
      } else {
        const initial = JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_STATE));
        await this.saveCampaignState(initial);
        this.onCampaignsChanged(initial);
      }
    });
    this.unsubscribeFns.push(unsubCamp);

    const secDoc = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'security_settings', 'gm_config');
    const unsubSec = onSnapshot(secDoc, (docSnap) => {
      if (docSnap.exists() && docSnap.data().masterCodeHash) {
        try {
          localStorage.setItem(LOCAL_GM_SECRET_HASH_KEY, docSnap.data().masterCodeHash);
        } catch (_) {}
      }
    });
    this.unsubscribeFns.push(unsubSec);
  }

  async saveCharacter(charData, allCharactersMap) {
    if (!charData || !charData.id) return;
    charData.updatedAt = Date.now();

    if (allCharactersMap) {
      try {
        localStorage.setItem(LOCAL_CHARS_KEY, JSON.stringify(allCharactersMap));
      } catch (_) {}
    }

    if (this.isCloudConnected && this.db) {
      try {
        const docRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'characters', charData.id);
        await setDoc(docRef, charData);
      } catch (_) {}
    }
  }

  async deleteCharacter(charId, allCharactersMap) {
    if (allCharactersMap) {
      try {
        localStorage.setItem(LOCAL_CHARS_KEY, JSON.stringify(allCharactersMap));
      } catch (_) {}
    }

    if (this.isCloudConnected && this.db) {
      try {
        await deleteDoc(doc(this.db, 'artifacts', this.appId, 'public', 'data', 'characters', charId));
      } catch (_) {}
    }
  }

  async saveCombatState(combatState) {
    if (!combatState) return;
    combatState.updatedAt = Date.now();

    try {
      localStorage.setItem(LOCAL_COMBAT_KEY, JSON.stringify(combatState));
    } catch (_) {}

    if (this.isCloudConnected && this.db) {
      try {
        const combatDocRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'combat_tracker', 'active_combat');
        await setDoc(combatDocRef, combatState);
      } catch (_) {}
    }
  }

  async saveCampaignState(campaignState) {
    if (!campaignState) return;
    campaignState.updatedAt = Date.now();

    try {
      localStorage.setItem(LOCAL_CAMPAIGNS_KEY, JSON.stringify(campaignState));
    } catch (_) {}

    if (this.isCloudConnected && this.db) {
      try {
        const campaignsDocRef = doc(this.db, 'artifacts', this.appId, 'public', 'data', 'campaigns_tracker', 'active_campaigns');
        await setDoc(campaignsDocRef, campaignState);
      } catch (_) {}
    }
  }

  async publishDiceLog(logEntry, currentLogs) {
    const entry = { ...logEntry, timestamp: Date.now() };
    const updated = [{ id: `local_${Date.now()}`, ...entry }, ...currentLogs].slice(0, 40);
    try {
      localStorage.setItem(LOCAL_LOGS_KEY, JSON.stringify(updated));
    } catch (_) {}

    if (this.isCloudConnected && this.db) {
      try {
        const logsColRef = collection(this.db, 'artifacts', this.appId, 'public', 'data', 'dice_logs');
        await addDoc(logsColRef, entry);
        return currentLogs;
      } catch (_) {}
    }
    return updated;
  }

  async clearAllDiceLogs(currentLogs) {
    try {
      localStorage.removeItem(LOCAL_LOGS_KEY);
    } catch (_) {}

    if (this.isCloudConnected && this.db) {
      try {
        for (const l of currentLogs) {
          if (l.id && !l.id.startsWith('local_')) {
            await deleteDoc(doc(this.db, 'artifacts', this.appId, 'public', 'data', 'dice_logs', l.id));
          }
        }
      } catch (_) {}
    }
  }

  exportFullBackupJSON(charactersMap, campaignState, combatState) {
    return JSON.stringify({
      version: '2.0',
      exportedAt: new Date().toISOString(),
      charactersMap,
      campaignState,
      combatState
    }, null, 2);
  }
}