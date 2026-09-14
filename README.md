# ODCHC NMIS Frontend

The ODCHC Network Management Information System frontend is a React, TypeScript, Vite, Supabase, TailwindCSS, and TanStack Query application for provider, enrolment, financial, inspection, and operational workflows.

## Requirements

Use Node.js 20 or newer and pnpm. Install dependencies with `pnpm install`.

## Environment

Create a local `.env.local` file from `.env.example` and provide the Supabase project URL and publishable/anonymous key:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-key
```

Environment files are intentionally ignored by Git. Production variables belong in the deployment provider’s environment settings, not in the repository.

## Development and validation

Run the local development server with `pnpm dev`. Run the production TypeScript and Vite validation with `pnpm build`. For the Android package workflow, run `pnpm mobile:build` after the Android toolchain is configured.

The application includes a top-level render error boundary. The accreditation inspection workflow persists unfinished form state locally and restores it after an Android/PWA reload or backgrounding event. Server drafts remain the authoritative record when they are available.

## Deployment

Deploy the repository through the authorized Vercel project connected to the GitHub repository. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Vercel project environment settings for Preview and Production as appropriate. Do not commit `.env.production` or other secret-bearing environment files.

## Repository hygiene

Generated dependencies, build output, local environment files, operational exports, and large data files are ignored. Operational scripts and data migrations should be reviewed separately from the browser application and should not be copied into the production build context.
