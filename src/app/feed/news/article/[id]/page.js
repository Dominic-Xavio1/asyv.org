'use client';



import { useState, useEffect } from 'react';

import { useRouter, useParams } from 'next/navigation';

import Image from 'next/image';

import Link from 'next/link';

import { ArrowLeft, Calendar, MapPin, Clock, User, Newspaper, Loader, AlertCircle } from 'lucide-react';



export default function ArticlePage() {

  const [content, setContent] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  const [contentType, setContentType] = useState(null); // 'news' or 'event'

  const router = useRouter();

  const params = useParams();

  const id = params.id;



  useEffect(() => {

    const fetchContent = async () => {

      try {

        setLoading(true);

        setError(null);

        

        // First, try to fetch as a village event

        const eventResponse = await fetch(`/api/village-events/${id}`);

        console.log("The village evnets ",eventResponse)

        if (eventResponse.ok) {

          const eventData = await eventResponse.json();

          if (eventData.success) {

            setContent(eventData.event);

            setContentType('event');

            return;

          }

        }

        

        // If not found as event, try to get from sessionStorage (news article)

        if (typeof window !== 'undefined') {

          const stored = sessionStorage.getItem('trending-news-article');

          if (stored) {

            const articleData = JSON.parse(stored);

            // Check if this article matches the current ID

            if (articleData.id === id || (!id && articleData)) {

              setContent(articleData);

              setContentType('news');

              return;

            }

          }

        }

        

        // If nothing found, show error

        setError('Content not found');

        

      } catch (err) {

        console.error('Error loading content:', err);

        setError('Failed to load content');

      } finally {

        setLoading(false);

      }

    };



    if (id) {

      fetchContent();

    } else {

      // Fallback to sessionStorage for backward compatibility

      if (typeof window !== 'undefined') {

        try {

          const stored = sessionStorage.getItem('trending-news-article');

          if (stored) {

            setContent(JSON.parse(stored));

            setContentType('news');

          }

        } catch (e) {

          console.error('Error loading article:', e);

          setError('Failed to load content');

        }

      }

      setLoading(false);

    }

  }, [id]);



  if (loading) {

    return (

      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center">

        <div className="text-center">

          <Loader className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />

          <p className="text-gray-600 dark:text-gray-400">Loading content...</p>

        </div>

      </div>

    );

  }



  if (error || !content) {

    return (

      <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 flex items-center justify-center">

        <div className="text-center max-w-md mx-auto p-6">

          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />

          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">

            Content Not Found

          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">

            {error || 'The content you\'re looking for doesn\'t exist or has been removed.'}

          </p>

          <Link

            href="/feed"

            className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"

          >

            <ArrowLeft className="w-4 h-4" />

            Back to Feed

          </Link>

        </div>

      </div>

    );

  }



  // Render Village Event

  if (contentType === 'event') {

    return <VillageEventDetail event={content} />;

  }



  // Render News Article (original functionality)

  return <NewsArticleDetail article={content} />;

}



// Village Event Detail Component

function VillageEventDetail({ event }) {

  const formatDate = (dateString) => {

    if (!dateString) return 'Date to be announced';

    const date = new Date(dateString);

    return date.toLocaleDateString('en-US', {

      weekday: 'long',

      year: 'numeric',

      month: 'long',

      day: 'numeric',

    });

  };



  const formatTime = (timeString) => {

    if (!timeString) return '';

    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {

      hour: 'numeric',

      minute: '2-digit',

      hour12: true,

    });

  };



  return (

    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 mt-14">

      <div className="max-w-6xl mx-auto flex flex-row items-start gap-6 ">

        <Link

          href="/feed"

          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 mb-6 transition-colors mt-10"

        >

          <ArrowLeft className="w-4 h-4" />

          Back to Feed

        </Link>

      <div className="container mx-auto px-4 py-6 max-w-4xl">

        

        <article className="bg-white dark:bg-gray-900 rounded-xl border border-neutral-200 dark:border-gray-700 shadow-sm overflow-hidden">

          {/* Event Header Image */}

          {event.image_url && (

            <div className="relative w-full h-64 md:h-96">

              <Image

                src={event.image_url}

                alt={event.title}

                fill

                className="object-cover"

                sizes="(max-width: 768px) 100vw, 672px"

              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6">

                <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">

                  {event.title}

                </h1>

              </div>

            </div>

          )}



          <div className="p-6 sm:p-8">

            {/* Title (if no image) */}

            {!event.image_url && (

              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-6">

                {event.title}

              </h1>

            )}



            {/* Event Meta Information */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">

                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />

                <div>

                  <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>

                  <p className="font-semibold text-gray-800 dark:text-gray-200">

                    {formatDate(event.event_date)}

                  </p>

                </div>

              </div>



              <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">

                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />

                <div>

                  <p className="text-sm text-gray-600 dark:text-gray-400">Time</p>

                  <p className="font-semibold text-gray-800 dark:text-gray-200">

                    {formatTime(event.event_time) || 'Time to be announced'}

                  </p>

                </div>

              </div>



              <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">

                <MapPin className="w-5 h-5 text-purple-600 dark:text-purple-400" />

                <div>

                  <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>

                  <p className="font-semibold text-gray-800 dark:text-gray-200">

                    {event.location || 'Location to be announced'}

                  </p>

                </div>

              </div>

            </div>



            {/* Event Type */}

            {event.event_type && (

              <div className="mb-6">

                <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">

                  {event.event_type.charAt(0).toUpperCase() + event.event_type.slice(1)}

                </span>

              </div>

            )}



            {/* Event Description */}

            <div className="space-y-4">

              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">

                About This Event

              </h2>

              <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">

                {event.content || 'No description available.'}

              </div>

            </div>



            {/* Organizer Information */}

            <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">

              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">

                Event Organizer

              </h3>

              <div className="flex items-center gap-4">

                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">

                  <User className="w-6 h-6 text-green-600 dark:text-green-400" />

                </div>

                <div>

                  <p className="font-semibold text-gray-800 dark:text-gray-200">

                    {event.full_name || event.username || 'ASYV Team'}

                  </p>

                  {event.email && (

                    <p className="text-sm text-gray-600 dark:text-gray-400">

                      Contact: {event.email}

                    </p>

                  )}

                </div>

              </div>

            </div>



            {/* Event Date Information */}

            <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">

              <p>Posted on {new Date(event.created_at).toLocaleDateString('en-US', {

                weekday: 'long',

                year: 'numeric',

                month: 'long',

                day: 'numeric',

              })}</p>

            </div>

          </div>

        </article>

      </div>

    </div>

  </div>

  );

}



// News Article Detail Component (original functionality)

function NewsArticleDetail({ article }) {

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

    <div className="min-h-screen bg-neutral-50 dark:bg-gray-900 ">

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

                <ArrowLeft className="w-4 h-4 rotate-180" />

              </a>

            )}

          </div>

        </article>

      </div>

    </div>

  );

}

