import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider, useSession } from './store';
import Login, { Splash } from './pages/Login';
import { Device, TabBar } from './ui/Device';
import { UIProvider } from './ui/overlay';
import { SheetHost } from './sheets';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Attendance from './pages/Attendance';
import Finance from './pages/Finance';
import Learning from './pages/Learning';
import CourseDetail from './pages/CourseDetail';
import Profile from './pages/Profile';

function Gate() {
  const session = useSession();
  if (session === undefined) return <Splash />;
  if (!session) return <Login />;
  return (
    <StoreProvider key={session.user.id} session={session}>
          <UIProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id" element={<JobDetail />} />
              <Route path="/att" element={<Attendance />} />
              <Route path="/fin" element={<Finance />} />
              <Route path="/learn" element={<Learning />} />
              <Route path="/learn/:id" element={<CourseDetail />} />
              <Route path="/me" element={<Profile />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <TabBar />
            <SheetHost />
          </UIProvider>
    </StoreProvider>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Device>
        <Gate />
      </Device>
    </HashRouter>
  );
}
