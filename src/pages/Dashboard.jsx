import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom/dist";

import database from "../config/FirbaseConfig";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

import Ettarra from "../assets/Lookxettarra.png";
import '../styles/Dashboard.css';

const Dashboard = ({ loggedInUser }) => {
    const [reportAccess, setReportAccess] = useState(false);
    const [stocksAccess, setStocksAccess] = useState(false);
    const [KDSAccess, setKDSAccess] = useState(false);
    const navigate = useNavigate()

    useEffect(() => {
        const getAccess = async () => {
            try {
                const accessSnapshot1 = await database.ref(`KDS_Access/${loggedInUser}`).once('value');
                setKDSAccess(accessSnapshot1.val())
                const accessSnapshot2 = await database.ref(`Stocks_Access/${loggedInUser}`).once('value');
                setStocksAccess(accessSnapshot2.val())
                const accessSnapshot3 = await database.ref(`Reports_Access/${loggedInUser}`).once('value');
                setReportAccess(accessSnapshot3.val())
            } catch (error) {
                console.error(error)
            }
        }

        getAccess();
    }, [loggedInUser]);

    const openPage = (e) => {
        navigate(e)
    };

    return (
        <div className="Dashboard">
            <div className="landingLogoContainer"><img className="landingLogo" src={Ettarra} alt="logo" /></div>

            {KDSAccess ?
                <div className="DashboardCardMenu" onClick={() => openPage("KDS")} >
                    Open KDS
                </div>
                : " "}

            {stocksAccess ?
                <div className="DashboardCardMenu" onClick={() => openPage("Stocks")} >
                    Stocks
                </div>
                : " "}
            {reportAccess ?
                <div className="DashboardCardMenu" onClick={() => openPage("Reports")} >
                    View Reports
                </div>
                : " "}
            <button
                className="DashboardCard"
                onClick={() => {
                    // Track sign out event
                    window.gtag("event", "sign_out", {
                        event_category: "email/password",
                        event_label: "signed out",
                    });
                    firebase.auth().signOut();
                    navigate("/login");
                }}
            >
                Sign Out
            </button>

        </div>
    );
};

export default Dashboard;
