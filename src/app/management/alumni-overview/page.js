// 'use client';

// import { useEffect, useState, useCallback } from 'react';
// import { useRouter } from 'next/navigation';
// import Link from 'next/link';
// import {
//   ArrowLeft,
//   GraduationCap,
//   BookOpen,
//   Briefcase,
//   Filter,
//   TrendingUp,
//   Users,
// } from 'lucide-react';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
// } from '@/components/ui/dialog';
// import toast from 'react-hot-toast';

// function StatCard({ icon: Icon, title, value, subtitle, accent = 'default' }) {
//   const accentClasses = {
//     default: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
//     blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
//     amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800',
//   };
//   return (
//     <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-2">
//       <CardHeader className="pb-2">
//         <div className="flex items-center justify-between">
//           <CardTitle className="text-sm font-medium text-muted-foreground">
//             {title}
//           </CardTitle>
//           <div className={`p-2 rounded-lg ${accentClasses[accent]}`}>
//             <Icon className="h-5 w-5" />
//           </div>
//         </div>
//       </CardHeader>
//       <CardContent>
//         <div className="text-3xl font-bold tracking-tight text-foreground">
//           {value.toLocaleString()}
//         </div>
//         {subtitle != null && (
//           <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
//         )}
//       </CardContent>
//     </Card>
//   );
// }

// export default function AlumniOverviewPage() {
//   const router = useRouter();
//   const [requestingUserId, setRequestingUserId] = useState(null);
//   const [isSuperuser, setIsSuperuser] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [grades, setGrades] = useState([]);
//   const [selectedGradeId, setSelectedGradeId] = useState('');
//   const [stats, setStats] = useState({
//     totalGraduates: 0,
//     continuedEducation: 0,
//     employed: 0,
//     withEitherOutcome: 0,
//     continuedEducationPct: 0,
//     employedPct: 0,
//     withEitherOutcomePct: 0,
//     filteredByGrade: false,
//     gradeId: null,
//   });

//   const [activeModal, setActiveModal] = useState(null); // 'education' or 'employment'
//   const [modalData, setModalData] = useState([]);

//   const openModal = (type) => {
//     setActiveModal(type);
//     if (type === 'education') {
//       setModalData(stats.continuedEducationStudents || []);
//     } else if (type === 'employment') {
//       setModalData(stats.employedStudents || []);
//     }
//   };

//   const fetchStats = useCallback(
//     async (gradeId = '') => {
//       if (!requestingUserId) return;
//       setLoading(true);
//       try {
//         const params = new URLSearchParams({
//           requestingUserId: String(requestingUserId),
//         });
//         if (gradeId && isSuperuser) {
//           params.set('gradeId', gradeId);
//         }
//         const res = await fetch(
//           `/api/manage/alumni-overview?${params.toString()}`,
//           { headers: { 'x-user-id': String(requestingUserId) } }
//         );
//         if (!res.ok) {
//           const err = await res.json().catch(() => ({}));
//           throw new Error(err.error || 'Failed to fetch overview');
//         }
//         const data = await res.json();
//         setStats(data);
//       } catch (e) {
//         console.error(e);
//         toast.error(e.message || 'Failed to load overview');
//       } finally {
//         setLoading(false);
//       }
//     },
//     [requestingUserId, isSuperuser]
//   );

//   const fetchGrades = useCallback(async () => {
//     if (!requestingUserId) return;
//     try {
//       const res = await fetch(
//         `/api/manage/grades?requestingUserId=${encodeURIComponent(requestingUserId)}`,
//         { headers: { 'x-user-id': requestingUserId } }
//       );
//       if (!res.ok) return;
//       const data = await res.json();
//       setGrades(Array.isArray(data) ? data : []);
//     } catch (e) {
//       console.error('Failed to fetch grades:', e);
//     }
//   }, [requestingUserId]);

//   useEffect(() => {
//     if (typeof window === 'undefined') return;
//     const fullInfo = localStorage.getItem('fullInfo');
//     if (!fullInfo) {
//       router.push('/login');
//       return;
//     }
//     try {
//       const user = JSON.parse(fullInfo);
//       setRequestingUserId(String(user.id));
//       setIsSuperuser(user.is_superuser === true || user.is_crc === true);
//       console.log("Is supersuser ", isSuperuser);
//     } catch (e) {
//       router.push('/login');
//     }
//   }, [router]);

//   useEffect(() => {
//     if (!requestingUserId) return;
//     fetchStats(selectedGradeId);
//   }, [requestingUserId, selectedGradeId, fetchStats]);

//   useEffect(() => {
//     if (requestingUserId && isSuperuser) {
//       fetchGrades();
//     }
//   }, [requestingUserId, isSuperuser, fetchGrades]);

//   const handleGradeChange = (value) => {
//     setSelectedGradeId(value || '');
//   };

//   if (requestingUserId === null) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-gray-900">
//         <p className="text-gray-600 dark:text-gray-400">Loading...</p>
//       </div>
//     );
//   }

//   const selectedGrade = grades.find((g) => String(g.id) === selectedGradeId);

//   /* ... existing code ... */



//   /* ... existing code ... */

//   return (
//     <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 pt-20 pb-12 px-4">
//       {/* ... header ... */}
//       <div className="max-w-6xl mx-auto">
//         <div className="flex items-center justify-between gap-4 mb-6">
//           <div className="flex items-center gap-4">
//             <Link href="/dashboard">
//               <Button variant="outline" size="sm" className="gap-2">
//                 <ArrowLeft className="h-4 w-4" />
//                 Back to Dashboard
//               </Button>
//             </Link>
//           </div>
//         </div>

//         <div className="mb-8">
//           <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
//             Alumni Overview
//           </h1>
//           <p className="text-gray-600 dark:text-gray-400">
//             Global statistics on graduated students, further education, and employment.
//           </p>
//         </div>

//         {isSuperuser && grades.length > 0 && (
//           <div className="mb-6 flex flex-wrap items-center gap-3">
//             <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
//               <Filter className="h-4 w-4" />
//               Filter by Grade
//             </div>
//             <Select value={selectedGradeId || 'all'} onValueChange={handleGradeChange}>
//               <SelectTrigger className="w-[280px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
//                 <SelectValue placeholder="All grades" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All grades</SelectItem>
//                 {grades.map((g) => (
//                   <SelectItem key={g.id} value={String(g.id)}>
//                     {g.grade_name || `Grade ${g.id}`}
//                     {g.graduation_year_to_asyv && ` (${g.graduation_year_to_asyv})`}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//             {stats.filteredByGrade && selectedGrade && (
//               <span className="text-sm text-muted-foreground">
//                 Showing: {selectedGrade.grade_name}
//                 {selectedGrade.graduation_year_to_asyv &&
//                   ` · Class of ${selectedGrade.graduation_year_to_asyv}`}
//               </span>
//             )}
//           </div>
//         )}

//         {loading ? (
//           <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//             {[1, 2, 3, 4].map((i) => (
//               <Card key={i} className="animate-pulse">
//                 <CardHeader className="pb-2">
//                   <div className="h-4 w-32 rounded bg-muted" />
//                 </CardHeader>
//                 <CardContent>
//                   <div className="h-9 w-20 rounded bg-muted" />
//                   <div className="mt-2 h-4 w-24 rounded bg-muted" />
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         ) : (
//           <div className="space-y-6">
//             <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
//               <StatCard
//                 icon={GraduationCap}
//                 title="Total Graduates"
//                 value={stats.totalGraduates}
//                 subtitle={
//                   stats.filteredByGrade
//                     ? 'From selected grade'
//                     : 'Across all grades'
//                 }
//                 accent="default"
//               />
//               <div onClick={() => openModal('education')} className="cursor-pointer">
//                 <StatCard
//                   icon={BookOpen}
//                   title="Continued Education"
//                   value={stats.continuedEducation}
//                   subtitle={`${stats.continuedEducationPct}% of graduates`}
//                   accent="blue"
//                 />
//               </div>
//               <div onClick={() => openModal('employment')} className="cursor-pointer">
//                 <StatCard
//                   icon={Briefcase}
//                   title="Employed"
//                   value={stats.employed}
//                   subtitle={`${stats.employedPct}% of graduates`}
//                   accent="amber"
//                 />
//               </div>
//               <StatCard
//                 icon={TrendingUp}
//                 title="With Outcome Recorded"
//                 value={stats.withEitherOutcome ?? 0}
//                 subtitle={
//                   stats.totalGraduates > 0
//                     ? `${stats.withEitherOutcomePct ?? 0}% have education or employment data`
//                     : 'Students with at least one outcome'
//                 }
//                 accent="default"
//               />
//             </div>

//             <Card className="border-2">
//               <CardHeader>
//                 <CardTitle className="flex items-center gap-2">
//                   <Users className="h-5 w-5" />
//                   Summary
//                 </CardTitle>
//                 <CardDescription>
//                   {stats.filteredByGrade
//                     ? 'Statistics for the selected grade only.'
//                     : 'Global statistics across all grades.'}
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <div className="grid gap-4 sm:grid-cols-2">
//                   <div
//                     className="rounded-lg bg-muted/50 p-4 cursor-pointer hover:bg-muted/70 transition-colors"
//                     onClick={() => openModal('education')}
//                   >
//                     <p className="text-sm font-medium text-muted-foreground">
//                       Further Education Rate
//                     </p>
//                     <p className="mt-1 text-2xl font-bold">
//                       {stats.continuedEducationPct}%
//                     </p>
//                     <p className="mt-1 text-xs text-muted-foreground">
//                       {stats.continuedEducation} of {stats.totalGraduates}{' '}
//                       graduates continued to higher education
//                     </p>
//                   </div>
//                   <div
//                     className="rounded-lg bg-muted/50 p-4 cursor-pointer hover:bg-muted/70 transition-colors"
//                     onClick={() => openModal('employment')}
//                   >
//                     <p className="text-sm font-medium text-muted-foreground">
//                       Employment Rate
//                     </p>
//                     <p className="mt-1 text-2xl font-bold">
//                       {stats.employedPct}%
//                     </p>
//                     <p className="mt-1 text-xs text-muted-foreground">
//                       {stats.employed} of {stats.totalGraduates} graduates have
//                       employment records
//                     </p>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         )}
//       </div>

//       {/* Student List Modal */}
//       <Dialog open={!!activeModal} onOpenChange={(open) => !open && setActiveModal(null)}>
//         <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
//           <DialogHeader>
//             <DialogTitle>
//               {activeModal === 'education' ? 'Students in Further Education' : 'Employed Students'}
//             </DialogTitle>
//             <DialogDescription>
//               List of alumni {activeModal === 'education' ? 'continuing their education' : 'currently employed'}.
//             </DialogDescription>
//           </DialogHeader>
//           <div className="flex-1 overflow-y-auto mt-4 pr-2">
//             {modalData.length === 0 ? (
//               <p className="text-muted-foreground text-center py-8">No students found for this category.</p>
//             ) : (
//               <div className="space-y-4">
//                 {modalData.map((student, idx) => (
//                   <div key={student.id || idx} className="flex items-center justify-between p-3 border rounded-lg bg-card">
//                     <div>
//                       <h4 className="font-semibold text-sm">
//                         {student.first_name} {student.rwandan_name}
//                       </h4>
//                       <p className="text-xs text-muted-foreground">{student.email}</p>
//                     </div>
//                     {(student.institution || student.company) && (
//                       <div className="text-right">
//                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
//                           {activeModal === 'education' ? student.institution : student.company}
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
