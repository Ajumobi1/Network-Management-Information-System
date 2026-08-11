import { BrowserRouter } from 'react-router-dom';
import { RootProviders } from './providers/RootProviders';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <RootProviders>
        <AppRoutes />
      </RootProviders>
    </BrowserRouter>
  );
}
