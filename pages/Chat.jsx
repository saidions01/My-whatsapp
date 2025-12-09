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
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, database, supabase } from "../config/firebase";
import { ref, onValue, set, push, serverTimestamp, off } from "firebase/database";
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { uploadProfileImage } from '../config/supabase';
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
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedByOther, setBlockedByOther] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const flatListRef = useRef(null);
  const user = auth.currentUser;
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!chatId || !user?.uid) return;

    const [id1, id2] = chatId.split("-");
    const otherUserId = id1 === user.uid ? id2 : id1;
    setOtherUserId(otherUserId);

    const otherUserStatusRef = ref(database, `users/${otherUserId}/online`);
    const unsubscribeStatus = onValue(otherUserStatusRef, (snapshot) => {
      setOtherUserOnline(snapshot.val() === true);
    });

    const otherUserTypingRef = ref(database, `users/${otherUserId}/typing`);
    const unsubscribeTyping = onValue(otherUserTypingRef, (snapshot) => {
      setOtherUserTyping(snapshot.val() === true);
    });

    const otherUserProfileRef = ref(database, `users/${otherUserId}`);
    const unsubscribeProfile = onValue(otherUserProfileRef, (snapshot) => {
      const data = snapshot.val() || null;
      setOtherUserProfile(data);
      setBlockedByOther(Boolean(data?.blocked?.[user.uid]));
    });

    const myBlockedRef = ref(database, `users/${user.uid}/blocked/${otherUserId}`);
    const unsubscribeMyBlocked = onValue(myBlockedRef, (snapshot) => {
      setBlockedByMe(Boolean(snapshot.val() === true));
    });

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

      parsed.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

      setMessages(parsed);

      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 200);
    });

    return () => off(messagesRef);
  }, [chatId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    if (blockedByMe) {
      Alert.alert("Blocked", "You have blocked this contact. Unblock to send messages.");
      return;
    }
    if (blockedByOther) {
      Alert.alert("Blocked", "You are blocked by this contact. You cannot send messages.");
      return;
    }

    const userTypingRef = ref(database, `users/${user.uid}/typing`);
    await set(userTypingRef, false);

    const messagesRef = ref(database, `chats/${chatId}/messages`);
    await push(messagesRef, {
      text: newMessage,
      sender: user.uid,
      createdAt: serverTimestamp(),
      reactions: {},
      type: 'text'
    });

    setNewMessage("");
  };

  const handleReactionChange = async (messageId, reaction) => {
    const reactionRef = ref(database, `chats/${chatId}/messages/${messageId}/reactions/${user.uid}`);
    if (reaction === null) {
      await remove(reactionRef);
    } else {
      await set(reactionRef, reaction);
    }
  };

  const handleTextInputChange = async (text) => {
    setNewMessage(text);

    const userTypingRef = ref(database, `users/${user.uid}/typing`);

    if (text.trim()) {
      await set(userTypingRef, true);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(async () => {
        await set(userTypingRef, false);
      }, 2000);
    } else {
      await set(userTypingRef, false);
    }
  };

  // Listen for other user's typing status
  useEffect(() => {
    const otherUserTypingRef = ref(database, `users/${otherUserId}/typing`);
    const unsubscribeTyping = onValue(otherUserTypingRef, (snapshot) => {
      setOtherUserTyping(snapshot.val() === true);
    });

    return () => {
      unsubscribeTyping();
    };
  }, [otherUserId]);

  // Also, when component unmounts or when chat changes, clear typing status
  useEffect(() => {
    return () => {
      // Clear typing status when leaving chat
      if (user?.uid) {
        const userTypingRef = ref(database, `users/${user.uid}/typing`);
        set(userTypingRef, false).catch(console.error);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user?.uid]);

  const handleCall = (callType = 'voice') => {
    if (!otherUserProfile?.phone) {
      Alert.alert('No Phone Number', 'This contact has no phone number saved.');
      return;
    }

    Alert.alert(
      `Start ${callType === 'video' ? 'Video' : 'Voice'} Call`,
      `Call ${otherUserProfile.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => initiateCall(callType)
        }
      ]
    );
  };

  const initiateCall = async (callType) => {
    const phoneNumber = otherUserProfile.phone;

    try {
      if (Platform.OS === 'android') {
        await Linking.openURL(`tel:${phoneNumber}`);
      } else {
        await Linking.openURL(`tel:${phoneNumber}`);
      }

      const callLogRef = ref(database, `calls/${chatId}`);
      await push(callLogRef, {
        type: callType,
        callerId: user.uid,
        receiverId: otherUserId,
        timestamp: serverTimestamp(),
        status: 'initiated'
      });

    } catch (error) {
      console.error('Call error:', error);
      Alert.alert('Call Failed', 'Unable to initiate call. Please try again.');
    }
  };

  const pickImage = async () => {
    setShowAttachmentMenu(false);

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadFile(result.assets[0].uri, 'image');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error(error);
    }
  };

  const pickDocument = async () => {
    setShowAttachmentMenu(false);

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        await uploadFile(result.uri, 'document', result.name, result.mimeType);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
      console.error(error);
    }
  };

  const uploadFile = async (fileUri, type, fileName = null, mimeType = null) => {
    if (blockedByMe || blockedByOther) {
      Alert.alert('Blocked', 'Cannot send files while blocked.');
      return;
    }

    setUploading(true);
    try {
      const messagesRef = ref(database, `chats/${chatId}/messages`);
      const fileData = {
        type: type,
        fileName: fileName || `file_${Date.now()}`,
        mimeType: mimeType || 'application/octet-stream',
        sender: user.uid,
        createdAt: serverTimestamp(),
        fileUri: fileUri,
        reactions: {},
      };

      await push(messagesRef, fileData);

      Alert.alert('Success', `${type === 'image' ? 'Image' : 'File'} sent!`);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleChangeBackground = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const backgroundRef = ref(database, `chats/${chatId}/backgroundImage`);
        await set(backgroundRef, imageUri);
        Alert.alert('Success', 'Background image updated');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update background image');
      console.error(error);
    }
  };

  const pickAndUploadImage = async () => {
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

    if (!result.canceled) {
      const fileUri = result.assets[0].uri;
      const userId = auth.currentUser.uid;

      try {
        // Upload the image to Supabase
        const imageUrl = await uploadProfileImage(fileUri, userId);
        setProfileImage(imageUrl);

        // Update the user's profile in Firebase
        await update(ref(database, `users/${userId}`), {
          profileImage: imageUrl,
          updatedAt: new Date().toISOString(),
        });

        Alert.alert('Success', 'Profile picture updated successfully!');
      } catch (error) {
        console.error('Error uploading image:', error);
        Alert.alert('Error', 'Failed to upload profile picture.');
      }
    }
  };

  const renderMessage = ({ item }) => {
    const isMe = item.sender === user?.uid;
    const messageId = item.id || "unknown_id";
    const messageReactions = item.reactions || {};

    return (
      <View
        style={[
          styles.messageContainer,
          isMe ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        {/* Their message: Show avatar on left */}
        {!isMe && (
          <View style={styles.avatarContainer}>
            <Ionicons
              name="person-circle-outline"
              size={32}
              color="#555"
            />
          </View>
        )}

        {/* Message bubble - This is the key fix */}
        <View style={[
          styles.messageBubble,
          isMe ? styles.myBubble : styles.theirBubble,
          // Add alignment styles to the bubble itself
          isMe ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }
        ]}>
          {/* Message content */}
          {item.type === 'image' ? (
            <View style={styles.fileMessageContainer}>
              <Ionicons name="image" size={24} color={isMe ? "#fff" : "#007bff"} />
              <Text style={[styles.fileMessageText, isMe && styles.myFileText]}>Image</Text>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => Alert.alert('Download', 'File download functionality')}
              >
                <Ionicons name="download" size={16} color={isMe ? "#fff" : "#666"} />
              </TouchableOpacity>
            </View>
          ) : item.type === 'document' ? (
            <View style={styles.fileMessageContainer}>
              <Ionicons name="document-text" size={24} color={isMe ? "#fff" : "#007bff"} />
              <View style={styles.fileInfo}>
                <Text style={[styles.fileName, isMe && styles.myFileText]} numberOfLines={1}>
                  {item.fileName}
                </Text>
                <Text style={[styles.fileSize, isMe && styles.myFileText]}>Document</Text>
              </View>
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={() => Alert.alert('Download', 'File download functionality')}
              >
                <Ionicons name="download" size={16} color={isMe ? "#fff" : "#666"} />
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={[styles.messageText, isMe && styles.myMessageText]}>
              {item.text || "Message not available"}
            </Text>
          )}

          <MessageReaction
            messageId={messageId}
            currentReaction={messageReactions[user?.uid]}
            onReactionChange={handleReactionChange}
          />
        </View>

        {/* My message: Show checkmark on right */}
        {isMe && (
          <View style={styles.statusContainer}>
            <Ionicons
              name="checkmark-done"
              size={16}
              color="#28a745"
            />
          </View>
        )}
      </View>
    );
  };

  return (
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
          <Text style={styles.headerTitle}>
            {otherUserProfile?.name || 'Chat'}
          </Text>
          <Text style={styles.statusText}>
            {otherUserOnline ? "Online" : "Offline"}
          </Text>
        </View>

        {/* Call buttons */}
        <TouchableOpacity
          onPress={() => handleCall('voice')}
          style={styles.callButton}
          disabled={!otherUserProfile?.phone}
        >
          <Ionicons name="call" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleCall('video')}
          style={styles.callButton}
          disabled={!otherUserProfile?.phone}
        >
          <Ionicons name="videocam" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => handleCall('voice')}>
              <Ionicons name="call" size={20} color="#007bff" style={styles.menuIcon} />
              <Text style={styles.menuText}>Voice Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => handleCall('video')}>
              <Ionicons name="videocam" size={20} color="#007bff" style={styles.menuIcon} />
              <Text style={styles.menuText}>Video Call</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              setContactModalVisible(true);
            }}>
              <Ionicons name="person" size={20} color="#007bff" style={styles.menuIcon} />
              <Text style={styles.menuText}>Contact Details</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={async () => {
              setShowMenu(false);
              const myBlockedRef = ref(database, `users/${user.uid}/blocked/${otherUserId}`);
              if (blockedByMe) {
                await remove(myBlockedRef);
                Alert.alert('Unblocked', 'Contact has been unblocked');
              } else {
                await set(myBlockedRef, true);
                Alert.alert('Blocked', 'Contact has been blocked');
              }
            }}>
              <Ionicons
                name={blockedByMe ? "checkmark-circle" : "ban"}
                size={20}
                color={blockedByMe ? "#28a745" : "#dc3545"}
                style={styles.menuIcon}
              />
              <Text style={styles.menuText}>{blockedByMe ? 'Unblock' : 'Block'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => {
              setShowMenu(false);
              handleChangeBackground();
            }}>
              <Ionicons name="image" size={20} color="#007bff" style={styles.menuIcon} />
              <Text style={styles.menuText}>Change Background</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Attachment Menu Modal */}
      <Modal visible={showAttachmentMenu} transparent animationType="fade" onRequestClose={() => setShowAttachmentMenu(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAttachmentMenu(false)}>
          <View style={styles.attachmentMenuContainer}>
            <TouchableOpacity style={styles.attachmentMenuItem} onPress={pickImage}>
              <Ionicons name="image" size={24} color="#007bff" style={styles.attachmentMenuIcon} />
              <Text style={styles.attachmentMenuText}>Photo/Image</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachmentMenuItem} onPress={pickDocument}>
              <Ionicons name="document" size={24} color="#007bff" style={styles.attachmentMenuIcon} />
              <Text style={styles.attachmentMenuText}>Document</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.attachmentMenuItem} onPress={() => {
              setShowAttachmentMenu(false);
              Alert.alert('Coming Soon', 'Camera feature will be added soon');
            }}>
              <Ionicons name="camera" size={24} color="#007bff" style={styles.attachmentMenuIcon} />
              <Text style={styles.attachmentMenuText}>Camera</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Contact Details Modal */}
      <Modal visible={contactModalVisible} transparent animationType="slide" onRequestClose={() => setContactModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setContactModalVisible(false)}>
          <View style={styles.contactModal}>
            <View style={styles.contactHeader}>
              {otherUserProfile?.profileImage ? (
                <Image
                  source={{ uri: otherUserProfile.profileImage }}
                  style={styles.contactProfileImage}
                />
              ) : (
                <Ionicons name="person-circle" size={80} color="#007bff" />
              )}
              <Text style={styles.contactTitle}>{otherUserProfile?.name || 'Contact'}</Text>
              <Text style={styles.contactPseudo}>@{otherUserProfile?.pseudo || 'user'}</Text>
            </View>

            <View style={styles.contactDetails}>
              <View style={styles.contactRow}>
                <Ionicons name="mail" size={18} color="#666" style={styles.contactIcon} />
                <Text style={styles.contactValue}>{otherUserProfile?.email || 'N/A'}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="call" size={18} color="#666" style={styles.contactIcon} />
                <Text style={styles.contactValue}>{otherUserProfile?.phone || 'N/A'}</Text>
              </View>
              <View style={styles.contactRow}>
                <Ionicons name="time" size={18} color="#666" style={styles.contactIcon} />
                <Text style={styles.contactValue}>
                  {otherUserOnline ? 'Online now' : 'Last seen recently'}
                </Text>
              </View>
            </View>

            <View style={styles.contactActions}>
              <TouchableOpacity
                style={[styles.contactActionButton, styles.callButtonFull]}
                onPress={() => {
                  setContactModalVisible(false);
                  handleCall('voice');
                }}
                disabled={!otherUserProfile?.phone}
              >
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={styles.contactActionText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.contactActionButton, styles.videoButtonFull]}
                onPress={() => {
                  setContactModalVisible(false);
                  handleCall('video');
                }}
                disabled={!otherUserProfile?.phone}
              >
                <Ionicons name="videocam" size={20} color="#fff" />
                <Text style={styles.contactActionText}>Video</Text>
              </TouchableOpacity>
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
        renderItem={renderMessage}
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

        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={() => setShowAttachmentMenu(true)}
          disabled={uploading || blockedByMe || blockedByOther}
        >
          {uploading ? (
            <Ionicons name="cloud-upload" size={24} color="#007bff" />
          ) : (
            <Ionicons name="attach" size={24} color="#007bff" />
          )}
        </TouchableOpacity>

        <TextInput
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={handleTextInputChange}
          editable={!blockedByMe && !blockedByOther}
          style={styles.input}
          multiline
        />

        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={!newMessage.trim() || blockedByMe || blockedByOther}
        >
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={pickAndUploadImage} style={styles.changeProfilePicBtn}>
        <Text style={styles.changeProfilePicText}>Change Profile Picture</Text>
      </TouchableOpacity>

      <Image
        source={{ uri: profileImage || userData.profileImage }}
        style={styles.profileImage}
      />
    </View>
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
    fontSize: 18,
    fontWeight: "600",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 2,
  },
  callButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  menuButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 5,
    paddingHorizontal: 10,
  },
  myMessageContainer: {
    justifyContent: "flex-end",
  },
  theirMessageContainer: {
    justifyContent: "flex-start",
  },

  // MESSAGE BUBBLES
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
    minWidth: 50,
  },
  myBubble: {
    backgroundColor: "#007bff",
    borderBottomRightRadius: 4,
    // Remove marginLeft and use alignSelf instead
  },
  theirBubble: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    // Remove marginRight and use alignSelf instead
  },

  // AVATAR AND STATUS CONTAINERS
  avatarContainer: {
    marginRight: 8,
  },
  statusContainer: {
    marginLeft: 8,
  },

  downloadButton: {
    padding: 8,
    marginLeft: 10,
  },

  // INPUT CONTAINER
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
  attachmentButton: {
    padding: 10,
    marginRight: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 24,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 50,
    opacity: 1,
  },

  // TYPING INDICATOR
  typingContainer: {
    position: 'absolute',
    bottom: 70, // Adjust this based on your input container height
    left: 0,
    right: 0,
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    width: 250,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 12,
    width: 24,
  },
  menuText: {
    fontSize: 16,
    color: '#333',
  },
  attachmentMenuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    width: 220,
    elevation: 10,
  },
  attachmentMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  attachmentMenuIcon: {
    marginRight: 16,
    width: 28,
  },
  attachmentMenuText: {
    fontSize: 16,
    color: '#333',
  },

  // BLOCKED BANNER
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

  // CONTACT MODAL
  contactModal: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    elevation: 10,
    width: '90%',
    maxWidth: 400,
  },
  contactHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  contactProfileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  contactTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  contactPseudo: {
    fontSize: 14,
    color: '#666',
  },
  contactDetails: {
    marginBottom: 20,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactIcon: {
    marginRight: 12,
    width: 24,
  },
  contactValue: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  contactActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  callButtonFull: {
    backgroundColor: '#28a745',
  },
  videoButtonFull: {
    backgroundColor: '#007bff',
  },
  contactActionText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  closeDetailsBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeDetailsText: {
    color: '#007bff',
    fontWeight: '600',
    fontSize: 16,
  },
  changeProfilePicBtn: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
  },
  changeProfilePicText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
});