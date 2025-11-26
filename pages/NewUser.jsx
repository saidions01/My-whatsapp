import React, { useState } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ImageBackground,
  SafeAreaView,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { auth, database } from "../config/firebase"; // modular imports
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set, serverTimestamp } from "firebase/database";

export default function NewUser({ navigation }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    pseudo: "",
    phone: "",
    profileImage: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [secureTextEntry2, setSecureTextEntry2] = useState(true);

  const handleSignup = async () => {
    const { email, password, name, pseudo, phone, profileImage } = formData;

    if (!email || !password || !name || !pseudo || !phone) {
      Alert.alert("Missing Information", "Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Save user data to Realtime Database
      await set(ref(database, `users/${uid}`), {
        name,
        email,
        pseudo,
        phone,
        profileImage: profileImage || "",
        createdAt: serverTimestamp(),
      });

      Alert.alert("Success", "Account created successfully.");
      navigation.navigate("Login");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
  
        <View style={styles.formContainer}>
          <Text style={styles.title}>Add a Contact</Text>

          {/* Name */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="person" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />
          </View>

          {/* Pseudo */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="account-circle" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Pseudo"
              value={formData.pseudo}
              onChangeText={(text) => setFormData({ ...formData, pseudo: text })}
            />
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
            />
          </View>

          {/* Phone */}
          <View style={styles.inputContainer}>
            <MaterialIcons name="phone" size={24} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
            />
          </View>

          

          {/* Buttons */}
          <TouchableOpacity style={styles.loginButton} onPress={handleSignup}>
            <Text style={styles.loginButtonText}>Add Contact</Text>
          </TouchableOpacity>

     
        </View>
    
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  image: { flex: 1, justifyContent: "center", width: "100%", height: "100%" },
  formContainer: {
    marginTop: 50,
    padding: 20,
    marginHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: { fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 30, textAlign: "center" },
  inputContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#f8f8f8", borderRadius: 10, marginBottom: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: "#ddd" },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 50, color: "#333", fontSize: 16 },
  eyeIcon: { padding: 10 },
  loginButton: { backgroundColor: "#007AFF", borderRadius: 10, height: 50, justifyContent: "center", alignItems: "center", marginTop: 20 },
  loginButtonText: { color: "#FFF", fontSize: 18, fontWeight: "bold" },
});
