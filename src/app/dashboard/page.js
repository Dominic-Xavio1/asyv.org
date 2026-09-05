'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion as framerMotion, AnimatePresence } from "framer-motion"
import { utils, writeFile } from 'xlsx';
import { InteractiveButton } from '@/components/ui/interactive-button';
import {
  Bell, MessageSquare, UserCog, Lock, KeyRound, ShieldCheck, LayoutList, Users,
  BookOpen, LogOut, ArrowLeft, Menu, X, Home, Plus, ChevronRight, Upload,
  UserCircle, UserPlus, Sparkles,
  Send, Edit2, Trash2, MoreVertical, FileImage, Filter, BarChart3, Calendar, MapPin, Newspaper,
  Download, GraduationCap
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useConfirmDialog } from '@/components/ui/use-confirm-dialog'

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import toast from 'react-hot-toast';
import { useSession, signOut } from "next-auth/react"
import { useAuth } from '@/components/auth/AuthProvider'
import GroupImageDropzone from './GroupImageDropzone'
import MemberSelector from './MemberSelector'
import DialogDemo from "@/components/ui/dialogeDemo"
import { userUnreadNotificationStore } from '../notification/page.js'

import { io } from "socket.io-client"

const accentMap = {
  blue: { header: "bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40", dot: "bg-blue-500" },
  purple: { header: "bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/40", dot: "bg-purple-500" },
  indigo: { header: "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/40", dot: "bg-indigo-500" },
  amber: { header: "bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40", dot: "bg-amber-500" },
};

const StatCard = ({ title, subtitle, children, accentColor = "blue", scrollable = false }) => {
  const accent = accentMap[accentColor] ?? accentMap.blue;
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
      <div className={`px-5 py-3 border-b ${accent.header}`}>
        <div className="flex items-center gap-2">
          <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${accent.dot}`} />
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
            {subtitle && <p className="text-[11px] text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className={`p-4 space-y-2.5 ${scrollable ? "max-h-56 overflow-y-auto" : ""}`}>
        {children}
      </div>
    </div>
  );
};

const StatRow = ({ label, count, pct, barColor = "bg-blue-500", onClick }) => (
  <div className={`space-y-1 ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate flex-1 mr-3" title={label}>
        {label}
      </span>
      <span className="text-[11px] tabular-nums text-gray-500 dark:text-gray-400 flex-shrink-0">
        {count.toLocaleString()} <span className="text-gray-400 dark:text-gray-500">· {pct}%</span>
      </span>
    </div>
    <div className="h-1.5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
      <div className={`h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

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
      console.log("result of post", result)
      if(result.error) {
        toast.error(result.error || 'Failed to save post');
        console.log("error of post", result.error)
        return;
      }
      toast.success(existingPost ? 'Post updated successfully!' : 'Post Created successfully!');

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
  const fetchUserPost = async () => {
    const response = await fetch("api/post");
    const data = await response.json()
    console.log("returned response of post ", data)
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
      const textCount = description.split(' ').length;
      if (textCount > 120) {
        toast.error('Description cannot exceed 120 words');
        return;
      }
      formData.append('user_id', userId);
      formData.append('title', title);
      formData.append('op_type', opType);
      formData.append('description', description);
      if (deadline) formData.append('deadline', deadline);
      if (link) formData.append('link', link);
      if (organization) formData.append('organization', organization);
      if (location) formData.append('location', location);
      formData.append('approved', 'true');

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
        <Input
          id="type-of-opportunity"
          type="text"
          value={opType}
          onChange={(e) => setOpType(e.target.value)}
          placeholder="e.g., Job, Internship, Scholarship..."
          className="w-full"
          disabled={loading}
        />
      </div>
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
            Deadline
          </label>
          <Input
            id="opportunity-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full"
            disabled={loading}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="opportunity-location" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
            Location
          </label>
          <Input
            id="opportunity-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Kigali, Rwanda"
            className="w-full"
            required
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
          Application Link
        </label>
        <Input
          id="opportunity-link"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://example.com/apply"
          className="w-full"
          disabled={loading}
          required
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
const ChatGroupForm = ({ onClose, onSubmit, userId, existingGroup = null }) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [limitNotified, setLimitNotified] = useState(false);
  const [existingImage, setExistingImage] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const imageDropzoneRef = useRef(null);
  const wordLimit = 70;

  // Initialize form with existing group data only once when component mounts or existingGroup changes
  useEffect(() => {
    if (existingGroup) {
      setGroupName(existingGroup.name || '');
      setDescription(existingGroup.description || '');
      setSelectedMembers(existingGroup.members ? existingGroup.members.map(String) : []);
      setExistingImage(existingGroup.image || null);
      setRemoveExistingImage(false);
      imageDropzoneRef.current?.reset?.();
    } else {
      // Reset form when creating new group
      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      setExistingImage(null);
      setRemoveExistingImage(false);
    }
  }, [existingGroup?.id]); // Only re-run when the group ID changes, not the entire object

  // Optimized input handlers to prevent re-renders
  const handleGroupNameChange = useCallback((e) => {
    setGroupName(e.target.value);
  }, []);

  const handleTextLimit = useCallback((e) => {
    const value = e.target.value || '';
    const words = value.trim().length === 0 ? [] : value.trim().split(/\s+/);

    if (words.length <= wordLimit) {
      setDescription(value);
      if (limitNotified) setLimitNotified(false);
    } else {
      const limited = words.slice(0, wordLimit).join(' ');
      setDescription(limited);
      if (!limitNotified) {
        toast.error(`Description cannot exceed ${wordLimit} words`);
        setLimitNotified(true);
      }
    }
  }, [wordLimit, limitNotified]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      toast.error('User ID is required');
      return;
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('name', groupName);
      formData.append('description', description);
      formData.append('members', JSON.stringify(selectedMembers));

      if (!existingGroup) {
        formData.append('created_by', userId);
      }

      const imageFile = imageDropzoneRef.current?.getFile();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      if (!imageFile) {
        toast.error('Please image is required.');
        return
      }

      if (existingGroup && removeExistingImage && !imageFile) {
        formData.append('removeImage', 'true');
      }

      let response, data;
      if (existingGroup && existingGroup.id) {
        response = await fetch(`/api/group-conversation/groupId?groupId=${existingGroup.id}`, {
          method: 'PUT',
          body: formData,
        });
        data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to update group');
        }
        toast.success('Group updated successfully!');
      } else {
        response = await fetch('/api/group-conversation', {
          method: 'POST',
          body: formData,
        });
        console.log("Sending...", Object.fromEntries(formData))
        data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Failed to create group');
        }
        toast.success('Group created successfully!');
      }

      if (onSubmit) {
        onSubmit(data.data);
      }

      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      setExistingImage(null);
      setRemoveExistingImage(false);
      imageDropzoneRef.current?.reset();

      onClose();
    } catch (error) {
      console.error('Failed to save group:', error);
      toast.error(error.message || 'Failed to save group');
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
          onChange={handleGroupNameChange}
          placeholder="Enter a unique group name..."
          className="w-full"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Group Image
        </label>
        {existingImage && !removeExistingImage && (
          <div className="flex items-center gap-3">
            <div className="w-24 h-24 rounded overflow-hidden border border-neutral-200 dark:border-gray-700">
              <Image src={existingImage} alt="group" className="w-full h-full object-cover" />
            </div>
            <div>
              <Button variant="outline" onClick={() => setRemoveExistingImage(true)} className="mr-2">Remove Image</Button>
              <Button variant="ghost" onClick={() => imageDropzoneRef.current?.reset()}>Change</Button>
            </div>
          </div>
        )}

        <div className="mt-2">
          <GroupImageDropzone ref={imageDropzoneRef} />
        </div>
      </div>

      {/* <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Description
        </label>
        <Textarea
          value={description}
          onChange={handleTextLimit}
          placeholder="Describe the purpose of this group..."
          className="w-full min-h-[100px] resize-none"
          rows="3"
          required
          disabled={loading}
          aria-describedby="group-description-help"
        />
        <div className="flex items-center justify-between">
          <p id="group-description-help" className="text-xs text-neutral-500 dark:text-gray-500">
            Tell members what this group is about
          </p>
          <p className={`text-xs ${description.trim().length === 0 ? 'text-neutral-500 dark:text-gray-500' : (description.trim().split(/\s+/).length >= wordLimit ? 'text-red-500' : (description.trim().split(/\s+/).length >= Math.ceil(wordLimit * 0.9) ? 'text-yellow-500' : 'text-neutral-500 dark:text-gray-500'))}`}>
            {description.trim().length === 0 ? `0 / ${wordLimit} words` : `${description.trim().split(/\s+/).length} / ${wordLimit} words`}
          </p>
        </div>
      </div> */}

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Select Members
        </label>
        <MemberSelector
          selectedMembers={selectedMembers}
          onSelectionChange={setSelectedMembers}
        />
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
          disabled={loading || selectedMembers.length === 0}
        >
          {loading ? (existingGroup ? 'Saving...' : 'Creating...') : (existingGroup ? 'Save Changes' : 'Create Group')}
        </Button>
      </div>
    </form>
  );
};


// VillageEventForm Component
const VillageEventForm = ({ onClose, onSubmit, userId, existingEvent = null }) => {
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [content, setContent] = useState(existingEvent?.content || '');
  const [eventType, setEventType] = useState(existingEvent?.event_type || 'news');
  const [location, setLocation] = useState(existingEvent?.location || '');
  const [eventDate, setEventDate] = useState(existingEvent?.event_date ? existingEvent.event_date.split('T')[0] : '');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(existingEvent?.image_url || null);
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

      if (!title || !content) {
        throw new Error('Title and content are required');
      }

      const formData = new FormData();
      formData.append('created_by', userId);
      formData.append('title', title);
      formData.append('content', content);
      formData.append('event_type', eventType);

      if (location) formData.append('location', location);
      if (eventDate) formData.append('event_date', eventDate);

      if (image) {
        formData.append('image_url', image);
      } else if (existingEvent?.image_url && !image) {
        formData.append('image_url', existingEvent.image_url);
      }

      let response;
      if (existingEvent) {
        formData.append('id', existingEvent.id);
        response = await fetch('/api/village-events', {
          method: 'PUT',
          body: formData
        });
      } else {
        response = await fetch('/api/village-events', {
          method: 'POST',
          body: formData
        });
      }

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to save village event');
      }

      toast.success(existingEvent ? 'Event updated successfully!' : 'Event created successfully!');

      if (onSubmit) {
        onSubmit(result.event || existingEvent);
      }

      setTitle('');
      setContent('');
      setEventType('news');
      setLocation('');
      setEventDate('');
      setImage(null);
      setImagePreview(null);
      onClose();
    } catch (error) {
      console.error('Failed to save village event:', error);
      setError(error.message || 'Failed to save village event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        <label htmlFor="event-title" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="event-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter event or news title..."
          className="w-full"
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="event-type" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Type
        </label>
        <select
          id="event-type"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="w-full px-3 py-2 border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
          disabled={loading}
        >
          <option value="news">News</option>
          <option value="event">Event</option>
          <option value="announcement">Announcement</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="event-content" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Content <span className="text-red-500">*</span>
        </label>
        <Textarea
          id="event-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Share the details with the community..."
          className="w-full min-h-[120px] resize-none"
          required
          disabled={loading}
        />
      </div>

      {(eventType === 'event' || eventType === 'announcement') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="event-location" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
              Location {eventType === 'event' && <span className="text-red-500">*</span>}
            </label>
            <Input
              id="event-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Community Hall, ASYV Campus"
              className="w-full"
              required={eventType === 'event'}
              disabled={loading}
            />
          </div>

          {eventType === 'event' && (
            <div className="space-y-2">
              <label htmlFor="event-date" className="text-sm font-medium text-neutral-700 dark:text-gray-300">
                Event Date <span className="text-red-500">*</span>
              </label>
              <Input
                id="event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full"
                required={eventType === 'event'}
                disabled={loading}
              />
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-gray-300">
          Add Image (Optional)
        </label>
        <div className="border-2 border-dashed border-neutral-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-green-500 dark:hover:border-green-400 transition-colors cursor-pointer bg-neutral-50 dark:bg-gray-800/50">
          <input
            type="file"
            id="event-image"
            className="cursor-pointer"
            accept="image/*"
            onChange={handleImageChange}
            disabled={loading}
            // required
          />
          <label htmlFor="event-image" className="cursor-pointer block space-y-2">
            <p className="text-sm text-neutral-600 dark:text-gray-400">
              {image ? image.name : imagePreview ? 'Click to change image' : 'Click to upload image'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-gray-500">
              Supports: JPG, PNG, GIF, WebP
            </p>
          </label>
        </div>
        {imagePreview && (
          <div className="mt-2">
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
          {loading ? (existingEvent ? 'Updating...' : 'Publishing...') : (existingEvent ? 'Update Event' : 'Publish Event')}
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

// Change Password Form Component
const ChangePasswordForm = ({ onClose, userId }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    setError('');

    if (!currentPassword.trim()) {
      setError('Current password is required');
      return false;
    }

    if (!newPassword.trim()) {
      setError('New password is required');
      return false;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match');
      return false;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const response = await fetch('/api/changePassword/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => onClose(), 1500);
      } else {
        setError(data.error || 'Failed to change password');
        toast.error(data.error || 'Failed to change password');
      }
    } catch (err) {
      const errorMsg = err.message || 'An error occurred while changing password';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
          Current Password
        </label>
        <div className="relative">
          <input
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter your current password..."
            className="w-full px-3 md:px-2 py-2 text-base border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 pr-10"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
          New Password
        </label>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter your new password..."
            className="w-full px-3 md:px-2 py-2 text-base border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 pr-10"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {showNewPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Must be at least 8 characters
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 dark:text-gray-300 mb-2">
          Confirm New Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your new password..."
            className="w-full px-3 md:px-2 py-2 text-base border border-neutral-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-500 dark:focus:ring-green-600 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 pr-10"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>
      </div>

      <div className="flex gap-1 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 px-2 py-2 text-base border border-neutral-300 dark:border-gray-600 text-neutral-700 dark:text-gray-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-3 text-base bg-green-700 dark:bg-green-600 text-white rounded-lg hover:bg-green-800 dark:hover:bg-green-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {loading ? 'Changing...' : 'Change Password'}
        </button>
      </div>
    </form>
  );
};

// Content Card Component
const ContentCard = ({ item, onDelete, onEdit }) => {
  const [showMenu, setShowMenu] = useState(false);

  const getIcon = () => {
    switch (item.type) {
      case 'post': return MessageSquare;
      case 'article': return BookOpen;
      case 'opportunity': return BookOpen;
      case 'group': return Users;
      case 'village_event': return Newspaper;
      default: return MessageSquare;
    }
  };

  const Icon = getIcon();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-4 hover:shadow-md dark:hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {(item.type === 'group' && item.image) || (item.type === 'village_event' && item.image_url) ? (
            <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-neutral-200 dark:border-gray-700">
              <Image
                src={item.type === 'village_event' ? item.image_url : item.image}
                alt={item.title || item.name || 'Event'}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex-shrink-0">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-green-700 dark:group-hover:text-green-500 transition-colors truncate">
              {item.title || item.name || item.groupName || 'New Post'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {item.created_at ? new Date(item.created_at).toLocaleDateString() : item.date}
              {item.type === 'group' && item.members && (
                <span className="ml-2">• {Array.isArray(item.members) ? item.members.length : 0} members</span>
              )}
              {item.type === 'village_event' && item.event_type && (
                <span className="ml-2">• {item.event_type.charAt(0).toUpperCase() + item.event_type.slice(1)}</span>
              )}
              {item.type === 'village_event' && item.location && (
                <span className="ml-2">• {item.location}</span>
              )}
            </p>
          </div>
        </div>
        <div className="relative">
          <InteractiveButton
            kind="icon"
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-neutral-400 dark:text-gray-500" />
          </InteractiveButton>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-900 rounded-lg shadow-lg dark:shadow-xl border border-neutral-200 dark:border-gray-700 py-1 z-10">
              {onEdit && (
                <InteractiveButton
                  kind="icon" 
                  onClick={() => {
                    onEdit(item);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-neutral-50 dark:hover:bg-gray-800 flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </InteractiveButton>
              )}
              <InteractiveButton
                type="button"
                kind="destructive"
                onClick={() => {
                  onDelete(item.id);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </InteractiveButton>
            </div>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
        {item.content || item.description || 'No description'}
      </p>
    </div>
  );
};

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
  } else if (!session) {
  } else {
  }
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('home');
  const [countClick, setCountClick] = useState(0);
  const [activeModal, setActiveModal] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [editingVillageEvent, setEditingVillageEvent] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [villageEvents, setVillageEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCrcOrSuperuser, setIsCrcOrSuperuser] = useState(false);
  const [onlySuperuser, setOnlySuperuser] = useState(false);
  const [isAlumni, setIsAlumni] = useState(false);
  const [openingFurtherEducation, setOpeningFurtherEducation] = useState(false);
  const unreadCount = userUnreadNotificationStore((state) => state.unreadCount);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [hideChangePassword, setHideChangePassword] = useState(false);
  const [overviewGrades, setOverviewGrades] = useState([]);
  const [selectedOverviewGradeIds, setSelectedOverviewGradeIds] = useState([]);
  const [overviewStats, setOverviewStats] = useState({
    totalGraduates: 0,
    continuedEducation: 0,
    employed: 0,
    withEitherOutcome: 0,
    continuedEducationPct: 0,
    employedPct: 0,
    withEitherOutcomePct: 0,
    filteredByGrade: false,
    gradeId: null,
    degreeStats: [],
    outcomesByYear: [],
    degreeLevelDistribution: [],
    degreeLevelStudents: {},
    areasOfStudy: [],
    areasOfStudyStudents: {},
    collegesByCountry: [],
    collegesByCountryStudents: {},
    industryDistribution: [],
    industryDistributionStudents: {},
    topEmployers: [],
    topEmployersStudents: {},
    outcomesByYearStudents: {},
    allAlumniStudents: [],
  });
  const [overviewListOpen, setOverviewListOpen] = useState(false);
  const [overviewListTitle, setOverviewListTitle] = useState('');
  const [overviewListDescription, setOverviewListDescription] = useState('');
  const [isDeleteDialogueOpen, setIsDeleteDialogueOpen] = useState(false);
  const [confirm, confirmDialog] = useConfirmDialog();
   const [selectPost, setSelectedPost] = useState(null);
   const [postButtonLoading, setPostButtonLoading] = useState(false); 
  const [overviewListItems, setOverviewListItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const hasCreatedProfile = Boolean(
    currentUser?.profile_image_url ||
    currentUser?.image_url ||
    (typeof currentUser?.bio === 'string' && currentUser.bio.trim().length > 0)
  );

  // Filter items based on search query
  const filteredOverviewItems = overviewListItems.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.first_name?.toLowerCase().includes(query) ||
      item.rwandan_name?.toLowerCase().includes(query) ||
      item.email?.toLowerCase().includes(query) ||
      item.phone?.toLowerCase().includes(query) ||
      String(item.graduation_year || '').toLowerCase().includes(query) ||
      item.institution?.toLowerCase().includes(query) ||
      item.grade?.toLowerCase().includes(query) ||
      item.family?.toLowerCase().includes(query) ||
      item.title?.toLowerCase().includes(query) ||
      item.company?.toLowerCase().includes(query) ||
      item.college_name?.toLowerCase().includes(query)
    );
  });

  // Handle navigation to kid details
  const handleAlumniClick = (alumni) => {
    // Find the kid ID from alumni data - use kid_id field if available, fallback to id
    const kidId = alumni.kid_id || alumni.id;
    if (kidId) {
      router.push(`/management/kids/${kidId}`);
    } else {
      console.error("No kid_id found for alumni:", alumni);
      toast.error("Unable to navigate to student details - missing kid information");
    }
  };

  // Download functions
  const downloadDOCX = async () => {
    if (!filteredOverviewItems || filteredOverviewItems.length === 0) {
      toast.error("No data available to download");
      return;
    }
    try {
      const {
        Document,
        Packer,
        Paragraph,
        Table,
        TableCell,
        TableRow,
        TextRun,
        WidthType
      } = await import('docx');

      const fileName = `${overviewListTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`;

      const headers = [
        '#',
        'First Name',
        'Rwandan Name',
        'Email',
        'Phone',
        'Grade',
        'Family',
        'Graduation Year',
        'Institution',
        'Job Title',
        'Company',
      ];

      const headerRow = new TableRow({
        children: headers.map((header) =>
          new TableCell({
            width: { size: 10, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: header, bold: true })],
              }),
            ],
          })
        ),
      });

      const dataRows = filteredOverviewItems.map((item, index) =>
        new TableRow({
          children: [
            String(index + 1),
            item.first_name || '',
            item.rwandan_name || '',
            item.email || '',
            item.phone || '',
            item.grade || '',
            item.family || '',
            item.graduation_year || '',
            item.institution || '',
            item.title || item.position || '',
            item.company || '',
          ].map((value) =>
            new TableCell({
              width: { size: 10, type: WidthType.PERCENTAGE },
              children: [new Paragraph(String(value))],
            })
          ),
        })
      );

      const doc = new Document({
        sections: [
          {
            children: [
              new Paragraph({
                children: [new TextRun({ text: overviewListTitle || 'Alumni List', bold: true, size: 32 })],
              }),
              new Paragraph(`Generated: ${new Date().toLocaleDateString()}`),
              new Paragraph(`Total Records: ${filteredOverviewItems.length}`),
              ...(overviewListDescription ? [new Paragraph(`Description: ${overviewListDescription}`)] : []),
              new Paragraph(''),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [headerRow, ...dataRows],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success(`Downloaded ${filteredOverviewItems.length} records successfully`);
    } catch (error) {
      console.error('DOCX export failed:', error);
      toast.error('Failed to generate DOCX file');
    }
  };

  const downloadXLSX = () => {
    // 1. Prepare your data (Array of Objects)
    // The object keys will automatically become the column headers
    const data = filteredOverviewItems.map(item => ({
      'First Name': item.first_name || '',
      'Rwandan Name': item.rwandan_name || '',
      'Email': item.email || '',
      'Phone': item.phone || '',
      'Grade': item.grade || '',
      'Family': item.family || '',
      'Graduation Year': item.graduation_year || '',
      'Institution': item.institution || '',
      'Job Title': item.title || item.position || '',
      'Company': item.company || '',
    }));

    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    // 2. Convert JSON data to a worksheet
    const worksheet = utils.json_to_sheet(data);

    // 3. Create a new workbook and add the worksheet
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Alumni List");

    // 4. (Optional) Set column widths so the data isn't squashed
    // wch is the character width
    worksheet["!cols"] = [
      { wch: 15 }, // First Name
      { wch: 20 }, // Rwandan Name
      { wch: 25 }, // Email
      { wch: 18 }, // Phone
      { wch: 18 }, // Grade
      { wch: 24 }, // Family
      { wch: 18 }, // Graduation Year
      { wch: 20 }, // Institution
      { wch: 20 }, // Job Title
      { wch: 20 }  // Company
    ];

    // 5. Generate the file and trigger download
    const fileName = `${overviewListTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
    writeFile(workbook, fileName);

    toast.success(`Downloaded ${filteredOverviewItems.length} alumni as .xlsx`);
  };

  const [overviewLoading, setOverviewLoading] = useState(false);
  const [sortedDegreeData, setSortedDegreeData] = useState([]);
  const [chooseGrade, setChooseGrade] = useState(false);
  useEffect(() => {
    if (overviewStats.degreeLevelDistribution && overviewStats.degreeLevelDistribution.length > 0) {
      const sorted = [...overviewStats.degreeLevelDistribution].sort((a, b) => {
        return Number(b.count) - Number(a.count);
      });
      setSortedDegreeData(sorted);
    } else {
      setSortedDegreeData([]);
    }
  }, [overviewStats.degreeLevelDistribution]);

  const [badgeCount, setBadgeCount] = useState(0);
  const socketRef = useRef(null);
  const setUnreadCount = userUnreadNotificationStore((state) => state.setUnreadCount);

  useEffect(() => {
    try {
      const hidden = localStorage.getItem('hideChangePassword');
      if (hidden === 'true') setHideChangePassword(true);
    } catch (err) {
      // ignore
    }
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser?.id) return;
      try {
        const response = await fetch(`/api/notifications?userId=${currentUser?.id}&type=all&limit=50`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        const data = await response.json();
        console.log("notifications", data);
        if (data.success) {
          setBadgeCount(data.data.length);
          setUnreadCount(data.unreadCount || 0);
        }
      }
      catch (error) {
        console.error('Error fetching notifications:', error);
      }
    }

    fetchNotifications();

    if (currentUser?.id && !socketRef.current && typeof window !== "undefined") {
      console.log("🔌 Setting up socket connection for dashboard notifications...");
      try {
        const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin, {
          path: "/api/socketio",
          transports: ["websocket", "polling"],
        });

        socketInstance.on("connect", () => {
          console.log("✅ Dashboard socket connected successfully");
          socketInstance.emit("join_notifications", { userId: currentUser.id });
          console.log("📢 Joined notifications room for dashboard user:", currentUser.id);
        });

        socketInstance.on("new_notification", (notification) => {
          console.log("🔔 Dashboard received new notification:", notification);
          setUnreadCount((prev) => prev + 1);

          if (notification.type === 'message') {
            console.log("📢 Showing toast for message notification in dashboard:", notification.title);
            toast.success(notification.title);
          } else if (notification.type === 'group_invitation') {
            console.log("👥 Showing toast for group invitation in dashboard:", notification.title);
            toast.success(notification.title);
          }
        });

        socketInstance.on("notification_count_updated", ({ unreadCount: count }) => {
          console.log("📊 Dashboard notification count updated:", count);
          setUnreadCount(count);
        });

        socketInstance.on("disconnect", () => {
          console.log("🔌 Dashboard socket disconnected");
        });

        socketRef.current = socketInstance;
        console.log("✅ Dashboard socket setup complete");
      } catch (error) {
        console.error("❌ Error initializing dashboard socket:", error);
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [currentUser, setUnreadCount])

  const [userContent, setUserContent] = useState({
    posts: [],
    articles: [],
    groups: []
  });
  const [profile, setProfile] = useState({
    username: 'User',
    bio: 'Community member'
  });
  const menuItems = (() => {
    const items = [
      // { id: 'home', icon: Home, label: 'Dashboard' },
      { id: 'notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
      { id: 'feed', icon: LayoutList, label: 'Feed' },
      // { id: "alumni_overview", icon: BarChart3, label: "Alumni Overview" },
      { id: "management", icon: UserCog, label: "Manage Users" },
      { id: "advanced_management", icon: Users, label: "Our Students" },
      { id: "alumni_by_grade", icon: GraduationCap, label: "Alumni by grade" },
    ];

    if (isCrcOrSuperuser) {
      items.push(
        { id: 'create_post', icon: MessageSquare, label: 'Create Post' },
        { id: 'post_opportunity', icon: BookOpen, label: 'Post Opportunity' },
        { id: 'create_village_event', icon: Newspaper, label: 'Create Village Event' },
        { id: 'create_group', icon: Users, label: 'Create Group Chat' },
      );
    }

    items.push(
      { id: "create_profile", icon: UserPlus, label: "Create your profile" },
      { id: "change_password", icon: ShieldCheck, label: "Change Password" },
    );

    return items;
  })();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const fullInfo = localStorage.getItem('fullInfo');
      if (fullInfo) {
        try {
          const user = JSON.parse(fullInfo);
          setIsCrcOrSuperuser(user.is_crc === true || user.is_superuser === true);
          setOnlySuperuser(user.is_superuser === true || user.is_crc === true);
          setIsAlumni(user.is_alumni === true);
          setCurrentUser(user);
        } catch (e) {
          console.error('Error parsing user info:', e);
        }
      }
    }
  }, []);

  const { login: authLogin } = useAuth();

  useEffect(() => {
    if (session?.customToken && session?.user && session?.fullInfo) {
      const currentToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!currentToken || currentToken !== session.customToken) {
        console.log("Syncing Google session to LocalStorage...");

        authLogin(session.customToken);

        localStorage.setItem("user", JSON.stringify(session.user));
        localStorage.setItem("fullInfo", JSON.stringify(session.fullInfo));
        if (session.user.second_name) {
          localStorage.setItem("second_name", JSON.stringify(session.user.second_name));
        }

        const user = session.fullInfo;
        setCurrentUser(user);
        setIsCrcOrSuperuser(user.is_crc === true || user.is_superuser === true);
        setOnlySuperuser(user.is_superuser === true || user.is_crc === true);
        setIsAlumni(user.is_alumni === true);

        toast.success("Login synced successfully");
      }
    }
  }, [session, authLogin]);

  const fetchOverviewGrades = useCallback(async () => {
    if (!currentUser?.id || !isCrcOrSuperuser) return;
    try {
      const res = await fetch(
        `/api/manage/grades?requestingUserId=${encodeURIComponent(currentUser.id)}`,
        { headers: { 'x-user-id': String(currentUser.id) } }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setOverviewGrades(data);
      }
    } catch (e) {
      console.error('Failed to fetch overview grades:', e);
    }
  }, [currentUser, isCrcOrSuperuser]);

  const fetchOverviewStats = useCallback(async () => {
    if (!currentUser?.id || !isCrcOrSuperuser) return;
    setOverviewLoading(true);
    try {
      const params = new URLSearchParams({
        requestingUserId: String(currentUser.id),
      });
      if (selectedOverviewGradeIds.length > 0) {
        params.set('gradeIds', selectedOverviewGradeIds.join(','));
      }
      const res = await fetch(`/api/manage/alumni-overview?${params.toString()}`, {
        headers: { 'x-user-id': String(currentUser.id) },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to load overview');
      }
      const data = await res.json();
      console.log('API Response:', {
        continuedEducation: data.continuedEducation,
        employed: data.employed,
        withEitherOutcome: data.withEitherOutcome,
        continuedEducationPct: data.continuedEducationPct
      });
      setOverviewStats({
        totalGraduates: data.totalGraduates ?? 0,
        continuedEducation: data.continuedEducation ?? 0,
        employed: data.employed ?? 0,
        withEitherOutcome: data.withEitherOutcome ?? 0,
        continuedEducationPct: data.continuedEducationPct ?? 0,
        employedPct: data.employedPct ?? 0,
        withEitherOutcomePct: data.withEitherOutcomePct ?? 0,
        filteredByGrade: data.filteredByGrade ?? false,
        gradeId: data.gradeId ?? null,
        degreeStats: Array.isArray(data.degreeStats) ? data.degreeStats : [],
        outcomesByYear: Array.isArray(data.outcomesByYear) ? data.outcomesByYear : [],
        degreeLevelDistribution: Array.isArray(data.degreeLevelDistribution) ? data.degreeLevelDistribution : [],
        degreeLevelStudents: data.degreeLevelStudents || {},
        areasOfStudy: Array.isArray(data.areasOfStudy) ? data.areasOfStudy : [],
        areasOfStudyStudents: data.areasOfStudyStudents || {},
        collegesByCountry: Array.isArray(data.collegesByCountry) ? data.collegesByCountry : [],
        collegesByCountryStudents: data.collegesByCountryStudents || {},
        industryDistribution: Array.isArray(data.industryDistribution) ? data.industryDistribution : [],
        industryDistributionStudents: data.industryDistributionStudents || {},
        topEmployers: Array.isArray(data.topEmployers) ? data.topEmployers : [],
        topEmployersStudents: data.topEmployersStudents || {},
        outcomesByYearStudents: data.outcomesByYearStudents || {},
        allAlumniStudents: data.allAlumniStudents || [],
        continuedEducationStudents: data.continuedEducationStudents || [],
        employedStudents: data.employedStudents || [],
        eitherOutcomeStudents: data.eitherOutcomeStudents || [],
      });
      // console.log("overviewStats", overviewStats);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to load alumni overview');
    } finally {
      setOverviewLoading(false);
    }
  }, [currentUser, isCrcOrSuperuser, selectedOverviewGradeIds]);
  const [openStatistics, setOpenStatistics] = useState(false);
  const processedDegrees = (() => {
    const total = overviewStats?.totalGraduates || 0;
    const stats = overviewStats?.degreeStats || [];

    let major = [];
    let otherCount = 0;

    stats.forEach((row) => {
      const count = parseInt(row.count ?? 0, 10) || 0;
      const pct = total ? (count / total) * 100 : 0;

      if (pct < 1) {
        otherCount += count;
      } else {
        major.push({
          degree: row.degree,
          count
        });
      }
    });

    if (otherCount > 0) {
      major.push({
        degree: "Other degrees",
        count: otherCount
      });
    }

    return major;
  })();
  useEffect(() => {
    if (isCrcOrSuperuser && currentUser?.id) {
      fetchOverviewGrades();
    }
  }, [isCrcOrSuperuser, currentUser, fetchOverviewGrades]);

  useEffect(() => {
    if (isCrcOrSuperuser && currentUser?.id) {
      fetchOverviewStats();
    }
  }, [isCrcOrSuperuser, currentUser, fetchOverviewStats]);

  // Helper function to deduplicate alumni by ID
  const deduplicateAlumni = (alumniArray) => {
    const seen = new Set();
    return (alumniArray || []).filter(alumnus => {
      if (seen.has(alumnus.id)) {
        return false;
      }
      seen.add(alumnus.id);
      return true;
    });
  };

  const openOverviewList = (type, value = null) => {
    if (!overviewStats) return;
    let items = [];
    let title = '';
    let description = '';
console.log("Opening overview list for type:", overviewStats);
    if (type === 'education') {
      items = overviewStats.continuedEducationStudents || [];
      title = 'Alumni in Further Education';
      description = 'List of alumni who have at least one further education record within selected grades.';
    } else if (type === 'employment') {
      items = overviewStats.employedStudents || [];
      title = 'Employed Alumni';
      description = 'List of alumni who have at least one employment record within selected grades.';
    } else if (type === 'either') {
      items = overviewStats.eitherOutcomeStudents || [];
      title = 'Alumni with Recorded Outcomes';
      description = 'List of alumni who have at least one further education or employment record within selected grades.';
    } else if (type === 'all') {
      // Use the allAlumniStudents from the API response
      items = overviewStats.allAlumniStudents || [];
      title = 'All Alumni';
      description = 'Complete list of all alumni with their information.';
    } else if (type === 'degreeLevel') {
      items = deduplicateAlumni(overviewStats.degreeLevelStudents[value]);
      title = `${value} Graduates`;
      description = `List of alumni who have a ${value} degree within the selected grades.`;
    } else if (type === 'areaOfStudy') {
      items = deduplicateAlumni(overviewStats.areasOfStudyStudents[value]);
      title = `${value} Graduates`;
      description = `List of alumni who studied ${value} within the selected grades.`;
    } else if (type === 'country') {
      items = deduplicateAlumni(overviewStats.collegesByCountryStudents[value]);
      title = `Graduates in ${value}`;
      description = `List of alumni who attended colleges in ${value} within the selected grades.`;
    } else if (type === 'industry') {
      items = deduplicateAlumni(overviewStats.industryDistributionStudents[value]);
      title = `${value} Industry Graduates`;
      description = `List of alumni working in the ${value} industry within the selected grades.`;
    } else if (type === 'employer') {
      items = deduplicateAlumni(overviewStats.topEmployersStudents[value]);
      title = `Graduates at ${value}`;
      description = `List of alumni employed at ${value} within the selected grades.`;
    } else if (type === 'outcomeYear') {
      const yearData = overviewStats.outcomesByYearStudents[value];
      if (yearData) {
        items = deduplicateAlumni([
          ...yearData.employment_only || [],
          ...yearData.fe_only || [],
          ...yearData.both || [],
          ...yearData.neither || []
        ]);
      }
      title = `Class of ${value} Outcomes`;
      description = `List of all graduates from the class of ${value} with their employment and education outcomes.`;
    }

    if (!items || items.length === 0) {
      toast.error('No matching alumni found for this statistic.');
      return;
    }

    setOverviewListItems(items);
    setOverviewListTitle(title);
    setOverviewListDescription(description);
    setOverviewListOpen(true);
  };


  useEffect(() => {
    if (!currentUser?.id) return;
    const fetchAll = async () => {
      try {
        await fetchPosts();
        if (isCrcOrSuperuser) {
          await fetchOpportunities();
          await fetchVillageEvents();
        }

      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, [currentUser, isCrcOrSuperuser])

  const fetchPosts = async () => {
    if (!currentUser?.id) return;
    try {
      const response = await fetch('/api/post/owner', {
        method: "POST",
        headers: {
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
  const router = useRouter();
  const handleDeletePost = (postId) => {
    setPostToDelete(postId);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    
    try {
      const response = await fetch(`/api/post?id=${postToDelete}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        setPosts(posts.filter(post => post.id !== postToDelete));
        toast.success('Post deleted successfully');
      } else {
        throw new Error(result.error || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error(error.message || 'Failed to delete post');
    } finally {
      setPostToDelete(null);
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
      if (postData && postData.id) {
        setPosts((prev) => {
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
    try {
      if (!currentUser?.id) return;
      const response = await fetch('/api/opportunity/owner', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ owner_id: currentUser?.id }),
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch opportunities');
      }
      const payload = data.opportunities ?? data.opportunity ?? [];
      const opsArray = Array.isArray(payload) ? payload : [payload];
      setOpportunities(opsArray);
    }
    catch (err) {
      console.error('Error fetching opportunities:', err);
      toast.error('Failed to fetch opportunities');
    }
  }

  const handleOpportunitySubmit = async (opportunityData) => {
    try {
      await fetchOpportunities();
      if (editingOpportunity) {
        toast.success('Opportunity updated successfully');
        setEditingOpportunity(null);
      } else {
        toast.success('Opportunity posted successfully');
      }
    } catch (error) {
      console.error('Error handling opportunity submit:', error);
      toast.error('Failed to save opportunity');
    }
  }


  const fetchVillageEvents = async () => {
    try {
      if (!currentUser?.id) return;
      const response = await fetch(`/api/village-events?user_id=${currentUser.id}`);
      if (!response.ok) {
        // throw new Error('Failed to fetch village events');
      }

      const data = await response.json();
      if (data.success) {
        setVillageEvents(data.events || []);
      } else {
        setVillageEvents([]);
      }
    } catch (err) {
      console.error('Error fetching village events:', err);
      // toast.error('Failed to fetch village events');
      setVillageEvents([]);
    }
  }

  const handleEditVillageEvent = (event) => {
    setEditingVillageEvent(event);
    setActiveModal('village_event');
  };

  const handleDeleteVillageEvent = async (eventId) => {
    const confirmed = await confirm({
      title: 'Delete village event',
      description: 'Are you sure you want to delete this village event?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    })
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/village-events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${auth?.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete village event');
      }

      await fetchVillageEvents();
      toast.success('Village event deleted successfully');
    } catch (error) {
      console.error('Error deleting village event:', error);
      toast.error('Failed to delete village event');
    }
  };

  const handleVillageEventSubmit = async (eventData) => {
    try {
      await fetchVillageEvents();
      if (editingVillageEvent) {
        toast.success('Village event updated successfully');
        setEditingVillageEvent(null);
      } else {
        toast.success('Village event created successfully');
      }
    } catch (error) {
      console.error('Error handling village event submit:', error);
      toast.error('Failed to save village event');
    }
  };

  const handleDeleteOpportunity = async (opportunityId) => {
    const confirmed = await confirm({
      title: 'Delete opportunity',
      description: 'Are you sure you want to delete this opportunity?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    })
    if (!confirmed) {
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

  function handleNavigate(word) {
    switch (word) {
      case "feed":
        return "/feed";
      case "dashboard":
        return "/dashboard";
      case "alumni_overview":
        return "/management/alumni-overview";
      case 'management':
        return "/management";
      case "advanced_management":
        return "/management/advanced";
      case "alumni_by_grade":
        return "/management/alumni-by-grade";
      case "notifications":
        return "/notification";
      case "change_password":
        return "#";
      case "create_post":
      case "post_opportunity":
      case "create_group":
        return "#";
      default:
        return "/";
    }
  }

  const fetchGroups = async () => {
    try {
      if (!currentUser?.id) return;
      const response = await fetch(`/api/group-conversation?userId=${currentUser.id}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const myGroups = data.data.filter(group => String(group.created_by) === String(currentUser.id));
        setUserContent(prev => ({ ...prev, groups: myGroups }));
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchGroups();
    }
  }, [currentUser]);

  const handleCreateContent = async (data) => {
    const timestamp = Date.now();
    fetch('http://127.0.0.1:7242/ingest/a5c05f7c-9e65-48f3-bf13-130a70f52554', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'dashboard/page.js:759', message: 'handleCreateContent called', data: { timestamp, dataType: data.type }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D' }) }).catch(() => { });

    if (data.id && data.name) {
      await fetchGroups();
      return;
    }

    const newItem = {
      ...data,
      id: timestamp,
      date: new Date().toLocaleDateString()
    };

    if (data.type === 'post') {
      setUserContent(prev => ({ ...prev, posts: [newItem, ...prev.posts] }));
    } else if (data.type === 'article') {
      setUserContent(prev => ({ ...prev, articles: [newItem, ...prev.articles] }));
    }
  };

  const handleDeleteGroup = async (groupId) => {
    const confirmed = await confirm({
      title: 'Delete group',
      description: 'Are you sure you want to delete this group?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    })
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/group-conversation/groupId?groupId=${groupId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        await fetchGroups();
        toast.success('Group deleted successfully');
      } else {
        throw new Error(result.message || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error(error.message || 'Failed to delete group');
    }
  };

  const handleDeleteContent = (id, type) => {
    if (type === 'group') {
      handleDeleteGroup(id);
      return;
    }

    if (type === 'post') {
      setUserContent(prev => ({ ...prev, posts: prev.posts.filter(p => p.id !== id) }));
    } else if (type === 'article') {
      setUserContent(prev => ({ ...prev, articles: prev.articles.filter(a => a.id !== id) }));
    }
  };

  const handleUpdateProfile = (data) => {
    setProfile(data);
  };

  const handleLogout = async () => {
    toast.success('Logged out successfully!');

    if (typeof window !== 'undefined') {
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      localStorage.removeItem("fullInfo")
      localStorage.removeItem("second_name")
      localStorage.removeItem("theme");
    }
    await signOut({ redirect: false });

    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 pt-16 pb-24" suppressHydrationWarning>
      {confirmDialog}
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

        <nav
          className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if ((item.id === "management" || item.id === "advanced_management" || item.id === "alumni_overview" || item.id === "alumni_by_grade") && !onlySuperuser) {
              return null;
            }
            return (
              <Link
                key={item.id}
                href={handleNavigate(item.id)}>
                <framerMotion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    if (item.id === "create_profile") {
                      e.preventDefault();
                      setEditProfileOpen(true);
                      return;
                    }

                    if (item.id === 'change_password') {
                      setShowChangePassword(true);
                      setCountClick((prev) => {
                        const next = Math.min(prev + 1, 2);
                        if (next >= 2) {
                          setHideChangePassword(true);
                          try { localStorage.setItem('hideChangePassword', 'true'); } catch (err) { }
                        }
                        return next;
                      });
                      return;
                    }
                    if (item.id === 'create_post') {
                      e.preventDefault();
                      setEditingPost(null);
                      setActiveModal('post');
                      return;
                    }
                    if (item.id === 'post_opportunity') {
                      e.preventDefault();
                      setEditingOpportunity(null);
                      setActiveModal('opportunity');
                      return;
                    }
                    if (item.id === 'create_village_event') {
                      e.preventDefault();
                      setEditingVillageEvent(null);
                      setActiveModal('village_event');
                      return;
                    }
                    if (item.id === 'create_group') {
                      e.preventDefault();
                      setEditingGroup(null);
                      setActiveModal('group');
                      return;
                    }
                    setActiveTab(item.id);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:cursor-pointer rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === item.id
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
                  {item.id === "notifications" && (
                    <span className="relative flex items-center justify-center">
                      {unreadCount > 0 && (
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
                      )}
                      <span className={`relative px-2 py-0.5 text-xs font-semibold ${unreadCount > 0 ? 'bg-orange-500 text-white animate-bounce' : 'bg-orange-500 text-white'} rounded-full`}>
                        {unreadCount}
                      </span>
                    </span>
                  )}

                  {(item.id === 'create_profile' && !hasCreatedProfile) && (
                    <motion.div className="relative flex items-center">
                      <motion.div
                        className="absolute -left-1 h-8 w-8 rounded-full bg-orange-400/30 blur-md"
                        animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                      />
                      {/* <motion.div
                        className="flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-2 py-1 text-[10px] font-semibold text-white shadow-md"
                        animate={{ y: [0, -2, 0], scale: [1, 1.03, 1] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>Create yours</span>
                      </motion.div> */}
                      <motion.div
                        animate={{ x: [0, 6, 0] }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <ArrowLeft className="h-4 w-4 text-orange-500 dark:text-orange-400" />
                      </motion.div>
                    </motion.div>
                  )}

                </framerMotion.button>
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 dark:border-gray-700 space-y-1">
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
              {menuItems.map((item) => {
                if ((item.id === "management" || item.id === "advanced_management" || item.id === "alumni_overview" || item.id === "alumni_by_grade") && !onlySuperuser) {
                  return null;
                }
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                      if (item.label === "Feed") {
                        router.push('/feed');
                      } else if (item.id === "alumni_overview" || item.id === "management" || item.id === "advanced_management" || item.id === "alumni_by_grade") {
                        router.push(handleNavigate(item.id));
                      } else if (item.id === "create_post") {
                        setEditingPost(null);
                        setActiveModal('post');
                      } else if (item.id === "post_opportunity") {
                        setEditingOpportunity(null);
                        setActiveModal('opportunity');
                      } else if (item.id === "create_group") {
                        setEditingGroup(null);
                        setActiveModal('group');
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === item.id
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
                );
              })}
            </nav>
            <div className="p-3 border-t border-neutral-200 dark:border-gray-700 space-y-1">
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
      <main className="lg:ml-64 min-h-screen pt-0">
        {/* Dashboard Content */}
        <div className="p-3 sm:p-4 lg:p-8 space-y-4 sm:space-y-6 mt-4 md:mt-6">

          {/* ════════════════════════════════════════════════════════
              ALUMNI OVERVIEW — CRC / Superuser only
          ════════════════════════════════════════════════════════ */}
          {isCrcOrSuperuser && (
            <div className="space-y-6 mb-8">

              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-ney So Faemerald-600 dark:text-emerald-400" />
                    The Journey So Far
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Real-time snapshot of graduate outcomes across all cohorts
                  </p>
                </div>
                <span className="text-xs font-medium px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                  {selectedOverviewGradeIds.length === 0
                    ? "All Grades"
                    : `${selectedOverviewGradeIds.length} Grade${selectedOverviewGradeIds.length > 1 ? "s" : ""} Selected`}
                </span>
              </div>

              {/* Filter sidebar + stats layout */}
              <div>

                {/* ── Grade Filter Panel ── */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg">
                    <Filter className="h-4 w-4" />
                    Filter by Grade
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-4 pt-4 border-t border-neutral-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer select-none bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={selectedOverviewGradeIds.length === 0}
                        onChange={() => setSelectedOverviewGradeIds([])}
                      />
                      <span className="text-gray-700 dark:text-gray-300 font-medium">
                        All Grades
                      </span>
                      <button className="p-2 bg-gray-200 rounded-sm text-black font-bold" onClick={() =>
                        setTimeout(() => {
                          setChooseGrade(prev => !prev)
                        }, 100)}
                      >Choose a grade</button>
                    </label>
                  </div>
                  <AnimatePresence>
                    {chooseGrade && (

                      <framerMotion.div
                        key="open-overiewGrade"
                        initial={{ opacity: 0, x: -100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.4, ease: "backOut" }}
                        className="flex flex-wrap gap-2"
                      >
                        {overviewGrades.map((g) => {
                          const id = String(g.id);
                          const checked = selectedOverviewGradeIds.includes(id);
                          return (
                            <label
                              key={id}
                              className={`flex items-center gap-2 text-sm cursor-pointer select-none px-3 py-1.5 rounded-lg transition-colors ${checked
                                ? 'bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700'
                                : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                checked={checked}
                                onChange={(e) => {
                                  setSelectedOverviewGradeIds((prev) => {
                                    if (e.target.checked) {
                                      return [...prev, id];
                                    }
                                    return prev.filter((x) => x !== id);
                                  });
                                }}
                              />
                              <span className="text-gray-700 dark:text-gray-300">
                                {g.grade_name || `Grade ${g.id}`}
                                {g.graduation_year_to_asyv && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                    ({g.graduation_year_to_asyv})
                                  </span>
                                )}
                              </span>
                            </label>
                          );
                        })}
                      </framerMotion.div>
                    )}
                  </AnimatePresence>

                </div>

                {/* ── Stats Area ── */}
                <div className="space-y-4 min-w-0">
                  {overviewLoading ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="rounded-xl border border-neutral-200 dark:border-gray-700 p-4 animate-pulse bg-white dark:bg-gray-900">
                          <div className="h-2 w-20 rounded bg-neutral-200 dark:bg-gray-700 mb-3" />
                          <div className="h-8 w-14 rounded bg-neutral-200 dark:bg-gray-700 mb-2" />
                          <div className="h-2 w-24 rounded bg-neutral-200 dark:bg-gray-700" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      {/* KPI Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Total Graduates */}
                        <button
                          type="button"
                          onClick={() => openOverviewList('all')}
                          className="text-left bg-gray-50 dark:bg-gray-950/40 rounded-xl border border-gray-100 dark:border-gray-900/50 p-4 shadow-sm hover:border-gray-500 hover:shadow-md transition"
                        >
                          <p className="text-xs font-medium text-gray-700 dark:text-gray-400 mb-2">All Alumni</p>
                          <p className="text-3xl font-bold text-gray-800 dark:text-gray-300 tabular-nums">
                            {(overviewStats.totalGraduates ?? 0).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-900 overflow-hidden">
                              <div className="h-full bg-gray-500 transition-all duration-500" style={{ width: '100%' }} />
                            </div>
                            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-400 tabular-nums">
                              100%
                            </span>
                          </div>
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Click to view and download complete alumni list</p>
                          </div>
                        </button>

                        {/* Continued Education */}
                        <button
                          type="button"
                          onClick={() => openOverviewList('education')}
                          className="text-left bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900/50 p-4 shadow-sm hover:border-emerald-500 hover:shadow-md transition"
                        >
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-2">Further Education</p>
                          <p className="text-3xl font-bold text-emerald-800 dark:text-emerald-300 tabular-nums">
                            {(overviewStats.continuedEducation ?? 0).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="flex-1 h-1 rounded-full bg-emerald-200 dark:bg-emerald-900 overflow-hidden">
                              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${overviewStats.continuedEducationPct}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                              {overviewStats.continuedEducationPct}%
                            </span>
                          </div>
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Click to view and download complete alumni list</p>
                          </div>
                        </button>

                        {/* Employed */}
                        <button
                          type="button"
                          onClick={() => openOverviewList('employment')}
                          className="text-left bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-100 dark:border-sky-900/50 p-4 shadow-sm hover:border-sky-500 hover:shadow-md transition"
                        >
                          <p className="text-xs font-medium text-sky-700 dark:text-sky-400 mb-2">Employed</p>
                          <p className="text-3xl font-bold text-sky-800 dark:text-sky-300 tabular-nums">
                            {overviewStats.employed.toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="flex-1 h-1 rounded-full bg-sky-200 dark:bg-sky-900 overflow-hidden">
                              <div className="h-full bg-sky-500 transition-all duration-500" style={{ width: `${overviewStats.employedPct}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-sky-700 dark:text-sky-400 tabular-nums">
                              {overviewStats.employedPct}%
                            </span>
                          </div>
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Click to view and download Employed list</p>
                          </div>
                        </button>

                        {/* With Any Outcome */}
                        <button
                          type="button"
                          onClick={() => openOverviewList('either')}
                          className="text-left bg-violet-50 dark:bg-violet-950/40 rounded-xl border border-violet-100 dark:border-violet-900/50 p-4 shadow-sm hover:border-violet-500 hover:shadow-md transition"
                        >
                          <p className="text-xs font-medium text-violet-700 dark:text-violet-400 mb-2">Graduates with Emploment or Further Education</p>
                          <p className="text-3xl font-bold text-violet-800 dark:text-violet-300 tabular-nums">
                            {(overviewStats.withEitherOutcome ?? 0).toLocaleString()}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className="flex-1 h-1 rounded-full bg-violet-200 dark:bg-violet-900 overflow-hidden">
                              <div className="h-full bg-violet-500 transition-all duration-500" style={{ width: `${overviewStats.withEitherOutcomePct ?? 0}%` }} />
                            </div>
                            <span className="text-[11px] font-semibold text-violet-700 dark:text-violet-400 tabular-nums">
                              {overviewStats.withEitherOutcomePct ?? 0}%
                            </span>
                          </div>
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 dark:text-gray-400">Click to view and download</p>
                          </div>
                        </button>

                      </div>
                      {/* Employment Breakdown Bar */}
                      {/* {console.log("overviewStats", overviewStats)} */}
                      {overviewStats.totalGraduates > 0 && (() => {
                        const total = overviewStats.totalGraduates || 1;
                        const employed = overviewStats.employed || 0;
                        const continuedEd = overviewStats.continuedEducation || 0;
                        const withEither = overviewStats.withEitherOutcome || 0;
                        const noOutcome = Math.max(total - withEither, 0);
                        const both = Math.max(continuedEd + employed - withEither, 0);
                        const employedOnly = Math.max(employed - both, 0);
                        const continuedEdOnly = Math.max(continuedEd - both, 0);
                        const employedPct = Math.round((employed / total) * 100);
                        const noOutcomePct = Math.round((noOutcome / total) * 100);
                        const continuedEdPct = Math.round((continuedEd / total) * 100);
                        return (
                          <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Employment Breakdown</h3>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{total.toLocaleString()} total graduates</span>
                            </div>
                            <div className="h-5 w-full rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex gap-0.5">
                              <div className="h-full bg-emerald-500 rounded-l-full transition-all duration-700" style={{ width: `${employedPct}%` }} />
                              <div className="h-full bg-sky-400 transition-all duration-700" style={{ width: `${continuedEdPct}%` }} />
                              <div className="h-full bg-rose-400 rounded-r-full transition-all duration-700" style={{ width: `${noOutcomePct}%` }} />
                            </div>
                            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-3">
                              {[
                                { color: "bg-emerald-500", label: "Employed", count: employed, pct: employedPct },
                                { color: "bg-sky-400", label: "Further ed", count: continuedEd, pct: continuedEdPct },
                                { color: "bg-rose-400", label: "No outcome", count: noOutcome, pct: noOutcomePct },
                              ].map(({ color, label, count, pct }) => (
                                <div key={label} className="flex items-center gap-2">
                                  <span className={`h-2.5 w-2.5 rounded-sm flex-shrink-0 ${color}`} />
                                  <span className="text-xs text-gray-600 dark:text-gray-300">
                                    {label}{" "}
                                    <span className="font-semibold text-gray-800 dark:text-gray-100">{count.toLocaleString()}</span>{" "}
                                    <span className="text-gray-400">({pct}%)</span>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* 2-column grid for distribution cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Degree Level Distribution */}
                        {sortedDegreeData.length > 0 && (
                          <StatCard title="Degree Level Distribution" subtitle="Levels attained by graduates" accentColor="blue">
                            {sortedDegreeData.map((item) => {
                              const count = parseInt(item.count ?? 0, 10) || 0;
                              const pct = overviewStats.totalGraduates ? Math.round((count / overviewStats.totalGraduates) * 100) : 0;
                              return (
                                <StatRow
                                  key={item.level_label || "Unknown"}
                                  label={item.level_label || "Unknown Level"}
                                  count={count}
                                  pct={pct}
                                  barColor="bg-blue-500"
                                  onClick={() => openOverviewList('degreeLevel', item.level_label || "Unknown Level")}
                                />
                              );
                            })}
                          </StatCard>
                        )}

                        {/* Areas of Study */}
                        {overviewStats.areasOfStudy.length > 0 && (
                          <StatCard title="Areas of Study" subtitle="Top fields among graduates" accentColor="purple" scrollable>
                            {overviewStats.areasOfStudy.slice(0, 10).map((item) => {
                              const count = parseInt(item.count ?? 0, 10) || 0;
                              const pct = overviewStats.totalGraduates ? Math.round((count / overviewStats.totalGraduates) * 100) : 0;
                              return (
                                <StatRow
                                  key={item.degree || "Unknown"}
                                  label={item.degree || "Unknown Field"}
                                  count={count}
                                  pct={pct}
                                  barColor="bg-purple-500"
                                  onClick={() => openOverviewList('areaOfStudy', item.degree || "Unknown Field")}
                                />
                              );
                            })}
                          </StatCard>
                        )}

                        {/* Colleges by Country */}
                        {overviewStats.collegesByCountry.length > 0 && (
                          <StatCard title="Colleges by Country" subtitle="Where graduates study abroad" accentColor="indigo" scrollable>
                            {overviewStats.collegesByCountry.map((item) => {
                              const count = parseInt(item.count ?? 0, 10) || 0;
                              const pct = overviewStats.totalGraduates ? Math.round((count / overviewStats.totalGraduates) * 100) : 0;
                              return (
                                <StatRow
                                  key={item.country || "Unknown"}
                                  label={item.country || "Unknown Country"}
                                  count={count}
                                  pct={pct}
                                  barColor="bg-indigo-500"
                                  onClick={() => openOverviewList('country', item.country || "Unknown Country")}
                                />
                              );
                            })}
                          </StatCard>
                        )}

                        {/* Industry Distribution */}
                        {overviewStats.industryDistribution.length > 0 && (
                          <StatCard title="Industry Distribution" subtitle="Sectors where graduates work" accentColor="amber" scrollable>
                            {overviewStats.industryDistribution.slice(0, 10).map((item) => {
                              const count = parseInt(item.count ?? 0, 10) || 0;
                              const pct = overviewStats.totalGraduates ? Math.round((count / overviewStats.totalGraduates) * 100) : 0;
                              return (
                                <StatRow
                                  key={item.industry || "Not specified"}
                                  label={item.industry || "Not specified"}
                                  count={count}
                                  pct={pct}
                                  barColor="bg-amber-500"
                                  onClick={() => openOverviewList('industry', item.industry || "Not specified")}
                                />
                              );
                            })}
                          </StatCard>
                        )}
                      </div>

                      {/* Top Employers — full width */}
                      {overviewStats.topEmployers.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Top Employers</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Companies hiring the most graduates</p>
                            </div>
                            <span className="text-xs text-gray-400 dark:text-gray-500">{overviewStats.topEmployers.length} companies</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {overviewStats.topEmployers.map((item, index) => {
                              const count = parseInt(item.count ?? 0, 10) || 0;
                              const company = item.company || "Not specified";
                              const medals = ["🥇", "🥈", "🥉"];
                              return (
                                <button
                                  key={company}
                                  onClick={() => openOverviewList('employer', company)}
                                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer ${index < 3
                                    ? "border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20"
                                    : "border-neutral-100 dark:border-gray-800 bg-neutral-50/50 dark:bg-gray-800/30"
                                    }`}
                                >
                                  <span className="text-base w-6 text-center flex-shrink-0">
                                    {index < 3 ? medals[index] : <span className="text-xs font-bold text-gray-400 dark:text-gray-500">{index + 1}</span>}
                                  </span>
                                  <span className="flex-1 text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{company}</span>
                                  <span className="flex-shrink-0 text-xs font-bold tabular-nums text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-gray-700">
                                    {count.toLocaleString()}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Further Education collapsible */}
                      <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpeningFurtherEducation(!openingFurtherEducation)}
                          className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Further Education by Degree</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Breakdown of degree types pursued</p>
                            </div>
                          </div>
                          <ChevronRight
                            className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform duration-200 flex-shrink-0 ${openingFurtherEducation ? "rotate-90" : ""}`}
                          />
                        </button>
                        <AnimatePresence>
                          {openingFurtherEducation && (
                            <framerMotion.div
                              key="further-ed-content"
                              initial={{ opacity: 0, x: -100 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -100 }}
                              transition={{ duration: 0.5, ease: "backOut" }}
                              className="border-t border-neutral-100 dark:border-gray-800 p-5"
                            >
                              {/* <div > */}
                              {!overviewStats.degreeStats?.length ? (
                                <p className="text-xs text-gray-500 dark:text-gray-400 py-2">
                                  No further education records for the selected scope yet.
                                </p>
                              ) : (
                                <div className="space-y-2.5">
                                  {processedDegrees.map((row) => {
                                    const count = row.count;
                                    const pct = overviewStats.totalGraduates
                                      ? Math.round((count / overviewStats.totalGraduates) * 100)
                                      : 0;

                                    return (
                                      <StatRow
                                        key={row.degree || "Unspecified"}
                                        label={row.degree || "Unspecified degree"}
                                        count={count}
                                        pct={pct}
                                        barColor="bg-emerald-500"
                                      />
                                    );
                                  })}
                                </div>
                              )}
                              {/* </div> */}
                            </framerMotion.div>
                          )} </AnimatePresence>
                      </div>

                      {/* Outcomes by Year */}

                      {overviewStats.outcomesByYear.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 p-5 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Outcomes by Graduation Year</h3>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Cohort-by-cohort employment & education outcomes</p>
                            </div>

                            <framerMotion.button
                              whileHover={{ scale: 1.02 }} // Slightly grows when hovered
                              whileTap={{ scale: 0.95 }}   // Slightly shrinks when clicked (feels like a real button)
                              onClick={() => setOpenStatistics(prev => !prev)}
                              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg 
             transition-colors shadow-sm active:shadow-inner w-full sm:w-auto"
                            >
                              {openStatistics ? "Close Statistics" : "Open Statistics"}
                            </framerMotion.button>

                          </div>
                          <AnimatePresence>
                            {openStatistics && (

                              <framerMotion.div
                                key="statistics-content"
                                initial={{ opacity: 0, x: -100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.5, ease: "backOut" }}
                                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                {overviewStats.outcomesByYear.map((yearData) => {
                                  const total = parseInt(yearData.total ?? 0, 10) || 1;
                                  const employed = parseInt(yearData.employment_only ?? 0, 10) || 0;
                                  const feOnly = parseInt(yearData.fe_only ?? 0, 10) || 0;
                                  const both = parseInt(yearData.both ?? 0, 10) || 0;
                                  const neither = parseInt(yearData.neither ?? 0, 10) || 0;
                                  const gradYear = yearData.grad_year || "Unknown";
                                  const employedTotal = employed + both;
                                  const feTotal = feOnly + both;
                                  const employedPct = Math.round((employedTotal / total) * 100);
                                  const fePct = Math.round((feTotal / total) * 100);
                                  const bothPct = Math.round((both / total) * 100);
                                  const neitherPct = Math.round((neither / total) * 100);

                                  return (
                                    <button
                                      key={gradYear}
                                      onClick={() => openOverviewList('outcomeYear', gradYear)}
                                      className="rounded-xl border border-neutral-200 dark:border-gray-700 bg-neutral-50/50 dark:bg-gray-800/30 p-4 space-y-3 text-left hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors cursor-pointer"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Class of {gradYear}</span>
                                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-gray-700 tabular-nums">
                                          {total.toLocaleString()}
                                        </span>
                                      </div>

                                      {/* Stacked bar */}
                                      <div className="h-3 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden flex gap-0.5">
                                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${employedPct}%` }} />
                                        <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${Math.max(0, fePct - employedPct)}%` }} />
                                        <div className="h-full bg-rose-400 transition-all duration-500" style={{ width: `${neitherPct}%` }} />
                                      </div>

                                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                        {[
                                          { dot: "bg-emerald-500", label: "Employed", val: `${employedTotal} (${employedPct}%)` },
                                          { dot: "bg-blue-400", label: "Education", val: `${feTotal} (${fePct}%)` },
                                          { dot: "bg-emerald-200", label: "Both", val: `${both} (${bothPct}%)` },
                                          { dot: "bg-rose-400", label: "Neither", val: `${neither} (${neitherPct}%)` },
                                        ].map(({ dot, label, val }) => (
                                          <div key={label} className="flex items-center gap-1.5">
                                            <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dot}`} />
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400">{label}:</span>
                                            <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-200 tabular-nums">{val}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </button>
                                  );
                                })}

                              </framerMotion.div>
                            )}
                          </AnimatePresence>

                        </div>
                      )}

                    </>
                  )}
                </div>
              </div>
            </div>
          )}
          {!isCrcOrSuperuser && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <framerMotion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
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
              </framerMotion.button>
              {/* <framerMotion.div
  initial={{ opacity: 0, y: 50 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: false, amount: 0.5 }} 
  transition={{ duration: 0.5 }}
>
  I appear only when you scroll to me!
</framerMotion.div> */}
              {isCrcOrSuperuser && (
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
              {isAlumni && (
                <Link href="/alumni/forms">
                  <button
                    className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border-2 border-dashed border-neutral-200 dark:border-gray-700 hover:border-orange-500 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300 group w-full"
                  >
                    <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-200 text-orange-500 dark:text-orange-400 group-hover:bg-orange-400 dark:group-hover:bg-orange-600 group-hover:text-white transition-all duration-300 flex-shrink-0">
                      <UserCircle className="w-5 h-5" />
                    </div>
                    <div className="text-center sm:text-left">
                      <p className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 group-hover:text-orange-700 dark:group-hover:text-green-500">Alumni Profile Forms</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">Update your profile, education & employment</p>
                    </div>
                  </button>
                </Link>
              )}
            </div>
          )}

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
                      key={post.id}
                      item={{ ...post, type: 'post' }}
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
            {editProfileOpen && (
              <DialogDemo open={editProfileOpen} setOpen={setEditProfileOpen} />
            )}

            <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
                  {isCrcOrSuperuser ? `Shared Opportunities (${opportunities.length})` : `My Articles (${userContent.articles.length})`}
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

            {/* My Village Events */}
            {isCrcOrSuperuser && (
              <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Newspaper className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    Events I shared ({villageEvents.length})
                  </h3>
                  <button
                    onClick={() => {
                      setEditingVillageEvent(null);
                      setActiveModal('village_event');
                    }}
                    className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">New Event</span>
                    <span className="sm:hidden">New</span>
                  </button>
                </div>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Loading village events...</p>
                  </div>
                ) : villageEvents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {villageEvents.map((event) => (
                      <ContentCard
                        key={event.id}
                        item={{
                          ...event,
                          type: 'village_event',
                          title: event.title,
                          content: event.content,
                          event_type: event.event_type,
                          location: event.location,
                          event_date: event.event_date,
                          image_url: event.image_url
                        }}
                        onDelete={handleDeleteVillageEvent}
                        onEdit={handleEditVillageEvent}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 text-gray-500 dark:text-gray-400">
                    <Newspaper className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No village events yet. Create your first event!</p>
                  </div>
                )}
              </div>
            )}

            {/* My Groups */}
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-neutral-200 dark:border-gray-700 p-3 sm:p-4 md:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex-1">
                  <div className="flex items-center  mb-3">
                    {userContent.groups.length > 0 ? (
                      <div className="flex -space-x-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-200 mr-4">
                          Created Groups ({userContent.groups.length})
                        </h3>
                        {userContent.groups.slice(0, 3).map((group, index) => (
                          <div key={group.id} className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white dark:border-gray-900 overflow-hidden bg-gray-100 dark:bg-gray-800">
                            {group.image ? (
                              <Image
                                src={group.image}
                                alt={group.name || 'Group'}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                                <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </div>
                            )}
                          </div>
                        ))}
                        {userContent.groups.length > 3 && (
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white dark:border-gray-900 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">+{userContent.groups.length - 3}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                    )}
                  </div>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const term = groupSearchTerm.trim();
                    if (!term) return;
                    const found = userContent.groups.find(g => g.name && g.name.toLowerCase() === term.toLowerCase()) || userContent.groups.find(g => g.name && g.name.toLowerCase().includes(term.toLowerCase()));
                    if (found) {
                      setEditingGroup(found);
                      setActiveModal('group');
                      setGroupSearchTerm('');
                    } else {
                      setEditingGroup({ name: term, members: [String(currentUser?.id)], description: '' });
                      setActiveModal('group');
                      setGroupSearchTerm('');
                      toast.error('Group not found — creating a new group.');
                    }
                  }} className="mt-2 max-w-md">
                    <div className="relative">
                      <input
                        type="text"
                        value={groupSearchTerm}
                        onChange={(e) => setGroupSearchTerm(e.target.value)}
                        placeholder="Search groups by name or create new..."
                        className="w-full pl-3 pr-12 py-2 border border-neutral-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm"
                      />
                      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-600 text-white px-3 py-1 rounded text-xs">Search</button>
                    </div>
                  </form>
                </div>

                <button
                  onClick={() => { setEditingGroup(null); setActiveModal('group'); }}
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
                    <ContentCard key={group.id} item={group} onDelete={(id) => handleDeleteContent(id, 'group')} onEdit={(g) => { setEditingGroup(g); setActiveModal('group'); }} />
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
        <>
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

          <AnimatedModal
            isOpen={activeModal === 'village_event'}
            onClose={() => {
              setActiveModal(null);
              setEditingVillageEvent(null);
            }}
            title={editingVillageEvent ? "Edit Village Event" : "Create Village Event"}
          >
            <VillageEventForm
              onClose={() => {
                setActiveModal(null);
                setEditingVillageEvent(null);
              }}
              onSubmit={handleVillageEventSubmit}
              userId={currentUser?.id}
              existingEvent={editingVillageEvent}
            />
          </AnimatedModal>
        </>
      )
        :
        (
          <AnimatedModal
            isOpen={activeModal === 'article'}
            onClose={() => setActiveModal(null)}
            title="Write New Article"
          >
            <ArticleForm onClose={() => setActiveModal(null)} onSubmit={handleCreateContent} />
          </AnimatedModal>
        )
      }

      <AnimatedModal
        isOpen={activeModal === 'group'}
        onClose={() => { setActiveModal(null); setEditingGroup(null); }}
        title={editingGroup ? "Edit Chat Group" : "Create Chat Group"}
      >
        <ChatGroupForm
          onClose={() => { setActiveModal(null); setEditingGroup(null); }}
          onSubmit={handleCreateContent}
          userId={currentUser?.id}
          existingGroup={editingGroup}
        />
      </AnimatedModal>

      <AnimatedModal
        isOpen={overviewListOpen}
        onClose={() => {
          setOverviewListOpen(false);
          setSearchQuery(''); // Clear search when closing
        }}
        title={overviewListTitle || "Alumni"}
      >
        <div className="space-y-3">
          {overviewListDescription && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {overviewListDescription}
            </p>
          )}
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, phone, grade, family, institution, title, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Download Button */}
          {filteredOverviewItems && filteredOverviewItems.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredOverviewItems.length} alumni found
              </span>
              <div className="relative group">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  Download
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <button
                    onClick={downloadDOCX}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-t-lg"
                  >
                    📝 Download as DOC (Word)
                  </button>
                  <button
                    onClick={downloadXLSX}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-b-lg"
                  >
                    📈 Download as XLS (Excel)
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {(!filteredOverviewItems || filteredOverviewItems.length === 0) ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No alumni found matching your search.' : 'No alumni found for this statistic.'}
              </p>
            ) : (
              filteredOverviewItems.map((alumn) => (
                <div
                  key={alumn.id}
                  className="flex items-start justify-between rounded-lg border border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {alumn.first_name} {alumn.rwandan_name || ''}
                      </p>
                      {alumn.graduation_year && (
                        <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                          Class of {alumn.graduation_year}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 mb-2">
                      {alumn.email && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          📧 {alumn.email}
                        </p>
                      )}
                      {alumn.phone && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          📱 {alumn.phone}
                        </p>
                      )}
                      {alumn.grade && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          📚 Grade: {alumn.grade}
                        </p>
                      )}
                      {alumn.family && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          👨‍👩‍👧 Family: {alumn.family}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {alumn.institution && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                          🎓 {alumn.institution}
                        </span>
                      )}
                      {alumn.company && (
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded-full">
                          💼 {alumn.company}
                        </span>
                      )}
                      {(alumn.title || alumn.position) && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-full">
                          {alumn.title || alumn.position}
                        </span>
                      )}
                      {alumn.college_name && (
                        <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full">
                          🏛️ {alumn.college_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </AnimatedModal>

      <AnimatedModal
        isOpen={activeModal === 'profile'}
        onClose={() => setActiveModal(null)}
        title="Edit Profile"
      >
        <ProfileForm onClose={() => setActiveModal(null)} onSubmit={handleUpdateProfile} currentProfile={profile} />
      </AnimatedModal>

      {/* Change Password Slide Panel */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-full top-25 sm:w-96 bg-white dark:bg-gray-900 max-h-[80vh] rounded-md shadow-2xl transition-transform duration-300 ease-out overflow-y-auto ${(showChangePassword) ? 'translate-x-150' : '-translate-x-full'
          }`}
      >
        <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <KeyRound className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-gray-100">Change Password</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Update your account security</p>
            </div>
          </div>
          <button
            onClick={() => setShowChangePassword(false)}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <ChangePasswordForm
            onClose={() => setShowChangePassword(false)}
            userId={currentUser?.id}
          />
        </div>
      </div>

      {/* Backdrop for slide panel */}
      {showChangePassword && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowChangePassword(false)}
        />
      )}

      <Dialog open={!!postToDelete} onOpenChange={(open) => !open && setPostToDelete(null)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 border-neutral-200 dark:border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-neutral-900 dark:text-gray-100 flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              Delete Post
            </DialogTitle>
            <DialogDescription className="text-neutral-600 dark:text-gray-400">
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => setPostToDelete(null)}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeletePost}
              className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}





