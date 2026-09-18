import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Sparkles, ExternalLink } from 'lucide-react';
import { hotelService } from '../../services/hotelService';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { formatINR } from '../../utils/currency';

const AdminHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const toast = useToast();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    latitude: 40.7128,
    longitude: -74.006,
    priceFrom: 250,
    hotelType: 'hotel',
    featured: false,
    images: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    amenities: 'Free WiFi, Swimming Pool, Spa, Fitness Center, Restaurant'
  };

  const [formData, setFormData] = useState(initialForm);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const res = await hotelService.getHotels({ limit: 50 });
      if (res.success) {
        setHotels(res.data.hotels || []);
      }
    } catch (err) {
      console.error('Failed to load hotels:', err);
      toast.error('Failed to load hotels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleOpenCreate = () => {
    setEditingHotel(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (hotel) => {
    setEditingHotel(hotel);
    setFormData({
      name: hotel.name,
      description: hotel.description,
      address: hotel.address,
      city: hotel.city,
      country: hotel.country,
      latitude: hotel.latitude,
      longitude: hotel.longitude,
      priceFrom: hotel.priceFrom,
      hotelType: hotel.hotelType,
      featured: hotel.featured,
      images: Array.isArray(hotel.images) ? hotel.images.join('\n') : '',
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities.join(', ') : ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        ...formData,
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
        priceFrom: Number(formData.priceFrom),
        images: formData.images.split('\n').map((url) => url.trim()).filter(Boolean),
        amenities: formData.amenities.split(',').map((a) => a.trim()).filter(Boolean)
      };

      if (editingHotel) {
        await hotelService.updateHotel(editingHotel._id, payload);
        toast.success('Property updated successfully');
      } else {
        await hotelService.createHotel(payload);
        toast.success('New property added to collection');
      }

      setModalOpen(false);
      fetchHotels();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save hotel');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (hotelId, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" and all associated rooms?`)) {
      return;
    }

    try {
      await hotelService.deleteHotel(hotelId);
      toast.success('Hotel and inventory removed');
      fetchHotels();
    } catch (err) {
      toast.error('Failed to remove hotel');
    }
  };

  const filteredHotels = hotels.filter((h) =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="admin-page-title">Property Catalog Management</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Configure hotel metadata, geographic coordinates, starting rates, and amenities
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={18} /> Add New Hotel
        </button>
      </div>

      <div className="table-card">
        <div className="table-toolbar">
          <div style={{ position: 'relative', width: '320px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search by hotel, city, country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', fontSize: '0.88rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            Total Properties: <strong>{filteredHotels.length}</strong>
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Destination</th>
                <th>Type</th>
                <th>Rate From</th>
                <th>Rating</th>
                <th>Featured</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredHotels.map((h) => (
                <tr key={h._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={h.images?.[0] || ''}
                        alt={h.name}
                        style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                      />
                      <div>
                        <strong style={{ color: 'var(--color-primary)' }}>{h.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {h.address}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>{h.city}, {h.country}</td>
                  <td>
                    <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                      {h.hotelType}
                    </span>
                  </td>
                  <td style={{ fontWeight: 700 }}>{formatINR(h.priceFrom)}/nt</td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {h.rating} &starf;
                    </span>{' '}
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      ({h.reviewCount})
                    </span>
                  </td>
                  <td>
                    {h.featured ? (
                      <span className="badge badge-gold">Featured</span>
                    ) : (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>Standard</span>
                    )}
                  </td>
                  <td>
                    <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                      <a
                        href={`/hotels/${h._id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-ghost btn-sm"
                        title="View Public Page"
                      >
                        <ExternalLink size={15} />
                      </a>
                      <button
                        onClick={() => handleOpenEdit(h)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Hotel"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(h._id, h.name)}
                        className="btn btn-outline btn-sm"
                        style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        title="Delete Hotel"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT HOTEL MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingHotel ? `Edit Property: ${editingHotel.name}` : 'Add New Luxury Property'}
        maxWidth="750px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Property Name *</label>
            <input
              type="text"
              className="form-control"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Description *</label>
            <textarea
              className="form-control"
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Street Address *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">City *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Country *</label>
              <input
                type="text"
                className="form-control"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Latitude *</label>
              <input
                type="number"
                step="any"
                className="form-control"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Longitude *</label>
              <input
                type="number"
                step="any"
                className="form-control"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Starting Price (₹ INR) *</label>
              <input
                type="number"
                className="form-control"
                required
                value={formData.priceFrom}
                onChange={(e) => setFormData({ ...formData, priceFrom: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Property Type</label>
              <select
                className="form-select"
                value={formData.hotelType}
                onChange={(e) => setFormData({ ...formData, hotelType: e.target.value })}
              >
                <option value="hotel">Hotel</option>
                <option value="resort">Resort</option>
                <option value="boutique">Boutique</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Image URLs (one URL per line) *</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="https://images.unsplash.com/..."
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
              required
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Amenities (comma-separated)</label>
            <input
              type="text"
              className="form-control"
              value={formData.amenities}
              onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <input
              type="checkbox"
              id="featured-checkbox"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--color-accent)' }}
            />
            <label htmlFor="featured-checkbox" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
              Mark as Featured Premier Property
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingHotel ? 'Update Property' : 'Create Property'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminHotels;
