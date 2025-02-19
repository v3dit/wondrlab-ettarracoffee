import React, { useEffect, useState } from "react";
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import database from '../config/FirbaseConfig';
import Papa from 'papaparse';
import "../styles/AdminCouponManagement.css";

const AdminCouponManagement = ({ loggedInUser }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [users, setUsers] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    redemptions: [],
    allocations: []
  });
  const [redemptions, setRedemptions] = useState([]);
  const [categorizedUsers, setCategorizedUsers] = useState({
    activeUsers: [],
    exhaustedUsers: [],
    overdueUsers: [],
    refillNeeded: []
  });

  useEffect(() => {
    const checkAccess = async () => {
        try {
            console.log("Checking coupon access for user:", loggedInUser);
            
            if (!loggedInUser) {
                console.log("No user logged in");
                setHasAccess(false);
                return;
            }

            const couponAccessRef = database.ref(`Coupon_Access/${loggedInUser}`);
            console.log("Checking coupon access at path:", `Coupon_Access/${loggedInUser}`);
            
            couponAccessRef.on('value', (snapshot) => {
                const hasCouponAccess = snapshot.exists() && snapshot.val();
                console.log("Coupon access value:", hasCouponAccess);
                setHasAccess(hasCouponAccess);
            });

            return () => couponAccessRef.off(); // Cleanup listener
        } catch (error) {
            console.error("Error checking access:", error);
            setHasAccess(false);
        }
    };

    checkAccess();
  }, [loggedInUser]);

  // Add this debug log to see when access changes
  useEffect(() => {
    console.log("Current access state:", hasAccess);
  }, [hasAccess]);

  useEffect(() => {
    if (hasAccess) {
        // Change this to read from UserCoupons directly
        const couponRef = database.ref('UserCoupons');
        
        const handleUserUpdates = async (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const userList = Object.entries(data).map(([uid, userData]) => ({
                    uid,
                    ...userData
                }));
                setUsers(userList);
                
                // Update analytics data
                updateAnalyticsData(userList);
            }
        };

        couponRef.on('value', handleUserUpdates);
        return () => couponRef.off('value', handleUserUpdates);
    }
  }, [hasAccess]);

  useEffect(() => {
    const fetchRedemptions = async () => {
      const redemptionsRef = database.ref('Reports_Access_Data/Coupons/redemptions');
      redemptionsRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const redemptionsList = Object.values(data);
          setRedemptions(redemptionsList);
        }
      });
    };

    fetchRedemptions();

    return () => {
      database.ref('Reports_Access_Data/Coupons/redemptions').off();
    };
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      categorizeUsers(users);
    }
  }, [users]);

  const categorizeUsers = (usersList) => {
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
    
    const categorized = usersList.reduce((acc, user) => {
      const lastAllocationDate = user.last_allocation_date || user.created_at;
      
      // More precise calculation
      const timeDiff = now - lastAllocationDate;
      const daysSinceAllocation = Math.floor(timeDiff / (24 * 60 * 60 * 1000));
      const daysRemaining = Math.max(0, 30 - daysSinceAllocation);

      if (daysSinceAllocation >= 30) {
        // Past 30 days
        if (user.active_coupons > 0) {
          acc.overdueUsers.push({
            ...user,
            couponsLeft: user.active_coupons,
            daysOverdue: daysSinceAllocation - 30 // Add this to show how many days overdue
          });
        } else {
          acc.refillNeeded.push({
            ...user,
            daysOverdue: daysSinceAllocation - 30
          });
        }
      } else {
        // Within 30 days
        if (user.active_coupons > 0) {
          acc.activeUsers.push({
            ...user,
            couponsLeft: user.active_coupons,
            daysRemaining,
            exactDaysRemaining: ((thirtyDays - timeDiff) / (24 * 60 * 60 * 1000)).toFixed(1) // More precise
          });
        } else {
          acc.exhaustedUsers.push({
            ...user,
            daysUntilRefill: daysRemaining
          });
        }
      }
      return acc;
    }, {
      activeUsers: [],
      exhaustedUsers: [],
      overdueUsers: [],
      refillNeeded: []
    });

    setCategorizedUsers(categorized);
  };

  const updateAnalyticsData = (userList) => {
    const redemptionsByDate = {};
    const allocationsByDate = {};

    userList.forEach(user => {
      // Handle redemption history
      if (user.redemption_history) {
        user.redemption_history.forEach(redemption => {
          const date = new Date(redemption.redeemed_at).toLocaleDateString();
          redemptionsByDate[date] = (redemptionsByDate[date] || 0) + 1;
        });
      }
      
      // Handle allocations - count the actual number of coupons allocated
      if (user.last_allocation_date) {
        const date = new Date(user.last_allocation_date).toLocaleDateString();
        // Use the active_coupons value directly
        if (user.active_coupons && !isNaN(user.active_coupons)) {
          allocationsByDate[date] = (allocationsByDate[date] || 0) + parseInt(user.active_coupons);
        }
      }
    });

    // Sort the data by date before setting state
    const sortByDate = (a, b) => new Date(b.date) - new Date(a.date);

    setAnalyticsData({
      redemptions: Object.entries(redemptionsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort(sortByDate),
      allocations: Object.entries(allocationsByDate)
        .map(([date, count]) => ({ date, count }))
        .sort(sortByDate)
    });
  };

  const handleFileUpload = async (event) => {
    try {
        const file = event.target.files[0];
        if (!file) return;

        // Check if user has coupon access first
        const accessSnapshot = await database.ref(`Coupon_Access/${loggedInUser}`).once('value');
        if (!accessSnapshot.exists() || !accessSnapshot.val()) {
            alert('You do not have permission to allocate coupons.');
            event.target.value = '';
            return;
        }

        // Ask for confirmation before proceeding
        const confirmUpload = window.confirm('Are you sure you want to upload and process this CSV file?');
        if (!confirmUpload) {
            event.target.value = ''; // Clear the file input
            return;
        }

        setLoading(true);
        
        Papa.parse(file, {
            complete: async (results) => {
                const validData = results.data.filter(row => row.email && row.number_of_coupons);
                const skippedUsers = [];
                const successfulUsers = [];
                
                for (const row of validData) {
                    try {
                        // Query existing user by email
                        const couponQuery = database.ref('UserCoupons')
                            .orderByChild('email')
                            .equalTo(row.email);
                        
                        const snapshot = await couponQuery.once('value');
                        const existingUserData = snapshot.val();

                        if (existingUserData) {
                            // Handle existing user logic...
                            const userId = Object.keys(existingUserData)[0];
                            const userData = existingUserData[userId];
                            const now = Date.now();
                            
                            if (userData.active_coupons > 0) {
                                const lastAllocation = userData.last_allocation_date;
                                const daysSinceAllocation = lastAllocation ? 
                                    Math.floor((now - Number(lastAllocation)) / (24 * 60 * 60 * 1000)) : 
                                    31;

                                if (daysSinceAllocation < 30) {
                                    skippedUsers.push({
                                        email: row.email,
                                        reason: `Already has ${userData.active_coupons} active coupons, allocated ${daysSinceAllocation} days ago. Must wait ${30 - daysSinceAllocation} more days.`
                                    });
                                    continue;
                                }
                            }

                            const updateData = {
                                active_coupons: parseInt(row.number_of_coupons),
                                last_allocation_date: now,
                                allocation_history: {
                                    ...(userData.allocation_history || {}),
                                    [now]: {
                                        amount: parseInt(row.number_of_coupons),
                                        admin_id: loggedInUser
                                    }
                                }
                            };

                            await database.ref(`UserCoupons/${userId}`).update(updateData);
                            successfulUsers.push(row.email);

                        } else {
                            // Create new user entry
                            const newCouponRef = database.ref('UserCoupons').push();
                            await newCouponRef.set({
                                email: row.email,
                                active_coupons: parseInt(row.number_of_coupons),
                                last_allocation_date: Date.now(),
                                redemption_history: [],
                                allocation_history: {
                                    [Date.now()]: {
                                        amount: parseInt(row.number_of_coupons),
                                        admin_id: loggedInUser
                                    }
                                },
                                created_at: Date.now(),
                                total_redemptions: 0
                            });
                            successfulUsers.push(row.email);
                        }

                    } catch (error) {
                        console.error(`Error processing ${row.email}:`, error);
                        skippedUsers.push({
                            email: row.email,
                            reason: `Error: ${error.message}`
                        });
                    }
                }

                // Show summary alert with both skipped and successful users
                let message = 'Coupon Allocation Summary:\n\n';
                
                if (successfulUsers.length > 0) {
                    message += `Successfully allocated to ${successfulUsers.length} users:\n`;
                    message += successfulUsers.join('\n') + '\n\n';
                }
                
                if (skippedUsers.length > 0) {
                    message += `Skipped ${skippedUsers.length} users:\n`;
                    message += skippedUsers.map(user => 
                        `${user.email}: ${user.reason}`
                    ).join('\n');
                }
                
                alert(message);

            },
            header: true,
            skipEmptyLines: true
        });
    } catch (error) {
        console.error("Error processing file:", error);
        alert('Error processing file. Please try again.');
    } finally {
        setLoading(false);
        event.target.value = '';
    }
};

  const downloadSampleCsv = () => {
    const sampleData = [
      {
        email: 'user@example.com',
        number_of_coupons: '5'
      },
      {
        email: 'another@example.com',
        number_of_coupons: '3'
      }
    ];
    
    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'coupon_allocation_sample.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const awardCoupon = async (userId, reason) => {
    await database.ref(`UserCoupons/${userId}`).update({
      active_coupons: firebase.database.ServerValue.increment(1),
      admin_awarded: firebase.database.ServerValue.push({
        date: Date.now(),
        reason: reason
      })
    });
  };

  const handleAllocateCoupons = async (userId, email, amount) => {
    try {
        setLoading(true);
        
        // Query existing coupon data by email
        const couponQuery = database.ref('UserCoupons')
            .orderByChild('email')
            .equalTo(email);
        
        const snapshot = await couponQuery.once('value');
        const couponData = snapshot.val();
        
        if (couponData) {
            // Update existing entry
            const existingId = Object.keys(couponData)[0];
            const userData = couponData[existingId];
            
            const updateData = {
                active_coupons: parseInt(amount),
                last_allocation_date: Date.now(),
                email: email,
                redemption_history: userData.redemption_history || [],
                allocation_history: {
                    ...(userData.allocation_history || {}),
                    [Date.now()]: {
                        amount: parseInt(amount),
                        admin_id: loggedInUser
                    }
                },
                total_redemptions: userData.total_redemptions || 0
            };

            await database.ref(`UserCoupons/${existingId}`).update(updateData);
        } else {
            // Create new entry
            const newCouponRef = database.ref('UserCoupons').push();
            const newData = {
                active_coupons: parseInt(amount),
                email: email,
                last_allocation_date: Date.now(),
                redemption_history: [],
                allocation_history: {
                    [Date.now()]: {
                        amount: parseInt(amount),
                        admin_id: loggedInUser
                    }
                },
                total_redemptions: 0,
                created_at: new Date().toISOString()
            };

            await newCouponRef.set(newData);
        }

        setLoading(false);
        return true;
    } catch (error) {
        console.error("Error in coupon allocation:", error);
        setLoading(false);
        throw error;
    }
  };

  const handleRevokeCoupons = async (userId, email) => {
    try {
        setLoading(true);
        console.log("Revoking coupons for:", email);

        await database.ref(`UserCoupons/${userId}`).update({
            active_coupons: 0,
            last_revocation_date: Date.now(),
            [`revocation_history/${Date.now()}`]: {
                admin_id: loggedInUser
            }
        });

        setLoading(false);
        console.log("Successfully revoked coupons");
        return true;

    } catch (error) {
        console.error("Error in coupon revocation:", error);
        setLoading(false);
        throw error;
    }
  };

  const handleCouponAllocation = async (userEmail, amount) => {
    try {
      setLoading(true);
      
      // Query existing coupon data by email
      const couponQuery = database.ref('UserCoupons')
        .orderByChild('email')
        .equalTo(userEmail);
      
      const snapshot = await couponQuery.once('value');
      const couponData = snapshot.val();
      
      if (couponData) {
        // Update existing entry
        const existingId = Object.keys(couponData)[0];
        const userData = couponData[existingId];
        
        const updateData = {
          active_coupons: amount,
          last_allocation_date: Date.now(),
          email: userEmail,
          redemption_history: userData.redemption_history || [],
          allocation_history: {
            ...(userData.allocation_history || {}),
            [Date.now()]: {
              amount: amount,
              admin_id: loggedInUser
            }
          }
        };

        await database.ref(`UserCoupons/${existingId}`).update(updateData);
        alert('Coupons allocated successfully!');
      } else {
        // Create new entry if user doesn't exist
        const newCouponRef = database.ref('UserCoupons').push();
        const newData = {
          active_coupons: parseInt(amount),
          email: userEmail,
          last_allocation_date: Date.now(),
          redemption_history: [],
          allocation_history: {
            [Date.now()]: {
              amount: parseInt(amount),
              admin_id: loggedInUser
            }
          },
          created_at: new Date().toISOString()
        };

        await newCouponRef.set(newData);
        alert('New user created and coupons allocated successfully!');
      }

      // The users list will automatically update through the existing listener
    } catch (error) {
      console.error("Error allocating coupons:", error);
      alert('Error allocating coupons. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) {
    return <div className="access-denied">Access Denied</div>;
  }

  return (
    <div className="admin-coupon-container">
      <div className="admin-header">
        <h1>Coupon Management</h1>
      </div>

      <div className="csv-upload-section">
        <h2>Allocate Coupons</h2>
        <div className="sample-download">
          <button onClick={downloadSampleCsv} className="sample-btn">
            Download Sample CSV
          </button>
          <p className="sample-text">
            Use this sample as a template for your coupon allocation file
          </p>
        </div>
        <div className="file-upload-container">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
          />
          <button
            className="upload-btn"
            disabled={!csvFile || loading}
          >
            {loading ? 'Processing...' : 'Process CSV'}
          </button>
        </div>
      </div>

      <div className="analytics-section">
        <div className="chart-container">
          <h3>Daily Redemptions</h3>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.redemptions.map(d => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{d.count}</td>
                </tr>
              ))}
              {analyticsData.redemptions.length === 0 && (
                <tr>
                  <td colSpan="2" className="no-data">No redemptions yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="chart-container">
          <h3>Coupon Allocations</h3>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {analyticsData.allocations.map(d => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{d.count}</td>
                </tr>
              ))}
              {analyticsData.allocations.length === 0 && (
                <tr>
                  <td colSpan="2" className="no-data">No allocations yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="users-list">
        <h2>Active Users</h2>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Active Coupons</th>
              <th>Last Allocation</th>
              <th>Total Redemptions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.uid}>
                <td>{user.email}</td>
                <td>{user.active_coupons || 0}</td>
                <td>{user.last_allocation_date ? new Date(user.last_allocation_date).toLocaleDateString() : 'Never'}</td>
                <td>{user.redemption_history?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Redemption History</h2>
      <div className="redemptions-list">
        {redemptions.map((redemption, index) => (
          <div key={index} className="redemption-card">
            <p>User: {redemption.user_email}</p>
            <p>Item: {redemption.item_name}</p>
            <p>Original Price: ₹{redemption.item_price}</p>
            <p>Redeemed: {new Date(redemption.redeemed_at).toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="categorized-tables">
        <div className="table-section">
          <h3>Active Users (Within 30 Days)</h3>
          <table className="coupon-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Coupons Left</th>
                <th>Days Remaining</th>
              </tr>
            </thead>
            <tbody>
              {categorizedUsers.activeUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.email}</td>
                  <td className="coupon-count">{user.couponsLeft}</td>
                  <td>{user.exactDaysRemaining} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-section">
          <h3>Exhausted Users (Waiting for Refill)</h3>
          <table className="coupon-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Days Until Refill</th>
              </tr>
            </thead>
            <tbody>
              {categorizedUsers.exhaustedUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.email}</td>
                  <td>{user.daysUntilRefill} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-section">
          <h3>Overdue Users with Coupons</h3>
          <table className="coupon-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Unused Coupons</th>
              </tr>
            </thead>
            <tbody>
              {categorizedUsers.overdueUsers.map((user, index) => (
                <tr key={index}>
                  <td>{user.email}</td>
                  <td className="overdue-coupons">{user.couponsLeft}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-section">
          <h3>Users Needing Refill</h3>
          <table className="coupon-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Days Overdue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categorizedUsers.refillNeeded.map((user, index) => (
                <tr key={index}>
                  <td>{user.email}</td>
                  <td>{user.daysOverdue} days</td>
                  <td>
                    <div className="refill-actions">
                      <input 
                        type="number" 
                        min="1"
                        placeholder="Count"
                        className="refill-input"
                        onChange={(e) => {
                          const newUsers = [...categorizedUsers.refillNeeded];
                          newUsers[index].refillAmount = e.target.value;
                          setCategorizedUsers({
                            ...categorizedUsers,
                            refillNeeded: newUsers
                          });
                        }}
                      />
                      <button 
                        className="refill-btn"
                        onClick={() => handleCouponAllocation(
                          user.email, 
                          parseInt(user.refillAmount || 0)
                        )}
                      >
                        Refill
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminCouponManagement; 