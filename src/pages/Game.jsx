import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import "../styles/Game.css";

const Game = () => {
    const location = useLocation();
    const navigate = useNavigate(); // Hook to navigate programmatically

    // Parse query parameters from the URL
    const params = new URLSearchParams(location.search);
    const gameType = params.get('Game');

    
    const neverHaveIEverStatements = useMemo(() =>[
        "Never have I ever \nhad sex with an object",
        "Never have I ever \nmade out with someone the same day I met them",
        "Never have I ever \nstolen cigarettes and / or alcohol",
        "Never have I ever \nbeen a victim of wardrobe malfunction",
        "Never have I ever \neaten whipped cream off somebody",
        "Never have I ever \nworn the same underwear for two straight days",
        "Never have I ever \nslept in the middle of having sex",
        "Never have I ever \nregretted helping someone",
        "Never have I ever \nswallowed a chewing gum",
        "Never have I ever \nslept while sexting",
        "Never have I ever \npeed in a bottle",
        "Never have I ever \nbeen caught while masturbating",
        "Never have I ever \nhad sex on the roof",
        "Never have I ever \nused a condom for something other than sex",
        "Never have I ever \ngot aroused by any food item",
        "Never have I ever \nbeen attracted to a uniformed person",
        "Never have I ever \nlied to someone about their appearance",
        "Never have I ever \nwatched porn on TV in the living room",
        "Never have I ever \nbeen satisfied after a haircut",
        "Never have I ever \nresponded to a late booty call",
        "Never have I ever \ndated someone famous",
        "Never have I ever \npeeked at someone else while they were changing",
        "Never have I ever \nhad phone sex",
        "Never have I ever \nmade a kid cry purposely",
        "Never have I ever \ncried while having wax",
        "Never have I ever \ncheated on someone",
        "Never have I ever \nmade an excuse to break up with someone/broken up with someone virtually",
        "Never have I ever \nseen Game of Thrones for the sex scenes",
        "Never have I ever \nhad a hit-and-run accident",
        "Never have I ever \nbeen turned on by feet",
        "Never have I ever \nbribed a government employee/official",
        "Never have I ever \nhidden something I broke",
        "Never have I ever \nlied about an injury",
        "Never have I ever \npretended to like someone just to get work done",
        "Never have I ever \npretended to call someone by mistake",
        "Never have I ever \nbroken school property",
        "Never have I ever \nasked my partner to wash up before sex",
        "Never have I ever \nkissed a person of the same gender on the lips",
        "Never have I ever \ndone shit on a plane/boat/train/bus",
        "Never have I ever \nread an adult magazine",
        "Never have I ever \nused a pet to impress someone",
        "Never have I ever \nused sex toys",
        "Never have I ever \nrun away from home",
        "Never have I ever \nfinished a book in less than a day",
        "Never have I ever \nhurt myself during sex"
    ],[]);

    const mostLikelyToStatements = useMemo(() => [
        "Who is most likely to \nhave the biggest porn collection?",
        "Who is most likely to \nforget their password?",
        "Who is most likely to \nhave STDs?",
        "Who is most likely to \ndate two guys/girls at once?",
        "Who is most likely to \nget laid tonight?",
        "Who is most likely to \nhave a one-night stand?",
        "Who is most likely to \ncrash their vehicle/get into an accident?",
        "Who is most likely to \nmake an Onlyfans account?",
        "Who is most likely to \nleave this party first?",
        "Who is most likely to \ndonate sperm for money?",
        "Who is most likely to \nget arrested for urinating in public?",
        "Who is most likely to \nmoan the loudest during sex?",
        "Who is most likely to \nmake a sex tape?",
        "Who is most likely to \npass out tonight?",
        "Who is most likely to \nsleep with someone on the first date?",
        "Who is most likely to \ndiscover new places first in the group?",
        "Who is most likely to \nbe a future influencer/content creator?",
        "Who is most likely to \nown a bar?",
        "Who is most likely to \nmurder someone?",
        "Who is most likely to \nget bankrupt?",
        "Who is most likely to \ngo to a strip club?",
        "Who is most likely to \nfall in love with every person they date?",
        "Who is most likely to \ncomplain about every small thing in their life?",
        "Who is most likely to \nskip bathing for a week?",
        "Who is most likely to \ntry BDSM in bed?",
        "Who is most likely to \npuke after drinking?",
        "Who is most likely to \nhave a foot fetish?",
        "Who is most likely to \ngive an honest answer for every question asked?",
        "Who is most likely to \ncry during an emotional scene/moment?",
        "Who is most likely to \ndrunk dial/drunk text their boss?",
        "Who is most likely to \nhit on a married man/woman?",
        "Who is most likely to \ncheat on their partner?",
        "Who is most likely to \nmove on the next day after a breakup?",
        "Who is most likely to \nforget the name of the person they hooked up with?",
        "Who is most likely to \nend up in jail?",
        "Who is most likely to \nmake the first move while approaching someone in the club?",
        "Who is most likely to \nforget someone's birthday?",
        "Who is most likely to \nhook up with their boss?",
        "Who is most likely to \nflirt their way out of a ticket?",
        "Who is most likely to \ndance crazily the whole night without having a sip of drink?",
        "Who is most likely to \nget an embarrassing tattoo?",
        "Who is most likely to \nhave a corny tinder profile?",
        "Who is most likely to \nget caught hooking up with someone in public?",
        "Who is most likely to \ntry a threesome?",
        "Who is most likely to \nget caught cheating?",
        "Who is most likely to \nfall asleep during sex?",
        "Who is most likely to \nhave a revolutionary idea for a startup?"
    ],[]);

    const thisOrThatQuestions = useMemo(() => [
        { this: "A third eye?", that: "A third arm?" },
        { this: "A time machine?", that: "A teleportation device?" },
        { this: "Give up sex?", that: "Give up showering?" },
        { this: "Lights on?", that: "Lights off?" },
        { this: "Pet dinosaur?", that: "Pet alien?" },
        { this: "Public proposal?", that: "Private proposal?" },
        { this: "Live in a hut with wifi?", that: "Live in a mansion without wifi?" },
        { this: "Empty inbox", that: "Full inbox?" },
        { this: "No lube?", that: "Yes lube?" },
        { this: "Drive yourself?", that: "Get driven around?" },
        { this: "A magic carpet that flies?", that: "A see-through submarine?" },
        { this: "Night out with friends?", that: "Night in with Netflix?" },
        { this: "Whiskey as mouthwash?", that: "Chilli sauce as hand sanitizer?" },
        { this: "Breathe underwater?", that: "Walk on clouds?" },
        { this: "Watch the movie?", that: "Read the book?" },
        { this: "Watch porn every night?", that: "Never watch porn again?" },
        { this: "Be a famous villain?", that: "Be an unknown superhero?" },
        { this: "Surprise weekend getaway?", that: "Planned vacation together?" },
        { this: "Eat a live spider?", that: "Put a snake down your pants?" },
        { this: "Walk barefoot on hot coals?", that: "Skinny dip in the arctic?" },
        { this: "Shave your head?", that: "Dye your hair neon green?" },
        { this: "Eat a raw onion like an apple?", that: "Drink a glass of vinegar?" },
        { this: "Have permanent hiccups?", that: "Have an itch that you cannot scratch?" },
        { this: "Get catfished by someone?", that: "Get scammed by someone for money?" },
        { this: "Have the ability to control dreams?", that: "Have the ability to read minds?" },
        { this: "Skinny dipping?", that: "Streaking?" },
        { this: "A personal clone?", that: "A personal robot?" },
        { this: "Be a vampire?", that: "Be a werewolf?" },
        { this: "Be able to freeze time?", that: "Be able to speed up time?" },
        { this: "Wear wet socks?", that: "Sleep in a damp bed?" },
        { this: "Submissive?", that: "Dominant?" },
        { this: "Kiss a stranger?", that: "Kiss your ex?" },
        { this: "Marry Janice?", that: "Laugh like Janice forever?" },
        { this: "Your mom sets up your dating profile?", that: "Your ex sets up your dating profile?" },
        { this: "Date your far-away cousin?", that: "Date a murderer?" },
        { this: "Jail for 1 night?", that: "Lockdown for 1 year?" },
        { this: "Friendzone?", that: "Ghosting?" },
        { this: "Discover a hidden portal to a parallel universe?", that: "Stumble upon a forgotten civilization?" },
        { this: "A tattoo of your ex's name?", that: "A piercing on your tongue?" },
        { this: "Have a photographic memory?", that: "Have the ability to forget anything you want?" }
    ],[]);

    const [sequence, setSequence] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(-1); // -1 for start card

    useEffect(() => {
        const getStatementsArray = () => {
            if (gameType === 'NHIE') {
                return neverHaveIEverStatements;
            } else if (gameType === 'WIMLT') {
                return mostLikelyToStatements;
            } else if (gameType === 'TOT') {
                return thisOrThatQuestions.map(question => `${question.this}\n\nOR\n\n${question.that}?`);
            }
            return [];
        };

        const statements = getStatementsArray();
        const randomSequence = statements.sort(() => Math.random() - 0.5); // Shuffle the array
        setSequence(randomSequence);
    }, [gameType, neverHaveIEverStatements, mostLikelyToStatements, thisOrThatQuestions]);

    const handleNext = () => {
        if (currentIndex < sequence.length) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > -1) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const handleExit = () => {
        navigate('/Games'); // Navigate back to the home page or another route
    };

    const renderCardContent = () => {
        if (currentIndex === -1) {
            return (
                <div className="instruction-card">
                    <h2>Welcome to the Ice Breakers!</h2>
                    <p>Press Next to start.</p>
                </div>
            );
        } else if (currentIndex >= sequence.length) {
            return (
                <div className="end-card">
                    <h2>Game Over!</h2>
                    <p>Thanks for playing.</p>
                </div>
            );
        } else {
            return <pre>{sequence[currentIndex]}</pre>;
        }
    };

    return (
        <div>
        <div className="game-container">
            <button className="exit-button" onClick={handleExit}>X</button>
            <div className={`game-card ${gameType}`}>
                {renderCardContent()}
            </div>
        </div>
        <div className="navigation-buttons">
                <button onClick={handlePrevious} disabled={currentIndex <= -1} className='PreviousButton'>&lt;</button>
                <button onClick={handleNext} disabled={currentIndex >= sequence.length} className='NextButton'>&gt;</button>
            </div>
        </div>
    );
};

export default Game;


// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import "../styles/Game.css";

// const Game = () => {
//     const location = useLocation();
//     const navigate = useNavigate(); // Hook to navigate programmatically

//     // Parse query parameters from the URL
//     const params = new URLSearchParams(location.search);
//     const gameType = params.get('Game');

//     const neverHaveIEverStatements = [
//         "Never have I ever \nhad sex with an object",
//         "Never have I ever \nmade out with someone the same day I met them",
//         "Never have I ever \nstolen cigarettes and / or alcohol",
//         "Never have I ever \nbeen a victim of wardrobe malfunction",
//         "Never have I ever \neaten whipped cream off somebody",
//         "Never have I ever \nworn the same underwear for two straight days",
//         "Never have I ever \nslept in the middle of having sex",
//         "Never have I ever \nregretted helping someone",
//         "Never have I ever \nswallowed a chewing gum",
//         "Never have I ever \nslept while sexting",
//         "Never have I ever \npeed in a bottle",
//         "Never have I ever \nbeen caught while masturbating",
//         "Never have I ever \nhad sex on the roof",
//         "Never have I ever \nused a condom for something other than sex",
//         "Never have I ever \ngot aroused by any food item",
//         "Never have I ever \nbeen attracted to a uniformed person",
//         "Never have I ever \nlied to someone about their appearance",
//         "Never have I ever \nwatched porn on TV in the living room",
//         "Never have I ever \nbeen satisfied after a haircut",
//         "Never have I ever \nresponded to a late booty call",
//         "Never have I ever \ndated someone famous",
//         "Never have I ever \npeeked at someone else while they were changing",
//         "Never have I ever \nhad phone sex",
//         "Never have I ever \nmade a kid cry purposely",
//         "Never have I ever \ncried while having wax",
//         "Never have I ever \ncheated on someone",
//         "Never have I ever \nmade an excuse to break up with someone/broken up with someone virtually",
//         "Never have I ever \nseen Game of Thrones for the sex scenes",
//         "Never have I ever \nhad a hit-and-run accident",
//         "Never have I ever \nbeen turned on by feet",
//         "Never have I ever \nbribed a government employee/official",
//         "Never have I ever \nhidden something I broke",
//         "Never have I ever \nlied about an injury",
//         "Never have I ever \npretended to like someone just to get work done",
//         "Never have I ever \npretended to call someone by mistake",
//         "Never have I ever \nbroken school property",
//         "Never have I ever \nasked my partner to wash up before sex",
//         "Never have I ever \nkissed a person of the same gender on the lips",
//         "Never have I ever \ndone shit on a plane/boat/train/bus",
//         "Never have I ever \nread an adult magazine",
//         "Never have I ever \nused a pet to impress someone",
//         "Never have I ever \nused sex toys",
//         "Never have I ever \nrun away from home",
//         "Never have I ever \nfinished a book in less than a day",
//         "Never have I ever \nhurt myself during sex"
//     ];

//     const mostLikelyToStatements = [
//         "Who is most likely to \nhave the biggest porn collection?",
//         "Who is most likely to \nforget their password?",
//         "Who is most likely to \nhave STDs?",
//         "Who is most likely to \ndate two guys/girls at once?",
//         "Who is most likely to \nget laid tonight?",
//         "Who is most likely to \nhave a one-night stand?",
//         "Who is most likely to \ncrash their vehicle/get into an accident?",
//         "Who is most likely to \nmake an Onlyfans account?",
//         "Who is most likely to \nleave this party first?",
//         "Who is most likely to \ndonate sperm for money?",
//         "Who is most likely to \nget arrested for urinating in public?",
//         "Who is most likely to \nmoan the loudest during sex?",
//         "Who is most likely to \nmake a sex tape?",
//         "Who is most likely to \npass out tonight?",
//         "Who is most likely to \nsleep with someone on the first date?",
//         "Who is most likely to \ndiscover new places first in the group?",
//         "Who is most likely to \nbe a future influencer/content creator?",
//         "Who is most likely to \nown a bar?",
//         "Who is most likely to \nmurder someone?",
//         "Who is most likely to \nget bankrupt?",
//         "Who is most likely to \ngo to a strip club?",
//         "Who is most likely to \nfall in love with every person they date?",
//         "Who is most likely to \ncomplain about every small thing in their life?",
//         "Who is most likely to \nskip bathing for a week?",
//         "Who is most likely to \ntry BDSM in bed?",
//         "Who is most likely to \npuke after drinking?",
//         "Who is most likely to \nhave a foot fetish?",
//         "Who is most likely to \ngive an honest answer for every question asked?",
//         "Who is most likely to \ncry during an emotional scene/moment?",
//         "Who is most likely to \ndrunk dial/drunk text their boss?",
//         "Who is most likely to \nhit on a married man/woman?",
//         "Who is most likely to \ncheat on their partner?",
//         "Who is most likely to \nmove on the next day after a breakup?",
//         "Who is most likely to \nforget the name of the person they hooked up with?",
//         "Who is most likely to \nend up in jail?",
//         "Who is most likely to \nmake the first move while approaching someone in the club?",
//         "Who is most likely to \nforget someone's birthday?",
//         "Who is most likely to \nhook up with their boss?",
//         "Who is most likely to \nflirt their way out of a ticket?",
//         "Who is most likely to \ndance crazily the whole night without having a sip of drink?",
//         "Who is most likely to \nget an embarrassing tattoo?",
//         "Who is most likely to \nhave a corny tinder profile?",
//         "Who is most likely to \nget caught hooking up with someone in public?",
//         "Who is most likely to \ntry a threesome?",
//         "Who is most likely to \nget caught cheating?",
//         "Who is most likely to \nfall asleep during sex?",
//         "Who is most likely to \nhave a revolutionary idea for a startup?"
//     ];

//     const thisOrThatQuestions = [
//         { this: "A third eye?", that: "A third arm?" },
//         { this: "A time machine?", that: "A teleportation device?" },
//         { this: "Give up sex?", that: "Give up showering?" },
//         { this: "Lights on?", that: "Lights off?" },
//         { this: "Pet dinosaur?", that: "Pet alien?" },
//         { this: "Public proposal?", that: "Private proposal?" },
//         { this: "Live in a hut33 with wifi?", that: "Live in a mansion without wifi?" },
//         { this: "Empty inbox", that: "Full inbox?" },
//         { this: "No lube?", that: "Yes lube?" },
//         { this: "Drive yourself?", that: "Get driven around?" },
//         { this: "A magic carpet that flies?", that: "A see-through submarine?" },
//         { this: "Night out with friends?", that: "Night in with Netflix?" },
//         { this: "Whiskey as mouthwash?", that: "Chilli sauce as hand sanitizer?" },
//         { this: "Breathe underwater?", that: "Walk on clouds?" },
//         { this: "Watch the movie?", that: "Read the book?" },
//         { this: "Watch porn every night?", that: "Never watch porn again?" },
//         { this: "Be a famous villain?", that: "Be an unknown superhero?" },
//         { this: "Surprise weekend getaway?", that: "Planned vacation together?" },
//         { this: "Eat a live spider?", that: "Put a snake down your pants?" },
//         { this: "Walk barefoot on hot coals?", that: "Skinny dip in the arctic?" },
//         { this: "Shave your head?", that: "Dye your hair neon green?" },
//         { this: "Eat a raw onion like an apple?", that: "Drink a glass of vinegar?" },
//         { this: "Have permanent hiccups?", that: "Have an itch that you cannot scratch?" },
//         { this: "Get catfished by someone?", that: "Get scammed by someone for money?" },
//         { this: "Have the ability to control dreams?", that: "Have the ability to read minds?" },
//         { this: "Skinny dipping?", that: "Streaking?" },
//         { this: "A personal clone?", that: "A personal robot?" },
//         { this: "Be a vampire?", that: "Be a werewolf?" },
//         { this: "Be able to freeze time?", that: "Be able to speed up time?" },
//         { this: "Wear wet socks?", that: "Sleep in a damp bed?" },
//         { this: "Submissive?", that: "Dominant?" },
//         { this: "Kiss a stranger?", that: "Kiss your ex?" },
//         { this: "Marry Janice?", that: "Laugh like Janice forever?" },
//         { this: "Your mom sets up your dating profile?", that: "Your ex sets up your dating profile?" },
//         { this: "Date your far-away cousin?", that: "Date a murderer?" },
//         { this: "Jail for 1 night?", that: "Lockdown for 1 year?" },
//         { this: "Friendzone?", that: "Ghosting?" },
//         { this: "Discover a hidden portal to a parallel universe?", that: "Stumble upon a forgotten civilization?" },
//         { this: "A tattoo of your ex's name?", that: "A piercing on your tongue?" },
//         { this: "Have a photographic memory?", that: "Have the ability to forget anything you want?" }
//     ];


//     const getRandomStatement = () => {
//         if (gameType === 'NHIE') {
//             return neverHaveIEverStatements[Math.floor(Math.random() * neverHaveIEverStatements.length)];
//         } else if (gameType === 'WIMLT') {
//             return mostLikelyToStatements[Math.floor(Math.random() * mostLikelyToStatements.length)];
//         } else if (gameType === 'TOT') {
//             const question = thisOrThatQuestions[Math.floor(Math.random() * thisOrThatQuestions.length)];
//             return `${question.this} \n\nOR \n\n${question.that}?`;
//         }
//     };

//     const [currentStatement, setCurrentStatement] = useState(getRandomStatement());
//     const [isFlipped, setIsFlipped] = useState(false);

//     const handleClick = () => {
//         setIsFlipped(!isFlipped);
//         setTimeout(() => {
//             setCurrentStatement(getRandomStatement());
//         }, 300); // Half of the flip duration to switch the text mid-flip
//     };

//     const handleExit = () => {
//         navigate('/Games'); // Navigate back to the home page or another route
//     };

//     useEffect(() => {
//         setCurrentStatement(getRandomStatement());
//     }, [getRandomStatement()]);

//     return (
//         <div className={`game-container ${isFlipped ? 'flip' : ''}`} onClick={handleClick}>
//             <button className="exit-button" onClick={handleExit}>X</button>
//             <div className={`game-card ${gameType}`}>
//                 <p className="front"><pre>{currentStatement}</pre></p>
//                 <p className="back"><pre>{currentStatement}</pre></p>
//             </div>
//         </div>
//     );
// };

// export default Game;