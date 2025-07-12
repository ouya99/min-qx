/* global BigInt */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper';
import { useConfig } from './ConfigContext';
import { useQubicConnect } from '../connect/QubicConnectContext';
import { RUBIC_IP } from '../api/native/rubic-config';
import { rubic } from '../api/native/rubic';
import { ISSUER } from './utils';

const ApiContext = createContext();

export const ApiProvider = ({ children }) => {
  const [balance, setBalance] = useState(null);
  const [walletPublicIdentity, setWalletPublicIdentity] = useState('');
  const { httpEndpoint } = useConfig();
  const { wallet } = useQubicConnect();

  const getBalance = async (publicId) => {
    if (httpEndpoint === RUBIC_IP) {
      const balance = await rubic(`balance/${publicId}`);
      console.log('rubic-balance', balance, publicId);
      return balance.data;
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
      const assetBalance = await rubic(`asset/balance/${publicId}`);
      console.log('rubic-asset-balance', assetBalance, publicId);
      return assetBalance.data;
    } else
      try {
        const response = await fetch(
          `${BASE_URL}/v1/assets/${ID || id}/owned`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          }
        );
        const data = await response.json();
        return data['ownedAssets'];
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
  };

  const getQxOrders = async (assetName, type) => {
    if (httpEndpoint === RUBIC_IP) {
      const orders = await rubic(`qx/orderbook/${assetName}/${type}/1000/0`); // limit = 1000 , offset = 0
      const renamedOrders = orders.data.map(
        ({ num_shares, entity, ...rest }) => ({
          numberOfShares: num_shares,
          entityId: entity,
          ...rest,
        })
      );
      console.log('QX', renamedOrders);
      return type === 'ASK' ? renamedOrders.reverse() : renamedOrders;
    } else
      try {
        const response = await fetch(
          `${api}/v1/qx/getAsset${type}Orders?assetName=${assetName}&issuerId=${ISSUER.get(
            assetName
          )}&offset=${0}`,
          { method: 'GET' }
        );
        const data = await response.json();
        return type === 'ASK' ? data['orders'].reverse() : data['orders'];
      } catch (error) {
        console.error('Error fetching balance:', error);
      }
  };

  const getTick = async () => {
    if (httpEndpoint === RUBIC_IP) {
      const tick = await rubic(`tick`);
      return tick.data;
    } else {
      const response = await fetch(`${httpEndpoint}/v1/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const data = await response.json();
      return data['lastProcessedTick']['tickNumber'];
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
          getBalance(identity);
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
        getQxOrders,
      }}
    >
      {children}
    </ApiContext.Provider>
  );
};

export const useApiContext = () => useContext(ApiContext);
