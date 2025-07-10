import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Bell, Shield, Download, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserSettings {
  notifications_enabled: boolean;
  email_alerts: boolean;
  emergency_sharing: boolean;
  data_retention_days: number;
}

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings>({
    notifications_enabled: true,
    email_alerts: false,
    emergency_sharing: true,
    data_retention_days: 365,
  });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      loadUserSettings();
    }
  }, [user, navigate]);

  const loadUserSettings = async () => {
    if (!user) return;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('notifications_enabled, email_alerts, emergency_sharing, data_retention_days')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your settings.",
      });
      return;
    }

    if (profile) {
      setSettings({
        notifications_enabled: profile.notifications_enabled ?? true,
        email_alerts: profile.email_alerts ?? false,
        emergency_sharing: profile.emergency_sharing ?? true,
        data_retention_days: profile.data_retention_days ?? 365,
      });
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        notifications_enabled: settings.notifications_enabled,
        email_alerts: settings.email_alerts,
        emergency_sharing: settings.emergency_sharing,
        data_retention_days: settings.data_retention_days,
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error saving settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your settings. Please try again.",
      });
    } else {
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    }
    
    setSaving(false);
  };

  const handleExportData = async () => {
    setExporting(true);
    
    // Simulate data export
    setTimeout(() => {
      const data = {
        profile: "User profile data",
        scans: "Medication scan history",
        analyses: "Document analysis history",
        settings: settings,
        exported_at: new Date().toISOString(),
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flikkt-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully.",
      });
      setExporting(false);
    }, 2000);
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, you'd implement account deletion
      toast({
        variant: "destructive",
        title: "Account deletion",
        description: "Account deletion feature will be implemented in a future update.",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Flikkt
          </Button>
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your Flikkt preferences and account settings</p>
          </div>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Push Notifications</Label>
                  <div className="text-sm text-gray-500">
                    Receive notifications about medication alerts
                  </div>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.notifications_enabled}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, notifications_enabled: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-alerts">Email Alerts</Label>
                  <div className="text-sm text-gray-500">
                    Get email notifications for critical drug interactions
                  </div>
                </div>
                <Switch
                  id="email-alerts"
                  checked={settings.email_alerts}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, email_alerts: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Manage your privacy and data sharing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emergency-sharing">Emergency Data Sharing</Label>
                  <div className="text-sm text-gray-500">
                    Allow emergency responders to access your allergy information
                  </div>
                </div>
                <Switch
                  id="emergency-sharing"
                  checked={settings.emergency_sharing}
                  onCheckedChange={(checked) =>
                    setSettings(prev => ({ ...prev, emergency_sharing: checked }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="data-retention">Data Retention (days)</Label>
                <Input
                  id="data-retention"
                  type="number"
                  min="30"
                  max="3650"
                  value={settings.data_retention_days}
                  onChange={(e) =>
                    setSettings(prev => ({ ...prev, data_retention_days: parseInt(e.target.value) || 365 }))
                  }
                  className="w-32"
                />
                <div className="text-sm text-gray-500">
                  How long to keep your scan and analysis history
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export or delete your data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Export Your Data</Label>
                  <div className="text-sm text-gray-500">
                    Download all your Flikkt data in JSON format
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  disabled={exporting}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  {exporting ? 'Exporting...' : 'Export Data'}
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Delete Account</Label>
                  <div className="text-sm text-gray-500">
                    Permanently delete your account and all data
                  </div>
                </div>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email || ''} disabled className="bg-gray-50" />
              </div>
              
              <div className="space-y-2">
                <Label>Account Created</Label>
                <Input 
                  value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'} 
                  disabled 
                  className="bg-gray-50" 
                />
              </div>

              <Button 
                variant="outline" 
                onClick={signOut}
                className="w-full"
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={handleSaveSettings}
              disabled={saving}
              className="gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;