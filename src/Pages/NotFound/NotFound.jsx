// src/components/NotFound.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css'; // custom CSS file

const NotFound = () => {
  return (
   <div className="not-found-container">
  <img
    src="/public/images/not-found.gif"  // image path yahan adjust karein
    alt="404 Not Found"
    className="error-image"
  />
  <h2 className="error-message">Page Not Found</h2>
  <p className="error-description">
    Oops! The page you're looking for doesn't exist.
  </p>
  <Link to="/" className="back-home-btn">
    Go to Homepage
  </Link>
</div>

  );
};

export default NotFound;
