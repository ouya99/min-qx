import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Divider,
  InputAdornment,
  IconButton,
  LinearProgress,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Paper,
  ThemeProvider,
  createTheme,
  CssBaseline,
  CircularProgress,
  Checkbox,
  Link,
  Autocomplete,
  Stack,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import SendIcon from '@mui/icons-material/Send';

import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/Receipt';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CircleIcon from '@mui/icons-material/Circle';
import TokenIcon from '@mui/icons-material/Token';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SellIcon from '@mui/icons-material/Sell';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// QUBIC
import { QubicPackageBuilder } from '@qubic-lib/qubic-ts-library/dist/QubicPackageBuilder.js';
import { QubicPackageType } from '@qubic-lib/qubic-ts-library/dist/qubic-communication/QubicPackageType.js';
import { RequestResponseHeader } from '@qubic-lib/qubic-ts-library/dist/qubic-communication/RequestResponseHeader.js';
import { QubicTransferAssetPayload } from '@qubic-lib/qubic-ts-library/dist/qubic-types/transacion-payloads/QubicTransferAssetPayload.js';

import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper.js';
import { QubicTransferQXOrderPayload } from '@qubic-lib/qubic-ts-library/dist/qubic-types/transacion-payloads/QubicTransferQXOrderPayload.js';
import { QubicTransaction } from '@qubic-lib/qubic-ts-library/dist/qubic-types/QubicTransaction.js';
import { QubicDefinitions } from '@qubic-lib/qubic-ts-library/dist/QubicDefinitions.js';
import { PublicKey } from '@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey.js';
import { Long } from '@qubic-lib/qubic-ts-library/dist/qubic-types/Long.js';
import ConnectLink from './connect/ConnectLink';
import { useQubicConnect } from './connect/QubicConnectContext';
import { useQxContext } from './contexts/QxContext';
import { useConfig } from './contexts/ConfigContext';
const API_URL = 'https://api.qubic.org';
// const BASE_URL = 'https://rpc.qubic.org';

const TICK_OFFSET = 10;
const POLLING_INTERVAL = 2000;

const seedRegex = /^[A-Z]{60}$/;

const ISSUER = new Map([
  ['QX', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['QTRY', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['RANDOM', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['QUTIL', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['QPOOL', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['MLM', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['QVAULT', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['QEARN', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['QFT', 'TFUYVBXYIYBVTEMJHAJGEJOOZHJBQFVQLTBBKMEHPEVIZFXZRPEYFUWGTIWG'],
  ['CFB', 'CFBMEMZOIDEXQAUXYYSZIURADQLAPWPMNJXQSNVQZAHYVOPYUKKJBJUCTVJL'],
  ['QWALLET', 'QWALLETSGQVAGBHUCVVXWZXMBKQBPQQSHRYKZGEJWFVNUFCEDDPRMKTAUVHA'],
  ['QCAP', 'QCAPWMYRSHLBJHSTTZQVCIBARVOASKDENASAKNOBRGPFWWKRCUVUAXYEZVOG'],
  ['VSTB001', 'VALISTURNWYFQAMVLAKJVOKJQKKBXZZFEASEYCAGNCFMZARJEMMFSESEFOWM'],
  ['MSVAULT', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['QBAY', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['MATILDA', 'ZWQHZOEAWYKSGDPWWAQBAOKECCSASFCMLYZOJGBXNABXVZJZXKXOWRTFIQHC'],
  ['QXTRADE', 'QXTRMABNAJWNQBKYYNUNVYAJAQMDLIKOFXNGTRVYRDQMNZNNMZDGBDNGYMRM'],
  ['QXMR', 'QXMRTKAIIGLUREPIQPCMHCKWSIPDTUYFCFNYXQLTECSUJVYEMMDELBMDOEYB'],
  ['CODED', 'CODEDBUUDDYHECBVSUONSSWTOJRCLZSWHFHZIUWVFGNWVCKIWJCSDSWGQAAI'],
]);

const getTheme = (mode) =>
  createTheme({
    palette: {
      mode,
      ...(mode === 'dark' && {
        background: {
          default: '#121928',
          paper: '#1a2235',
        },
      }),
      ...(mode === 'light' && {
        background: {
          default: '#cccccc',
          paper: '#999999',
        },
      }),
    },
    typography: {
      fontFamily: 'Exo, sans-serif',
      h6: {
        fontSize: '1.1rem',
        fontWeight: 600,
      },
      body1: {
        fontSize: '0.95rem',
      },
      button: {
        textTransform: 'none',
        fontSize: '0.9rem',
      },
    },
    components: {
      MuiTableCell: {
        styleOverrides: {
          root: {
            fontSize: '0.9rem',
          },
        },
      },
    },
  });

const MainView = () => {
  const [balance, setBalance] = useState(0);
  const [assets, setAssets] = useState(new Map());
  const [amount, setAmount] = useState(0);
  const [transferToken, setTransferToken] = useState(0);
  const [price, setPrice] = useState(0);
  const [latestTick, setLatestTick] = useState(0);
  const [log, setLog] = useState('');
  const [orderTick, setOrderTick] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [askOrders, setAskOrders] = useState([]);
  const [bidOrders, setBidOrders] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [themeMode, setThemeMode] = useState('dark');
  const [entitiesView, setEntitiesView] = useState(false);
  const [tradeFee, setTradeFee] = useState(0);
  const [error, setError] = useState('');
  const [errorSending, setErrorSending] = useState('');
  const [txLink, setTxLink] = useState('');
  const [txSuccess, setTxSuccess] = useState(false);
  const [receiverError, setReceiverError] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [waitDoubleClick, setWaitDoubleclick] = useState(false);
  const [waitDoubleClickAsset, setWaitDoubleClickAsset] = useState(false);
  const {
    wallet: seed,
    connected,
    showConnectModal,
    toggleConnectModal,
  } = useQubicConnect();
  const { walletPublicIdentity: id } = useQxContext();
  const { httpEndpoint: BASE_URL } = useConfig();

  const theme = useMemo(() => getTheme(themeMode), [themeMode]);
  const tabLabels = useMemo(() => [...ISSUER.keys()], []);

  // Load the list of strings from localStorage or initialize an empty array
  const loadLocalStorageData = () => {
    const savedList = JSON.parse(localStorage.getItem('autocompleteList'));
    return savedList ? savedList : [];
  };
  const [options, setOptions] = useState(loadLocalStorageData());
  // Update localStorage whenever the options change
  useEffect(() => {
    localStorage.setItem('autocompleteList', JSON.stringify(options));
  }, [options]);

  const handleAddOption = () => {
    if (receiverAddress && !options.includes(receiverAddress)) {
      const newOptions = [...options, receiverAddress];
      setOptions(newOptions);
      setReceiverAddress('');
    }
  };

  const valueOfAssetName = useCallback((asset) => {
    const bytes = new Uint8Array(8);
    bytes.set(new TextEncoder().encode(asset));
    return new DataView(bytes.buffer).getBigInt64(0, true);
  }, []);

  const fetchAssetOrders = useCallback(
    async (assetName, issuerID, type, offset) => {
      return await fetch(
        `${API_URL}/v1/qx/getAsset${type}Orders?assetName=${assetName}&issuerId=${issuerID}&offset=${offset}`,
        { method: 'GET' }
      );
    },
    []
  );

  const createQXOrderPayload = useCallback(
    (issuer, assetName, price, numberOfShares) => {
      return new QubicTransferQXOrderPayload({
        issuer: new PublicKey(issuer),
        assetName: new Long(valueOfAssetName(assetName)),
        price: new Long(price),
        numberOfShares: new Long(numberOfShares),
      });
    },
    [valueOfAssetName]
  );

  const createQXOrderTransaction = useCallback(
    async (senderId, senderSeed, targetTick, payload, actionType) => {
      const transaction = new QubicTransaction()
        .setSourcePublicKey(new PublicKey(senderId))
        .setDestinationPublicKey(QubicDefinitions.QX_ADDRESS)
        .setTick(targetTick)
        .setInputSize(payload.getPackageSize())
        .setAmount(new Long(0))
        .setInputType(actionType)
        .setPayload(payload);

      switch (actionType) {
        case QubicDefinitions.QX_ADD_BID_ORDER:
          transaction.setAmount(new Long(payload.getTotalAmount()));
          break;
        case QubicDefinitions.QX_ADD_ASK_ORDER:
        case QubicDefinitions.QX_REMOVE_BID_ORDER:
        case QubicDefinitions.QX_REMOVE_ASK_ORDER:
          transaction.setAmount(new Long(0));
          break;
      }

      await transaction.build(senderSeed);
      return transaction;
    },
    []
  );

  const broadcastTransaction = useCallback(async (transaction) => {
    const encodedTransaction = transaction.encodeTransactionToBase64(
      transaction.getPackageData()
    );
    return await fetch(`${BASE_URL}/v1/broadcast-transaction`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ encodedTransaction }),
    });
  }, []);

  const qBalance = useCallback(
    async (ID) => {
      const response = await fetch(`${BASE_URL}/v1/balances/${ID || id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const data = await response.json();
      return data['balance'];
    },
    [id]
  );

  const qXFees = useCallback(async () => {
    const response = await fetch(`${API_URL}/v1/qx/getFees`, {
      method: 'GET',
    });
    const data = await response.json();
    return data;
  }, []);

  const qFetchAssetOrders = useCallback(
    async (assetName, type) => {
      const response = await fetchAssetOrders(
        assetName,
        ISSUER.get(assetName),
        type,
        0
      );
      const data = await response.json();
      return type === 'Ask' ? data['orders'].reverse() : data['orders'];
    },
    [fetchAssetOrders]
  );

  const qFetchLatestTick = useCallback(async () => {
    const response = await fetch(`${BASE_URL}/v1/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    const data = await response.json();
    return data['lastProcessedTick']['tickNumber'];
  }, []);

  const qTransactionStatus = useCallback(async (tx) => {
    const response = await fetch(`${BASE_URL}/v2/transactions/${tx}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    const data = await response.json();
    return data;
  }, []);

  const qOwnedAssets = useCallback(
    async (ID) => {
      const response = await fetch(`${BASE_URL}/v1/assets/${ID || id}/owned`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const data = await response.json();
      return data['ownedAssets'];
    },
    [id]
  );

  const qTransferAsset = useCallback(
    async (assetName, destinationPublicKey, amount, availAmount) => {
      setErrorSending('');
      setTxSuccess(false);

      if (receiverError.length) {
        console.log('error receiver');
        return;
      }

      if (!destinationPublicKey.length) {
        console.log('empty receiver');
        setReceiverError('empty receiver');
        return;
      }

      if (!Number(amount)) {
        console.log('Amount must be greater than 0');
        setErrorSending('Amount must be greater than 0');
        return;
      }

      const latestTick = await qFetchLatestTick();
      // build and sign tx
      let tx = new QubicTransaction();
      const key = new PublicKey(id);
      if (assetName === 'QU') {
        tx = tx
          .setSourcePublicKey(key)
          .setDestinationPublicKey(destinationPublicKey) // a transfer should go the QX SC
          .setAmount(new Long(parseInt(amount)))
          .setTick(latestTick + TICK_OFFSET); // just a fake tick
      } else {
        console.log(Number(availAmount));
        if (
          isNaN(Number(availAmount)) ||
          Number(amount) > Number(availAmount)
        ) {
          console.log('Insufficient assets');
          setErrorSending('Insufficient assets');
          return;
        }
        const assetTransfer = new QubicTransferAssetPayload()
          .setIssuer(ISSUER.get(assetName))
          .setNewOwnerAndPossessor(destinationPublicKey)
          .setAssetName(assetName)
          .setNumberOfUnits(new Long(parseInt(amount)));
        tx = tx
          .setSourcePublicKey(key)
          .setDestinationPublicKey(QubicDefinitions.QX_ADDRESS) // a transfer should go the QX SC
          .setAmount(QubicDefinitions.QX_TRANSFER_ASSET_FEE)
          .setTick(latestTick + TICK_OFFSET) // just a fake tick
          .setInputType(QubicDefinitions.QX_TRANSFER_ASSET_INPUT_TYPE)
          .setPayload(assetTransfer);
      }

      setShowProgress(true);
      setOrderTick(latestTick + TICK_OFFSET);

      const txPackage = await tx.build(seed);
      console.log(txPackage);

      // Prepare the transaction for sending
      const header = new RequestResponseHeader(
        QubicPackageType.BROADCAST_TRANSACTION,
        tx.getPackageSize()
      );
      const builder = new QubicPackageBuilder(header.getSize());
      builder.add(header);
      builder.add(tx);
      //   const data = builder.getData();
      await broadcastTransaction(tx);
      setTxLink(`https://explorer.qubic.org/network/tx/${tx.id}?type=latest`);
      setLog(
        `${(latestTick + TICK_OFFSET)
          .toString()
          .replace(
            /\B(?=(\d{3})+(?!\d))/g,
            ','
          )}:  sending: ${amount} asset(s) of ${assetName} to ${destinationPublicKey}`
      );
      return 'OK';
    },
    [id, seed, amount, qFetchLatestTick]
  );

  const qOrder = useCallback(
    async (asset, type, rmPrice, rmAmount) => {
      setError('');
      setTxSuccess(false);

      if (
        (type === 'buy' || type === 'sell') &&
        (!Number(amount) || !Number(price))
      ) {
        console.log('Amount and price must be greater than 0');
        setError('Amount and price must be greater than 0');
        return;
      }

      if (
        type === 'buy' &&
        Number(price) * Number(amount) > Number(balance || 0)
      ) {
        console.log('Insufficient balance');
        setError('Insufficient balance');
        return;
      }

      if (
        type === 'sell' &&
        Number(amount) > Number(assets.get(tabLabels[tabIndex]) || 0)
      ) {
        console.log('Insufficient assets');
        setError('Insufficient assets');
        return;
      }
      setShowProgress(true);
      const latestTick = await qFetchLatestTick();
      setOrderTick(latestTick + TICK_OFFSET);

      const orderPayload = createQXOrderPayload(
        ISSUER.get(asset),
        asset,
        rmPrice || price,
        rmAmount || amount
      );

      const actionType = {
        buy: QubicDefinitions.QX_ADD_BID_ORDER,
        sell: QubicDefinitions.QX_ADD_ASK_ORDER,
        removeBuy: QubicDefinitions.QX_REMOVE_BID_ORDER,
        removeSell: QubicDefinitions.QX_REMOVE_ASK_ORDER,
      }[type];

      const transaction = await createQXOrderTransaction(
        id,
        seed,
        latestTick + TICK_OFFSET,
        orderPayload,
        actionType
      );

      await broadcastTransaction(transaction);
      setTxLink(
        `https://explorer.qubic.org/network/tx/${transaction.id}?type=latest`
      );
      setLog(
        `${(latestTick + TICK_OFFSET)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}:  ${type.toUpperCase()}: ${
          rmAmount || amount
        } asset(s) of ${asset} for ${
          rmPrice || price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        } qu per token`
      );
      return 'OK';
    },
    [
      id,
      seed,
      price,
      amount,
      createQXOrderPayload,
      createQXOrderTransaction,
      broadcastTransaction,
      qFetchLatestTick,
    ]
  );

  useEffect(() => {
    const fetchQXFees = async () => {
      const response = await qXFees();
      setTradeFee(response.tradeFee);
    };

    fetchQXFees().catch(console.error);
  }, []);

  const checkState = async (txId) => {
    const [txStatus] = await Promise.all([qTransactionStatus(txId)]);
    console.log(txStatus);
    // check if something with a transaction structure comes back from fetch
    if (txStatus?.transaction) {
      setTxSuccess(true);
    }
  };

  // Use effect to check the state every 3 seconds
  useEffect(() => {
    if (latestTick >= orderTick && latestTick < orderTick + 20) {
      checkState(txLink.slice(38, 98));
    }
  }, [latestTick, txLink]);

  // id changes, fetch all data!
  useEffect(() => {
    console.log('id changed', id);
    const fetchData = async () => {
      setBalance('loading ... ');
      const [balanceData, assetsData, tickData, askData, bidData] =
        await Promise.all([
          qBalance(id),
          qOwnedAssets(id),
          qFetchLatestTick(),
          qFetchAssetOrders(tabLabels[tabIndex], 'Ask'),
          qFetchAssetOrders(tabLabels[tabIndex], 'Bid'),
        ]);

      setBalance(balanceData?.balance || 'loading');

      setAssets(
        new Map(
          assetsData.map((el) => [
            el.data.issuedAsset.name,
            el.data.numberOfUnits,
          ])
        )
      );
      setLatestTick(tickData);
      setAskOrders(askData || []);
      setBidOrders(bidData || []);
    };

    fetchData().catch(console.error);
  }, [id, tabIndex]);

  useEffect(() => {
    if (!id) return;

    const intervalId = setInterval(async () => {
      const [balanceData, assetsData, tick] = await Promise.all([
        qBalance(),
        qOwnedAssets(),
        qFetchLatestTick(),
      ]);

      setBalance(balanceData.balance);
      setAssets(
        new Map(
          assetsData.map((el) => [
            el.data.issuedAsset.name,
            el.data.numberOfUnits,
          ])
        )
      );
      setLatestTick(tick);

      if (showProgress && tick >= orderTick) {
        const [askData, bidData] = await Promise.all([
          qFetchAssetOrders(tabLabels[tabIndex], 'Ask'),
          qFetchAssetOrders(tabLabels[tabIndex], 'Bid'),
        ]);
        setAskOrders(askData || []);
        setBidOrders(bidData || []);
        setError('');
        setErrorSending('');
      }
      setShowProgress(tick < orderTick);
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [
    id,
    showProgress,
    orderTick,
    tabIndex,
    tabLabels,
    qBalance,
    qOwnedAssets,
    qFetchLatestTick,
    qFetchAssetOrders,
  ]);

  const handleInputChange = useCallback(
    (setter) => (event) => {
      const newValue = event.target.value;
      if (/^\d*$/.test(newValue)) {
        setter(newValue);
      }
    },
    []
  );

  const changeAsset = useCallback(
    async (event) => {
      const newIndex = event.target.value;
      setTabIndex(newIndex);
      const [askData, bidData] = await Promise.all([
        qFetchAssetOrders(tabLabels[newIndex], 'Ask'),
        qFetchAssetOrders(tabLabels[newIndex], 'Bid'),
      ]);
      setAskOrders(askData || []);
      setBidOrders(bidData || []);
    },
    [tabLabels, qFetchAssetOrders]
  );

  const renderOrderTable = useCallback(
    (orders, type) => (
      <TableContainer component={Paper} sx={{ mt: 2, mb: 3 }}>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell align='right'>Price (qu)</TableCell>
              <TableCell align='right'>Amount</TableCell>
              <TableCell align='right'>Total (qu)</TableCell>
              <TableCell>Entity ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((item, index) => (
              <TableRow key={item.entityId + index}>
                <TableCell>
                  {id === item.entityId && (
                    <IconButton
                      size='small'
                      disabled={showProgress}
                      onClick={() =>
                        qOrder(
                          tabLabels[tabIndex],
                          type === 'Ask' ? 'removeSell' : 'removeBuy',
                          item.price,
                          item.numberOfShares
                        )
                      }
                    >
                      <DeleteIcon fontSize='small' />
                    </IconButton>
                  )}
                </TableCell>
                <TableCell align='right'>
                  {item.price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </TableCell>
                <TableCell align='right'>
                  {item.numberOfShares
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, "'")}
                </TableCell>
                <TableCell align='right'>
                  {(item.numberOfShares * item.price)
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                </TableCell>
                <TableCell>
                  <Typography
                    variant='body2'
                    sx={{
                      color:
                        id === item.entityId ? 'primary.main' : 'text.primary',
                      fontSize: '0.85rem',
                    }}
                  >
                    {item.entityId}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ),
    [id, tabLabels, tabIndex, qOrder, showProgress]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <Typography
            variant='h6'
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CircleIcon sx={{ color: id ? 'success.main' : 'error.main' }} />
            <ConnectLink />
            {id ? `${id}` : ''}
          </Typography>
          <Box sx={{ justifyContent: 'flex-end' }}>
            <IconButton
              onClick={() =>
                setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))
              }
            >
              {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Box>
        </Box>
        {id && (
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ marginBottom: '25px' }}
          >
            {/* Left Column */}
            <Paper elevation={0} sx={{ flex: 1, padding: '20px' }}>
              <Typography
                variant='h6'
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 5 }}
              >
                Balance:{' '}
                {balance.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} qus
              </Typography>
              <FormControl variant='outlined' sx={{ mb: 3 }}>
                <InputLabel>Asset</InputLabel>
                <Select
                  value={tabIndex}
                  onChange={changeAsset}
                  label='Asset'
                  sx={{ minWidth: 190, mb: 0, marginRight: 1 }}
                >
                  {tabLabels.map((label, index) => (
                    <MenuItem value={index} key={index}>
                      {label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography
                variant='h6'
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  marginBottom: '25px',
                }}
              >
                <TokenIcon />
                {tabLabels[tabIndex]}:{' '}
                {assets.get(tabLabels[tabIndex])
                  ? assets
                      .get(tabLabels[tabIndex])
                      .toString()
                      .replace(/\B(?=(\d{3})+(?!\d))/g, "'")
                  : 0}
                {` assets`}
              </Typography>
            </Paper>

            {/* Right Column */}
            <Paper elevation={0} sx={{ flex: 1, padding: '20px' }}>
              <Typography sx={{ mb: 1 }} variant='h6'>
                Transfer QU / Assets
              </Typography>

              <Box display='flex' alignItems='left'>
                <TextField
                  label={`Amount ${transferToken
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, "'")}`}
                  value={transferToken}
                  onChange={handleInputChange(setTransferToken)}
                  variant='outlined'
                  size='small'
                  error={!Number(transferToken) || errorSending}
                  helperText={errorSending}
                  sx={{
                    width: 250,
                    margin: 1,
                    '& .MuiInputBase-input': {
                      height: '30px', // Adjust the height as needed
                    },
                  }}
                />
                <Button
                  disabled={showProgress}
                  variant='contained'
                  color={waitDoubleClick ? 'warning' : 'success'}
                  onClick={() => {
                    if (!receiverError) {
                      if (waitDoubleClick) {
                        qTransferAsset('QU', receiverAddress, transferToken);
                        handleAddOption();
                      }
                      setWaitDoubleclick(!waitDoubleClick);
                      if (!waitDoubleClick) {
                        setTimeout(() => {
                          setWaitDoubleclick(false);
                        }, 2000);
                      }
                    }
                  }}
                  sx={{
                    mb: 1,
                    margin: 1,
                    borderRadius: 25,
                    backgroundColor: 'aa06ae',
                    fontSize: '20px',
                    size: 'small',
                  }}
                >
                  {waitDoubleClick ? 'Sure to send QU?' : 'Send QU'}
                </Button>
                <Button
                  variant='contained'
                  disabled={showProgress}
                  color={waitDoubleClickAsset ? 'warning' : 'primary'}
                  onClick={() => {
                    if (!receiverError) {
                      if (waitDoubleClickAsset) {
                        qTransferAsset(
                          tabLabels[tabIndex],
                          receiverAddress,
                          transferToken,
                          assets.get(tabLabels[tabIndex])
                        );
                        handleAddOption();
                      }
                      setWaitDoubleClickAsset(!waitDoubleClickAsset);
                      if (!waitDoubleClickAsset) {
                        setTimeout(() => {
                          setWaitDoubleClickAsset(false);
                        }, 2000);
                      }
                    }
                  }}
                  sx={{
                    mb: 1,
                    margin: 1,
                    borderRadius: 25,
                    backgroundColor: 'aa06ae',
                    fontSize: '20px',
                    size: 'small',
                  }}
                >
                  {waitDoubleClickAsset
                    ? `Sure to send ${tabLabels[tabIndex]}?`
                    : `Send ${tabLabels[tabIndex]}`}
                </Button>
                {/* <Typography>
                  Send any amount of qu/asset to the address below.
                </Typography> */}
              </Box>
              {/* <Box sx={{ display: 'block' }}> */}
              <Box>
                <Box sx={{ display: 'flex', gap: 1, mt: 3, flexWrap: 'wrap' }}>
                  <Autocomplete
                    value={receiverAddress}
                    onInputChange={(event, newInputValue) => {
                      if (!seedRegex.test(newInputValue)) {
                        setReceiverError(
                          'ID must be exactly 60 uppercase A-Z letters'
                        );
                      } else {
                        setReceiverError('');
                        setReceiverAddress(newInputValue);
                      }
                    }}
                    onChange={(event, newValue) => {
                      if (!seedRegex.test(newValue)) {
                        setReceiverError(
                          'ID must be exactly 60 uppercase A-Z letters'
                        );
                      } else {
                        setReceiverError('');
                        setReceiverAddress(newValue);
                      }
                    }}
                    options={options}
                    freeSolo // Allows input of custom text
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={!!receiverError}
                        helperText={receiverError}
                        sx={{
                          width: 750,
                          margin: 1,
                          '& .MuiInputBase-input': {
                            height: '20px', // Adjust the height as needed
                          },
                        }}
                        // InputProps={{
                        //   ...params.InputProps,
                        //   endAdornment: (
                        //     <>
                        //       <InputAdornment position='end'>
                        //         <IconButton>
                        //           <PlaylistRemove />
                        //         </IconButton>
                        //       </InputAdornment>
                        //       {params.InputProps.endAdornment}
                        //     </>
                        //   ),
                        // }}
                        label='Receiver address'
                      />
                    )}
                  />
                </Box>
              </Box>
            </Paper>
          </Stack>
        )}
        {!id ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              maxWidth: 400,
            }}
          ></Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField
                label={`Amount ${amount
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, "'")}`}
                value={amount}
                onChange={handleInputChange(setAmount)}
                variant='outlined'
                size='small'
                error={!Number(amount) || error}
                helperText={error}
                sx={{ width: 190 }}
              />
              <TextField
                label={`Price ${price
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`}
                value={price}
                onChange={handleInputChange(setPrice)}
                variant='outlined'
                size='small'
                error={!Number(price) || error}
                helperText={error}
                sx={{ width: 200 }}
              />
              <Button
                style={{ color: themeMode === 'dark' ? 'white' : 'black' }}
                variant='contained'
                disabled={true}
                color='secondary'
              >
                {`Total: ${(amount * price)
                  .toString()
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}  qu`}
              </Button>
              <Button
                variant='contained'
                disabled={showProgress}
                startIcon={<ShoppingCartIcon />}
                onClick={() => qOrder(tabLabels[tabIndex], 'buy')}
              >
                Buy {tabLabels[tabIndex]}
              </Button>
              <Button
                variant='contained'
                disabled={showProgress}
                color='secondary'
                startIcon={<SellIcon />}
                onClick={() => qOrder(tabLabels[tabIndex], 'sell')}
              >
                Sell {tabLabels[tabIndex]}
              </Button>
              <Button
                variant='outlined'
                onClick={() => {
                  if (entitiesView) window.api.closeEntitiesView('toMain', '');
                  else window.api.openEntitiesView('toMain', id);

                  setEntitiesView(!entitiesView);
                }}
                // sx={{ mb: 3, marginRight: 1 }}
              >
                {entitiesView ? (
                  <CloseIcon style={{ color: 'red' }}></CloseIcon>
                ) : (
                  <OpenInFullIcon></OpenInFullIcon>
                )}
                Your Orders
              </Button>
            </Box>

            {showProgress ? (
              <LinearProgress sx={{ mb: 2 }} />
            ) : (
              <LinearProgress
                variant='determinate'
                value={100} // Static value, fully filled
                sx={
                  txSuccess || orderTick === 0
                    ? {
                        mb: 2,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'success.main', // Set the progress bar color to green
                        },
                      }
                    : {
                        mb: 2,
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'error.main', // Set the progress bar color to green
                        },
                      }
                }
              />
            )}

            <Typography
              variant='body2'
              sx={{ mb: 1, color: error ? 'red' : 'white' }}
            >
              {latestTick >= orderTick && orderTick > 0 ? (
                <Link
                  href={txLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  color='inherit'
                >
                  <ReceiptIcon
                    sx={{
                      position: 'relative',
                      marginRight: 1,
                      marginTop: 0,
                      top: 0,
                      left: 0,
                    }}
                  ></ReceiptIcon>
                  Last Transaction {txSuccess ? 'successful' : 'failed'}
                </Link>
              ) : (
                `Current ACTION: ${error} ${showProgress && log}`
              )}
            </Typography>
            <Typography variant='body2' sx={{ mb: 3 }}>
              Latest Tick:{' '}
              {latestTick.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </Typography>

            <Typography variant='h6' sx={{ mb: 1, color: 'error.main' }}>
              Ask Orders
            </Typography>
            {renderOrderTable(askOrders, 'Ask')}

            <Typography variant='h6' sx={{ mb: 1, color: 'success.main' }}>
              Bid Orders
            </Typography>
            {renderOrderTable(bidOrders, 'Bid')}
          </Box>
        )}
        {id ? (
          <Typography inline align='right'>
            QX trade fee: {tradeFee / 10000000} %
          </Typography>
        ) : (
          <></>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default MainView;
