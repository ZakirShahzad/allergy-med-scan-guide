import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Pill, X } from 'lucide-react';

interface MedicationReminderBannerProps {
  onGoToMedications: () => void;
}

const MedicationReminderBanner = ({ onGoToMedications }: MedicationReminderBannerProps) => {
  const { user } = useAuth();
  const [hasMedications, setHasMedications] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkMedications();
    }
  }, [user]);

  const checkMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('user_medications')
        .select('id')
        .eq('user_id', user?.id)
        .limit(1);

      if (error) {
        console.error('Error checking medications:', error);
        return;
      }

      setHasMedications(data && data.length > 0);
      setLoading(false);
    } catch (error) {
      console.error('Error checking medications:', error);
      setLoading(false);
    }
  };

  if (loading || hasMedications || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Add Your Medications First</h3>
            <p className="text-sm opacity-90">
              To get accurate food interaction analysis, please add your current medications
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={onGoToMedications}
            variant="secondary"
            size="sm"
            className="bg-white text-orange-600 hover:bg-gray-50"
          >
            <Pill className="w-4 h-4 mr-2" />
            Add Medications
          </Button>
          <Button
            onClick={() => setIsDismissed(true)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MedicationReminderBanner;