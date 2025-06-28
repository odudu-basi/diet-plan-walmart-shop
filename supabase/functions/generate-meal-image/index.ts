
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const { mealName, mealType } = await req.json();

    if (!mealName) {
      throw new Error('Meal name is required');
    }

    console.log('Generating image for meal:', mealName);

    const prompt = `A beautifully plated ${mealName}, professional food photography, appetizing ${mealType} dish, high quality, well-lit, restaurant-style presentation, vibrant colors, garnished appropriately`;

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'high',
        output_format: 'webp',
        output_compression: 85
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const imageBase64 = data.data[0].b64_json;

    console.log('Image generated successfully for:', mealName);

    return new Response(JSON.stringify({ 
      imageUrl: `data:image/webp;base64,${imageBase64}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-meal-image function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to generate meal image' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
