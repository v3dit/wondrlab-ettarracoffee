import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import img9 from "../assets/kaapiFest/landing.png";
import ProfileButton from '../components/ProfileButton';
import firebase from 'firebase/compat/app';
import database from '../config/FirbaseConfig';

import "../styles/LandingKaapiFest.css";
import Ettarra from "../assets/Lookxettarra.png";
import video from "../assets/games.mov";
import video2 from "../assets/games.mp4";

const Landing = () => {
    const [index, setIndex] = useState(0)
    const SOT = [
        "Life is what happens between coffee and wine.",
        "Todays good mood is sponsored by coffee.",
        "Coffee like coca*ne but better",
        "I'd rather take coffee than compliments",
        "E = mc² (Energy = my coffee²)",
        "Yawn: A silent scream of coffee",
        "Stay Grounded"]

    const location = useLocation();
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();

    // Parse query parameters from the URL
    const params = new URLSearchParams(location.search);
    const Section = params.get('Section');
    const Table = params.get('Table');

    if (Section !== null) {
        localStorage.setItem('looksEttarraSection', (Section));
    }
    if (Table !== null) {
        localStorage.setItem('looksEttarraTable', (Table));
    }
    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % 7);
        }, 60000);

        const fetchUserName = async () => {
            const user = firebase.auth().currentUser;
            if (user) {
                try {
                    const userRef = database.ref(`users/${user.uid}`);
                    const snapshot = await userRef.once('value');
                    const userData = snapshot.val();
                    if (userData && userData.name) {
                        setUserName(userData.name);
                    }
                } catch (error) {
                    console.error("Error fetching user name:", error);
                }
            }
        };

        fetchUserName();

        return () => {
            clearInterval(timer);
        };
    });

    const redirectTrigger = (path) => {
        try {
            const timestamp = new Date();
            // Check if gtag exists before calling it
            if (typeof window.gtag === 'function') {
                window.gtag("event", `Looks_Menu_${path.split('/').pop()}`, {
                    'timestamp': timestamp.toLocaleString("en-GB")
                });
            }
            // Fix the navigation path to ensure it starts with /menu/
            const fixedPath = path.startsWith('/') ? path : `/menu/${path.toLowerCase()}`;
            navigate(fixedPath);
        } catch (error) {
            // If there's any error with analytics, still proceed with navigation
            console.warn("Analytics error:", error);
            navigate(`/menu/${path.toLowerCase()}`);
        }
    };

    const handleProfileClick = () => {
        // Get current user
        const user = firebase.auth().currentUser;
        if (user) {
            // Navigate to profile page
            navigate('/profile');
        } else {
            // If no user is logged in, redirect to login
            navigate('/');
        }
    };

    return (
        <div className="LandingContainer">
            <ProfileButton onClick={handleProfileClick} />
            <div className="Landing">
                <div className="logoContainer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' }}>
                    <img 
                        src={require('../assets/sloution-logo.png')} 
                        alt="Ettarra Logo" 
                        style={{ width: '70px', height: 'auto', margin: '0 20px' }}
                    />
                    <img 
                        src={require('../assets/ettarra_w_logo.png')} 
                        alt="Sloution Logo" 
                        style={{ width: '150px', height: 'auto', margin: '0 20px', filter: 'invert(1)' }}
                    />
                </div>

                <div className="gameCardContainer" onClick={() => redirectTrigger('Games')}>
                    <div className="gamesBanner">
                        <div className="gamesBannerText">Play with your friends!<br />And, if you're lucky play with your Date!</div>
                        <button className="gameCard">Play Now</button>
                    </div>
                    {/* <video className="gamesVideo" src={video} alt="banner" autoPlay muted loop playsInline /> */}
                    <video className="gamesVideo" alt="banner" autoPlay muted loop playsInline >
                        <source src={video} type="video/mov" />
                        <source src={video2} type="video/mp4" />
                    </video>
                </div>
                {/* <div className="NewMenuCards">
                    <div className="kaapifestCard" onClick={() => redirectTrigger('kaapi-fest')}>
                        Latte Festival
                        <span>Try Now</span>
                    </div> 
                </div> */}
                <div className="menuCardContainer">
                    <button className="menuCard ColdMenu" onClick={() => redirectTrigger('tea')}>Tea</button>
                    <button className="menuCard HotMenu" onClick={() => redirectTrigger('coffee')}>Coffee</button>
                    {/* <button className="menuCard ColdMenu" onClick={() => redirectTrigger('cold-coffee')}>Cold Coffee</button>
                    <button className="menuCard ManualBrewMenu" onClick={() => redirectTrigger('manual-brew')}>Manual Brews</button>
                    <button className="menuCard NotCoffeeMenu" onClick={() => redirectTrigger('not-coffee')}>Not Coffee</button>
                    <button className="menuCard SweetMenu" onClick={() => redirectTrigger('sweet')}>Sweet</button> */}
                </div>
                <div className="schoolOfThought">
                    <div className="schoolOfThoughtTitle">Quote For The Day</div>
                    <div className="schoolOfThoughtThought">{SOT[index]}</div>
                </div>
                <br /><br /><br /><br /><br /><br />
            </div>
            <br /><br /><br /><br /><br /><br />
        </div>
    );
};

export default Landing;