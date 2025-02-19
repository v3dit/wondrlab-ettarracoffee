import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom/dist";

import database from "../config/FirbaseConfig";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

import Ettarra from "../assets/Lookxettarra.png";
import '../styles/Dashboard.css';
import CouponAnalytics from '../components/CouponAnalytics';
import solutionLogo from '../assets/sloution-logo.png';

const Dashboard = ({ loggedInUser }) => {
    const [reportAccess, setReportAccess] = useState(false);
    const [stocksAccess, setStocksAccess] = useState(false);
    const [KDSAccess, setKDSAccess] = useState(false);
    const [couponAnalyticsAccess, setCouponAnalyticsAccess] = useState(false);
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('orders');

    useEffect(() => {
        const getAccess = async () => {
            try {
                const accessSnapshot1 = await database.ref(`KDS_Access/${loggedInUser}`).once('value');
                setKDSAccess(accessSnapshot1.val())
                const accessSnapshot2 = await database.ref(`Stocks_Access/${loggedInUser}`).once('value');
                setStocksAccess(accessSnapshot2.val())
                const accessSnapshot3 = await database.ref(`Reports_Access/${loggedInUser}`).once('value');
                setReportAccess(accessSnapshot3.val())
                const accessSnapshot4 = await database.ref(`Coupon_Access/${loggedInUser}`).once('value');
                setCouponAnalyticsAccess(accessSnapshot4.val())
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
            <div className="logo-container">
                <img src={solutionLogo} alt="Solution Logo" className="dashboard-logo" />
            </div>

            <nav className="dashboard-navigation">
                {KDSAccess && (
                    <button className="DashboardCardMenu" onClick={() => openPage("KDS")}>
                        <h2>Open KDS</h2>
                        <p>Kitchen Display System for order management</p>
                    </button>
                )}

                {stocksAccess && (
                    <button className="DashboardCardMenu" onClick={() => openPage("Stocks")}>
                        <h2>Stocks</h2>
                        <p>Manage inventory and stock levels</p>
                    </button>
                )}

                {reportAccess && (
                    <button className="DashboardCardMenu" onClick={() => openPage("Reports")}>
                        <h2>View Reports</h2>
                        <p>Access and analyze business reports</p>
                    </button>
                )}

                {couponAnalyticsAccess && (
                    <button className="DashboardCardMenu" onClick={() => openPage("/dashboard/coupon-management")}>
                        <h2>Coupon Management</h2>
                        <p>Manage user coupons and view analytics</p>
                    </button>
                )}

                {couponAnalyticsAccess && (
                    <button className="DashboardCardMenu" onClick={() => openPage("/dashboard/coupon-analytics")}>
                        <h2>Coupon Analytics</h2>
                        <p>View detailed coupon usage analytics</p>
                    </button>
                )}

                <button
                    className="SignOutButton"
                    onClick={() => {
                        window.gtag("event", "sign_out", {
                            event_category: "email/password",
                            event_label: "signed out",
                        });
                        firebase.auth().signOut();
                        navigate("/login");
                    }}
                >
                    <h2>Sign Out</h2>
                    <p>Log out of your account</p>
                </button>
            </nav>
        </div>
    );
};

export default Dashboard;
