
import { Utensils, Pill, CreditCard } from 'lucide-react';

interface NavigationProps {
  activeTab: 'analyzer' | 'medications' | 'billing';
  onTabChange: (tab: 'analyzer' | 'medications' | 'billing') => void;
}

const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  return (
    <nav className="bg-white shadow-sm border-t border-gray-100 px-4 py-2">
      <div className="max-w-4xl mx-auto flex justify-around">
        <button
          onClick={() => onTabChange('analyzer')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeTab === 'analyzer' 
              ? 'bg-green-50 text-green-600' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Utensils className="w-6 h-6" />
          <span className="text-xs font-medium">Analyzer</span>
        </button>
        
        <button
          onClick={() => onTabChange('medications')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeTab === 'medications' 
              ? 'bg-blue-50 text-blue-600' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Pill className="w-6 h-6" />
          <span className="text-xs font-medium">Medications</span>
        </button>
        
        <button
          onClick={() => onTabChange('billing')}
          className={`flex flex-col items-center space-y-1 px-4 py-3 rounded-xl transition-all duration-200 ${
            activeTab === 'billing' 
              ? 'bg-purple-50 text-purple-600' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <CreditCard className="w-6 h-6" />
          <span className="text-xs font-medium">Billing</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;
