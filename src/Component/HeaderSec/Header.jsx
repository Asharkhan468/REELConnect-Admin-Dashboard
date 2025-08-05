import { useLocation } from "react-router";
import "./Header.css";
import React, { useEffect, useState, useRef } from "react";
import SideBarMenu from "../SideBarSec/SideBarMenu";
import { setSearch } from "../../redux/reducer/SearchSlice";
import { useDispatch } from "react-redux";
import {  ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { db , storage } from "../../firebaseConfig";
const Header = () => {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [user, setUser] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setPreviewUrl(userData.profilePhoto || "");
    }
  }, []);

 

  const getHeading = (path) => {
    switch (path) {
      case "/":
        return "Home";
      case "/userPage":
        return "Users";
      case "/projectsPage":
        return "Projects";
      case "/coursePage":
        return "Course";
      case "/supportPage":
        return "Support";
        case "/QuizAdd":
        return "Quizes";
      case "/showcaseFilm":
        return "Showcase Film";
      default:
        return "Page";
    }
  };

  const handleSearch = (event) => {
    const query = event.target.value.trim();
    dispatch(setSearch(query));
    setSearchTerm(query);
  };

  const handleImageClick = () => {
    setShowModal(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !user?.userId) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `profile-photos/${user.userId}`);
      
      // Upload file to Firebase Storage
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update user document in Firestore
      const userRef = doc(db, "users", user.userId);
      await updateDoc(userRef, {
        profilePhoto: downloadURL
      });

      // Update local storage and state
      const updatedUser = { ...user, profilePhoto: downloadURL };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setPreviewUrl(downloadURL);

      setShowModal(false);
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <>
      <div className="header-container">
        <div className="inner-header-container">
          <div className="side-bar-menu">
            <SideBarMenu />
          </div>
          <div className="head">
            <h1>{getHeading(location.pathname)}</h1>
          </div>

          <div className="search-flex">
       {location.pathname !== "/supportPage" && (
  <div className="search">
    <input
      type="text"
      placeholder="Search for something"
      className="search-input"
      value={searchTerm}
      onChange={handleSearch}
    />
    <img
      src="/images/search.png"
      alt="Search"
      className="search-icon"
    />
  </div>
)}

            <div className="avatar" onClick={handleImageClick}>
  <img 
    src={user.profilePhoto || "https://firebasestorage.googleapis.com/v0/b/image-to-url-converter-9483c.appspot.com/o/anonymous%40gmail.com%20%2B%201753085191639?alt=media&token=624cdeae-8142-4d5d-abca-42de7710a6d0"} 
    alt="Profile" 
    className="avatar-image"
  />
  <div className="edit-icon-small">
   <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="11" 
              height="11" 
              fill="white" 
              viewBox="0 0 16 16"
            >
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
            </svg>
  </div>
</div>

          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
     {showModal && (
  <div className="modal-overlay">
    <div className="image-upload-modal">
      <div className="modal-header">
        <h3>Change Profile Photo</h3>
        <button 
          className="close-btn" 
          onClick={() => setShowModal(false)}
        >
          &times;
        </button>
      </div>
      
      <div className="image-upload-container">
        <div className="profile-image-wrapper">
          <img 
            src={previewUrl || userImage} 
            alt="Profile" 
            className="profile-image" 
          />
          <div 
            className="edit-icon"
            onClick={triggerFileInput}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              fill="white" 
              viewBox="0 0 16 16"
            >
              <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175l-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />
      
      <div className="modal-actions">
        {previewUrl && (
          <button 
            className="btn-upload"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Save Changes'}
          </button>
        )}
      </div>
    </div>
  </div>
)}
    </>
  );
};

export default Header;