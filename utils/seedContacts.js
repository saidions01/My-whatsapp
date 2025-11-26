import { db } from "./firebaseAdmin.js";
import { ref, set } from "firebase/database";

const seedContacts = [
  {
    uid: "contact_01",
    name: "Emma Johnson",
    email: "emma.johnson@example.com",
    pseudo: "emmaJ",
    phone: "23456789",
    profileImage: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    uid: "contact_02",
    name: "Liam Smith",
    email: "liam.smith@example.com",
    pseudo: "liamS",
    phone: "98765432",
    profileImage: "https://randomuser.me/api/portraits/men/22.jpg",
  }
];

async function seedContactsToFirebase() {
  try {
    for (const contact of seedContacts) {
      await set(ref(db, `users/${contact.uid}`), contact);
    }
    console.log("✨ Contacts successfully seeded!");
  } catch (err) {
    console.error("❌ Error seeding contacts:", err);
  }
}

seedContactsToFirebase();
