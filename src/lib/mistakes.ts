import { phDate } from './planner';
import type { MistakeEntry, Question } from './types';

export type { MistakeEntry } from './types';

function addDays(day: string, days: number): string {
  const parsed = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) throw new Error('Invalid review date');
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

/** Keep one active note per question. A later miss brings it back to tomorrow's review. */
export function recordMissedQuestions(
  entries: MistakeEntry[],
  questions: Question[],
  responses: Record<string, number>,
  atIso: string,
  makeId: () => string = () => crypto.randomUUID(),
): MistakeEntry[] {
  const reviewOn = addDays(phDate(new Date(atIso)), 1);
  const updated = [...entries];
  for (const question of questions) {
    if (responses[question.id] === question.answer) continue;
    const index = updated.findIndex((entry) => entry.questionId === question.id);
    if (index >= 0) {
      updated[index] = { ...updated[index], nextReviewOn: reviewOn, reviewCount: 0, resolvedAt: undefined };
    } else {
      updated.push({
        id: makeId(), questionId: question.id, topicId: question.topicId, at: atIso,
        whyWrong: '', correctedPrinciple: '', nextReviewOn: reviewOn, reviewCount: 0,
      });
    }
  }
  return updated;
}

export function dueMistakes(entries: MistakeEntry[], today: string): MistakeEntry[] {
  return entries.filter((entry) => !entry.resolvedAt && entry.nextReviewOn <= today)
    .sort((a, b) => a.nextReviewOn.localeCompare(b.nextReviewOn) || a.at.localeCompare(b.at));
}

/** A remembered idea returns at increasing intervals; an uncertain one returns tomorrow. */
export function reviewMistake(entry: MistakeEntry, result: 'remembered' | 'again', reviewedOn: string): MistakeEntry {
  const count = result === 'remembered' ? (entry.reviewCount ?? 0) + 1 : 0;
  const interval = result === 'remembered' ? [3, 7, 14, 30][Math.min(count - 1, 3)] : 1;
  return { ...entry, reviewCount: count, nextReviewOn: addDays(reviewedOn, interval), resolvedAt: undefined };
}

export function resolveMistake(entry: MistakeEntry, resolvedOn: string): MistakeEntry {
  return { ...entry, resolvedAt: `${resolvedOn}T00:00:00+08:00` };
}
