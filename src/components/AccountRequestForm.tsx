'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabase } from '@/lib/supabase';

export function AccountRequestForm() {
  const supabase = useMemo(() => getSupabase(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUserId(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, [supabase]);
  const request = async (kind: 'export' | 'delete') => {
    if (!supabase || !userId) return setMessage('Please sign in on the home page first.');
    if (kind === 'delete' && !window.confirm('Request permanent account deletion? The owner will verify and process this request.')) return;
    const { error } = await supabase.from('account_requests').insert({ user_id: userId, kind });
    setMessage(error?.message ?? `${kind === 'delete' ? 'Deletion' : 'Export'} request submitted. The owner will review it.`);
  };
  return <div className="request-form"><button onClick={() => void request('export')}>Request my data export</button><button onClick={() => void request('delete')}>Request account deletion</button>{!userId && <p>Sign in through the home page before sending a request.</p>}{message && <p role="status">{message}</p>}</div>;
}
