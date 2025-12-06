
'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Eye, Clock, TrendingUp, Search, Filter, ChevronRight, Compass, BookOpen, Users, Calendar, Flame, Loader, AlertCircle } from 'lucide-react';
import Image from 'next/image';
// import { ScrollArea } from '@/components/ui/scroll-area';
// import PostCreator from './form/PostCreator';
// import PostCard from './PostCard';

// Dummy Data (kept for reference)
const dummyPosts = [
  {
    id: 1,
    authorName: 'Sarah Johnson',
    authorUsername: 'sarah_j',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    content: 'Just completed an amazing mentorship session with students from our community! The energy and enthusiasm they bring is truly inspiring. Looking forward to our next session! 🌟',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800',
    likes: 45,
    comments: 12,
    shares: 5,
    isLiked: false,
    tags: ['Mentorship', 'Education', 'Community'],
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    authorName: 'Michael Chen',
    authorUsername: 'michael_c',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    content: 'Proud to share that our community garden project is flourishing! Thanks to everyone who contributed. Together we are making a difference! 🌱',
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800',
    likes: 78,
    comments: 23,
    shares: 15,
    isLiked: true,
    tags: ['Community', 'Sustainability', 'Growth'],
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
];

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
    <div className="mt-4 pt-4 border-t border-neutral-200 space-y-4">
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
              <div className="bg-neutral-50 rounded-lg p-3">
                <p className="font-medium text-sm text-neutral-900">{comment.author}</p>
                <p className="text-sm text-neutral-700 mt-1">{comment.text}</p>
              </div>
              <p className="text-xs text-neutral-500 mt-1 ml-3">{comment.time}</p>
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
          className="flex-1 px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors text-sm font-medium">
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
    <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
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
            <h4 className="font-medium text-neutral-900">{post.authorName}</h4>
            <p className="text-xs text-neutral-500">@{post.authorUsername}</p>
          </div>
        </div>
        
        <p className="text-neutral-700 mb-3">{post.content}</p>
        
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
        
        <div className="flex gap-2 mb-3">
          {post.tags.map((tag) => (
            <span key={tag} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
              #{tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between border-t border-b border-neutral-100 py-2">
          <button 
            onClick={handleLike}
            className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-neutral-500'} hover:text-red-500`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            <span>{likes}</span>
          </button>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-neutral-500 hover:text-green-600"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{post.comments}</span>
          </button>
          
          <button className="flex items-center gap-2 text-neutral-500 hover:text-blue-600">
            <Share2 className="w-5 h-5" />
            <span>{post.shares}</span>
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
  const [posts, setPosts] = useState(dummyPosts);
  const [isLoading, setIsLoading] = useState(false);
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
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-3 sm:px-4 py-4 lg:py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          
          {/* Left Sidebar - Trending Articles */}
          <div className="hidden lg:block lg:col-span-1 mt-24">
            <div className="sticky top-20 space-y-4">
              <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
                <div className="p-4 border-b border-neutral-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold text-neutral-900">Trending Articles</h3>
                      <p className="text-xs text-neutral-500 mt-1">Popular in your network</p>
                    </div>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                      {dummyArticles.length}
                    </span>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {dummyArticles.map((article, index) => (
                    <div
                      key={article.id}
                      className="p-3 border-b border-neutral-100 hover:bg-green-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          index === 0 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' :
                          index === 1 ? 'bg-neutral-300 text-neutral-700' :
                          'bg-neutral-200 text-neutral-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 group-hover:text-green-700 transition-colors line-clamp-2">
                            {article.title}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center gap-1">
                              <Eye className="w-3 h-3 text-neutral-400" />
                              <span className="text-xs text-neutral-500">{article.views}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageCircle className="w-3 h-3 text-neutral-400" />
                              <span className="text-xs text-neutral-500">{article.discussions}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 border-t border-neutral-200">
                  <button className="w-full flex items-center justify-center gap-2 text-sm text-neutral-600 hover:text-green-700 transition-colors">
                    <Compass className="w-4 h-4" />
                    Explore All Topics
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4 mt-16">
            {/* Header */}
            <div className="bg-white rounded-lg p-4 lg:p-6 border border-neutral-200 shadow-sm">
              <h1 className="text-2xl lg:text-3xl font-semibold text-neutral-900 mb-2">
                Community Feed
              </h1>
              <p className="text-neutral-600 text-sm lg:text-base">
                Stay connected with your ASYV family
              </p>
            </div>

            {/* Post Creator - Simple version if missing */}
            {auth && userInfo && (
              <div className="bg-white rounded-lg border border-neutral-200 p-4">
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
                    className="flex-1 px-4 py-2 border border-neutral-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button className="px-6 py-2 bg-green-700 text-white rounded-full hover:bg-green-800 transition-colors">
                    Post
                  </button>
                </div>
              </div>
            )}

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search posts, users, or tags..."
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white w-full sm:w-48"
              >
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* Posts */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg border border-neutral-200 p-4 animate-pulse">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-neutral-200 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-neutral-200 rounded w-1/4"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-neutral-200 rounded"></div>
                      <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
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
              <div className="bg-white rounded-lg border border-neutral-200 p-8 text-center">
                <p className="text-neutral-500">No posts found. Be the first to share!</p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Activity & Stats */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-20 space-y-4">
              {/* Activity Feed */}
              <div className="bg-white rounded-lg border border-neutral-200 shadow-sm mt-24">
                <div className="p-4 border-b border-neutral-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-neutral-900">Trending News</h3>
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Hot in the village</p>
                </div>
                
                <div className="h-96 overflow-y-auto p-4 space-y-3">
                  {dummyTrendingNews.map((news) => (
                    <div
                      key={news.id}
                      className="p-3 border border-neutral-100 rounded-lg hover:bg-green-50 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-2">
                        {news.hot && (
                          <Flame className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 group-hover:text-green-700 transition-colors line-clamp-2">
                            {news.title}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {news.category}
                            </span>
                            <span className="text-xs text-neutral-500">{news.timestamp}</span>
                          </div>
                          <div className="flex items-center gap-1 mt-2">
                            <Eye className="w-3 h-3 text-neutral-400" />
                            <span className="text-xs text-neutral-500">{news.views} views</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            
              {/* Quick Stats */}
              <div className="bg-white rounded-lg border border-neutral-200 shadow-sm">
                <div className="p-4 border-b border-neutral-200">
                  <h3 className="text-base font-semibold text-neutral-900">Your Stats</h3>
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Posts Today</span>
                    <span className="font-semibold text-neutral-900">3</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Total Likes</span>
                    <span className="font-semibold text-neutral-900">215</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Comments</span>
                    <span className="font-semibold text-neutral-900">66</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-600">Shares</span>
                    <span className="font-semibold text-neutral-900">38</span>
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