import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { TherapyType } from '@/types/database';

interface TherapyTypeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  therapyType: TherapyType | null;
  onSave: (data: Partial<TherapyType>) => Promise<void>;
}

const COLORS = [
  '#6366F1', '#0D9488', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#3B82F6'
];

export function TherapyTypeModal({ open, onOpenChange, therapyType, onSave }: TherapyTypeModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(60);
  const [color, setColor] = useState(COLORS[0]);

  useEffect(() => {
    if (therapyType) {
      setName(therapyType.name);
      setDescription(therapyType.description || '');
      setDuration(therapyType.duration_minutes);
      setColor(therapyType.color);
    } else {
      setName('');
      setDescription('');
      setDuration(60);
      setColor(COLORS[0]);
    }
  }, [therapyType, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    await onSave({
      name: name.trim(),
      description: description.trim() || null,
      duration_minutes: duration,
      color,
    });
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {therapyType ? 'Edit Therapy Type' : 'New Therapy Type'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Speech Therapy"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this therapy type..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Default Duration (minutes)</Label>
            <Input
              type="number"
              min={15}
              max={240}
              step={15}
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 60)}
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
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
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                therapyType ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
