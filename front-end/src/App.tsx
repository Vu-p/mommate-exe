import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import FindService from './pages/FindService';
import ServiceDetail from './pages/ServiceDetail';
import FindCarer from './pages/FindCarer';
import CarerDetail from './pages/CarerDetail';
import Booking from './pages/Booking';
import AccountRequests from './pages/AccountRequests';
import Payment from './pages/Payment';
import Review from './pages/Review';
import './styles/global.css';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminServices from './pages/admin/AdminServices';
import AdminCarers from './pages/admin/AdminCarers';
import AdminBookings from './pages/admin/AdminBookings';
import useDocumentTitle from './hooks/useDocumentTitle.ts';

const TitleUpdater = () => {
  const { pathname } = useLocation();

  const title =
    pathname === '/' ? 'Home' :
    pathname.startsWith('/services') ? 'Services' :
    pathname.startsWith('/carers') ? 'Carers' :
    pathname.startsWith('/booking') ? 'Booking' :
    pathname.startsWith('/account') ? 'Account Requests' :
    pathname.startsWith('/payment') ? 'Payment' :
    pathname.startsWith('/review') ? 'Review' :
    pathname.startsWith('/auth') ? 'Sign In / Sign Up' :
    pathname.startsWith('/admin') ? 'Admin' :
    'Mommate';

  useDocumentTitle(title);
  return null;
};

function App() {
  return (
    <Router>
      <TitleUpdater />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/services" element={<FindService />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/carers" element={<FindCarer />} />
        <Route path="/carers/:id" element={<CarerDetail />} />
        <Route path="/booking" element={<Booking />} />
        <Route path="/account/request" element={<AccountRequests />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/review" element={<Review />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="carers" element={<AdminCarers />} />
          <Route path="bookings" element={<AdminBookings />} />
        </Route>

        <Route path="/signup" element={<Navigate to="/auth" replace />} />
        <Route path="/login" element={<Navigate to="/auth" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
