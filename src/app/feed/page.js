'use client';



import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { MessageCircle, Share2, Heart, Search, Filter,Calendar, ChevronRight, Compass, Flame, Loader, AlertCircle, ExternalLink, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import Image from 'next/image';

import { Avatar, AvatarImage } from '@/components/ui/avatar'
import {
  Card,
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


const TRENDING_DESCRIPTION_LENGTH = 100;



const NEWS_CATEGORIES = [

  { value: 'all', label: 'All' },

  { value: 'business', label: 'Business' },

  { value: 'technology', label: 'Technology' },

  { value: 'entertainment', label: 'Entertainment' },

  { value: 'sports', label: 'Sports' },

  { value: 'science', label: 'Science' },

];


const CommentSection = ({ postId, isOpen, comments: initialComments, currentUserId, onCommentAdded, setCommentCount }) => {

  const [newComment, setNewComment] = useState('');

  const [comments, setComments] = useState(initialComments || []);

  const [loading, setLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const deleteComment = async (id) => {
    try {
      const res = await fetch(`/api/comment?id=${id}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (data.success) {
        setComments(comments.filter(comment => comment.id !== id))
        setCommentCount(prev => prev - 1)
      } else {
        alert(data.error || 'Failed to delete comment')
      }
    } catch (error) {
      console.error("Error deleting comment:", error)
      alert('Failed to delete comment. Please try again.')
    }
  };



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

              <div className="relative flex-shrink-0 overflow-hidden">

                <Avatar className="w-[40px] h-[40px] ml-4 object-cover">

                  <AvatarImage src={comment.profile_image || defaultAvatar} 

                  alt={comment.full_name || comment.username} />

                </Avatar>

              </div>

              <div className="flex-1">

                <div className="bg-neutral-50 dark:bg-gray-800 rounded-lg p-3">

                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-neutral-900 dark:text-gray-200">
                      {comment.full_name || comment.username || 'Unknown User'}
                    </p>
                    {currentUserId === comment.user_id && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.90 }}
                        onClick={() => {
                          if (!window.confirm("Are you sure you want to delete this comment?")) return
                          deleteComment(comment.id)
                        }}
                        className="ml-2 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>

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

// REPLACE your current LikeParticles component with this:
const LikeParticles = ({ trigger, burstKey }) => {
  const particles = Array.from({ length: 8 });
  const colors = ['#ef4444', '#fb923c', '#fbbf24', '#f472b6'];
  return (
    <AnimatePresence>
      {trigger && particles.map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 50 + Math.random() * 30;
        return (
          <motion.span
            key={`${burstKey}-${i}`}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.9, ease: [0.2, 0.8, 0.4, 1] }}
            style={{
              position: 'absolute', width: 7, height: 7,
              borderRadius: '50%', background: colors[i % colors.length],
              top: '50%', left: '50%', marginTop: -2.5, marginLeft: -2.5,
              pointerEvents: 'none', zIndex: 10,
            }}
          />
        );
      })}
    </AnimatePresence>
  );
};

const SimplePostCard = ({ post, currentUserId, onLikeUpdate, onCommentUpdate }) => {

  const [isLiked, setIsLiked] = useState(post.isLiked || false);
const [burstKey, setBurstKey] = useState(0);
  const [likes, setLikes] = useState(post.likes || 0);

  const [commentBurstKey, setCommentBurstKey] = useState(0);
  const [commentCount, setCommentCount] = useState(post.comments || 0);

  const [showComments, setShowComments] = useState(false);

  const [liking, setLiking] = useState(false);
  const [hearts, setHearts] = useState([]);

  const triggerHeartRain = () => {
    const newHearts = Array.from({ length: 12 }).map((_, i) => ({
      id: Date.now() + i, 
      left: Math.random() * 80 + 10 + "%", 
      duration: 1.5 + Math.random() * 1.5,
      delay: Math.random() * 0.4,
      size: 20 + Math.random() * 20 
    }));
  
    setHearts(newHearts);
    setTimeout(() => setHearts([]), 3500);
  };

  useEffect(() => {

    if (post.id) {

      fetchLikeStatus();

      fetchCommentCount();

    }

  }, [post.id, currentUserId]);

const [burstOrigin, setBurstOrigin] = useState(null);

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
  if (data.isLiked) setBurstKey(k => k + 1); // re-triggers particles each like
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
    setCommentBurstKey(k => k + 1); // triggers comment animation
    if (onCommentUpdate) {
      onCommentUpdate(post.id, commentCount + 1);
    }
  };



  return (

    <div className="relative bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm overflow-hidden">
 <AnimatePresence>

      </AnimatePresence>

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
  onClick={() => handleLike()}
  disabled={!currentUserId || liking}
  className={`
    inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm border text-[13px] font-medium
    transition-all duration-150 active:scale-95
    disabled:opacity-40 disabled:cursor-not-allowed
    ${isLiked
      ? 'text-red-500 border-red-300 bg-red-50 dark:text-red-400 dark:border-red-800 dark:bg-red-950/30'
      : 'text-gray-500 border-gray-200 hover:bg-gray-50 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-800/50'
    }
  `}
>
  {/* Icon + particles wrapper */}
  <span className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
    <LikeParticles trigger={isLiked} burstKey={burstKey} />
    <motion.div
      animate={isLiked ? { scale: [0.6, 1.3, 1] } : { scale: [0.8, 1] }}
      transition={{ duration: 0.4, type: 'keyframes', ease: [0.34, 1.56, 0.64, 1] }}
    >
      <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
    </motion.div>
  </span>

  {/* Label */}
  <span>{isLiked ? 'Liked' : 'Like'}</span>

  {/* Animated like count */}
  <AnimatePresence mode="popLayout">
    <motion.span
      key={likes}
      initial={{ y: -8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={`
        inline-flex items-center justify-center min-w-[18px] h-[18px] px-1
        rounded-full text-[11px] font-semibold
        ${isLiked
          ? 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }
      `}
    >
      {likes}
    </motion.span>
  </AnimatePresence>
</button>

          <button 
            onClick={() => setShowComments(!showComments)}
            className={`
              inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm border text-[13px] font-medium
              transition-all duration-150 active:scale-95
              ${showComments
                ? 'text-blue-700 border-blue-300 bg-blue-50 dark:text-blue-300 dark:border-blue-700 dark:bg-blue-950/30'
                : 'text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-800 dark:bg-blue-950/20 dark:hover:bg-blue-900/30'
              }
            `}
          >
            {/* Icon + particles wrapper */}
            <span className="relative w-5 h-5 flex items-center justify-center flex-shrink-0">
              <MessageCircle className={`w-5 h-5 `} />
            </span>

            {/* Label */}
            <span>{showComments ? 'Commenting' : 'Comment'}</span>

            {/* Animated comment count */}
            <AnimatePresence mode="popLayout">
              <motion.span
                key={commentCount}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`
                  inline-flex items-center justify-center min-w-[18px] h-[18px] px-1
                  rounded-full text-[11px] font-semibold
                  ${showComments
                    ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                  }
                `}
              >
                {commentCount}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

      </div>

      

      {showComments && (

        <CommentSection 
          postId={post.id}
          isOpen={showComments}
          currentUserId={currentUserId}
          onCommentAdded={handleCommentAdded}
          setCommentCount={setCommentCount}
        />

      )}

    </div>

  );

};



export default function SocialFeed() {

  const [posts, setPosts] = useState([]);

  const [opportunities, setOpportunities] = useState([]);

  const [villageEvents, setVillageEvents] = useState([]);

  const [eventsLoading, setEventsLoading] = useState(true);

  const [eventsSearchQuery, setEventsSearchQuery] = useState('');

  const [eventsCategoryFilter, setEventsCategoryFilter] = useState('all');

  const [eventsSortBy, setEventsSortBy] = useState('newest');

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');

  const [sortBy, setSortBy] = useState('newest');

  const [auth, setAuth] = useState(null);

  const [userInfo, setUserInfo] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);

  const router = useRouter();
 

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

              likes: post.likes || 0,

              comments: post.comments || 0,

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



  useEffect(() => {

    const fetchVillageEvents = async () => {

      setEventsLoading(true);

      try {

        const res = await fetch('/api/village-events');

        const data = await res.json();

        if (data.success && data.events) {

          setVillageEvents(data.events);

        } else {

          setVillageEvents([]);

        }

      } catch (err) {

        console.error('Error fetching village events:', err);

        setVillageEvents([]);

      } finally {

        setEventsLoading(false);

      }

    };

    fetchVillageEvents();

  }, []);



  const filteredVillageEvents = villageEvents

    .filter((event) => {

      const q = eventsSearchQuery.toLowerCase().trim();

      const matchesSearch =

        !q ||

        (event.title || '').toLowerCase().includes(q) ||

        (event.description || '').toLowerCase().includes(q) ||

        (event.location || '').toLowerCase().includes(q);

      return matchesSearch;

    })

    .sort((a, b) => {

      const dateA = new Date(a.event_date || 0).getTime();

      const dateB = new Date(b.event_date || 0).getTime();

      return eventsSortBy === 'newest' ? dateB - dateA : dateA - dateB;

    });

  const handleEventClick = (eventId) => {
    router.push(`/feed/news/article/${eventId}`);
  };

  const filteredPosts = posts

    .filter(post => 

      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||

      post.authorUsername.toLowerCase().includes(searchTerm.toLowerCase())

    )

    .sort((a, b) => {

      if (sortBy === 'newest') {

        return new Date(b.timestamp) - new Date(a.timestamp);

      } else if (sortBy === 'popular') {

        return (b.likes + b.comments) - (a.likes + a.comments);

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

              {/* Activity Feed - Village Events */}

              <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm mt-24 ">

                <div className="p-4 border-b border-neutral-200 dark:border-gray-700">

                  <div className="flex items-center justify-between">

                    <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Village Events</h3>

                    <Calendar className="w-4 h-4 text-green-500" />

                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Upcoming ASYV Community Events</p>

                </div>



                {/* Events Search */}

                <div className="p-3 border-b border-neutral-100 dark:border-gray-800 space-y-3">

                  <div className="relative">

                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />

                    <input

                      type="text"

                      value={eventsSearchQuery}

                      onChange={(e) => setEventsSearchQuery(e.target.value)}

                      placeholder="Search events by title, location..."

                      className="w-full pl-8 pr-7 py-2 text-xs border border-neutral-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"

                    />

                    {eventsSearchQuery && (

                      <button

                        type="button"

                        onClick={() => setEventsSearchQuery('')}

                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-gray-700 text-gray-500"

                        aria-label="Clear search"

                      >

                        <X className="w-3 h-3" />

                      </button>

                    )}

                  </div>

                  <div className="flex gap-1.5 flex-wrap">

                    <select

                      value={eventsSortBy}

                      onChange={(e) => setEventsSortBy(e.target.value)}

                      className="flex-1 min-w-0 text-xs py-1.5 px-2 border border-neutral-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500"

                    >

                      <option value="newest">Newest</option>

                      <option value="oldest">Oldest</option>

                    </select>

                  </div>

                  {eventsSearchQuery && (

                    <p className="text-xs text-gray-500 dark:text-gray-400">

                      Showing {filteredVillageEvents.length} of {villageEvents.length} events

                    </p>

                  )}

                </div>

                
                <div className="h-96 overflow-y-auto p-4 space-y-3">

                  {eventsLoading ? (

                    <div className="flex flex-col items-center justify-center py-12 gap-3">

                      <Loader className="w-8 h-8 animate-spin text-green-600" />

                      <span className="text-sm text-gray-500 dark:text-gray-400">Loading events...</span>

                    </div>

                  ) : villageEvents.length > 0 ? (

                    filteredVillageEvents.length > 0 ? (

                    filteredVillageEvents.map((event, index) => {

                      const eventDate = event.event_date 
                        ? new Date(event.event_date).toLocaleDateString() 
                        : 'TBD';

                      return (

                        <div
                          key={`${event.title}-${index}`}
                          className="p-3 border border-neutral-100 dark:border-gray-800 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"
                          onClick={() => handleEventClick(event.id)}
                        >

                          <div className="flex items-start gap-2">

                            <Calendar className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />

                            <div className="flex-1 min-w-0">

                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors line-clamp-2">

                                {event.title}

                              </p>

                              {event.description && (

                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">

                                  {event.description}

                                </p>

                              )}

                              <div className="flex items-center gap-2 mt-2 flex-wrap">

                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">

                                  {eventDate}

                                </span>

                                {event.location && (

                                  <span className="text-xs text-gray-500 dark:text-gray-400">

                                    📍 {event.location}

                                  </span>

                                )}

                              </div>

                            </div>

                          </div>

                        </div>

                      );

                    })

                    ) : (

                      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">

                        No events match your search. Try different filters.

                      </div>

                    )

                  ) : (

                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">

                      No village events available. Try again later.

                    </div>

                  )}

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}

// 'use client';



// import { useState, useEffect, useRef } from 'react';

// import { useRouter } from 'next/navigation';
// import { DotLottieReact } from '@lottiefiles/dotlottie-react';
// import { MessageCircle, Share2, ThumbsUp, LockKeyholeOpen ,
//   Eye, Clock, TrendingUp, Search, Filter, ChevronRight, Compass, BookOpen, Users, Calendar, Flame, Loader, AlertCircle, ExternalLink, X, 
//   Trash2} from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// import Image from 'next/image';

// import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

// import { Button } from "@/components/ui/button"

// import {

//   Card,

//   CardAction,

//   CardContent,

//   CardDescription,

//   CardFooter,

//   CardHeader,

//   CardTitle,

// } from "@/components/ui/card"

// import { Input } from "@/components/ui/input"

// import { Label } from "@/components/ui/label"

// import defaultAvatar from '../../../public/default.png';

// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// const dummyArticles = [

//   { id: 1, title: 'Building Sustainable Communities Through Education', views: 856, discussions: 42 },

//   { id: 2, title: 'The Power of Mentorship in Youth Development', views: 734, discussions: 38 },

//   { id: 3, title: 'Creating Inclusive Spaces for Growth', views: 612, discussions: 29 },

// ];

// const TRENDING_DESCRIPTION_LENGTH = 100;



// const NEWS_CATEGORIES = [

//   { value: 'all', label: 'All' },

//   { value: 'business', label: 'Business' },

//   { value: 'technology', label: 'Technology' },

//   { value: 'entertainment', label: 'Entertainment' },

//   { value: 'sports', label: 'Sports' },

//   { value: 'science', label: 'Science' },

// ];



// // Comment Section Componentama

// const CommentSection = ({ postId, isOpen, comments: initialComments, currentUserId, onCommentAdded, setCommentCount }) => {

//   const [newComment, setNewComment] = useState('');

//   const [comments, setComments] = useState(initialComments || []);

//   const [loading, setLoading] = useState(false);

//   const [submitting, setSubmitting] = useState(false);



//   useEffect(() => {

//     if (isOpen && postId) {

//       fetchComments();

//     }

//   }, [isOpen, postId]);



//   const fetchComments = async () => {

//     if (!postId) return;

//     setLoading(true);

//     try {

//       const response = await fetch(`/api/comment?postId=${postId}`);

//       const data = await response.json();

//       if (data.success && data.comments) {

//         setComments(data.comments);

//       }

//     } catch (error) {

//       console.error('Error fetching comments:', error);

//     } finally {

//       setLoading(false);

//     }

//   };



//   const handleSubmitComment = async (e) => {

//     e.preventDefault();

//     if (!newComment.trim() || !currentUserId || submitting) return;



//     setSubmitting(true);

//     try {

//       const response = await fetch('/api/comment', {

//         method: 'POST',

//         headers: {

//           'Content-Type': 'application/json',

//         },

//         body: JSON.stringify({

//           content: newComment.trim(),

//           postId: postId,

//           userId: currentUserId

//         })

//       });



//       const data = await response.json();

//       if (data.success && data.comment) {

//         setComments([...comments, data.comment]);

//         setNewComment('');

//         if (onCommentAdded) {

//           onCommentAdded();

//         }

//       } else {

//         alert(data.error || 'Failed to post comment');

//       }

//     } catch (error) {

//       console.error('Error posting comment:', error);

//       alert('Failed to post comment. Please try again.');

//     } finally {

//       setSubmitting(false);

//     }

//   };

// const deleteComment=async(id)=>{
//   try{
//      const res= await fetch(`/api/comment?id=${id}`,{
//       method:"DELETE"
//      })
//      const data=await res.json()
//      if(data.success){
//       setComments(comments.filter(comment=>comment.id!==id))
//       setCommentCount(prev=>prev-1)
//      }else{
//       alert(data.error || 'Failed to delete comment')
//      }
//   }catch(error){
//     console.error("Error deleting comment:",error)
//     alert('Failed to delete comment. Please try again.')
//   }
// }

//   if (!isOpen) return null;



//   return (
// <AnimatePresence>
//     <motion.div 
//     key="comment-key-animate"
//     initial={{opacity:0,x:-100}}
//     animate={{opacity:1,x:0}}
//     transition={{duration:0.5,ease:"backOut"}}
//     exit={{opacity:0,x:-100}}
//     className="mt-4 pt-4 border-t border-neutral-200 dark:border-gray-700 space-y-4">

//       {loading ? (

//         <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">Loading comments...</div>

//       ) : comments.length > 0 ? (

//         <div className="space-y-3 max-h-64 overflow-y-auto">

//           {comments.map((comment) => (

//             <Card key={comment.id} className="flex gap-3">

//               <div className="flex ">

//               <div className="relative flex-shrink-0 overflow-hidden">

//                 <Avatar className="w-[40px] h-[40px] ml-4 object-cover">

//                   <AvatarImage src={comment.profile_image || defaultAvatar} 

//                   alt={comment.full_name || comment.username} />

//                 </Avatar>

//               </div>

//               <div className="flex-1">

//                 <div className="bg-neutral-50 dark:bg-gray-800 rounded-lg p-3">
// <div className="flex items-center justify-between">
//                   <p className="font-medium text-sm text-neutral-900 dark:text-gray-200">

//                     {comment.full_name || comment.username || 'Unknown User'} 
//                   </p>
//                   {currentUserId === comment.user_id && <motion.button
//                   whileHover={{scale:1.05}}
//                   whileTap={{scale:0.90}}
//                   onClick={()=>{
//                     if(!window.confirm("Are you sure you want to delete this commment?"))return
//                      deleteComment(comment.id)
//                   }}
//                   className="ml-2 text-xs text-gray-500 dark:text-gray-400"><Trash2 className="w-5 h-5" /></motion.button>}
// </div>
//                   <p className="text-sm text-neutral-700 dark:text-gray-300 mt-1">{comment.content}</p>

//                 </div>

//                 <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1 ml-3">

//                   {new Date(comment.created_at).toLocaleDateString()} {new Date(comment.created_at).toLocaleTimeString()} 
                  

//                 </p>

//               </div>

//               </div>

//             </Card>

//           ))}

//         </div>

//       ) : (

//         <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">No comments yet. Be the first to comment!</div>

//       )}

      

//       {currentUserId && (

        

//         <Card>

//           <CardHeader>

//             <CardTitle>Add a Comment</CardTitle>

//             <CardDescription>Share your thoughts on this post</CardDescription>

//             <CardContent>

// <form onSubmit={handleSubmitComment} className="flex gap-2">

//           <input

//             type="text"

//             value={newComment}

//             onChange={(e) => setNewComment(e.target.value)}

//             placeholder="Write a comment..."

//             className="flex-1 px-3 py-2 text-sm border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"

//             disabled={submitting}

//           />

//           <button 

//             type="submit"

//             disabled={!newComment.trim() || submitting}

//             className="px-4 py-2 bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-800 dark:hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"

//           >

//             {submitting ? 'Posting...' : 'Post'}

//           </button>

//         </form>

//             </CardContent>

//           </CardHeader>

//         </Card>

//       )}

//     </motion.div>
// </AnimatePresence>
//   );

// };



// const SimplePostCard = ({ post, currentUserId, onLikeUpdate, onCommentUpdate }) => {

//   const [isLiked, setIsLiked] = useState(post.isLiked || false);

//   const [likes, setLikes] = useState(post.likes || 0);

//   const [liking, setLiking] = useState(false);
//   const [isLikeAnimating, setIsLikeAnimating] = useState(false);
//   const likeAnimTimeoutRef = useRef(null);
//   const lottieRef = useRef(null);
//   const LIKE_ANIM_MS = 1600;
//   const [commentCount, setCommentCount] = useState(post.comments || 0);
//   const [showComments, setShowComments] = useState(false);

//   const stopLikeLottie = () => {
//     setIsLikeAnimating(false);
//     if (likeAnimTimeoutRef.current) {
//       clearTimeout(likeAnimTimeoutRef.current);
//       likeAnimTimeoutRef.current = null;
//     }
//     try {
//       lottieRef.current?.stop?.();
//     } catch (_) {}
//   };

//   const playLikeLottie = () => {
//     if (!lottieRef.current) return;
//     try {
//       lottieRef.current.stop();
//     } catch (_) {}
//     try {
//       lottieRef.current.play();
//     } catch (_) {}

//     setIsLikeAnimating(true);
//     if (likeAnimTimeoutRef.current) clearTimeout(likeAnimTimeoutRef.current);
//     likeAnimTimeoutRef.current = setTimeout(() => {
//       setIsLikeAnimating(false);
//     }, LIKE_ANIM_MS);
//   };

//   useEffect(() => {

//     if (post.id) {

//       fetchLikeStatus();

//       fetchCommentCount();

//     }

//   }, [post.id, currentUserId]);

// const fetchLikeStatus = async () => {

//     if (!post.id) return;

//     try {

//       const url = currentUserId 

//         ? `/api/like?postId=${post.id}&userId=${currentUserId}`

//         : `/api/like?postId=${post.id}`;

//       const response = await fetch(url);

//       const data = await response.json();
//       if (data.success) {

//         setLikes(data.likeCount || 0);

//         setIsLiked(data.isLiked || false);

//       }

//     } catch (error) {

//       console.error('Error fetching like status:', error);

//     }

//   };



//   const fetchCommentCount = async () => {

//     if (!post.id) return;

//     try {

//       const response = await fetch(`/api/comment?postId=${post.id}`);

//       const data = await response.json();

//       if (data.success && data.comments) {

//         setCommentCount(data.comments.length);

//       }

//     } catch (error) {

//       console.error('Error fetching comment count:', error);

//     }

//   };





//   const handleLike = async () => {

//     if (!currentUserId || liking) return;

//     const nextLiked = !isLiked;
//     if (nextLiked) playLikeLottie();
//     else stopLikeLottie();

//     setLiking(true);

//     const previousLiked = isLiked;

//     const previousLikes = likes;

//     setIsLiked(nextLiked);

//     setLikes(previousLiked ? likes - 1 : likes + 1);

    

//     try {

//       const response = await fetch('/api/like', {

//         method: 'POST',

//         headers: {

//           'Content-Type': 'application/json',

//         },

//         body: JSON.stringify({

//           postId: post.id,

//           userId: currentUserId

//         })

//       });
//       const data = await response.json();

//       if (data.success) {
//         setLikes(data.likeCount);
//         setIsLiked(data.isLiked);
//         if (onLikeUpdate) {
//           onLikeUpdate(post.id, data.likeCount, data.isLiked);
//         }
//       } else {

//         setIsLiked(previousLiked);

//         setLikes(previousLikes);

//         alert(data.error || 'Failed to like post');

//       }

//     } catch (error) {

//       console.error('Error liking post:', error);

//       setIsLiked(previousLiked);

//       setLikes(previousLikes);

//       alert('Failed to like post. Please try again.');

//     } finally {

//       setLiking(false);

//     }

//   };



//   const handleCommentAdded = () => {

//     setCommentCount(commentCount + 1);

//     if (onCommentUpdate) {

//       onCommentUpdate(post.id, commentCount + 1);

//     }

//   };



//   return (

//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//   whileInView={{ opacity: 1, y: 0 }}
//   viewport={{ once: true, amount: 0.3 }} 
//   transition={{ duration: 0.5 }} 
//     className="relative bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm overflow-hidden">
      

//       <div className="p-4">

//         <div className="flex items-center gap-3 mb-3">

//           <div className="relative w-10 h-10 rounded-full overflow-auto">

//             <Image

//               src={post.authorAvatar?post.authorAvatar:'/default.png'}

//               alt={post.authorName}

//               width={40}

//               height={40}

//               className="object-cover"  

//             />

//           </div>

//           <div>

//             <h4 className="font-medium text-gray-800 dark:text-gray-200">{post.authorName}</h4>

//             <p className="text-xs text-gray-500 dark:text-gray-400">@{post.authorUsername}</p>

//           </div>

//         </div>

        

//         {post.title && (

//           <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">{post.title}</h3>

//         )}

//         <p className="text-gray-700 dark:text-gray-300 mb-3">{post.content}</p>

        

//         {post.image && (

//           <div className="relative w-full h-64 rounded-lg overflow-hidden mb-3">

//             <Image

//               src={post.image}

//               alt="Post image"

//               fill

//               className="object-cover"

//             />

//           </div>

//         )}

        

//         {post.video && (

//           <div className="relative w-full h-64 rounded-lg overflow-hidden mb-3">

//             <video

//               src={post.video}

//               controls

//               autoPlay

//               muted

//               className="w-full h-full  aspect-video object-cover"

//             >

//               Your browser does not support the video tag.

//             </video>

//           </div>

//         )}

        

//         <div className="flex gap-2 mb-3">

//           {post.tags.map((tag) => (

//             <span key={tag} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs">

//               #{tag}

//             </span>

//           ))}

//         </div>

        

//         <div className="flex items-center justify-start gap-4 border-t border-b border-neutral-100 dark:border-gray-800 py-2">

//           <button 
//             onClick={() => handleLike()}
//             disabled={!currentUserId || liking}
//             className={`relative flex items-center border w-20 h-20 border-gray-100 py-1 px-2 rounded-sm gap-2 ${isLiked ? 'text-red-500 dark:text-red-400' : 'text-gray-200 dark:text-gray-400'} hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
//           >
//             {/* <span
//               // aria-hidden="true"
//               className={`absolute -top-8 left-1/2 -translate-x-1/2 w-12 h-12 pointer-events-none opacity-0 transition-opacity duration-200 opacity-100`}
//             > */}
//               <DotLottieReact
//                 src="/like.json"
//                 autoplay={false}
//                 loop={false}
//                 dotLottieRefCallback={(dotLottie) => {
//                   lottieRef.current = dotLottie;
//                 }}
//                 className="w-full h-full "
//               />
//             {/* </span> */}
//             {/* <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} /> */}
//             <span className="text-gray-200 dark:text-gray-200">{likes}</span>
//           </button>

//           <button 

//             onClick={() => setShowComments(!showComments)}

//             className="flex items-center gap-2 text-gray-200 border borde-gray-100 py-1 px-2 rounded-sm bg-green-700 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-500 transition-colors"

//           >
//             <MessageCircle className="w-4 h-4 rounded-sm" />
//             <span className="text-gray-200 dark:text-gray-200">{commentCount}</span>
//           </button>
//         </div>
//       </div>

      

//       {showComments && (

//         <CommentSection 
//           postId={post.id}
//           isOpen={showComments}
//           currentUserId={currentUserId}
//           onCommentAdded={handleCommentAdded}
//           setCommentCount={setCommentCount}
//         />

//       )}

//     </motion.div>

//   );

// };



// export default function SocialFeed() {

//   const [posts, setPosts] = useState([]);

//   const [opportunities, setOpportunities] = useState([]);

//   const [trendingNews, setTrendingNews] = useState([]);

//   const [trendingLoading, setTrendingLoading] = useState(true);

//   const [newsSearchQuery, setNewsSearchQuery] = useState('');

//   const [newsCategoryFilter, setNewsCategoryFilter] = useState('all');

//   const [newsSortBy, setNewsSortBy] = useState('newest');

//   const [isLoading, setIsLoading] = useState(true);

//   const [error, setError] = useState(null);

//   const [searchTerm, setSearchTerm] = useState('');

//   const [sortBy, setSortBy] = useState('newest');

//   const [auth, setAuth] = useState(null);

//   const [userInfo, setUserInfo] = useState(null);

//   const [currentUserId, setCurrentUserId] = useState(null);

//   const router = useRouter();
 

//   // Get auth from localStorage (client-side only)

//   useEffect(() => {

//     if (typeof window !== 'undefined') {

//       const storedAuth = localStorage.getItem('auth');

//       const storedUser = localStorage.getItem('userInfo');

//       const fullInfo = localStorage.getItem('fullInfo');

      

//       if (storedAuth) {

//         setAuth(JSON.parse(storedAuth));

//       }

//       if (storedUser) {

//         setUserInfo(JSON.parse(storedUser));

//       }

//       if (fullInfo) {

//         try {

//           const user = JSON.parse(fullInfo);

//           setCurrentUserId(user.id);

//         } catch (e) {

//           console.error('Error parsing fullInfo:', e);

//         }

//       }

//     }

//   }, []);

//   useEffect(() => {
//     const fetchData = async () => {
//       setIsLoading(true);
//       setError(null);
      
//       try {
//         const postsResponse = await fetch('/api/post');
//         const postsData = await postsResponse.json();
//         if (postsData.success && postsData.posts) {
//           const postsWithUsers = postsData.posts.map((post) => {
//             return {
//               id: post.id,
//               authorName: post.full_name || post.first_name || 'Unknown User',
//               authorUsername: post.username || 'unknown',
//               authorEmail: post.email || '',
//               authorAvatar: post.profile_image || defaultAvatar,
//               content: post.content,
//               title: post.title,
//               image: post.media_url && post.media_type === 'image' ? post.media_url : null,
//               video: post.media_url && post.media_type === 'video' ? post.media_url : null,
//               mediaType: post.media_type,
//               likes: post.likes || 0,
//               comments: post.comments || 0,
//               shares: 0,
//               isLiked: false,
//               tags: [],
//               timestamp: post.created_at
//             };
//           });
//           setPosts(postsWithUsers);
//         } else {
//           setPosts([]);
//         }

//         // Fetch opportunities (only approved ones)
//         const opportunitiesResponse = await fetch('/api/opportunity');
//         const opportunitiesData = await opportunitiesResponse.json();
        
//         if (opportunitiesData.success && opportunitiesData.opportunities) {
//           setOpportunities(opportunitiesData.opportunities);
//         } else {
//           setOpportunities([]);
//         }
//       } catch (err) {
//         console.error('Error fetching data:', err);
//         setError('Failed to load posts and opportunities');
//         setPosts([]);
//         setOpportunities([]);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   useEffect(() => {
//     const fetchVillageEvents = async () => {
//       setTrendingLoading(true);
//       try {
//         const res = await fetch('/api/village-events');
//         const data = await res.json();
        
//         if (data.success && data.events) {
//           const transformedEvents = data.events.map((event) => ({
//             id: event.id,
//             title: event.title,
//             description: event.content,
//             content: event.content,
//             url: null, 
//             urlToImage: event.image_url,
//             publishedAt: event.created_at,
//             source: event.full_name || 'ASYV Village',
//             author: event.full_name || 'Village Admin',
//             category: event.event_type,
//             location: event.location,
//             event_date: event.event_date,
//             isVillageEvent: true // Flag to identify village events
//           }));
          
//           setTrendingNews(transformedEvents);
//         } else {
//           setTrendingNews([]);
//         }
//       } catch (err) {
//         console.error('Error fetching village events:', err);
//         setTrendingNews([]);
//       } finally {
//         setTrendingLoading(false);
//       }
//     };

//     fetchVillageEvents();
//   }, []);

//   const handleViewNews = (article) => {
//     try {
//       sessionStorage.setItem('trending-news-article', JSON.stringify(article));
//       router.push('/feed/news/article');
//     } catch (e) {
//       console.error('Error storing article:', e);
//     }
//   };

//   const filteredTrendingNews = trendingNews

//     .filter((news) => {

//       const matchesCategory = newsCategoryFilter === 'all' || news.category === newsCategoryFilter;

//       const q = newsSearchQuery.toLowerCase().trim();

//       const matchesSearch =

//         !q ||

//         (news.title || '').toLowerCase().includes(q) ||

//         (news.description || '').toLowerCase().includes(q) ||

//         (news.source || '').toLowerCase().includes(q);

//       return matchesCategory && matchesSearch;

//     })

//     .sort((a, b) => {

//       const dateA = new Date(a.publishedAt || 0).getTime();

//       const dateB = new Date(b.publishedAt || 0).getTime();

//       return newsSortBy === 'newest' ? dateB - dateA : dateA - dateB;

//     });



//   const filteredPosts = posts

//     .filter(post => 

//       post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||

//       post.authorUsername.toLowerCase().includes(searchTerm.toLowerCase())

//     )

//     .sort((a, b) => {
      
//       if (sortBy === 'newest') {
        
//         return new Date(b.timestamp) - new Date(a.timestamp);
        
//       } else if (sortBy === 'popular') {
        
//         const popularityA = (a.likes || 0) + (a.comments || 0);
//         const popularityB = (b.likes || 0) + (b.comments || 0);
        
//         return popularityB - popularityA;
        
//       }
      
//       return 0;
      
//     });



//   return (

//     <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">

//       <div className="container mx-auto px-3 sm:px-4 py-4 lg:py-6 max-w-7xl">

//         <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">

          

//           {/* Left Sidebar - Opportunities (formerly Trending Articles) */}

//           <div className="hidden lg:block lg:col-span-1 mt-24">

//             <div className="sticky top-20 space-y-4">

//               <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm">

//                 <div className="p-4 border-b border-neutral-200 dark:border-gray-700">

//                   <div className="flex items-center justify-between mb-3">

//                     <div>

//                       <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Opportunities</h3>

//                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Latest opportunities</p>

//                     </div>

//                     <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-medium">

//                       {opportunities.length}

//                     </span>

//                   </div>

//                 </div>

                

//                 <div className="max-h-96 overflow-y-auto">

//                   {opportunities.length > 0 ? (

//                     opportunities.map((opportunity, index) => (

//                       <div

//                         key={opportunity.id}

//                         className="p-3 border-b border-neutral-100 dark:border-gray-800 hover:bg-green-50 dark:hover:bg-gray-800 transition-colors group"

//                       >

//                         <div className="flex items-start gap-3">

//                           <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${

//                             index === 0 ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white' :

//                             index === 1 ? 'bg-neutral-300 dark:bg-gray-700 text-neutral-700 dark:text-gray-300' :

//                             'bg-neutral-200 dark:bg-gray-800 text-neutral-600 dark:text-gray-400'

//                           }`}>

//                             {index + 1}

//                           </div>

//                           <div className="flex-1 min-w-0">

//                             <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors line-clamp-2">

//                               {opportunity.title}

//                             </p>
//                             {opportunity.op_type && (

//                               <span className="inline-block mt-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded text-xs font-medium">

//                                 {opportunity.op_type}

//                               </span>

//                             )}

//                             <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">

//                               {opportunity.description}

//                             </p>

//                             {opportunity.organization && (

//                               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">

//                                 <span className="font-medium">Org:</span> {opportunity.organization}

//                               </p>

//                             )}

//                             {opportunity.location && (

//                               <p className="text-xs text-gray-500 dark:text-gray-400">

//                                 <span className="font-medium">Location:</span> {opportunity.location}

//                               </p>

//                             )}

//                             {opportunity.deadline && (

//                               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">

//                                 <span className="font-medium">Deadline:</span> {new Date(opportunity.deadline).toLocaleDateString()}

//                               </p>

//                             )}

//                             {opportunity.link && (

//                               <a

//                                 href={opportunity.link}

//                                 target="_blank"

//                                 rel="noopener noreferrer"

//                                 onClick={(e) => e.stopPropagation()}

//                                 className="mt-2 inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium"

//                               >

//                                 <ChevronRight className="w-3 h-3" />

//                                 View Details / Apply

//                               </a>

//                             )}

//                             <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">

//                               {opportunity.post_time ? new Date(opportunity.post_time).toLocaleDateString() : 'Recently'}

//                             </p>

//                           </div>

//                         </div>

//                       </div>

//                     ))

//                   ) : (

//                     <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">

//                       No opportunities yet

//                     </div>

//                   )}

//                 </div>

                

//                 <div className="p-3 border-t border-neutral-200 dark:border-gray-700">

//                   <button className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-green-700 dark:hover:text-green-500 transition-colors">

//                     <Compass className="w-4 h-4" />

//                     Explore All Opportunities

//                     <ChevronRight className="w-4 h-4" />

//                   </button>

//                 </div>

//               </div>

//             </div>

//           </div>
//           {/* Main Feed */}

//           <div className="lg:col-span-2 space-y-4 mt-16">

//             {/* Header */}

//             <div className="bg-white dark:bg-gray-900 rounded-lg p-4 lg:p-6 border border-neutral-200 dark:border-gray-700 shadow-sm">

//               <h1 className="text-2xl lg:text-3xl font-semibold text-gray-800 dark:text-gray-200 mb-2">

//                 Community Feed

//               </h1>

//               <p className="text-gray-600 dark:text-gray-300 text-sm lg:text-base">

//                 Stay connected with your ASYV family

//               </p>

//             </div>



//             {/* Post Creator - Simple version if missing */}

//             {auth && userInfo && (

//               <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-4">

//                 <div className="flex items-center gap-3 mb-3">

//                   <div className="relative w-10 h-10 rounded-full overflow-hidden">

//                     <Image

//                       src="https://api.dicebear.com/9.x/personas/svg?seed=User"

//                       alt="User"

//                       width={40}

//                       height={40}

//                       className="object-cover"

//                     />

//                   </div>

//                   <input

//                     type="text"

//                     placeholder="What's on your mind?"

//                     className="flex-1 px-4 py-2 border border-neutral-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"

//                   />

//                 </div>

//                 <div className="flex justify-end">

//                   <button className="px-6 py-2 bg-green-700 dark:bg-green-600 text-white rounded-full hover:bg-green-800 dark:hover:bg-green-700 transition-colors">

//                     Post

//                   </button>

//                 </div>

//               </div>

//             )}



//             {/* Search and Filter */}

//             <div className="flex flex-col sm:flex-row gap-3">

//               <div className="relative flex-1">

//                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />

//                 <input

//                   type="text"

//                   value={searchTerm}

//                   onChange={(e) => setSearchTerm(e.target.value)}

//                   placeholder="Search posts, users, or tags..."

//                   className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 dark:border-gray-700 rounded-sm focus:outline-none focus:ring-1 focus:ring-orange-500 dark:focus:ring-orange-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 text-sm"

//                 />

//               </div>

//                  <Select value={sortBy} onValueChange={setSortBy}>

//                 <SelectTrigger className="w-full sm:w-48 h-11">

//                   <Filter className="h-4 w-4 mr-2" />

//                   <SelectValue placeholder="Sort by" />

//                 </SelectTrigger>

//                 <SelectContent>

//                   <SelectItem value="newest">Newest First</SelectItem>

//                   <SelectItem value="popular">Most Popular</SelectItem>

//                 </SelectContent>

//               </Select>

//             </div>



//             {/* Posts */}

//             {error && (

//               <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center gap-3">

//                 <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400" />

//                 <span className="text-red-700 dark:text-red-300">{error}</span>

//               </div>

//             )}



//             {isLoading ? (

//               <div className="space-y-4">

//                 {[1, 2, 3].map((i) => (

//                   <div key={i} className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-4 animate-pulse">

//                     <div className="flex items-center gap-3 mb-4">

//                       <div className="w-12 h-12 bg-neutral-200 dark:bg-gray-700 rounded-full"></div>

//                       <div className="flex-1">

//                         <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>

//                         <div className="h-3 bg-neutral-200 dark:bg-gray-700 rounded w-1/4"></div>

//                       </div>

//                     </div>

//                     <div className="space-y-2">

//                       <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded"></div>

//                       <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded w-5/6"></div>

//                     </div>

//                   </div>

//                 ))}

//               </div>

//             ) : filteredPosts.length > 0 ? (

//               <div className="space-y-4">

//                 {filteredPosts.map((post) => (

//                   <SimplePostCard

//                     key={post.id}

//                     post={post}

//                     currentUserId={currentUserId}

//                   />

//                 ))}

//               </div>

//             ) : (

//               <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-8 text-center">

//                 <p className="text-gray-500 dark:text-gray-400">No posts found. Be the first to share!</p>

//               </div>

//             )}

//           </div>



//           {/* Right Sidebar - Activity & Stats */}

//           <div className="hidden lg:block lg:col-span-1">

//             <div className="sticky top-20 space-y-4">

//               {/* Activity Feed - Trending News */}

//               <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 shadow-sm mt-24 ">

//                 <div className="p-4 border-b border-neutral-200 dark:border-gray-700">

//                   <div className="flex items-center justify-between">

//                     <h3 className="text-base font-semibold text-gray-800 dark:text-gray-200">Village Events</h3>

//                     <Calendar className="w-4 h-4 text-green-500" />
             

//                   </div>

//                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Latest news and events in our community</p>

//                 </div>



//                 {/* News Search */}

//                 <div className="p-3 border-b border-neutral-100 dark:border-gray-800 space-y-3">

//                   <div className="relative">

//                     <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />

//                     <input

//                       type="text"

//                       value={newsSearchQuery}

//                       onChange={(e) => setNewsSearchQuery(e.target.value)}

//                       placeholder="Search by title, source..."

//                       className="w-full pl-8 pr-7 py-2 text-xs border border-neutral-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"

//                     />

//                     {newsSearchQuery && (

//                       <button

//                         type="button"

//                         onClick={() => setNewsSearchQuery('')}

//                         className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-gray-700 text-gray-500"

//                         aria-label="Clear search"

//                       >

//                         <X className="w-3 h-3" />

//                       </button>

//                     )}

//                   </div>

//                   <div className="flex gap-1.5 flex-wrap">

//                     <select

//                       value={newsCategoryFilter}

//                       onChange={(e) => setNewsCategoryFilter(e.target.value)}

//                       className="flex-1 min-w-0 text-xs py-1.5 px-2 border border-neutral-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500"

//                     >

//                       {NEWS_CATEGORIES.map((c) => (

//                         <option key={c.value} value={c.value}>

//                           {c.label}

//                         </option>
//                       ))}

//                     </select>

//                     <select

//                       value={newsSortBy}

//                       onChange={(e) => setNewsSortBy(e.target.value)}

//                       className="flex-1 min-w-0 text-xs py-1.5 px-2 border border-neutral-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-green-500"

//                     >

//                       <option value="newest">Newest</option>

//                       <option value="oldest">Oldest</option>

//                     </select>

//                   </div>

//                   {(newsSearchQuery || newsCategoryFilter !== 'all') && (

//                     <p className="text-xs text-gray-500 dark:text-gray-400">

//                       Showing {filteredTrendingNews.length} of {trendingNews.length} articles

//                     </p>

//                   )}

//                 </div>

                

//                 <div className="h-96 overflow-y-auto p-4 space-y-3">

//                   {trendingLoading ? (

//                     <div className="flex flex-col items-center justify-center py-12 gap-3">

//                       <Loader className="w-8 h-8 animate-spin text-green-600" />

//                       <span className="text-sm text-gray-500 dark:text-gray-400">Loading news...</span>

//                     </div>

//                   ) : trendingNews.length > 0 ? (

//                     filteredTrendingNews.length > 0 ? (

//                     filteredTrendingNews.map((news, index) => {

//                       const shortDesc = (news.description || news.content || '')

//                         .replace(/\[\+?\d* chars\]/g, '')

//                         .trim()

//                         .slice(0, TRENDING_DESCRIPTION_LENGTH);

//                       const categoryLabel = (news.category || '').charAt(0).toUpperCase() + (news.category || '').slice(1);

//                       const timeAgo = news.publishedAt
//                       const date = new Date(timeAgo);

//                       const hours = date.getUTCHours();
//                       const minutes = date.getUTCMinutes();console.log(`${hours}:${minutes.toString().padStart(2, "0")}`)
                      
//                       const pastTime=`Posted ${hours}hours ${minutes.toString().padStart(2, "0")}minutes ago`
// console.log("pastTime ",pastTime)
//                         ? (() => {

//                             const diff = Date.now() - new Date(news.publishedAt).getTime();

//                             const mins = Math.floor(diff / 60000);

//                             const hours = Math.floor(diff / 3600000);

//                             if (mins < 60) return `${mins}m ago`;

//                             if (hours < 24) return `${hours}h ago`;

//                             return `${Math.floor(hours / 24)}d ago`;

//                           })()

//                         : '';

//                       return (

//                         <div

//                           key={`${news.title}-${index}`}

//                           className="p-3 border border-neutral-100 dark:border-gray-800 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 transition-colors cursor-pointer group"

//                           onClick={() => handleViewNews(news)}

//                         >

//                           <div className="flex items-start gap-2">

//                             <Flame className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />

//                             <div className="flex-1 min-w-0">

//                               <p className="text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors line-clamp-2">

//                                 {news.title}

//                               </p>

//                               {shortDesc && (

//                                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">

//                                   {shortDesc}{shortDesc.length >= TRENDING_DESCRIPTION_LENGTH ? '...' : ''}

//                                 </p>

//                               )}

//                               <div className="flex items-center gap-2 mt-2 flex-wrap">

//                                 <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs font-medium">

//                                   {categoryLabel}

//                                 </span>

//                                 {timeAgo && (
//                                   <span className="text-xs text-gray-500 dark:text-gray-400">{pastTime}</span>
//                                 )}
//                               </div>
//                               <div className="flex items-center gap-1 mt-2">
//                                 <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1 group-hover:underline">
//                                   View more
//                                   <ExternalLink className="w-3 h-3" />
//                                 </span>
//                               </div>

//                             </div>

//                           </div>

//                         </div>

//                       );

//                     })

//                     ) : (

//                       <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">

//                         No articles match your search. Try different filters.

//                       </div>

//                     )

//                   ) : (

//                     <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">

//                       No trending news available. Try again later.

//                     </div>

//                   )}

//                 </div>

//               </div>

//             </div>

//           </div>

//         </div>

//       </div>

//     </div>

//   );

// }

