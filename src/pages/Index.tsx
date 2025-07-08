
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Pill } from 'lucide-react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import ScannerInterface from '@/components/ScannerInterface';
import MedicationResult from '@/components/MedicationResult';
import ProfileSetup from '@/components/ProfileSetup';
import ProfileCompletionBanner from '@/components/ProfileCompletionBanner';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'scanner' | 'profile'>('scanner');
  const [scanResult, setScanResult] = useState<any>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleScanComplete = (result: any) => {
    setScanResult(result);
  };

  const resetScanner = () => {
    setScanResult(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-blue-600 p-3 rounded-xl inline-block mb-4">
            <Pill className="w-8 h-8 text-white" />
          </div>
          <div className="text-lg font-semibold text-gray-700">Loading Flikt...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <Header />
      <ProfileCompletionBanner onCompleteProfile={() => setActiveTab('profile')} />
      
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

        {activeTab === 'profile' && <ProfileSetup />}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default Index;
