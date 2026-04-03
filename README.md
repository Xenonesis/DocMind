<div align="center">

# DocMind

### Intelligent Document Processing Platform

AI-powered document processing with semantic search, natural language queries, and intelligent analysis.

[Quick Start](#quick-start) • [Features](#features) • [Documentation](#documentation) • [API Reference](#api-documentation) • [Contributing](#contributing)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Authentication](#authentication)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Components](#components)
- [Hooks](#hooks)
- [Utilities](#utilities)
- [AI Providers](#ai-providers)
- [Document Processing](#document-processing)
- [Security](#security)
- [Deployment](#deployment)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

DocMind is a modern, intelligent document processing platform built with Next.js 16, TypeScript, and Tailwind CSS 4. It combines cutting-edge AI technology with intuitive design to help users unlock the intelligence hidden within their files.

### Key Capabilities

- **Universal Document Support**: PDF, Word, text, JSON, CSV, XML, and images
- **AI-Powered Querying**: Natural language questions across your documents
- **Multi-Provider AI**: Google Gemini, OpenAI, Anthropic Claude, Mistral, Groq, OpenRouter, Ollama, LM Studio, and custom endpoints
- **Free Built-in Providers**: Groq and DocScan free tiers available without API keys
- **Enterprise Security**: Row-level security, encrypted API keys, user data isolation
- **Modern UX**: Clean professional design, dark mode, responsive layout

### Architecture

DocMind uses a hybrid architecture:

- **Frontend**: Next.js 16 with App Router, React 19, TypeScript
- **Backend**: Next.js API routes + Go serverless functions for heavy processing
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Storage**: Supabase Storage for document files
- **AI**: Multiple provider support with automatic fallback

---

## Features

### Document Management

**Upload & Processing**

- Drag-and-drop file upload interface
- Support for PDF, DOCX, TXT, JSON, CSV, XML, JPG, PNG
- Automatic content extraction with format-specific parsers
- Real-time processing status tracking
- Batch processing with queue management
- File size and type validation
- User-specific storage folders in Supabase

**Document Organization**

- Category-based organization (Document, Text, Image, Data, Other)
- Custom tags and metadata
- Search and filter by status, type, name
- Document status: UPLOADING, PROCESSING, COMPLETED, ERROR
- Upload date and file size tracking
- Analysis and query count per document

### AI-Powered Analysis

**Content Intelligence**

- Automatic document summarization
- Key entity extraction
- Topic classification
- Sentiment analysis
- Document statistics (word count, character count, line count)
- Content structure analysis
- Sensitive data detection (PII, emails, phone numbers)

**Rule-Based Analysis**

- JSON structure validation
- CSV column and row analysis
- TODO/FIXME detection in text files
- File type identification
- Binary file detection
- Content pattern recognition

### Natural Language Querying

**Chat Interface**

- Conversational AI interface
- Context-aware responses with conversation history
- Multi-document querying
- Source attribution
- Response generation with document references
- Query history tracking

**Query Capabilities**

- Natural language understanding
- Intent recognition
- Contextual answers
- Cross-document analysis
- Custom system prompts
- Automatic fallback to free providers

### AI Provider Integration

**Supported Providers**

- **Google Gemini**: Gemini 1.5 Pro, Gemini 1.5 Flash, Gemini Pro
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Anthropic Claude**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Mistral AI**: Mistral Large, Mistral Medium, Mistral Small
- **Groq**: Llama 3.1 8B (ultra-fast, free tier)
- **OpenRouter**: Access to 100+ AI models
- **Ollama**: Local LLM deployment (Llama 2, Mistral, etc.)
- **LM Studio**: Local AI inference
- **Custom OpenAI-Compatible**: Any OpenAI-compatible API endpoint

**Free Built-in Providers**

- **DocScan Free (Glm-5)**: Free via Modal.direct API
- **DocScan Groq (Llama 3.1 8B)**: Ultra-fast free inference

**Provider Features**

- Per-user provider configuration stored in database
- XOR-encrypted API key storage
- Model selection and customization
- Temperature and max tokens configuration
- Provider testing and validation
- Automatic model listing fetch
- Automatic fallback on upstream errors

### User Experience

**Interface Design**

- Clean, professional B2B SaaS aesthetic
- Bricolage Grotesque for headings, Space Mono for code
- Soft color palette with proper contrast ratios
- Rounded corners (0.5rem-0.75rem) and subtle shadows
- Responsive layout for mobile, tablet, desktop
- Dark mode with system preference detection

**Accessibility**

- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators
- Proper ARIA labels
- High contrast mode support

---

## Technology Stack

### Frontend

**Core Framework**

- **Next.js 16** - React framework with App Router
  - Server-side rendering (SSR)
  - Static site generation (SSG)
  - API routes integration
  - Image and font optimization
  - Turbopack bundler

- **TypeScript 5** - Type-safe development
  - Strict type checking
  - Enhanced IDE support
  - Path aliases (@/\*)
  - Compile-time error detection

**Styling & UI**

- **Tailwind CSS 4** - Utility-first CSS framework
  - Custom design system with CSS variables
  - Responsive utilities
  - Dark mode via class strategy
  - Custom animations

- **shadcn/ui** - Component library (New York style)
  - 51 pre-built accessible components
  - Radix UI primitives
  - Customizable themes
  - TypeScript support

- **Framer Motion** - Animation library
  - Page transitions
  - Gesture support
  - Layout animations
  - Performance optimized

**State Management**

- **Zustand** - Lightweight state management
- **React Context** - Auth and theme context
- **TanStack Query** - Server state management
  - Intelligent caching
  - Background updates
  - Optimistic updates

### Backend & Data

**Database**

- **Supabase** - PostgreSQL backend
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Built-in authentication
  - Storage buckets
  - Edge functions

**Authentication**

- **Supabase Auth** - Authentication system
  - Email/password authentication
  - OAuth providers (Google, GitHub)
  - JWT sessions
  - PKCE flow
  - Session persistence

**API Layer**

- Next.js API routes (TypeScript)
- Go serverless functions for processing
- JWT-based authentication
- Encrypted API key storage

### Document Processing

**Text Extraction**

- **pdf-parse** - PDF text extraction
- **mammoth** - DOCX processing
- Native text reading for TXT, JSON, CSV, XML
- Sharp for image processing

**AI Service**

- Custom AI service layer
- Multiple provider support with type safety
- XOR encryption for API keys
- Token usage tracking
- Automatic fallback on errors

### Development Tools

**Code Quality**

- **ESLint 9** - Code linting
- **TypeScript** - Type checking
- **Prettier** - Code formatting

**Build & Deploy**

- **Turbopack** - Fast bundler (Next.js 16+)
- **Vercel** - Deployment platform
- **nodemon** - Development watcher

**Monitoring**

- Console logging with context
- Error tracking in API routes
- Vercel Analytics (optional)

---

## Quick Start

Get DocMind running in 5 minutes.

### Prerequisites

- **Node.js** 18.0+ ([Download](https://nodejs.org/))
- **npm** 9.0+ (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

### Installation

**1. Clone the Repository**

```bash
git clone https://github.com/your-username/docmind.git
cd docmind
```

**2. Install Dependencies**

```bash
npm install
```

**3. Set Up Environment Variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Optional: Enable Free Providers**

```env
# Groq free tier (ultra-fast)
GROQ_API_KEY=gsk_xxx

# DocScan free tier (Modal.direct)
DOCSCAN_FREE_API_KEY=your-key
DOCSCAN_FREE_BASE_URL=https://api.us-west-2.modal.direct/v1
```

**4. Set Up Database**

Follow the [Database Setup](#database-setup) guide.

**5. Start Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Installation

### System Requirements

| Component | Minimum   | Recommended |
| --------- | --------- | ----------- |
| Node.js   | 18.0      | 20.x LTS    |
| RAM       | 4 GB      | 8 GB        |
| Storage   | 1 GB      | 5 GB        |
| Network   | Broadband | High-speed  |

### Step-by-Step Installation

**1. Clone Repository**

```bash
# Using HTTPS
git clone https://github.com/your-username/docmind.git
cd docmind

# Or using SSH
git clone git@github.com:your-username/docmind.git
cd docmind
```

**2. Install Dependencies**

```bash
npm install
```

**3. Environment Configuration**

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required: Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: Free AI Providers
GROQ_API_KEY=gsk_xxx
DOCSCAN_FREE_API_KEY=your-key
DOCSCAN_FREE_BASE_URL=https://api.us-west-2-modal.direct/v1

# Optional: Application Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
PORT=3000
```

**4. Database Setup**

See [Database Setup](#database-setup) section.

**5. Verify Installation**

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint
```

### Common Installation Issues

**Node Version Mismatch**

```bash
# Check Node version
node --version

# If below 18.0, upgrade Node.js
```

**Dependency Installation Fails**

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Port Already in Use**

```bash
# Use custom port
npm run dev -- --port 3001
```

---

## Configuration

### Environment Variables

Create a `.env.local` file:

```env
# ===== Supabase Configuration (Required) =====
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# ===== Free AI Providers (Optional) =====
GROQ_API_KEY=gsk_xxx
DOCSCAN_FREE_API_KEY=your-key-here
DOCSCAN_FREE_BASE_URL=https://api.us-west-2.modal.direct/v1

# ===== Application Settings (Optional) =====
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DocMind
NODE_ENV=development
PORT=3000

# ===== Upload Settings (Optional) =====
MAX_FILE_SIZE=10485760
MAX_FILES_PER_BATCH=10
```

### Supabase Setup

**1. Create Supabase Project**

1. Go to [Supabase](https://supabase.com)
2. Sign in or create account
3. Click "New Project"
4. Enter project details
5. Choose region closest to users
6. Click "Create new project"

**2. Get API Keys**

1. Settings → API
2. Copy:
   - Project URL
   - anon/public key
   - service_role key (keep secret!)

**3. Configure Authentication**

1. Settings → Authentication
2. Set Site URL: `http://localhost:3000`
3. Add Redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://yourdomain.com/auth/callback`

**4. Enable OAuth (Optional)**

**Google OAuth:**

1. Google Cloud Console → OAuth 2.0
2. Redirect URI: `https://your-project.supabase.co/auth/v1/callback`
3. Copy credentials to Supabase

**GitHub OAuth:**

1. GitHub Settings → OAuth Apps
2. Callback: `https://your-project.supabase.co/auth/v1/callback`
3. Copy credentials to Supabase

---

## Database Setup

### Schema Deployment

**Option 1: Supabase SQL Editor (Recommended)**

1. Open Supabase Dashboard
2. SQL Editor → New query
3. Copy `supabase-production-schema.sql`
4. Paste and Run
5. Verify tables in Table Editor

**Option 2: Supabase CLI**

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-id
supabase db push
```

### Database Schema

**Tables Created:**

**user_profiles**

```sql
- id (UUID, PK, references auth.users)
- email (TEXT)
- name (TEXT)
- avatar_url (TEXT)
- created_at, updated_at
```

**ai_provider_settings**

```sql
- id (UUID, PK)
- user_id (UUID, FK)
- provider_name (TEXT)
- api_key (TEXT, encrypted)
- model_name (TEXT)
- base_url (TEXT)
- is_active (BOOLEAN)
- created_at, updated_at
```

**documents**

```sql
- id (UUID, PK)
- user_id (UUID, FK)
- name, type, size (TEXT)
- status (TEXT: UPLOADING|PROCESSING|COMPLETED|ERROR)
- content (TEXT)
- metadata (TEXT, JSON)
- upload_date, processed_at
- category, tags (TEXT)
```

**analyses**

```sql
- id (UUID, PK)
- document_id, user_id (UUID, FK)
- analysis_type (TEXT)
- result (JSONB)
- ai_provider, ai_model (TEXT)
- tokens_used, processing_time_ms
```

**queries**

```sql
- id (UUID, PK)
- user_id (UUID, FK)
- document_ids (JSONB)
- query_text, response (TEXT)
- ai_provider, ai_model (TEXT)
- tokens_used, processing_time_ms
```

### Row Level Security (RLS)

All tables have RLS enabled:

```sql
-- Users can only access their own data
CREATE POLICY "Users can manage own documents" ON documents
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own analyses" ON analyses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own queries" ON queries
    FOR ALL USING (auth.uid() = user_id);
```

### Indexes

```sql
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_document_id ON analyses(document_id);
CREATE INDEX idx_queries_user_id ON queries(user_id);
CREATE INDEX idx_queries_timestamp ON queries(timestamp);
```

### Storage Configuration

**1. Create Storage Bucket**

1. Storage → New bucket
2. Name: `documents`
3. Public: Yes
4. Create bucket

**2. Configure Storage Policies**

```sql
-- Allow users to upload to their folder
CREATE POLICY "Users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view own files
CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete own files
CREATE POLICY "Users can delete own files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

## Authentication

### Authentication System

DocMind uses Supabase Authentication with custom JWT handling.

**Supported Methods:**

- Email/Password
- Google OAuth
- GitHub OAuth

### Authentication Flow

**1. User Signup**

```typescript
const { signup } = useAuth()

await signup(email, password, name)
// Creates user in auth.users
// Triggers handle_new_user() function
// Creates user_profiles record
// Redirects to dashboard
```

**2. User Login**

```typescript
const { login } = useAuth()

await login(email, password)
// Validates credentials
// Creates session
// Sets auth cookie
// Redirects to dashboard
```

**3. OAuth Login**

```typescript
const { loginWithProvider } = useAuth()

await loginWithProvider('google')
// Redirects to OAuth provider
// User consents
// Callback to /auth/callback
// Creates/updates user
// Redirects to dashboard
```

### Protected Routes

```typescript
// src/components/protected-route.tsx
export function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!user) return <Navigate to="/" />

  return children
}
```

### Session Management

**Auto-refresh:**

- Sessions auto-refresh before expiry
- Refresh token rotation
- PKCE flow for security

**Session Persistence:**

- Stored in localStorage
- Key: `docmind.auth`
- Survives page refresh

### User Context

```typescript
interface User {
  id: string
  name: string
  email: string
  avatar: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email, password) => Promise<void>
  signup: (email, password, name) => Promise<void>
  loginWithProvider: (provider) => Promise<void>
  logout: () => Promise<void>
  isLoading: boolean
}
```

### Server-Side Authentication

API routes use JWT token verification:

```typescript
// src/lib/auth-server.ts
export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null

  const token = authHeader.substring(7)
  const payload = decodeJwtPayload(token)

  return {
    id: payload.sub,
    email: payload.email || '',
    name: payload.user_metadata?.name || 'User',
  }
}
```

---

## Usage Guide

### Getting Started

**1. Create Account**

1. Navigate to http://localhost:3000
2. Click "Get Started" or "Sign Up"
3. Enter email, password, name
4. Click "Create Account"
5. Redirected to dashboard

**2. Configure AI Provider**

1. Go to Settings tab
2. Select AI provider
3. Enter API key (or use free provider)
4. Select model
5. Click "Test Connection"
6. Save

**3. Upload Documents**

1. Go to Upload tab
2. Drag and drop files
3. Upload starts automatically
4. Monitor progress
5. Documents appear in Documents tab

**4. Query Documents**

1. Go to Chat tab
2. Select documents (optional)
3. Type natural language question
4. Press Enter
5. View AI response with sources

### Document Upload

**Supported Formats:**

| Format     | Extension   | Processing Method |
| ---------- | ----------- | ----------------- |
| PDF        | .pdf        | pdf-parse         |
| Word       | .doc, .docx | mammoth           |
| Plain Text | .txt        | Direct read       |
| JSON       | .json       | Parse and format  |
| CSV        | .csv        | Parse and analyze |
| XML        | .xml        | Parse and extract |
| Images     | .jpg, .png  | Metadata only     |

**Upload Process:**

```typescript
async function handleUpload(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  })

  const document = await response.json()
  // Document created, processing starts
}
```

**File Size Limits:**

- Default: 10 MB per file
- Configurable via MAX_FILE_SIZE
- Batch limit: 10 files

### Natural Language Querying

**Example Queries:**

```
"What are the main findings in this document?"
"Summarize the key points from the financial report"
"Find all mentions of climate change"
"What contracts were signed in 2023?"
"Extract all action items from the meeting notes"
```

**Query with Context:**

```typescript
async function submitQuery(query: string, documentIds: string[]) {
  const response = await fetch('/api/query', {
    method: 'POST',
    body: JSON.stringify({
      query,
      documentIds,
      provider: selectedProvider,
      history: conversationHistory,
    }),
  })

  const result = await response.json()
  // Display response with sources
}
```

### AI Provider Configuration

**Configure via UI:**

1. Settings → AI Providers
2. Add new provider
3. Enter details:
   - Provider name
   - API key (encrypted)
   - Model name
   - Base URL (optional)
   - Activate

**Free Providers:**

No configuration needed if environment variables set:

- Groq: Set `GROQ_API_KEY`
- DocScan: Set `DOCSCAN_FREE_API_KEY`

### Document Analysis

**Automatic Analysis:**

On upload:

1. Content extracted
2. Word/character count
3. File type identified
4. Sensitive data scanned
5. Rule-based analysis generated
6. Results stored in `analyses` table

**Analysis Types:**

- INSIGHT: Statistics, content analysis
- OPPORTUNITY: Action items, TODOs
- COMPLIANCE: Sensitive data detection
- SUMMARY: AI-generated summary
- ENTITIES: Named entity extraction

---

## Project Structure

```
docmind/
│
├── 📁 .next/                          # Next.js build output
│   ├── build/                         # Production build
│   ├── cache/                         # Build cache
│   ├── static/                        # Static assets
│   └── types/                         # TypeScript types
│
├── 📁 .gocache/                       # Go build cache
│
├── 📁 api/                            # Go serverless functions
│   ├── 📁 analyze-document/
│   │   └── index.go                   # Document analysis
│   ├── 📁 health/
│   │   └── index.go                   # Health check
│   ├── 📁 process-document/
│   │   └── index.go                   # Document processing
│   └── 📁 search-basic/
│       └── index.go                   # Basic search
│
├── 📁 internal/                       # Internal Go packages
│
├── 📁 pkg/
│   └── 📁 docscanapi/
│       ├── supabase.go                # Supabase client
│       └── types.go                   # Type definitions
│
├── 📁 public/                         # Static assets
│   ├── 📁 uploads/                    # Uploaded files (dev)
│   │   └── 📁 documents/              # User-specific folders
│   ├── favicon.ico
│   └── logo.png
│
├── 📁 src/                            # Main source code
│   │
│   ├── 📁 app/                        # Next.js App Router
│   │   ├── 📁 api/                    # API routes
│   │   │   ├── 📁 analysis/
│   │   │   ├── 📁 auth/
│   │   │   │   └── [...nextauth]/
│   │   │   ├── 📁 debug/
│   │   │   ├── 📁 documents/
│   │   │   │   └── upload/
│   │   │   ├── 📁 free-provider/
│   │   │   ├── 📁 health/
│   │   │   ├── 📁 models/
│   │   │   ├── 📁 process-document-fallback/
│   │   │   ├── 📁 query/
│   │   │   ├── 📁 search/
│   │   │   ├── 📁 settings/
│   │   │   └── 📁 test-connection/
│   │   │
│   │   ├── 📁 auth/
│   │   │   └── callback/
│   │   │
│   │   ├── 📁 dashboard/
│   │   │   └── page.tsx               # Main dashboard
│   │   │
│   │   ├── 📁 preview/
│   │   │   └── [id]/
│   │   │
│   │   ├── 📁 settings/
│   │   │
│   │   ├── globals.css                # Global styles
│   │   ├── icon.png
│   │   ├── layout.tsx                 # Root layout
│   │   └── page.tsx                   # Landing page
│   │
│   ├── 📁 components/
│   │   ├── 📁 auth/
│   │   │   ├── login-modal.tsx
│   │   │   └── signup-modal.tsx
│   │   │
│   │   ├── 📁 features/
│   │   │   ├── api-usage-tracker.tsx
│   │   │   └── smart-document-analyzer.tsx
│   │   │
│   │   ├── 📁 settings/
│   │   │   └── ai-api-settings.tsx
│   │   │
│   │   ├── 📁 ui/                     # 51 shadcn/ui components
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── ... (51 total)
│   │   │
│   │   ├── analysis-results.tsx
│   │   ├── chat-interface.tsx
│   │   ├── document-list.tsx
│   │   ├── document-preview.tsx
│   │   ├── document-upload.tsx
│   │   ├── landing-page.tsx
│   │   ├── protected-route.tsx
│   │   ├── query-interface.tsx
│   │   └── theme-provider.tsx
│   │
│   ├── 📁 hooks/
│   │   ├── use-mobile.ts              # Mobile detection
│   │   ├── use-socket.ts              # WebSocket hook
│   │   └── use-toast.ts               # Toast notifications
│   │
│   └── 📁 lib/
│       ├── ai-service.ts              # AI service layer
│       ├── api-client.ts              # API client utilities
│       ├── auth-context.tsx           # Auth context provider
│       ├── auth-server.ts             # Server-side auth
│       ├── crypto-utils.ts            # XOR encryption
│       ├── db.ts                      # Database client
│       ├── document-processing.ts     # Document processing
│       ├── socket-types.ts            # Socket types
│       ├── supabase-types.ts          # Supabase types
│       ├── supabase-utils.ts          # Supabase utilities
│       ├── supabase.ts                # Supabase client
│       └── utils.ts                   # General utilities
│
├── 📁 supabase/
│   ├── 📁 migrations/
│   ├── config.toml
│   └── .gitignore
│
├── 📁 .vscode/
│   ├── extensions.json
│   ├── settings.json
│   └── tasks.json
│
├── .dockerignore
├── .env.example
├── .gitignore
├── add-base-url-column.sql
├── AUTHENTICATION_SETUP.md
├── components.json                    # shadcn/ui config
├── DEPLOY_SQL.md
├── eslint.config.mjs
├── final-cleanup.sql
├── frontenddesign.md
├── go.mod
├── IMPROVEMENTS_SUMMARY.md
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
├── replace.py
├── supabase-production-schema.sql
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## API Documentation

### Base URL

```
Development: http://localhost:3000/api
Production: https://yourdomain.com/api
```

### Authentication

All API routes require JWT authentication via Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Endpoints

#### Documents

**GET /api/documents**

Retrieve all documents for authenticated user.

```typescript
// Request
GET /api/documents?status=COMPLETED&type=pdf&search=report

// Response 200
[
  {
    "id": "uuid",
    "name": "report.pdf",
    "type": "application/pdf",
    "size": "1.2 MB",
    "status": "COMPLETED",
    "uploadDate": "2024-01-15T10:30:00Z",
    "category": "Document",
    "tags": ["finance", "2024"],
    "analysisCount": 3,
    "queryCount": 5
  }
]
```

**POST /api/documents/upload**

Upload a new document.

```typescript
// Request
POST /api/documents/upload
Content-Type: multipart/form-data

Body: FormData {
  file: File
}

// Response 200
{
  "id": "uuid",
  "name": "report.pdf",
  "type": "application/pdf",
  "size": "1.2 MB",
  "status": "PROCESSING",
  "uploadDate": "2024-01-15T10:30:00Z",
  "downloadURL": "https://...",
  "storageRef": "users/email/documents/uuid/file.pdf"
}
```

#### Query

**POST /api/query**

Submit natural language query.

```typescript
// Request
POST /api/query
Content-Type: application/json

Body: {
  "query": "What are the main findings?",
  "documentIds": ["uuid1", "uuid2"],
  "provider": "google-gemini",
  "history": [
    { "role": "user", "content": "Previous question" },
    { "role": "assistant", "content": "Previous answer" }
  ]
}

// Response 200
{
  "id": "query-uuid",
  "query": "What are the main findings?",
  "status": "COMPLETED",
  "response": {
    "answer": "The main findings include...",
    "relevantDocuments": ["report.pdf", "analysis.docx"]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "provider": "Google Gemini",
  "usage": {
    "totalTokens": 150
  }
}
```

**GET /api/query**

Get query history.

```typescript
// Request
GET /api/query?limit=10&offset=0

// Response 200
[
  {
    "id": "uuid",
    "query": "What are the main findings?",
    "response": { "answer": "..." },
    "timestamp": "2024-01-15T10:30:00Z",
    "provider": "Google Gemini",
    "model": "gemini-1.5-pro",
    "tokensUsed": 150
  }
]
```

#### Settings

**GET /api/settings**

Get user's AI provider settings.

```typescript
// Request
GET /
  api /
  settings[
    // Response 200
    {
      id: 'uuid',
      provider: 'GOOGLE_AI',
      apiKey: 'AIza...xyz',
      model: 'gemini-1.5-pro',
      isActive: true,
      baseUrl: 'https://...',
      createdAt: '2024-01-15T10:30:00Z',
    }
  ]
```

**POST /api/settings**

Save AI provider configuration.

```typescript
// Request
POST /api/settings
Content-Type: application/json

Body: {
  "providers": [
    {
      "provider": "GOOGLE_AI",
      "apiKey": "your-api-key",
      "model": "gemini-1.5-pro",
      "isActive": true,
      "baseUrl": "https://..."
    }
  ]
}

// Response 200
{
  "success": true,
  "results": [
    {
      "id": "uuid",
      "provider": "GOOGLE_AI",
      ...
    }
  ]
}
```

#### Free Provider

**GET /api/free-provider**

Check available free providers.

```typescript
// Request
GET / api / free -
  provider[
    // Response 200
    {
      id: 'docscan-free-groq',
      name: 'DocScan llama-3.1-8b-instant from groq (free)',
      type: 'groq',
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama-3.1-8b-instant',
      models: ['llama-3.1-8b-instant', 'llama3-70b-8192'],
      isActive: false,
      isConfigured: true,
      description: 'Ultra-fast inference powered by Groq',
      maxTokens: 4096,
      temperature: 0.7,
    }
  ]
```

#### Health Check

**GET /api/health**

Check API health status.

```typescript
// Request
GET /api/health

// Response 200
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "runtime": "go",
  "environment": {
    "supabaseUrlConfigured": true,
    "supabaseAnonConfigured": true,
    "supabaseServiceConfigured": true
  },
  "capabilities": [
    "process-document",
    "analyze-document",
    "search-basic",
    "health"
  ]
}
```

#### Test Connection

**POST /api/test-connection**

Test AI provider connection.

```typescript
// Request
POST /api/test-connection
Content-Type: application/json

Body: {
  "provider": "GOOGLE_AI",
  "apiKey": "test-key",
  "model": "gemini-1.5-pro",
  "baseUrl": "https://..."
}

// Response 200
{
  "success": true,
  "message": "Connection successful"
}
```

### Error Responses

```typescript
// 400 Bad Request
{
  "error": "Query is required"
}

// 401 Unauthorized
{
  "error": "Authentication required"
}

// 403 Forbidden
{
  "error": "No AI provider configured"
}

// 404 Not Found
{
  "error": "Document not found"
}

// 500 Internal Server Error
{
  "error": "Failed to process query",
  "details": "Specific error message"
}
```

---

## Components

### UI Components (shadcn/ui)

51 accessible components built with Radix UI:

**Layout:**

- `Card` - Container with header, content
- `Separator` - Visual divider
- `ScrollArea` - Custom scrollbars
- `Resizable` - Resizable panels

**Forms:**

- `Button` - Variants: default, destructive, outline, ghost, link
- `Input` - Text input with validation
- `Textarea` - Multi-line input
- `Checkbox` - Checkbox with label
- `RadioGroup` - Radio buttons
- `Switch` - Toggle switch
- `Select` - Dropdown selector
- `Slider` - Range slider
- `InputOTP` - OTP input

**Navigation:**

- `NavigationMenu` - Main navigation
- `Breadcrumb` - Breadcrumb trail
- `Tabs` - Tabbed interface
- `Sidebar` - Side navigation

**Overlays:**

- `Dialog` - Modal dialog
- `AlertDialog` - Confirmation
- `Sheet` - Slide-out panel
- `Drawer` - Drawer
- `Popover` - Popover
- `DropdownMenu` - Dropdown
- `ContextMenu` - Right-click menu
- `HoverCard` - Hover preview

**Data Display:**

- `Table` - Data table
- `Chart` - Recharts-based charts
- `Badge` - Status badges
- `Avatar` - User avatar
- `Progress` - Progress bar
- `Skeleton` - Loading placeholder

**Feedback:**

- `Toast` - Toast notifications
- `Toaster` - Toast container
- `Sonner` - Alternative toast
- `Alert` - Alert messages

### Feature Components

**DocumentUpload** (`src/components/document-upload.tsx`)

Drag-and-drop upload interface.

```typescript
interface Props {
  onUpload: (documents: Document[]) => void
}

function DocumentUpload({ onUpload }) {
  // Handles file selection
  // Validates file type and size
  // Uploads to /api/documents/upload
  // Shows progress
  // Calls onUpload on success
}
```

**ChatInterface** (`src/components/chat-interface.tsx`)

Natural language query interface.

```typescript
interface Props {
  documents: Document[]
  selectedProvider?: string
}

function ChatInterface({ documents, selectedProvider }) {
  // Displays chat history
  // Handles query input
  // Submits to /api/query
  // Shows response with sources
}
```

**DocumentList** (`src/components/document-list.tsx`)

Document list with filtering.

```typescript
interface Props {
  documents: Document[]
}

function DocumentList({ documents }) {
  // Displays document cards
  // Shows status badges
  // Provides search/filter
  // Allows selection
}
```

**AnalysisResults** (`src/components/analysis-results.tsx`)

Display analysis results.

```typescript
function AnalysisResults() {
  // Fetches analyses from database
  // Displays insights, opportunities, compliance
  // Shows confidence scores
}
```

**AiApiSettings** (`src/components/settings/ai-api-settings.tsx`)

AI provider configuration.

```typescript
function AiApiSettings() {
  // Lists available providers
  // Form for API key input
  // Model selection
  // Test connection button
  // Save/load settings
}
```

**LandingPage** (`src/components/landing-page.tsx`)

Marketing landing page.

```typescript
function LandingPage() {
  // Hero section
  // Feature grid
  // Call-to-action
  // Login/signup modals
  // Theme toggle
}
```

**ProtectedRoute** (`src/components/protected-route.tsx`)

Route protection wrapper.

```typescript
function ProtectedRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return <LoadingSpinner />
  if (!user) return <Navigate to="/" />

  return children
}
```

---

## Hooks

### useAuth

Authentication context hook.

```typescript
import { useAuth } from '@/lib/auth-context'

function MyComponent() {
  const {
    user, // Current user or null
    isAuthenticated, // Boolean
    login, // (email, password) => Promise<void>
    signup, // (email, password, name) => Promise<void>
    loginWithProvider, // ('google' | 'github') => Promise<void>
    logout, // () => Promise<void>
    isLoading, // Boolean
  } = useAuth()
}
```

### useToast

Toast notification hook.

```typescript
import { useToast } from '@/hooks/use-toast'

function MyComponent() {
  const { toast } = useToast()

  const showToast = () => {
    toast({
      title: 'Success',
      description: 'Document uploaded successfully',
      variant: 'default',
    })
  }
}
```

### useMobile

Mobile detection hook.

```typescript
import { useMobile } from '@/hooks/use-mobile'

function MyComponent() {
  const isMobile = useMobile()

  return (
    <div>
      {isMobile ? <MobileNav /> : <DesktopNav />}
    </div>
  )
}
```

### useSocket

WebSocket connection hook.

```typescript
import { useSocket } from '@/hooks/use-socket'

function MyComponent() {
  const { socket, connected, emit, on } = useSocket()

  useEffect(() => {
    on('document:processed', (data) => {
      console.log('Document processed:', data)
    })
  }, [on])
}
```

---

## Utilities

### AI Service

Central AI provider integration.

```typescript
import { AIService } from '@/lib/ai-service'

const aiService = AIService.getInstance()

// Load providers from database
await aiService.loadProvidersFromDatabase(userId)

// Generate completion
const response = await aiService.generateCompletion({
  provider: googleProvider,
  prompt: 'Summarize this document',
  systemPrompt: 'You are a helpful assistant',
  temperature: 0.7,
  maxTokens: 4096,
})

console.log(response.content)
console.log(response.usage.totalTokens)
```

**Supported Provider Types:**

- google
- mistral
- lm-studio
- ollama
- open-router
- openai
- anthropic
- groq
- openai-compatible

### API Client

Authenticated API requests.

```typescript
import { authenticatedRequest } from '@/lib/api-client'

// GET request
const documents = await authenticatedRequest('/api/documents')

// POST request
const result = await authenticatedRequest('/api/query', {
  method: 'POST',
  body: JSON.stringify({ query: "What's in this doc?" }),
})
```

### Crypto Utils

XOR encryption for API keys.

```typescript
import { encryptApiKey, decryptApiKey, maskApiKey } from '@/lib/crypto-utils'

// Encrypt before storing
const encrypted = encryptApiKey('sk-1234567890')

// Decrypt for use
const decrypted = decryptApiKey(encrypted)

// Mask for display
const masked = maskApiKey('sk-1234567890') // 'sk-12...7890'

// Validate format
const isValid = isValidApiKey('sk-1234567890', 'openai')
```

### Document Processing

File content extraction.

```typescript
import {
  extractFileContent,
  generateAnalysisFromContent,
  getFileCategory,
  formatFileSize,
  getProcessingStrategy,
} from '@/lib/document-processing'

// Extract content
const content = await extractFileContent(fileDescriptor, arrayBuffer)

// Generate analysis
await generateAnalysisFromContent(docId, fileName, content, userId, db)

// Get category
const category = getFileCategory('report.pdf') // 'Document'

// Format size
const formatted = formatFileSize(1048576) // '1 MB'
```

### Supabase Client

Database operations.

```typescript
import { supabase, supabaseServer, createServerClientForToken } from '@/lib/supabase'

// Client-side query
const { data } = await supabase.from('documents').select('*').eq('user_id', userId)

// Server-side with token
const db = createServerClientForToken(token)
const { data } = await db.from('ai_provider_settings').select('*')
```

### Auth Server

Server-side authentication.

```typescript
import { getAuthenticatedUser, ensureUserProfile } from '@/lib/auth-server'

// Get user from JWT
const user = await getAuthenticatedUser(request)

// Ensure profile exists
await ensureUserProfile(user, db)
```

---

## AI Providers

### Configuring Providers

**Google Gemini**

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Settings → Add Provider
3. Provider: GOOGLE_AI
4. Enter API key
5. Model: gemini-1.5-pro
6. Base URL: https://generativelanguage.googleapis.com/v1beta
7. Test and Save

**OpenAI**

1. Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Settings → Add Provider
3. Provider: OPENAI
4. Enter API key (sk-...)
5. Model: gpt-4-turbo-preview
6. Base URL: https://api.openai.com/v1
7. Test and Save

**Anthropic Claude**

1. Get API key from [Anthropic Console](https://console.anthropic.com/)
2. Settings → Add Provider
3. Provider: ANTHROPIC
4. Enter API key
5. Model: claude-3-5-sonnet-latest
6. Base URL: https://api.anthropic.com/v1
7. Test and Save

**Groq (Free)**

1. Get API key from [Groq Console](https://console.groq.com/)
2. Set in .env.local: `GROQ_API_KEY=gsk_xxx`
3. Automatically available in /api/free-provider
4. Select from provider dropdown

**Ollama (Local)**

1. Install [Ollama](https://ollama.ai)
2. Pull model: `ollama pull llama2`
3. Settings → Add Provider
4. Provider: OLLAMA
5. No API key needed
6. Model: llama2
7. Base URL: http://localhost:11434/api

**LM Studio (Local)**

1. Install [LM Studio](https://lmstudio.ai)
2. Download and load model
3. Start local server
4. Settings → Add Provider
5. Provider: LM_STUDIO
6. No API key needed
7. Base URL: http://localhost:1234/v1

### Provider Comparison

| Provider      | Speed     | Quality   | Cost | Privacy   | Best For          |
| ------------- | --------- | --------- | ---- | --------- | ----------------- |
| Groq          | Very Fast | Good      | Free | Medium    | Quick queries     |
| Google Gemini | Fast      | High      | $$   | Medium    | Long context      |
| OpenAI GPT-4  | Medium    | Very High | $$$  | Medium    | General purpose   |
| Claude 3      | Medium    | Very High | $$$  | High      | Safety, reasoning |
| Mistral       | Fast      | High      | $$   | High      | European data     |
| Ollama        | Slow      | Medium    | Free | Very High | Privacy, offline  |
| LM Studio     | Medium    | High      | Free | Very High | Local inference   |

### Model Configuration

**Temperature:** Controls randomness (0.0-1.0)

- Low (0.2-0.4): Factual, consistent
- Medium (0.5-0.7): Balanced
- High (0.8-1.0): Creative, varied

**Max Tokens:** Response length limit

- Short: 256-512 tokens
- Medium: 1024-2048 tokens
- Long: 4096-8192 tokens

**Top P:** Nucleus sampling

- Default: 1.0
- Lower: More focused
- Higher: More diverse

---

## Document Processing

### Supported Formats

| Format     | Extension   | Library   | Notes             |
| ---------- | ----------- | --------- | ----------------- |
| PDF        | .pdf        | pdf-parse | Text extraction   |
| Word       | .doc, .docx | mammoth   | Text extraction   |
| Plain Text | .txt        | Native    | Direct read       |
| JSON       | .json       | Native    | Parse and format  |
| CSV        | .csv        | Native    | Parse and analyze |
| XML        | .xml        | Native    | Parse and extract |
| Images     | .jpg, .png  | sharp     | Metadata only     |

### Processing Pipeline

**1. Upload**

```
User selects file
↓
Validation (type, size)
↓
POST /api/documents/upload
↓
Create document record
↓
Upload to Supabase Storage
↓
Status: PROCESSING
```

**2. Processing**

```
Download from storage
↓
Extract content (format-specific)
↓
Analyze content (rule-based)
↓
Generate insights
↓
Update document record
↓
Status: COMPLETED
```

**3. Analysis**

```
Word/character count
↓
File type identification
↓
Pattern detection (TODOs, emails)
↓
Sensitive data scan
↓
Store in analyses table
```

### Processing Strategies

**Node.js (Default)**

- Pure TypeScript
- No external runtime
- Serverless compatible
- All formats supported

**Go (Optional)**

- Faster processing
- Better for large files
- Requires Go runtime
- Limited format support

### Error Handling

**Upload Errors:**

- File too large → 400 Bad Request
- Invalid file type → 400 Bad Request
- Network error → 500 Internal Server Error
- Storage error → 500 Internal Server Error

**Processing Errors:**

- Corrupt file → Status: ERROR
- Unsupported format → Status: ERROR
- Extraction failure → Status: ERROR
- Timeout → Status: ERROR

---

## Security

### Authentication Security

**Session Management**

- JWT tokens with expiry
- Refresh token rotation
- Secure cookie storage
- PKCE flow for OAuth

**Password Security**

- bcrypt hashing (Supabase)
- Minimum length requirement
- Strength validation
- Rate limiting on login

### Data Security

**Encryption**

- API keys encrypted with XOR
- Keys never exposed to client
- Encrypted database storage
- HTTPS enforcement

**Row Level Security**

- All tables have RLS policies
- Users can only access own data
- Database-level enforcement
- No bypass possible

**Storage Security**

- User-specific folders
- Access controlled by policies
- Signed URLs for downloads
- Bucket-level permissions

### API Security

**Authentication Required**

- All API routes protected
- JWT token verification
- Session validation
- CORS configuration

**Input Validation**

- File type checking
- Size validation
- Content sanitization
- SQL injection prevention

### Network Security

**HTTPS Enforcement**

- TLS 1.3 recommended
- Certificate validation
- HSTS headers
- Secure cookies

**CORS Configuration**

- Allowed origins
- Credential handling
- Method restrictions
- Header controls

### Compliance

**GDPR**

- Data minimization
- User consent
- Right to deletion
- Data portability

**Data Privacy**

- No third-party tracking
- Local processing option
- User data ownership
- Transparent policies

---

## Deployment

### Vercel Deployment

**1. Push to Git**

```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

**2. Deploy to Vercel**

```bash
npm i -g vercel
vercel login
vercel
vercel --prod
```

**3. Configure Environment Variables**

In Vercel dashboard:

- Settings → Environment Variables
- Add all required variables
- Set for Production and Preview

**4. Configure Domain**

- Project Settings → Domains
- Add custom domain
- Configure DNS
- Enable HTTPS

### Docker Deployment

**Dockerfile:**

```dockerfile
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
```

**Build and Run:**

```bash
docker build -t docmind .
docker run -p 3000:3000 -e NEXT_PUBLIC_SUPABASE_URL=... docmind
```

### Self-Hosting

**Requirements:**

- Node.js 18+ runtime
- PostgreSQL database (Supabase)
- File storage (S3-compatible)
- Reverse proxy (nginx)
- SSL certificate

**Steps:**

1. Build application
2. Set up database
3. Configure storage
4. Set environment variables
5. Start with PM2 or systemd
6. Configure reverse proxy
7. Enable HTTPS

### Production Checklist

- [ ] Environment variables set
- [ ] Database schema deployed
- [ ] Storage bucket configured
- [ ] Authentication tested
- [ ] AI providers configured
- [ ] HTTPS enabled
- [ ] Custom domain configured
- [ ] Error monitoring set up
- [ ] Backups configured
- [ ] Rate limiting enabled
- [ ] CORS configured

---

## Environment Variables

### Required Variables

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Optional Variables

```env
# Free AI Providers
GROQ_API_KEY=gsk_xxx
DOCSCAN_FREE_API_KEY=your-key
DOCSCAN_FREE_BASE_URL=https://api.us-west-2.modal.direct/v1

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=DocMind
NODE_ENV=development
PORT=3000

# Upload Settings
MAX_FILE_SIZE=10485760
MAX_FILES_PER_BATCH=10
```

### Variable Descriptions

| Variable                        | Purpose                  | Default  |
| ------------------------------- | ------------------------ | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL     | Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public API key           | Required |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key         | Required |
| `GROQ_API_KEY`                  | Groq API key (free tier) | Optional |
| `DOCSCAN_FREE_API_KEY`          | DocScan API key          | Optional |
| `PORT`                          | Development port         | 3000     |

### Environment Files

- `.env.example` - Template
- `.env.local` - Local development (gitignored)
- `.env.development` - Development
- `.env.production` - Production

---

## Troubleshooting

### Common Issues

**Authentication Not Working**

Problem: Can't log in or sign up

Solution:

1. Check Supabase URL and keys
2. Verify redirect URLs configured
3. Check browser console for errors
4. Ensure auth schema deployed
5. Clear browser cache

**Documents Not Processing**

Problem: Documents stuck in PROCESSING

Solution:

1. Check Supabase storage bucket
2. Verify storage policies
3. Check file size within limits
4. Review server logs
5. Ensure processing endpoint accessible

**AI Provider Not Responding**

Problem: Queries return errors

Solution:

1. Verify API key is valid
2. Check provider status
3. Test connection in Settings
4. Verify model name is correct
5. Check rate limits
6. For local providers, ensure running

**Upload Fails**

Problem: File upload returns error

Solution:

1. Check file type is supported
2. Verify file size within limit
3. Check network connection
4. Review browser console errors
5. Ensure storage bucket configured

**Build Errors**

Problem: `npm run build` fails

Solution:

1. Run `npm run lint` to find issues
2. Check TypeScript errors: `tsc --noEmit`
3. Clear `.next` folder
4. Reinstall dependencies
5. Check Node version

### Debug Mode

Enable debug logging:

```env
DEBUG=true
LOG_LEVEL=debug
```

### Support Resources

- **Documentation**: This README
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## Contributing

### How to Contribute

**Report Bugs**

1. Search existing issues
2. Create new issue with details
3. Include reproduction steps
4. Add environment information

**Suggest Features**

1. Check existing suggestions
2. Create feature request
3. Describe use case
4. Explain benefits

**Submit Code**

1. Fork repository
2. Create feature branch
3. Make changes
4. Add tests
5. Submit pull request

### Development Setup

**1. Fork and Clone**

```bash
git clone https://github.com/your-username/docmind.git
cd docmind
```

**2. Install Dependencies**

```bash
npm install
```

**3. Set Up Environment**

```bash
cp .env.example .env.local
```

**4. Start Development**

```bash
npm run dev
```

### Coding Standards

**TypeScript**

- Strict mode enabled
- No `any` types
- Proper type definitions
- Interface over type alias

**Code Style**

- Prettier formatting
- ESLint rules
- 2-space indentation
- Single quotes
- Semicolons required

**Commit Messages**

Follow Conventional Commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: format code
refactor: refactor code
test: add tests
chore: update dependencies
```

### Pull Request Process

1. Create branch from `main`
2. Make changes
3. Add/update tests
4. Run linter: `npm run lint`
5. Run type check
6. Update documentation
7. Submit PR
8. Address review comments
9. Merge after approval

---

## License

**MIT License**

Copyright (c) 2024 DocMind

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

<div align="center">

## Acknowledgments

Built with amazing open source tools:

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend platform
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [TanStack Query](https://tanstack.com/query) - Data fetching
- [Lucide](https://lucide.dev/) - Icons
- [Groq](https://groq.com/) - Ultra-fast inference

---

**DocMind** - Making documents intelligent, searchable, and actionable

[Get Started](#quick-start) • [Documentation](#documentation) • [GitHub](https://github.com/your-username/docmind)

</div>
