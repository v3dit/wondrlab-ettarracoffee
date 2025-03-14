import React, { useEffect, useState } from 'react';
import database from '../config/FirbaseConfig';
import '../styles/BestMenu.css'; // Import CSS for styling
import { useNavigate } from 'react-router-dom';
import ProfileButton from '../components/ProfileButton';
import firebase from 'firebase/compat/app';

const BestMenu = ({ WHICH, wishlist, setWishlist, itemAdd, itemRemove }) => {
    const [Data, setData] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [userName, setUserName] = useState('');
    const navigate = useNavigate();
    const [syrups, setSyrups] = useState({});
    const [selectedSyrup, setSelectedSyrup] = useState(null);
    const [showSyrupModal, setShowSyrupModal] = useState(false);
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedPrice, setSelectedPrice] = useState(null);

    // Consolidated data fetching
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch syrups data first
                const syrupsRef = database.ref('Syrups');
                const syrupsSnapshot = await syrupsRef.once('value');
                if (syrupsSnapshot.exists()) {
                    const syrupsData = syrupsSnapshot.val();
                    console.log("Initial syrups data:", syrupsData);
                    setSyrups(syrupsData);
                }

                // Set up real-time listener for syrups
                syrupsRef.on('value', (snapshot) => {
                    if (snapshot.exists()) {
                        const syrupsData = snapshot.val();
                        console.log("Updated syrups data:", syrupsData);
                        setSyrups(syrupsData);
                    }
                });

                // Fetch menu data
                const menuRef = database.ref(`Menus/${WHICH}`);
                menuRef.on('value', (snapshot) => {
                    if (snapshot.exists()) {
                        const menuData = snapshot.val();
                        setData(menuData);
                    }
                });

                // Fetch user name
                const user = firebase.auth().currentUser;
                if (user) {
                    const userRef = database.ref(`users/${user.uid}`);
                    const userSnapshot = await userRef.once('value');
                    const userData = userSnapshot.val();
                    if (userData?.name) {
                        setUserName(userData.name);
                    }
                }

                return () => {
                    menuRef.off();
                    syrupsRef.off();
                };
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchAllData();
    }, [WHICH]);

    const BackButton = (e) => {
        const timestamp = new Date();
        window.gtag("event", `Looks_${e}_Click`, { 'timestamp': timestamp.toLocaleString("en-GB"), "click": e });
        // Use React Router instead of window.location for smoother navigation
        navigate("/menu");  // Add useNavigate hook
    };

    const openDetailedCard = (item) => {
        const timestamp = new Date();
        window.gtag("event", `Looks_${item.Name}_Card_Opened`, { 'timestamp': timestamp.toLocaleString("en-GB"), "itemName": item.Name, "itemDetails": item });
        setSelectedItem(item); // Update the state with the selected item
    };

    const closeDetailedCard = () => {
        setSelectedItem(null); // Reset the selected item when closing the detailed view
    };

    const handleAddToCart = (item, size, price, event) => {
        // Prevent event propagation
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        console.log("Opening syrup modal for item:", item);
        console.log("Current syrups state:", syrups);
        
        // Store all necessary item information
        setSelectedItem({
            ...item,
            Category: WHICH // Add the category from props
        });
        setSelectedSize(size);
        setSelectedPrice(price);
        setShowSyrupModal(true);
    };

    const handleSyrupSelection = (syrupName, event) => {
        // Prevent event propagation
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        console.log("Selected syrup:", syrupName);
        setSelectedSyrup(syrupName);
    };

    const confirmSyrupSelection = (event) => {
        // Prevent event propagation
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        console.log("Confirming syrup selection:", {
            selectedItem,
            selectedSize,
            selectedPrice,
            selectedSyrup
        });

        if (selectedItem && selectedSize && selectedPrice !== null) {
            const baseItem = {
                ...selectedItem,
                Category: WHICH // Ensure category is set
            };

            if (selectedSyrup) {
                const syrupData = syrups[selectedSyrup];
                const itemWithSyrup = {
                    ...baseItem,
                    syrup: {
                        name: syrupData.Name,
                        price: syrupData.Price
                    },
                    Price: selectedPrice + syrupData.Price // Update total price with syrup
                };
                itemAdd(itemWithSyrup, selectedSize, itemWithSyrup.Price, WHICH);
            } else {
                itemAdd(baseItem, selectedSize, selectedPrice, WHICH);
            }
        }

        // Reset all modal-related state
        setSelectedSyrup(null);
        setShowSyrupModal(false);
        setSelectedItem(null);
        setSelectedSize(null);
        setSelectedPrice(null);
    };

    return (
        <div className="best-menu-container">
            <ProfileButton userName={userName} />
            
            {/* Syrup Selection Modal */}
            {showSyrupModal && (
                <div 
                    className="syrup-modal-overlay"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowSyrupModal(false);
                        setSelectedSyrup(null);
                    }}
                >
                    <div 
                        className="syrup-modal"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        <h3>Add Syrup to {selectedItem?.Name}?</h3>
                        <div className="syrup-options">
                            <div 
                                className={`syrup-option ${selectedSyrup === null ? 'selected' : ''}`}
                                onClick={(e) => handleSyrupSelection(null, e)}
                            >
                                <input 
                                    type="radio" 
                                    checked={selectedSyrup === null} 
                                    onChange={(e) => handleSyrupSelection(null, e)}
                                />
                                <label>No Syrup</label>
                            </div>
                            {syrups && Object.entries(syrups).map(([name, syrup]) => {
                                console.log("Rendering syrup option:", name, syrup);
                                return syrup.Stock > 0 ? (
                                    <div 
                                        key={name} 
                                        className={`syrup-option ${selectedSyrup === name ? 'selected' : ''}`}
                                        onClick={(e) => handleSyrupSelection(name, e)}
                                    >
                                        <input 
                                            type="radio" 
                                            checked={selectedSyrup === name} 
                                            onChange={(e) => handleSyrupSelection(name, e)}
                                        />
                                        <label>{syrup.Name} (+₹{syrup.Price})</label>
                                    </div>
                                ) : null;
                            })}
                        </div>
                        <div className="syrup-modal-actions">
                            <button onClick={(e) => confirmSyrupSelection(e)}>Add to Cart</button>
                            <button onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowSyrupModal(false);
                                setSelectedSyrup(null);
                            }}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {selectedItem ? (
                // Render the detailed card view when an item is selected
                <div className="openDetailedCardContainer">
                    {selectedItem.Stock === 0 ? <div className="Unavailable">Unavailable</div> : ""}
                    <div className="closeButton" onClick={closeDetailedCard}><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#291A02">
                        <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
                    </svg>
                    </div>
                    <div className="detailed-item-card">
                        {selectedItem['Img'] && (
                            <div className="detailed-item-card-img">
                                <img src={selectedItem['Img']} alt={selectedItem.Name} />
                            </div>
                        )}
                        <div className="detailed-item-card-info">
                            <div className="detailed-item-card-name">{selectedItem.Name}</div>
                            <div className="detailed-item-card-desc">{selectedItem.Desc}</div>
                            <div className="detailed-item-card-price">
                                {Object.entries(selectedItem.Price).map(([size, price]) => (
                                    <div key={size} className="detailed-price-row">
                                        <span className="detailed-size">{size}</span>
                                        <div className="wishlistToggler">
                                            <div className="itemRemove" onClick={(e) => {
                                                e.stopPropagation();
                                                itemRemove(selectedItem, size);
                                            }}>-</div>
                                            <div className="itemCount">
                                                {wishlist.find(i => i.Name === selectedItem.Name && i.Size === size)?.Count || 0}
                                            </div>
                                            <div 
                                                className={`itemAdd ${selectedItem.Stock === 0 ? "Disabled" : ""}`} 
                                                onClick={(e) => handleAddToCart(selectedItem, size, parseFloat(price.replace('Rs. ', '')), e)}
                                            >+</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Render the menu list when no item is selected
                <>
                    <div className='best-menu-container-top' onClick={() => BackButton('Back_Button')}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#291A02">
                            <path d="M400-80 0-480l400-400 71 71-329 329 329 329-71 71Z" />
                        </svg>
                        <div className='cookies'>we use Cookies*</div>
                    </div>
                    {Data ? (
                        Data.map((item) => (
                            <div className={`item-card ${item.Stock === 0 ? "Disabled" : ""}`} key={`${item.Name}_${item.Desc}`} onClick={() => openDetailedCard(item)}>
                                {item.Stock === 0 ? <div className="Unavailable">Unavailable</div> : ""}
                                <div className="item-card-info">
                                    <div className="item-card-name">{item.Name}</div>
                                    <div className="item-card-desc">{item['Desc'].length > 50 ? `${item.Desc.slice(0, 50)} ...` : item.Desc}
                                        {item['Desc'].length > 50 && (
                                            <span className="read-more">(Read more)</span>
                                        )}</div>
                                    <div className="item-card-price">
                                        {Object.entries(item.Price).map(([size, price]) => (
                                            <div key={size} className="price-row">
                                                <span className="size">{size}</span>{/* <span className="price">{price}</span>*/}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {item['Img'] && (
                                    <div className="item-card-img">
                                        <img src={item['Img']} alt={item.Name} />
                                    </div>
                                )}
                                <span className='addIcon'>Add +</span>
                            </div>
                        ))
                    ) : (
                        <div className="loading">Loading...</div>
                    )}
                    <br /><br /><br />
                </>
            )}
        </div>
    );
};

export default BestMenu;
