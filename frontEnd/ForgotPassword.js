import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const API_URL = 'http://10.0.2.2:3000/api';

const ForgotPasswordModal = ({ visible, onClose }) => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleSubmit = async () => {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email)) {
      setMessage('Please enter a valid email address');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');
    
    try {
      // Send request to backend
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset link');
      }
      
      setMessage('Verification code sent to your email');
      setMessageType('success');
      
      // Navigate to verification screen after a brief delay
      setTimeout(() => {
        onClose();
        navigation.navigate('VerificationCode', { email });
      }, 1500);
      
    } catch (error) {
      setMessage(error.message || 'Failed to send reset link');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.headerText}>Forgot Password</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.content}>
            <Text style={styles.description}>
              Enter your email address and we'll send you a verification code to reset your password.
            </Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color="#888" style={styles.icon} />
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            
            {message ? (
              <Text style={[
                styles.messageText,
                messageType === 'success' ? styles.successText : styles.errorText
              ]}>
                {message}
              </Text>
            ) : null}
            
            <TouchableOpacity 
              style={[styles.submitButton, isLoading && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Send Verification Code</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.9,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    backgroundColor: '#4C2808',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  headerText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  content: {
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  icon: {
    marginLeft: 15,
    alignSelf: 'center',
  },
  input: {
    flex: 1,
    height: 55,
    paddingHorizontal: 19,
    fontSize: 16,
    backgroundColor: '#f5f5f5',
  },
  submitButton: {
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
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageText: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 15,
  },
  errorText: {
    color: '#FF5252',
  },
  successText: {
    color: '#4CAF50',
  },
});

export default ForgotPasswordModal;