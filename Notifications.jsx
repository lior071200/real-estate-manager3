import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newMsg, setNewMsg] = useState('');

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications`);
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleAddNotification = async (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/notifications`, { message: newMsg });
      if (response.data.success) {
        setNewMsg('');
        fetchNotifications();
      }
    } catch (error) {
      console.error('Error adding notification:', error);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block', marginBottom: '20px' }}>
      {/* כפתור הפעמון */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          fontSize: '20px',
          padding: '8px 16px',
          cursor: 'pointer',
          borderRadius: '20px',
          border: '1px solid #ccc',
          background: '#fff'
        }}
      >
        🔔 התראות ({notifications.length})
      </button>

      {/* חלונית ההתראות שנפתחת */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '45px',
            right: '0',
            width: '320px',
            backgroundColor: '#fff',
            border: '1px solid #ddd',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '15px',
            zIndex: 1000,
            direction: 'rtl'
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: '10px' }}>תזכורות והתראות</h3>

          {/* טופס הוספת תזכורת מהירה */}
          <form onSubmit={handleAddNotification} style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="הוסף תזכורת חדשה..."
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #ccc' }}
            />
            <button type="submit" style={{ padding: '6px 12px', cursor: 'pointer', borderRadius: '6px' }}>+</button>
          </form>

          {/* רשימת ההתראות */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <p style={{ color: '#888', fontSize: '14px' }}>אין התראות חדשות</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid #eee',
                    fontSize: '13px',
                    textAlign: 'right'
                  }}
                >
                  <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{n.message}</p>
                  <span style={{ fontSize: '10px', color: '#999' }}>
                    {new Date(n.date).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;