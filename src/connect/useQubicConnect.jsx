import { useContext } from 'react';
import { QubicConnectContext } from './QubicConnectContext';

export function useQubicConnect() {
  const context = useContext(QubicConnectContext);
  if (context === undefined) {
    throw new Error(
      'useQubicConnect must be used within a QubicConnectProvider'
    );
  }
  return context;
}
