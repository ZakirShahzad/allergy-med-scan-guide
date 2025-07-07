
import { Pill, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ProfileSheet from './ProfileSheet';

const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-xl">
            <Pill className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">MedSafe</h1>
            <p className="text-sm text-gray-500">Your medication guardian</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <ProfileSheet>
              <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                <User className="w-5 h-5 text-gray-600" />
              </button>
            </ProfileSheet>
          ) : (
            <button 
              onClick={() => navigate('/auth')}
              className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
