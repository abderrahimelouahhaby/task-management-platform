import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-800">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link href="/" className="text-lg font-bold">
              Mitodo
            </Link>
            <p className="mt-2 max-w-xs text-sm text-neutral-500 dark:text-neutral-400">
              A clean, clutter-free online checklist. Add tasks, track progress,
              and access your to-do list anywhere, anytime.
            </p>
          </div>
          <nav>
            <p className="font-medium">Product</p>
            <ul className="mt-2 space-y-2 text-sm text-neutral-500 dark:text-neutral-400">
              <li>
                <Link
                  href="/dashboard"
                  className="hover:text-neutral-900 dark:hover:text-white"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/login"
                  className="hover:text-neutral-900 dark:hover:text-white"
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-neutral-900 dark:hover:text-white"
                >
                  Register
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <p className="mt-8 text-xs text-neutral-400 dark:text-neutral-500">
          © {new Date().getFullYear()} Mitodo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
