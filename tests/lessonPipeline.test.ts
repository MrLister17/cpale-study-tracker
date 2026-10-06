import assert from 'node:assert/strict';
import test from 'node:test';
import { lessonFromRow, type StudyLessonRow } from '../src/lib/lessonTypes';
import { subjects } from '../src/lib/syllabus';

test('the reader preserves structured published lesson fields', () => {
  const row: StudyLessonRow = {
    id: 'fixture', subject_id: 'mas', title: 'Break-even reasoning', topic_ids: ['mas-003'],
    learning_goals: ['Explain contribution', 'Find break-even units'],
    key_points: ['Price less variable cost gives contribution.', 'Fixed cost divided by contribution gives break-even units.'],
    worked_example: { scenario: 'A product sells at a known price.', steps: ['Calculate contribution.', 'Divide fixed cost.'], takeaway: 'Check units.' },
    common_mistake: 'Using selling price as contribution', practice_prompt: 'Change variable cost and recalculate.',
    sources: [{ title: 'PRC TOS', url: 'https://www.prc.gov.ph/example.pdf', checkedOn: '2026-10-06' }],
    applicability_note: 'Verify assumptions.', status: 'published', reviewed_at: '2026-10-06T00:00:00Z',
  };
  const lesson = lessonFromRow(row);
  assert.deepEqual(lesson.topicIds, row.topic_ids);
  assert.deepEqual(lesson.workedExample, row.worked_example);
  assert.deepEqual(lesson.sources, row.sources);
  assert.equal(lesson.reviewedAt, row.reviewed_at);
});

test('AFAR foreign currency and TAX local taxation outcomes follow the source PDF', () => {
  const afar = subjects.find((subject) => subject.id === 'afar');
  const tax = subjects.find((subject) => subject.id === 'tax');
  assert.ok(afar && tax);
  assert.equal(afar.topics.length, 62);
  for (const id of ['afar-060', 'afar-061', 'afar-062']) {
    assert.match(afar.topics.find((topic) => topic.id === id)?.section ?? '', /Foreign Currency/);
  }
  for (let index = 76; index <= 81; index += 1) {
    assert.match(tax.topics.find((topic) => topic.id === `tax-${String(index).padStart(3, '0')}`)?.section ?? '', /LOCAL GOVERNMENT CODE/);
  }
});
