import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Stethoscope, Clock } from 'lucide-react';
import { TherapyType } from '@/types/database';
import { TherapyTypeModal } from '@/components/therapy-types/TherapyTypeModal';
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

export default function TherapyTypesPage() {
  const { profile } = useAuth();
  const [therapyTypes, setTherapyTypes] = useState<TherapyType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<TherapyType | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.clinic_id) {
      fetchTherapyTypes();
    }
  }, [profile?.clinic_id]);

  const fetchTherapyTypes = async () => {
    if (!profile?.clinic_id) return;

    try {
      const { data, error } = await supabase
        .from('therapy_types')
        .select('*')
        .eq('clinic_id', profile.clinic_id)
        .order('name');

      if (error) throw error;
      setTherapyTypes(data || []);
    } catch (error) {
      console.error('Error fetching therapy types:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: Partial<TherapyType>) => {
    if (!profile?.clinic_id) return;

    try {
      if (selectedType) {
        const { error } = await supabase
          .from('therapy_types')
          .update(data)
          .eq('id', selectedType.id);
        if (error) throw error;
        toast.success('Therapy type updated');
      } else {
        const { error } = await supabase
          .from('therapy_types')
          .insert([{ ...data, clinic_id: profile.clinic_id } as any]);
        if (error) throw error;
        toast.success('Therapy type created');
      }
      setIsModalOpen(false);
      setSelectedType(null);
      fetchTherapyTypes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save therapy type');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('therapy_types')
        .delete()
        .eq('id', deleteId);
      if (error) throw error;
      toast.success('Therapy type deleted');
      setDeleteId(null);
      fetchTherapyTypes();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete therapy type');
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">Therapy Types</h1>
            <p className="page-subtitle">Manage the types of therapy your clinic offers</p>
          </div>
          <Button onClick={() => { setSelectedType(null); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
        </div>

        {/* Grid */}
        {therapyTypes.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <Stethoscope className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-2">No therapy types yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first therapy type to get started
              </p>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Type
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {therapyTypes.map((type) => (
              <Card key={type.id} className="group hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: type.color + '20' }}
                    >
                      <Stethoscope className="w-6 h-6" style={{ color: type.color }} />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => { setSelectedType(type); setIsModalOpen(true); }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(type.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{type.name}</h3>
                  {type.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {type.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{type.duration_minutes} minutes</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <TherapyTypeModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        therapyType={selectedType}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Therapy Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this therapy type? This may affect existing appointments.
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
