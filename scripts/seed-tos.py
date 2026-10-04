"""Emit idempotent SQL for the reviewed-in-app syllabus index."""
import json
import sys
from pathlib import Path

subjects = json.loads((Path(__file__).resolve().parents[1] / 'src/data/syllabus.json').read_text())

def q(value):
    return "'" + str(value).replace("'", "''") + "'"

mode = sys.argv[1]
if mode == 'subjects':
    print("insert into public.exam_cycles(id,label,starts_on,ends_on,status,source_url) values "
          "('may-2027','May 2027 CPALE',null,null,'provisional',null) "
          "on conflict (id) do nothing;")
    print('insert into public.syllabus_subjects(id,name,abbreviation,position,source_url) values')
    print(',\n'.join(f"({q(s['id'])},{q(s['name'])},{q(s['short'])},{i},{q(s['sourceUrl'])})" for i, s in enumerate(subjects, 1)))
    print('on conflict (id) do update set name=excluded.name, abbreviation=excluded.abbreviation, position=excluded.position, source_url=excluded.source_url;')
else:
    sid = mode
    start = int(sys.argv[2])
    stop = int(sys.argv[3])
    subject = next(s for s in subjects if s['id'] == sid)
    topics = subject['topics'][start:stop]
    print('insert into public.syllabus_topics(id,subject_id,code,title,section,source_page,status) values')
    print(',\n'.join(f"({q(t['id'])},{q(sid)},{q(t['code'])},{q(t['title'])},{q(t['section'])},{t['page']},{q(t['status'])})" for t in topics))
    print('on conflict (id) do update set title=excluded.title, section=excluded.section, source_page=excluded.source_page;')
