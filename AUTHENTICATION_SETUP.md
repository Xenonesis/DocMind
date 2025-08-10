# DocMind Authentication Setup

This guide will help you set up real Supabase authentication for DocMind.

## Prerequisites

1. A Supabase account (sign up at https://supabase.com)
2. Node.js and npm installed
3. The DocMind project cloned locally

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Choose your organization
4. Enter a project name (e.g., "docmind-production")
5. Enter a database password (save this securely)
6. Choose a region close to your users
7. Click "Create new project"

## Step 2: Configure Environment Variables

1. In your Supabase dashboard, go to Settings > API
2. Copy your project URL and anon key
3. Update your `.env` file with the real values:

```env
NODE_ENV="production"

# Replace these with your actual Supabase project values
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 3: Set Up the Database Schema

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `supabase-production-schema.sql`
3. Paste it into the SQL Editor and run it
4. This will create all necessary tables with proper Row Level Security (RLS)

## Step 4: Configure Authentication Providers

### Email/Password Authentication (Default)
Email/password authentication is enabled by default. Users can sign up and sign in with their email.

### Social Authentication (Optional)

#### Google OAuth
1. Go to Settings > Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Go to Google Cloud Console
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs: `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

#### GitHub OAuth
1. Go to Settings > Authentication > Providers
2. Enable GitHub provider
3. Add your GitHub OAuth credentials:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Create a new OAuth App
   - Set Authorization callback URL: `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy Client ID and Client Secret to Supabase

## Step 5: Configure Site URL and Redirect URLs

1. In Supabase dashboard, go to Settings > Authentication > URL Configuration
2. Set Site URL to your production domain (e.g., `https://yourdomain.com`)
3. Add Redirect URLs:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

## Step 6: Test Authentication

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000`
3. Click "Sign Up" and create a new account
4. Verify that you can sign in and access the dashboard
5. Check that documents are properly isolated per user

## Step 7: Storage Configuration

1. In Supabase dashboard, go to Storage
2. Create a new bucket called "documents"
3. Set it to public if you want direct file access
4. Configure RLS policies for the bucket:

```sql
-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Step 8: Production Deployment

1. Deploy your application to your preferred hosting platform
2. Update environment variables in production
3. Update Site URL and Redirect URLs in Supabase to match your production domain
4. Test authentication flows in production

## Security Best Practices

1. **Row Level Security**: All tables have RLS enabled to ensure users can only access their own data
2. **API Keys**: Never expose service role keys in client-side code
3. **HTTPS**: Always use HTTPS in production
4. **Environment Variables**: Keep sensitive keys in environment variables, not in code
5. **User Validation**: The system automatically creates user profiles on signup

## Troubleshooting

### Authentication Not Working
- Check that environment variables are correctly set
- Verify Supabase project URL and keys
- Check browser console for errors
- Ensure redirect URLs are configured correctly

### Database Errors
- Verify the schema was applied correctly
- Check RLS policies are in place
- Ensure user profiles are being created automatically

### File Upload Issues
- Check storage bucket exists and is configured
- Verify storage policies allow user access
- Check file size limits in Supabase settings

## API Usage

The application now uses authenticated API requests. All API routes require authentication:

```typescript
import { authenticatedRequest } from '@/lib/api-client'

// Get user's documents
const documents = await authenticatedRequest('/api/documents')

// Upload a document
const formData = new FormData()
formData.append('file', file)
const result = await authenticatedRequest('/api/documents/upload', {
  method: 'POST',
  body: formData,
  headers: {} // Don't set Content-Type for FormData
})
```

## User Data Isolation

- Each user can only see and access their own documents
- AI provider settings are per-user
- Queries and analyses are isolated by user
- File uploads are stored in user-specific folders

Your DocMind application now has real, production-ready authentication with proper user isolation and security!