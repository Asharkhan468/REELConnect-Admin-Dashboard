import React, { useEffect, useState } from 'react'
import './Support.css';
import Inbox from './Inbox';
import Chat from './Chat';


const Support = () => {

  const [selectedUser, setSelectedUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleBack = () => setSelectedUser(null);

  return (
    <div className="support-container">
      {(!isMobile || !selectedUser) && (
      <Inbox onSelectUser={setSelectedUser} selectedUser={selectedUser} />
          )}
      {(!isMobile || selectedUser) && (
      <Chat selectedUser={selectedUser}  onBack={handleBack} isMobile={isMobile}/>
       )}
    </div>
  );
};

export default Support;
