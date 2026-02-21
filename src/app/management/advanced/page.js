'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { KidsTable } from '@/components/kids-table';
import { Button } from '@/components/ui/button';

export default function AdvancedManagementPage() {
  const router = useRouter();
  const [requestingUserId, setRequestingUserId] = useState(null);
  const [isSuperuser, setIsSuperuser] = useState(false);

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
      setIsSuperuser(true);
      setRequestingUserId(String(user.id));
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

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
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Our Students
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          View and manage kid records with family, grade, and academic information.
        </p>
        <KidsTable requestingUserId={requestingUserId} />
      </div>
    </div>
  );
}
