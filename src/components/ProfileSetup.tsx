
import { User, AlertTriangle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const ProfileSetup = () => {
  const [allergies, setAllergies] = useState(['Penicillin', 'Aspirin']);
  const [newAllergy, setNewAllergy] = useState('');

  const addAllergy = () => {
    if (newAllergy.trim() && !allergies.includes(newAllergy.trim())) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergyToRemove: string) => {
    setAllergies(allergies.filter(allergy => allergy !== allergyToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-start space-x-4">
          <div className="bg-green-100 p-3 rounded-xl">
            <User className="w-8 h-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Health Profile</h2>
            <p className="text-gray-500">Manage your allergies and medical information</p>
          </div>
        </div>
      </div>

      {/* Allergies Section */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          Medication Allergies
        </h3>
        
        {/* Add New Allergy */}
        <div className="flex space-x-3 mb-4">
          <input
            type="text"
            value={newAllergy}
            onChange={(e) => setNewAllergy(e.target.value)}
            placeholder="Add medication allergy..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            onKeyPress={(e) => e.key === 'Enter' && addAllergy()}
          />
          <Button 
            onClick={addAllergy}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Current Allergies */}
        <div className="space-y-3">
          {allergies.map((allergy, index) => (
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
          ))}
        </div>
      </div>

      {/* Medical History */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Scans & Analysis</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Ibuprofen 200mg</h4>
              <p className="text-sm text-gray-500">Scanned 2 hours ago • Medium risk</p>
            </div>
            <span className="text-amber-600 font-medium">⚠️</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Lab Results Analysis</h4>
              <p className="text-sm text-gray-500">Analyzed yesterday • 3 conditions detected</p>
            </div>
            <span className="text-blue-600 font-medium">📄</span>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Push Notifications</span>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Share Data with Doctor</span>
            <input type="checkbox" className="toggle" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Emergency Contact Access</span>
            <input type="checkbox" className="toggle" defaultChecked />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
