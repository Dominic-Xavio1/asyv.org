'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Calendar, ExternalLink, Newspaper, Loader } from 'lucide-react';

export default function NewsArticlePage() {
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem('trending-news-article');
      if (stored) {
        setArticle(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading article:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No article selected</p>
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 text-green-600 dark:text-green-400 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  const categoryLabel = (article.category || '').charAt(0).toUpperCase() + (article.category || '').slice(1);
  const publishedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Feed
        </Link>

        <article className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 shadow-sm overflow-hidden">
          {article.urlToImage && (
            <div className="relative w-full aspect-video bg-neutral-200 dark:bg-gray-800">
              <Image
                src={article.urlToImage}
                alt={article.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="inline-block px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-full">
                  {categoryLabel}
                </span>
              </div>
            </div>
          )}

          <div className="p-6 sm:p-8">
            {!article.urlToImage && (
              <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full mb-4">
                {categoryLabel}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-500 dark:text-gray-400">
              {article.source && (
                <span className="flex items-center gap-1.5">
                  <Newspaper className="w-4 h-4" />
                  {article.source}
                </span>
              )}
              {publishedDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {publishedDate}
                </span>
              )}
            </div>

            {(article.description || article.content) && (
              <div className="mt-6 space-y-4 text-gray-700 dark:text-gray-300 leading-relaxed">
                {article.description && (
                  <p className="text-base sm:text-lg">{article.description}</p>
                )}
                {article.content && (
                  <p className="text-base">{article.content}</p>
                )}
              </div>
            )}

            {article.url && (
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
              >
                Read Full Article at Source
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}
