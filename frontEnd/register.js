import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StyledAlert from './component/StyledAlert'; // Importez le composant d'alerte

const API_URL = 'http://10.0.2.2:3000/api';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [cin, setCin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // État pour l'alerte stylisée
  const [alert, setAlert] = useState({
    visible: false,
    title: '',
    message: ''
  });

  const showAlert = (title, message) => {
    setAlert({
      visible: true,
      title,
      message
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, visible: false }));
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone) => {
    const re = /^[0-9]{8,}$/;
    return re.test(phone);
  };

  const handleRegister = async () => {
    // Validation
    if (!name || !email || !telephone || !cin || !password) {
      showAlert('Missing Fields', 'All fields are required');
      return;
    }
  
    if (!validateEmail(email)) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }
  
    if (!validatePhone(telephone)) {
      showAlert('Invalid Phone', 'Please enter a valid phone number');
      return;
    }
    
    if (password.length < 6) {
      showAlert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: name,
          email: email,
          telephone: telephone,
          cin: cin,
          password: password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 400 && data.message && data.message.includes('already in use')) {
          showAlert('Email Already Used', 'This email or username is already in use');
        } else {
          showAlert('Registration Error', data.message || 'Registration failed. Please try again.');
        }
        return;
      }
      
      showAlert('Registration Successful', 'Welcome! You can now log in.');
      
      // Naviguer vers la page de connexion après fermeture de l'alerte
      setTimeout(() => {
        navigation.navigate('Login');
      }, 1000);
      
    } catch (error) {
      console.error("Error details:", error);
      showAlert('Connection Error', 'Unable to connect to the server. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Alerte stylisée */}
      <StyledAlert 
        visible={alert.visible} 
        title={alert.title} 
        message={alert.message} 
        onClose={hideAlert} 
      />
      
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.headerText}>Create Account</Text>
        <Text style={styles.subheaderText}>
          Fill Your Information Below Or Register With Your Social Account
        </Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={20} color="#aaa" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="UserName"
              placeholderTextColor="#aaa"
            />
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#aaa" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enimsay12@Gmail.Com"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
        </View>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Phone</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={20} color="#aaa" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={telephone}
              onChangeText={setTelephone}
              placeholder="+212*********"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>CIN</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="id-card-outline" size={20} color="#aaa" style={styles.icon} />
            <TextInput
              style={styles.input}
              value={cin}
              onChangeText={setCin}
              placeholder="M******"
              placeholderTextColor="#aaa"
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#aaa" style={styles.icon} />
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="••••••"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={22} 
                color="#888" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.signUpButton, loading && styles.disabledButton]} 
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.signUpButtonText}>
            {loading ? 'Chargement...' : 'Sign Up'}
          </Text>
        </TouchableOpacity>

        <View style={styles.loginTextContainer}>
          <Text style={styles.accountText}>Already Have An Account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    padding: 20,
    alignItems: 'center',
    flexGrow: 1,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subheaderText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  formGroup: {
    width: '100%',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  icon: {
    marginRight: 5,
    color:'#4C2808'
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  signUpButton: {
    backgroundColor: '#4C2808',
    borderRadius: 12,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  disabledButton: {
    backgroundColor: '#8E6E50',
    opacity: 0.7,
  },
  signUpButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',

  },
  accountText: {
    color: '#666',
    fontSize: 14,
  },
  loginText: {
    color: '#4C2808',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default RegisterScreen;