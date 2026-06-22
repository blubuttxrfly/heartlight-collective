import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncWish } from '../lib/exchangeSync';

/**
 * Wave 8.3 — one-time backfill of locally-stored wishes to Supabase.
 * Runs once on app boot. Non-blocking. Never deletes local wishes.
 */
export function BackfillWishes() {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    async function backfill() {
      const alreadyBacked = localStorage.getItem('hlw_wishes_backfilled') === '1';
      if (alreadyBacked) return;

      const localWishes: any[] = JSON.parse(localStorage.getItem('hlw_wishes') || '[]');
      if (localWishes.length === 0) {
        localStorage.setItem('hlw_wishes_backfilled', '1');
        return;
      }

      try {
        const { data: remoteRows } = await supabase.from('wishes').select('id');
        const remoteIds = new Set((remoteRows || []).map((r: any) => r.id));

        for (const wish of localWishes) {
          if (remoteIds.has(wish.id)) continue;
          const result = await syncWish(wish);
          if (!result.success) {
            console.warn('[BackfillWishes] wish sync failed:', wish.id, result.error);
          }
        }

        localStorage.setItem('hlw_wishes_backfilled', '1');
      } catch (err) {
        console.error('[BackfillWishes] backfill aborted:', err);
      }
    }

    backfill();
  }, []);

  return null;
}
