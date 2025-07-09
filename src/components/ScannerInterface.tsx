
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, X, RotateCcw } from 'lucide-react';
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
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Camera access functions
  const startCamera = async () => {
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to access the camera.",
      });
      return;
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      setStream(mediaStream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description: "Please allow camera access to take photos.",
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) return;
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob and create image URL
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob);
        setUploadedImage(imageUrl);
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleRetake = () => {
    setUploadedImage(null);
    startCamera();
  };

  const handleAnalyze = () => {
    if (uploadedImage) {
      // Convert blob URL back to file for analysis
      fetch(uploadedImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          analyzeImage(file);
        });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  // Set video source when stream is available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(console.error);
    }
  }, [stream]);

  const analyzeImage = async (file: File) => {
    if (!user?.id) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to analyze medications.",
      });
      return;
    }

    // Validate image format and size
    const validFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validFormats.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Invalid Image Format",
        description: "Please upload a JPG, PNG, or WebP image.",
      });
      return;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        variant: "destructive",
        title: "Image Too Large",
        description: "Please upload an image smaller than 10MB.",
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
          let errorMessage = 'Analysis service error';
          
          // Handle specific error types
          if (error.message?.includes('non-2xx status code')) {
            errorMessage = 'Analysis service error. Please ensure your Hugging Face token is configured properly.';
          } else if (error.message?.includes('timeout')) {
            errorMessage = 'Analysis timed out. Please try with a smaller image.';
          } else if (error.message?.includes('network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
          } else {
            errorMessage = error.message || 'Unknown analysis error';
          }
          
          throw new Error(errorMessage);
        }
        
        if (!data || data.error) {
          console.error('Analysis returned error:', data);
          const errorDetails = data?.details || data?.error || 'Analysis failed';
          throw new Error(errorDetails);
        }
        
        console.log('Analysis result:', data);
        
        // Validate required fields in response
        if (!data.name || !data.ingredients || !Array.isArray(data.ingredients)) {
          throw new Error('Invalid analysis response: missing required fields');
        }
        
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
      
      // Provide specific guidance based on error type
      let description = errorMessage;
      let title = "Analysis Failed";
      
      if (errorMessage.includes('Invalid image format')) {
        title = "Invalid Image";
        description = "Please upload a clear photo of your medication label or packaging.";
      } else if (errorMessage.includes('unavailable')) {
        title = "Service Unavailable";
        description = "The analysis service is temporarily down. Please try again in a few minutes.";
      } else if (errorMessage.includes('timeout')) {
        title = "Analysis Timeout";
        description = "Analysis took too long. Try uploading a smaller, clearer image.";
      } else if (errorMessage.includes('missing required fields')) {
        title = "Analysis Incomplete";
        description = "The image could not be properly analyzed. Please try a clearer photo.";
      }
      
      toast({
        variant: "destructive",
        title,
        description,
      });
      
      // Don't navigate on error - let user try again
      setUploadedImage(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCameraScan = () => {
    startCamera();
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      {uploadedImage && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Captured Photo</h3>
          <div className="relative max-w-md mx-auto">
            <img 
              src={uploadedImage} 
              alt="Captured medication" 
              className="w-full h-64 object-cover rounded-xl border-2 border-gray-200"
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-xl flex items-center justify-center">
                <div className="text-white text-lg font-semibold">Analyzing...</div>
              </div>
            )}
          </div>
          {!isAnalyzing && (
            <div className="flex gap-3 mt-4 justify-center">
              <Button
                onClick={handleRetake}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Retake
              </Button>
              <Button
                onClick={handleAnalyze}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Analyze Photo
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Camera Interface */}
      {showCamera && (
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              width="320"
              height="240"
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.play().catch(console.error);
                }
              }}
              className="w-full h-64 object-cover rounded-xl border-2 border-blue-300"
            />
            <div className="absolute top-2 right-2">
              <Button
                onClick={stopCamera}
                variant="destructive"
                size="sm"
                className="rounded-full w-8 h-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <Button
                onClick={capturePhoto}
                className="bg-white text-gray-900 hover:bg-gray-100 rounded-full w-16 h-16 p-0"
              >
                <Camera className="w-8 h-8" />
              </Button>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
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
            onClick={handleCameraScan}
            disabled={isAnalyzing || showCamera}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            <Camera className="w-5 h-5 mr-2" />
            {isAnalyzing ? 'Analyzing...' : showCamera ? 'Camera Active' : 'Take Photo'}
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
            disabled={isAnalyzing || showCamera}
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
