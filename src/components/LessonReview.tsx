'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { lessonFromRow, type LessonSource, type StudyLesson, type StudyLessonRow } from '@/lib/lessonTypes';
import { allTopics, topicById } from '@/lib/syllabus';

const lines = (text: string) => text.split('\n').map((part) => part.trim()).filter(Boolean);
const editingLines = (text: string) => text.split('\n');
const sourcesText = (sources: LessonSource[]) => sources.map((source) => `${source.title} | ${source.url} | ${source.checkedOn}`).join('\n');
const parseSources = (text: string): LessonSource[] | null => {
  const values = lines(text).map((line) => line.split('|').map((part) => part.trim()));
  if (!values.length || values.some(([title, url, checkedOn]) => !title || !/^https:\/\//.test(url ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(checkedOn ?? ''))) return null;
  return values.map(([title, url, checkedOn]) => ({ title, url, checkedOn }));
};

export function LessonReview() {
  const supabase = useMemo(() => getSupabase(), []);
  const [lessons, setLessons] = useState<StudyLesson[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [draft, setDraft] = useState<StudyLesson | null>(null);
  const [sourceInput, setSourceInput] = useState('');
  const [approved, setApproved] = useState(false);
  const [topicStatus, setTopicStatus] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let live = true;
    void (async () => {
      const [lessonResult, topicResult] = await Promise.all([
        supabase.from('study_lessons').select('*').order('subject_id').order('title'),
        supabase.from('syllabus_topics').select('id,status'),
      ]);
      if (!live) return;
      if (lessonResult.error) setMessage(`Could not load lessons: ${lessonResult.error.message}`);
      const loaded = ((lessonResult.data ?? []) as StudyLessonRow[]).map(lessonFromRow);
      setLessons(loaded);
      setSelectedId((current) => current || loaded[0]?.id || '');
      setTopicStatus(Object.fromEntries((topicResult.data ?? []).map((item) => [item.id, item.status])));
    })();
    return () => { live = false; };
  }, [supabase]);

  useEffect(() => {
    const selected = lessons.find((item) => item.id === selectedId);
    const frame = requestAnimationFrame(() => { setDraft(selected ? { ...selected } : null); setSourceInput(selected ? sourcesText(selected.sources) : ''); setApproved(false); });
    return () => cancelAnimationFrame(frame);
  }, [lessons, selectedId]);

  const save = async (publish: boolean) => {
    if (!supabase || !draft) return;
    const sources = parseSources(sourceInput);
    if (!sources) return setMessage('Enter at least one source as Title | https://URL | YYYY-MM-DD, one per line.');
    const learningGoals = draft.learningGoals.map((item) => item.trim()).filter(Boolean);
    const keyPoints = draft.keyPoints.map((item) => item.trim()).filter(Boolean);
    const steps = draft.workedExample.steps.map((item) => item.trim()).filter(Boolean);
    if (learningGoals.length < 2 || keyPoints.length < 2 || steps.length < 2 || !draft.workedExample.scenario.trim() || !draft.workedExample.takeaway.trim() || !draft.commonMistake.trim() || !draft.practicePrompt.trim() || !draft.applicabilityNote.trim()) return setMessage('Complete the goals, key ideas, example, mistake, practice prompt, and applicability note.');
    if (publish && (!approved || draft.topicIds.some((id) => topicStatus[id] !== 'approved'))) return setMessage('Verify the content and approve every linked syllabus label before publishing.');
    setBusy(true);
    const { data: auth } = await supabase.auth.getUser();
    const changes = {
      title: draft.title.trim(), learning_goals: learningGoals, key_points: keyPoints,
      worked_example: { ...draft.workedExample, steps }, common_mistake: draft.commonMistake.trim(),
      practice_prompt: draft.practicePrompt.trim(), sources, applicability_note: draft.applicabilityNote.trim(),
      status: publish ? 'published' : 'draft', reviewed_at: publish ? new Date().toISOString() : null,
      reviewed_by: publish ? auth.user?.id ?? null : null,
    };
    const { data, error } = await supabase.from('study_lessons').update(changes).eq('id', draft.id).select('*').single();
    setBusy(false);
    if (error) return setMessage(error.message);
    const saved = lessonFromRow(data as StudyLessonRow);
    setLessons((items) => items.map((item) => item.id === saved.id ? saved : item));
    setMessage(publish ? 'Lesson published after owner review.' : 'Lesson saved as an owner-only draft.');
  };

  const linked = draft?.topicIds.map((id) => ({ id, title: topicById[id]?.title ?? id, approved: topicStatus[id] === 'approved' })) ?? [];
  const uncovered = allTopics.length - new Set(lessons.filter((item) => item.status === 'published').flatMap((item) => item.topicIds)).size;
  return <section className="lesson-review card"><div className="card-heading"><div><span className="eyebrow">OWNER LESSON REVIEW</span><h2>Worked study lessons</h2></div><span>{lessons.filter((item) => item.status === 'published').length}/{lessons.length} published</span></div>
    <p className="field-help">Drafts are visible only to the owner. {uncovered} syllabus outcomes still need a published worked lesson.</p>
    {!lessons.length ? <p>{message || 'No lesson drafts are loaded yet.'}</p> : <>
      <label>Choose a lesson<select value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{lessons.map((item) => <option key={item.id} value={item.id}>{item.subjectId.toUpperCase()} · {item.title} · {item.status}</option>)}</select></label>
      {draft && <div className="lesson-review-fields"><p><b>Linked outcomes:</b> {linked.map((item) => <span key={item.id} className={item.approved ? 'approved' : 'pending'}>{item.id} {item.approved ? '✓' : 'needs label review'} · {item.title}</span>)}</p>
        <label>Title<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
        <label>Learning goals · one per line<textarea rows={4} value={draft.learningGoals.join('\n')} onChange={(event) => setDraft({ ...draft, learningGoals: editingLines(event.target.value) })} /></label>
        <label>Key ideas · one per line<textarea rows={5} value={draft.keyPoints.join('\n')} onChange={(event) => setDraft({ ...draft, keyPoints: editingLines(event.target.value) })} /></label>
        <label>Example scenario<textarea rows={3} value={draft.workedExample.scenario} onChange={(event) => setDraft({ ...draft, workedExample: { ...draft.workedExample, scenario: event.target.value } })} /></label>
        <label>Example steps · one per line<textarea rows={5} value={draft.workedExample.steps.join('\n')} onChange={(event) => setDraft({ ...draft, workedExample: { ...draft.workedExample, steps: editingLines(event.target.value) } })} /></label>
        <label>Example takeaway<textarea rows={2} value={draft.workedExample.takeaway} onChange={(event) => setDraft({ ...draft, workedExample: { ...draft.workedExample, takeaway: event.target.value } })} /></label>
        <label>Common mistake<textarea rows={2} value={draft.commonMistake} onChange={(event) => setDraft({ ...draft, commonMistake: event.target.value })} /></label>
        <label>Practice prompt<textarea rows={2} value={draft.practicePrompt} onChange={(event) => setDraft({ ...draft, practicePrompt: event.target.value })} /></label>
        <label>Source · Title | https://URL | checked date<textarea rows={4} value={sourceInput} onChange={(event) => setSourceInput(event.target.value)} /></label>
        <label>Applicability note<textarea rows={2} value={draft.applicabilityNote} onChange={(event) => setDraft({ ...draft, applicabilityNote: event.target.value })} /></label>
        <label className="check-label"><input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} /> I checked the lesson, example, current sources, and linked syllabus outcomes.</label>
        <div className="review-buttons"><button className="button outline" disabled={busy} onClick={() => void save(false)}>Save owner-only draft</button><button className="button primary" disabled={busy || !approved} onClick={() => void save(true)}>Approve and publish lesson</button></div>
      </div>}
    </>}{message && <p role="status" className="review-status">{message}</p>}
  </section>;
}
