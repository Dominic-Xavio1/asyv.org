import { OpenAI } from "openai";
import { NextResponse } from "next/server";

// 1. Point the client to Groq's address
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req) {
  const { prompt } = await req.json();

  try {
    const response = await openai.chat.completions.create({
      // 2. Use a Groq-supported model (Llama 3 is great and fast)
      model: "llama-3.3-70b-versatile", 
      messages: [
        { role: "system", content: "You are a helpful project assistant." },
        { role: "user", content: prompt },
      ],
    });

    return NextResponse.json({ text: response.choices[0].message.content });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}