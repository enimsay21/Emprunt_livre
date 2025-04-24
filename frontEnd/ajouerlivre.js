import React, { useState } from 'react';
import { StyleSheet,View,Text,TextInput,TouchableOpacity,ScrollView,Image, ActivityIndicator,KeyboardAvoidingView,Platform,StatusBar,Modal} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import StyledAlert from './component/StyledAlert';

const API_URL = 'http://10.0.2.2:3000/api';

const AddBookScreen = ({ navigation }) => {
  const [book, setBook] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    genre: '',
    total_copies: '1',
    available_copies: '1'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [image, setImage] = useState(null);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
  const [imagePickerVisible, setImagePickerVisible] = useState(false);

  const handleChange = (field, value) => {
   
    setBook({ ...book, [field]: value });
    

    if (field === 'total_copies' && !isNaN(value) && parseInt(value) > 0) {
      setBook(prev => ({ ...prev, 'available_copies': value }));
    }
    
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    

    if (!book.title.trim()) newErrors.title = 'Title is required';
    if (!book.author.trim()) newErrors.author = 'Author is required';
    
    // ISBN validation
    if (book.isbn && !/^[0-9-]{10,17}$/.test(book.isbn.trim())) {
      newErrors.isbn = 'Invalid ISBN format';
    }
    
   
    if (!book.total_copies || isNaN(book.total_copies) || parseInt(book.total_copies) <= 0) {
      newErrors.total_copies = 'Number of copies must be a positive number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImagePickerPress = () => {
    setImagePickerVisible(true);
  };

  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      setAlert({
        visible: true,
        title: 'Permission denied',
        message: 'Permission to access gallery was denied'
      });
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
    
    setImagePickerVisible(false);
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      setAlert({
        visible: true,
        title: 'Permission denied',
        message: 'Permission to access camera was denied'
      });
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.8,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
    
    setImagePickerVisible(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Get token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');
      
      // Check if token exists
      if (!token) {
        setAlert({
          visible: true,
          title: 'Authentication error',
          message: 'You are not logged in. Please login to add a book.'
        });
        setLoading(false);
        return;
      }
      
      const bookData = {
        ...book,
        total_copies: parseInt(book.total_copies),
        available_copies: parseInt(book.available_copies),
        cover_url: image, 
      };
      
      const response = await axios.post(`${API_URL}/books`, bookData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAlert({
        visible: true,
        title: 'Success',
        message: 'Book added successfully'
      });
      

      setBook({
        title: '',
        author: '',
        isbn: '',
        description: '',
        genre: '',
        total_copies: '1',
        available_copies: '1'
      });
      setImage(null);
      
    } catch (error) {
      console.error('Error adding book:', error);
      
      let errorMessage = 'Unable to add book';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid data. Please check your information.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        // Navigate to login screen after alert is closed
        setTimeout(() => navigation.navigate('Login'), 2000);
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have admin rights to add a book.';
      }
      
      setAlert({
        visible: true,
        title: 'Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView>
          <View style={styles.content}>
            <View style={styles.imageContainer}>
              {image ? (
                <Image source={{ uri: image }} style={styles.coverImage} />
              ) : (
                <View style={styles.coverPlaceholder}>
                  <Icon name="image" size={42} color="#ccc" />
                  <Text style={styles.coverText}>Add a cover image</Text>
                </View>
              )}
              
              <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePickerPress}>
                <Icon name="camera-alt" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.form}>
              <FormField 
                label="Title" 
                required 
                value={book.title}
                onChangeText={(text) => handleChange('title', text)}
                placeholder="Book title"
                error={errors.title}
              />
              
              <FormField 
                label="Author" 
                required 
                value={book.author}
                onChangeText={(text) => handleChange('author', text)}
                placeholder="Author name"
                error={errors.author}
              />
              
              <FormField 
                label="Genre" 
                value={book.genre}
                onChangeText={(text) => handleChange('genre', text)}
                placeholder="Book genre"
              />
              
              <FormField 
                label="ISBN" 
                value={book.isbn}
                onChangeText={(text) => handleChange('isbn', text)}
                placeholder="ISBN "
                keyboardType="numeric"
                error={errors.isbn}
              />
              
              <FormField 
                label="Description" 
                value={book.description}
                onChangeText={(text) => handleChange('description', text)}
                placeholder="Book description "
                multiline
                numberOfLines={4}
              />
              
              <View style={styles.row}>
                <View style={styles.column}>
                  <FormField 
                    label="Copies" 
                    required
                    value={book.total_copies}
                    onChangeText={(text) => handleChange('total_copies', text)}
                    keyboardType="numeric"
                    error={errors.total_copies}
                  />
                </View>
                
                <View style={styles.column}>
                  <FormField 
                    label="Available" 
                    value={book.available_copies}
                    editable={false}
                  />
                </View>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.submitButton, loading && styles.submitButtonDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Icon name="add" size={24} color="#fff" style={styles.submitIcon} />
                  <Text style={styles.submitText}>Add Book</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
        
        {/* Image Source Selection Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={imagePickerVisible}
          onRequestClose={() => setImagePickerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Image Source</Text>
              
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={takePhoto}
              >
                <Icon name="camera-alt" size={24} color="#4C2808" style={styles.modalButtonIcon} />
                <Text style={styles.modalButtonText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalButton} 
                onPress={pickImageFromGallery}
              >
                <Icon name="photo-library" size={24} color="#4C2808" style={styles.modalButtonIcon} />
                <Text style={styles.modalButtonText}>Choose from Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setImagePickerVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        <StyledAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          onClose={() => {
            setAlert({ ...alert, visible: false });
            if (alert.title === 'Success') {
              navigation.goBack();
            }
          }}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

// Form field component for cleaner code
const FormField = ({ 
  label, 
  required = false, 
  value, 
  onChangeText, 
  placeholder, 
  error, 
  helpText,
  multiline = false,
  numberOfLines = 1,
  keyboardType = 'default',
  editable = true
}) => {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {required && <Text style={styles.requiredMark}>*</Text>}
      </View>
      
      <TextInput
        style={[
          styles.textInput, 
          error && styles.inputError,
          multiline && styles.multilineInput,
          !editable && styles.disabledInput
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        multiline={multiline}
        numberOfLines={multiline ? numberOfLines : 1}
        keyboardType={keyboardType}
        editable={editable}
        textAlignVertical={multiline ? "top" : "center"}
      />
      
      {helpText && <Text style={styles.helpText}>{helpText}</Text>}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4C2808',
  },
  
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4C2808',
  },
  content: {
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 16,
    position: 'relative',
  },
  coverImage: {
    width: 180,
    height: 240,
    borderRadius: 8,
  },
  coverPlaceholder: {
    width: 180,
    height: 240,
    borderRadius: 8,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  coverText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
  },
  imagePickerButton: {
    position: 'absolute',
    bottom: -15,
    right: 160,
    backgroundColor: '#4C2808',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  form: {
    marginBottom: 20,
    marginTop: 10,
  },
  row: {
    flexDirection: 'row',
    marginHorizontal: -8,
  },
  column: {
    flex: 1,
    paddingHorizontal: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 17,
    fontWeight: '500',
    color: '#4C2808',
  },
  requiredMark: {
    color: '#E53935',
    marginLeft: 2,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#E53935',
  },
  multilineInput: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#888',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#E53935',
    marginTop: 4,
  },
  submitButton: {
    backgroundColor: '#4C2808',
    borderRadius: 8,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 30,
  },
  submitButtonDisabled: {
    backgroundColor: '#9E9E9E',
  },
  submitIcon: {
    marginRight: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4C2808',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  modalButtonIcon: {
    marginRight: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4C2808',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginTop: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#E53935',
  },
});

export default AddBookScreen;