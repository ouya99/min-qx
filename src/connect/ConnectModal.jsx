import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Typography,
  Divider,
  Box,
  FormControl,
  InputLabel,
  Paper,
  useTheme,
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import CloudIcon from '@mui/icons-material/Cloud';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PhonelinkIcon from '@mui/icons-material/Phonelink';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { QubicVault } from '@qubic-lib/qubic-ts-vault-library';
import { useQubicConnect } from './QubicConnectContext';
import { useMediaQuery } from '@mui/material';

import { useQxContext } from '../contexts/QxContext';
import { useConfig } from '../contexts/ConfigContext';
import { useSnackbar } from '../contexts/SnackbarContext';

const ConnectModal = ({ open, onClose }) => {
  const theme = useTheme();

  const [selectedWalletMode, setSelectedWalletMode] = useState('none');
  const [selectedServerMode, setSelectedServerMode] = useState('none');
  const { balance, fetchBalance, walletPublicIdentity } = useQxContext();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [copied, setCopied] = useState(false);

  // Private seed handling
  const [privateSeed, setPrivateSeed] = useState('');
  const [errorMsgPrivateSeed, setErrorMsgPrivateSeed] = useState('');
  // Vault file handling
  const [vault] = useState(new QubicVault());
  const [selectedFile, setSelectedFile] = useState(null);
  const [password, setPassword] = useState('');
  // General connect/disconnect
  const { connect, disconnect, connected } = useQubicConnect();
  // account selection
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(0);
  // Server config handling
  const { updateEndpoints, connectedToCustomServer, resetEndpoints } =
    useConfig();
  const [httpEndpointInput, setHttpEndpointInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { showSnackbar } = useSnackbar();

  const formatQubicAmount = (amount, separator = ',') => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
      return '0';
    }

    // If amount is a big number, convert it to a string
    return amount
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, separator)
      .replace('.0', '');
  };

  const truncateMiddle = (str, charsToRemove) => {
    const length = str.length;
    const start = Math.floor((length - charsToRemove) / 2);
    const end = start + charsToRemove;

    return str.slice(0, start) + '...' + str.slice(end);
  };

  const copyToClipboard = () => {
    if (walletPublicIdentity) {
      navigator.clipboard.writeText(walletPublicIdentity);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  /** Private seed connect */
  const privateKeyConnect = () => {
    connect(privateSeed);
    showSnackbar('Wallet connected successfully!', 'success');
    // reset and close
    setSelectedWalletMode('none');
    setPrivateSeed('');
    onClose();
  };

  /** Validate seed: must be 55 chars, only a-z */
  const privateKeyValidate = (pk) => {
    if (pk.length !== 55) {
      setErrorMsgPrivateSeed('Seed must be 55 characters long');
    } else if (pk.match(/[^a-z]/)) {
      setErrorMsgPrivateSeed('Seed must contain only lowercase letters');
    } else {
      setErrorMsgPrivateSeed('');
    }
    setPrivateSeed(pk);
  };

  /** Vault file connect */
  const vaultFileConnect = async () => {
    if (!selectedFile || !password) {
      showSnackbar('Please select a file and enter a password.', 'error');
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async () => {
      try {
        await vault.importAndUnlock(
          true, // selectedFileIsVaultFile
          password,
          null, // selectedConfigFile
          selectedFile,
          true // unlock
        );

        const accountList = vault
          .getSeeds()
          .filter((account) => !account.isOnlyWatch);
        if (accountList.length === 0) {
          throw new Error(
            'No eligible accounts found. Only watch-only accounts are listed.'
          );
        }

        setAccounts(accountList);
        setSelectedWalletMode('account-select');
      } catch (error) {
        console.error('Error unlocking vault:', error);
        showSnackbar('Failed to unlock vault. Please try again.', 'error');
      }
    };

    fileReader.onerror = (error) => {
      console.error('Error reading file:', error);
      showSnackbar('Failed to read the file. Please try again.', 'error');
    };

    fileReader.readAsArrayBuffer(selectedFile);
  };

  /** Select an account from the vault */
  const selectAccount = async () => {
    try {
      const pkSeed = await vault.revealSeed(
        accounts[parseInt(selectedAccount)].publicId
      );
      connect(pkSeed);
      showSnackbar('Wallet connected successfully!', 'success');
      onClose();
    } catch (error) {
      console.error('Error selecting account:', error);
      showSnackbar('Unable to select account. Please try again.', 'error');
    }
  };

  const handleFileChange = (event) => setSelectedFile(event.target.files[0]);
  const handlePasswordChange = (event) => setPassword(event.target.value);

  /** Server connect */
  const handleServerConnect = () => {
    if (!httpEndpointInput) {
      setErrorMsg('Please enter HTTP Endpoint');
      return;
    }

    try {
      new URL(httpEndpointInput);
    } catch (_) {
      setErrorMsg('Please enter valid URL.');
      return;
    }

    updateEndpoints(httpEndpointInput);
    setSelectedServerMode('none');
    onClose();
    // Reload the page to reflect the new server endpoints
    window.location.reload();
  };

  /** Server disconnect */
  const handleServerDisconnect = () => {
    resetEndpoints();
    setSelectedServerMode('none');
    onClose();
    // Reload to revert back to default server
    window.location.reload();
  };

  /** Close the dialog and reset any server mode */
  const handleClose = () => {
    setSelectedWalletMode('none');
    setSelectedServerMode('none');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={isMobile}
      fullWidth
      maxWidth='xs'
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(8px)',
        },
      }}
      PaperProps={{
        sx: {
          elevation: 'none !important',
          p: isMobile ? 0 : 1,
          py: isMobile ? 1 : 0,
          backgroundColor: theme.palette.background.card,
        },
        elevation: 2,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '0.4rem',
          backgroundColor: theme.palette.primary.main,
        }}
      />
      {/* --- Title Bar --- */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 1,
        }}
      >
        <Box display='flex' alignItems='center' gap={1}>
          <PhonelinkIcon
            fontSize='small'
            sx={{ color: theme.palette.text.primary }}
          />
          <Typography
            variant='h6'
            color={theme.palette.text.primary}
            sx={{ fontWeight: 600 }}
          >
            qubic{' '}
            <span style={{ color: theme.palette.primary.main }}>connect</span>
          </Typography>
        </Box>

        <IconButton onClick={handleClose} size='small'>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        {/* --- Wallet Section --- */}
        {selectedWalletMode === 'none' && (
          <Box display='flex' flexDirection='column' gap={2}>
            {connected ? (
              <>
                {/* Display public ID */}
                <Box textAlign='center' mt={2}>
                  <AccountBalanceWalletIcon sx={{ fontSize: 48 }} />
                </Box>
                <Box
                  display='flex'
                  alignItems='center'
                  justifyContent='center'
                  gap={1}
                >
                  <Typography
                    variant='body2'
                    sx={{ color: theme.palette.text.secondary }}
                  >
                    Public ID: {truncateMiddle(walletPublicIdentity, 40)}
                  </Typography>
                  <IconButton
                    onClick={copyToClipboard}
                    size='small'
                    sx={{
                      color: copied
                        ? theme.palette.success.main
                        : theme.palette.text.secondary,
                    }}
                  >
                    {copied ? (
                      <CheckCircleIcon fontSize='small' />
                    ) : (
                      <ContentCopyIcon fontSize='small' />
                    )}
                  </IconButton>
                </Box>

                <Typography
                  variant='body1'
                  textAlign='center'
                  sx={{
                    color:
                      theme.palette.mode === 'dark'
                        ? theme.palette.text.primary
                        : theme.palette.primary.contrastText,
                    fontWeight: 600,
                  }}
                >
                  Balance : {formatQubicAmount(balance)} QUBIC
                </Typography>

                <Button
                  variant='outlined'
                  color='primary'
                  size='large'
                  sx={{
                    mt: 1,
                  }}
                  startIcon={<LockIcon />}
                  onClick={disconnect}
                  fullWidth
                >
                  <Typography variant='button' fontWeight='bold'>
                    Lock Wallet
                  </Typography>
                </Button>
              </>
            ) : (
              <>
                <Box textAlign='center' mb={2}>
                  <Box textAlign='center' mb={2} mt={2}>
                    <AccountBalanceWalletIcon sx={{ fontSize: 48 }} />
                  </Box>

                  <Typography variant='body1' color='text.secondary'>
                    Choose your preferred connection method
                    <Box
                      component='span'
                      sx={{
                        display: 'inline-block',
                        ml: '0.2rem',
                        fontWeight: 'bold',
                        animation: '1s blink step-start infinite',
                        '@keyframes blink': {
                          '50%': { opacity: 0 },
                        },
                      }}
                    >
                      _
                    </Box>
                  </Typography>
                </Box>
                <Button
                  variant='outlined'
                  color='primary'
                  size='large'
                  startIcon={<VpnKeyIcon />}
                  onClick={() => setSelectedWalletMode('private-seed')}
                  fullWidth
                >
                  <Typography variant='button' fontWeight='bold'>
                    Private Seed
                  </Typography>
                </Button>
                <Button
                  variant='outlined'
                  color='primary'
                  size='large'
                  sx={{
                    mb: 2,
                    mt: 1,
                  }}
                  startIcon={<SecurityIcon />}
                  onClick={() => setSelectedWalletMode('vault-file')}
                  fullWidth
                >
                  <Typography variant='button' fontWeight='bold'>
                    Vault File
                  </Typography>
                </Button>
              </>
            )}
          </Box>
        )}

        {/* "private-seed" => Show seed input */}
        {selectedWalletMode === 'private-seed' && (
          <Paper
            elevation={0}
            sx={{
              p: 0,
              my: 2,
              backgroundColor: 'inherit',
              width: '100%',
            }}
          >
            {/* key icon */}
            <Box display='flex' justifyContent='center' alignItems='center'>
              <VpnKeyIcon sx={{ fontSize: 48 }} />
            </Box>

            <Typography
              variant='body1'
              my={2}
              textAlign='center'
              color='text.secondary'
            >
              Enter your 55-character private key (seed)
              <Box
                component='span'
                sx={{
                  display: 'inline-block',
                  ml: '0.2rem',
                  fontWeight: 'bold',
                  animation: '1s blink step-start infinite',
                  '@keyframes blink': {
                    '50%': { opacity: 0 },
                  },
                }}
              >
                _
              </Box>
            </Typography>
            <TextField
              fullWidth
              variant='outlined'
              label='Private Seed'
              value={privateSeed}
              onChange={(e) => privateKeyValidate(e.target.value)}
              error={Boolean(errorMsgPrivateSeed)}
              helperText={errorMsgPrivateSeed || ''}
              InputProps={{
                sx: {
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    backgroundColor: 'transparent',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    backgroundColor: 'transparent',
                  },
                },
              }}
            />
            <Box display='flex' gap={2} mt={3} justifyContent={'center'}>
              <Button
                variant='outlined'
                color='tertiary'
                size='large'
                onClick={() => setSelectedWalletMode('none')}
                sx={{ fontWeight: 600 }}
              >
                CANCEL
              </Button>

              <Button
                variant='outlined'
                color='primary'
                size='large'
                onClick={privateKeyConnect}
                disabled={Boolean(errorMsgPrivateSeed) || !privateSeed}
                sx={{ fontWeight: 600 }}
              >
                UNLOCK
              </Button>
            </Box>
          </Paper>
        )}

        {/* "vault-file" => Show vault file upload */}
        {selectedWalletMode === 'vault-file' && (
          <Paper
            elevation={0}
            sx={{
              p: 0,
              backgroundColor: 'inherit',
              borderRadius: 2,
            }}
          >
            <Box textAlign='center' mb={2} mt={2}>
              <SecurityIcon sx={{ fontSize: 48 }} />
            </Box>
            <Typography
              variant='body1'
              mb={2}
              textAlign='center'
              color='text.secondary'
            >
              Load your Qubic vault file
              <Box
                component='span'
                sx={{
                  display: 'inline-block',
                  ml: '0.2rem',
                  fontWeight: 'bold',
                  animation: '1s blink step-start infinite',
                  '@keyframes blink': {
                    '50%': { opacity: 0 },
                  },
                }}
              >
                _
              </Box>
            </Typography>
            <Typography
              variant='caption'
              display='block'
              mb={2}
              textAlign='center'
            >
              Your vault file contains your encrypted private keys.
            </Typography>
            <Button
              startIcon={<UploadFileIcon />}
              // align="center"
              fullWidth
              variant='outlined'
              color='warning'
              component='label'
              size='large'
              sx={{
                mb: 2,
                fontWeight: 600,
                p: 1,
              }}
            >
              SELECT FILE
              <input type='file' hidden onChange={handleFileChange} />
            </Button>
            {selectedFile && (
              <Typography variant='caption' display='block' mb={2}>
                {selectedFile.name}
              </Typography>
            )}
            <TextField
              fullWidth
              variant='outlined'
              label='Password'
              type='password'
              value={password}
              onChange={handlePasswordChange}
              // InputProps={{
              //   style: { backgroundColor: theme.palette.background.paper },
              // }}
              autoComplete='new-password'
            />
            <Box display='flex' gap={2} mt={2} justifyContent={'center'}>
              <Button
                variant='outlined'
                color='tertiary'
                size='large'
                onClick={() => setSelectedWalletMode('none')}
                sx={{ fontWeight: 600 }}
              >
                CANCEL
              </Button>
              <Button
                variant='outlined'
                color='primary'
                size='large'
                onClick={vaultFileConnect}
                sx={{ fontWeight: 600 }}
              >
                UNLOCK
              </Button>
            </Box>
          </Paper>
        )}

        {/* "account-select" => Show seed selection */}
        {selectedWalletMode === 'account-select' && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              backgroundColor: theme.palette.background.default,
            }}
          >
            <Typography variant='body1' mb={2}>
              Select an account:
            </Typography>
            <FormControl fullWidth>
              <InputLabel id='account-select-label'>Account</InputLabel>
              <Select
                labelId='account-select-label'
                value={selectedAccount}
                label='Account'
                onChange={(e) => setSelectedAccount(e.target.value)}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                }}
              >
                {accounts.map((account, idx) => (
                  <MenuItem key={account.publicId} value={idx}>
                    {`${account.alias} (${account.publicId})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box display='flex' gap={2} mt={2} justifyContent={'center'}>
              <Button
                variant='outlined'
                size='large'
                onClick={() => {
                  disconnect();
                  setSelectedWalletMode('none');
                }}
                sx={{ fontWeight: 600 }}
              >
                LOCK WALLET
              </Button>
              <Button
                variant='contained'
                size='large'
                color='primary'
                onClick={selectAccount}
                sx={{ fontWeight: 600 }}
              >
                SELECT
              </Button>
            </Box>
          </Paper>
        )}

        <Divider
          sx={{
            mt: 1,
          }}
        />

        {/* ------------- Server Connection Section ------------- */}
        <Typography variant='h7' textAlign='center' mb={0} fontWeight={700}>
          Server Connection :
        </Typography>
        {connectedToCustomServer ? (
          <Button
            variant='contained'
            size='large'
            color='primary'
            fullWidth
            onClick={handleServerDisconnect}
          >
            Disconnect from Server
          </Button>
        ) : (
          <>
            {selectedServerMode === 'none' && (
              <Button
                variant='outlined'
                color='tertiary'
                size='large'
                fullWidth
                onClick={() => setSelectedServerMode('server-config')}
                startIcon={<CloudIcon />}
                sx={{ mb: 2 }}
              >
                <Typography variant='button' fontWeight='bold'>
                  Connect to Server
                </Typography>
              </Button>
            )}

            {selectedServerMode === 'server-config' && (
              <Box elevation={2}>
                <TextField
                  fullWidth
                  label='HTTP Endpoint'
                  placeholder='Enter HTTP Endpoint'
                  value={httpEndpointInput}
                  onChange={(e) => setHttpEndpointInput(e.target.value)}
                  // InputProps={{
                  //   style: { backgroundColor: theme.palette.background.paper },
                  // }}
                />
                {errorMsg && (
                  <Typography color='error' mt={1}>
                    {errorMsg}
                  </Typography>
                )}
                <Box display='flex' gap={2} mt={2} justifyContent={'center'}>
                  <Button
                    variant='outlined'
                    color='tertiary'
                    size='large'
                    onClick={() => setSelectedServerMode('none')}
                    sx={{ fontWeight: 600 }}
                  >
                    CANCEL
                  </Button>
                  <Button
                    variant='outlined'
                    size='large'
                    color='primary'
                    onClick={handleServerConnect}
                    sx={{ fontWeight: 600 }}
                  >
                    CONNECT
                  </Button>
                </Box>
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ConnectModal;
