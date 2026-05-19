import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { PlayerNotificationsProvider } from './context/PlayerNotificationsContext';
import { WalletProvider } from './context/WalletContext';
import { VipColorsProvider } from './context/VipColorsContext';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SocketProvider>
          <PlayerNotificationsProvider>
            <WalletProvider>
              <VipColorsProvider>
                <App />
              </VipColorsProvider>
            </WalletProvider>
          </PlayerNotificationsProvider>
        </SocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
);
