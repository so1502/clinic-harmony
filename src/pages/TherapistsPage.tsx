import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, Trash2, UserCircle, Link2 } from 'lucide-react';
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
    const query = searchQuery.toLowerCase();
    const filtered = therapists.filter(t =>
      t.profiles?.full_name?.toLowerCase().includes(query) ||
      t.profiles?.email?.toLowerCase().includes(query) ||
      t.invite_email?.toLowerCase().includes(query) ||
      t.specialization?.toLowerCase().includes(query)
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
        if (!data.email || !data.fullName) {
          toast.error('Name and email are required to send an invite.');
          return;
        }

        if (!supabase.auth.admin) {
          throw new Error('Service role is required to send invites.');
        }

        // Check if user already exists by email
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', data.email)
          .maybeSingle();

        let userId = existingProfile?.id;
        let inviteLink: string | null = null;

        if (!userId) {
          const redirectTo = `${window.location.origin}/auth`;
          const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
            data.email,
            {
              data: { full_name: data.fullName },
              redirectTo,
            }
          );

          if (inviteError || !inviteData?.user) {
            throw new Error(inviteError?.message || 'Failed to send invite email');
          }

          userId = inviteData.user.id;
          inviteLink = inviteData.action_link ?? null;
        }

        // Ensure profile is linked to the clinic and updated with name
        await supabase
          .from('profiles')
          .upsert({
            id: userId,
            email: data.email,
            full_name: data.fullName,
            clinic_id: profile.clinic_id,
          });

        // Assign therapist role
        await supabase
          .from('user_roles')
          .upsert({
            user_id: userId,
            role: 'therapist',
          });

        // Create therapist record with pending status until invite is accepted
        const { error } = await supabase
          .from('therapists')
          .insert({
            user_id: userId,
            clinic_id: profile.clinic_id,
            specialization: data.specialization,
            bio: data.bio,
            color: data.color,
            status: inviteLink ? 'pending' : 'active',
            invite_email: data.email,
            invite_link: inviteLink,
            invite_sent_at: new Date().toISOString(),
          });
        if (error) throw error;

        toast.success('Invite sent to therapist', {
          description: inviteLink
            ? 'They will appear as pending until they accept the invite.'
            : 'Therapist profile created.',
        });

        if (inviteLink) {
          try {
            await navigator.clipboard.writeText(inviteLink);
            toast.message('Invite link copied', { description: 'You can paste it into any message.' });
          } catch {
            // Clipboard might be unavailable; ignore silently
          }
        }
      }
      setIsModalOpen(false);
      setSelectedTherapist(null);
      fetchTherapists();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save therapist');
    }
  };

  const handleCopyInvite = async (link: string | null | undefined) => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Invite link copied to clipboard');
    } catch (error: any) {
      toast.error(error?.message || 'Could not copy link');
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
              <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTherapists.length === 0 ? (
                  <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
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
                        <div className="flex flex-col gap-1">
                          <Badge variant={therapist.status === 'pending' ? 'secondary' : 'default'}>
                            {therapist.status === 'pending' ? 'Pending invite' : 'Active'}
                          </Badge>
                          {therapist.status === 'pending' && therapist.invite_email && (
                            <span className="text-xs text-muted-foreground">
                              Sent to {therapist.invite_email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(therapist.created_at), 'PP')}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {therapist.status === 'pending' && therapist.invite_link && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCopyInvite(therapist.invite_link)}
                                title="Copy invite link"
                              >
                                <Link2 className="w-4 h-4" />
                              </Button>
                            )}
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
