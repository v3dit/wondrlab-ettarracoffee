import React from 'react';
import { Navigate } from 'react-router-dom';
import firebase from "firebase/compat/app";

const ProtectedRoute = ({ children }) => {
  const user = firebase.auth().currentUser;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute; 