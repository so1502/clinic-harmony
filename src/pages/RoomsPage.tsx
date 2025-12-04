import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, DoorOpen, Users } from 'lucide-react';
import { Room } from '@/types/database';
import { RoomModal } from '@/components/rooms/RoomModal';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function RoomsPage() {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.clinic_id) {
      fetchRooms();
    }
  }, [profile?.clinic_id]);

  const fetchRooms = async () => {
    if (!profile?.clinic_id) return;

    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('clinic_id', profile.clinic_id)
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: Partial<Room>) => {
    if (!profile?.clinic_id) return;

    try {
      if (selectedRoom) {
        const { error } = await supabase
          .from('rooms')
          .update(data)
          .eq('id', selectedRoom.id);
        if (error) throw error;
        toast.success('Room updated');
      } else {
        const { error } = await supabase
          .from('rooms')
          .insert([{ ...data, clinic_id: profile.clinic_id } as any]);
        if (error) throw error;
        toast.success('Room created');
      }
      setIsModalOpen(false);
      setSelectedRoom(null);
      fetchRooms();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save room');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', deleteId);
      if (error) throw error;
      toast.success('Room deleted');
      setDeleteId(null);
      fetchRooms();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete room');
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">Rooms</h1>
            <p className="page-subtitle">Manage your clinic's therapy rooms</p>
          </div>
          <Button onClick={() => { setSelectedRoom(null); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        </div>

        {/* Grid */}
        {rooms.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <DoorOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-2">No rooms yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first room to get started
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Room
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Card key={room.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <DoorOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedRoom(room); setIsModalOpen(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(room.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{room.name}</h3>
                  {room.equipment && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {room.equipment}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>Capacity: {room.capacity}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <RoomModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        room={selectedRoom}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Room</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this room? This may affect existing appointments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
