import { z } from 'zod';
import { findSubjectForTopic, topicById } from './syllabus';
import type { Question } from './types';
import type { StudyLesson } from './lessonTypes';

const subject = z.enum(['far', 'afar', 'mas', 'aud', 'rfbt', 'tax']);
const topic = z.string().refine((id) => Boolean(topicById[id]), 'Unknown syllabus outcome');
const httpsUrl = z.string().url().startsWith('https://');

const lesson = z.object({
  id: z.string().min(1), subjectId: subject, title: z.string().min(1),
  topicIds: z.array(topic).min(1).max(100), learningGoals: z.array(z.string()).min(1).max(20),
  keyPoints: z.array(z.string()).min(1).max(30),
  workedExample: z.object({ scenario: z.string().min(1), steps: z.array(z.string()).min(1).max(20), takeaway: z.string().min(1) }),
  commonMistake: z.string().min(1), practicePrompt: z.string().min(1),
  sources: z.array(z.object({ title: z.string().min(1), url: httpsUrl, checkedOn: z.string() })).min(1).max(20),
  applicabilityNote: z.string(), status: z.literal('draft'), reviewedAt: z.null(),
}).refine((item) => item.topicIds.every((id) => findSubjectForTopic(id).id === item.subjectId), 'Lesson topics must match the subject');

const question = z.object({
  id: z.string().min(1), subjectId: subject, topicId: topic, stem: z.string().min(1),
  options: z.tuple([z.string().min(1), z.string().min(1), z.string().min(1), z.string().min(1)]),
  answer: z.number().int().min(0).max(3), explanation: z.string().min(1),
  source: httpsUrl.optional(), reviewedAt: z.undefined().optional(),
  difficulty: z.enum(['easy', 'moderate', 'difficult']).optional(),
  cognitiveLevel: z.enum(['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating']).optional(),
  origin: z.literal('starter'),
}).refine((item) => findSubjectForTopic(item.topicId).id === item.subjectId, 'Question topic must match the subject');

export const personalStudyPackSchema = z.object({
  format: z.literal('cpale-personal-study-pack'), version: z.literal(1),
  createdAt: z.string(), lessons: z.array(lesson).max(1000), questions: z.array(question).max(5000),
});

export type PersonalStudyPack = { format: 'cpale-personal-study-pack'; version: 1; createdAt: string; lessons: StudyLesson[]; questions: Question[] };

export function parsePersonalStudyPack(text: string): PersonalStudyPack {
  const result = personalStudyPackSchema.safeParse(JSON.parse(text));
  if (!result.success) throw new Error('This is not a valid CPALE personal study pack.');
  return result.data as PersonalStudyPack;
}
