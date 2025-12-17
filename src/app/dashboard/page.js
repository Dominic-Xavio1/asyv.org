
'use client';

import { useState, useEffect } from 'react';
import { Bell, Search, MessageSquare,UserCog, LayoutList, Users, BookOpen, Calendar, Video, TrendingUp, Settings, LogOut, Menu, X, Home, Plus, ChevronRight, Upload, Send, Edit2, Trash2, MoreVertical, FileImage,Filter } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Textarea } from "@/components/ui/textarea";
import {Separator} from "@/components/ui/separator"
import {Input} from "@/components/ui/input"
import {Button} from "@/components/ui/button"
import Link from "next/link"
import toast from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { set } from 'zod';
const USE_DUMMY = false;

// Updated AnimatedModal Component
const AnimatedModal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-scaleIn mx-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-gray-200">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500 dark:text-gray-400" />
          </button>
        </div>
        
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const PostForm = ({ onClose, onSubmit, userId, existingPost = null }) => {
  const [title, setTitle] = useState(existingPost?.title || '');
  const [content, setContent] = useState(existingPost?.content || '');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(existingPost?.media_url || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
const isVideoUrl = (url) => {
  if (!url) return false;
  
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v'];
  const lowerUrl = url.toLowerCase();
  
  return videoExtensions.some(ext => lowerUrl.endsWith(ext));
};
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const formData = new FormData();
      formData.append('created_by', userId);
      formData.append('title', title);
      formData.append('content', content);
      if (image) {
        formData.append('media_url', image);
        if (image.type?.startsWith('video/')) {
          formData.append('media_type', 'video');
        } else if (image.type?.startsWith('image/')) {
          formData.append('media_type', 'image');
        }
      } else if (existingPost?.media_url && !image) {
        formData.append('media_url', existingPost.media_url);
        formData.append('media_type', existingPost.media_type || 'image');
      } else {
        formData.append('media_url', '');
        formData.append('media_type', '');
      }

      let response;
      if (existingPost) {
        formData.append('id', existingPost.id);
        response = await fetch('/api/post', {
          method: 'PUT',
          body: formData
        });
      } else {
        response = await fetch('/api/post', {
          method: 'POST',
          body: formData
        });
      }

      const result = await response.json();
      toast.success(existingPost ? 'Post updated successfully!' : 'Post Created successfully!'); 
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save post');
      }

      if (onSubmit) {
        onSubmit(result.post || existingPost);
      }
      
      setTitle('');
      setContent('');
      setImage(null);
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error('Failed to save post:', error);
      setError(error.message || 'Failed to save post. Please try again.');
    } finally {
      setLoading(false);
    }
  };
const fetchUserPost =async()=>{
  const response = await fetch("api/post");
  const data  =await response.json()
  console.log("returned response of post ",data)
}
fetchUserPost()
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImage(null);
      setImagePreview(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="post-title" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Post Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="post-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for your post..."
          className="w-full"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="post-content" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Content <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="post-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share your thoughts with the community..."
          className="w-full min-h-[120px] resize-none"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Add Media (Optional) - Image or Video
        </label>
        <div className="border-2 border-dashed border-neutral-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-green-500 dark:hover:border-green-400 transition-colors cursor-pointer bg-neutral-50 dark:bg-gray-800/50">
          <input
            type="file"
            id="post-media"
            className="hidden"
            accept="image/*,video/*"
            onChange={handleImageChange}
            disabled={loading}
          />
          <label htmlFor="post-media" className="cursor-pointer block space-y-2">
            <p className="text-sm text-neutral-600 dark:text-gray-400">
              {image ? image.name : imagePreview ? 'Click to change media' : 'Click to upload image or video'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-gray-500">
              Supports: JPG, PNG, GIF, MP4, MOV, AVI
            </p>
          </label>
        </div>
        {imagePreview && (
          <div className="mt-2">
            {isVideoUrl(imagePreview) ? (
              <video src={imagePreview} controls className="w-full h-48 rounded-lg object-cover" />
            ) : (
              <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImagePreview(null);
                    setImage(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Separator />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 px-6"
          disabled={loading}
        >
          {loading ? (existingPost ? 'Updating...' : 'Publishing...') : (existingPost ? 'Update Post' : 'Publish Post')}
        </Button>
      </div>
    </form>
  );
};


// ArticleForm Component
const ArticleForm = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      onSubmit({ title, content, coverImage, type: 'article' });
      setTitle('');
      setContent('');
      setCoverImage(null);
      onClose();
    } catch (error) {
      console.error('Failed to create article:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Article Title
        </label>
        <Input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a compelling title..."
          className="w-full"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Cover Image
        </label>
        <div className="border-2 border-dashed border-neutral-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-orange-500 dark:hover:border-orange-400 transition-colors cursor-pointer bg-neutral-50 dark:bg-gray-800/50">
          <input
            type="file"
            id="article-cover"
            className="hidden"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files[0])}
            disabled={loading}
          />
          <label htmlFor="article-cover" className="cursor-pointer block space-y-2">
            <Upload className="w-10 h-10 mx-auto text-neutral-400 dark:text-gray-500" />
            <p className="text-sm text-neutral-600 dark:text-gray-400">
              {coverImage ? coverImage.name : 'Upload cover image'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-gray-500">
              Recommended: 1200x630px
            </p>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Content
        </label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your article content here..."
          className="w-full min-h-[200px] resize-none"
          rows="6"
          required
          disabled={loading}
        />
        <p className="text-xs text-neutral-500 dark:text-gray-500">
          Minimum 300 characters recommended
        </p>
      </div>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 px-6"
          disabled={loading}
        >
          {loading ? 'Publishing...' : 'Publish Article'}
        </Button>
      </div>
    </form>
  );
};

// OpportunityForm Component
const OpportunityForm = ({ onClose, onSubmit, userId, existingOpportunity = null }) => {
  const [title, setTitle] = useState(existingOpportunity?.title || '');
  const [opType, setOpType] = useState(existingOpportunity?.op_type || '');
  const [description, setDescription] = useState(existingOpportunity?.description || '');
  const [deadline, setDeadline] = useState(existingOpportunity?.deadline ? existingOpportunity.deadline.split('T')[0] : '');
  const [link, setLink] = useState(existingOpportunity?.link || '');
  const [organization, setOrganization] = useState(existingOpportunity?.organization || '');
  const [location, setLocation] = useState(existingOpportunity?.location || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!title || !opType || !description) {
        throw new Error('Title, Opportunity Type, and Description are required');
      }

      const formData = new FormData();
      formData.append('user_id', userId);
      formData.append('title', title);
      formData.append('op_type', opType);
      formData.append('description', description);
      if (deadline) formData.append('deadline', deadline);
      if (link) formData.append('link', link);
      if (organization) formData.append('organization', organization);
      if (location) formData.append('location', location);
      formData.append('approved', 'true'); // Auto-approve for CRC/superuser

      let response;
      if (existingOpportunity) {
        formData.append('id', existingOpportunity.id);
        response = await fetch('/api/opportunity', {
          method: 'PUT',
          body: formData
        });
      } else {
        response = await fetch('/api/opportunity', {
          method: 'POST',
          body: formData
        });
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save opportunity');
      }

      if (onSubmit) {
        onSubmit(result.opportunity);
      }
      
      // Reset form
      setTitle('');
      setOpType('');
      setDescription('');
      setDeadline('');
      setLink('');
      setOrganization('');
      setLocation('');
      onClose();
      toast.success(existingOpportunity ? 'Opportunity updated successfully!' : 'Opportunity posted successfully!');
    } catch (error) {
      console.error('Failed to save opportunity:', error);
      setError(error.message || 'Failed to save opportunity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="opportunity-title" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Opportunity Title 
        </label>
        <Input
          id="opportunity-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter opportunity title..."
          className="w-full mt-2"
          required
          disabled={loading}
        />
      </div>
<div className="space-y-2">
        <label htmlFor="opportunity-type" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Opportunity Type 
        </label>
        <select
          id="opportunity-type"
          value={opType}
          onChange={(e) => setOpType(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 dark:focus:ring-orange-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 mt-2"
          required
          disabled={loading}
        >
          <option value="">Select type...</option>
          <option value="job">Job</option>
          <option value="internship">Internship</option>
          <option value="scholarship">Scholarship</option>
          <option value="volunteer">Volunteer</option>
          <option value="event">Event</option>
          <option value="other">Other</option>
        </select>
      </div> 
{/* 
<Select value={opType} onValueChange={setOpType}>
                <SelectTrigger className="w-full sm:w-48 h-11">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select> */}
      <div className="space-y-2">
        <label htmlFor="opportunity-description" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Description
        </label>
        <Textarea
          id="opportunity-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the opportunity in detail..."
          className="w-full min-h-[120px] resize-none mt-2"
          required
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="opportunity-deadline" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
            Deadline (Optional)
          </label>
          <Input
            id="opportunity-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="opportunity-location" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
            Location (Optional)
          </label>
          <Input
            id="opportunity-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Kigali, Rwanda"
            className="w-full"
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="opportunity-organization" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Organization (Optional)
        </label>
        <Input
          id="opportunity-organization"
          type="text"
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Organization name..."
          className="w-full"
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="opportunity-link" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Application Link (Optional)
        </label>
        <Input
          id="opportunity-link"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://example.com/apply"
          className="w-full"
          disabled={loading}
        />
        <p className="text-xs text-neutral-500 dark:text-gray-500">
          Link where users can apply or find more information
        </p>
      </div>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 px-6"
          disabled={loading}
        >
          {loading ? (existingOpportunity ? 'Updating...' : 'Posting...') : (existingOpportunity ? 'Update Opportunity' : 'Post Opportunity')}
        </Button>
      </div>
    </form>
  );
};

// ChatGroupForm Component
const ChatGroupForm = ({ onClose, onSubmit }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      onSubmit({ groupName, description, isPrivate, type: 'group' });
      setGroupName('');
      setDescription('');
      setIsPrivate(false);
      onClose();
    } catch (error) {
      console.error('Failed to create group:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Group Name
        </label>
        <Input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter a unique group name..."
          className="w-full"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Description
        </label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the purpose of this group..."
          className="w-full min-h-[100px] resize-none"
          rows="3"
          required
          disabled={loading}
        />
        <p className="text-xs text-neutral-500 dark:text-gray-500">
          Tell members what this group is about
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Privacy Settings
        </label>
        <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-gray-800/50 rounded-lg border border-neutral-200 dark:border-gray-700">
          <input
            type="checkbox"
            id="private-group"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-4 h-4 text-green-600 dark:text-green-500 border-neutral-300 dark:border-gray-600 rounded focus:ring-green-500 dark:focus:ring-green-600"
            disabled={loading}
          />
          <label htmlFor="private-group" className="text-sm text-neutral-700 dark:text-gray-300 cursor-pointer flex-1">
            <div className="font-medium">Private Group</div>
            <div className="text-xs text-neutral-500 dark:text-gray-500 mt-1">
              Only invited members can join and see group content
            </div>
          </label>
        </div>
      </div>

      <Separator />

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="px-6"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-green-600 hover:bg-green-700 px-6"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Group'}
        </Button>
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
              src="/images/avatar.jpg"
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
        <p className="text-xs text-neutral-500 dark:text-gray-400 mt-2">Click to change avatar</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
          Username
        </label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter your username..."
          className="w-full px-3 md:px-4 py-3 text-base border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us about yourself..."
          className="w-full px-3 md:px-4 py-3 text-base border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-600 focus:border-transparent resize-none bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400"
          rows="3"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 text-base border border-neutral-300 dark:border-gray-600 text-neutral-700 dark:text-gray-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-gray-800 transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-3 text-base bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-800 dark:hover:bg-green-700 transition-colors font-medium"
        >
          Save
        </button>
      </div>
    </form>
  );
};

// Content Card Component
const ContentCard = ({ item, onDelete, onEdit }) => {
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
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-4 hover:shadow-md dark:hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400">
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors">
              {item.title || item.groupName || 'New Post'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : item.date}
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-neutral-400 dark:text-gray-500" />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-xl border border-neutral-200 dark:border-gray-700 py-1 z-10">
              {onEdit && (
                <button 
                  onClick={() => {
                    onEdit(item);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button
                onClick={() => {
                  onDelete(item.id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
        {item.content || item.description || 'No description'}
      </p>
      {/* {item.media_url && (
        <div className="mt-3 rounded-lg overflow-hidden">
          <Image
            src={item?.media_url}
            alt="Post media"
            width={500}
            height={300}
            className="w-full h-48 object-cover"
          />
        </div>
      )} */}
    </div>
  );
};

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [activeModal, setActiveModal] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCrcOrSuperuser, setIsCrcOrSuperuser] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
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
    { id: 'chat', icon: MessageSquare, label: 'Messages', badge: 12 },
    { id: 'community', icon: Users, label: 'Community' },
    { id: 'events', icon: Calendar, label: 'Events' },
    { id: 'feed', icon: LayoutList, label: 'Feed' },
    {id:"management",icon:UserCog,label:"Manage Users"}
  ];
  useEffect(() => {
    // Check user role
    if (typeof window !== 'undefined') {
      const fullInfo = localStorage.getItem('fullInfo');
      if (fullInfo) {
        try {
          const user = JSON.parse(fullInfo);
          setIsCrcOrSuperuser(user.is_crc === true || user.is_superuser === true);
          setCurrentUser(user);
        } catch (e) {
          console.error('Error parsing user info:', e);
        }
      }
    }
  }, []);


  useEffect(()=>{
    if (!currentUser?.id) return;
    const fetchAll = async () => {
      try {
        await fetchPosts();
        if (isCrcOrSuperuser) {
          await fetchOpportunities();
        }
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  },[currentUser, isCrcOrSuperuser])

  // Move fetchPosts to component scope so other handlers can refresh posts
  const fetchPosts = async () => {
    if (!currentUser?.id) return;
    try {
      const response = await fetch('/api/post/owner',{
        method:"POST",
        headers:{
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser?.id }),
      });
      const data = await response.json();
      if (data.success && data.posts) {
        setPosts(data.posts);
        console.log("fetched posts:", data.posts);
      } else {
        console.log('Failed to fetch posts:', data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error(error.message);
    }
  };


  // Delete post
  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) {
      return;
    }

    try {
      const response = await fetch(`/api/post?id=${postId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setPosts(posts.filter(post => post.id !== postId));
        toast.success('Post deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error.message || 'Failed to delete post');
    }
  };

  const handlePostSubmit = async (postData) => {
    try {
      await fetchPosts();
      if (editingPost) {
        toast.success('Post updated successfully');
        setEditingPost(null);
      } else {
        toast.success('Post created successfully');
      }
      // Optionally, if a single post object is provided, prepend it for instant UI feedback
      if (postData && postData.id) {
        setPosts((prev) => {
          // if exists replace, else add to start
          const exists = prev.find(p => p.id === postData.id);
          if (exists) return prev.map(p => p.id === postData.id ? postData : p);
          return [postData, ...prev];
        });
      }
    } catch (error) {
      console.error('Error refreshing posts:', error);
    }
  };
  const fetchOpportunities = async () => {
    try{
      if(!currentUser?.id) return;
      const response = await fetch('/api/opportunity/owner',{
        method:"POST",
        headers:{
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owner_id: currentUser?.id }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch opportunities');
      }
      // backend may return an array `opportunities` or a single `opportunity` (legacy)
      const payload = data.opportunities ?? data.opportunity ?? [];
      const opsArray = Array.isArray(payload) ? payload : [payload];
      setOpportunities(opsArray);
    }
    catch(err){
      console.error('Error fetching opportunities:', err);
      toast.error('Failed to fetch opportunities');
    }
  }
  const handleOpportunitySubmit = async (opportunityData) => {
    try {
      await fetchOpportunities(); // Refresh opportunities after creation/update
      if (editingOpportunity) {
        toast.success('Opportunity updated successfully');
        setEditingOpportunity(null);
      } else {
        toast.success('Opportunity posted successfully');
      }
    } catch (error) {
      console.error('Error refreshing opportunities:', error);
    }
  };

  // Delete opportunity
  const handleDeleteOpportunity = async (opportunityId) => {
    if (!confirm('Are you sure you want to delete this opportunity?')) {
      return;
    }

    try {
      const response = await fetch(`/api/opportunity?id=${opportunityId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      
      if (result.success) {
        setOpportunities(opportunities.filter(opp => opp.id !== opportunityId));
        toast.success('Opportunity deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete opportunity');
      }
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast.error(error.message || 'Failed to delete opportunity');
    }
  };
function handleNavigate(word){
  switch(word){
    case "feed":
      return "/feed";
    case "dashboard":
      return "/dashboard";
    case 'management':
      return "/management";
    case "chat":
      return "/chat";
    default:
      return "/";
  }
}


  const handleCreateContent = (data) => {
    // #region agent log
    const timestamp = Date.now();
    fetch('http://127.0.0.1:7242/ingest/a5c05f7c-9e65-48f3-bf13-130a70f52554',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.js:759',message:'handleCreateContent called',data:{timestamp,dataType:data.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    const newItem = {
      ...data,
      id: timestamp,  
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
    toast.success('Logged out successfully!');
    if (typeof window !== 'undefined') {
        localStorage.removeItem("token")
      localStorage.removeItem("user")
        localStorage.removeItem("fullInfo")
        localStorage.removeItem("second_name")
        localStorage.removeItem("theme");
    }
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900" suppressHydrationWarning>
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-900 border-r border-neutral-200 dark:border-gray-700 flex-col z-80">
        <div className="p-6 border-b border-neutral-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image 
                src='/agahozo.png'
                alt="ASYV Logo" 
                width={60}
                height={80}
                className="object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-200">ASYV</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Community</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map((item) => {
          if(item.id=="management"&& !isCrcOrSuperuser){
return null;
          }
          
            return (
              <Link href={handleNavigate(item.id)}>
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-left">
                {item.label}
                {item.label === "Feed" && (
                  <ChevronRight className="inline-block ml-1 w-4 h-4 text-neutral-400 dark:text-gray-500" />
                )}
              </span>
              {item.badge && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </button>
            </Link>
          )})}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-gray-700 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 shadow-2xl flex flex-col">
            <div className="p-5 border-b border-neutral-200 dark:border-gray-700 flex items-center justify-between">
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
                  <h1 className="text-base font-semibold text-gray-800 dark:text-gray-200">ASYV</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Community</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
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
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-gray-800'
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

            <div className="p-3 border-t border-neutral-200 dark:border-gray-700 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-gray-800 transition-all duration-200">
                <Settings className="w-5 h-5" />
                <span>Settings</span>
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
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
   

        {/* Dashboard Content */}
        <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 mt-22">
          {/* Create Buttons */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <button
              onClick={() => setActiveModal('post')}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border-2 border-dashed border-neutral-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 group-hover:bg-green-700 dark:group-hover:bg-green-600 group-hover:text-white transition-all duration-300 flex-shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-500">Create Post</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Share thoughts</p>
              </div>
            </button>

            {isCrcOrSuperuser ? (
              <button
                onClick={() => setActiveModal('opportunity')}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border-2 border-dashed border-neutral-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300 group"
              >
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 group-hover:bg-orange-500 dark:group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-500">Post Opportunity</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Share opportunity</p>
                </div>
              </button>
            ) : (
              <button
                onClick={() => setActiveModal('article')}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border-2 border-dashed border-neutral-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300 group"
              >
                <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 group-hover:bg-orange-500 dark:group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 flex-shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-orange-600 dark:group-hover:text-orange-500">Write Article</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Share story</p>
                </div>
              </button>
            )}
            <button
              onClick={() => setActiveModal('group')}
              className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border-2 border-dashed border-neutral-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300 group"
            >
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 group-hover:bg-green-700 dark:group-hover:bg-green-600 group-hover:text-white transition-all duration-300 flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-500">New Group</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Start chat</p>
              </div>
            </button>
          </div>

          {/* User Content Sections */}
          <div className="space-y-4 sm:space-y-6">
            {/* My Posts */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-700 dark:text-green-500" />
                  My Posts ({posts.length})
                </h3>
                <button
                  onClick={() => setActiveModal('post')}
                  className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-500 hover:text-green-800 dark:hover:text-green-400 transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">New Post</span>
                  <span className="sm:hidden">New</span>
                </button>
              </div>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">Loading posts...</p>
                </div>
              ) : posts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {posts.map((post) => (
                    <ContentCard 
                      key={post.created_at} 
                      item={{...post, type: 'post'}} 
                      onDelete={handleDeletePost}
                      onEdit={(post) => {
                        setEditingPost(post);
                        setActiveModal('post');
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                  <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No posts yet. Create your first post!</p>
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  {isCrcOrSuperuser ? `My Opportunities (${opportunities.length})` : `My Articles (${userContent.articles.length})`}
                </h3>
                {isCrcOrSuperuser && (
                  <button
                    onClick={() => {
                      setEditingOpportunity(null);
                      setActiveModal('opportunity');
                    }}
                    className="text-xs sm:text-sm font-medium text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">New Opportunity</span>
                    <span className="sm:hidden">New</span>
                  </button>
                )}
                {!isCrcOrSuperuser && (
                  <button
                    onClick={() => setActiveModal('article')}
                    className="text-xs sm:text-sm font-medium text-orange-500 dark:text-orange-400 hover:text-orange-600 dark:hover:text-orange-300 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">New Article</span>
                    <span className="sm:hidden">New</span>
                  </button>
                )}
              </div>
              {isCrcOrSuperuser ? (
                loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Loading opportunities...</p>
                  </div>
                ) : (Array.isArray(opportunities) && opportunities.filter(opp => opp.user_id === currentUser?.id).length > 0) ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {opportunities.filter(opp => opp.user_id === currentUser?.id).map((opportunity) => (
                      <ContentCard 
                        key={opportunity.id} 
                        item={{
                          ...opportunity,
                          type: 'opportunity',
                          title: opportunity.title,
                          content: opportunity.description
                        }} 
                        onDelete={handleDeleteOpportunity}
                        onEdit={(opp) => {
                          setEditingOpportunity(opp);
                          setActiveModal('opportunity');
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No opportunities yet. Post your first opportunity!</p>
                  </div>
                )
              ) : (
                userContent.articles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {userContent.articles.map((article) => (
                      <ContentCard key={article.id} item={article} onDelete={(id) => handleDeleteContent(id, 'article')} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No articles yet. Write your first article!</p>
                  </div>
                )
              )}
            </div>

            {/* My Groups */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 text-green-700 dark:text-green-500" />
                  My Groups ({userContent.groups.length})
                </h3>
                <button
                  onClick={() => setActiveModal('group')}
                  className="text-xs sm:text-sm font-medium text-green-700 dark:text-green-500 hover:text-green-800 dark:hover:text-green-400 transition-colors flex items-center gap-1"
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
                <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
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
        onClose={() => {
          setActiveModal(null);
          setEditingPost(null);
        }}
        title={editingPost ? "Edit Post" : "Create New Post"}
      >
        <PostForm 
          onClose={() => {
            setActiveModal(null);
            setEditingPost(null);
          }} 
          onSubmit={handlePostSubmit} 
          userId={currentUser?.id}
          existingPost={editingPost}
        />
      </AnimatedModal>

      {isCrcOrSuperuser ? (
        <AnimatedModal
          isOpen={activeModal === 'opportunity'}
          onClose={() => {
            setActiveModal(null);
            setEditingOpportunity(null);
          }}
          title={editingOpportunity ? "Edit Opportunity" : "Post New Opportunity"}
        >
          <OpportunityForm 
            onClose={() => {
              setActiveModal(null);
              setEditingOpportunity(null);
            }} 
            onSubmit={handleOpportunitySubmit} 
            userId={currentUser?.id}
            existingOpportunity={editingOpportunity}
          />
        </AnimatedModal>
      ) : (
        <AnimatedModal
          isOpen={activeModal === 'article'}
          onClose={() => setActiveModal(null)}
          title="Write New Article"
        >
          <ArticleForm onClose={() => setActiveModal(null)} onSubmit={handleCreateContent} />
        </AnimatedModal>
      )}

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

    </div>
  );
}