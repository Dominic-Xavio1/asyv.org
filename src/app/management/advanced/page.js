'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, User, Search, UserPlus, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { useConfirmDialog } from '@/components/ui/use-confirm-dialog'
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
  const [hasStaffAccess, setHasStaffAccess] = useState(false);
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addGradeOpen, setAddGradeOpen] = useState(false);
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [confirm, confirmDialog] = useConfirmDialog();
  const [families, setFamilies] = useState([]);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [familySearch, setFamilySearch] = useState('');
  const [motherSearch, setMotherSearch] = useState('');
  const [eapSearch, setEapSearch] = useState('');
  const [combinationSearch, setCombinationSearch] = useState('');
  const [universitySearch, setUniversitySearch] = useState('');
  const [collegeSearch, setCollegeSearch] = useState('');
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
  const [gradeForm, setGradeForm] = useState({
    grade_name: '',
    admission_year_to_asyv: '',
    graduation_year_to_asyv: '',
  });
  const [familyForm, setFamilyForm] = useState({
    family_name: '',
    family_number: '',
    mother_id: undefined,
    grade_id: undefined,
  });
  const [editGradeOpen, setEditGradeOpen] = useState(false);
  const [editFamilyOpen, setEditFamilyOpen] = useState(false);
  const [editGradeId, setEditGradeId] = useState('');
  const [editFamilyId, setEditFamilyId] = useState('');
  const [editGradeForm, setEditGradeForm] = useState({
    grade_name: '',
    admission_year_to_asyv: '',
    graduation_year_to_asyv: '',
  });
  const [editFamilyForm, setEditFamilyForm] = useState({
    family_name: '',
    family_number: '',
    mother_id: undefined,
    grade_id: undefined,
  });

  // New state for EAP, Combination and University CRUD
  const [showKidsTable, setShowKidsTable] = useState(false);
  const [activeTab, setActiveTab] = useState('eap');
  const [eapData, setEapData] = useState([]);
  const [combinationData, setCombinationData] = useState([]);
  const [universityData, setUniversityData] = useState([]);
  const [eapLoading, setEapLoading] = useState(false);
  const [combinationLoading, setCombinationLoading] = useState(false);
  const [universityLoading, setUniversityLoading] = useState(false);

  // Form states for EAP
  const [addEapOpen, setAddEapOpen] = useState(false);
  const [editEapOpen, setEditEapOpen] = useState(false);
  const [editEapId, setEditEapId] = useState('');
  const [eapForm, setEapForm] = useState({
    ep: '',
    leap_category: '',
  });

  // Form states for Combination
  const [addCombinationOpen, setAddCombinationOpen] = useState(false);
  const [editCombinationOpen, setEditCombinationOpen] = useState(false);
  const [editCombinationId, setEditCombinationId] = useState('');
  const [combinationForm, setCombinationForm] = useState({
    combination_name: '',
    abbreviation: '',
  });

  // Form states for University records
  const [addUniversityOpen, setAddUniversityOpen] = useState(false);
  const [editUniversityOpen, setEditUniversityOpen] = useState(false);
  const [editUniversityId, setEditUniversityId] = useState('');
  const [universityForm, setUniversityForm] = useState({
    alumn_id: '',
    degree: '',
    level: '',
    scholarship: '',
    scholarship_details: '',
    enrolled: false,
    college_id: null,
    college_name: '',
    country: '',
    city: '',
    status: '',
  });

  const [collegeData, setCollegeData] = useState([]);
  const [collegeLoading, setCollegeLoading] = useState(false);
  const [kidsData, setKidsData] = useState([]);
  const [addCollegeOpen, setAddCollegeOpen] = useState(false);
  const [editCollegeOpen, setEditCollegeOpen] = useState(false);
  const [editCollegeId, setEditCollegeId] = useState('');
  const [collegeForm, setCollegeForm] = useState({
    college_name: '',
    country: '',
    city: '',
  });

  // Searchable select state for university form
  const [alumniSelectSearch, setAlumniSelectSearch] = useState('');
  const [alumniSelectOpen, setAlumniSelectOpen] = useState(false);
  const [collegeSelectSearch, setCollegeSelectSearch] = useState('');
  const [collegeSelectOpen, setCollegeSelectOpen] = useState(false);

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
      setHasStaffAccess(true);
      setRequestingUserId(String(user.id));
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  // After "Create New User" with is_student on /management — open Add Student with user linked
  useEffect(() => {
    if (!requestingUserId || !hasStaffAccess || typeof window === 'undefined') return;
    const raw = sessionStorage.getItem('asyv_pending_student_setup');
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      sessionStorage.removeItem('asyv_pending_student_setup');
      if (!pending?.userId) return;

      setStudentForm((f) => ({ ...f, user_id: String(pending.userId) }));
      setUsers((prev) => {
        if (prev.some((u) => String(u.id) === String(pending.userId))) return prev;
        return [
          ...prev,
          {
            id: pending.userId,
            first_name: pending.first_name || '',
            rwandan_name: pending.rwandan_name || '',
            email: pending.email || '',
          },
        ];
      });
      setAddStudentOpen(true);
      toast('User account created. Complete the kid record below.', { icon: 'ℹ️' });
    } catch {
      sessionStorage.removeItem('asyv_pending_student_setup');
    }
  }, [requestingUserId, hasStaffAccess]);

  // Fetch users and families for dropdowns
  useEffect(() => {
    if (!requestingUserId) return;

    const fetchData = async () => {
      try {
        const [usersRes, familiesRes, gradesRes] = await Promise.all([
          fetch(`/api/manage/users?requestingUserId=${requestingUserId}`, {
            headers: { 'x-user-id': requestingUserId }
          }),
          fetch(`/api/manage/families?requestingUserId=${requestingUserId}`, {
            headers: { 'x-user-id': requestingUserId }
          }),
          fetch(`/api/manage/grades?requestingUserId=${requestingUserId}`, {
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

        if (gradesRes.ok) {
          const gradesData = await gradesRes.json();
          setGrades(Array.isArray(gradesData) ? gradesData : []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error(error.message)
      }
    };

    fetchData();
  }, [requestingUserId]);

  // Fetch EAP and Combination data
  useEffect(() => {
    if (!requestingUserId) return;

    const fetchCrudData = async () => {
      try {
        const [eapRes, combinationRes, universityRes, collegeRes, kidsRes] = await Promise.all([
          fetch(`/api/manage/leap?requestingUserId=${requestingUserId}`, {
            headers: { 'x-user-id': requestingUserId }
          }),
          fetch(`/api/manage/combinations?requestingUserId=${requestingUserId}`, {
            headers: { 'x-user-id': requestingUserId }
          }),
          fetch(`/api/manage/furthereducation?requestingUserId=${requestingUserId}`, {
            headers: { 'x-user-id': requestingUserId }
          }),
          fetch(`/api/manage/colleges?requestingUserId=${requestingUserId}`, {
            headers: { 'x-user-id': requestingUserId }
          }),
          fetch(`/api/manage/kids?requestingUserId=${requestingUserId}`, {
            headers: { 'x-user-id': requestingUserId }
          })
        ]);

        if (eapRes.ok) {
          const eapDataResult = await eapRes.json();
          setEapData(Array.isArray(eapDataResult) ? eapDataResult : []);
        }

        if (combinationRes.ok) {
          const combinationDataResult = await combinationRes.json();
          setCombinationData(Array.isArray(combinationDataResult) ? combinationDataResult : []);
        }

        if (universityRes.ok) {
          const universityDataResult = await universityRes.json();
          setUniversityData(Array.isArray(universityDataResult?.furtherEducation) ? universityDataResult.furtherEducation : []);
        }

        if (collegeRes.ok) {
          const collegeDataResult = await collegeRes.json();
          setCollegeData(Array.isArray(collegeDataResult) ? collegeDataResult : []);
        }

        if (kidsRes.ok) {
          const kidsDataResult = await kidsRes.json();
          setKidsData(Array.isArray(kidsDataResult) ? kidsDataResult : []);
        }
      } catch (error) {
        console.error('Error fetching CRUD data:', error);
        toast.error('Failed to load data');
      }
    };

    fetchCrudData();
  }, [requestingUserId]);

  const mothers = useMemo(() => users.filter((user) => user.is_mama === true), [users]);
  const filteredMothers = useMemo(() => mothers.filter((user) =>
    motherSearch.trim() === '' ||
    [user.first_name, user.rwandan_name, user.email]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(motherSearch.toLowerCase()))
  ), [mothers, motherSearch]);

  const alumniUsers = useMemo(() => users.filter((user) => user), [users]);
  // const alumniUsers = useMemo(() => users.filter((user) => user.is_alumni === true), [users]);

  // Filter users by `userSearch` supporting multi-term matching (all terms must match any searchable field)
  const filteredUsers = useMemo(() => {
    const q = (userSearch || '').trim().toLowerCase();
    if (!q) return users || [];
    const terms = q.split(/\s+/).filter(Boolean);
    return (users || []).filter((user) => {
      return terms.every((term) =>
        [user.first_name, user.rwandan_name, user.email]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      );
    });
  }, [users, userSearch]);

  const filteredEapData = useMemo(() => eapData.filter((row) => {
    if (!eapSearch.trim()) return true;
    const query = eapSearch.toLowerCase();
    return Object.values(row)
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(query));
  }), [eapData, eapSearch]);

  const filteredCombinationData = useMemo(() => combinationData.filter((row) => {
    if (!combinationSearch.trim()) return true;
    const query = combinationSearch.toLowerCase();
    return Object.values(row)
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(query));
  }), [combinationData, combinationSearch]);

  const filteredUniversityData = useMemo(() => universityData.filter((row) => {
    if (!universitySearch.trim()) return true;
    const query = universitySearch.toLowerCase();
    return Object.values(row)
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(query));
  }), [universityData, universitySearch]);

  const filteredCollegeData = useMemo(() => collegeData.filter((row) => {
    if (!collegeSearch.trim()) return true;
    const query = collegeSearch.toLowerCase();
    return Object.values(row)
      .filter((value) => value !== null && value !== undefined)
      .some((value) => String(value).toLowerCase().includes(query));
  }), [collegeData, collegeSearch]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!newUserForm.first_name?.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!newUserForm.email?.trim()) {
      toast.error('Email is required');
      return;
    }
    
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

  const handleSubmitGrade = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!gradeForm.grade_name?.trim()) {
      toast.error('Grade name is required');
      return;
    }
    
    setLoading(true);

    try {
      const payload = {
        ...gradeForm,
        requestingUserId,
        grade_name: gradeForm.grade_name || null,
        admission_year_to_asyv: gradeForm.admission_year_to_asyv ? Number(gradeForm.admission_year_to_asyv) : null,
        graduation_year_to_asyv: gradeForm.graduation_year_to_asyv ? Number(gradeForm.graduation_year_to_asyv) : null,
      };

      const response = await fetch('/api/manage/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add grade');
      }

      toast.success('Grade added successfully!');
      setAddGradeOpen(false);
      setGradeForm({
        grade_name: '',
        admission_year_to_asyv: '',
        graduation_year_to_asyv: '',
      });

      // Refresh grades list
      const gradesRes = await fetch(`/api/manage/grades?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId }
      });
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        setGrades(Array.isArray(gradesData) ? gradesData : []);
      }
    } catch (error) {
      console.error('Error adding grade:', error);
      toast.error(error.message || 'Failed to add grade');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGradeToEdit = (id) => {
    const grade = grades.find((item) => String(item.id) === String(id));
    if (!grade) {
      setEditGradeId('');
      setEditGradeForm({ grade_name: '', admission_year_to_asyv: '', graduation_year_to_asyv: '' });
      return;
    }
    setEditGradeId(String(grade.id));
    setEditGradeForm({
      grade_name: grade.grade_name || '',
      admission_year_to_asyv: grade.admission_year_to_asyv != null ? String(grade.admission_year_to_asyv) : '',
      graduation_year_to_asyv: grade.graduation_year_to_asyv != null ? String(grade.graduation_year_to_asyv) : '',
    });
  };

  const handleUpdateGrade = async (e) => {
    e.preventDefault();
    if (!editGradeId) {
      toast.error('Select a grade first');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        requestingUserId,
        grade_name: editGradeForm.grade_name || null,
        admission_year_to_asyv: editGradeForm.admission_year_to_asyv ? Number(editGradeForm.admission_year_to_asyv) : null,
        graduation_year_to_asyv: editGradeForm.graduation_year_to_asyv ? Number(editGradeForm.graduation_year_to_asyv) : null,
      };
      const response = await fetch(`/api/manage/grades/${editGradeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update grade');
      }
      toast.success('Grade updated successfully!');
      setEditGradeOpen(false);
      setEditGradeId('');
      setEditGradeForm({ grade_name: '', admission_year_to_asyv: '', graduation_year_to_asyv: '' });
      const gradesRes = await fetch(`/api/manage/grades?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId },
      });
      if (gradesRes.ok) {
        const gradesData = await gradesRes.json();
        setGrades(Array.isArray(gradesData) ? gradesData : []);
      }
    } catch (error) {
      console.error('Error updating grade:', error);
      toast.error(error.message || 'Failed to update grade');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFamilyToEdit = (id) => {
    const family = families.find((item) => String(item.id) === String(id));
    if (!family) {
      setEditFamilyId('');
      setEditFamilyForm({ family_name: '', family_number: '', mother_id: undefined, grade_id: undefined });
      return;
    }
    setEditFamilyId(String(family.id));
    setEditFamilyForm({
      family_name: family.family_name || '',
      family_number: family.family_number || '',
      mother_id: family.mother_id ? String(family.mother_id) : undefined,
      grade_id: family.grade_id ? String(family.grade_id) : undefined,
      family_id: family.id,
    });
  };

  const handleUpdateFamily = async (e) => {
    e.preventDefault();
    if (!editFamilyId) {
      toast.error('Select a family first');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        requestingUserId,
        family_name: editFamilyForm.family_name || null,
        family_number: editFamilyForm.family_number || null,
      };
      if (editFamilyForm.mother_id) {
        payload.mother_id = Number(editFamilyForm.mother_id);
      }
      if (editFamilyForm.grade_id) {
        payload.grade_id = Number(editFamilyForm.grade_id);
      }
      const response = await fetch(`/api/manage/families/${editFamilyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update family');
      }
      toast.success('Family updated successfully!');
      setEditFamilyOpen(false);
      setEditFamilyId('');
      setEditFamilyForm({ family_name: '', family_number: '', mother_id: undefined, grade_id: undefined });
      const familiesRes = await fetch(`/api/manage/families?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId },
      });
      if (familiesRes.ok) {
        const familiesData = await familiesRes.json();
        setFamilies(Array.isArray(familiesData) ? familiesData : []);
      }
    } catch (error) {
      console.error('Error updating family:', error);
      toast.error(error.message || 'Failed to update family');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitFamily = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!familyForm.family_name?.trim()) {
      toast.error('Family name is required');
      return;
    }
    if (!familyForm.family_number?.trim()) {
      toast.error('Family number is required');
      return;
    }
    
    setLoading(true);

    try {
      const payload = {
        ...familyForm,
        requestingUserId,
        family_name: familyForm.family_name || null,
        family_number: familyForm.family_number || null,
        mother_id: familyForm.mother_id ? Number(familyForm.mother_id) : null,
        grade_id: familyForm.grade_id ? Number(familyForm.grade_id) : null,
      };

      const response = await fetch('/api/manage/families', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add family');
      }

      toast.success('Family added successfully!');
      setAddFamilyOpen(false);
      setFamilyForm({
        family_name: '',
        family_number: '',
        mother_id: undefined,
        grade_id: undefined,
      });

      // Refresh families list
      const familiesRes = await fetch(`/api/manage/families?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId }
      });
      if (familiesRes.ok) {
        const familiesData = await familiesRes.json();
        setFamilies(Array.isArray(familiesData) ? familiesData : []);
      }
    } catch (error) {
      console.error('Error adding family:', error);
      toast.error(error.message || 'Failed to add family');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitStudent = async (e) => {
    e.preventDefault();

    // Validate all fields are filled
    const fieldLabels = {
      origin_district: 'Origin District',
      origin_sector: 'Origin Sector',
      current_district_or_city: 'Current District/City',
      current_country: 'Current Country',
      health_issue: 'Health Issue',
      marital_status: 'Marital Status',
      life_status: 'Life Status',
      points_in_national_exam: 'Points in National Exam',
      maximum_points_in_national_exam: 'Maximum Points in National Exam',
      mention: 'Mention',
      user_id: 'User',
      family_id: 'Family',
      graduation_status: 'Graduation Status',
    };

    for (const [field, label] of Object.entries(fieldLabels)) {
      if (!studentForm[field] || studentForm[field].trim() === '') {
        toast.error(`${label} is required`);
        return;
      }
    }

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
        has_children: studentForm.has_children || false,
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

  // EAP CRUD Handlers
  const handleAddEap = async (e) => {
    e.preventDefault();
    if (!eapForm.ep?.trim()) {
      toast.error('EP is required.');
      return;
    }
    if (eapForm.ep.trim().length > 100) {
      toast.error('EP must not exceed 100 characters.');
      return;
    }
    if (!eapForm.leap_category?.trim()) {
      toast.error('Leap category is required.');
      return;
    }
    if (eapForm.leap_category.trim().length > 20) {
      toast.error('Leap category must not exceed 20 characters.');
      return;
    }

    setEapLoading(true);

    try {
      const payload = {
        ep: eapForm.ep.trim(),
        leap_category: eapForm.leap_category.trim(),
        requestingUserId,
      };

      const response = await fetch('/api/manage/leap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add EAP record');
      }

      toast.success('EAP record added successfully!');
      setAddEapOpen(false);
      setEapForm({ ep: '', leap_category: '' });

      // Refresh EAP data
      const eapRes = await fetch(`/api/manage/leap?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId }
      });
      if (eapRes.ok) {
        const eapDataResult = await eapRes.json();
        setEapData(Array.isArray(eapDataResult) ? eapDataResult : []);
      }
    } catch (error) {
      console.error('Error adding EAP record:', error);
      toast.error(error.message || 'Failed to add EAP record');
    } finally {
      setEapLoading(false);
    }
  };

  const handleUpdateEap = async (e) => {
    e.preventDefault();
    if (!editEapId) {
      toast.error('Select an EAP record first');
      return;
    }
    setEapLoading(true);

    try {
      const payload = {
        ep: eapForm.ep.trim(),
        leap_category: eapForm.leap_category.trim(),
        requestingUserId,
      };

      const response = await fetch(`/api/manage/leap?id=${editEapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update EAP record');
      }

      toast.success('EAP record updated successfully!');
      setEditEapOpen(false);
      setEditEapId('');
      setEapForm({ ep: '', leap_category: '' });

      // Refresh EAP data
      const eapRes = await fetch(`/api/manage/leap?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId }
      });
      if (eapRes.ok) {
        const eapDataResult = await eapRes.json();
        setEapData(Array.isArray(eapDataResult) ? eapDataResult : []);
      }
    } catch (error) {
      console.error('Error updating EAP record:', error);
      toast.error(error.message || 'Failed to update EAP record');
    } finally {
      setEapLoading(false);
    }
  };

  const handleDeleteEap = async (id) => {
    const confirmed = await confirm({
      title: 'Delete EAP record',
      description: 'Are you sure you want to delete this EAP record?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    })
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/manage/leap?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': requestingUserId },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete EAP record');
      }

      toast.success('EAP record deleted successfully!');

      // Refresh EAP data
      const eapRes = await fetch(`/api/manage/leap?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId }
      });
      if (eapRes.ok) {
        const eapDataResult = await eapRes.json();
        setEapData(Array.isArray(eapDataResult) ? eapDataResult : []);
      }
    } catch (error) {
      console.error('Error deleting EAP record:', error);
      toast.error(error.message || 'Failed to delete EAP record');
    }
  };

  const handleSelectEapToEdit = (id) => {
    const eap = eapData.find((item) => String(item.id) === String(id));
    if (!eap) {
      setEditEapId('');
      setEapForm({ ep: '', leap_category: '' });
      return;
    }
    setEditEapId(String(eap.id));
    setEapForm({
      ep: eap.ep || '',
      leap_category: eap.leap_category || '',
    });
  };

  // Combination CRUD Handlers
  const handleAddCombination = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!combinationForm.combination_name?.trim()) {
      toast.error('Combination name is required');
      return;
    }
    if (!combinationForm.abbreviation?.trim()) {
      toast.error('Abbreviation is required');
      return;
    }
    
    setCombinationLoading(true);

    try {
      const payload = {
        ...combinationForm,
        requestingUserId,
      };

      const response = await fetch('/api/manage/combinations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add combination');
      }

      toast.success('Combination added successfully!');
      setAddCombinationOpen(false);
      setCombinationForm({ combination_name: '', abbreviation: '' });

      // Refresh combination data
      const combinationRes = await fetch(`/api/manage/combinations?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId }
      });
      if (combinationRes.ok) {
        const combinationDataResult = await combinationRes.json();
        setCombinationData(Array.isArray(combinationDataResult) ? combinationDataResult : []);
      }
    } catch (error) {
      console.error('Error adding combination:', error);
      toast.error(error.message || 'Failed to add combination');
    } finally {
      setCombinationLoading(false);
    }
  };

  const handleUpdateCombination = async (e) => {
    e.preventDefault();
    if (!editCombinationId) {
      toast.error('Select a combination first');
      return;
    }
    setCombinationLoading(true);

    try {
      const payload = {
        ...combinationForm,
        requestingUserId,
      };

      const response = await fetch(`/api/manage/combinations?id=${editCombinationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update combination');
      }

      toast.success('Combination updated successfully!');
      setEditCombinationOpen(false);
      setEditCombinationId('');
      setCombinationForm({ combination_name: '', abbreviation: '' });

      // Refresh combination data
      const combinationRes = await fetch(`/api/manage/combinations?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId }
      });
      if (combinationRes.ok) {
        const combinationDataResult = await combinationRes.json();
        setCombinationData(Array.isArray(combinationDataResult) ? combinationDataResult : []);
      }
    } catch (error) {
      console.error('Error updating combination:', error);
      toast.error(error.message || 'Failed to update combination');
    } finally {
      setCombinationLoading(false);
    }
  };

  const handleDeleteCombination = async (id) => {
    const confirmed = await confirm({
      title: 'Delete combination',
      description: 'Are you sure you want to delete this combination?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    })
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/manage/combinations?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': requestingUserId },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete combination');
      }

      toast.success('Combination deleted successfully!');

      // Refresh combination data
      const combinationRes = await fetch(`/api/manage/combinations?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId }
      });
      if (combinationRes.ok) {
        const combinationDataResult = await combinationRes.json();
        setCombinationData(Array.isArray(combinationDataResult) ? combinationDataResult : []);
      }
    } catch (error) {
      console.error('Error deleting combination:', error);
      toast.error(error.message || 'Failed to delete combination');
    }
  };

  // University CRUD handlers
  const handleAddUniversity = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!universityForm.alumn_id?.trim()) {
      toast.error('Alumni is required');
      return;
    }
    if (!universityForm.degree?.trim()) {
      toast.error('Degree is required');
      return;
    }
    if (!universityForm.level?.trim()) {
      toast.error('Level is required');
      return;
    }
    if (!universityForm.status?.trim()) {
      toast.error('Status is required');
      return;
    }
    if (!universityForm.college_name?.trim()) {
      toast.error('College name is required');
      return;
    }
    if (!universityForm.country?.trim()) {
      toast.error('Country is required');
      return;
    }
    if (!universityForm.city?.trim()) {
      toast.error('City is required');
      return;
    }
    
    setUniversityLoading(true);

    try {
      const payload = {
        alumn_id: universityForm.alumn_id ? Number(universityForm.alumn_id) : null,
        degree: universityForm.degree || null,
        level: universityForm.level || null,
        status: universityForm.status || null,
        scholarship: universityForm.scholarship || null,
        scholarship_details: universityForm.scholarship_details || null,
        enrolled: universityForm.enrolled,
        college: {
          college_name: universityForm.college_name || null,
          country: universityForm.country || null,
          city: universityForm.city || null,
        },
        requestingUserId,
      };

      const response = await fetch('/api/manage/furthereducation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add university record');
      }

      toast.success('University record added successfully!');
      setAddUniversityOpen(false);
      setUniversityForm({
        alumn_id: '',
        degree: '',
        level: '',
        scholarship: '',
        scholarship_details: '',
        enrolled: false,
        college_id: null,
        college_name: '',
        country: '',
        city: '',
        status: '',
      });

      const universityRes = await fetch(`/api/manage/furthereducation?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId }
      });
      if (universityRes.ok) {
        const universityDataResult = await universityRes.json();
        setUniversityData(Array.isArray(universityDataResult?.furtherEducation) ? universityDataResult.furtherEducation : []);
      }
    } catch (error) {
      console.error('Error adding university record:', error);
      toast.error(error.message || 'Failed to add university record');
    } finally {
      setUniversityLoading(false);
    }
  };

  const handleUpdateUniversity = async (e) => {
    e.preventDefault();
    if (!editUniversityId) {
      toast.error('Select a university record first');
      setUniversityLoading(false);
      return;
    }
    setUniversityLoading(true);

    try {
      const payload = {
        id: editUniversityId,
        alumn_id: universityForm.alumn_id ? Number(universityForm.alumn_id) : null,
        degree: universityForm.degree || null,
        level: universityForm.level || null,
        status: universityForm.status || null,
        scholarship: universityForm.scholarship || null,
        scholarship_details: universityForm.scholarship_details || null,
        enrolled: universityForm.enrolled,
        college_id: universityForm.college_id || null,
        college: {
          college_name: universityForm.college_name || null,
          country: universityForm.country || null,
          city: universityForm.city || null,
        },
        requestingUserId,
      };
      console.log('Updating university with payload:', payload);
      const response = await fetch(`/api/manage/furthereducation?id=${editUniversityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update university record');
      }

      toast.success('University record updated successfully!');
      setEditUniversityOpen(false);
      setEditUniversityId('');
      setUniversityForm({
        alumn_id: '',
        degree: '',
        level: '',
        scholarship: '',
        scholarship_details: '',
        enrolled: false,
        college_id: null,
        college_name: '',
        country: '',
        city: '',
        status: '',
      });

      const universityRes = await fetch(`/api/manage/furthereducation?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId }
      });
      if (universityRes.ok) {
        const universityDataResult = await universityRes.json();
        setUniversityData(Array.isArray(universityDataResult?.furtherEducation) ? universityDataResult.furtherEducation : []);
      }
    } catch (error) {
      console.error('Error updating university record:', error);
      toast.error(error.message || 'Failed to update university record');
    } finally {
      setUniversityLoading(false);
    }
  };

  const handleDeleteUniversity = async (id) => {
    const confirmed = await confirm({
      title: 'Delete university record',
      description: 'Are you sure you want to delete this university record?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    })
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/manage/furthereducation?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': requestingUserId },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete university record');
      }

      toast.success('University record deleted successfully!');
      const universityRes = await fetch(`/api/manage/furthereducation?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId }
      });
      if (universityRes.ok) {
        const universityDataResult = await universityRes.json();
        setUniversityData(Array.isArray(universityDataResult?.furtherEducation) ? universityDataResult.furtherEducation : []);
      }
    } catch (error) {
      console.error('Error deleting university record:', error);
      toast.error(error.message || 'Failed to delete university record');
    }
  };

  const handleAddCollege = async (e) => {
    e.preventDefault();
    if (!collegeForm.college_name.trim()) {
      toast.error('College name is required.');
      return;
    }
    if (!collegeForm.country.trim()) {
      toast.error('Country is required.');
      return;
    }
    if (!collegeForm.city.trim()) {
      toast.error('City is required.');
      return;
    }

    setCollegeLoading(true);
    try {
      const response = await fetch('/api/manage/colleges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify({
          requestingUserId,
          college_name: collegeForm.college_name.trim(),
          country: collegeForm.country.trim(),
          city: collegeForm.city.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to add college record');
      }
      toast.success('College record added successfully!');
      setAddCollegeOpen(false);
      setCollegeForm({ college_name: '', country: '', city: '' });
      const collegeRes = await fetch(`/api/manage/colleges?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId },
      });
      if (collegeRes.ok) {
        const collegeDataResult = await collegeRes.json();
        setCollegeData(Array.isArray(collegeDataResult) ? collegeDataResult : []);
      }
    } catch (error) {
      console.error('Error adding college record:', error);
      toast.error(error.message || 'Failed to add college record');
    } finally {
      setCollegeLoading(false);
    }
  };

  const handleUpdateCollege = async (e) => {
    e.preventDefault();
    if (!editCollegeId) {
      toast.error('Select a college record first');
      return;
    }
    if (!collegeForm.college_name.trim()) {
      toast.error('College name is required.');
      return;
    }
    if (!collegeForm.country.trim()) {
      toast.error('Country is required.');
      return;
    }
    if (!collegeForm.city.trim()) {
      toast.error('City is required.');
      return;
    }

    setCollegeLoading(true);
    try {
      const response = await fetch(`/api/manage/colleges?id=${editCollegeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify({
          requestingUserId,
          college_name: collegeForm.college_name.trim(),
          country: collegeForm.country.trim(),
          city: collegeForm.city.trim(),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update college record');
      }
      toast.success('College record updated successfully!');
      setEditCollegeOpen(false);
      setEditCollegeId('');
      setCollegeForm({ college_name: '', country: '', city: '' });
      const collegeRes = await fetch(`/api/manage/colleges?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId },
      });
      if (collegeRes.ok) {
        const collegeDataResult = await collegeRes.json();
        setCollegeData(Array.isArray(collegeDataResult) ? collegeDataResult : []);
      }
    } catch (error) {
      console.error('Error updating college record:', error);
      toast.error(error.message || 'Failed to update college record');
    } finally {
      setCollegeLoading(false);
    }
  };

  const handleDeleteCollege = async (id) => {
    const confirmed = await confirm({
      title: 'Delete college record',
      description: 'Are you sure you want to delete this college record?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    })
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/manage/colleges?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-user-id': requestingUserId },
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete college record');
      }
      toast.success('College record deleted successfully!');
      const collegeRes = await fetch(`/api/manage/colleges?requestingUserId=${requestingUserId}`, {
        headers: { 'x-user-id': requestingUserId },
      });
      if (collegeRes.ok) {
        const collegeDataResult = await collegeRes.json();
        setCollegeData(Array.isArray(collegeDataResult) ? collegeDataResult : []);
      }
    } catch (error) {
      console.error('Error deleting college record:', error);
      toast.error(error.message || 'Failed to delete college record');
    }
  };

  const handleSelectCollegeToEdit = (id) => {
    const record = collegeData.find((item) => String(item.id) === String(id));
    if (!record) {
      setEditCollegeId('');
      setCollegeForm({ college_name: '', country: '', city: '' });
      return;
    }
    setEditCollegeId(String(record.id));
    setCollegeForm({
      college_name: record.college_name || '',
      country: record.country || '',
      city: record.city || '',
    });
  };

  const handleSelectUniversityToEdit = (id) => {
    const record = universityData.find((item) => String(item.id) === String(id));
    if (!record) {
      setEditUniversityId('');
      setUniversityForm({
        alumn_id: '',
        degree: '',
        level: '',
        scholarship: '',
        scholarship_details: '',
        enrolled: false,
        college_name: '',
        country: '',
        city: '',
        status: '',
      });
      return;
    }

    setEditUniversityId(String(record.id));
    setUniversityForm({
      alumn_id: String(record.alumn_id || ''),
      degree: record.degree || '',
      level: record.level || '',
      scholarship: record.scholarship || '',
      scholarship_details: record.scholarship_details || '',
      enrolled: Boolean(record.enrolled),
      college_id: record.college_id || null,
      college_name: record.college_name || '',
      country: record.country || '',
      city: record.city || '',
      status: record.status || '',
    });
  };

  const handleSelectCombinationToEdit = (id) => {
    const combination = combinationData.find((item) => String(item.id) === String(id));
    if (!combination) {
      setEditCombinationId('');
      setCombinationForm({ combination_name: '', abbreviation: '' });
      return;
    }
    setEditCombinationId(String(combination.id));
    setCombinationForm({
      combination_name: combination.combination_name || '',
      abbreviation: combination.abbreviation || '',
    });
  };

  if (requestingUserId === null || !hasStaffAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 pt-20 pb-12 px-4">
        <div className="max-w-[90rem] mx-auto space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2 w-fit">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Dashboard
                </Button>
              </Link>
              {/* <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50 pt-2">
                Our Students
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
                Manage grades, families, and student records. EAP and combination tables stay beside the directory when you open it on larger screens.
              </p> */}
            </div>
            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <Button onClick={() => setAddStudentOpen(true)} size="sm" className="gap-1.5 bg-orange-600 hover:bg-orange-700">
                <Plus className="h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200 dark:border-gray-700 px-4 py-2 sm:px-5">
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('eap')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'eap'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-neutral-50 dark:hover:bg-gray-800'
                    }`}
                >
                  EAP records
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('combinations')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'combinations'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-neutral-50 dark:hover:bg-gray-800'
                    }`}
                >
                  Combinations
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('universities')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'universities'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-neutral-50 dark:hover:bg-gray-800'
                    }`}
                >
                  University records
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('colleges')}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'colleges'
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 ring-1 ring-orange-200 dark:ring-orange-800'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-neutral-50 dark:hover:bg-gray-800'
                    }`}
                >
                  College records
                </button>
              </div>
              <Button
                type="button"
                variant={showKidsTable ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowKidsTable((v) => !v)}
                className={`gap-2 shrink-0 ${showKidsTable ? 'bg-orange-600 hover:bg-orange-700' : ''}`}
              >
                <User className="h-4 w-4" />
                {showKidsTable ? 'Hide student directory' : 'Show student directory'}
              </Button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={showKidsTable ? 'kids-table' : `table-${activeTab}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 p-4 sm:p-5"
              >
                {showKidsTable ? (
                  <Card className="border-neutral-200 dark:border-gray-700 bg-neutral-50/50 dark:bg-gray-950/40 shadow-none">
                    <CardContent className="pt-0">
                      <div className="max-h-[min(540px,62vh)] overflow-y-auto rounded-lg border border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <KidsTable requestingUserId={requestingUserId} className="px-2" />
                      </div>
                    </CardContent>
                  </Card>
                ) : activeTab === 'eap' ? (
                  <Card className="border-neutral-200 dark:border-gray-700 bg-neutral-50/50 dark:bg-gray-950/40 shadow-none">
                    <CardHeader className="space-y-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
                        <div className="min-w-0">
                          <CardTitle className="text-lg text-gray-900 dark:text-gray-100">EAP records</CardTitle>
                          <div className="relative mt-3 sm:mt-2 max-w-md">
                            <Input
                              value={eapSearch}
                              onChange={(e) => setEapSearch(e.target.value)}
                              placeholder="Search EAP records..."
                              className="pr-10"
                            />
                            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                        <Button onClick={() => setAddEapOpen(true)} size="sm" className="gap-2 bg-orange-600 hover:bg-orange-700 w-fit">
                          <Plus className="h-4 w-4" />
                          Add EAP record
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="max-h-[min(540px,62vh)] overflow-auto rounded-lg border border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                            <tr>
                              {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                                ID
                              </th> */}
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">EP</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide whitespace-nowrap">Leap Category</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                            {filteredEapData.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={100}
                                  className="px-3 py-10 text-center text-gray-500 dark:text-gray-400 text-sm"
                                >
                                  {eapData.length === 0
                                    ? 'No EAP records yet. Use "Add EAP record" to create one.'
                                    : 'No EAP records match your search.'}
                                </td>
                              </tr>
                            ) : (
                              filteredEapData.map((eap) => (
                                <tr key={eap.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/80">
                                  {/* <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-gray-800 dark:text-gray-200">
                                    {eap.id}
                                  </td> */}
                                  <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300 max-w-[12rem] truncate" title={eap.ep != null ? String(eap.ep) : ''}>
                                    {eap.ep ?? '-'}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-gray-600 dark:text-gray-300 max-w-[12rem] truncate" title={eap.leap_category != null ? String(eap.leap_category) : ''}>
                                    {eap.leap_category ?? '-'}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                        onClick={() => {
                                          handleSelectEapToEdit(eap.id);
                                          setEditEapOpen(true);
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/50"
                                        onClick={() => handleDeleteEap(eap.id)}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : activeTab === 'combinations' ? (
                  <Card className="border-neutral-200 dark:border-gray-700 bg-neutral-50/50 dark:bg-gray-950/40 shadow-none">
                    <CardHeader className="pb-3 space-y-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
                        <div className="min-w-0">
                          <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Combinations</CardTitle>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Subject combinations available to students.</p>
                          <div className="relative mt-3 sm:mt-2 max-w-md">
                            <Input
                              value={combinationSearch}
                              onChange={(e) => setCombinationSearch(e.target.value)}
                              placeholder="Search combinations..."
                              className="pr-10"
                            />
                            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                        <Button onClick={() => setAddCombinationOpen(true)} size="sm" className="gap-2 bg-orange-600 hover:bg-orange-700 w-fit">
                          <Plus className="h-4 w-4" />
                          Add combination
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="max-h-[min(500px,50vh)] overflow-auto rounded-lg border border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                            <tr>
                              {/* <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                                ID
                              </th> */}
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                                Name
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                                Abbreviation
                              </th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                            {filteredCombinationData.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-3 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">
                                  No combinations found.
                                </td>
                              </tr>
                            ) : (
                              filteredCombinationData.map((combination) => (
                                <tr key={combination.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/80">
                                  {/* <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-gray-800 dark:text-gray-200">
                                    {combination.id}
                                  </td> */}
                                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{combination.combination_name || '-'}</td>
                                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{combination.abbreviation || '-'}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                        onClick={() => {
                                          handleSelectCombinationToEdit(combination.id);
                                          setEditCombinationOpen(true);
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/50"
                                        onClick={() => handleDeleteCombination(combination.id)}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : activeTab === 'universities' ? (
                  <div>
                    <Card className="border-neutral-200 dark:border-gray-700 bg-neutral-50/50 dark:bg-gray-950/40 shadow-none">
                      <CardHeader className="pb-3 space-y-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
                          <div className="min-w-0">
                            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">University records</CardTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Track alumni further education and college details.</p>
                            <div className="relative mt-3 sm:mt-2 max-w-md">
                              <Input
                                value={universitySearch}
                                onChange={(e) => setUniversitySearch(e.target.value)}
                                placeholder="Search university records..."
                                className="pr-10"
                              />
                              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            </div>
                          </div>
                          <Button onClick={() => setAddUniversityOpen(true)} size="sm" className="gap-2 bg-orange-600 hover:bg-orange-700 w-fit">
                            <Plus className="h-4 w-4" />
                            Add university record
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="max-h-[min(500px,50vh)] overflow-auto rounded-lg border border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">College</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">Country</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">City</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                              {filteredUniversityData.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-3 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">
                                    No university records found.
                                  </td>
                                </tr>
                              ) : (
                                filteredUniversityData.map((record) => (
                                  <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/80">
                                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{record.college_name || '-'}</td>
                                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{record.country || '-'}</td>
                                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{record.city || '-'}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-right">
                                      <div className="flex justify-end gap-1.5">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                          onClick={() => {
                                            handleSelectUniversityToEdit(record.id);
                                            setEditUniversityOpen(true);
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/50"
                                          onClick={() => handleDeleteUniversity(record.id)}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* <Card className="border-neutral-200 dark:border-gray-700 bg-neutral-50/50 dark:bg-gray-950/40 shadow-none">
                      <CardHeader className="pb-3 space-y-0">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">College records</CardTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Standalone colleges from .</p>
                          </div>
                          <Button onClick={() => setAddCollegeOpen(true)} size="sm" className="gap-2 bg-orange-600 hover:bg-orange-700 w-fit">
                            <Plus className="h-4 w-4" />
                            Add college record
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="max-h-[min(500px,50vh)] overflow-auto rounded-lg border border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">College</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">Country</th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">City</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                              {collegeData.length === 0 ? (
                                <tr>
                                  <td colSpan={4} className="px-3 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">
                                    No college records yet.
                                  </td>
                                </tr>
                              ) : (
                                collegeData.map((college) => (
                                  <tr key={college.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/80">
                                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{college.college_name || '-'}</td>
                                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{college.country || '-'}</td>
                                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{college.city || '-'}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-right">
                                      <div className="flex justify-end gap-1.5">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                          onClick={() => {
                                            handleSelectCollegeToEdit(college.id);
                                            setEditCollegeOpen(true);
                                          }}
                                        >
                                          Edit
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/50"
                                          onClick={() => handleDeleteCollege(college.id)}
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card> */}
                  </div>
                ) : activeTab === 'colleges' ? (
                  <Card className="border-neutral-200 dark:border-gray-700 bg-neutral-50/50 dark:bg-gray-950/40 shadow-none">
                    <CardHeader className="pb-3 space-y-0">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
                        <div className="min-w-0">
                          <CardTitle className="text-lg text-gray-900 dark:text-gray-100">College records</CardTitle>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Standalone colleges from api_college.</p>
                          <div className="relative mt-3 sm:mt-2 max-w-md">
                            <Input
                              value={collegeSearch}
                              onChange={(e) => setCollegeSearch(e.target.value)}
                              placeholder="Search college records..."
                              className="pr-10"
                            />
                            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                        <Button onClick={() => setAddCollegeOpen(true)} size="sm" className="gap-2 bg-orange-600 hover:bg-orange-700 w-fit">
                          <Plus className="h-4 w-4" />
                          Add college record
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="max-h-[min(500px,50vh)] overflow-auto rounded-lg border border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">College</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">Country</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">City</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wide">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
                            {filteredCollegeData.length === 0 ? (
                              <tr>
                                <td colSpan={4} className="px-3 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">
                                  No college records found.
                                </td>
                              </tr>
                            ) : (
                              filteredCollegeData.map((college) => (
                                <tr key={college.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/80">
                                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{college.college_name || '-'}</td>
                                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{college.country || '-'}</td>
                                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{college.city || '-'}</td>
                                  <td className="px-3 py-2 whitespace-nowrap text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                        onClick={() => {
                                          handleSelectCollegeToEdit(college.id);
                                          setEditCollegeOpen(true);
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/50"
                                        onClick={() => handleDeleteCollege(college.id)}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
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
              {studentForm.user_id
                ? 'The user account is already created. Fill in kid details and link a family, then save.'
                : 'Add a new student with their personal, academic, and family information.'}
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
                    {/* <Label>User (Link to existing user or create new)</Label>
                    <div className="flex gap-2"> */}
                    {/* <div className="flex-1 relative">
                        <Input
                          placeholder="Search users by name or email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="bg-white dark:bg-gray-800 pr-10"
                        />
                        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div> */}
                    {/* <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCreateUser(true)}
                        className="gap-1"
                      >
                        <UserPlus className="h-4 w-4" />
                        New User
                      </Button> */}
                    {/* </div> */}
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
                          {filteredUsers
                            .slice(0, 10)
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
                          {filteredUsers.length === 0 && (
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

      {/* Add EAP Dialog */}
      <Dialog open={addEapOpen} onOpenChange={setAddEapOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New EAP Record
            </DialogTitle>
            <DialogDescription>
              Add a new EAP record with the required information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddEap} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="eap-ep">EP</Label>
              <Input
                id="eap-ep"
                value={eapForm.ep}
                onChange={(e) => setEapForm((f) => ({ ...f, ep: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter EP name"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Maximum 100 characters.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="eap-leap-category">Leap category</Label>
              <Input
                id="eap-leap-category"
                value={eapForm.leap_category}
                onChange={(e) => setEapForm((f) => ({ ...f, leap_category: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter Leap category"
                maxLength={20}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Maximum 20 characters.</p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddEapOpen(false)}
                disabled={eapLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={eapLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {eapLoading ? 'Adding EAP Record...' : 'Add EAP Record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit EAP Dialog */}
      <Dialog open={editEapOpen} onOpenChange={setEditEapOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Update EAP Record
            </DialogTitle>
            <DialogDescription>
              Select an EAP record and update its details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateEap} className="space-y-4">
            <div className="space-y-2">
              {/* <Label>Select EAP Record</Label>
              <Select
                value={editEapId || undefined}
                onValueChange={(value) => handleSelectEapToEdit(value)}
                required
              > */}
              {/* <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Choose EAP record to edit" />
                </SelectTrigger> */}
              {/* <SelectContent>
                  {eapData.length > 0 ? (
                    eapData.map((eap) => (
                      <SelectItem key={eap.id} value={String(eap.id)}>
                        EAP Record #{eap.id}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="-1" className="text-sm text-gray-500 dark:text-gray-400" disabled>
                      No EAP records available
                    </SelectItem>
                  )}
                </SelectContent> */}
              {/* </Select> */}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-eap-ep">EP</Label>
              <Input
                id="edit-eap-ep"
                value={eapForm.ep}
                onChange={(e) => setEapForm((f) => ({ ...f, ep: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter EP name"
                maxLength={100}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Maximum 100 characters.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-eap-leap-category">Leap category</Label>
              <Input
                id="edit-eap-leap-category"
                value={eapForm.leap_category}
                onChange={(e) => setEapForm((f) => ({ ...f, leap_category: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter Leap category"
                maxLength={20}
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Maximum 20 characters.</p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditEapOpen(false)}
                disabled={eapLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={eapLoading || !editEapId}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {eapLoading ? 'Updating EAP Record...' : 'Update EAP Record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Combination Dialog */}
      <Dialog open={addCombinationOpen} onOpenChange={setAddCombinationOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add New Combination
            </DialogTitle>
            <DialogDescription>
              Add a new combination with name and abbreviation.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCombination} className="space-y-4">
            <div className="space-y-2">
              <Label>Combination Name</Label>
              <Input
                required
                value={combinationForm.combination_name}
                onChange={(e) => setCombinationForm((f) => ({ ...f, combination_name: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter combination name"
              />
            </div>
            <div className="space-y-2">
              <Label>Abbreviation</Label>
              <Input
                value={combinationForm.abbreviation}
                onChange={(e) => setCombinationForm((f) => ({ ...f, abbreviation: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter abbreviation "
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddCombinationOpen(false)}
                disabled={combinationLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={combinationLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {combinationLoading ? 'Adding Combination...' : 'Add Combination'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Combination Dialog */}
      <Dialog open={editCombinationOpen} onOpenChange={setEditCombinationOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Update Combination
            </DialogTitle>
            <DialogDescription>
              Select a combination and update its details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCombination} className="space-y-4">
            <div className="space-y-2">
              <Label>Select Combination</Label>
              <Select
                value={editCombinationId || undefined}
                onValueChange={(value) => handleSelectCombinationToEdit(value)}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Choose combination to edit" />
                </SelectTrigger>
                <SelectContent>
                  {combinationData.length > 0 ? (
                    combinationData.map((combination) => (
                      <SelectItem key={combination.id} value={String(combination.id)}>
                        {combination.combination_name || `Combination #${combination.id}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="-1" className="text-sm text-gray-500 dark:text-gray-400" disabled>
                      No combinations available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Combination Name</Label>
              <Input
                required
                value={combinationForm.combination_name}
                onChange={(e) => setCombinationForm((f) => ({ ...f, combination_name: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter combination name"
              />
            </div>
            <div className="space-y-2">
              <Label>Abbreviation</Label>
              <Input
                value={combinationForm.abbreviation}
                onChange={(e) => setCombinationForm((f) => ({ ...f, abbreviation: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter abbreviation (optional)"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditCombinationOpen(false)}
                disabled={combinationLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={combinationLoading || !editCombinationId}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {combinationLoading ? 'Updating Combination...' : 'Update Combination'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add University Dialog */}
      <Dialog open={addUniversityOpen} onOpenChange={(open) => { setAddUniversityOpen(open); if (!open) { setAlumniSelectOpen(false); setCollegeSelectOpen(false); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add University Record
            </DialogTitle>
            <DialogDescription>
              Add a new university record with required alumni and college details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUniversity} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Alumni <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <div
                    onClick={() => { setAlumniSelectOpen(!alumniSelectOpen); setAlumniSelectSearch(''); }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm cursor-pointer dark:bg-gray-800 hover:border-orange-400 transition-colors"
                  >
                    <span className={universityForm.alumn_id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}>
                      {universityForm.alumn_id
                        ? (() => { const k = kidsData.find(a => String(a.id) === String(universityForm.alumn_id)); return k ? `${k.user_first_name || ''} ${k.user_rwandan_name || ''} (${k.user_email || 'ID: ' + k.id})`.trim() : `Kid #${universityForm.alumn_id}`; })()
                        : 'Select a student...'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${alumniSelectOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {alumniSelectOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700">
                      <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            autoFocus
                            value={alumniSelectSearch}
                            onChange={(e) => setAlumniSelectSearch(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {kidsData
                          .filter(k => {
                            if (!alumniSelectSearch.trim()) return true;
                            const q = alumniSelectSearch.toLowerCase();
                            return [k.user_first_name, k.user_rwandan_name, k.user_email, String(k.id)]
                              .filter(Boolean).some(v => v.toLowerCase().includes(q));
                          })
                          .slice(0, 50)
                          .map(k => (
                            <div
                              key={k.id}
                              onClick={() => {
                                setUniversityForm(f => ({ ...f, alumn_id: String(k.id) }));
                                setAlumniSelectOpen(false);
                              }}
                              className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors ${String(universityForm.alumn_id) === String(k.id) ? 'bg-orange-50 dark:bg-gray-700 font-medium' : ''
                                }`}
                            >
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-semibold dark:bg-orange-900 dark:text-orange-300">
                                {(k.user_first_name || '?')[0].toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="truncate font-medium text-gray-900 dark:text-gray-100">{k.user_first_name || ''} {k.user_rwandan_name || ''}</p>
                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{k.user_email || `ID: ${k.id}`}</p>
                              </div>
                            </div>
                          ))}
                        {kidsData.filter(k => {
                          if (!alumniSelectSearch.trim()) return true;
                          const q = alumniSelectSearch.toLowerCase();
                          return [k.user_first_name, k.user_rwandan_name, k.user_email, String(k.id)]
                            .filter(Boolean).some(v => v.toLowerCase().includes(q));
                        }).length === 0 && (
                            <p className="px-3 py-4 text-sm text-center text-gray-400">No students found.</p>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>College <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <div
                    onClick={() => { setCollegeSelectOpen(!collegeSelectOpen); setCollegeSelectSearch(''); }}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm cursor-pointer dark:bg-gray-800 hover:border-orange-400 transition-colors"
                  >
                    <span className={universityForm.college_id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}>
                      {universityForm.college_id
                        ? (() => { const c = collegeData.find(c => String(c.id) === String(universityForm.college_id)); return c ? `${c.college_name} — ${c.country || ''}` : `College #${universityForm.college_id}`; })()
                        : 'Select a college...'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${collegeSelectOpen ? 'rotate-180' : ''}`} />
                  </div>
                  {collegeSelectOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700">
                      <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <input
                            autoFocus
                            value={collegeSelectSearch}
                            onChange={(e) => setCollegeSelectSearch(e.target.value)}
                            placeholder="Search by college name, country, or city..."
                            className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {collegeData
                          .filter(c => {
                            if (!collegeSelectSearch.trim()) return true;
                            const q = collegeSelectSearch.toLowerCase();
                            return [c.college_name, c.country, c.city]
                              .filter(Boolean).some(v => v.toLowerCase().includes(q));
                          })
                          .slice(0, 50)
                          .map(c => (
                            <div
                              key={c.id}
                              onClick={() => {
                                setUniversityForm(f => ({
                                  ...f,
                                  college_id: c.id,
                                  college_name: c.college_name || '',
                                  country: c.country || '',
                                  city: c.city || ''
                                }));
                                setCollegeSelectOpen(false);
                              }}
                              className={`px-3 py-2 text-sm cursor-pointer hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors ${String(universityForm.college_id) === String(c.id) ? 'bg-orange-50 dark:bg-gray-700 font-medium' : ''
                                }`}
                            >
                              <p className="font-medium text-gray-900 dark:text-gray-100">{c.college_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{[c.city, c.country].filter(Boolean).join(', ') || 'No location'}</p>
                            </div>
                          ))}
                        {collegeData.filter(c => {
                          if (!collegeSelectSearch.trim()) return true;
                          const q = collegeSelectSearch.toLowerCase();
                          return [c.college_name, c.country, c.city]
                            .filter(Boolean).some(v => v.toLowerCase().includes(q));
                        }).length === 0 && (
                            <p className="px-3 py-4 text-sm text-center text-gray-400">No colleges found.</p>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    required
                    value={universityForm.country}
                    onChange={(e) => setUniversityForm((f) => ({ ...f, country: e.target.value }))}
                    className={`bg-white dark:bg-gray-800 ${universityForm.college_id ? 'opacity-60' : ''}`}
                    placeholder="Enter country"
                    readOnly={!!universityForm.college_id}
                  />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    required
                    value={universityForm.city}
                    onChange={(e) => setUniversityForm((f) => ({ ...f, city: e.target.value }))}
                    className={`bg-white dark:bg-gray-800 ${universityForm.college_id ? 'opacity-60' : ''}`}
                    placeholder="Enter city"
                    readOnly={!!universityForm.college_id}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Input
                    value={universityForm.degree}
                    onChange={(e) => setUniversityForm((f) => ({ ...f, degree: e.target.value }))}
                    className="bg-white dark:bg-gray-800"
                    placeholder="Ex Business and Economics"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Input
                    value={universityForm.level}
                    onChange={(e) => setUniversityForm((f) => ({ ...f, level: e.target.value }))}
                    className="bg-white dark:bg-gray-800"
                    placeholder="Ex A0"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scholarship</Label>
                  <Input
                    value={universityForm.scholarship}
                    onChange={(e) => setUniversityForm((f) => ({ ...f, scholarship: e.target.value }))}
                    className="bg-white dark:bg-gray-800 placeholder:text-xs"
                    placeholder="Self sponsored, full or partial scholarship"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Enrolled</Label>
                  <select
                    value={universityForm.enrolled ? 'true' : 'false'}
                    onChange={(e) => setUniversityForm((f) => ({ ...f, enrolled: e.target.value === 'true' }))}
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm dark:bg-gray-800"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scholarship Details</Label>
                  <Input
                    value={universityForm.scholarship_details}
                    onChange={(e) => setUniversityForm((f) => ({ ...f, scholarship_details: e.target.value }))}
                    className="bg-white dark:bg-gray-800"
                    placeholder="Enter scholarship details"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select
                    value={universityForm.status || ''}
                    onChange={(e) => setUniversityForm((f) => ({ ...f, status: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm dark:bg-gray-800"
                  >
                    <option value="">Select status...</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Graduated">Graduated</option>
                    <option value="Dropped Out">Dropped Out</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Postponed">Postponed</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddUniversityOpen(false)}
                disabled={universityLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={universityLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {universityLoading ? 'Adding record...' : 'Add university record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add College Dialog */}
      <Dialog open={addCollegeOpen} onOpenChange={setAddCollegeOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add College Record
            </DialogTitle>
            <DialogDescription>
              Add a new college record.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddCollege} className="space-y-4">
            <div className="space-y-2">
              <Label>College Name</Label>
              <Input
                required
                value={collegeForm.college_name}
                onChange={(e) => setCollegeForm((f) => ({ ...f, college_name: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter college name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  required
                  value={collegeForm.country}
                  onChange={(e) => setCollegeForm((f) => ({ ...f, country: e.target.value }))}
                  className="bg-white dark:bg-gray-800"
                  placeholder="Enter country"
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  required
                  value={collegeForm.city}
                  onChange={(e) => setCollegeForm((f) => ({ ...f, city: e.target.value }))}
                  className="bg-white dark:bg-gray-800"
                  placeholder="Enter city"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddCollegeOpen(false)}
                disabled={collegeLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={collegeLoading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {collegeLoading ? 'Adding record...' : 'Add college record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit College Dialog */}
      <Dialog open={editCollegeOpen} onOpenChange={setEditCollegeOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Update College Record
            </DialogTitle>
            <DialogDescription>
              Edit an existing college record from api_college.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCollege} className="space-y-4">
            <div className="space-y-2">
              <Label>Select College Record</Label>
              <Select
                value={editCollegeId || undefined}
                onValueChange={(value) => handleSelectCollegeToEdit(value)}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Choose college record to edit" />
                </SelectTrigger>
                <SelectContent>
                  {collegeData.length > 0 ? (
                    collegeData.map((college) => (
                      <SelectItem key={college.id} value={String(college.id)}>
                        {college.college_name || `College #${college.id}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="-1" className="text-sm text-gray-500 dark:text-gray-400" disabled>
                      No college records available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>College Name</Label>
              <Input
                required
                value={collegeForm.college_name}
                onChange={(e) => setCollegeForm((f) => ({ ...f, college_name: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter college name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  required
                  value={collegeForm.country}
                  onChange={(e) => setCollegeForm((f) => ({ ...f, country: e.target.value }))}
                  className="bg-white dark:bg-gray-800"
                  placeholder="Enter country"
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  required
                  value={collegeForm.city}
                  onChange={(e) => setCollegeForm((f) => ({ ...f, city: e.target.value }))}
                  className="bg-white dark:bg-gray-800"
                  placeholder="Enter city"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditCollegeOpen(false)}
                disabled={collegeLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={collegeLoading || !editCollegeId}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {collegeLoading ? 'Updating record...' : 'Update college record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit University Dialog */}
      <Dialog open={editUniversityOpen} onOpenChange={setEditUniversityOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Update University Record
            </DialogTitle>
            <DialogDescription>
              Select a university record and update its details.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUniversity} className="space-y-4">
            <div className="space-y-2">
              <Label>Select University Record</Label>
              <Select
                value={editUniversityId || undefined}
                onValueChange={(value) => handleSelectUniversityToEdit(value)}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Choose university record to edit" />
                </SelectTrigger>
                <SelectContent>
                  {universityData.length > 0 ? (
                    universityData.map((record) => (
                      <SelectItem key={record.id} value={String(record.id)}>
                        {record.college_name || `University #${record.id}`}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="-1" className="text-sm text-gray-500 dark:text-gray-400" disabled>
                      No university records available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Student <span className="text-red-500">*</span></Label>
              <div className="relative">
                <div
                  onClick={() => { setAlumniSelectOpen(!alumniSelectOpen); setAlumniSelectSearch(''); }}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm cursor-pointer dark:bg-gray-800 hover:border-orange-400 transition-colors"
                >
                  <span className={universityForm.alumn_id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'}>
                    {universityForm.alumn_id
                      ? (() => { const k = kidsData.find(a => String(a.id) === String(universityForm.alumn_id)); return k ? `${k.user_first_name || ''} ${k.user_rwandan_name || ''} (${k.user_email || 'ID: ' + k.id})`.trim() : `Kid #${universityForm.alumn_id}`; })()
                      : 'Select a student...'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${alumniSelectOpen ? 'rotate-180' : ''}`} />
                </div>
                {alumniSelectOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:bg-gray-800 dark:border-gray-700">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          autoFocus
                          value={alumniSelectSearch}
                          onChange={(e) => setAlumniSelectSearch(e.target.value)}
                          placeholder="Search by name or email..."
                          className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-8 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-100"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {kidsData
                        .filter(k => {
                          if (!alumniSelectSearch.trim()) return true;
                          const q = alumniSelectSearch.toLowerCase();
                          return [k.user_first_name, k.user_rwandan_name, k.user_email, String(k.id)]
                            .filter(Boolean).some(v => v.toLowerCase().includes(q));
                        })
                        .slice(0, 50)
                        .map(k => (
                          <div
                            key={k.id}
                            onClick={() => {
                              setUniversityForm(f => ({ ...f, alumn_id: String(k.id) }));
                              setAlumniSelectOpen(false);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors ${String(universityForm.alumn_id) === String(k.id) ? 'bg-orange-50 dark:bg-gray-700 font-medium' : ''
                              }`}
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-700 text-xs font-semibold dark:bg-orange-900 dark:text-orange-300">
                              {(k.user_first_name || '?')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-900 dark:text-gray-100">{k.user_first_name || ''} {k.user_rwandan_name || ''}</p>
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">{k.user_email || `ID: ${k.id}`}</p>
                            </div>
                          </div>
                        ))}
                      {kidsData.filter(k => {
                        if (!alumniSelectSearch.trim()) return true;
                        const q = alumniSelectSearch.toLowerCase();
                        return [k.user_first_name, k.user_rwandan_name, k.user_email, String(k.id)]
                          .filter(Boolean).some(v => v.toLowerCase().includes(q));
                      }).length === 0 && (
                          <p className="px-3 py-4 text-sm text-center text-gray-400">No students found.</p>
                        )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>College Name</Label>
              <Input
                required
                value={universityForm.college_name}
                onChange={(e) => setUniversityForm((f) => ({ ...f, college_name: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter college name"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input
                  required
                  value={universityForm.country}
                  onChange={(e) => setUniversityForm((f) => ({ ...f, country: e.target.value }))}
                  className="bg-white dark:bg-gray-800"
                  placeholder="Enter country"
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  required
                  value={universityForm.city}
                  onChange={(e) => setUniversityForm((f) => ({ ...f, city: e.target.value }))}
                  className="bg-white dark:bg-gray-800"
                  placeholder="Enter city"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Degree</Label>
                <Input
                  required
                  value={universityForm.degree}
                  onChange={(e) => setUniversityForm((f) => ({ ...f, degree: e.target.value }))}
                  className="bg-white dark:bg-gray-800"
                  placeholder="Enter degree"
                />
              </div>
              <div className="space-y-2">
                <Label>Level</Label>
                <Input
                  value={universityForm.level}
                  onChange={(e) => setUniversityForm((f) => ({ ...f, level: e.target.value }))}
                  className="bg-white dark:bg-gray-800"
                  placeholder="Enter level (optional)"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Scholarship</Label>
                <Input
                  value={universityForm.scholarship}
                  onChange={(e) => setUniversityForm((f) => ({ ...f, scholarship: e.target.value }))}
                  className="bg-white dark:bg-gray-800"
                  placeholder="Enter scholarship details"
                />
              </div>
              <div className="space-y-2">
                <Label>Enrolled</Label>
                <select
                  value={universityForm.enrolled ? 'true' : 'false'}
                  onChange={(e) => setUniversityForm((f) => ({ ...f, enrolled: e.target.value === 'true' }))}
                  className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm dark:bg-gray-800"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Scholarship Details</Label>
              <Input
                value={universityForm.scholarship_details}
                onChange={(e) => setUniversityForm((f) => ({ ...f, scholarship_details: e.target.value }))}
                className="bg-white dark:bg-gray-800"
                placeholder="Enter scholarship details (optional)"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditUniversityOpen(false)}
                disabled={universityLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={universityLoading || !editUniversityId}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {universityLoading ? 'Updating record...' : 'Update university record'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </>
  );
}
