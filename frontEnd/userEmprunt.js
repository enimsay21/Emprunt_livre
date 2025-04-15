import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StyledAlert from './component/StyledAlert';

// API base URL configuration
const API_URL = 'http://10.0.2.2:3000/api';

const LoanedBooks = ({ navigation }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ title: '', message: '' });

  useEffect(() => {
    fetchLoanedBooks();
  }, []);

  const fetchLoanedBooks = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Please log in to access the loaned books');
      }
      
      const response = await fetch(`${API_URL}/loans`, {
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
      
      const loansData = await response.json();
      
      // Process the loan data to include status indicators and formatted dates
      const processedLoans = loansData.map(loan => {
        const dueDate = new Date(loan.due_date);
        const today = new Date();
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return {
          ...loan,
          formattedDueDate: dueDate.toLocaleDateString(),
          daysRemaining: diffDays,
          isOverdue: diffDays < 0,
          returningSoon: diffDays >= 0 && diffDays <= 3,
          // Add default user information in case API doesn't provide it
          username: loan.username || 'Not available',
          email: loan.email || 'Not available',
          telephone: loan.telephone || 'Not available',
          cin: loan.cin || 'Not available'
        };
      });
      
      setLoans(processedLoans);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error retrieving loaned books:', error);
      setAlertMessage({
        title: 'Error',
        message: error.message || 'Unable to load loaned books'
      });
      setAlertVisible(true);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleReturnBook = async (loanId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('Authentication required');
      }
      
      const response = await fetch(`${API_URL}/loans/${loanId}/return`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }
      
      setAlertMessage({
        title: 'Success',
        message: 'Book returned successfully'
      });
      setAlertVisible(true);
      
      // Refresh the loans list
      fetchLoanedBooks();
    } catch (error) {
      console.error('Error returning book:', error);
      setAlertMessage({
        title: 'Error',
        message: error.message || 'Failed to return the book'
      });
      setAlertVisible(true);
    }
  };

  const confirmReturn = (loanId, bookTitle) => {
    Alert.alert(
      'Return Book',
      `Are you sure you want to mark "${bookTitle}" as returned?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Return', onPress: () => handleReturnBook(loanId) }
      ],
      { cancelable: true }
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoanedBooks();
  };

  const getStatusColor = (loan) => {
    if (loan.isOverdue) return '#FF5252'; // Red for overdue
    if (loan.returningSoon) return '#FF9800'; // Orange for soon due
    return '#4C2803'; // Green for fine
  };

  const getStatusText = (loan) => {
    if (loan.isOverdue) return `Overdue by ${Math.abs(loan.daysRemaining)} days`;
    if (loan.returningSoon) return `Due in ${loan.daysRemaining} days`;
    return `Due in ${loan.daysRemaining} days`;
  };

  const renderLoanItem = ({ item }) => (
    <View style={styles.loanCard}>
      <View style={styles.cardHeader}>
        <View style={styles.bookInfo}>
          <Image 
            source={{ uri: item.cover_url || 'https://via.placeholder.com/60x90?text=No+Cover' }}
            style={styles.bookCover}
            defaultSource={require('../assets/book.png')}
          />
          <View style={styles.titleAuthor}>
            <Text style={styles.bookTitle}>{item.title}</Text>
            <Text style={styles.bookAuthor}>{item.author}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item) }]}>
          <Text style={styles.statusText}>{getStatusText(item)}</Text>
        </View>
      </View>
      
      <View style={styles.userInfoContainer}>
        <Text style={styles.userInfoTitle}>Borrower Information</Text>
        <View style={styles.userInfoGrid}>
          <View style={styles.userInfoItem}>
            <Icon name="person" size={16} color="#4C2808" />
            <Text style={styles.userInfoLabel}>Username:</Text>
            <Text style={styles.userInfoValue}>{item.username}</Text>
          </View>
          
          <View style={styles.userInfoItem}>
            <Icon name="email" size={16} color="#4C2808" />
            <Text style={styles.userInfoLabel}>Email:</Text>
            <Text style={styles.userInfoValue}>{item.email}</Text>
          </View>
          
          <View style={styles.userInfoItem}>
            <Icon name="phone" size={16} color="#4C2808" />
            <Text style={styles.userInfoLabel}>Phone:</Text>
            <Text style={styles.userInfoValue}>{item.telephone}</Text>
          </View>
          
          <View style={styles.userInfoItem}>
            <Icon name="credit-card" size={16} color="#4C2808" />
            <Text style={styles.userInfoLabel}>CIN:</Text>
            <Text style={styles.userInfoValue}>{item.cin}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.loanDetails}>
        <View style={styles.detailItem}>
          <Icon name="date-range" size={16} color="#4C2808" />
          <Text style={styles.detailText}>Due Date: {item.formattedDueDate}</Text>
        </View>
        <View style={styles.detailItem}>
          <Icon name="info" size={16} color="#4C2808" />
          <Text style={styles.detailText}>Loan ID: {item.id}</Text>
        </View>
      </View>
      
      {item.status === 'active' && (
        <TouchableOpacity 
          style={styles.returnButton}
          onPress={() => confirmReturn(item.id, item.title)}
        >
          <Icon name="assignment-return" size={16} color="#fff" />
          <Text style={styles.returnButtonText}>Mark as Returned</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fd" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loaned Books</Text>
        <View style={{width: 24}} /> {/* Empty view to maintain layout */}
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4C2808" />
          <Text style={styles.loadingText}>Loading loaned books...</Text>
        </View>
      ) : loans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="menu-book" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No books currently on loan</Text>
        </View>
      ) : (
        <FlatList
          data={loans}
          renderItem={renderLoanItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4C2808']}
            />
          }
        />
      )}
      
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor:'#4C2808',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#4C2808',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4C2808',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#4C2808',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  bookCover: {
    width: 60,
    height: 90,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  titleAuthor: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'flex-start',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4C2808',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  userInfoContainer: {
    padding: 12,
    backgroundColor: '#f9f5f0',
    borderRadius: 8,
    marginVertical: 12,
  },
  userInfoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4C2808',
    marginBottom: 8,
  },
  userInfoGrid: {
    flexDirection: 'column', 
  },
  userInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4C2808',
    marginLeft: 8,
    width: 70,
  },
  userInfoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  loanDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  returnButton: {
    backgroundColor: '#4C2808',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  returnButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  }
});

export default LoanedBooks;