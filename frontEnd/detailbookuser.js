import React, { useState, useEffect } from 'react';
import { View,Text,StyleSheet,ScrollView,Image,TouchableOpacity,ActivityIndicator,SafeAreaView, StatusBar, Share} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import StyledAlert from './component/StyledAlert';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://10.0.2.2:3000/api';

const BookDetailUserScreen = ({ route }) => {
  const { bookId } = route.params;
  const navigation = useNavigation();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    const fetchBookDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/books/${bookId}`);
        setBook(response.data);
      } catch (error) {
        console.error('Error fetching book details:', error);
        showAlert('Error', 'Failed to load book details.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookDetails();
  }, [bookId]);

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleBorrow = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userData');
      const user = JSON.parse(userData);
  
      const borrowResponse = await axios.post(
        `${API_URL}/loans`,
        { book_id: bookId },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
  
      await axios.post(
        `${API_URL}/notifications`,
        {
          user_id: user.id,
          title: "Borrow Confirmed",
          message: `You borrowed "${book.title}". Return date: ${new Date(borrowResponse.data.due_date).toLocaleDateString()}`,
          type: "loan",
          related_id: bookId
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
  
      showAlert('Success', 'Book borrowed successfully!');
    } catch (error) {
      
      
  
      if (error.response && error.response.data && error.response.data.message) {
        showAlert('Error', error.response.data.message);
      } else {
        showAlert('Error', 'Could not borrow this book.');
      }
    }
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
   
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
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar backgroundColor="#4C2808" barStyle="light-content" />
        <ActivityIndicator size="large" color="#4C2808" />
        <Text style={styles.loadingText}>Loading book details...</Text>
      </SafeAreaView>
    );
  }

  if (!book) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <StatusBar backgroundColor="#4C2808" barStyle="light-content" />
        <Icon name="error-outline" size={64} color="#4C2808" />
        <Text style={styles.errorText}>Book not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#4C2808" barStyle="light-content" />

    
      <View style={styles.header}>
        <TouchableOpacity style={styles.backIconButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{book.title}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconButton} onPress={toggleFavorite}>
            <Icon name={isFavorite ? "favorite" : "favorite-border"} size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleShareBook}>
            <Icon name="share" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.bookImageContainer}>
          <Image
            source={{ uri: book.cover_url || 'https://via.placeholder.com/300x450?text=No+Cover' }}
            style={styles.bookImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.bookInfoContainer}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          <Text style={styles.bookAuthor}>by {book.author}</Text>

          <View style={styles.bookMetaRow}>
            <View style={styles.metaBadge}>
              <Icon name="category" size={14} color="#4C2808" />
              <Text style={styles.metaText}>{book.genre || 'Unclassified'}</Text>
            </View>
            <View style={styles.metaBadge}>
              <Icon name="language" size={14} color="#4C2808" />
              <Text style={styles.metaText}>{book.language || 'English'}</Text>
            </View>
          </View>

          <View style={styles.availabilityContainer}>
            <Icon
              name={book.available_copies > 0 ? "check-circle" : "cancel"}
              size={20}
              color={book.available_copies > 0 ? "#28A745" : "#DC3545"}
            />
            <Text style={styles.availabilityText}>
              {book.available_copies > 0 ? `${book.available_copies} copies available`  : 'Currently unavailable'}
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

          <TouchableOpacity
            style={[styles.borrowButton, book.available_copies <= 0 && styles.borrowButtonDisabled]}
            onPress={handleBorrow}
            disabled={book.available_copies <= 0}
          >
            <Icon name="book" size={20} color="#FFFFFF" />
            <Text style={styles.borrowButtonText}>
              {book.available_copies > 0 ? 'Borrow this Book' : 'Not Available'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    backgroundColor: '#FFFFFF',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#4C2808',
    elevation: 4,
  },
  backIconButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    marginLeft: 4,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  borrowButton: {
    flexDirection: 'row',
    backgroundColor: '#4C2808',
    paddingVertical: 14,
    marginTop: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  borrowButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  borrowButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginTop: 12,
  },
  backButton: {
    backgroundColor: '#4C2808',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  }
});

export default BookDetailUserScreen;