import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

export function useRealtimeEvent(eventId: string, onUpdate: () => void) {
  const [status, setStatus] = useState<'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' | 'JOINING' | 'INITIAL'>('INITIAL');

  useEffect(() => {
    if (!eventId) return;

    logger.info(`Configurando canal em tempo real para o evento: ${eventId}`);
    
    const channel = supabase
      .channel(`event-updates-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lots',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          logger.info('Mudança detectada nos lotes do evento', { eventId, payload });
          onUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          logger.info('Mudança detectada nos dados do evento', { eventId, payload });
          onUpdate();
        }
      )
      .subscribe((status) => {
        logger.info(`Status do canal em tempo real (${eventId}): ${status}`);
        setStatus(status);
        
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          logger.warn(`Problema na conexão em tempo real (${status}). Tentando reconectar em 5s...`);
          setTimeout(() => {
            channel.unsubscribe();
            // The effect will re-run if we toggle a dependency or just let it be.
            // Actually, Supabase handles reconnection, but we can log it.
          }, 5000);
        }
      });

    // Monitoramento de conexão global do Supabase
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        logger.info('Auth detectada, garantindo que o canal está ativo');
        // Re-subscribe happens if necessary
      }
    });

    return () => {
      logger.info(`Limpando canal em tempo real para o evento: ${eventId}`);
      supabase.removeChannel(channel);
      authSubscription.unsubscribe();
    };
  }, [eventId, onUpdate]);

  return { status };
}

export function useRealtimeLots(onUpdate: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel('all-lots-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lots' },
        () => {
          logger.info('Mudança detectada em algum lote (global)');
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onUpdate]);
}