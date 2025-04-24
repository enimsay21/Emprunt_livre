import React, { useState, useEffect } from 'react';
import {StyleSheet,View,Text,TextInput,TouchableOpacity,ScrollView,Image,ActivityIndicator,Modal} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Camera from 'expo-camera';
import StyledAlert from './component/StyledAlert';

const API_URL = 'http://10.0.2.2:3000/api';

const EditBookScreen = ({ route, navigation }) => {
  const { bookId } = route.params;
  
  const [book, setBook] = useState({
    id: '',
    title: '',
    author: '',
    isbn: '',
    cover_url: '',
    description: '',
    genre: '',
    total_copies: '1',
    available_copies: '1'
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchingBook, setFetchingBook] = useState(true);
  const [errors, setErrors] = useState({});
  const [image, setImage] = useState(null);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '' });
  const [imageModalVisible, setImageModalVisible] = useState(false);


  useEffect(() => {
    const fetchBookData = async () => {
      try {
        setFetchingBook(true);
        const token = await AsyncStorage.getItem('userToken');
        const response = await axios.get(`${API_URL}/books/${bookId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const bookData = response.data;
        setBook({
          id: bookData.id,
          title: bookData.title || '',
          author: bookData.author || '',
          isbn: bookData.isbn || '',
          cover_url: bookData.cover_url || '',
          description: bookData.description || '',
          genre: bookData.genre || '',
          total_copies: bookData.total_copies?.toString() || '1',
          available_copies: bookData.available_copies?.toString() || '1'
        });
        
        setImage(bookData.cover_url || null);
      } catch (error) {
        console.error('Error fetching book data:', error);
        setAlert({
          visible: true,
          title: 'Error',
          message: 'Unable to load book data'
        });
      } finally {
        setFetchingBook(false);
      }
    };
    
    fetchBookData();
  }, [bookId]);

  const handleChange = (field, value) => {
    setBook({ ...book, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!book.title.trim()) newErrors.title = 'Title is required';
    if (!book.author.trim()) newErrors.author = 'Author is required';
    
  
    if (!book.total_copies || isNaN(book.total_copies) || parseInt(book.total_copies) <= 0) {
      newErrors.total_copies = 'Total copies must be a positive number';
    }
    
    // La validation available_copies n'est pas supérieure à total_copies
    if (
      parseInt(book.available_copies) > parseInt(book.total_copies) || 
      isNaN(book.available_copies) || 
      parseInt(book.available_copies) < 0
    ) {
      newErrors.available_copies = 'Available copies must be between 0 and total copies';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      setAlert({
        visible: true,
        title: 'Permission Denied',
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
    setImageModalVisible(false);
  };

  const takePicture = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      setAlert({
        visible: true,
        title: 'Permission Denied',
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
    setImageModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
           
      const token = await AsyncStorage.getItem('userToken');
      const bookData = {
        ...book,
        total_copies: parseInt(book.total_copies),
        available_copies: parseInt(book.available_copies),
        cover_url: image || book.cover_url, 
      };
      
      await axios.put(`${API_URL}/books/${book.id}`, bookData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAlert({
        visible: true,
        title: 'Success',
        message: 'Book updated successfully'
      });
      
    } catch (error) {
      console.error('Error updating book:', error);
      
      setAlert({
        visible: true,
        title: 'Error',
        message: error.response?.data?.message || 'Unable to update book'
      });
    } finally {
      setLoading(false);
    }
  };

  if (fetchingBook) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4C2808" />
        <Text style={styles.loadingText}>Loading book data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Edit Book</Text>
        <View style={styles.appBarRight} />
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
       
          <View style={styles.coverSection}>
            {image ? (
              <Image source={{ uri: image }} style={styles.coverPreview} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Icon name="book" size={40} color="#4C2808" />
                <Text style={styles.imagePlaceholderText}>No Cover</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.cameraButton} 
              onPress={() => setImageModalVisible(true)}
            >
              <Icon name="photo-camera" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={book.title}
              onChangeText={(text) => handleChange('title', text)}
              placeholder="Book title"
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Author</Text>
            <TextInput
              style={[styles.input, errors.author && styles.inputError]}
              value={book.author}
              onChangeText={(text) => handleChange('author', text)}
              placeholder="Author name"
            />
            {errors.author && <Text style={styles.errorText}>{errors.author}</Text>}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Genre</Text>
            <TextInput
              style={styles.input}
              value={book.genre}
              onChangeText={(text) => handleChange('genre', text)}
              placeholder="Book genre (e.g. Fiction, Science, History)"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>ISBN</Text>
            <TextInput
              style={styles.input}
              value={book.isbn}
              onChangeText={(text) => handleChange('isbn', text)}
              placeholder="ISBN (optional)"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={book.description}
              onChangeText={(text) => handleChange('description', text)}
              placeholder="Book description (optional)"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
          
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Total copies</Text>
              <TextInput
                style={[styles.input, errors.total_copies && styles.inputError]}
                value={book.total_copies}
                onChangeText={(text) => handleChange('total_copies', text)}
                placeholder="Total copies"
                keyboardType="numeric"
              />
              {errors.total_copies && (
                <Text style={styles.errorText}>{errors.total_copies}</Text>
              )}
            </View>
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Available</Text>
              <TextInput
                style={[styles.input, errors.available_copies && styles.inputError]}
                value={book.available_copies}
                onChangeText={(text) => handleChange('available_copies', text)}
                placeholder="Available copies"
                keyboardType="numeric"
              />
              {errors.available_copies && (
                <Text style={styles.errorText}>{errors.available_copies}</Text>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Icon name="save" size={20} color="#fff" />
                <Text style={styles.buttonText}>Save changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      
    
      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Book Cover</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={takePicture}>
              <Icon name="camera-alt" size={24} color="#4C2808" />
              <Text style={styles.modalOptionText}>Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
              <Icon name="photo-library" size={24} color="#4C2808" />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  appBar: {
    flexDirection: 'row',
    backgroundColor: '#4C2808',
    height: 56,
    alignItems: 'center',
    elevation: 4,
    paddingHorizontal: 16,
  },
  appBarTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
  },
  appBarRight: {
    width: 40, // Balance the layout with backButton
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  // New Cover Section with Single Camera Button
  coverSection: {
    alignItems: 'center',
    marginBottom: 25, // Increased bottom margin for button
    position: 'relative',
  },
  coverPreview: {
    width: 150,
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#4C2808',
  },
  imagePlaceholder: {
    width: 150,
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4C2808',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    color: '#4C2808',
    marginTop: 10,
    fontSize: 14,
  },
  cameraButton: {
    backgroundColor: '#4C2808',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4C2808',
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  modalCancelButton: {
    marginTop: 15,
    padding: 10,
  },
  modalCancelText: {
    color: '#4C2808',
    fontWeight: 'bold',
    fontSize: 16,
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#4C2808',
    fontWeight: '500',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ff5252',
  },
  textArea: {
    minHeight: 100,
  },
  errorText: {
    color: '#ff5252',
    fontSize: 12,
    marginTop: 5,
  },
  helperText: {
    color: '#666',
    fontSize: 12,
    marginTop: 5,
  },
  button: {
    backgroundColor: '#4C2808',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default EditBookScreen;