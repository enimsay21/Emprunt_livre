import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import StyledAlert from './component/StyledAlert';

// Base API URL - make sure this matches your backend server address
const API_URL = 'http://10.0.2.2:3000/api';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [editedData, setEditedData] = useState({
    username: '',
    email: '',
    telephone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Show custom alert
  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Main function to fetch user profile data
  const fetchUserProfile = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      if (!token) {
        showAlert('Error', 'Authentication required. Please login again.');
        setTimeout(handleLogout, 2000);
        return;
      }
      
      const response = await axios.get(`${API_URL}/profile`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      setUserData(response.data);
      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
      setError(null);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };
  
  // Error handling function
  const handleError = (error) => {
    let errorMessage = 'Unable to load profile information.';
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          errorMessage = 'Your session has expired. Please login again.';
          setTimeout(handleLogout, 2000);
          break;
        case 403:
          errorMessage = 'You do not have permission to access this resource.';
          break;
        default:
          errorMessage = error.response.data?.message || errorMessage;
      }
    } else if (error.request) {
      errorMessage = 'Cannot connect to server. Please check your internet connection.';
    }
    
    showAlert('Error', errorMessage);
    setError(errorMessage);
  };
  
  // Validate form inputs
  const validateForm = () => {
    const { email, telephone, newPassword, currentPassword, confirmPassword } = editedData;
    
    // Email validation
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return false;
    }
    
    // Telephone validation (optional)
    if (telephone && !/^\d{10}$/.test(telephone)) {
      showAlert('Error', 'Please enter a valid 10-digit phone number');
      return false;
    }
    
    // Password change validation
    if (newPassword) {
      if (!currentPassword) {
        showAlert('Error', 'Current password is required to change password');
        return false;
      }
      
      if (newPassword !== confirmPassword) {
        showAlert('Error', 'New passwords do not match');
        return false;
      }
      
      if (newPassword.length < 6) {
        showAlert('Error', 'New password must be at least 6 characters long');
        return false;
      }
    }
    
    return true;
  };
  
  // Handle profile update
  const handleUpdateProfile = async () => {
    // Validate form first
    if (!validateForm()) {
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('userToken');
      
      // Prepare update payload
      const updatePayload = {
        username: editedData.username || userData.username,
        email: editedData.email || userData.email,
        telephone: editedData.telephone || userData.telephone
      };
      
      // Profile update request
      const profileResponse = await axios.put(`${API_URL}/profile`, updatePayload, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Password change request (if new password provided)
      if (editedData.newPassword) {
        await axios.put(`${API_URL}/profile/change-password`, {
          currentPassword: editedData.currentPassword,
          newPassword: editedData.newPassword
        }, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
      
      // Update local state and storage
      setUserData(profileResponse.data);
      await AsyncStorage.setItem('userData', JSON.stringify(profileResponse.data));
      
      // Reset editing state
      setIsEditing(false);
      setEditedData({
        username: '',
        email: '',
        telephone: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      showAlert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Update error:', error);
      
      if (error.response) {
        showAlert('Error', error.response.data.message || 'Failed to update profile');
      } else {
        showAlert('Error', 'An unexpected error occurred');
      }
    }
  };
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData']);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (e) {
      console.error('Logout error:', e);
      showAlert('Error', 'Failed to logout properly. Please restart the app.');
    }
  };
  
  // Fetch profile when screen comes into focus
  useEffect(() => {
    fetchUserProfile();
    
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserProfile();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  // Rendering logic remains the same as in the original code
  
  // Render loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4C2808" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.profileContainer}>
      {/* StyledAlert for custom alerts */}
      <StyledAlert 
        visible={alertVisible}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
   
      {/* Profile header */}
      <View style={styles.profileHeader}>
        <Icon name="account-circle" size={100} color="#4C2808" />
        {!isEditing && (
          <>
            <Text style={styles.profileName}>{userData?.username || 'User'}</Text>
            <Text style={styles.profileEmail}>{userData?.email || 'Email not available'}</Text>
          </>
        )}
      </View>
      
      {/* Edit Profile Form or Profile Info */}
      {isEditing ? (
        <View style={styles.editForm}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          
          {/* Username Input with Icon */}
          <View style={styles.inputContainer}>
            <Icon name="person" size={24} color="#4C2808" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={editedData.username || userData?.username}
              onChangeText={(text) => setEditedData({...editedData, username: text})}
            />
          </View>
          
          {/* Email Input with Icon */}
          <View style={styles.inputContainer}>
            <Icon name="email" size={24} color="#4C2808" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={editedData.email || userData?.email}
              onChangeText={(text) => setEditedData({...editedData, email: text})}
              keyboardType="email-address"
            />
          </View>
          
          {/* Telephone Input with Icon */}
          <View style={styles.inputContainer}>
            <Icon name="phone" size={24} color="#4C2808" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Telephone"
              value={editedData.telephone || userData?.telephone}
              onChangeText={(text) => setEditedData({...editedData, telephone: text})}
              keyboardType="phone-pad"
            />
          </View>
          
          <Text style={styles.sectionTitle}>Change Password </Text>
          
          {/* Current Password Input with Icon */}
          <View style={styles.inputContainer}>
            <Icon name="lock" size={24} color="#4C2808" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={editedData.currentPassword}
              onChangeText={(text) => setEditedData({...editedData, currentPassword: text})}
            />
          </View>
          
          {/* New Password Input with Icon */}
          <View style={styles.inputContainer}>
            <Icon name="lock-open" size={24} color="#4C2808" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={editedData.newPassword}
              onChangeText={(text) => setEditedData({...editedData, newPassword: text})}
            />
          </View>
          
          {/* Confirm New Password Input with Icon */}
          <View style={styles.inputContainer}>
            <Icon name="verified-user" size={24} color="#4C2808" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={editedData.confirmPassword}
              onChangeText={(text) => setEditedData({...editedData, confirmPassword: text})}
            />
          </View>
          
          {/* Rest of the code remains the same */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleUpdateProfile}
            >
              <Icon name="save" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setIsEditing(false)}
            >
              <Icon name="cancel" size={20} color="#4C2808" />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.profileInfo}>
            <View style={styles.infoItem}>
              <Icon name="phone" size={24} color="#4C2808" />
              <Text style={styles.infoText}>{userData?.telephone || 'Phone not available'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="badge" size={24} color="#4C2808" />
              <Text style={styles.infoText}>{userData?.cin || 'CIN not available'}</Text>
            </View>
            
            <View style={styles.infoItem}>
              <Icon name="verified-user" size={24} color="#4C2808" />
              <Text style={styles.infoText}>{userData?.isAdmin ? 'Administrator' : 'Regular User'}</Text>
            </View>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.editProfileButton} 
              onPress={() => {
                setIsEditing(true);
                setEditedData({
                  username: userData?.username || '',
                  email: userData?.email || '',
                  telephone: userData?.telephone || '',
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: ''
                });
              }}
            >
              <Icon name="edit" size={20} color="#fff" />
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="logout" size={20} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  profileContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 5,
    fontSize: 18,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fff0f0',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b',
  },
  errorText: {
    color: '#d63031',
    fontSize: 14,
  },
  refreshButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
  refreshButtonText: {
    color: '#4C2808',
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 5,
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
    inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius:8,
    marginBottom: 15,

  },
  inputIcon: {
    marginLeft: 10,
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    paddingLeft: 0,
    borderColor: '#ddd',
    marginBottom: 10,
  marginTop:10

  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  profileEmail: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  profileInfo: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoText: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
    color: '#333',
  },
  actionButtons: {
    marginTop: 30,
    gap: 10,
  },
  refreshContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  refreshText: {
    marginLeft: 8,
    color: '#4C2808',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#4C2808',
    borderRadius: 8,
    marginTop: 5,
  },
  logoutText: {
    marginLeft: 8,
    color: '#fff',
    fontWeight: '500',
  },
  // New styles for edit form
  editForm: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
  },
 
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#4C2808',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#4C2808',
    borderRadius: 8,
 
  },
  saveButtonText: {
    marginLeft: 8,
    color: '#fff',
    fontWeight: '500',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginTop: 10,
  },
  cancelButtonText: {
    marginLeft: 8,
    color: '#4C2808',
    fontWeight: '500',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#4C2808',
    borderRadius: 8,
  },
  editProfileText: {
    marginLeft: 8,
    color: '#fff',
    fontWeight: '500',
  },
});

export default ProfileScreen;