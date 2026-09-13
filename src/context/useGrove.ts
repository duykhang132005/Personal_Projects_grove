import { useContext } from 'react';
import { GroveContext, type GroveContextValue } from './grove-context';

export function useGrove(): GroveContextValue {
  const ctx = useContext(GroveContext);
  if (!ctx) throw new Error('useGrove must be used within GroveProvider');
  return ctx;
}
