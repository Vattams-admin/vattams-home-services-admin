import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Loader as Loader2, Save } from 'lucide-react';

export function TechnicianProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [bio, setBio] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
        if (error) throw error;
        setFullName(data.full_name ?? '');
        setMobile(data.mobile ?? '');
        setExperience(String(data.experience_years ?? ''));
        setSkills((data.skills ?? []).join(', '));
        setBio(data.bio ?? '');
        setIsAvailable(!!data.is_available);
      } catch {
        toast({ title: 'Failed to load profile', variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: fullName,
        mobile,
        experience_years: experience ? Number(experience) : null,
        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),
        bio,
        is_available: isAvailable,
      }).eq('id', profile!.id);
      if (error) throw error;
      await refreshProfile();
      toast({ title: 'Profile updated successfully', variant: 'success' });
    } catch {
      toast({ title: 'Failed to update profile', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Edit Profile</h1>
      <Card>
        <CardHeader><CardTitle>Technician Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Mobile</Label>
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
          </div>
          <div>
            <Label>Experience (years)</Label>
            <Input type="number" min="0" value={experience} onChange={(e) => setExperience(e.target.value)} />
          </div>
          <div>
            <Label>Skills (comma-separated)</Label>
            <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="e.g. Plumbing, Electrical, Carpentry" />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea rows={4} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell customers about yourself..." />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isAvailable} onCheckedChange={setIsAvailable} />
            <Label className="cursor-pointer" onClick={() => setIsAvailable(!isAvailable)}>Available for work</Label>
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
