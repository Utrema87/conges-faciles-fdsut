import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useToast } from '@/hooks/use-toast'

// Mock timers
vi.useFakeTimers()

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllTimers()
  })

  it('should add a toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'This is a test toast',
      })
    })

    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].title).toBe('Test Toast')
    expect(result.current.toasts[0].description).toBe('This is a test toast')
  })

  it('should dismiss a toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      const { id } = result.current.toast({
        title: 'Test Toast',
      })
      
      result.current.dismiss(id)
    })

    expect(result.current.toasts[0].open).toBe(false)
  })

  it('should update a toast', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      const { id, update } = result.current.toast({
        title: 'Original Title',
      })
      
      update({
        id,
        title: 'Updated Title',
      })
    })

    expect(result.current.toasts[0].title).toBe('Updated Title')
  })

  it('should auto-remove toast after timeout', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.toast({
        title: 'Test Toast',
        duration: 1000,
      })
    })

    expect(result.current.toasts).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    act(() => {
      vi.advanceTimersByTime(1000) // Additional time for removal queue
    })

    expect(result.current.toasts).toHaveLength(0)
  })
})