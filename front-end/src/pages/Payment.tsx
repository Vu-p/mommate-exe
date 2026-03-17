import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Plus, X } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import './Payment.css';

// Mock images/icons
import visaLogo from '../assets/images/logo.png'; // Using logo as placeholder for small icons

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = location.state || {};
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      const { data } = await api.get(`/bookings/my`); // Simplified; ideally should be GET /bookings/:id
      const currentBooking = data.find((b: any) => b._id === bookingId);
      setBooking(currentBooking);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  };

  const handlePay = async () => {
    if (!booking) return;
    setLoading(true);
    try {
      await api.patch(`/bookings/${booking._id}/status`, { status: 'paid' });
      navigate('/review', { state: { bookingId: booking._id } });
    } catch (error) {
      console.error('Payment failed:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-page">
      <Navbar />

      <main className="container payment-content">
        <div className="payment-layout">
          <section className="payment-methods-section">
            <h1>Payment Method</h1>
            
            <div className="payment-accordion">
              <div className="accordion-item">
                <div className="accordion-header">
                  <span>Google Pay</span>
                  <ChevronRight size={20} />
                </div>
              </div>

              <div className="accordion-item expanded">
                <div className="accordion-header">
                  <span>Debit Card</span>
                  <ChevronDown size={20} />
                </div>
                
                <div className="cards-list">
                  <div className="debit-card-item selected">
                    <div className="card-brand">
                      {/* Placeholder for Mastercard logo */}
                      <div className="brand-circle red"></div>
                      <div className="brand-circle orange"></div>
                      <span>Axim Bank</span>
                    </div>
                    <div className="card-number">**** **** **** 4578</div>
                    <div className="radio-selection">
                      <div className="radio-outer">
                        <div className="radio-inner"></div>
                      </div>
                    </div>
                  </div>

                  <div className="debit-card-item">
                    <div className="card-brand">
                      {/* Placeholder for Visa logo */}
                      <div className="visa-text">VISA</div>
                      <span>HDFC Bank</span>
                    </div>
                    <div className="card-number">**** **** **** 4521</div>
                    <div className="radio-selection">
                      <div className="radio-outer"></div>
                    </div>
                  </div>

                  <button className="btn-add-card">
                    <Plus size={18} />
                    <span>Add New Cards</span>
                  </button>
                </div>
              </div>

              <button className="btn-add-method">
                <Plus size={18} />
                <span>Add New Method</span>
              </button>
            </div>
          </section>

          <aside className="payment-summary-sidebar">
            <div className="summary-card">
              <div className="summary-header">
                <div className="carer-summary-info">
                  <div className="carer-placeholder-img">
                    {booking?.carer?.user?.avatar ? (
                      <img src={booking.carer.user.avatar} alt="Carer" />
                    ) : (
                      <div className="carer-placeholder-circle"></div>
                    )}
                  </div>
                  <div className="carer-text">
                    <h3>{booking?.carer?.user?.firstName || 'Nguyen Thi A'} {booking?.carer?.user?.lastName || ''}</h3>
                    <span className="price">{booking?.totalPrice?.toLocaleString() || '300,000'} VND</span>
                  </div>
                </div>
                <button className="btn-close-summary"><X size={18} /></button>
              </div>

              <div className="summary-section offers">
                <div className="offers-header">
                  <span>Offers</span>
                  <button className="btn-add-code">Add Code</button>
                </div>
              </div>

              <div className="summary-section payment-details">
                <h4>Payment Details</h4>
                <div className="detail-row">
                  <span>Order</span>
                  <span>{booking?.service?.price?.toLocaleString() || '0'} VND</span>
                </div>
                <div className="detail-row">
                  <span>Fee</span>
                  <span>{(2000).toLocaleString()} VND</span>
                </div>
                <div className="detail-row total">
                  <span>Total</span>
                  <span>{(booking?.totalPrice || 0).toLocaleString()} VND</span>
                </div>
              </div>

              <div className="summary-section address-summary">
                <div className="address-dropdown">
                  <span>Address</span>
                  <div className="address-value">
                    <span>12, WLS Regancy</span>
                    <ChevronDown size={16} />
                  </div>
                </div>
              </div>

              <button 
                className="btn-pay-now" 
                onClick={handlePay}
                disabled={loading || !booking}
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
