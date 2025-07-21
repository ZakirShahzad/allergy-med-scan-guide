import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, ShieldCheck, Clock, ThumbsUp, ThumbsDown, Camera, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnalysisResult {
  productName: string;
  compatibilityScore: number;
  interactionLevel: 'positive' | 'neutral' | 'negative';
  pros: string[];
  cons: string[];
  userMedications: string[];
  timestamp: string;
  alternatives?: string[];
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

  // Check if AI couldn't identify the product
  const isUnidentified = result.productName === "Sorry, we couldn't catch that" || 
                         result.compatibilityScore === null && 
                         (result.cons.some(con => con.includes("couldn't") || con.includes("unclear") || con.includes("unidentifiable")) ||
                          result.productName.toLowerCase().includes("unknown") ||
                          result.productName.toLowerCase().includes("unclear"));

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

      {/* Unidentified Product Alert */}
      {isUnidentified && (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Unable to Identify Product
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700 mb-4">
              We couldn't clearly identify the food or product from your image/search. For accurate medication interaction analysis, 
              please try again with a clearer photo or more specific search term.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={onNewAnalysis}
                className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Try Again with Camera
              </Button>
              <Button 
                onClick={onNewAnalysis}
                variant="outline" 
                className="text-orange-700 border-orange-300 hover:bg-orange-100 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Search Different Product
              </Button>
            </div>
            <div className="mt-4 text-sm text-orange-600">
              <p className="font-medium mb-2">Tips for better results:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Take a clear photo with good lighting</li>
                <li>Include product labels or packaging when possible</li>
                <li>Use specific product names (e.g., "Tylenol" instead of "pain reliever")</li>
                <li>Ensure the product name is spelled correctly</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Only show analysis results if product was identified */}
      {!isUnidentified && (
        <>
          {/* Analysis Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  {getInteractionIcon(result.interactionLevel)}
                  <div>
                    <CardTitle className="text-2xl">{result.productName}</CardTitle>
                  </div>
                </div>
                <div className="text-center">
                  {result.compatibilityScore !== null ? (
                    <>
                      <div className={`text-3xl font-bold px-4 py-2 rounded-lg border ${getScoreColor(result.compatibilityScore)} mx-auto`}>
                        {result.compatibilityScore}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Compatibility Score</p>
                    </>
                  ) : (
                    <div className="text-3xl font-bold px-4 py-2 rounded-lg border bg-gray-50 text-gray-400 mx-auto">
                      N/A
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* No Medications Alert */}
          {result.userMedications.length === 0 && (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-800">No Medications Added</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-700 mb-4">
                  To get personalized food-medication interaction analysis and compatibility scores, 
                  please add your current medications first.
                </p>
                <Button 
                  onClick={() => {
                    const navButtons = document.querySelectorAll('[data-tab="medications"]');
                    if (navButtons.length > 0) {
                      (navButtons[0] as HTMLButtonElement).click();
                    }
                  }}
                  variant="outline" 
                  className="text-yellow-800 border-yellow-300 hover:bg-yellow-100"
                >
                  Add Medications Now
                </Button>
              </CardContent>
            </Card>
          )}

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

          {/* Pros */}
          {result.pros.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-green-700">
                  <ThumbsUp className="w-5 h-5 mr-2" />
                  Medication Compatibility Pros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.pros.map((pro, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 border-l-4 border-green-400 rounded-r-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-green-800">{pro}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cons */}
          {result.cons.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-700">
                  <ThumbsDown className="w-5 h-5 mr-2" />
                  Medication Compatibility Concerns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.cons.map((con, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-red-50 border-l-4 border-red-400 rounded-r-lg">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-red-800">{con}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Alternative Products (for high-risk items) */}
          {result.alternatives && result.alternatives.length > 0 && result.compatibilityScore !== null && result.compatibilityScore < 60 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center text-blue-700">
                  <ShieldCheck className="w-5 h-5 mr-2" />
                  Recommended Safer Alternatives
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800 mb-4">
                  Since this product has a high interaction risk with your medications, here are safer alternatives you might consider:
                </p>
                <div className="space-y-3">
                  {result.alternatives.map((alternative, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 bg-white border border-blue-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-blue-900 font-medium">{alternative}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-blue-600 mt-4">
                  <strong>Note:</strong> Always consult with your healthcare provider before making changes to your diet or switching products.
                </p>
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
        </>
      )}

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
                before making significant dietary changes while taking medications. Note: Cancelling your subscription 
                will immediately remove access to remaining scans.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalysisResults;