
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Utensils } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import FoodAnalyzer from '@/components/FoodAnalyzer';
import AnalysisResults from '@/components/AnalysisResults';
import MedicationManager from '@/components/MedicationManager';
import SubscriptionStatus from '@/components/SubscriptionStatus';


const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'analyzer' | 'medications'>('analyzer');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result);
  };

  const resetAnalyzer = () => {
    setAnalysisResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-green-600 p-3 rounded-xl inline-block mb-4">
            <Utensils className="w-8 h-8 text-white" />
          </div>
          <div className="text-lg font-semibold text-gray-700">Loading Flikkt...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        <div className="space-y-6">
          <SubscriptionStatus />
          
          {activeTab === 'analyzer' && (
            <div>
              {!analysisResult ? (
                <FoodAnalyzer onAnalysisComplete={handleAnalysisComplete} />
              ) : (
                <AnalysisResults result={analysisResult} onNewAnalysis={resetAnalyzer} />
              )}
            </div>
          )}

          {activeTab === 'medications' && <MedicationManager />}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
