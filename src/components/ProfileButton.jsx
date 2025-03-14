import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import '../styles/ProfileButton.css';

// Default profile icon as fallback
const DEFAULT_PROFILE_ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

const ProfileButton = ({ onClick }) => {
  const location = useLocation();
  const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE_ICON);
  const [imageLoaded, setImageLoaded] = useState(false);
  const retryTimeoutRef = useRef(null);
  const retryCountRef = useRef(0);
  const maxRetries = 10; // Maximum number of retries
  const retryDelay = 2000; // Retry every 2 seconds
  
  // Only show the button on the main menu page (landing page)
  const shouldShowButton = location.pathname === '/menu' || location.pathname === '/';
  
  // Function to fetch user profile image
  const fetchUserProfile = async () => {
    try {
      const user = firebase.auth().currentUser;
      
      if (user) {
        // Check if user has a photoURL from Google
        if (user.photoURL) {
          // Test if the image URL is valid and accessible
          testImageUrl(user.photoURL);
        } else {
          // If user is signed in with Google but photoURL is not available
          // Try to get it from the provider data
          const googleProvider = user.providerData.find(
            provider => provider.providerId === 'google.com'
          );
          
          if (googleProvider && googleProvider.photoURL) {
            testImageUrl(googleProvider.photoURL);
          } else {
            // If no provider data available, schedule a retry
            scheduleRetry();
          }
        }
      }
    } catch (error) {
      console.error("Error fetching profile image:", error);
      scheduleRetry();
    }
  };

  // Function to test if an image URL is valid
  const testImageUrl = (url) => {
    const img = new Image();
    
    img.onload = () => {
      // Image loaded successfully
      setProfileImage(url);
      setImageLoaded(true);
      retryCountRef.current = 0; // Reset retry count on success
      clearTimeout(retryTimeoutRef.current);
    };
    
    img.onerror = () => {
      // Image failed to load, schedule a retry
      console.log(`Failed to load image from URL: ${url}, retrying...`);
      scheduleRetry();
    };
    
    // Start loading the image
    img.src = url;
  };

  // Function to schedule a retry
  const scheduleRetry = () => {
    if (retryCountRef.current < maxRetries) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = setTimeout(() => {
        retryCountRef.current += 1;
        console.log(`Retrying profile image fetch (${retryCountRef.current}/${maxRetries})...`);
        fetchUserProfile();
      }, retryDelay);
    }
  };

  // Effect to start fetching the profile image
  useEffect(() => {
    if (shouldShowButton) {
      fetchUserProfile();
      
      // Set up an auth state listener to update the profile image when auth state changes
      const unsubscribe = firebase.auth().onAuthStateChanged(() => {
        retryCountRef.current = 0; // Reset retry count on auth state change
        setImageLoaded(false);
        fetchUserProfile();
      });
      
      return () => {
        unsubscribe();
        clearTimeout(retryTimeoutRef.current);
      };
    }
  }, [shouldShowButton]);

  // Effect to refresh the profile image periodically if it hasn't loaded yet
  useEffect(() => {
    if (shouldShowButton && !imageLoaded) {
      const refreshInterval = setInterval(() => {
        if (!imageLoaded) {
          console.log("Periodic refresh: attempting to fetch profile image again...");
          fetchUserProfile();
        }
      }, 30000); // Try every 30 seconds
      
      return () => clearInterval(refreshInterval);
    }
  }, [shouldShowButton, imageLoaded]);
  
  if (!shouldShowButton) {
    return null;
  }
  
  return (
    <button 
      className="profile-circle-button" 
      onClick={onClick}
      aria-label="User Profile"
    >
      <img 
        src={profileImage} 
        alt="Profile" 
        className="profile-button-image"
        onError={() => {
          console.log("Image failed to load in render, retrying...");
          scheduleRetry();
        }}
      />
    </button>
  );
};

export default ProfileButton; 