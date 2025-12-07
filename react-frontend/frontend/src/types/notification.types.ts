export type NotificationType =
  | 'ORDER_CREATED'
  | 'CARRIER_CHANGED'
  | 'SHIPMENT_STATUS_UPDATED'
  | 'DELIVERY_EXCEPTION'
  | 'ORDER_ASSIGNED'
  | 'ORDER_DISPATCHED';

export type NotificationSeverity = 'INFO' | 'WARNING' | 'ERROR';

export interface Notification {
  id: number;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  severity: NotificationSeverity;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  metadata?: Record<string, any>;
}

export interface NotificationResponse {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
