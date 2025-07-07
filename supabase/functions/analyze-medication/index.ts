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
    console.log('=== MEDICATION ANALYSIS START ===');
    
    const { imageData, userId } = await req.json();
    console.log('Request data:', { userId, imageDataLength: imageData?.length });
    
    if (!imageData) {
      console.error('No image data provided');
      throw new Error('No image data provided');
    }

    if (!userId) {
      console.error('No user ID provided');
      throw new Error('User authentication required');
    }

    // Validate image format
    if (!imageData.startsWith('data:image/')) {
      console.error('Invalid image format, expected data URL');
      throw new Error('Invalid image format');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.error('OpenAI API key not found in environment');
      throw new Error('OpenAI API key not configured');
    }
    console.log('OpenAI API key found');

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    console.log('Supabase client initialized');

    // Get user's allergy profile
    console.log('Fetching user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('allergies, medical_conditions, display_name')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      throw new Error(`Failed to fetch user profile: ${profileError.message}`);
    }

    console.log('Profile data:', profile);
    const allergies = profile?.allergies || [];
    const medicalConditions = profile?.medical_conditions || [];
    const hasProfileData = allergies.length > 0 || medicalConditions.length > 0;

    // Create optimized system prompt
    const systemPrompt = hasProfileData 
      ? `You are a medical assistant analyzing medication images. Extract the medication name, active ingredients, and provide safety analysis based on user allergies: ${allergies.join(', ')} and medical conditions: ${medicalConditions.join(', ')}. Return ONLY valid JSON with: name, ingredients (array), warnings (array), allergenRisk (low/medium/high), and recommendations (array).`
      : `You are a medical assistant analyzing medication images. Extract the medication name and active ingredients. Since no user allergies or medical conditions are provided, give general safety information. Return ONLY valid JSON with: name, ingredients (array), warnings (array), allergenRisk (always "medium"), and recommendations (array).`;

    console.log('Calling OpenAI API...');
    console.log('Has profile data:', hasProfileData);

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
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: hasProfileData 
                  ? 'Analyze this medication image and determine if it\'s safe for someone with the specified allergies and medical conditions.'
                  : 'Analyze this medication image and provide general medication information and safety guidelines.'
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
        max_tokens: 1000,
        temperature: 0.3
      }),
    });

    console.log('OpenAI API response status:', response.status);
    const aiResponse = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', aiResponse);
      throw new Error(`OpenAI API error: ${aiResponse.error?.message || 'Unknown error'}`);
    }
    
    console.log('OpenAI API call successful');

    // Parse AI response
    let analysisResult;
    try {
      const content = aiResponse.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }
      
      console.log('Raw AI response content:', content);
      
      // Try to extract JSON from the response
      let jsonContent = content.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      
      analysisResult = JSON.parse(jsonContent);
      
      // Validate required fields
      if (!analysisResult.name || !analysisResult.ingredients || !analysisResult.allergenRisk) {
        throw new Error('Missing required fields in AI response');
      }
      
      // Ensure arrays are arrays
      if (!Array.isArray(analysisResult.ingredients)) {
        analysisResult.ingredients = [analysisResult.ingredients].filter(Boolean);
      }
      if (!Array.isArray(analysisResult.warnings)) {
        analysisResult.warnings = [analysisResult.warnings].filter(Boolean);
      }
      if (!Array.isArray(analysisResult.recommendations)) {
        analysisResult.recommendations = [analysisResult.recommendations].filter(Boolean);
      }
      
      console.log('Successfully parsed AI response');
      
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.log('Creating fallback structured response');
      
      const content = aiResponse.choices[0]?.message?.content || 'Unable to analyze medication';
      
      // Create a structured response from the raw content
      analysisResult = {
        name: hasProfileData ? "Medication Analysis (Parsing Error)" : "General Medication Analysis",
        ingredients: ["Could not extract ingredients from image"],
        warnings: hasProfileData 
          ? ["Unable to check against your specific allergies - please review manually"]
          : ["Please review with healthcare professional"],
        allergenRisk: "medium" as const,
        recommendations: [
          "Consult with a healthcare professional",
          hasProfileData ? "Manually check ingredients against your known allergies" : "Complete your profile for personalized analysis"
        ],
        rawAnalysis: content,
        parseError: true
      };
    }

    // Add metadata
    analysisResult.hasUserProfile = hasProfileData;
    analysisResult.timestamp = new Date().toISOString();
    
    console.log('Final analysis result:', analysisResult);
    console.log('=== MEDICATION ANALYSIS COMPLETE ===');
    
    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('=== MEDICATION ANALYSIS ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    
    return new Response(JSON.stringify({ 
      error: 'Analysis failed', 
      details: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});