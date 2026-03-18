import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/** AI Design Recommendations — accepts room data + style preferences, returns suggestions */
Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { roomId, projectGoals, preferredStyles, budget } = await req.json();

  if (!roomId) {
    return new Response(JSON.stringify({ error: "roomId is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // TODO: Call OpenAI / Anthropic API to generate design recommendations
  // based on room scan data, user style preferences, and budget
  const suggestions = [
    {
      style: preferredStyles?.[0] ?? "modern",
      description: "AI-generated recommendation placeholder",
      estimatedCost: budget ?? 5000,
      furnitureItems: [],
    },
  ];

  return new Response(JSON.stringify({ suggestions }), {
    headers: { "Content-Type": "application/json" },
  });
});
