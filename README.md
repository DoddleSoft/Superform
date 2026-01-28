# Superform

A form builder application built with Next.js.

## Tech Stack

### Authentication
- **Clerk**: Handles user authentication and management.
- **Middleware**: Protected routes (`/dashboard`) are configured in `middleware.ts`.

### Backend & Database
- **Supabase**: PostgreSQL database and backend services.
- **Integration**: Uses Clerk tokens for Row Level Security (RLS) via a custom `useSupabase` hook.

### UI & Styling
- **Tailwind CSS v4**: Utility-first CSS framework.
- **DaisyUI**: Component library for Tailwind CSS.
- **Theming**: Supports Light/Dark modes with cookie-based persistence (server-side rendering support).

## Getting Started

1. **Environment Variables**:
   Ensure `.env.local` is configured with:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

2. **Run Development Server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```
