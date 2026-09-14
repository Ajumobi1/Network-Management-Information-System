import { supabase } from '../../lib/supabase/supabaseClient';
import { SecureContractError } from '../../lib/security/secureContracts';
import { useMockData } from '../common';
import { NotificationCategory, NotificationSeverity, SystemNotification } from '../../types/notifications/notificationTypes';

let mockNotifications: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Credential Expiry Warning',
    message: 'Operating license for Sunvale Hospital expires in 14 days.',
    category: 'expiry',
    severity: 'warning',
    isRead: false,
    linkUrl: '/providers',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'notif-2',
    title: 'Critical Inspection Finding',
    message: 'Riverside Clinic received a failing sanitation score during routine audit.',
    category: 'inspection',
    severity: 'critical',
    isRead: false,
    linkUrl: '/performance',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'notif-3',
    title: 'Capitation Batch Approved',
    message: 'August 2026 capitation batch for Ondo State has been approved for payment.',
    category: 'financial',
    severity: 'info',
    isRead: true,
    linkUrl: '/capitation',
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

interface DbNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  is_read: boolean;
  link_url: string | null;
  created_at: string;
}

export const notificationsRepository = {
  async fetchNotifications(unreadOnly = false): Promise<SystemNotification[]> {
    if (useMockData) {
      return unreadOnly ? mockNotifications.filter(notification => !notification.isRead) : [...mockNotifications];
    }

    const { data, error } = await supabase.rpc('nmis_list_notifications', { p_unread_only: unreadOnly });
    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to list notifications');
    }

    return (data || []).map((notification: DbNotification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      category: notification.category,
      severity: notification.severity,
      isRead: notification.is_read,
      linkUrl: notification.link_url || undefined,
      createdAt: notification.created_at,
    }));
  },

  async markAsRead(id: string): Promise<boolean> {
    if (useMockData) {
      const target = mockNotifications.find(notification => notification.id === id);
      if (!target) return false;
      target.isRead = true;
      return true;
    }

    const { data, error } = await supabase.rpc('nmis_mark_notification_read', { p_notification_id: id });
    if (error) {
      const code = error.code === 'P0001' && error.message.includes('ACCESS_RESTRICTED')
        ? 'ACCESS_RESTRICTED'
        : 'SECURE_CONTRACT_UNAVAILABLE';
      throw new SecureContractError(code, error.message || 'Failed to mark notification read');
    }

    return data;
  },
};
