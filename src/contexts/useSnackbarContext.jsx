import { useContext } from 'react';
import { SnackbarContext } from './SnackbarContext';

// Create a custom hook to use the Snackbar context
export const useSnackbar = () => {
  return useContext(SnackbarContext);
};
