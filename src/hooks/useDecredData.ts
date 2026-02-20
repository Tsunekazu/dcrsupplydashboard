import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDecredData, type DecredData } from '../api/dcrdata';

const POLL_INTERVAL = 30_000; // 30 seconds

export function useDecredData() {
  const [data, setData] = useState<DecredData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevBlockHeight = useRef<number | null>(null);
  const newBlockTimer = useRef<number | null>(null);
  const [newBlock, setNewBlock] = useState(false);

  const triggerNewBlock = useCallback(() => {
    setNewBlock(true);
    if (newBlockTimer.current) {
      window.clearTimeout(newBlockTimer.current);
    }
    newBlockTimer.current = window.setTimeout(() => {
      setNewBlock(false);
      newBlockTimer.current = null;
    }, 3000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchDecredData();
      const hasPrevious = prevBlockHeight.current !== null;
      const hasNewBlock = hasPrevious && result.blockHeight > (prevBlockHeight.current ?? 0);

      prevBlockHeight.current = result.blockHeight;
      setData(result);
      if (hasNewBlock) {
        triggerNewBlock();
      }
      setError(null);
    } catch {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [triggerNewBlock]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  useEffect(() => {
    return () => {
      if (newBlockTimer.current) {
        window.clearTimeout(newBlockTimer.current);
      }
    };
  }, []);

  return { data, loading, error, refresh, newBlock };
}
