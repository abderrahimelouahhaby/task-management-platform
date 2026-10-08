import { z } from 'zod';

export const createNoteSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 chars or less'),
  content: z
    .string()
    .max(10000, 'Content must be 10000 chars or less')
    .optional(),
});

export const updateNoteSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(200, 'Title must be 200 chars or less')
      .optional(),
    content: z
      .string()
      .max(10000, 'Content must be 10000 chars or less')
      .optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: 'Nothing to update — provide title or content',
    path: ['title'],
  });

export const noteIdSchema = z.string().min(1, 'Note id is required');
