import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Badge, Dropdown, ListGroup, Spinner } from 'react-bootstrap';
import { Bell, BellFill } from 'react-bootstrap-icons';
import { useKeycloak } from '../context/keycloakHooks';
import { API_ENDPOINTS } from '../config/api.config';
import type { Notification, NotificationResponse } from '../types/notification.types';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import './NotificationBell.css';

const POLLING_INTERVAL = 30000; // 30 seconds

export const NotificationBell: React.FC = () => {
  const { token, userInfo } = useKeycloak();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [dbUserId, setDbUserId] = useState<string | null>(null);

  // Get keycloak_id from Keycloak userInfo
  const keycloakId = userInfo?.sub as string | undefined;

  /**
   * Fetch Users.id from database based on keycloak_id
   */
  useEffect(() => {
    const fetchDbUserId = async () => {
      if (!keycloakId || !token) return;

      try {
        // Call user-service to get Users.id based on keycloak_id
        const response = await fetch(API_ENDPOINTS.USER_BY_KEYCLOAK(keycloakId), {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (response.ok) {
          const user = await response.json();
          setDbUserId(user.id); // This is Users.id from database
        }
      } catch (error) {
        console.error('Failed to fetch database user ID:', error);
      }
    };

    fetchDbUserId();
  }, [keycloakId, token]);

  /**
   * Fetch unread count
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!dbUserId) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS_UNREAD_COUNT}?userId=${dbUserId}`);

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [dbUserId]);

  /**
   * Fetch recent unread notifications for dropdown
   */
  const fetchRecentNotifications = useCallback(async () => {
    if (!dbUserId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS_UNREAD}?userId=${dbUserId}&page=0&size=5`);

      if (response.ok) {
        const data: NotificationResponse = await response.json();
        setNotifications(data.content || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [dbUserId]);

  /**
   * Mark notification as read
   */
  const markAsRead = async (notificationId: number) => {
    if (!dbUserId) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.NOTIFICATION_MARK_READ(notificationId)}?userId=${dbUserId}`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    if (!dbUserId || unreadCount === 0) return;

    try {
      const response = await fetch(`${API_ENDPOINTS.NOTIFICATIONS_MARK_ALL_READ}?userId=${dbUserId}`, {
        method: 'PUT',
      });

      if (response.ok) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  /**
   * Handle notification click
   */
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Close dropdown
    setShowDropdown(false);

    // TODO: Navigate to related entity if applicable
    // For now, just close the dropdown
  };

  /**
   * Setup polling
   */
  useEffect(() => {
    if (!token) return;

    // Initial fetch
    fetchUnreadCount();

    // Setup polling
    pollingIntervalRef.current = setInterval(() => {
      fetchUnreadCount();
    }, POLLING_INTERVAL);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [token, fetchUnreadCount]);

  /**
   * Fetch notifications when dropdown opens
   */
  useEffect(() => {
    if (showDropdown) {
      fetchRecentNotifications();
    }
  }, [showDropdown, fetchRecentNotifications]);

  /**
   * Get severity variant for badge
   */
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'WARNING':
        return 'warning';
      case 'ERROR':
        return 'danger';
      default:
        return 'info';
    }
  };

  /**
   * Format notification time
   */
  const formatNotificationTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: pt });
    } catch {
      return dateString;
    }
  };

  if (!token) {
    return null; // Don't show notification bell if not authenticated
  }

  return (
    <Dropdown 
      show={showDropdown} 
      onToggle={setShowDropdown}
      align="end"
      className="notification-bell-dropdown"
    >
      <Dropdown.Toggle
        as="div"
        className="notification-bell-toggle position-relative"
        style={{ cursor: 'pointer' }}
      >
        {unreadCount > 0 ? (
          <BellFill size={24} className="text-warning" />
        ) : (
          <Bell size={24} className="text-muted" />
        )}
        {unreadCount > 0 && (
          <Badge
            bg="danger"
            pill
            className="position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.65rem', padding: '0.25rem 0.4rem' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-dropdown-menu shadow-lg" style={{ width: '380px', maxHeight: '500px', overflowY: 'auto' }}>
        <div className="px-3 py-2 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">Notificações</h6>
          {unreadCount > 0 && (
            <Badge bg="primary" pill>{unreadCount} nova{unreadCount !== 1 ? 's' : ''}</Badge>
          )}
        </div>

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" size="sm" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center text-muted py-4">
            <Bell size={32} className="mb-2 opacity-50" />
            <p className="mb-0 small">Sem notificações</p>
          </div>
        ) : (
          <ListGroup variant="flush">
            {notifications.map((notification) => (
              <ListGroup.Item
                key={notification.id}
                action
                onClick={() => handleNotificationClick(notification)}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                style={{ cursor: 'pointer', borderLeft: `4px solid var(--bs-${getSeverityVariant(notification.severity)})` }}
              >
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <strong className="small">{notification.title}</strong>
                  <Badge bg={getSeverityVariant(notification.severity)} className="ms-2">
                    {notification.severity}
                  </Badge>
                </div>
                <p className="mb-1 small text-muted">{notification.message}</p>
                <small className="text-muted">
                  {formatNotificationTime(notification.createdAt)}
                </small>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}

        {notifications.length > 0 && unreadCount > 0 && (
          <>
            <Dropdown.Divider />
            <div className="text-center py-2 px-3">
              <button
                className="btn btn-sm btn-outline-primary w-100"
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
              >
                Marcar todas como lidas
              </button>
            </div>
          </>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
};
