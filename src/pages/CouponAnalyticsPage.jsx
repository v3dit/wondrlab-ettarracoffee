import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import database from '../config/FirbaseConfig';
import firebase from 'firebase/compat/app';
import '../styles/CouponAnalyticsPage.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const CouponAnalyticsPage = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState({
    redemptionTrends: [],
    popularItems: [],
    unusedCoupons: [],
    userActivity: [],
  });

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const user = firebase.auth().currentUser;
        if (!user) {
          navigate('/');
          return;
        }

        const accessSnapshot = await database.ref(`Coupon_Access/${user.uid}`).once('value');
        const hasAccess = accessSnapshot.val();

        if (!hasAccess) {
          navigate('/dashboard');
          return;
        }

        setHasAccess(true);
        fetchAnalyticsData();
      } catch (error) {
        console.error('Error checking access:', error);
        navigate('/dashboard');
      }
    };

    checkAccess();
  }, [navigate]);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch UserCoupons data
      const userCouponsRef = database.ref('UserCoupons');
      const userCouponsSnapshot = await userCouponsRef.once('value');
      const userCouponsData = userCouponsSnapshot.val() || {};

      // Process data for different charts
      const processedData = processAnalyticsData(userCouponsData);
      setAnalyticsData(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (userCouponsData) => {
    const redemptionTrends = {};
    const popularItems = {};
    const userActivity = {};
    const unusedCoupons = [];
    const now = Date.now();

    Object.values(userCouponsData).forEach(user => {
        if (user.redemption_history && Array.isArray(user.redemption_history)) {
            user.redemption_history.forEach(redemption => {
                // Handle different date formats and ensure valid date
                let redemptionDate;
                if (redemption.redeemed_at) {
                    redemptionDate = new Date(redemption.redeemed_at);
                } else if (redemption.date) {
                    redemptionDate = new Date(Number(redemption.date));
                }

                // Only process if we have a valid date
                if (redemptionDate && !isNaN(redemptionDate.getTime())) {
                    const formattedDate = redemptionDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });

                    redemptionTrends[formattedDate] = (redemptionTrends[formattedDate] || 0) + 1;

                    if (redemption.item_name) {
                        popularItems[redemption.item_name] = (popularItems[redemption.item_name] || 0) + 1;
                    }
                }
            });
        }

        // Check for unused coupons - handle millisecond timestamps
        if (user.active_coupons > 0 && user.last_allocation_date) {
            const allocationDate = new Date(Number(user.last_allocation_date));
            if (!isNaN(allocationDate.getTime())) {
                const daysInactive = Math.floor((now - allocationDate.getTime()) / (24 * 60 * 60 * 1000));
                if (daysInactive > 30) {
                    unusedCoupons.push({
                        email: user.email || 'Unknown User',
                        coupons: Math.max(0, parseInt(user.active_coupons) || 0),
                        daysInactive
                    });
                }
            }
        }

        // User activity tracking
        if (user.email) {
            userActivity[user.email] = Array.isArray(user.redemption_history) ? 
                user.redemption_history.filter(r => r && r.date && !isNaN(new Date(Number(r.date)).getTime())).length : 0;
        }
    });

    return {
        redemptionTrends: Object.entries(redemptionTrends)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date) - new Date(b.date)),
        popularItems: Object.entries(popularItems)
            .map(([item, count]) => ({ item, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10),
        unusedCoupons: unusedCoupons.sort((a, b) => b.daysInactive - a.daysInactive),
        userActivity: Object.entries(userActivity)
            .map(([email, count]) => ({ email, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
    };
  };

  if (loading) return <div className="loading">Loading analytics...</div>;

  if (!hasAccess) {
    return null;
  }

  // Chart configurations
  const redemptionTrendsConfig = {
    labels: analyticsData.redemptionTrends.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [{
      label: 'Daily Redemptions',
      data: analyticsData.redemptionTrends.map(d => d.count),
      borderColor: '#291A02',
      backgroundColor: 'rgba(41, 26, 2, 0.1)',
      fill: true,
    }]
  };

  const popularItemsConfig = {
    labels: analyticsData.popularItems.slice(0, 10).map(d => d.item),
    datasets: [{
      label: 'Redemptions by Item',
      data: analyticsData.popularItems.slice(0, 10).map(d => d.count),
      backgroundColor: [
        '#291A02', '#3C2A21', '#513B2F', '#664C3E', '#7B5D4C',
        '#906E5A', '#A57F69', '#BA9077', '#CFA186', '#E4B294'
      ],
    }]
  };

  const userActivityConfig = {
    labels: analyticsData.userActivity.slice(0, 10).map(d => d.email),
    datasets: [{
      label: 'Redemptions per User',
      data: analyticsData.userActivity.slice(0, 10).map(d => d.count),
      backgroundColor: '#291A02',
    }]
  };

  // Add a check for empty data
  if (analyticsData.redemptionTrends.length === 0) {
    return (
        <div className="analytics-dashboard">
            <h1>Coupon Analytics Dashboard</h1>
            <div className="no-data-message">
                No valid redemption data available
            </div>
        </div>
    );
  }

  return (
    <div className="analytics-dashboard">
      <h1>Coupon Analytics Dashboard</h1>
      
      <div className="chart-grid">
        <div className="chart-container">
          <h2>Redemption Trends</h2>
          <Line 
            data={redemptionTrendsConfig}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Daily Redemption Trends' }
              }
            }}
          />
        </div>

        <div className="chart-container">
          <h2>Most Popular Items</h2>
          <Doughnut 
            data={popularItemsConfig}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'right' },
                title: { display: true, text: 'Top 10 Redeemed Items' }
              }
            }}
          />
        </div>

        <div className="chart-container">
          <h2>User Activity</h2>
          <Bar 
            data={userActivityConfig}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Top 10 Active Users' }
              }
            }}
          />
        </div>

        <div className="chart-container">
          <h2>Unused Coupons ({'>'}30 days)</h2>
          <div className="unused-coupons-list">
            {analyticsData.unusedCoupons.map((user, index) => (
              <div 
                key={index} 
                className={`unused-coupon-item ${user.coupons === 0 ? 'exhausted' : ''}`}
              >
                <span>{user.email}</span>
                <span>{user.coupons} coupons</span>
                <span>{user.daysInactive} days</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CouponAnalyticsPage; 