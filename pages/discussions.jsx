import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { auth, database } from "../config/firebase";
import { ref, onValue, off, push, set, get, query, orderByChild } from "firebase/database";

export default function Discussions({ navigation }) {
  const [chatContacts, setChatContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("Chats"); // 'Chats' or 'Groups'
  const [userOnlineStatus, setUserOnlineStatus] = useState({});
  const [groupCreationModalVisible, setGroupCreationModalVisible] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(true);
  const currentUserID = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserID) return;

    const groupsRef = ref(database, "groups");

    // Fetch online status for all users
    const onlineStatusRef = ref(database, "users");
    const unsubscribeOnlineStatus = onValue(onlineStatusRef, (snapshot) => {
      const usersData = snapshot.val() || {};
      const statusMap = {};
      Object.entries(usersData).forEach(([userId, userData]) => {
        statusMap[userId] = userData.online === true;
      });
      setUserOnlineStatus(statusMap);
    });

    // Fetch user chats
   // In your Discussions.js, update the fetchChatContacts function:
const fetchChatContacts = async () => {
  try {
    setLoading(true);
    
    // Get all chats from database
    const chatsRef = ref(database, "chats");
    const chatsSnapshot = await get(chatsRef);
    const chatsData = chatsSnapshot.val() || {};

    // Get all users to get their details
    const usersRef = ref(database, "users");
    const usersSnapshot = await get(usersRef);
    const allUsers = usersSnapshot.val() || {};

    const contactsWithChats = [];

    // Loop through all chats
    Object.entries(chatsData).forEach(([chatId, chatData]) => {
      // Check if this chat involves the current user
      if (chatId.includes(currentUserID)) {
        // Extract the other user's ID from chat ID
        const [id1, id2] = chatId.split('-');
        const otherUserId = id1 === currentUserID ? id2 : id1;
        
        // Get the other user's data
        const otherUser = allUsers[otherUserId];
        
        if (otherUser) {
          // Check if we already have this contact in the list
          const existingIndex = contactsWithChats.findIndex(c => c.id === otherUserId);
          
          if (existingIndex === -1) {
            // DEBUG: Log the data
            console.log('Found contact:', {
              id: otherUserId,
              name: otherUser.name,
              email: otherUser.email,
              isCurrentUser: otherUserId === currentUserID
            });
            
            // Add contact to list
            contactsWithChats.push({
              id: otherUserId,
              ...otherUser,
              chatId: chatId,
              lastMessage: getLastMessage(chatData.messages),
              lastMessageTime: getLastMessageTime(chatData.messages)
            });
          }
        } else {
          console.log('No user data found for ID:', otherUserId);
        }
      }
    });

    // DEBUG: Log all contacts
    console.log('All contacts found:', contactsWithChats.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email
    })));

    // Sort by last message time (most recent first)
    contactsWithChats.sort((a, b) => {
      return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
    });

    setChatContacts(contactsWithChats);
    setLoading(false);
  } catch (error) {
    console.error("Error fetching chat contacts:", error);
    setLoading(false);
  }
};



    const handleGroups = (snapshot) => {
      const groupsData = snapshot.val();
      if (groupsData) {
        const groupsList = Object.entries(groupsData)
          .filter(([_, group]) => group.members?.includes(currentUserID))
          .map(([id, data]) => ({ id, ...data }));
        setGroups(groupsList);
      }
    };

    fetchChatContacts();
    onValue(groupsRef, handleGroups);

    return () => {
      off(groupsRef, "value", handleGroups);
      unsubscribeOnlineStatus();
    };
  }, [currentUserID]);

  // Helper function to get the last message from chat
  const getLastMessage = (messages) => {
    if (!messages) return "No messages yet";
    
    const messageArray = Object.values(messages);
    if (messageArray.length === 0) return "No messages yet";
    
    // Sort by timestamp (most recent first)
    messageArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    const lastMsg = messageArray[0];
    return lastMsg.text || "📷 Image" || "📁 File";
  };

  // Helper function to get last message time
  const getLastMessageTime = (messages) => {
    if (!messages) return 0;
    
    const messageArray = Object.values(messages);
    if (messageArray.length === 0) return 0;
    
    messageArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    return messageArray[0].createdAt || 0;
  };

  // Format time for display
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handlePress = (item, type) => {
    if (type === "Chats") {
      navigation.navigate("Chat", { 
        chatId: item.chatId,
        contactName: item.name 
      });
    } else {
      navigation.navigate("Chat", { chatId: item.id });
    }
  };

  const handleLongPress = (item) => {
    if (selectedUsers.find((u) => u.id === item.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== item.id));
    } else {
      setSelectedUsers([...selectedUsers, item]);
    }
  };

  const createGroupChat = async () => {
    if (!groupName.trim()) {
      Alert.alert("Error", "Please enter a group name");
      return;
    }
    if (selectedUsers.length < 2) {
      Alert.alert("Error", "Please select at least 2 contacts");
      return;
    }

    try {
      const groupMembers = [...selectedUsers.map((user) => user.id), currentUserID];

      const newGroupRef = push(ref(database, "groups"));
      await set(newGroupRef, {
        name: groupName,
        members: groupMembers,
        createdAt: new Date().toISOString(),
        createdBy: currentUserID,
      });

      setSelectedUsers([]);
      setGroupName("");
      setGroupCreationModalVisible(false);
      Alert.alert("Success", "Group chat created!");
    } catch (error) {
      Alert.alert("Error", "Failed to create group chat");
      console.error(error);
    }
  };

  const reloadChats = async () => {
    if (!currentUserID) return;
    
    try {
      setLoading(true);
      
      // Re-fetch chats
      const chatsRef = ref(database, "chats");
      const chatsSnapshot = await get(chatsRef);
      const chatsData = chatsSnapshot.val() || {};

      const usersRef = ref(database, "users");
      const usersSnapshot = await get(usersRef);
      const allUsers = usersSnapshot.val() || {};

      const contactsWithChats = [];

      Object.entries(chatsData).forEach(([chatId, chatData]) => {
        if (chatId.includes(currentUserID)) {
          const [id1, id2] = chatId.split('-');
          const otherUserId = id1 === currentUserID ? id2 : id1;
          const otherUser = allUsers[otherUserId];
          
          if (otherUser) {
            const existingIndex = contactsWithChats.findIndex(c => c.id === otherUserId);
            if (existingIndex === -1) {
              contactsWithChats.push({
                id: otherUserId,
                ...otherUser,
                chatId: chatId,
                lastMessage: getLastMessage(chatData.messages),
                lastMessageTime: getLastMessageTime(chatData.messages)
              });
            }
          }
        }
      });

      contactsWithChats.sort((a, b) => {
        return (b.lastMessageTime || 0) - (a.lastMessageTime || 0);
      });

      setChatContacts(contactsWithChats);
      setLoading(false);
      Alert.alert("Success", "Chats refreshed!");
    } catch (error) {
      console.error("Error reloading chats:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to refresh chats");
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        selectedUsers.find((u) => u.id === item.id) && styles.selectedUser,
      ]}
      onPress={() => activeTab === "Chats" ? handlePress(item, activeTab) : handlePress(item, activeTab)}
      onLongPress={() => activeTab === "Chats" && handleLongPress(item)}
      delayLongPress={500}
    >
      <View style={styles.userInfo}>
        {activeTab === "Chats" && (
          <View style={styles.checkboxContainer}>
            {selectedUsers.find((u) => u.id === item.id) ? (
              <MaterialIcons name="check-box" size={24} color="#3478f6" />
            ) : (
              <MaterialIcons name="check-box-outline-blank" size={24} color="#ccc" />
            )}
          </View>
        )}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                item.profileImage ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png",
            }}
            style={styles.profileImage}
          />
          {userOnlineStatus[item.id] && <View style={styles.activeDot} />}
        </View>
        <View style={styles.userDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.name || "Unknown User"}
            </Text>
            {item.lastMessageTime && (
              <Text style={styles.timeText}>
                {formatTime(item.lastMessageTime)}
              </Text>
            )}
          </View>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage || "Start a conversation"}
          </Text>
          <Text style={styles.subText}>
            {activeTab === "Chats" 
              ? `@${item.pseudo || "user"} • Tap to chat${selectedUsers.length > 0 ? " • Long-press to select" : ""}`
              : "Group chat"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && activeTab === "Chats") {
    return (
      <View style={styles.loadingContainer}>
        <MaterialIcons name="chat" size={60} color="#ccc" />
        <Text style={styles.loadingText}>Loading your chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tab Switch */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "Chats" && styles.activeTab]}
          onPress={() => {
            setActiveTab("Chats");
            setSelectedUsers([]);
          }}
        >
          <Text
            style={[styles.tabText, activeTab === "Chats" && styles.activeTabText]}
          >
            Chats
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "Groups" && styles.activeTab]}
          onPress={() => {
            setActiveTab("Groups");
            setSelectedUsers([]);
          }}
        >
          <Text
            style={[styles.tabText, activeTab === "Groups" && styles.activeTabText]}
          >
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={activeTab === "Chats" ? chatContacts : groups}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons 
              name={activeTab === "Chats" ? "chat" : "group"} 
              size={60} 
              color="#ccc" 
            />
            <Text style={styles.emptyText}>
              {activeTab === "Chats" 
                ? "No chats yet\nStart a conversation!"
                : "No groups yet\nCreate or join a group!"}
            </Text>
          </View>
        }
      />

      {/* Floating Buttons */}
      {activeTab === "Chats" && (
        <>
          <TouchableOpacity style={styles.fab} onPress={reloadChats}>
            <MaterialIcons name="refresh" size={28} color="#fff" />
          </TouchableOpacity>
          {selectedUsers.length > 0 && (
            <TouchableOpacity 
              style={[styles.fab, styles.fabCreateGroup]}
              onPress={() => setGroupCreationModalVisible(true)}
            >
              <MaterialIcons name="group-add" size={28} color="#fff" />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* Group Creation Modal */}
      <Modal visible={groupCreationModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setGroupCreationModalVisible(false)}>
          <View style={styles.groupCreationModal}>
            <Text style={styles.modalTitle}>Create Group</Text>
            
            <TextInput
              style={styles.groupNameInput}
              placeholder="Enter group name"
              value={groupName}
              onChangeText={setGroupName}
            />

            <Text style={styles.selectedCountText}>
              {selectedUsers.length} contact{selectedUsers.length !== 1 ? 's' : ''} selected
            </Text>

            <ScrollView style={styles.selectedContactsList}>
              {selectedUsers.map((user) => (
                <View key={user.id} style={styles.selectedContactItem}>
                  <Image
                    source={{
                      uri: user.profileImage || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                    }}
                    style={styles.selectedContactImage}
                  />
                  <Text style={styles.selectedContactName}>{user.name}</Text>
                  <TouchableOpacity 
                    onPress={() => setSelectedUsers(selectedUsers.filter(u => u.id !== user.id))}
                    style={styles.removeContactBtn}
                  >
                    <MaterialIcons name="close" size={20} color="#999" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setGroupCreationModalVisible(false);
                  setGroupName("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]}
                onPress={createGroupChat}
              >
                <Text style={styles.createButtonText}>Create Group</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    margin: 10,
    backgroundColor: "#f1f1f1",
    borderRadius: 8,
    overflow: "hidden",
  },
  tabButton: {
    flex: 1,
    padding: 12,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#3478f6",
  },
  tabText: {
    fontSize: 16,
    color: "#555",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  userCard: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedUser: {
    backgroundColor: "#e3f2fd",
  },
  userInfo: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  checkboxContainer: {
    marginRight: 10,
  },
  imageContainer: {
    position: "relative",
  },
  profileImage: { 
    width: 50, 
    height: 50, 
    borderRadius: 25 
  },
  activeDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#fff",
  },
  userDetails: {
    flex: 1,
    marginLeft: 10,
  },
  nameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  userName: { 
    fontSize: 16, 
    fontWeight: "600",
    flex: 1,
    marginRight: 10,
  },
  timeText: {
    fontSize: 12,
    color: "#999",
  },
  lastMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  subText: {
    fontSize: 12,
    color: "#777",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    backgroundColor: "#34a853",
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabCreateGroup: {
    bottom: 100,
    backgroundColor: "#3478f6",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  groupCreationModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  selectedCountText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  selectedContactsList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  selectedContactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedContactImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  selectedContactName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  removeContactBtn: {
    padding: 4,
  },
  modalButtonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: "#3478f6",
  },
  createButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});