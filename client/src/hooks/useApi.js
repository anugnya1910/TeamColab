import { useCallback, useEffect, useRef, useState } from 'react';
import api, { errMsg } from '../api/axios';

export const DATA_EVENT = 'teamsync:data-changed';

// Any component can call this after a mutation; every useApi hook on screen refetches silently.
export const emitDataChanged = () => window.dispatchEvent(new Event(DATA_EVENT));

export function useApi(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState(null);
  const loaded = useRef(false);

  const load = useCallback(
    async (silent = false) => {
      if (!url) return;
      if (!silent && !loaded.current) setLoading(true);
      try {
        const res = await api.get(url);
        setData(res.data);
        setError(null);
        loaded.current = true;
      } catch (e) {
        setError(errMsg(e));
      } finally {
        setLoading(false);
      }
    },
    [url]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = () => load(true);
    window.addEventListener(DATA_EVENT, handler);
    return () => window.removeEventListener(DATA_EVENT, handler);
  }, [load]);

  return { data, setData, loading, error, reload: load };
}

export function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler(e);
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
