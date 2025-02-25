/* global BigInt */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { useConfig } from './ConfigContext';
import { useQubicConnect } from '../connect/QubicConnectContext';

const QxContext = createContext();

export const QxProvider = ({ children }) => {
  const [balance, setBalance] = useState(null);
  const [walletPublicIdentity, setWalletPublicIdentity] = useState('');
  const { httpEndpoint } = useConfig();
  const { wallet } = useQubicConnect();

  const fetchBalance = async (publicId) => {
    try {
      const response = await fetch(`${httpEndpoint}/v1/balances/${publicId}`, {
        headers: {
          accept: 'application/json',
        },
      });
      const data = await response.json();
      setBalance(data.balance.balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  useEffect(() => {
    const getIdentityAndBalance = async () => {
      const qHelper = new QubicHelper();
      if (wallet) {
        const idPackage = await qHelper.createIdPackage(wallet);
        const sourcePublicKey = idPackage.publicKey;
        const identity = await qHelper.getIdentity(sourcePublicKey);
        if (identity) {
          setWalletPublicIdentity(identity);
          fetchBalance(identity);
        }
      }
    };

    getIdentityAndBalance();

    return () => {};
  }, [wallet]);

  // // Refresh balance every 5 minutes
  // useEffect(() => {
  //   let intervalId;
  //   if (walletPublicIdentity) {
  //     intervalId = setInterval(() => {
  //       fetchBalance(walletPublicIdentity);
  //     }, 300000); // 5 minutes in milliseconds
  //   }
  //   return () => clearInterval(intervalId);
  // }, [walletPublicIdentity]);

  return (
    <QxContext.Provider
      value={{
        walletPublicIdentity,
        balance,
        fetchBalance,
      }}
    >
      {children}
    </QxContext.Provider>
  );
};

export const useQxContext = () => useContext(QxContext);
