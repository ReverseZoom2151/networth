# Networth MVP - AI-Powered Financial Coach

An AI-driven financial literacy app for UK university students, built with Next.js and Claude AI.

## 🎯 Features

- **Smart Onboarding**: Goal-based wizard (based on research with 659 students)
- **AI Financial Coach**: Powered by Claude 3.5 Sonnet for personalized advice
- **Goal Tracking**: Track progress toward house deposits, travel, family goals, etc.
- **Daily Tips**: AI-generated financial tips tailored to your goal
- **Interactive Chat**: Ask any financial question, get instant answers

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Installation

1. **Clone and install dependencies:**

   ```bash
   cd networth-mvp
   npm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.local.example .env.local
   ```

3. **Add your API keys to `.env.local`:**

   ```env
   ANTHROPIC_API_KEY=your_actual_key_here
   ```

4. **Run the development server:**

   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```text
networth-mvp/
├── app/
│   ├── api/
│   │   ├── chat/route.ts        # AI chat endpoint
│   │   └── daily-tip/route.ts   # Daily tip generator
│   ├── dashboard/page.tsx       # Main dashboard
│   ├── onboarding/page.tsx      # Goal setup wizard
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page (router)
│   └── globals.css              # Global styles
├── lib/
│   ├── ai.ts                    # Claude AI integration
│   ├── types.ts                 # TypeScript types
│   └── utils.ts                 # Utility functions
└── public/                      # Static assets
```

## 🤖 AI Integration

The app uses **Claude 3.5 Sonnet** for:

- Personalized financial coaching
- Context-aware advice based on user goals
- Daily financial tips
- Real-time Q&A

### AI Features

- ✅ Goal-specific context
- ✅ UK-focused advice (ISAs, student loans, etc.)
- ✅ Student-friendly language
- ✅ Research-backed responses

## 🎨 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Claude 3.5 Sonnet (Anthropic)
- **Deployment Ready**: Vercel, Netlify, or any Node.js host

## 📊 Based on Real Research

This MVP is built on findings from:

- 552 student quiz responses
- 19 in-depth interviews
- 4 expert interviews
- 60 co-creation sessions
- 659 total participants

Key insights:

- 53.2% average financial literacy score
- 43% prioritize house buying
- 79% don't understand credit scores
- Students want app-based solutions

## 🔐 Data Storage

**Current (MVP)**: localStorage
**Production**: Add your preferred database:

- Supabase
- PlanetScale
- MongoDB
- PostgreSQL

## 🚢 Deployment

### Vercel (Recommended)

```bash
npm run build
# Deploy to Vercel
vercel
```

### Environment Variables

Make sure to add these in your hosting platform:

- `ANTHROPIC_API_KEY`

## 💡 Future Enhancements

- [ ] User authentication
- [ ] Database integration
- [ ] Bank account connections (Open Banking)
- [ ] Spending analysis
- [ ] Budget tracking
- [ ] Goal milestones
- [ ] Community features
- [ ] Mobile app

## 🐛 Troubleshooting

**"Failed to get response"**: Check your Anthropic API key in `.env.local`

**Page won't load**: Ensure you're running on [http://localhost:3000](http://localhost:3000)

**TypeScript errors**: Run `npm install` again

## 📝 License

Built for educational purposes. Research data © Networth Group Ltd 2024.

## 🤝 Contributing

This is an MVP. To improve it:

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

Questions? Check the research PDF for insights into the design decisions.

---

Built with ❤️ for university students struggling with finances.
