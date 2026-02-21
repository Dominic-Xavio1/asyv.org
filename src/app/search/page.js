'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, User, Filter, ChevronRight, ChevronLeft, Grid, List, X, MapPin, Mail, Briefcase, Heart, Eye, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

// Predefined options for skills and interests
const INTEREST_OPTIONS = [
  "Technology", "Design", "Marketing", "Finance", "Healthcare", 
  "Education", "Sports", "Music", "Art", "Travel", "Cooking",
  "Photography", "Gaming", "Fitness", "Reading", "Writing"
];

const SKILL_OPTIONS = [
  "JavaScript", "React", "Next.js", "Node.js", "Python",
  "UI/UX Design", "Project Management", "Data Analysis",
  "Digital Marketing", "Content Writing", "SEO", "Graphic Design"
];

const DEFAULT_INTEREST = 'All interests';
const DEFAULT_SKILL = 'All skills';
const DEFAULT_LOCATION = 'All locations';

export default function SearchResultsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState('list');
  const [resultsCount, setResultsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [interests, setInterests] = useState([DEFAULT_INTEREST]);
  const [skills, setSkills] = useState([DEFAULT_SKILL]);
  const [locations, setLocations] = useState([DEFAULT_LOCATION]);
  
  // Filter states
  const [selectedInterest, setSelectedInterest] = useState(DEFAULT_INTEREST);
  const [selectedSkill, setSelectedSkill] = useState(DEFAULT_SKILL);
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [nameFilter, setNameFilter] = useState("");
  const [usernameFilter, setUsernameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Show filters by default on desktop
  useEffect(() => {
    const checkScreenSize = () => {
      if (typeof window !== 'undefined') {
        setShowFilters(window.innerWidth >= 768);
      }
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

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

  // Fetch users from API and parse interests, skills
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
          let parsedSkills = [];
          try {
            if (typeof u.interests === 'string') parsedInterests = JSON.parse(u.interests);
            else parsedInterests = u.interests || [];
            
            if (typeof u.skills === 'string') parsedSkills = JSON.parse(u.skills);
            else parsedSkills = u.skills || [];
          } catch (e) {
            parsedInterests = [];
            parsedSkills = [];
          }
          return { ...u, interests: parsedInterests, skills: parsedSkills };
        });
        if (!mounted) return;
        setUsers(parsed);

        // Extract unique interests
        const allInterests = new Set();
        parsed.forEach(u => (u.interests || []).forEach(i => allInterests.add(i)));
        setInterests([DEFAULT_INTEREST, ...Array.from(allInterests).sort()]);

        // Extract unique skills
        const allSkills = new Set();
        parsed.forEach(u => (u.skills || []).forEach(s => allSkills.add(s)));
        setSkills([DEFAULT_SKILL, ...Array.from(allSkills).sort()]);

        // Extract unique locations
        const allLocations = new Set();
        parsed.forEach(u => {
          if (u.location && u.location.trim()) {
            allLocations.add(u.location.trim());
          }
        });
        setLocations([DEFAULT_LOCATION, ...Array.from(allLocations).sort()]);

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

  // Comprehensive filtering logic
  const filteredUsers = useMemo(() => {
    let list = users;

    // Filter by interest
    if (selectedInterest && selectedInterest !== DEFAULT_INTEREST) {
      list = list.filter(u => (u.interests || []).includes(selectedInterest));
    }

    // Filter by skill
    if (selectedSkill && selectedSkill !== DEFAULT_SKILL) {
      list = list.filter(u => (u.skills || []).includes(selectedSkill));
    }

    // Filter by location
    if (selectedLocation && selectedLocation !== DEFAULT_LOCATION) {
      list = list.filter(u => 
        u.location && u.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Filter by name
    if (nameFilter && nameFilter.trim()) {
      const q = nameFilter.trim().toLowerCase();
      list = list.filter(u => 
        (u.full_name || '').toLowerCase().includes(q)
      );
    }

    // Filter by username
    if (usernameFilter && usernameFilter.trim()) {
      const q = usernameFilter.trim().toLowerCase();
      list = list.filter(u => 
        (u.username || '').toLowerCase().includes(q)
      );
    }

    // Filter by email
    if (emailFilter && emailFilter.trim()) {
      const q = emailFilter.trim().toLowerCase();
      list = list.filter(u => 
        (u.email || '').toLowerCase().includes(q)
      );
    }

    // General search query (searches across name, username, email, location, bio)
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(u => 
        (u.full_name || '').toLowerCase().includes(q) || 
        (u.username || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.location || '').toLowerCase().includes(q) ||
        (u.bio || '').toLowerCase().includes(q) ||
        (u.interests || []).some(i => i.toLowerCase().includes(q)) ||
        (u.skills || []).some(s => s.toLowerCase().includes(q))
      );
    }

    return list;
  }, [users, selectedInterest, selectedSkill, selectedLocation, nameFilter, usernameFilter, emailFilter, searchQuery]);

  // Keep resultsCount in sync
  useEffect(() => setResultsCount(filteredUsers.length), [filteredUsers]);

  const clearFilters = () => {
    setSelectedInterest(DEFAULT_INTEREST);
    setSelectedSkill(DEFAULT_SKILL);
    setSelectedLocation(DEFAULT_LOCATION);
    setNameFilter("");
    setUsernameFilter("");
    setEmailFilter("");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedInterest !== DEFAULT_INTEREST ||
    selectedSkill !== DEFAULT_SKILL ||
    selectedLocation !== DEFAULT_LOCATION ||
    nameFilter.trim() !== "" ||
    usernameFilter.trim() !== "" ||
    emailFilter.trim() !== "" ||
    searchQuery.trim() !== "";

  const formatNumber = (num) => {
    if (typeof num === 'number') {
      return num.toLocaleString();
    }
    return num || "0";
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  const openProfileModal = (user) => {
    setSelectedUser(user);
    setShowProfileModal(true);
  };

  const closeProfileModal = () => {
    setShowProfileModal(false);
    setSelectedUser(null);
  };

  const handleViewModeToggle = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200 pt-16 pb-24">
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
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg ${showFilters ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800'}`}
                >
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
                  placeholder="Search by name, username, email, location, skills, interests..."
                />
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Filters Section */}
        {showFilters && (
          <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Filter size={20} />
                Advanced Filters
              </h2>
              {hasActiveFilters && (
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  size="sm"
                  className="text-gray-600 dark:text-gray-400"
                >
                  <X size={16} className="mr-2" />
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Name Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User size={16} />
                  Name
                </label>
                <Input
                  type="text"
                  value={nameFilter}
                  onChange={(e) => setNameFilter(e.target.value)}
                  placeholder="Filter by name..."
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              {/* Username Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User size={16} />
                  Username
                </label>
                <Input
                  type="text"
                  value={usernameFilter}
                  onChange={(e) => setUsernameFilter(e.target.value)}
                  placeholder="Filter by username..."
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              {/* Email Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </label>
                <Input
                  type="email"
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  placeholder="Filter by email..."
                  className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>

              {/* Interest Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Heart size={16} />
                  Interest
                </label>
                <Select value={selectedInterest} onValueChange={setSelectedInterest}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    {interests.map((interest) => (
                      <SelectItem key={interest} value={interest}>
                        {interest}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Skill Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Briefcase size={16} />
                  Skill
                </label>
                <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    {skills.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <MapPin size={16} />
                  Location
                </label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Filters Display */}
            {hasActiveFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  {selectedInterest !== DEFAULT_INTEREST && (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm flex items-center gap-2">
                      Interest: {selectedInterest}
                      <button onClick={() => setSelectedInterest(DEFAULT_INTEREST)}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {selectedSkill !== DEFAULT_SKILL && (
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm flex items-center gap-2">
                      Skill: {selectedSkill}
                      <button onClick={() => setSelectedSkill(DEFAULT_SKILL)}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {selectedLocation !== DEFAULT_LOCATION && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm flex items-center gap-2">
                      Location: {selectedLocation}
                      <button onClick={() => setSelectedLocation(DEFAULT_LOCATION)}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {nameFilter.trim() && (
                    <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm flex items-center gap-2">
                      Name: {nameFilter}
                      <button onClick={() => setNameFilter("")}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {usernameFilter.trim() && (
                    <span className="px-3 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-full text-sm flex items-center gap-2">
                      Username: {usernameFilter}
                      <button onClick={() => setUsernameFilter("")}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                  {emailFilter.trim() && (
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-sm flex items-center gap-2">
                      Email: {emailFilter}
                      <button onClick={() => setEmailFilter("")}>
                        <X size={14} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-gray-600 dark:text-gray-400">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">{formatNumber(resultsCount)}</span> results
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`hidden md:flex items-center gap-2 px-3 py-2 rounded-lg ${showFilters ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
            >
              <Filter size={20} />
              Filters
            </button>
            <div className="flex items-center gap-2">
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
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700 mb-8" />

        {/* User Results */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <User className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No users found matching your filters</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-green-600 dark:text-green-400 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-12 max-w-[1000px] mx-auto' }>
            {filteredUsers.map((u) => {
              const parsedSkills = Array.isArray(u.skills) ? u.skills : (typeof u.skills === 'string' ? JSON.parse(u.skills || '[]') : []);
              
              return (
                <div key={u.id} className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 p-4 hover:shadow-xl hover:border-green-200 dark:hover:border-green-800 hover:scale-[1.02] ${viewMode === 'list' ? 'flex items-start gap-4' : ''}`}>
                  <div className="flex-shrink-0">
                    {/* Profile Image with hover effect */}
                    <div className="relative group">
                      <img 
                        src={u.profile_image || '/default.png'} 
                        alt={u.full_name || u.username} 
                        className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700 transition-all duration-300 group-hover:border-green-400 dark:group-hover:border-green-600 group-hover:scale-105 cursor-pointer" 
                        onError={(e) => { e.target.src = '/default.png' }}
                        onClick={() => openProfileModal(u)}
                      />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200 cursor-pointer" onClick={() => openProfileModal(u)}>
                          {u.full_name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">
                          @{u.username}
                        </p>
                        {u.email && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-1 hover:text-gray-500 dark:hover:text-gray-400 transition-colors duration-200">
                            {u.email}
                          </p>
                        )}
                      </div>
                      {u.location && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 flex-shrink-0 hover:text-green-600 dark:hover:text-green-400 transition-colors duration-200">
                          <MapPin size={14} />
                          <span className="hidden sm:inline">{u.location}</span>
                        </div>
                      )}
                    </div>
                    {u.bio && (
                      <div className="mt-2 mb-3">
                        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                          {truncateText(u.bio, 120)}
                        </p>
                        {u.bio.length > 10 && (
                          <button
                            onClick={() => openProfileModal(u)}
                            className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-xs font-medium mt-1 flex items-center gap-1 transition-colors"
                          >
                            <Eye size={12} />
                            View full profile
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Skills Display */}
                    {parsedSkills.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                          <Briefcase size={12} />
                          Skills
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {parsedSkills.slice(0, 3).map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors duration-200 cursor-pointer">
                              {skill}
                            </span>
                          ))}
                          {parsedSkills.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 cursor-pointer">
                              +{parsedSkills.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interests Display */}
                    {(u.interests || []).length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                          <Heart size={12} />
                          Interests
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          {(u.interests || []).slice(0, 6).map((i, idx) => (
                            <button 
                              key={idx} 
                              onClick={() => {
                                setSelectedInterest(i);
                                setShowFilters(true);
                              }}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded-full text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-all duration-200 transform hover:scale-105"
                            >
                              {i}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mt-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading results...</p>
          </div>
        )}

        {/* Profile Modal */}
        <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
          <DialogContent className="max-w-[410px] max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                User Profile
              </DialogTitle>
              <DialogDescription>
                Complete profile information
              </DialogDescription>
            </DialogHeader>
            
            {selectedUser && (
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <img 
                        src={selectedUser.profile_image || '/default.png'} 
                        alt={selectedUser.full_name || selectedUser.username} 
                        className="h-24 w-24 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700" 
                        onError={(e) => { e.target.src = '/default.png' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedUser.full_name || 'Unknown User'}
                      </h2>
                      <p className="text-lg text-gray-500 dark:text-gray-400">
                        @{selectedUser.username}
                      </p>
                      {selectedUser.email && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                          {selectedUser.email}
                        </p>
                      )}
                      {selectedUser.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-2">
                          <MapPin size={16} />
                          <span>{selectedUser.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Bio Section */}
                  {selectedUser.bio && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About</h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                        {selectedUser.bio}
                      </p>
                    </div>
                  )}

                  {/* Skills Section */}
                  {(selectedUser.skills || []).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Briefcase size={20} />
                        Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(selectedUser.skills || []).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interests Section */}
                  {(selectedUser.interests || []).length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Heart size={20} />
                        Interests
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(selectedUser.interests || []).map((interest, idx) => (
                          <Badge key={idx} variant="outline" className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Username</h4>
                      <p className="text-gray-900 dark:text-white font-medium">{selectedUser.username}</p>
                    </div>
                    {selectedUser.email && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Email</h4>
                        <p className="text-gray-900 dark:text-white font-medium">{selectedUser.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
