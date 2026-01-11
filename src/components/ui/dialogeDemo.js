'use client'

import { useState,useEffect } from "react"
import toast from 'react-hot-toast'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { X, Upload, Link, Plus } from "lucide-react"

// Predefined options
const INTEREST_OPTIONS = [
  "Technology", "Design", "Marketing", "Finance", "Healthcare", 
  "Education", "Sports", "Music", "Art", "Travel", "Cooking",
  "Photography", "Gaming", "Fitness", "Reading", "Writing"
]

const SKILL_OPTIONS = [
  "JavaScript", "React", "Next.js", "Node.js", "Python",
  "UI/UX Design", "Project Management", "Data Analysis",
  "Digital Marketing", "Content Writing", "SEO", "Graphic Design"
]

export function DialogDemo({ open, setOpen }) {
  const [currentUser, setCurrentUsers] = useState(null);
  const [existingProfile, setExistingProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    setCurrentUsers(JSON.parse(localStorage.getItem("user")));
  }, [])
  let fullInfo;
  useEffect(() => {
    const stored = localStorage.getItem("fullInfo");
    if(stored){
      fullInfo = JSON.parse(stored);
    }
  }, []);

  
  
  const [formData, setFormData] = useState({
    fullName: fullInfo?.rwandan_name || "",
    username: currentUser?.email?.split('@')[0] || "",
    email: currentUser?.email || "",
    bio: "",
    location: "",
    phone: "",
    interests: [],
    skills: [],
    socialMedia: {
      twitter: "",
      linkedin: "",
      github: "",
      instagram: ""
    }
  })
  
  const [selectedInterests, setSelectedInterests] = useState([])
  const [selectedSkills, setSelectedSkills] = useState([])
  useEffect(()=>{
     const getProfiles = async ()=>{
      const res = await fetch('/api/users');
      const data = await res.json()
const userProfile = data.users.find(user => user.created_by === currentUser?.id);
if (userProfile) {
  setFormData({
    fullName: userProfile.full_name || fullInfo?.rwandan_name || "",
    username: userProfile.username || currentUser?.email?.split('@')[0] || "",
    email: userProfile.email || currentUser?.email || "",
    bio: userProfile.bio || "",
    location: userProfile.location || "",
    phone: userProfile.phone || "",
    interests: Array.isArray(userProfile.interests) 
                 ? userProfile.interests 
                 : (typeof userProfile.interests === 'string' 
                    ? JSON.parse(userProfile.interests) 
                    : []),
    skills: Array.isArray(userProfile.skills) 
               ? userProfile.skills 
               : (typeof userProfile.skills === 'string' 
                  ? JSON.parse(userProfile.skills) 
                  : []),
    socialMedia: (typeof userProfile.social_media === 'string' 
                    ? JSON.parse(userProfile.social_media) 
                    : userProfile.social_media) 
                  || {
                    twitter: "",
                    linkedin: "",
                    github: "",
                    instagram: ""
                  },
    profileImagePreview: userProfile.profile_image || userProfile.profile_image_url || null,
    createdBy: userProfile.created_by || null
  });
} else {
  console.log("No profile found for current user.");
}
     }
     getProfiles();
  },[currentUser])
  useEffect(() => {
    const fetchExistingProfile = async () => {
      if (!open || !currentUser?.id) return;
      
      setIsLoading(true);
      try {
        const response = await fetch("/api/users");
        const data = await response.json();

        if (data.users && Array.isArray(data.users)) {
          // Find profile by created_by matching currentUser.id
          const userProfile = data.users.find(
            (profile) => profile.created_by === currentUser.id || profile.email === currentUser.email
          );

          if (userProfile) {
            setExistingProfile(userProfile);
            
            // Pre-populate form with existing profile data
            setFormData({
              fullName: userProfile.full_name || fullInfo?.rwandan_name || "",
              username: userProfile.username || currentUser?.email?.split('@')[0] || "",
              email: userProfile.email || currentUser?.email || "",
              bio: userProfile.bio || "",
              location: userProfile.location || "",
              phone: userProfile.phone || "",
              interests: Array.isArray(userProfile.interests) ? userProfile.interests : (typeof userProfile.interests === 'string' ? JSON.parse(userProfile.interests) : []),
              skills: Array.isArray(userProfile.skills) ? userProfile.skills : (typeof userProfile.skills === 'string' ? JSON.parse(userProfile.skills) : []),
              socialMedia: (typeof userProfile.social_media === 'string' ? JSON.parse(userProfile.social_media) : userProfile.social_media) || {
                twitter: "",
                linkedin: "",
                github: "",
                instagram: ""
              },
              profileImagePreview: userProfile.profile_image || userProfile.profile_image_url || null
            });

            // Pre-populate selected interests and skills
            setSelectedInterests(Array.isArray(userProfile.interests) ? userProfile.interests : (typeof userProfile.interests === 'string' ? JSON.parse(userProfile.interests) : []));
            setSelectedSkills(Array.isArray(userProfile.skills) ? userProfile.skills : (typeof userProfile.skills === 'string' ? JSON.parse(userProfile.skills) : []));
          }
        }
      } catch (err) {
        console.error("Error fetching existing profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingProfile();
  }, [open, currentUser?.id]);
  const [profileImage, setProfileImage] = useState(null)
  const [newInterest, setNewInterest] = useState("")
  const [newSkill, setNewSkill] = useState("")
  const [newSocialPlatform, setNewSocialPlatform] = useState("")
  const [newSocialUrl, setNewSocialUrl] = useState("")

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name.includes('.')) {
      const [parent, child] = name.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Store the File object itself for FormData
      setProfileImage(file)
      
      // Also create a preview URL for display
      const reader = new FileReader()
      reader.onloadend = () => {
        // Store preview separately if needed
        setFormData(prev => ({
          ...prev,
          profileImagePreview: reader.result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddInterest = () => {
    if (newInterest.trim() && !selectedInterests.includes(newInterest.trim())) {
      setSelectedInterests([...selectedInterests, newInterest.trim()])
      setNewInterest("")
    }
  }

  const handleRemoveInterest = (interest) => {
    setSelectedInterests(selectedInterests.filter(i => i !== interest))
  }

  const handleAddSkill = () => {
    if (newSkill.trim() && !selectedSkills.includes(newSkill.trim())) {
      setSelectedSkills([...selectedSkills, newSkill.trim()])
      setNewSkill("")
    }
  }

  const handleRemoveSkill = (skill) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill))
  }

  const handleAddSocialMedia = () => {
    if (newSocialPlatform.trim() && newSocialUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [newSocialPlatform.toLowerCase()]: newSocialUrl.trim()
        }
      }))
      setNewSocialPlatform("")
      setNewSocialUrl("")
    }
  }

  const handleRemoveSocialMedia = (platform) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: ""
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const form = new FormData();
      form.append('fullName', formData.fullName);
      form.append('username', formData.username);
      form.append('email', formData.email);
      form.append('bio', formData.bio);
      form.append('location', formData.location);
      form.append('phone', formData.phone);
      form.append('interests', JSON.stringify(selectedInterests));
      form.append('skills', JSON.stringify(selectedSkills));
      form.append("created_by", currentUser?.id)
      form.append('socialMedia', JSON.stringify(formData.socialMedia));
      
      if(profileImage && typeof profileImage !== 'string') {
        form.append('profileImage', profileImage);
      }

      console.log("Form submitted with data and image");

      const response = await fetch("/api/users", {
        method: "POST",
        body: form
      })

      const result = await response.json()

      if(result.error) {
        toast.error(result.error || "Failed to update profile", { duration: 4000 })
        return
      }
      
      // Update localStorage with the returned profile data
      if(result.profile) {
        const updatedUser = {
          ...currentUser,
          profile_image_url: result.profile.profile_image_url
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      
      toast.success(result.message || "Profile updated successfully!", { duration: 3000 })
      setOpen(false)
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("An error occurred while updating profile", { duration: 4000 })
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-orange-500">Edit Your Profile</DialogTitle>
          <DialogDescription>
            Update your personal information, skills, and social links
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Image Upload */}
          <div className="flex flex-col items-center gap-4 p-4 border rounded-lg">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                {formData.profileImagePreview ? (
                  <AvatarImage src={formData.profileImagePreview} alt="Profile" />
                ) : existingProfile?.profile_image_url ? (
                  <AvatarImage src={existingProfile.profile_image_url} alt="Profile" />
                ) : (
                  <AvatarFallback className="text-4xl">
                    {formData.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <Label 
                htmlFor="profile-image" 
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Upload className="h-4 w-4 text-orange-500" />
              </Label>
              <Input 
                id="profile-image" 
                name="image"
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Click the upload icon to change your profile picture
            </p>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="John Doe"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username </Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="johndoe"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+250 782 123-567"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="City, Country"
              required
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              rows={3}
              className="resize-none"
              required
            />
            <p className="text-xs text-muted-foreground">
              Brief description about yourself. Max 200 characters.
            </p>
          </div>

          <Separator />

          {/* Interests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Interests</Label>
              <div className="flex gap-2">
                <Select onValueChange={(value) => {
                  if (!selectedInterests.includes(value)) {
                    setSelectedInterests([...selectedInterests, value])
                  }
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select interest" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTEREST_OPTIONS.map((interest) => (
                      <SelectItem key={interest} value={interest}>
                        {interest}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                placeholder="Add custom interest"
                className="flex-1"
                required
              />
              <Button type="button" onClick={handleAddInterest} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedInterests.map((interest) => (
                <Badge key={interest} variant="secondary" className="gap-1 pl-3">
                  {interest}
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Skills</Label>
              <div className="flex gap-2">
                <Select onValueChange={(value) => {
                  if (!selectedSkills.includes(value)) {
                    setSelectedSkills([...selectedSkills, value])
                  }
                }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select skill" />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_OPTIONS.map((skill) => (
                      <SelectItem key={skill} value={skill}>
                        {skill}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add custom skill"
                className="flex-1"
                required    
              />
              <Button type="button" onClick={handleAddSkill} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <Badge key={skill} variant="default" className="gap-1 pl-3">
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 hover:text-primary-foreground/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Social Media Links */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Social Media Links</Label>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link className="h-4 w-4" />
                <span>Connect your profiles</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData.socialMedia).map(([platform, url]) => (
                url && (
                  <div key={platform} className="flex items-center gap-2 p-2 border rounded">
                    <span className="font-medium capitalize">{platform}</span>
                    <span className="text-sm text-muted-foreground truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSocialMedia(platform)}
                      className="ml-auto text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )
              ))}
            </div>
            
            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="social-platform">Platform</Label>
                <Input
                  id="social-platform"
                  value={newSocialPlatform}
                  onChange={(e) => setNewSocialPlatform(e.target.value)}
                  placeholder="e.g., Twitter, LinkedIn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="social-url">Profile URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="social-url"
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddSocialMedia} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div> */}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter</Label>
                <Input
                  id="twitter"
                  name="socialMedia.twitter"
                  value={formData.socialMedia.twitter}
                  onChange={handleInputChange}
                  placeholder="https://twitter.com/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  name="socialMedia.linkedin"
                  value={formData.socialMedia.linkedin}
                  onChange={handleInputChange}
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  name="socialMedia.github"
                  value={formData.socialMedia.github}
                  onChange={handleInputChange}
                  placeholder="https://github.com/username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  id="instagram"
                  name="socialMedia.instagram"
                  value={formData.socialMedia.instagram}
                  onChange={handleInputChange}
                  placeholder="https://instagram.com/username"
                />
              </div>
            </div>
          </div>

          <Separator />

          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="w-full sm:w-auto">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              type="submit" 
              className="w-full sm:w-auto bg-green-800 hover:bg-green-700 transition-colors"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default DialogDemo