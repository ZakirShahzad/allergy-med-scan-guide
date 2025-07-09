import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, ShieldCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnalysisResult {
  productName: string;
  compatibilityScore: number;
  interactionLevel: 'positive' | 'neutral' | 'negative';
  warnings: string[];
  recommendations: string[];
  userMedications: string[];
  timestamp: string;
}

interface AnalysisResultsProps {
  result: AnalysisResult;
  onNewAnalysis: () => void;
}

const AnalysisResults = ({ result, onNewAnalysis }: AnalysisResultsProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getInteractionIcon = (level: string) => {
    switch (level) {
      case 'positive': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'negative': return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <ShieldCheck className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getInteractionBadge = (level: string) => {
    switch (level) {
      case 'positive': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Beneficial</Badge>;
      case 'negative': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Caution</Badge>;
      default: return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Neutral</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Button 
        onClick={onNewAnalysis}
        variant="outline" 
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Analyze Another Product
      </Button>

      {/* Analysis Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {getInteractionIcon(result.interactionLevel)}
              <div>
                <CardTitle className="text-2xl">{result.productName}</CardTitle>
                <p className="text-gray-600 flex items-center mt-1">
                  <Clock className="w-4 h-4 mr-1" />
                  Analyzed {new Date(result.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold px-4 py-2 rounded-lg border ${getScoreColor(result.compatibilityScore)}`}>
                {result.compatibilityScore}
              </div>
              <p className="text-sm text-gray-600 mt-1">Compatibility Score</p>
              {getInteractionBadge(result.interactionLevel)}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Your Medications */}
      {result.userMedications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Checked Against Your Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.userMedications.map((medication, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <span className="text-blue-800 font-medium">{medication}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-amber-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Important Warnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.warnings.map((warning, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-amber-50 border-l-4 border-amber-400 rounded-r-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <span className="text-amber-800">{warning}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-blue-700">
              <CheckCircle className="w-5 h-5 mr-2" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                  <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-800">{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Compatibility Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Understanding Your Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
                <span className="text-green-700 font-bold text-sm">80+</span>
              </div>
              <div>
                <p className="font-medium text-green-700">Highly Compatible</p>
                <p className="text-sm text-gray-600">Safe to consume, may even benefit your treatment</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-yellow-100 flex items-center justify-center">
                <span className="text-yellow-700 font-bold text-sm">60+</span>
              </div>
              <div>
                <p className="font-medium text-yellow-700">Moderately Compatible</p>
                <p className="text-sm text-gray-600">Generally safe, but monitor for any effects</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-red-100 flex items-center justify-center">
                <span className="text-red-700 font-bold text-sm">&lt;60</span>
              </div>
              <div>
                <p className="font-medium text-red-700">Low Compatibility</p>
                <p className="text-sm text-gray-600">Consult your healthcare provider before consuming</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Disclaimer */}
      <Card className="bg-gradient-to-r from-blue-50 to-teal-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-blue-600 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Important Disclaimer</h3>
              <p className="text-blue-800 text-sm">
                This analysis is for informational purposes only and should not replace professional medical advice. 
                Always consult with your healthcare provider or pharmacist about food-drug interactions, especially 
                before making significant dietary changes while taking medications.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResults;