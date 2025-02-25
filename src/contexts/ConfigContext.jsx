import React, { createContext, useContext, useState, useEffect } from 'react';

// Default endpoints
const DEFAULT_HTTP_ENDPOINT = 'https://rpc.qubic.org';

// Testnet endpoints
// const DEFAULT_HTTP_ENDPOINT = 'https://91.210.226.146'
// const DEFAULT_BACKEND_URL = 'https://qbtn.qubic.org'

const ConfigContext = createContext();

export const ConfigProvider = ({ children }) => {
  const [httpEndpoint, setHttpEndpoint] = useState(DEFAULT_HTTP_ENDPOINT);
  const [connectedToCustomServer, setConnectedToCustomServer] = useState(false);

  useEffect(() => {
    const savedHttpEndpoint = localStorage.getItem('httpEndpoint');

    if (savedHttpEndpoint) {
      setHttpEndpoint(savedHttpEndpoint);
      setConnectedToCustomServer(true);
    }
  }, []);

  const resetEndpoints = () => {
    setHttpEndpoint(DEFAULT_HTTP_ENDPOINT);
    setConnectedToCustomServer(false);
    localStorage.removeItem('httpEndpoint');
  };

  const updateEndpoints = (newHttpEndpoint) => {
    setHttpEndpoint(newHttpEndpoint);
    setConnectedToCustomServer(true);

    localStorage.setItem('httpEndpoint', newHttpEndpoint);
  };

  return (
    <ConfigContext.Provider
      value={{
        httpEndpoint,
        connectedToCustomServer,
        resetEndpoints,
        updateEndpoints,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = () => useContext(ConfigContext);
