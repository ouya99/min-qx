import { useContext } from 'react';
import { ApiContext } from './ApiContext';

export const useApiContext = () => useContext(ApiContext);
