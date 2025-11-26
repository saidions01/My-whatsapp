import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { auth, database } from "../config/firebase";
import { ref, onValue, off, push, set, get } from "firebase/database";

export default function Discussions({ navigation }) {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("Users"); // 'Users' or 'Groups'
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

    onValue(usersRef, handleUsers);
    onValue(groupsRef, handleGroups);

    return () => {
      off(usersRef, "value", handleUsers);
      off(groupsRef, "value", handleGroups);
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
    } else if (selectedUsers.length < 2) {
      setSelectedUsers([...selectedUsers, item]);
      if (selectedUsers.length === 1) {
        createGroupChat([...selectedUsers, item]);
      }
    }
  };

  const createGroupChat = async (members) => {
    try {
      const groupName = members.map((user) => user.name).join(", ");
      const groupMembers = [...members.map((user) => user.id), currentUserID];

      const newGroupRef = push(ref(database, "groups"));
      await set(newGroupRef, {
        name: groupName,
        members: groupMembers,
        createdAt: new Date().toISOString(),
        createdBy: currentUserID,
      });

      setSelectedUsers([]);
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
      onPress={() => handlePress(item, activeTab)}
      onLongPress={() => activeTab === "Users" && handleLongPress(item)}
    >
      <View style={styles.userInfo}>
        <Image
          source={{
            uri:
              item.profileImage ||
              "https://cdn-icons-png.flaticon.com/512/149/149071.png",
          }}
          style={styles.profileImage}
        />
        <View>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.subText}>
            {activeTab === "Users"
              ? "Tap to chat • Long-press to group"
              : "Group chat"}
          </Text>
        </View>
        {item.isActive && <View style={styles.activeDot} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Tab Switch */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "Users" && styles.activeTab]}
          onPress={() => setActiveTab("Users")}
        >
          <Text
            style={[styles.tabText, activeTab === "Users" && styles.activeTabText]}
          >
            Users
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "Groups" && styles.activeTab]}
          onPress={() => setActiveTab("Groups")}
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

      {/* Floating Reload Button */}
      {activeTab === "Users" && (
        <TouchableOpacity style={styles.fab} onPress={reloadUsers}>
          <MaterialIcons name="refresh" size={28} color="#fff" />
        </TouchableOpacity>
      )}
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
  profileImage: { width: 50, height: 50, borderRadius: 25 },
  userName: { marginLeft: 15, fontSize: 16 },
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
});
