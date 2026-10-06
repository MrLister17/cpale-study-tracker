import assert from 'node:assert/strict';
import test from 'node:test';
import { buildReadiness } from '../src/lib/readiness';
import { EMPTY_STATE, type Question, type StudyState } from '../src/lib/types';
import { allTopics } from '../src/lib/syllabus';

const question: Question = {
  id: 'q-far', topicId: 'far-054', subjectId: 'far', stem: 'Example',
  options: ['A', 'B', 'C', 'D'], answer: 1, explanation: 'Explanation', origin: 'personal',
};

test('readiness does not treat confidence or logged time as mastery', () => {
  const baseline = buildReadiness(EMPTY_STATE);
  const rated = buildReadiness({ ...EMPTY_STATE, ratings: { 'far-054': 'confident' },
    actualMinutes: { 'far-054': 300 } } as StudyState);
  assert.equal(baseline.evidencePercent, 0);
  assert.equal(rated.evidencePercent, 0);
  assert.equal(rated.practiceAccuracyPercent, null);
  assert.equal(rated.unmappedTosItems, 0);
});

test('completed study and quiz work counts as coverage, while a wrong answer lowers evidence', () => {
  const state: StudyState = {
    ...EMPTY_STATE,
    completed: { 'study:far-054': '2026-10-06', 'lecture:far-054': '2026-10-06', 'quiz:far-054': '2026-10-06' },
    attempts: [{ id: 'a1', at: '2026-10-06T01:00:00Z', questionIds: ['q-far'], responses: { 'q-far': 0 }, score: 0, durationSeconds: 20, reviewed: true }],
  };
  const wrong = buildReadiness(state, [question]);
  assert.equal(wrong.completedTopicCount, 1);
  assert.equal(wrong.assessedTopicCount, 1);
  assert.equal(wrong.practiceAccuracyPercent, 0);
  assert.equal(wrong.bySubject.find((entry) => entry.subjectId === 'far')?.completedCoveragePercent, 7);
  assert.ok(wrong.priorityGaps.some((entry) => entry.topicId === 'far-054' && entry.needsReview));
  const corrected = buildReadiness({ ...state, attempts: [...state.attempts, {
    id: 'a2', at: '2026-10-07T01:00:00Z', questionIds: ['q-far'], responses: { 'q-far': 1 }, score: 1, durationSeconds: 18, reviewed: true,
  }] }, [question]);
  assert.equal(corrected.practiceAccuracyPercent, 100);
  assert.ok(corrected.evidencePercent > wrong.evidencePercent);
  assert.ok(!corrected.priorityGaps.some((entry) => entry.topicId === 'far-054'));
});

test('deleted or unavailable questions cannot inflate assessed coverage', () => {
  const state: StudyState = { ...EMPTY_STATE, attempts: [{
    id: 'a1', at: '2026-10-06T01:00:00Z', questionIds: ['missing'],
    responses: { missing: 1 }, score: 1, durationSeconds: 10,
  }] };
  assert.equal(buildReadiness(state, []).assessedCoveragePercent, 0);
  assert.equal(buildReadiness(state, []).practiceAccuracyPercent, null);
});

test('unreviewed drafts show practice results without inflating verified readiness', () => {
  const attempt = {
    id: 'draft', at: '2026-10-06T01:00:00Z', questionIds: ['deleted'],
    responses: { deleted: 1 }, score: 1, durationSeconds: 10,
    topicResults: { 'far-054': { correct: 1, total: 1 } }, reviewed: false,
  };
  const result = buildReadiness({ ...EMPTY_STATE, attempts: [attempt] }, []);
  assert.equal(result.practiceAccuracyPercent, 100);
  assert.ok(result.practiceCoveragePercent > 0);
  assert.equal(result.assessedCoveragePercent, 0);
  assert.equal(result.verifiedPracticeAccuracyPercent, null);
  assert.equal(result.evidencePercent, 0);
});

test('persisted reviewed topic results survive question deletion', () => {
  const attempt = {
    id: 'reviewed', at: '2026-10-06T01:00:00Z', questionIds: ['deleted'],
    responses: { deleted: 1 }, score: 1, durationSeconds: 10,
    topicResults: { 'far-054': { correct: 1, total: 1 } }, reviewed: true,
  };
  const result = buildReadiness({ ...EMPTY_STATE, attempts: [attempt] }, []);
  assert.equal(result.assessedTopicCount, 1);
  assert.equal(result.verifiedPracticeAccuracyPercent, 100);
  assert.ok(result.evidencePercent > 0);
});

test('full mapped completion covers all TOS sections but lacks verified answer evidence', () => {
  const completed = Object.fromEntries(allTopics.flatMap((topic) =>
    ['study', 'lecture', 'quiz'].map((kind) => [`${kind}:${topic.id}`, '2026-10-06'])));
  const result = buildReadiness({ ...EMPTY_STATE, completed });
  assert.equal(result.completedTopicCount, allTopics.length);
  assert.equal(result.completedCoveragePercent, 100);
  assert.equal(result.unmappedTosItems, 0);
  assert.equal(result.evidencePercent, 40);
});
