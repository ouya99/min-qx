import {
  Box,
  Button,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography,
  Divider,
  InputAdornment,
  IconButton,
  LinearProgress,
} from "@mui/material";
import {
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  ListItemButton,
  ListItemIcon,
} from "@mui/material";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  styled,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";

import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import CircleIcon from "@mui/icons-material/Circle";
import React, { useState, useEffect } from "react";

// QUBIC
import { QubicHelper } from "@qubic-lib/qubic-ts-library/dist/qubicHelper.js";
import { QubicTransferQXOrderPayload } from "@qubic-lib/qubic-ts-library/dist/qubic-types/transacion-payloads/QubicTransferQXOrderPayload.js";
import { QubicTransaction } from "@qubic-lib/qubic-ts-library/dist/qubic-types/QubicTransaction.js";
import { QubicDefinitions } from "@qubic-lib/qubic-ts-library/dist/QubicDefinitions.js";
import { PublicKey } from "@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey.js";
import { Long } from "@qubic-lib/qubic-ts-library/dist/qubic-types/Long.js";

const apiURL = "https://api.qubic.org";
const baseURL = "https://rpc.qubic.org";
const tickOffset = 5;

const ISSUER = new Map([
  ["QX", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB"],
  ["RANDOM", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB"],
  ["QUTIL", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB"],
  ["QTRY", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB"],
  ["MLM", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB"],
  ["QPOOL", "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAFXIB"],
  ["QFT", "TFUYVBXYIYBVTEMJHAJGEJOOZHJBQFVQLTBBKMEHPEVIZFXZRPEYFUWGTIWG"],
  ["CFB", "CFBMEMZOIDEXQAUXYYSZIURADQLAPWPMNJXQSNVQZAHYVOPYUKKJBJUCTVJL"],
  ["QWALLET", "QWALLETSGQVAGBHUCVVXWZXMBKQBPQQSHRYKZGEJWFVNUFCEDDPRMKTAUVHA"],
  ["QCAP", "QCAPWMYRSHLBJHSTTZQVCIBARVOASKDENASAKNOBRGPFWWKRCUVUAXYEZVOG"],
]);

const App = () => {
  // Declare a state variable 'count' and a function to update it
  const [id, setId] = useState("");
  const [balance, setBalance] = useState(0);
  const [assets, setAssets] = useState([]);
  const [amount, setAmount] = useState(0);
  const [price, setPrice] = useState(0);

  const [seed, setSeed] = useState("");
  const [showSeed, setShowSeed] = useState(false);
  const [latestTick, setLatestTick] = useState(0);
  const [log, setLog] = useState("");
  const [orderTick, setOrderTick] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  const [askOrders, setAskOrders] = useState([]);
  const [bidOrders, setBidOrders] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const tabLabels = [...ISSUER.keys()];

  const valueOfAssetName = (asset) => {
    const bytes = new Uint8Array(8);
    bytes.set(new TextEncoder().encode(asset));

    return new DataView(bytes.buffer).getBigInt64(0, true);
  };

  const fetchAssetOrders = async (assetName, issuerID, type, offset) => {
    const response = await fetch(
      apiURL +
        `/v1/qx/getAsset${type}Orders?assetName=${assetName}&issuerId=${issuerID}&offset=${offset}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );
    return response;
  };

  const createQXOrderPayload = (issuer, assetName, price, numberOfShares) => {
    return new QubicTransferQXOrderPayload({
      issuer: new PublicKey(issuer),
      assetName: new Long(valueOfAssetName(assetName)),
      price: new Long(price),
      numberOfShares: new Long(numberOfShares),
    });
  };

  const createQXOrderTransaction = async (
    senderId,
    senderSeed,
    targetTick,
    payload,
    actionType
  ) => {
    const transaction = new QubicTransaction()
      .setSourcePublicKey(new PublicKey(senderId))
      .setDestinationPublicKey(QubicDefinitions.QX_ADDRESS)
      .setTick(targetTick)
      .setInputSize(payload.getPackageSize())
      .setAmount(new Long(0))
      .setInputType(actionType)
      .setPayload(payload);

    if (actionType === QubicDefinitions.QX_ADD_BID_ORDER) {
      transaction.setAmount(new Long(payload.getTotalAmount()));
    }

    switch (actionType) {
      case QubicDefinitions.QX_ADD_BID_ORDER:
        transaction.setInputType(QubicDefinitions.QX_ADD_BID_ORDER);
        transaction.setAmount(new Long(payload.getTotalAmount()));
        break;
      case QubicDefinitions.QX_ADD_ASK_ORDER:
        transaction.setInputType(QubicDefinitions.QX_ADD_ASK_ORDER);
        transaction.setAmount(0);
        break;
      case QubicDefinitions.QX_REMOVE_BID_ORDER:
        transaction.setInputType(QubicDefinitions.QX_REMOVE_BID_ORDER);
        transaction.setAmount(new Long(0));
        break;
      case QubicDefinitions.QX_REMOVE_ASK_ORDER:
        transaction.setInputType(QubicDefinitions.QX_REMOVE_ASK_ORDER);
        transaction.setAmount(new Long(0));
        break;
    }

    await transaction.build(senderSeed);

    return transaction;
  };

  const broadcastTransaction = async (transaction) => {
    const encodedTransaction = transaction.encodeTransactionToBase64(
      transaction.getPackageData()
    );

    return await fetch(baseURL + "/v1/broadcast-transaction", {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        encodedTransaction: encodedTransaction,
      }),
    });
  };

  const qBalance = async (ID) => {
    const response = await fetch(baseURL + `/v1/balances/${ID ? ID : id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const data = await response.json();
    return data["balance"];
  };

  const qFetchAssetOrders = async (assetName, type) => {
    // get destination address
    const response = await fetchAssetOrders(
      assetName,
      ISSUER.get(assetName),
      type,
      0
    );
    const data = await response.json();

    return type === "Ask" ? data["orders"].reverse() : data["orders"];
  };

  const qFetchLatestTick = async () => {
    const response = await fetch(baseURL + "/v1/status", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const data = await response.json();
    return data["lastProcessedTick"]["tickNumber"];
  };

  const qOwnedAssets = async (ID) => {
    const response = await fetch(baseURL + `/v1/assets/${ID ? ID : id}/owned`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    const data = await response.json();
    return data["ownedAssets"];
  };

  const qLogin = async () => {
    console.log("qlogin");

    const qubic = await new QubicHelper();
    const qubicPackage = await qubic.createIdPackage(seed);
    const ID = qubicPackage.publicId;
    setId(ID);
    console.log(ID);
    setBalance((await qBalance(ID)).balance);
    setAssets(
      new Map(
        (await qOwnedAssets(ID)).map((el) => [
          el.data.issuedAsset.name,
          el.data.numberOfUnits,
        ])
      )
    );

    setLatestTick(await qFetchLatestTick());

    setAskOrders(await qFetchAssetOrders(tabLabels[tabIndex], "Ask"));
    setBidOrders(await qFetchAssetOrders(tabLabels[tabIndex], "Bid"));
  };

  const qLogout = async () => {
    console.log("qlogout");
    setId(""); // Assume login is successful
  };

  const qOrder = async (asset, type, rmPrice, rmAmount) => {
    console.log(`${type} ${amount} asset(s) of ${asset}`);

    //Get latest tick
    const latestTick = await qFetchLatestTick();
    setOrderTick(latestTick + tickOffset);
    setShowProgress(true);
    //Assemble transaction payload
    const orderPayload = createQXOrderPayload(
      ISSUER.get(asset),
      asset,
      rmPrice ? rmPrice : price,
      rmAmount ? rmAmount : amount
    );

    console.log(orderPayload);

    let actionType = "";
    switch (type) {
      case "buy":
        actionType = QubicDefinitions.QX_ADD_BID_ORDER;
        break;
      case "sell":
        actionType = QubicDefinitions.QX_ADD_ASK_ORDER;
        break;
      case "rmBuy":
        actionType = QubicDefinitions.QX_REMOVE_BID_ORDER;
        break;
      case "rmSell":
        actionType = QubicDefinitions.QX_REMOVE_ASK_ORDER;
        break;

      default:
        break;
    }

    //Assemble transaction
    const transaction = await createQXOrderTransaction(
      id,
      seed,
      latestTick + tickOffset,
      orderPayload,
      actionType
    );

    console.log(transaction);
    //Broadcast transaction
    const res = await broadcastTransaction(transaction);
    console.log(await res.json());

    setLog(
      `${type}: ${rmAmount ? rmAmount : amount} asset(s) of ${asset} for ${
        rmPrice ? rmPrice : price
      } qu per token on tick ${latestTick + tickOffset}`
    );
    return "OK";
  };

  const handleChangeAmount = (event) => {
    const newValue = event.target.value;
    // Allow only numeric input
    if (/^\d*$/.test(newValue)) {
      setAmount(newValue);
    }
  };
  const handleChangePrice = (event) => {
    const newValue = event.target.value;
    // Allow only numeric input
    if (/^\d*$/.test(newValue)) {
      setPrice(newValue);
    }
  };

  const handleChange = (event) => {
    setSeed(event.target.value);
  };

  const handleClickShowPassword = () => {
    setShowSeed(!showSeed);
  };

  useEffect(() => {
    let intervalId;

    if (id.length > 0) {
      intervalId = setInterval(async () => {
        setBalance((await qBalance()).balance);
        setAssets(
          new Map(
            (await qOwnedAssets()).map((el) => [
              el.data.issuedAsset.name,
              el.data.numberOfUnits,
            ])
          )
        );
        let tick = await qFetchLatestTick();
        console.log(showProgress, tick, orderTick);
        setLatestTick(tick);
        // fetch new orders after tx has gone through
        if (showProgress && tick >= orderTick) {
          setAskOrders(await qFetchAssetOrders(tabLabels[tabIndex], "Ask"));
          setBidOrders(await qFetchAssetOrders(tabLabels[tabIndex], "Bid"));
        }
        setShowProgress(tick < orderTick);
      }, 5000);
    }

    // Cleanup the interval on component unmount or when isLoggedIn changes
    return () => clearInterval(intervalId);
  }, [id, showProgress]); // Depend on isLoggedIn

  const changeAsset = async (event) => {
    setTabIndex(event.target.value);
    setAskOrders(await qFetchAssetOrders(tabLabels[event.target.value], "Ask"));
    setBidOrders(await qFetchAssetOrders(tabLabels[event.target.value], "Bid"));
  };

  const StickyTableContainer = styled(TableContainer)(({ theme }) => ({
    maxHeight: "400px", // Set max height for the scrollable area
    overflowY: "auto",
    "& thead th": {
      position: "sticky",
      top: 0,
      backgroundColor: theme.palette.background.default,
      zIndex: 1,
    },
  }));

  const rows = Array.from({ length: 100 }, (_, index) => ({
    id: index + 1,
    name: `Item ${index + 1}`,
    value: Math.floor(Math.random() * 100),
  }));

  return (
    <>
      <Typography variant="h6" component="h4">
        <CircleIcon sx={{ color: id ? "green" : "red" }}></CircleIcon>
        {id ? `ID: ${id}` : " no ID connected"}
      </Typography>
      {id ? (
        <>
          <Typography variant="h6" component="h4">
            BALANCE: {balance + " qus"}
          </Typography>
          <Typography variant="h6" component="h4">
            {tabLabels[tabIndex]}:{" "}
            {assets.size > 0 && assets.get(tabLabels[tabIndex])
              ? assets.get(tabLabels[tabIndex])
              : 0}{" "}
            assets
          </Typography>
        </>
      ) : (
        <></>
      )}
      {/* <TextField label="enter seed" variant="outlined" fullWidth /> */}
      {!id ? (
        <>
          {" "}
          <TextField
            label="seed"
            type={showSeed ? "text" : "password"}
            value={seed}
            onChange={handleChange}
            variant="outlined"
            fullWidth
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleClickShowPassword} edge="end">
                    {showSeed ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" color="primary" onClick={() => qLogin()}>
            Login
          </Button>
        </>
      ) : (
        <>
          <>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => qLogout()}
            >
              Logout
            </Button>
          </>
          <FormControl
            fullWidth
            variant="outlined"
            sx={{ paddingTop: 1, marginTop: 2 }}
          >
            <InputLabel>Token</InputLabel>
            <Select
              sx={{ width: "20%", maxWidth: 200 }}
              value={tabIndex}
              onChange={changeAsset}
              label="Select Tab"
            >
              {tabLabels.map((label, index) => (
                <MenuItem value={index} key={index}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Amount"
            type="text"
            value={amount}
            onChange={handleChangeAmount}
            variant="outlined"
            inputProps={{
              pattern: "[0-9]*", // Pattern for numeric input
              inputMode: "numeric", // Show numeric keyboard on mobile
            }}
          />
          <TextField
            label="Price"
            type="text"
            value={price}
            onChange={handleChangePrice}
            variant="outlined"
            inputProps={{
              pattern: "[0-9]*", // Pattern for numeric input
              inputMode: "numeric", // Show numeric keyboard on mobile
            }}
          />
          <Button
            variant="outlined"
            color="primary"
            onClick={() => qOrder(tabLabels[tabIndex], "buy")}
          >
            buy {tabLabels[tabIndex]}
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => qOrder(tabLabels[tabIndex], "sell")}
          >
            sell {tabLabels[tabIndex]}
          </Button>
          <Divider sx={{ bgcolor: "black" }} />
          <Divider sx={{ bgcolor: "black" }} />
          {showProgress ? <LinearProgress></LinearProgress> : <></>}
          LAST ACTION: {showProgress ? log : <></>}
          <Divider sx={{ bgcolor: "black" }} />
          LATEST TICK: {latestTick}
          <StickyTableContainer style={{ height: "100%" }} component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell>PRICE</TableCell>
                  <TableCell>AMOUNT</TableCell>
                  <TableCell>ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>ASK</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
                {askOrders.map((row) => (
                  <TableRow key={row.entityId}>
                    <ListItemIcon>
                      {id === row.entityId ? (
                        <DeleteIcon
                          onClick={() =>
                            qOrder(
                              tabLabels[tabIndex],
                              "rmSell",
                              row.price,
                              row.numberOfShares
                            )
                          }
                        />
                      ) : (
                        <></>
                      )}
                    </ListItemIcon>
                    <TableCell>{row.price}</TableCell>
                    <TableCell>{row.numberOfShares}</TableCell>
                    <TableCell>{row.entityId}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell>BID</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
                {bidOrders.map((row) => (
                  <TableRow key={row.entityId}>
                    <ListItemIcon>
                      {id === row.entityId ? (
                        <DeleteIcon
                          onClick={() =>
                            qOrder(
                              tabLabels[tabIndex],
                              "rmBuy",
                              row.price,
                              row.numberOfShares
                            )
                          }
                        />
                      ) : (
                        <></>
                      )}
                    </ListItemIcon>
                    <TableCell>{row.price}</TableCell>
                    <TableCell>{row.numberOfShares}</TableCell>
                    <TableCell>{row.entityId}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </StickyTableContainer>
          {/* <List
              sx={{ width: "100%", maxWidth: 900, bgcolor: "background.paper" }}
            >
              {askOrders.map((item, index) => {
                const labelId = `checkbox-list-label-${item}`;

                return (
                  <ListItem key={item} disablePadding>
                    <ListItemButton role={undefined} dense>
                      <ListItemIcon>
                        {id === item.entityId ? (
                          <DeleteIcon
                            onClick={() =>
                              qOrder(
                                tabLabels[tabIndex],
                                "rmSell",
                                item.price,
                                item.numberOfShares
                              )
                            }
                          />
                        ) : (
                          <></>
                        )}
                      </ListItemIcon>
                      <ListItemText primary={item.price} />
                      <ListItemText primary={item.numberOfShares} />
                      <ListItemText
                        key={item.entityId + index}
                        primary={
                          <Typography
                            variant="body2"
                            style={{
                              color:
                                id === item.entityId ? "#4422FF" : "FFFFFF",
                            }}
                          >
                            {item.entityId}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List> */}
          {/* BID */}
        </>
      )}
    </>
  );
};

export default App;
