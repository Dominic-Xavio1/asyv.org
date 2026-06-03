'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Users,
  GraduationCap,
  BookOpen,
  Edit2,
  Trash2,
  Plus,
  X,
  FileText,
  Upload,
  Briefcase,
  Building,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

const authHeaders = (userId) => ({
  'Content-Type': 'application/json',
  'x-user-id': String(userId),
});

export default function KidDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kidId = params.kidId;
  const [requestingUserId, setRequestingUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ kid: null, family: null, grade: null, academics: [], furtherEducation: [], employment: [], reports: [] });
  const [grades, setGrades] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [families, setFamilies] = useState([]);

  // Dialogs
  const [kidDialogOpen, setKidDialogOpen] = useState(false);
  const [familyDialogOpen, setFamilyDialogOpen] = useState(false);
  const [creatingFamily, setCreatingFamily] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [academicDialogOpen, setAcademicDialogOpen] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);

  const [kidForm, setKidForm] = useState({});
  const [familyForm, setFamilyForm] = useState({});
  const [gradeForm, setGradeForm] = useState({});
  const [academicForm, setAcademicForm] = useState({});
  const [editingAcademic, setEditingAcademic] = useState(null);
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    report_file: '',
    report_type: 'academic'
  });
  const [editingReport, setEditingReport] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [confirm, confirmDialog] = useConfirmDialog();

  const fetchDetails = useCallback(async () => {
    if (!kidId || !requestingUserId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/manage/kids/${kidId}?requestingUserId=${encodeURIComponent(requestingUserId)}`,
        { headers: { 'x-user-id': requestingUserId } }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch kid details');
      }
      const json = await res.json();
console.log("Returned information ",json);
      // Fetch reports separately
      const reportsRes = await fetch(
        `/api/manage/student-reports?studentId=${kidId}`,
        { headers: { 'x-user-id': requestingUserId } }
      );
      const reportsData = reportsRes.ok ? await reportsRes.json() : { reports: [] };

      setData({
        kid: json.kid,
        family: json.family,
        grade: json.grade,
        academics: json.academics || [],
        furtherEducation: json.furtherEducation || [],
        employment: json.employment || [],
        reports: reportsData.reports || [],
      });
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to load kid details');
    } finally {
      setLoading(false);
    }
  }, [kidId, requestingUserId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fullInfo = localStorage.getItem('fullInfo');
    if (!fullInfo) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(fullInfo);
      if (!user.is_superuser) {
        router.push('/dashboard');
        return;
      }
      setRequestingUserId(String(user.id));
    } catch (_) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (requestingUserId) fetchDetails();
  }, [requestingUserId, fetchDetails]);

  useEffect(() => {
    if (!requestingUserId) return;
    const loadOptions = async () => {
      try {
        const [gradesRes, combinationsRes, familiesRes] = await Promise.all([
          fetch(`/api/manage/grades?requestingUserId=${requestingUserId}`, { headers: { 'x-user-id': requestingUserId } }),
          fetch(`/api/manage/combinations?requestingUserId=${requestingUserId}`, { headers: { 'x-user-id': requestingUserId } }),
          fetch(`/api/manage/families?requestingUserId=${requestingUserId}`, { headers: { 'x-user-id': requestingUserId } }),
        ]);
        if (gradesRes.ok) setGrades((await gradesRes.json()) || []);
        if (combinationsRes.ok) setCombinations((await combinationsRes.json()) || []);
        if (familiesRes.ok) setFamilies((await familiesRes.json()) || []);
      } catch (e) {
        console.error('Error loading options:', e);
      }
    };
    loadOptions();
  }, [requestingUserId]);

  const openKidEdit = () => {
    const k = data.kid;
    if (!k) return;
    setKidForm({
      origin_district: k.origin_district ?? '',
      origin_sector: k.origin_sector ?? '',
      current_district_or_city: k.current_district_or_city ?? '',
      current_country: k.current_country ?? '',
      health_issue: k.health_issue ?? '',
      marital_status: k.marital_status ?? '',
      life_status: k.life_status ?? '',
      has_children: k.has_children ?? '',
      points_in_national_exam: k.points_in_national_exam ?? '',
      maximum_points_in_national_exam: k.maximum_points_in_national_exam ?? '',
      mention: k.mention ?? '',
      user_id: k.user_id ?? '',
      family_id: k.family_id ?? '',
      graduation_status: k.graduation_status ?? '',
    });
    setKidDialogOpen(true);
  };

  const submitKid = async (e) => {
    e.preventDefault();
    try {
      const body = { ...kidForm, requestingUserId };
      const res = await fetch(`/api/manage/kids/${kidId}`, {
        method: 'PUT',
        headers: authHeaders(requestingUserId),
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update kid');
      toast.success('Kid updated');
      setKidDialogOpen(false);
      fetchDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to update kid');
    }
  };

  const openFamilyEdit = () => {
    const f = data.family;
    setCreatingFamily(!f);
    if (!f) {
      setFamilyForm({ family_name: '', family_number: '', mother_id: '', grade_id: '' });
      setFamilyDialogOpen(true);
      return;
    }
    setFamilyForm({
      family_name: f.family_name ?? '',
      family_number: f.family_number ?? '',
      mother_id: f.mother_id ?? '',
      grade_id: f.grade_id ?? '',
    });
    setFamilyDialogOpen(true);
  };

  const submitFamily = async (e) => {
    e.preventDefault();
    try {
      if (creatingFamily) {
        const body = { ...familyForm, requestingUserId };
        const res = await fetch('/api/manage/families', {
          method: 'POST',
          headers: authHeaders(requestingUserId),
          body: JSON.stringify(body),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to create family');
        const newFamilyId = result.family?.id;
        if (newFamilyId) {
          const updateRes = await fetch(`/api/manage/kids/${kidId}`, {
            method: 'PUT',
            headers: authHeaders(requestingUserId),
            body: JSON.stringify({ family_id: newFamilyId, requestingUserId }),
          });
          const updateResult = await updateRes.json();
          if (!updateRes.ok) throw new Error(updateResult.error || 'Failed to link kid to family');
        }
        toast.success('Family created and linked');
      } else {
        const familyId = data.family?.id;
        if (!familyId) {
          toast.error('No family linked.');
          return;
        }
        const body = { ...familyForm, requestingUserId };
        const res = await fetch(`/api/manage/families/${familyId}`, {
          method: 'PUT',
          headers: authHeaders(requestingUserId),
          body: JSON.stringify(body),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to update family');
        toast.success('Family updated');
      }
      setFamilyDialogOpen(false);
      setCreatingFamily(false);
      fetchDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to save family');
    }
  };

  const openGradeEdit = () => {
    const g = data.grade;
    if (!g) {
      setGradeForm({ grade_name: '', admission_year_to_asyv: '', graduation_year_to_asyv: '' });
      setGradeDialogOpen(true);
      return;
    }
    setGradeForm({
      grade_name: g.grade_name ?? '',
      admission_year_to_asyv: g.admission_year_to_asyv ?? '',
      graduation_year_to_asyv: g.graduation_year_to_asyv ?? '',
    });
    setGradeDialogOpen(true);
  };

  const submitGrade = async (e) => {
    e.preventDefault();
    const gradeId = data.grade?.id;
    if (!gradeId) {
      toast.error('No grade linked. Set family grade first.');
      return;
    }
    try {
      const body = { ...gradeForm, requestingUserId };
      const res = await fetch(`/api/manage/grades/${gradeId}`, {
        method: 'PUT',
        headers: authHeaders(requestingUserId),
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to update grade');
      toast.success('Grade updated');
      setGradeDialogOpen(false);
      fetchDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to update grade');
    }
  };

  const openAcademicAdd = () => {
    setEditingAcademic(null);
    setAcademicForm({
      academic_year: '',
      combination_id: '',
      level: '',
      marks: '',
      report_card: '',
    });
    setAcademicDialogOpen(true);
  };

  const openAcademicEdit = (ac) => {
    setEditingAcademic(ac);
    setAcademicForm({
      academic_year: ac.academic_year ?? '',
      combination_id: ac.combination_id ?? '',
      level: ac.level ?? '',
      marks: ac.marks ?? '',
      report_card: ac.report_card ?? '',
    });
    setAcademicDialogOpen(true);
  };

  const submitAcademic = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...academicForm,
        kid_id: kidId,
        requestingUserId,
      };
      if (editingAcademic) {
        const res = await fetch(`/api/manage/kidacademics/${editingAcademic.id}`, {
          method: 'PUT',
          headers: authHeaders(requestingUserId),
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to update academic');
        toast.success('Academic record updated');
      } else {
        const res = await fetch('/api/manage/kidacademics', {
          method: 'POST',
          headers: authHeaders(requestingUserId),
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to add academic');
        toast.success('Academic record added');
      }
      setAcademicDialogOpen(false);
      fetchDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to save academic');
    }
  };

  const deleteAcademic = async (id) => {
    const confirmed = await confirm({
      title: 'Delete academic record',
      description: 'Delete this academic record?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    })
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/manage/kidacademics/${id}?requestingUserId=${requestingUserId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': requestingUserId },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete');
      toast.success('Academic record deleted');
      fetchDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  // Report handling functions
  const openReportAdd = () => {
    setEditingReport(null);
    setReportForm({
      title: '',
      description: '',
      report_file: '',
      report_type: 'academic'
    });
    setReportDialogOpen(true);
  };

  const openReportEdit = (report) => {
    setEditingReport(report);
    setReportForm({
      title: report.title || '',
      description: report.description || '',
      report_file: report.report_file || '',
      report_type: report.report_type || 'academic'
    });
    setReportDialogOpen(true);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploadingFile(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('studentId', kidId);
      formData.append('reportType', reportForm.report_type);

      const response = await fetch('/api/upload/report', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'File upload failed');
      }

      setReportForm(prev => ({
        ...prev,
        report_file: result.mediaUrl
      }));

      toast.success('File uploaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...reportForm,
        student_id: kidId,
        requestingUserId,
      };

      if (editingReport) {
        console.log("Editing report ", editingReport);
        const res = await fetch(`/api/manage/student-reports`, {
          method: 'PUT',
          headers: authHeaders(requestingUserId),
          body: JSON.stringify(editingReport),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to update report');
        toast.success('Report updated successfully');
      } else {
        const res = await fetch('/api/manage/student-reports', {
          method: 'POST',
          headers: authHeaders(requestingUserId),
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Failed to add report');
        toast.success('Report added successfully');
      }

      setReportDialogOpen(false);
      fetchDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to save report');
    }
  };

  const deleteReport = async (id) => {
    const confirmed = await confirm({
      title: 'Delete report',
      description: 'Delete this report?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
    });
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/manage/student-reports?id=${id}`, {
        method: 'DELETE',
        headers: authHeaders(requestingUserId),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to delete');
      toast.success('Report deleted successfully');
      fetchDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to delete');
    }
  };

  if (loading && !data.kid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!data.kid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Kid not found.</p>
          <Link href="/management/advanced">
            <Button variant="outline">Back to Advanced Management</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { kid, family, grade, academics, furtherEducation, employment, reports } = data;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 pt-20 pb-12 px-4">
      <div className="top-30 left-10 fixed ">
          {/* <Link href="/management/advanced"> */}
            <Button variant="outline" size="sm" className="gap-2"
            onClick={()=>router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Go back
            </Button>
          {/* </Link> */}
        </div>
      <div className="max-w-4xl mx-auto mt-5">
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
          {kid.user_first_name || kid.user_rwandan_name || 'Kid'} – Details{console.log("The information of the person ",kid)}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          User: {kid.user_email || kid.user_id || '-'} · Kid ID: {kid.id}
        </p>

        <div className="space-y-6">
          {/* Kid */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <User className="h-5 w-5" />
                  Kid Information
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Origin, location, status
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={openKidEdit}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500 dark:text-gray-400">Origin District</span><br />{kid.origin_district ?? '-'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Origin Sector</span><br />{kid.origin_sector ?? '-'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Current District/City</span><br />{kid.current_district_or_city ?? '-'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Current Country</span><br />{kid.current_country ?? '-'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Health Issue</span><br />{kid.health_issue ?? '-'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Marital Status</span><br />{kid.marital_status ?? '-'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Life Status</span><br />{kid.life_status ?? '-'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Has Children</span><br />{kid.has_children != null ? String(kid.has_children) : '-'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Points (National Exam)</span><br />{kid.points_in_national_exam ?? '-'} / {kid.maximum_points_in_national_exam ?? '-'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Mention</span><br />{kid.mention ?? '-'}</div>
              <div><span className="text-gray-500 dark:text-gray-400">Graduation Status</span><br />{kid.graduation_status ?? '-'}</div>
            </CardContent>
          </Card>

          {/* Family */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Users className="h-5 w-5" />
                  Family
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Family and mother
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={openFamilyEdit}>
                {family ? <><Edit2 className="h-4 w-4 mr-1" /> Edit</> : <><Plus className="h-4 w-4 mr-1" /> Create & link family</>}
              </Button>
            </CardHeader>
            <CardContent>
              {family ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">Family Name</span><br />{family.family_name ?? '-'}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Family Number</span><br />{family.family_number ?? '-'}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Mother</span><br />{family.mother_first_name || family.mother_rwandan_name || family.mother_id || '-'}</div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No family linked. Edit Kid to set family_id.</p>
              )}
            </CardContent>
          </Card>

          {/* Grade */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <GraduationCap className="h-5 w-5" />
                  Grade
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  ASYV grade (via family)
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={openGradeEdit} disabled={!grade}>
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </CardHeader>
            <CardContent>
              {grade ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500 dark:text-gray-400">Grade Name</span><br />{grade.grade_name ?? '-'}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Admission Year (ASYV)</span><br />{grade.admission_year_to_asyv ?? '-'}</div>
                  <div><span className="text-gray-500 dark:text-gray-400">Graduation Year (ASYV)</span><br />{grade.graduation_year_to_asyv ?? '-'}</div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No grade linked. Set family grade first.</p>
              )}
            </CardContent>
          </Card>

          {/* Reports */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <FileText className="h-5 w-5" />
                  Reports
                </CardTitle>
                <CardDescription>Student reports and documents</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={openReportAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Add Report
              </Button>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No reports found. Click Add to create one.</p>
              ) : (
                <ul className="space-y-3">
                  {reports.map((report) => (
                    <li
                      key={report.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{report.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {report.report_type || 'academic'}
                          </Badge>
                        </div>
                        {report.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{report.description}</p>
                        )}
                        {report.report_file && (
                          <div className="flex items-center gap-2">
                            <a
                              href={report.report_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                            >
                              <FileText className="h-4 w-4" />
                              View Report
                            </a>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {new Date(report.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openReportEdit(report)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteReport(report.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Academics */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <BookOpen className="h-5 w-5" />
                  Academics
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Academic years and combinations
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={openAcademicAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {academics.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No academic records. Click Add to create one.</p>
              ) : (
                <ul className="space-y-3">
                  {academics.map((ac) => (
                    <li
                      key={ac.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <div>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{ac.academic_year}</span>
                        {ac.combination_name && (
                          <span className="ml-2 text-gray-600 dark:text-gray-400">
                            {ac.combination_name} {ac.abbreviation ? `(${ac.abbreviation})` : ''}
                          </span>
                        )}
                        {ac.level && <span className="ml-2 text-gray-500">Level: {ac.level}</span>}
                        {ac.marks != null && <span className="ml-2 text-gray-500">Marks: {ac.marks}</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openAcademicEdit(ac)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => deleteAcademic(ac.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Further Education */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <GraduationCap className="h-5 w-5" />
                  Further Education
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  College, degree, and field of study
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {furtherEducation.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No further education records found.</p>
              ) : (
                <ul className="space-y-4">
                  {furtherEducation.map((fe, index) => (
                    <li
                      key={fe.id || index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="space-y-2">
                        {fe.scholarship_details && (
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">Institution:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{fe.scholarship_details}</span>
                            </div>
                          </div>
                        )}
                        {fe.degree && (
                          <div className="flex items-start gap-2">
                            <GraduationCap className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">Degree:</span>
                              {console.log("Big INformation ",fe)}
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{fe.degree}</span>
                            </div>
                          </div>
                        )}
                        {fe.field_of_study && (
                          <div className="flex items-start gap-2">
                            <BookOpen className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">Field of Study:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{fe.field_of_study}</span>
                            </div>
                          </div>
                        )}
                        {fe.college && (
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">College:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{fe.college}</span>
                            </div>
                          </div>
                        )}
                        {fe.college_name && (
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">College Name:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{fe.college_name}</span>
                            </div>
                          </div>
                        )}
                        {fe.start_date && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">Start Date:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                {new Date(fe.start_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                        {fe.end_date && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">End Date:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                {new Date(fe.end_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Employment */}
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                  <Briefcase className="h-5 w-5" />
                  Employment
                </CardTitle>
                <CardDescription className="text-gray-500 dark:text-gray-400">
                  Job title, company, and location
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {employment.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No employment records found.</p>
              ) : (
                <ul className="space-y-4">
                  {employment.map((emp, index) => (
                    <li
                      key={emp.id || index}
                      className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                    >
                      <div className="space-y-2">
                        {emp.job_title && (
                          <div className="flex items-start gap-2">
                            <Briefcase className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">Job Title:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{emp.job_title}</span>
                            </div>
                          </div>
                        )}
                        {emp.company && (
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">Company:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{emp.company}</span>
                            </div>
                          </div>
                        )}
                        {emp.location && (
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">Location:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{emp.location}</span>
                            </div>
                          </div>
                        )}
                        {emp.industry && (
                          <div className="flex items-start gap-2">
                            <Building className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">Industry:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{emp.industry}</span>
                            </div>
                          </div>
                        )}
                        {emp.start_date && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">Start Date:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                {new Date(emp.start_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                        {emp.end_date && (
                          <div className="flex items-start gap-2">
                            <Calendar className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <span className="font-medium text-gray-800 dark:text-gray-200">End Date:</span>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">
                                {new Date(emp.end_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                        {emp.is_current_job && (
                          <div className="flex items-start gap-2">
                            <div className="w-4 h-4 mt-0.5" />
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Current Position
                            </Badge>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Kid Edit Dialog */}
      <Dialog open={kidDialogOpen} onOpenChange={setKidDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Edit Kid</DialogTitle>
            <DialogDescription>Update kid information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitKid} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {['origin_district', 'origin_sector', 'current_district_or_city', 'current_country', 'health_issue', 'marital_status', 'life_status', 'has_children', 'points_in_national_exam', 'maximum_points_in_national_exam', 'mention', 'graduation_status'].map((key) => (
                <div key={key} className="space-y-2">
                  <Label>{key.replace(/_/g, ' ')}</Label>
                  <Input
                    value={kidForm[key] ?? ''}
                    onChange={(e) => setKidForm((f) => ({ ...f, [key]: e.target.value }))}
                    className="bg-white dark:bg-gray-800"
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label>User ID</Label>
                <Input
                  type="number"
                  value={kidForm.user_id ?? ''}
                  onChange={(e) => setKidForm((f) => ({ ...f, user_id: e.target.value || null }))}
                  className="bg-white dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label>Family ID</Label>
                <Select
                  value={kidForm.family_id != null ? String(kidForm.family_id) : 'none'}
                  onValueChange={(v) => setKidForm((f) => ({ ...f, family_id: v === 'none' ? null : Number(v) }))}
                >
                  <SelectTrigger className="bg-white dark:bg-gray-800">
                    <SelectValue placeholder="Select family" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {families.map((fam) => (
                      <SelectItem key={fam.id} value={String(fam.id)}>
                        {fam.family_name || fam.family_number || fam.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setKidDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Family Edit Dialog */}
      <Dialog open={familyDialogOpen} onOpenChange={(open) => { setFamilyDialogOpen(open); if (!open) setCreatingFamily(false); }}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>{creatingFamily ? 'Create & link family' : 'Edit Family'}</DialogTitle>
            <DialogDescription>{creatingFamily ? 'Create a new family and link it to this kid.' : 'Update family information.'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitFamily} className="space-y-4">
            <div className="space-y-2">
              <Label>Family Name</Label>
              <Input value={familyForm.family_name ?? ''} onChange={(e) => setFamilyForm((f) => ({ ...f, family_name: e.target.value }))} className="bg-white dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label>Family Number</Label>
              <Input value={familyForm.family_number ?? ''} onChange={(e) => setFamilyForm((f) => ({ ...f, family_number: e.target.value }))} className="bg-white dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label>Mother ID (api_user id)</Label>
              <Input type="number" value={familyForm.mother_id ?? ''} onChange={(e) => setFamilyForm((f) => ({ ...f, mother_id: e.target.value || null }))} className="bg-white dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label>Grade</Label>
              {/* {kidForm.family_id != null ? String(kidForm.family_id) : 'none'} */}
              <Select value={familyForm.grade_id != null ? String(familyForm.grade_id) : "none"} onValueChange={(v) => setFamilyForm((f) => ({ ...f, grade_id: v === null ? null : Number(v) }))}>
                <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {grades.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>{g.grade_name || g.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFamilyDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Grade Edit Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>Update grade information.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitGrade} className="space-y-4">
            <div className="space-y-2">
              <Label>Grade Name</Label>
              <Input value={gradeForm.grade_name ?? ''} onChange={(e) => setGradeForm((f) => ({ ...f, grade_name: e.target.value }))} className="bg-white dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label>Admission Year (ASYV)</Label>
              <Input value={gradeForm.admission_year_to_asyv ?? ''} onChange={(e) => setGradeForm((f) => ({ ...f, admission_year_to_asyv: e.target.value }))} className="bg-white dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label>Graduation Year (ASYV)</Label>
              <Input value={gradeForm.graduation_year_to_asyv ?? ''} onChange={(e) => setGradeForm((f) => ({ ...f, graduation_year_to_asyv: e.target.value }))} className="bg-white dark:bg-gray-800" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Academic Add/Edit Dialog */}
      <Dialog open={academicDialogOpen} onOpenChange={setAcademicDialogOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>{editingAcademic ? 'Edit Academic Record' : 'Add Academic Record'}</DialogTitle>
            <DialogDescription>Academic year, combination, level, marks.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitAcademic} className="space-y-4">
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input value={academicForm.academic_year ?? ''} onChange={(e) => setAcademicForm((f) => ({ ...f, academic_year: e.target.value }))} placeholder="e.g. 2023" className="bg-white dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label>Combination</Label>
              <Select value={academicForm.combination_id != null ? String(academicForm.combination_id) : 'none'} onValueChange={(v) => setAcademicForm((f) => ({ ...f, combination_id: v === null ? null : Number(v) }))}>
                <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue placeholder="Select combination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {combinations.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.combination_name} {c.abbreviation ? `(${c.abbreviation})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Input value={academicForm.level ?? ''} onChange={(e) => setAcademicForm((f) => ({ ...f, level: e.target.value }))} className="bg-white dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label>Marks</Label>
              <Input value={academicForm.marks ?? ''} onChange={(e) => setAcademicForm((f) => ({ ...f, marks: e.target.value }))} className="bg-white dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label>Report Card (URL or text)</Label>
              <Input value={academicForm.report_card ?? ''} onChange={(e) => setAcademicForm((f) => ({ ...f, report_card: e.target.value }))} className="bg-white dark:bg-gray-800" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAcademicDialogOpen(false)}>Cancel</Button>
              <Button type="submit">{editingAcademic ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Report Add/Edit Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>{editingReport ? 'Edit Report' : 'Add Report'}</DialogTitle>
            <DialogDescription>
              {editingReport ? 'Update student report information' : 'Add a new student report'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitReport} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Report Title *</Label>
              {/* <Input
                id="title"
                required
                value={reportForm.title}
                onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                placeholder="e.g., Academic Performance Report"
                className="bg-white dark:bg-gray-800"
              /> */}
              <Select
                value={reportForm.title}
                onValueChange={(value) => setReportForm({ ...reportForm, title: value })}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="s4">S4 Results</SelectItem>
                  <SelectItem value="s5">S5 Results</SelectItem>
                  <SelectItem value="s6">S6 Results</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="report_type">Report Type</Label>
              <Select
                value={reportForm.report_type}
                onValueChange={(value) => setReportForm({ ...reportForm, report_type: value })}
              >
                <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="behavioral">Behavioral</SelectItem>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={reportForm.description}
                onChange={(e) => setReportForm({ ...reportForm, description: e.target.value })}
                placeholder="Enter report description..."
                rows={4}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report_file">Report File</Label>
              <div className="flex gap-2">
                <Input
                  id="report_file"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileUpload(file);
                    }
                  }}
                  disabled={uploadingFile}
                  className="bg-white dark:bg-gray-800"
                />
                {uploadingFile && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                    Uploading...
                  </div>
                )}
              </div>
              {reportForm.report_file && (
                <div className="mt-2">
                  <a
                    href={reportForm.report_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    View Current File
                  </a>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setReportDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadingFile}>
                {editingReport ? 'Update' : 'Add'} Report
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {confirmDialog}
    </div>
  );
}
