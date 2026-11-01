import { clamp, formatSigned } from '../utils/helpers.js';
import { playDiceSound } from './audioAndToast.js';

export function rollSingleDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export function evaluateBonusDie(character, forceUseNow = false) {
  const shouldRollBonus = (character && character.autoBonusDie) || forceUseNow;
  if (!shouldRollBonus || !character || !character.bonusDie) {
    return { value: 0, text: '' };
  }

  const match = character.bonusDie.match(/(\d+)d(\d+)/i);
  if (!match) return { value: 0, text: '' };

  const count = parseInt(match[1], 10);
  const sides = parseInt(match[2], 10);
  let sum = 0;
  for (let i = 0; i < count; i++) {
    sum += rollSingleDie(sides);
  }
  return { value: sum, text: `+ ${sum} [${character.bonusDie}]` };
}

export function buildD20RollResult({ character, title, subtitle, modifier, rollMode, forceBonusDie }) {
  const charName = character ? character.name : 'Mestre';
  const mod = Number(modifier) || 0;

  const r1 = rollSingleDie(20);
  const r2 = rollSingleDie(20);
  let chosenNatural = r1;
  let modeTag = '';

  if (rollMode === 'advantage') {
    chosenNatural = Math.max(r1, r2);
    modeTag = `Vantagem (${r1}, ${r2})`;
  } else if (rollMode === 'disadvantage') {
    chosenNatural = Math.min(r1, r2);
    modeTag = `Desvantagem (${r1}, ${r2})`;
  }

  const bonusObj = evaluateBonusDie(character, forceBonusDie);
  const total = chosenNatural + mod + bonusObj.value;
  const isCrit = chosenNatural === 20;
  const isFail = chosenNatural === 1;

  playDiceSound(isCrit, isFail);

  const detailsParts = [`d20 (${chosenNatural})`];
  if (modeTag) detailsParts.push(modeTag);
  if (mod !== 0) detailsParts.push(`${formatSigned(mod)} mod`);
  if (bonusObj.text) detailsParts.push(bonusObj.text);

  return {
    characterName: charName,
    title,
    subtitle,
    formula: `1d20 ${formatSigned(mod)}${bonusObj.text ? ' ' + character.bonusDie : ''}`,
    naturalRoll: chosenNatural,
    total,
    details: detailsParts.join(' • '),
    isCrit,
    isFail
  };
}

export function buildFormulaRollResult({ characterName, title, subtitle, expr }) {
  const regex = /(\d+)d(\d+)(\s*[+-]\s*\d+)?/i;
  const match = (expr || '1d6').trim().match(regex);
  if (!match) return null;

  const count = clamp(parseInt(match[1], 10), 1, 50);
  const sides = clamp(parseInt(match[2], 10), 2, 100);
  const mod = match[3] ? parseInt(match[3].replace(/\s+/g, ''), 10) : 0;

  const rolls = [];
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const r = rollSingleDie(sides);
    rolls.push(r);
    sum += r;
  }

  playDiceSound(false, false);

  return {
    characterName,
    title,
    subtitle,
    formula: expr.trim(),
    naturalRoll: null,
    total: sum + mod,
    details: `[${rolls.join(', ')}] ${mod !== 0 ? formatSigned(mod) : ''}`,
    isCrit: false,
    isFail: false
  };
}