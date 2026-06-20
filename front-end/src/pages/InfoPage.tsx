import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const content: Record<string, [string, string]> = {
  '/privacy': ['Chính sách bảo mật', 'MomMate chỉ thu thập dữ liệu cần thiết để cung cấp dịch vụ chăm sóc, thanh toán và hỗ trợ an toàn.'],
  '/terms': ['Điều khoản dịch vụ', 'Các booking, chính sách đổi hủy, thanh toán và trách nhiệm của các bên được áp dụng theo thỏa thuận tại thời điểm đặt lịch.'],
  '/help': ['Trung tâm trợ giúp', 'Liên hệ đội ngũ MomMate khi bạn cần hỗ trợ về tài khoản, booking, thanh toán hoặc sự cố an toàn.'],
  '/contact': ['Liên hệ hỗ trợ', 'Email: support@mommate.vn · Hotline: 1900 1234'],
  '/careers': ['Tuyển dụng', 'Theo dõi các cơ hội nghề nghiệp và chương trình hợp tác chuyên gia của MomMate.'],
  '/faq': ['Câu hỏi thường gặp', 'Tìm hiểu cách chọn chuyên gia, đặt lịch, thanh toán, đổi lịch và gửi đánh giá.'],
  '/guide': ['Hướng dẫn đặt lịch', 'Chọn dịch vụ, chọn chuyên gia đã xác minh, nhập hồ sơ chăm sóc và xác nhận thời gian phù hợp.'],
};

const InfoPage = () => {
  const { pathname } = useLocation();
  const [title, description] = content[pathname] || ['MomMate', 'Thông tin đang được cập nhật.'];
  return <div className="stitch-page"><Navbar/><main className="container" style={{minHeight:600,padding:'80px 0'}}><h1>{title}</h1><p style={{maxWidth:760,lineHeight:1.8}}>{description}</p></main><Footer/></div>;
};
export default InfoPage;
