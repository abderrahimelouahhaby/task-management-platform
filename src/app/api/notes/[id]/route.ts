import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/require-auth';
import prisma from '@/lib/prisma';
import { updateNoteSchema } from '@/lib/validations/note';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await requireAuth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { user } = session;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = updateNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    );
  }

  try {
    const note = await prisma.note.update({
      where: { id, userId: user.id },
      data: parsed.data,
    });
    return NextResponse.json(note);
  } catch {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await requireAuth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { user } = session;
  const { id } = await params;

  try {
    await prisma.note.delete({
      where: { id, userId: user.id },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Note not found' }, { status: 404 });
  }
}
