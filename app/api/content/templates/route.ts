import { NextRequest, NextResponse } from 'next/server';
import { getGoalTemplates } from '@/lib/db';

/**
 * Goal Templates API
 *
 * GET: Retrieve goal templates
 *
 * Query params:
 * - category: Optional category filter (Security, Education, Lifestyle, etc.)
 *
 * Returns templates from database, or empty array if database unavailable
 * (app will fall back to hardcoded templates)
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;

    const templates = await getGoalTemplates(category);

    return NextResponse.json({
      templates,
      source: templates.length > 0 ? 'database' : 'fallback',
      count: templates.length
    });
  } catch (error) {
    console.error('Error getting goal templates:', error);
    return NextResponse.json(
      { templates: [], source: 'error' },
      { status: 200 } // Still return 200 so app can use fallback
    );
  }
}
