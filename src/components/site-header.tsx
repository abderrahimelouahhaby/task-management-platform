'use client';

import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth-client';
import { ThemeToggle } from '@/components/theme-toggle';

export function SiteHeader() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
      <Link href="/" className="text-lg font-bold">
        Mitodo
      </Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {session?.user && (
          <button
            onClick={() => signOut()}
            className="rounded-md px-3 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}
