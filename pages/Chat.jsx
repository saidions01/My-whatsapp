import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; 
import { auth, database } from "../config/firebase";
import { ref, onValue, off, push, serverTimestamp } from "firebase/database";

export default function Chat({ route, navigation }) {
  const { chatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const flatListRef = useRef(null);
  const user = auth.currentUser;

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

    const messagesRef = ref(database, `chats/${chatId}/messages`);
    await push(messagesRef, {
      text: newMessage,
      sender: user.uid,
      createdAt: serverTimestamp(),
    });

    setNewMessage("");
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Ionicons
          name="person-circle-outline"
          size={40}
          color="#fff"
          style={{ marginLeft: 10 }}
        />
        <Text style={styles.headerTitle}>Chat</Text>
      </View>

      {/* MESSAGES */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => {
          const isMe = item.sender === user.uid;
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
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            </View>
          );
        }}
      />

      {/* INPUT */}
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
          style={styles.input}
        />

        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Ionicons name="send" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --------------------- STYLES ---------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef2f7",
  },

  // HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    marginLeft: 10,
    fontWeight: "600",
  },

  messagesList: {
    padding: 10,
    paddingBottom: 80,
  },

  messageWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginVertical: 5,
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
