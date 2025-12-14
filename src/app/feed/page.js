'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Eye, Clock, TrendingUp, Search, Filter, ChevronRight, Compass, BookOpen, Users, Calendar, Flame, Loader, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import defaultAvatar from '../../../public/default.png';
const dummyArticles = [
  { id: 1, title: 'Building Sustainable Communities Through Education', views: 856, discussions: 42 },
  { id: 2, title: 'The Power of Mentorship in Youth Development', views: 734, discussions: 38 },
  { id: 3, title: 'Creating Inclusive Spaces for Growth', views: 612, discussions: 29 },
];

const dummyTrendingNews = [
  { 
    id: 1, 
    title: "Annual ASYV Reunion Dates Announced", 
    category: "Events",
    timestamp: "2 hours ago",
    views: 1203,
    hot: true
  },
  { 
    id: 2, 
    title: "New Scholarship Program Launched for Youth", 
    category: "Education",
    timestamp: "4 hours ago",
    views: 856,
    hot: true
  },
];

// Comment Section Component
const CommentSection = ({ postId, isOpen, comments }) => {
  const [newComment, setNewComment] = useState('');

  if (!isOpen) return null;

  return (
    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-gray-700 space-y-4">
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div className="relative w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
              <Image 
                src={comment.avatar} 
                alt={comment.author}
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="bg-neutral-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="font-medium text-sm text-neutral-900 dark:text-gray-200">{comment.author}</p>
                <p className="text-sm text-neutral-700 dark:text-gray-300 mt-1">{comment.text}</p>
              </div>
              <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1 ml-3">{comment.time}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 px-3 py-2 text-sm border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
        />
        <button className="px-4 py-2 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-800 dark:hover:bg-green-700 transition-colors text-sm font-medium">
          Post
        </button>
      </div>
    </div>
  );
};

// Simple PostCard component if missing
const SimplePostCard = ({ post }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likes, setLikes] = useState(post.likes);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(isLiked ? likes - 1 : likes + 1);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden">
            <Image
              src={post.authorAvatar}
              alt={post.authorName}
              width={40}
              height={40}
              className="object-cover"
            />
          </div>
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200">{post.authorName}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">@{post.authorUsername}</p>
          </div>
        </div>
        
        {post.title && (
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{post.title}</h3>
        )}
        <p className="text-gray-700 dark:text-gray-300 mb-3">{post.content}</p>
        
        {post.image && (
          <div className="relative w-full h-64 rounded-lg overflow-hidden mb-3">
            <Image
              src={post.image}
              alt="Post image"
              fill
              className="object-cover"
            />
          </div>
        )}
        
        {post.video && (
          <div className="relative w-full h-64 rounded-lg overflow-hidden mb-3">
            <video
              src={post.video}
              controls
              className="w-full h-full object-cover"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        
        <div className="flex gap-2 mb-3">
          {post.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between border-t border-b border-neutral-100 dark:border-gray-800 py-2">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 ${isLiked ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'} hover:text-red-500 dark:hover:text-red-400 transition-colors`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-gray-800 dark:text-gray-200">{likes}</span>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-gray-800 dark:text-gray-200">{post.comments}</span>
          </button>
          
          <button className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-gray-800 dark:text-gray-200">{post.shares}</span>
          </button>
        </div>
      </div>
      
      {showComments && (
        <CommentSection 
          postId={post.id}
          isOpen={showComments}
          comments={[
            { id: 1, author: 'John Doe', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', text: 'This is amazing!', time: '1 hour ago' },
            { id: 2, author: 'Jane Smith', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', text: 'So inspiring!', time: '2 hours ago' }
          ]}
        />
      )}
    </div>
  );
};

export default function SocialFeed() {
  const [posts, setPosts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [auth, setAuth] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // Get auth from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAuth = localStorage.getItem('auth');
      const storedUser = localStorage.getItem('userInfo');
      if (storedAuth) {
        setAuth(JSON.parse(storedAuth));
      }
      if (storedUser) {
        setUserInfo(JSON.parse(storedUser));
      }
    }
  }, []);

  // Fetch posts and opportunities from backend
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch posts (now includes user info from JOIN)
        const postsResponse = await fetch('/api/post');
        const postsData = await postsResponse.json();
        
        if (postsData.success && postsData.posts) {
          // Posts already include user info from the JOIN query
          const postsWithUsers = postsData.posts.map((post) => {
            return {
              id: post.id,
              authorName: post.full_name || post.first_name || 'Unknown User',
              authorUsername: post.username || 'unknown',
              authorEmail: post.email || '',
              authorAvatar: post.profile_image ||defaultAvatar,
              content: post.content,
              title: post.title,
              image: post.media_url && post.media_type === 'image' ? post.media_url : null,
              video: post.media_url && post.media_type === 'video' ? post.media_url : null,
              mediaType: post.media_type,
              likes: 0, // TODO: Add likes functionality
              comments: 0, // TODO: Add comments functionality
              shares: 0,
              isLiked: false,
              tags: [],
              timestamp: post.created_at
            };
          });
          setPosts(postsWithUsers);
        } else {
          setPosts([]);
        }

        // Fetch opportunities
        const opportunitiesResponse = await fetch('/api/opportunity');
        const opportunitiesData = await opportunitiesResponse.json();
        
        if (opportunitiesData.success && opportunitiesData.opportunities) {
          setOpportunities(opportunitiesData.opportunities);
        } else {
          setOpportunities([]);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load posts and opportunities');
        setPosts([]);
        setOpportunities([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredPosts = posts
    .filter(post => 
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.authorUsername.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp) - new Date(a.timestamp);
      } else if (sortBy === 'popular') {
        return b.likes - a.likes;
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 sm:px-4 py-4 lg:py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          
          {/* Left Sidebar - Opportunities (formerly Trending Articles) */}
          <div className="hidden lg:block lg:col-span-1 mt-24">
            <div className="sticky top-20 space-y-4">
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm">
                <div className="p-4 border-b border-neutral-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Opportunities</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Latest opportunities</p>
                    </div>
                    <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">
                      {opportunities.length}
                    </span>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {opportunities.length > 0 ? (
                    opportunities.map((opportunity, index) => (
                      <div
                        key={opportunity.id}
                        className="p-3 border-b border-neutral-100 dark:border-gray-800 hover:bg-green-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            index === 0 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' :
                            index === 1 ? 'bg-neutral-300 dark:bg-gray-700 text-neutral-700 dark:text-gray-300' :
                            'bg-neutral-200 dark:bg-gray-800 text-neutral-600 dark:text-gray-400'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors line-clamp-2">
                              {opportunity.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {opportunity.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(opportunity.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No opportunities yet
                    </div>
                  )}
                </div>
                
                <div className="p-3 border-t border-neutral-200 dark:border-gray-700">
                  <button className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-500 transition-colors">
                    <Compass className="w-4 h-4" />
                    Explore All Opportunities
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4 mt-16">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 lg:p-6 border border-neutral-200 dark:border-gray-700 shadow-sm">
              <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Community Feed
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm lg:text-base">
                Stay connected with your ASYV family
              </p>
            </div>

            {/* Post Creator - Simple version if missing */}
            {auth && userInfo && (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src="https://api.dicebear.com/9.x/personas/svg?seed=User"
                      alt="User"
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="What's on your mind?"
                    className="flex-1 px-4 py-2 border border-neutral-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
                  />
                </div>
                <div className="flex justify-end">
                  <button className="px-6 py-2 bg-green-700 dark:bg-green-600 text-white rounded-full hover:bg-green-800 dark:hover:bg-green-700 transition-colors">
                    Post
                  </button>
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search posts, users, or tags..."
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm w-full sm:w-48"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* Posts */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />
                <span className="text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-neutral-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-neutral-200 dark:bg-gray-700 rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPosts.length > 0 ? (
              <div className="space-y-4">
                {filteredPosts.map((post) => (
                  <SimplePostCard
                    key={post.id}
                    post={post}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No posts found. Be the first to share!</p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Activity & Stats */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Activity Feed */}
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm mt-24">
                <div className="p-4 border-b border-neutral-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Trending News</h3>
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hot in the village</p>
                </div>
                
                <div className="h-96 overflow-y-auto p-4 space-y-3">
                  {dummyTrendingNews.map((news) => (
                    <div
                      key={news.id}
                      className="p-3 border border-neutral-100 dark:border-gray-800 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-2">
                        {news.hot && (
                          <Flame className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors line-clamp-2">
                            {news.title}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">
                              {news.category}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{news.timestamp}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <Eye className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{news.views} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            
              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm">
                <div className="p-4 border-b border-neutral-200 dark:border-gray-700">
                  <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Your Stats</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Posts Today</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Total Likes</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">215</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Comments</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">66</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Shares</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">38</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}