import { SKILLS_DEF, SAVING_THROWS_DEF, DEFAULT_TURN_ACTIONS, createDefaultWeeklyDowntime } from '../config/constants.js';

export function createDefaultCharacter(overrides = {}) {
  const id = overrides.id || `char_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const defaultSkills = {};
  SKILLS_DEF.forEach(sk => {
    defaultSkills[sk.id] = {
      attr: sk.defaultAttr,
      profLevel: 0,
      bonus: 0
    };
  });

  const defaultSaves = {};
  SAVING_THROWS_DEF.forEach(sv => {
    defaultSaves[sv.key] = {
      proficient: false,
      bonus: 0
    };
  });

  return {
    id,
    ownerUid: overrides.ownerUid || null,
    ownerEmail: overrides.ownerEmail || '',
    name: overrides.name || 'Novo Beyonder',
    player: overrides.player || 'Jogador',
    organization: overrides.organization || 'Independente',
    pathway: overrides.pathway || 'Vidente (Tolo)',
    sequence: overrides.sequence || '9',
    potionName: overrides.potionName || 'Vidente',
    potionProgress: overrides.potionProgress ?? 15,
    actingSummary: overrides.actingSummary || 'Apenas atue como o papel da poção sem perder a si mesmo.',
    armorClass: overrides.armorClass ?? 13,
    proficiencyBonus: overrides.proficiencyBonus ?? 2,
    bonusDie: overrides.bonusDie ?? '1d4',
    autoBonusDie: overrides.autoBonusDie ?? false,
    corruptionLevel: overrides.corruptionLevel ?? 5,
    avatarUrl: overrides.avatarUrl || '',
    contributionPoints: overrides.contributionPoints ?? 80,
    currencyGold: overrides.currencyGold ?? 12,
    currencySoli: overrides.currencySoli ?? 8,
    currencyPenny: overrides.currencyPenny ?? 4,
    turnActions: overrides.turnActions || { ...DEFAULT_TURN_ACTIONS },
    activePassives: overrides.activePassives || [
      {
        id: 'pas_visao_espiritual',
        name: 'Visão Espiritual (Spirit Vision)',
        cost: 1,
        icon: 'fa-eye',
        description: 'Enxerga auras emocionais, saúde, fluxos de espiritualidade e corpos etéreos.',
        activatedAt: 'Ativa'
      }
    ],
    vitals: overrides.vitals || {
      hp: { current: 24, max: 24, temp: 0 },
      sp: { current: 30, max: 30, temp: 0 },
      san: { current: 85, max: 100, temp: 0 }
    },
    attributes: overrides.attributes || {
      for: { value: 10, bonus: 0 },
      agi: { value: 14, bonus: 0 },
      con: { value: 12, bonus: 0 },
      int: { value: 16, bonus: 0 },
      sab: { value: 15, bonus: 0 },
      car: { value: 13, bonus: 0 }
    },
    savingThrows: overrides.savingThrows || defaultSaves,
    skills: overrides.skills || defaultSkills,
    weapons: overrides.weapons || [
      {
        id: 'w1',
        name: 'Revólver de Cano Longo (Balas de Caça-Demônios)',
        attackBonus: 5,
        damage: '1d8+2',
        type: 'Perfurante / Purificador • 24m',
        actionType: 'padrao',
        equipSlot: 'mao_direita',
        isFirearm: true,
        ammoCurrent: 5,
        ammoMax: 6
      },
      {
        id: 'w2',
        name: 'Bengala com Lâmina Oculta',
        attackBonus: 4,
        damage: '1d6+2',
        type: 'Cortante • Corpo a Corpo',
        actionType: 'padrao',
        equipSlot: 'mao_esquerda',
        isFirearm: false,
        ammoCurrent: 0,
        ammoMax: 0
      }
    ],
    equipment: overrides.equipment || [
      {
        id: 'eq1',
        name: 'Artefato Selado 3-0782 (Emblema Sagrado Mutado)',
        category: 'Artefato Selado Grau 3',
        quantity: 1,
        description: 'Purifica mortos-vivos num raio de 10m. Efeito Negativo: Suga lentamente o calor corporal do portador após 15 minutos.'
      },
      {
        id: 'eq2',
        name: 'Pêndulo de Topázio na Corrente de Prata',
        category: 'Instrumento Místico',
        quantity: 1,
        description: 'Ferramenta essencial para Radiestesia Espiritual (horário = sim, anti-horário = não).'
      }
    ],
    powers: overrides.powers || [
      {
        id: 'p1',
        name: 'Visão Espiritual (Spirit Vision)',
        sequence: 'Seq. 9 - Vidente',
        cost: 1,
        actionType: 'bonus',
        description: 'Permite enxergar corpos etéreos, cores emocionais das auras, saúde e fluxos de espiritualidade.'
      },
      {
        id: 'p2',
        name: 'Substituto de Papel (Paper Figurine)',
        sequence: 'Seq. 8 - Palhaço',
        cost: 4,
        actionType: 'oportunidade',
        description: 'Troca de lugar instantaneamente com um boneco de papel preparado, anulando um ataque letal.'
      }
    ],
    spells: overrides.spells || [
      {
        id: 'sp1',
        name: 'Amuleto do Sono / Requiem',
        level: 'Amuleto Místico',
        cost: 2,
        actionType: 'padrao',
        castTime: 'Ação Padrão (Infusão de PE)',
        description: 'Infunde espiritualidade e recita o termo em Hermes Antigo para lançar o amuleto contra o alvo.'
      },
      {
        id: 'sp2',
        name: 'Passo Flamejante (Flaming Jump)',
        level: 'Feitiço de Sequência',
        cost: 3,
        actionType: 'movimento',
        castTime: 'Ação de Movimento',
        description: 'Teleporta-se instantaneamente entre chamas num raio de até 30 metros.'
      }
    ],
    mutations: overrides.mutations || [
      {
        id: 'm1',
        name: 'Sussurros do Nevoeiro Cinza',
        type: 'Mental / Espiritual',
        severity: 'Leve',
        description: 'Ao usar a Visão Espiritual por muito tempo ou avançar de sequência, escuta murmúrios indescritíveis e vê sombras distorcidas.'
      }
    ],
    resistances: overrides.resistances || [
      {
        id: 'res1',
        name: 'Intrusão Espiritual & Adivinhação Maligna',
        degree: 'Resistência Elevada (50% Dano)',
        value: '+3 em Vontade / Anti-Rastreio',
        source: 'Bênção do Nevoeiro Cinza',
        description: 'A aura do Nevoeiro Cinza bloqueia tentativas de rastreamento místico e reduz efeitos mentais de sussurros externos.'
      }
    ],
    weaknesses: overrides.weaknesses || [
      {
        id: 'wk1',
        name: 'Drenagem Térmica do Artefato 3-0782',
        severity: 'Penalidade em Testes',
        penalty: '-2 em CON após 15 min de uso',
        source: 'Efeito Negativo de Artefato',
        description: 'Portar o Emblema Sagrado Mutado sem isolamento espiritual reduz gradualmente a temperatura corporal e a agilidade.'
      }
    ],
    actingNotes: overrides.actingNotes || '• Você apenas atua no papel da poção; o nome da poção é a chave.\n• Um Vidente respeita o destino, mas nunca se submete passivamente a ele.\n• Um Palhaço sorri diante do absurdo do destino, mantendo o controle absoluto do corpo e das expressões.',
    anchors: overrides.anchors || 'Benson e Melissa Moretti (irmãos), memórias de sua terra natal e os membros do Clube de Tarô.',
    backstory: overrides.backstory || 'Antigo historiador envolvido em um ritual misterioso em Tingen. Agora investiga artefatos selados enquanto busca o caminho de volta e desvenda os segredos das Sequências.',
    weeklyDowntime: overrides.weeklyDowntime || createDefaultWeeklyDowntime(1),
    downtimeHistory: overrides.downtimeHistory || [],
    sequenceSummaries: overrides.sequenceSummaries || [],
    updatedAt: Date.now()
  };
}

export function getSampleCharactersList() {
  const kleinDowntime = createDefaultWeeklyDowntime(1);
  kleinDowntime.submittedToGM = true;
  kleinDowntime.submittedAt = Date.now() - 3600000;
  kleinDowntime.generalGoals = 'Atuar como Vidente no Clube de Adivinhação de Tingen e investigar pistas sobre a Ordem Secreta e o caderno da Família Antigonus.';
  kleinDowntime.days.segunda.playerActivity = 'Atendi clientes no Clube de Adivinhação usando Astrologia e Pêndulo de Topázio para digerir a poção.';
  kleinDowntime.days.segunda.gmRequestedTest = 'ocultismo';
  kleinDowntime.days.segunda.gmTestDC = 14;
  kleinDowntime.days.segunda.gmFeedback = 'Uma leitura espiritual profunda impressionou um comerciante local e acelerou a digestão da sua poção.';
  kleinDowntime.days.segunda.outcomes = ['pocao', 'dinheiro'];
  kleinDowntime.days.segunda.deltas = { potion: 5, hp: 0, san: 0, sp: 0, gold: 4, itemGained: '', clueGained: '' };

  kleinDowntime.days.terca.playerActivity = 'Treinei pontaria no estande subterrâneo dos Falcões Noturnos e estudei documentos históricos da Quarta Época.';
  kleinDowntime.days.terca.gmRequestedTest = 'historia';
  kleinDowntime.days.terca.gmTestDC = 15;
  kleinDowntime.days.terca.gmFeedback = 'Descobriu menções ao Pico Hornacis nos arquivos antigos.';
  kleinDowntime.days.terca.outcomes = ['pista'];
  kleinDowntime.days.terca.deltas = { potion: 0, hp: 0, san: 0, sp: 0, gold: 0, itemGained: '', clueGained: 'Referência ao tesouro oculto no Pico Hornacis' };

  kleinDowntime.days.quarta.isMissionDay = true;
  kleinDowntime.days.quarta.playerActivity = 'Dia de Sessão / Missão conjunta com os Falcões Noturnos no porto.';

  kleinDowntime.days.quinta.playerActivity = 'Preparei amuletos do sono na Rua Daffodil e cozinhei um jantar especial para Benson e Melissa.';
  kleinDowntime.days.quinta.outcomes = ['sanidade_mais', 'item'];
  kleinDowntime.days.quinta.gmFeedback = 'O convívio familiar fortaleceu suas âncoras e o ritual rendeu um amuleto extra.';
  kleinDowntime.days.quinta.deltas = { potion: 0, hp: 0, san: 5, sp: 0, gold: 0, itemGained: 'Amuleto de Réquiem Purificado', clueGained: '' };

  const klein = createDefaultCharacter({
    id: 'sample_klein_moretti',
    ownerUid: 'user_gm_default',
    ownerEmail: 'mestre@grimorio.rpg',
    name: 'Klein Moretti (O Tolo)',
    player: 'Mestre / Exemplo',
    organization: 'Falcões Noturnos / Clube de Tarô',
    pathway: 'Vidente (Tolo)',
    sequence: '8',
    potionName: 'Palhaço',
    potionProgress: 65,
    armorClass: 15,
    proficiencyBonus: 3,
    bonusDie: '1d6',
    vitals: {
      hp: { current: 26, max: 32, temp: 0 },
      sp: { current: 35, max: 50, temp: 0 },
      san: { current: 82, max: 100, temp: 0 }
    },
    attributes: {
      for: { value: 11, bonus: 0 },
      agi: { value: 16, bonus: 0 },
      con: { value: 13, bonus: 0 },
      int: { value: 18, bonus: 0 },
      sab: { value: 16, bonus: 0 },
      car: { value: 14, bonus: 0 }
    },
    weeklyDowntime: kleinDowntime,
    sequenceSummaries: [
      {
        id: 'seq_sum_1',
        fromSequence: '9',
        fromPotion: 'Vidente',
        toSequence: '8',
        toPotion: 'Palhaço',
        summary: 'Ao ingerir a poção de Palhaço, seus nervos e músculos tornaram-se extraordinariamente ágeis e coordenados. Você adquiriu controle facial absoluto, combate acrobático instintivo, intuição de perigo iminente e a habilidade de transformar simples pedaços de papel em armas afiadas ou Substitutos de Papel.',
        changesOverview: '+8 PV Máx • +10 PE Máx • Nova Habilidade: Substituto de Papel & Controle Corporal de Palhaço',
        date: 'Semana 1'
      }
    ]
  });
  klein.skills.ocultismo.profLevel = 2;
  klein.skills.investigacao.profLevel = 1;
  klein.skills.historia.profLevel = 2;
  klein.skills.acrobacia.profLevel = 1;
  klein.skills.enganacao.profLevel = 1;
  klein.skills.pontaria.profLevel = 1;
  klein.savingThrows.int.proficient = true;
  klein.savingThrows.sab.proficient = true;
  klein.savingThrows.vontade.proficient = true;

  const audreyDowntime = createDefaultWeeklyDowntime(1);
  audreyDowntime.submittedToGM = true;
  audreyDowntime.submittedAt = Date.now() - 1800000;
  audreyDowntime.generalGoals = 'Observar discretamente os nobres nos bailes de Backlund e coletar páginas do diário de Roselle.';
  audreyDowntime.days.segunda.playerActivity = 'Participei de um chá da tarde com damas da nobreza de Backlund, atuando como uma Espectadora silenciosa.';
  audreyDowntime.days.segunda.gmRequestedTest = 'intuicao';
  audreyDowntime.days.segunda.gmTestDC = 13;
  audreyDowntime.days.segunda.gmFeedback = 'Notou microexpressões de medo no Visconde Glaint ao mencionarem os Alquimistas da Psicologia.';
  audreyDowntime.days.segunda.outcomes = ['pocao', 'pista'];
  audreyDowntime.days.segunda.deltas = { potion: 8, hp: 0, san: 0, sp: 0, gold: 0, itemGained: '', clueGained: 'Conexão do Visconde com um círculo místico em Backlund' };
  audreyDowntime.days.quarta.isMissionDay = true;
  audreyDowntime.days.quarta.playerActivity = 'Sessão do Clube de Tarô e investigação conjunta.';

  const audrey = createDefaultCharacter({
    id: 'sample_audrey_hall',
    ownerUid: 'user_player_audrey',
    ownerEmail: 'audrey@grimorio.rpg',
    name: 'Audrey Hall (Srta. Justiça)',
    player: 'Jogadora 1 (Audrey)',
    organization: 'Clube de Tarô / Alquimistas da Psicologia',
    pathway: 'Espectador (Visionário)',
    sequence: '7',
    potionName: 'Psiquiatra',
    potionProgress: 40,
    actingSummary: 'Você é sempre uma espectadora na plateia da vida, observando sem interferir impulsivamente.',
    armorClass: 13,
    proficiencyBonus: 3,
    bonusDie: '1d6',
    corruptionLevel: 2,
    currencyGold: 500,
    vitals: {
      hp: { current: 24, max: 28, temp: 0 },
      sp: { current: 45, max: 55, temp: 0 },
      san: { current: 90, max: 100, temp: 0 }
    },
    attributes: {
      for: { value: 9, bonus: 0 },
      agi: { value: 13, bonus: 0 },
      con: { value: 12, bonus: 0 },
      int: { value: 15, bonus: 0 },
      sab: { value: 17, bonus: 0 },
      car: { value: 18, bonus: 0 }
    },
    powers: [
      {
        id: 'pa1',
        name: 'Acalmar (Placate) & Frenesi',
        sequence: 'Seq. 7 - Psiquiatra',
        cost: 5,
        actionType: 'padrao',
        description: 'Acalma companheiros à beira da perda de controle (recuperando 1d8+4 SAN) ou induz Frenesi mental nos inimigos.'
      },
      {
        id: 'pa2',
        name: 'Leitura de Linguagem Corporal (Telepatia)',
        sequence: 'Seq. 8 - Telepata',
        cost: 2,
        actionType: 'bonus',
        description: 'Lê pensamentos superficiais e intenções reais através de microexpressões e flutuações da aura.'
      }
    ],
    weeklyDowntime: audreyDowntime,
    sequenceSummaries: [
      {
        id: 'seq_sum_audrey_1',
        fromSequence: '8',
        fromPotion: 'Telepata',
        toSequence: '7',
        toPotion: 'Psiquiatra',
        summary: 'Sua percepção do mar subconsciente coletivo expandiu-se drasticamente. Agora sua presença exala uma aura serena capaz de suprimir a loucura de aliados (Acalmar), induzir estados hipnóticos profundos ou despertar histeria e Frenesi nos inimigos.',
        changesOverview: 'Desbloqueou Acalmar (Placate), Frenesi e Escama de Dragão Mental • +12 PE Máx',
        date: 'Semana 1'
      }
    ]
  });
  audrey.skills.intuicao.profLevel = 2;
  audrey.skills.persuasao.profLevel = 2;
  audrey.skills.sociedade.profLevel = 1;
  audrey.skills.enganacao.profLevel = 1;
  audrey.savingThrows.sab.proficient = true;
  audrey.savingThrows.car.proficient = true;

  const algerDowntime = createDefaultWeeklyDowntime(1);
  algerDowntime.submittedToGM = false;
  algerDowntime.generalGoals = 'Navegar no Vingador Azul em busca de ingredientes Beyonder no Mar Sônia.';
  algerDowntime.days.terca.playerActivity = 'Enfrentei uma tempestade repentina no convés para comandar a tripulação pelo temor.';
  algerDowntime.days.terca.gmRequestedTest = 'intimidar';
  algerDowntime.days.terca.gmTestDC = 14;
  algerDowntime.days.quarta.isMissionDay = true;
  algerDowntime.days.quarta.playerActivity = 'Missão principal da sessão.';

  const alger = createDefaultCharacter({
    id: 'sample_alger_wilson',
    ownerUid: 'user_player_alger',
    ownerEmail: 'alger@grimorio.rpg',
    name: 'Alger Wilson (Sr. Enforcado)',
    player: 'Jogador 2 (Alger)',
    organization: 'Igreja das Tempestades / Clube de Tarô',
    pathway: 'Marinheiro (Tirano)',
    sequence: '7',
    potionName: 'Navegador',
    potionProgress: 80,
    actingSummary: 'Imponha o temor dos mares e da tempestade sobre aqueles que o desafiam.',
    armorClass: 16,
    proficiencyBonus: 3,
    bonusDie: '1d6',
    corruptionLevel: 12,
    vitals: {
      hp: { current: 38, max: 44, temp: 0 },
      sp: { current: 30, max: 40, temp: 0 },
      san: { current: 76, max: 100, temp: 0 }
    },
    attributes: {
      for: { value: 17, bonus: 0 },
      agi: { value: 14, bonus: 0 },
      con: { value: 16, bonus: 0 },
      int: { value: 13, bonus: 0 },
      sab: { value: 15, bonus: 0 },
      car: { value: 12, bonus: 0 }
    },
    powers: [
      {
        id: 'pal1',
        name: 'Escamas Fantasmas & Golpe de Vento',
        sequence: 'Seq. 9/8 - Marinheiro / Povo da Fúria',
        cost: 3,
        actionType: 'bonus',
        description: 'Pele coberta por escamas ilusórias (+2 CA) e ataques carregados com a fúria da tempestade.'
      }
    ],
    weeklyDowntime: algerDowntime
  });
  alger.skills.atletismo.profLevel = 2;
  alger.skills.luta.profLevel = 1;
  alger.skills.intimidar.profLevel = 2;
  alger.skills.natureza.profLevel = 1;
  alger.savingThrows.for.proficient = true;
  alger.savingThrows.con.proficient = true;

  return [klein, audrey, alger];
}