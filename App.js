import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'react-native';

import SplashScreen from './frontEnd/SplashScreen';
import LoginScreen from './frontEnd/login';
import RegisterScreen from './frontEnd/register';
import HomeScreen from './frontEnd/home';
import AdminScreen from './frontEnd/Admin';

import EditBookScreen from './frontEnd/EditBookScreen';
import AddBookScreen from './frontEnd/ajouerlivre';
import BookDetailScreen from './frontEnd/BookDetailScreen';
import BookDetailUserScreen from './frontEnd/detailbookuser';
import NotificationsScreen from './frontEnd/NotificationsScreen';
import LoanedBooks from './frontEnd/userEmprunt';
import VerificationCodeScreen from './frontEnd/ResetPassword';
 // Make sure to import ProfileScreen

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialRoute, setInitialRoute] = useState("Splash");

  useEffect(() => {
    // Check for existing token when app starts
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        
        if (token) {
          try {
            // Verify if the token is still valid by checking userData
            const userData = await AsyncStorage.getItem('userData');
            
            if (userData) {
              const user = JSON.parse(userData);
              setIsAdmin(!!user.isAdmin); // Convert to boolean
              setUserToken(token);
              setInitialRoute(user.isAdmin ? "Admin" : "Home");
            } else {
              // If we have a token but no userData, we should fetch user data
              // or clear token and go to login
              await AsyncStorage.removeItem('userToken');
              setInitialRoute("Login");
            }
          } catch (e) {
            console.log('Error parsing userData', e);
            await AsyncStorage.removeItem('userToken');
            setInitialRoute("Login");
          }
        } else {
          // No token, go to login (after splash)
          setInitialRoute("Splash");
        }
      } catch (e) {
        console.log('Failed to load token', e);
        setInitialRoute("Splash");
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  if (isLoading) {
    // Show a loading placeholder while checking authentication
    return null;
  }

  return (
    <NavigationContainer>
      <StatusBar backgroundColor="#4C2808" barStyle="light-content" />
      <Stack.Navigator 
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="VerificationCode" component={VerificationCodeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
        <Stack.Screen name="AddBook" component={AddBookScreen} />
        <Stack.Screen name="EditBook" component={EditBookScreen} />
        <Stack.Screen name="BookDetail" component={BookDetailScreen} />
        <Stack.Screen name="BookDetailUser" component={BookDetailUserScreen} />
        <Stack.Screen  name="Notifications"  component={NotificationsScreen} options={{ headerShown: false }}/>
        <Stack.Screen  name="LoanedBooks"  component={LoanedBooks} />


      </Stack.Navigator>
    </NavigationContainer>
  );
}