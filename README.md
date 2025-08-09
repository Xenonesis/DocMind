# 🧠 DocMind - Intelligent Document Processing Platform

Transform how you interact with documents through AI-powered semantic search, natural language queries, and intelligent analysis. DocMind makes your documents searchable, queryable, and actionable.

![DocMind Dashboard](https://via.placeholder.com/800x400/1e293b/ffffff?text=DocMind+Dashboard)

## ✨ Key Features

### 📄 Smart Document Processing
- **Multi-format Support** - PDF, DOCX, TXT, and more
- **Intelligent Extraction** - Automatic text extraction and preprocessing
- **Real-time Processing** - Live status updates with WebSocket integration
- **Batch Upload** - Process multiple documents simultaneously

### 🔍 Advanced Search & Query
- **Semantic Search** - Find documents by meaning, not just keywords
- **Natural Language Queries** - Ask questions in plain English
- **Context-Aware Results** - Get relevant excerpts with highlighted matches
- **Query History** - Track and revisit previous searches

### 🤖 AI-Powered Analysis
- **Document Summarization** - Generate concise summaries automatically
- **Key Information Extraction** - Identify important entities and concepts
- **Content Classification** - Automatic categorization and tagging
- **Similarity Detection** - Find related documents and content

### 📊 Analytics & Insights
- **Usage Statistics** - Track document processing and query patterns
- **Performance Metrics** - Monitor system efficiency and response times
- **Content Analytics** - Understand your document collection better

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with JavaScript enabled

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd docmind

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access DocMind.

### Production Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🏗️ Technology Stack

### Frontend
- **⚡ Next.js 15** - React framework with App Router
- **📘 TypeScript** - Type-safe development
- **🎨 Tailwind CSS 4** - Modern utility-first styling
- **🧩 shadcn/ui** - High-quality component library
- **🌈 Framer Motion** - Smooth animations and transitions

### Backend & Data
- **🔄 TanStack Query** - Powerful data fetching and caching
- **🌐 Axios** - HTTP client for API communication
- **📊 Socket.io** - Real-time WebSocket communication
- **🖼️ Sharp** - High-performance image processing

### Document Processing
- **📄 Mammoth** - DOCX document processing
- **📋 PDF-Parse** - PDF text extraction
- **🔍 Custom parsers** - Support for various document formats

### UI/UX
- **🎯 Lucide React** - Beautiful icon library
- **📱 Responsive Design** - Mobile-first approach
- **🌙 Dark Mode** - Built-in theme switching
- **♿ Accessibility** - WCAG compliant components

## 📁 Project Structure

```
docmind/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── document-upload.tsx
│   │   ├── query-interface.tsx
│   │   ├── document-list.tsx
│   │   ├── analysis-results.tsx
│   │   └── settings/         # Settings components
│   ├── hooks/                # Custom React hooks
│   │   └── use-socket.ts     # WebSocket hook
│   └── lib/                  # Utilities and configurations
│       ├── socket.ts         # Socket.io client
│       └── utils.ts          # Helper functions
├── public/                   # Static assets
│   ├── uploads/             # Document uploads
│   └── logo.svg             # Application logo
├── server.ts                # Custom server with Socket.io
└── package.json             # Dependencies and scripts
```

## 🎯 Core Components

### Document Upload
- Drag-and-drop interface
- Progress tracking
- File validation
- Batch processing support

### Query Interface
- Natural language input
- Query suggestions
- Real-time search
- Result filtering

### Document Management
- List view with metadata
- Status indicators
- Bulk operations
- Search and filter

### Analysis Results
- Highlighted excerpts
- Relevance scoring
- Export capabilities
- Visual analytics

### Settings Panel
- AI API configuration
- Processing preferences
- User customization
- System monitoring

## 🔧 Configuration

### Environment Variables

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
OPENAI_API_KEY=your_openai_key_here

# Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=pdf,docx,txt

# Processing Configuration
BATCH_SIZE=5
PROCESSING_TIMEOUT=30000
```

### AI API Settings
Configure your preferred AI service through the settings panel:
- OpenAI GPT models
- Custom API endpoints
- Processing parameters
- Rate limiting

## 📊 Usage Examples

### Basic Document Upload
1. Navigate to the Upload tab
2. Drag files or click to select
3. Monitor processing status
4. View processed documents in Documents tab

### Semantic Search
1. Go to Query tab
2. Enter natural language question: "What are the main findings about climate change?"
3. Review results with highlighted excerpts
4. Export or save relevant findings

### Document Analysis
1. Select processed documents
2. Run analysis queries
3. View generated summaries
4. Export insights and reports

## 🚀 Performance Features

- **Lazy Loading** - Components load on demand
- **Caching** - Intelligent query and result caching
- **Streaming** - Real-time processing updates
- **Optimization** - Automatic image and asset optimization
- **Progressive Enhancement** - Works without JavaScript

## 🔒 Security & Privacy

- **File Validation** - Strict file type and size checking
- **Secure Upload** - Protected file handling
- **Data Isolation** - User data separation
- **API Security** - Rate limiting and authentication
- **Privacy First** - No data tracking or analytics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation** - Check our [Wiki](wiki) for detailed guides
- **Issues** - Report bugs or request features via [GitHub Issues](issues)
- **Discussions** - Join our [Community Discussions](discussions)

---

**DocMind** - Making documents intelligent, searchable, and actionable. Built with modern web technologies for the future of document processing.
