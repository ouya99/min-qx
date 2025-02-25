/* global BigInt */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useConfig } from '../contexts/ConfigContext';

const QubicConnectContext = createContext();

export function QubicConnectProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const { httpEndpoint } = useConfig();

  useEffect(() => {
    const wallet = localStorage.getItem('wallet');
    if (wallet) {
      setWallet(wallet);
      setConnected(true);
    }
  }, []);

  const connect = (wallet) => {
    localStorage.setItem('wallet', wallet);
    setWallet(wallet);
    setConnected(true);
  };

  const disconnect = () => {
    localStorage.removeItem('wallet');
    setWallet(null);
    setConnected(false);
  };

  const toggleConnectModal = () => {
    setShowConnectModal(!showConnectModal);
  };

  const getTick = async () => {
    const tickResult = await fetch(`${httpEndpoint}/v1/tick-info`);
    const tick = await tickResult.json();
    // check if tick is valid
    if (!tick || !tick.tickInfo || !tick.tickInfo.tick) {
      console.warn('getTick: Invalid tick');
      return 0;
    }
    return tick.tickInfo.tick;
  };

  return (
    <QubicConnectContext.Provider
      value={{
        connected,
        wallet,
        showConnectModal,
        connect,
        disconnect,
        toggleConnectModal,
        getTick,
      }}
    >
      {children}
    </QubicConnectContext.Provider>
  );
}

export function useQubicConnect() {
  const context = useContext(QubicConnectContext);
  if (context === undefined) {
    throw new Error(
      'useQubicConnect must be used within a QubicConnectProvider'
    );
  }
  return context;
}
