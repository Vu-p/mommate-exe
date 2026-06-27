import { Loader2, RotateCcw, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import api from '../utils/api';
import './CarerContract.css';
import './CarerRedesign.css';

const CarerContract = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  
  const [contract, setContract] = useState<any>(null);
  const [accepted, setAccepted] = useState(false);
  const [signed, setSigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [signatureLoadFailed, setSignatureLoadFailed] = useState(false);

  const loadContract = async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/contracts/me');
      setContract(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi kết nối khi tải hợp đồng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadContract();
  }, []);

  useEffect(() => {
    setSignatureLoadFailed(false);
  }, [contract?.signatureImage]);

  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height
    };
  };

  const start = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const p = point(event);
    drawing.current = true;
    context.beginPath();
    context.moveTo(p.x, p.y);
    context.lineWidth = 3;
    context.strokeStyle = '#193d22';
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const context = canvasRef.current?.getContext('2d');
    if (!context) return;
    const p = point(event);
    context.lineTo(p.x, p.y);
    context.stroke();
    setSigned(true);
  };

  const stop = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    setSigned(false);
  };

  const submit = async () => {
    if (!accepted || !signed) return;
    setSubmitting(true);
    setError('');
    try {
      const dataUrl = canvasRef.current?.toDataURL('image/png');
      if (!dataUrl) throw new Error('Không thể lấy dữ liệu chữ ký.');

      // Convert base64 to file
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'signature.png', { type: 'image/png' });

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const signatureUrl = uploadRes.data.url;

      // Submit contract with URL
      const { data } = await api.post('/contracts/me/sign', {
        acceptedTerms: true,
        signatureImage: signatureUrl
      });
      setContract(data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Ký hợp đồng thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="contract-page carer-contract-page">
        <Navbar />
        <main className="stitch-state">
          <Loader2 className="spinner" size={32} />
          <p style={{ marginTop: '1rem' }}>Đang tải hợp đồng...</p>
        </main>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="contract-page carer-contract-page">
        <Navbar />
        <main className="container contract-shell">
          <div className="contract-error-state">
            <ShieldAlert size={48} className="error-icon" />
            <h2>Không thể tải hợp đồng</h2>
            <p>{error || 'Hợp đồng của bạn chưa được thiết lập hoặc không tìm thấy.'}</p>
            <button className="btn-primary" onClick={loadContract}>Thử lại</button>
            <Link to="/carer/profile" className="btn-secondary" style={{ display: 'block', marginTop: '10px' }}>Quay lại hồ sơ</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isSigned = contract.status === 'signed';
  const isVoided = contract.status === 'voided';

  return (
    <div className="contract-page carer-contract-page">
      <Navbar />
      <main className="container contract-shell">
        {isVoided && (
          <div className="voided-banner">
            <ShieldAlert size={20} />
            <div>
              <strong>Hợp đồng đã bị hủy hoặc vô hiệu lực</strong>
              <p>Hợp đồng này không còn giá trị pháp lý. Vui lòng liên hệ với quản trị viên nếu bạn cần hỗ trợ thêm.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="contract-alert-error">
            {error}
          </div>
        )}

        <motion.div 
          className="contract-layout"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <section className="contract-document-card">
            <header>
              <div>
                <h1>{contract.templateTitle || 'Hợp đồng hợp tác chuyên gia'}</h1>
                <p>Mã hợp đồng: #{String(contract._id || '').slice(-10).toUpperCase()}</p>
              </div>
              <span className={`status-badge ${contract.status}`}>
                {isSigned ? 'ĐÃ KÝ' : isVoided ? 'BỊ HỦY' : 'CHƯA KÝ'}
              </span>
            </header>
            <article>
              <h2>{contract.templateTitle}</h2>
              <p className="effective">Phiên bản: {contract.templateVersion}</p>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                {contract.contractText}
              </div>
            </article>
          </section>

          <aside className="contract-sign-panel">
            <h2>{isSigned ? 'Hợp đồng đã hoàn tất' : isVoided ? 'Trạng thái hợp đồng' : 'Hoàn tất thỏa thuận'}</h2>
            
            {isSigned ? (
              <>
                <div className="signed-stamp">
                  <ShieldCheck size={32} />
                  <p>Đã ký điện tử thành công</p>
                  <small>Lúc {new Date(contract.signedAt).toLocaleString('vi-VN')}</small>
                </div>
                {contract.signatureImage && !signatureLoadFailed && (
                  <div className="signature-preview">
                    <img src={contract.signatureImage} alt="Chữ ký" onError={() => setSignatureLoadFailed(true)} />
                  </div>
                )}
                {contract.signatureImage && signatureLoadFailed && (
                  <div className="signature-preview signature-fallback" role="status">
                    <ShieldAlert size={24} />
                    <strong>Chữ ký không tải được</strong>
                    <span>Thông tin ký điện tử vẫn được ghi nhận. Vui lòng thử lại sau hoặc liên hệ hỗ trợ nếu cần đối chiếu.</span>
                  </div>
                )}
              </>
            ) : isVoided ? (
              <div className="voided-panel">
                <p>Bạn không thể ký hợp đồng này do hợp đồng đã ở trạng thái hủy.</p>
              </div>
            ) : (
              <>
                <label className="agreement-check">
                  <input 
                    type="checkbox" 
                    checked={accepted} 
                    onChange={e => setAccepted(e.target.checked)} 
                  />
                  <span>Tôi đã đọc và đồng ý với tất cả các điều khoản và điều kiện được nêu trong Thỏa thuận hợp tác.</span>
                </label>
                
                <h3>Chữ ký điện tử</h3>
                <div className="signature-box">
                  <button onClick={clear} type="button" aria-label="Xóa chữ ký"><RotateCcw size={16} /></button>
                  <canvas 
                    ref={canvasRef} 
                    width={600} 
                    height={220} 
                    onPointerDown={start} 
                    onPointerMove={draw} 
                    onPointerUp={stop}
                    onPointerLeave={stop}
                    style={{ touchAction: 'none' }} 
                  />
                  <span>Ký bằng chuột hoặc chạm</span>
                </div>
                
                <button 
                  className="sign-submit" 
                  disabled={!accepted || !signed || submitting} 
                  onClick={submit}
                >
                  {submitting ? 'Đang gửi...' : 'Ký & Gửi thỏa thuận'}
                </button>
              </>
            )}

            <footer>
              <ShieldCheck size={16} />
              <p>Chữ ký điện tử được lưu cùng thời gian, địa chỉ IP và thiết bị ký.</p>
            </footer>
          </aside>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default CarerContract;
