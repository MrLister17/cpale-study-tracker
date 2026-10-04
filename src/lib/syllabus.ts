import raw from '@/data/syllabus.json';
import type { Subject, SubjectId, Topic } from './types';

export const subjects = raw as Subject[];
export const allTopics = subjects.flatMap((subject) => subject.topics);
export const subjectById = Object.fromEntries(subjects.map((subject) => [subject.id, subject])) as Record<SubjectId, Subject>;
export const topicById = Object.fromEntries(allTopics.map((topic) => [topic.id, topic])) as Record<string, Topic>;

export function findSubjectForTopic(topicId: string): Subject {
  return subjects.find((subject) => subject.topics.some((topic) => topic.id === topicId)) ?? subjects[0];
}

export const sourceNotice = 'Topic labels were extracted from the PRC BOA Table of Specifications (effective October 2022). They await editorial review; current tax and legal rules must be checked before publishing notes or questions.';
