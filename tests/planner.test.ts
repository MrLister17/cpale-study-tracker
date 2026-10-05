import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPlan, orderedTopicsForPlan } from '../src/lib/planner';
import { EMPTY_STATE, type StudyState } from '../src/lib/types';
import { allTopics } from '../src/lib/syllabus';

const state = (patch: Partial<StudyState>): StudyState => ({ ...EMPTY_STATE, ...patch });

test('no provisional date never creates an invented countdown plan', () => {
  const result = buildPlan(state({ targetDate: '' }), '2026-10-04');
  assert.equal(result.tasks.length, 0);
  assert.equal(result.unscheduled, allTopics.length);
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
