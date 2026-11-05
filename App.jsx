
import { useState, useEffect } from 'react';
import { searchProperties, uploadPropertyImage, assignImageToProperty } from './services/api';
import './App.css';
import PropertyNotes from './PropertyNotes'; // <-- השאר את הייבוא למעלה
import Notifications from './Notifications';

function App() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cityFilter, setCityFilter] = useState('');
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');

  const fetchProperties = async (city = '') => {
    setLoading(true);
    try {
      const filters = city ? { city } : {};
      const response = await searchProperties(filters);
      if (response.success) {
        setProperties(response.data);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProperties(cityFilter);
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedPropertyId) {
      setUploadMessage('Please select an image file and enter a property ID');
      return;
    }

    try {
      setUploadMessage('Uploading image...');
      const uploadRes = await uploadPropertyImage(selectedFile);
      
      if (uploadRes.success) {
        const assignRes = await assignImageToProperty(selectedPropertyId, uploadRes.data.imageUrl);
        setUploadMessage(assignRes.message || 'Image assigned successfully!');
        fetchProperties(cityFilter);
      }
    } catch (error) {
      console.error('Error during image upload process:', error);
      setUploadMessage('An error occurred while uploading the image');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Real Estate Management System</h1>
      <Notifications />

      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Search Properties</h2>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Filter by city..."
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            style={{ padding: '8px', width: '200px' }}
          />
          <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>Search</button>
        </form>
      </section>

      <section style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Upload Image & Assign to Property</h2>
        <form onSubmit={handleImageUpload} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '300px' }}>
          <label>
            Property ID:
            <input
              type="number"
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              placeholder="e.g. 1"
              style={{ width: '100%', padding: '6px', marginTop: '4px' }}
            />
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setSelectedFile(e.target.files[0])}
          />
          <button type="submit" style={{ padding: '8px', cursor: 'pointer' }}>Upload & Assign Image</button>
        </form>
        {uploadMessage && <p style={{ marginTop: '10px', fontWeight: 'bold' }}>{uploadMessage}</p>}
      </section>

      {/* ========================================================== */}
      {/* כאן בדיוק בתוך ה-return, למשל ממש מתחת לטופס העלאת התמונות: */}
      <PropertyNotes propertyId="1" />
      {/* ========================================================== */}

      <section style={{ marginTop: '30px' }}>
        <h2>Properties List ({properties.length})</h2>
        {loading ? (
          <p>Loading properties...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
            {properties.map((prop) => (
              <div key={prop.id} style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '15px' }}>
                <img
                  src={prop.imageUrl}
                  alt={prop.city}
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px' }}
                />
                <h3>Property #{prop.id} - {prop.city}</h3>
                <p><strong>Type:</strong> {prop.type}</p>
                <p><strong>Price:</strong> ${prop.price?.toLocaleString()}</p>
                {prop.rooms && <p><strong>Rooms:</strong> {prop.rooms}</p>}
                {prop.size && <p><strong>Size:</strong> {prop.size} sqm</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default App;