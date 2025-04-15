import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const CustomDrawerContent = (props) => {
  const { userData } = props;
  const navigation = useNavigation();

  const handleLogout = async () => {
    try {
      // Clear token and user data
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      // Navigate back to login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={styles.drawerHeader}>
          <Image 
            source={require('../assets/book.png')} 
            style={styles.profileImage}
          />
          <Text style={styles.welcomeText}>Hi! {userData?.name || 'Admin'}</Text>
          <Text style={styles.roleText}>Administrator</Text>
        </View>
        
        <DrawerItemList {...props} />
      </DrawerContentScrollView>
      
      <View style={styles.bottomSection}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={22} color="#FF5252" />
          <Text style={styles.logoutText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    padding: 20,
    backgroundColor: '#4C2808',
    marginBottom: 10,
    alignItems: 'center',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    backgroundColor: '#FFF',
  },
  welcomeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  roleText: {
    color: '#E0E0E0',
    fontSize: 14,
  },
  bottomSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 15,
    marginLeft: 5,
    color: '#FF5252',
    fontWeight: '500',
  },
});

export default CustomDrawerContent;