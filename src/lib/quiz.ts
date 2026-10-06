import { findSubjectForTopic, subjectById, topicById } from './syllabus';
import { subjectExamItems, tosGroups } from './tosWeights';
import type { Question, SubjectId } from './types';

export function chooseRandom<T>(items: T[], count: number, random: () => number = () => {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] / 0x100000000;
}): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.max(0, Math.min(count, shuffled.length)));
}

export type QuizAssembly = {
  questions: Question[];
  requested: number;
  available: number;
  complete: boolean;
  method: 'subject-balanced' | 'official-tos-weights';
  limitation: string | null;
  difficultyBreakdown: Record<'easy' | 'moderate' | 'difficult' | 'untagged', number>;
  difficultyTarget: Record<'easy' | 'moderate' | 'difficult', number> | null;
  difficultyLimitation: string | null;
};

type SectionWeights = Record<string, number>;
type Difficulty = NonNullable<Question['difficulty']>;
type DifficultyTarget = Record<Difficulty, number>;

function difficultyCounts(questions: Question[]): QuizAssembly['difficultyBreakdown'] {
  const result = { easy: 0, moderate: 0, difficult: 0, untagged: 0 };
  for (const question of questions) result[question.difficulty ?? 'untagged'] += 1;
  return result;
}

function difficultyTarget(count: number): DifficultyTarget {
  const easy = Math.round(count * 0.3);
  const moderate = Math.round(count * 0.4);
  return { easy, moderate, difficult: count - easy - moderate };
}

function difficultyLimitation(counts: QuizAssembly['difficultyBreakdown'], target: DifficultyTarget): string | null {
  const shortages = (['easy', 'moderate', 'difficult'] as const)
    .filter((level) => counts[level] < target[level])
    .map((level) => `${level} ${counts[level]}/${target[level]}`);
  if (counts.untagged) shortages.push(`${counts.untagged} untagged`);
  return shortages.length ? `Difficulty mix is not yet representative: ${shortages.join(', ')}.` : null;
}

const tosGroupByTopic = new Map(tosGroups.flatMap((group) => group.topicIds.map((topicId) => [topicId, group.label] as const)));

function uniqueQuestions(pool: Question[]): Question[] {
  const seen = new Set<string>();
  return pool.filter((question) => {
    if (seen.has(question.id) || !topicById[question.topicId] || question.subjectId !== findSubjectForTopic(question.topicId).id) return false;
    seen.add(question.id);
    return true;
  });
}

function groupedSelection(
  questions: Question[],
  count: number,
  group: (question: Question) => string,
  weights: SectionWeights,
  random: () => number,
  target?: DifficultyTarget,
): Question[] {
  const groups = new Map<string, Question[]>();
  for (const question of chooseRandom(questions, questions.length, random)) {
    const key = group(question);
    groups.set(key, [...(groups.get(key) ?? []), question]);
  }
  const selected: Question[] = [];
  const chosenByGroup = new Map<string, number>();
  const chosenByDifficulty = { easy: 0, moderate: 0, difficult: 0 };
  const totalWeight = [...groups.keys()].reduce((sum, key) => sum + (weights[key] ?? 1), 0);
  while (selected.length < Math.min(count, questions.length)) {
    const candidates = [...groups.entries()].filter(([, items]) => items.length);
    if (!candidates.length) break;
    candidates.sort(([a], [b]) => {
      const aGap = ((weights[a] ?? 1) / totalWeight) * Math.min(count, questions.length) - (chosenByGroup.get(a) ?? 0);
      const bGap = ((weights[b] ?? 1) / totalWeight) * Math.min(count, questions.length) - (chosenByGroup.get(b) ?? 0);
      return bGap - aGap;
    });
    const [key, items] = candidates[0];
    let chosenIndex = 0;
    if (target) {
      let bestScore = -Infinity;
      for (let index = 0; index < items.length; index += 1) {
        const level = items[index].difficulty;
        const gap = level ? target[level] - chosenByDifficulty[level] : 0;
        const score = level ? (gap > 0 ? 10 + gap / Math.max(1, target[level]) : 1) : 0;
        if (score > bestScore) { bestScore = score; chosenIndex = index; }
      }
    }
    const [chosen] = items.splice(chosenIndex, 1);
    selected.push(chosen);
    if (chosen.difficulty) chosenByDifficulty[chosen.difficulty] += 1;
    chosenByGroup.set(key, (chosenByGroup.get(key) ?? 0) + 1);
  }
  return selected;
}

export function assembleDiagnostic(pool: Question[], count = 18, random?: () => number): QuizAssembly {
  const eligible = uniqueQuestions(pool);
  const draw = random ?? (() => { const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); return bytes[0] / 0x100000000; });
  const questions = groupedSelection(eligible, Math.max(0, count), (question) => question.subjectId,
    Object.fromEntries(Object.keys(subjectById).map((id) => [id, 1])), draw);
  return {
    questions,
    requested: count,
    available: eligible.length,
    complete: questions.length === count,
    method: 'subject-balanced',
    limitation: questions.length < count ? `Only ${questions.length} of ${count} requested questions are available.` : null,
    difficultyBreakdown: difficultyCounts(questions),
    difficultyTarget: null,
    difficultyLimitation: null,
  };
}

export function assembleSubjectMock(pool: Question[], subjectId: SubjectId, count = subjectExamItems(subjectId), random?: () => number): QuizAssembly {
  const eligible = uniqueQuestions(pool).filter((question) => question.subjectId === subjectId);
  const draw = random ?? (() => { const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); return bytes[0] / 0x100000000; });
  const groups = tosGroups.filter((group) => group.subjectId === subjectId);
  const weights = Object.fromEntries(groups.map((group) => [group.label, group.items]));
  const target = difficultyTarget(Math.max(0, count));
  const questions = groupedSelection(eligible, Math.max(0, count), (question) => tosGroupByTopic.get(question.topicId) ?? 'Unmapped', weights, draw, target);
  const breakdown = difficultyCounts(questions);
  const mixLimitation = difficultyLimitation(breakdown, target);
  const coveredSections = new Set(questions.map((question) => tosGroupByTopic.get(question.topicId) ?? 'Unmapped'));
  const limitation = [
    questions.length < count ? `Only ${questions.length} of ${count} requested questions are available.` : '',
    coveredSections.size < groups.length ? `Questions cover ${coveredSections.size} of ${groups.length} official TOS groups.` : '',
    mixLimitation ?? '',
  ].filter(Boolean).join(' ');
  return {
    questions,
    requested: count,
    available: eligible.length,
    complete: questions.length === count && coveredSections.size === groups.length && !mixLimitation,
    method: 'official-tos-weights',
    limitation: limitation || null,
    difficultyBreakdown: breakdown,
    difficultyTarget: target,
    difficultyLimitation: mixLimitation,
  };
}

export function scoreAttemptByTopic(questions: Question[], responses: Record<string, number>): Record<string, { correct: number; total: number }> {
  const result: Record<string, { correct: number; total: number }> = {};
  for (const question of questions) {
    const bucket = result[question.topicId] ?? { correct: 0, total: 0 };
    bucket.total += 1;
    if (responses[question.id] === question.answer) bucket.correct += 1;
    result[question.topicId] = bucket;
  }
  return result;
}
