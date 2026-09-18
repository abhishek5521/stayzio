import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Bed, Users } from 'lucide-react';
import { hotelService } from '../../services/hotelService';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { formatINR } from '../../utils/currency';

const AdminRooms = () => {
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialForm = {
    name: '',
    description: '',
    roomType: 'deluxe',
    pricePerNight: 8500,
    totalRooms: 6,
    capacityAdults: 2,
    capacityChildren: 1,
    bedsCount: 1,
    bedsType: 'King Bed',
    amenities: 'Balcony, Smart TV, High-Speed Wi-Fi, Mini Bar, Marble Bath',
    images: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'
  };

  const [formData, setFormData] = useState(initialForm);

  // Load hotels
  useEffect(() => {
    const loadHotels = async () => {
      try {
        const res = await hotelService.getHotels({ limit: 50 });
        if (res.success && res.data.hotels?.length > 0) {
          setHotels(res.data.hotels);
          setSelectedHotelId(res.data.hotels[0]._id);
        }
      } catch (err) {
        toast.error('Failed to load hotels list');
      }
    };
    loadHotels();
  }, []);

  // Load rooms for selected hotel
  const fetchRooms = async () => {
    if (!selectedHotelId) return;
    try {
      setLoading(true);
      const res = await hotelService.getRoomsByHotel(selectedHotelId);
      if (res.success) {
        setRooms(res.data.rooms || []);
      }
    } catch (err) {
      toast.error('Failed to load room inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [selectedHotelId]);

  const handleOpenCreate = () => {
    setEditingRoom(null);
    setFormData(initialForm);
    setModalOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      description: room.description || '',
      roomType: room.roomType || 'standard',
      pricePerNight: room.pricePerNight,
      totalRooms: room.totalRooms,
      capacityAdults: room.capacity?.adults || 2,
      capacityChildren: room.capacity?.children || 0,
      bedsCount: room.beds?.count || 1,
      bedsType: room.beds?.type || 'King Bed',
      amenities: Array.isArray(room.amenities) ? room.amenities.join(', ') : '',
      images: Array.isArray(room.images) ? room.images.join('\n') : ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        hotel: selectedHotelId,
        name: formData.name,
        description: formData.description,
        roomType: formData.roomType,
        pricePerNight: Number(formData.pricePerNight),
        totalRooms: Number(formData.totalRooms),
        capacity: {
          adults: Number(formData.capacityAdults),
          children: Number(formData.capacityChildren),
          totalGuests: Number(formData.capacityAdults) + Number(formData.capacityChildren)
        },
        beds: {
          count: Number(formData.bedsCount),
          type: formData.bedsType
        },
        amenities: formData.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        images: formData.images.split('\n').map((u) => u.trim()).filter(Boolean)
      };

      if (editingRoom) {
        await hotelService.updateRoom(editingRoom._id, payload);
        toast.success('Room configuration updated');
      } else {
        await hotelService.createRoom(payload);
        toast.success('New room added to property inventory');
      }

      setModalOpen(false);
      fetchRooms();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (roomId, name) => {
    if (!window.confirm(`Delete room "${name}" from property?`)) return;
    try {
      await hotelService.deleteRoom(roomId);
      toast.success('Room removed from inventory');
      fetchRooms();
    } catch (err) {
      toast.error('Failed to delete room');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="admin-page-title">Room Inventory & Configuration</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Configure room types, rates, capacity, bed arrangements, and physical inventory
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary" disabled={!selectedHotelId}>
          <Plus size={18} /> Add Room to Property
        </button>
      </div>

      {/* Hotel Selection Filter */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-primary)' }}>
          Select Property:
        </label>
        <select
          className="form-select"
          value={selectedHotelId}
          onChange={(e) => setSelectedHotelId(e.target.value)}
          style={{ maxWidth: '400px' }}
        >
          {hotels.map((h) => (
            <option key={h._id} value={h._id}>
              {h.name} ({h.city}, {h.country})
            </option>
          ))}
        </select>
      </div>

      {/* Rooms Table */}
      <div className="table-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Beds</th>
                <th>Rate / Night</th>
                <th>Inventory</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                    Loading rooms...
                  </td>
                </tr>
              ) : rooms.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                    No rooms configured for this property yet.
                  </td>
                </tr>
              ) : (
                rooms.map((room) => (
                  <tr key={room._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={room.images?.[0] || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=150&q=80'}
                          alt={room.name}
                          style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                        />
                        <div>
                          <strong style={{ color: 'var(--color-primary)' }}>{room.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {room.amenities?.slice(0, 3).join(', ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {room.roomType}
                      </span>
                    </td>
                    <td>{room.capacity?.totalGuests} Guests</td>
                    <td>{room.beds?.count} {room.beds?.type}</td>
                    <td style={{ fontWeight: 800, color: 'var(--color-primary)' }}>
                      {formatINR(room.pricePerNight)}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        {room.totalRooms} Rooms
                      </span>
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenEdit(room)}
                          className="btn btn-secondary btn-sm"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(room._id, room.name)}
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT ROOM MODAL */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingRoom ? `Edit Room: ${editingRoom.name}` : 'Add Room to Property'}
        maxWidth="650px"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Room Title *</label>
            <input
              type="text"
              className="form-control"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Room Category</label>
              <select
                className="form-select"
                value={formData.roomType}
                onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
              >
                <option value="standard">Standard</option>
                <option value="deluxe">Deluxe</option>
                <option value="suite">Suite</option>
                <option value="executive">Executive</option>
                <option value="penthouse">Penthouse</option>
                <option value="family">Family</option>
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Price per Night (₹ INR) *</label>
              <input
                type="number"
                className="form-control"
                required
                value={formData.pricePerNight}
                onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Inventory (Total Rooms) *</label>
              <input
                type="number"
                min={1}
                className="form-control"
                required
                value={formData.totalRooms}
                onChange={(e) => setFormData({ ...formData, totalRooms: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Adults Capacity</label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={formData.capacityAdults}
                onChange={(e) => setFormData({ ...formData, capacityAdults: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Children Capacity</label>
              <input
                type="number"
                min={0}
                className="form-control"
                value={formData.capacityChildren}
                onChange={(e) => setFormData({ ...formData, capacityChildren: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Beds Count</label>
              <input
                type="number"
                min={1}
                className="form-control"
                value={formData.bedsCount}
                onChange={(e) => setFormData({ ...formData, bedsCount: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Bed Type</label>
              <input
                type="text"
                className="form-control"
                placeholder="King Bed / 2 Queen Beds"
                value={formData.bedsType}
                onChange={(e) => setFormData({ ...formData, bedsType: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Image URLs (one URL per line)</label>
            <textarea
              className="form-control"
              rows={2}
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingRoom ? 'Update Room' : 'Add Room'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminRooms;
