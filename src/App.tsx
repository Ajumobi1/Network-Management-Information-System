import { BrowserRouter } from 'react-router-dom';
import { RootProviders } from './providers/RootProviders';
import AppRoutes from './routes/AppRoutes';
import ConnectivityBanner from './components/system/ConnectivityBanner';
import ErrorBoundary from './components/system/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
      <RootProviders>
        <ConnectivityBanner />
        <ErrorBoundary>
          <AppRoutes />
        </ErrorBoundary>
      </RootProviders>
    </BrowserRouter>
  );
}
