import axios from 'axios';
import { NextResponse } from 'next/server';

export const revalidate = 5400; // 1.5 hour cache to protect NewsAPI free tier (100 req/day)

const API_KEY = 'f03278859c2c49f29003d201d1f85c2c';
const CATEGORIES = ['business', 'technology', 'entertainment', 'sports', 'science'];

async function fetchCategory(category) {
  const { data } = await axios.get('https://newsapi.org/v2/top-headlines', {
    params: {
      apiKey: API_KEY,
      category,
      language: 'en',
      pageSize: 10,
      country: 'us', // Required for category; yields English headlines
    },
  });
  return { category, articles: data.articles || [] };
}

export async function GET() {
  try {
    const results = await Promise.all(
      CATEGORIES.map((category) => fetchCategory(category))
    );

    const trending = results.reduce((acc, { category, articles }) => {
      acc[category] = (articles || []).map((article) => ({
        title: article.title,
        description: article.description,
        content: article.content,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        source: article.source?.name,
        author: article.author,
      }));
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      trending,
    });
  } catch (error) {
    const status = error.response?.status;
    const message =
      status === 429
        ? 'News rate limit exceeded. Please try again later.'
        : error.response?.data?.message || 'Failed to fetch trending news.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
