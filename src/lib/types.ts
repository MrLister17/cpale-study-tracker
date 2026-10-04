export type SubjectId = 'far' | 'afar' | 'mas' | 'aud' | 'rfbt' | 'tax';

export type Topic = {
  id: string;
  code: string;
  title: string;
  section: string;
  page: number;
  status: 'needs_editorial_review' | 'approved';
};

export type Subject = {
  id: SubjectId;
  name: string;
  short: string;
  color: string;
  pale: string;
  flower: string;
  source: string;
  sourceUrl: string;
  topics: Topic[];
};

export type WeeklySlot = { id: string; weekday: number; start: string; end: string };
export type Rating = 'new' | 'developing' | 'confident';
export type ExamCycle = { id: string; label: string; starts_on: string | null; ends_on: string | null; status: 'provisional' | 'confirmed'; source_url: string | null };
export type TaskKind = 'study' | 'lecture' | 'quiz' | 'review' | 'mock';
export type StudyTask = {
  id: string;
  topicId?: string;
  subjectId?: SubjectId;
  date: string;
  start: string;
  end: string;
  kind: TaskKind;
  title: string;
  minutes: number;
};

export type Question = {
  id: string;
  topicId: string;
  subjectId: SubjectId;
  stem: string;
  options: [string, string, string, string];
  answer: number;
  explanation: string;
  source?: string;
  reviewedAt?: string;
  origin: 'personal' | 'starter';
};

export type QuizAttempt = {
  id: string;
  at: string;
  questionIds: string[];
  responses: Record<string, number>;
  score: number;
  durationSeconds: number;
};

export type Material = {
  id: string;
  topicId: string;
  title: string;
  url?: string;
  notes?: string;
  fileName?: string;
  storagePath?: string;
  bytes?: number;
};

export type StudyState = {
  version: 1;
  name: string;
  examCycleId: string;
  targetDate: string;
  targetDateStatus: 'provisional' | 'confirmed';
  slots: WeeklySlot[];
  unavailableDates: string[];
  ratings: Record<string, Rating>;
  completed: Record<string, string>;
  needsReview: Record<string, string>;
  personalQuestions: Question[];
  attempts: QuizAttempt[];
  materials: Material[];
  savedAt?: string;
};

export const EMPTY_STATE: StudyState = {
  version: 1,
  name: '',
  examCycleId: '2027-may',
  targetDate: '',
  targetDateStatus: 'provisional',
  slots: [
    { id: 'monday', weekday: 1, start: '19:00', end: '21:00' },
    { id: 'wednesday', weekday: 3, start: '19:00', end: '21:00' },
    { id: 'saturday', weekday: 6, start: '09:00', end: '12:00' },
  ],
  unavailableDates: [],
  ratings: {},
  completed: {},
  needsReview: {},
  personalQuestions: [],
  attempts: [],
  materials: [],
};
