import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createCommunityStory,
  listCommunityStories,
  CreateCommunityStoryInput,
  StoryFilterOptions,
} from '@/lib/db';

const createStorySchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  authorName: z.string().min(2, 'Please add a display name'),
  goalType: z.string().min(2, 'Select a goal type'),
  title: z.string().min(3, 'Give your story a title'),
  summary: z.string().min(10, 'Share a quick summary of your journey'),
  story: z.string().min(25, 'Tell us more about your experience'),
  tips: z.array(z.string()).optional(),
  milestones: z.any().optional(),
  region: z.string().optional(),
  targetAmount: z.union([z.number(), z.string()]).optional(),
  timeframeMonths: z.union([z.number(), z.string()]).optional(),
  visibility: z.enum(['public', 'friends', 'private']).optional(),
});

function normalizeNumber(value?: number | string | null) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const filters: StoryFilterOptions = {
    status: (searchParams.get('status') as StoryFilterOptions['status']) ?? 'approved',
    visibility: (searchParams.get('visibility') as StoryFilterOptions['visibility']) ?? 'public',
    goalType: searchParams.get('goalType') ?? undefined,
    region: searchParams.get('region') ?? undefined,
  };

  const limit = searchParams.get('limit');
  if (limit) {
    const parsed = parseInt(limit, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      filters.limit = parsed;
    }
  }

  try {
    const stories = await listCommunityStories(filters);
    return NextResponse.json({ stories });
  } catch (error) {
    console.error('[Stories API] Failed to list stories:', error);
    return NextResponse.json({ error: 'Failed to load stories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createStorySchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors.map(err => err.message).join('; ');
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { userId, ...payload } = parsed.data;

    const storyInput: CreateCommunityStoryInput = {
      authorName: payload.authorName,
      goalType: payload.goalType,
      title: payload.title,
      summary: payload.summary,
      story: payload.story,
      tips: payload.tips?.filter(Boolean),
      milestones: payload.milestones,
      region: payload.region || undefined,
      targetAmount: normalizeNumber(payload.targetAmount),
      timeframeMonths: normalizeNumber(payload.timeframeMonths),
      visibility: payload.visibility,
    };

    const story = await createCommunityStory(userId, storyInput);
    if (!story) {
      return NextResponse.json({ error: 'Unable to save your story right now' }, { status: 500 });
    }

    return NextResponse.json({ story });
  } catch (error) {
    console.error('[Stories API] Failed to create story:', error);
    return NextResponse.json({ error: 'Failed to create story' }, { status: 500 });
  }
}


