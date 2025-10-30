// API routes for user notifications
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/notifications - Get all notifications for a user
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications - Create a new notification
export async function POST(req: NextRequest) {
  try {
    const { userId, type, title, message, actionUrl, category } = await req.json();

    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'userId, type, title, and message are required' },
        { status: 400 }
      );
    }

    // Derive category from type if not provided
    const notificationCategory = category || (
      type === 'streak' || type === 'milestone' ? 'achievement' :
      type === 'bill_reminder' || type === 'overspending' ? 'warning' :
      type === 'suggestion' ? 'tip' :
      'info'
    );

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        actionUrl,
        category: notificationCategory,
        isRead: false,
      },
    });

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Failed to create notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// PUT /api/notifications - Mark notification(s) as read
export async function PUT(req: NextRequest) {
  try {
    const { notificationId, userId, markAllRead } = await req.json();

    if (!userId && !notificationId) {
      return NextResponse.json(
        { error: 'Either userId or notificationId is required' },
        { status: 400 }
      );
    }

    if (markAllRead && userId) {
      // Mark all notifications as read for user
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (notificationId) {
      // Mark specific notification as read
      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return NextResponse.json(notification);
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Failed to update notification:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete a notification
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const notificationId = searchParams.get('id');
    const userId = searchParams.get('userId');
    const deleteAll = searchParams.get('deleteAll') === 'true';

    if (!userId && !notificationId) {
      return NextResponse.json(
        { error: 'Either userId or notificationId is required' },
        { status: 400 }
      );
    }

    if (deleteAll && userId) {
      // Delete all read notifications for user
      await prisma.notification.deleteMany({
        where: {
          userId,
          isRead: true,
        },
      });

      return NextResponse.json({ success: true, message: 'All read notifications deleted' });
    }

    if (notificationId) {
      await prisma.notification.delete({
        where: { id: notificationId },
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Failed to delete notification:', error);
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
  }
}
