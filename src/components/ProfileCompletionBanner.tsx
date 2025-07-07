import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { AlertCircle, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileCompletionBannerProps {
  onCompleteProfile: () => void;
}

const ProfileCompletionBanner = ({ onCompleteProfile }: ProfileCompletionBannerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkProfileCompleteness();
    }
  }, [user]);

  const checkProfileCompleteness = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('display_name, allergies, medical_conditions, emergency_contact')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      // Check if essential fields are filled
      const isComplete = profile && 
        profile.display_name && 
        (profile.allergies && profile.allergies.length > 0) && 
        profile.emergency_contact;

      setIsProfileComplete(!!isComplete);
      setLoading(false);
    } catch (error) {
      console.error('Error checking profile:', error);
      setLoading(false);
    }
  };

  if (loading || isProfileComplete || isDismissed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Complete Your Profile Setup</h3>
            <p className="text-sm opacity-90">
              Set up your allergies and emergency contact for the most accurate medication guidance
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={onCompleteProfile}
            variant="secondary"
            size="sm"
            className="bg-white text-blue-600 hover:bg-gray-50"
          >
            <User className="w-4 h-4 mr-2" />
            Complete Setup
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

export default ProfileCompletionBanner;