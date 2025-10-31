// Test different AI models for story generation
// Useful for comparing output quality and style

import { processStoryWithAI, AI_MODELS } from './generate-success-stories';

// Sample raw story for testing
const sampleStory = {
  source: 'test',
  content: `
I started with $25,000 in student loans and was making $45,000/year at my first job out of college.
Living in a shared apartment, I managed to save about $800/month by:
- Cooking all my meals at home
- Using public transportation instead of owning a car
- Having a strict "no eating out" rule on weekdays
- Selling things I didn't need on Facebook Marketplace

After 18 months of aggressive saving and debt payments, I managed to pay off my entire student loan.
The key was automating my savings - the money went straight from my paycheck to savings/debt payment.
I never saw it in my checking account, so I couldn't spend it.

It wasn't always easy. I missed out on some social events and had to say no to expensive weekend trips.
But seeing that debt balance go down every month was incredibly motivating.

Now I'm debt-free and have started saving for a house down payment using the same strategies.
`,
  url: 'https://example.com/story',
};

/**
 * Test a specific AI model
 */
async function testModel(modelName: keyof typeof AI_MODELS, goalType: string = 'debt_free') {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${modelName} (${AI_MODELS[modelName]})`);
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    const result = await processStoryWithAI(sampleStory, goalType, modelName);

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    if (!result) {
      console.log('❌ Model failed to generate story');
      return null;
    }

    console.log(`✅ Success (${duration}s)\n`);
    console.log(`Name: ${result.name}, ${result.age}`);
    console.log(`Occupation: ${result.occupation}`);
    console.log(`Goal: ${result.goalTitle}`);
    console.log(`\nStarting Point:`);
    console.log(`  ${result.startingPoint}`);
    console.log(`\nAchievement:`);
    console.log(`  ${result.achievement}`);
    console.log(`\nFinancials:`);
    console.log(`  Amount: $${result.amountSaved.toLocaleString()}`);
    console.log(`  Timeframe: ${result.timeframe} months`);
    console.log(`  Monthly: $${result.monthlyContribution.toLocaleString()}`);
    console.log(`\nStrategies: (${result.strategies.length})`);
    result.strategies.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
    console.log(`\nChallenges: (${result.challenges.length})`);
    result.challenges.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
    console.log(`\nKey Takeaway:`);
    console.log(`  ${result.keyTakeaway}`);
    console.log(`\nStory Preview (first 200 chars):`);
    console.log(`  ${result.story.substring(0, 200)}...`);

    return result;
  } catch (error) {
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    console.log(`❌ Error (${duration}s):`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Compare all models
 */
async function compareAllModels() {
  console.log('\n🤖 AI Model Comparison Test');
  console.log('Testing all models with the same sample story...\n');

  const models: (keyof typeof AI_MODELS)[] = [
    'claude',
    'claudeHaiku',
    'claudeOpus',
    'gpt5',
    'gpt5mini',
    'gpt5pro',
    'gpt5nano',
  ];
  const results: Record<string, any> = {};

  for (const model of models) {
    const result = await testModel(model);
    results[model] = result;

    // Rate limiting between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));

  const successful = Object.entries(results).filter(([_, r]) => r !== null);
  const failed = Object.entries(results).filter(([_, r]) => r === null);

  console.log(`\n✅ Successful: ${successful.length}/${models.length}`);
  successful.forEach(([model]) => console.log(`   - ${model}`));

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${models.length}`);
    failed.forEach(([model]) => console.log(`   - ${model}`));
  }

  // Compare story lengths
  if (successful.length > 0) {
    console.log('\n📊 Story Lengths:');
    successful.forEach(([model, result]) => {
      console.log(`   ${model}: ${result.story.length} characters`);
    });
  }

  console.log('\n✨ Test complete!\n');
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // No arguments - run comparison
    await compareAllModels();
  } else if (args[0] === 'compare') {
    // Explicit compare command
    await compareAllModels();
  } else if (AI_MODELS[args[0] as keyof typeof AI_MODELS]) {
    // Test specific model
    await testModel(args[0] as keyof typeof AI_MODELS, args[1] || 'debt_free');
  } else {
    console.log('Usage:');
    console.log('  npm run test:models                 # Compare all models');
    console.log('  npm run test:models compare         # Compare all models');
    console.log('\nTest individual models:');
    console.log('  npm run test:models claude          # Claude Sonnet 4.5');
    console.log('  npm run test:models claudeHaiku     # Claude Haiku 4.5 (fast)');
    console.log('  npm run test:models claudeOpus      # Claude Opus 4.1 (premium)');
    console.log('  npm run test:models gpt5            # GPT-5');
    console.log('  npm run test:models gpt5mini        # GPT-5 Mini');
    console.log('  npm run test:models gpt5pro         # GPT-5 Pro');
    console.log('  npm run test:models gpt5nano        # GPT-5 Nano');
    console.log('\nAvailable models: claude, claudeHaiku, claudeOpus, gpt5, gpt5mini, gpt5pro, gpt5nano');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testModel, compareAllModels };
