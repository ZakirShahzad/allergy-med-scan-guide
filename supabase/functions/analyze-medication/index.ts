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

    // Initialize Supabase client first to get user profile
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

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Always return demo response if token is missing
    if (!openaiApiKey) {
      console.log('Creating demo response - OpenAI API key not configured');
      const analysisResult = {
        name: "Unable to Analyze",
        ingredients: ["Image could not be analyzed"],
        warnings: ["Unable to identify this medication from the image. Please ensure the image is clear and shows the medication label or packaging."],
        allergenRisk: "medium" as const,
        recommendations: [
          "Try taking a clearer photo with better lighting",
          "Make sure the medication label is visible and not blurred",
          "Consult with a pharmacist or healthcare provider for medication identification"
        ],
        hasUserProfile: hasProfileData,
        timestamp: new Date().toISOString(),
        note: "Demo response - configure OpenAI API key for real analysis"
      };
      
      console.log('Returning demo analysis result');
      return new Response(JSON.stringify(analysisResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    console.log('OpenAI API key found');

    console.log('Calling OpenAI API...');
    console.log('Has profile data:', hasProfileData);

    // Create the detailed prompt for OpenAI
    const analysisPrompt = hasProfileData 
      ? `Analyze this medication image. Extract the medication name, active ingredients, and provide safety analysis based on user allergies: ${allergies.join(', ')} and medical conditions: ${medicalConditions.join(', ')}. Return ONLY valid JSON with: name, ingredients (array), warnings (array), allergenRisk (low/medium/high), and recommendations (array).`
      : `Analyze this medication image. Extract the medication name and active ingredients. Since no user allergies or medical conditions are provided, give general safety information. Return ONLY valid JSON with: name, ingredients (array), warnings (array), allergenRisk (always "medium"), and recommendations (array).`;

    let analysisResult;

    try {
      console.log('Attempting OpenAI vision analysis...');
      
      // Call OpenAI GPT-4o (vision model)
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: analysisPrompt
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

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponseText = data.choices[0].message.content;

      console.log('OpenAI analysis response:', aiResponseText);
      
      // Try to extract JSON from the response
      let jsonContent = aiResponseText.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      
      // Try to parse as JSON
      try {
        analysisResult = JSON.parse(jsonContent);
        console.log('Successfully parsed OpenAI response');
      } catch (jsonError) {
        console.error('JSON parsing failed:', jsonError);
        throw new Error('Response is not valid JSON');
      }
      
    } catch (apiError) {
      console.error('OpenAI API error:', apiError);
      console.log('Falling back to demo response due to API error');
      
      // Create fallback response when API fails
      analysisResult = {
        name: "Unable to Analyze",
        ingredients: ["Image could not be analyzed"],
        warnings: ["Unable to identify this medication from the image. Please ensure the image is clear and shows the medication label or packaging."],
        allergenRisk: "medium" as const,
        recommendations: [
          "Try taking a clearer photo with better lighting",
          "Make sure the medication label is visible and not blurred",
          "Consult with a pharmacist or healthcare provider for medication identification"
        ],
        hasUserProfile: hasProfileData,
        timestamp: new Date().toISOString(),
        note: "API temporarily unavailable - this is a fallback response"
      };
      
      return new Response(JSON.stringify(analysisResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Validate required fields and ensure arrays are arrays
    if (!analysisResult.name || !analysisResult.ingredients || !analysisResult.allergenRisk) {
      console.error('Missing required fields in OpenAI response');
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

    // Check for allergies and add positive feedback if safe
    if (hasProfileData && analysisResult.ingredients.length > 0) {
      const ingredientText = analysisResult.ingredients.join(' ').toLowerCase();
      const allergyText = allergies.join(' ').toLowerCase();
      
      // Simple check if any known allergies appear in ingredients
      const hasAllergyMatch = allergies.some(allergy => 
        ingredientText.includes(allergy.toLowerCase())
      );
      
      if (!hasAllergyMatch && analysisResult.allergenRisk === 'low') {
        // Add positive message when medication appears safe
        analysisResult.recommendations = [
          `Good news! This medication does not contain any of your known allergies: ${allergies.join(', ')}`,
          ...(analysisResult.recommendations || [])
        ];
      }
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