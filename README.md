# ArchSync

Architecture documentation and search platform built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **Next.js 14** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **Supabase** for database and authentication
- **Google Generative AI** for embeddings
- **Zustand** for state management
- **Recharts** for data visualization
- **React Hot Toast** for notifications
- Dark theme with clean, minimal UI

## Project Structure

```
/app          - Next.js pages and routes
/components   - React components
/lib          - Utilities and API clients
/types        - TypeScript type definitions
```

## Getting Started

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `GEMINI_API_KEY` - Your Google Generative AI API key

3. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Libraries

- **@supabase/supabase-js** - Supabase client
- **@google/generative-ai** - Google Generative AI client
- **zustand** - State management
- **recharts** - Charts and data visualization
- **lucide-react** - Icons
- **react-hot-toast** - Toast notifications
- **clsx** - Utility for constructing className strings
