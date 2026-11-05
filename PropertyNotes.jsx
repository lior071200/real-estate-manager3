import { useState } from 'react';

// eslint-disable-next-line react/prop-types
function PropertyNotes({ propertyId }) {
  const [noteText, setNoteText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      const response = await fetch(`http://localhost:5000/api/properties/${propertyId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note: noteText }),
      });

      const data = await response.json();
      if (data.success) {
        setStatusMessage('ההערה נשמרה בהצלחה!');
        setNoteText('');
      } else {
        setStatusMessage('אירעה שגיאה בשמירת ההערה.');
      }
    } catch (error) {
      console.error('Error adding note:', error);
      setStatusMessage('שגיאה בתקשורת עם השרת.');
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', marginTop: '10px' }}>
      <h4>הוספת הערה לנכס (מזהה: {propertyId})</h4>
      <form onSubmit={handleAddNote}>
        <textarea
          rows="3"
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
          placeholder="רשמי כאן הערה חדשה..."
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />
        <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>
          שמור הערה
        </button>
      </form>
      {statusMessage && <p style={{ marginTop: '8px', color: 'green' }}>{statusMessage}</p>}
    </div>
  );
}

export default PropertyNotes;