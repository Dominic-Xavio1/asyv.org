import { OpenAI } from "openai";
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase"; 
import { createEmbedding } from "@/lib/embeddings"; // Use the same 384-dim function

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req) {
  const { prompt } = await req.json();

  try {
    // 1. Generate an embedding for the user's question (384 dimensions)
    const userQueryEmbedding = await createEmbedding(prompt);

    // 2. Search Supabase for relevant content chunks
    const { data: contextChunks, error: supabaseError } = await supabase.rpc(
      "match_documents", // The SQL function we created earlier
      {
        query_embedding: userQueryEmbedding,
        match_threshold: 0.3, // Adjust this if you get no results (0.1 to 0.7)
        match_count: 5,        // Number of chunks to feed Groq
      }
    );

    if (supabaseError) throw new Error(supabaseError.message);

    // 3. Format the retrieved data into a single string
    const contextText = contextChunks
      ?.map((chunk) => chunk.content)
      .join("\n---\n") || "No specific context found.";

    // 4. Send both Context + Question to Groq
    const response = await openai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { 
          role: "system", 
          content: `You are a helpful assistant for ASYV. 
          Use the following context to answer the user's question accurately. 
          If the context doesn't contain the answer, use your general knowledge but mention it's not in the documents.
          
          CONTEXT:
          ${contextText}` 
        },
        { role: "user", content: prompt },
      ],
    });

    return NextResponse.json({ text: response.choices[0].message.content });
  } catch (error) {
    console.error("RAG Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
