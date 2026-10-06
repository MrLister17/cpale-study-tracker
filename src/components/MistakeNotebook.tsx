'use client';

import { useMemo, useState } from 'react';
import { BookOpen, CalendarClock, RotateCcw, Trash2 } from 'lucide-react';
import { dueMistakes, resolveMistake, reviewMistake, type MistakeEntry } from '@/lib/mistakes';
import { phDate } from '@/lib/planner';
import { topicById } from '@/lib/syllabus';
import type { Question } from '@/lib/types';
import styles from './MistakeNotebook.module.css';

type Props = {
  entries: MistakeEntry[];
  questions: Question[];
  onSave: (entry: MistakeEntry) => void;
  onRemove: (id: string) => void;
  onRetry: (questions: Question[]) => void;
  today?: string;
};

export function MistakeNotebook({ entries, questions, onSave, onRemove, onRetry, today = phDate() }: Props) {
  const [topicFilter, setTopicFilter] = useState('all');
  const [dueOnly, setDueOnly] = useState(false);
  const [includeLearned, setIncludeLearned] = useState(false);
  const byQuestion = useMemo(() => new Map(questions.map((question) => [question.id, question])), [questions]);
  const dueIds = useMemo(() => new Set(dueMistakes(entries, today).map((entry) => entry.id)), [entries, today]);
  const topics = useMemo(() => [...new Set(entries.map((entry) => entry.topicId))].sort((a, b) =>
    (topicById[a]?.title ?? a).localeCompare(topicById[b]?.title ?? b)), [entries]);
  const visible = entries.filter((entry) => (topicFilter === 'all' || entry.topicId === topicFilter)
    && (!dueOnly || dueIds.has(entry.id)) && (includeLearned || !entry.resolvedAt))
    .sort((a, b) => Number(dueIds.has(b.id)) - Number(dueIds.has(a.id))
      || a.nextReviewOn.localeCompare(b.nextReviewOn));
  const retryable = topicFilter === 'all' ? [] : visible.map((entry) => byQuestion.get(entry.questionId))
    .filter((question): question is Question => Boolean(question));

  return <section className={`card ${styles.notebook}`} aria-label="Mistake notebook">
    <div className={styles.heading}><div><span className="eyebrow">LEARN FROM EVERY ATTEMPT</span><h2>Mistake notebook</h2><p>Write down the idea you missed, then revisit it on its review date.</p></div><div className={styles.dueCount}><CalendarClock size={18} aria-hidden="true" /><strong>{dueIds.size}</strong><span>due today</span></div></div>
    <div className={styles.controls}>
      <label>Topic<select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)}><option value="all">All topics</option>{topics.map((topicId) => <option key={topicId} value={topicId}>{topicById[topicId]?.title ?? topicId}</option>)}</select></label>
      <label className={styles.check}><input type="checkbox" checked={dueOnly} onChange={(event) => setDueOnly(event.target.checked)} /> Due for review</label>
      <label className={styles.check}><input type="checkbox" checked={includeLearned} onChange={(event) => setIncludeLearned(event.target.checked)} /> Show learned</label>
      {topicFilter !== 'all' && <button type="button" className="button outline small" disabled={!retryable.length} onClick={() => onRetry(retryable)}><RotateCcw size={15} aria-hidden="true" /> Retry this topic ({retryable.length})</button>}
    </div>
    {visible.length ? <div className={styles.entries}>{visible.map((entry) => <MistakeEditor key={entry.id} entry={entry} question={byQuestion.get(entry.questionId)} today={today} due={dueIds.has(entry.id)} onSave={onSave} onRemove={onRemove} onRetry={onRetry} />)}</div>
      : <div className={styles.empty}><BookOpen size={25} aria-hidden="true" /><p>{entries.length ? 'No notes match these filters.' : 'Your missed quiz questions will appear here. Add a short note after each attempt.'}</p></div>}
  </section>;
}

function MistakeEditor({ entry, question, today, due, onSave, onRemove, onRetry }: {
  entry: MistakeEntry; question?: Question; today: string; due: boolean;
  onSave: Props['onSave']; onRemove: Props['onRemove']; onRetry: Props['onRetry'];
}) {
  const [whyWrong, setWhyWrong] = useState(entry.whyWrong);
  const [correctedPrinciple, setCorrectedPrinciple] = useState(entry.correctedPrinciple);
  const [nextReviewOn, setNextReviewOn] = useState(entry.nextReviewOn);
  const title = topicById[entry.topicId]?.title ?? entry.topicId;
  return <details className={styles.entry}>
    <summary><span><b>{title}</b><small>{question?.stem ?? 'Question no longer in your bank'}</small></span><em className={due ? styles.due : ''}>{entry.resolvedAt ? 'Learned' : due ? 'Review now' : `Review ${entry.nextReviewOn}`}</em></summary>
    <div className={styles.body}>
      {question && <div className={styles.answer}><b>Correct answer</b><p>{question.options[question.answer]}</p><small>{question.explanation}</small></div>}
      <label>Why did I miss it?<textarea rows={3} value={whyWrong} onChange={(event) => setWhyWrong(event.target.value)} placeholder="For example: I used the wrong recognition rule." /></label>
      <label>What is the correct idea?<textarea rows={3} value={correctedPrinciple} onChange={(event) => setCorrectedPrinciple(event.target.value)} placeholder="Write the rule or step in your own words." /></label>
      <label>Review again on<input type="date" value={nextReviewOn} onChange={(event) => setNextReviewOn(event.target.value)} /></label>
      <div className={styles.actions}>
        <button type="button" className="button primary small" disabled={!nextReviewOn} onClick={() => onSave({ ...entry, whyWrong: whyWrong.trim(), correctedPrinciple: correctedPrinciple.trim(), nextReviewOn })}>Save note</button>
        {!entry.resolvedAt && <><button type="button" className="button outline small" onClick={() => onSave(reviewMistake({ ...entry, whyWrong: whyWrong.trim(), correctedPrinciple: correctedPrinciple.trim() }, 'again', today))}>Still unsure</button><button type="button" className="button outline small" onClick={() => onSave(reviewMistake({ ...entry, whyWrong: whyWrong.trim(), correctedPrinciple: correctedPrinciple.trim() }, 'remembered', today))}>I remembered it</button><button type="button" className="button outline small" onClick={() => onSave(resolveMistake({ ...entry, whyWrong: whyWrong.trim(), correctedPrinciple: correctedPrinciple.trim() }, today))}>Mark learned</button></>}
        {entry.resolvedAt && <button type="button" className="button outline small" onClick={() => onSave({ ...entry, resolvedAt: undefined, nextReviewOn: today })}>Review again</button>}
        {question && <button type="button" className="button outline small" onClick={() => onRetry([question])}><RotateCcw size={14} aria-hidden="true" /> Retry question</button>}
        <button type="button" className={styles.remove} onClick={() => onRemove(entry.id)} aria-label={`Remove mistake note for ${title}`}><Trash2 size={16} aria-hidden="true" /></button>
      </div>
    </div>
  </details>;
}
