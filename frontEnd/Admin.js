import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import existing and new screens
import ProfileScreen from './profil';
import DashboardScreen from './AdminDashboard';
import UsersScreen from './user';
import BooksListScreen from './BookListScreen';
import AddBookScreen from './ajouerlivre';

// Custom Drawer Content
const CustomDrawerContent = (props) => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState(null);
  
  useEffect(() => {
    const getUserData = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('userData');
        if (userDataString) {
          setUserData(JSON.parse(userDataString));
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      }
    };
    
    getUserData();
  }, []);
  
  const handleLogout = async () => {
    try {
      // Clear token and user data
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      // Navigate back to login
      navigation.replace('Login');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };
  
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <Icon name="account-circle" size={60} color="#4C2808" />
        <Text style={styles.drawerHeaderText}>Hi, {userData?.username || 'User'}!</Text>
      </View>
      <DrawerItemList {...props} />
      <DrawerItem 
        label="Logout" 
        onPress={handleLogout}
        icon={({color, size}) => <Icon name="logout" color={color} size={size} style={{ marginRight: 10 }} />}
      />
    </DrawerContentScrollView>
  );
};

// Create Drawer Navigator
const Drawer = createDrawerNavigator();

// Main Component with Drawer
const AdminScreen = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#4C2808',
        },
        headerTintColor: '#fff',
        drawerActiveTintColor: '#4C2808',
        drawerLabelStyle: {
          marginLeft: -10,
        },
      }}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          title: 'Dashboard',
          drawerIcon: ({color, size}) => <Icon name="dashboard" color={color} size={size} style={{ marginRight: 10 }} />
        }}
      />
      <Drawer.Screen 
        name="Books" 
        component={BooksListScreen} 
        options={{
          title: 'Manage Books',
          drawerIcon: ({color, size}) => <Icon name="library-books" color={color} size={size} style={{ marginRight: 10 }} />
        }}
      />
      <Drawer.Screen 
        name="Addbook" 
        component={AddBookScreen} 
        options={{
       
          title: 'Add a Book',
          drawerIcon: ({color, size}) => <Icon name="book" color={color} size={size} style={{ marginRight: 10 }} />
        }}
      />
      <Drawer.Screen 
        name="Users" 
        component={UsersScreen} 
        options={{
          title: 'Manage Users',
          drawerIcon: ({color, size}) => <Icon name="people" color={color} size={size} style={{ marginRight: 10 }} />
        }}
      />
      <Drawer.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: 'My Profile',
          drawerIcon: ({color, size}) => <Icon name="person" color={color} size={size} style={{ marginRight: 10 }} />
        }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    marginBottom: 10,
    alignItems: 'center',
  },
  drawerHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4C2808',
    marginTop: 10,
  }
});

export default AdminScreen;