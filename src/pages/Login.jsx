import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "../styles/Login.css";

const Login = ({ setLoggedInUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      if (firebase.auth().currentUser?.uid) {
        setLoggedInUser(firebase.auth().currentUser.uid);
        // Track successful login event
        window.gtag("event", "session_continued", {
          event_category: "loggned_in_with_persistence",
          event_label: "logged_in",
          user: firebase.auth().currentUser.email
        });
        navigate("/dashboard");
      }
    }
    catch (error) {
      if (error.name.toLowerCase() !== "typeerror") {
        console.error(error.name)
      }
    }
  }, [setLoggedInUser, navigate])

  const handleLogin = (e) => {
    e.preventDefault();
    // Implement Firebase authentication here

    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const loggedInUser = userCredential.user.uid;

        //const idToken = userCredential.user.getIdToken(); // Retrieve ID token
        //localStorage.setItem('userToken', idToken);

        setLoggedInUser(loggedInUser);
        // Track successful login event
        window.gtag("event", "login", {
          event_category: "email/password",
          event_label: "logged_in",
        });
        navigate("/dashboard");
      })
      .catch((error) => {
        // Track login failed event
        window.gtag("event", "login_failed", {
          event_category: "email/password",
          event_label: error.message,
        });
        // Handle login error
        setErrorMessage(error.message);
        console.error("Login Error:", error);
      });
  };

  const toggleShowPassword = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-container">
          <div className="logo">ಎ</div>
        </div>
        <div className="form-container">
          <h1>Login</h1>
          <form onSubmit={handleLogin}>
            <div className="input-group">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="input-group">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span 
                className="show-password"
                onClick={toggleShowPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </span>
            </div>
            {errorMessage && (
              <div className="error-message">
                {errorMessage.split(":")[1]}
              </div>
            )}
            <button type="submit">
              Login →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
