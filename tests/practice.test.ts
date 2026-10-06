import assert from 'node:assert/strict';
import test from 'node:test';
import { subjects } from '../src/lib/syllabus';
import { assembleDiagnostic, assembleSubjectMock, scoreAttemptByTopic } from '../src/lib/quiz';
import type { Question } from '../src/lib/types';

const sampleQuestions: Question[] = subjects.flatMap((subject) => Array.from({ length: 3 }, (_, index) => ({
  id: `fixture-${subject.id}-${index}`,
  subjectId: subject.id,
  topicId: subject.topics[index].id,
  stem: `Synthetic ${subject.id} question ${index}`,
  options: ['One', 'Two', 'Three', 'Four'],
  answer: 0,
  explanation: 'Synthetic test fixture',
  origin: 'personal' as const,
})));

test('diagnostic draws across six subjects without repeating a question', () => {
  const result = assembleDiagnostic(sampleQuestions, 12, () => 0.25);
  assert.equal(result.complete, true);
  assert.equal(result.method, 'subject-balanced');
  assert.equal(new Set(result.questions.map((question) => question.id)).size, 12);
  for (const subject of subjects) assert.ok(result.questions.some((question) => question.subjectId === subject.id));
});

test('mock reports sparse coverage instead of claiming a representative exam', () => {
  const result = assembleSubjectMock(sampleQuestions, 'far', 70, () => 0.5);
  assert.equal(result.questions.length, 3);
  assert.equal(result.complete, false);
  assert.equal(result.method, 'official-tos-weights');
  assert.match(result.limitation ?? '', /Only 3 of 70/);
  assert.match(result.limitation ?? '', /official TOS groups/);
  assert.equal(result.difficultyBreakdown.untagged, 3);
  assert.match(result.difficultyLimitation ?? '', /not yet representative/);
});

test('mock attempts target a 30/40/30 difficulty mix when tagged questions permit it', () => {
  const levels: NonNullable<Question['difficulty']>[] = [
    'easy', 'easy', 'easy', 'moderate', 'moderate', 'moderate', 'moderate', 'difficult', 'difficult', 'difficult',
  ];
  const pool = levels.map((difficulty, index): Question => ({
    ...sampleQuestions[0],
    id: `tagged-${index}`,
    difficulty,
  }));
  const result = assembleSubjectMock(pool, 'far', 10, () => 0.999);
  assert.deepEqual(result.difficultyTarget, { easy: 3, moderate: 4, difficult: 3 });
  assert.deepEqual(result.difficultyBreakdown, { easy: 3, moderate: 4, difficult: 3, untagged: 0 });
  assert.equal(result.difficultyLimitation, null);
  assert.equal(result.complete, false); // A single syllabus group is still inadequate for a subject mock.
});

test('topic scoring counts wrong and unanswered items for targeted review', () => {
  const selected = [sampleQuestions[0], { ...sampleQuestions[1], topicId: sampleQuestions[0].topicId, id: 'fixture-same-topic-2' }, { ...sampleQuestions[2], topicId: sampleQuestions[0].topicId, id: 'fixture-same-topic-3' }];
  const result = scoreAttemptByTopic(selected, { [selected[0].id]: selected[0].answer, [selected[1].id]: 9 });
  assert.deepEqual(result, { [selected[0].topicId]: { correct: 1, total: 3 } });
});
