"use client"

import { DocumentStorage, StaffDocument, DocumentStatus } from './document-storage'
import { differenceInDays } from 'date-fns'

// Storage keys
const STORAGE_KEYS = {
  DOCUMENT_NOTIFICATIONS: 'vanity_document_notifications',
}

// Notification type enum
export enum NotificationType {
  DOCUMENT_EXPIRING = 'document_expiring',
  DOCUMENT_EXPIRED = 'document_expired',
}

// Notification interface
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

// Document notification interface
export interface DocumentNotification extends Notification {
  data: {
    documentId: string;
    staffId: string;
    staffName: string;
    documentType: string;
    documentTypeName: string;
    expiryDate: string;
    daysRemaining?: number;
  };
}

// Helper function to get data from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Helper function to save data to localStorage
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('notificationsUpdated'));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

// Notification Service
export const NotificationService = {
  // Get all notifications
  getNotifications: (): Notification[] => getFromStorage<Notification[]>(STORAGE_KEYS.DOCUMENT_NOTIFICATIONS, []),

  // Save all notifications
  saveNotifications: (notifications: Notification[]) => saveToStorage(STORAGE_KEYS.DOCUMENT_NOTIFICATIONS, notifications),

  // Add a new notification
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification => {
    const notifications = NotificationService.getNotifications();
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };
    
    notifications.push(newNotification);
    saveToStorage(STORAGE_KEYS.DOCUMENT_NOTIFICATIONS, notifications);
    return newNotification;
  },

  // Mark notification as read
  markAsRead: (id: string): void => {
    const notifications = NotificationService.getNotifications();
    const index = notifications.findIndex(n => n.id === id);
    
    if (index !== -1) {
      notifications[index] = {
        ...notifications[index],
        read: true
      };
      saveToStorage(STORAGE_KEYS.DOCUMENT_NOTIFICATIONS, notifications);
    }
  },

  // Mark all notifications as read
  markAllAsRead: (): void => {
    const notifications = NotificationService.getNotifications();
    const updatedNotifications = notifications.map(n => ({
      ...n,
      read: true
    }));
    saveToStorage(STORAGE_KEYS.DOCUMENT_NOTIFICATIONS, updatedNotifications);
  },

  // Delete a notification
  deleteNotification: (id: string): void => {
    const notifications = NotificationService.getNotifications();
    const filteredNotifications = notifications.filter(n => n.id !== id);
    saveToStorage(STORAGE_KEYS.DOCUMENT_NOTIFICATIONS, filteredNotifications);
  },

  // Get unread notifications count
  getUnreadCount: (): number => {
    const notifications = NotificationService.getNotifications();
    return notifications.filter(n => !n.read).length;
  },

  // Check for expiring documents and create notifications
  checkExpiringDocuments: (): Notification[] => {
    // Update document statuses first
    DocumentStorage.updateDocumentStatuses();
    
    const documents = DocumentStorage.getStaffDocuments();
    const today = new Date();
    const notifications: Notification[] = [];
    
    // Check for documents expiring in 30, 15, or 7 days
    const alertDays = [30, 15, 7];
    
    documents.forEach(doc => {
      const expiryDate = new Date(doc.expiryDate);
      const daysRemaining = differenceInDays(expiryDate, today);
      
      // Check if document is expiring on one of our alert days
      if (alertDays.includes(daysRemaining)) {
        // Check if we already have a notification for this document and day
        const existingNotifications = NotificationService.getNotifications();
        const alreadyNotified = existingNotifications.some(n => {
          if (n.type === NotificationType.DOCUMENT_EXPIRING && 
              (n as DocumentNotification).data?.documentId === doc.id) {
            const notifDaysRemaining = (n as DocumentNotification).data?.daysRemaining;
            return notifDaysRemaining === daysRemaining;
          }
          return false;
        });
        
        if (!alreadyNotified) {
          const notification: DocumentNotification = {
            id: `notif-${Date.now()}-${doc.id}`,
            type: NotificationType.DOCUMENT_EXPIRING,
            title: `Document Expiring Soon`,
            message: `${doc.staffName}'s ${doc.documentTypeName} will expire in ${daysRemaining} days.`,
            timestamp: new Date().toISOString(),
            read: false,
            data: {
              documentId: doc.id,
              staffId: doc.staffId,
              staffName: doc.staffName,
              documentType: doc.documentType,
              documentTypeName: doc.documentTypeName,
              expiryDate: doc.expiryDate,
              daysRemaining
            }
          };
          
          notifications.push(notification);
        }
      }
      
      // Check for expired documents that haven't been notified yet
      if (doc.status === DocumentStatus.EXPIRED) {
        // Check if we already have an expiration notification for this document
        const existingNotifications = NotificationService.getNotifications();
        const alreadyNotified = existingNotifications.some(n => 
          n.type === NotificationType.DOCUMENT_EXPIRED && 
          (n as DocumentNotification).data?.documentId === doc.id
        );
        
        if (!alreadyNotified) {
          const notification: DocumentNotification = {
            id: `notif-${Date.now()}-${doc.id}-expired`,
            type: NotificationType.DOCUMENT_EXPIRED,
            title: `Document Expired`,
            message: `${doc.staffName}'s ${doc.documentTypeName} has expired.`,
            timestamp: new Date().toISOString(),
            read: false,
            data: {
              documentId: doc.id,
              staffId: doc.staffId,
              staffName: doc.staffName,
              documentType: doc.documentType,
              documentTypeName: doc.documentTypeName,
              expiryDate: doc.expiryDate
            }
          };
          
          notifications.push(notification);
        }
      }
    });
    
    // Add new notifications to storage
    if (notifications.length > 0) {
      const existingNotifications = NotificationService.getNotifications();
      saveToStorage(STORAGE_KEYS.DOCUMENT_NOTIFICATIONS, [...existingNotifications, ...notifications]);
    }
    
    return notifications;
  },

  // Get document notifications
  getDocumentNotifications: (): DocumentNotification[] => {
    const notifications = NotificationService.getNotifications();
    return notifications.filter(
      n => n.type === NotificationType.DOCUMENT_EXPIRING || n.type === NotificationType.DOCUMENT_EXPIRED
    ) as DocumentNotification[];
  },

  // Get expiring document count for dashboard
  getExpiringDocumentCount: (): number => {
    // This combines both documents expiring soon and already expired
    const expiringDocs = DocumentStorage.getExpiringDocuments();
    const expiredDocs = DocumentStorage.getExpiredDocuments();
    return expiringDocs.length + expiredDocs.length;
  }
};
