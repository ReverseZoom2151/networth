import { NextRequest } from 'next/server';
import { storyEvents, StoryBroadcastEvent } from '@/lib/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: StoryBroadcastEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      storyEvents.addListener(sendEvent);

      // Heartbeat to keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(': keep-alive\n\n'));
      }, 25000);

      controller.enqueue(encoder.encode(': connected\n\n'));

      const close = () => {
        clearInterval(heartbeat);
        storyEvents.removeListener(sendEvent);
        controller.close();
      };

      request.signal.addEventListener('abort', close);

      // Provide an explicit cancel method
      return close;
    },
    cancel() {
      // Listener cleanup handled in start -> close
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}


