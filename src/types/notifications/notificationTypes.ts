export type NotificationCategory = 'expiry' | 'inspection' | 'complaint' | 'financial' | 'system';
export type NotificationSeverity = 'info' | 'warning' | 'critical';

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}
