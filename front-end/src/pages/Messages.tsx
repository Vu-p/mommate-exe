import { Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import './OperationalPages.css';

const Messages = () => {
  const { id } = useParams();
  const [messages, setMessages] = useState<any[]>([]);
  const [body, setBody] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const { data } = await api.get(`/messages/conversations/${id}/messages`, { params: { page: 1, limit: 100 } });
    setMessages(data.items || []);
    await api.patch(`/messages/conversations/${id}/read`);
  }, [id]);

  useEffect(() => {
    void load();
    const socket = getSocket();
    socket.connect();
    socket.emit('conversation:join', id);
    const onMessage = (message: any) => setMessages((items) => items.some((item) => item._id === message._id) ? items : [...items, message]);
    socket.on('message:new', onMessage);
    return () => { socket.off('message:new', onMessage); };
  }, [id, load]);

  const send = async () => {
    if (!body.trim() || !id) return;
    const { data } = await api.post(`/messages/conversations/${id}/messages`, { body: body.trim() });
    setMessages((items) => items.some((item) => item._id === data._id) ? items : [...items, data]);
    setBody('');
  };

  return <div className="stitch-page"><Navbar/><main className="container" style={{maxWidth:900,padding:'48px 0'}}><h1>Tin nhắn</h1><section className="booking-detail-card" style={{minHeight:500}}>{messages.map((message) => <article key={message._id} style={{padding:'12px 0',borderBottom:'1px solid #ddd'}}><strong>{message.sender?.firstName} {message.sender?.lastName}</strong><p>{message.body}</p></article>)}</section><div style={{display:'flex',gap:12,marginTop:16}}><input style={{flex:1,padding:14}} value={body} onChange={(event)=>setBody(event.target.value)} onKeyDown={(event)=>event.key==='Enter'&&void send()} placeholder="Nhập tin nhắn..."/><button className="primary" onClick={send}><Send/> Gửi</button></div></main></div>;
};

export default Messages;
