 import { renderHook, act } from '@testing-library/react';
 import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
 import { useRealtimeFallback } from './useRealtimeFallback';
 
 // Mock logger to avoid console spam
 vi.mock('@/utils/logger', () => ({
   logger: {
     info: vi.fn(),
     warn: vi.fn(),
     error: vi.fn(),
   },
 }));
 
 describe('useRealtimeFallback', () => {
   beforeEach(() => {
     vi.useFakeTimers();
   });
 
   afterEach(() => {
     vi.restoreAllMocks();
     vi.useRealTimers();
   });
 
   it('should start polling when not SUBSCRIBED', () => {
     const onUpdate = vi.fn();
     const { result } = renderHook(() => 
       useRealtimeFallback({
         status: 'INITIAL',
         onUpdate,
         label: 'Test',
         initialPollInterval: 1000,
         enabled: true
       })
     );
 
     expect(result.current.isPolling).toBe(true);
     
     // Fast-forward to the first poll
     act(() => {
       vi.advanceTimersByTime(1100);
     });
 
     expect(onUpdate).toHaveBeenCalledTimes(1);
   });
 
   it('should NOT poll when SUBSCRIBED', () => {
     const onUpdate = vi.fn();
     const { result } = renderHook(() => 
       useRealtimeFallback({
         status: 'SUBSCRIBED',
         onUpdate,
         label: 'Test',
         initialPollInterval: 1000,
         enabled: true
       })
     );
 
     expect(result.current.isPolling).toBe(false);
     
     act(() => {
       vi.advanceTimersByTime(2000);
     });
 
     expect(onUpdate).not.toHaveBeenCalled();
   });
 
   it('should implement exponential backoff', () => {
     const onUpdate = vi.fn();
     const { result } = renderHook(() => 
       useRealtimeFallback({
         status: 'CHANNEL_ERROR',
         onUpdate,
         label: 'Test',
         pollInterval: 1000,
         backoffFactor: 2,
         enabled: true
       })
     );
 
     // First poll at ~1000ms
     act(() => {
       vi.advanceTimersByTime(1100);
     });
     expect(onUpdate).toHaveBeenCalledTimes(1);
 
     // Next poll should be at ~2000ms (1000 * 2^1)
     act(() => {
       vi.advanceTimersByTime(2100);
     });
     expect(onUpdate).toHaveBeenCalledTimes(2);
 
     // Next poll should be at ~4000ms (1000 * 2^2)
     act(() => {
       vi.advanceTimersByTime(4100);
     });
     expect(onUpdate).toHaveBeenCalledTimes(3);
   });
 
   it('should reset lastUpdateTime on manual update', () => {
     const { result } = renderHook(() => 
       useRealtimeFallback({
         status: 'SUBSCRIBED',
         onUpdate: () => {},
         label: 'Test'
       })
     );
 
     const firstUpdate = result.current.lastUpdate;
     
     act(() => {
       vi.advanceTimersByTime(1000);
       result.current.onManualUpdate();
     });
 
     expect(result.current.lastUpdate).toBeGreaterThan(firstUpdate);
     expect(result.current.delaySeconds).toBe(0);
   });
 });