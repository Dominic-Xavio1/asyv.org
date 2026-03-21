'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, User, Search, UserPlus, ChevronDown } from 'lucide-react';
import { KidsTable } from '@/components/kids-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import toast from 'react-hot-toast';

export default function AdvancedManagementPage() {
  const router = useRouter();
  const [requestingUserId, setRequestingUserId] = useState(null);
  const [isSuperuser, setIsSuperuser] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [familySearch, setFamilySearch] = useState('');
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [studentForm, setStudentForm] = useState({
    origin_district: '',
    origin_sector: '',
    current_district_or_city: '',
    current_country: '',
    health_issue: '',
    marital_status: '',
    life_status: '',
    has_children: '',
    points_in_national_exam: '',
    maximum_points_in_national_exam: '',
    mention: '',
    user_id: '',
    family_id: '',
    graduation_status: '',
  });
  const [newUserForm, setNewUserForm] = useState({
    first_name: '',
    rwandan_name: '',
    email: '',
    is_superuser: false,
    is_crc: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fullInfo = localStorage.getItem('fullInfo');
    if (!fullInfo) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(fullInfo);
      if (!user.is_superuser && !user.is_crc) {
        router.push('/dashboard');
        return;
      }
      setIsSuperuser(user.is_superuser);
      setRequestingUserId(String(user.id));
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  // Fetch users and families for dropdowns
  useEffect(() => {
    if (!requestingUserId) return;
    
    const fetchData = async () => {
      try {
        const [usersRes, familiesRes] = await Promise.all([
          fetch(`/api/manage/users?search=${encodeURIComponent(userSearch)}&requestingUserId=${requestingUserId}`, {
            headers: { 'x-user-id': requestingUserId }
          }),
          fetch(`/api/manage/families?requestingUserId=${requestingUserId}`, {
            headers: { 'x-user-id': requestingUserId }
          })
        ]);
        
        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setUsers(Array.isArray(usersData) ? usersData : []);
        }
        
        if (familiesRes.ok) {
          const familiesData = await familiesRes.json();
          setFamilies(Array.isArray(familiesData) ? familiesData : []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(error.message)
      }
    };
    
    fetchData();
  }, [requestingUserId, userSearch]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreatingUser(true);
    
    try {
      const payload = {
        ...newUserForm,
        requestingUserId,
      };

      const response = await fetch('/api/manage/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      toast.success('User created successfully!');
      setNewUserForm({
        first_name: '',
        rwandan_name: '',
        email: '',
        is_superuser: false,
        is_crc: false,
      });
      setShowCreateUser(false);
      
      // Refresh users list
      const usersRes = await fetch(`/api/manage/users?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId }
      });
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSubmitStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const payload = {
        ...studentForm,
        requestingUserId,
        // Convert empty strings to null for database
        origin_district: studentForm.origin_district || null,
        origin_sector: studentForm.origin_sector || null,
        current_district_or_city: studentForm.current_district_or_city || null,
        current_country: studentForm.current_country || null,
        health_issue: studentForm.health_issue || null,
        marital_status: studentForm.marital_status || null,
        life_status: studentForm.life_status || null,
        has_children: studentForm.has_children ? studentForm.has_children : null,
        points_in_national_exam: studentForm.points_in_national_exam ? Number(studentForm.points_in_national_exam) : null,
        maximum_points_in_national_exam: studentForm.maximum_points_in_national_exam ? Number(studentForm.maximum_points_in_national_exam) : null,
        mention: studentForm.mention || null,
        user_id: studentForm.user_id ? Number(studentForm.user_id) : null,
        family_id: studentForm.family_id ? Number(studentForm.family_id) : null,
        graduation_status: studentForm.graduation_status || null,
      };

      const response = await fetch('/api/manage/kids', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add student');
      }

      toast.success('Student added successfully!');
      setAddStudentOpen(false);
      setStudentForm({
        origin_district: '',
        origin_sector: '',
        current_district_or_city: '',
        current_country: '',
        health_issue: '',
        marital_status: '',
        life_status: '',
        has_children: '',
        points_in_national_exam: '',
        maximum_points_in_national_exam: '',
        mention: '',
        user_id: '',
        family_id: '',
        graduation_status: '',
      });
      
      // Refresh the kids table
      window.location.reload();
    } catch (error) {
      console.error('Error adding student:', error);
      toast.error(error.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  if (requestingUserId === null || !isSuperuser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 pt-20 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <Button 
            onClick={() => setAddStudentOpen(true)}
            className="gap-2 bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </Button>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Our Students
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          View and manage kid records with family, grade, and academic information.
        </p>
        <KidsTable requestingUserId={requestingUserId} />
      </div>

      {/* Add Student Dialog */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Add New Student
            </DialogTitle>
            <DialogDescription>
              Add a new student with their personal, academic, and family information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitStudent} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Personal Information */}
              <div className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'origin_district', label: 'Origin District' },
                    { key: 'origin_sector', label: 'Origin Sector' },
                    { key: 'current_district_or_city', label: 'Current District/City' },
                    { key: 'current_country', label: 'Current Country' },
                    { key: 'health_issue', label: 'Health Issue' },
                    { key: 'marital_status', label: 'Marital Status' },
                    { key: 'life_status', label: 'Life Status' },
                    { key: 'has_children', label: 'Has Children' },
                    { key: 'graduation_status', label: 'Graduation Status' },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                     {key === 'has_children' ? (
  <select
    value={studentForm[key] ? "true" : "false"}
    onChange={(e) => setStudentForm((f) => ({ ...f, [key]: e.target.value === "true" }))}
    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm dark:bg-gray-800"
  >
    <option value="false">No</option>
    <option value="true">Yes</option>
  </select>
) : (
  <Input
    value={studentForm[key] || ''}
    onChange={(e) => setStudentForm((f) => ({ ...f, [key]: e.target.value }))}
    className="bg-white dark:bg-gray-800"
    placeholder={`Enter ${label.toLowerCase()}`}
    required
  />
)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Academic Information */}
              <div className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Academic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { key: 'points_in_national_exam', label: 'Points (National Exam)', type: 'number' },
                    { key: 'maximum_points_in_national_exam', label: 'Maximum Points (National Exam)', type: 'number' },
                    { key: 'mention', label: 'Mention' },
                  ].map(({ key, label, type }) => (
                    <div key={key} className="space-y-2">
                      <Label>{label}</Label>
                      <Input
                        type={type || 'text'}
                        value={studentForm[key] || ''}
                        onChange={(e) => setStudentForm((f) => ({ ...f, [key]: e.target.value }))}
                        className="bg-white dark:bg-gray-800"
                        placeholder={`Enter ${label.toLowerCase()}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Relationships */}
              <div className="lg:col-span-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Relationships</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>User (Link to existing user or create new)</Label>
                    <div className="flex gap-2">
                      {/* <div className="flex-1 relative">
                        <Input
                          placeholder="Search users by name or email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="bg-white dark:bg-gray-800 pr-10"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div> */}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateUser(true)}
                        className="gap-1"
                      >
                        <UserPlus className="h-4 w-4" />
                        New User
                      </Button>
                    </div>
                    <div className="relative">
                      <Label className="text-sm font-medium">User (Link to existing user)</Label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Search user by name or email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="bg-white dark:bg-gray-800 pr-10"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      
                      {/* Dropdown results */}
                      {userSearch && (
                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto mt-1">
                          {users
                            .filter(user => 
                              (user.first_name && user.first_name.toLowerCase().includes(userSearch.toLowerCase())) ||
                              (user.rwandan_name && user.rwandan_name.toLowerCase().includes(userSearch.toLowerCase())) ||
                              (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()))
                            )
                            .slice(0, 10) // Limit to 10 results
                            .map((user) => (
                              <div
                                key={user.id}
                                onClick={() => {
                                  setStudentForm((f) => ({ ...f, user_id: String(user.id) }));
                                  setUserSearch(''); // Clear search after selection
                                }}
                                className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{user.first_name || user.rwandan_name || 'Unknown'}</span>
                                  <span className="text-xs text-gray-500">{user.email}</span>
                                </div>
                              </div>
                            ))}
                          {users.filter(user => 
                            (user.first_name && user.first_name.toLowerCase().includes(userSearch.toLowerCase())) ||
                            (user.rwandan_name && user.rwandan_name.toLowerCase().includes(userSearch.toLowerCase())) ||
                            (user.email && user.email.toLowerCase().includes(userSearch.toLowerCase()))
                          ).length === 0 && (
                            <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                              No users found matching "{userSearch}"
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Show selected user when search is empty */}
                      {!userSearch && studentForm.user_id && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {users.find(u => String(u.id) === studentForm.user_id)?.first_name || 
                                 users.find(u => String(u.id) === studentForm.user_id)?.rwandan_name || 'Unknown'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {users.find(u => String(u.id) === studentForm.user_id)?.email}
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                setStudentForm((f) => ({ ...f, user_id: '' }));
                                setUserSearch('');
                              }}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Family (Link to existing family)</Label>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search family by name or number..."
                        value={familySearch}
                        onChange={(e) => setFamilySearch(e.target.value)}
                        className="bg-white dark:bg-gray-800 pr-10"
                      />
                      <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    
                    {/* Dropdown results */}
                    {familySearch && (
                      <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto mt-1">
                        {families
                          .filter(family => 
                            (family.family_name && family.family_name.toLowerCase().includes(familySearch.toLowerCase())) ||
                            (family.family_number && family.family_number.toLowerCase().includes(familySearch.toLowerCase()))
                          )
                          .slice(0, 10) // Limit to 10 results
                          .map((family) => (
                            <div
                              key={family.id}
                              onClick={() => {
                                setStudentForm((f) => ({ ...f, family_id: String(family.id) }));
                                setFamilySearch(''); // Clear search after selection
                              }}
                              className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{family.family_name || family.family_number || `Family #${family.id}`}</span>
                                {family.family_name && family.family_number && (
                                  <span className="text-xs text-gray-500">{family.family_number}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        {families.filter(family => 
                          (family.family_name && family.family_name.toLowerCase().includes(familySearch.toLowerCase())) ||
                          (family.family_number && family.family_number.toLowerCase().includes(familySearch.toLowerCase()))
                        ).length === 0 && (
                          <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                            No families found matching "{familySearch}"
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Show selected family when search is empty */}
                    {!familySearch && studentForm.family_id && (
                      <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {families.find(f => String(f.id) === studentForm.family_id)?.family_name || 
                               families.find(f => String(f.id) === studentForm.family_id)?.family_number || 
                               `Family #${studentForm.family_id}`}
                            </span>
                            {families.find(f => String(f.id) === studentForm.family_id)?.family_name && 
                             families.find(f => String(f.id) === studentForm.family_id)?.family_number && (
                              <span className="text-xs text-gray-500">
                                {families.find(f => String(f.id) === studentForm.family_id)?.family_number}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setStudentForm((f) => ({ ...f, family_id: '' }));
                              setFamilySearch('');
                            }}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setAddStudentOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {loading ? 'Adding Student...' : 'Add Student'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Create New User
            </DialogTitle>
            <DialogDescription>
              Create a new user that can be linked to a student.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input
                required
                value={newUserForm.first_name}
                onChange={(e) => setNewUserForm((f) => ({ ...f, first_name: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter first name"
              />
            </div>
            <div className="space-y-2">
              <Label>Rwandan Name</Label>
              <Input
                value={newUserForm.rwandan_name}
                onChange={(e) => setNewUserForm((f) => ({ ...f, rwandan_name: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter Rwandan name"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                required
                type="email"
                value={newUserForm.email}
                onChange={(e) => setNewUserForm((f) => ({ ...f, email: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label>User Permissions</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newUserForm.is_superuser}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, is_superuser: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Superuser</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newUserForm.is_crc}
                    onChange={(e) => setNewUserForm((f) => ({ ...f, is_crc: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">CRC</span>
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowCreateUser(false)}
                disabled={creatingUser}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={creatingUser}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {creatingUser ? 'Creating User...' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
