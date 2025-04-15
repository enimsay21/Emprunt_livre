import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import StyledAlert from './component/StyledAlert';

// Base API URL
const API_URL = 'http://10.0.2.2:3000/api';

const LoansScreen = ({ navigation }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/loans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoans(response.data);
    } catch (error) {
      console.error('Error fetching loans:', error);
      showAlert('Error', 'Failed to load your borrowed books.');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleReturnBook = async (loanId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_URL}/loans/${loanId}/return`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showAlert('Success', 'Book returned successfully!');
      // Refresh loans list
      fetchLoans();
    } catch (error) {
      console.error('Error returning book:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to return the book.');
    }
  };

  const isOverdue = (dueDate) => {
    return new Date() > new Date(dueDate);
  };

  // Function to format date as DD/MM/YYYY
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar backgroundColor="#4C2808" barStyle="light-content" />
        <ActivityIndicator size="large" color="#4C2808" />
        <Text style={styles.loadingText}>Loading your loans...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4C2808" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Borrowed Books</Text>
      </View>
      
      {loans.length > 0 ? (
        <ScrollView style={styles.scrollContent}>
          {loans.map(loan => (
            <View key={loan.id} style={styles.loanItem}>
              {loan.cover_url ? (
                <Image 
                  source={{ uri: loan.cover_url }} 
                  style={styles.bookCover}
                  defaultSource={require('../assets/book.png')}
                />
              ) : (
                <View style={styles.bookIconContainer}>
                  <Ionicons name="book" size={28} color="#4C2808" />
                </View>
              )}
              <View style={styles.loanDetails}>
                <Text style={styles.loanBookTitle}>{loan.title}</Text>
                <Text style={styles.loanBookAuthor}>by {loan.author}</Text>
                <Text style={[
                  styles.loanDueDate,
                  loan.status === 'active' && isOverdue(loan.due_date) && styles.loanOverdue
                ]}>
                  {loan.status === 'active' ? (
                    isOverdue(loan.due_date) ? 
                      `Overdue since ${formatDate(loan.due_date)}` : 
                      `Due: ${formatDate(loan.due_date)}`
                  ) : (
                    `Returned on ${formatDate(loan.returned_date)}`
                  )}
                </Text>
                <View style={styles.statusContainer}>
                  <Text style={[
                    styles.loanStatus, 
                    loan.status === 'active' ? styles.loanStatusActive : styles.loanStatusReturned
                  ]}>
                    {loan.status === 'active' ? 'Active' : 'Returned'}
                  </Text>
                </View>
              </View>
              
              {loan.status === 'active' && (
                <TouchableOpacity 
                  style={styles.returnButton}
                  onPress={() => handleReturnBook(loan.id)}
                >
                  <Ionicons name="arrow-undo" size={20} color="white" />
                  <Text style={styles.returnButtonText}>Return</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noLoansContainer}>
          <Ionicons name="book-outline" size={80} color="#E0D5C8" />
          <Text style={styles.noLoansText}>You don't have any borrowed books</Text>
          <Text style={styles.noLoansSubText}>Browse the library and borrow some books!</Text>
          <TouchableOpacity 
            style={styles.browseButton}
            onPress={() => navigation.navigate('Library')}
          >
            <Text style={styles.browseButtonText}>Browse Library</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <StyledAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 15,
    paddingVertical: 12,
    backgroundColor: '#4C2808',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 16,
  },
  scrollContent: {
    paddingTop: 12,
  },
  loanItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  bookIconContainer: {
    marginRight: 12,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0E6DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookCover: {
    width: 48,
    height: 72,
    borderRadius: 6,
    marginRight: 12,
  },
  loanDetails: {
    flex: 1,
  },
  loanBookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  loanBookAuthor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  loanDueDate: {
    fontSize: 14,
    color: '#555',
  },
  loanOverdue: {
    color: '#D32F2F',
    fontWeight: '500',
  },
  statusContainer: {
    marginTop: 5,
  },
  loanStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  loanStatusActive: {
    backgroundColor: '#F0E6DD',
    color: '#4C2808',
  },
  loanStatusReturned: {
    backgroundColor: '#E8F5E9',
    color: '#388E3C',
  },
  returnButton: {
    backgroundColor: '#4C2808',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  returnButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  noLoansContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noLoansText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4C2808',
    textAlign: 'center',
    marginTop: 20,
  },
  noLoansSubText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  browseButton: {
    backgroundColor: '#4C2808',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  browseButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  }
});

export default LoansScreen;