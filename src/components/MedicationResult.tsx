
import { AlertTriangle, CheckCircle, XCircle, Pills } from 'lucide-react';

interface MedicationResultProps {
  result: {
    name: string;
    barcode: string;
    ingredients: string[];
    warnings: string[];
    allergenRisk: 'low' | 'medium' | 'high';
  };
  onNewScan: () => void;
}

const MedicationResult = ({ result, onNewScan }: MedicationResultProps) => {
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
      default: return <Pills className="w-6 h-6" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 p-3 rounded-xl">
            <Pills className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{result.name}</h2>
            <p className="text-gray-500">Barcode: {result.barcode}</p>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-full border-2 ${getRiskColor(result.allergenRisk)}`}>
            {getRiskIcon(result.allergenRisk)}
            <span className="font-semibold capitalize">{result.allergenRisk} Risk</span>
          </div>
        </div>
      </div>

      {/* Ingredients */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Active Ingredients</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-gray-800 font-medium">{ingredient}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 text-amber-500 mr-2" />
            Important Warnings
          </h3>
          <div className="space-y-3">
            {result.warnings.map((warning, index) => (
              <div key={index} className="flex items-start space-x-3 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-amber-800 font-medium">{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4">
        <button 
          onClick={onNewScan}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
        >
          Scan Another Medication
        </button>
        <button className="px-6 py-4 border-2 border-gray-300 text-gray-700 hover:border-blue-300 hover:text-blue-600 rounded-xl font-semibold transition-all duration-200">
          Save to Profile
        </button>
      </div>
    </div>
  );
};

export default MedicationResult;
