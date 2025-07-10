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
    console.log('=== FOOD-MEDICATION INTERACTION ANALYSIS START ===');
    
    const { imageData, productName, analysisType, userId } = await req.json();
    console.log('Request data:', { userId, analysisType, productName, imageDataLength: imageData?.length });
    
    if (!userId) {
      console.error('No user ID provided');
      throw new Error('User authentication required');
    }

    if (!imageData && !productName) {
      console.error('No image data or product name provided');
      throw new Error('Either image data or product name is required');
    }

    // Get the authorization token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
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
    console.log('Supabase client initialized with user auth');

    // Check scan usage first
    console.log('Checking scan usage...');
    const { data: scanCheck, error: scanError } = await supabase
      .rpc('increment_scan_usage', {
        p_user_id: userId,
        p_product_identified: false // Don't increment yet, just check
      });

    if (scanError) {
      console.error('Scan usage check error:', scanError);
      throw new Error(`Failed to check scan usage: ${scanError.message}`);
    }

    const { scans_remaining, is_subscribed } = scanCheck[0];
    console.log('Scan usage check result:', { scans_remaining, is_subscribed });

    // If user has no scans left and is not subscribed, return limit message
    if (!is_subscribed && scans_remaining <= 0) {
      console.log('User has reached scan limit');
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

    // Get user's current medications
    console.log('Fetching user medications...');
    const { data: medications, error: medicationsError } = await supabase
      .from('user_medications')
      .select('medication_name, dosage, frequency, purpose, notes')
      .eq('user_id', userId);

    if (medicationsError) {
      console.error('Medications fetch error:', medicationsError);
      throw new Error(`Failed to fetch user medications: ${medicationsError.message}`);
    }

    console.log('Raw medications data:', medications);
    console.log('Number of medications found:', medications?.length || 0);
    const userMedications = medications || [];
    const hasMedications = userMedications.length > 0;
    console.log('User has medications:', hasMedications);

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Always return demo response if token is missing
    if (!openaiApiKey) {
      console.log('Creating demo response - OpenAI API key not configured');
      
      if (!hasMedications) {
        const analysisResult = {
          productName: productName || "Unknown Product",
          compatibilityScore: null,
          interactionLevel: "neutral" as const,
          pros: [],
          cons: [],
          userMedications: [],
          timestamp: new Date().toISOString(),
          note: "No medications to analyze interactions with"
        };
        
        return new Response(JSON.stringify(analysisResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      }
      
      const analysisResult = {
        productName: productName || "Unknown Product",
        compatibilityScore: 75,
        interactionLevel: "neutral" as const,
        pros: ["No known interactions with medications listed"],
        cons: [`Unable to analyze detailed interactions with your ${userMedications.length} medication(s) - API access required`],
        userMedications: userMedications.map(med => med.medication_name),
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
    console.log('User has medications:', hasMedications);

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
    
    if (!hasMedications) {
      // No medications to analyze against, return early
      const analysisResult = {
        productName: productName || "Food or beverage from image",
        compatibilityScore: null,
        interactionLevel: "neutral" as const,
        pros: [],
        cons: ["Add your current medications to get personalized food-medication interaction analysis"],
        userMedications: [],
        timestamp: new Date().toISOString(),
        note: "No medications to analyze interactions with"
      };
      
      return new Response(JSON.stringify(analysisResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    if (imageData) {
      analysisPrompt = `You are a clinical pharmacist with expertise in food-drug interactions. Analyze this food/product image for potential interactions with the following medications:

PATIENT MEDICATION PROFILE:
${detailedMedicationProfile}

ANALYSIS REQUIREMENTS:
1. First identify the food/product in the image. If unclear, return productName: "Sorry, we couldn't catch that" and compatibilityScore: null.
2. For each medication, research and consider:
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
      console.log('Attempting OpenAI vision analysis...');
      
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
        productName: "Unable to analyze at this time",
        compatibilityScore: null,
        interactionLevel: "neutral" as const,
        pros: [],
        cons: [
          "Please try again later",
          "Consult with a pharmacist about food-drug interactions"
        ],
        userMedications: userMedications.map(med => med.medication_name),
        timestamp: new Date().toISOString(),
        note: "Analysis temporarily unavailable"
      };
      
      return new Response(JSON.stringify(analysisResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // Validate required fields and ensure arrays are arrays
    if (!analysisResult.productName || !analysisResult.interactionLevel) {
      console.error('Missing required fields in OpenAI response');
      throw new Error('Missing required fields in AI response');
    }
    
    // Ensure arrays are arrays and score is valid
    if (!Array.isArray(analysisResult.pros)) {
      analysisResult.pros = [analysisResult.pros].filter(Boolean);
    }
    if (!Array.isArray(analysisResult.cons)) {
      analysisResult.cons = [analysisResult.cons].filter(Boolean);
    }
    if (!Array.isArray(analysisResult.alternatives)) {
      analysisResult.alternatives = [];
    }
    
    // Only assign default score if product was identified and score is not a number
    // Don't assign score if product couldn't be identified
    if (typeof analysisResult.compatibilityScore !== 'number' && 
        analysisResult.productName !== "Sorry, we couldn't catch that") {
      analysisResult.compatibilityScore = 75; // Default neutral score for identified products
    }

    // Keep AI-generated recommendations as they are more contextual and detailed

    // Check if product was successfully identified
    const productIdentified = analysisResult.productName && 
                              analysisResult.productName !== "Sorry, we couldn't catch that" &&
                              analysisResult.productName !== "Unable to analyze at this time";

    // Increment scan usage if product was identified
    if (productIdentified) {
      console.log('Product was identified, incrementing scan usage');
      try {
        await supabase.rpc('increment_scan_usage', {
          p_user_id: userId,
          p_product_identified: true
        });
      } catch (incrementError) {
        console.error('Failed to increment scan usage:', incrementError);
        // Don't fail the request if increment fails
      }
    } else {
      console.log('Product was not identified, not incrementing scan usage');
    }

    // Add metadata
    analysisResult.userMedications = userMedications.map(med => med.medication_name);
    analysisResult.timestamp = new Date().toISOString();
    
    // Save analysis to history
    if (analysisType) {
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
      } catch (historyError) {
        console.error('Failed to save analysis history:', historyError);
        // Don't fail the request if history save fails
      }
    }
    
    console.log('Final analysis result:', analysisResult);
    console.log('=== FOOD-MEDICATION INTERACTION ANALYSIS COMPLETE ===');
    
    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('=== FOOD-MEDICATION INTERACTION ANALYSIS ERROR ===');
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