import { cn } from '@/lib/utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      const result = cn('px-2 py-1', 'text-sm')
      expect(result).toBe('px-2 py-1 text-sm')
    })

    it('handles conditional classes', () => {
      const isActive = true
      const isDisabled = false

      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      )

      expect(result).toBe('base-class active-class')
    })

    it('handles Tailwind class conflicts correctly', () => {
      // Should keep the last conflicting class
      const result = cn('px-2 px-4')
      expect(result).toBe('px-4')
    })

    it('handles complex Tailwind conflicts', () => {
      const result = cn(
        'px-2 py-1 bg-red-500',
        'px-4 bg-blue-500'
      )
      expect(result).toBe('py-1 px-4 bg-blue-500')
    })

    it('handles undefined and null values', () => {
      const result = cn('base-class', undefined, null, 'other-class')
      expect(result).toBe('base-class other-class')
    })

    it('handles empty strings', () => {
      const result = cn('base-class', '', 'other-class')
      expect(result).toBe('base-class other-class')
    })

    it('handles arrays of classes', () => {
      const result = cn(['px-2', 'py-1'], 'text-sm')
      expect(result).toBe('px-2 py-1 text-sm')
    })

    it('handles objects with boolean values', () => {
      const result = cn({
        'base-class': true,
        'active-class': true,
        'disabled-class': false,
      })
      expect(result).toBe('base-class active-class')
    })

    it('handles mixed input types', () => {
      const result = cn(
        'base-class',
        ['array-class-1', 'array-class-2'],
        {
          'object-class-1': true,
          'object-class-2': false,
        },
        'string-class'
      )
      expect(result).toBe('base-class array-class-1 array-class-2 object-class-1 string-class')
    })

    it('handles responsive classes correctly', () => {
      const result = cn(
        'text-sm md:text-base lg:text-lg',
        'text-xs md:text-sm'
      )
      // Should merge responsive classes correctly
      expect(result).toContain('text-xs')
      expect(result).toContain('md:text-sm')
      expect(result).toContain('lg:text-lg')
    })

    it('handles hover and focus states', () => {
      const result = cn(
        'bg-blue-500 hover:bg-blue-600',
        'hover:bg-blue-700 focus:bg-blue-800'
      )
      expect(result).toContain('bg-blue-500')
      expect(result).toContain('hover:bg-blue-700')
      expect(result).toContain('focus:bg-blue-800')
    })

    it('handles dark mode classes', () => {
      const result = cn(
        'bg-white text-black',
        'dark:bg-black dark:text-white'
      )
      expect(result).toBe('bg-white text-black dark:bg-black dark:text-white')
    })

    it('handles variant-based classes', () => {
      const variant = 'primary'
      const size = 'lg'

      const result = cn(
        'base-button',
        {
          'bg-blue-500 text-white': variant === 'primary',
          'bg-gray-500 text-white': variant === 'secondary',
        },
        {
          'px-4 py-2 text-sm': size === 'sm',
          'px-6 py-3 text-base': size === 'md',
          'px-8 py-4 text-lg': size === 'lg',
        }
      )

      expect(result).toBe('base-button bg-blue-500 text-white px-8 py-4 text-lg')
    })

    it('handles component composition classes', () => {
      const buttonClasses = 'inline-flex items-center justify-center rounded-md'
      const variantClasses = 'bg-primary text-primary-foreground hover:bg-primary/90'
      const sizeClasses = 'h-10 px-4 py-2'
      const customClasses = 'font-medium transition-colors'

      const result = cn(buttonClasses, variantClasses, sizeClasses, customClasses)

      expect(result).toContain('inline-flex')
      expect(result).toContain('bg-primary')
      expect(result).toContain('h-10')
      expect(result).toContain('font-medium')
    })

    it('handles no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('handles single argument', () => {
      const result = cn('single-class')
      expect(result).toBe('single-class')
    })

    it('handles whitespace correctly', () => {
      const result = cn('  class-with-spaces  ', 'another-class')
      expect(result).toBe('class-with-spaces another-class')
    })

    it('handles duplicate classes', () => {
      const result = cn('duplicate-class', 'other-class', 'duplicate-class')
      // The cn function should handle duplicates - exact behavior depends on implementation
      expect(result).toContain('duplicate-class')
      expect(result).toContain('other-class')
    })

    it('performance test with many classes', () => {
      const manyClasses = Array.from({ length: 100 }, (_, i) => `class-${i}`)
      const start = performance.now()
      const result = cn(...manyClasses)
      const end = performance.now()

      expect(result).toContain('class-0')
      expect(result).toContain('class-99')
      expect(end - start).toBeLessThan(10) // Should be fast
    })
  })
})
