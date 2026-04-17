This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Configuration

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API and copy your project URL and anon key
3. Create a `.env.local` file in the root directory with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Schema

Create the `concursantes` table in Supabase with the following structure:

```sql
CREATE TABLE concursantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  ticket_bloqueado INTEGER NOT NULL,
  es_ganador BOOLEAN DEFAULT FALSE
);
```

### Admin Users

In `app/admin/page.tsx`, update the `ADMIN_EMAILS` array with the email addresses of your admin users:

```typescript
const ADMIN_EMAILS = ['admin1@example.com', 'admin2@example.com']; // Replace with actual admin emails
```

### Creating Admin Users

1. Go to Supabase Dashboard > Authentication > Users
2. Add the admin users manually or through the registration form
3. Note their email addresses for the `ADMIN_EMAILS` array

## Features

- **Landing Page**: Public page with login/register buttons
- **Authentication**: Login and registration using Supabase Auth
- **Admin Panel**: Only accessible to admin users (can select winners)
- **Sorteo Page**: Protected page showing the lottery animation and winner
- **User Registration**: Anyone can register, but only admins can manage winners

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Before deploying, add these environment variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Use the values from your Supabase project settings. The `.env.local` file is for local development only.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
