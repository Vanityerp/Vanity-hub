"use client"

import { useState, useEffect } from "react"
import { SettingsStorage, MessageTemplate, UnifiedTemplates } from "@/lib/settings-storage"

export interface UseTemplatesReturn {
  templates: MessageTemplate[]
  loading: boolean
  error: string | null
  getTemplatesByType: (type: "email" | "sms") => MessageTemplate[]
  getTemplatesByCategory: (category: string) => MessageTemplate[]
  getTemplateById: (id: string) => MessageTemplate | undefined
  updateTemplateUsage: (id: string) => void
  refreshTemplates: () => void
}

export function useTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const unifiedTemplates = SettingsStorage.getUnifiedTemplates()
      setTemplates(unifiedTemplates.templates)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load templates")
      console.error("Failed to load templates:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [])

  const getTemplatesByType = (type: "email" | "sms"): MessageTemplate[] => {
    return templates.filter(template => template.type === type)
  }

  const getTemplatesByCategory = (category: string): MessageTemplate[] => {
    return templates.filter(template => template.category === category)
  }

  const getTemplateById = (id: string): MessageTemplate | undefined => {
    return templates.find(template => template.id === id)
  }

  const updateTemplateUsage = (id: string): void => {
    try {
      const unifiedTemplates = SettingsStorage.getUnifiedTemplates()
      const updatedTemplates = unifiedTemplates.templates.map(template => {
        if (template.id === id) {
          return {
            ...template,
            usageCount: template.usageCount + 1,
            lastUsed: new Date()
          }
        }
        return template
      })

      const updatedUnifiedTemplates: UnifiedTemplates = {
        ...unifiedTemplates,
        templates: updatedTemplates
      }

      SettingsStorage.saveUnifiedTemplates(updatedUnifiedTemplates)
      setTemplates(updatedTemplates)
    } catch (err) {
      console.error("Failed to update template usage:", err)
    }
  }

  const refreshTemplates = (): void => {
    loadTemplates()
  }

  return {
    templates,
    loading,
    error,
    getTemplatesByType,
    getTemplatesByCategory,
    getTemplateById,
    updateTemplateUsage,
    refreshTemplates
  }
}

// Legacy interface for backward compatibility
export interface CommunicationTemplate {
  id: string
  name: string
  type: "email" | "sms"
  subject?: string
  content: string
  category: string
  isDefault: boolean
  variables: string[]
  createdAt: Date
  lastUsed?: Date
  usageCount: number
}

// Convert MessageTemplate to CommunicationTemplate for backward compatibility
export function convertToLegacyTemplate(template: MessageTemplate): CommunicationTemplate {
  return {
    id: template.id,
    name: template.name,
    type: template.type,
    subject: template.subject,
    content: template.content,
    category: template.category,
    isDefault: template.isDefault,
    variables: template.variables,
    createdAt: template.createdAt,
    lastUsed: template.lastUsed,
    usageCount: template.usageCount
  }
}

// Hook for legacy compatibility
export function useLegacyTemplates() {
  const { templates, loading, error, getTemplatesByType, getTemplatesByCategory, getTemplateById, updateTemplateUsage, refreshTemplates } = useTemplates()

  const legacyTemplates = templates.map(convertToLegacyTemplate)

  return {
    templates: legacyTemplates,
    loading,
    error,
    getTemplatesByType: (type: "email" | "sms") => getTemplatesByType(type).map(convertToLegacyTemplate),
    getTemplatesByCategory: (category: string) => getTemplatesByCategory(category).map(convertToLegacyTemplate),
    getTemplateById: (id: string) => {
      const template = getTemplateById(id)
      return template ? convertToLegacyTemplate(template) : undefined
    },
    updateTemplateUsage,
    refreshTemplates
  }
}
