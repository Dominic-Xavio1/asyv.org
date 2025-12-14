'use client';

import { useState } from 'react';
import { Search, Calendar, User, Filter, ChevronRight, ChevronLeft, Grid, List } from 'lucide-react';

const articles = [
  {
    id: 1,
    title: "The Only Rule in Street Photography",
    author: "Nick Bedford",
    date: "February 14, 2019",
    excerpt: "Exploring the fundamental principles that guide street photographers in capturing authentic moments.",
    category: "Photography",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Cabramatta: A Moment In Time",
    author: "Markus Andersen",
    date: "January 13, 2017",
    excerpt: "A visual journey through Cabramatta capturing the essence of community and urban life.",
    category: "Documentary",
    readTime: "8 min read",
  },
  {
    id: 3,
    title: "The Storytellers Kit – Daniel Schaefer",
    author: "Bellamy",
    date: "November 3, 2014",
    excerpt: "An in-depth look at Daniel Schaefer's approach to storytelling through street photography.",
    category: "Interview",
    readTime: "12 min read",
  },
  {
    id: 4,
    title: "The Clock of Life in Street Photography",
    author: "Shaun La",
    date: "June 12, 2004",
    excerpt: "How timing and patience create powerful narratives in street photography.",
    category: "Technique",
    readTime: "6 min read",
  },
  {
    id: 5,
    title: "Urban Geometry: Lines and Light",
    author: "Maria Chen",
    date: "March 22, 2021",
    excerpt: "Finding geometric patterns in everyday urban environments.",
    category: "Composition",
    readTime: "4 min read",
  },
  {
    id: 6,
    title: "The Decisive Moment Revisited",
    author: "Robert Cartier",
    date: "August 5, 2018",
    excerpt: "Modern interpretation of Henri Cartier-Bresson's famous concept.",
    category: "Philosophy",
    readTime: "7 min read",
  }
];

const categories = [
  "All Categories",
  "Photography",
  "Documentary",
  "Interview",
  "Technique",
  "Composition",
  "Philosophy",
  "Gear",
  "Inspiration"
];

export default function SearchResultsPage() {
  const [searchQuery, setSearchQuery] = useState("street photography");
  const [selectedCategory, setSelectedCategory] = useState("Photography");
  const [viewMode, setViewMode] = useState('list');
  const [resultsCount, setResultsCount] = useState(1535);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

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
                Q Street photography
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
                  placeholder="Search articles..."
                />
              </form>
            </div>
          </div>

          {/* Categories Filter */}
          <div className="mt-4 overflow-x-auto">
            <div className="flex items-center gap-2 min-w-max">
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {selectedCategory === "All Categories" ? "All categories" : "1 category selected"}
              </span>
              <div className="flex gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 hidden md:inline-flex">
                <Filter size={20} />
              </button>
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

        {/* Articles List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-8'}>
          {articles.map((article) => (
            <article
              key={article.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg dark:hover:shadow-xl transition-all duration-300 ${
                viewMode === 'list' ? 'flex flex-col md:flex-row' : ''
              }`}
            >
              {viewMode === 'list' && (
                <div className="md:w-48 h-48 md:h-auto relative flex-shrink-0">
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
                </div>
              )}
              
              {viewMode === 'grid' && (
                <div className="h-48 relative">
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700" />
                </div>
              )}
              
              <div className="p-6 flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                    {article.category}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">• {article.readTime}</span>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer">
                  {article.title}
                </h2>
                
                <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                  {article.excerpt}
                </p>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <User size={16} />
                      <span>{article.author}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar size={16} />
                      <span>{article.date}</span>
                    </div>
                  </div>
                  <button className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium text-sm flex items-center gap-1 self-start sm:self-center">
                    Read more
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </article>
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
              Showing 1-{articles.length} of {formatNumber(resultsCount)} results
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