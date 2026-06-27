import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import About from './pages/About';
import Auth from './pages/Auth';
import FindService from './pages/FindService';
import ServiceDetail from './pages/ServiceDetail';
import FindCarer from './pages/FindCarer';
import CarerDetail from './pages/CarerDetail';
import Booking from './pages/Booking';
import AccountRequests from './pages/AccountRequests';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import Review from './pages/Review';
import AccountProfile from './pages/AccountProfile';
import CarerProfile from './pages/CarerProfile';
import CarerBookings from './pages/CarerBookings';
import CarerContract from './pages/CarerContract';
import ChangePassword from './pages/ChangePassword';
import BookingDetail from './pages/BookingDetail';
import IncidentReport from './pages/IncidentReport';
import NotFound from './pages/NotFound';
import Messages from './pages/Messages';
import CaregiverApplyOverview from './pages/CaregiverApplyOverview';
import CaregiverApplyJob from './pages/CaregiverApplyJob';
import BookingChange from './pages/BookingChange';
import InfoPage from './pages/InfoPage';
import PublicMotion from './components/common/PublicMotion';
import ProtectedRoute from './components/common/ProtectedRoute';
import './styles/global.css';
import './styles/public-redesign.css';
import './styles/protected-pages.css';

import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminServices from './pages/admin/AdminServices';
import AdminCarers from './pages/admin/AdminCarers';
import AdminBookings from './pages/admin/AdminBookings';
import AdminWorkflows from './pages/admin/AdminWorkflows';
import {
  AdminBookingDetail,
  AdminIncidents,
  AdminReconciliation,
  AdminRevenue,
  AdminReviews,
  AdminUsers,
} from './pages/admin/AdminOperations';
import useDocumentTitle from './hooks/useDocumentTitle.ts';
import { isAdminApp } from './config/appMode.ts';

const TitleUpdater = () => {
  const { pathname } = useLocation();

  const title =
    pathname === '/' ? 'Home' :
    pathname.startsWith('/about') ? 'About' :
    pathname.startsWith('/services') ? 'Services' :
    pathname.startsWith('/carers') ? 'Carers' :
    pathname.startsWith('/booking') ? 'Booking' :
    pathname.startsWith('/account/profile') ? 'Account Profile' :
    pathname.startsWith('/account') ? 'Account Requests' :
    pathname.startsWith('/carer/profile') ? 'Carer Profile' :
    pathname.startsWith('/carer/contract') ? 'Carer Contract' :
    pathname.startsWith('/carer/bookings') ? 'Carer Bookings' :
    pathname.startsWith('/payment') ? 'Payment' :
    pathname.startsWith('/review') ? 'Review' :
    pathname.startsWith('/change-password') ? 'Change Password' :
    pathname.startsWith('/auth') ? 'Sign In / Sign Up' :
    pathname.startsWith('/admin') ? 'Admin' :
    'Mommate';

  useDocumentTitle(title);
  return null;
};

function App() {
  if (isAdminApp) {
    return (
      <Router>
        <TitleUpdater />
        <Routes>
          <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/auth" element={<Auth defaultMode="login" />} />
          <Route path="/login" element={<Auth defaultMode="login" />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="carers" element={<AdminCarers />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="bookings/:id" element={<AdminBookingDetail />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="incidents" element={<AdminIncidents />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="reconciliation" element={<AdminReconciliation />} />
            <Route path="workflows" element={<AdminWorkflows />} />
            <Route path="messages/:id" element={<Messages />} />
          </Route>

          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <TitleUpdater />
      <PublicMotion />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<FindService />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/carers" element={<FindCarer />} />
        <Route path="/carers/:id" element={<CarerDetail />} />
        <Route path="/booking" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
        <Route path="/account/request" element={<ProtectedRoute><AccountRequests /></ProtectedRoute>} />
        <Route path="/account/request/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
        <Route path="/bookings/:id/change" element={<ProtectedRoute><BookingChange /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
        <Route path="/payment/success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
        <Route path="/review" element={<ProtectedRoute><Review /></ProtectedRoute>} />
        <Route path="/account/profile" element={<ProtectedRoute><AccountProfile /></ProtectedRoute>} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="/signup" element={<Auth defaultMode="signup" />} />
        <Route path="/login" element={<Auth defaultMode="login" />} />
        <Route path="/carer/profile" element={<ProtectedRoute allowedRoles={['carer']}><CarerProfile /></ProtectedRoute>} />
        <Route path="/carer/apply" element={<ProtectedRoute allowedRoles={['carer']}><CaregiverApplyOverview /></ProtectedRoute>} />
        <Route path="/carer/apply/job" element={<ProtectedRoute allowedRoles={['carer']}><CaregiverApplyJob /></ProtectedRoute>} />
        <Route path="/carer/bookings" element={<ProtectedRoute allowedRoles={['carer']}><CarerBookings /></ProtectedRoute>} />
        <Route path="/carer/bookings/:id" element={<ProtectedRoute allowedRoles={['carer']}><BookingDetail /></ProtectedRoute>} />
        <Route path="/carer/contract" element={<ProtectedRoute allowedRoles={['carer']}><CarerContract /></ProtectedRoute>} />
        <Route path="/incidents/new" element={<ProtectedRoute><IncidentReport /></ProtectedRoute>} />
        <Route path="/messages/:id" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
        {['privacy','terms','help','contact','careers','faq','guide'].map((path) => <Route key={path} path={`/${path}`} element={<InfoPage />} />)}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="carers" element={<AdminCarers />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="bookings/:id" element={<AdminBookingDetail />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="incidents" element={<AdminIncidents />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="reconciliation" element={<AdminReconciliation />} />
          <Route path="workflows" element={<AdminWorkflows />} />
          <Route path="messages/:id" element={<Messages />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
