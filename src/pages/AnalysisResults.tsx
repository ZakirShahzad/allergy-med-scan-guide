import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle, Pill, ArrowLeft, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header';

interface AnalysisData {
  name: string;
  ingredients: string[];
  warnings: string[];
  allergenRisk: 'low' | 'medium' | 'high';
  recommendations?: string[];
  rawAnalysis?: string;
  uploadedImage?: string;
}

const AnalysisResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  useEffect(() => {
    if (location.state?.analysisData) {
      setAnalysisData(location.state.analysisData);
    } else {
      // Redirect to home if no analysis data
      navigate('/');
    }
  }, [location.state, navigate]);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="w-6 h-6" />;
      case 'medium': return <AlertTriangle className="w-6 h-6" />;
      case 'high': return <XCircle className="w-6 h-6" />;
      default: return <Pill className="w-6 h-6" />;
    }
  };

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-600 p-3 rounded-xl inline-block mb-4">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <div className="text-lg font-semibold text-gray-700">Loading analysis...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          onClick={() => navigate('/')}
          variant="outline" 
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Scanner
        </Button>

        <div className="space-y-6">
          {/* Uploaded Image */}
          {analysisData.uploadedImage && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Analyzed Image</h3>
              <div className="flex justify-center">
                <img 
                  src={analysisData.uploadedImage} 
                  alt="Analyzed medication" 
                  className="max-w-md w-full h-64 object-cover rounded-xl border-2 border-gray-200"
                />
              </div>
            </div>
          )}

          {/* Analysis Header */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <Pill className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analysis Results</h1>
                <h2 className="text-xl font-semibold text-gray-700 mb-1">{analysisData.name}</h2>
                <p className="text-gray-500">AI-powered medication analysis complete</p>
              </div>
              <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 ${getRiskColor(analysisData.allergenRisk)}`}>
                {getRiskIcon(analysisData.allergenRisk)}
                <span className="font-semibold capitalize">{analysisData.allergenRisk} Risk</span>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Identified Ingredients</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {analysisData.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-800 font-medium">{ingredient}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {analysisData.warnings.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
                Important Warnings
              </h3>
              <div className="space-y-3">
                {analysisData.warnings.map((warning, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <span className="text-amber-800 font-medium">{warning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysisData.recommendations && analysisData.recommendations.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Recommendations</h3>
              <div className="space-y-3">
                {analysisData.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-blue-800 font-medium">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Analysis (if available) */}
          {analysisData.rawAnalysis && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Detailed Analysis</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{analysisData.rawAnalysis}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <Button 
              onClick={() => navigate('/')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
            >
              <Camera className="w-5 h-5 mr-2" />
              Analyze Another Medication
            </Button>
            <Button 
              variant="outline"
              className="px-6 py-4 border-2 border-gray-300 text-gray-700 hover:border-blue-300 hover:text-blue-600 rounded-xl font-semibold transition-all duration-200"
            >
              Save Results
            </Button>
          </div>

          {/* Disclaimer */}
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-2xl p-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Important Disclaimer</h3>
                <p className="text-blue-800 text-sm">
                  This analysis is for informational purposes only and should not replace professional medical advice. 
                  Always consult with a healthcare professional before taking any medication, especially if you have allergies or medical conditions.
                  Note: Cancelling your subscription will immediately remove access to remaining scans.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalysisResults;