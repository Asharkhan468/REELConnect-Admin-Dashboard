import React from 'react';
import { faPencil } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import "./Course.css";

const CourseEditBtn = ({ onClick }) => {
  return (
   
      <FontAwesomeIcon icon={faPencil} className="edit-btn"
      onClick={onClick} />
  );
};

export default CourseEditBtn;