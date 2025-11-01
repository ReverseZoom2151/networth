import { NextRequest, NextResponse } from 'next/server';
import {
  getAnalytics,
  getAllTraces,
  getTrace,
  getTracesByUser,
  logAnalyticsSummary,
  exportTraces,
} from '@/lib/tracing';

/**
 * GET /api/ai/analytics - Get analytics summary or specific traces
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const traceId = searchParams.get('traceId');
    const userId = searchParams.get('userId');

    // Get specific trace by ID
    if (action === 'trace' && traceId) {
      const trace = getTrace(traceId);
      if (!trace) {
        return NextResponse.json(
          { error: 'Trace not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ trace });
    }

    // Get traces by user ID
    if (action === 'user' && userId) {
      const traces = getTracesByUser(userId);
      return NextResponse.json({
        userId,
        traceCount: traces.length,
        traces,
      });
    }

    // Get all traces
    if (action === 'all') {
      const traces = getAllTraces();
      return NextResponse.json({
        traceCount: traces.length,
        traces,
      });
    }

    // Export traces as JSON
    if (action === 'export') {
      const jsonData = exportTraces();
      return new NextResponse(jsonData, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="agent-traces-${Date.now()}.json"`,
        },
      });
    }

    // Log analytics summary to console
    if (action === 'log') {
      logAnalyticsSummary();
      return NextResponse.json({
        message: 'Analytics summary logged to console',
      });
    }

    // Default: return analytics summary
    const analytics = getAnalytics();
    return NextResponse.json({
      analytics,
      availableActions: {
        trace: '/api/ai/analytics?action=trace&traceId=<id>',
        user: '/api/ai/analytics?action=user&userId=<id>',
        all: '/api/ai/analytics?action=all',
        export: '/api/ai/analytics?action=export',
        log: '/api/ai/analytics?action=log',
      },
    });
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to retrieve analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
