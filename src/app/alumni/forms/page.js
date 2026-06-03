'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, GraduationCap, Briefcase, Edit2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import toast from 'react-hot-toast';

const authHeaders = (userId) => ({
  'Content-Type': 'application/json',
  'x-user-id': String(userId),
});

export default function AlumniFormsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [kid, setKid] = useState(null);
  const [furtherEducation, setFurtherEducation] = useState([]);
  const [employment, setEmployment] = useState([]);

  const [kidForm, setKidForm] = useState({ current_country: '', marital_status: '' });
  const [feForm, setFeForm] = useState({
    degree: '', level: '', scholarship: '', scholarship_details: '', enrolled: false,
    college_name: '', country: '', city: '',
  });
  const [empForm, setEmpForm] = useState({ title: '', industry: '', company: '', ongoing: false });

  const [kidDialogOpen, setKidDialogOpen] = useState(false);
  const [feDialogOpen, setFeDialogOpen] = useState(false);
  const [empDialogOpen, setEmpDialogOpen] = useState(false);
  const [editingFE, setEditingFE] = useState(null);
  const [editingEmp, setEditingEmp] = useState(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/alumni/profile?userId=${encodeURIComponent(userId)}`, {
        headers: { 'x-user-id': userId },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch profile');
      }
      const data = await res.json();
      setKid(data.kid);
      setFurtherEducation(data.furtherEducation || []);
      setEmployment(data.employment || []);
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fullInfo = localStorage.getItem('fullInfo');
    if (!fullInfo) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(fullInfo);
      if (!user.is_alumni) {
        router.push('/dashboard');
        return;
      }
      setUserId(String(user.id));
    } catch (_) {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (userId) fetchProfile();
  }, [userId, fetchProfile]);

  const openKidEdit = () => {
    setKidForm({
      current_country: kid?.current_country ?? '',
      marital_status: kid?.marital_status ?? '',
    });
    setKidDialogOpen(true);
  };

  const submitKid = async (e) => {
    e.preventDefault();
    if (!kidForm.current_country || !kidForm.marital_status) {
      toast.error("Please fill in all required fields: Country and Marital Status.");
      return;
    }
    try {
      const res = await fetch('/api/alumni/kid', {
        method: 'PUT',
        headers: authHeaders(userId),
        body: JSON.stringify({ userId, current_country: kidForm.current_country || null, marital_status: kidForm.marital_status || null }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save');
      toast.success('Profile updated');
      setKidDialogOpen(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const openFeAdd = () => {
    setEditingFE(null);
    setFeForm({ degree: '', level: '', scholarship: '', scholarship_details: '', enrolled: false, college_name: '', country: '', city: '' });
    setFeDialogOpen(true);
  };

  const openFeEdit = (fe) => {
    setEditingFE(fe);
    setFeForm({
      degree: fe.degree ?? '',
      level: fe.level ?? '',
      scholarship: fe.scholarship ?? '',
      scholarship_details: fe.scholarship_details ?? '',
      enrolled: fe.enrolled ?? false,
      college_name: fe.college_name ?? '',
      country: fe.country ?? '',
      city: fe.city ?? '',
    });
    setFeDialogOpen(true);
  };

  const submitFe = async (e) => {
    e.preventDefault();
    if (!feForm.degree || !feForm.level || !feForm.college_name || !feForm.country || !feForm.city) {
      toast.error("Please fill in all required fields: Degree, Level, College Name, Country, and City.");
      return;
    }
    try {
      const collegePayload = (feForm.college_name || feForm.country || feForm.city) ? {
        college: { college_name: feForm.college_name || undefined, country: feForm.country || undefined, city: feForm.city || undefined },
      } : {};
      const payload = editingFE
        ? { id: editingFE.id, degree: feForm.degree, level: feForm.level, scholarship: feForm.scholarship, scholarship_details: feForm.scholarship_details, enrolled: feForm.enrolled, ...collegePayload }
        : { alumn_id: userId, degree: feForm.degree, level: feForm.level, scholarship: feForm.scholarship, scholarship_details: feForm.scholarship_details, enrolled: feForm.enrolled, ...collegePayload };
      const res = await fetch('/api/alumni/furthereducation', {
        method: editingFE ? 'PUT' : 'POST',
        headers: authHeaders(userId),
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save');
      toast.success(editingFE ? 'Education updated' : 'Education added');
      setFeDialogOpen(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    }
  };

  const openEmpAdd = () => {
    setEditingEmp(null);
    setEmpForm({ title: '', industry: '', company: '', ongoing: false });
    setEmpDialogOpen(true);
  };

  const openEmpEdit = (emp) => {
    setEditingEmp(emp);
    setEmpForm({
      title: emp.title ?? '',
      industry: emp.industry ?? '',
      company: emp.company ?? '',
      ongoing: emp.ongoing ?? emp.on_going ?? false,
    });
    setEmpDialogOpen(true);
  };

  const submitEmp = async (e) => {
    e.preventDefault();
    if (!empForm.title || !empForm.industry || !empForm.company) {
      toast.error("Please fill in all required fields: Title, Industry, and Company.");
      return;
    }
    try {
      const payload = editingEmp
        ? { id: editingEmp.id, ...empForm }
        : { alumn_id: userId, ...empForm };
      const res = await fetch('/api/alumni/employment', {
        method: editingEmp ? 'PUT' : 'POST',
        headers: authHeaders(userId),
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save');
      toast.success(editingEmp ? 'Employment updated' : 'Employment added');
      setEmpDialogOpen(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to save');
    }
  };

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 pt-20 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          {/* <Link href="/dashboard"> */}
            <Button variant="outline" size="sm" className="gap-2"
            onClick={()=>router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          {/* </Link> */}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Alumni Profile Forms
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Update your profile information. You can create or update records in the sections below.
        </p>

        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-6">
            {/* Kid: current_country, marital_status only */}
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <User className="h-5 w-5" />
                    Profile Info (Country & Marital Status)
                  </CardTitle>
                  <CardDescription className="text-gray-500 dark:text-gray-400">
                    Current country and marital status
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={openKidEdit}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  {kid ? 'Update' : 'Create'}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Current Country</span>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{kid?.current_country ?? '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Marital Status</span>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{kid?.marital_status ?? '-'}</p>
                  </div>
                </div>
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
                    Add or update your education records
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={openFeAdd} className="bg-green-600 hover:bg-green-500 text-white border-0">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardHeader>
              <CardContent>
                {furtherEducation.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No records yet. Click Add to create one.</p>
                ) : (
                  <ul className="space-y-3">
                    {furtherEducation.map((fe) => (
                      <li key={fe.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{fe.degree}</span>
                          {fe.level && <span className="ml-2 text-gray-600 dark:text-gray-400">({fe.level})</span>}
                          {fe.college_name && <span className="block text-sm text-gray-500">{fe.college_name}</span>}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => openFeEdit(fe)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
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
                    Add or update your employment records
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={openEmpAdd} className="bg-green-600 hover:bg-green-500 text-white border-0">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </CardHeader>
              <CardContent>
                {employment.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400">No records yet. Click Add to create one.</p>
                ) : (
                  <ul className="space-y-3">
                    {employment.map((emp) => (
                      <li key={emp.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                        <div>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{emp.title}</span>
                          {emp.company && <span className="ml-2 text-gray-600 dark:text-gray-400">at {emp.company}</span>}
                          {emp.ongoing && <span className="ml-2 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">Ongoing</span>}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => openEmpEdit(emp)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Kid Dialog */}
      <Dialog open={kidDialogOpen} onOpenChange={setKidDialogOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>{kid ? 'Update Profile Info' : 'Create Profile Info'}</DialogTitle>
            <DialogDescription>Current country and marital status only.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitKid} className="space-y-4">
            <div className="space-y-2">
              <Label>Current Country</Label>
              <Input value={kidForm.current_country} onChange={(e) => setKidForm((f) => ({ ...f, current_country: e.target.value }))} className="bg-white dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label>Marital Status</Label>
              <Input value={kidForm.marital_status} onChange={(e) => setKidForm((f) => ({ ...f, marital_status: e.target.value }))} placeholder="e.g. Single, Married" className="bg-white dark:bg-gray-800" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setKidDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-500">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Further Education Dialog */}
      <Dialog open={feDialogOpen} onOpenChange={setFeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>{editingFE ? 'Edit Further Education' : 'Add Further Education'}</DialogTitle>
            <DialogDescription>{editingFE ? 'Update your education record' : 'Add a new education record'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitFe} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Degree*</Label>
                <Input required value={feForm.degree} onChange={(e) => setFeForm((f) => ({ ...f, degree: e.target.value }))} className="bg-white dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <Label>Level ex: A0</Label>
                <Input value={feForm.level} 
                placeholder="e.g. A0, A1, Bachelors, Masters"
                onChange={(e) => setFeForm((f) => ({ ...f, level: e.target.value }))} className="bg-white dark:bg-gray-800"required />
              </div>
              <div className="space-y-2">
                <Label>Funding: Scholarship or self-sponsored?</Label>
                <Input value={feForm.scholarship} onChange={(e) => setFeForm((f) => ({ ...f, scholarship: e.target.value }))} 
                className="bg-white dark:bg-gray-800"
                placeholder="e.g. Scholarship, Self-sponsored"
                />
              </div>
              <div className="space-y-2">
                <Label>Scholarship Details</Label>
                <Input value={feForm.scholarship_details} 
                placeholder="Provide details ex: Government scholarship..."
                onChange={(e) => setFeForm((f) => ({ ...f, scholarship_details: e.target.value }))} className="bg-white dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <Label>Enrolled</Label>
                <Select value={feForm.enrolled ? 'true' : 'false'} onValueChange={(v) => setFeForm((f) => ({ ...f, enrolled: v === 'true' }))}>
                  <SelectTrigger className="bg-white dark:bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>College Name</Label>
                <Input value={feForm.college_name} onChange={(e) => setFeForm((f) => ({ ...f, college_name: e.target.value }))} className="bg-white dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={feForm.country} onChange={(e) => setFeForm((f) => ({ ...f, country: e.target.value }))} className="bg-white dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input value={feForm.city} onChange={(e) => setFeForm((f) => ({ ...f, city: e.target.value }))} className="bg-white dark:bg-gray-800" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFeDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-500">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Employment Dialog */}
      <Dialog open={empDialogOpen} onOpenChange={setEmpDialogOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle>{editingEmp ? 'Edit Employment' : 'Add Employment'}</DialogTitle>
            <DialogDescription>{editingEmp ? 'Update your employment record' : 'Add a new employment record'}</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitEmp} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input required value={empForm.title} onChange={(e) => setEmpForm((f) => ({ ...f, title: e.target.value }))} className="bg-white dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label>Industry</Label>
              <Input value={empForm.industry} onChange={(e) => setEmpForm((f) => ({ ...f, industry: e.target.value }))} className="bg-white dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label>Company</Label>
              <Input value={empForm.company} onChange={(e) => setEmpForm((f) => ({ ...f, company: e.target.value }))} className="bg-white dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={empForm.ongoing ? 'true' : 'false'} onValueChange={(v) => setEmpForm((f) => ({ ...f, ongoing: v === 'true' }))}>
                <SelectTrigger className="bg-white dark:bg-gray-800">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Ongoing</SelectItem>
                  <SelectItem value="false">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEmpDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-500">Save</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
