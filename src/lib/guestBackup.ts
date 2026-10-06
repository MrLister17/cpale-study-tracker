import { z } from 'zod';
import { findSubjectForTopic, topicById } from './syllabus';
import { personalStudyPackSchema } from './studyPack';
import type { StudyState } from './types';

const topicId = z.string().refine((id) => Boolean(topicById[id]), 'Unknown syllabus topic');
const question = z.object({
  id: z.string().min(1), topicId, subjectId: z.enum(['far', 'afar', 'mas', 'aud', 'rfbt', 'tax']),
  stem: z.string(), options: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  answer: z.number().int().min(0).max(3), explanation: z.string(), source: z.string().optional(),
  reviewedAt: z.string().optional(), difficulty: z.enum(['easy', 'moderate', 'difficult']).optional(),
  cognitiveLevel: z.enum(['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating']).optional(), origin: z.literal('personal'),
}).refine((item) => findSubjectForTopic(item.topicId).id === item.subjectId, 'Question subject and topic do not match');

const stateSchema = z.object({
  version: z.literal(1), name: z.string(), examCycleId: z.string(), targetDate: z.string(),
  targetDateStatus: z.enum(['provisional', 'confirmed']),
  slots: z.array(z.object({ id: z.string(), weekday: z.number().int().min(0).max(6), start: z.string(), end: z.string() })).max(100),
  unavailableDates: z.array(z.string()).max(1000),
  ratings: z.record(z.enum(['new', 'developing', 'confident'])),
  actualMinutes: z.record(topicId, z.number().int().min(0).max(100000)).optional(),
  completed: z.record(z.string()), needsReview: z.record(z.string()),
  personalQuestions: z.array(question).max(10000),
  importedLessons: personalStudyPackSchema.shape.lessons.optional(),
  importedQuestions: personalStudyPackSchema.shape.questions.optional(),
  attempts: z.array(z.object({ id: z.string(), at: z.string(), questionIds: z.array(z.string()), responses: z.record(z.number().int().min(0).max(3)), score: z.number().int().min(0), durationSeconds: z.number().min(0), topicResults: z.record(topicId, z.object({ correct: z.number().int().min(0), total: z.number().int().min(0) })).optional(), reviewed: z.boolean().optional(), mode: z.enum(['practice', 'diagnostic', 'mock']).optional() })).max(10000),
  mistakes: z.array(z.object({ id: z.string(), questionId: z.string(), topicId, at: z.string(), whyWrong: z.string(), correctedPrinciple: z.string(), nextReviewOn: z.string(), resolvedAt: z.string().optional(), reviewCount: z.number().int().min(0).optional() })).max(10000).optional(),
  materials: z.array(z.object({ id: z.string(), topicId, title: z.string(), url: z.string().optional(), notes: z.string().optional() })).max(10000),
  savedAt: z.string().optional(),
});

const backupSchema = z.object({ format: z.literal('cpale-guest-backup'), exportedAt: z.string(), state: stateSchema });

export function createGuestBackup(state: StudyState, exportedAt = new Date().toISOString()): string {
  const portableState = { ...state, materials: state.materials.map(({ id, topicId, title, url, notes }) => ({ id, topicId, title, url, notes })) };
  return JSON.stringify({ format: 'cpale-guest-backup', exportedAt, state: portableState }, null, 2);
}

export function parseGuestBackup(text: string): StudyState {
  const parsed = backupSchema.safeParse(JSON.parse(text));
  if (!parsed.success) throw new Error('This is not a valid CPALE Study Tracker guest backup.');
  return parsed.data.state;
}
