import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  allergies: string[] | null;
  medical_conditions: string[] | null;
  emergency_contact: string | null;
}

interface ProfileSheetProps {
  children: React.ReactNode;
}

const ProfileSheet = ({ children }: ProfileSheetProps) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load profile",
      });
    } else {
      setProfile(data);
    }
    setLoading(false);
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        allergies: profile.allergies,
        medical_conditions: profile.medical_conditions,
        emergency_contact: profile.emergency_contact,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update profile",
      });
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    }
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url || ''} />
              <AvatarFallback>
                {user.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            Profile
          </SheetTitle>
          <SheetDescription>
            Manage your profile and medical information
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-sm text-gray-500">Loading profile...</div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={profile?.display_name || ''}
                onChange={(e) =>
                  setProfile(prev => prev ? { ...prev, display_name: e.target.value } : null)
                }
                placeholder="Enter your display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={profile?.bio || ''}
                onChange={(e) =>
                  setProfile(prev => prev ? { ...prev, bio: e.target.value } : null)
                }
                placeholder="Tell us about yourself"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea
                id="allergies"
                value={profile?.allergies?.join(', ') || ''}
                onChange={(e) =>
                  setProfile(prev => prev ? { 
                    ...prev, 
                    allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  } : null)
                }
                placeholder="Enter allergies separated by commas"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditions">Medical Conditions</Label>
              <Textarea
                id="conditions"
                value={profile?.medical_conditions?.join(', ') || ''}
                onChange={(e) =>
                  setProfile(prev => prev ? { 
                    ...prev, 
                    medical_conditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                  } : null)
                }
                placeholder="Enter medical conditions separated by commas"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emergency">Emergency Contact</Label>
              <Input
                id="emergency"
                value={profile?.emergency_contact || ''}
                onChange={(e) =>
                  setProfile(prev => prev ? { ...prev, emergency_contact: e.target.value } : null)
                }
                placeholder="Emergency contact information"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={updateProfile} 
                disabled={saving}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
              
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="flex-1"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ProfileSheet;