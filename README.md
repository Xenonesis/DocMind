<div align="center">

# DocMind
### Intelligent Document Processing Platform

Transform how you interact with documents through AI-powered semantic search, natural language queries, and intelligent analysis.

[Quick Start](#quick-start) • [Features](#features) • [Documentation](#documentation) • [API Reference](#api-documentation) • [Contributing](#contributing)

</div>

---

## Overview

DocMind revolutionizes document management by combining cutting-edge AI with intuitive design. Upload your documents and instantly unlock their potential through semantic search, natural language queries, and intelligent analysis.

### Why DocMind

| Capability | Benefits |
|------------|----------|
| **Lightning Fast** | Instant document processing, real-time search results, optimized performance |
| **AI-Powered Intelligence** | Semantic understanding, natural language queries, contextual insights |
| **Secure & Private** | Local processing options, enterprise-grade security, GDPR compliant |
| **Modern Experience** | Responsive design, dark mode support, accessibility focused |

---

## Features

### Smart Document Processing

**Advanced Upload System**
- **Multi-format Support**: PDF documents with OCR, Microsoft Word (DOCX), Plain text files (TXT), Rich text format (RTF)
- **Intelligent Processing**: Automatic text extraction, metadata preservation, content structure analysis, error handling & validation
- **Real-time Features**: Live progress tracking, WebSocket status updates, batch processing queue, processing analytics

**Semantic Search Engine**
- **AI-Powered Search**: Vector embeddings for semantic understanding, context-aware result ranking, multi-language support, fuzzy matching capabilities
- **Query Intelligence**: Natural language processing, intent recognition, query expansion, auto-suggestions
- **Result Enhancement**: Highlighted excerpts, relevance scoring, source attribution, export capabilities

### AI-Powered Analysis

**Content Intelligence**
- **Document Analysis**: Automatic summarization, key entity extraction, topic modeling, sentiment analysis
- **Classification System**: Content categorization, tag generation, priority scoring, duplicate detection
- **Insights Generation**: Trend identification, pattern recognition, relationship mapping, anomaly detection

**Analytics Dashboard**
- **Usage Metrics**: Document processing stats, query performance analytics, user activity tracking, system health monitoring
- **Content Analytics**: Document collection insights, search pattern analysis, popular content identification, usage trend visualization
- **Performance Monitoring**: Response time tracking, error rate monitoring, resource utilization, optimization recommendations

---

## Quick Start

Get DocMind running in 3 minutes.

### Prerequisites

**Required:**
- Node.js 18.0+ ([Download](https://nodejs.org/))
- npm 9.0+ (comes with Node.js)
- Git ([Download](https://git-scm.com/))

**Recommended:**
- VS Code with extensions: TypeScript and JavaScript Language Features, Tailwind CSS IntelliSense, ES7+ React/Redux/React-Native snippets

**Browser Support:**
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Installation

**1. Clone and Setup**
```bash
# Clone the repository
git clone https://github.com/your-username/docmind.git
cd docmind

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

**2. Configuration**

Edit `.env` file:
```bash
# Basic Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development

# AI Configuration (Optional)
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here

# Upload Settings
MAX_FILE_SIZE=10485760  # 10MB
UPLOAD_DIR=./public/uploads
```

**3. Launch**
```bash
# Start development server
npm run dev

# Or with custom port
npm run dev -- --port 3001
```

Open [http://localhost:3000](http://localhost:3000)

### Production Deployment

**Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Set environment variables in Vercel dashboard
```

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/docmind)

**Docker Deployment**
```bash
# Build Docker image
docker build -t docmind .

# Run container
docker run -p 3000:3000 -e OPENAI_API_KEY=your_key docmind
```

**Manual Deployment**
```bash
# Build for production
npm run build

# Start production server
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "docmind" -- start
```

---

## Technology Stack

### Frontend Technologies

**Core Framework**
- **Next.js 15** - App Router architecture, server-side rendering (SSR), static site generation (SSG), API routes integration
- **TypeScript 5.0** - Type-safe development, enhanced IDE support, better code maintainability, compile-time error checking

**Styling & UI**
- **Tailwind CSS 4** - Utility-first CSS framework, custom design system, responsive design utilities, dark mode support
- **shadcn/ui** - High-quality components, accessible by default, customizable themes, TypeScript support
- **Framer Motion** - Smooth animations, gesture support, layout animations, performance optimized

**User Experience**
- Lucide React - 1000+ beautiful icons
- Responsive Design - Mobile-first approach
- Dark Mode - System preference detection
- Accessibility - WCAG 2.1 AA compliant
- Progressive Web App - Offline capabilities

### Backend & Processing

**Data Management**
- **TanStack Query** - Intelligent caching, background updates, optimistic updates, error handling
- **Axios** - HTTP client library, request/response interceptors, automatic JSON parsing, error handling
- **Socket.io** - Real-time communication, WebSocket fallback, room management, event-driven architecture

**Document Processing**
- **PDF Processing**: PDF-Parse for text extraction, PDF.js for rendering, OCR capabilities, metadata extraction
- **Office Documents**: Mammoth for DOCX processing, RTF support, formatting preservation, table extraction
- **Text Processing**: Natural language processing, encoding detection, content sanitization, structure analysis

**AI Integration**
- OpenAI GPT Models - Text analysis and generation
- Anthropic Claude - Alternative AI provider
- Vector Embeddings - Semantic search capabilities
- Custom Models - Self-hosted AI support

### Development Tools

| Category | Tools | Purpose |
|----------|-------|---------|
| Code Quality | ESLint, Prettier, Husky | Linting, formatting, git hooks |
| Testing | Jest, React Testing Library | Unit and integration testing |
| Build Tools | Webpack, SWC, Turbopack | Fast builds and bundling |
| Type Checking | TypeScript, tsc | Static type analysis |
| Analytics | Vercel Analytics, Web Vitals | Performance monitoring |

---

## Project Structure

```
docmind/
├── src/                           # Source code
│   ├── app/                       # Next.js App Router
│   │   ├── api/                   # API endpoints
│   │   │   ├── analysis/          # Document analysis
│   │   │   ├── documents/         # Document management
│   │   │   ├── query/             # Search queries
│   │   │   ├── search/            # Search functionality
│   │   │   └── settings/          # Configuration
│   │   ├── auth/                  # Authentication
│   │   ├── dashboard/             # Main dashboard
│   │   ├── preview/               # Document preview
│   │   ├── settings/              # Settings page
│   │   ├── globals.css            # Global styles
│   │   ├── layout.tsx             # Root layout
│   │   └── page.tsx               # Landing page
│   ├── components/                # React components
│   │   ├── ui/                    # shadcn/ui components
│   │   │   ├── button.tsx         # Button component
│   │   │   ├── card.tsx           # Card component
│   │   │   ├── input.tsx          # Input component
│   │   │   └── ... (30+ components)
│   │   ├── auth/                  # Authentication components
│   │   │   ├── login-modal.tsx    # Login modal
│   │   │   └── signup-modal.tsx   # Signup modal
│   │   ├── settings/              # Settings components
│   │   ├── document-upload.tsx    # Upload interface
│   │   ├── query-interface.tsx    # Search interface
│   │   ├── document-list.tsx      # Document listing
│   │   ├── analysis-results.tsx   # Results display
│   │   ├── landing-page.tsx       # Landing page
│   │   └── protected-route.tsx    # Route protection
│   ├── hooks/                     # Custom React hooks
│   │   ├── use-socket.ts          # WebSocket hook
│   │   ├── use-mobile.ts          # Mobile detection
│   │   └── use-toast.ts           # Toast notifications
│   └── lib/                       # Utilities & config
│       ├── ai-service.ts          # AI integration
│       ├── api-client.ts          # API client
│       ├── auth-context.tsx       # Auth context
│       ├── socket-types.ts        # Socket types
│       ├── supabase.ts            # Database client
│       └── utils.ts               # Helper functions
├── public/                        # Static assets
│   ├── uploads/                   # Document storage
│   │   └── documents/             # Organized by ID
│   ├── favicon.ico                # Favicon
│   ├── logo.svg                   # App logo
│   └── robots.txt                 # SEO robots
├── docs/                          # Documentation
│   ├── API.md                     # API documentation
│   ├── DESIGN.md                  # Design system
│   └── DEPLOYMENT.md              # Deployment guide
├── next.config.ts                 # Next.js config
├── tailwind.config.ts             # Tailwind config
├── package.json                   # Dependencies
└── README.md                      # This file
```

### Key Components

**UI Components**
- **Document Upload**: Drag & drop interface, progress tracking, file validation, batch processing, error handling
- **Query Interface**: Natural language input, query suggestions, real-time search, result filtering, history tracking

**Core Systems**
- **AI Integration**: Multiple AI providers, semantic embeddings, content analysis, response streaming, error handling
- **Authentication**: Secure login/signup, session management, protected routes, user context, OAuth support

---

## Usage Guide

### Document Upload

1. **Access Upload**: Navigate to Dashboard, click "Upload Documents" tab, or use drag & drop anywhere
2. **Select Files**: Supported formats include PDF documents, Microsoft Word (.docx), Plain text (.txt), Rich text (.rtf)
3. **Monitor Progress**: Real-time processing status, error notifications, completion confirmations

### Search & Query

**Natural Language Queries:**
- "What are the main findings about climate change?"
- "Show me documents about machine learning"
- "Find contracts signed in 2023"

**Advanced Features:**
- Filter by date range
- Sort by relevance
- Export results
- Save searches

### Analysis Features

**Automatic Analysis:**
- Document summarization
- Key entity extraction
- Topic classification
- Sentiment analysis

**Custom Queries:**
- Ask specific questions
- Generate reports
- Compare documents
- Extract insights

### Settings & Configuration

**AI Configuration:**
- Choose AI provider
- Set API keys
- Adjust parameters
- Monitor usage

**Processing Settings:**
- File size limits
- Batch processing
- Quality settings
- Performance tuning

---

## Performance & Metrics

### Built for Speed

| Metric | Performance | Details |
|--------|-------------|---------|
| Page Load | < 2s | Optimized bundles & caching |
| Document Processing | < 30s | Parallel processing pipeline |
| Search Response | < 500ms | Vector search optimization |
| Mobile Performance | 95+ | Lighthouse performance score |
| Accessibility | AA | WCAG 2.1 compliance |

---

## Configuration

### Environment Variables

```bash
# ===== CORE CONFIGURATION =====
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
PORT=3000

# ===== AI PROVIDERS =====
# OpenAI Configuration
OPENAI_API_KEY=your_real_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4096

# Anthropic Configuration (Alternative)
ANTHROPIC_API_KEY=your_anthropic_key_here
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# ===== DATABASE =====
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# ===== UPLOAD SETTINGS =====
MAX_FILE_SIZE=10485760          # 10MB
MAX_FILES_PER_BATCH=10
ALLOWED_FILE_TYPES=pdf,docx,txt,rtf
UPLOAD_DIR=./public/uploads

# ===== PROCESSING =====
BATCH_SIZE=5
PROCESSING_TIMEOUT=30000        # 30 seconds
VECTOR_DIMENSIONS=1536
CHUNK_SIZE=1000
CHUNK_OVERLAP=200

# ===== SECURITY =====
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key
RATE_LIMIT_MAX=100              # requests per window
RATE_LIMIT_WINDOW=900000        # 15 minutes
```

### AI Provider Configuration

**OpenAI Setup:**
```typescript
{
  provider: "openai",
  apiKey: "your_real_api_key_here",
  model: "gpt-4-turbo-preview",
  maxTokens: 4096,
  temperature: 0.7
}
```

**Anthropic Setup:**
```typescript
{
  provider: "anthropic",
  apiKey: "your_real_anthropic_api_key_here",
  model: "claude-3-sonnet-20240229",
  maxTokens: 4096
}
```

**Custom Endpoint:**
```typescript
{
  provider: "custom",
  endpoint: "https://your-ai-api.com/v1/chat",
  headers: { "Authorization": "Bearer your-token" }
}
```

---

## Security & Privacy

### Data Protection

**Encryption & Storage**
- End-to-end encryption with AES-256 for files
- Encrypted database storage
- Secure API communication
- User-specific data separation
- Role-based access control
- Secure file handling

**Privacy Compliance**
- GDPR compliant
- No data tracking
- User data ownership

### Authentication

- Multi-factor authentication
- OAuth integration (Google, GitHub)
- JWT token management
- Session security
- Password policies

### Security Features

**File Validation**
- Strict type checking
- Size limitations
- Malware scanning
- Content sanitization

**API Security**
- Rate limiting
- Request validation
- CORS protection
- Input sanitization

**Infrastructure**
- HTTPS enforcement
- Security headers
- CSP policies
- Regular updates

### Monitoring

- Access logging
- Error tracking
- Performance monitoring
- Security alerts
- Audit trails

---

## API Documentation

### Document Management

```typescript
// Upload document
POST /api/documents/upload
Content-Type: multipart/form-data
Body: { file: File, metadata?: object }

// Get documents
GET /api/documents
Query: { page?, limit?, search?, filter? }

// Get document by ID
GET /api/documents/[id]
Response: { id, title, content, metadata, status }

// Delete document
DELETE /api/documents/[id]
```

### Search & Query

```typescript
// Semantic search
POST /api/search
Body: {
  query: string,
  filters?: object,
  limit?: number
}

// Natural language query
POST /api/query
Body: {
  question: string,
  documentIds?: string[],
  context?: string
}

// Get search history
GET /api/search/history
```

### AI Analysis

```typescript
// Analyze document
POST /api/analysis
Body: {
  documentId: string,
  analysisType: 'summary' | 'entities' | 'sentiment'
}

// Batch analysis
POST /api/analysis/batch
Body: {
  documentIds: string[],
  analysisTypes: string[]
}
```

---

## Contributing

### Getting Started

**1. Fork and Clone**
```bash
git clone https://github.com/your-username/docmind.git
cd docmind
```

**2. Install Dependencies**
```bash
npm install
```

**3. Create Feature Branch**
```bash
git checkout -b feature/amazing-feature
```

**4. Make Changes**
- Follow coding standards
- Add tests for new features
- Update documentation

**5. Submit Pull Request**
- Clear description
- Link related issues
- Request review

### Contribution Guidelines

**Code Standards**
- TypeScript - Strict type checking
- ESLint - Code linting rules
- Prettier - Code formatting
- Conventional Commits - Commit message format
- Testing - Unit tests for new features

### Ways to Contribute

- **Bug Fixes** - Fix reported issues
- **New Features** - Add functionality
- **UI/UX** - Improve user experience
- **Documentation** - Enhance docs
- **Testing** - Add test coverage

### Recognition

All contributors are recognized in:
- GitHub contributors page
- Project documentation
- Release notes
- Community showcase

---

## Support & Community

### Get Help

| Resource | Links |
|----------|-------|
| **Documentation** | [User Guide](docs/USER_GUIDE.md) • [API Reference](docs/API.md) • [Design System](docs/DESIGN.md) • [Deployment](docs/DEPLOYMENT.md) |
| **Issues & Bugs** | [Search Issues](https://github.com/your-username/docmind/issues) • [Report Bug](https://github.com/your-username/docmind/issues/new?template=bug_report.md) • [Feature Request](https://github.com/your-username/docmind/issues/new?template=feature_request.md) |
| **Community** | [Discord Server](https://discord.gg/docmind) • [Twitter Updates](https://twitter.com/docmind) • [LinkedIn](https://linkedin.com/company/docmind) |

---

## Project Stats

![GitHub stars](https://img.shields.io/github/stars/your-username/docmind?style=flat)
![GitHub forks](https://img.shields.io/github/forks/your-username/docmind?style=flat)
![GitHub issues](https://img.shields.io/github/issues/your-username/docmind)
![GitHub pull requests](https://img.shields.io/github/issues-pr/your-username/docmind)
![GitHub license](https://img.shields.io/github/license/your-username/docmind)

---

## License

**MIT License** - See [LICENSE](LICENSE) file for details

This project is open source and available under the MIT License.

---

<div align="center">

**DocMind** - Making documents intelligent, searchable, and actionable

Your support helps us continue improving DocMind

[Get started now](#quick-start) • [Join our community](#support--community)

</div>
