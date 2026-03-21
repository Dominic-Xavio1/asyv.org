import { createEmbedding } from "../src/lib/embeddings.js";
import { chunkText } from "../src/lib/chunkText.js";
import { supabase } from "../src/lib/supabase.js";

async function ingestDocument(text) {
  try {
    const chunks = chunkText(text);
    console.log(`Starting ingestion: ${chunks.length} chunks found.`);

    for (const [index, chunk] of chunks.entries()) {
      const embedding = await createEmbedding(chunk);
      const { error } = await supabase.from("documents").insert({
        content: chunk,
        metadata: { source: "ASYV document" },
        embedding: embedding,
      });

      if (error) {
        console.error(`❌ Error storing chunk ${index}:`, error.message);
      } else {
        console.log(`✅ Stored chunk ${index + 1}/${chunks.length}`);
      }
    }
    
    console.log("✨ All chunks processed.");
  } catch (err) {
    console.error("❌ Fatal error during ingestion:", err);
  }
}

const document = `
Agahozo Shalom Youth Village provides education, 
leadership development, and healing for youth.
`;
await ingestDocument(document);
process.exit(0);
