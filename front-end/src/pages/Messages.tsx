import { Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { EmptyState, ErrorState, LoadingState } from '../components/common/DesignFoundation';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const { data } = await api.get(`/messages/conversations/${id}/messages`, { params: { page: 1, limit: 100 } });
      setMessages(data.items || []);
      setError('');
      await api.patch(`/messages/conversations/${id}/read`);
    } catch {
      setError('Không thể tải cuộc trò chuyện này.');
    } finally {
      setLoading(false);
    }
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
    try {
      const { data } = await api.post(`/messages/conversations/${id}/messages`, { body: body.trim() });
      setMessages((items) => items.some((item) => item._id === data._id) ? items : [...items, data]);
      setBody('');
      setError('');
    } catch {
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    }
  };

  return (
    <div className="stitch-page messages-page">
      {!isAdminApp && <Navbar />}
      <main className="container messages-shell">
        <header className="messages-heading">
          <h1>Tin nhắn</h1>
        </header>
        <section className="messages-thread" aria-live="polite">
          {loading ? (
            <LoadingState className="messages-state" title="Đang tải tin nhắn..." />
          ) : error ? (
            <div className="messages-state">
              <ErrorState title={error} />
              <button type="button" className="outline" onClick={() => void load()}>Thử lại</button>
            </div>
          ) : messages.length === 0 ? (
            <EmptyState className="messages-state" title="Chưa có tin nhắn" description="Hãy bắt đầu cuộc trò chuyện khi bạn sẵn sàng." />
          ) : messages.map((message) => {
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
