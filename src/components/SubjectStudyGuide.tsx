import { BookOpen, ListChecks } from 'lucide-react';
import { workbookStudyGuides } from '@/data/workbookStudyGuides';
import type { SubjectId } from '@/lib/types';

export function SubjectStudyGuide({ subjectId }: { subjectId: SubjectId }) {
  const guide = workbookStudyGuides[subjectId];
  return <section className="workbook-guide card" aria-labelledby="workbook-guide-title">
    <div className="workbook-guide-heading"><div><span className="eyebrow">YOUR STUDY GUIDE</span><h2 id="workbook-guide-title">A path through {guide.themes.length} focus areas</h2></div><BookOpen size={28} aria-hidden="true" /></div>
    <p>{guide.introduction}</p>
    <div className="workbook-routine"><strong><ListChecks size={17} /> How to use each study block</strong><ol>{guide.method.map((step) => <li key={step}>{step}</li>)}</ol></div>
    <div className="workbook-theme-heading"><h3>Suggested topic sequence</h3><span>The PRC outcomes below remain the coverage checklist.</span></div>
    <ol className="workbook-themes">{guide.themes.map((theme, index) => <li key={`${subjectId}-${theme.title}`}><span className="workbook-number">{String(index + 1).padStart(2, '0')}</span><div><h4>{theme.title}</h4><p>{theme.focus}</p></div></li>)}</ol>
    <p className="workbook-source">Adapted into original study directions from the six sample study-guide schedules you supplied. They cover an October 2026 review season, so check current standards, tax rules, and laws before relying on a specific rule. Use the PRC syllabus below to confirm exam coverage.</p>
  </section>;
}

export function TopicStudySteps({ subjectId, outcome }: { subjectId: SubjectId; outcome: string }) {
  const isApplied = /\b(apply|compute|calculate|measure|prepare|record|account for|determine|analy[sz]e|illustrate|solve|reconcile)\b/i.test(outcome);
  const steps = subjectId === 'rfbt' || subjectId === 'tax'
    ? [
      'Find the current law or official issuance for this outcome; note its effective date.',
      'List the parties, taxable or legal event, governing elements, exceptions, and remedy or computation.',
      'Apply the rule to a short fact pattern, then change one fact and check the result.',
    ]
    : subjectId === 'aud'
      ? [
        'Read the applicable standard and identify where this outcome fits in the engagement.',
        'Connect a scenario to its assertion, risk, response, evidence, or reporting decision.',
        'Explain why a tempting alternative procedure or conclusion would be insufficient.',
      ]
      : isApplied
        ? [
          'Write down the applicable rule, the facts given, and the amount or conclusion required.',
          'Work one fresh example with every entry, computation, or decision step shown.',
          'Reconcile the result and repeat after changing one assumption.',
        ]
        : [
          'Read the relevant primary source and define the main terms in your own words.',
          'Make a brief comparison of the bodies, concepts, rules, or treatments named in the outcome.',
          'Explain the concept aloud and give one example without consulting your notes.',
        ];
  return <div className="topic-study-steps"><b>Study this outcome</b><ol>{steps.map((step) => <li key={step}>{step}</li>)}</ol><p>Use the focus areas above for your review order. Mark this outcome complete when you can explain or solve it without notes.</p></div>;
}
