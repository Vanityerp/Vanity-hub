/**
 * Location Event Bus
 * 
 * This module provides a pub/sub event system for location-related events.
 * Components can subscribe to location changes and be notified when locations
 * are added, updated, or removed.
 */

import { Location } from "@/lib/settings-storage"

export type LocationEventType = 
  | 'location-added'
  | 'location-updated'
  | 'location-removed'
  | 'locations-refreshed'
  | 'current-location-changed'

export interface LocationEvent {
  type: LocationEventType
  payload: any
}

export interface LocationAddedEvent extends LocationEvent {
  type: 'location-added'
  payload: Location
}

export interface LocationUpdatedEvent extends LocationEvent {
  type: 'location-updated'
  payload: Location
}

export interface LocationRemovedEvent extends LocationEvent {
  type: 'location-removed'
  payload: string // locationId
}

export interface LocationsRefreshedEvent extends LocationEvent {
  type: 'locations-refreshed'
  payload: Location[]
}

export interface CurrentLocationChangedEvent extends LocationEvent {
  type: 'current-location-changed'
  payload: string // locationId
}

type LocationEventListener = (event: LocationEvent) => void

class LocationEventBus {
  private listeners: Map<LocationEventType, Set<LocationEventListener>> = new Map()
  
  /**
   * Subscribe to a location event
   */
  subscribe(eventType: LocationEventType, listener: LocationEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    
    this.listeners.get(eventType)!.add(listener)
    
    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(eventType)
      if (listeners) {
        listeners.delete(listener)
      }
    }
  }
  
  /**
   * Subscribe to all location events
   */
  subscribeToAll(listener: LocationEventListener): () => void {
    const eventTypes: LocationEventType[] = [
      'location-added',
      'location-updated',
      'location-removed',
      'locations-refreshed',
      'current-location-changed'
    ]
    
    const unsubscribers = eventTypes.map(type => this.subscribe(type, listener))
    
    // Return unsubscribe function that unsubscribes from all events
    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
    }
  }
  
  /**
   * Publish a location event
   */
  publish(event: LocationEvent): void {
    const listeners = this.listeners.get(event.type)
    
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`Error in location event listener for ${event.type}:`, error)
        }
      })
    }
  }
}

// Create a singleton instance
export const locationEventBus = new LocationEventBus()
