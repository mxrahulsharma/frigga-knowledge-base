'use client';

import { useState, useEffect } from 'react';
import { Search, Clock, TrendingUp } from 'lucide-react';

type SearchSuggestion = {
  id: string;
  text: string;
  type: 'recent' | 'popular';
  count?: number;
};

export default function SearchSuggestions({ 
  onSuggestionClick, 
  show = false 
}: { 
  onSuggestionClick: (suggestion: string) => void;
  show: boolean;
}) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const recentSuggestions = recentSearches.slice(0, 5).map((search: string, index: number) => ({
      id: `recent-${index}`,
      text: search,
      type: 'recent' as const
    }));

    // Mock popular searches (in a real app, this would come from analytics)
    const popularSuggestions = [
      { id: 'popular-1', text: 'meeting notes', type: 'popular' as const, count: 15 },
      { id: 'popular-2', text: 'project plan', type: 'popular' as const, count: 12 },
      { id: 'popular-3', text: 'ideas', type: 'popular' as const, count: 8 },
      { id: 'popular-4', text: 'research', type: 'popular' as const, count: 6 },
    ];

    setSuggestions([...recentSuggestions, ...popularSuggestions]);
  }, []);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSuggestionClick(suggestion.text);
    
    // Save to recent searches
    const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updatedSearches = [suggestion.text, ...recentSearches.filter((s: string) => s !== suggestion.text)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  if (!show || suggestions.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      <div className="p-2">
        {/* Recent Searches */}
        {suggestions.filter(s => s.type === 'recent').length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <Clock className="w-3 h-3" />
              Recent Searches
            </div>
            {suggestions.filter(s => s.type === 'recent').map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Search className="w-3 h-3 text-gray-400" />
                {suggestion.text}
              </button>
            ))}
          </div>
        )}

        {/* Popular Searches */}
        {suggestions.filter(s => s.type === 'popular').length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <TrendingUp className="w-3 h-3" />
              Popular Searches
            </div>
            {suggestions.filter(s => s.type === 'popular').map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center justify-between px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Search className="w-3 h-3 text-gray-400" />
                  {suggestion.text}
                </div>
                <span className="text-xs text-gray-400">{suggestion.count} searches</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 