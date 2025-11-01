// API routes for Budget Templates

import { NextRequest, NextResponse } from 'next/server';
import { getUserByWhopId } from '@/lib/db';
import prisma from '@/lib/prisma';

// GET /api/budget-templates - Get budget templates
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    const category = request.nextUrl.searchParams.get('category');
    const region = request.nextUrl.searchParams.get('region');
    const includePublic = request.nextUrl.searchParams.get('includePublic') !== 'false';

    const where: any = {};
    
    if (userId) {
      const user = await getUserByWhopId(userId);
      if (user) {
        where.OR = [
          { userId: user.id },
          ...(includePublic ? [{ isPublic: true }] : []),
        ];
      } else if (includePublic) {
        where.isPublic = true;
      }
    } else if (includePublic) {
      where.isPublic = true;
    }

    if (category) {
      where.category = category;
    }

    if (region) {
      where.region = region;
    }

    const templates = await prisma.budgetTemplate.findMany({
      where,
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Failed to fetch budget templates:', error);
    return NextResponse.json({ error: 'Failed to fetch budget templates' }, { status: 500 });
  }
}

// POST /api/budget-templates - Create budget template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, description, category, region, allocations, isPublic, isDefault } = body;

    if (!name || !category || !region || !allocations) {
      return NextResponse.json(
        { error: 'name, category, region, and allocations are required' },
        { status: 400 }
      );
    }

    let user;
    if (userId) {
      user = await getUserByWhopId(userId);
    }

    // If setting as default, unset other defaults for this user
    if (isDefault && user) {
      await prisma.budgetTemplate.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false },
      });
    }

    const template = await prisma.budgetTemplate.create({
      data: {
        userId: user?.id,
        name,
        description,
        category,
        region,
        allocations,
        isPublic: isPublic || false,
        isDefault: isDefault || false,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Failed to create budget template:', error);
    return NextResponse.json({ error: 'Failed to create budget template' }, { status: 500 });
  }
}

// Initialize default templates
async function initializeDefaultTemplates() {
  const defaultTemplates = [
    {
      name: 'Student Budget',
      description: 'Budget template for students',
      category: 'student',
      region: 'US',
      allocations: {
        Housing: 30,
        Food: 15,
        Transportation: 10,
        Education: 20,
        Entertainment: 10,
        Savings: 10,
        Other: 5,
      },
      isPublic: true,
      isDefault: false,
    },
    {
      name: 'Professional Budget',
      description: 'Budget template for working professionals',
      category: 'professional',
      region: 'US',
      allocations: {
        Housing: 30,
        Food: 12,
        Transportation: 15,
        Healthcare: 5,
        Savings: 20,
        Entertainment: 10,
        Other: 8,
      },
      isPublic: true,
      isDefault: false,
    },
    {
      name: 'Family Budget',
      description: 'Budget template for families',
      category: 'family',
      region: 'US',
      allocations: {
        Housing: 25,
        Food: 15,
        Transportation: 15,
        Healthcare: 10,
        Education: 10,
        Savings: 15,
        Entertainment: 5,
        Other: 5,
      },
      isPublic: true,
      isDefault: false,
    },
  ];

  for (const template of defaultTemplates) {
    await prisma.budgetTemplate.upsert({
      where: {
        // Use unique constraint if exists, otherwise create
        id: `${template.category}-${template.region}`,
      },
      update: template,
      create: template,
    });
  }
}

