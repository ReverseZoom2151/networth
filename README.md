# Networth Finance Coach

> **AI-powered financial literacy platform for students and young professionals**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.18-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

An intelligent financial coaching application that helps users build healthy financial habits through personalized AI advice, goal tracking, and comprehensive financial management tools. Built with Next.js, Claude AI, and vector search for context-aware financial guidance.

---

## ✨ Key Features

### 🎯 Goal-Based Financial Planning

- **Smart Onboarding**: Research-backed goal wizard (built from 659 student interviews)
- **Multi-Region Support**: Tailored advice for US, UK, and EU markets
- **Goal Templates**: Pre-configured templates for common financial goals
- **Progress Tracking**: Visual progress tracking with milestone celebrations

### 🤖 AI-Powered Financial Coach

- **Claude 4.5 Sonnet Integration**: Advanced AI for personalized financial advice
- **RAG-Enhanced Responses**: Two-phase retrieval system combining:
  - **Phase 1**: User's financial context (debts, bills, goals, net worth)
  - **Phase 2**: Vector search across knowledge base for relevant content
- **Context-Aware**: Advice tailored to your specific goals, region, and financial situation
- **Conversation History**: Maintains context across chat sessions

### 📊 Comprehensive Financial Tools

- **Budget Tracker**: Monthly budgeting with category tracking
- **Expense Management**: Track spending across multiple categories
- **Bill Reminders**: Never miss a payment with smart reminders
- **Debt Payoff Calculator**: Compare strategies (avalanche vs snowball)
- **Savings Calculator**: Plan your savings journey
- **Net Worth Tracking**: Track assets and liabilities over time

### 💳 Credit Score Education

- **Credit Tips**: Region-specific tips for building, maintaining, and repairing credit
- **Educational Content**: Articles and FAQs on credit management
- **Interactive Guidance**: Get personalized credit advice from AI coach

### 🔒 Subscription & Authentication

- **Whop Integration**: Seamless payment and subscription management
- **Premium Features**: Unlock unlimited AI coaching and advanced tools
- **User Management**: Secure user authentication and data storage

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/) or use [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres))
- **npm** or **yarn**

### Installation

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd networth-mvp
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   ```

4. **Configure environment variables** in `.env.local`:

   ```env
   # Database (Required)
   DATABASE_URL=postgresql://user:password@localhost:5432/networth_dev

   # Anthropic AI (Required)
   ANTHROPIC_API_KEY=your_anthropic_api_key_here

   # Whop Integration (Required)
   WHOP_API_KEY=your_whop_api_key_here
   NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id_here

   # Optional: Development user ID
   NEXT_PUBLIC_WHOP_DEV_USER_ID=dev_user_123
   ```

5. **Set up the database:**

   ```bash
   # Generate Prisma Client
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # Seed initial data (optional)
   npm run db:seed
   ```

6. **Populate knowledge base with embeddings** (optional, for RAG):

   ```bash
   npm run vector:embed
   ```

7. **Start the development server:**

   ```bash
   npm run dev
   ```

8. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```text
networth-mvp/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── chat/                 # AI chat endpoint with RAG
│   │   ├── check-access/         # Premium access verification
│   │   ├── content/              # Content management
│   │   │   ├── tips/            # Credit tips API
│   │   │   └── templates/       # Goal templates API
│   │   ├── daily-tip/           # Daily tip generator
│   │   ├── user/goal/           # User goal management
│   │   └── whop/                # Whop integration endpoints
│   ├── coach/                    # AI Coach chat interface
│   ├── credit-score/            # Credit score education
│   ├── dashboard/               # Main dashboard
│   ├── onboarding/              # Goal setup wizard
│   ├── subscribe/               # Subscription page
│   ├── tools/                   # Financial tools hub
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page router
│   └── providers.tsx            # React context providers
├── components/                   # React components
│   ├── ui/                      # Reusable UI components
│   ├── BillReminders.tsx        # Bill management
│   ├── BudgetTracker.tsx        # Budget tracking
│   ├── DebtPayoffCalculator.tsx # Debt strategies
│   ├── GoalTemplates.tsx        # Goal selection
│   ├── NetWorthDashboard.tsx    # Net worth visualization
│   ├── Navigation.tsx           # App navigation
│   ├── SavingsCalculator.tsx    # Savings planning
│   └── SubscriptionGate.tsx      # Premium gate
├── lib/                          # Core libraries
│   ├── ai.ts                     # Claude AI integration
│   ├── calculations.ts           # Financial calculations
│   ├── db.ts                     # Database operations
│   ├── firstSteps.ts             # Goal-specific first steps
│   ├── prisma.ts                 # Prisma client singleton
│   ├── regions.ts               # Region-specific configs
│   ├── types.ts                 # TypeScript types
│   ├── utils.ts                 # Utility functions
│   ├── vector.ts                # Vector search & RAG
│   └── whop.ts                  # Whop SDK integration
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Database seeding
├── scripts/
│   └── embed-content.ts         # Knowledge base embedding script
└── public/                       # Static assets
```

---

## 🏗️ Architecture

### Database Schema

The application uses **PostgreSQL** with **Prisma ORM** for data management:

- **User Management**: User profiles with Whop integration
- **Financial Data**: Goals, budgets, expenses, debts, bills, net worth snapshots
- **Content Management**: Articles, FAQs, credit tips, goal templates
- **Vector Search**: Knowledge base with OpenAI embeddings for RAG

### AI Integration

#### Retrieval-Augmented Generation (RAG)

The AI coach uses a two-phase RAG system:

1. **Phase 1 - User Context**: Retrieves user's financial data (goals, debts, bills, net worth)
2. **Phase 2 - Knowledge Base**: Vector search across embedded financial content

This ensures responses are both personalized and factually accurate.

#### Vector Search

- **Model**: OpenAI `text-embedding-3-large` (3072 dimensions)
- **Similarity**: Cosine similarity with configurable thresholds
- **Content Types**: Credit tips, FAQs, articles, guides
- **Region Filtering**: Content filtered by user's region (US/UK/EU)

---

## 🎨 Tech Stack

### Core

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)

### Backend

- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **AI**: [Claude 4.5 Sonnet](https://www.anthropic.com/) (Anthropic)
- **Vector Search**: [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)

### Services

- **Authentication & Payments**: [Whop](https://whop.com/)
- **Financial Calculations**: [financial](https://www.npmjs.com/package/financial)

---

## 📊 Database Setup

### Using Vercel Postgres (Recommended)

1. Create a Postgres database in [Vercel Dashboard](https://vercel.com/docs/storage/vercel-postgres)
2. Copy the connection string to `.env.local` as `DATABASE_URL`
3. Run migrations: `npm run db:migrate`

### Using Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:

   ```bash
   createdb networth_dev
   ```

3. Update `DATABASE_URL` in `.env.local`
4. Run migrations: `npm run db:migrate`

### Using Docker

```bash
docker run --name networth-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=networth_dev \
  -p 5432:5432 \
  -d postgres:14
```

---

## 🔐 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API key for Claude AI |
| `WHOP_API_KEY` | ✅ | Whop server-side API key |
| `NEXT_PUBLIC_WHOP_COMPANY_ID` | ✅ | Your Whop company ID |
| `OPENAI_API_KEY` | ✅ | OpenAI API key for embeddings (if using vector search) |
| `NEXT_PUBLIC_WHOP_DEV_USER_ID` | ❌ | Development user ID for testing |

Get your API keys:

- **Anthropic**: [console.anthropic.com](https://console.anthropic.com/)
- **OpenAI**: [platform.openai.com](https://platform.openai.com/)
- **Whop**: [dash.whop.com](https://dash.whop.com)

---

## 🚢 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Import project** in [Vercel Dashboard](https://vercel.com)
3. **Add environment variables**:
   - `DATABASE_URL` (use Vercel Postgres)
   - `ANTHROPIC_API_KEY`
   - `WHOP_API_KEY`
   - `NEXT_PUBLIC_WHOP_COMPANY_ID`
   - `OPENAI_API_KEY`
4. **Deploy**

```bash
# Or use Vercel CLI
npm i -g vercel
vercel
```

### Other Platforms

The app can be deployed to any Node.js hosting platform:

- **Netlify**: Use Next.js plugin
- **Railway**: One-click PostgreSQL deployment
- **Render**: Database + web service
- **AWS/GCP/Azure**: Full control deployment

---

## 📈 Features in Detail

### Goal Management

- Choose from pre-configured templates or create custom goals
- Set target amounts and timeframes
- Track progress with visual indicators
- Receive personalized first steps based on goal type and region

### Budget Tracking

- Create monthly budgets by category
- Track expenses against budgets
- Visual spending analysis
- Multi-category support

### Debt Management

- Track multiple debts
- Compare payoff strategies:
  - **Avalanche**: Pay highest interest first
  - **Snowball**: Pay smallest balance first
- Calculate optimal payment schedules

### Net Worth Tracking

- Track assets (savings, investments, property)
- Track liabilities (loans, credit cards)
- Historical snapshots
- Visual progress over time

### AI Coach

- Natural language financial questions
- Context-aware responses
- Conversation history
- Region-specific advice
- RAG-powered accuracy

---

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:migrate   # Run migrations
npm run db:generate  # Generate Prisma Client
npm run db:seed      # Seed database
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database

# Vector Search
npm run vector:embed # Generate embeddings for knowledge base
```

### Database Management

```bash
# Create a new migration
npm run db:migrate -- --name add_new_feature

# Reset database (development only)
npm run db:reset

# Open Prisma Studio (visual database browser)
npm run db:studio
```

---

## 🐛 Troubleshooting

### Database Connection Issues

**Error**: `Can't reach database server`

- Verify PostgreSQL is running: `pg_isready`
- Check `DATABASE_URL` format: `postgresql://user:password@host:port/database`
- Ensure database exists: `CREATE DATABASE networth_dev;`

### Prisma Client Errors

**Error**: `Property 'knowledgeBase' does not exist`

```bash
npm run db:generate
```

### AI API Errors

**Error**: `Failed to get response`

- Verify `ANTHROPIC_API_KEY` is set correctly
- Check API key has sufficient credits
- Review API rate limits

### Vector Search Not Working

**Error**: `Embedding generation failed`

- Ensure `OPENAI_API_KEY` is set
- Run `npm run vector:embed` to populate knowledge base
- Check OpenAI API credits

### TypeScript Errors

```bash
npm install
npm run db:generate
```

---

## 📊 Research Foundation

This application is built on extensive research:

- **659 total participants**
  - 552 student quiz responses
  - 19 in-depth interviews
  - 4 expert interviews
  - 60 co-creation sessions

### Key Insights

- 53.2% average financial literacy score
- 43% prioritize house buying
- 79% don't understand credit scores
- Students prefer app-based solutions
- Goal-based approach increases engagement

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**:

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make your changes**
4. **Write/update tests** if applicable
5. **Commit your changes**:

   ```bash
   git commit -m 'Add amazing feature'
   ```

6. **Push to your branch**:

   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful commit messages
- Update documentation for new features
- Test database migrations before committing
- Keep components modular and reusable

### Code Style

- Use ESLint configuration (included)
- Follow Next.js conventions
- Use Tailwind CSS for styling
- Leverage TypeScript types for type safety

---

## 📝 License

Built for educational purposes. Research data © Networth Group Ltd 2024.

---

## 🆘 Support

- **Documentation**: Check code comments and inline docs
- **Issues**: Open an issue on GitHub
- **Research**: Refer to `networth.pdf` for design decisions

---

## 🙏 Acknowledgments

- Built with research insights from 659 students
- Powered by Claude AI for intelligent financial guidance
- Designed for clarity and user empowerment

---

**Built with ❤️ for students and young professionals navigating their financial journey.**
