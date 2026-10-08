import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import prisma from '@/lib/prisma';
import { createNoteSchema } from '@/lib/validations/note';

export async function GET() {
  const session = await requireAuth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { user } = session;

  const notes = await prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const session = await requireAuth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { user } = session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  const note = await prisma.note.create({
    data: {
      title: parsed.data.title,
      content: parsed.data.content ?? null,
      userId: user.id,
    },
  });
  return NextResponse.json(note, { status: 201 });
}
