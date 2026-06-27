# Contributing

Thanks for your interest in improving this project!

## Code Style

- TypeScript strict mode is enabled.
- ESLint + Prettier are configured. Run `npm run format` before committing.
- Keep components small and focused. Co-locate styles, tests, and helpers near the code they support.

## Database Changes

- Add new migrations as timestamped files in `sql/` (e.g., `20260630120000_description.sql`).
- Run them against your Supabase project via the SQL Editor before pushing.
- Do not edit existing migration files once they have been applied to a shared database.

## Branches

- Use descriptive branch names: `feature/add-book-search`, `fix/profile-upload-rls`.
- Open a pull request with a clear description of the change and any setup steps.

## Environment Variables

- `.env` is gitignored. Copy `.env.example` to `.env` and fill in your values.
- Never commit real secrets.

## Commits

Use clear, descriptive messages. Example:

```
feat(submissions): add book cover preview in admin panel
fix(profile): update RLS policy to allow avatar upsert
docs: clarify storage bucket setup steps
```
