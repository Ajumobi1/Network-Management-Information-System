import { BrowserRouter } from 'react-router-dom';
import { RootProviders } from './providers/RootProviders';
import AppRoutes from './routes/AppRoutes';
import ConnectivityBanner from './components/system/ConnectivityBanner';
import ErrorBoundary from './components/system/ErrorBoundary';
import HorizontalScrollManager from './components/system/HorizontalScrollManager';

export default function App() {
  return (
    <BrowserRouter>
      <RootProviders>
        <HorizontalScrollManager />
        <ConnectivityBanner />
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </RootProviders>
    </BrowserRouter>
  );
}
