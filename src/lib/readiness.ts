import { subjects } from './syllabus';
import { topicExamShare, topicGroupExamShare, tosGroups, unmappedTosGroups } from './tosWeights';
import type { Question, StudyState, SubjectId } from './types';

export type ReadinessSubject = {
  subjectId: SubjectId;
  label: string;
  evidencePercent: number;
  completedCoveragePercent: number;
  practiceCoveragePercent: number;
  assessedCoveragePercent: number;
  practiceAccuracyPercent: number | null;
  verifiedPracticeAccuracyPercent: number | null;
  unmappedItems: number;
};

export type ReadinessGap = {
  topicId: string;
  subjectId: SubjectId;
  title: string;
  section: string;
  sectionExamSharePercent: number;
  answeredQuestions: number;
  accuracyPercent: number | null;
  needsReview: boolean;
};

export type ReadinessResult = {
  /** Evidence from completed work and answered questions, not a predicted exam score. */
  evidencePercent: number;
  completedCoveragePercent: number;
  practiceCoveragePercent: number;
  /** Coverage with answers from owner-reviewed starter questions only. */
  assessedCoveragePercent: number;
  practiceAccuracyPercent: number | null;
  verifiedPracticeAccuracyPercent: number | null;
  completedTopicCount: number;
  practicedTopicCount: number;
  assessedTopicCount: number;
  unmappedTosItems: number;
  bySubject: ReadinessSubject[];
  priorityGaps: ReadinessGap[];
};

type TopicResult = { answered: number; correct: number };
type ScoredAttempt = StudyState['attempts'][number] & {
  topicResults?: Record<string, { correct: number; total: number }>;
  reviewed?: boolean;
};

/** Use the latest result in each topic. Persisted topic results survive a bank
 * edit or deletion; older backups fall back to the available question bank.
 * Only an explicit reviewed flag is accepted as verified exam preparation.
 */
export function latestTopicResults(state: StudyState, questions: Question[]): {
  practice: Map<string, TopicResult>;
  verified: Map<string, TopicResult>;
} {
  const byId = new Map(questions.map((question) => [question.id, question]));
  const practice = new Map<string, TopicResult>();
  const verified = new Map<string, TopicResult>();
  const attempts = [...state.attempts].sort((a, b) => a.at.localeCompare(b.at)) as ScoredAttempt[];
  for (const attempt of attempts) {
    const grouped = new Map<string, TopicResult>();
    if (attempt.topicResults) {
      for (const [topicId, result] of Object.entries(attempt.topicResults)) {
        if (!Number.isInteger(result.total) || result.total <= 0 ||
            !Number.isInteger(result.correct) || result.correct < 0 || result.correct > result.total) continue;
        grouped.set(topicId, { answered: result.total, correct: result.correct });
      }
    } else {
      for (const id of attempt.questionIds) {
        const question = byId.get(id);
        if (!question) continue;
        const current = grouped.get(question.topicId) ?? { answered: 0, correct: 0 };
        current.answered++;
        if (attempt.responses[id] === question.answer) current.correct++;
        grouped.set(question.topicId, current);
      }
    }
    for (const [topicId, result] of grouped) {
      practice.set(topicId, result);
      if (attempt.reviewed === true) verified.set(topicId, result);
    }
  }
  return { practice, verified };
}

function percent(fraction: number): number {
  return Math.round(fraction * 100);
}

export function buildReadiness(state: StudyState, questions: Question[] = []): ReadinessResult {
  const results = latestTopicResults(state, questions);

  const bySubject: ReadinessSubject[] = [];
  const gaps: Array<ReadinessGap & { priority: number }> = [];
  let completedTopicCount = 0;
  let practicedTopicCount = 0;
  let assessedTopicCount = 0;
  let totalCorrect = 0;
  let totalAnswered = 0;
  let verifiedCorrect = 0;
  let verifiedAnswered = 0;
  let overallEvidence = 0;
  let overallCompletedCoverage = 0;
  let overallPracticeCoverage = 0;
  let overallAssessedCoverage = 0;
  for (const subject of subjects) {
    let evidence = 0;
    let completedCoverage = 0;
    let practiceCoverage = 0;
    let assessedCoverage = 0;
    let subjectCorrect = 0;
    let subjectAnswered = 0;
    let subjectVerifiedCorrect = 0;
    let subjectVerifiedAnswered = 0;
    for (const topic of subject.topics) {
      const share = topicExamShare(topic.id);
      const study = Boolean(state.completed[`study:${topic.id}`]);
      const lecture = Boolean(state.completed[`lecture:${topic.id}`]);
      const practiceResult = results.practice.get(topic.id);
      const verifiedResult = results.verified.get(topic.id);
      const practiced = Boolean(practiceResult?.answered);
      const assessed = Boolean(verifiedResult?.answered);
      const practice = Boolean(state.completed[`quiz:${topic.id}`]) || practiced;
      const accuracy = practiced ? practiceResult!.correct / practiceResult!.answered : null;
      const verifiedAccuracy = assessed ? verifiedResult!.correct / verifiedResult!.answered : null;
      const needsReview = Boolean(state.needsReview[topic.id]) || (accuracy !== null && accuracy < 0.7);
      // Showing up counts, but cannot supply a full readiness signal without
      // answering questions. Self-rated confidence and time logged are omitted.
      const topicEvidence = (study ? 0.2 : 0) + (lecture ? 0.2 : 0) +
        (assessed ? 0.2 : 0) + (verifiedAccuracy === null ? 0 : 0.4 * verifiedAccuracy);
      evidence += share * topicEvidence;
      if (study && lecture && practice) {
        completedCoverage += share;
        completedTopicCount++;
      }
      if (practiced) {
        practiceCoverage += share;
        practicedTopicCount++;
        subjectAnswered += practiceResult!.answered;
        subjectCorrect += practiceResult!.correct;
      }
      if (assessed) {
        assessedCoverage += share;
        assessedTopicCount++;
        subjectVerifiedAnswered += verifiedResult!.answered;
        subjectVerifiedCorrect += verifiedResult!.correct;
      }
      const priority = share * (1 - topicEvidence + (needsReview ? 0.75 : 0));
      if (priority > 0) gaps.push({
        topicId: topic.id, subjectId: subject.id, title: topic.title,
        section: topic.section,
        sectionExamSharePercent: percent(topicGroupExamShare(topic.id)),
        answeredQuestions: practiceResult?.answered ?? 0,
        accuracyPercent: accuracy === null ? null : percent(accuracy),
        needsReview, priority,
      });
    }
    totalAnswered += subjectAnswered;
    totalCorrect += subjectCorrect;
    verifiedAnswered += subjectVerifiedAnswered;
    verifiedCorrect += subjectVerifiedCorrect;
    overallEvidence += evidence;
    overallCompletedCoverage += completedCoverage;
    overallPracticeCoverage += practiceCoverage;
    overallAssessedCoverage += assessedCoverage;
    bySubject.push({
      subjectId: subject.id, label: subject.name,
      evidencePercent: percent(evidence),
      completedCoveragePercent: percent(completedCoverage),
      practiceCoveragePercent: percent(practiceCoverage),
      assessedCoveragePercent: percent(assessedCoverage),
      practiceAccuracyPercent: subjectAnswered ? percent(subjectCorrect / subjectAnswered) : null,
      verifiedPracticeAccuracyPercent: subjectVerifiedAnswered ?
        percent(subjectVerifiedCorrect / subjectVerifiedAnswered) : null,
      unmappedItems: unmappedTosGroups.filter((group) => group.subjectId === subject.id)
        .reduce((sum, group) => sum + group.items, 0),
    });
  }

  return {
    evidencePercent: Math.round(overallEvidence / subjects.length * 1000) / 10,
    completedCoveragePercent: Math.round(overallCompletedCoverage / subjects.length * 1000) / 10,
    practiceCoveragePercent: Math.round(overallPracticeCoverage / subjects.length * 1000) / 10,
    assessedCoveragePercent: Math.round(overallAssessedCoverage / subjects.length * 1000) / 10,
    practiceAccuracyPercent: totalAnswered ? percent(totalCorrect / totalAnswered) : null,
    verifiedPracticeAccuracyPercent: verifiedAnswered ? percent(verifiedCorrect / verifiedAnswered) : null,
    completedTopicCount, practicedTopicCount, assessedTopicCount,
    unmappedTosItems: unmappedTosGroups.reduce((sum, group) => sum + group.items, 0),
    bySubject,
    priorityGaps: gaps.sort((a, b) => b.priority - a.priority || a.topicId.localeCompare(b.topicId))
      .slice(0, 12).map((gap) => ({
        topicId: gap.topicId, subjectId: gap.subjectId, title: gap.title,
        section: gap.section, sectionExamSharePercent: gap.sectionExamSharePercent,
        answeredQuestions: gap.answeredQuestions, accuracyPercent: gap.accuracyPercent,
        needsReview: gap.needsReview,
      })),
  };
}

/** Human-readable source section for a topic and its TOS allocation. */
export function tosSectionForTopic(topicId: string): { label: string; items: number; sourcePage: number } | null {
  const group = tosGroups.find((candidate) => candidate.topicIds.includes(topicId));
  return group ? { label: group.label, items: group.items, sourcePage: group.sourcePage } : null;
}
