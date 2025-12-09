import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  ImageBackground,
} from 'react-native';
import { auth, database } from '../config/firebase';
import { supabase } from '../config/firebase';
import { ref, onValue, off, update, remove, get } from 'firebase/database';
import { signOut, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function Profile({ navigation }) {
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    pseudo: '',
    phone: '',
    profileImage: '',
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [phone, setPhone] = useState('');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const user = auth.currentUser;

  // Function to upload image to Supabase (same as friend's code)
 const uploadImageToSupabase = async (localURL) => {
  try {
    // First, try to check if user is authenticated with Supabase
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !supabaseUser) {
      console.log('No Supabase user found, trying with Firebase UID');
      // Continue with Firebase auth if Supabase auth fails
    }

    const response = await fetch(localURL);
    const blob = await response.blob();
    const arraybuffer = await new Response(blob).arrayBuffer();
    
    const fileName = `${auth.currentUser.uid}.jpg`;
    
    console.log('Uploading file:', fileName);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(fileName, arraybuffer, {
        upsert: true,
        contentType: 'image/jpeg'
      });

    if (uploadError) {
      console.error('Upload error details:', uploadError);
      
      // If RLS error, suggest solution to user
      if (uploadError.message.includes('row-level security policy')) {
        throw new Error('Storage permissions issue. Please check bucket policies in Supabase.');
      }
      
      throw uploadError;
    }

    console.log('Upload successful:', uploadData);
    
    const { data } = supabase.storage
      .from('profile-images')
      .getPublicUrl(fileName);
    
    console.log('Public URL:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw error;
  }
};


  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        const userRef = ref(database, `users/${user.uid}`);
        
        try {
          const snapshot = await get(userRef);
          if (snapshot.exists()) {
            const data = snapshot.val();
            setUserData({
              name: data.name || '',
              email: data.email || user.email || '',
              pseudo: data.pseudo || '',
              phone: data.phone || '',
              profileImage: data.profileImage || '',
              uid: data.uid || user.uid,
              createdAt: data.createdAt || '',
              updatedAt: data.updatedAt || '',
            });
            setName(data.name || '');
            setPseudo(data.pseudo || '');
            setPhone(data.phone || '');
          } else {
            console.log('No user data found in database for UID:', user.uid);
            // Create default profile
            const defaultData = {
              uid: user.uid,
              email: user.email || '',
              name: user.displayName || 'User',
              pseudo: user.email?.split('@')[0] || 'user',
              phone: '',
              profileImage: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
              createdAt: new Date().toISOString(),
            };
            setUserData(defaultData);
            setName(defaultData.name);
            setPseudo(defaultData.pseudo);
            
            // Save to database
            await update(userRef, defaultData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        console.log('No authenticated user found');
      }
    };

    fetchUserData();
  }, [user]);

  const logout = async () => {
    try {
      await signOut(auth);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Logout failed:', error);
      Alert.alert('Logout Error', 'Failed to logout. Please try again.');
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return;
    }

    if (!pseudo.trim()) {
      Alert.alert('Validation Error', 'Please enter a username.');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Validation Error', 'Please enter your phone number.');
      return;
    }

    setIsUpdating(true);
    try {
      await update(ref(database, `users/${user.uid}`), {
        name: name.trim(),
        pseudo: pseudo.trim(),
        phone: phone.trim(),
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setUserData({
        ...userData,
        name: name.trim(),
        pseudo: pseudo.trim(),
        phone: phone.trim(),
        updatedAt: new Date().toISOString(),
      });
      
      setModalVisible(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
      Alert.alert('Update Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const confirmDelete = () => {
    setDeletePassword('');
    setDeleteModalVisible(true);
  };

  const handleDelete = async () => {
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'No authenticated user found. Please sign in again.');
        setIsDeleting(false);
        navigation.navigate('Login');
        return;
      }

      // Reauthenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Delete profile image from Supabase
      try {
        await supabase.storage
          .from('profile-images')
          .remove([`${currentUser.uid}.jpg`]);
      } catch (storageError) {
        console.log('Storage deletion error:', storageError);
        // Continue even if storage deletion fails
      }
      
      // Delete user data from database
      await remove(ref(database, `users/${currentUser.uid}`));
      
      // Delete the Firebase Authentication account
      await deleteUser(currentUser);
      
      setDeleteModalVisible(false);
      Alert.alert('Success', 'Your account has been deleted successfully.');
      
      // Navigate to Signup page
      navigation.reset({
        index: 0,
        routes: [{ name: 'Signup' }],
      });
      
    } catch (error) {
      console.error('Delete failed:', error.code, error.message);
      
      let errorMessage = 'Failed to delete profile. Please try again.';
      
      switch (error.code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          errorMessage = 'Incorrect password. Please try again.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'This operation requires recent authentication. Please logout and login again.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your internet connection.';
          break;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsDeleting(false);
      setDeletePassword('');
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        // Direct upload using friend's method
        uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Upload profile picture function (same as friend's)
  const uploadProfilePicture = async (imageUri) => {
    setUploading(true);
    try {
      // Upload to Supabase
      const imageUrl = await uploadImageToSupabase(imageUri);
      
      // Update Firebase database with new image URL
      await update(ref(database, `users/${user.uid}`), { 
        profileImage: imageUrl,
        updatedAt: new Date().toISOString(),
      });
      
      // Update local state
      setUserData({ ...userData, profileImage: imageUrl });
      
      Alert.alert('Success', 'Profile picture uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', error.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ImageBackground 
      source={require('../assets/BGIMAGE2.avif')} // Add your background image
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.profileContainer}>
            <TouchableOpacity onPress={pickImage} disabled={uploading}>
              {userData.profileImage ? (
                <Image source={{ uri: userData.profileImage }} style={styles.profileImage} />
              ) : (
                <View style={styles.uploadButton}>
                  <Text style={styles.uploadText}>Upload Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            
            {uploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color="#007bff" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}

            <Text style={styles.name}>{userData.name || 'Unnamed User'}</Text>
            <Text style={styles.pseudo}>@{userData.pseudo || 'No Username'}</Text>
            
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{userData.email || user?.email || 'No Email'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={18} color="#666" />
              <Text style={styles.infoText}>{userData.phone || 'No Phone Number'}</Text>
            </View>
            
            {userData.createdAt && (
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={18} color="#666" />
                <Text style={styles.infoText}>
                  Joined: {new Date(userData.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            )}
            
            {userData.updatedAt && (
              <View style={styles.infoRow}>
                <Ionicons name="time-outline" size={18} color="#666" />
                <Text style={styles.infoText}>
                  Updated: {new Date(userData.updatedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
            
            {userData.uid && (
              <View style={styles.infoRow}>
                <Ionicons name="key-outline" size={18} color="#666" />
                <Text style={[styles.infoText, styles.uidText]}>ID: {userData.uid.substring(0, 8)}...</Text>
              </View>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.editBtn} 
                onPress={() => setModalVisible(true)}
                disabled={uploading}
              >
                <Ionicons name="create-outline" size={18} color="white" />
                <Text style={styles.editText}> Edit Profile</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.deleteBtn} 
                onPress={confirmDelete}
                disabled={uploading}
              >
                <Ionicons name="trash-outline" size={18} color="white" />
                <Text style={styles.deleteText}> Delete </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={logout} disabled={uploading}>
              <Ionicons name="log-out-outline" size={20} color="white" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Edit Profile Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => !isUpdating && setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                editable={!isUpdating}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={pseudo}
                onChangeText={setPseudo}
                editable={!isUpdating}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!isUpdating}
              />
              
              <Text style={styles.emailLabel}>
                Email: {userData.email || user?.email}
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.saveBtn, isUpdating && styles.disabledButton]}
                  onPress={handleUpdate}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.saveText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.cancelBtn, isUpdating && styles.disabledButton]}
                  onPress={() => setModalVisible(false)}
                  disabled={isUpdating}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Delete Profile Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={deleteModalVisible}
          onRequestClose={() => !isDeleting && setDeleteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Ionicons name="warning-outline" size={40} color="#ff4d4d" style={{ marginBottom: 10 }} />
              <Text style={styles.modalTitle}>Delete Account</Text>
              
              <Text style={styles.warningText}>
                This will permanently delete your account and all your data. This action cannot be undone.
              </Text>
              
              <Text style={styles.passwordLabel}>Enter your password to confirm:</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry={true}
                editable={!isDeleting}
              />
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.deleteConfirmBtn, isDeleting && styles.disabledButton]}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.deleteConfirmText}>Delete Account</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.cancelBtn, isDeleting && styles.disabledButton]}
                  onPress={() => setDeleteModalVisible(false)}
                  disabled={isDeleting}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
}

/* ------------------------ STYLES ------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(232, 213, 242, 0.85)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 25,
    alignItems: 'center',
    paddingBottom: 40,
  },
  profileContainer: {
    width: '100%',
    padding: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 28,
    marginTop: 20,
    shadowColor: '#C8A2C8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 2,
    borderColor: 'rgba(212, 181, 232, 0.5)',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f6fa',
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: 'rgba(212, 181, 232, 0.6)',
  },
  uploadButton: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007bff',
    borderRadius: 70,
    marginBottom: 20,
    borderWidth: 4,
    borderColor: 'rgba(212, 181, 232, 0.6)',
  },
  uploadText: {
    color: '#FFFFFF',
    fontWeight: '700',
    textAlign: 'center',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadingText: {
    color: '#007bff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  pseudo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    width: '100%',
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#444',
    marginLeft: 10,
    flex: 1,
  },
  uidText: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 25,
    gap: 8,
  },
  editBtn: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  editText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#ff4d4d',
    paddingVertical: 12,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff4d4d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  logoutBtn: {
    marginTop: 30,
    flexDirection: 'row',
    backgroundColor: '#6c757d',
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#6c757d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(107, 76, 122, 0.5)',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#C8A2C8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(212, 181, 232, 0.5)',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    color: '#6B4C7A',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  warningText: {
    fontSize: 14,
    color: '#E8A5C8',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  passwordLabel: {
    fontSize: 14,
    color: '#ff4d4d',
    marginBottom: 8,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    height: 52,
    borderWidth: 2,
    borderColor: 'rgba(212, 181, 232, 0.5)',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    color: '#6B4C7A',
    fontWeight: '500',
  },
  emailLabel: {
    fontSize: 15,
    color: '#444',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalButtons: {
    width: '100%',
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#007bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  deleteConfirmBtn: {
    backgroundColor: '#ff4d4d',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#ff4d4d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteConfirmText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  cancelBtn: {
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(212, 181, 232, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  cancelText: {
    color: '#666',
    fontWeight: '700',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
});