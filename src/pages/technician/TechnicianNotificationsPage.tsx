import { useEffect, useState } from 'react';
import { supabase, type Notification } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { markAsRead, markAllAsRead } from '@/lib/notifications';
import { formatTimeAgo } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader as Loader2, Bell, BellOff, CheckCheck } from 'lucide-react';

export function TechnicianNotificationsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!profile?.id) return;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('notifications').select('*').eq('user_id', profile.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setNotifications(data ?? []);
      } catch {
        toast({ title: 'Failed to load notifications', variant: 'error' });
      } finally {
        setLoading(false);
      }
    })();
  }, [profile?.id]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    } catch {
      toast({ title: 'Failed to mark as read', variant: 'error' });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead(profile!.id);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast({ title: 'All notifications marked as read', variant: 'success' });
    } catch {
      toast({ title: 'Failed to mark all as read', variant: 'error' });
    }
  };

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <CheckCheck className="mr-1 h-4 w-4" />Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center gap-3 py-12">
          <BellOff className="h-10 w-10 text-gray-400" />
          <p className="text-gray-500">No notifications yet</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <Card key={n.id} className={n.is_read ? 'opacity-60' : ''}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 rounded-full p-2 ${n.is_read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                    <Bell className={`h-4 w-4 ${n.is_read ? 'text-gray-400' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{n.title}</p>
                      {!n.is_read && <Badge variant="default">New</Badge>}
                    </div>
                    <p className="text-sm text-gray-600">{n.message}</p>
                    <p className="mt-1 text-xs text-gray-400">{formatTimeAgo(n.created_at)}</p>
                  </div>
                </div>
                {!n.is_read && (
                  <Button size="sm" variant="ghost" onClick={() => handleMarkAsRead(n.id)}>
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
