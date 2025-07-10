
import { Utensils, User, Settings, LogOut, CreditCard } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SubscriptionStatus from './SubscriptionStatus';

const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-green-600 p-2 rounded-xl">
            <Utensils className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Flikkt</h1>
            <p className="text-sm text-gray-500">Food-Medication Safety</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {user && <SubscriptionStatus compact />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <User className="w-5 h-5 text-gray-600" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => navigate('/billing')}
                  className="cursor-pointer"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={signOut}
                  className="cursor-pointer"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/auth')}
            >
              Log In
            </Button>
          )}
          <button 
            onClick={() => navigate('/settings')}
            className="p-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
