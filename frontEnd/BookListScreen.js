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
  Alert,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import StyledAlert from './component/StyledAlert';

const API_URL = 'http://10.0.2.2:3000/api';

const BookListScreen = ({ navigation }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
  const [isAdmin, setIsAdmin] = useState(false);

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
      console.error('Erreur lors de la récupération des livres:', error);
      setAlert({
        visible: true,
        title: 'Erreur',
        message: 'Impossible de charger les livres. Veuillez réessayer.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async (bookId, title) => {
    Alert.alert(
      'Confirmation',
      `Voulez-vous vraiment supprimer le livre "${title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              await axios.delete(`${API_URL}/books/${bookId}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              setBooks(books.filter(book => book.id !== bookId));
              
              setAlert({
                visible: true,
                title: 'Succès',
                message: 'Livre supprimé avec succès'
              });
            } catch (error) {
              console.error('Erreur lors de la suppression du livre:', error);
              
              let errorMessage = 'Impossible de supprimer le livre.';
              if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
              }
              
              setAlert({
                visible: true,
                title: 'Erreur',
                message: errorMessage
              });
            }
          }
        }
      ]
    );
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
                {item.genre || 'Non classé'}
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
            onPress={() => handleDeleteBook(item.id, item.title)}
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
            placeholder="Rechercher par titre, auteur ou genre..."
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
          <Text style={styles.loadingText}>Chargement des livres...</Text>
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
                Aucun livre trouvé
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={fetchBooks}
              >
                <Text style={styles.refreshButtonText}>Actualiser</Text>
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
});

export default BookListScreen;