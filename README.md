# 🏗️ ArchSync - Project Intelligence Platform

> Transform team architecture knowledge into actionable insights using AI-powered semantic search and consensus analysis.

ArchSync helps development teams capture, organize, and discover architectural decisions and understandings. Built with Next.js 14, Supabase, and Google Generative AI.

## ✨ Key Features

### 📚 **Knowledge Management**
- **Project Documentation**: Store HLD (High-Level Design) and LLD (Low-Level Design) documents
- **Team Understandings**: Capture developer insights with confidence scores
- **Module Organization**: Group understandings by architectural modules

### 🤖 **AI-Powered Search**
- **Semantic Search**: Natural language queries using Google Gemini embeddings
- **Vector Similarity**: pgvector-powered similarity search
- **Multi-Source**: Searches understandings, HLD, and LLD documents
- **Smart Ranking**: Combines text matching and semantic similarity

### 📊 **Consensus Analysis** (Star Feature!)
- **Team Alignment**: Visualize how aligned your team is on architectural decisions
- **Clustering**: Automatically groups similar understandings
- **Visual Insights**: Bar charts and color-coded consensus scores
- **Actionable**: Identifies areas needing team discussion

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account ([sign up free](https://supabase.com))
- Google AI API key ([get one here](https://makersuite.google.com/app/apikey))

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd archsync
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**

Create a new Supabase project, then run the SQL schema:

```bash
# Copy the contents of supabase/schema.sql
# Paste and run in Supabase SQL Editor
```

This creates:
- `projects` and `understandings` tables
- pgvector extension for embeddings
- Search function for semantic queries
- RLS policies

4. **Configure environment variables**

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Fill in your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_google_ai_api_key
```

5. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 📖 Usage Guide

### Creating a Project
1. Click "New Project" on the home page
2. Enter project name
3. Optionally paste HLD/LLD documents
4. Click "Create Project"

### Adding Understandings
1. Open a project
2. Click "Add Understanding"
3. Fill in:
   - Your name
   - What you changed
   - Module name
   - Your understanding (max 200 chars)
   - Confidence level (1-5)
4. Submit - AI generates embeddings automatically

### Analyzing Consensus
1. Go to "Consensus" tab
2. Select a module
3. Click "Analyze Consensus"
4. View team alignment and clusters

### Searching
1. Go to "Search" tab
2. Ask questions in natural language
3. View ranked results with relevance scores

## 🏗️ Project Structure

```
archsync/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── projects/         # Project CRUD
│   │   ├── understandings/   # Understanding CRUD + embeddings
│   │   ├── consensus/        # Consensus analysis
│   │   └── search/           # Semantic search
│   ├── project/              # Project pages
│   │   ├── new/              # Create project
│   │   └── [id]/             # Project detail (tabs)
│   └── layout.tsx            # Root layout
├── components/               # React components
│   ├── AddUnderstandingModal.tsx
│   ├── ConsensusView.tsx
│   ├── SemanticSearch.tsx
│   ├── UnderstandingCard.tsx
│   ├── AppLayout.tsx         # Responsive layout
│   ├── ErrorBoundary.tsx     # Error handling
│   └── LoadingSkeletons.tsx  # Loading states
├── lib/                      # Utilities
│   ├── supabase.ts           # Supabase client
│   ├── gemini.ts             # AI embeddings
│   ├── clustering.ts         # Consensus algorithms
│   └── db-types.ts           # TypeScript types
└── supabase/
    └── schema.sql            # Database schema
```

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications

### Backend & AI
- **Supabase** - PostgreSQL database with pgvector
- **Google Generative AI** - Text embeddings (text-embedding-004)
- **pgvector** - Vector similarity search

### State & Utils
- **Zustand** - State management
- **clsx** - Conditional classes

## 🎯 Key Algorithms

### Consensus Analysis
1. **Embedding Generation**: Each understanding gets a 768-dim vector
2. **Cosine Similarity**: Calculates similarity between all pairs
3. **Clustering**: Groups similar understandings (threshold: 0.75)
4. **Representative Selection**: Picks most central understanding per cluster
5. **Consensus Score**: Largest cluster size / total understandings

### Semantic Search
1. **Query Embedding**: Converts search query to vector
2. **Vector Search**: Uses pgvector's `<=>` operator for cosine distance
3. **Text Search**: ILIKE matching on all text fields
4. **Result Merging**: Deduplicates and ranks by relevance

## 🚧 Future Enhancements

- [ ] **Authentication**: User accounts and team workspaces
- [ ] **Real-time Collaboration**: Live updates when team adds understandings
- [ ] **Version History**: Track changes to understandings over time
- [ ] **Export/Import**: Share projects between teams
- [ ] **Advanced Analytics**: Trend analysis, developer insights
- [ ] **Integration**: Slack/Discord notifications
- [ ] **Mobile App**: Native iOS/Android apps

## 📝 License

MIT License - feel free to use this project for your team!

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 💡 Tips

- **Confidence Scores**: Use 1-2 for exploratory ideas, 3 for working solutions, 4-5 for proven approaches
- **Module Names**: Be consistent - use the same names across understandings
- **Understanding Text**: Be concise but specific - focus on "why" not just "what"
- **Search Queries**: Ask questions naturally - "How does X work?" works better than keywords

## 🐛 Troubleshooting

**Embeddings not generating?**
- Check your `GEMINI_API_KEY` is valid
- Ensure you have API quota remaining

**Consensus analysis fails?**
- Need at least 2 understandings in the same module
- Check that embeddings were generated (look for similarity scores)

**Search returns no results?**
- Verify understandings exist in the database
- Check Supabase connection
- Try simpler search terms

---

Built with ❤️ for development teams who value shared understanding.
