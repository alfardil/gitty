type StreamRequest = {
  username: string;
  repo: string;
  instructions: string;
};

type OnMessage = (data: any) => void;
type OnError = (error: Error) => void;

export async function streamGenerate(
  req: StreamRequest,
  onMessage: OnMessage,
  onError: OnError
): Promise<void> {
  try {
    const response = await fetch("http://localhost:8000/generate/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req),
    });

    if (!response.body) {
      onError(new Error("No response body"));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Split by double newlines (SSE format)
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";

      for (const part of parts) {
        if (part.startsWith("data: ")) {
          try {
            const json = JSON.parse(part.slice(6));
            onMessage(json);
          } catch (e) {
            onError(e as Error);
          }
        }
      }
    }

    // Process any remaining data in buffer
    if (buffer.startsWith("data: ")) {
      try {
        const json = JSON.parse(buffer.slice(6));
        onMessage(json);
      } catch (e) {
        onError(e as Error);
      }
    }
  } catch (err) {
    onError(err as Error);
  }
}
