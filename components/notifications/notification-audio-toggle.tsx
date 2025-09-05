'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Volume2, VolumeX } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useNotificationAudio } from './notification-audio-context'

export function NotificationAudioToggle() {
  const { isAudioEnabled, setIsAudioEnabled } = useNotificationAudio();

  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="audio-toggle"></Label>
      <Switch
        id="audio-toggle"
        checked={isAudioEnabled}
        onCheckedChange={setIsAudioEnabled}
        aria-label="Toggle notification sound"
      />
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsAudioEnabled(!isAudioEnabled)}
        aria-label={isAudioEnabled ? "Mute notifications" : "Unmute notifications"}
      >
        {isAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
      </Button>
    </div>
  )
}