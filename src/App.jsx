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
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/Delete';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import CircleIcon from '@mui/icons-material/Circle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TokenIcon from '@mui/icons-material/Token';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SellIcon from '@mui/icons-material/Sell';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

// QUBIC
import { QubicHelper } from '@qubic-lib/qubic-ts-library/dist/qubicHelper.js';
import { QubicTransferQXOrderPayload } from '@qubic-lib/qubic-ts-library/dist/qubic-types/transacion-payloads/QubicTransferQXOrderPayload.js';
import { QubicTransaction } from '@qubic-lib/qubic-ts-library/dist/qubic-types/QubicTransaction.js';
import { QubicDefinitions } from '@qubic-lib/qubic-ts-library/dist/QubicDefinitions.js';
import { PublicKey } from '@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey.js';
import { Long } from '@qubic-lib/qubic-ts-library/dist/qubic-types/Long.js';

const API_URL = 'https://api.qubic.org';
const BASE_URL = 'https://rpc.qubic.org';
const TICK_OFFSET = 5;
const POLLING_INTERVAL = 5000;

const ISSUER = new Map([
  ['QX', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['RANDOM', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['QUTIL', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['QTRY', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['MLM', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['QPOOL', 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB'],
  ['QFT', 'TFUYVBXYIYBVTEMJHAJGEJOOZHJBQFVQLTBBKMEHPEVIZFXZRPEYFUWGTIWG'],
  ['CFB', 'CFBMEMZOIDEXQAUXYYSZIURADQLAPWPMNJXQSNVQZAHYVOPYUKKJBJUCTVJL'],
  ['QWALLET', 'QWALLETSGQVAGBHUCVVXWZXMBKQBPQQSHRYKZGEJWFVNUFCEDDPRMKTAUVHA'],
  ['QCAP', 'QCAPWMYRSHLBJHSTTZQVCIBARVOASKDENASAKNOBRGPFWWKRCUVUAXYEZVOG'],
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

const App = () => {
  const [id, setId] = useState('');
  const [balance, setBalance] = useState(0);
  const [assets, setAssets] = useState(new Map());
  const [amount, setAmount] = useState(0);
  const [price, setPrice] = useState(0);
  const [seed, setSeed] = useState('');
  const [showSeed, setShowSeed] = useState(false);
  const [latestTick, setLatestTick] = useState(0);
  const [log, setLog] = useState('');
  const [orderTick, setOrderTick] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [askOrders, setAskOrders] = useState([]);
  const [bidOrders, setBidOrders] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [themeMode, setThemeMode] = useState('light');

  const theme = useMemo(() => getTheme(themeMode), [themeMode]);
  const tabLabels = useMemo(() => [...ISSUER.keys()], []);

  const valueOfAssetName = useCallback((asset) => {
    const bytes = new Uint8Array(8);
    bytes.set(new TextEncoder().encode(asset));
    return new DataView(bytes.buffer).getBigInt64(0, true);
  }, []);
  const fetchAssetOrders = useCallback(async (assetName, issuerID, type, offset) => {
    return await fetch(`${API_URL}/v1/qx/getAsset${type}Orders?assetName=${assetName}&issuerId=${issuerID}&offset=${offset}`, { method: 'GET' });
  }, []);

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

  const createQXOrderTransaction = useCallback(async (senderId, senderSeed, targetTick, payload, actionType) => {
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
  }, []);

  const broadcastTransaction = useCallback(async (transaction) => {
    const encodedTransaction = transaction.encodeTransactionToBase64(transaction.getPackageData());

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

  const qFetchAssetOrders = useCallback(
    async (assetName, type) => {
      const response = await fetchAssetOrders(assetName, ISSUER.get(assetName), type, 0);
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

  const qLogin = useCallback(async () => {
    const qubic = await new QubicHelper();
    const qubicPackage = await qubic.createIdPackage(seed);
    const newId = qubicPackage.publicId;

    setId(newId);
    const [balanceData, assetsData, tickData, askData, bidData] = await Promise.all([
      qBalance(newId),
      qOwnedAssets(newId),
      qFetchLatestTick(),
      qFetchAssetOrders(tabLabels[tabIndex], 'Ask'),
      qFetchAssetOrders(tabLabels[tabIndex], 'Bid'),
    ]);

    setBalance(balanceData.balance);
    setAssets(new Map(assetsData.map((el) => [el.data.issuedAsset.name, el.data.numberOfUnits])));
    setLatestTick(tickData);
    setAskOrders(askData);
    setBidOrders(bidData);
  }, [seed, tabIndex, tabLabels, qBalance, qOwnedAssets, qFetchLatestTick, qFetchAssetOrders]);

  const qOrder = useCallback(
    async (asset, type, rmPrice, rmAmount) => {
      const latestTick = await qFetchLatestTick();
      setOrderTick(latestTick + TICK_OFFSET);
      setShowProgress(true);

      const orderPayload = createQXOrderPayload(ISSUER.get(asset), asset, rmPrice || price, rmAmount || amount);

      const actionType = {
        buy: QubicDefinitions.QX_ADD_BID_ORDER,
        sell: QubicDefinitions.QX_ADD_ASK_ORDER,
        rmBuy: QubicDefinitions.QX_REMOVE_BID_ORDER,
        rmSell: QubicDefinitions.QX_REMOVE_ASK_ORDER,
      }[type];

      const transaction = await createQXOrderTransaction(id, seed, latestTick + TICK_OFFSET, orderPayload, actionType);

      await broadcastTransaction(transaction);

      setLog(`${type}: ${rmAmount || amount} asset(s) of ${asset} for ${rmPrice || price} qu per token on tick ${latestTick + TICK_OFFSET}`);
      return 'OK';
    },
    [id, seed, price, amount, createQXOrderPayload, createQXOrderTransaction, broadcastTransaction, qFetchLatestTick]
  );

  useEffect(() => {
    if (!id) return;

    const intervalId = setInterval(async () => {
      const [balanceData, assetsData, tick] = await Promise.all([qBalance(), qOwnedAssets(), qFetchLatestTick()]);

      setBalance(balanceData.balance);
      setAssets(new Map(assetsData.map((el) => [el.data.issuedAsset.name, el.data.numberOfUnits])));
      setLatestTick(tick);

      if (showProgress && tick >= orderTick) {
        const [askData, bidData] = await Promise.all([qFetchAssetOrders(tabLabels[tabIndex], 'Ask'), qFetchAssetOrders(tabLabels[tabIndex], 'Bid')]);
        setAskOrders(askData);
        setBidOrders(bidData);
      }
      setShowProgress(tick < orderTick);
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [id, showProgress, orderTick, tabIndex, tabLabels, qBalance, qOwnedAssets, qFetchLatestTick, qFetchAssetOrders]);

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
      const [askData, bidData] = await Promise.all([qFetchAssetOrders(tabLabels[newIndex], 'Ask'), qFetchAssetOrders(tabLabels[newIndex], 'Bid')]);
      setAskOrders(askData);
      setBidOrders(bidData);
    },
    [tabLabels, qFetchAssetOrders]
  );

  const renderOrderTable = useCallback(
    (orders, type) => (
      <TableContainer component={Paper} sx={{ mt: 2, mb: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell align="right">Price (qu)</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Entity ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((item, index) => (
              <TableRow key={item.entityId + index}>
                <TableCell>
                  {id === item.entityId && (
                    <IconButton size="small" onClick={() => qOrder(tabLabels[tabIndex], type === 'Ask' ? 'rmSell' : 'rmBuy', item.price, item.numberOfShares)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
                <TableCell align="right">{item.price}</TableCell>
                <TableCell align="right">{item.numberOfShares}</TableCell>
                <TableCell>
                  <Typography
                    variant="body2"
                    sx={{
                      color: id === item.entityId ? 'primary.main' : 'text.primary',
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
    [id, tabLabels, tabIndex, qOrder]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircleIcon sx={{ color: id ? 'success.main' : 'error.main' }} />
            {id ? `ID: ${id}` : 'No ID Connected'}
          </Typography>
          <IconButton onClick={() => setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'))}>{themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}</IconButton>
        </Box>

        {id && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <AccountBalanceWalletIcon />
              Balance: {balance} qus
            </Typography>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TokenIcon />
              {tabLabels[tabIndex]}: {assets.get(tabLabels[tabIndex]) || 0} assets
            </Typography>
          </Box>
        )}

        {!id ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400 }}>
            <TextField
              label="Seed"
              type={showSeed ? 'text' : 'password'}
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              variant="outlined"
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowSeed(!showSeed)} edge="end">
                      {showSeed ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button variant="contained" onClick={qLogin} sx={{ width: 'fit-content' }}>
              Login
            </Button>
          </Box>
        ) : (
          <Box>
            <Button variant="outlined" onClick={() => setId('')} sx={{ mb: 3 }}>
              Logout
            </Button>

            <FormControl fullWidth variant="outlined" sx={{ mb: 3 }}>
              <InputLabel>Token</InputLabel>
              <Select value={tabIndex} onChange={changeAsset} label="Token" sx={{ maxWidth: 200 }}>
                {tabLabels.map((label, index) => (
                  <MenuItem value={index} key={index}>
                    {label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <TextField label="Amount" value={amount} onChange={handleInputChange(setAmount)} variant="outlined" size="small" sx={{ width: 150 }} />
              <TextField label="Price" value={price} onChange={handleInputChange(setPrice)} variant="outlined" size="small" sx={{ width: 150 }} />
              <Button variant="contained" startIcon={<ShoppingCartIcon />} onClick={() => qOrder(tabLabels[tabIndex], 'buy')}>
                Buy {tabLabels[tabIndex]}
              </Button>
              <Button variant="contained" color="secondary" startIcon={<SellIcon />} onClick={() => qOrder(tabLabels[tabIndex], 'sell')}>
                Sell {tabLabels[tabIndex]}
              </Button>
            </Box>

            {showProgress && <LinearProgress sx={{ mb: 2 }} />}

            <Typography variant="body2" sx={{ mb: 1 }}>
              Last Action: {showProgress && log}
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              Latest Tick: {latestTick}
            </Typography>

            <Typography variant="h6" sx={{ mb: 1 }}>
              Ask Orders
            </Typography>
            {renderOrderTable(askOrders, 'Ask')}

            <Typography variant="h6" sx={{ mb: 1 }}>
              Bid Orders
            </Typography>
            {renderOrderTable(bidOrders, 'Bid')}
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default App;
