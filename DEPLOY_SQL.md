# Deploy SQL to Supabase

## Quick Deployment (Recommended)

Use the **Supabase Dashboard SQL Editor** to deploy the schema:

### Steps:

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com/project/jdedjqkailqsoquriwee

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Deploy Production Schema**
   - Copy the entire contents of `supabase-production-schema.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify Tables Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `user_profiles`
     - `ai_provider_settings`
     - `documents`
     - `analyses`
     - `queries`

## Alternative: Using Supabase CLI (Requires Docker)

If you have Docker Desktop running:

```bash
# Start Docker Desktop first, then run:
npx supabase db push --db-url "postgresql://postgres:YOUR_DB_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

**Note:** You need to get your database password from:

- Supabase Dashboard → Settings → Database → Connection string → Password

## Files

- `supabase-production-schema.sql` - Main database schema (deploy this first)
- `add-base-url-column.sql` - Migration to add base_url column (already included in production schema)
- `final-cleanup.sql` - Cleanup script to remove test providers (run manually if needed)

## Connection Details

- **Project ID**: `jdedjqkailqsoquriwee`
- **Database URL**: `https://jdedjqkailqsoquriwee.supabase.co`
- **Dashboard**: https://app.supabase.com/project/jdedjqkailqsoquriwee
