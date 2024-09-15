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
  // const [userLocation, setUserLocation] = useState(null);
  // const locations = [{latitude:19.1011456,longitude:72.8273729}]

  useEffect(() => {
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(
  //       (position) => {
  //         const { latitude, longitude } = position.coords;
  //         setUserLocation({ latitude, longitude });
  //         console.log({ latitude, longitude })
  //       },
  //       (error) => {
  //           // display an error if we cant get the users position
  //           console.error('Error getting user location:', error);
  //       }
  //   );
  // }
  // else {
  //     // display an error if not supported
  //     console.error('Geolocation is not supported by this browser.');
  // }
    try {
      if (firebase.auth().currentUser.uid) {
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
      if(error.name.toLowerCase() !== "typeerror"){
      console.error(error.name)}
    }
  }, [setLoggedInUser, navigate])

  const handleLogin = (e) => {
    e.preventDefault();
    // Implement Firebase authentication here
    firebase.auth().setPersistence('session').then(() =>
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
        }))
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
    <div className="loginPage row justify-content-center align-items-center m-0">
      <div className="col-lg-6 col-md-12 col-sm-12 loginBoxImg">
        {/* Welcome! */}
      </div>
      <div className="col-lg-6 col-md-12 col-sm-12 loginBox">

        <form onSubmit={handleLogin}>
          <h1 className="logintitle col-10">Login</h1>
          <input
            className="col-10"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="col-10"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div
            className="toggleShowPassowrd"
            onClick={toggleShowPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </div>
          <div />
          {errorMessage ? (
            <p
              className="text-danger"
              style={{
                fontSize: "100%",
                marginBottom: "-1%",
                cursor: "pointer",
              }}
            >
              {errorMessage.split(":")[1]}
            </p>
          ) : (
            ""
          )}
          <button className="col-6" onClick={handleLogin}>
            Login &#8594;
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
