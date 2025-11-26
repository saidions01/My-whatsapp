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
} from 'react-native';
import { auth, database } from '../config/firebase';
import { ref, onValue, off, update, remove } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function Profile({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [pseudo, setPseudo] = useState('');
  const [phone, setPhone] = useState('');
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);

      const unsubscribe = onValue(userRef, snapshot => {
        const data = snapshot.val();
        setUserData(data);
        setName(data.name);
        setPseudo(data.pseudo);
        setPhone(data.phone);
      });

      return () => off(userRef);
    }
  }, [user]);

  const logout = async () => {
    try {
      await signOut(auth);
      navigation.replace('NewUser');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleUpdate = async () => {
    if (!name || !pseudo || !phone) {
      Alert.alert('Validation Error', 'Please fill out all fields.');
      return;
    }

    try {
      await update(ref(database, `users/${user.uid}`), {
        name,
        pseudo,
        phone,
      });
      setModalVisible(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete your profile?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: handleDelete,
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const handleDelete = async () => {
    try {
      await remove(ref(database, `users/${user.uid}`));
      await signOut(auth);
      navigation.replace('NewUser');
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  if (!userData) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 10 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Card */}
      <View style={styles.card}>
        <Image
          source={{
            uri:
              userData?.profileImage ||
              'https://cdn-icons-png.flaticon.com/512/149/149071.png',
          }}
          style={styles.profileImage}
        />

        <Text style={styles.name}>{userData.name || 'Unnamed User'}</Text>
        <Text style={styles.pseudo}>{userData.pseudo || 'No Pseudo'}</Text>
        <Text style={styles.email}>
          <Ionicons name="mail-outline" size={18} /> {userData.email}
        </Text>
        <Text style={styles.phone}>
          <Ionicons name="call-outline" size={18} /> {userData.phone || 'No Phone Number'}
        </Text>
        <Text style={styles.date}>
          <Ionicons name="calendar-outline" size={18} /> Joined:{' '}
          {new Date(userData.createdAt).toLocaleDateString()}
        </Text>


          <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity style={styles.editBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete}>
          <Text style={styles.deleteText}>Delete Profile</Text>
        </TouchableOpacity>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
            />
            <TextInput
              style={styles.input}
              placeholder="Pseudo"
              value={pseudo}
              onChangeText={setPseudo}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Text style={styles.emailLabel}>
              Email: {userData.email}
            </Text>
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
              <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ------------------------ STYLES ------------------------ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: '#f4f6fa',
    alignItems: 'center',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 18,
    paddingVertical: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginTop: 30,
  },

  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 75,
    marginBottom: 15,
  },

  name: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 5,
  },

  pseudo: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginBottom: 5,
  },

  email: {
    fontSize: 15,
    color: '#444',
    marginVertical: 4,
  },

  phone: {
    fontSize: 15,
    color: '#444',
    marginVertical: 4,
  },

  date: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
  },

  editBtn: {
    marginTop: 20,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    height : 40,
    marginRight: 10

  },

  editText: {
    color: 'white',
    fontWeight: '600',
  },

  deleteBtn: {
    marginTop: 20,
    backgroundColor: '#ff4d4d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    height : 40
  },

  deleteText: {
    color: 'white',
    fontWeight: '600',
  },

  logoutBtn: {
    marginTop: 40,
    flexDirection: 'row',
    backgroundColor: '#ff4d4d',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 2,
  },

  logoutText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },

  emailLabel: {
    fontSize: 15,
    color: '#444',
    marginBottom: 15,
  },

  saveBtn: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },

  saveText: {
    color: 'white',
    fontWeight: '600',
  },

  closeBtn: {
    marginTop: 10,
  },

  closeText: {
    color: '#007bff',
    fontWeight: '600',
  },
});