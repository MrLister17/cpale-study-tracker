"""Extract a reviewable topic index from the user-provided PRC TOS PDF.

This is an index, not approved teaching content. Review the generated labels
against the PDF before publishing a guide or question set.
"""

from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

PDF = Path('/Users/yvan/Downloads/TOS - CPALE.pdf')
OUT = Path(__file__).resolve().parents[1] / 'src/data/syllabus.json'

SUBJECTS = [
    ('far', 'Financial Accounting and Reporting', 'FAR', 1, 5, '#91c762', '#edf7db', 'lily'),
    ('afar', 'Advanced Financial Accounting and Reporting', 'AFAR', 6, 13, '#f6a2ba', '#fff0f4', 'camellia'),
    ('mas', 'Management Services', 'MAS', 14, 16, '#e7b552', '#fff5d8', 'marigold'),
    ('aud', 'Auditing', 'AUD', 17, 22, '#8ea9e9', '#eaf0ff', 'bluebell'),
    ('rfbt', 'Regulatory Framework for Business Transactions', 'RFBT', 23, 34, '#a996dd', '#f1edff', 'aster'),
    ('tax', 'Taxation', 'TAX', 35, 38, '#f59471', '#fff0e8', 'daisy'),
]

ACTION = re.compile(
    r'\b(describe|explain|apply|compute|discuss|identify|determine|analy[sz]e|'
    r'account|prepare|recognize|evaluate|measure|illustrate|differentiate|perform|'
    r'summarize|present|record|compare|calculate|utilize|carry out|list|classify|'
    r'understand|assess|define|distinguish|interpret|solve)\b', re.I
)
NUMBERED = re.compile(r'^\s*(\d+(?:\.\d+)*)(?:\.)?\s+(.+?)\s*$')
SECTION = re.compile(r'^\s*([A-Z])\.\s+(.+?)\s{2,}\d+(?:\.\d+)?%')
TABLE_TAIL = re.compile(r'\s{2,}(?:\d+(?:\.\d+)?%?\s*)+$')


def clean(value: str) -> str:
    value = TABLE_TAIL.sub('', value)
    value = re.sub(r'\s{2,}', ' ', value)
    return value.strip(' .–-')


def main() -> None:
    text = subprocess.check_output(['pdftotext', '-layout', str(PDF), '-']).decode()
    pages = text.split('\f')
    result = []
    for sid, name, short, start, end, color, pale, flower in SUBJECTS:
        topics = []
        section = 'Core syllabus'
        for page_no in range(start, end + 1):
            page = pages[page_no - 1]
            lines = page.splitlines()
            for index, line in enumerate(lines):
                match_section = SECTION.match(line)
                # A section heading may wrap before its percentage column
                # (for example, Taxation under the Local Government Code).
                if not match_section and re.match(r'^\s*[A-Z]\.\s+', line) and index + 1 < len(lines):
                    match_section = SECTION.match(f'{line.rstrip()}  {lines[index + 1].strip()}')
                if match_section:
                    section = clean(match_section.group(2))
                    continue
                match = NUMBERED.match(line)
                if not match:
                    continue
                number, raw = match.groups()
                parts = [clean(raw)]
                for following in lines[index + 1:index + 5]:
                    stripped = following.strip()
                    if not stripped or NUMBERED.match(following) or re.match(r'^\s*[A-Z]\.\s+', following):
                        break
                    if stripped.lower().startswith(('total', 'table of specifications', 'philippine q')):
                        break
                    phrase = clean(following)
                    if phrase and re.search(r'[A-Za-z]{3}', phrase) and len(phrase) < 170:
                        parts.append(phrase)
                title = ' '.join(parts)
                if not ACTION.search(title) or len(title) < 12:
                    continue
                if title.lower().startswith(('no. of', 'total ', 'philippine qualifications')):
                    continue
                topic_id = f'{sid}-{len(topics) + 1:03d}'
                topics.append({
                    'id': topic_id,
                    'code': number,
                    'title': title,
                    'section': section,
                    'page': page_no,
                    'status': 'needs_editorial_review',
                })
        # AFAR page 11 presents these three outcomes beneath a numbered
        # section heading. The generic action-line parser misses them because
        # the row labels are indented under the multi-line heading. Preserve
        # all existing IDs by assigning stable new IDs, then place the rows
        # after the preceding derivatives/hedging outcome in source order.
        if sid == 'afar':
            translation = [
                ('afar-060', '10.0.1', 'Translate from the Functional Currency into the Presentation Currency using closing/current rate method'),
                ('afar-061', '10.0.2', 'Translate into Functional Currency (Remeasurement from Foreign Currency Financial Statements to the Functional Currency)'),
                ('afar-062', '10.0.3', 'Restate the Financial Statements (Functional Currency of a Hyperinflationary Economy)'),
            ]
            insert_after = next(index for index, topic in enumerate(topics) if topic['id'] == 'afar-034') + 1
            topics[insert_after:insert_after] = [
                {'id': topic_id, 'code': code, 'title': title,
                 'section': 'Translation of Foreign Currency Financial Statements (PAS 21 / PAS 29)',
                 'page': 11, 'status': 'needs_editorial_review'}
                for topic_id, code, title in translation
            ]
        result.append({
            'id': sid, 'name': name, 'short': short,
            'color': color, 'pale': pale, 'flower': flower,
            'source': 'PRC BOA Table of Specifications, effective October 2022',
            'sourceUrl': 'https://www.prc.gov.ph/sites/default/files/2022-30%20BOA%20TOS%20Final.pdf',
            'topics': topics,
        })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n')
    print('Extracted:', ', '.join(f"{s['short']} {len(s['topics'])}" for s in result))


if __name__ == '__main__':
    main()
