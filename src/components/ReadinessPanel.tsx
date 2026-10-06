import { ArrowRight, BookOpenCheck } from 'lucide-react';
import type { ReadinessResult } from '@/lib/readiness';

export function ReadinessPanel({ result, openTopic }: { result: ReadinessResult; openTopic: (topicId: string) => void }) {
  return <section className="readiness card" aria-label="Learning evidence">
    <div className="card-heading"><div><span className="eyebrow">YOUR LEARNING EVIDENCE</span><h2>See where to focus next</h2></div><BookOpenCheck size={25} aria-hidden="true" /></div>
    <p className="field-help">This tracks completed work and practice coverage. It does not predict your board exam score.</p>
    <div className="readiness-summary"><div><strong>{result.evidencePercent}%</strong><span>study evidence</span></div><div><strong>{result.completedCoveragePercent}%</strong><span>fully worked topics</span></div><div><strong>{result.assessedCoveragePercent}%</strong><span>reviewed question coverage</span></div></div>
    <div className="readiness-subjects">{result.bySubject.map((subject) => <div key={subject.subjectId}><span>{subject.subjectId.toUpperCase()}</span><div className="progress"><i style={{ width: `${subject.evidencePercent}%` }} /></div><b>{subject.evidencePercent}%</b></div>)}</div>
    {result.priorityGaps.length > 0 && <div className="readiness-gaps"><h3>Next gaps to work on</h3>{result.priorityGaps.slice(0, 5).map((gap) => <button key={gap.topicId} onClick={() => openTopic(gap.topicId)}><span>{gap.subjectId.toUpperCase()} · {gap.title}</span><ArrowRight size={15} /></button>)}</div>}
    {result.verifiedPracticeAccuracyPercent === null && <p className="field-help">Accuracy from owner reviewed questions will appear after the shared question bank is approved.</p>}
  </section>;
}
