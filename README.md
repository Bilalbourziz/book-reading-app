# Book Reading App (Lumen)

A modern web application for reading and managing books, built with React 19, TanStack Router, and Supabase.

## Features

- Browse and read books from Project Gutenberg
- User authentication (sign up / sign in)
- Bookmark pages and add notes
- Rate books (1–5 stars) and write reviews
- Save favorite books
- Admin panel for managing books and user submissions
- Reading streak tracking
- Responsive design with dark/light mode
- Profile picture upload

## Tech Stack

- **Frontend**: React 19, TypeScript, TanStack Router
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Build**: Vite

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm or bun
- A Supabase project

## Get Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173`

## Database Setup

This app uses a cloud Supabase backend. Migrations and seed data are in `sql/`.

> **New developer?** Read `docs/REFERENCE.md` for the complete walkthrough.

1. Create a Supabase project.
2. Run the SQL files in `sql/` (and the `supabase/migrations/` subfolder if present) in order against the Supabase **SQL Editor**.
3. Create storage buckets `books` and `avatars` via the **Storage** UI.
4. Copy `.env.example` to `.env` and fill in your Supabase credentials.

## Project Structure

```
├── src/
│   ├── components/          # Reusable UI and admin components
│   │   ├── admin/           # Admin-only components
│   │   └── ui/              # shadcn/ui components
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Third-party integrations (Supabase)
│   ├── lib/                 # Utilities, API calls, server config
│   │   └── api/             # API function definitions
│   ├── routes/              # TanStack Router pages (file-based)
│   │   ├── _authenticated/  # Protected routes
│   │   └── README.md        # Router conventions reminder
│   ├── index.tsx
│   └── styles.css
├── sql/
│   ├── supabase/migrations/ # Supabase CLI migrations
│   ├── seed/                # Seed data
│   └── *.sql                # Manual migration files (run in order)
├── docs/
│   ├── DEPLOYMENT.md        # Production deployment guide
│   ├── REFERENCE.md         # Setup, DB schema, and troubleshooting
│   ├── SUPABASE_POLICIES_GUIDE.md  # Step-by-step RLS + Storage policy setup
│   └── archive/             # Historical/outdated setup notes
├── public/                  # Static assets
├── .env.example             # Environment variables template
├── CONTRIBUTING.md          # How to contribute
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## Documentation

| File | Purpose |
|------|---------|
| `docs/REFERENCE.md` | Setup instructions, database tables, troubleshooting |
| `docs/DEPLOYMENT.md` | Deploy to AWS/CloudFront, Vercel, or Netlify |
| `docs/SUPABASE_POLICIES_GUIDE.md` | Exact UI clicks for RLS and Storage policies |
| `src/routes/README.md` | TanStack Router file-convention cheat sheet |

## Contributing

See `CONTRIBUTING.md`.

## License

Educational project.
