import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNewsUrls() {
  const news = await prisma.newsImpact.findMany({
    where: { active: true },
    orderBy: { publishedAt: 'desc' },
    take: 10,
    select: {
      title: true,
      source: true,
      sourceUrl: true,
      publishedAt: true,
    },
  });

  console.log('\n📰 Latest 10 News Articles with URLs:\n');
  console.log('='.repeat(80));

  news.forEach((item, i) => {
    console.log(`\n${i + 1}. ${item.title}`);
    console.log(`   Source: ${item.source}`);
    console.log(`   URL: ${item.sourceUrl || 'NO URL'}`);
    console.log(`   Published: ${item.publishedAt.toLocaleString()}`);
  });

  console.log('\n' + '='.repeat(80));

  const missingUrls = news.filter(n => !n.sourceUrl).length;
  console.log(`\n📊 Summary: ${missingUrls} out of ${news.length} articles missing URLs`);

  await prisma.$disconnect();
}

checkNewsUrls();
