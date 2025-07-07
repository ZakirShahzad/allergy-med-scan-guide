import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, userId } = await req.json();
    
    console.log('Analyzing medication for user:', userId);
    
    if (!imageData) {
      throw new Error('No image data provided');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Get user's allergy profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('allergies, medical_conditions')
      .eq('user_id', userId)
      .maybeSingle();

    const allergies = profile?.allergies || [];
    const medicalConditions = profile?.medical_conditions || [];

    // Analyze image with OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a medical assistant analyzing medication images. Extract the medication name, active ingredients, and provide safety analysis based on user allergies: ${allergies.join(', ')} and medical conditions: ${medicalConditions.join(', ')}. Return JSON format with: name, ingredients, warnings, allergenRisk (low/medium/high), and recommendations.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this medication image and determine if it\'s safe for someone with the specified allergies and medical conditions.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      }),
    });

    const aiResponse = await response.json();
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.error?.message || 'Unknown error'}`);
    }

    // Parse AI response
    let analysisResult;
    try {
      const content = aiResponse.choices[0].message.content;
      console.log('Raw AI response content:', content);
      
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.log('JSON parsing failed, creating structured response from raw content');
      const content = aiResponse.choices[0].message.content || 'Unable to analyze medication';
      
      // Create a structured response from the raw content
      analysisResult = {
        name: "Medication Analysis",
        ingredients: ["Analysis from uploaded image"],
        warnings: [content.includes('allerg') ? 'Potential allergy concerns detected' : 'Please review with healthcare professional'],
        allergenRisk: content.includes('high') ? 'high' : content.includes('low') ? 'low' : 'medium',
        recommendations: ["Please consult with a healthcare professional for personalized advice"],
        rawAnalysis: content
      };
    }

    console.log('Final analysis result:', analysisResult);
    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-medication function:', error);
    return new Response(JSON.stringify({ 
      error: 'Analysis failed', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});