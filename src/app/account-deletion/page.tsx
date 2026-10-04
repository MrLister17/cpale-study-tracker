import Link from 'next/link';
import { AccountRequestForm } from '@/components/AccountRequestForm';

export const metadata = { title: 'Account deletion | CPALE Study Tracker' };

export default function AccountDeletion() {
  return <main className="policy-page"><Link href="/">← Back to Study Tracker</Link><h1>Export or delete your account</h1><p>Sign in and send a private request below. The owner will verify it, provide an export if requested, remove uploaded files and account records for a deletion request, and confirm completion through your sign-in email.</p><AccountRequestForm /><p>If you used only the unsigned guest preview, clear this site’s browser data to remove the local copy.</p><p>Deletion is permanent. Any questions you personally created are removed with your account.</p></main>;
}
