import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Share
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StyledAlert from './component/StyledAlert';

const API_URL = 'http://10.0.2.2:3000/api';

const BookDetailScreen = ({ route, navigation }) => {
  const { bookId } = route.params;
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    checkUserRole();
    fetchBookDetails();
  }, [bookId]);

  const checkUserRole = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        setIsAdmin(user.isAdmin || false);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBook(response.data);
    } catch (error) {
      console.error('Error fetching book details:', error);
      setAlert({
        visible: true,
        title: 'Error',
        message: 'Unable to load book details. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowBook = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.post(`${API_URL}/loans`, { book_id: bookId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchBookDetails(); // Refresh book details
      
      setAlert({
        visible: true,
        title: 'Success',
        message: 'Book borrowed successfully'
      });
    } catch (error) {
      console.error('Error borrowing book:', error);
      
      let errorMessage = 'Unable to borrow this book.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setAlert({
        visible: true,
        title: 'Error',
        message: errorMessage
      });
    }
  };

  const handleShareBook = async () => {
    if (book) {
      try {
        await Share.share({
          message: `Discover "${book.title}" by ${book.author}. A fascinating book available in our library.`,
          title: `Book: ${book.title}`
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C2808" />
        <Text style={styles.loadingText}>Loading details...</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="error-outline" size={64} color="#4C2808" />
        <Text style={styles.errorText}>Book not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4C2808" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Book Details</Text>
        
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleShareBook}
        >
          <Icon name="share" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContent}>
        <View style={styles.bookImageContainer}>
          <Image 
            source={{ uri: book.cover_url || 'https://via.placeholder.com/300x450?text=No+Cover' }} 
            style={styles.bookImage}
            defaultSource={require('../assets/book.png')}
          />
        </View>
        
        <View style={styles.bookInfoContainer}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookAuthor}>{book.author}</Text>
          
          <View style={styles.bookMetaRow}>
            <View style={styles.metaBadge}>
              <Icon name="category" size={14} color="#4C2808" />
              <Text style={styles.metaText}>{book.genre || 'Unclassified'}</Text>
            </View>
            
            <View style={styles.metaBadge}>
              <Icon name="language" size={14} color="#4C2808" />
              <Text style={styles.metaText}>{book.language || 'English'}</Text>
            </View>
            
            <View style={styles.metaBadge}>
              <Icon name="date-range" size={14} color="#4C2808" />
              <Text style={styles.metaText}>{book.publication_year || 'N/A'}</Text>
            </View>
            
            <View style={styles.metaBadge}>
              <Icon name="bookmark" size={14} color="#4C2808" />
              <Text style={styles.metaText}>ISBN: {book.isbn || 'N/A'}</Text>
            </View>
          </View>
          
          <View style={styles.availabilityContainer}>
            <Icon 
              name={book.available_copies > 0 ? "check-circle" : "cancel"} 
              size={20} 
              color={book.available_copies > 0 ? "#28A745" : "#DC3545"} 
            />
            <Text style={styles.availabilityText}>
              {book.available_copies} / {book.total_copies} cop{book.total_copies > 1 ? 'ies' : 'y'} available
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.sectionContainer}>
            <View style={styles.sectionTitleContainer}>
              <Icon name="description" size={20} color="#4C2808" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.descriptionText}>
              {book.description || "No description available for this book."}
            </Text>
          </View>
          
          <View style={styles.actionsContainer}>
            {book.available_copies > 0 && (
              <TouchableOpacity 
                style={styles.borrowButton}
                onPress={handleBorrowBook}
              >
                <Icon name="book" size={20} color="#FFFFFF" />
                <Text style={styles.borrowButtonText}>Borrow this book</Text>
              </TouchableOpacity>
            )}

            {isAdmin && (
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => navigation.navigate('EditBook', { bookId: book.id })}
              >
                <Icon name="edit" size={20} color="#FFFFFF" />
                <Text style={styles.editButtonText}>Edit this book</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
      
      <StyledAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#4C2808',
    elevation: 4,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backIconButton: {
    padding: 8,
  },
  iconButton: {
    padding: 8,
  },
  scrollContent: {
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4C2808',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#4C2808',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bookImageContainer: {
    alignItems: 'center',
    padding: 20,
    paddingTop: 30,
  },
  bookImage: {
    width: 180,
    height: 270,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#DDDDDD',
  },
  bookInfoContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  bookTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4C2808',
    textAlign: 'center',
    marginBottom: 8,
  },
  bookAuthor: {
    fontSize: 18,
    color: '#4C2808',
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  bookMetaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    elevation: 1,
  },
  metaText: {
    fontSize: 12,
    color: '#4C2808',
    fontWeight: '500',
    marginLeft: 4,
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F8F8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#4C2808',
  },
  availabilityText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#DDDDDD',
    marginVertical: 20,
  },
  sectionContainer: {
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4C2808',
    marginLeft: 8,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555555',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 8,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: '#4C2808',
  },
  actionsContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  borrowButton: {
    flexDirection: 'row',
    backgroundColor: '#4C2808',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    marginBottom: 12,
  },
  borrowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#4C2808',
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    opacity: 0.85,
  },
  editButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  }
});

export default BookDetailScreen;