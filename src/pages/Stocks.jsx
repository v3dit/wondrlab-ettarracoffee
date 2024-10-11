import React, { useEffect, useState } from "react";
import database from "../config/FirbaseConfig";
import "../styles/Stocks.css";

const Stocks = ({ loggedInUser }) => {
    const [data, setData] = useState({});
    const [inputData, setInputData] = useState({});

    useEffect(() => {
        const getData = async () => {
            try {
                const Snapshot = await database.ref(`Menus`).once('value');
                setData(Snapshot.val());
            } catch (error) {
                console.error(error);
            }
        };

        getData();
    }, [loggedInUser]);

    const handleInputChange = (cat, key, value) => {
        setInputData((prevInputData) => ({
            ...prevInputData,
            [cat]: {
                ...prevInputData[cat],
                [key]: value
            }
        }));
    };

    const PushStock = async () => {
        try {
            for (const category in inputData) {
                const items = inputData[category];
                for (const index in items) {
                    const newStock = items[index];
                    if (newStock) {
                        // Update the stock in Firebase for the specific item
                        await database.ref(`Menus/${category}/${index}`).update({ Stock: parseInt(newStock) });
                    }
                }
            }let prevStockData = {};
            for (const i in data) {
                for (const j in data[i]) {
                    prevStockData = {
                        ...prevStockData,
                        [i]: {
                            ...prevStockData[i],
                            [data[i][j].Name]: data[i][j].Stock
                        }
                    };
                }
            }
            
            const timestamp = new Date();
            await database.ref(`Stocks_Log/${timestamp.toLocaleString("en-GB").replace(/\//g, '').replace(/, /g, '').replace(/:/g, '').replace(' ', '')}`).set({ timestamp: timestamp.toLocaleString("en-GB"), inputData: inputData, prevStockData: prevStockData})
            alert("Stock updated successfully!");
        } catch (error) {
            console.error("Error updating stock:", error);
        }
    };

    return (
        <div className="StocksContainer">
            <div>
                {data && Object.keys(data).map((cat) => (
                    <div key={cat}>
                        <h3>{cat}</h3>
                        {data[cat].map((item, index) => (
                            <div key={index}>
                                <label htmlFor={`${cat}_${index}`}>{item.Name}</label>
                                <input
                                    id={`${cat}_${index}`}
                                    type="number"
                                    placeholder={item.Stock}
                                    value={inputData[cat]?.[index] || ''}
                                    onChange={(e) => handleInputChange(cat, index, e.target.value)}
                                />
                            </div>
                        ))}
                        <br />
                    </div>
                ))}
                <button className="stocksButton" onClick={PushStock}>Update Stock</button>
            </div>
        </div>
    );
};

export default Stocks;
