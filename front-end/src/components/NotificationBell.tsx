import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getSocket } from '../utils/socket';

const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    api.get('/notifications', { params: { page: 1, limit: 10 } }).then(({ data }) => { setItems(data.items || []); setUnread(data.unread || 0); }).catch(() => undefined);
    const socket = getSocket();
    socket.connect();
    const receive = (notification: any) => { setItems((current) => [notification, ...current].slice(0, 10)); setUnread((value) => value + 1); };
    socket.on('notification:new', receive);
    return () => { socket.off('notification:new', receive); };
  }, []);
  const select = async (item: any) => {
    if (!item.readAt) { await api.patch(`/notifications/${item._id}/read`); setUnread((value) => Math.max(0, value - 1)); }
    if (item.data?.bookingId) navigate(`/account/request/${item.data.bookingId}`);
    setOpen(false);
  };
  return <div className="notification-bell"><button type="button" aria-label="Thông báo" onClick={() => setOpen((value) => !value)}><Bell size={20}/>{unread > 0 && <i>{unread}</i>}</button>{open && <section><header><strong>Thông báo</strong><button onClick={async()=>{await api.patch('/notifications/read-all');setUnread(0);}}><CheckCheck size={18}/></button></header>{items.map((item)=><button key={item._id} className={item.readAt?'':'unread'} onClick={()=>select(item)}><strong>{item.title}</strong><small>{item.body}</small></button>)}{items.length===0&&<p>Chưa có thông báo.</p>}</section>}</div>;
};
export default NotificationBell;
