'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, Share2,ThumbsUp, Eye, Clock, TrendingUp, Search, Filter, ChevronRight, Compass, BookOpen, Users, Calendar, Flame, Loader, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import defaultAvatar from '../../../public/default.png';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
const CommentSection = ({ postId, isOpen, comments: initialComments, currentUserId, onCommentAdded }) => {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(initialComments || []);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && postId) {
      fetchComments();
    }
  }, [isOpen, postId]);

  const fetchComments = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/comment?postId=${postId}`);
      const data = await response.json();
      if (data.success && data.comments) {
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId || submitting) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          postId: postId,
          userId: currentUserId
        })
      });

      const data = await response.json();
      if (data.success && data.comment) {
        setComments([...comments, data.comment]);
        setNewComment('');
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        alert(data.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-gray-700 space-y-4">
      {loading ? (
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">Loading comments...</div>
      ) : comments.length > 0 ? (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <Card key={comment.id} className="flex gap-3">
              <div className="flex ">
              <div className="relative rounded-full flex-shrink-0 overflow-hidden">
                <Avatar className="w-[70px] h-[70px] object-cover">
                  <AvatarImage src={comment.profile_image || defaultAvatar} 
                  alt={comment.full_name || comment.username} />
                </Avatar>
              </div>
              <div className="flex-1">
                <div className="bg-neutral-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="font-medium text-sm text-neutral-900 dark:text-gray-200">
                    {comment.full_name || comment.username || 'Unknown User'}
                  </p>
                  <p className="text-sm text-neutral-700 dark:text-gray-300 mt-1">{comment.content}</p>
                </div>
                <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1 ml-3">
                  {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString()}
                </p>
              </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</div>
      )}
      
      {currentUserId && (
        
        <Card>
          <CardHeader>
            <CardTitle>Add a Comment</CardTitle>
            <CardDescription>Share your thoughts on this post</CardDescription>
            <CardContent>
<form onSubmit={handleSubmitComment} className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2 text-sm border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
            disabled={submitting}
          />
          <button 
            type="submit"
            disabled={!newComment.trim() || submitting}
            className="px-4 py-2 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-800 dark:hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </form>
            </CardContent>
          </CardHeader>
        </Card>
      )}
    </div>
  );
};

const SimplePostCard = ({ post, currentUserId, onLikeUpdate, onCommentUpdate }) => {
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [likes, setLikes] = useState(post.likes || 0);
  const [commentCount, setCommentCount] = useState(post.comments || 0);
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    if (post.id) {
      fetchLikeStatus();
      fetchCommentCount();
    }
  }, [post.id, currentUserId]);

  const fetchLikeStatus = async () => {
    if (!post.id) return;
    try {
      const url = currentUserId 
        ? `/api/like?postId=${post.id}&userId=${currentUserId}`
        : `/api/like?postId=${post.id}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setLikes(data.likeCount || 0);
        setIsLiked(data.isLiked || false);
      }
    } catch (error) {
      console.error('Error fetching like status:', error);
    }
  };

  const fetchCommentCount = async () => {
    if (!post.id) return;
    try {
      const response = await fetch(`/api/comment?postId=${post.id}`);
      const data = await response.json();
      if (data.success && data.comments) {
        setCommentCount(data.comments.length);
      }
    } catch (error) {
      console.error('Error fetching comment count:', error);
    }
  };


  const handleLike = async () => {
    if (!currentUserId || liking) return;
    
    setLiking(true);
    const previousLiked = isLiked;
    const previousLikes = likes;
    setIsLiked(!isLiked);
    setLikes(previousLiked ? likes - 1 : likes + 1);
    
    try {
      const response = await fetch('/api/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          postId: post.id,
          userId: currentUserId
        })
      });

      const data = await response.json();
      if (data.success) {
        setLikes(data.likeCount);
        setIsLiked(data.isLiked);
        if (onLikeUpdate) {
          onLikeUpdate(post.id, data.likeCount, data.isLiked);
        }
      } else {
        setIsLiked(previousLiked);
        setLikes(previousLikes);
        alert(data.error || 'Failed to like post');
      }
    } catch (error) {
      console.error('Error liking post:', error);
      setIsLiked(previousLiked);
      setLikes(previousLikes);
      alert('Failed to like post. Please try again.');
    } finally {
      setLiking(false);
    }
  };

  const handleCommentAdded = () => {
    setCommentCount(commentCount + 1);
    if (onCommentUpdate) {
      onCommentUpdate(post.id, commentCount + 1);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-10 h-10 rounded-full overflow-auto">
            <Image
              src={post.authorAvatar?post.authorAvatar:'/default.png'}
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
              autoPlay
              muted
              className="w-full h-full  aspect-video object-cover"
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
        
        <div className="flex items-center justify-start gap-4 border-t border-b border-neutral-100 dark:border-gray-800 py-2">
          <button 
            onClick={handleLike}
            disabled={!currentUserId || liking}
            className={`flex items-center border bg-green-800 border-gray-100 py-1 px-2 rounded-sm gap-2 ${isLiked ? 'text-red-500 dark:text-red-400' : 'text-gray-200 dark:text-gray-400'} hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <ThumbsUp className={`w4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-gray-200 dark:text-gray-200">{likes}</span>
          </button>
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-2 text-gray-200 border borde-gray-100 py-1 px-2 rounded-sm bg-green-800 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"
          >
            <MessageCircle className="w-4 h-4 rounded-sm" />
            <span className="text-gray-200 dark:text-gray-200">{commentCount}</span>
          </button>
          
          <button className="flex items-center border border-gray-200 py-1 px-2 bg-green-800 rounded-sm  gap-2 text-gray-200 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-500 transition-colors">
            <Share2 className="w-5 h-5" />
            <span className="text-gray-800 dark:text-gray-200">{post.shares}</span>
          </button>
        </div>
      </div>
      
      {showComments && (
        <CommentSection 
          postId={post.id}
          isOpen={showComments}
          currentUserId={currentUserId}
          onCommentAdded={handleCommentAdded}
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
  const [currentUserId, setCurrentUserId] = useState(null);

  // Get auth from localStorage (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAuth = localStorage.getItem('auth');
      const storedUser = localStorage.getItem('userInfo');
      const fullInfo = localStorage.getItem('fullInfo');
      
      if (storedAuth) {
        setAuth(JSON.parse(storedAuth));
      }
      if (storedUser) {
        setUserInfo(JSON.parse(storedUser));
      }
      if (fullInfo) {
        try {
          const user = JSON.parse(fullInfo);
          setCurrentUserId(user.id);
        } catch (e) {
          console.error('Error parsing fullInfo:', e);
        }
      }
    }
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const postsResponse = await fetch('/api/post');
        const postsData = await postsResponse.json();
        if (postsData.success && postsData.posts) {
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

        // Fetch opportunities (only approved ones)
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
                        className="p-3 border-b border-neutral-100 dark:border-gray-800 hover:bg-green-50 dark:hover:bg-gray-800 transition-colors group"
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
                            {opportunity.op_type && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-medium">
                                {opportunity.op_type}
                              </span>
                            )}
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                              {opportunity.description}
                            </p>
                            {opportunity.organization && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span className="font-medium">Org:</span> {opportunity.organization}
                              </p>
                            )}
                            {opportunity.location && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                <span className="font-medium">Location:</span> {opportunity.location}
                              </p>
                            )}
                            {opportunity.deadline && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                <span className="font-medium">Deadline:</span> {new Date(opportunity.deadline).toLocaleDateString()}
                              </p>
                            )}
                            {opportunity.link && (
                              <a
                                href={opportunity.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="mt-2 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"
                              >
                                <ChevronRight className="w-3 h-3" />
                                View Details / Apply
                              </a>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {opportunity.post_time ? new Date(opportunity.post_time).toLocaleDateString() : 'Recently'}
                            </p>
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
                  className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-gray-700 rounded-sm focus:outline-none focus:ring-1 focus:ring-orange-500 dark:focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 text-sm"
                />
              </div>
                 <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 h-11">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
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
                    currentUserId={currentUserId}
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