'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, User, Filter, ChevronRight, ChevronLeft, Grid, List } from 'lucide-react';

// Users will be fetched from `/api/users`

// placeholder while interests load
const DEFAULT_INTEREST = 'All interests';

export default function SearchResultsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInterest, setSelectedInterest] = useState(DEFAULT_INTEREST);
  const [viewMode, setViewMode] = useState('list');
  const [resultsCount, setResultsCount] = useState(1535);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [interests, setInterests] = useState([DEFAULT_INTEREST]);

  const handleSearch = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleCategorySelect = (category) => {
    setSelectedInterest(category);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  // Fetch users from API and parse interests
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        const parsed = (data.users || []).map(u => {
          let parsedInterests = [];
          try {
            if (typeof u.interests === 'string') parsedInterests = JSON.parse(u.interests);
            else parsedInterests = u.interests || [];
          } catch (e) {
            parsedInterests = [];
          }
          return { ...u, interests: parsedInterests };
        });
        if (!mounted) return;
        setUsers(parsed);

        // extract unique interests
        const all = new Set();
        parsed.forEach(u => (u.interests || []).forEach(i => all.add(i)));
        setInterests([DEFAULT_INTEREST, ...Array.from(all).sort()]);
        setResultsCount(parsed.length);
      } catch (err) {
        console.error('Error loading users', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false };
  }, []);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (selectedInterest && selectedInterest !== DEFAULT_INTEREST) {
      list = list.filter(u => (u.interests || []).includes(selectedInterest));
    }
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(u => (u.full_name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q));
    }
    return list;
  }, [users, selectedInterest, searchQuery]);

  // keep resultsCount in sync
  useEffect(() => setResultsCount(filteredUsers.length), [filteredUsers]);

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
      setResultsCount(prev => prev + 20);
      setIsLoading(false);
    }, 800);
  };

  const formatNumber = (num) => {
    if (typeof num === 'number') {
      return num.toLocaleString();
    }
    return num || "0";
  };

  const handleViewModeToggle = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                People
              </h1>
              <div className="md:hidden flex items-center gap-2">
                <button
                  onClick={handleViewModeToggle}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800"
                >
                  {viewMode === 'grid' ? <List size={20} /> : <Grid size={20} />}
                </button>
                <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Filter size={20} />
                </button>
              </div>
            </div>
            
            <div className="relative flex-1 max-w-2xl">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  placeholder="Search users..."
                />
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">{formatNumber(resultsCount)}</span> results
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">View:</span>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              <List size={20} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              <Grid size={20} />
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 mb-8" />

        {/* User Results */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredUsers.map((u) => (
            <div key={u.id} className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-200 p-4 ${viewMode === 'list' ? 'flex items-start gap-4' : ''}`}>
              <div className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.profile_image || '/placeholder.svg'} alt={u.full_name || u.username} className="h-20 w-20 rounded-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{u.full_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{u.username}</p>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{u.location}</div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-2 mb-3 line-clamp-2">{u.bio}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {(u.interests || []).slice(0, 6).map((i) => (
                    <button key={i} onClick={() => handleCategorySelect(i)} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded-full text-gray-700 dark:text-gray-300">{i}</button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading results...</p>
          </div>
        )}

        {/* Results Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-gray-600 dark:text-gray-400">
              Showing 1-{filteredUsers.length} of {formatNumber(resultsCount)} results
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageClick(page)}
                    className={`w-10 h-10 rounded-lg ${
                      currentPage === page
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <span className="px-2 text-gray-500 dark:text-gray-400">...</span>
                <button
                  onClick={() => handlePageClick(10)}
                  className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  10
                </button>
              </div>
              
              <button
                onClick={handleNextPage}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
            <button
              onClick={handleLoadMore}
              disabled={isLoading}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              Show me more results
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </main>
      <footer className="mt-12 py-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              © 2024 Street Photography Archive. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                Contact
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}