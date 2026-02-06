import { useState, useEffect } from 'react';
import api from '@/api';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Phone, GraduationCap, Building2, Shield, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';

const ProfileDialog = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const { user } = useAuth();

    const fetchProfile = async () => {
        setLoading(true);
        setProfile(null); // Clear stale data before fetching
        try {
            const res = await api.get('/user/profile');
            setProfile(res.data);
        } catch (err) {
            console.error('Failed to fetch profile:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchProfile();
        }
    }, [open]);

    // Reset profile when user changes (logout/login different account)
    useEffect(() => {
        setProfile(null);
    }, [user?.id]);

    const getRoleBadgeVariant = (role) => {
        switch (role) {
            case 'admin':
                return 'destructive';
            case 'club':
                return 'secondary';
            case 'student':
            default:
                return 'default';
        }
    };

    const ProfileItem = ({ icon: Icon, label, value }) => {
        if (!value) return null;
        return (
            <div className="flex items-center gap-3 py-3 border-b border-slate-800 last:border-b-0">
                <div className="p-2 bg-slate-800/50 rounded-lg">
                    <Icon className="size-4 text-green-400" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-white">{value}</p>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user?.username}</span>
                    <Badge variant={getRoleBadgeVariant(user?.role)} className="capitalize">
                        {user?.role}
                    </Badge>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-green-400" />
                        My Profile
                    </DialogTitle>
                    <DialogDescription>
                        Your personal information stored in the system
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="size-8 animate-spin text-green-400" />
                    </div>
                ) : profile ? (
                    <div className="space-y-1">
                        {/* Header with avatar */}
                        <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg mb-4">
                            <div className="size-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                    {(profile.name || profile.username || '?').charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">
                                    {profile.name || profile.username}
                                </h3>
                                <Badge variant={getRoleBadgeVariant(profile.role)} className="capitalize mt-1">
                                    {profile.role}
                                </Badge>
                            </div>
                        </div>

                        {/* Profile Details */}
                        <div className="bg-slate-900/30 rounded-lg px-4">
                            <ProfileItem icon={User} label="Username" value={profile.username} />
                            <ProfileItem icon={User} label="Full Name" value={profile.name} />
                            <ProfileItem icon={Mail} label="Email" value={profile.email} />
                            <ProfileItem icon={Phone} label="Phone" value={profile.phone} />
                            {profile.role === 'student' && (
                                <>
                                    <ProfileItem icon={GraduationCap} label="Year" value={profile.year ? `Year ${profile.year}` : null} />
                                    <ProfileItem icon={Building2} label="Branch" value={profile.branch} />
                                </>
                            )}
                        </div>

                        {/* Info notice - only for non-admin users */}
                        {profile.role !== 'admin' && (
                            <p className="text-xs text-muted-foreground text-center pt-4">
                                Contact admin to update your profile information
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        Unable to load profile data
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ProfileDialog;
