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
};

type SectionWeights = Record<string, number>;

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
): Question[] {
  const groups = new Map<string, Question[]>();
  for (const question of chooseRandom(questions, questions.length, random)) {
    const key = group(question);
    groups.set(key, [...(groups.get(key) ?? []), question]);
  }
  const selected: Question[] = [];
  const chosenByGroup = new Map<string, number>();
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
    selected.push(items.shift()!);
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
  };
}

export function assembleSubjectMock(pool: Question[], subjectId: SubjectId, count = subjectExamItems(subjectId), random?: () => number): QuizAssembly {
  const eligible = uniqueQuestions(pool).filter((question) => question.subjectId === subjectId);
  const draw = random ?? (() => { const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); return bytes[0] / 0x100000000; });
  const groups = tosGroups.filter((group) => group.subjectId === subjectId);
  const weights = Object.fromEntries(groups.map((group) => [group.label, group.items]));
  const questions = groupedSelection(eligible, Math.max(0, count), (question) => tosGroupByTopic.get(question.topicId) ?? 'Unmapped', weights, draw);
  const coveredSections = new Set(questions.map((question) => tosGroupByTopic.get(question.topicId) ?? 'Unmapped'));
  const limitation = [
    questions.length < count ? `Only ${questions.length} of ${count} requested questions are available.` : '',
    coveredSections.size < groups.length ? `Questions cover ${coveredSections.size} of ${groups.length} official TOS groups.` : '',
  ].filter(Boolean).join(' ');
  return {
    questions,
    requested: count,
    available: eligible.length,
    complete: questions.length === count && coveredSections.size === groups.length,
    method: 'official-tos-weights',
    limitation: limitation || null,
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
