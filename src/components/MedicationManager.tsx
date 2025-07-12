import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pill, Trash2, Edit2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Medication {
  id: string;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  purpose?: string;
  notes?: string;
}

const MedicationManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    purpose: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      fetchMedications();
    }
  }, [user]);

  const fetchMedications = async (retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('user_medications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) {
        // Retry once on database errors
        if (retryCount === 0 && (error.message.includes('connection') || error.message.includes('timeout'))) {
          console.log('Retrying medication fetch due to connection error');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchMedications(1);
        }
        throw error;
      }
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast({
        title: "Error",
        description: "Failed to load medications. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.medication_name.trim()) {
      toast({
        title: "Error",
        description: "Medication name is required",
        variant: "destructive"
      });
      return;
    }

    const submitWithRetry = async (retryCount = 0) => {
      try {
        if (editingMedication) {
          const { error } = await supabase
            .from('user_medications')
            .update({
              medication_name: formData.medication_name.trim(),
              dosage: formData.dosage?.trim() || null,
              frequency: formData.frequency?.trim() || null,
              purpose: formData.purpose?.trim() || null,
              notes: formData.notes?.trim() || null
            })
            .eq('id', editingMedication.id);

          if (error) throw error;
          
          toast({
            title: "Success",
            description: "Medication updated successfully"
          });
        } else {
          const { error } = await supabase
            .from('user_medications')
            .insert({
              user_id: user!.id,
              medication_name: formData.medication_name.trim(),
              dosage: formData.dosage?.trim() || null,
              frequency: formData.frequency?.trim() || null,
              purpose: formData.purpose?.trim() || null,
              notes: formData.notes?.trim() || null
            });

          if (error) throw error;
          
          toast({
            title: "Success",
            description: "Medication added successfully"
          });
        }

        await fetchMedications();
        setIsDialogOpen(false);
        setEditingMedication(null);
        setFormData({
          medication_name: '',
          dosage: '',
          frequency: '',
          purpose: '',
          notes: ''
        });
      } catch (error: any) {
        console.error('Error saving medication:', error);
        
        // Retry once on connection errors
        if (retryCount === 0 && (error.message?.includes('connection') || error.message?.includes('timeout'))) {
          console.log('Retrying medication save due to connection error');
          await new Promise(resolve => setTimeout(resolve, 1000));
          return submitWithRetry(1);
        }
        
        toast({
          title: "Error",
          description: `Failed to save medication: ${error.message || 'Unknown error'}`,
          variant: "destructive"
        });
      }
    };

    await submitWithRetry();
  };

  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setFormData({
      medication_name: medication.medication_name,
      dosage: medication.dosage || '',
      frequency: medication.frequency || '',
      purpose: medication.purpose || '',
      notes: medication.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (medicationId: string) => {
    try {
      const { error } = await supabase
        .from('user_medications')
        .delete()
        .eq('id', medicationId);

      if (error) throw error;
      
      await fetchMedications();
      toast({
        title: "Success",
        description: "Medication removed successfully"
      });
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast({
        title: "Error",
        description: "Failed to remove medication",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Pill className="w-8 h-8 text-blue-600 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-600">Loading medications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Medications</h2>
          <p className="text-gray-600">Manage your current medications for food interaction analysis</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingMedication(null);
              setFormData({
                medication_name: '',
                dosage: '',
                frequency: '',
                purpose: '',
                notes: ''
              });
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMedication ? 'Edit Medication' : 'Add New Medication'}</DialogTitle>
              <DialogDescription>
                Enter your medication details for accurate food interaction analysis.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="medication_name">Medication Name *</Label>
                  <Input
                    id="medication_name"
                    value={formData.medication_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, medication_name: e.target.value }))}
                    placeholder="e.g., Metformin, Lisinopril"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 500mg, 10mg"
                  />
                </div>
                <div>
                  <Label htmlFor="frequency">Frequency</Label>
                  <Input
                    id="frequency"
                    value={formData.frequency}
                    onChange={(e) => setFormData(prev => ({ ...prev, frequency: e.target.value }))}
                    placeholder="e.g., Twice daily, Once at bedtime"
                  />
                </div>
                <div>
                  <Label htmlFor="purpose">Purpose</Label>
                  <Input
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="e.g., Diabetes, High blood pressure"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any additional notes about this medication"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit">
                  {editingMedication ? 'Update Medication' : 'Add Medication'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {medications.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No medications added yet</h3>
            <p className="text-gray-600 mb-4">
              Add your current medications to get personalized food interaction analysis
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Medication
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {medications.map((medication) => (
            <Card key={medication.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Pill className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{medication.medication_name}</CardTitle>
                      {medication.purpose && (
                        <CardDescription>For {medication.purpose}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(medication)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(medication.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {medication.dosage && (
                    <div>
                      <span className="font-medium text-gray-700">Dosage:</span>
                      <p className="text-gray-600">{medication.dosage}</p>
                    </div>
                  )}
                  {medication.frequency && (
                    <div>
                      <span className="font-medium text-gray-700">Frequency:</span>
                      <p className="text-gray-600">{medication.frequency}</p>
                    </div>
                  )}
                </div>
                {medication.notes && (
                  <div className="mt-3 text-sm">
                    <span className="font-medium text-gray-700">Notes:</span>
                    <p className="text-gray-600">{medication.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MedicationManager;