// API endpoint for data migration from localStorage to database
import { NextRequest, NextResponse } from 'next/server';
import { migrateUserData, exportUserData } from '@/lib/services/data-migration';

// POST /api/migrate - Migrate localStorage data to database
export async function POST(req: NextRequest) {
  try {
    const { userId, data } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Data to migrate is required' }, { status: 400 });
    }

    // Run migration
    const result = await migrateUserData(userId, data);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Data migrated successfully',
        migrated: result.migrated,
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Migration completed with errors',
        migrated: result.migrated,
        errors: result.errors,
      }, { status: 207 }); // Multi-status
    }
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: 'Failed to migrate data' },
      { status: 500 }
    );
  }
}

// GET /api/migrate/export - Export user data as JSON backup
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const exportedData = await exportUserData(userId);

    return NextResponse.json(exportedData);
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
