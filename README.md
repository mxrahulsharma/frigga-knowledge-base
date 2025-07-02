# KnowledgeFlow - Knowledge Base Application

A modern, collaborative knowledge base application built with Next.js, featuring document management, real-time search, and team collaboration features.

## Features

### 🔍 **Advanced Search System**
- **Real-time search** with 300ms debouncing
- **Full-text search** across document titles and content
- **Multiple filters**: All documents, My documents, Shared with me, Recent, Archived
- **Search highlighting** with highlighted terms in results
- **Content previews** showing context around search terms
- **Search suggestions** with recent and popular searches
- **Keyboard shortcuts** (Ctrl+K to open search)
- **Dedicated search page** with advanced filtering and sorting

### 📄 **Document Management**
- **Rich text editor** with TipTap
- **Document versioning** with edit history
- **Access control** with VIEW and EDIT permissions
- **Document sharing** with other users
- **Public/Private visibility** settings
- **Document organization** by ownership and sharing status

### 👥 **Collaboration Features**
- **User authentication** with NextAuth.js
- **Permission-based access** control
- **Document sharing** with specific users
- **@mentions functionality** with user lookup and auto-permissions
- **Real-time notifications** for mentions and document changes
- **Edit tracking** with author information
- **Version history** for document changes

### 🎨 **Modern UI/UX**
- **Responsive design** for all screen sizes
- **Dark mode support** (CSS variables ready)
- **Loading states** and error handling
- **Keyboard navigation** support
- **Accessibility features** with proper ARIA labels

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- NextAuth.js configuration

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd frigga-knowledge-base
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your database and NextAuth.js settings in `.env.local`

5. Run database migrations:
```bash
npx prisma migrate dev
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Search Features

### Quick Search
- Use the search bar in the top navigation
- Type at least 2 characters to start searching
- Use filters to narrow down results
- Click on suggestions for quick access

### Advanced Search
- Navigate to the dedicated Search page
- Use advanced filters and sorting options
- Sort by relevance, date, or title
- View detailed search results with metadata

### Keyboard Shortcuts
- `Ctrl/Cmd + K`: Open search page
- `Escape`: Clear search input
- `Enter`: Select highlighted result

## Collaboration Features

### @mentions System
- **Type @** in the document editor to mention users
- **Real-time user lookup** with search suggestions
- **Auto-permission assignment** - mentioned users get VIEW access
- **Visual mention styling** with blue highlighting
- **Keyboard navigation** in mention suggestions

### Notifications
- **Real-time notifications** for mentions and document changes
- **Notification bell** in the top navigation with unread count
- **Click to view** notifications and navigate to documents
- **Mark as read** functionality
- **Notification history** with timestamps

### Document Sharing
- **Manual sharing** with specific users
- **Permission levels**: VIEW and EDIT access
- **Auto-sharing** when users are mentioned
- **Access management** through dedicated access control page

## API Endpoints

### Search API
- `GET /api/search?q={query}&filter={filter}&limit={limit}`
- Filters: `all`, `owned`, `shared`, `recent`, `archived`

### Document APIs
- `GET /api/documents` - List all documents
- `GET /api/documents/[id]` - Get specific document
- `PUT /api/documents/[id]` - Update document
- `POST /api/documents` - Create new document
- `GET /api/documents/shared?userId={id}` - Shared documents
- `GET /api/documents/recent?userId={id}` - Recent documents
- `GET /api/documents/archived?userId={id}` - Archived documents

### Version History
- `GET /api/documents/[id]/versions` - Get document versions

### Access Control
- `GET /api/documents/[id]/permissions` - Get document permissions
- `POST /api/documents/[id]/permissions` - Add user permission
- `DELETE /api/documents/[id]/permissions` - Remove user permission

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Rich Text Editor**: TipTap
- **Search**: Custom full-text search with Prisma
- **Deployment**: Vercel-ready

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   ├── dashboard/         # Dashboard page
│   ├── documents/         # Document management
│   ├── search/            # Search page
│   └── ...                # Other pages
├── components/            # React components
│   ├── ui/               # UI components
│   ├── SearchBar.tsx     # Search component
│   └── ...               # Other components
├── lib/                  # Utility libraries
├── prisma/               # Database schema and migrations
└── types/                # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
