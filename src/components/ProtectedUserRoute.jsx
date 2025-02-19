import React from 'react';
import { Navigate } from 'react-router-dom';
import firebase from "firebase/compat/app";

const ProtectedUserRoute = ({ children }) => {
  const user = firebase.auth().currentUser;
  
  if (!user) {
    console.log("No user found, redirecting to login");
    return <Navigate to="/user-login" replace />;
  }

  console.log("User authenticated, allowing access");
  return children;
};

export default ProtectedUserRoute; 