import { Suspense } from 'react';
import SignIn from '@/src/views/SignIn';
import Spinner from '@/src/components/common/Spinner';

export const metadata = { title: 'Sign in — EDUBUILD' };

// SignIn reads `next` and `expired` from the query string, so it needs a
// Suspense boundary for the same reason the library does.
export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner size="lg" label="Loading" />
        </div>
      }
    >
      <SignIn />
    </Suspense>
  );
}
