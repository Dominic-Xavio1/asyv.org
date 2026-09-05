'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Plus, Users, UserCircle, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import toast from 'react-hot-toast';
import {useConfirmDialog} from "@/components/ui/use-confirm-dialog";

function AlumniByGradeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gradeIdParam = searchParams.get('gradeId');
  const familyIdParam = searchParams.get('familyId');

  const [requestingUserId, setRequestingUserId] = useState(null);
  const [allowed, setAllowed] = useState(false);
  const [grades, setGrades] = useState([]);
  const [gradeDetail, setGradeDetail] = useState(null);
  const [families, setFamilies] = useState([]);
  const [familyDetail, setFamilyDetail] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradeActionLoading, setGradeActionLoading] = useState(false);
  const [familyActionLoading, setFamilyActionLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [addGradeOpen, setAddGradeOpen] = useState(false);
  const [editGradeOpen, setEditGradeOpen] = useState(false);
  const [addFamilyOpen, setAddFamilyOpen] = useState(false);
  const [editFamilyOpen, setEditFamilyOpen] = useState(false);
  const [gradeForm, setGradeForm] = useState({
    grade_name: '',
    admission_year_to_asyv: '',
    graduation_year_to_asyv: '',
  });
  const [editGradeForm, setEditGradeForm] = useState({
    id: '',
    grade_name: '',
    admission_year_to_asyv: '',
    graduation_year_to_asyv: '',
  });
  const [familyForm, setFamilyForm] = useState({
    family_name: '',
    family_number: '',
    mother_id: '',
    grade_id: '',
  });
  const [editFamilyForm, setEditFamilyForm] = useState({
    id: '',
    family_name: '',
    family_number: '',
    mother_id: '',
    grade_id: '',
  });
  const [motherSearch, setMotherSearch] = useState('');
  const [editMotherSearch, setEditMotherSearch] = useState('');
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [addStudentFamilyId, setAddStudentFamilyId] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedKidId, setSelectedKidId] = useState('');
  const [kidsList, setKidsList] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fullInfo = localStorage.getItem('fullInfo');
    if (!fullInfo) {
      router.replace('/login');
      return;
    }
    try {
      const user = JSON.parse(fullInfo);
      if (!user.is_superuser && !user.is_crc) {
        router.replace('/dashboard');
        return;
      }
      setRequestingUserId(String(user.id));
      setAllowed(true);
    } catch {
      router.replace('/login');
    }
  }, [router]);

  const fetchJson = useCallback(
    async (path) => {
      const uid = requestingUserId;
      const url = path.includes('?')
        ? `${path}&requestingUserId=${encodeURIComponent(uid)}`
        : `${path}?requestingUserId=${encodeURIComponent(uid)}`;
      const res = await fetch(url, { headers: { 'x-user-id': String(uid) } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Request failed');
      }
      return data;
    },
    [requestingUserId]
  );

  const refreshGrades = useCallback(async () => {
    if (!requestingUserId) return;
    const data = await fetchJson('/api/manage/alumni-hierarchy');
    setGrades(Array.isArray(data.grades) ? data.grades : []);
  }, [fetchJson, requestingUserId]);

  const refreshGradeDetail = useCallback(async (gradeId) => {
    if (!requestingUserId || !gradeId) return;
    const data = await fetchJson(`/api/manage/alumni-hierarchy?gradeId=${encodeURIComponent(gradeId)}`);
    setGradeDetail(data.grade || null);
    console.log("Grade detail: ", data);
    setFamilies(Array.isArray(data.families) ? data.families : []);
  }, [fetchJson, requestingUserId]);

  useEffect(() => {
    if (!requestingUserId) return;

    const fetchUsers = async () => {
      try {
        const res = await fetch(`/api/manage/users?requestingUserId=${requestingUserId}`, {
          headers: { 'x-user-id': requestingUserId },
        });
        const data = await res.json().catch(() => []);
        if (res.ok && Array.isArray(data)) {
          setUsers(data);
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, [requestingUserId]);

  const mothers = useMemo(
    () => users.filter((user) => user.is_mama === true),
    [users]
  );

  const filteredMothers = useMemo(() => {
    const query = motherSearch.trim().toLowerCase();
    if (!query) return mothers;
    return mothers.filter((mother) => {
      const text = [mother.first_name, mother.rwandan_name, mother.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(query);
    });
  }, [motherSearch, mothers]);

  const filteredEditMothers = useMemo(() => {
    const query = editMotherSearch.trim().toLowerCase();
    if (!query) return mothers;
    return mothers.filter((mother) => {
      const text = [mother.first_name, mother.rwandan_name, mother.email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return text.includes(query);
    });
  }, [editMotherSearch, mothers]);

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    return kidsList.filter((k) => {
      const text = [k.user_first_name, k.user_rwandan_name, k.user_email]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return !q || text.includes(q);
    });
  }, [studentSearch, kidsList]);

  const parseMotherId = (motherId) =>
    motherId && motherId !== 'none' ? Number(motherId) : null;

  const resetGradeForm = () => {
    setGradeForm({
      grade_name: '',
      admission_year_to_asyv: '',
      graduation_year_to_asyv: '',
    });
  };

  const resetEditGradeForm = () => {
    setEditGradeForm({
      id: '',
      grade_name: '',
      admission_year_to_asyv: '',
      graduation_year_to_asyv: '',
    });
  };

  const resetFamilyForm = (gradeId) => {
    setFamilyForm({
      family_name: '',
      family_number: '',
      mother_id: '',
      grade_id: gradeId ? String(gradeId) : '',
    });
  };

  const resetEditFamilyForm = () => {
    setEditFamilyForm({
      id: '',
      family_name: '',
      family_number: '',
      mother_id: '',
      grade_id: '',
    });
  };

  const openAddGradeDialog = () => {
    resetGradeForm();
    setAddGradeOpen(true);
  };

  const openEditGradeDialog = (grade) => {
    setEditGradeForm({
      id: String(grade.id),
      grade_name: grade.grade_name || '',
      admission_year_to_asyv:
        grade.admission_year_to_asyv != null ? String(grade.admission_year_to_asyv) : '',
      graduation_year_to_asyv:
        grade.graduation_year_to_asyv != null ? String(grade.graduation_year_to_asyv) : '',
    });
    setEditGradeOpen(true);
  };

  const openAddFamilyDialog = () => {
    if (!gradeDetail?.id) return;
    setFamilyForm({
      family_name: '',
      family_number: '',
      mother_id: '',
      grade_id: String(gradeDetail.id),
    });
    setAddFamilyOpen(true);
  };

  const loadKidsForPicker = useCallback(async () => {
    if (!requestingUserId) return [];
    const res = await fetch(`/api/manage/kids?requestingUserId=${encodeURIComponent(requestingUserId)}`, {
      headers: { 'x-user-id': requestingUserId },
    });
    const data = await res.json().catch(() => []);
    if (!res.ok || !Array.isArray(data)) {
      throw new Error(data?.error || 'Failed to load students');
    }
    return data;
  }, [requestingUserId]);

  const openAddStudentDialog = async (family) => {
    if (!family?.id) return;
    setAddStudentFamilyId(String(family.id));
    setSelectedKidId('');
    setStudentSearch('');
    setAddStudentOpen(true);

    try {
      const kids = await loadKidsForPicker();
      setKidsList(kids);
    } catch (err) {
      console.error('Failed to fetch kids list:', err);
      toast.error(err.message || 'Could not load students');
      setKidsList([]);
    }
  };

  const openEditFamilyDialog = async (family) => {
    if (!family?.id) return;

    const detailAvailable =
      family.family_number !== undefined &&
      family.mother_id !== undefined &&
      family.grade_id !== undefined;

    let editData = family;

    if (!detailAvailable) {
      try {
        const response = await fetch(`/api/manage/families/${family.id}`, {
          headers: {
            'x-user-id': requestingUserId,
          },
        });
        if (response.ok) {
          editData = await response.json();
        }
      } catch (error) {
        console.error('Unable to load family details for edit:', error);
      }
    }

    setEditFamilyForm({
      id: String(editData.id),
      family_name: editData.family_name || '',
      family_number: editData.family_number || '',
      mother_id: editData.mother_id ? String(editData.mother_id) : '',
      grade_id: editData.grade_id ? String(editData.grade_id) : String(gradeDetail?.id || ''),
    });
    setEditFamilyOpen(true);
  };

  const handleCreateGrade = async (event) => {
     event.preventDefault();
    if (!gradeForm.grade_name.trim()) {
      toast.error('Grade name is required.');
      return;
    }
      try {
      const confirmed = await confirm({
        title: "Confirm creation",
        description: "Are you sure you want to create this grade?",
        confirmText: "Yes, submit",
        cancelText: "Review fields",
        destructive: false,
      })

      if (!confirmed) {
        toast('Submission cancelled')
        return
      }
    } catch (err) {
      console.error('Confirm dialog error', err)
      return
    }
   

    setGradeActionLoading(true);
    try {
      const response = await fetch('/api/manage/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify({
          requestingUserId,
          grade_name: gradeForm.grade_name.trim(),
          admission_year_to_asyv: gradeForm.admission_year_to_asyv.trim()
            ? Number(gradeForm.admission_year_to_asyv.trim())
            : null,
          graduation_year_to_asyv: gradeForm.graduation_year_to_asyv.trim()
            ? Number(gradeForm.graduation_year_to_asyv.trim())
            : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add grade');
      toast.success('Grade created successfully.');
      setAddGradeOpen(false);
      resetGradeForm();
      await refreshGrades();
    } catch (error) {
      toast.error(error.message || 'Could not create grade');
    } finally {
      setGradeActionLoading(false);
    }
  };

  const handleUpdateGrade = async (event) => {
    event.preventDefault();
    if (!editGradeForm.id) {
      toast.error('Select a grade to update.');
      return;
    }
    if (!editGradeForm.grade_name.trim()) {
      toast.error('Grade name is required.');
      return;
    }
      try {
      const confirmed = await confirm({
        title: "Confirm update",
        description: "Are you sure you want to update this grade?",
        confirmText: "Yes, submit",
        cancelText: "Review fields",
        destructive: false,
      })

      if (!confirmed) {
        toast('Submission cancelled')
        return
      }
    } catch (err) {
      console.error('Confirm dialog error', err)
      return
    }

    setGradeActionLoading(true);
    try {
      const response = await fetch(`/api/manage/grades/${editGradeForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify({
          requestingUserId,
          grade_name: editGradeForm.grade_name.trim() || null,
          admission_year_to_asyv: editGradeForm.admission_year_to_asyv.trim()
            ? Number(editGradeForm.admission_year_to_asyv.trim())
            : null,
          graduation_year_to_asyv: editGradeForm.graduation_year_to_asyv.trim()
            ? Number(editGradeForm.graduation_year_to_asyv.trim())
            : null,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update grade');
      toast.success('Grade updated successfully.');
      setEditGradeOpen(false);
      resetEditGradeForm();
      await refreshGrades();
      if (String(gradeDetail?.id) === String(editGradeForm.id)) {
        await refreshGradeDetail(editGradeForm.id);
      }
    } catch (error) {
      toast.error(error.message || 'Could not update grade');
    } finally {
      setGradeActionLoading(false);
    }
  };

  const handleCreateFamily = async (event) => {
    event.preventDefault();
    if (!familyForm.family_name.trim()) {
      toast.error('Family name is required.');
      return;
    }
    if (!familyForm.family_number.trim()) {
      toast.error('Family number is required.');
      return;
    }
    if (!familyForm.grade_id) {
      toast.error('Grade is required to create a family.');
      return;
    }

    setFamilyActionLoading(true);
    try {
      const response = await fetch('/api/manage/families', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify({
          requestingUserId,
          family_name: familyForm.family_name.trim(),
          family_number: familyForm.family_number.trim() || null,
          mother_id: parseMotherId(familyForm.mother_id),
          grade_id: Number(familyForm.grade_id),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to add family');
      toast.success('Family created successfully.');
      setAddFamilyOpen(false);
      resetFamilyForm(gradeDetail?.id);
      if (gradeDetail?.id) await refreshGradeDetail(gradeDetail.id);
    } catch (error) {
      toast.error(error.message || 'Could not create family');
    } finally {
      setFamilyActionLoading(false);
    }
  };

  const handleUpdateFamily = async (event) => {
    event.preventDefault();
    if (!editFamilyForm.id) {
      toast.error('Select a family to update.');
      return;
    }
    if (!editFamilyForm.family_name.trim()) {
      toast.error('Family name is required.');
      return;
    }
    if (!editFamilyForm.family_number.trim()) {
      toast.error('Family number is required.');
      return;
    }
    setFamilyActionLoading(true);
    try {
      const payload = {
        requestingUserId,
        family_name: editFamilyForm.family_name.trim() || null,
        family_number: editFamilyForm.family_number.trim() || null,
        mother_id: parseMotherId(editFamilyForm.mother_id),
      };
      if (editFamilyForm.grade_id !== '') {
        payload.grade_id = Number(editFamilyForm.grade_id);
      }

      const response = await fetch(`/api/manage/families/${editFamilyForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': requestingUserId,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update family');
      toast.success('Family updated successfully.');
      setEditFamilyOpen(false);
      resetEditFamilyForm();
      if (gradeDetail?.id) await refreshGradeDetail(gradeDetail.id);
      if (String(familyDetail?.id) === String(editFamilyForm.id)) {
        const data = await fetchJson(
          `/api/manage/alumni-hierarchy?familyId=${encodeURIComponent(editFamilyForm.id)}`
        );
        setFamilyDetail(data.family || null);
        setStudents(Array.isArray(data.students) ? data.students : []);
      }
    } catch (error) {
      toast.error(error.message || 'Could not update family');
    } finally {
      setFamilyActionLoading(false);
    }
  };

  const handleAddStudentToFamily = async (event) => {
    event?.preventDefault?.();
    if (!addStudentFamilyId) {
      toast.error('No family selected.');
      return;
    }
    if (!selectedKidId) {
      toast.error('Select a student to add.');
      return;
    }

    const kidRecord = kidsList.find((k) => String(k.id) === String(selectedKidId));
    if (!kidRecord) {
      toast.error('Selected student is no longer available. Close and reopen the dialog.');
      return;
    }

    if (String(kidRecord.family_id) === String(addStudentFamilyId)) {
      toast.error('This student is already in this family.');
      return;
    }

    setFamilyActionLoading(true);
    try {
      const res = await fetch(`/api/manage/kids/${kidRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-user-id': requestingUserId },
        body: JSON.stringify({
          requestingUserId,
          family_id: Number(addStudentFamilyId),
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.error || 'Failed to link student to family');

      toast.success('Student assigned to family successfully.');
      setAddStudentOpen(false);
      setSelectedKidId('');
      setStudentSearch('');

      if (gradeDetail?.id) {
        await refreshGradeDetail(gradeDetail.id);
      }

      if (familyDetail && String(familyDetail.id) === String(addStudentFamilyId)) {
        const data = await fetchJson(
          `/api/manage/alumni-hierarchy?familyId=${encodeURIComponent(addStudentFamilyId)}`
        );
        setFamilyDetail(data.family || null);
        setStudents(Array.isArray(data.students) ? data.students : []);
      }

      try {
        const kids = await loadKidsForPicker();
        setKidsList(kids);
      } catch {
        setKidsList((prev) =>
          prev.map((k) =>
            String(k.id) === String(kidRecord.id)
              ? { ...k, family_id: Number(addStudentFamilyId) }
              : k
          )
        );
      }
    } catch (err) {
      console.error('Error linking student to family:', err);
      toast.error(err.message || 'Could not link student to family');
    } finally {
      setFamilyActionLoading(false);
    }
  };
  useEffect(() => {
    if (!requestingUserId || !allowed) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (familyIdParam) {
          const data = await fetchJson(
            `/api/manage/alumni-hierarchy?familyId=${encodeURIComponent(familyIdParam)}`
          );
          if (cancelled) return;
          setFamilyDetail(data.family);
          setStudents(Array.isArray(data.students) ? data.students : []);
          if (gradeIdParam) {
            const g = await fetchJson(
              `/api/manage/alumni-hierarchy?gradeId=${encodeURIComponent(gradeIdParam)}`
            ).catch(() => null);
            if (!cancelled && g?.grade) setGradeDetail(g.grade);
          } else if (data.family?.grade_id) {
            const g = await fetchJson(
              `/api/manage/alumni-hierarchy?gradeId=${encodeURIComponent(String(data.family.grade_id))}`
            ).catch(() => null);
            if (!cancelled && g?.grade) setGradeDetail(g.grade);
          }
          setGrades([]);
          setFamilies([]);
        } else if (gradeIdParam) {
          const data = await fetchJson(
            `/api/manage/alumni-hierarchy?gradeId=${encodeURIComponent(gradeIdParam)}`
          );
          if (cancelled) return;
          setGradeDetail(data.grade);
          setFamilies(Array.isArray(data.families) ? data.families : []);
          setGrades([]);
          setFamilyDetail(null);
          setStudents([]);
        } else {
          const data = await fetchJson('/api/manage/alumni-hierarchy');
          if (cancelled) return;
          setGrades(Array.isArray(data.grades) ? data.grades : []);
          setGradeDetail(null);
          setFamilies([]);
          setFamilyDetail(null);
          setStudents([]);
        }
      } catch (e) {
        if (!cancelled) toast.error(e.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [requestingUserId, allowed, gradeIdParam, familyIdParam, fetchJson]);
const [confirm,confirmDialog] = useConfirmDialog();
  const title = useMemo(() => {
    if (familyDetail) return familyDetail.family_name || 'Family';
    if (gradeDetail) return gradeDetail.grade_name || 'Grade';
    return 'Alumni by grade';
  }, [familyDetail, gradeDetail]);

  const goGrades = () => router.push('/management/alumni-by-grade');
  const goGrade = (id) => router.push(`/management/alumni-by-grade?gradeId=${id}`);
  const goFamily = (gradeId, familyId) =>
    router.push(`/management/alumni-by-grade?gradeId=${gradeId}&familyId=${familyId}`);

  if (!allowed || requestingUserId === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 pt-20 pb-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <Button variant="outline" size="sm" className="gap-2 w-fit" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>
          <div className="flex justify-end">
            {gradeDetail ? (
              <Button type="button" size="sm" className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={openAddFamilyDialog} disabled={familyActionLoading}>
                <Plus className="h-4 w-4" />
                Add Family
              </Button>
            ) : (
              <Button type="button" size="sm" className="gap-2 bg-orange-600 hover:bg-orange-700" onClick={openAddGradeDialog} disabled={gradeActionLoading}>
                <Plus className="h-4 w-4" />
                Add Grade
              </Button>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <button
              type="button"
              onClick={goGrades}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Grades
            </button>
            {gradeDetail && (
              <>
                <span>/</span>
                <button
                  type="button"
                  onClick={() => goGrade(gradeDetail.id)}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors truncate max-w-[10rem] sm:max-w-xs"
                >
                  {gradeDetail.grade_name}
                </button>
              </>
            )}
            {familyDetail && (
              <>
                <span>/</span>
                <div className="flex items-center gap-2 max-w-full">
                  <span className="text-gray-800 dark:text-gray-200 truncate max-w-[10rem] sm:max-w-xs">
                    {familyDetail.family_name}
                  </span>
                  {(familyDetail.mother_first_name || familyDetail.mother_rwandan_name) && (
                    <span className="text-xl text-gray-900 dark:text-gray-400 truncate max-w-[10rem] sm:max-w-xs font-bold">
                      Mother: {[familyDetail.mother_first_name, familyDetail.mother_rwandan_name].filter(Boolean).join(' ')}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <GraduationCap className="h-7 w-7 text-emerald-600 dark:text-emerald-400 shrink-0" />
            {title}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Browse graduating cohorts, families, and alumni linked the same way as the overview API.
          </p>
        </div>

        {loading ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-16">Loading...</p>
        ) : familyDetail ? (
          <div className="space-y-4">
            {students.length === 0 ? (
              <Card className="border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <CardContent className="py-10 text-center text-gray-500 dark:text-gray-400">
                  No alumni students linked to this family.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {students.map((s) => (
                  <Link key={s.id} href={`/management/user/${s.id}`}>
                    <Card className="border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all cursor-pointer h-full">
                      <CardHeader className="pb-2 flex flex-row items-start gap-3 space-y-0">
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-2">
                          <UserCircle className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {[s.first_name, s.rwandan_name].filter(Boolean).join(' ') || 'Alumnus'}
                          </CardTitle>
                          {s.email && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{s.email}</p>
                          )}
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : gradeDetail ? (
          <div className="space-y-4">
            {families.length === 0 ? (
              <Card className="border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <CardContent className="py-10 text-center text-gray-500 dark:text-gray-400">
                  No families with alumni students in this grade.
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {families.map((f) => (
                  <div key={f.id} className="rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500">
                    <button
                      type="button"
                      onClick={() => goFamily(gradeDetail.id, f.id)}
                      className="text-left rounded-xl w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                    >
                      <Card className="border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all h-full w-full">
                        <CardHeader className="pb-2 flex flex-row items-start gap-3 space-y-0">
                          <div className="rounded-lg bg-amber-50 dark:bg-amber-900/25 p-2">
                            <Users className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {f.family_name || `Family #${f.id}`}
                            </CardTitle>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {f.alumni_count} alumni
                            </p>
                          </div>
                        </CardHeader>
                      </Card>
                    </button>
                    <div className="mt-2 flex justify-end gap-2">
                      {/* <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await openAddStudentDialog(f);
                        }}
                        disabled={familyActionLoading}
                      >
                        Add Student
                      </Button> */}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await openEditFamilyDialog(f);
                        }}
                        disabled={familyActionLoading}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grades.map((g) => (
              <div key={g.id} className="rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500">
                <button
                  type="button"
                  onClick={() => goGrade(g.id)}
                  className="text-left rounded-xl w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <Card className="border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all h-full w-full">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 p-2">
                          <GraduationCap className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                        </div>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                          {g.alumni_family_count ?? 0} famil{Number(g.alumni_family_count) === 1 ? 'y' : 'ies'}
                        </span>
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-3">
                        {g.grade_name || `Grade #${g.id}`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                      {g.graduation_year_to_asyv != null && (
                        <p>Graduation year: {g.graduation_year_to_asyv}</p>
                      )}
                      {g.admission_year_to_asyv != null && (
                        <p>Admission year: {g.admission_year_to_asyv}</p>
                      )}
                    </CardContent>
                  </Card>
                </button>
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => openEditGradeDialog(g)}
                    disabled={gradeActionLoading}
                  >
                    Update
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog
        open={addGradeOpen}
        onOpenChange={(open) => {
          setAddGradeOpen(open);
          if (!open) resetGradeForm();
        }}
      >
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900 ">
          <DialogHeader>
            <DialogTitle>Add Grade</DialogTitle>
            <DialogDescription>Create a new alumni grade with optional year details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateGrade} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="grade-name">Grade name</Label>
                <Input
                  id="grade-name"
                  value={gradeForm.grade_name}
                  onChange={(event) => setGradeForm((form) => ({ ...form, grade_name: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="admission-year">Admission year</Label>
                <Input
                  id="admission-year"
                  type="number"
                  value={gradeForm.admission_year_to_asyv}
                  onChange={(event) => setGradeForm((form) => ({ ...form, admission_year_to_asyv: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="graduation-year">Graduation year</Label>
                <Input
                  id="graduation-year"
                  type="number"
                  value={gradeForm.graduation_year_to_asyv}
                  onChange={(event) => setGradeForm((form) => ({ ...form, graduation_year_to_asyv: event.target.value }))}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddGradeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={gradeActionLoading} className="bg-orange-600 hover:bg-orange-700">
                Save Grade
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Add Student to Family Dialog */}
      <Dialog open={addStudentOpen} onOpenChange={(open) => { setAddStudentOpen(open); if (!open) { setSelectedKidId(''); setStudentSearch(''); } }}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Add Student to Family</DialogTitle>
            <DialogDescription>
              Select a student from all kid records to assign to this family.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStudentToFamily} className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="student-search">Search student</Label>
              <Input
                id="student-search"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by name or email"
              />
            </div>
            <div className="max-h-56 overflow-y-auto border rounded-md bg-white dark:bg-gray-800">
              {filteredStudents.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No students found.</div>
              ) : (
                filteredStudents.map((student) => {
                  const alreadyInTargetFamily =
                    student.family_id != null &&
                    String(student.family_id) === String(addStudentFamilyId);
                  const currentFamilyLabel =
                    student.family_name && !alreadyInTargetFamily
                      ? `Current: ${student.family_name}`
                      : null;
                  return (
                    <button
                      type="button"
                      key={student.id}
                      className={`w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-gray-700 ${selectedKidId === String(student.id) ? 'bg-neutral-100 dark:bg-gray-700' : ''}`}
                      onClick={() => setSelectedKidId(String(student.id))}
                      disabled={alreadyInTargetFamily}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="font-medium">{[student.user_first_name, student.user_rwandan_name].filter(Boolean).join(' ') || student.user_email}</div>
                          <div className="text-xs text-gray-500">{student.user_email || ''}</div>
                          {currentFamilyLabel && (
                            <div className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{currentFamilyLabel}</div>
                          )}
                        </div>
                        {alreadyInTargetFamily && <div className="text-xs text-red-500 shrink-0">Already in family</div>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddStudentOpen(false)} disabled={familyActionLoading}>Cancel</Button>
              <Button type="submit" disabled={familyActionLoading || !selectedKidId} className="bg-orange-600 hover:bg-orange-700">Add Student</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editGradeOpen}
        onOpenChange={(open) => {
          setEditGradeOpen(open);
          if (!open) resetEditGradeForm();
        }}
      >
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>Update the selected grade details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateGrade} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-grade-name">Grade name</Label>
                <Input
                  id="edit-grade-name"
                  value={editGradeForm.grade_name}
                  onChange={(event) => setEditGradeForm((form) => ({ ...form, grade_name: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-admission-year">Admission year</Label>
                <Input

                  id="edit-admission-year"
                  type="number"
                  value={editGradeForm.admission_year_to_asyv}
                  onChange={(event) => setEditGradeForm((form) => ({ ...form, admission_year_to_asyv: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-graduation-year">Graduation year</Label>
                <Input
                  id="edit-graduation-year"
                  type="number"
                  value={editGradeForm.graduation_year_to_asyv}
                  onChange={(event) => setEditGradeForm((form) => ({ ...form, graduation_year_to_asyv: event.target.value }))}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditGradeOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={gradeActionLoading} className="bg-orange-600 hover:bg-orange-700">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addFamilyOpen}
        onOpenChange={(open) => {
          setAddFamilyOpen(open);
          if (!open) {
            resetFamilyForm(gradeDetail?.id);
            setMotherSearch('');
          }
        }}
      >
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Add Family</DialogTitle>
            <DialogDescription>
              Create a new family for <strong>{gradeDetail?.grade_name}</strong> and select a mother if available.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateFamily} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="family-name">Family name</Label>
                <Input
                  id="family-name"
                  value={familyForm.family_name}
                  onChange={(event) => setFamilyForm((form) => ({ ...form, family_name: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="family-number">Family number</Label>
                <Input
                  id="family-number"
                  value={familyForm.family_number}
                  onChange={(event) => setFamilyForm((form) => ({ ...form, family_number: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="family-mother">Mother</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      id="family-mother"
                    >
                      {familyForm.mother_id && familyForm.mother_id !== 'none'
                        ? mothers.find((m) => String(m.id) === familyForm.mother_id)?.first_name ||
                        mothers.find((m) => String(m.id) === familyForm.mother_id)?.email
                        : 'Select a mother'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search..."
                        value={motherSearch}
                        onChange={(e) => setMotherSearch(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <ScrollArea className="h-48 w-full">
                      <div className="p-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start font-normal text-sm h-8 px-2 mb-0.5"
                          onClick={() => {
                            setFamilyForm((form) => ({ ...form, mother_id: 'none' }));
                            setMotherSearch('');
                          }}
                        >
                          <Check className={`mr-2 h-3 w-3 ${familyForm.mother_id === 'none' ? 'opacity-100' : 'opacity-0'}`} />
                          None
                        </Button>
                        {filteredMothers.map((mother) => (
                          <Button
                            key={mother.id}
                            variant="ghost"
                            className="w-full justify-start font-normal text-sm h-8 px-2 mb-0.5"
                            onClick={() => {
                              setFamilyForm((form) => ({ ...form, mother_id: String(mother.id) }));
                              setMotherSearch('');
                            }}
                          >
                            <Check
                              className={`mr-2 h-3 w-3 ${familyForm.mother_id === String(mother.id) ? 'opacity-100' : 'opacity-0'
                                }`}
                            />
                            {[mother.first_name, mother.rwandan_name].filter(Boolean).join(' ') || mother.email}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddFamilyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={familyActionLoading} className="bg-orange-600 hover:bg-orange-700">
                Save Family
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editFamilyOpen}
        onOpenChange={(open) => {
          setEditFamilyOpen(open);
          if (!open) {
            resetEditFamilyForm();
            setEditMotherSearch('');
          }
        }}
      >
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Edit Family</DialogTitle>
            <DialogDescription>Update family details and adjust the linked mother.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateFamily} className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-family-name">Family name</Label>
                <Input
                  id="edit-family-name"
                  value={editFamilyForm.family_name}
                  onChange={(event) => setEditFamilyForm((form) => ({ ...form, family_name: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-family-number">Family number</Label>
                <Input
                  id="edit-family-number"
                  value={editFamilyForm.family_number}
                  onChange={(event) => setEditFamilyForm((form) => ({ ...form, family_number: event.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-family-mother">Mother</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      id="edit-family-mother"
                    >
                      {editFamilyForm.mother_id && editFamilyForm.mother_id !== 'none'
                        ? mothers.find((m) => String(m.id) === editFamilyForm.mother_id)?.first_name ||
                        mothers.find((m) => String(m.id) === editFamilyForm.mother_id)?.email
                        : 'Select a mother'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="start">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="Search..."
                        value={editMotherSearch}
                        onChange={(e) => setEditMotherSearch(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <ScrollArea className="h-48 w-full">
                      <div className="p-1">
                        <Button
                          variant="ghost"
                          className="w-full justify-start font-normal text-sm h-8 px-2 mb-0.5"
                          onClick={() => {
                            setEditFamilyForm((form) => ({ ...form, mother_id: 'none' }));
                            setEditMotherSearch('');
                          }}
                        >
                          <Check className={`mr-2 h-3 w-3 ${editFamilyForm.mother_id === 'none' ? 'opacity-100' : 'opacity-0'}`} />
                          None
                        </Button>
                        {filteredEditMothers.map((mother) => (
                          <Button
                            key={mother.id}
                            variant="ghost"
                            className="w-full justify-start font-normal text-sm h-8 px-2 mb-0.5"
                            onClick={() => {
                              setEditFamilyForm((form) => ({ ...form, mother_id: String(mother.id) }));
                              setEditMotherSearch('');
                            }}
                          >
                            <Check
                              className={`mr-2 h-3 w-3 ${editFamilyForm.mother_id === String(mother.id) ? 'opacity-100' : 'opacity-0'
                                }`}
                            />
                            {[mother.first_name, mother.rwandan_name].filter(Boolean).join(' ') || mother.email}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditFamilyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={familyActionLoading} className="bg-orange-600 hover:bg-orange-700">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  );
}

export default function AlumniByGradePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      }
    >
      <AlumniByGradeContent />
    </Suspense>
  );
}
