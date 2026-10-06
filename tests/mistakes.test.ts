import assert from 'node:assert/strict';
import test from 'node:test';
import { dueMistakes, recordMissedQuestions, resolveMistake, reviewMistake, type MistakeEntry } from '../src/lib/mistakes';
import type { Question } from '../src/lib/types';

const first: Question = {
  id: 'q-1', subjectId: 'far', topicId: 'far-001', stem: 'Synthetic fixture',
  options: ['A', 'B', 'C', 'D'], answer: 2, explanation: 'Fixture', origin: 'personal',
};
const second: Question = { ...first, id: 'q-2', topicId: 'far-002', answer: 0 };

test('wrong and unanswered questions create one note each, using the Philippine study date', () => {
  const entries = recordMissedQuestions([], [first, second], { 'q-1': 1 }, '2026-10-06T16:30:00Z', () => 'fixture-id');
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map((entry) => entry.nextReviewOn), ['2026-10-08', '2026-10-08']);
  assert.equal(recordMissedQuestions([], [first], { 'q-1': 2 }, '2026-10-06T12:00:00Z').length, 0);
});

test('a repeat miss keeps personal notes but reopens review instead of adding a duplicate', () => {
  const old: MistakeEntry = {
    id: 'note-1', questionId: 'q-1', topicId: 'far-001', at: '2026-09-01T00:00:00Z',
    whyWrong: 'I skipped a step', correctedPrinciple: 'Use the full sequence',
    nextReviewOn: '2026-09-05', reviewCount: 2, resolvedAt: '2026-09-05T00:00:00+08:00',
  };
  const entries = recordMissedQuestions([old], [first], { 'q-1': 0 }, '2026-10-06T12:00:00Z');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].whyWrong, old.whyWrong);
  assert.equal(entries[0].correctedPrinciple, old.correctedPrinciple);
  assert.equal(entries[0].at, old.at);
  assert.equal(entries[0].nextReviewOn, '2026-10-07');
  assert.equal(entries[0].reviewCount, 0);
  assert.equal(entries[0].resolvedAt, undefined);
});

test('due list honors date boundary, sorting, and learned notes', () => {
  const entries = recordMissedQuestions([], [first, second], {}, '2026-10-06T12:00:00Z', () => 'id');
  const later = { ...entries[0], nextReviewOn: '2026-10-10' };
  const learned = resolveMistake(entries[1], '2026-10-06');
  assert.deepEqual(dueMistakes([later, learned], '2026-10-09'), []);
  assert.deepEqual(dueMistakes([later, learned], '2026-10-10').map((entry) => entry.questionId), ['q-1']);
});

test('spaced review lengthens after recall and resets after uncertainty', () => {
  const [entry] = recordMissedQuestions([], [first], {}, '2026-10-06T12:00:00Z', () => 'id');
  const remembered = reviewMistake(entry, 'remembered', '2026-10-07');
  assert.equal(remembered.nextReviewOn, '2026-10-10');
  assert.equal(reviewMistake(remembered, 'remembered', '2026-10-10').nextReviewOn, '2026-10-17');
  const uncertain = reviewMistake(remembered, 'again', '2026-10-10');
  assert.equal(uncertain.nextReviewOn, '2026-10-11');
  assert.equal(uncertain.reviewCount, 0);
});
