import { AlertCircle, BookOpen, ExternalLink, Lightbulb, ListChecks } from 'lucide-react';
import type { StudyLesson } from '@/lib/lessonTypes';

export function LessonCard({ lesson }: { lesson: StudyLesson }) {
  return <article className="lesson-card" aria-label={`Study lesson: ${lesson.title}`}>
    <div className="lesson-card-heading"><BookOpen size={20} aria-hidden="true" /><div><span className="eyebrow">{lesson.status === 'published' ? 'OWNER REVIEWED STUDY LESSON' : 'PERSONAL DRAFT · VERIFY BEFORE RELYING ON IT'}</span><h3>{lesson.title}</h3></div></div>
    <p className="lesson-applicability"><AlertCircle size={16} aria-hidden="true" />{lesson.applicabilityNote}</p>
    <div className="lesson-card-grid"><section><h4>Learning goals</h4><ul>{lesson.learningGoals.map((goal) => <li key={goal}>{goal}</li>)}</ul></section><section><h4>Key ideas</h4><ul>{lesson.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul></section></div>
    <section className="lesson-example"><h4><Lightbulb size={17} aria-hidden="true" /> Worked example</h4><p>{lesson.workedExample.scenario}</p><ol>{lesson.workedExample.steps.map((step) => <li key={step}>{step}</li>)}</ol><strong>{lesson.workedExample.takeaway}</strong></section>
    <div className="lesson-card-grid"><section><h4>Common mistake</h4><p>{lesson.commonMistake}</p></section><section><h4><ListChecks size={16} aria-hidden="true" /> Try it yourself</h4><p>{lesson.practicePrompt}</p></section></div>
    <div className="lesson-sources"><b>Sources</b>{lesson.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title} <ExternalLink size={12} aria-hidden="true" /><small>Checked {source.checkedOn}</small></a>)}</div>
  </article>;
}
