import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import StyledAlert from './component/StyledAlert'; // Adjust the path as needed
import ForgotPasswordModal from './ForgotPassword'; // Adjust the path as needed

// Ensure web browser redirect is handled properly
WebBrowser.maybeCompleteAuthSession();

const API_URL = 'http://10.0.2.2:3000/api';

// Replace with your own Google client IDs
const GOOGLE_ANDROID_CLIENT_ID = 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com';
const GOOGLE_EXPO_CLIENT_ID = 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com';

const LoginScreen = () => {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  
  // Forgot password modal state
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false);

  // Google Auth setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: GOOGLE_IOS_CLIENT_ID,
    expoClientId: GOOGLE_EXPO_CLIENT_ID,
  });

  // Show alert function
  const showAlert = (title, message) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Handle Google authentication response
  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      handleGoogleLogin(authentication.accessToken);
    }
  }, [response]);

  const handleLogin = async () => {
    // Check if fields are empty
    if (!email.trim()) {
      showAlert('Error', 'Please enter your email address');
      return;
    }
    
    if (!password) {
      showAlert('Error', 'Please enter your password');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Error', 'Please enter a valid email address');
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          showAlert('Authentication Failed', 'Incorrect email or password');
        } else if (response.status === 404) {
          showAlert('User Not Found', 'No account exists with this email');
        } else {
          showAlert('Login Failed', data.message || 'An error occurred during login');
        }
        return;
      }
      
      // Store the token in AsyncStorage
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      
      // Navigate based on user role
      if (data.user.isAdmin) {
        navigation.navigate('Admin');
      } else {
        navigation.navigate('Home');
      }
      
    } catch (error) {
      showAlert('Connection Error', 'Unable to connect to the server. Please check your internet connection and try again.');
    }
  };

  // Update your handleForgotPassword function in LoginScreen.js
  const handleForgotPassword = async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send reset link');
      }
      
      // Parse JSON response
      const data = await response.json();
      return data;
    } catch (error) {
      // Check if the error is specifically a JSON parsing error
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        console.error('JSON parsing error:', error);
        throw new Error('Server returned an invalid response. Please try again later.');
      }
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  // Handle Google login
  const handleGoogleLogin = async (accessToken) => {
    try {
      // Send the access token to your backend
      const response = await fetch(`${API_URL}/auth/google-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        showAlert('Google Login Failed', data.message || 'An error occurred during Google login');
        return;
      }
      
      // Store the token and user data
      await AsyncStorage.setItem('userToken', data.token);
      await AsyncStorage.setItem('userData', JSON.stringify(data.user));
      
      // Navigate based on user role
      if (data.user.isAdmin) {
        navigation.navigate('Admin');
      } else {
        navigation.navigate('Home');
      }
    } catch (error) {
      showAlert('Google Login Error', 'Unable to connect to the server. Please check your internet connection and try again.');
    }
  };
  
  // Initiate Google login flow
  const initiateGoogleLogin = () => {
    promptAsync();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.phoneFrame}>
        <View style={styles.contentContainer}>
          {/* Book Image */}
          <Image 
            source={require('../assets/book.png')} 
            style={styles.bookImage} 
            resizeMode="contain"
          />
          <Text style={styles.imageText}>BookEase</Text>
          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#888" style={styles.icon} />
              <TextInput
                style={styles.passwordInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Password"
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
            
            <TouchableOpacity 
              onPress={() => setForgotPasswordVisible(true)}
              style={styles.forgotPasswordContainer}
            >
              <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            
            <View style={styles.orContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>Or Log In With</Text>
              <View style={styles.line} />
            </View>
            
            <TouchableOpacity style={styles.googleButton} onPress={initiateGoogleLogin}>
              <Ionicons name="logo-google" size={24} color="#ffffff" style={styles.googleIcon} />
              <Text style={styles.googleButtonText}>Sign In with Google</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.noAccountText}>Don't Have Any Account?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signupText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
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
      
      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        visible={forgotPasswordVisible}
        onClose={() => setForgotPasswordVisible(false)}
        onSubmit={handleForgotPassword}
      />
    </SafeAreaView>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneFrame: {
    width: 400,
    height: 660,
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
  },
  bookImage: {
    width: '80%',
    height: '25%',
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
  },
  label: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  input: {
    flex: 1,
    height: 55,
    paddingHorizontal: 19,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  icon: {
    marginLeft: 15,
    alignSelf: 'center', 
  },
  passwordContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    marginBottom: 5,
    backgroundColor: '#f5f5f5',
  },
  passwordInput: {
    flex: 1,
    height: 55,
    paddingHorizontal: 15,
    fontSize: 16,
    alignItems: 'center',
  },
  eyeIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 15,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPassword: {
    textAlign: 'right',
    color: '#888',
    fontSize: 15,
  },
  loginButton: {
    backgroundColor: '#4C2808',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  line: {
    flex: 1,
    height: 3,
    backgroundColor: '#ddd',
  },
  orText: {
    marginHorizontal: 10,
    color: '#888',
    fontSize: 15,
  },
  googleButton: {
    flexDirection: 'row',
    backgroundColor: '#A9A9A9',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10,
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccountText: {
    fontSize: 15,
    color: '#333',
  },
  signupText: {
    fontSize: 15,
    color: '#4C2808',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default LoginScreen;