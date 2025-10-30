import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNews() {
  const news = await prisma.newsImpact.findMany({
    where: { active: true },
    orderBy: { publishedAt: 'desc' },
    take: 10,
    select: {
      title: true,
      source: true,
      category: true,
      impactType: true,
      urgency: true,
      publishedAt: true,
    },
  });

  console.log('\n📰 Latest 10 News Articles:\n');
  console.log('='.repeat(80));

  news.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   Source: ${item.source}`);
    console.log(`   Category: ${item.category} | Impact: ${item.impactType} | Urgency: ${item.urgency}`);
    console.log(`   Published: ${item.publishedAt.toLocaleString()}`);
  });

  console.log('\n' + '='.repeat(80));

  const stats = await prisma.$queryRaw<Array<{ category: string; count: bigint }>>`
    SELECT category, COUNT(*) as count
    FROM "NewsImpact"
    WHERE active = true
    GROUP BY category
    ORDER BY count DESC
  `;

  console.log('\n📊 News by Category:\n');
  stats.forEach((stat) => {
    console.log(`   ${stat.category}: ${stat.count} articles`);
  });

  await prisma.$disconnect();
}

checkNews();
