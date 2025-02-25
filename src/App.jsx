// src/App.js
import React from 'react';
import MainView from './MainView';
import { QubicConnectProvider } from './connect/QubicConnectContext';
import { ConfigProvider } from './contexts/ConfigContext';
import { QxProvider } from './contexts/QxContext';
import { SnackbarProvider } from './contexts/SnackbarContext';

function App() {
  return (
    <ConfigProvider>
      <QubicConnectProvider>
        <QxProvider>
          <SnackbarProvider>
            <MainView />
          </SnackbarProvider>
        </QxProvider>
      </QubicConnectProvider>
    </ConfigProvider>
  );
}

export default App;
