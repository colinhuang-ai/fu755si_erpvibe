import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { StoreProvider } from './store';
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

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Device>
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
        </Device>
      </HashRouter>
    </StoreProvider>
  );
}
