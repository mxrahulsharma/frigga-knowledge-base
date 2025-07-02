'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Filter, FileText, Clock, User, Users, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import SearchSuggestions from './SearchSuggestions';

type SearchResult = {
  id: string;
  title: string;
  titleHighlight: string;
  contentPreview: string;
  updatedAt: string;
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

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filter, setFilter] = useState<SearchFilters>('all');
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const filters = [
    { key: 'all', label: 'All Documents', icon: FileText },
    { key: 'owned', label: 'My Documents', icon: User },
    { key: 'shared', label: 'Shared with Me', icon: Users },
    { key: 'recent', label: 'Recent', icon: Clock },
    { key: 'archived', label: 'Archived', icon: Archive },
  ];

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
        setShowSuggestions(false);
      } else {
        setResults([]);
        setShowResults(false);
        // Only show suggestions if input is empty and focused
        if (query === '') {
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, filter]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        filter,
        limit: '10'
      });

      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setResults(data.results);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    router.push(`/documents/${result.id}`);
    setShowResults(false);
    setQuery('');
    
    // Save to recent searches
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updatedSearches = [query, ...recentSearches.filter((s: string) => s !== query)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    setShowSuggestions(true);
  };

  const getFilterIcon = (filterKey: SearchFilters) => {
    const filter = filters.find(f => f.key === filterKey);
    return filter ? filter.icon : FileText;
  };

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
        <Input
          type="text"
          placeholder="Search documents... (Ctrl+K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-20 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            } else if (query === '') {
              setShowSuggestions(true);
            }
          }}
        />
        
        {/* Filter Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
        >
          <Filter className="w-4 h-4" />
        </Button>

        {/* Clear Button */}
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filter Dropdown */}
      {showFilters && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <CardContent className="p-2">
            <div className="space-y-1">
              {filters.map((filterOption) => {
                const Icon = filterOption.icon;
                return (
                  <button
                    key={filterOption.key}
                    onClick={() => {
                      setFilter(filterOption.key as SearchFilters);
                      setShowFilters(false);
                    }}
                    className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                      filter === filterOption.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {filterOption.label}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Suggestions */}
      <SearchSuggestions 
        onSuggestionClick={handleSuggestionClick}
        show={showSuggestions && !showResults}
      />

      {/* Search Results */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-40 shadow-lg max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="divide-y">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span
                            className="font-medium text-gray-900 truncate"
                            dangerouslySetInnerHTML={{ __html: result.titleHighlight }}
                          />
                        </div>
                        
                        {result.contentPreview && (
                          <p
                            className="text-sm text-gray-600 line-clamp-2 mb-2"
                            dangerouslySetInnerHTML={{ __html: result.contentPreview }}
                          />
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {result.author.name || result.author.email}
                          </span>
                          <span>
                            {new Date(result.updatedAt).toLocaleDateString()}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              result.visibility === 'PUBLIC'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {result.visibility}
                          </span>
                          {!result.isOwner && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                              {result.permission}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No documents found</p>
                <p className="text-sm">Try adjusting your search terms or filters</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 