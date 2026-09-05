import { createEmbedding } from "../src/lib/embeddings.js";
import { chunkText } from "../src/lib/chunkText.js";
import { supabase } from "../src/lib/supabase.js";
import { readFile } from "fs/promises";

async function ingestDocument(text) {
  try {
    const chunks = chunkText(text);
    console.log(`Starting ingestion: ${chunks.length} chunks found.`);

    // 1. Create an array to hold all data rows
    const rowsToInsert = [];

    for (const [index, chunk] of chunks.entries()) {
      console.log(`🧠 Generating embedding for chunk ${index + 1}/${chunks.length}...`);
      const embedding = await createEmbedding(chunk);
      
      rowsToInsert.push({
        content: chunk,
        metadata: { source: "ASYV document" },
        embedding: embedding,
      });
    }
    
    console.log(`🚀 Sending ${rowsToInsert.length} fresh chunks to Supabase in a single batch...`);

    // 2. Insert everything in one clean database call
    const { error } = await supabase.from("documents").insert(rowsToInsert);

    if (error) {
      console.error(`❌ Error storing batch data:`, error.message);
    } else {
      console.log("✨ All chunks processed and stored successfully into your clean table!");
    }
  } catch (err) {
    console.error("❌ Fatal error during ingestion:", err);
  }
}

const document = await readFile("./scripts/appData.txt", "utf-8");
console.log("Document read successfully. Total characters:", document.length);
await ingestDocument(document);
process.exit(0);
