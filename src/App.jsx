// src/App.js
import React from 'react';
import MainView from './MainView';
import { QubicConnectProvider } from './connect/QubicConnectContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { ApiProvider } from './contexts/ApiContext';
import { SnackbarProvider } from './contexts/SnackbarContext';

function App() {
  return (
    <ConfigProvider>
      <QubicConnectProvider>
        <ApiProvider>
          <SnackbarProvider>
            <MainView />
          </SnackbarProvider>
        </ApiProvider>
      </QubicConnectProvider>
    </ConfigProvider>
  );
}

export default App;
