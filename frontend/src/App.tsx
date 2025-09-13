import { AppProviders } from '@/providers/AppProviders';
import { AppRouter } from '@/routes';

const App = () => (
  <AppProviders>
    <AppRouter />
  </AppProviders>
);

export default App;
