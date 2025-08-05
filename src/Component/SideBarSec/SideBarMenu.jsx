import React, { useState, useEffect } from 'react';
import { faBars } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './SideBar.css';
import { NavLink } from 'react-router';

const SideBarMenu = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleClickOutside = (event) => {
    const sidebar = document.querySelector('.side-bar-container');
    const menuIcon = document.querySelector('.sidebar-menu-icon');
    if (
      sidebar &&
      !sidebar.contains(event.target) &&
      !menuIcon.contains(event.target)
    ) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : '';
  }, [isSidebarOpen]);

  return (
    <>
      <div className="sidebar-menu-icon" onClick={toggleSidebar}>
        <FontAwesomeIcon icon={faBars} />
      </div>
      <div className={`side-bar-container ${isSidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <img className="logos" src="/images/logo.png" alt="Logo" />
        </div>
        <div className="inner">
          <div className='side-bar'>
            <NavLink to="/userPage" className={({ isActive }) => isActive ? 'link active' : 'link'}>
              <img src="/images/user.svg" alt="" />
              <p>Users</p>
            </NavLink>
          </div>
          <div className='side-bar'>
            <NavLink to="/projectsPage" className={({ isActive }) => isActive ? 'link active' : 'link'}>
              <img src="/images/project.svg" alt="" />
              <p>Projects</p>
            </NavLink>
          </div>
          <div className='side-bar'>
            <NavLink to="/coursePage" className={({ isActive }) => isActive ? 'link active' : 'link'}>
              <img src="/images/course.svg" alt="" />
              <p>Course</p>
            </NavLink>
          </div>
          <div className='side-bar'>
            <NavLink to="/QuizAdd" className={({ isActive }) => isActive ? 'link active' : 'link'}>
              <img src="/images/quiz.svg" alt="" className="svg-quiz" />
              <p>Quizes</p>
            </NavLink>
          </div>
          <div className='side-bar'>
            <NavLink to="/supportPage" className={({ isActive }) => isActive ? 'link active' : 'link'}>
              <img src="/images/support.svg" alt="" />
              <p>Support</p>
            </NavLink>
          </div>
          
          <div className='side-bar'>
            <img src="/images/logout.svg" alt="" />
            <p className='side-bar-logout'>Logout</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default SideBarMenu;
