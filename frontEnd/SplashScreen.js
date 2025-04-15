import React, { useEffect } from 'react';
import { View, Image, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Wait for animation to complete (3 seconds instead of 6 for better UX)
        await new Promise(resolve => setTimeout(resolve, 7000));
        
        // Check for existing token
        const token = await AsyncStorage.getItem('userToken');
        
        if (token) {
          // If token exists, check user role
          const userData = await AsyncStorage.getItem('userData');
          if (userData) {
            const user = JSON.parse(userData);
            // Navigate based on user role
            navigation.replace(user.isAdmin ? 'Admin' : 'Home');
            return;
          }
        }
        
        // Default to Login if no token or userData
        navigation.replace('Login');
      } catch (error) {
        console.error('Error in splash screen:', error);
        navigation.replace('Login');
      }
    };

    checkAuthStatus();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Image 
        source={require('../assets/book.png')} 
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>BookEase</Text>
      <Text style={styles.subtitle}>Your Reading Companion</Text>
      <ActivityIndicator 
        size="large" 
        color="#4C2808" 
        style={styles.loader} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4C2808',
    marginBottom: 8,
    // Note: Ensure Chewy-Regular font is properly installed in your project
    // If not, the system will fall back to default font
    fontFamily: 'Chewy-Regular',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});

export default SplashScreen;