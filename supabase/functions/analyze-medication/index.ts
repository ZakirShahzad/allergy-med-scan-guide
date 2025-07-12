import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ANALYZE-MEDICATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('=== FOOD-MEDICATION INTERACTION ANALYSIS START ===');
    
    const { imageData, productName, analysisType, userId } = await req.json();
    logStep('Request data received', { 
      userId, 
      analysisType, 
      productName, 
      imageDataLength: imageData?.length,
      hasImageData: !!imageData 
    });
    
    if (!userId) {
      logStep('ERROR: No user ID provided');
      throw new Error('User authentication required');
    }

    if (!imageData && !productName) {
      logStep('ERROR: No image data or product name provided');
      throw new Error('Either image data or product name is required');
    }

    // Get the authorization token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logStep('ERROR: No authorization header provided');
      throw new Error('Authorization header required');
    }

    // Initialize Supabase client with user authentication
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );
    logStep('Supabase client initialized with user auth');

    // Check scan usage first
    logStep('Checking scan usage...');
    try {
      const { data: scanCheck, error: scanError } = await supabase
        .rpc('increment_scan_usage', {
          p_user_id: userId,
          p_product_identified: false // Don't increment yet, just check
        });

      if (scanError) {
        logStep('Scan usage check error', { error: scanError });
        throw new Error(`Failed to check scan usage: ${scanError.message}`);
      }

      const { scans_remaining, is_subscribed } = scanCheck[0];
      logStep('Scan usage check result', { scans_remaining, is_subscribed });

      // If user has no scans left and is not subscribed, return limit message
      if (!is_subscribed && scans_remaining <= 0) {
        logStep('User has reached scan limit');
        return new Response(JSON.stringify({
          error: 'scan_limit_reached',
          message: 'You have reached your monthly scan limit. Please upgrade to continue scanning.',
          scans_remaining: 0,
          is_subscribed: false
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 429
        });
      }
    } catch (scanError) {
      logStep('Scan check failed, continuing with analysis', { error: scanError });
      // Don't block analysis if scan check fails - just log the error
    }

    // Get user's current medications with retry logic
    logStep('Fetching user medications...');
    let userMedications = [];
    try {
      const { data: medications, error: medicationsError } = await supabase
        .from('user_medications')
        .select('medication_name, dosage, frequency, purpose, notes')
        .eq('user_id', userId);

      if (medicationsError) {
        logStep('Medications fetch error', { error: medicationsError });
        // Continue without medications rather than failing
        userMedications = [];
      } else {
        userMedications = medications || [];
      }
    } catch (medError) {
      logStep('Medications fetch failed, continuing without medications', { error: medError });
      userMedications = [];
    }

    logStep('User medications loaded', { count: userMedications.length });
    const hasMedications = userMedications.length > 0;

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Create proper demo response if OpenAI key is missing
    if (!openaiApiKey) {
      logStep('OpenAI API key not configured, creating demo response');
      
      const demoProductName = productName || "Demo Product";
      
      if (!hasMedications) {
        const analysisResult = {
          productName: demoProductName,
          compatibilityScore: 85,
          interactionLevel: "neutral" as const,
          pros: ["No medications to check interactions with"],
          cons: ["Add your medications to get personalized interaction analysis"],
          alternatives: [],
          userMedications: [],
          timestamp: new Date().toISOString(),
          note: "Please add your medications for personalized analysis"
        };
        
        logStep('Returning demo response - no medications');
        return new Response(JSON.stringify(analysisResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
      
      const analysisResult = {
        productName: demoProductName,
        compatibilityScore: 75,
        interactionLevel: "neutral" as const,
        pros: ["Demo analysis - configure OpenAI API key for detailed results"],
        cons: [`Limited analysis available for your ${userMedications.length} medication(s) without API access`],
        alternatives: [],
        userMedications: userMedications.map(med => med.medication_name),
        timestamp: new Date().toISOString(),
        note: "Demo response - configure OpenAI API key for real analysis"
      };
      
      logStep('Returning demo analysis result');
      return new Response(JSON.stringify(analysisResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    logStep('OpenAI API key found, proceeding with real analysis');

    // Handle case with no medications - return early with appropriate response
    if (!hasMedications) {
      const analysisResult = {
        productName: productName || "Product from image",
        compatibilityScore: 85,
        interactionLevel: "neutral" as const,
        pros: ["No current medications to check interactions with"],
        cons: ["Add your medications to get personalized food-medication interaction analysis"],
        alternatives: [],
        userMedications: [],
        timestamp: new Date().toISOString(),
        note: "No medications to analyze interactions with"
      };
      
      logStep('No medications to analyze, returning neutral response');
      return new Response(JSON.stringify(analysisResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Create comprehensive medication profile for detailed analysis
    const detailedMedicationProfile = userMedications.map(med => {
      let medDetails = `${med.medication_name}`;
      if (med.dosage) medDetails += ` (${med.dosage})`;
      if (med.frequency) medDetails += ` taken ${med.frequency}`;
      if (med.purpose) medDetails += ` for ${med.purpose}`;
      if (med.notes) medDetails += ` - Additional notes: ${med.notes}`;
      return medDetails;
    }).join('\n');

    let analysisPrompt;
    
    if (imageData) {
      // Validate image data format
      if (!imageData.startsWith('data:image/')) {
        logStep('ERROR: Invalid image data format');
        throw new Error('Invalid image data format provided');
      }
      
      analysisPrompt = `You are a clinical pharmacist with expertise in food-drug interactions. Analyze this food/product image for potential interactions with the following medications:

PATIENT MEDICATION PROFILE:
${detailedMedicationProfile}

ANALYSIS REQUIREMENTS:
1. First identify the food/product in the image. If unclear or not a real food/product, return productName: "Sorry, we couldn't catch that" and compatibilityScore: null.
2. For identified foods/products, research and consider:
   - Known food-drug interactions based on clinical evidence
   - Effects on medication absorption (timing, bioavailability)
   - Potential for increased/decreased medication effects
   - Risk of side effect amplification
   - Nutritional impact on the medical condition being treated
3. Consider dosage and frequency when assessing interaction severity
4. Account for the specific medical purposes when making assessments
5. Be factual and evidence-based - only mention what is clinically relevant

SCORING CRITERIA (based on medication interaction safety only):
- 90-100: No interaction concerns, may provide nutritional benefits for condition
- 80-89: Safe from medication perspective, no significant interactions
- 70-79: Generally safe, minor timing considerations may apply
- 60-69: Caution advised, timing or quantity may matter
- 50-59: Moderate interaction risk, monitoring recommended
- 30-49: Significant interaction, careful monitoring needed
- 0-29: High interaction risk, avoid or consult healthcare provider

IMPORTANT: Focus only on medication safety - do not make general health/nutrition judgments.

If the compatibility score is below 60 (high interaction risk), MUST provide 2-3 alternative products that would be safer with the patient's medications.

Return ONLY valid JSON with:
- productName: string
- compatibilityScore: number (0-100) or null if unidentifiable
- interactionLevel: "positive" | "neutral" | "negative"
- pros: array of positive aspects regarding medication interactions
- cons: array of concerns or precautions regarding medication interactions
- alternatives: array of 2-3 safer alternative products (only if score < 60, otherwise empty array)`;
    } else {
      analysisPrompt = `You are a clinical pharmacist with expertise in food-drug interactions. Analyze the food/product "${productName}" for potential interactions with the following medications:

PATIENT MEDICATION PROFILE:
${detailedMedicationProfile}

ANALYSIS REQUIREMENTS:
1. First determine if "${productName}" is a real, recognizable food or product. If it's gibberish, nonsense, or not a real food/product, respond with productName: "Sorry, we couldn't catch that" and compatibilityScore: null.
2. For real foods/products, research and consider:
   - Known food-drug interactions with ${productName} based on clinical evidence
   - Effects on medication absorption (timing, bioavailability)
   - Potential for increased/decreased medication effects
   - Risk of side effect amplification
   - Nutritional impact on the medical condition being treated
3. Consider dosage and frequency when assessing interaction severity
4. Account for the specific medical purposes when making assessments
5. Be factual and evidence-based - only mention what is clinically relevant

SCORING CRITERIA (based on medication interaction safety only):
- 90-100: No interaction concerns, may provide nutritional benefits for condition
- 80-89: Safe from medication perspective, no significant interactions
- 70-79: Generally safe, minor timing considerations may apply
- 60-69: Caution advised, timing or quantity may matter
- 50-59: Moderate interaction risk, monitoring recommended
- 30-49: Significant interaction, careful monitoring needed
- 0-29: High interaction risk, avoid or consult healthcare provider

IMPORTANT: 
- Focus only on medication safety - do not make general health/nutrition judgments
- If the product name is not a real food/product, return "Sorry, we couldn't catch that"
- If the compatibility score is below 60 (high interaction risk), MUST provide 2-3 alternative products that would be safer with the patient's medications

Return ONLY valid JSON with:
- productName: string (use "Sorry, we couldn't catch that" if not a real product)
- compatibilityScore: number (0-100) or null if unrecognizable
- interactionLevel: "positive" | "neutral" | "negative"
- pros: array of positive aspects regarding medication interactions
- cons: array of concerns or precautions regarding medication interactions
- alternatives: array of 2-3 safer alternative products (only if score < 60, otherwise empty array)`;
    }

    let analysisResult;

    try {
      logStep('Calling OpenAI API for analysis...');
      
      // Call OpenAI API - use vision model if image, otherwise text model
      const requestBody = imageData ? {
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
      } : {
        model: 'gpt-4o',
        messages: [
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.3
      };

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logStep('OpenAI API error', { status: response.status, error: errorText });
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponseText = data.choices[0].message.content;
      logStep('OpenAI response received', { responseLength: aiResponseText?.length });
      
      // Try to extract JSON from the response
      let jsonContent = aiResponseText.trim();
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\n?/, '').replace(/\n?```$/, '');
      }
      
      // Try to parse as JSON
      try {
        analysisResult = JSON.parse(jsonContent);
        logStep('Successfully parsed OpenAI response');
      } catch (jsonError) {
        logStep('JSON parsing failed', { error: jsonError, content: jsonContent.substring(0, 200) });
        throw new Error('Response is not valid JSON');
      }
      
    } catch (apiError) {
      logStep('OpenAI API error occurred', { error: apiError });
      
      // Create fallback response when API fails
      analysisResult = {
        productName: productName || "Unable to analyze at this time",
        compatibilityScore: null,
        interactionLevel: "neutral" as const,
        pros: [],
        cons: [
          "Analysis temporarily unavailable - please try again later",
          "Consult with a pharmacist about food-drug interactions"
        ],
        alternatives: [],
        userMedications: userMedications.map(med => med.medication_name),
        timestamp: new Date().toISOString(),
        note: "Analysis temporarily unavailable due to service error"
      };
      
      logStep('Returning fallback response due to API error');
      return new Response(JSON.stringify(analysisResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Validate and clean up the response
    if (!analysisResult.productName || !analysisResult.interactionLevel) {
      logStep('ERROR: Missing required fields in OpenAI response', { result: analysisResult });
      throw new Error('Missing required fields in AI response');
    }
    
    // Ensure arrays are arrays and handle null/undefined values
    if (!Array.isArray(analysisResult.pros)) {
      analysisResult.pros = analysisResult.pros ? [analysisResult.pros].filter(Boolean) : [];
    }
    if (!Array.isArray(analysisResult.cons)) {
      analysisResult.cons = analysisResult.cons ? [analysisResult.cons].filter(Boolean) : [];
    }
    if (!Array.isArray(analysisResult.alternatives)) {
      analysisResult.alternatives = [];
    }
    
    // Only assign default score if product was identified and score is not a number
    if (typeof analysisResult.compatibilityScore !== 'number' && 
        analysisResult.productName !== "Sorry, we couldn't catch that" &&
        analysisResult.productName !== "Unable to analyze at this time") {
      analysisResult.compatibilityScore = 75; // Default neutral score for identified products
    }

    // Check if product was successfully identified
    const productIdentified = analysisResult.productName && 
                              analysisResult.productName !== "Sorry, we couldn't catch that" &&
                              analysisResult.productName !== "Unable to analyze at this time";

    // Try to increment scan usage if product was identified (with error handling)
    if (productIdentified) {
      logStep('Product was identified, incrementing scan usage');
      try {
        await supabase.rpc('increment_scan_usage', {
          p_user_id: userId,
          p_product_identified: true
        });
        logStep('Scan usage incremented successfully');
      } catch (incrementError) {
        logStep('Failed to increment scan usage', { error: incrementError });
        // Don't fail the request if increment fails
      }
    } else {
      logStep('Product was not identified, not incrementing scan usage');
    }

    // Add metadata
    analysisResult.userMedications = userMedications.map(med => med.medication_name);
    analysisResult.timestamp = new Date().toISOString();
    
    // Try to save analysis to history (with error handling)
    if (analysisType && productIdentified) {
      try {
        await supabase.from('food_analysis_history').insert({
          user_id: userId,
          product_name: analysisResult.productName,
          analysis_type: analysisType,
          compatibility_score: analysisResult.compatibilityScore,
          interaction_level: analysisResult.interactionLevel,
          warnings: analysisResult.cons || [],
          recommendations: analysisResult.pros || []
        });
        logStep('Analysis saved to history');
      } catch (historyError) {
        logStep('Failed to save analysis history', { error: historyError });
        // Don't fail the request if history save fails
      }
    }
    
    logStep('Analysis completed successfully', { 
      productName: analysisResult.productName,
      score: analysisResult.compatibilityScore,
      level: analysisResult.interactionLevel
    });
    logStep('=== FOOD-MEDICATION INTERACTION ANALYSIS COMPLETE ===');
    
    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    logStep('=== FOOD-MEDICATION INTERACTION ANALYSIS ERROR ===');
    logStep('Error details', { 
      message: error.message,
      stack: error.stack?.substring(0, 500)
    });
    
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