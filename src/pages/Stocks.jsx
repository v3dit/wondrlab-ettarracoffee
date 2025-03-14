import React, { useEffect, useState } from "react";
import database from "../config/FirbaseConfig";
import "../styles/Stocks.css";

const Stocks = ({ loggedInUser }) => {
    const [stocksAccess, setStocksAccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [teaMenu, setTeaMenu] = useState([]);
    const [coffeeMenu, setCoffeeMenu] = useState([]);
    const [savouryMenu, setSavouryMenu] = useState([]);
    const [syrups, setSyrups] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('TeaMenu');

    useEffect(() => {
        const getAccess = async () => {
            try {
                if (!loggedInUser) return;
                const accessSnapshot = await database.ref(`Stocks_Access/${loggedInUser}`).once('value');
                setStocksAccess(accessSnapshot.val() || false);
            } catch (error) {
                console.error(error);
            }
        };

        getAccess();
    }, [loggedInUser]);

    useEffect(() => {
        const fetchMenus = async () => {
            try {
                setLoading(true);
                
                // Fetch all menus
                const teaSnapshot = await database.ref('Menus/TeaMenu').once('value');
                const coffeeSnapshot = await database.ref('Menus/CoffeeMenu').once('value');
                const savourySnapshot = await database.ref('Menus/SavouryMenu').once('value');
                const syrupsSnapshot = await database.ref('Syrups').once('value');

                setTeaMenu(teaSnapshot.val() || []);
                setCoffeeMenu(coffeeSnapshot.val() || []);
                setSavouryMenu(savourySnapshot.val() || []);
                
                // Convert syrups object to array and add category
                const syrupsData = syrupsSnapshot.val() || {};
                const syrupsArray = Object.entries(syrupsData).map(([key, value]) => ({
                    ...value,
                    id: key,
                    Category: 'Syrups'
                }));
                setSyrups(syrupsArray);
                
                setLoading(false);
            } catch (error) {
                console.error("Error fetching menus:", error);
                setLoading(false);
            }
        };

        fetchMenus();
    }, []);

    const handleStockUpdate = async (item, newStock, category) => {
        try {
            const encodedEmail = encodeEmail(loggedInUser);
            // First check if user has stocks access
            const stocksAccessSnapshot = await database.ref(`Stocks_Access/${encodedEmail}`).once('value');
            const hasStocksAccess = stocksAccessSnapshot.val();
            
            if (!hasStocksAccess) {
                alert("You don't have permission to update stocks.");
                return;
            }

            if (category === 'Syrups') {
                // Update only the stock field for syrup
                await database.ref(`Syrups/${item.id}/Stock`).set(parseInt(newStock));
                setSyrups(prevSyrups => 
                    prevSyrups.map(syrup => 
                        syrup.id === item.id ? { ...syrup, Stock: parseInt(newStock) } : syrup
                    )
                );
            } else {
                // Update menu item stock
                const menuRef = database.ref(`Menus/${category}`);
                const snapshot = await menuRef.once('value');
                const menu = snapshot.val();
                
                if (!menu) {
                    console.error("Menu not found:", category);
                    return;
                }

                const updatedMenu = menu.map(menuItem => {
                    if (menuItem.Name === item.Name) {
                        return { ...menuItem, Stock: parseInt(newStock) };
                    }
                    return menuItem;
                });

                await menuRef.set(updatedMenu);

                // Update local state based on category
                switch (category) {
                    case 'TeaMenu':
                        setTeaMenu(updatedMenu);
                        break;
                    case 'CoffeeMenu':
                        setCoffeeMenu(updatedMenu);
                        break;
                    case 'SavouryMenu':
                        setSavouryMenu(updatedMenu);
                        break;
                    default:
                        break;
                }
            }
        } catch (error) {
            console.error("Error updating stock:", error);
            alert("Failed to update stock. Please check your permissions and try again.");
        }
    };

    const encodeEmail = (email) => {
        if (!email) return '';
        return email.toString()
            .replace(/\./g, '-dot-')
            .replace(/@/g, '-at-')
            .replace(/\$/g, '-dollar-')
            .replace(/\[/g, '-lbracket-')
            .replace(/\]/g, '-rbracket-')
            .replace(/#/g, '-hash-');
    };

    const getCurrentMenu = () => {
        switch (selectedCategory) {
            case 'TeaMenu':
                return teaMenu;
            case 'CoffeeMenu':
                return coffeeMenu;
            case 'SavouryMenu':
                return savouryMenu;
            case 'Syrups':
                return syrups;
            default:
                return [];
        }
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!stocksAccess) {
        return <div className="access-denied">Access Denied</div>;
    }

    return (
        <div className="stocks-container">
            <h1>Stock Management</h1>
            
            <div className="category-selector">
                <button 
                    className={selectedCategory === 'TeaMenu' ? 'active' : ''} 
                    onClick={() => setSelectedCategory('TeaMenu')}
                >
                    Tea Menu
                </button>
                <button 
                    className={selectedCategory === 'CoffeeMenu' ? 'active' : ''} 
                    onClick={() => setSelectedCategory('CoffeeMenu')}
                >
                    Coffee Menu
                </button>
                <button 
                    className={selectedCategory === 'SavouryMenu' ? 'active' : ''} 
                    onClick={() => setSelectedCategory('SavouryMenu')}
                >
                    Savoury Menu
                </button>
                <button 
                    className={selectedCategory === 'Syrups' ? 'active' : ''} 
                    onClick={() => setSelectedCategory('Syrups')}
                >
                    Syrups
                </button>
            </div>

            <div className="stocks-grid">
                {getCurrentMenu().map((item, index) => (
                    <div key={item.id || index} className="stock-item">
                        <div className="item-info">
                            <h3>{item.Name}</h3>
                            {selectedCategory !== 'Syrups' && (
                                <div className="item-sizes">
                                    {Object.entries(item.Price || {}).map(([size, price]) => (
                                        <span key={size} className="size-tag">
                                            {size} - ₹{price.replace('Rs. ', '')}
                                        </span>
                                    ))}
                                </div>
                            )}
                            {selectedCategory === 'Syrups' && (
                                <div className="item-price">
                                    <span className="price-tag">₹{item.Price}</span>
                                </div>
                            )}
                        </div>
                        <div className="stock-control">
                            <label>Stock:</label>
                            <input 
                                type="number" 
                                value={item.Stock || 0}
                                onChange={(e) => {
                                    const newValue = Math.max(0, parseInt(e.target.value) || 0);
                                    handleStockUpdate(item, newValue, selectedCategory);
                                }}
                                min="0"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Stocks;
