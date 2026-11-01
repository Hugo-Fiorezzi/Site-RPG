export const ATTRIBUTES_DEF = [
  { key: 'for', short: 'FOR', name: 'Força', icon: 'fa-dumbbell' },
  { key: 'agi', short: 'AGI', name: 'Agilidade', icon: 'fa-wind' },
  { key: 'con', short: 'CON', name: 'Constituição', icon: 'fa-shield-heart' },
  { key: 'int', short: 'INT', name: 'Inteligência', icon: 'fa-book-atlas' },
  { key: 'sab', short: 'SAB', name: 'Sabedoria', icon: 'fa-eye' },
  { key: 'car', short: 'CAR', name: 'Carisma', icon: 'fa-crown' }
];

export const SAVING_THROWS_DEF = [
  { key: 'for', name: 'Força', defaultAttr: 'for' },
  { key: 'agi', name: 'Agilidade', defaultAttr: 'agi' },
  { key: 'con', name: 'Constituição', defaultAttr: 'con' },
  { key: 'int', name: 'Inteligência', defaultAttr: 'int' },
  { key: 'sab', name: 'Sabedoria', defaultAttr: 'sab' },
  { key: 'car', name: 'Carisma', icon: 'fa-crown', defaultAttr: 'car' },
  { key: 'vontade', name: 'Vontade / Corrupção', defaultAttr: 'sab' }
];

export const ACTION_TYPES = [
  { key: 'padrao', label: 'Ação Padrão', short: 'Padrão', icon: 'fa-hand-fist', badgeClass: 'bg-crimson-950/90 text-crimson-300 border-crimson-500/40' },
  { key: 'bonus', label: 'Ação Bônus', short: 'Bônus', icon: 'fa-bolt', badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500/40' },
  { key: 'movimento', label: 'Ação de Movimento', short: 'Movimento', icon: 'fa-person-running', badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' },
  { key: 'oportunidade', label: 'Oportunidade / Reação', short: 'Oportunidade', icon: 'fa-shield-halved', badgeClass: 'bg-astral-900/90 text-astral-300 border-astral-500/40' },
  { key: 'livre', label: 'Ação Livre / Passiva', short: 'Livre', icon: 'fa-feather', badgeClass: 'bg-obsidian-800 text-slate-300 border-slate-600/40' }
];

export const DEFAULT_TURN_ACTIONS = {
  padrao: true,
  bonus: true,
  movimento: true,
  oportunidade: true
};

export const WEEK_DAYS_DEF = [
  { key: 'segunda', label: 'Segunda-feira', short: 'Seg', icon: 'fa-moon' },
  { key: 'terca', label: 'Terça-feira', short: 'Ter', icon: 'fa-fire-flame-simple' },
  { key: 'quarta', label: 'Quarta-feira', short: 'Qua', icon: 'fa-book-open' },
  { key: 'quinta', label: 'Quinta-feira', short: 'Qui', icon: 'fa-bolt-lightning' },
  { key: 'sexta', label: 'Sexta-feira', short: 'Sex', icon: 'fa-compass' },
  { key: 'sabado', label: 'Sábado', short: 'Sáb', icon: 'fa-masks-theater' },
  { key: 'domingo', label: 'Domingo', short: 'Dom', icon: 'fa-sun' }
];

export const DOWNTIME_OUTCOME_TYPES = [
  { key: 'pista', label: 'Descobriu Pista', icon: 'fa-magnifying-glass', badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/40' },
  { key: 'pocao', label: 'Progrediu Poção', icon: 'fa-flask-vial', badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' },
  { key: 'item', label: 'Ganhou Item / Artefato', icon: 'fa-box-open', badgeClass: 'bg-brass-500/20 text-brass-200 border-brass-400/40' },
  { key: 'sanidade_mais', label: 'Recuperou Sanidade', icon: 'fa-brain', badgeClass: 'bg-eldritch-900/80 text-eldritch-300 border-eldritch-500/40' },
  { key: 'sanidade_menos', label: 'Perdeu Sanidade', icon: 'fa-skull', badgeClass: 'bg-crimson-950/80 text-crimson-300 border-crimson-500/40' },
  { key: 'vida_menos', label: 'Sofreu Ferimento (-PV)', icon: 'fa-droplet', badgeClass: 'bg-crimson-950/80 text-crimson-300 border-crimson-500/40' },
  { key: 'vida_mais', label: 'Recuperou Vida (+PV)', icon: 'fa-heart-pulse', badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' },
  { key: 'dinheiro', label: 'Recebeu / Gastou Libras', icon: 'fa-coins', badgeClass: 'bg-amber-950/80 text-amber-200 border-amber-400/40' }
];

export const THEME_PRESETS = [
  {
    id: 'nevoeiro_cinza',
    name: 'Nevoeiro Cinza (Padrão)',
    subtitle: 'Ouro Vitoriano & Obsidiana Acima do Nevoeiro',
    icon: 'fa-eye',
    bgBase: '#07080c',
    cardBg: 'rgba(20, 23, 36, 0.95)',
    cardGoldBg: 'rgba(26, 29, 45, 0.96)',
    accentColor: '#d4af37',
    accentSecondary: '#9333ea',
    bgPattern: 'nevoeiro'
  },
  {
    id: 'noite_eterna',
    name: 'Meia-Noite da Deusa',
    subtitle: 'Astral Profundo, Estrelas & Serenidade Noturna',
    icon: 'fa-moon',
    bgBase: '#050814',
    cardBg: 'rgba(13, 21, 42, 0.95)',
    cardGoldBg: 'rgba(17, 28, 56, 0.96)',
    accentColor: '#38bdf8',
    accentSecondary: '#818cf8',
    bgPattern: 'estrelas'
  },
  {
    id: 'sol_eterno',
    name: 'Chama do Sol Eterno',
    subtitle: 'Bronze Sagrado, Âmbar & Luz Purificadora',
    icon: 'fa-sun',
    bgBase: '#0e0906',
    cardBg: 'rgba(28, 19, 13, 0.95)',
    cardGoldBg: 'rgba(38, 25, 16, 0.96)',
    accentColor: '#f59e0b',
    accentSecondary: '#ea580c',
    bgPattern: 'catedral'
  },
  {
    id: 'mar_sonia',
    name: 'Tempestade do Mar Sônia',
    subtitle: 'Esmeralda Abissal, Ciano & Fúria Oceânica',
    icon: 'fa-water',
    bgBase: '#040d0f',
    cardBg: 'rgba(10, 26, 31, 0.95)',
    cardGoldBg: 'rgba(14, 35, 42, 0.96)',
    accentColor: '#10b981',
    accentSecondary: '#06b6d4',
    bgPattern: 'abismo'
  },
  {
    id: 'lua_carmesim',
    name: 'Lua Carmesim de Backlund',
    subtitle: 'Vinho Vitoriano, Sangue & Mistério Oculto',
    icon: 'fa-wine-glass',
    bgBase: '#0c0508',
    cardBg: 'rgba(27, 12, 20, 0.95)',
    cardGoldBg: 'rgba(38, 16, 28, 0.96)',
    accentColor: '#f43f5e',
    accentSecondary: '#c084fc',
    bgPattern: 'carmesim'
  }
];

export const DEFAULT_USER_THEME = {
  presetId: 'nevoeiro_cinza',
  bgBase: '#07080c',
  cardBg: 'rgba(20, 23, 36, 0.95)',
  cardGoldBg: 'rgba(26, 29, 45, 0.96)',
  accentColor: '#d4af37',
  accentSecondary: '#9333ea',
  bgPattern: 'nevoeiro',
  customBgImage: ''
};

export const STORE_ITEM_CATEGORIES = [
  { key: 'all', label: 'Todos os Itens', icon: 'fa-layer-group' },
  { key: 'armas', label: 'Armas & Munições', icon: 'fa-gun' },
  { key: 'pocoes', label: 'Poções & Fórmulas', icon: 'fa-flask-vial' },
  { key: 'ingredientes', label: 'Ingredientes Beyonder', icon: 'fa-leaf' },
  { key: 'artefatos', label: 'Artefatos Selados', icon: 'fa-gem' },
  { key: 'amuletos', label: 'Amuletos & Rituais', icon: 'fa-star-and-crescent' },
  { key: 'equipamentos', label: 'Equipamentos & Geral', icon: 'fa-toolbox' }
];

export const DEFAULT_STORE_ITEMS = [
  {
    id: 'st_item_1',
    name: 'Balas Purificadoras do Sol (Lote c/ 6)',
    category: 'armas',
    priceGold: 6,
    priceContrib: 25,
    stock: -1,
    grade: 'Seq. 9 • Combate',
    description: 'Munição gravada com símbolos sagrados do Sol Eterno. Causa +1d6 de dano radiante extra contra mortos-vivos e espectros.'
  },
  {
    id: 'st_item_2',
    name: 'Amuleto do Sono Noturno (Réquiem)',
    category: 'amuletos',
    priceGold: 8,
    priceContrib: 35,
    stock: 5,
    grade: 'Seq. 8 • Domínio da Meia-Noite',
    description: 'Amuleto de prata ativado em Hermes Antigo. Adormece ou entorpece um alvo em até 15m (Teste de Vontade CD 14).'
  },
  {
    id: 'st_item_3',
    name: 'Fórmula da Poção: Palhaço (Seq. 8 - Vidente)',
    category: 'pocoes',
    priceGold: 150,
    priceContrib: 250,
    stock: 1,
    grade: 'Sequência 8',
    description: 'Fórmula completa contendo a lista de ingredientes principais (Cristal de Chifre de Bode Cinzento e Rosa com Rosto Humano).'
  },
  {
    id: 'st_item_4',
    name: 'Flor do Sono Noturno & Pó de Erva-Santa',
    category: 'ingredientes',
    priceGold: 12,
    priceContrib: 40,
    stock: 8,
    grade: 'Ingrediente Espiritual',
    description: 'Materiais essenciais para rituais de três velas, óleos essenciais e confecção de amuletos serenos.'
  },
  {
    id: 'st_item_5',
    name: 'Artefato Selado 3-0411 (Espelho de Prata Sombrio)',
    category: 'artefatos',
    priceGold: 220,
    priceContrib: 400,
    stock: 1,
    grade: 'Artefato Grau 3',
    description: 'Permite rastrear alvos através de superfícies reflexivas. Efeito Negativo: Sussurra segredos perturbadores à meia-noite (-2 SAN por uso).'
  },
  {
    id: 'st_item_6',
    name: 'Kit de Investigação Forense & Pêndulo de Topázio',
    category: 'equipamentos',
    priceGold: 10,
    priceContrib: 30,
    stock: -1,
    grade: 'Utilitário',
    description: 'Concede +1 em testes de Investigação mundana e permite realizar radiestesia básica.'
  }
];

export const DEFAULT_CONTRIBUTION_TASKS = [
  {
    id: 'ct_task_1',
    title: 'Relatório Oficial de Caso Oculto Resolvido',
    category: 'Missão / Relatório',
    rewardPoints: 50,
    rewardGold: 5,
    description: 'Entregar ao comando da organização ou ao Mestre o relatório detalhado de uma investigação concluída.'
  },
  {
    id: 'ct_task_2',
    title: 'Entrega de Característica Beyonder ou Artefato',
    category: 'Espólio Místico',
    rewardPoints: 120,
    rewardGold: 0,
    description: 'Contribuir com uma Característica Beyonder recuperada em combate ou artefato instável para o cofre da campanha.'
  },
  {
    id: 'ct_task_3',
    title: 'Plantão de Vigília no Portão Chanis / Patrulha',
    category: 'Serviço Semanal',
    rewardPoints: 30,
    rewardGold: 3,
    description: 'Cumprir turno extra de guarda ou vigilância durante os dias entre-missões.'
  },
  {
    id: 'ct_task_4',
    title: 'Doação de Fundos ou Ingredientes Raros',
    category: 'Doação',
    rewardPoints: 25,
    rewardGold: 0,
    description: 'Contribuir com recursos financeiros ou materiais ritualísticos para o grupo.'
  }
];

export const RESISTANCE_DEGREES = [
  'Resistência Parcial',
  'Resistência Elevada (50% Dano)',
  'Imunidade Total',
  'Absorção / Bônus de Defesa'
];

export const WEAKNESS_SEVERITIES = [
  'Vulnerabilidade (+50% Dano)',
  'Dano Dobrado (2x)',
  'Penalidade em Testes',
  'Gatilho de Perda de Controle',
  'Restrição / Tabu Místico'
];

export const DEFAULT_CAMPAIGN_STATE = {
  activeCampaignId: 'camp_tarot_1',
  campaigns: [
    {
      id: 'camp_tarot_1',
      name: 'Crônicas de Tingen & Clube de Tarô',
      description: 'Investigações ocultas sob o Nevoeiro Cinza. Apenas fichas vinculadas a esta campanha participam do combate ativo e visualizam as rolagens de dados da sessão.',
      currentWeek: 1,
      characterIds: ['sample_klein_moretti', 'sample_audrey_hall', 'sample_alger_wilson'],
      restrictCombatAndDice: true,
      weekHistory: [],
      storeItems: JSON.parse(JSON.stringify(DEFAULT_STORE_ITEMS)),
      contributionTasks: JSON.parse(JSON.stringify(DEFAULT_CONTRIBUTION_TASKS)),
      contributionLogs: [],
      createdAt: Date.now()
    }
  ],
  updatedAt: Date.now()
};

export const DEFAULT_COMBAT_STATE = {
  id: 'active_combat',
  isActive: false,
  round: 1,
  activeTurnIndex: 0,
  participants: [
    {
      id: 'enemy_rampager_1',
      isMonster: true,
      name: 'Beyonder Sem Controle (Escamoso)',
      enemyType: 'Criatura Beyonder • Seq. 8',
      initiative: 16,
      hp: { current: 45, max: 45 },
      san: { current: 15, max: 60 },
      isHurt: false,
      isMad: true,
      statsVisibleToPlayers: false,
      isHiddenFromPlayers: false
    }
  ],
  updatedAt: Date.now()
};

export const SKILLS_DEF = [
  { id: 'acrobacia', name: 'Acrobacia', defaultAttr: 'agi' },
  { id: 'atletismo', name: 'Atletismo', defaultAttr: 'for' },
  { id: 'luta', name: 'Luta', defaultAttr: 'for' },
  { id: 'pontaria', name: 'Pontaria', defaultAttr: 'agi' },
  { id: 'reflexos', name: 'Reflexos', defaultAttr: 'agi' },
  { id: 'fortitude', name: 'Fortitude', defaultAttr: 'con' },
  { id: 'truque_maos', name: 'Truque de mãos', defaultAttr: 'agi' },
  { id: 'ocultismo', name: 'Ocultismo', defaultAttr: 'int' },
  { id: 'enganacao', name: 'Enganação', defaultAttr: 'car' },
  { id: 'persuasao', name: 'Persuasão', defaultAttr: 'car' },
  { id: 'intuicao', name: 'Intuição', defaultAttr: 'sab' },
  { id: 'medicina', name: 'Medicina', defaultAttr: 'int' },
  { id: 'adaptacao', name: 'Adaptação', defaultAttr: 'sab' },
  { id: 'investigacao', name: 'Investigação', defaultAttr: 'int' },
  { id: 'religiao', name: 'Religião', defaultAttr: 'int' },
  { id: 'sociedade', name: 'Sociedade', defaultAttr: 'int' },
  { id: 'furtividade', name: 'Furtividade', defaultAttr: 'agi' },
  { id: 'natureza', name: 'Natureza', defaultAttr: 'int' },
  { id: 'historia', name: 'História', defaultAttr: 'int' },
  { id: 'performar', name: 'Performar', defaultAttr: 'car' },
  { id: 'intimidar', name: 'Intimidar', defaultAttr: 'car' }
];

export const BEYONDER_PATHWAYS = [
  'Vidente (Tolo)',
  'Aprendiz (Porta)',
  'Saqueador (Erro)',
  'Espectador (Visionário)',
  'Marinheiro (Tirano)',
  'Bardo (Sol)',
  'Leitor (Torre Branca)',
  'Suplicante de Segredos (Enforcado)',
  'Sem Sono (Escuridão)',
  'Colecionador de Cadáveres (Morte)',
  'Guerreiro (Gigante do Crepúsculo)',
  'Assassino (Demônio)',
  'Caçador (Sacerdote Vermelho)',
  'Espreitador de Mistérios (Eremita)',
  'Erudito (Paragon)',
  'Monstro (Roda da Fortuna)',
  'Boticário (Lua)',
  'Plantador (Mãe)',
  'Árbitro (Justiciar)',
  'Advogado (Imperador Negro)',
  'Prisioneiro (Acorrentado)',
  'Criminoso (Abismo)'
];

export const EQUIPMENT_CATEGORIES = [
  'Equipamento Geral',
  'Instrumento Místico',
  'Amuleto / Ingrediente',
  'Artefato Selado Grau 3',
  'Artefato Selado Grau 2',
  'Artefato Selado Grau 1',
  'Artefato Selado Grau 0'
];

export const MUTATION_TYPES = [
  'Mental / Espiritual',
  'Física / Corporal',
  'Maldição / Corrupção',
  'Característica Mítica'
];

export const MUTATION_SEVERITIES = ['Leve', 'Moderada', 'Grave', 'Abissal'];

export function createDefaultWeeklyDowntime(weekNumber = 1) {
  const days = {};
  WEEK_DAYS_DEF.forEach(d => {
    days[d.key] = {
      isMissionDay: false,
      playerActivity: '',
      gmRequestedTest: '',
      gmTestDC: 12,
      playerRollResult: null,
      gmFeedback: '',
      outcomes: [],
      deltas: {
        potion: 0,
        hp: 0,
        san: 0,
        sp: 0,
        gold: 0,
        itemGained: '',
        clueGained: ''
      },
      applied: false
    };
  });

  return {
    weekNumber,
    submittedToGM: false,
    submittedAt: null,
    generalGoals: '',
    days
  };
}

export function createCollectionItemTemplate(collectionKey, character) {
  const uid = `${collectionKey}_${Date.now()}`;
  const templates = {
    weapons: {
      id: uid,
      name: 'Nova Arma / Disparo',
      attackBonus: Number(character?.proficiencyBonus) || 2,
      damage: '1d8+2',
      type: 'Perfurante • 18m',
      actionType: 'padrao',
      isFirearm: true,
      ammoCurrent: 6,
      ammoMax: 6
    },
    equipment: {
      id: uid,
      name: 'Novo Item / Artefato Selado',
      category: 'Instrumento Místico',
      quantity: 1,
      description: ''
    },
    powers: {
      id: uid,
      name: 'Novo Poder Beyonder',
      sequence: `Seq. ${character?.sequence || 9}`,
      cost: 2,
      actionType: 'padrao',
      description: ''
    },
    spells: {
      id: uid,
      name: 'Nova Magia ou Ritual',
      level: 'Magia Ritualística',
      cost: 3,
      actionType: 'padrao',
      castTime: '1 Ação Padrão',
      description: ''
    },
    mutations: {
      id: uid,
      name: 'Nova Mutação ou Sintoma',
      type: 'Física / Corporal',
      severity: 'Moderada',
      description: ''
    },
    resistances: {
      id: uid,
      name: 'Nova Resistência / Imunidade',
      degree: 'Resistência Elevada (50% Dano)',
      value: 'Reduz 50% / +2 Defesa',
      source: 'Poção / Sequência',
      description: ''
    },
    weaknesses: {
      id: uid,
      name: 'Nova Fraqueza / Vulnerabilidade',
      severity: 'Vulnerabilidade (+50% Dano)',
      penalty: '-2 em Testes / +50% Dano',
      source: 'Efeito Negativo de Artefato',
      description: ''
    }
  };

  return templates[collectionKey] || { id: uid };
}