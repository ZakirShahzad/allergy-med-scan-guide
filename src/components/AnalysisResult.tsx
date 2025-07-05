
import { Heart, Shield, AlertCircle, Utensils } from 'lucide-react';

interface AnalysisResultProps {
  result: {
    conditions: string[];
    dietaryRecommendations: {
      good: string[];
      avoid: string[];
    };
    medicationInteractions: string[];
  };
  onNewAnalysis: () => void;
}

const AnalysisResult = ({ result, onNewAnalysis }: AnalysisResultProps) => {
  return (
    <div className="space-y-6">
      {/* Detected Conditions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <Heart className="w-5 h-5 text-red-500 mr-2" />
          Detected Health Conditions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.conditions.map((condition, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-800 font-medium">{condition}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dietary Recommendations */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Good Foods */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="w-5 h-5 text-green-500 mr-2" />
            Recommended Foods
          </h3>
          <div className="space-y-3">
            {result.dietaryRecommendations.good.map((food, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <Utensils className="w-4 h-4 text-green-600" />
                <span className="text-green-800 font-medium">{food}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Foods to Avoid */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            Foods to Avoid
          </h3>
          <div className="space-y-3">
            {result.dietaryRecommendations.avoid.map((food, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-800 font-medium">{food}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medication Interactions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-amber-500 mr-2" />
          Important Medication Notes
        </h3>
        <div className="space-y-3">
          {result.medicationInteractions.map((interaction, index) => (
            <div key={index} className="flex items-start space-x-3 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <span className="text-amber-800 font-medium">{interaction}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-4">
        <button 
          onClick={onNewAnalysis}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
        >
          Analyze More Documents
        </button>
        <button className="px-6 py-4 border-2 border-gray-300 text-gray-700 hover:border-teal-300 hover:text-teal-600 rounded-xl font-semibold transition-all duration-200">
          Save Analysis
        </button>
      </div>
    </div>
  );
};

export default AnalysisResult;
