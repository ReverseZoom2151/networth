# Database Setup Guide

This guide explains how to set up and use PostgreSQL with Prisma ORM for the Networth finance coach app.

## Why Database?

Moving from localStorage to a database provides:
- ✅ **Cross-device sync** - Access your data from any device
- ✅ **Data persistence** - Never lose your financial data
- ✅ **Dynamic content** - Update tips, articles without code changes
- ✅ **Better performance** - Faster queries and indexing
- ✅ **Scalability** - Handle millions of users
- ✅ **Analytics** - Track user behavior and improve product

## Database Schema Overview

### User Data (Per-User)
- **User**: Whop authentication data
- **UserGoal**: Financial goals and preferences
- **ProgressHistory**: Savings milestones tracking
- **Budget**: Monthly budget allocations
- **Expense**: Individual expense tracking
- **Bill**: Recurring bills and reminders
- **Debt**: Debt tracking for payoff calculator
- **NetWorthSnapshot**: Net worth over time

### Dynamic Content (Global)
- **CreditTip**: Credit score tips (region-specific)
- **Article**: Blog posts and guides
- **FAQ**: Frequently asked questions
- **GoalTemplate**: Pre-built goal templates

## Setup Options

### Option 1: Quick Start (Vercel Postgres) - Recommended

1. **Create Vercel Postgres Database**
   ```bash
   # In your Vercel project dashboard:
   # Storage → Create → Postgres
   ```

2. **Copy Connection String**
   - Vercel will provide a `DATABASE_URL`
   - Add to `.env.local`:
   ```bash
   DATABASE_URL="postgres://default:...@...us-east-1.postgres.vercel-storage.com/verceldb"
   ```

3. **Run Migrations**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

**Benefits:**
- Zero configuration
- Automatically scales
- Free tier available
- Integrated with Vercel deployment

---

### Option 2: Supabase (PostgreSQL + Realtime)

1. **Create Supabase Project**
   - Go to [https://supabase.com](https://supabase.com)
   - Create new project
   - Wait for database provisioning (~2 minutes)

2. **Get Connection String**
   - Settings → Database → Connection string → Pooling
   - Copy the URI (starts with `postgresql://`)
   - Add to `.env.local`:
   ```bash
   DATABASE_URL="postgresql://postgres.[ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
   ```

3. **Run Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

**Benefits:**
- Built-in authentication (alternative to Whop)
- Real-time subscriptions
- Storage for files
- Free tier: 500MB database

---

### Option 3: Docker (Local Development)

1. **Create `docker-compose.yml`**
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:16
       restart: always
       environment:
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: password
         POSTGRES_DB: networth_dev
       ports:
         - '5432:5432'
       volumes:
         - postgres_data:/var/lib/postgresql/data

   volumes:
     postgres_data:
   ```

2. **Start Database**
   ```bash
   docker-compose up -d
   ```

3. **Set Environment Variable**
   ```bash
   # .env.local
   DATABASE_URL="postgresql://postgres:password@localhost:5432/networth_dev"
   ```

4. **Run Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

**Benefits:**
- Complete control
- No internet required
- Free
- Easy to reset

---

### Option 4: Railway

1. **Create Railway Account**
   - Go to [https://railway.app](https://railway.app)
   - Connect GitHub account

2. **Create PostgreSQL Database**
   - New Project → Add PostgreSQL
   - Copy connection string from Variables tab

3. **Add to Environment**
   ```bash
   DATABASE_URL="postgresql://..."
   ```

4. **Run Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

**Benefits:**
- Simple deployment
- Generous free tier
- Great developer experience

---

## Database Commands

### Development Workflow

```bash
# Generate Prisma Client after schema changes
npm run db:generate

# Create a new migration (modifies database)
npm run db:migrate

# Seed database with initial content
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio

# Reset database (WARNING: deletes all data)
npm run db:reset
```

### Prisma Studio

Visual database browser at `http://localhost:5555`:

```bash
npm run db:studio
```

Use this to:
- View all tables and data
- Manually edit records
- Test queries
- Debug issues

---

## Using the Database in Code

### Basic Usage

```typescript
import prisma from '@/lib/prisma';

// Get user
const user = await prisma.user.findUnique({
  where: { whopId: 'user_abc123' },
  include: { goal: true }
});

// Create budget
const budget = await prisma.budget.create({
  data: {
    userId: user.id,
    month: 1,
    year: 2025,
    categories: {
      Food: { budgeted: 500, spent: 0 },
      Rent: { budgeted: 1200, spent: 0 }
    }
  }
});

// Get credit tips
const tips = await prisma.creditTip.findMany({
  where: {
    region: 'US',
    active: true
  },
  orderBy: { importance: 'desc' },
  take: 5
});
```

### In API Routes

```typescript
// app/api/user/goal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  const { whopId, goal } = await request.json();

  // Find or create user
  const user = await prisma.user.upsert({
    where: { whopId },
    update: {},
    create: { whopId }
  });

  // Update goal
  const userGoal = await prisma.userGoal.upsert({
    where: { userId: user.id },
    update: goal,
    create: { ...goal, userId: user.id }
  });

  return NextResponse.json({ success: true, goal: userGoal });
}
```

---

## Migration Strategy

### From localStorage to Database

**Phase 1: Dual Storage (Current)**
- Keep localStorage as fallback
- Write to both localStorage and database
- Read from database, fall back to localStorage

**Phase 2: Database Primary**
- Read from database only
- localStorage used for offline mode

**Phase 3: Database Only**
- Remove localStorage code
- Full cloud sync

### Migration Script Example

```typescript
// scripts/migrate-users.ts
import prisma from '@/lib/prisma';

async function migrateUserData() {
  // Get all users from Whop
  const whopUsers = await fetchWhopUsers();

  for (const whopUser of whopUsers) {
    // Create user in database
    const user = await prisma.user.upsert({
      where: { whopId: whopUser.id },
      update: { email: whopUser.email },
      create: {
        whopId: whopUser.id,
        email: whopUser.email
      }
    });

    // Migrate their data if exists in localStorage
    // (would need to be done client-side)
    console.log(`Migrated user: ${user.whopId}`);
  }
}
```

---

## Content Management

### Adding Credit Tips

```typescript
// Via Prisma Studio (GUI)
// 1. npm run db:studio
// 2. Open CreditTip table
// 3. Add record

// Via Code
await prisma.creditTip.create({
  data: {
    region: 'US',
    category: 'building_credit',
    tipText: 'Your new tip here',
    importance: 75,
    active: true
  }
});
```

### Managing Articles

```typescript
// Create blog post
await prisma.article.create({
  data: {
    slug: 'how-to-build-credit',
    title: 'How to Build Credit as a Student',
    excerpt: 'A complete guide...',
    content: 'Full article content here...',
    category: 'credit',
    published: true,
    publishedAt: new Date()
  }
});

// Fetch published articles
const articles = await prisma.article.findMany({
  where: { published: true },
  orderBy: { publishedAt: 'desc' },
  take: 10
});
```

---

## Production Deployment

### Vercel Deployment

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add database support"
   git push
   ```

2. **Connect to Vercel**
   - Import repository
   - Add environment variables:
     ```
     DATABASE_URL=your_database_url
     WHOP_API_KEY=your_key
     ANTHROPIC_API_KEY=your_key
     ```

3. **Automatic Migrations**
   Add to `package.json`:
   ```json
   {
     "scripts": {
       "build": "prisma generate && prisma migrate deploy && next build"
     }
   }
   ```

### Environment Variables

**Development (.env.local)**
```bash
DATABASE_URL=postgresql://localhost:5432/networth_dev
```

**Production (Vercel Environment Variables)**
```bash
DATABASE_URL=postgresql://...vercel-storage.com/...
```

---

## Troubleshooting

### "Can't reach database server"
```bash
# Check database is running (Docker)
docker-compose ps

# Test connection
npx prisma db execute --stdin --schema=./prisma/schema.prisma
```

### "Migration failed"
```bash
# Reset database (WARNING: deletes all data)
npm run db:reset

# Or manually
npx prisma migrate reset --force
```

### "Prisma Client out of sync"
```bash
# Regenerate client
npm run db:generate
```

### "Too many connections"
```bash
# Use connection pooling in production
# Add ?pgbouncer=true to DATABASE_URL

# For Vercel Postgres, they handle this automatically
```

### "Seed script fails"
```bash
# Check if TypeScript is compiled
npx tsx prisma/seed.ts

# Run with verbose logging
DEBUG=* npm run db:seed
```

---

## Best Practices

### 1. Always Use Transactions for Multi-Step Operations

```typescript
await prisma.$transaction(async (tx) => {
  const user = await tx.user.create({ data: { whopId } });
  await tx.userGoal.create({ data: { userId: user.id, ...goal } });
});
```

### 2. Use Connection Pooling in Production

```typescript
// lib/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?connection_limit=10'
    }
  }
});
```

### 3. Add Proper Indexes

Already included in schema for:
- Lookups by user ID
- Date range queries
- Region filtering

### 4. Backup Regularly

```bash
# For production, set up automated backups
# Vercel Postgres: Automatic daily backups
# Supabase: Automatic backups + point-in-time recovery
```

---

## Next Steps

1. ✅ Set up database (choose option above)
2. ✅ Run migrations
3. ✅ Seed initial content
4. ⬜ Update storage layer to use database
5. ⬜ Test user data sync
6. ⬜ Deploy to production
7. ⬜ Monitor database performance

## Support Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Vercel Postgres**: https://vercel.com/docs/storage/vercel-postgres
- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Tutorial**: https://www.postgresqltutorial.com/

## Common Queries

### Get user with all related data
```typescript
const user = await prisma.user.findUnique({
  where: { whopId },
  include: {
    goal: true,
    budgets: { orderBy: { createdAt: 'desc' }, take: 12 },
    bills: { where: { recurring: true } },
    debts: true,
    netWorthSnapshots: { orderBy: { date: 'desc' }, take: 12 }
  }
});
```

### Get dynamic content for dashboard
```typescript
const [tips, faqs, templates] = await Promise.all([
  prisma.creditTip.findMany({
    where: { region: { in: [userRegion, 'ALL'] }, active: true },
    orderBy: { importance: 'desc' },
    take: 5
  }),
  prisma.fAQ.findMany({
    where: { active: true },
    orderBy: { order: 'asc' }
  }),
  prisma.goalTemplate.findMany({
    where: { active: true },
    orderBy: { order: 'asc' }
  })
]);
```

---

**Ready to make your app dynamic! 🚀**
