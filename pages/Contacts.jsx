import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { auth, database } from '../config/firebase';
import { ref, onValue, off, set, get } from 'firebase/database';
import { Ionicons } from '@expo/vector-icons';

export default function Contacts({ navigation }) {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [myBlocked, setMyBlocked] = useState({});
  const [blockedByOthers, setBlockedByOthers] = useState({});

  useEffect(() => {
    const currentUser = auth.currentUser;
    setUser(currentUser);

    if (!currentUser) return;

    // Listen for contacts
    const contactsRef = ref(database, 'users');
    const unsubscribeContacts = onValue(contactsRef, (snapshot) => {
      const data = snapshot.val() || {};
      
      // Filter out the current user and convert to array
      const contactsArray = Object.entries(data)
        .filter(([userId]) => userId !== currentUser.uid)
        .map(([userId, userData]) => ({
          id: userId,
          ...userData,
          online: userData.online || false,
        }));

      setContacts(contactsArray);
      setFilteredContacts(contactsArray);
      setLoading(false);
    });

    // Listen for blocked users
    const blockedRef = ref(database, `users/${currentUser.uid}/blocked`);
    const unsubscribeBlocked = onValue(blockedRef, (snapshot) => {
      setMyBlocked(snapshot.val() || {});
    });

    return () => {
      unsubscribeContacts();
      unsubscribeBlocked();
      off(contactsRef);
      off(blockedRef);
    };
  }, []);

  useEffect(() => {
    // Check who blocked me
    if (user && contacts.length > 0) {
      const checkBlockedByOthers = async () => {
        const blockedByOthersMap = {};
        for (const contact of contacts) {
          try {
            const blockedRef = ref(database, `users/${contact.id}/blocked/${user.uid}`);
            const snapshot = await get(blockedRef);
            blockedByOthersMap[contact.id] = snapshot.exists() && snapshot.val() === true;
          } catch (error) {
            console.error('Error checking blocked status:', error);
          }
        }
        setBlockedByOthers(blockedByOthersMap);
      };
      checkBlockedByOthers();
    }
  }, [contacts, user]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(contact =>
        contact.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.pseudo?.toLowerCase().includes(searchText.toLowerCase()) ||
        contact.email?.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchText, contacts]);

  const getChatId = (userId1, userId2) => {
    // Create consistent chat ID (sorted user IDs)
    return [userId1, userId2].sort().join('-');
  };

  const handleContactPress = async (contact) => {
    if (!user) return;

    // Check if I blocked this contact
    if (myBlocked[contact.id]) {
      Alert.alert(
        'Contact Blocked',
        'You have blocked this contact. Unblock to start chatting.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Unblock', 
            onPress: async () => {
              const blockedRef = ref(database, `users/${user.uid}/blocked/${contact.id}`);
              await set(blockedRef, null); // Remove from blocked list
              // Now proceed to chat
              navigateToChat(contact);
            }
          }
        ]
      );
      return;
    }

    // Check if contact blocked me
    if (blockedByOthers[contact.id]) {
      Alert.alert(
        'Blocked',
        'This contact has blocked you. You cannot start a chat with them.',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    navigateToChat(contact);
  };

  const navigateToChat = (contact) => {
    const chatId = getChatId(user.uid, contact.id);
    
    // Navigate to Chat screen with the contact info
    navigation.navigate('Chat', { 
      chatId,
      contactName: contact.name,
      contactId: contact.id
    });
  };

  const toggleBlockContact = async (contactId, isBlocked) => {
    if (!user) return;

    try {
      const blockedRef = ref(database, `users/${user.uid}/blocked/${contactId}`);
      
      if (isBlocked) {
        // Unblock
        await set(blockedRef, null);
        Alert.alert('Success', 'Contact unblocked successfully');
      } else {
        // Block
        await set(blockedRef, true);
        Alert.alert('Success', 'Contact blocked successfully');
      }
    } catch (error) {
      console.error('Error toggling block:', error);
      Alert.alert('Error', 'Failed to update block status');
    }
  };

  const renderContactItem = ({ item }) => {
    const isBlockedByMe = myBlocked[item.id];
    const isBlockedByOther = blockedByOthers[item.id];
    const canChat = !isBlockedByMe && !isBlockedByOther;

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleContactPress(item)}
        disabled={isBlockedByOther}
      >
        <View style={styles.contactLeft}>
          <Image
            source={{
              uri: item.profileImage || 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
            }}
            style={styles.contactImage}
          />
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.name || 'Unknown User'}</Text>
            <Text style={styles.contactPseudo}>@{item.pseudo || 'nouser'}</Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, item.online ? styles.online : styles.offline]} />
              <Text style={styles.statusText}>
                {item.online ? 'Online' : 'Offline'}
              </Text>
              {isBlockedByMe && (
                <View style={styles.blockedBadge}>
                  <Ionicons name="ban" size={12} color="#fff" />
                  <Text style={styles.blockedBadgeText}>Blocked</Text>
                </View>
              )}
              {isBlockedByOther && (
                <View style={styles.blockedByBadge}>
                  <Ionicons name="ban" size={12} color="#fff" />
                  <Text style={styles.blockedBadgeText}>They blocked you</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.contactActions}>
          {canChat ? (
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => handleContactPress(item)}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#007bff" />
            </TouchableOpacity>
          ) : null}
          
          <TouchableOpacity
            style={styles.blockButton}
            onPress={() => toggleBlockContact(item.id, isBlockedByMe)}
          >
            <Ionicons 
              name={isBlockedByMe ? "ban-outline" : "ban"} 
              size={22} 
              color={isBlockedByMe ? "#28a745" : "#dc3545"} 
            />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading contacts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor="#999"
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Contacts List */}
      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color="#ccc" />
            <Text style={styles.emptyText}>No contacts found</Text>
            {searchText.length > 0 && (
              <Text style={styles.emptySubtext}>Try a different search term</Text>
            )}
          </View>
        }
      />

      {/* Stats */}
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredContacts.length} of {contacts.length} contacts
          {Object.keys(myBlocked).length > 0 && ` • ${Object.keys(myBlocked).length} blocked`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingBottom: 80,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  contactLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  contactPseudo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  online: {
    backgroundColor: '#28a745',
  },
  offline: {
    backgroundColor: '#6c757d',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    marginRight: 10,
  },
  blockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc3545',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  blockedByBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c757d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  blockedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatButton: {
    padding: 8,
    marginRight: 10,
  },
  blockButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  statsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
});