import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/** AI Chat — handles conversation for room design assistance */
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { chatSessionId, message, roomDesignContext } = await req.json();

  if (!chatSessionId || !message) {
    return new Response(
      JSON.stringify({ error: "chatSessionId and message are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  // TODO: Call AI provider with conversation history + room context
  // to provide design advice, furniture suggestions, and layout changes
  const reply = {
    role: "assistant",
    content:
      "I can help you with your room design! This is a placeholder response. " +
      "Once connected to an AI provider, I'll be able to suggest furniture, " +
      "color schemes, and layout changes.",
  };

  return new Response(JSON.stringify(reply), {
    headers: { "Content-Type": "application/json" },
  });
});
