import { Shield, Users, ThumbsUp } from 'lucide-react';
import './Values.css';

const valuesData = [
  {
    icon: <Shield size={24} className="v-icon" />,
    title: 'Quy trình xác minh',
    desc: 'Xác minh hồ sơ nhân thân, bằng cấp, chứng chỉ và các kinh nghiệm để phụ huynh an tâm tuyệt đối.'
  },
  {
    icon: <Users size={24} className="v-icon" />,
    title: 'Kết nối an toàn',
    desc: 'Dễ dàng gặp gỡ chuyên gia, trao đổi công việc chăm sóc mẹ và bé một cách thuận tiện, an toàn.'
  },
  {
    icon: <ThumbsUp size={24} className="v-icon" />,
    title: 'Đánh giá thực tế',
    desc: 'Đọc các đánh giá từ những gia đình khác để lựa chọn chuyên gia phù hợp.'
  }
];

const Values = () => {
  return (
    <section className="values-figma">
      <div className="container values-container-figma">
        <div className="values-intro-figma">
           <span className="label">TẠI SAO BẠN CÓ THỂ AN TÂM?</span>
           <h2>Giá trị cốt lõi của Mommate</h2>
        </div>
        
        <div className="values-grid-figma">
          {valuesData.map((v, i) => (
            <div key={i} className="value-item-figma">
              <div className="icon-box-figma">{v.icon}</div>
              <div className="value-text-figma">
                <h4>{v.title}</h4>
                <p>{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Values;
