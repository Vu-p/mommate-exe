import { Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { getSocket } from '../utils/socket';
import { isAdminApp } from '../config/appMode';
import './OperationalPages.css';

const Messages = () => {
  const { id } = useParams();
  const { user } = useAuth();
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
    
    // Polling fallback for Vercel Serverless
    const intervalId = window.setInterval(() => void load(), 5000);
    
    return () => { 
      socket.off('message:new', onMessage); 
      window.clearInterval(intervalId);
    };
  }, [id, load]);

  const send = async () => {
    if (!body.trim() || !id) return;
    const { data } = await api.post(`/messages/conversations/${id}/messages`, { body: body.trim() });
    setMessages((items) => items.some((item) => item._id === data._id) ? items : [...items, data]);
    setBody('');
  };

  return (
    <div className="stitch-page messages-page">
      {!isAdminApp && <Navbar />}
      <main className="container messages-shell">
        <header className="messages-heading">
          <h1>Tin nhắn</h1>
        </header>
        <section className="messages-thread" aria-live="polite">
          {messages.map((message) => {
            const isOwn = message.sender?._id === user?._id || message.sender === user?._id;
            return (
              <article className={isOwn ? 'message-bubble is-own' : 'message-bubble'} key={message._id}>
                <strong>{message.sender?.firstName} {message.sender?.lastName}</strong>
                <p>{message.body}</p>
              </article>
            );
          })}
        </section>
        <div className="message-composer">
          <input
            value={body}
            onChange={(event) => setBody(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void send()}
            placeholder="Nhập tin nhắn..."
            aria-label="Nội dung tin nhắn"
          />
          <button className="primary" onClick={send} disabled={!body.trim()}><Send /> Gửi</button>
        </div>
      </main>
    </div>
  );
};

export default Messages;
