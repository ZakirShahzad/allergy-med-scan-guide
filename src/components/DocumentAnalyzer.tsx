
import { FileText, Upload, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DocumentAnalyzer = ({ onAnalysisComplete }: { onAnalysisComplete: (result: any) => void }) => {
  const handleMockAnalysis = () => {
    const mockAnalysis = {
      conditions: ["Type 2 Diabetes", "Hypertension", "High Cholesterol"],
      dietaryRecommendations: {
        good: ["Leafy greens", "Lean proteins", "Whole grains", "Berries"],
        avoid: ["Processed foods", "High sodium items", "Sugary drinks", "Trans fats"]
      },
      medicationInteractions: ["Monitor blood sugar when taking new medications", "Avoid NSAIDs with blood pressure medication"]
    };
    onAnalysisComplete(mockAnalysis);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="text-center">
        <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-12 mb-6">
          <div className="bg-teal-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyze Medical Documents</h2>
          <p className="text-gray-600 mb-6">Upload lab results, prescriptions, or medical reports for personalized recommendations</p>
          
          <div className="space-y-4">
            <Button 
              onClick={() => document.getElementById('doc-upload')?.click()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
            >
              <FileText className="w-5 h-5 mr-2" />
              Upload Documents
            </Button>
            
            <input 
              id="doc-upload" 
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png" 
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleMockAnalysis(); // Mock the analysis
                }
              }}
            />
            
            <Button 
              onClick={handleMockAnalysis}
              variant="outline" 
              className="w-full py-4 text-lg font-semibold rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-300 hover:bg-teal-50 transition-all duration-200"
            >
              <Upload className="w-5 h-5 mr-2" />
              Try Sample Analysis
            </Button>
          </div>
        </div>
        
        <div className="text-left">
          <h3 className="font-semibold text-gray-900 mb-3">Supported Documents:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>• Lab Results</div>
            <div>• Prescription Records</div>
            <div>• Medical Reports</div>
            <div>• Allergy Tests</div>
            <div>• Discharge Summaries</div>
            <div>• Treatment Plans</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalyzer;
