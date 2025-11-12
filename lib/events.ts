import { EventEmitter } from 'events';

export type StoryBroadcastEvent =
  | {
      type: 'story_created';
      storyId: string;
      payload: {
        goalType: string;
        title: string;
        authorName: string;
        summary: string;
        status: string;
        visibility: string;
        submittedAt: string;
      };
    }
  | {
      type: 'story_updated';
      storyId: string;
      payload: Record<string, unknown>;
    }
  | {
      type: 'story_reaction';
      storyId: string;
      payload: {
        userId: string;
        reaction: string;
        likes: number;
      };
    };

class StoryEvents extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(0);
  }

  emitEvent(event: StoryBroadcastEvent) {
    this.emit('story-event', event);
  }

  addListener(callback: (event: StoryBroadcastEvent) => void) {
    this.on('story-event', callback);
  }

  removeListener(callback: (event: StoryBroadcastEvent) => void) {
    this.off('story-event', callback);
  }
}

export const storyEvents = new StoryEvents();


