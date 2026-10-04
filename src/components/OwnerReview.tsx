'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase';
import { allTopics, subjects, topicById } from '@/lib/syllabus';

type Guide = { topic_id: string; summary: string; lecture_prompt: string; practice_prompt: string; source_url: string | null; status: 'draft' | 'published'; reviewed_at: string | null };
type DraftQuestion = { id: string; topic_id: string; stem: string; options: string[]; answer_index: number; explanation: string; source_url: string | null; status: 'draft' | 'published'; reviewed_at: string | null };
type Usage = { students: number; waitlist: number; storage_bytes: number; approved_topics: number; published_guides: number; published_questions: number };
type AccountRequest = { id: string; user_id: string; kind: 'export' | 'delete'; created_at: string };
const blank = (topicId: string): Guide => ({ topic_id: topicId, summary: '', lecture_prompt: '', practice_prompt: '', source_url: subjects.find((subject) => subject.topics.some((topic) => topic.id === topicId))?.sourceUrl ?? null, status: 'draft', reviewed_at: null });
const blankQuestion = (topicId: string): DraftQuestion => ({ id: crypto.randomUUID(), topic_id: topicId, stem: '', options: ['', '', '', ''], answer_index: 0, explanation: '', source_url: null, status: 'draft', reviewed_at: null });

export function OwnerReview() {
  const supabase = useMemo(() => getSupabase(), []);
  const [topicId, setTopicId] = useState(allTopics[0].id);
  const [guide, setGuide] = useState<Guide>(blank(allTopics[0].id));
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [editing, setEditing] = useState<DraftQuestion>(blankQuestion(allTopics[0].id));
  const [status, setStatus] = useState('');
  const [topicStatus, setTopicStatus] = useState<Record<string, string>>({});
  const [publishedCounts, setPublishedCounts] = useState<Record<string, number>>({});
  const [usage, setUsage] = useState<Usage | null>(null);
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const topic = topicById[topicId];

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void (async () => {
      const [topics, published, ownerUsage, pendingRequests] = await Promise.all([
        supabase.from('syllabus_topics').select('id,status'),
        supabase.from('starter_questions').select('topic_id').eq('status', 'published').limit(3000),
        supabase.rpc('owner_usage'),
        supabase.from('account_requests').select('id,user_id,kind,created_at').eq('status', 'pending').order('created_at'),
      ]);
      if (!active) return;
      setTopicStatus(Object.fromEntries((topics.data ?? []).map((item) => [item.id, item.status])));
      const counts: Record<string, number> = {};
      for (const item of published.data ?? []) counts[item.topic_id] = (counts[item.topic_id] ?? 0) + 1;
      setPublishedCounts(counts);
      if (ownerUsage.data) setUsage(ownerUsage.data as Usage);
      setRequests((pendingRequests.data ?? []) as AccountRequest[]);
    })();
    return () => { active = false; };
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    void (async () => {
      const [guideResult, questionResult] = await Promise.all([
        supabase.from('topic_guides').select('*').eq('topic_id', topicId).maybeSingle(),
        supabase.from('starter_questions').select('*').eq('topic_id', topicId).order('created_at'),
      ]);
      if (!active) return;
      setGuide((guideResult.data as Guide | null) ?? blank(topicId));
      setQuestions((questionResult.data ?? []) as DraftQuestion[]);
      setEditing(blankQuestion(topicId));
      setStatus(guideResult.error?.message ?? questionResult.error?.message ?? '');
    })();
    return () => { active = false; };
  }, [supabase, topicId]);

  const saveGuide = async (publish: boolean) => {
    if (!supabase) return;
    if (publish && (topicStatus[topicId] !== 'approved' || !guide.summary.trim() || !guide.lecture_prompt.trim() || !guide.practice_prompt.trim() || !guide.source_url?.trim())) {
      return setStatus('Approve the syllabus label and complete the note, lecture, practice, and source fields first.');
    }
    const next: Guide = { ...guide, status: publish ? 'published' : 'draft', reviewed_at: publish ? new Date().toISOString() : null };
    const { error } = await supabase.from('topic_guides').upsert(next);
    if (error) return setStatus(error.message);
    setGuide(next); setStatus(publish ? 'Guide published.' : 'Draft guide saved.');
  };
  const approveTopic = async () => {
    if (!supabase) return;
    const { error } = await supabase.from('syllabus_topics').update({ status: 'approved' }).eq('id', topicId);
    if (error) return setStatus(error.message);
    setTopicStatus((items) => ({ ...items, [topicId]: 'approved' })); setStatus('Syllabus label approved.');
  };
  const saveQuestion = async (publish: boolean) => {
    if (!supabase) return;
    if (!editing.stem.trim() || editing.options.length !== 4 || editing.options.some((option) => !option.trim()) || !editing.explanation.trim()) return setStatus('Complete the question, four options, and explanation.');
    if (publish && (topicStatus[topicId] !== 'approved' || !editing.source_url?.trim())) return setStatus('Approve the topic and add a source before publishing.');
    const next: DraftQuestion = { ...editing, topic_id: topicId, status: publish ? 'published' : 'draft', reviewed_at: publish ? new Date().toISOString() : null };
    const { error } = await supabase.from('starter_questions').upsert(next);
    if (error) return setStatus(error.message);
    setQuestions((items) => [...items.filter((item) => item.id !== next.id), next]);
    setEditing(blankQuestion(topicId));
    if (publish) setPublishedCounts((items) => ({ ...items, [topicId]: items[topicId] + 1 || 1 }));
    setStatus(publish ? 'Question published.' : 'Draft question saved.');
  };

  return <div className="owner-review card"><div className="card-heading"><div><span className="eyebrow">CONTENT REVIEW QUEUE</span><h2>Review each outcome</h2></div><span>{Object.values(topicStatus).filter((value) => value === 'approved').length} / {allTopics.length} labels approved</span></div>{usage && <div className="usage-row"><span><b>{usage.students}/10</b> students</span><span><b>{usage.waitlist}</b> waiting</span><span><b>{(usage.storage_bytes / 1024 / 1024).toFixed(1)}/850 MB</b> reserved storage</span><span><b>{usage.published_guides}/{allTopics.length}</b> guides</span><span><b>{usage.published_questions}/{allTopics.length * 3}</b> starter questions</span></div>}{requests.length > 0 && <div className="account-requests"><h3>Account requests requiring action</h3>{requests.map((item) => <p key={item.id}><b>{item.kind.toUpperCase()}</b> · User {item.user_id} · {new Date(item.created_at).toLocaleDateString('en-PH')} · Verify and process in Supabase before marking complete.</p>)}</div>}
    <label>Outcome<select value={topicId} onChange={(event) => setTopicId(event.target.value)}>{subjects.map((subject) => <optgroup key={subject.id} label={subject.name}>{subject.topics.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.title.slice(0, 85)} · {publishedCounts[item.id] ?? 0}/3 Q</option>)}</optgroup>)}</select></label>
    <div className="review-heading"><div><b>{topic.code} · {topic.title}</b><p>{topic.section} · PDF page {topic.page} · {topicStatus[topicId] === 'approved' ? 'Label approved' : 'Label needs review'}</p></div><button className="button outline" onClick={approveTopic} disabled={topicStatus[topicId] === 'approved'}>Approve label</button></div>
    <div className="review-columns"><section><h3>Concise guide</h3><label>Summary / key ideas<textarea rows={6} value={guide.summary} onChange={(event) => setGuide({ ...guide, summary: event.target.value })} /></label><label>Lecture review task<textarea rows={3} value={guide.lecture_prompt} onChange={(event) => setGuide({ ...guide, lecture_prompt: event.target.value })} /></label><label>Practice goal<textarea rows={3} value={guide.practice_prompt} onChange={(event) => setGuide({ ...guide, practice_prompt: event.target.value })} /></label><label>Source URL<input value={guide.source_url ?? ''} onChange={(event) => setGuide({ ...guide, source_url: event.target.value })} /></label><div className="review-buttons"><button className="button outline" onClick={() => void saveGuide(false)}>Save draft</button><button className="button primary" onClick={() => void saveGuide(true)}>Approve & publish guide</button></div></section>
    <section><h3>Shared starter questions · {publishedCounts[topicId] ?? 0}/3 approved</h3>{questions.map((item) => <button className="review-question" key={item.id} onClick={() => setEditing(item)}><b>{item.status === 'published' ? 'Published' : 'Draft'}</b> {item.stem}</button>)}<button className="text-link" onClick={() => setEditing(blankQuestion(topicId))}>Add another question</button><label>Question<textarea rows={3} value={editing.stem} onChange={(event) => setEditing({ ...editing, stem: event.target.value })} /></label>{editing.options.map((option, index) => <label key={index}>Option {String.fromCharCode(65 + index)}<input value={option} onChange={(event) => setEditing({ ...editing, options: editing.options.map((item, i) => i === index ? event.target.value : item) })} /></label>)}<label>Correct option<select value={editing.answer_index} onChange={(event) => setEditing({ ...editing, answer_index: Number(event.target.value) })}>{[0, 1, 2, 3].map((index) => <option key={index} value={index}>{String.fromCharCode(65 + index)}</option>)}</select></label><label>Explanation<textarea rows={3} value={editing.explanation} onChange={(event) => setEditing({ ...editing, explanation: event.target.value })} /></label><label>Source URL<input value={editing.source_url ?? ''} onChange={(event) => setEditing({ ...editing, source_url: event.target.value })} /></label><div className="review-buttons"><button className="button outline" onClick={() => void saveQuestion(false)}>Save draft</button><button className="button primary" onClick={() => void saveQuestion(true)}>Approve & publish question</button></div></section></div>{status && <p role="status" className="review-status">{status}</p>}
  </div>;
}
