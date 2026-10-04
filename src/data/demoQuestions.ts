import type { Question } from '@/lib/types';

// Local preview examples only. They are never included in the published shared bank.
export const demoQuestions: Question[] = [
  {
    id: 'demo-far-1', topicId: 'far-001', subjectId: 'far', origin: 'starter',
    stem: 'In a standard-setting discussion, which body issues IFRS Accounting Standards?',
    options: ['IASB', 'IFRIC', 'PIC', 'FRSC'], answer: 0,
    explanation: 'The IASB issues IFRS Accounting Standards. Verify the current institutional roles in the linked source before publication.',
    source: 'Illustrative draft for local preview only',
  },
  {
    id: 'demo-far-2', topicId: 'far-001', subjectId: 'far', origin: 'starter',
    stem: 'What is the main purpose of an interpretation committee in financial reporting?',
    options: ['Set national tax rates', 'Clarify application of standards', 'Audit every company', 'Register accountants'], answer: 1,
    explanation: 'Interpretations address application questions for standards. This is a preview draft awaiting owner review.',
    source: 'Illustrative draft for local preview only',
  },
  {
    id: 'demo-far-3', topicId: 'far-001', subjectId: 'far', origin: 'starter',
    stem: 'Which activity best belongs in a review of standard-setting bodies?',
    options: ['Memorizing tax brackets only', 'Comparing their authority and functions', 'Calculating payroll withholding', 'Filing a corporate return'], answer: 1,
    explanation: 'This topic asks learners to explain the history, functions, and roles of the named bodies. This item is a preview draft.',
    source: 'Illustrative draft for local preview only',
  },
];
