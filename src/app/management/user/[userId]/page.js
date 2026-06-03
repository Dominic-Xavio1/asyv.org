'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Briefcase, GraduationCap, FileText, User, Mail, Phone, Building2, Calendar, Award, Plus, Edit2, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useConfirmDialog } from '@/components/ui/use-confirm-dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import toast from 'react-hot-toast';

export default function UserDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const userId = params.userId;
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [isSuperuser, setIsSuperuser] = useState(false);

    // Dialog states
    const [isEmploymentDialogOpen, setIsEmploymentDialogOpen] = useState(false);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
    const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
    const [isFEDialogOpen, setIsFEDialogOpen] = useState(false);
    const [confirm, confirmDialog] = useConfirmDialog();
    const [editingEmployment, setEditingEmployment] = useState(null);
    const [editingReport, setEditingReport] = useState(null);
    const [editingComment, setEditingComment] = useState(null);
    const [editingFE, setEditingFE] = useState(null);
    const [isKidLeapDialogOpen, setIsKidLeapDialogOpen] = useState(false);
    const [editingKidLeap, setEditingKidLeap] = useState(null);

    // Form states
    const [employmentForm, setEmploymentForm] = useState({
        title: '',
        industry: '',
        company: '',
        ongoing: false
    });
    const [feForm, setFeForm] = useState({
        degree: '',
        level: '',
        status: '',
        scholarship: '',
        scholarship_details: '',
        enrolled: false,
        college_id: '',
        college_name: '',
        country: '',
        city: ''
    });

    // Debounced search state for alumni and college selects
    const [alumniSelectSearch, setAlumniSelectSearch] = useState('');
    const [collegeSelectSearch, setCollegeSelectSearch] = useState('');
    const [alumniSearchTimeout, setAlumniSearchTimeout] = useState(null);
    const [collegeSearchTimeout, setCollegeSearchTimeout] = useState(null);

    // Helper to debounce search inputs
    const handleAlumniSearchChange = (e) => {
        const value = e.target.value;
        setAlumniSelectSearch(value);
        if (alumniSearchTimeout) clearTimeout(alumniSearchTimeout);
        setAlumniSearchTimeout(setTimeout(() => setAlumniSelectSearch(value), 200));
    };
    const handleCollegeSearchChange = (e) => {
        const value = e.target.value;
        setCollegeSelectSearch(value);
        if (collegeSearchTimeout) clearTimeout(collegeSearchTimeout);
        setCollegeSearchTimeout(setTimeout(() => setCollegeSelectSearch(value), 200));
    };

    const [reportForm, setReportForm] = useState({
        year: '',
        combination: '',
        report_card: '',
        grade: ''
    });
    const [commentForm, setCommentForm] = useState({
        report_id: '',
        teacher_name: '',
        teacher_role: '',
        comment: ''
    });
    const [kidLeapForm, setKidLeapForm] = useState({
        leap_id: ''
    });
    const [leapOptions, setLeapOptions] = useState([]);
    
    // Profile (Kid) states
    const [isKidDialogOpen, setIsKidDialogOpen] = useState(false);
    const [kidForm, setKidForm] = useState({
        current_country: '',
        marital_status: ''
    });

    useEffect(() => {
        // Check if current user is superuser
        if (typeof window !== 'undefined') {
            const fullInfo = localStorage.getItem('fullInfo');
            if (fullInfo) {
                try {
                    const user = JSON.parse(fullInfo);
                    setIsSuperuser(user.is_superuser === true || user.is_crc === true);
                } catch (e) {
                    console.error('Error parsing user info:', e);
                }
            }
        }
        fetchUserDetails();
        fetchLeapOptions();
    }, [userId]);

    const fetchLeapOptions = async () => {
        try {
            const response = await fetch('/api/manage/leap');
            if (response.ok) {
                const data = await response.json();
                setLeapOptions(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const fetchUserDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/manage/details?userId=${userId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch user details');
            }
            const data = await response.json();
            // Normalize backend fields to what the UI expects
            if (data && data.employment && Array.isArray(data.employment)) {
                data.employment = data.employment.map((e) => ({
                    ...e,
                    ongoing: e.ongoing ?? e.on_going ?? false,
                }));
            }
            if (data && data.furtherEducation && Array.isArray(data.furtherEducation)) {
                data.furtherEducation = data.furtherEducation.map((fe) => ({
                    ...fe,
                    college_name: fe.college_name || fe.college || '',
                }));
            }
            setUserData(data);
        } catch (error) {
            console.error('Error fetching user details:', error);
            toast.error('Failed to load user details');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitFE = async (e) => {
        e.preventDefault();
        
        if (!feForm.degree || !feForm.level || !feForm.college_name || !feForm.country || !feForm.city) {
            toast.error("Please fill in all required fields: Degree, Level, College, Country, and City.");
            return;
        }

        try {
            const url = '/api/manage/furthereducation';
            const method = editingFE ? 'PUT' : 'POST';
            const collegePayload = (feForm.college_id || feForm.college_name || feForm.country || feForm.city) ? {
                college_id: feForm.college_id || undefined,
                college: { college_name: feForm.college_name || undefined, country: feForm.country || undefined, city: feForm.city || undefined }
            } : {};

            const body = editingFE
                ? { id: editingFE.id, degree: feForm.degree, level: feForm.level, status: feForm.status || null, scholarship: feForm.scholarship, scholarship_details: feForm.scholarship_details, enrolled: feForm.enrolled, ...collegePayload }
                : { alumn_id: userId, degree: feForm.degree, level: feForm.level, status: feForm.status || null, scholarship: feForm.scholarship, scholarship_details: feForm.scholarship_details, enrolled: feForm.enrolled, ...collegePayload };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to save further education');
            toast.success(editingFE ? 'Further education updated' : 'Further education added');
            setIsFEDialogOpen(false);
            fetchUserDetails();
        } catch (err) {
            console.error('Error saving further education:', err);
            toast.error(err.message || 'Failed to save further education');
        }
    };


    // Further Education handlers
    const handleAddFE = () => {
        setEditingFE(null);
        setFeForm({ degree: '', level: '', status: '', scholarship: '', scholarship_details: '', enrolled: false, college_id: '', college_name: '', country: '', city: '' });
        setIsFEDialogOpen(true);
    };

    const handleEditFE = (fe) => {
        setEditingFE(fe);
        setFeForm({
            degree: fe.degree || '',
            level: fe.level || '',
            status: fe.status || '',
            scholarship: fe.scholarship || '',
            scholarship_details: fe.scholarship_details || '',
            enrolled: fe.enrolled || false,
            college_id: fe.college_id || '',
            college_name: fe.college_name || '',
            country: fe.country || '',
            city: fe.city || ''
        });
        setIsFEDialogOpen(true);
    };

    const handleDeleteFE = async (id) => {
        const confirmed = await confirm({
          title: 'Delete education record',
          description: 'Are you sure you want to delete this further education record?',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          destructive: true,
        })
        if (!confirmed) return;
        try {
            const response = await fetch(`/api/manage/furthereducation?id=${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to delete record');
            toast.success('Further education record deleted');
            fetchUserDetails();
        } catch (err) {
            console.error('Error deleting further education:', err);
            toast.error(err.message || 'Failed to delete further education');
        }
    };


    // KidLeap handlers
    const handleSubmitKidLeap = async (e) => {
        e.preventDefault();
        
        if (!kidLeapForm.leap_id) {
            toast.error("Please select a LEAP activity.");
            return;
        }

        try {
            const url = editingKidLeap ? `/api/manage/kid-leap?id=${editingKidLeap.id}` : '/api/manage/kid-leap';
            const method = editingKidLeap ? 'PUT' : 'POST';
            const body = {
                leap_id: kidLeapForm.leap_id,
                ...(editingKidLeap ? {} : { kid_id: userData.kid.id })
            };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to save LEAP activity');
            toast.success(editingKidLeap ? 'LEAP activity updated' : 'LEAP activity added');
            setIsKidLeapDialogOpen(false);
            fetchUserDetails();
        } catch (err) {
            console.error('Error saving LEAP activity:', err);
            toast.error(err.message || 'Failed to save LEAP activity');
        }
    };

    const handleAddKidLeap = () => {
        setEditingKidLeap(null);
        setKidLeapForm({ leap_id: '' });
        setIsKidLeapDialogOpen(true);
    };

    const handleEditKidLeap = (leap) => {
        setEditingKidLeap(leap);
        setKidLeapForm({
            leap_id: leap.leap_id ? String(leap.leap_id) : ''
        });
        setIsKidLeapDialogOpen(true);
    };

    const handleDeleteKidLeap = async (id) => {
        const confirmed = await confirm({
          title: 'Delete LEAP activity',
          description: 'Are you sure you want to delete this LEAP activity?',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          destructive: true,
        })
        if (!confirmed) return;
        try {
            const response = await fetch(`/api/manage/kid-leap?id=${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to delete record');
            toast.success('LEAP activity deleted');
            fetchUserDetails();
        } catch (err) {
            console.error('Error deleting LEAP activity:', err);
            toast.error(err.message || 'Failed to delete LEAP activity');
        }
    };

    // Employment CRUD handlers
    const handleAddEmployment = () => {
        setEditingEmployment(null);
        setEmploymentForm({
            title: '',
            industry: '',
            company: '',
            ongoing: false
        });
        setIsEmploymentDialogOpen(true);
    };

    const handleEditEmployment = (employment) => {
        setEditingEmployment(employment);
        setEmploymentForm({
            title: employment.title || '',
            industry: employment.industry || '',
            company: employment.company || '',
            ongoing: employment.ongoing ?? employment.on_going ?? false
        });
        setIsEmploymentDialogOpen(true);
    };

    const handleDeleteEmployment = async (id) => {
        const confirmed = await confirm({
          title: 'Delete employment record',
          description: 'Are you sure you want to delete this employment record?',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          destructive: true,
        })
        if (!confirmed) {
            return;
        }
        try {
            const response = await fetch(`/api/manage/employment?id=${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete employment');
            }
            toast.success('Employment record deleted successfully');
            fetchUserDetails();
        } catch (error) {
            console.error('Error deleting employment:', error);
            toast.error(error.message || 'Failed to delete employment');
        }
    };

    const handleSubmitEmployment = async (e) => {
        e.preventDefault();
        if (!employmentForm.title || !employmentForm.industry || !employmentForm.company) {
            toast.error("Please fill in all required fields: Title, Industry, and Company.");
            return;
        }

        try {
            const url = '/api/manage/employment';
            const method = editingEmployment ? 'PUT' : 'POST';
            const payload = editingEmployment
                ? { id: editingEmployment.id, ...employmentForm }
                : { alumn_id: userId, ...employmentForm };
            const body = { ...payload };
            console.log("Employment Body: ", body);
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to save employment');
            }
            toast.success(editingEmployment ? 'Employment updated successfully' : 'Employment added successfully');
            setIsEmploymentDialogOpen(false);
            fetchUserDetails();
        } catch (error) {
            console.error('Error saving employment:', error);
            toast.error(error.message || 'Failed to save employment');
        }
    };

    // Kid Profile Handler
    const handleEditKid = () => {
        if (!userData || !userData.kid) return;
        setKidForm({
            current_country: userData.kid.current_country || '',
            marital_status: userData.kid.marital_status || ''
        });
        setIsKidDialogOpen(true);
    };

    const handleSubmitKid = async (e) => {
        e.preventDefault();
        if (!kidForm.current_country || !kidForm.marital_status) {
            toast.error("Please fill in all required fields: Country and Marital Status.");
            return;
        }
        try {
            const url = `/api/manage/kids/${userData.kid.id}`;
            const body = {
                current_country: kidForm.current_country,
                marital_status: kidForm.marital_status
            };
            const response = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to update profile info');
            toast.success('Profile info updated');
            setIsKidDialogOpen(false);
            fetchUserDetails();
        } catch (err) {
            console.error('Error saving profile info:', err);
            toast.error(err.message || 'Failed to update profile info');
        }
    };

    // Academic Report CRUD handlers
    const handleAddReport = () => {
        setEditingReport(null);
        setReportForm({
            year: '',
            combination: '',
            report_card: '',
            grade: ''
        });
        setIsReportDialogOpen(true);
    };

    const handleEditReport = (report) => {
        setEditingReport(report);
        setReportForm({
            year: report.year || '',
            combination: report.combination || '',
            report_card: report.report_card || '',
            grade: report.grade || ''
        });
        setIsReportDialogOpen(true);
    };

    const handleDeleteReport = async (id) => {
        const confirmed = await confirm({
          title: 'Delete academic report',
          description: 'Are you sure you want to delete this academic report?',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          destructive: true,
        })
        if (!confirmed) {
            return;
        }
        try {
            const response = await fetch(`/api/manage/academic-reports?id=${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete report');
            }
            toast.success('Academic report deleted successfully');
            fetchUserDetails();
        } catch (error) {
            console.error('Error deleting report:', error);
            toast.error(error.message || 'Failed to delete report');
        }
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        try {
            const url = '/api/manage/academic-reports';
            const method = editingReport ? 'PUT' : 'POST';
            const body = editingReport
                ? { id: editingReport.id, ...reportForm }
                : { student_id: userId, ...reportForm };

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to save report');
            }
            toast.success(editingReport ? 'Report updated successfully' : 'Report added successfully');
            setIsReportDialogOpen(false);
            fetchUserDetails();
        } catch (error) {
            console.error('Error saving report:', error);
            toast.error(error.message || 'Failed to save report');
        }
    };

    // Teacher Comment CRUD handlers
    const handleAddComment = () => {
        setEditingComment(null);
        setCommentForm({
            report_id: '',
            teacher_name: '',
            teacher_role: '',
            comment: ''
        });
        setIsCommentDialogOpen(true);
    };

    const handleEditComment = (comment) => {
        setEditingComment(comment);
        setCommentForm({
            report_id: comment.report_id || '',
            teacher_name: comment.teacher_name || '',
            teacher_role: comment.teacher_role || '',
            comment: comment.comment || ''
        });
        setIsCommentDialogOpen(true);
    };

    const handleDeleteComment = async (id) => {
        const confirmed = await confirm({
          title: 'Delete teacher comment',
          description: 'Are you sure you want to delete this teacher comment?',
          confirmText: 'Delete',
          cancelText: 'Cancel',
          destructive: true,
        })
        if (!confirmed) {
            return;
        }
        try {
            const response = await fetch(`/api/manage/teacher-comments?id=${id}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete comment');
            }
            toast.success('Teacher comment deleted successfully');
            fetchUserDetails();
        } catch (error) {
            console.error('Error deleting comment:', error);
            toast.error(error.message || 'Failed to delete comment');
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        try {
            const url = '/api/manage/teacher-comments';
            const method = editingComment ? 'PUT' : 'POST';
            const body = editingComment
                ? { id: editingComment.id, ...commentForm }
                : commentForm;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Failed to save comment');
            }
            toast.success(editingComment ? 'Comment updated successfully' : 'Comment added successfully');
            setIsCommentDialogOpen(false);
            fetchUserDetails();
        } catch (error) {
            console.error('Error saving comment:', error);
            toast.error(error.message || 'Failed to save comment');
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Loading user details...</div>
            </div>
        );
    }

    if (!userData || !userData.user) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center text-red-600">User not found</div>
            </div>
        );
    }

    const { user, employment = [], furtherEducation = [], academicReports = [], teacherComments = [], kidLeaps = [] } = userData;

    return (
        <div className="container mx-auto px-4 pt-16 pb-24 max-w-6xl">
            {confirmDialog}
            <Button
                variant="outline"
                onClick={() => router.back()}
                className="mb-6 mt-6"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Management
            </Button>

            {/* User Basic Information */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        User Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">First Name</label>
                            <p className="text-lg font-semibold">{user.first_name || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Rwandan Name</label>
                            <p className="text-lg font-semibold">{user.rwandan_name || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                Email
                            </label>
                            <p className="text-lg">{user.email || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Username</label>
                            <p className="text-lg">{user.username || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                Phone
                            </label>
                            <p className="text-lg">{user.phone || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                            <p className="text-lg">{user.gender || '-'}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                            <div className="flex gap-2 mt-1">
                                {user.is_student && <Badge variant="secondary">Student</Badge>}
                                {user.is_alumni && <Badge variant="secondary">Alumni</Badge>}
                                {user.is_crc && <Badge variant="secondary">CRC</Badge>}
                                {user.is_superuser && <Badge variant="destructive">Superuser</Badge>}
                                {user.is_staff && <Badge variant="outline">Staff</Badge>}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Kid Profile Info (for Alumni) */}
            {user.is_alumni && userData.kid && (
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Profile Info
                                </CardTitle>
                                <CardDescription>Current country and marital status</CardDescription>
                            </div>
                            {isSuperuser && (
                                <Button onClick={handleEditKid} size="sm" className="bg-green-600 hover:bg-green-500">
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Country</label>
                                <p className="text-lg font-semibold">{userData.kid.current_country || '-'}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Marital Status</label>
                                <p className="text-lg">{userData.kid.marital_status || '-'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Employment Information (for Alumni) */}
            {user.is_alumni && (
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Briefcase className="h-5 w-5" />
                                    Employment History
                                </CardTitle>
                                <CardDescription>Employment records for this alumni</CardDescription>
                            </div>
                            {isSuperuser && (
                                <Button onClick={handleAddEmployment} size="sm" className="bg-green-600 hover:bg-green-500">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Employment
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        {employment.length > 0 ? (
                            <div className="space-y-4">
                                {employment.map((emp) => (
                                    <div key={emp.id} className="border rounded-lg p-4 relative">
                                        {isSuperuser && (
                                            <div className="absolute top-4 right-4 flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEditEmployment(emp)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDeleteEmployment(emp.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</label>
                                                <p className="text-lg font-semibold">{emp.title || '-'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Industry</label>
                                                <p className="text-lg">{emp.industry || '-'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    <Building2 className="h-4 w-4" />
                                                    Company
                                                </label>
                                                <p className="text-lg">{emp.company || '-'}</p>
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                                <div className="mt-1">{console.log("Employment Status: ", emp)}
                                                    {emp.on_going ? (
                                                        <Badge className="bg-green-600">Ongoing</Badge>
                                                    ) : (
                                                        <Badge variant="outline">Past</Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400">No employment records found.</p>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Further Education (for Alumni) */}
            {user.is_alumni && furtherEducation.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5" />
                                    Further Education
                                </CardTitle>
                                <CardDescription>Further education and college details</CardDescription>
                            </div>
                            {isSuperuser && (
                                <Button onClick={handleAddFE} size="sm" className="bg-green-600 hover:bg-green-500">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Education
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {furtherEducation.map((fe) => (
                                <div key={fe.id} className="border rounded-lg p-4 relative">
                                    {isSuperuser && (
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEditFE(fe)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteFE(fe.id)} className="text-red-600 hover:text-red-700">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Degree</label>
                                            <p className="text-lg font-semibold">{fe.degree || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Level</label>
                                            <p className="text-lg">{fe.level || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Scholarship</label>
                                            <p className="text-lg">{fe.scholarship || '-'} {fe.scholarship_details ? `- ${fe.scholarship_details}` : ''}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Enrolled</label>
                                            <p className="text-lg">{fe.enrolled ? 'Yes' : 'No'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                            <p className="text-lg font-medium text-orange-600 dark:text-orange-400">{fe.status || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">College</label>
                                            <p className="text-lg">{fe.college_name || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</label>
                                            <p className="text-lg">{(fe.city ? fe.city + ', ' : '') + (fe.country || '') || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Academic Information (for Students) */}
            {user.is_student && (
                <>
                    {/* Academic Reports */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Academic Reports
                                    </CardTitle>
                                    <CardDescription>Academic performance records</CardDescription>
                                </div>
                                {isSuperuser && (
                                    <Button onClick={handleAddReport} size="sm" className="text-primary-foreground bg-orange-500 hover:bg-orange-600">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Report
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {academicReports.length > 0 ? (
                                <div className="space-y-4">
                                    {academicReports.map((report) => (
                                        <div key={report.id} className="border rounded-lg p-4 relative">
                                            {isSuperuser && (
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditReport(report)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteReport(report.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <Calendar className="h-4 w-4" />
                                                        Year
                                                    </label>
                                                    <p className="text-lg font-semibold">{report.year || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Combination</label>
                                                    <p className="text-lg">{report.combination || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <Award className="h-4 w-4" />
                                                        Grade
                                                    </label>
                                                    <p className="text-lg font-semibold">{report.grade || '-'}</p>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Report Card</label>
                                                    {report.report_card ? (
                                                        <a
                                                            href={report.report_card}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-blue-600 dark:text-blue-400 hover:underline"
                                                        >
                                                            View Report Card
                                                        </a>
                                                    ) : (
                                                        <p className="text-gray-500">No report card available</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400">No academic reports found.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Teacher Comments */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5" />
                                        Teacher Comments
                                    </CardTitle>
                                    <CardDescription>Comments from teachers on academic reports</CardDescription>
                                </div>
                                {isSuperuser && (
                                    <Button onClick={handleAddComment} size="sm" className="bg-orange-500 hover:bg-orange-600">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Comment
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {teacherComments.length > 0 ? (
                                <div className="space-y-4">
                                    {teacherComments.map((comment) => (
                                        <div key={comment.id} className="border rounded-lg p-4 relative">
                                            {isSuperuser && (
                                                <div className="absolute top-4 right-4 flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditComment(comment)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteComment(comment.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                            <div className="mb-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <p className="font-semibold">{comment.teacher_name || 'Unknown Teacher'}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{comment.teacher_role || '-'}</p>
                                                    </div>
                                                    {comment.year && (
                                                        <Badge variant="outline">{comment.year}</Badge>
                                                    )}
                                                </div>
                                                {comment.combination && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                        Combination: {comment.combination}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="bg-gray-50 dark:bg-gray-800 rounded p-3">
                                                <p className="text-gray-700 dark:text-gray-300">{comment.comment || 'No comment provided'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400">No teacher comments found.</p>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Employment Dialog */}
            <Dialog open={isEmploymentDialogOpen} onOpenChange={setIsEmploymentDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingEmployment ? 'Edit Employment' : 'Add Employment'}</DialogTitle>
                        <DialogDescription>
                            {editingEmployment ? 'Update employment information' : 'Add a new employment record'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitEmployment}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    required
                                    value={employmentForm.title}
                                    onChange={(e) => setEmploymentForm({ ...employmentForm, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="industry">Industry</Label>
                                <Input
                                    id="industry"
                                    value={employmentForm.industry}
                                    onChange={(e) => setEmploymentForm({ ...employmentForm, industry: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="company">Company</Label>
                                <Input
                                    id="company"
                                    value={employmentForm.company}
                                    onChange={(e) => setEmploymentForm({ ...employmentForm, company: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ongoing">Status</Label>
                                <Select
                                    value={employmentForm.ongoing ? "true" : "false"}
                                    onValueChange={(value) => setEmploymentForm({ ...employmentForm, ongoing: value === "true" })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Ongoing</SelectItem>
                                        <SelectItem value="false">Past</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEmploymentDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-500">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Kid Profile Dialog */}
            <Dialog open={isKidDialogOpen} onOpenChange={setIsKidDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Profile Info</DialogTitle>
                        <DialogDescription>
                            Update current country and marital status.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitKid}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="current_country">Current Country *</Label>
                                <Input
                                    id="current_country"
                                    required
                                    value={kidForm.current_country}
                                    onChange={(e) => setKidForm({ ...kidForm, current_country: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="marital_status">Marital Status *</Label>
                                <Input
                                    id="marital_status"
                                    required
                                    value={kidForm.marital_status}
                                    onChange={(e) => setKidForm({ ...kidForm, marital_status: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsKidDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-500">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Further Education Dialog */}
            <Dialog open={isFEDialogOpen} onOpenChange={setIsFEDialogOpen}>
                <DialogContent className="max-w-2xl mt-10 mb-20 max-h-[600px] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingFE ? 'Edit Further Education' : 'Add Further Education'}</DialogTitle>
                        <DialogDescription>
                            {editingFE ? 'Update further education information' : 'Add a new further education record'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitFE}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="degree">Degree *</Label>
                                <Input id="degree" required value={feForm.degree} onChange={(e) => setFeForm({ ...feForm, degree: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="level">Level</Label>
                                <Input id="level" value={feForm.level} onChange={(e) => setFeForm({ ...feForm, level: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scholarship">Scholarship</Label>
                                <Input id="scholarship" value={feForm.scholarship} onChange={(e) => setFeForm({ ...feForm, scholarship: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="scholarship_details">Scholarship Details</Label>
                                <Input id="scholarship_details" value={feForm.scholarship_details} onChange={(e) => setFeForm({ ...feForm, scholarship_details: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="enrolled">Enrolled</Label>
                                <Select value={feForm.enrolled ? 'true' : 'false'} onValueChange={(v) => setFeForm({ ...feForm, enrolled: v === 'true' })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Yes</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={feForm.status || 'Ongoing'} onValueChange={(v) => setFeForm({ ...feForm, status: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select status..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Ongoing">Ongoing</SelectItem>
                                        <SelectItem value="Graduated">Graduated</SelectItem>
                                        <SelectItem value="Dropped Out">Dropped Out</SelectItem>
                                        <SelectItem value="Suspended">Suspended</SelectItem>
                                        <SelectItem value="Postponed">Postponed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="college_name">College Name</Label>
                                <Input id="college_name" value={feForm.college_name} onChange={(e) => setFeForm({ ...feForm, college_name: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country">Country</Label>
                                <Input id="country" value={feForm.country} onChange={(e) => setFeForm({ ...feForm, country: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="city">City</Label>
                                <Input id="city" value={feForm.city} onChange={(e) => setFeForm({ ...feForm, city: e.target.value })} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsFEDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-green-600 hover:bg-green-500">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Academic Report Dialog */}
            <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingReport ? 'Edit Academic Report' : 'Add Academic Report'}</DialogTitle>
                        <DialogDescription>
                            {editingReport ? 'Update academic report information' : 'Add a new academic report'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitReport}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="year">Year *</Label>
                                <Input
                                    id="year"
                                    type="text"
                                    required
                                    value={reportForm.year}
                                    onChange={(e) => setReportForm({ ...reportForm, year: e.target.value })}
                                    placeholder="e.g., 2024"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="combination">Combination</Label>
                                <Input
                                    id="combination"
                                    value={reportForm.combination}
                                    onChange={(e) => setReportForm({ ...reportForm, combination: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="grade">Grade</Label>
                                <Input
                                    id="grade"
                                    value={reportForm.grade}
                                    onChange={(e) => setReportForm({ ...reportForm, grade: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="report_card">Report Card URL</Label>
                                <Input
                                    id="report_card"
                                    type="url"
                                    value={reportForm.report_card}
                                    onChange={(e) => setReportForm({ ...reportForm, report_card: e.target.value })}
                                    placeholder="https://example.com/report.pdf"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsReportDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Teacher Comment Dialog */}
            <Dialog open={isCommentDialogOpen} onOpenChange={setIsCommentDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingComment ? 'Edit Teacher Comment' : 'Add Teacher Comment'}</DialogTitle>
                        <DialogDescription>
                            {editingComment ? 'Update teacher comment' : 'Add a new teacher comment'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmitComment}>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="report_id">Academic Report *</Label>
                                <Select
                                    value={commentForm.report_id}
                                    onValueChange={(value) => setCommentForm({ ...commentForm, report_id: value })}
                                    required
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a report" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {academicReports.map((report) => (
                                            <SelectItem key={report.id} value={report.id.toString()}>
                                                {report.year} - {report.combination || 'No combination'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="teacher_name">Teacher Name *</Label>
                                <Input
                                    id="teacher_name"
                                    required
                                    value={commentForm.teacher_name}
                                    onChange={(e) => setCommentForm({ ...commentForm, teacher_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="teacher_role">Teacher Role</Label>
                                <Input
                                    id="teacher_role"
                                    value={commentForm.teacher_role}
                                    onChange={(e) => setCommentForm({ ...commentForm, teacher_role: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="comment">Comment *</Label>
                                <Textarea
                                    id="comment"
                                    required
                                    value={commentForm.comment}
                                    onChange={(e) => setCommentForm({ ...commentForm, comment: e.target.value })}
                                    rows={4}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsCommentDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
