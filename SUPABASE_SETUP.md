# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for the Daily Pending Manager app.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Node.js and npm installed

## Step 1: Install Dependencies

```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Step 2: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in your project details:
   - Name: `daily-pending-manager` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to your users
4. Wait for the project to be created (takes ~2 minutes)

## Step 3: Get API Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 4: Configure Environment Variables

1. Create a `.env.local` file in the root of your project (copy from `.env.local.example`)
2. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with the values from Step 3.

## Step 5: Run Database Migration

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click "Run" to execute the migration
5. Verify the tables were created by checking **Table Editor** → You should see:
   - `profiles`
   - `user_plans`
   - `user_settings`
   - `tasks`

## Step 6: Enable Email Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Make sure **Email** provider is enabled
3. (Optional) Configure email templates under **Authentication** → **Email Templates**

## Step 7: Test the Application

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000`
   - You should be redirected to `/login`

3. Create a new account:
   - Click "Sign up"
   - Enter email and password (minimum 6 characters)
   - You'll be redirected to the main dashboard

4. Test data persistence:
   - Add a task
   - Refresh the page
   - Task should persist (stored in Supabase)

## Features Implemented

✅ Email/Password Authentication
- Login page (`/login`)
- Signup page (`/signup`)
- Protected routes (middleware redirects to login)
- Session management

✅ Data Storage
- Tasks stored in Supabase `tasks` table
- User profiles in `profiles` table
- User plans in `user_plans` table
- User settings in `user_settings` table

✅ Data Migration
- Automatic detection of localStorage data
- Migration modal prompts user to import existing tasks
- One-time import on first login

✅ Logout
- Sign out button in Account & Plan sheet
- Clears session and redirects to login

## Database Schema

### Tables Created

1. **profiles** - User profile information
2. **user_plans** - User subscription plans (free/basic)
3. **user_settings** - User preferences (onboarding status, etc.)
4. **tasks** - User tasks/items

### Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:
- Users can only access their own data
- Users can only insert/update/delete their own records

## Troubleshooting

### "Invalid API key" error
- Verify your `.env.local` file has correct values
- Restart your development server after changing `.env.local`

### "relation does not exist" error
- Make sure you ran the migration SQL script
- Check that tables exist in Supabase Table Editor

### Redirect loop on login
- Check middleware configuration
- Verify Supabase URL and keys are correct

### Tasks not saving
- Check browser console for errors
- Verify RLS policies are correctly set
- Check Supabase logs in dashboard

## Next Steps

- Configure email templates for better UX
- Set up email verification (optional)
- Add password reset functionality
- Configure custom domain (optional)
