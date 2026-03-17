import { useEffect, useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import ImageUpload from '../components/common/ImageUpload';
import { useAuth } from '../context/AuthContext';
import './Review.css';

const Review = () => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [carerId, setCarerId] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  
  const [username, setUsername] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [email, setEmail] = useState(user?.email || '');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = location.state || {};

  useEffect(() => {
    const fetchBookingDetails = async () => {
      if (bookingId) {
        try {
          // Get specific booking to avoid finding in a large array.
          // Using /my to avoid 403 admin-only restrictions on GET /
          const { data } = await api.get(`/bookings/my`);
          const booking = data.find((b: any) => b._id === bookingId);
          if (booking) {
            // carrer can be populated or not
            setCarerId(booking.carer?._id || booking.carer);
          }
        } catch (error) {
          console.error('Error fetching booking for review:', error);
        }
      }
    };
    fetchBookingDetails();
  }, [bookingId]);

  const tags = [
    'good', 'Fair', 'Medium', 'Bad', 'Failed',
    'Oily', 'Combination', 'Dry', 'Sensitive'
  ];

  const handlePost = async () => {
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }
    if (!carerId) {
      alert('Carer information missing. Cannot post review.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/reviews', {
        bookingId,
        carerId,
        rating,
        title,
        comment,
        tags: selectedTags,
        images
      });
      navigate('/account/request');
    } catch (error) {
      console.error('Review submission failed:', error);
      alert('Failed to post review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-page">
      <Navbar />

      <main className="container review-content">
        <div className="review-form-container">
          <header className="review-header">
            <button className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
            <button 
              className="btn-post" 
              onClick={handlePost}
              disabled={loading}
            >
              {loading ? <Loader2 className="spinner" size={18} /> : 'Post'}
            </button>
          </header>

          <section className="rating-section">
            <label>Score:</label>
            <div className="stars-container">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={32}
                  className={star <= rating ? 'star active' : 'star'}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </section>

          <div className="review-inputs">
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Title" 
                className="review-title-input" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            
            <div className="input-group">
              <textarea 
                placeholder="Review:" 
                className="review-textarea"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="media-section">
            <div className="uploaded-images">
              {images.map((img, idx) => (
                <div key={idx} className="preview-item">
                  <img src={img} alt="Review" />
                  <button className="btn-remove-img" onClick={() => setImages(images.filter((_, i) => i !== idx))}>×</button>
                </div>
              ))}
            </div>
            <div className="media-upload-area">
              <ImageUpload onUploadSuccess={(url: string) => setImages([...images, url])} />
            </div>
          </div>

          <section className="tags-section">
            <label>Option 1:</label>
            <div className="tags-grid">
              {tags.map((tag) => (
                <button
                  key={tag}
                  className={`tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`}
                  onClick={() => {
                    if (selectedTags.includes(tag)) {
                      setSelectedTags(selectedTags.filter(t => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </section>

          <div className="user-info-inputs">
            <div className="input-group shadow-input">
              <label>*Username:</label>
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Your name"
              />
            </div>
            
            <div className="input-group shadow-input">
              <label>*Email:</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="example@email.com" 
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Review;
