/**
 * Embed existing content into vector knowledge base
 *
 * This script:
 * 1. Fetches all CreditTips and FAQs from database
 * 2. Generates embeddings for each
 * 3. Stores in KnowledgeBase table for vector search
 */

import prisma from '../lib/prisma';
import { addToKnowledgeBase, extractKeywords } from '../lib/vector';

async function main() {
  console.log('=€ Starting content embedding process...\n');

  // Clear existing knowledge base
  console.log('=Ñ  Clearing existing knowledge base...');
  const deleted = await prisma.knowledgeBase.deleteMany({});
  console.log(`   Deleted ${deleted.count} existing entries\n`);

  let totalEmbedded = 0;

  // Embed Credit Tips
  console.log('=³ Embedding Credit Tips...');
  const creditTips = await prisma.creditTip.findMany({
    where: { active: true },
  });

  for (const tip of creditTips) {
    try {
      await addToKnowledgeBase({
        content: tip.tipText,
        title: `Credit Tip: ${tip.category} (${tip.region})`,
        contentType: 'credit_tip',
        category: tip.category,
        region: tip.region === 'ALL' ? undefined : tip.region,
        sourceId: tip.id,
        keywords: extractKeywords(tip.tipText),
        importance: tip.importance,
      });
      totalEmbedded++;
      console.log(`    Embedded: ${tip.tipText.substring(0, 60)}...`);
    } catch (error) {
      console.error(`   L Failed to embed tip ${tip.id}:`, error);
    }
  }

  console.log(`\n=Ý Embedded ${creditTips.length} credit tips\n`);

  // Embed FAQs
  console.log('S Embedding FAQs...');
  const faqs = await prisma.fAQ.findMany({
    where: { active: true },
  });

  for (const faq of faqs) {
    try {
      // Combine question and answer for better context
      const content = `Q: ${faq.question}\nA: ${faq.answer}`;

      await addToKnowledgeBase({
        content,
        title: faq.question,
        contentType: 'faq',
        category: faq.category,
        region: faq.region || undefined,
        sourceId: faq.id,
        keywords: extractKeywords(faq.question + ' ' + faq.answer),
        importance: 50, // FAQs are generally important
      });
      totalEmbedded++;
      console.log(`    Embedded: ${faq.question.substring(0, 60)}...`);
    } catch (error) {
      console.error(`   L Failed to embed FAQ ${faq.id}:`, error);
    }
  }

  console.log(`\n=Ö Embedded ${faqs.length} FAQs\n`);

  console.log(`\n( Embedding complete!`);
  console.log(`=Ê Total entries in knowledge base: ${totalEmbedded}`);
  console.log(`\n=° Estimated cost: $${(totalEmbedded * 0.00002).toFixed(4)}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
