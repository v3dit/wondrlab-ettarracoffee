import React, { useEffect, useState } from 'react';
import '../styles/Loader.css';

const Loader = ({ captions }) => {
    const [caption, setCaption] = useState('');

    useEffect(() => {
        const randomizeCaption = () => {
            const randomIndex = Math.floor(Math.random() * captions.length);
            setCaption(captions[randomIndex]);
        };

        randomizeCaption();
        const intervalId = setInterval(randomizeCaption, 5000); // Change caption every 2 seconds

        return () => clearInterval(intervalId); // Clear interval on unmount
    }, [captions]);

    return (
        <div className="loader">
            <div>
            <div className="spinner"></div>
            <p>{caption}</p>
            </div>
        </div>
    );
};

export default Loader;
