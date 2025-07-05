
import { Camera, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ScannerInterface = ({ onScanComplete }: { onScanComplete: (result: any) => void }) => {
  const handleMockScan = () => {
    // Simulate a scanned medication
    const mockResult = {
      name: "Ibuprofen 200mg",
      barcode: "123456789012",
      ingredients: ["Ibuprofen", "Microcrystalline cellulose", "Lactose", "Sodium starch glycolate"],
      warnings: ["Contains lactose", "May cause drowsiness"],
      allergenRisk: "medium"
    };
    onScanComplete(mockResult);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-12 mb-6">
        <div className="bg-blue-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Camera className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scan Medication</h2>
        <p className="text-gray-600 mb-6">Point your camera at the barcode to analyze ingredients</p>
        
        <div className="space-y-4">
          <Button 
            onClick={handleMockScan}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            <Camera className="w-5 h-5 mr-2" />
            Start Scanning
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full py-4 text-lg font-semibold rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200"
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <Upload className="w-5 h-5 mr-2" />
            Upload Image
          </Button>
          <input 
            id="file-upload" 
            type="file" 
            accept="image/*" 
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleMockScan(); // Mock the scan result
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ScannerInterface;
