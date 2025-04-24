import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput,ActivityIndicator,FlatList} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import StyledAlert from './component/StyledAlert';
import ProfileUserScreen from './profileuser';
import LoansScreen from './Emprunt';


const API_URL = 'http://10.0.2.2:3000/api';

const Tab = createBottomTabNavigator();


const HomeContent = () => {
  const navigation = useNavigation();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Books');
  const [hasNotifications, setHasNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  
  const categories = ['All Books', 'Fiction', 'Adventure', 'Science Fiction', 'Sportif', ];

  useEffect(() => {
    const getUserData = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const user = JSON.parse(userData);
          setUserName(user.name || '');
          setUserEmail(user.email || '');
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };

    const fetchBooks = async () => {
      try {
        const response = await axios.get(`${API_URL}/books`);
        setBooks(response.data);
      } catch (error) {
        console.error('Error fetching books:', error);
        showAlert('Error', 'Failed to load books. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
 
const checkNotifications = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    
  
    if (!token) {
      console.log('No authentication token found');
      return;
    }
    
    const response = await axios.get(`${API_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
  
    const unreadCount = response.data.filter(notification => !notification.read).length;
    

    setHasNotifications(response.data.length > 0);
    setNotificationCount(unreadCount);
  } catch (error) {
  
    if (error.response && error.response.status === 401) {
      console.log('Authentication token may be expired');
      
    }
  }
};
    getUserData();
    fetchBooks();
    checkNotifications();
    
    
    const notificationInterval = setInterval(checkNotifications, 60000); 
    
    return () => clearInterval(notificationInterval);
  }, []);

  const handleLogout = async () => {
    try {
     
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
 
      navigation.replace('Login');
    } catch (error) {
      console.error('Error during logout:', error);
      showAlert('Error', 'Failed to logout. Please try again.');
    }
  };

  const handleBookPress = (book) => {
    navigation.navigate('BookDetailUser', { bookId: book.id });
  };

  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleNotificationsPress = () => {
    navigation.navigate('Notifications');
  };

  const renderBookItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.bookItem}
      onPress={() => handleBookPress(item)}
    >
      <Image 
        source={{ uri: item.cover_url || 'https://via.placeholder.com/150x220?text=No+Cover' }} 
        style={styles.bookCover} 
        resizeMode="cover"
      />
      <Text style={styles.bookTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>{item.author}</Text>
      <View style={styles.bookGenreContainer}>
        <Text style={styles.bookGenre}>{item.genre || 'Genre N/A'}</Text>
      </View>
    </TouchableOpacity>
  );

  // Filter books by category and search query
  const filteredBooks = books.filter(book => {
    const matchesSearch = 
      searchQuery === '' || 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'All Books' || 
      (book.genre && book.genre.toLowerCase() === selectedCategory.toLowerCase());

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4C2808" />
        <Text style={styles.loadingText}>Loading books...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Hi! </Text>
          <Text style={styles.welcomeSubText}>Welcome to BookEase</Text>
        </View>
        <View style={styles.headerActions}>
        <TouchableOpacity style={styles.notificationButton} onPress={handleNotificationsPress}>
  <Ionicons name="notifications" size={24} color="white" />
  {hasNotifications && (
    <View style={styles.notificationBadgeContainer}>
      <Text style={styles.notificationCount}>
        {notificationCount > 9 ? '9+' : notificationCount}
      </Text>
    </View>
  )}
</TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for books..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>
      <View style={styles.categoriesContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.categoryButtonActive
              ]}
              onPress={() => handleCategorySelect(category)}
            >
              <Text 
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

 
      <FlatList
        data={filteredBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.booksGrid}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="book-outline" size={64} color="#CCCCCC" />
            <Text style={styles.noDataText}>No books available</Text>
          </View>
        }
      />

 
      <StyledAlert
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </View>
  );
};


const HomeScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Loans') {
            iconName = focused ? 'book' : 'book-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4C2808',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          borderTopWidth: 0,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 5,
          height: 60
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeContent} />
      <Tab.Screen name="Loans" component={LoansScreen} options={{ title: 'My Loans' }} />
      <Tab.Screen name="Profile" component={ProfileUserScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#4C2808',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  welcomeContainer: {
    flexDirection: 'column',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  welcomeSubText: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
    opacity: 0.9
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 50,
    marginRight: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5252',
    borderWidth: 1,
    borderColor: 'white',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 10,
    borderRadius: 50,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginHorizontal: 20,
    marginTop: -20,
    paddingHorizontal: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    color: '#333',
    fontSize: 15,
  },
  categoriesContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  categoriesContent: {
    paddingHorizontal: 15,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginHorizontal: 5,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryButtonActive: {
    backgroundColor: '#4C2808',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4C2808',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  flatListContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  booksGrid: {
    justifyContent: 'space-between',
    marginTop: 10,
  },
  bookItem: {
    width: '48%',
    marginBottom: 20,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    elevation: 3,
    padding: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookCover: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    resizeMode: 'cover',
  },
  bookTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  bookAuthor: {
    fontSize: 13,
    color: '#666',
    marginTop: 3,
  },
  bookGenreContainer: {
    marginTop: 8,
    backgroundColor: '#F2EEE9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  bookGenre: {
    fontSize: 11,
    color: '#4C2808',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  noDataText: {
    marginTop: 15,
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
  },
  notificationBadgeContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#FF5252',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    paddingHorizontal: 3,
  },
  notificationCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default HomeScreen;