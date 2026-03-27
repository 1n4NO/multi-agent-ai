import axios from "axios";

const OLLAMA_URL = "http://localhost:11434/api/generate";

export async function callLLM(prompt: string): Promise<string> {
  const response = await axios.post(OLLAMA_URL, {
    model: "llama3",
    prompt,
    stream: false,
  });

  return response.data.response;
}