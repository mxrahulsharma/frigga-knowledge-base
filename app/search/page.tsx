'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Filter, FileText, Clock, User, Users, Archive, Calendar, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import DashboardLayout from '../dashlayout';

type SearchResult = {
  id: string;
  title: string;
  titleHighlight: string;
  contentPreview: string;
  updatedAt: string;
  createdAt: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  author: {
    name: string;
    email: string;
  };
  isOwner: boolean;
  permission: string;
  relevanceScore: number;
};

type SearchFilters = 'all' | 'owned' | 'shared' | 'recent' | 'archived';

export default function SearchPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<SearchFilters>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'title'>('relevance');

  const filters = [
    { key: 'all', label: 'All Documents', icon: FileText, count: 0 },
    { key: 'owned', label: 'My Documents', icon: User, count: 0 },
    { key: 'shared', label: 'Shared with Me', icon: Users, count: 0 },
    { key: 'recent', label: 'Recent', icon: Clock, count: 0 },
    { key: 'archived', label: 'Archived', icon: Archive, count: 0 },
  ];

  // Perform search when query or filter changes
  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch();
    } else {
      setResults([]);
      setTotalResults(0);
    }
  }, [query, filter, sortBy]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        filter,
        limit: '50'
      });

      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setResults(data.results);
      setTotalResults(data.total);

      // Update URL with search params
      const newUrl = `/search?q=${encodeURIComponent(query)}&filter=${filter}`;
      router.replace(newUrl, { scroll: false });
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(`/documents/${result.id}`);
  };

  const sortResults = (results: SearchResult[]) => {
    switch (sortBy) {
      case 'date':
        return [...results].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      case 'title':
        return [...results].sort((a, b) => a.title.localeCompare(b.title));
      case 'relevance':
      default:
        return [...results].sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  };

  const sortedResults = sortResults(results);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Documents</h1>
          
          {/* Search Input */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <Input
                type="text"
                placeholder="Search documents by title or content..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 pr-4 text-lg"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Document Type Filter */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Document Type</h3>
                    <div className="space-y-2">
                      {filters.map((filterOption) => {
                        const Icon = filterOption.icon;
                        return (
                          <button
                            key={filterOption.key}
                            onClick={() => setFilter(filterOption.key as SearchFilters)}
                            className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                              filter === filterOption.key
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            <Icon className="w-4 h-4 mr-2" />
                            {filterOption.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sort Options */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Sort By</h3>
                    <div className="space-y-2">
                      {[
                        { key: 'relevance', label: 'Relevance' },
                        { key: 'date', label: 'Date Updated' },
                        { key: 'title', label: 'Title' }
                      ].map((sortOption) => (
                        <button
                          key={sortOption.key}
                          onClick={() => setSortBy(sortOption.key as any)}
                          className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                            sortBy === sortOption.key
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'hover:bg-gray-100 text-gray-700'
                          }`}
                        >
                          {sortOption.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Search Stats */}
          {query && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {loading ? 'Searching...' : `${totalResults} result${totalResults !== 1 ? 's' : ''} found`}
              </span>
              {results.length > 0 && (
                <span>Sorted by {sortBy === 'relevance' ? 'relevance' : sortBy === 'date' ? 'date updated' : 'title'}</span>
              )}
            </div>
          )}
        </div>

        {/* Search Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching documents...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4">
            {sortedResults.map((result) => (
              <Card key={result.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleResultClick(result)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Title */}
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <h3
                          className="text-lg font-semibold text-gray-900"
                          dangerouslySetInnerHTML={{ __html: result.titleHighlight }}
                        />
                      </div>

                      {/* Content Preview */}
                      {result.contentPreview && (
                        <p
                          className="text-gray-600 mb-4 line-clamp-3"
                          dangerouslySetInnerHTML={{ __html: result.contentPreview }}
                        />
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {result.author.name || result.author.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Updated {new Date(result.updatedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          {result.visibility === 'PUBLIC' ? (
                            <Eye className="w-4 h-4" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                          {result.visibility}
                        </span>
                        {!result.isOwner && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                            {result.permission} access
                          </span>
                        )}
                        {result.isOwner && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                            Owner
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : query.trim().length >= 2 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find any documents matching "{query}"
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>Try:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Using different keywords</li>
                <li>Checking your spelling</li>
                <li>Using broader search terms</li>
                <li>Adjusting your filters</li>
              </ul>
            </div>
          </div>
        ) : query ? (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Enter your search query</h3>
            <p className="text-gray-600">
              Type at least 2 characters to start searching
            </p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search your documents</h3>
            <p className="text-gray-600">
              Use the search bar above to find documents by title or content
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 