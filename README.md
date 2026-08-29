# JobSwipe AI 🚀

AI-powered job application automation platform. Upload your resume, swipe on matching jobs, and let AI automatically send personalized applications to recruiters.

## Features

- 🤖 AI Resume Parsing & Customization
- 📱 Tinder-style Job Swipe Interface
- 📧 Auto-send personalized emails to recruiters
- 🔍 Hunter.io integration for finding real recruiter emails
- 💳 Razorpay payment integration
- 📊 Analytics dashboard
- 🎯 Real-time job scraping from Remotive, Arbeitnow, HackerNews

## Tech Stack

- **Frontend**: Next.js 16, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **AI**: Google Gemini 2.0 Flash
- **Payments**: Razorpay
- **Email**: Gmail SMTP (Nodemailer)
- **Contact Finding**: Hunter.io API

## Getting Started

1. Clone the repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and fill in your API keys
4. Run `npx prisma db push`
5. Run `npm run dev`

## Environment Variables

See `.env.example` for all required environment variables.

## Deployment

Deploy to Vercel:

```bash
npx vercel
```

## License

MIT
