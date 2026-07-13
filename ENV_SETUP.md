# VATTAMS Home Services - Environment Variables Configuration

## Required Environment Variables

These variables must be set in `.env` for the application to function:

### Supabase Configuration
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anonymous-key
```

**Where to find these values:**
1. Go to your Supabase project dashboard: https://supabase.com
2. Navigate to **Project Settings** → **API**
3. Copy the **Project URL** → `VITE_SUPABASE_URL`
4. Copy the **anon key** (public, safe for client-side) → `VITE_SUPABASE_ANON_KEY`
5. **Never use the service role key or database password in client-side code**

## Vercel Environment Setup

For production deployment on Vercel, set these variables in your Vercel project settings:

**Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Add both variables with production values
3. Select **Production** environment
4. Deploy triggers a rebuild with the new values

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anonymous-key
```

## Local Development

1. Create a `.env` file in the project root:
```bash
cp .env.example .env
```

2. Fill in your Supabase credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anonymous-key
```

3. Start dev server:
```bash
npm install
npm run dev
```

## Supabase Configuration (Dashboard Settings)

After setting environment variables, configure these in your Supabase project:

### Auth Settings (Project Settings → Auth → Configuration)

**Site URL:**
```
https://vattams.net
```

**Redirect URLs** (add all):
```
https://vattams.net
https://www.vattams.net
https://*.vercel.app
http://localhost:5173
```

These allow Supabase to redirect users after authentication.

## Security Notes

- ✅ `VITE_SUPABASE_ANON_KEY` is safe to expose (it's anonymous and public)
- ✅ Environment variables are embedded in the build at compile time
- ❌ Never commit `.env` file with real credentials to version control
- ❌ Never use Supabase service role keys in client-side code
- ❌ Always use Row-Level Security (RLS) policies in Supabase to protect data

## Verification

After deploying, verify authentication works:

1. **Local:** `npm run dev` → http://localhost:5173/login
2. **Production:** https://vattams.net/login
3. Test login with:
   - Customer account
   - Technician account
   - Admin account

If authentication fails, check:
1. Supabase project is active
2. Environment variables are correctly set
3. Redirect URLs are configured in Supabase dashboard
4. Check browser console for detailed error messages

## Troubleshooting

**Error: "Cannot find module '@supabase/supabase-js'"**
- Solution: Run `npm install`

**Error: "Invalid API key"**
- Solution: Check VITE_SUPABASE_ANON_KEY is correct in Supabase dashboard

**Error: "Redirect URL mismatch"**
- Solution: Add your domain to Redirect URLs in Supabase → Project Settings → Auth → Configuration

**Auth session not persisting after refresh**
- Solution: Check browser localStorage is not disabled
- Ensure `persistSession: true` in `src/lib/supabase.ts`
- Check browser console for Supabase errors

## Build & Deploy

```bash
# Build for production
npm run build

# Output in dist/ folder ready for Vercel
# Vercel automatically detects the build and serves it

# Preview production build locally
npm run preview
```
