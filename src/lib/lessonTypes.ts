import type { SubjectId } from './types';

export type LessonSource = {
  title: string;
  url: string;
  checkedOn: string;
};

export type StudyLesson = {
  id: string;
  subjectId: SubjectId;
  title: string;
  topicIds: string[];
  learningGoals: string[];
  keyPoints: string[];
  workedExample: { scenario: string; steps: string[]; takeaway: string };
  commonMistake: string;
  practicePrompt: string;
  sources: LessonSource[];
  applicabilityNote: string;
  status: 'draft' | 'published';
  reviewedAt: string | null;
};

/** Supabase row shape. RLS controls which rows a user can receive. */
export type StudyLessonRow = {
  id: string;
  subject_id: SubjectId;
  title: string;
  topic_ids: string[];
  learning_goals: string[];
  key_points: string[];
  worked_example: StudyLesson['workedExample'];
  common_mistake: string;
  practice_prompt: string;
  sources: LessonSource[];
  applicability_note: string;
  status: StudyLesson['status'];
  reviewed_at: string | null;
  reviewed_by?: string | null;
};

export function lessonFromRow(row: StudyLessonRow): StudyLesson {
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    topicIds: row.topic_ids,
    learningGoals: row.learning_goals,
    keyPoints: row.key_points,
    workedExample: row.worked_example,
    commonMistake: row.common_mistake,
    practicePrompt: row.practice_prompt,
    sources: row.sources,
    applicabilityNote: row.applicability_note,
    status: row.status,
    reviewedAt: row.reviewed_at,
  };
}
