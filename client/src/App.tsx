import { Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import DashboardPage from './pages/DashboardPage';
import StationDetailPage from './pages/StationDetailPage';
import DistrictsPage from './pages/DistrictsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="station/:id" element={<StationDetailPage />} />
        <Route path="districts" element={<DistrictsPage />} />
      </Route>
    </Routes>
  );
}
