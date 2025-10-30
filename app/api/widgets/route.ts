// API routes for personalized dashboard widgets
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/widgets - Get all widgets for a user
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const widgets = await prisma.widget.findMany({
      where: {
        userId,
        isVisible: true,
      },
      orderBy: {
        position: 'asc',
      },
    });

    return NextResponse.json(widgets);
  } catch (error) {
    console.error('Failed to fetch widgets:', error);
    return NextResponse.json({ error: 'Failed to fetch widgets' }, { status: 500 });
  }
}

// POST /api/widgets - Create a new widget
export async function POST(req: NextRequest) {
  try {
    const { userId, type, size = 'medium', settings = {} } = await req.json();

    if (!userId || !type) {
      return NextResponse.json(
        { error: 'User ID and widget type are required' },
        { status: 400 }
      );
    }

    // Get the next position
    const lastWidget = await prisma.widget.findFirst({
      where: { userId },
      orderBy: { position: 'desc' },
    });

    const position = lastWidget ? lastWidget.position + 1 : 0;

    const widget = await prisma.widget.create({
      data: {
        userId,
        widgetType: type,
        size,
        position,
        config: settings,
        isVisible: true,
      },
    });

    return NextResponse.json(widget);
  } catch (error) {
    console.error('Failed to create widget:', error);
    return NextResponse.json({ error: 'Failed to create widget' }, { status: 500 });
  }
}

// PUT /api/widgets - Update widget settings or position
export async function PUT(req: NextRequest) {
  try {
    const { widgetId, title, size, position, settings, isActive } = await req.json();

    if (!widgetId) {
      return NextResponse.json({ error: 'Widget ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (size !== undefined) updateData.size = size;
    if (position !== undefined) updateData.position = position;
    if (settings !== undefined) updateData.settings = settings;
    if (isActive !== undefined) updateData.isActive = isActive;

    const widget = await prisma.widget.update({
      where: { id: widgetId },
      data: updateData,
    });

    return NextResponse.json(widget);
  } catch (error) {
    console.error('Failed to update widget:', error);
    return NextResponse.json({ error: 'Failed to update widget' }, { status: 500 });
  }
}

// DELETE /api/widgets - Delete a widget
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const widgetId = searchParams.get('id');

    if (!widgetId) {
      return NextResponse.json({ error: 'Widget ID is required' }, { status: 400 });
    }

    await prisma.widget.delete({
      where: { id: widgetId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete widget:', error);
    return NextResponse.json({ error: 'Failed to delete widget' }, { status: 500 });
  }
}
