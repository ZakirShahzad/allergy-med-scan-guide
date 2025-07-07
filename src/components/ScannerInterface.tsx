
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ScannerInterface = ({ onScanComplete }: { onScanComplete: (result: any) => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const analyzeImage = async (file: File) => {
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to analyze medications.",
      });
      return;
    }

    setIsAnalyzing(true);
    
    toast({
      title: "Starting Analysis",
      description: "Analyzing your medication image...",
    });
    
    // Show the uploaded image immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    try {
      // Convert file to base64 for API
      const imageReader = new FileReader();
      imageReader.onload = async (e) => {
        const imageData = e.target?.result as string;
        
        if (!imageData || !imageData.startsWith('data:image/')) {
          throw new Error('Invalid image format');
        }
        
        console.log('Calling analyze-medication function...');
        
        // Call Supabase edge function
        const { data, error } = await supabase.functions.invoke('analyze-medication', {
          body: { 
            imageData,
            userId: user.id 
          }
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(`Analysis service error: ${error.message}`);
        }
        
        if (!data || data.error) {
          console.error('Analysis returned error:', data);
          throw new Error(data?.details || 'Analysis failed');
        }
        
        console.log('Analysis result:', data);
        
        // Navigate to results page with analysis data
        navigate('/analysis-results', {
          state: {
            analysisData: {
              ...data,
              uploadedImage: imageData
            }
          }
        });
        
        toast({
          title: "Analysis Complete",
          description: data.hasUserProfile 
            ? "Your medication has been analyzed against your profile!"
            : "Analysis complete! Complete your profile for personalized results.",
        });
      };
      imageReader.readAsDataURL(file);
    } catch (error) {
      console.error('Analysis failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: errorMessage,
      });
      
      // Don't navigate on error - let user try again
      setUploadedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMockScan = () => {
    // Navigate to results page with demo data
    navigate('/analysis-results', {
      state: {
        analysisData: {
          name: "Ibuprofen 200mg (Demo)",
          ingredients: ["Ibuprofen", "Microcrystalline cellulose", "Lactose", "Sodium starch glycolate"],
          warnings: ["Contains lactose", "May cause drowsiness"],
          allergenRisk: "medium" as const,
          recommendations: ["Take with food to reduce stomach irritation", "Avoid if allergic to NSAIDs"],
          rawAnalysis: "This is a demo analysis showing how the AI would analyze your medication and cross-reference it with your allergy profile."
        }
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      {uploadedImage && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Uploaded Image</h3>
          <div className="relative max-w-md mx-auto">
            <img 
              src={uploadedImage} 
              alt="Uploaded medication" 
              className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                <div className="text-white text-lg font-semibold">Analyzing...</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-12 mb-6">
        <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Medication</h2>
        <p className="text-gray-600 mb-6">Upload medication images for AI-powered allergy analysis</p>
        
        <div className="space-y-4">
          <Button 
            onClick={handleMockScan}
            disabled={isAnalyzing}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            <Camera className="w-5 h-5 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Try Demo Scan'}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            disabled={isAnalyzing}
            className="w-full py-4 text-lg font-semibold rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="w-5 h-5 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'Upload Image'}
          </Button>
          <input 
            id="file-upload" 
            type="file" 
            accept="image/*" 
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                analyzeImage(e.target.files[0]);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ScannerInterface;
