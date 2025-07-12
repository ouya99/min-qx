/* global BigInt */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { useConfig } from './ConfigContext';
import { useQubicConnect } from '../connect/QubicConnectContext';
import { RUBIC_IP } from '../api/native/rubic-config';
import { rubic } from '../api/native/rubic';

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  const [balance, setBalance] = useState(null);
  const [walletPublicIdentity, setWalletPublicIdentity] = useState('');
  const { httpEndpoint } = useConfig();
  const { wallet } = useQubicConnect();

  const getBalance = async (publicId) => {
    if (httpEndpoint === RUBIC_IP) {
      const data = await rubic(`balance/${publicId}`);
      console.log('rubic-balance', data, publicId);
    } else
      try {
        const response = await fetch(
          `${httpEndpoint}/v1/balances/${publicId}`,
          {
            headers: {
              accept: 'application/json',
            },
          }
        );
        const data = await response.json();
        setBalance(data.balance.balance);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
  };

  const getAssetBalance = async (publicId) => {
    if (httpEndpoint === RUBIC_IP) {
      const data = await rubic(`asset/balance/${publicId}`);
      console.log('rubic-asset-balance', data, publicId);
    } else
      try {
        const response = await fetch(
          `${httpEndpoint}/v1/balances/${publicId}`,
          {
            headers: {
              accept: 'application/json',
            },
          }
        );
        const data = await response.json();
        setBalance(data.balance.balance);
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
  };

  const getTick = async () => {
    if (httpEndpoint === RUBIC_IP) {
      const data = await rubic(`tick`);
      console.log('rubic-tick', data);
    }
  };

  const peersLimit = async () => {
    if (httpEndpoint === RUBIC_IP) {
      const data = await rubic(`peers/limit`);
      console.log('rubic-peers-limit', data);
    }
  };

  const walletIsEncrypted = async () => {
    if (httpEndpoint === RUBIC_IP) {
      const data = await rubic(`wallet/is_encrypted`);
      console.log('rubic-encrypted', data);
    }
  };

  const assetsIssued = async () => {
    if (httpEndpoint === RUBIC_IP) {
      const data = await rubic(`asset/issued`);
      console.log('rubic-asset/issued', data);
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
    <ApiContext.Provider
      value={{
        walletPublicIdentity,
        balance,
        getTick,
        getBalance,
        walletIsEncrypted,
        assetsIssued,
        peersLimit,
        getAssetBalance,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

export const useApiContext = () => useContext(ApiContext);
