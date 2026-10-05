import assert from 'node:assert/strict';
import test from 'node:test';
import { createGuestBackup, parseGuestBackup } from '../src/lib/guestBackup';
import { EMPTY_STATE, type StudyState } from '../src/lib/types';

test('guest backup restores the plan, private questions, attempts, and notes', () => {
  const state: StudyState = {
    ...EMPTY_STATE,
    name: 'Sam', targetDate: '2027-05-15',
    personalQuestions: [{ id: 'q1', subjectId: 'far', topicId: 'far-001', stem: 'Sample?', options: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'For testing.', origin: 'personal' }],
    attempts: [{ id: 'a1', at: '2026-10-04T00:00:00Z', questionIds: ['q1'], responses: { q1: 0 }, score: 1, durationSeconds: 12 }],
    materials: [{ id: 'm1', topicId: 'far-001', title: 'My notes', notes: 'Remember this.' }],
  };
  assert.deepEqual(parseGuestBackup(createGuestBackup(state, '2026-10-04T00:00:00Z')), state);
});

test('guest backup rejects invalid topics and mismatched question subjects', () => {
  const state: StudyState = { ...EMPTY_STATE, personalQuestions: [{ id: 'q1', subjectId: 'tax', topicId: 'far-001', stem: 'Sample?', options: ['A', 'B', 'C', 'D'], answer: 0, explanation: 'For testing.', origin: 'personal' }] };
  assert.throws(() => parseGuestBackup(createGuestBackup(state)));
  assert.throws(() => parseGuestBackup('{"format":"other"}'));
});
