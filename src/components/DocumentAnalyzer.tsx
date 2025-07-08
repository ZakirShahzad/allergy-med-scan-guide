
import { FileText, Upload, Brain, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DocumentAnalyzer = ({ onAnalysisComplete }: { onAnalysisComplete: (result: any) => void }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 relative">
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
        <div className="text-center bg-white rounded-xl p-6 shadow-lg border-2 border-blue-200">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-gray-600">Medical document analysis feature is in development</p>
        </div>
      </div>
      
      {/* Muted Content */}
      <div className="text-center opacity-30">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-12 mb-6">
          <div className="bg-gray-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-500 mb-2">Analyze Medical Documents</h2>
          <p className="text-gray-400 mb-6">Upload lab results, prescriptions, or medical reports for personalized recommendations</p>
          
          <div className="space-y-4">
            <Button 
              disabled
              className="w-full bg-gray-400 text-white py-4 text-lg font-semibold rounded-xl cursor-not-allowed"
            >
              <FileText className="w-5 h-5 mr-2" />
              Upload Documents
            </Button>
            
            <Button 
              disabled
              variant="outline" 
              className="w-full py-4 text-lg font-semibold rounded-xl border-2 border-dashed border-gray-200 text-gray-400 cursor-not-allowed"
            >
              <Upload className="w-5 h-5 mr-2" />
              Try Sample Analysis
            </Button>
          </div>
        </div>
        
        <div className="text-left">
          <h3 className="font-semibold text-gray-400 mb-3">Supported Documents:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
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
