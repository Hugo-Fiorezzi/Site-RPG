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
  { key: 'agi', id: 'reflexos', name: 'Reflexos', defaultAttr: 'agi' },
  { key: 'con', id: 'fortitude', name: 'Fortitude', defaultAttr: 'con' },
  { key: 'int', name: 'Inteligência', defaultAttr: 'int' },
  { key: 'sab', name: 'Sabedoria', defaultAttr: 'sab' },
  { key: 'car', name: 'Carisma', icon: 'fa-crown', defaultAttr: 'car' },
  { key: 'vontade', name: 'Vontade / Corrupção', defaultAttr: 'sab' }
];

export const EQUIP_SLOTS_DEF = [
  { key: '', label: 'Guardado (Não Equipado)', short: 'Guardado', icon: 'fa-box-archive', badgeClass: 'bg-obsidian-900 text-slate-400 border-slate-700' },
  { key: 'mao_direita', label: 'Mão Direita', short: 'Mão Direita', icon: 'fa-hand-fist', badgeClass: 'bg-amber-950/90 text-amber-200 border-amber-400/50' },
  { key: 'mao_esquerda', label: 'Mão Esquerda', short: 'Mão Esquerda', icon: 'fa-hand', badgeClass: 'bg-astral-950/90 text-astral-200 border-astral-400/50' },
  { key: 'duas_maos', label: 'Duas Mãos', short: 'Duas Mãos', icon: 'fa-hands-holding-circle', badgeClass: 'bg-crimson-950/90 text-crimson-200 border-crimson-400/50' }
];

export const ACTION_TYPES = [
  { key: 'padrao', label: 'Ação Padrão', short: 'Padrão', icon: 'fa-hand-fist', badgeClass: 'bg-crimson-950/90 text-crimson-300 border-crimson-500/40' },
  { key: 'bonus', label: 'Ação Bônus', short: 'Bônus', icon: 'fa-bolt', badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500/40' },
  { key: 'completa', label: 'Ação Completa (Padrão + Bônus)', short: 'Completa', icon: 'fa-burst', badgeClass: 'bg-fuchsia-950/90 text-fuchsia-300 border-fuchsia-500/40' },
  { key: 'movimento', label: 'Ação de Movimento', short: 'Movimento', icon: 'fa-person-running', badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' },
  { key: 'oportunidade', label: 'Oportunidade / Reação', short: 'Oportunidade', icon: 'fa-shield-halved', badgeClass: 'bg-astral-900/90 text-astral-300 border-astral-500/40' },
  { key: 'livre', label: 'Ação Livre / Passiva', short: 'Livre', icon: 'fa-feather', badgeClass: 'bg-obsidian-800 text-slate-300 border-slate-600/40' }
];

export const PASSIVE_ABILITY_PRESETS = [
  {
    id: 'preset_visao_espiritual', legacyPassiveId: { id: 'pas_visao_espiritual' },
    name: 'Visão Espiritual (Spirit Vision)',
    cost: 1,
    icon: 'fa-eye',
    description: 'Enxerga auras emocionais, saúde, fluxos de espiritualidade e corpos etéreos.'
  },
  {
    id: 'preset_intuicao_perigo',
    name: 'Intuição Espiritual de Perigo',
    cost: 0,
    icon: 'fa-compass',
    description: 'Pressente emboscadas, armadilhas místicas e olhares hostis direcionados a você.'
  },
  {
    id: 'preset_leitura_espectador',
    name: 'Observação de Espectador',
    cost: 0,
    icon: 'fa-masks-theater',
    description: 'Lê microexpressões, intenções ocultas e oscilações mentais nos alvos próximos.'
  },
  {
    id: 'preset_escuta_sussurros',
    name: 'Sentidos Aguçados / Rastreador',
    cost: 1,
    icon: 'fa-ear-listen',
    description: 'Percepção ampliada para rastros espirituais, batimentos e sons sutis no ambiente.'
  }
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
  borderColor: '#d4af37',
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

export const STORE_PAYMENT_MODES = [
  { key: 'both', label: 'Dinheiro (£) ou Contribuição' },
  { key: 'gold_only', label: 'Apenas Dinheiro (Libras £)' },
  { key: 'contrib_only', label: 'Apenas Contribuição (Pts)' }
];

export const DEFAULT_STORE_ITEMS = [
  {
    id: 'st_item_1',
    name: 'Balas Purificadoras do Sol (Lote c/ 6)',
    category: 'armas',
    paymentMode: 'both',
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
    paymentMode: 'both',
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
    paymentMode: 'contrib_only',
    priceGold: 150,
    priceContrib: 250,
    stock: 1,
    grade: 'Sequência 8',
    description: 'Fórmula completa contendo a lista de ingredientes principais (Cristal de Chifre de Bode Cinzento e Rosa com Rosto Humano). Exclusivo por mérito de contribuição.'
  },
  {
    id: 'st_item_4',
    name: 'Flor do Sono Noturno & Pó de Erva-Santa',
    category: 'ingredientes',
    paymentMode: 'both',
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
    paymentMode: 'contrib_only',
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
    paymentMode: 'gold_only',
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

export const DOSSIER_CATEGORIES = [
  { key: 'all', label: 'Todos os Dossiês', icon: 'fa-folder-open', badgeClass: 'bg-brass-500/20 text-brass-200 border-brass-400/40' },
  { key: 'locais', label: 'Locais & Regiões', short: 'Local', icon: 'fa-map-location-dot', badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40' },
  { key: 'personagens', label: 'Personagens & NPCs', short: 'Personagem', icon: 'fa-user-tie', badgeClass: 'bg-astral-950/90 text-astral-300 border-astral-500/40' },
  { key: 'itens', label: 'Itens & Artefatos', short: 'Item / Artefato', icon: 'fa-gem', badgeClass: 'bg-amber-950/90 text-amber-300 border-amber-500/40' },
  { key: 'criaturas', label: 'Criaturas', short: 'Criatura', icon: 'fa-dragon', badgeClass: 'bg-crimson-950/90 text-crimson-300 border-crimson-500/40' },
  { key: 'caminhos', label: 'Caminhos Beyonder', short: 'Caminho Beyonder', icon: 'fa-compass-drafting', badgeClass: 'bg-eldritch-950/90 text-eldritch-300 border-eldritch-500/40' },
  { key: 'organizacoes', label: 'Organizações & Cultos', short: 'Organização / Culto', icon: 'fa-building-columns', badgeClass: 'bg-purple-950/90 text-purple-300 border-purple-500/40' }
];

export const SHARED_NOTE_CATEGORIES = [
  'Pista & Investigação',
  'Teoria & Ocultismo',
  'Plano do Grupo',
  'Locais & Contatos',
  'Anotação Geral'
];

export const DEFAULT_CAMPAIGN_DOSSIERS = [
  {
    id: 'dos_local_1',
    category: 'locais',
    title: 'Catedral de Santa Selena & Portão Chanis (Tingen)',
    subtitle: 'Tingen • Sede Oficial dos Falcões Noturnos',
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#070a14"/><stop offset="50%" stop-color="#131b2e"/><stop offset="100%" stop-color="#1e152a"/></linearGradient></defs><rect width="600" height="340" fill="url(#g1)"/><circle cx="480" cy="80" r="42" fill="#e11d48" opacity="0.75"/><circle cx="480" cy="80" r="58" fill="#e11d48" opacity="0.18"/><path d="M180 340 L180 140 L230 70 L280 140 L280 340 Z" fill="#0b0f19" stroke="#d4af37" stroke-width="2"/><path d="M260 340 L260 110 L320 40 L380 110 L380 340 Z" fill="#0f1523" stroke="#d4af37" stroke-width="2"/><circle cx="320" cy="145" r="24" fill="#1e293b" stroke="#d4af37" stroke-width="2"/><rect x="298" y="230" width="44" height="110" rx="22" fill="#05070b" stroke="#d4af37" stroke-width="2"/><text x="30" y="315" fill="#d4af37" font-family="serif" font-size="18" font-weight="bold">Catedral de Santa Selena • Portão Chanis</text></svg>`),
    description: 'Principal templo da Deusa da Noite Eterna na cidade de Tingen. Nos níveis subterrâneos, atrás da Rua Zouteland, repousa o Portão Chanis, onde os Falcões Noturnos guardam Artefatos Selados e ingredientes Beyonder.',
    visibleToPlayers: true,
    createdAt: Date.now() - 86400000
  },
  {
    id: 'dos_local_2',
    category: 'locais',
    title: 'Clube de Adivinhação de Tingen',
    subtitle: 'Rua Howes • Ponto de Investigação e Atuação',
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340"><defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0d131a"/><stop offset="100%" stop-color="#1f1630"/></linearGradient></defs><rect width="600" height="340" fill="url(#g2)"/><circle cx="300" cy="155" r="78" fill="none" stroke="#d4af37" stroke-width="2.5" stroke-dasharray="6,4"/><polygon points="300,82 320,135 375,135 330,168 348,220 300,188 252,220 270,168 225,135 280,135" fill="#d4af37" opacity="0.25" stroke="#d4af37" stroke-width="2"/><circle cx="300" cy="155" r="18" fill="#38bdf8" opacity="0.5"/><text x="30" y="315" fill="#d4af37" font-family="serif" font-size="18" font-weight="bold">Salão de Cartomancia &amp; Astrologia • Tingen</text></svg>`),
    description: 'Frequentemente visitado por cidadãos, comerciantes e nobres em busca de leituras de tarô, astrologia e radiestesia com pêndulo. Excelente fachada para digerir a poção de Vidente e colher rumores.',
    visibleToPlayers: true,
    createdAt: Date.now() - 72000000
  },
  {
    id: 'dos_npc_1',
    category: 'personagens',
    title: 'Capitão Dunn Smith',
    subtitle: 'Líder dos Falcões Noturnos de Tingen • Caminho Sem Sono (Seq. 7 - Pesadelo)',
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340"><defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#090b10"/><stop offset="100%" stop-color="#1e1b2e"/></linearGradient></defs><rect width="600" height="340" fill="url(#g3)"/><circle cx="300" cy="130" r="50" fill="#1e293b" stroke="#94a3b8" stroke-width="2.5"/><path d="M215 290 C215 215 385 215 385 290 Z" fill="#0f172a" stroke="#94a3b8" stroke-width="2.5"/><circle cx="283" cy="125" r="6" fill="#cbd5e1"/><circle cx="317" cy="125" r="6" fill="#cbd5e1"/><text x="30" y="315" fill="#e2e8f0" font-family="serif" font-size="18" font-weight="bold">Capitão Dunn Smith • Olhos Cinzentos Profundos</text></svg>`),
    description: 'Homem de sobretudo preto, linha capilar recuada e olhos cinzentos serenos. Conhecido por sua memória peculiar — frequentemente esquece detalhes secundários logo após fechar o cachimbo, mas é implacável ao proteger Tingen.',
    visibleToPlayers: true,
    createdAt: Date.now() - 64000000
  },
  {
    id: 'dos_npc_2',
    category: 'personagens',
    title: 'Sr. Azik Eggers',
    subtitle: 'Professor de História na Universidade de Tingen • Passado Enigmático',
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340"><defs><linearGradient id="g4" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#140f0b"/><stop offset="100%" stop-color="#291d12"/></linearGradient></defs><rect width="600" height="340" fill="url(#g4)"/><circle cx="300" cy="150" r="65" fill="#1c1917" stroke="#f59e0b" stroke-width="2"/><path d="M260 150 Q300 95 340 150 Q300 205 260 150 Z" fill="#f59e0b" opacity="0.3" stroke="#f59e0b" stroke-width="2"/><text x="30" y="315" fill="#fbbf24" font-family="serif" font-size="18" font-weight="bold">Professor Azik Eggers • Apito de Cobre Antigo</text></svg>`),
    description: 'Acadêmico gentil de pele bronzeada e uma pequena pinta sob a orelha direita. Perdeu parte de suas memórias antigas e possui sonhos recorrentes que atravessam eras históricas do continente.',
    visibleToPlayers: true,
    createdAt: Date.now() - 50000000
  },
  {
    id: 'dos_item_1',
    category: 'itens',
    title: 'Caderno da Família Antigonus',
    subtitle: 'Relíquia da Quarta Época • Item Místico de Alto Risco',
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340"><defs><linearGradient id="g5" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1a0b12"/><stop offset="100%" stop-color="#090d16"/></linearGradient></defs><rect width="600" height="340" fill="url(#g5)"/><rect x="215" y="55" width="170" height="220" rx="10" fill="#27171c" stroke="#f43f5e" stroke-width="3"/><rect x="230" y="70" width="140" height="190" rx="6" fill="none" stroke="#d4af37" stroke-width="1.5" stroke-dasharray="4,4"/><circle cx="300" cy="165" r="32" fill="none" stroke="#f43f5e" stroke-width="2"/><text x="30" y="315" fill="#fda4af" font-family="serif" font-size="18" font-weight="bold">Caderno Antigo da Família Antigonus</text></svg>`),
    description: 'Caderno encadernado em couro escuro datado da Dinastia Tudor na Quarta Época. Todos os pesquisadores originais que o leram morreram em circunstâncias misteriosas. Atualmente buscado pela Ordem Secreta e pelos Falcões Noturnos.',
    visibleToPlayers: true,
    createdAt: Date.now() - 40000000
  },
  {
    id: 'dos_item_2',
    category: 'itens',
    title: 'Artefato Selado 3-0782 (Emblema Sagrado Mutado)',
    subtitle: 'Artefato Selado Grau 3 • Domínio do Sol Eterno',
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340"><defs><linearGradient id="g6" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1c1408"/><stop offset="100%" stop-color="#2e1d09"/></linearGradient></defs><rect width="600" height="340" fill="url(#g6)"/><circle cx="300" cy="160" r="68" fill="#451a03" stroke="#f59e0b" stroke-width="3"/><circle cx="300" cy="160" r="36" fill="#f59e0b" opacity="0.65"/><text x="30" y="315" fill="#fcd34d" font-family="serif" font-size="18" font-weight="bold">Artefato Selado 3-0782 • Emblema Solar</text></svg>`),
    description: 'Emblema metálico dourado contaminado pela característica de um Beyonder do caminho do Sol. Capaz de purificar espectros e criar Água Benta do Sol, mas drena lentamente o calor corporal de quem o porta.',
    visibleToPlayers: true,
    createdAt: Date.now() - 30000000
  },
  {
    id: 'dos_criatura_1',
    category: 'criaturas',
    title: 'Beyonder Fora de Controle (Rampager Escamoso)',
    subtitle: 'Aberração Mística • Risco de Corrupção Mental',
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340"><defs><linearGradient id="gc1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#180609"/><stop offset="100%" stop-color="#090c14"/></linearGradient></defs><rect width="600" height="340" fill="url(#gc1)"/><circle cx="300" cy="155" r="72" fill="#2c0b12" stroke="#f43f5e" stroke-width="3"/><circle cx="272" cy="140" r="10" fill="#fb7185"/><circle cx="328" cy="140" r="10" fill="#fb7185"/><path d="M265 185 Q300 215 335 185" fill="none" stroke="#f43f5e" stroke-width="3"/><text x="30" y="315" fill="#fda4af" font-family="serif" font-size="18" font-weight="bold">Criatura Beyonder • Perda de Controle</text></svg>`),
    description: 'Antigo Beyonder que sucumbiu aos sussurros e perdeu o controle da poção, sofrendo mutação grotesca. Exala forte aura de loucura e deixa para trás sua Característica Beyonder ao ser abatido.',
    visibleToPlayers: true,
    createdAt: Date.now() - 25000000
  },
  {
    id: 'dos_caminho_1',
    category: 'caminhos',
    title: 'Caminho do Vidente (O Tolo)',
    subtitle: 'Sequência 9: Vidente → Seq. 8: Palhaço → Seq. 7: Mágico',
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340"><defs><linearGradient id="gp1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#130b24"/><stop offset="100%" stop-color="#090c18"/></linearGradient></defs><rect width="600" height="340" fill="url(#gp1)"/><circle cx="300" cy="155" r="74" fill="none" stroke="#a855f7" stroke-width="2.5"/><polygon points="300,88 358,200 242,200" fill="#a855f7" opacity="0.22" stroke="#d4af37" stroke-width="2"/><circle cx="300" cy="160" r="16" fill="#d4af37"/><text x="30" y="315" fill="#e9d5ff" font-family="serif" font-size="18" font-weight="bold">Caminho do Vidente • Mistérios, Destino &amp; Ilusão</text></svg>`),
    description: 'Caminho voltado às artes adivinhatórias, astrologia, leitura de auras pela Visão Espiritual e rituais místicos. Na Sequência 8 (Palhaço), concede agilidade acrobática, controle facial absoluto e intuição de perigo.',
    visibleToPlayers: true,
    createdAt: Date.now() - 20000000
  },
  {
    id: 'dos_org_1',
    category: 'organizacoes',
    title: 'Falcões Noturnos & Ordem Secreta',
    subtitle: 'Organizações Beyonder Oficiais & Cultos Ocultos',
    imageUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 340"><defs><linearGradient id="go1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0b0716"/><stop offset="100%" stop-color="#1e102f"/></linearGradient></defs><rect width="600" height="340" fill="url(#go1)"/><circle cx="300" cy="150" r="68" fill="#090d16" stroke="#c084fc" stroke-width="2.5"/><path d="M275 110 A45 45 0 1 0 335 185 A36 36 0 1 1 275 110 Z" fill="#e11d48" opacity="0.8"/><text x="30" y="315" fill="#e9d5ff" font-family="serif" font-size="18" font-weight="bold">Organizações Beyonder, Igrejas &amp; Ordens Secretas</text></svg>`),
    description: 'Os Falcões Noturnos são a força Beyonder vinculada à Igreja da Deusa da Noite Eterna. Em oposição às Igrejas Ortodoxas operam cultos e sociedades antigas como a Ordem Secreta, a Ordem Aurora e a Escola Rosa do Pensamento.',
    visibleToPlayers: true,
    createdAt: Date.now() - 15000000
  }
];

export const DEFAULT_CAMPAIGN_UPDATES = [
  {
    id: 'cup_week_1',
    weekNumber: 1,
    title: 'Capítulo I: O Despertar sob a Lua Carmesim e o Clube de Tarô',
    arcTag: 'Arco 1 • Mistérios de Tingen',
    dateStr: 'Semana 1 • Abertura da Campanha',
    content: 'Após o ritual de aumento de sorte na Rua Moretti, Klein Moretti ascendeu acima do Nevoeiro Cinza e convocou involuntariamente Audrey Hall (Srta. Justiça) e Alger Wilson (Sr. Enforcado), fundando o Clube de Tarô. Em Tingen, a investigação sobre o paradeiro do Caderno da Família Antigonus foi oficialmente iniciada pelos Falcões Noturnos.',
    highlights: '• Fundação do Clube de Tarô acima do Nevoeiro Cinza\n• Ingresso nas investigações ocultas de Tingen\n• Primeiras pistas sobre a Ordem Secreta e o Caderno da Família Antigonus'
  }
];

export const DEFAULT_SHARED_NOTES = [
  {
    id: 'snote_1',
    authorCharId: 'sample_klein_moretti',
    authorName: 'Klein Moretti (O Tolo)',
    authorPlayer: 'Mestre / Exemplo',
    category: 'Pista & Investigação',
    title: 'Pistas sobre o Caderno da Família Antigonus',
    content: 'Welch e Naya morreram após decifrarem trechos do caderno da Quarta Época. Qualquer pista sobre símbolos de palhaços ou menções ao Pico Hornacis deve ser compartilhada imediatamente com o grupo.',
    weekNumber: 1,
    dateStr: 'Semana 1'
  },
  {
    id: 'snote_2',
    authorCharId: 'sample_audrey_hall',
    authorName: 'Audrey Hall (Srta. Justiça)',
    authorPlayer: 'Jogadora 1 (Audrey)',
    category: 'Locais & Contatos',
    title: 'Círculos Místicos de Backlund e Páginas de Roselle',
    content: 'Estou reunindo páginas escritas em caracteres secretos do Imperador Roselle e buscando contato seguro com os Alquimistas da Psicologia nos salões nobres de Backlund.',
    weekNumber: 1,
    dateStr: 'Semana 1'
  }
];

export const DEFAULT_CAMPAIGN_STATE = {
  activeCampaignId: 'camp_tarot_1',
  campaigns: [
    {
      id: 'camp_tarot_1',
      name: 'Crônicas de Tingen & Clube de Tarô',
      description: 'Investigações ocultas sob o Nevoeiro Cinza. Apenas fichas vinculadas a esta campanha participam do combate ativo e visualizam as rolagens de dados da sessão.',
      campaignSummary: 'No Reino de Loen, entre a fumaça das máquinas a vapor, o brilho dos lampiões a gás e os mistérios herdados da Quarta Época, forças ocultas movem-se nas sombras de Tingen e Backlund. Unidos pelo encontro semanal acima do Nevoeiro Cinza e pelas investigações em solo, os membros da campanha buscam digerir suas poções sem perder a sanidade enquanto desvendam conspirações envolvendo Artefatos Selados, ordens secretas e relíquias antigas.',
      currentObjectives: '1. Localizar o paradeiro do Caderno da Família Antigonus em Tingen.\n2. Investigar os movimentos da Ordem Secreta e da Escola Rosa.\n3. Reunir páginas do Diário de Roselle e fórmulas de Sequência 8 e 7.',
      currentArc: 'Arco I — Sombras sobre Tingen',
      campaignProgressPct: 25,
      currentWeek: 1,
      characterIds: ['sample_klein_moretti', 'sample_audrey_hall', 'sample_alger_wilson'],
      restrictCombatAndDice: true,
      allowFreePlayerRolls: false,
      dossiers: JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_DOSSIERS)),
      weeklyUpdates: JSON.parse(JSON.stringify(DEFAULT_CAMPAIGN_UPDATES)),
      sharedNotes: JSON.parse(JSON.stringify(DEFAULT_SHARED_NOTES)),
      weekHistory: [],
      storeItems: JSON.parse(JSON.stringify(DEFAULT_STORE_ITEMS)),
      contributionTasks: JSON.parse(JSON.stringify(DEFAULT_CONTRIBUTION_TASKS)),
      contributionLogs: [],
      weeklyLetters: [
        {
          id: 'sample_letter_1',
          weekNumber: 1,
          dayKey: 'terca',
          dayLabel: 'Terça-feira',
          fromCharId: 'sample_audrey_hall',
          fromCharName: 'Audrey Hall (Srta. Justiça)',
          toCharId: 'sample_klein_moretti',
          toCharName: 'Klein Moretti (O Tolo)',
          subject: 'Páginas do Diário de Roselle',
          content: 'Consegui adquirir mais duas páginas escritas em símbolos estranhos com um nobre em Backlund. Enviarei na próxima reunião.',
          status: 'approved',
          dateStr: 'Semana 1 • Terça-feira'
        }
      ],
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
  { id: 'truque_maos', name: 'Truque de mãos', defaultAttr: 'agi' },
  { id: 'ocultismo', name: 'Ocultismo', defaultAttr: 'int' },
  { id: 'enganacao', name: 'Enganação', defaultAttr: 'car' },
  { id: 'persuasao', name: 'Persuasão', defaultAttr: 'car' },
  { id: 'intuicao', name: 'Intuição', defaultAttr: 'sab' },
  { id: 'medicina', name: 'Medicina', defaultAttr: 'int' },
  { id: 'adaptacao', name: 'Adaptação', defaultAttr: 'sab' },
  { id: 'investigacao', name: 'Investigação', defaultAttr: 'int' },
  { id: 'percepcao', name: 'Percepção', defaultAttr: 'sab' },
  { id: 'religiao', name: 'Religião', defaultAttr: 'int' },
  { id: 'sociedade', name: 'Sociedade', defaultAttr: 'sab' },
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

export const COMBAT_STYLE_TYPES = [
  'Armas de Fogo & Pontaria',
  'Corpo a Corpo & Lâminas',
  'Esquiva & Acrobacia',
  'Defensivo & Proteção',
  'Combate Místico / Beyonder',
  'Empunhadura Dupla (Duas Mãos/Armas)'
];

export const PROFICIENCY_CATEGORIES = [
  'Arma',
  'Armadura / Proteção',
  'Explosivos & Bombas',
  'Ferramentas de Roubo / Kit',
  'Item / Ferramenta'
];

export const PROFICIENCY_LEVELS = [
  'Proficiente',
  'Especialista (+Bônus)',
  'Maestria Completa'
];

export const STANDARD_PROFICIENCIES_DEF = [
  { key: 'armas_simples', label: 'Armas Simples & Bengalas', group: 'Armas', icon: 'fa-wand-sparkles' },
  { key: 'armas_marciais', label: 'Lâminas & Armas Marciais', group: 'Armas', icon: 'fa-khanda' },
  { key: 'armas_fogo_curtas', label: 'Revólveres & Pistolas', group: 'Armas', icon: 'fa-gun' },
  { key: 'armas_fogo_longas', label: 'Rifles & Escopetas', group: 'Armas', icon: 'fa-crosshairs' },
  { key: 'explosivos', label: 'Explosivos & Bombas', group: 'Armas & Explosivos', icon: 'fa-bomb' },
  { key: 'armaduras_leves', label: 'Trajes & Armaduras Leves', group: 'Armaduras', icon: 'fa-shirt' },
  { key: 'armaduras_medias', label: 'Armaduras Médias', group: 'Armaduras', icon: 'fa-vest' },
  { key: 'armaduras_pesadas', label: 'Armaduras Pesadas', group: 'Armaduras', icon: 'fa-shield-halved' },
  { key: 'escudos', label: 'Escudos & Broquéis', group: 'Armaduras', icon: 'fa-shield' },
  { key: 'ferramentas_roubo', label: 'Ferramentas de Roubo', group: 'Itens & Ferramentas', icon: 'fa-key' },
  { key: 'amuletos_talismas', label: 'Amuletos & Talismãs', group: 'Itens & Ferramentas', icon: 'fa-star-and-crescent' },
  { key: 'instrumentos_adivinhacao', label: 'Pêndulos & Adivinhação', group: 'Itens & Ferramentas', icon: 'fa-compass' },
  { key: 'kits_alquimia_medicina', label: 'Kits de Ocultismo & Boticário', group: 'Itens & Ferramentas', icon: 'fa-flask-vial' }
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
      daySubmitted: false,
      playerActivity: '',
      gmRequestedTest: '',
      gmTestDC: 12,
      playerRollResult: null,
      allowReroll: false,
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
      name: 'Nova Arma / Ataque Místico',
      attackBonus: Number(character?.proficiencyBonus) || 2,
      damage: '1d8+2',
      type: 'Perfurante / Místico • 18m',
      actionType: 'padrao',
      equipSlot: '',
      isFirearm: true,
      isMysticAttack: false,
      peCost: 0,
      ammoCurrent: 6,
      ammoMax: 6
    },
    equipment: {
      id: uid,
      name: 'Novo Item / Artefato Selado',
      category: 'Instrumento Místico',
      equipSlot: '',
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
    },
    combatStyles: {
      id: uid,
      name: 'Novo Estilo de Combate',
      styleType: 'Armas de Fogo & Pontaria',
      bonusText: '+1 em Ataque / Efeito Tático',
      isActive: true,
      description: ''
    },
    proficienciesList: {
      id: uid,
      name: 'Nova Proficiência Específica',
      category: 'Arma',
      level: 'Proficiente',
      notes: ''
    }
  };

  return templates[collectionKey] || { id: uid };
}