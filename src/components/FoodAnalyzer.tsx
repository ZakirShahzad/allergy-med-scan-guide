import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Upload, Search, Scan, Loader2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalysisResult {
  productName: string;
  compatibilityScore: number;
  interactionLevel: 'positive' | 'neutral' | 'negative';
  pros: string[];
  cons: string[];
  userMedications: string[];
  timestamp: string;
}

interface FoodAnalyzerProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

const FoodAnalyzer = ({ onAnalysisComplete }: FoodAnalyzerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [productName, setProductName] = useState('');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const analyzeProduct = async (analysisType: string, imageData?: string, searchTerm?: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to analyze products",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-medication', {
        body: {
          userId: user.id,
          imageData: imageData,
          productName: searchTerm,
          analysisType: analysisType
        }
      });

      if (error) {
        // Handle scan limit reached specifically
        if (error.status === 429 && data?.error === 'scan_limit_reached') {
          toast({
            title: "Scan Limit Reached",
            description: data.message || "You have reached your monthly scan limit. Please upgrade to continue scanning.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      onAnalysisComplete(data);
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze the product. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startCamera = async () => {
    console.log('Starting camera...');
    try {
      console.log('Requesting camera permissions...');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      console.log('Camera stream obtained:', mediaStream);
      setStream(mediaStream);
      setShowCamera(true);
      console.log('showCamera set to true');
      
      // Use setTimeout to ensure the video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          console.log('Video element set with stream');
        } else {
          console.log('Video ref is still null after timeout');
        }
      }, 100);
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
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
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
        analyzeProduct('photo', imageData);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        setCapturedImage(imageData);
        analyzeProduct('upload', imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSearch = () => {
    if (!productName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a product name to search",
        variant: "destructive"
      });
      return;
    }
    analyzeProduct('search', undefined, productName.trim());
  };

  const handleBarcodeScan = () => {
    toast({
      title: "Coming Soon",
      description: "Barcode scanning will be available in a future update",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Analyzing Product</h3>
        <p className="text-gray-600">Checking for interactions with your medications...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyze Food & Products</h2>
        <p className="text-gray-600">
          Check how foods and products interact with your medications
        </p>
      </div>

      <Tabs defaultValue="camera" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="camera">Camera</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="barcode">Barcode</TabsTrigger>
        </TabsList>

        <TabsContent value="camera" className="space-y-4">
          {!showCamera ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Camera className="w-5 h-5 mr-2" />
                  Take Photo
                </CardTitle>
                <CardDescription>
                  Capture a photo of the food or product for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={startCamera}
                  className="w-full py-8 text-lg"
                  size="lg"
                >
                  <Camera className="w-6 h-6 mr-3" />
                  Open Camera
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Camera</CardTitle>
                <Button variant="outline" size="sm" onClick={stopCamera}>
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                <Button onClick={capturePhoto} className="w-full" size="lg">
                  <Camera className="w-5 h-5 mr-2" />
                  Capture & Analyze
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Upload Image
              </CardTitle>
              <CardDescription>
                Upload an existing photo from your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full py-8 text-lg"
                size="lg"
              >
                <Upload className="w-6 h-6 mr-3" />
                Choose File
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Search className="w-5 h-5 mr-2" />
                Search Product
              </CardTitle>
              <CardDescription>
                Enter the name of a food or product to analyze
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="e.g., avocado, green tea, vitamin C"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch}
                className="w-full"
                size="lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Analyze Product
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barcode" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Scan className="w-5 h-5 mr-2" />
                Scan Barcode
              </CardTitle>
              <CardDescription>
                Scan a product barcode for instant identification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={handleBarcodeScan}
                variant="outline"
                className="w-full py-8 text-lg"
                size="lg"
                disabled
              >
                <Scan className="w-6 h-6 mr-3" />
                Coming Soon
              </Button>
              <p className="text-sm text-gray-500 text-center mt-2">
                Barcode scanning feature will be available in a future update
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {capturedImage && (
        <Card>
          <CardHeader>
            <CardTitle>Captured Image</CardTitle>
          </CardHeader>
          <CardContent>
            <img 
              src={capturedImage} 
              alt="Captured product" 
              className="w-full max-w-md mx-auto rounded-lg border"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FoodAnalyzer;