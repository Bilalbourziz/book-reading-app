# Project Reference — Book Reading App

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
- Supabase account

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and add your Supabase credentials.
3. Run SQL migrations from `sql/` in the Supabase SQL Editor.
4. Create storage buckets `books` and `avatars` via Storage → Buckets.
5. `npm run dev` → open `http://localhost:5173`

## Database Structure

### Core Tables

- **profiles** — display name, avatar
- **books** — title, author, description, cover, content URL
- **favorites** — user-book saved pairs
- **bookmarks** — per-user page positions
- **submissions** — user book submissions pending approval
- **ratings** — 1–5 star ratings
- **reviews** — text reviews
- **admin_emails** — allowlisted admin addresses

### Storage Buckets

- **books** — PDFs and cover images
- **avatars** — profile pictures

## Project Structure

```text
├── src/
│   ├── components/
│   │   ├── admin/          # Admin-specific components
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Third-party integrations (Supabase, Lovable)
│   ├── lib/                # Utilities, API calls, server config
│   │   └── api/            # API function definitions
│   └── routes/             # TanStack Router pages
│       └── _authenticated/ # Protected routes
├── sql/
│   ├── supabase/migrations/ # Supabase CLI migrations
│   ├── seed/                # Seed data
│   └── *.sql                # Manual migration files
├── public/                  # Static assets
├── .env.example            # Environment variables template
├── package.json
└── tsconfig.json
```

## Building for Production

```bash
npm run build
```

Output is in `dist/`.

## Troubleshooting

### Module not found
Run `npm install`.

### Database connection errors
- Verify `.env` credentials
- Check that migrations ran successfully
- Ensure your Supabase project is not paused

### Books not loading
- Check that the `books` storage bucket exists and policies are correct
- Verify seed data was inserted

### Profile / avatar update blocked
- Add or update the `profiles` UPDATE/INSERT policies
- The `avatars` bucket needs INSERT/UPDATE/SELECT/DELETE policies for authenticated users

### Can't sign in as admin
- Add your email to `admin_emails`
- Use the exact same email when signing in

## Policy Configuration

See `docs/SUPABASE_POLICIES_GUIDE.md` for exact UI clicks when creating RLS and Storage policies.
