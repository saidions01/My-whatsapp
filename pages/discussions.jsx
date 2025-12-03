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
import { ref, onValue, off, push, set, get } from "firebase/database";

export default function Discussions({ navigation }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("Users"); // 'Users' or 'Groups'
  const [userOnlineStatus, setUserOnlineStatus] = useState({});
  const [groupCreationModalVisible, setGroupCreationModalVisible] = useState(false);
  const [groupName, setGroupName] = useState("");
  const currentUserID = auth.currentUser?.uid;

  useEffect(() => {
    if (!currentUserID) return;

    const usersRef = ref(database, "users");
    const groupsRef = ref(database, "groups");

    const handleUsers = (snapshot) => {
      const usersData = snapshot.val();
      if (usersData) {
        const usersList = Object.entries(usersData)
          .filter(([id]) => id !== currentUserID)
          .map(([id, data]) => ({ id, ...data }));
        setUsers(usersList);
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

     onValue(usersRef, handleUsers);
    onValue(groupsRef, handleGroups);

    return () => {
      off(usersRef, "value", handleUsers);
      off(groupsRef, "value", handleGroups);
      unsubscribeOnlineStatus();
    };
  }, [currentUserID]);

  const reloadUsers = async () => {
    try {
      const usersSnapshot = await get(ref(database, "users"));
      const usersData = usersSnapshot.val();
      if (usersData) {
        const usersList = Object.entries(usersData)
          .filter(([id]) => id !== currentUserID)
          .map(([id, data]) => ({ id, ...data }));
        setUsers(usersList);
        Alert.alert("Success", "Users reloaded!");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to reload users");
    }
  };

  const generateDiscussionID = (id1, id2) =>
    id1 <= id2 ? `${id1}-${id2}` : `${id2}-${id1}`;

  const handlePress = (item, type) => {
    if (type === "Users") {
      const chatId = generateDiscussionID(currentUserID, item.id);
      navigation.navigate("Chat", { chatId });
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

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userCard,
        selectedUsers.find((u) => u.id === item.id) && styles.selectedUser,
      ]}
      onPress={() => activeTab === "Users" ? handlePress(item, activeTab) : handlePress(item, activeTab)}
      onLongPress={() => activeTab === "Users" && handleLongPress(item)}
      delayLongPress={500}
    >
      <View style={styles.userInfo}>
        {activeTab === "Users" && (
          <View style={styles.checkboxContainer}>
            {selectedUsers.find((u) => u.id === item.id) ? (
              <MaterialIcons name="check-box" size={24} color="#3478f6" />
            ) : (
              <MaterialIcons name="check-box-outline-blank" size={24} color="#ccc" />
            )}
          </View>
        )}
        <Image
          source={{
            uri:
              item.profileImage ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.profileImage}
        />
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.subText}>
            {activeTab === "Users"
              ? "Tap to chat • Long-press to select"
              : "Group chat"}
          </Text>
        </View>
        {userOnlineStatus[item.id] && <View style={styles.activeDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Tab Switch */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "Users" && styles.activeTab]}
          onPress={() => {
            setActiveTab("Users");
            setSelectedUsers([]);
          }}
        >
          <Text
            style={[styles.tabText, activeTab === "Users" && styles.activeTabText]}
          >
            Users
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
        data={activeTab === "Users" ? users : groups}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Floating Buttons */}
      {activeTab === "Users" && (
        <>
          <TouchableOpacity style={styles.fab} onPress={reloadUsers}>
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
  userInfo: { flexDirection: "row", alignItems: "center" },
  checkboxContainer: {
    marginRight: 10,
  },
  profileImage: { width: 50, height: 50, borderRadius: 25 },
  userDetails: {
    flex: 1,
    marginLeft: 10,
  },
  userName: { fontSize: 16, fontWeight: "600" },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
    marginLeft: 10,
  },
  subText: {
    fontSize: 12,
    color: "#777",
    marginTop: 3,
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

