# Book Reading App

A modern web application for reading and managing books with features like bookmarks, favorites, reading progress tracking, ratings, and reviews.

## Features

- Browse and read books from Project Gutenberg
- User authentication (sign up / sign in)
- Bookmark pages and add notes
- Track reading progress
- Rate books (1-5 stars)
- Write and read reviews
- Save favorite books
- Admin panel for managing books
- Reading streak tracking
- Responsive design with dark/light mode

## Tech Stack

- **Frontend**: React 19, TypeScript, TanStack Router
- **Backend**: Supabase (PostgreSQL database, authentication, storage)
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Build Tool**: Vite

## Prerequisites

Before running this application, you need:

1. **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
2. **npm** or **bun** package manager
3. **Supabase account** - [Sign up free](https://supabase.com/)

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install
```

Or if you use bun:

```bash
bun install
```

### Step 2: Set Up Supabase Database

1. Go to [Supabase](https://supabase.com/) and create a new project
2. Once your project is ready, go to **Project Settings** → **API**
3. Copy the following values:
   - Project URL
   - `anon` / `public` API key (publishable key)
   - `service_role` API key (secret key)

4. Go to the **SQL Editor** in your Supabase dashboard
5. Run the following migration files in order (found in the `supabase/migrations/` folder):

   **Important**: Run these in the Supabase SQL Editor in this order:
   
   a. `20260610194325_2d225e50-867d-4775-9d7e-a158b19bd789.sql` - Creates main tables (profiles, books, favorites, bookmarks, reading_progress)
   
   b. `20260610194341_f5b2dee1-1464-4325-a6f4-ce01a5b659bc.sql` - Security configuration
   
   c. `20260613120000_admin_book_policies.sql` - Admin functionality
   
   d. `20260613130000_books_storage.sql` - Storage bucket for books
   
   e. `20260617024500_book_ratings_reviews.sql` - Ratings and reviews system

6. After running the migrations, add your email as an admin:
   ```sql
   INSERT INTO public.admin_emails (email) VALUES ('your-email@example.com');
   ```
   Replace `'your-email@example.com'` with the email you'll use to sign in.

### Step 3: Configure Environment Variables

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and replace the placeholder values with your Supabase credentials:
   ```
   SUPABASE_PROJECT_ID=your-project-id
   SUPABASE_PUBLISHABLE_KEY=your-anon-key
   SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PROJECT_ID=your-project-id
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Step 4: Run the Application

```bash
npm run dev
```

Or with bun:

```bash
bun run dev
```

The app will be available at `http://localhost:5173`

## Database Structure

The application uses the following main tables:

### Core Tables

- **profiles** - User profile information (display name, avatar)
- **books** - Book catalog with metadata (title, author, description, cover, content URL)
- **favorites** - User's favorite books
- **bookmarks** - User's bookmarks with page numbers and notes
- **reading_progress** - Tracks last page read for each user/book

### Additional Tables

- **ratings** - User ratings for books (1-5 stars)
- **reviews** - User reviews for books
- **admin_emails** - List of admin email addresses

### Storage

- **books bucket** - Stores PDF files and cover images for books

## Important Notes

### Database Persistence

**Yes, the database will work on another PC!** Here's why:

1. **Supabase is cloud-based**: The database is hosted on Supabase's servers, not locally
2. **Same data everywhere**: As long as you use the same Supabase project credentials, all users will see the same data
3. **No local database needed**: The app connects to the remote Supabase database via the internet

### What Works on Another PC

If your teacher runs this on another computer:

✅ **Everything works** as long as:
- They have the correct `.env` file with your Supabase credentials
- They have Node.js installed
- They run `npm install` to install dependencies
- The Supabase migrations have been run (you only need to do this once)

✅ **All data is preserved**: Books, user accounts, bookmarks, reviews, etc. are all stored in the cloud

✅ **Multi-user support**: Multiple people can use the app simultaneously and see each other's data (reviews, ratings, etc.)

### What Your Teacher Needs to Do

1. Install Node.js from https://nodejs.org/
2. Extract the project files
3. Copy the `.env` file you provide (with your Supabase credentials)
4. Run `npm install`
5. Run `npm run dev`
6. Open `http://localhost:5173` in a browser

**That's it!** No database installation or configuration needed on their end.

## Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── admin/          # Admin-specific components
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Third-party integrations (Supabase)
│   ├── lib/                # Utility functions and API calls
│   │   └── api/            # API function definitions
│   └── routes/             # TanStack Router pages
│       └── _authenticated/ # Protected routes
├── supabase/
│   └── migrations/         # Database migration files
├── public/                 # Static assets
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Troubleshooting

### "Module not found" errors
Make sure you ran `npm install` successfully.

### Database connection errors
- Verify your `.env` file has the correct Supabase credentials
- Check that you ran all migration files in the SQL Editor
- Ensure your Supabase project is active (not paused)

### Books not loading
- Check that the books storage bucket was created (migration 20260613130000)
- Verify the seed data was inserted (migration 20260610194325)

### Can't sign in as admin
- Make sure you added your email to the `admin_emails` table
- Check that you're using the same email you inserted

## License

This project was created for educational purposes.

## Support

If you encounter any issues, check:
1. Supabase dashboard logs for database errors
2. Browser console for frontend errors
3. Terminal output when running `npm run dev`