import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPlan, orderedTopicsForPlan } from '../src/lib/planner';
import { EMPTY_STATE, type StudyState } from '../src/lib/types';
import { allTopics, subjects } from '../src/lib/syllabus';
import { topicGroupExamShare, subjectExamItems, tosGroups, unmappedTosGroups } from '../src/lib/tosWeights';

const state = (patch: Partial<StudyState>): StudyState => ({ ...EMPTY_STATE, ...patch });

test('no provisional date never creates an invented countdown plan', () => {
  const result = buildPlan(state({ targetDate: '' }), '2026-10-04');
  assert.equal(result.tasks.length, 0);
  assert.equal(result.unscheduled, allTopics.length);
  assert.equal(result.shortfallMinutes, 0);
});

test('malformed or impossible exam dates cannot create an unbounded plan', () => {
  for (const targetDate of ['invalid', '2027-02-30']) {
    const result = buildPlan(state({ targetDate }), '2026-10-06');
    assert.equal(result.tasks.length, 0);
    assert.equal(result.shortfallMinutes, 0);
  }
});

test('a 30 minute study window schedules a useful block', () => {
  const result = buildPlan(state({ targetDate: '2026-10-06', slots: [{ id: 'short', weekday: 1, start: '09:00', end: '09:30' }] }), '2026-10-05');
  assert.equal(result.tasks.length, 1);
  assert.equal(result.tasks[0].date, '2026-10-05');
  assert.equal(result.tasks[0].kind, 'study');
});

test('overlapping availability is counted only once', () => {
  const result = buildPlan(state({ targetDate: '2026-10-06', slots: [
    { id: 'a', weekday: 1, start: '09:00', end: '10:00' },
    { id: 'b', weekday: 1, start: '09:30', end: '10:30' },
  ] }), '2026-10-05');
  assert.equal(result.capacityMinutes, 75);
  const times = result.tasks.map((task) => `${task.start}-${task.end}`);
  assert.equal(new Set(times).size, times.length);
});

test('an unavailable date excludes all tasks', () => {
  const result = buildPlan(state({ targetDate: '2026-10-06', unavailableDates: ['2026-10-05'], slots: [{ id: 'a', weekday: 1, start: '09:00', end: '11:00' }] }), '2026-10-05');
  assert.equal(result.capacityMinutes, 0);
  assert.equal(result.tasks.length, 0);
});

test('missed work moves into the next available slot without duplicating completed work', () => {
  const base = state({ targetDate: '2026-10-20', slots: [{ id: 'a', weekday: 1, start: '09:00', end: '11:00' }] });
  const first = buildPlan(base, '2026-10-05');
  const finished = first.tasks[0].id;
  const later = buildPlan(state({ ...base, completed: { [finished]: '2026-10-05T01:00:00Z' } }), '2026-10-12');
  assert.ok(!later.tasks.some((task) => task.id === finished));
  assert.ok(later.tasks.some((task) => task.id === first.tasks[1].id));
});

test('missed question creates a review task', () => {
  const topic = allTopics[0];
  const result = buildPlan(state({ targetDate: '2026-10-06', needsReview: { [topic.id]: '2026-10-05' }, slots: [{ id: 'a', weekday: 1, start: '09:00', end: '11:00' }] }), '2026-10-05');
  assert.ok(result.tasks.some((task) => task.id === `weak:${topic.id}`));
});

test('first pass visits all six subjects before repeating one', () => {
  const firstSix = orderedTopicsForPlan().slice(0, 6).map((topic) => topic.id.split('-')[0]);
  assert.deepEqual(new Set(firstSix), new Set(['far', 'afar', 'mas', 'aud', 'rfbt', 'tax']));
});

test('a standard weekly schedule reaches all six subjects within one month', () => {
  const plan = buildPlan(state({ targetDate: '2027-05-15' }), '2026-10-05');
  const octoberSubjects = new Set(plan.tasks.filter((task) => task.date.startsWith('2026-10')).map((task) => task.subjectId).filter(Boolean));
  assert.deepEqual(octoberSubjects, new Set(['far', 'afar', 'mas', 'aud', 'rfbt', 'tax']));
});

test('official TOS item allocations cover all six subjects and mapped sections', () => {
  for (const subject of subjects) {
    const groupItems = tosGroups.filter((group) => group.subjectId === subject.id)
      .reduce((sum, group) => sum + group.items, 0);
    assert.equal(groupItems, subjectExamItems(subject.id));
  }
  assert.deepEqual(unmappedTosGroups, []);
  assert.ok(topicGroupExamShare('afar-060') > 0);
  assert.ok(topicGroupExamShare('far-018') > topicGroupExamShare('far-001'));
});

test('higher-weight TOS sections lead within each subject while all six still appear first', () => {
  const ordered = orderedTopicsForPlan();
  assert.deepEqual(new Set(ordered.slice(0, 6).map((topic) => topic.id.split('-')[0])),
    new Set(['far', 'afar', 'mas', 'aud', 'rfbt', 'tax']));
  assert.equal(ordered[0].section, 'Non-financial Assets');
  assert.equal(ordered[2].section, 'Management Accounting');
});

test('weak diagnostic topics lead their subject and an insufficient schedule reports the minute shortfall', () => {
  const ordered = orderedTopicsForPlan({ 'far-001': 'confident' }, { 'far-001': '2026-10-06' });
  assert.equal(ordered[0].id, 'far-001');
  const plan = buildPlan(state({ targetDate: '2026-10-07', slots: [
    { id: 'short', weekday: 2, start: '09:00', end: '09:30' },
  ] }), '2026-10-06');
  assert.ok(plan.shortfallMinutes > 0);
  assert.equal(plan.shortfallMinutes, plan.remainingMinutes - plan.scheduledMinutes);
  assert.ok(plan.weightedCoveragePercent >= 0);
});

test('completed quizzes retain spaced review tasks after future replanning', () => {
  const plan = buildPlan(state({ targetDate: '2026-10-30', completed: {
    'quiz:far-001': '2026-10-05T02:00:00Z',
    'review1:far-001': '2026-10-06T02:00:00Z',
  }, slots: [{ id: 'tue', weekday: 2, start: '09:00', end: '11:00' }] }), '2026-10-06');
  assert.ok(plan.tasks.some((task) => task.id === 'review7:far-001' && task.date >= '2026-10-12'));
  assert.ok(!plan.tasks.some((task) => task.id === 'review1:far-001'));
});
