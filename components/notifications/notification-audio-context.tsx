"use client"

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode, useRef } from 'react';

interface NotificationAudioContextType {
  isAudioEnabled: boolean;
  setIsAudioEnabled: (enabled: boolean) => void;
  playNotificationSound: () => void;
}

const NotificationAudioContext = createContext<NotificationAudioContextType | undefined>(undefined);

const NOTIFICATION_AUDIO_KEY = 'notificationAudioEnabled';
const NOTIFICATION_SOUND_URL = '/din-ding-mp3.mp3';

export function NotificationAudioProvider({ children }: { children: ReactNode }) {
  const [isAudioEnabled, setIsAudioEnabledState] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(NOTIFICATION_AUDIO_KEY);
    if (saved !== null) {
      setIsAudioEnabledState(JSON.parse(saved));
    }
    // Preload audio
    audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
    audioRef.current.load();
  }, []);

  // Persist preference
  useEffect(() => {
    localStorage.setItem(NOTIFICATION_AUDIO_KEY, JSON.stringify(isAudioEnabled));
  }, [isAudioEnabled]);

  const setIsAudioEnabled = useCallback((enabled: boolean) => {
    setIsAudioEnabledState(enabled);
  }, []);

  const playNotificationSound = useCallback(() => {
    if (isAudioEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error('Error playing audio:', e));
    }
  }, [isAudioEnabled]);

  return (
    <NotificationAudioContext.Provider value={{ isAudioEnabled, setIsAudioEnabled, playNotificationSound }}>
      {children}
    </NotificationAudioContext.Provider>
  );
}

export function useNotificationAudio() {
  const ctx = useContext(NotificationAudioContext);
  if (!ctx) throw new Error('useNotificationAudio must be used within NotificationAudioProvider');
  return ctx;
} 