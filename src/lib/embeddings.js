import 'dotenv/config'
import { InferenceClient } from "@huggingface/inference"

const hf = new InferenceClient(process.env.HF_API_KEY)

export async function createEmbedding(text) {

  const embedding = await hf.featureExtraction({
    model: "sentence-transformers/all-MiniLM-L6-v2",
    inputs: text
  })

  return embedding
}