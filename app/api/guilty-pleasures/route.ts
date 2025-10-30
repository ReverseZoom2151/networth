// Guilty Pleasures API
// Manage guilt-free spending allowances

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET - Get all guilty pleasures for a user
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const guiltyPleasures = await prisma.guiltyPleasure.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate current month spending for each
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const pleasure of guiltyPleasures) {
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          guiltyPleasureId: pleasure.id,
          transactionDate: {
            gte: firstDayOfMonth,
          },
          type: 'debit',
        },
      });

      const spent = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      await prisma.guiltyPleasure.update({
        where: { id: pleasure.id },
        data: { spent },
      });
    }

    // Refresh data
    const updated = await prisma.guiltyPleasure.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Get guilty pleasures error:', error);
    return NextResponse.json({ error: 'Failed to fetch guilty pleasures' }, { status: 500 });
  }
}

// POST - Create a new guilty pleasure
export async function POST(req: NextRequest) {
  try {
    const { userId, name, category, icon, monthlyBudget, merchants } = await req.json();

    if (!userId || !name || !monthlyBudget) {
      return NextResponse.json(
        { error: 'userId, name, and monthlyBudget are required' },
        { status: 400 }
      );
    }

    const guiltyPleasure = await prisma.guiltyPleasure.create({
      data: {
        userId,
        name,
        category: category || 'Other',
        icon: icon || '☕',
        monthlyBudget,
        merchants: merchants || [],
        spent: 0,
        isActive: true,
      },
    });

    return NextResponse.json(guiltyPleasure);
  } catch (error) {
    console.error('Create guilty pleasure error:', error);
    return NextResponse.json({ error: 'Failed to create guilty pleasure' }, { status: 500 });
  }
}

// PUT - Update a guilty pleasure
export async function PUT(req: NextRequest) {
  try {
    const { id, name, monthlyBudget, merchants, isActive } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Guilty pleasure ID is required' }, { status: 400 });
    }

    const updated = await prisma.guiltyPleasure.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(monthlyBudget !== undefined && { monthlyBudget }),
        ...(merchants && { merchants }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Update guilty pleasure error:', error);
    return NextResponse.json({ error: 'Failed to update guilty pleasure' }, { status: 500 });
  }
}

// DELETE - Delete a guilty pleasure
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Guilty pleasure ID is required' }, { status: 400 });
    }

    // Soft delete
    await prisma.guiltyPleasure.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete guilty pleasure error:', error);
    return NextResponse.json({ error: 'Failed to delete guilty pleasure' }, { status: 500 });
  }
}
