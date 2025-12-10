import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface TherapistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  therapist: any | null;
  onSave: (data: any) => Promise<void>;
}

const COLORS = [
  '#0D9488', '#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#3B82F6'
];

export function TherapistModal({ open, onOpenChange, therapist, onSave }: TherapistModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [bio, setBio] = useState('');
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (therapist) {
      setFullName(therapist.profiles?.full_name || '');
      setEmail(therapist.profiles?.email || therapist.invite_email || '');
      setSpecialization(therapist.specialization || '');
      setBio(therapist.bio || '');
      setColor(therapist.color || COLORS[0]);
    } else {
      setFullName('');
      setEmail('');
      setSpecialization('');
      setBio('');
      setColor(COLORS[0]);
    }
  }, [therapist, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await onSave({ fullName, email, specialization, bio, color });
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {therapist ? 'Edit Therapist' : 'Add Therapist'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {!therapist && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Invite a therapist by entering their name and email. We'll send them an automated link to join and they will appear as pending until they accept.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Therapist name"
                required={!therapist}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="therapist@email.com"
                required={!therapist}
                disabled={!!therapist}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Specialization</Label>
            <Input
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g., Speech Therapy, Physiotherapy"
            />
          </div>

          <div className="space-y-2">
            <Label>Bio</Label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Brief description about the therapist..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Calendar Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === c ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                therapist ? 'Update' : 'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
