'use client';

import { useState } from 'react';
import { NoteForm } from '@/components/note-form';
import type { Note } from '@/lib/types';

type NoteItemProps = {
  note: Note;
  onUpdate: (
    id: string,
    data: { title: string; content: string }
  ) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
};

export function NoteItem({ note, onUpdate, onDelete }: NoteItemProps) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (editing) {
    return (
      <li className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <NoteForm
          initialValues={{ title: note.title, content: note.content ?? '' }}
          submitLabel="Save"
          onSubmit={async (data) => {
            const ok = await onUpdate(note.id, data);
            if (ok) setEditing(false);
            return ok;
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-medium wrap-break-word">{note.title}</h3>
          {note.content && (
            <p className="mt-1 wrap-break-word whitespace-pre-wrap text-sm text-neutral-600 dark:text-neutral-400">
              {note.content}
            </p>
          )}
          <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
            Updated {new Date(note.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => setEditing(true)}
            className="rounded-md border border-neutral-300 px-2 py-1 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Edit
          </button>
          <button
            onClick={async () => {
              if (!confirm('Delete this note?')) return;
              setDeleting(true);
              await onDelete(note.id);
              setDeleting(false);
            }}
            disabled={deleting}
            className="rounded-md border border-red-300 px-2 py-1 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
