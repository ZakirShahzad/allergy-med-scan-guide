
import { User, AlertTriangle, Plus, X, Save, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const ProfileSetup = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bio, setBio] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState('');
  const [newMedicalCondition, setNewMedicalCondition] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (profile) {
        setDisplayName(profile.display_name || '');
        setEmergencyContact(profile.emergency_contact || '');
        setBio(profile.bio || '');
        setAllergies(profile.allergies || []);
        setMedicalConditions(profile.medical_conditions || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName,
          emergency_contact: emergencyContact,
          bio: bio,
          allergies: allergies,
          medical_conditions: medicalConditions,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Profile updated",
        description: "Your health profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error saving profile",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergyToRemove: string) => {
    setAllergies(allergies.filter(allergy => allergy !== allergyToRemove));
  };

  const addMedicalCondition = () => {
    if (newMedicalCondition.trim() && !medicalConditions.includes(newMedicalCondition.trim())) {
      setMedicalConditions([...medicalConditions, newMedicalCondition.trim()]);
      setNewMedicalCondition('');
    }
  };

  const removeMedicalCondition = (conditionToRemove: string) => {
    setMedicalConditions(medicalConditions.filter(condition => condition !== conditionToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Health Profile</h2>
              <p className="text-gray-500">Set up your medical information for accurate guidance</p>
            </div>
          </div>
          <Button 
            onClick={saveProfile} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="emergencyContact">Emergency Contact *</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="emergencyContact"
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="Emergency contact phone number"
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bio">Additional Notes</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Any additional medical notes or information..."
              className="mt-1 min-h-[80px]"
            />
          </div>
        </div>
      </div>

      {/* Allergies Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          Medication Allergies *
        </h3>
        
        {/* Add New Allergy */}
        <div className="flex space-x-3 mb-4">
          <Input
            type="text"
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            placeholder="Add medication allergy..."
            onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
            className="flex-1"
          />
          <Button 
            onClick={addAllergy}
            type="button"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Allergies */}
        <div className="space-y-3">
          {allergies.length === 0 ? (
            <p className="text-gray-500 text-sm">No allergies added yet. Add your known medication allergies for safety.</p>
          ) : (
            allergies.map((allergy, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-800 font-medium">{allergy}</span>
                </div>
                <button
                  onClick={() => removeAllergy(allergy)}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Medical Conditions Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <User className="w-5 h-5 text-blue-500 mr-2" />
          Medical Conditions
        </h3>
        
        {/* Add New Medical Condition */}
        <div className="flex space-x-3 mb-4">
          <Input
            type="text"
            value={newMedicalCondition}
            onChange={(e) => setNewMedicalCondition(e.target.value)}
            placeholder="Add medical condition..."
            onKeyPress={(e) => e.key === 'Enter' && addMedicalCondition()}
            className="flex-1"
          />
          <Button 
            onClick={addMedicalCondition}
            type="button"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Medical Conditions */}
        <div className="space-y-3">
          {medicalConditions.length === 0 ? (
            <p className="text-gray-500 text-sm">No medical conditions added. Add any relevant conditions for better guidance.</p>
          ) : (
            medicalConditions.map((condition, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-blue-500" />
                  <span className="text-blue-800 font-medium">{condition}</span>
                </div>
                <button
                  onClick={() => removeMedicalCondition(condition)}
                  className="text-blue-500 hover:text-blue-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Important Notice */}
      <div className="bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Complete Setup for Best Results</h3>
            <p className="text-blue-800 text-sm">
              Fields marked with * are required for Flikt to provide accurate medication guidance and safety alerts.
              Your emergency contact will be notified in case of serious medication interactions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
