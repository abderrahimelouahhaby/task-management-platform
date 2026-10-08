'use client';

import { useState } from 'react';

type NoteFormProps = {
  initialValues?: { title: string; content: string };
  submitLabel: string;
  onSubmit: (data: { title: string; content: string }) => Promise<boolean>;
  onCancel?: () => void;
};

export function NoteForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [content, setContent] = useState(initialValues?.content ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Title is required');
      return;
    }
    if (trimmedTitle.length > 200) {
      setError('Title must be 200 chars or less');
      return;
    }
    if (content.length > 10000) {
      setError('Content must be 10000 chars or less');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const ok = await onSubmit({
        title: trimmedTitle,
        content: content.trim(),
      });
      if (ok) {
        setTitle('');
        setContent('');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        maxLength={200}
        className="w-full rounded-md bg-neutral-100 border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Content (optional)"
        rows={3}
        maxLength={10000}
        className="w-full rounded-md bg-neutral-100 border border-neutral-300 px-3 py-2 dark:bg-neutral-900 dark:border-neutral-700 dark:text-white"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 text-white font-medium px-4 py-2 hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-neutral-300 px-4 py-2 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
