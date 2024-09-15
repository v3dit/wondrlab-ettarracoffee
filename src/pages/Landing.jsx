import "../styles/Landing.css";
import Ettarra from "../assets/Lookxettarra.png";
import video from "../assets/games.mov";
import video2 from "../assets/games.mp4";
import { useEffect, useState } from "react";

const Landing = () => {
    const [index, setIndex] = useState(0)
    const SOT = ['Coffee, Than Humans.', 
        'Yawn: A silent scream of coffee', 
        'Coffee like coca*ne but better', 
        'Stay Grounded', 
        'Life is what happens between coffee and wine.', 
        'Todays good mood is sponsored by coffee.', 
        'E = mc² (Energy = my coffee²)']

    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((prevIndex) => (prevIndex + 1) % 7);
        }, 600000);

        return () => {
            clearInterval(timer);
        };
    });

    const redirectTrigger = (e) => {
        const timestamp = new Date();
        // Track successful login event
        window.gtag("event", `${e}_Click`, { 'timestamp': timestamp.toLocaleString(), "click": e });
        window.location.href = e
    };

    return (
        <div className="LandingContainer">
            <div className="Landing">
                <div className="landingLogoContainer"><img className="landingLogo" src={Ettarra} alt="logo" /></div>
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
                <div className="schoolOfThought">
                    <div className="schoolOfThoughtTitle">Quote For The Day</div>
                    <div className="schoolOfThoughtThought">{SOT[index]}</div>
                </div>
                <div className="menuCardContainer">
                    <button className="menuCard HotMenu" onClick={() => redirectTrigger('Menu/CoffeeMenu')}>Coffee</button>
                    {/* <button className="menuCard ColdMenu" onClick={() => redirectTrigger('Menu/ColdMenu')}>Cold Coffee</button>
                    <button className="menuCard ManualBrewMenu" onClick={() => redirectTrigger('Menu/ManualBrewMenu')}>Manual Brews</button>
                    <button className="menuCard NotCoffeeMenu" onClick={() => redirectTrigger('Menu/NotCoffeeMenu')}>Not Coffee</button>
                    <button className="menuCard SweetMenu" onClick={() => redirectTrigger('Menu/SweetMenu')}>Sweet</button> */}
                    <button className="menuCard SavouryMenu" onClick={() => redirectTrigger('Menu/FoodMenu')}>Food</button>
                </div>
            </div>
        </div>
    );
};

export default Landing;