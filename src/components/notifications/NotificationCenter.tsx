import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, Clock, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionRequired?: boolean;
  relatedId?: string;
}

interface NotificationCenterProps {
  userId: string;
  userRole: string;
}

const NotificationCenter = ({ userId, userRole }: NotificationCenterProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showAll, setShowAll] = useState(false);

  // Simuler des notifications basées sur le rôle
  useEffect(() => {
    const generateNotifications = (): Notification[] => {
      const baseNotifications: Notification[] = [
        {
          id: '1',
          type: 'info',
          title: 'Nouvelle demande reçue',
          message: 'Amadou Diallo a soumis une demande de congé annuel',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2h ago
          read: false,
          actionRequired: true
        },
        {
          id: '2',
          type: 'success',
          title: 'Demande approuvée',
          message: 'Votre demande de congé a été approuvée par votre manager',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4h ago
          read: false
        },
        {
          id: '3',
          type: 'warning',
          title: 'Solde de congé faible',
          message: 'Il vous reste moins de 5 jours de congé',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          read: true
        }
      ];

      // Ajouter des notifications spécifiques au rôle
      if (userRole === 'cell_manager') {
        baseNotifications.unshift({
          id: '4',
          type: 'info',
          title: '3 demandes en attente',
          message: 'Vous avez 3 demandes de congé en attente de validation',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 min ago
          read: false,
          actionRequired: true
        });
      }

      if (userRole === 'hr') {
        baseNotifications.unshift({
          id: '5',
          type: 'error',
          title: 'Problème de solde détecté',
          message: 'Le solde de Mariama Cissé présente une anomalie',
          timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
          read: false,
          actionRequired: true
        });
      }

      return baseNotifications;
    };

    setNotifications(generateNotifications());
  }, [userRole]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const notifTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notifTime.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) { // 24 hours
      return `Il y a ${Math.floor(diffInMinutes / 60)}h`;
    } else {
      return `Il y a ${Math.floor(diffInMinutes / 1440)} jour${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''}`;
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    toast.success("Notification supprimée");
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    toast.success("Toutes les notifications ont été marquées comme lues");
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Centre de Notifications
            {unreadCount > 0 && (
              <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={markAllAsRead}
            >
              Tout marquer comme lu
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p className="text-muted-foreground">Aucune notification pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedNotifications.map(notification => (
              <div 
                key={notification.id}
                className={`p-4 border rounded-lg transition-colors ${
                  !notification.read 
                    ? 'border-blue-200 bg-blue-50/50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {notification.title}
                        </h4>
                        {notification.actionRequired && (
                          <Badge variant="destructive" className="text-xs">
                            Action requise
                          </Badge>
                        )}
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTimestamp(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                        className="h-8 w-8 p-0"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissNotification(notification.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {notifications.length > 5 && (
              <Button 
                variant="outline" 
                onClick={() => setShowAll(!showAll)}
                className="w-full"
              >
                {showAll ? 'Voir moins' : `Voir toutes les notifications (${notifications.length})`}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;