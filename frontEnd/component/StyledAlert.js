import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity,
  Dimensions
} from 'react-native';

const { width } = Dimensions.get('window');

const StyledAlert = ({ visible, title, message, onClose }) => {
  if (!visible) return null;
  
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>{title}</Text>
          </View>
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>{message}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK</Text>
          </TouchableOpacity>
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
  alertContainer: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  titleContainer: {
    backgroundColor: '#4C2808', 
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  titleText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  messageContainer: {
    padding: 20,
    alignItems: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
  },
  buttonText: {
    color: '#4C2808',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default StyledAlert;