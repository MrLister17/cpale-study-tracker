import { allTopics, findSubjectForTopic, subjects } from './syllabus';
import { topicExamShare, topicGroupExamShare } from './tosWeights';
import type { StudyState, StudyTask, TaskKind } from './types';

export function phDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${value.year}-${value.month}-${value.day}`;
}

export function addDays(day: string, count: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);
}

function validDay(day: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const parsed = new Date(`${day}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day;
}

function dayOfWeek(day: string): number {
  return new Date(`${day}T00:00:00Z`).getUTCDay();
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

type Pending = { id: string; topicId?: string; kind: TaskKind; minutes: number; due?: string; title: string };

export type PlanResult = {
  tasks: StudyTask[];
  totalMinutes: number;
  scheduledMinutes: number;
  unscheduled: number;
  capacityMinutes: number;
  coveragePercent: number;
  weightedCoveragePercent: number;
  remainingMinutes: number;
  shortfallMinutes: number;
};

export function orderedTopicsForPlan(ratings: StudyState['ratings'] = {}, needsReview: StudyState['needsReview'] = {}, lessonTopicIds: ReadonlySet<string> = new Set()) {
  const rank = { new: 0, developing: 1, confident: 2 };
  const priority = (id: string) => needsReview[id] ? -1 : rank[ratings[id] ?? 'new'];
  const ordered: typeof allTopics = [];
  for (const level of [-1, 0, 1, 2]) {
    const bySubject = subjects.map((subject) => subject.topics
      .filter((topic) => priority(topic.id) === level)
      .sort((a, b) => Number(lessonTopicIds.has(b.id)) - Number(lessonTopicIds.has(a.id)) ||
        topicGroupExamShare(b.id) - topicGroupExamShare(a.id) ||
        a.page - b.page || a.id.localeCompare(b.id)));
    for (let index = 0; bySubject.some((topics) => index < topics.length); index++) {
      for (const topics of bySubject) if (topics[index]) ordered.push(topics[index]);
    }
  }
  return ordered;
}

export function buildPlan(state: StudyState, today = phDate(), lessonTopicIds: ReadonlySet<string> = new Set()): PlanResult {
  const end = state.targetDate;
  const dateIsUsable = validDay(end) && validDay(today) && daysBetween(today, end) > 0;
  const completed = state.completed;
  const weakIds = Object.keys(state.needsReview ?? {}).filter((id) => allTopics.some((topic) => topic.id === id));
  const totalMinutes = allTopics.length * 120 + 3 * 60 + weakIds.length * 20;
  let finishedMinutes = 0;
  for (const topic of allTopics) {
    for (const id of [`study:${topic.id}`, `lecture:${topic.id}`, `quiz:${topic.id}`,
      `review1:${topic.id}`, `review7:${topic.id}`, `review21:${topic.id}`]) {
      if (completed[id]) finishedMinutes += 20;
    }
  }
  for (const id of weakIds) if (completed[`weak:${id}`]) finishedMinutes += 20;
  for (const number of [1, 2, 3]) if (completed[`mock:${number}`]) finishedMinutes += 60;
  const remainingMinutes = Math.max(0, totalMinutes - finishedMinutes);
  if (!dateIsUsable) {
    return { tasks: [], totalMinutes, scheduledMinutes: 0, unscheduled: allTopics.length,
      capacityMinutes: 0, coveragePercent: 0, weightedCoveragePercent: 0,
      remainingMinutes, shortfallMinutes: validDay(end) ? remainingMinutes : 0 };
  }

  const topics = orderedTopicsForPlan(state.ratings, state.needsReview, lessonTopicIds);
  const firstPass: Pending[] = [];
  for (const topic of topics) {
    firstPass.push(
      { id: `study:${topic.id}`, topicId: topic.id, kind: 'study', minutes: 20, title: topic.title },
      { id: `lecture:${topic.id}`, topicId: topic.id, kind: 'lecture', minutes: 20, title: `Review lecture: ${topic.title}` },
      { id: `quiz:${topic.id}`, topicId: topic.id, kind: 'quiz', minutes: 20, title: `Practice questions: ${topic.title}` },
    );
  }

  const reviewQueue: Pending[] = Object.entries(state.needsReview ?? {}).filter(([topicId]) => Boolean(allTopics.find((topic) => topic.id === topicId))).map(([topicId, due]) => ({
    id: `weak:${topicId}`, topicId, kind: 'review', minutes: 20, due,
    title: `Revisit missed question: ${allTopics.find((topic) => topic.id === topicId)?.title ?? topicId}`,
  }));
  // A completed quiz must retain its spaced reviews when the user replans on
  // another day or restores a backup. Reviews are anchored to the attempt day.
  for (const topic of allTopics) {
    const completedAt = completed[`quiz:${topic.id}`];
    if (!completedAt) continue;
    const attemptDate = /^\d{4}-\d{2}-\d{2}$/.test(completedAt) ? completedAt :
      Number.isNaN(Date.parse(completedAt)) ? today : phDate(new Date(completedAt));
    for (const offset of [1, 7, 21]) {
      const id = `review${offset}:${topic.id}`;
      if (!completed[id]) reviewQueue.push({
        id, topicId: topic.id, kind: 'review', minutes: 20,
        due: addDays(attemptDate, offset), title: `Recall and correct: ${topic.title}`,
      });
    }
  }
  const tasks: StudyTask[] = [];
  let capacityMinutes = 0;
  let pointer = 0;
  let scheduledMinutes = 0;
  let mockNumber = 0;
  const unavailable = new Set(state.unavailableDates);
  const finalWindowStart = addDays(end, -14);

  for (let day = today; day < end; day = addDays(day, 1)) {
    if (unavailable.has(day)) continue;
    const slots = state.slots.filter((slot) => slot.weekday === dayOfWeek(day))
      .map((slot) => ({ start: timeToMinutes(slot.start), end: timeToMinutes(slot.end) }))
      .filter((slot) => slot.end > slot.start).sort((a, b) => a.start - b.start)
      .reduce<{ start: number; end: number }[]>((merged, slot) => {
        const last = merged.at(-1);
        if (last && slot.start <= last.end) last.end = Math.max(last.end, slot.end);
        else merged.push({ ...slot });
        return merged;
      }, []);
    for (const slot of slots) {
      let cursor = slot.start;
      const limit = slot.end;
      const usable = Math.max(0, Math.floor((limit - cursor) * 0.85 / 5) * 5);
      const usableEnd = cursor + usable;
      capacityMinutes += usable;
      let guard = 0;
      while (usableEnd - cursor >= 20 && guard++ < 100) {
        let item: Pending | undefined;
        const dueIndex = reviewQueue.findIndex((review) => (review.due ?? day) <= day && !completed[review.id] && review.minutes <= usableEnd - cursor);
        if (dueIndex >= 0) item = reviewQueue.splice(dueIndex, 1)[0];
        while (!item && day >= finalWindowStart && mockNumber < 3 && usableEnd - cursor >= 60) {
          const id = `mock:${mockNumber + 1}`;
          mockNumber++;
          if (!completed[id]) item = { id, kind: 'mock', title: `Mixed mock quiz ${mockNumber}`, minutes: 60 };
        }
        while (!item && pointer < firstPass.length) {
          const candidate = firstPass[pointer];
          if (completed[candidate.id]) { pointer++; continue; }
          if (candidate.minutes > usableEnd - cursor) break;
          item = candidate;
          pointer++;
        }
        if (!item) break;
        const subject = item.topicId ? findSubjectForTopic(item.topicId) : undefined;
        tasks.push({
          id: item.id, topicId: item.topicId, subjectId: subject?.id,
          date: day, start: minutesToTime(cursor), end: minutesToTime(cursor + item.minutes),
          kind: item.kind, title: item.title, minutes: item.minutes,
        });
        cursor += item.minutes;
        scheduledMinutes += item.minutes;
        if (item.kind === 'quiz' && item.topicId) {
          for (const offset of [1, 7, 21]) {
            const id = `review${offset}:${item.topicId}`;
            if (!completed[id]) reviewQueue.push({
              id, topicId: item.topicId, kind: 'review', minutes: 20,
              due: addDays(day, offset), title: `Recall and correct: ${item.title.slice(20)}`,
            });
          }
        }
      }
    }
  }
  const scheduledTopics = new Set(tasks.filter((task) => task.kind === 'quiz').map((task) => task.topicId));
  const completedTopics = new Set(Object.keys(completed).filter((id) => id.startsWith('quiz:')).map((id) => id.slice(5)));
  const covered = new Set([...scheduledTopics, ...completedTopics]);
  const weightedCoverage = subjects.reduce((total, subject) => total +
    subject.topics.reduce((subjectTotal, topic) => subjectTotal +
      (covered.has(topic.id) ? topicExamShare(topic.id) : 0), 0), 0) / subjects.length;
  return {
    tasks, totalMinutes, scheduledMinutes,
    unscheduled: Math.max(0, allTopics.length - covered.size), capacityMinutes,
    coveragePercent: Math.round(covered.size / allTopics.length * 100),
    weightedCoveragePercent: Math.round(weightedCoverage * 100),
    remainingMinutes, shortfallMinutes: Math.max(0, remainingMinutes - scheduledMinutes),
  };
}
