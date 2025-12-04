import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, UserCircle } from 'lucide-react';
import { Therapist } from '@/types/database';
import { TherapistModal } from '@/components/therapists/TherapistModal';
import { toast } from 'sonner';
import { format } from 'date-fns';
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

export default function TherapistsPage() {
  const { profile, isAdmin } = useAuth();
  const [therapists, setTherapists] = useState<any[]>([]);
  const [filteredTherapists, setFilteredTherapists] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTherapist, setSelectedTherapist] = useState<any>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.clinic_id) {
      fetchTherapists();
    }
  }, [profile?.clinic_id]);

  useEffect(() => {
    const filtered = therapists.filter(t =>
      t.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTherapists(filtered);
  }, [therapists, searchQuery]);

  const fetchTherapists = async () => {
    if (!profile?.clinic_id) return;

    try {
      const { data, error } = await supabase
        .from('therapists')
        .select('*, profiles:user_id(full_name, email)')
        .eq('clinic_id', profile.clinic_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTherapists(data || []);
    } catch (error) {
      console.error('Error fetching therapists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (data: any) => {
    if (!profile?.clinic_id) return;

    try {
      if (selectedTherapist) {
        const { error } = await supabase
          .from('therapists')
          .update({
            specialization: data.specialization,
            bio: data.bio,
            color: data.color,
          })
          .eq('id', selectedTherapist.id);
        if (error) throw error;
        toast.success('Therapist updated');
      } else {
        // First create the user account
        const { data: authData, error: authError } = await supabase.auth.admin?.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true,
        });

        if (authError) {
          // Fallback: user might already exist, let them know
          toast.error('To add a therapist, they must first create an account. Then you can assign them the therapist role.');
          return;
        }

        // Create therapist record
        const { error } = await supabase
          .from('therapists')
          .insert({
            user_id: authData.user.id,
            clinic_id: profile.clinic_id,
            specialization: data.specialization,
            bio: data.bio,
            color: data.color,
          });
        if (error) throw error;

        // Assign therapist role
        await supabase
          .from('user_roles')
          .insert({
            user_id: authData.user.id,
            role: 'therapist',
          });

        toast.success('Therapist created');
      }
      setIsModalOpen(false);
      setSelectedTherapist(null);
      fetchTherapists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save therapist');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('therapists')
        .delete()
        .eq('id', deleteId);
      if (error) throw error;
      toast.success('Therapist removed');
      setDeleteId(null);
      fetchTherapists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete therapist');
    }
  };

  return (
    <DashboardLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">Therapists</h1>
            <p className="page-subtitle">Manage your clinic's therapist team</p>
          </div>
          {isAdmin && (
            <Button onClick={() => { setSelectedTherapist(null); setIsModalOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Therapist
            </Button>
          )}
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Therapist</TableHead>
                  <TableHead>Specialization</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Joined</TableHead>
                  {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTherapists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <UserCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        {searchQuery ? 'No therapists found' : 'No therapists yet'}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTherapists.map((therapist) => (
                    <TableRow key={therapist.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: therapist.color + '20' }}
                          >
                            <span
                              className="text-sm font-semibold"
                              style={{ color: therapist.color }}
                            >
                              {therapist.profiles?.full_name?.charAt(0).toUpperCase() || 'T'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">{therapist.profiles?.full_name || 'Unknown'}</p>
                            <p className="text-sm text-muted-foreground">{therapist.profiles?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {therapist.specialization || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full border"
                            style={{ backgroundColor: therapist.color }}
                          />
                          <span className="text-sm text-muted-foreground">{therapist.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(therapist.created_at), 'PP')}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => { setSelectedTherapist(therapist); setIsModalOpen(true); }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(therapist.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <TherapistModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        therapist={selectedTherapist}
        onSave={handleSave}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Therapist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this therapist from your clinic?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
