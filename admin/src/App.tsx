import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthGate } from './auth';
import { FeedbackProvider } from './ui/feedback';
import { Shell } from './ui/Shell';
import Dashboard from './pages/Dashboard';
import Jobs from './pages/Jobs';
import Drivers from './pages/Drivers';
import DriverDetail from './pages/DriverDetail';
import Attendance from './pages/Attendance';
import Finance from './pages/Finance';
import Training from './pages/Training';
import Requests from './pages/Requests';
import StaffPage from './pages/Staff';

export default function App() {
  return (
    <FeedbackProvider>
      <AuthGate>
        <HashRouter>
          <Shell>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/drivers/:id" element={<DriverDetail />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/finance" element={<Finance />} />
              <Route path="/training" element={<Training />} />
              <Route path="/requests" element={<Requests />} />
              <Route path="/staff" element={<StaffPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Shell>
        </HashRouter>
      </AuthGate>
    </FeedbackProvider>
  );
}
