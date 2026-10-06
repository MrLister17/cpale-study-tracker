alter table public.starter_questions
  add column difficulty text check (difficulty in ('easy', 'moderate', 'difficult')),
  add column cognitive_level text check (cognitive_level in ('remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'));
