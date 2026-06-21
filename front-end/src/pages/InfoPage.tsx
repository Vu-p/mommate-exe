import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const content: Record<string, { title: string; paragraphs: string[] }> = {
  '/privacy': { title: 'Chính sách bảo mật', paragraphs: ['MomMate chỉ thu thập dữ liệu cần thiết để quản lý tài khoản, hồ sơ chăm sóc, booking, thanh toán và hỗ trợ an toàn.', 'Thông tin sức khỏe và thông tin liên hệ chỉ được chia sẻ cho các bên có quyền truy cập theo booking.'] },
  '/terms': { title: 'Điều khoản dịch vụ', paragraphs: ['Giá, lịch, chính sách đổi hủy và trách nhiệm của các bên được xác nhận tại thời điểm đặt lịch.', 'MomMate không thay thế dịch vụ cấp cứu hoặc chẩn đoán tại cơ sở y tế.'] },
  '/help': { title: 'Trung tâm trợ giúp', paragraphs: ['Bạn có thể kiểm tra trạng thái booking trong mục Đơn đặt, gửi yêu cầu đổi/hủy từ trang chi tiết hoặc báo cáo sự cố gắn với booking đã phát sinh.', 'Đối với lỗi website hoặc tài khoản, hãy sử dụng trang Liên hệ hỗ trợ.'] },
  '/careers': { title: 'Tuyển dụng và hợp tác', paragraphs: ['MomMate đang ưu tiên xây dựng mạng lưới chuyên gia chăm sóc mẹ và bé tại Đà Nẵng.', 'Chuyên gia có thể tạo hồ sơ, cung cấp chứng chỉ và theo dõi trạng thái xét duyệt trực tiếp trên hệ thống.'] },
  '/faq': { title: 'Câu hỏi thường gặp', paragraphs: ['Chỉ chuyên gia đã xác minh và đang nhận booking mới xuất hiện trong marketplace.', 'Giá cuối cùng được backend tính theo dịch vụ, thời lượng và số buổi trước khi booking được tạo.'] },
  '/guide': { title: 'Hướng dẫn đặt lịch', paragraphs: ['Chọn dịch vụ, lọc chuyên gia theo khu vực và lịch khả dụng, kiểm tra hồ sơ rồi tạo yêu cầu đặt lịch.', 'Sau khi chuyên gia chấp nhận, gia đình thanh toán và theo dõi tiến trình trong mục Đơn đặt.'] },
};

const InfoPage = () => {
  const { pathname } = useLocation();
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL?.trim();
  const contactPhone = import.meta.env.VITE_CONTACT_PHONE?.trim();
  const page = pathname === '/contact'
    ? { title: 'Liên hệ hỗ trợ', paragraphs: ['Gửi thông tin lỗi website, vấn đề tài khoản hoặc yêu cầu hỗ trợ booking cho đội ngũ MomMate.'] }
    : content[pathname] || { title: 'MomMate', paragraphs: ['Nội dung đang được cập nhật.'] };

  return <div className="stitch-page"><Navbar /><main className="container info-page-content" style={{ minHeight: 600, padding: '80px 0' }}>
    <h1>{page.title}</h1>
    {page.paragraphs.map((paragraph) => <p key={paragraph} style={{ maxWidth: 760, lineHeight: 1.8 }}>{paragraph}</p>)}
    {pathname === '/contact' && <div className="info-contact-actions">
      {contactEmail && <a href={`mailto:${contactEmail}`}>Email: {contactEmail}</a>}
      {contactPhone && <a href={`tel:${contactPhone.replace(/\s/g, '')}`}>Hotline: {contactPhone}</a>}
      {!contactEmail && !contactPhone && <p>Thông tin liên hệ chính thức chưa được cấu hình.</p>}
      <Link to="/account/request">Kiểm tra booking của tôi</Link>
    </div>}
  </main><Footer /></div>;
};

export default InfoPage;
