import React from "react";
import { Link } from "react-router-dom";
import firebase from "firebase/compat/app";
import "../styles/PageNotFound.css";

const PageNotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Oops! Page Not Found</h2>
        <p>
          The page you are looking for might have been removed, had its name
          changed, or is temporarily unavailable.
        </p>
        <Link
          to="/Register"
          className="btn-home"
          onClick={() => firebase.auth().signOut()}
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
};

export default PageNotFound;
