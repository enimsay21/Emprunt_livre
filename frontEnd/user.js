import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';

import AsyncStorage from '@react-native-async-storage/async-storage';
import StyledAlert from './component/StyledAlert';
import StyledAlerts from './component/alert';

const API_URL = 'http://10.0.2.2:3000/api';

const UsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [userImages, setUserImages] = useState({});
  const [deleteAlert, setDeleteAlert] = useState({
    visible: false,
    userId: null,
    username: '',
  });
  
  // Function to get user image URL
  const getUserImageUrl = async (userId) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.get(`${API_URL}/users/${userId}/image`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.imageUrl;
    } catch (error) {
      console.error('Error fetching user image:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  const loadUserImages = async (usersList) => {
    const imageUrls = {};
    for (const user of usersList) {
      if (user.profile_image) {
        const imageUrl = await getUserImageUrl(user.id);
        if (imageUrl) {
          imageUrls[user.id] = imageUrl;
        }
      }
    }
    setUserImages(imageUrls);
  };
// Update your fetchUsers function to call loadUserImages
const fetchUsers = async () => {
  try {
    setLoading(true);
    const token = await AsyncStorage.getItem('userToken');
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setUsers(response.data);
    // Load images for all users
    await loadUserImages(response.data);
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
      
      // Also update selected user if it's the one being modified
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, is_admin: !currentStatus });
      }
      
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

  const showDeleteUserAlert = (userId, username) => {
    setDeleteAlert({
      visible: true,
      userId,
      username,
    });
  };

  const handleDeleteUser = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      await axios.delete(`${API_URL}/users/${deleteAlert.userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Remove user from local state
      setUsers(users.filter(user => user.id !== deleteAlert.userId));
      
      // Close modal if the deleted user was being viewed
      if (selectedUser && selectedUser.id === deleteAlert.userId) {
        setUserModalVisible(false);
        setSelectedUser(null);
      }
      
      setAlert({
        visible: true,
        title: 'Success',
        message: 'User deleted successfully'
      });
    } catch (error) {
      
      setAlert({
        visible: true,
        title: 'Error',
        message: error.response?.data?.message || "Unable to delete user. Please try again."
      });
    }
  };

  const openUserModal = (user) => {
    setSelectedUser(user);
    setUserModalVisible(true);
  };

  const filteredUsers = users.filter(user => 
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.telephone?.includes(searchQuery) ||
    user.cin?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => openUserModal(item)}
    >
      <View style={styles.userAvatar}>
      {item.profile_image ? (
  <Image 
    source={{ uri: userImages[item.id] }} 
    style={styles.avatarImage}
    defaultSource={require('../assets/book.png')}
  />
) : (
  <View style={[styles.avatarPlaceholder, { backgroundColor: getUserColor(item.username) }]}>
    <Text style={styles.avatarText}>{getInitials(item.username)}</Text>
  </View>
)}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.username}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userContacts}>
          <Icon name="phone" size={14} color="#666" />
          <Text style={styles.contactText}>{item.telephone || 'Not specified'}</Text>
          <Icon name="credit-card" size={14} color="#666" style={styles.cinIcon} />
          <Text style={styles.contactText}>{item.cin || 'Not specified'}</Text>
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
      
      <Icon name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
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

      {/* Modal for user details and actions */}
      <Modal
        visible={userModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUserModalVisible(false)}
      >
        {selectedUser && (
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* Header with close button */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>User Profile</Text>
                <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                  <Icon name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>
              
              {/* User profile image */}
              <View style={styles.modalProfileImageContainer}>
              {selectedUser.profile_image ? (
  <Image 
    source={{ uri: userImages[selectedUser.id] }} 
    style={styles.modalProfileImage}
    defaultSource={require('../assets/book.png')}
  />
) : (
  <View style={[styles.modalAvatarPlaceholder, { backgroundColor: getUserColor(selectedUser.username) }]}>
    <Text style={styles.modalAvatarText}>{getInitials(selectedUser.username)}</Text>
  </View>
)}
              </View>
              
              {/* User info */}
              <View style={styles.modalUserInfo}>
                <Text style={styles.modalUserName}>{selectedUser.username}</Text>
                
                <View style={styles.modalInfoRow}>
                  <Icon name="email" size={20} color="#666" />
                  <Text style={styles.modalInfoText}>{selectedUser.email}</Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Icon name="phone" size={20} color="#666" />
                  <Text style={styles.modalInfoText}>{selectedUser.telephone || 'Not specified'}</Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Icon name="credit-card" size={20} color="#666" />
                  <Text style={styles.modalInfoText}>{selectedUser.cin || 'Not specified'}</Text>
                </View>
                
                <View style={styles.modalInfoRow}>
                  <Icon 
                    name={selectedUser.is_admin ? "admin-panel-settings" : "account-circle"} 
                    size={20} 
                    color={selectedUser.is_admin ? "#4CAF50" : "#4C2808"} 
                  />
                  <Text style={styles.modalInfoText}>
                    {selectedUser.is_admin ? "Administrator" : "Standard User"}
                  </Text>
                </View>
              </View>
              
              {/* Admin toggle button */}
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  selectedUser.is_admin ? styles.removeAdminButton : styles.makeAdminButton
                ]}
                onPress={() => toggleAdminStatus(selectedUser.id, selectedUser.is_admin)}
              >
                <Icon 
                  name={selectedUser.is_admin ? "remove-circle" : "add-circle"} 
                  size={20} 
                  color="white" 
                />
                <Text style={styles.modalButtonText}>
                  {selectedUser.is_admin ? "Remove admin rights" : "Add as admin"}
                </Text>
              </TouchableOpacity>
              
              {/* Delete button */}
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => showDeleteUserAlert(selectedUser.id, selectedUser.username)}
              >
                <Icon name="delete" size={20} color="white" />
                <Text style={styles.modalButtonText}>Delete this user</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      <StyledAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        onClose={() => setAlert({ ...alert, visible: false })}
      />
      
      <StyledAlerts
        visible={deleteAlert.visible}
        title="Delete User"
        message={`Are you sure you want to delete user ${deleteAlert.username}?`}
        onClose={() => setDeleteAlert({ ...deleteAlert, visible: false })}
        showConfirmButton={true}
        onConfirm={handleDeleteUser}
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
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalProfileImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  modalAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  modalUserInfo: {
    marginBottom: 20,
  },
  modalUserName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalInfoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 10,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  makeAdminButton: {
    backgroundColor: '#4C2808',
  },
  removeAdminButton: {
    backgroundColor: '#FF5252',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default UsersScreen;