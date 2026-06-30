import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { getSocket } from '../utils/socket';

type NotificationItem = {
  _id: string;
  title?: string;
  body?: string;
  readAt?: string | null;
  data?: {
    bookingId?: string;
  };
};

type PanelPosition = {
  top: number;
  left: number;
  width: number;
};

const getPanelPosition = (button: HTMLButtonElement): PanelPosition => {
  const rect = button.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const width = Math.min(360, Math.max(300, viewportWidth - 32));
  const left = Math.min(Math.max(16, rect.right - width), viewportWidth - width - 16);

  return {
    top: rect.bottom + 10,
    left,
    width,
  };
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<PanelPosition | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api
      .get('/notifications', { params: { page: 1, limit: 10 } })
      .then(({ data }) => {
        setItems(data.items || []);
        setUnread(data.unread || 0);
      })
      .catch(() => undefined);

    const socket = getSocket();
    socket.connect();
    const receive = (notification: NotificationItem) => {
      setItems((current) => [notification, ...current].slice(0, 10));
      setUnread((value) => value + 1);
    };
    socket.on('notification:new', receive);
    return () => {
      socket.off('notification:new', receive);
    };
  }, []);

  useEffect(() => {
    if (!open || !triggerRef.current) return;

    const updatePosition = () => {
      if (triggerRef.current) setPosition(getPanelPosition(triggerRef.current));
    };

    const closeOnOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };

    updatePosition();
    document.addEventListener('mousedown', closeOnOutsideClick);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  const markAllAsRead = async () => {
    await api.patch('/notifications/read-all');
    setUnread(0);
    setItems((current) => current.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })));
  };

  const select = async (item: NotificationItem) => {
    if (!item.readAt) {
      await api.patch(`/notifications/${item._id}/read`);
      setUnread((value) => Math.max(0, value - 1));
    }
    if (item.data?.bookingId) navigate(`/account/request/${item.data.bookingId}`);
    setOpen(false);
  };

  const panel = open && position
    ? createPortal(
        <section
          ref={panelRef}
          className="notification-panel-portal"
          style={{ top: position.top, left: position.left, width: position.width }}
          aria-label="Thông báo"
        >
          <header>
            <strong>Thông báo</strong>
            <button type="button" onClick={markAllAsRead} aria-label="Đánh dấu tất cả đã đọc">
              <CheckCheck size={18} />
            </button>
          </header>
          <div className="notification-panel-list">
            {items.map((item) => (
              <button key={item._id} type="button" className={item.readAt ? '' : 'unread'} onClick={() => select(item)}>
                <strong>{item.title || 'Thông báo mới'}</strong>
                <small>{item.body || 'Bạn có một cập nhật mới từ MomMate.'}</small>
              </button>
            ))}
            {items.length === 0 && <p>Chưa có thông báo.</p>}
          </div>
        </section>,
        document.body,
      )
    : null;

  return (
    <div className="notification-bell">
      <button
        ref={triggerRef}
        type="button"
        aria-label="Thông báo"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={20} />
        {unread > 0 && <i>{unread}</i>}
      </button>
      {panel}
    </div>
  );
};

export default NotificationBell;
