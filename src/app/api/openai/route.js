import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 
import { createEmbedding } from "@/lib/embeddings";

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    if (!prompt || prompt.trim() === "") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 1. Generate an embedding for the user's question (384 dimensions)
    const userQueryEmbedding = await createEmbedding(prompt);

    // 2. Search Supabase for relevant content chunks
    const { data: contextChunks, error: supabaseError } = await supabase.rpc(
      "match_documents",
      {
        query_embedding: userQueryEmbedding,
        match_threshold: 0.25, // Lowered slightly to capture more matching data
        match_count: 4,         // 4 chunks provide optimal balance between density and token usage
      }
    );

    if (supabaseError) throw new Error(supabaseError.message);

    // 3. Format the retrieved data with explicit reference boundaries
    const contextText = contextChunks && contextChunks.length > 0
      ? contextChunks.map((chunk, index) => `[DOCUMENT CHUNK ${index + 1}]\n${chunk.content}`).join("\n\n")
      : "No official database document matching context was found.";

    // 4. Send Context + Question to Groq using Llama 3.3 70B
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,   // Lower temperature (0.3) forces factual accuracy and prevents hallucination
      max_tokens: 800,    // Controls output token volume safely
      messages: [
        { 
          role: "system", 
          content: `You are the official AI Data Assistant for the Agahozo-Shalom Youth Village (ASYV). 
Your goal is to provide clear, professional, and accurate answers based on the provided reference material.

CRITICAL INSTRUCTIONS:
1. Prioritize the provided CONTEXT documents to answer the question.
2. If the CONTEXT contains the answer, ground your response entirely on it. Do not invent outside facts.
3. If the CONTEXT does not contain sufficient information, use your general knowledge to answer, but explicitly begin your response with this phrase: "Based on general knowledge (not found in current ASYV documents):"
4. Maintain a supportive, helpful, and organized tone. Use clear bullet points if listing information.

PROVIDED CONTEXT DOCUMENTS:
=========================================
${contextText}
=========================================` 
        },
        { role: "user", content: prompt },
      ],
    });

    return NextResponse.json({ text: response.choices[0].message.content });
  } catch (error) {
    console.error("RAG Pipeline Error:", error);
    return NextResponse.json({ error: "Failed to process your request." }, { status: 500 });
  }
}
