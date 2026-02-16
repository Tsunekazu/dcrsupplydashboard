import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchDecredData, type DecredData } from '../api/dcrdata';

const POLL_INTERVAL = 30_000; // 30 seconds

export function useDecredData() {
  const [data, setData] = useState<DecredData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const prevBlockHeight = useRef<number>(0);
  const [newBlock, setNewBlock] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchDecredData();
      setData(prev => {
        if (prev && result.blockHeight > prev.blockHeight) {
          setNewBlock(true);
          setTimeout(() => setNewBlock(false), 3000);
        }
        return result;
      });
      prevBlockHeight.current = result.blockHeight;
      setError(null);
    } catch (e) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  return { data, loading, error, refresh, newBlock };
}
