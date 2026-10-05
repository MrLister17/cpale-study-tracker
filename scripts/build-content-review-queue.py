"""Build an editorial queue from the extracted TOS index.

This flags items for a human PDF comparison. It does not approve source labels
or produce accounting, tax, law, or audit teaching content.
"""

from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SUBJECTS = json.loads((ROOT / 'src/data/syllabus.json').read_text())
OUT = ROOT / 'content'


def main() -> None:
    OUT.mkdir(exist_ok=True)
    rows = []
    summary = []
    for subject in SUBJECTS:
        topics = subject['topics']
        repeated = Counter(topic['title'].casefold() for topic in topics)
        flagged = 0
        for topic in topics:
            flags = []
            if repeated[topic['title'].casefold()] > 1:
                flags.append('repeated wording; verify section context')
            if len(topic['title']) < 40:
                flags.append('short label; compare with source table')
            if len(topic['title']) > 230:
                flags.append('long label; check line wrapping')
            if topic['title'].endswith(':'):
                flags.append('label ends with a colon; check missing continuation')
            if flags:
                flagged += 1
            rows.append({
                'subject': subject['short'], 'topic_id': topic['id'],
                'code': topic['code'], 'section': topic['section'],
                'source_pdf_page': topic['page'], 'source_url': subject['sourceUrl'],
                'extracted_outcome': topic['title'], 'extraction_flags': '; '.join(flags),
                'label_review': 'pending', 'guide_review': 'pending',
                'questions_approved': 0, 'reviewer_notes': '',
            })
        summary.append((subject['short'], len(topics), flagged))

    with (OUT / 'CPALE_TOS_REVIEW_QUEUE.csv').open('w', newline='') as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0]), lineterminator='\n')
        writer.writeheader()
        writer.writerows(rows)

    lines = [
        '# CPALE TOS extraction audit', '',
        'Generated from the local syllabus index. Flags identify entries to compare with the supplied PRC PDF; repeated wording may be valid in different sections. This is not editorial approval.', '',
        '| Subject | Extracted entries | Flagged entries |',
        '|---|---:|---:|',
        *[f'| {short} | {count} | {flagged} |' for short, count, flagged in summary],
        f'| **Total** | **{len(rows)}** | **{sum(item[2] for item in summary)}** |', '',
        '## Review order', '',
        '1. Compare each extracted label, section, code, and page with the PRC PDF.',
        '2. Check flagged entries and record corrections with a source page.',
        '3. Write a concise guide and at least three original questions for every confirmed assessable entry.',
        '4. Have the owner or qualified reviewer approve answers, explanations, current rules, and source rights in the protected review interface.', '',
        'The CSV is a portable checklist. The database review queue remains the source of publication status.', '',
    ]
    (OUT / 'CPALE_TOS_AUDIT.md').write_text('\n'.join(lines))
    print(f'Wrote {len(rows)} review rows; {sum(item[2] for item in summary)} carry extraction flags.')


if __name__ == '__main__':
    main()
