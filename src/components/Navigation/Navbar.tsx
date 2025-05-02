import React from 'react';
import './Navbar.css';

interface NavbarProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  showLogout?: boolean;
  onLogout?: () => void;
  username?: string;
  avatarUrl?: string;
}

const Navbar: React.FC<NavbarProps> = ({
  title,
  showBackButton = false,
  onBack,
  showLogout = false,
  onLogout,
  username,
  avatarUrl
}) => {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        {showBackButton && (
          <button 
            className="navbar-back-button" 
            onClick={onBack}
            aria-label="Go back"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Back</span>
          </button>
        )}
        <h1 className="navbar-title">{title}</h1>
      </div>
      
      <div className="navbar-right">
        {username && avatarUrl && (
          <div className="navbar-user-info">
            <span className="navbar-username">{username}</span>
            <img 
              src={avatarUrl} 
              alt={`${username}'s avatar`} 
              className="navbar-avatar"
            />
          </div>
        )}
        
        {showLogout && (
          <button 
            className="navbar-logout-button" 
            onClick={onLogout}
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;