import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { addStoryReaction, removeStoryReaction } from '@/lib/db';

const reactionSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  reaction: z.string().default('like'),
});

type RouteParams = {
  params: {
    storyId: string;
  };
};

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const body = await request.json();
    const parsed = reactionSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors.map((err) => err.message).join('; ');
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const result = await addStoryReaction(context.params.storyId, parsed.data.userId, parsed.data.reaction);
    if (!result) {
      return NextResponse.json({ error: 'Unable to cheer this story right now' }, { status: 500 });
    }

    return NextResponse.json({ likes: result.likes });
  } catch (error) {
    console.error('[Story Reaction] Failed to add reaction:', error);
    return NextResponse.json({ error: 'Failed to add reaction' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = reactionSchema.partial().safeParse(body);

    if (!parsed.success || !parsed.data.userId) {
      return NextResponse.json({ error: 'userId is required to remove a reaction' }, { status: 400 });
    }

    const result = await removeStoryReaction(
      context.params.storyId,
      parsed.data.userId,
      parsed.data.reaction || 'like',
    );

    if (!result) {
      return NextResponse.json({ error: 'Unable to update reactions right now' }, { status: 500 });
    }

    return NextResponse.json({ likes: result.likes });
  } catch (error) {
    console.error('[Story Reaction] Failed to remove reaction:', error);
    return NextResponse.json({ error: 'Failed to remove reaction' }, { status: 500 });
  }
}


