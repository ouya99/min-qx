import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ConnectModal from './ConnectModal';
import { useQubicConnect } from './QubicConnectContext';
import { motion } from 'framer-motion';
import { useTheme } from '@mui/material/styles';

const ConnectLink = () => {
  const { connected, showConnectModal, toggleConnectModal } = useQubicConnect();
  const theme = useTheme();
  const lg = useMediaQuery(theme.breakpoints.up('lg'));
  const [isHovered, setIsHovered] = useState(false);

  const icon = connected ? (
    <AccountBalanceWalletIcon
      sx={{
        color: connected
          ? theme.palette.primary.main
          : theme.palette.secondary.main,
      }}
    />
  ) : (
    <LockOpenIcon color='tertiary' />
  );

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {lg ? (
          <Button
            onClick={toggleConnectModal}
            variant='outlined'
            color={connected ? 'primary' : 'tertiary'}
            startIcon={
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {icon}
              </Box>
            }
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Stack direction='row' alignItems='center' spacing={1}>
              <Typography
                variant='body1'
                fontWeight='bold'
                sx={{ letterSpacing: 0.5 }}
              >
                {connected ? 'WALLET' : 'UNLOCK WALLET'}
              </Typography>
            </Stack>
          </Button>
        ) : (
          <Box
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <IconButton
              onClick={toggleConnectModal}
              sx={{
                p: 0.5,
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: 'transparent',
                },
                color:
                  theme.palette.mode === 'dark'
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.primary,
              }}
            >
              {icon}
            </IconButton>
          </Box>
        )}
      </motion.div>

      <ConnectModal open={showConnectModal} onClose={toggleConnectModal} />
    </>
  );
};

export default ConnectLink;
