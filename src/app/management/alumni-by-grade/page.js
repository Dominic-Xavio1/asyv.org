'use client';

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Users, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import toast from 'react-hot-toast';

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
          {/* <Link href="/dashboard"> */}
            <Button variant="outline" size="sm" className="gap-2 w-fit"
            onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          {/* </Link> */}
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
                <span className="text-gray-800 dark:text-gray-200 truncate max-w-[10rem] sm:max-w-xs">
                  {familyDetail.family_name}
                </span>
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
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => goFamily(gradeDetail.id, f.id)}
                    className="text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <Card className="border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all h-full">
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
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grades.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => goGrade(g.id)}
                className="text-left rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <Card className="border-neutral-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md transition-all h-full">
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
            ))}
          </div>
        )}
      </div>
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
