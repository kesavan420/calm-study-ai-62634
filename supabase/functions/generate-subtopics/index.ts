import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { subjectName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Generating subtopics for subject:', subjectName);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a helpful educational assistant. Generate 8-10 relevant subtopics for the given subject. Return ONLY a JSON array of strings with subtopic names, no additional text or formatting."
          },
          {
            role: "user",
            content: `Generate 8-10 relevant subtopics for studying: ${subjectName}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Rate limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        console.error("Payment required");
        return new Response(
          JSON.stringify({ error: "AI credits depleted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    console.log('AI response:', content);

    // Parse the JSON array from the response
    let subtopics;
    try {
      // Try to extract JSON array from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        subtopics = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON found, split by newlines and clean up
        subtopics = content
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line && !line.startsWith('[') && !line.startsWith(']'))
          .map((line: string) => line.replace(/^[-•*\d.]+\s*/, '').replace(/^["']|["']$/g, '').trim())
          .filter((line: string) => line.length > 0);
      }
    } catch (parseError) {
      console.error('Parse error:', parseError);
      // Fallback: split by newlines
      subtopics = content
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line && line.length > 2)
        .slice(0, 10);
    }

    console.log('Generated subtopics:', subtopics);

    return new Response(
      JSON.stringify({ subtopics }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-subtopics function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
