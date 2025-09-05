'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { z } from 'zod'
import { enhancedValidation, ValidationResult, RealTimeValidationConfig } from '@/lib/validation/enhanced-validation'

// Real-time validation hook interface
export interface UseRealTimeValidationOptions {
  schema: z.ZodSchema<any>
  debounceMs?: number
  validateOnChange?: boolean
  validateOnBlur?: boolean
  showWarnings?: boolean
  showSuggestions?: boolean
  onValidationChange?: (isValid: boolean, errors: any[]) => void
}

// Field validation state
export interface FieldValidationState {
  isValid: boolean
  isValidating: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
  touched: boolean
  dirty: boolean
}

// Form validation state
export interface FormValidationState {
  isValid: boolean
  isValidating: boolean
  errors: Record<string, string[]>
  warnings: Record<string, string[]>
  suggestions: Record<string, string[]>
  touchedFields: Set<string>
  dirtyFields: Set<string>
}

/**
 * Real-time validation hook for individual fields
 */
export function useFieldValidation(
  fieldName: string,
  initialValue: any = '',
  options: UseRealTimeValidationOptions
) {
  const [value, setValue] = useState(initialValue)
  const [validationState, setValidationState] = useState<FieldValidationState>({
    isValid: true,
    isValidating: false,
    errors: [],
    warnings: [],
    suggestions: [],
    touched: false,
    dirty: false
  })

  const debounceRef = useRef<NodeJS.Timeout>()
  const validationRef = useRef<Promise<ValidationResult> | null>(null)

  const {
    schema,
    debounceMs = 300,
    validateOnChange = true,
    validateOnBlur = true,
    showWarnings = true,
    showSuggestions = true,
    onValidationChange
  } = options

  // Validate field value
  const validateField = useCallback(async (fieldValue: any) => {
    setValidationState(prev => ({ ...prev, isValidating: true }))

    try {
      const config: RealTimeValidationConfig = {
        debounceMs,
        validateOnChange,
        validateOnBlur,
        showWarnings,
        showSuggestions
      }

      const validationPromise = enhancedValidation.validateField(
        schema,
        fieldName,
        fieldValue,
        config
      )

      validationRef.current = validationPromise
      const result = await validationPromise

      // Only update if this is still the latest validation
      if (validationRef.current === validationPromise) {
        const newState: FieldValidationState = {
          isValid: result.success,
          isValidating: false,
          errors: result.errors?.map(e => e.message) || [],
          warnings: result.warnings?.map(w => w.message) || [],
          suggestions: result.warnings?.map(w => w.suggestion).filter(Boolean) || [],
          touched: validationState.touched,
          dirty: validationState.dirty
        }

        setValidationState(newState)

        if (onValidationChange) {
          onValidationChange(result.success, result.errors || [])
        }
      }
    } catch (error) {
      console.error('Field validation error:', error)
      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        isValid: false,
        errors: ['Validation error occurred']
      }))
    }
  }, [schema, fieldName, debounceMs, validateOnChange, validateOnBlur, showWarnings, showSuggestions, onValidationChange, validationState.touched, validationState.dirty])

  // Handle value change
  const handleChange = useCallback((newValue: any) => {
    setValue(newValue)
    
    setValidationState(prev => ({
      ...prev,
      dirty: true
    }))

    if (validateOnChange) {
      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // Set new debounce
      debounceRef.current = setTimeout(() => {
        validateField(newValue)
      }, debounceMs)
    }
  }, [validateOnChange, debounceMs, validateField])

  // Handle blur event
  const handleBlur = useCallback(() => {
    setValidationState(prev => ({
      ...prev,
      touched: true
    }))

    if (validateOnBlur) {
      // Clear debounce and validate immediately
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      validateField(value)
    }
  }, [validateOnBlur, validateField, value])

  // Handle focus event
  const handleFocus = useCallback(() => {
    // Clear errors on focus if desired
    // setValidationState(prev => ({ ...prev, errors: [] }))
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Manual validation trigger
  const validate = useCallback(() => {
    return validateField(value)
  }, [validateField, value])

  // Reset validation state
  const reset = useCallback(() => {
    setValue(initialValue)
    setValidationState({
      isValid: true,
      isValidating: false,
      errors: [],
      warnings: [],
      suggestions: [],
      touched: false,
      dirty: false
    })
  }, [initialValue])

  return {
    value,
    setValue: handleChange,
    validationState,
    handlers: {
      onChange: handleChange,
      onBlur: handleBlur,
      onFocus: handleFocus
    },
    validate,
    reset
  }
}

/**
 * Real-time validation hook for entire forms
 */
export function useFormValidation<T>(
  schema: z.ZodSchema<T>,
  initialValues: Partial<T> = {},
  options: Omit<UseRealTimeValidationOptions, 'schema'> = {}
) {
  const [values, setValues] = useState<Partial<T>>(initialValues)
  const [validationState, setValidationState] = useState<FormValidationState>({
    isValid: true,
    isValidating: false,
    errors: {},
    warnings: {},
    suggestions: {},
    touchedFields: new Set(),
    dirtyFields: new Set()
  })

  const debounceRef = useRef<NodeJS.Timeout>()
  const validationRef = useRef<Promise<ValidationResult> | null>(null)

  const {
    debounceMs = 300,
    validateOnChange = true,
    validateOnBlur = true,
    showWarnings = true,
    showSuggestions = true,
    onValidationChange
  } = options

  // Validate entire form
  const validateForm = useCallback(async (formValues: Partial<T>) => {
    setValidationState(prev => ({ ...prev, isValidating: true }))

    try {
      const validationPromise = enhancedValidation.validate(schema, formValues, {
        sanitize: true,
        strict: false
      })

      validationRef.current = validationPromise
      const result = await validationPromise

      // Only update if this is still the latest validation
      if (validationRef.current === validationPromise) {
        const errors: Record<string, string[]> = {}
        const warnings: Record<string, string[]> = {}
        const suggestions: Record<string, string[]> = {}

        // Group errors by field
        result.errors?.forEach(error => {
          if (!errors[error.field]) errors[error.field] = []
          errors[error.field].push(error.message)
        })

        // Group warnings by field
        result.warnings?.forEach(warning => {
          if (!warnings[warning.field]) warnings[warning.field] = []
          warnings[warning.field].push(warning.message)

          if (warning.suggestion) {
            if (!suggestions[warning.field]) suggestions[warning.field] = []
            suggestions[warning.field].push(warning.suggestion)
          }
        })

        const newState: FormValidationState = {
          isValid: result.success,
          isValidating: false,
          errors,
          warnings: showWarnings ? warnings : {},
          suggestions: showSuggestions ? suggestions : {},
          touchedFields: validationState.touchedFields,
          dirtyFields: validationState.dirtyFields
        }

        setValidationState(newState)

        if (onValidationChange) {
          onValidationChange(result.success, result.errors || [])
        }
      }
    } catch (error) {
      console.error('Form validation error:', error)
      setValidationState(prev => ({
        ...prev,
        isValidating: false,
        isValid: false,
        errors: { form: ['Validation error occurred'] }
      }))
    }
  }, [schema, showWarnings, showSuggestions, onValidationChange, validationState.touchedFields, validationState.dirtyFields])

  // Handle field value change
  const setFieldValue = useCallback((fieldName: keyof T, value: any) => {
    const newValues = { ...values, [fieldName]: value }
    setValues(newValues)

    setValidationState(prev => ({
      ...prev,
      dirtyFields: new Set([...prev.dirtyFields, fieldName as string])
    }))

    if (validateOnChange) {
      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // Set new debounce
      debounceRef.current = setTimeout(() => {
        validateForm(newValues)
      }, debounceMs)
    }
  }, [values, validateOnChange, debounceMs, validateForm])

  // Handle field blur
  const setFieldTouched = useCallback((fieldName: keyof T) => {
    setValidationState(prev => ({
      ...prev,
      touchedFields: new Set([...prev.touchedFields, fieldName as string])
    }))

    if (validateOnBlur) {
      // Clear debounce and validate immediately
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      validateForm(values)
    }
  }, [validateOnBlur, validateForm, values])

  // Get field validation state
  const getFieldState = useCallback((fieldName: keyof T) => {
    const fieldNameStr = fieldName as string
    return {
      isValid: !validationState.errors[fieldNameStr]?.length,
      errors: validationState.errors[fieldNameStr] || [],
      warnings: validationState.warnings[fieldNameStr] || [],
      suggestions: validationState.suggestions[fieldNameStr] || [],
      touched: validationState.touchedFields.has(fieldNameStr),
      dirty: validationState.dirtyFields.has(fieldNameStr)
    }
  }, [validationState])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // Manual validation trigger
  const validate = useCallback(() => {
    return validateForm(values)
  }, [validateForm, values])

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues)
    setValidationState({
      isValid: true,
      isValidating: false,
      errors: {},
      warnings: {},
      suggestions: {},
      touchedFields: new Set(),
      dirtyFields: new Set()
    })
  }, [initialValues])

  // Submit handler with validation
  const handleSubmit = useCallback(async (onSubmit: (values: T) => void | Promise<void>) => {
    // Validate all fields
    await validateForm(values)

    // Mark all fields as touched
    const allFields = Object.keys(values) as (keyof T)[]
    setValidationState(prev => ({
      ...prev,
      touchedFields: new Set(allFields.map(f => f as string))
    }))

    // Only submit if valid
    if (validationState.isValid) {
      await onSubmit(values as T)
    }
  }, [validateForm, values, validationState.isValid])

  return {
    values,
    setValues,
    setFieldValue,
    setFieldTouched,
    validationState,
    getFieldState,
    validate,
    reset,
    handleSubmit
  }
}
