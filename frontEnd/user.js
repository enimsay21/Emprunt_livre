import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

import AsyncStorage from '@react-native-async-storage/async-storage';
import StyledAlert from './component/StyledAlert';

const API_URL = 'http://10.0.2.2:3000/api';

const UsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error retrieving users:', error.response?.data || error.message);
      setAlert({
        visible: true,
        title: 'Error',
        message: error.response?.data?.message || 'Unable to load users. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId, currentStatus) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.put(`${API_URL}/users/${userId}`, 
        { is_admin: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, is_admin: !user.is_admin } 
          : user
      ));
      
      setAlert({
        visible: true,
        title: 'Success',
        message: `Admin status ${!currentStatus ? 'granted' : 'removed'} successfully`
      });
    } catch (error) {
      console.error('Error modifying admin status:', error.response?.data || error.message);
      setAlert({
        visible: true,
        title: 'Error',
        message: error.response?.data?.message || 'Unable to modify admin status. Please try again.'
      });
    }
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.telephone?.includes(searchQuery) ||
    user.cin?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userAvatar}>
        <View style={[styles.avatarPlaceholder, { backgroundColor: getUserColor(item.username) }]}>
          <Text style={styles.avatarText}>{getInitials(item.username)}</Text>
        </View>
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userContacts}>
          <Icon name="phone" size={14} color="#666" />
          <Text style={styles.contactText}>{item.telephone || 'No phone'}</Text>
          <Icon name="credit-card" size={14} color="#666" style={styles.cinIcon} />
          <Text style={styles.contactText}>{item.cin || 'No ID'}</Text>
        </View>
        <View style={styles.userStatus}>
          <Icon 
            name={item.is_admin ? "admin-panel-settings" : "account-circle"} 
            size={16} 
            color={item.is_admin ? "#4CAF50" : "#4C2808"} 
          />
          <Text style={[styles.statusText, { color: '#A9A9A9' }]}>
            {item.is_admin ? "Administrator" : "Standard User"}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={[
          styles.adminToggle, 
          item.is_admin ? styles.removeAdminButton : styles.makeAdminButton
        ]}
        onPress={() => toggleAdminStatus(item.id, item.is_admin)}
      >
        <Icon 
          name={item.is_admin ? "remove-circle" : "add-circle"} 
          size={20} 
          color="white" 
        />
        <Text style={styles.toggleButtonText}>
          {item.is_admin ? "Remove" : "Admin"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Function to get initials from a name
  const getInitials = (username) => {
    if (!username) return "?";
    return username
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to generate a color based on the name
  const getUserColor = (username) => {
    const colors = ['#4C2808', '#A9A9A9'];
    if (!username) return colors[0];
    
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchBarContainer}>
        <Icon name="search" size={24} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for a user..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="clear" size={24} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3f51b5" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.usersList}
          ListEmptyComponent={
            <View style={styles.emptyList}>
              <Icon name="people-alt" size={64} color="#ccc" />
              <Text style={styles.emptyListText}>
                No users found
              </Text>
            </View>
          }
        />
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
    backgroundColor: '#f9f9f9',
  },
  searchBarContainer: {
    backgroundColor: 'white',
    margin: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  usersList: {
    padding: 10,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    alignItems: 'center',
  },
  userAvatar: {
    marginRight: 15,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  userContacts: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  cinIcon: {
    marginLeft: 10,
  },
  userStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  statusText: {
    fontSize: 12,
    marginLeft: 4,
  },
  adminToggle: {
    borderRadius: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 90,
  },
  makeAdminButton: {
    backgroundColor: '#4C2808',
  },
  removeAdminButton: {
    backgroundColor: '#FF5252',
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyListText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
  },
});

export default UsersScreen;