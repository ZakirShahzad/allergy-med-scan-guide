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

    // Get user's current medications
    console.log('Fetching user medications...');
    const { data: medications, error: medicationsError } = await supabase
      .from('user_medications')
      .select('medication_name, dosage, frequency, purpose')
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
          warnings: [],
          recommendations: [
            "Add your current medications to get personalized food-medication interaction analysis"
          ],
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
        warnings: [`Unable to analyze interactions with your ${userMedications.length} medication(s) - API access required`],
        recommendations: [
          "Consult with a pharmacist about food-drug interactions"
        ],
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

    // Create the detailed prompt for OpenAI
    const medicationList = userMedications.map(med => 
      `${med.medication_name}${med.dosage ? ` (${med.dosage})` : ''}${med.purpose ? ` - for ${med.purpose}` : ''}`
    ).join(', ');

    let analysisPrompt;
    
    if (!hasMedications) {
      // No medications to analyze against, return early
      const analysisResult = {
        productName: productName || "Food or beverage from image",
        compatibilityScore: null,
        interactionLevel: "neutral" as const,
        warnings: [],
        recommendations: [
          "Add your current medications to get personalized food-medication interaction analysis"
        ],
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
      analysisPrompt = `Analyze this food/product image for potential interactions with these medications: ${medicationList}. 
         IMPORTANT: If you cannot clearly identify what food or beverage this is, respond with productName: "Sorry, we couldn't catch that" and compatibilityScore: null.
         If you can identify it, check for ingredients that could interact with these medications.
         Consider: Will this food affect medication absorption? Could it worsen side effects? Could it interfere with efficacy?
         Return ONLY valid JSON with: productName, compatibilityScore (0-100 or null if unidentifiable), interactionLevel (positive/neutral/negative), warnings (array), recommendations (array).`;
    } else {
      analysisPrompt = `Analyze the food/product "${productName}" for potential interactions with these medications: ${medicationList}.
         Consider: Will this food affect medication absorption? Could it worsen side effects? Could it interfere with efficacy?
         Return ONLY valid JSON with: productName, compatibilityScore (0-100), interactionLevel (positive/neutral/negative), warnings (array), recommendations (array).`;
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
        warnings: [],
        recommendations: [
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
    if (!Array.isArray(analysisResult.warnings)) {
      analysisResult.warnings = [analysisResult.warnings].filter(Boolean);
    }
    if (!Array.isArray(analysisResult.recommendations)) {
      analysisResult.recommendations = [analysisResult.recommendations].filter(Boolean);
    }
    
    // Only assign default score if product was identified and score is not a number
    // Don't assign score if product couldn't be identified
    if (typeof analysisResult.compatibilityScore !== 'number' && 
        analysisResult.productName !== "Sorry, we couldn't catch that") {
      analysisResult.compatibilityScore = 75; // Default neutral score for identified products
    }

    // Add enhanced feedback based on compatibility score
    if (hasMedications && analysisResult.compatibilityScore !== null) {
      const score = analysisResult.compatibilityScore;
      const productName = analysisResult.productName;
      
      if (score >= 80) {
        // Highly compatible - green zone, but check if it's unhealthy
        const unhealthyKeywords = ['candy', 'soda', 'chips', 'cookies', 'cake', 'donut', 'ice cream', 'chocolate bar', 'energy drink', 'fast food', 'fried', 'processed'];
        const isUnhealthy = unhealthyKeywords.some(keyword => productName.toLowerCase().includes(keyword));
        
        if (isUnhealthy) {
          analysisResult.recommendations = [
            `While this ${productName.toLowerCase()} won't interfere with your medications, it's important to note that it's not a healthy food choice.`,
            `Consider healthier alternatives like fruits, vegetables, whole grains, or lean proteins that are both medication-compatible and nutritionally beneficial.`,
            `Remember: medication compatibility doesn't equal healthy eating. Your overall nutrition still matters for your health and recovery.`,
            ...(analysisResult.recommendations || [])
          ];
        } else {
          analysisResult.recommendations = [
            `Excellent choice! This ${productName.toLowerCase()} is highly compatible with your medications and may even provide beneficial nutrients that support your treatment.`,
            `Fun fact: Many foods in this category contain antioxidants and nutrients that can help reduce inflammation and support overall health while taking medications.`,
            ...(analysisResult.recommendations || [])
          ];
        }
      } else if (score >= 60) {
        // Moderately compatible - yellow zone
        analysisResult.recommendations = [
          `This ${productName.toLowerCase()} is generally okay with your medications, but there are some considerations to keep in mind for optimal results.`,
          `Consider alternatives like leafy greens, lean proteins, or whole grains which typically score higher for medication compatibility.`,
          ...(analysisResult.recommendations || [])
        ];
      } else {
        // Low compatibility - red zone
        analysisResult.recommendations = [
          `This ${productName.toLowerCase()} may interfere with your medication effectiveness or cause unwanted interactions.`,
          `Better alternatives include fresh fruits (like berries or apples), vegetables, or foods that don't compete with medication absorption.`,
          ...(analysisResult.recommendations || [])
        ];
      }
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
          warnings: analysisResult.warnings,
          recommendations: analysisResult.recommendations
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