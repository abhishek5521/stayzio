import React from 'react';
import Modal from '../common/Modal';
import MapView from './MapView';

const MapModal = ({ isOpen, onClose, hotels, selectedHotelId, onMarkerClick }) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Explore Hotels on Map" maxWidth="900px">
      <div style={{ height: '70vh', width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
        <MapView
          hotels={hotels}
          selectedHotelId={selectedHotelId}
          onMarkerClick={onMarkerClick}
          height="100%"
        />
      </div>
    </Modal>
  );
};

export default MapModal;
