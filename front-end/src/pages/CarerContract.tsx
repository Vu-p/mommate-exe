import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Eraser, FileSignature, Loader2, PenLine } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import './CarerContract.css';

interface Contract {
  _id: string;
  status: 'pending' | 'signed' | 'voided';
  templateVersion: string;
  templateTitle: string;
  contractText: string;
  signatureImage?: string;
  signedAt?: string;
}

const CarerContract = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'carer')) {
      navigate('/auth?mode=login');
      return;
    }

    if (!authLoading && user?.role === 'carer' && user.mustChangePassword) {
      navigate('/change-password');
      return;
    }

    if (!authLoading && user?.role === 'carer') {
      fetchContract();
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || contract?.status === 'signed') return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.lineWidth = 2.6;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.strokeStyle = '#24323f';
  }, [contract]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/contracts/me');
      setContract(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  const getCanvasPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const startDrawing = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const point = getCanvasPoint(event);
    drawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;

    const context = canvasRef.current?.getContext('2d');
    if (!context) return;

    const point = getCanvasPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    drawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature || !acceptedTerms) {
      setError('Vui lòng tick đồng ý và ký tên trước khi gửi.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const { data } = await api.post('/contracts/me/sign', {
        signatureImage: canvas.toDataURL('image/png'),
        acceptedTerms,
      });
      setContract(data);
      setAcceptedTerms(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể ký hợp đồng.');
    } finally {
      setSubmitting(false);
    }
  };

  const isSigned = contract?.status === 'signed';

  return (
    <div className="contract-page">
      <Navbar />
      <main className="container contract-shell">
        <nav className="breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span>/</span>
          <Link to="/carer/bookings">Lịch carer</Link>
          <span>/</span>
          <span>Hợp đồng của tôi</span>
        </nav>

        <section className="contract-card">
          <div className="contract-heading">
            <div>
              <p className="section-eyebrow">Carer agreement</p>
              <h1>Hợp đồng điện tử</h1>
            </div>
            <span className={`contract-status ${isSigned ? 'signed' : 'pending'}`}>
              {isSigned ? 'Đã ký' : 'Chưa ký'}
            </span>
          </div>

          {error && <div className="form-alert">{error}</div>}

          {loading || authLoading ? (
            <div className="contract-loading">
              <Loader2 className="spinner" />
              <p>Đang tải hợp đồng...</p>
            </div>
          ) : contract ? (
            <>
              <div className="contract-meta">
                <span>{contract.templateTitle}</span>
                <span>Phiên bản: {contract.templateVersion}</span>
                {contract.signedAt && <span>Ký lúc: {new Date(contract.signedAt).toLocaleString('vi-VN')}</span>}
              </div>

              <article className="contract-document">{contract.contractText}</article>

              {isSigned ? (
                <div className="signed-panel">
                  <CheckCircle2 size={22} />
                  <div>
                    <strong>Hợp đồng đã được ký.</strong>
                    <p>Bạn có thể nhận lịch và thực hiện check-in/check-out trên hệ thống MomMate.</p>
                  </div>
                  {contract.signatureImage && <img src={contract.signatureImage} alt="Chữ ký điện tử" />}
                </div>
              ) : (
                <div className="signature-section">
                  <label className="contract-check">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                    />
                    <span>Tôi đã đọc, hiểu và đồng ý với nội dung hợp đồng hợp tác MomMate.</span>
                  </label>

                  <div className="signature-toolbar">
                    <div>
                      <PenLine size={18} />
                      <span>Ký tên trong khung bên dưới</span>
                    </div>
                    <button type="button" className="clear-signature-btn" onClick={clearSignature}>
                      <Eraser size={16} /> Xóa chữ ký
                    </button>
                  </div>

                  <canvas
                    ref={canvasRef}
                    className="signature-pad"
                    width={900}
                    height={240}
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerLeave={stopDrawing}
                  />

                  <div className="contract-actions">
                    <Link to="/carer/bookings" className="contract-secondary-btn">
                      Quay lại lịch
                    </Link>
                    <button
                      type="button"
                      className="contract-primary-btn"
                      disabled={submitting || !acceptedTerms || !hasSignature}
                      onClick={handleSign}
                    >
                      {submitting ? <Loader2 className="spinner" size={18} /> : <FileSignature size={18} />}
                      Ký hợp đồng
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="empty-text">Chưa có hợp đồng để hiển thị.</p>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CarerContract;
