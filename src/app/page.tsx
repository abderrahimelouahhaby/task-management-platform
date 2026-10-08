'use client';

import Link from 'next/link';
import {
  Activity,
  Check,
  Globe,
  ListChecks,
  PenLine,
  Target,
} from 'lucide-react';
import { useSession } from '@/lib/auth-client';

const features = [
  {
    icon: ListChecks,
    title: 'Clutter-free checklist',
    description:
      'A distraction-free list that keeps your tasks front and center.',
  },
  {
    icon: Target,
    title: 'Track progress',
    description: 'Create, edit, and finish tasks with instant updates.',
  },
  {
    icon: Globe,
    title: 'Anywhere, anytime',
    description:
      'Access your daily to-do list on any device, whenever you need it.',
  },
];

const steps = [
  {
    icon: PenLine,
    title: 'Create',
    description: 'Jot down a task with a title and optional notes.',
  },
  {
    icon: Activity,
    title: 'Track',
    description: "See everything you've added, newest first.",
  },
  {
    icon: Check,
    title: 'Done',
    description: 'Update or delete tasks as life changes.',
  },
];

export default function LandingPage() {
  const { data: session } = useSession();
  const authed = Boolean(session?.user);

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="mx-auto w-full max-w-3xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold sm:text-5xl">
          Get things done. Simply.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-neutral-600 dark:text-neutral-300">
          Your clean, clutter-free online checklist. Add tasks, track progress,
          and access your daily to-do list anywhere, anytime.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          {authed ? (
            <CtaLink href="/dashboard">Go to dashboard</CtaLink>
          ) : (
            <>
              <CtaLink href="/register">Get started</CtaLink>
              <Link
                href="/login"
                className="rounded-md border border-neutral-900 px-6 py-2 font-medium text-neutral-900 hover:bg-neutral-100 dark:border-white dark:text-white dark:hover:bg-neutral-800"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <h2 className="text-center text-2xl font-bold">Why Mitodo</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800"
            >
              <Icon className="h-6 w-6" />
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-5xl px-6 py-12">
        <h2 className="text-center text-2xl font-bold">How it works</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-lg border border-neutral-200 p-6 dark:border-neutral-800"
            >
              <Icon className="h-6 w-6" />
              <h3 className="mt-3 font-medium">{title}</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-3xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold">Start your checklist today</h2>
        <div className="mt-6 flex justify-center gap-4">
          <CtaLink href={authed ? '/dashboard' : '/register'}>
            {authed ? 'Go to dashboard' : 'Get started'}
          </CtaLink>
        </div>
      </section>
    </main>
  );
}

function CtaLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-md bg-neutral-900 px-6 py-2 font-medium text-white hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
    >
      {children}
    </Link>
  );
}
