import { BrowserRouter } from 'react-router-dom';
import { RootProviders } from './providers/RootProviders';
import AppRoutes from './routes/AppRoutes';
import ConnectivityBanner from './components/system/ConnectivityBanner';

export default function App() {
  return (
    <BrowserRouter>
      <RootProviders>
        <ConnectivityBanner />
        <AppRoutes />
      </RootProviders>
    </BrowserRouter>
  );
}
