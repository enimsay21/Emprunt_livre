import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StyledAlert from './component/StyledAlert';
import StyledAlerts from './component/alert';

const API_URL = 'http://10.0.2.2:3000/api';

const BookListScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  useEffect(() => {
    checkUserRole();
    fetchBooks();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchBooks();
    });

    return unsubscribe;
  }, [navigation]);

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

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/books`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(response.data);
    } catch (error) {
      console.error('Error retrieving books:', error);
      setAlert({
        visible: true,
        title: 'Error',
        message: 'Unable to load books. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const showDeleteConfirmation = (book) => {
    setBookToDelete(book);
    setConfirmDeleteVisible(true);
  };

  handleConfirmDelete = async () => {
    if (!bookToDelete) return;
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      console.log('Attempting to delete book with ID:', bookToDelete.id);
      
      await axios.delete(`${API_URL}/books/${bookToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBooks(books.filter(book => book.id !== bookToDelete.id));
      
      setAlert({
        visible: true,
        title: 'Success',
        message: 'Book deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting book:', error);
      
      let errorMessage = 'Unable to delete the book.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setAlert({
        visible: true,
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setConfirmDeleteVisible(false);
      setBookToDelete(null);
    }
  };

  const filteredBooks = books.filter(book => 
    book.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.genre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderBookItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => navigation.navigate('BookDetail', { bookId: item.id })}
    >
      <View style={styles.bookCardContent}>
        <Image 
          source={{ uri: item.cover_url || 'https://via.placeholder.com/150x200?text=No+Cover' }} 
          style={styles.bookCover}
          defaultSource={require('../assets/book.png')}
        />
        
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
          
          <View style={styles.bookMetaInfo}>
            <View style={styles.genreBadge}>
              <Text style={styles.genreText} numberOfLines={1}>
                {item.genre || 'Unclassified'}
              </Text>
            </View>
            
            <View style={styles.availabilityBadge}>
              <Text style={styles.availabilityText}>
                {item.available_copies} / {item.total_copies}
              </Text>
            </View>
          </View>
        </View>
        
        {isAdmin && (
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => showDeleteConfirmation(item)}
          >
            <Icon name="close" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Icon name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author or genre..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="clear" size={20} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7D4F2A" />
          <Text style={styles.loadingText}>Loading books...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={renderBookItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.booksList}
          numColumns={2}
          columnWrapperStyle={styles.listRow}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyListContainer}>
              <Icon name="menu-book" size={64} color="#E0E0E0" />
              <Text style={styles.emptyListText}>
                No books found
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={fetchBooks}
              >
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {isAdmin && (
        <TouchableOpacity 
          style={styles.fabButton}
          onPress={() => navigation.navigate('AddBook')}
        >
          <Icon name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Regular alert */}
      <StyledAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />

      {/* Confirmation alert for delete */}
    {/* Confirmation alert for delete */}
<StyledAlerts
  visible={confirmDeleteVisible}
  title="Confirmation"
  message={bookToDelete ? `Are you sure you want to delete the book "${bookToDelete.title}"?` : ""}
  onClose={() => {
    setConfirmDeleteVisible(false);
    setBookToDelete(null);
  }}
  showConfirmButton={true}
  onConfirm={handleConfirmDelete}
/>

   
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  searchContainer: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 48,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7D4F2A',
    fontWeight: '500',
  },
  booksList: {
    padding: 12,
    paddingBottom: 80,
  },
  listRow: {
    justifyContent: 'space-between',
  },
  bookCard: {
    width: '48%',
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookCardContent: {
    position: 'relative',
  },
  bookCover: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color:'#4C2808',
    fontWeight:'700',
    marginBottom: 8,
  },
  bookMetaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  genreBadge: {
    backgroundColor: '#F0E6DD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    maxWidth: '80%',
  },
  genreText: {
    fontSize: 12,
    color: '#7D4F2A',
    fontWeight: '600',
  },
  availabilityBadge: {
    backgroundColor: '#E9F4F1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  availabilityText: {
    fontSize: 11,
    color: '#386A5F',
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4C2808',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
  emptyListText: {
    marginTop: 15,
    fontSize: 16,
    color: '#888',
    marginBottom: 15,
  },
  refreshButton: {
    backgroundColor: '#7D4F2A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  fabButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4C2808',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  confirmationButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    elevation: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#4C2808',
  },
  confirmButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  }
});

export default BookListScreen;