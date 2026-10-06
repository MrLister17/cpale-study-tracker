import assert from 'node:assert/strict';
import test from 'node:test';
import { createGuestBackup, parseGuestBackup } from '../src/lib/guestBackup';
import { EMPTY_STATE, type StudyState } from '../src/lib/types';
import { parsePersonalStudyPack } from '../src/lib/studyPack';

test('guest backup restores the plan, private questions, attempts, and notes', () => {
  const state: StudyState = {
    ...EMPTY_STATE,
    name: 'Sam', targetDate: '2027-05-15',
    actualMinutes: { 'far-001': 75 },
    personalQuestions: [{ id: 'q1', subjectId: 'far', topicId: 'far-001', stem: 'Sample?', options: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'For testing.', origin: 'personal' }],
    attempts: [{ id: 'a1', at: '2026-10-04T00:00:00Z', questionIds: ['q1'], responses: { q1: 0 }, score: 1, durationSeconds: 12, topicResults: { 'far-001': { correct: 1, total: 1 } }, reviewed: false, mode: 'practice' }],
    materials: [{ id: 'm1', topicId: 'far-001', title: 'My notes', notes: 'Remember this.' }],
  };
  assert.deepEqual(parseGuestBackup(createGuestBackup(state, '2026-10-04T00:00:00Z')), state);
});

test('guest backup rejects invalid topics and mismatched question subjects', () => {
  const state: StudyState = { ...EMPTY_STATE, personalQuestions: [{ id: 'q1', subjectId: 'tax', topicId: 'far-001', stem: 'Sample?', options: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'For testing.', origin: 'personal' }] };
  assert.throws(() => parseGuestBackup(createGuestBackup(state)));
  assert.throws(() => parseGuestBackup('{"format":"other"}'));
});

test('backup carries the personal study pack and mistake review notes', () => {
  const draft = { id: 'draft-1', subjectId: 'far' as const, topicId: 'far-001', stem: 'What is the next step?', options: ['A', 'B', 'C', 'D'] as [string, string, string, string], answer: 0, explanation: 'Study the source.', source: 'https://www.prc.gov.ph/', origin: 'starter' as const, difficulty: 'easy' as const };
  const pack = parsePersonalStudyPack(JSON.stringify({ format: 'cpale-personal-study-pack', version: 1, createdAt: '2026-10-06T00:00:00Z', lessons: [], questions: [draft] }));
  const state: StudyState = { ...EMPTY_STATE, importedLessons: pack.lessons, importedQuestions: pack.questions, mistakes: [{ id: 'm1', questionId: draft.id, topicId: draft.topicId, at: '2026-10-06T00:00:00Z', whyWrong: 'I skipped the rule.', correctedPrinciple: 'Read the source.', nextReviewOn: '2026-10-07' }] };
  assert.deepEqual(parseGuestBackup(createGuestBackup(state)), state);
  assert.throws(() => parsePersonalStudyPack(JSON.stringify({ ...pack, questions: [{ ...draft, source: 'javascript:alert(1)' }] })));
});
