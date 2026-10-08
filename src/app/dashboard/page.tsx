'use client';

import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/auth-client';
import { useEffect, useState } from 'react';
import { NoteForm } from '@/components/note-form';
import { NoteItem } from '@/components/note-item';
import type { Note } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login');
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!session?.user) return;
    let cancelled = false;
    fetch('/api/notes')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load notes');
        return res.json();
      })
      .then((data: Note[]) => {
        if (!cancelled) setNotes(data);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load notes');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user]);

  async function createNote(data: { title: string; content: string }) {
    try {
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to create note');
      }
      const note: Note = await res.json();
      setNotes((prev) => [note, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create note');
      return false;
    }
  }

  async function updateNote(
    id: string,
    data: { title: string; content: string }
  ) {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update note');
      const updated: Note = await res.json();
      setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update note');
      return false;
    }
  }

  async function deleteNote(id: string) {
    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete note');
      setNotes((prev) => prev.filter((n) => n.id !== id));
      return true;
    } catch {
      setError('Failed to delete note');
      return false;
    }
  }

  if (isPending) return <p className="mt-8 text-center">Loading...</p>;
  if (!session?.user) return <p className="mt-8 text-center">Redirecting...</p>;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold">My Notes</h1>

      <NoteForm submitLabel="Add note" onSubmit={createNote} />

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      <div className="mt-8">
        {loading ? (
          <p className="text-center text-neutral-500 dark:text-neutral-400">
            Loading...
          </p>
        ) : notes.length === 0 ? (
          <p className="text-center text-neutral-500 dark:text-neutral-400">
            No notes yet — add your first one above!
          </p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <NoteItem
                key={note.id}
                note={note}
                onUpdate={updateNote}
                onDelete={deleteNote}
              />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
