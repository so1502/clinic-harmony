import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Room } from '@/types/database';

interface RoomModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: Room | null;
  onSave: (data: Partial<Room>) => Promise<void>;
}

export function RoomModal({ open, onOpenChange, room, onSave }: RoomModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(1);
  const [equipment, setEquipment] = useState('');

  useEffect(() => {
    if (room) {
      setName(room.name);
      setCapacity(room.capacity);
      setEquipment(room.equipment || '');
    } else {
      setName('');
      setCapacity(1);
      setEquipment('');
    }
  }, [room, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setIsLoading(true);
    await onSave({
      name: name.trim(),
      capacity,
      equipment: equipment.trim() || null,
    });
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {room ? 'Edit Room' : 'New Room'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Room 101"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Capacity</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={capacity}
              onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label>Equipment</Label>
            <Textarea
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="List available equipment..."
              rows={3}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                room ? 'Update' : 'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
