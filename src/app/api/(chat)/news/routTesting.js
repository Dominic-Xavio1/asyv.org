import axios from "axios";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const response = await axios.get('https://newsapi.org/v2/top-headlines', {
      params: {
        language: 'en',
        category: 'general',
        pageSize: 5,
        apiKey: 'f03278859c2c49f29003d201d1f85c2c'
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: response.data.articles, 
      message: "Top 5 news articles" 
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error.response?.data?.message || "Failed to fetch news" 
    }, { status: 500 });
  }
}
