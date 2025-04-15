import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import StyledAlert from './component/StyledAlert'; // Adjust path as needed

const API_URL = 'http://10.0.2.2:3000/api';

const VerificationCodeScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const email = route.params?.email || '';
  
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');

  // Show alert function
  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Handle closing the screen
  const handleClose = () => {
    navigation.goBack();
  };

  const handleVerifyAndReset = async () => {
    // Validation
    if (!verificationCode) {
      showAlert('Error', 'Please enter the verification code');
      return;
    }
    
    if (!newPassword) {
      showAlert('Error', 'Please enter a new password');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showAlert('Error', 'Passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          verificationCode,
          newPassword,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }
      
      showAlert('Success', 'Your password has been reset successfully');
      
      // After successful reset, navigate to login after a delay
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
      
    } catch (error) {
      showAlert('Error', error.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.phoneFrame}>
        <View style={styles.contentContainer}>
          {/* Close Button (X icon) */}
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#4C2808" />
          </TouchableOpacity>
          
          {/* Book Image */}
          <Image 
            source={require('../assets/book.png')} 
            style={styles.bookImage} 
            resizeMode="contain"
          />
          <Text style={styles.imageText}>BookEase</Text>
          
          {/* Verification Form */}
          <View style={styles.formContainer}>
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              Enter the verification code sent to {email}
            </Text>
            
            <Text style={styles.label}>Verification Code</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={22} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            
            <Text style={styles.label}>New Password</Text>
            <View style={styles.passwordContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.icon} />
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                placeholder="New Password"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.passwordContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.icon} />
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm Password"
                autoCapitalize="none"
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#888" 
                />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[styles.verifyButton, isLoading && styles.disabledButton]}
              onPress={handleVerifyAndReset}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.verifyButtonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
            
            
          </View>
        </View>
      </View>
      
      {/* Custom Alert Component */}
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
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneFrame: {
    width: 400,
    height: 700,
    borderRadius: 30,
    backgroundColor: 'white',
    overflow: 'hidden',
    borderWidth: 10,
    borderColor: 'white',
  },
  contentContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative', // Added for absolute positioning of close button
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  bookImage: {
    width: '80%',
    height: '20%',
    alignSelf: 'center',
  },
  imageText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 0,
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4C2808',
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 17,
    color: '#333',
    marginBottom: 5,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  passwordContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
  },
  icon: {
    marginLeft: 15,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    height: 55,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  passwordInput: {
    flex: 1,
    height: 55,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 15,
  },
  verifyButton: {
    backgroundColor: '#4C2808',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#a88566',
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToLoginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  backToLoginText: {
    fontSize: 16,
    color: '#4C2808',
    marginLeft: 5,
  },
});

export default VerificationCodeScreen;