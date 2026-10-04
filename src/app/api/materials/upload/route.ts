import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
const allowed = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);

function validSignature(bytes: Uint8Array, mime: string): boolean {
  if (mime === 'application/pdf') return String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-';
  if (mime === 'image/png') return bytes[0] === 0x89 && String.fromCharCode(...bytes.slice(1, 4)) === 'PNG';
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (mime === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return false;
}

export async function POST(request: Request) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key) return NextResponse.json({ error: 'Storage is not configured.' }, { status: 503 });
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const client = createClient(base, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: userData, error: userError } = await client.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: 'Your session has expired.' }, { status: 401 });
  const form = await request.formData();
  const file = form.get('file');
  const topicId = form.get('topicId');
  if (!(file instanceof File) || typeof topicId !== 'string' || !topicId) return NextResponse.json({ error: 'Choose a file and topic.' }, { status: 400 });
  if (!allowed.has(file.type) || file.size < 1 || file.size > 10 * 1024 * 1024) return NextResponse.json({ error: 'Use a PDF or image up to 10 MB.' }, { status: 400 });
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!validSignature(bytes, file.type)) return NextResponse.json({ error: 'The file does not match its declared type.' }, { status: 400 });
  const { data, error } = await client.rpc('reserve_material_upload', { p_topic_id: topicId, p_name: file.name, p_bytes: file.size, p_mime: file.type });
  if (error || !Array.isArray(data) || !data[0]) return NextResponse.json({ error: error?.message ?? 'Could not reserve upload space.' }, { status: 403 });
  const reservation = data[0] as { file_id: string; storage_path: string };
  const result = await client.storage.from('materials').upload(reservation.storage_path, bytes, { contentType: file.type, upsert: false });
  if (result.error) {
    await client.rpc('cancel_material_upload', { p_id: reservation.file_id });
    return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  const confirmed = await client.rpc('finish_material_upload', { p_id: reservation.file_id });
  if (confirmed.error) {
    await client.storage.from('materials').remove([reservation.storage_path]);
    await client.rpc('cancel_material_upload', { p_id: reservation.file_id });
    return NextResponse.json({ error: 'Upload could not be finalized. Please try again.' }, { status: 500 });
  }
  return NextResponse.json({ id: reservation.file_id, path: reservation.storage_path });
}
