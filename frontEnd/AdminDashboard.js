import React, { useState, useEffect } from 'react';
import { View, Text,  StyleSheet, TouchableOpacity,ScrollView,SafeAreaView, Dimensions,StatusBar,} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StyledAlert from './component/StyledAlert';
import { LineChart } from 'react-native-chart-kit';

const API_URL = 'http://10.0.2.2:3000/api';

const AdminDashboard = ({ navigation }) => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    loanedBooks: 0,
    totalUsers: 0,
    recentLoans: 0
  });
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '' });
  const [activityData, setActivityData] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0], 
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2
      }
    ]
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);



  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Please log in to access the dashboard');
      }
      
      console.log('Retrieving dashboard data...');
      
      const fullUrl = `${API_URL}/stats`; // Make sure URL is correct
      console.log(`Sending request to: ${fullUrl}`);
      
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP Error: ${response.status}, Message: ${errorText}`);
        throw new Error(errorText || `HTTP Error: ${response.status}`);
      }
      
      const dashboardStats = await response.json();
      
      if (dashboardStats) {
        setStats({
          totalBooks: Number(dashboardStats.totalBooks || 0),
          loanedBooks: Number(dashboardStats.loanedBooks || 0),
          totalUsers: Number(dashboardStats.totalUsers || 0),
          recentLoans: Number(dashboardStats.recentLoans || 0)
        });
        
        if (dashboardStats.activityData) {
          setActivityData(dashboardStats.activityData);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error retrieving data:', error);
      setAlertMessage({
        title: 'Error',
        message: error.message || 'Unable to load dashboard data'
      });
      setAlertVisible(true);
      setLoading(false);
    }
  };

  const StatCard = ({ icon, title, value, color, onPress }) => {
    console.log(`Rendering StatCard - Title: ${title}, Value: ${value}`);
    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={onPress}
      >
        <View style={[styles.cardIconContainer, { backgroundColor: `${color}15` }]}>
          <Icon name={icon} size={28} color={color} />
        </View>
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardValue}>{value !== undefined ? value : 'N/A'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const screenWidth = Dimensions.get("window").width - 32;

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#4CAF50"
    }
  };

  // Add log to check state before rendering
  console.log('Current state before rendering:', JSON.stringify({
    stats,
    loading,
    activityData: activityData.datasets[0].data
  }, null, 2));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fd" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard Admin</Text>
       
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text>Loading data...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard 
                icon="menu-book" 
                title="Total Books" 
                value={stats.totalBooks} 
                color="#4CAF50"
                onPress={() => navigation.navigate('ManageBooks')}
              />
              
              <StatCard 
                icon="swap-horiz" 
                title="Loaned Books" 
                value={stats.loanedBooks} 
                color="#FF9800"
                onPress={() => navigation.navigate('LoanedBooks')}
              />
              
              <StatCard 
                icon="people" 
                title="Users" 
                value={stats.totalUsers} 
                color="#2196F3"
                onPress={() => navigation.navigate('UsersList')}
              />
              
              <StatCard 
                icon="access-time" 
                title="Recent Loans" 
                value={stats.recentLoans} 
                color="#9C27B0"
                onPress={() => navigation.navigate('LoanedBooks')}
              />
            </View>
            
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Loan Activity (Last 7 days)</Text>
              <LineChart
                data={activityData}
                width={screenWidth}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            </View>
            
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Addbook')}
                >
                  <View style={[styles.actionIconContainer, styles.addBookButton]}>
                    <Icon name="add-circle" size={24} color="#fff" />
                  </View>
                  <Text style={styles.actionButtonText}>Add Book</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Users')}
                >
                  <View style={[styles.actionIconContainer, styles.viewUsersButton]}>
                    <Icon name="people" size={24} color="#fff" />
                  </View>
                  <Text style={styles.actionButtonText}>Users</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('LoanedBooks')}
                >
                  <View style={[styles.actionIconContainer, styles.loansButton]}>
                    <Icon name="swap-horiz" size={24} color="#fff" />
                  </View>
                  <Text style={styles.actionButtonText}>Loans</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => navigation.navigate('Settings')}
                >
                  <View style={[styles.actionIconContainer, styles.settingsButton]}>
                    <Icon name="settings" size={24} color="#fff" />
                  </View>
                  <Text style={styles.actionButtonText}>Settings</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
      
      <StyledAlert
        visible={alertVisible}
        title={alertMessage.title}
        message={alertMessage.message}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fd',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#f8f9fd',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '48%',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  quickActionsContainer: {
    marginBottom: 20,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  addBookButton: {
    backgroundColor: '#FF5252',
  },
  viewUsersButton: {
    backgroundColor: '#2196F3',
  },
  loansButton: {
    backgroundColor: '#FF9800',
  },
  settingsButton: {
    backgroundColor: '#9C27B0',
  },
  actionButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AdminDashboard;