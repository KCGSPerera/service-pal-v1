'use client';

import React, { useEffect } from 'react';

import { CheckCircle, AlertTriangle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {type === 'success' ? <CheckCircle size={20} color="white" /> : <AlertTriangle size={20} color="white" />}
      </div>
      <div>{message}</div>
      <button 
        onClick={onClose} 
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginLeft: 'auto'
        }}
      >
        ×
      </button>
    </div>
  );
}
