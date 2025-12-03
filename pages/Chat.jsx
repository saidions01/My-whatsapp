import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
  Alert,
  Linking,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; 
import { auth, database } from "../config/firebase";
import { ref, onValue, off, push, serverTimestamp, set, remove } from "firebase/database";
import * as ImagePicker from 'expo-image-picker';
import MessageReaction from '../components/MessageReaction';
import TypingIndicator from '../components/TypingIndicator';

export default function Chat({ route, navigation }) {
  const { chatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUserOnline, setOtherUserOnline] = useState(false);
  const [otherUserId, setOtherUserId] = useState(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedByOther, setBlockedByOther] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const flatListRef = useRef(null);
  const user = auth.currentUser;
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    // Extract the other user's ID from chatId (format: id1-id2)
    const [id1, id2] = chatId.split("-");
    const otherUserId = id1 === user.uid ? id2 : id1;
    setOtherUserId(otherUserId);

    // Listen for other user's online status
    const otherUserStatusRef = ref(database, `users/${otherUserId}/online`);
    const unsubscribeStatus = onValue(otherUserStatusRef, (snapshot) => {
      setOtherUserOnline(snapshot.val() === true);
    });

    // Listen for other user's typing status
    const otherUserTypingRef = ref(database, `users/${otherUserId}/typing`);
    const unsubscribeTyping = onValue(otherUserTypingRef, (snapshot) => {
      setOtherUserTyping(snapshot.val() === true);
    });

    // Listen for other user's profile (to get phone, name, and whether they blocked me)
    const otherUserProfileRef = ref(database, `users/${otherUserId}`);
    const unsubscribeProfile = onValue(otherUserProfileRef, (snapshot) => {
      const data = snapshot.val() || null;
      setOtherUserProfile(data);
      // Check if other user blocked me
      setBlockedByOther(Boolean(data?.blocked?.[user.uid]));
    });

    // Listen for my blocked list for this user
    const myBlockedRef = ref(database, `users/${user.uid}/blocked/${otherUserId}`);
    const unsubscribeMyBlocked = onValue(myBlockedRef, (snapshot) => {
      setBlockedByMe(Boolean(snapshot.val() === true));
    });

    // Listen for chat background image
    const backgroundRef = ref(database, `chats/${chatId}/backgroundImage`);
    const unsubscribeBackground = onValue(backgroundRef, (snapshot) => {
      setBackgroundImage(snapshot.val() || null);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeTyping();
      unsubscribeProfile();
      unsubscribeMyBlocked();
      unsubscribeBackground();
    };
  }, [chatId, user?.uid]);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = ref(database, `chats/${chatId}/messages`);

    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));

      parsed.sort((a, b) => a.createdAt - b.createdAt);

      setMessages(parsed);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    });

    return () => off(messagesRef);
  }, [chatId]);

  const sendMessage = async () => {

    if (!newMessage.trim()) return;

    // Check blocking
    if (blockedByMe) {
      Alert.alert("Blocked", "You have blocked this contact. Unblock to send messages.");
      return;
    }
    if (blockedByOther) {
      Alert.alert("Blocked", "You are blocked by this contact. You cannot send messages.");
      return;
    }

    // Set typing to false
    const userTypingRef = ref(database, `users/${user.uid}/typing`);
    await set(userTypingRef, false);

    const messagesRef = ref(database, `chats/${chatId}/messages`);
    await push(messagesRef, {
      text: newMessage,
      sender: user.uid,
      createdAt: serverTimestamp(),
      reactions: {}, // Initialize reactions as an empty object
    });

    setNewMessage("");
  };

  const handleReactionChange = async (messageId, reaction) => {
    const reactionRef = ref(database, `chats/${chatId}/messages/${messageId}/reactions/${user.uid}`);
    if (reaction === null) {
      await remove(reactionRef); // Remove the reaction if null
    } else {
      await set(reactionRef, reaction); // Set/update the reaction
    }
  };

  const handleTextInputChange = async (text) => {
    setNewMessage(text);

    if (text.trim()) {
      // User is typing
      const userTypingRef = ref(database, `users/${user.uid}/typing`);
      await set(userTypingRef, true);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set timeout to mark as not typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(async () => {
        await set(userTypingRef, false);
      }, 2000);
    }
  };

  const handleChangeBackground = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access media library is required!');
        return;
      }

      // Open image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        // Save to Firebase
        const backgroundRef = ref(database, `chats/${chatId}/backgroundImage`);
        await set(backgroundRef, imageUri);
        Alert.alert('Success', 'Background image updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update background image');
      console.error(error);
    }
  };

  return (
    <ImageBackground 
      source={backgroundImage ? { uri: backgroundImage } : null}
      style={styles.backgroundContainer}
      imageStyle={styles.backgroundImage}
    >
      <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerAvatarContainer}>
          <Ionicons
            name="person-circle-outline"
            size={40}
            color="#fff"
            style={{ marginLeft: 10 }}
          />
          {otherUserOnline && <View style={styles.onlineIndicator} />}
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.headerTitle}>Chat</Text>
          <Text style={styles.statusText}>
            {otherUserOnline ? "Online" : "Offline"}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={async () => {
              setShowMenu(false);
              // Call
              if (otherUserProfile?.phone) {
                try {
                  await Linking.openURL(`tel:${otherUserProfile.phone}`);
                } catch (e) {
                  Alert.alert('Error', 'Unable to start call');
                }
              } else {
                Alert.alert('No number', 'This contact has no phone number');
              }
            }}>
              <Text style={styles.menuText}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              setContactModalVisible(true);
            }}>
              <Text style={styles.menuText}>Show contact details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={async () => {
              setShowMenu(false);
              // Toggle block
              const myBlockedRef = ref(database, `users/${user.uid}/blocked/${otherUserId}`);
              if (blockedByMe) {
                // unblock
                await remove(myBlockedRef);
                Alert.alert('Unblocked', 'Contact has been unblocked');
              } else {
                await set(myBlockedRef, true);
                Alert.alert('Blocked', 'Contact has been blocked');
              }
            }}>
              <Text style={styles.menuText}>{blockedByMe ? 'Unblock contact' : 'Block contact'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              handleChangeBackground();
            }}>
              <Text style={styles.menuText}>Change background image</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Contact Details Modal */}
      <Modal visible={contactModalVisible} transparent animationType="slide" onRequestClose={() => setContactModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setContactModalVisible(false)}>
          <View style={styles.contactModal}>
            <Text style={styles.contactTitle}>Contact Details</Text>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Name:</Text>
              <Text style={styles.contactValue}>{otherUserProfile?.name || 'N/A'}</Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Pseudo:</Text>
              <Text style={styles.contactValue}>{otherUserProfile?.pseudo || 'N/A'}</Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Email:</Text>
              <Text style={styles.contactValue}>{otherUserProfile?.email || 'N/A'}</Text>
            </View>
            <View style={styles.contactRow}>
              <Text style={styles.contactLabel}>Phone:</Text>
              <Text style={styles.contactValue}>{otherUserProfile?.phone || 'N/A'}</Text>
            </View>
            <TouchableOpacity style={styles.closeDetailsBtn} onPress={() => setContactModalVisible(false)}>
              <Text style={styles.closeDetailsText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* MESSAGES */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => {
          const isMe = item.sender === user?.uid;

          // Defensive checks for message properties
          const messageText = item.text || "Message not available";
          const messageId = item.id || "unknown_id";
          const messageReactions = item.reactions || {};

          return (
            <View
              style={[
                styles.messageWrapper,
                isMe ? styles.myMessageWrapper : styles.theirMessageWrapper,
              ]}
            >
              {!isMe && (
                <Ionicons
                  name="person-circle-outline"
                  size={26}
                  color="#555"
                  style={{ marginRight: 5 }}
                />
              )}

              <View style={[styles.messageBubble, isMe ? styles.myBubble : styles.theirBubble]}>
                <Text style={styles.messageText}>{messageText}</Text>
                <MessageReaction 
                  messageId={messageId} 
                  currentReaction={messageReactions[user?.uid]} 
                  onReactionChange={handleReactionChange} 
                />
              </View>

              {isMe && (
                <Ionicons
                  name="checkmark-done"
                  size={16}
                  color="#007bff"
                  style={{ marginLeft: 5 }}
                />
              )}
            </View>
          );
        }}
      />

      {otherUserTyping && (
        <View style={styles.typingContainer}>
          <TypingIndicator />
        </View>
      )}

      {/* INPUT */}
      <View style={styles.inputContainer}>
        {blockedByMe && (
          <View style={styles.blockedBanner}>
            <Text style={styles.blockedText}>You have blocked this contact</Text>
          </View>
        )}
        {blockedByOther && (
          <View style={styles.blockedBanner}>
            <Text style={styles.blockedText}>You are blocked by this contact</Text>
          </View>
        )}
        <TextInput
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={handleTextInputChange}
          editable={!blockedByMe && !blockedByOther}
          style={styles.input}
        />

        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
    </ImageBackground>
  );
}

// --------------------- STYLES ---------------------
const styles = StyleSheet.create({
  backgroundContainer: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.3,
    resizeMode: 'cover',
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  headerAvatarContainer: {
    position: "relative",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#28a745",
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
  },

  messagesList: {
    padding: 10,
    paddingBottom: 160,
  },

  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  myMessageWrapper: {
    justifyContent: "flex-end",
  },
  theirMessageWrapper: {
    justifyContent: "flex-start",
  },

  messageBubble: {
    maxWidth: "75%",
    padding: 10,
    borderRadius: 12,
  },
  myBubble: {
    backgroundColor: "#d1e7dd",
    borderBottomRightRadius: 0,
  },
  theirBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  messageText: {
    fontSize: 16,
    color: "#333",
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ddd",
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  typingContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    alignItems: 'flex-start',
    paddingHorizontal: 12,
  },
  menuButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
  },
  menuContainer: {
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
    marginTop: 60,
    marginRight: 10,
    borderRadius: 8,
    paddingVertical: 6,
    width: 200,
    elevation: 6,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  menuText: {
    fontSize: 16,
  },
  blockedBanner: {
    position: 'absolute',
    top: -36,
    left: 12,
    right: 12,
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  blockedText: {
    color: '#856404',
    fontSize: 13,
  },
  contactModal: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 120,
    padding: 16,
    borderRadius: 12,
    elevation: 6,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  contactLabel: {
    width: 80,
    color: '#555',
    fontWeight: '600',
  },
  contactValue: {
    color: '#222',
  },
  closeDetailsBtn: {
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  closeDetailsText: {
    color: '#007bff',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 50,
  },
});