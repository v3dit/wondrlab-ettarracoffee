import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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

    const redirectTrigger = (e) => {
        const timestamp = new Date();
        // Track successful login event
        window.gtag("event", `Looks_${e}_Click`, { 'timestamp': timestamp.toLocaleString("en-GB"), "click": e });
        window.location.href = e
    };

    return (
        <div className="LandingContainer">
            <ProfileButton userName={userName} />
            <div className="Landing">
                <div className="kaapifestbannder" onClick={() => redirectTrigger('Menu/KaapiFest')}>
                    <img src={img9} alt="KaapiFest" />
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
                <div className="NewMenuCards">
                    <div className="kaapifestCard" onClick={() => redirectTrigger('Menu/KaapiFest')}>
                        Latte Festival
                        <span>Try Now</span>
                    </div>
                </div>
                <div className="menuCardContainer">
                    <button className="menuCard ColdMenu" onClick={() => redirectTrigger(`menu/cold-coffee`)}>Cold Coffee</button>
                    <button className="menuCard HotMenu" onClick={() => redirectTrigger(`menu/hot-coffee`)}>Hot Coffee</button>
                    {/* <button className="menuCard ColdMenu" onClick={() => redirectTrigger('menu/cold-coffee')}>Cold Coffee</button>
                    <button className="menuCard ManualBrewMenu" onClick={() => redirectTrigger('menu/manual-brew')}>Manual Brews</button>
                    <button className="menuCard NotCoffeeMenu" onClick={() => redirectTrigger('menu/not-coffee')}>Not Coffee</button>
                    <button className="menuCard SweetMenu" onClick={() => redirectTrigger('menu/sweet')}>Sweet</button> */}
                    <button className="menuCard SavouryMenu" onClick={() => redirectTrigger(`menu/savoury`)}>Savoury</button>
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