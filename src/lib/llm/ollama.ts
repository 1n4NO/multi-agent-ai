import axios from "axios";
import { throwIfAborted } from "@/lib/utils/abort";

const OLLAMA_URL = "http://localhost:11434/api/generate";

export async function callLLM(
	prompt: string,
	signal?: AbortSignal
): Promise<string> {
  throwIfAborted(signal);
  const response = await axios.post(OLLAMA_URL, {
    model: "llama3",
    prompt,
    stream: false,
  }, {
    signal,
  });

  throwIfAborted(signal);
  return response.data.response;
}
