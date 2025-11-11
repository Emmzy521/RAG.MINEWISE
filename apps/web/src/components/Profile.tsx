import { useState, useEffect } from 'react';
import { auth } from '../lib/firebase';
import { User } from 'firebase/auth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { User as UserIcon, Mail, Calendar, Shield } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface ProfileProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function Profile({ open, onOpenChange }: ProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.title')}</DialogTitle>
            <DialogDescription>Loading your profile...</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('profile.title')}</DialogTitle>
            <DialogDescription>No user information available.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const createdAt = user.metadata.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown';

  const lastSignIn = user.metadata.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Unknown';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold gradient-text">{t('profile.title')}</DialogTitle>
          <DialogDescription>{t('profile.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Profile Picture and Name */}
          <Card className="bg-card/50 backdrop-blur-sm border-cyan-400/20">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || user.email || 'User'}
                      className="w-24 h-24 rounded-full border-2 border-cyan-400/30 object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-cyan-400/30 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                      <UserIcon className="w-12 h-12 text-cyan-400" />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-foreground">
                    {user.displayName || 'User'}
                  </h3>
                  {user.displayName && (
                    <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Details */}
          <Card className="bg-card/50 backdrop-blur-sm border-cyan-400/20">
            <CardHeader>
              <CardTitle className="text-lg">{t('profile.title')}</CardTitle>
              <CardDescription>{t('profile.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Mail className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{t('profile.email')}</p>
                  <p className="text-sm text-foreground break-all">{user.email || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{t('profile.emailVerified')}</p>
                  <p className="text-sm text-foreground">
                    {user.emailVerified ? (
                      <span className="text-green-400">{t('profile.verified')}</span>
                    ) : (
                      <span className="text-yellow-400">{t('profile.notVerified')}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{t('profile.accountCreated')}</p>
                  <p className="text-sm text-foreground">{createdAt}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Calendar className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">{t('profile.lastSignIn')}</p>
                  <p className="text-sm text-foreground">{lastSignIn}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

