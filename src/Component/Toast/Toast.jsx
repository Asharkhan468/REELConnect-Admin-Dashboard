import React from 'react';
import './Toast.css';

const Toast = ({ type, message }) => {
  const isSuccess = type === 'success';

  return (
    <div className={`custom-toast ${isSuccess ? 'success' : 'error'}`}>
      <div className="toast-icon">{isSuccess ? '✅' : '❌'}</div>
      <div className="toast-text">{message}</div>
    </div>
  );
};

export default Toast;
