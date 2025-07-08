import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { HfInference } from 'https://esm.sh/@huggingface/inference@2.3.2';

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

    const hfToken = Deno.env.get('HUGGING_FACE_ACCESS_TOKEN');
    if (!hfToken) {
      console.error('Hugging Face token not found in environment');
      throw new Error('Hugging Face token not configured');
    }
    console.log('Hugging Face token found');

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

    console.log('Calling Hugging Face API...');
    console.log('Has profile data:', hasProfileData);

    // Initialize Hugging Face client
    const hf = new HfInference(hfToken);

    // Convert base64 to blob for Hugging Face API
    const base64Data = imageData.split(',')[1];
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const imageBlob = new Blob([bytes], { type: 'image/jpeg' });

    // Use Hugging Face for image analysis
    // First, get image description using BLIP
    const imageDescription = await hf.imageToText({
      data: imageBlob,
      model: 'Salesforce/blip-image-captioning-base'
    });

    console.log('Image description:', imageDescription.generated_text);

    // Create a detailed prompt for text generation based on the image description
    const analysisPrompt = hasProfileData 
      ? `Based on this medication image description: "${imageDescription.generated_text}"
      
      User has allergies to: ${allergies.join(', ')}
      User has medical conditions: ${medicalConditions.join(', ')}
      
      Analyze this medication and provide a JSON response with:
      - name: medication name
      - ingredients: array of active ingredients
      - warnings: array of safety warnings specific to user's allergies/conditions
      - allergenRisk: "low", "medium", or "high" based on user profile
      - recommendations: array of recommendations
      
      Return ONLY valid JSON.`
      : `Based on this medication image description: "${imageDescription.generated_text}"
      
      Analyze this medication and provide a JSON response with:
      - name: medication name
      - ingredients: array of active ingredients  
      - warnings: array of general safety warnings
      - allergenRisk: "medium" (since no user profile available)
      - recommendations: array of general recommendations
      
      Return ONLY valid JSON.`;

    // Use text generation for structured analysis
    const analysisResponse = await hf.textGeneration({
      model: 'microsoft/DialoGPT-medium',
      inputs: analysisPrompt,
      parameters: {
        max_new_tokens: 500,
        temperature: 0.3,
        return_full_text: false
      }
    });

    console.log('Hugging Face analysis response:', analysisResponse);
    
    let aiResponseText = analysisResponse.generated_text || imageDescription.generated_text;

    // Parse AI response
    let analysisResult;
    try {
      console.log('Raw Hugging Face response:', aiResponseText);
      
      // Try to extract JSON from the response
      let jsonContent = aiResponseText.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      
      // Try to parse as JSON, if it fails, create structured response
      try {
        analysisResult = JSON.parse(jsonContent);
      } catch (jsonError) {
        throw new Error('Response is not valid JSON');
      }
      
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
      
      console.log('Successfully parsed Hugging Face response');
      
    } catch (parseError) {
      console.error('Response parsing failed:', parseError);
      console.log('Creating fallback structured response from image description');
      
      // Extract medication name from image description
      const description = imageDescription.generated_text || 'medication';
      const medicationName = description.includes('medicine') || description.includes('pill') || description.includes('tablet') 
        ? description.split(' ').find(word => word.length > 3) || 'Unknown Medication'
        : 'Medication (from image)';
      
      // Create a structured response from the image description
      analysisResult = {
        name: medicationName,
        ingredients: ["Unable to extract specific ingredients from image"],
        warnings: hasProfileData 
          ? [`Based on your allergies (${allergies.join(', ')}) and conditions (${medicalConditions.join(', ')}), please verify ingredients with a healthcare professional`]
          : ["Please verify ingredients and safety with a healthcare professional"],
        allergenRisk: hasProfileData ? "medium" : "medium",
        recommendations: [
          "Consult with a healthcare professional before taking",
          "Verify the medication name and dosage",
          hasProfileData ? "Check ingredients against your known allergies" : "Complete your profile for personalized analysis"
        ],
        rawAnalysis: imageDescription.generated_text,
        parseError: true,
        note: "Analysis based on image recognition - please verify details"
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