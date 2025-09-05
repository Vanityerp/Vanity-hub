"use client"

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RealTimeNotification } from '@/lib/real-time-service'
import { useRealTimeNotifications } from '@/hooks/use-real-time-updates'

interface NotificationItemProps {
  notification: RealTimeNotification
  onDismiss: (id: string) => void
}

function NotificationItem({ notification, onDismiss }: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (notification.autoHide && notification.duration) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, notification.duration)
      return () => clearTimeout(timer)
    }
  }, [notification.autoHide, notification.duration])

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss(notification.id)
    }, 300)
  }

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div
      className={cn(
        "mb-3 p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out",
        getBackgroundColor(),
        isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        isExiting && "translate-x-full opacity-0"
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">
            {notification.title}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {notification.message}
          </p>
          {notification.actions && notification.actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {notification.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.action}
                  className="text-xs bg-white px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function RealTimeNotifications() {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([])
  const { subscribeToNotifications } = useRealTimeNotifications()

  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification: RealTimeNotification) => {
      setNotifications(prev => [notification, ...prev])
    })

    return unsubscribe
  }, [subscribeToNotifications])

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  // Don't render anything if no notifications
  if (notifications.length === 0) {
    return null
  }

  // Render notifications
  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-sm">
      <div className="space-y-2">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  )
}

// Hook for showing notifications easily
export function useNotification() {
  const { showNotification } = useRealTimeNotifications()

  const showSuccess = (title: string, message: string, options?: Partial<RealTimeNotification>) => {
    showNotification({
      type: 'success',
      title,
      message,
      ...options
    })
  }

  const showError = (title: string, message: string, options?: Partial<RealTimeNotification>) => {
    showNotification({
      type: 'error',
      title,
      message,
      autoHide: false, // Errors should be manually dismissed
      ...options
    })
  }

  const showWarning = (title: string, message: string, options?: Partial<RealTimeNotification>) => {
    showNotification({
      type: 'warning',
      title,
      message,
      ...options
    })
  }

  const showInfo = (title: string, message: string, options?: Partial<RealTimeNotification>) => {
    showNotification({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  return {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showNotification
  }
}
