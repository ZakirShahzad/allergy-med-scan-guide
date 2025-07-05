
import { useState } from 'react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ScannerInterface from '@/components/ScannerInterface';
import MedicationResult from '@/components/MedicationResult';
import DocumentAnalyzer from '@/components/DocumentAnalyzer';
import AnalysisResult from '@/components/AnalysisResult';
import ProfileSetup from '@/components/ProfileSetup';

const Index = () => {
  const [activeTab, setActiveTab] = useState<'scanner' | 'analyzer' | 'profile'>('scanner');
  const [scanResult, setScanResult] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleScanComplete = (result: any) => {
    setScanResult(result);
  };

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result);
  };

  const resetScanner = () => {
    setScanResult(null);
  };

  const resetAnalyzer = () => {
    setAnalysisResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24">
        {activeTab === 'scanner' && (
          <div>
            {!scanResult ? (
              <ScannerInterface onScanComplete={handleScanComplete} />
            ) : (
              <MedicationResult result={scanResult} onNewScan={resetScanner} />
            )}
          </div>
        )}

        {activeTab === 'analyzer' && (
          <div>
            {!analysisResult ? (
              <DocumentAnalyzer onAnalysisComplete={handleAnalysisComplete} />
            ) : (
              <AnalysisResult result={analysisResult} onNewAnalysis={resetAnalyzer} />
            )}
          </div>
        )}

        {activeTab === 'profile' && <ProfileSetup />}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
