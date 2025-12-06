// app/dashboard/page.jsx - PUT THIS FILE IN app/dashboard/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, MessageSquare, LayoutList, Users, BookOpen, Calendar, Video, TrendingUp, Settings, LogOut, Menu, X, Home, Plus, ChevronRight, Upload, Send, Edit2, Trash2, MoreVertical, FileImage } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
// import asyv from "next/asyv.png";

// Toggle this to true to use dummy data and bypass backend calls
const USE_DUMMY = true;

// Updated AnimatedModal Component
const AnimatedModal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-[95vw] sm:max-w-md md:max-w-lg max-h-[80vh] sm:max-h-[90vh] overflow-hidden animate-slideUp sm:animate-scaleIn mx-2 sm:mx-4 mb-2 sm:mb-0">
        <div className="flex items-center justify-between p-4 md:p-5 border-b border-neutral-200 sticky top-0 bg-white z-10">
          <h3 className="text-base md:text-lg font-semibold text-neutral-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="overflow-y-auto" style={{ 
          maxHeight: 'calc(80vh - 65px)',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div className="p-4 md:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Post Form Component
const PostForm = ({ onClose, onSubmit, userId }) => {
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const fakePost = {
        id: Date.now(),
        title: null,
        content,
        date: new Date().toLocaleDateString(),
        author: userId,
        type: 'post'
      };
      onSubmit(fakePost);
      setContent('');
      setImage(null);
      onClose();
    } catch (error) {
      console.error('Failed to create post:', error);
      alert('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          What's on your mind?
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts with the community..."
          className="w-full px-3 md:px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-base"
          rows="4"
          required
          disabled={loading}
        />
      </div>

      <div className="border-2 border-dashed border-neutral-200 rounded-lg p-4 text-center hover:border-green-300 transition-colors cursor-pointer">
        <input
          type="file"
          id="post-image"
          className="hidden"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
          disabled={loading}
        />
        <label htmlFor="post-image" className="cursor-pointer block">
          <FileImage className="w-8 h-8 md:w-12 md:h-12 mx-auto text-neutral-400 mb-2" />
          <p className="text-sm text-neutral-600">
            {image ? image.name : 'Click to upload image (optional)'}
          </p>
        </label>
      </div>
      
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 text-base border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-3 text-base bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </form>
  );
};

// ArticleForm Component
const ArticleForm = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, content, coverImage, type: 'article' });
    setTitle('');
    setContent('');
    setCoverImage(null);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Article Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter article title..."
          className="w-full px-3 md:px-4 py-3 text-base border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      <div className="border-2 border-dashed border-neutral-200 rounded-lg p-4 text-center hover:border-green-300 transition-colors cursor-pointer">
        <input
          type="file"
          id="article-cover"
          className="hidden"
          accept="image/*"
          onChange={(e) => setCoverImage(e.target.files[0])}
        />
        <label htmlFor="article-cover" className="cursor-pointer block">
          <Upload className="w-8 h-8 md:w-10 md:h-10 mx-auto text-neutral-400 mb-2" />
          <p className="text-sm text-neutral-600">
            {coverImage ? coverImage.name : 'Upload cover image'}
          </p>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Content
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your article..."
          className="w-full px-3 md:px-4 py-3 text-base border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          rows="6"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 text-base border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-3 text-base bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          Publish
        </button>
      </div>
    </form>
  );
};

// ChatGroupForm Component
const ChatGroupForm = ({ onClose, onSubmit }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ groupName, description, isPrivate, type: 'group' });
    setGroupName('');
    setDescription('');
    setIsPrivate(false);
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Group Name
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name..."
          className="w-full px-3 md:px-4 py-3 text-base border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this group about?"
          className="w-full px-3 md:px-4 py-3 text-base border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          rows="3"
          required
        />
      </div>

      <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-lg">
        <input
          type="checkbox"
          id="private-group"
          checked={isPrivate}
          onChange={(e) => setIsPrivate(e.target.checked)}
          className="w-4 h-4 text-green-600 border-neutral-300 rounded focus:ring-green-500"
        />
        <label htmlFor="private-group" className="text-sm text-neutral-700 cursor-pointer">
          Make this group private (invite-only)
        </label>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 text-base border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-3 text-base bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium"
        >
          Create
        </button>
      </div>
    </form>
  );
};

// ProfileForm Component
const ProfileForm = ({ onClose, onSubmit, currentProfile }) => {
  const [username, setUsername] = useState(currentProfile?.username || 'John Doe');
  const [bio, setBio] = useState(currentProfile?.bio || '');
  const [avatar, setAvatar] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ username, bio, avatar });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col items-center mb-4">
        <div className="relative group">
          <div className="relative w-20 h-20 rounded-full overflow-hidden">
            <Image
              src="https://api.dicebear.com/9.x/personas/svg?seed=Adrian"
              alt="avatar"
              width={80}
              height={80}
              className="object-cover cursor-pointer hover:scale-115 transition-transform"
            />
          </div>
          <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Upload className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </label>
          <input
            type="file"
            id="avatar-upload"
            className="hidden"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files[0])}
          />
        </div>
        <p className="text-xs text-neutral-500 mt-2">Click to change avatar</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username..."
          className="w-full px-3 md:px-4 py-3 text-base border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          className="w-full px-3 md:px-4 py-3 text-base border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
          rows="3"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 text-base border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-3 text-base bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors font-medium"
        >
          Save
        </button>
      </div>
    </form>
  );
};

// Content Card Component
const ContentCard = ({ item, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getIcon = () => {
    switch(item.type) {
      case 'post': return MessageSquare;
      case 'article': return BookOpen;
      case 'group': return Users;
      default: return MessageSquare;
    }
  };

  const Icon = getIcon();

  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50 text-green-700">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-neutral-900 group-hover:text-green-700 transition-colors">
              {item.title || item.groupName || 'New Post'}
            </h4>
            <p className="text-xs text-neutral-500">{item.date}</p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-neutral-100 rounded transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-neutral-400" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-10">
              <button className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 flex items-center gap-2">
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-neutral-600 line-clamp-2">
        {item.content || item.description || 'No description'}
      </p>
    </div>
  );
};

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [activeModal, setActiveModal] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [userContent, setUserContent] = useState({
    posts: [],
    articles: [],
    groups: []
  });
  const [profile, setProfile] = useState({
    username: 'User',
    bio: 'Community member'
  });

  const menuItems = [
    { id: 'home', icon: Home, label: 'Dashboard' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', badge: 12 },
    { id: 'community', icon: Users, label: 'Community' },
    { id: 'events', icon: Calendar, label: 'Events' },
    { id: 'feed', icon: LayoutList, label: 'Feed' },
  ];

  useEffect(() => {
    // If using dummy mode, populate with local dummy user and posts
    if (USE_DUMMY) {
      const dummyUser = { id: 1, full_name: 'Demo User', username: 'demo.user' };
      const dummyPosts = [
        { id: 101, content: 'Welcome to the demo dashboard!', date: new Date().toLocaleDateString(), type: 'post' },
        { id: 102, content: 'This is a sample post to help you explore the UI.', date: new Date().toLocaleDateString(), type: 'post' }
      ];
      setCurrentUser(dummyUser);
      setPosts(dummyPosts);
      setProfile({
        username: dummyUser.full_name,
        bio: 'Community member'
      });
      setLoading(false);
      return;
    }

    // Check authentication for non-dummy mode
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        router.push('/');
        return;
      }

      const user = JSON.parse(storedUser);
      setCurrentUser(user);
      setProfile({
        username: user.full_name || 'User',
        bio: 'Community member'
      });
    }

    setLoading(false);
  }, [router]);

  const handleCreateContent = (data) => {
    const newItem = {
      ...data,
      id: Date.now(),
      date: new Date().toLocaleDateString()
    };

    if (data.type === 'post') {
      setUserContent(prev => ({ ...prev, posts: [newItem, ...prev.posts] }));
    } else if (data.type === 'article') {
      setUserContent(prev => ({ ...prev, articles: [newItem, ...prev.articles] }));
    } else if (data.type === 'group') {
      setUserContent(prev => ({ ...prev, groups: [newItem, ...prev.groups] }));
    }
  };

  const handleDeleteContent = (id, type) => {
    if (type === 'post') {
      setUserContent(prev => ({ ...prev, posts: prev.posts.filter(p => p.id !== id) }));
    } else if (type === 'article') {
      setUserContent(prev => ({ ...prev, articles: prev.articles.filter(a => a.id !== id) }));
    } else if (type === 'group') {
      setUserContent(prev => ({ ...prev, groups: prev.groups.filter(g => g.id !== id) }));
    }
  };

  const handleUpdateProfile = (data) => {
    setProfile(data);
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('auth');
      localStorage.removeItem('userInfo');
    }
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white border-r border-neutral-200 flex-col z-40">
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image 
                src='/asyv.png'
                alt="ASYV Logo" 
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-900">ASYV</h1>
              <p className="text-xs text-neutral-500">Community</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.label === "Feed") {
                  router.push('/feed');
                }
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-green-50 text-green-700 shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-left">
                {item.label}
                {item.label === "Feed" && (
                  <ChevronRight className="inline-block ml-1 w-4 h-4 text-neutral-400" />
                )}
              </span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-neutral-200 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all duration-200">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10">
                  <Image 
                    src={asyv} 
                    alt="ASYV Logo" 
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-base font-semibold text-neutral-900">ASYV</h1>
                  <p className="text-xs text-neutral-500">Community</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                    if (item.label === "Feed") {
                      router.push('/feed');
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === item.id
                      ? 'bg-green-50 text-green-700 shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="p-3 border-t border-neutral-200 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-all duration-200">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-neutral-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 hover:bg-neutral-100 rounded-lg transition-colors flex-shrink-0"
              >
                <Menu className="w-5 h-5 text-neutral-700" />
              </button>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-neutral-900 truncate">
                  Welcome, <span className="bg-gradient-to-r from-green-600 via-orange-500 to-green-600 bg-clip-text text-transparent">{profile.username.split(' ')[0]}</span>
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 truncate hidden sm:block">{profile.bio}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <button className="relative p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-700" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
              </button>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <div className="relative w-10 h-10">
                  <Image
                    src="/asyv.png"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    alt="avatar" 
                    width={40}
                    height={40}
                    className="rounded-full cursor-pointer hover:scale-115 transition-transform"
                  />
                </div>
                
                {showProfileMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-neutral-100">
                        <p className="text-sm font-medium text-neutral-900 truncate">{profile.username}</p>
                        <p className="text-xs text-neutral-500 mt-1 truncate">{profile.bio}</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setActiveModal('profile');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          setActiveTab('home');
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <div className="border-t border-neutral-100 mt-2 pt-2">
                        <button 
                          onClick={handleLogout}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6">
          {/* Create Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
            <button
              onClick={() => setActiveModal('post')}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 p-3 bg-white rounded-lg border-2 border-dashed border-neutral-200 hover:border-green-500 hover:bg-green-50 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-green-100 text-green-700 group-hover:bg-green-700 group-hover:text-white transition-all duration-300 flex-shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-neutral-900 group-hover:text-green-700">Create Post</p>
                <p className="text-xs text-neutral-500 hidden sm:block">Share thoughts</p>
              </div>
            </button>

            <button
              onClick={() => setActiveModal('article')}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 p-3 bg-white rounded-lg border-2 border-dashed border-neutral-200 hover:border-orange-500 hover:bg-orange-50 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-orange-100 text-orange-700 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300 flex-shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-neutral-900 group-hover:text-orange-600">Write Article</p>
                <p className="text-xs text-neutral-500 hidden sm:block">Share story</p>
              </div>
            </button>

            <button
              onClick={() => setActiveModal('group')}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 p-3 bg-white rounded-lg border-2 border-dashed border-neutral-200 hover:border-green-500 hover:bg-green-50 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-green-100 text-green-700 group-hover:bg-green-700 group-hover:text-white transition-all duration-300 flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-neutral-900 group-hover:text-green-700">New Group</p>
                <p className="text-xs text-neutral-500 hidden sm:block">Start chat</p>
              </div>
            </button>

            <button
              onClick={() => setActiveModal('profile')}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 p-3 bg-white rounded-lg border-2 border-dashed border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-neutral-100 text-neutral-700 group-hover:bg-neutral-700 group-hover:text-white transition-all duration-300 flex-shrink-0">
                <Edit2 className="w-5 h-5" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-neutral-900 group-hover:text-neutral-700">Edit Profile</p>
                <p className="text-xs text-neutral-500 hidden sm:block">Update info</p>
              </div>
            </button>
          </div>

          {/* User Content Sections */}
          <div className="space-y-4 sm:space-y-6">
            {/* My Posts */}
            <div className="bg-white rounded-lg border border-neutral-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
                  My Posts ({posts.length})
                </h3>
                <button
                  onClick={() => setActiveModal('post')}
                  className="text-xs sm:text-sm font-medium text-green-700 hover:text-green-800 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New Post</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-neutral-500">Loading posts...</p>
                </div>
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {posts.map((post) => (
                    <ContentCard 
                      key={post.id} 
                      item={post} 
                      onDelete={(id) => {
                        setPosts(posts.filter(p => p.id !== id));
                      }} 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-neutral-500">
                  <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No posts yet. Create your first post!</p>
                </div>
              )}
            </div>

            {/* My Articles */}
            <div className="bg-white rounded-lg border border-neutral-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  My Articles ({userContent.articles.length})
                </h3>
                <button
                  onClick={() => setActiveModal('article')}
                  className="text-xs sm:text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New Article</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
              {userContent.articles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {userContent.articles.map((article) => (
                    <ContentCard key={article.id} item={article} onDelete={(id) => handleDeleteContent(id, 'article')} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-neutral-500">
                  <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No articles yet. Write your first article!</p>
                </div>
              )}
            </div>

            {/* My Groups */}
            <div className="bg-white rounded-lg border border-neutral-200 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-neutral-900 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
                  My Groups ({userContent.groups.length})
                </h3>
                <button
                  onClick={() => setActiveModal('group')}
                  className="text-xs sm:text-sm font-medium text-green-700 hover:text-green-800 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New Group</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
              {userContent.groups.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {userContent.groups.map((group) => (
                    <ContentCard key={group.id} item={group} onDelete={(id) => handleDeleteContent(id, 'group')} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-neutral-500">
                  <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No groups yet. Create your first group!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AnimatedModal
        isOpen={activeModal === 'post'}
        onClose={() => setActiveModal(null)}
        title="Create New Post"
      >
        <PostForm onClose={() => setActiveModal(null)} onSubmit={(post) => setPosts([post, ...posts])} userId={currentUser?.id} />
      </AnimatedModal>

      <AnimatedModal
        isOpen={activeModal === 'article'}
        onClose={() => setActiveModal(null)}
        title="Write New Article"
      >
        <ArticleForm onClose={() => setActiveModal(null)} onSubmit={handleCreateContent} />
      </AnimatedModal>

      <AnimatedModal
        isOpen={activeModal === 'group'}
        onClose={() => setActiveModal(null)}
        title="Create Chat Group"
      >
        <ChatGroupForm onClose={() => setActiveModal(null)} onSubmit={handleCreateContent} />
      </AnimatedModal>

      <AnimatedModal
        isOpen={activeModal === 'profile'}
        onClose={() => setActiveModal(null)}
        title="Edit Profile"
      >
        <ProfileForm onClose={() => setActiveModal(null)} onSubmit={handleUpdateProfile} currentProfile={profile} />
      </AnimatedModal>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}