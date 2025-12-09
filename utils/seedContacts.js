import { db } from "./firebaseAdmin.js";
import { ref, set } from "firebase/database";

// Correct data structure - make it an object, not an array
const seedData = {
  "contact_01": {
    "uid": "contact_01",
    "name": "Emma Johnson",
    "email": "emma.johnson@example.com",
    "pseudo": "emmaJ",
    "phone": "23456789",
    "profileImage": "https://randomuser.me/api/portraits/women/44.jpg"
  },
  "contact_02": {
    "uid": "contact_02",
    "name": "Liam Smith",
    "email": "liam.smith@example.com",
    "pseudo": "liamS",
    "phone": "98765432",
    "profileImage": "https://randomuser.me/api/portraits/men/22.jpg"
  },
  "contact_03": {
    "uid": "contact_03",
    "name": "Olivia Brown",
    "email": "olivia.brown@example.com",
    "pseudo": "oliviaB",
    "phone": "34567890",
    "profileImage": "https://randomuser.me/api/portraits/women/32.jpg"
  },
  "contact_04": {
    "uid": "contact_04",
    "name": "Noah Williams",
    "email": "noah.williams@example.com",
    "pseudo": "noahW",
    "phone": "45678901",
    "profileImage": "https://randomuser.me/api/portraits/men/45.jpg"
  },
  "contact_05": {
    "uid": "contact_05",
    "name": "Ava Jones",
    "email": "ava.jones@example.com",
    "pseudo": "avaJ",
    "phone": "56789012",
    "profileImage": "https://randomuser.me/api/portraits/women/12.jpg"
  },
  "contact_06": {
    "uid": "contact_06",
    "name": "William Garcia",
    "email": "william.garcia@example.com",
    "pseudo": "willG",
    "phone": "67890123",
    "profileImage": "https://randomuser.me/api/portraits/men/33.jpg"
  },
  "contact_07": {
    "uid": "contact_07",
    "name": "Sophia Miller",
    "email": "sophia.miller@example.com",
    "pseudo": "sophM",
    "phone": "78901234",
    "profileImage": "https://randomuser.me/api/portraits/women/55.jpg"
  },
  "contact_08": {
    "uid": "contact_08",
    "name": "James Davis",
    "email": "james.davis@example.com",
    "pseudo": "jamesD",
    "phone": "89012345",
    "profileImage": "https://randomuser.me/api/portraits/men/66.jpg"
  },
  "contact_09": {
    "uid": "contact_09",
    "name": "Isabella Rodriguez",
    "email": "isabella.rodriguez@example.com",
    "pseudo": "bellaR",
    "phone": "90123456",
    "profileImage": "https://randomuser.me/api/portraits/women/77.jpg"
  },
  "contact_10": {
    "uid": "contact_10",
    "name": "Benjamin Martinez",
    "email": "benjamin.martinez@example.com",
    "pseudo": "benM",
    "phone": "01234567",
    "profileImage": "https://randomuser.me/api/portraits/men/88.jpg"
  },
  "contact_11": {
    "uid": "contact_11",
    "name": "Mia Hernandez",
    "email": "mia.hernandez@example.com",
    "pseudo": "miaH",
    "phone": "12345678",
    "profileImage": "https://randomuser.me/api/portraits/women/18.jpg"
  },
  "contact_12": {
    "uid": "contact_12",
    "name": "Lucas Lopez",
    "email": "lucas.lopez@example.com",
    "pseudo": "lucasL",
    "phone": "23456789",
    "profileImage": "https://randomuser.me/api/portraits/men/29.jpg"
  },
  "contact_13": {
    "uid": "contact_13",
    "name": "Charlotte Gonzalez",
    "email": "charlotte.gonzalez@example.com",
    "pseudo": "charlotteG",
    "phone": "34567890",
    "profileImage": "https://randomuser.me/api/portraits/women/41.jpg"
  },
  "contact_14": {
    "uid": "contact_14",
    "name": "Henry Wilson",
    "email": "henry.wilson@example.com",
    "pseudo": "henryW",
    "phone": "45678901",
    "profileImage": "https://randomuser.me/api/portraits/men/52.jpg"
  },
  "contact_15": {
    "uid": "contact_15",
    "name": "Amelia Anderson",
    "email": "amelia.anderson@example.com",
    "pseudo": "ameliaA",
    "phone": "56789012",
    "profileImage": "https://randomuser.me/api/portraits/women/63.jpg"
  },
  "contact_16": {
    "uid": "contact_16",
    "name": "Alexander Thomas",
    "email": "alexander.thomas@example.com",
    "pseudo": "alexT",
    "phone": "67890123",
    "profileImage": "https://randomuser.me/api/portraits/men/74.jpg"
  },
  "contact_17": {
    "uid": "contact_17",
    "name": "Harper Taylor",
    "email": "harper.taylor@example.com",
    "pseudo": "harperT",
    "phone": "78901234",
    "profileImage": "https://randomuser.me/api/portraits/women/85.jpg"
  },
  "contact_18": {
    "uid": "contact_18",
    "name": "Daniel Moore",
    "email": "daniel.moore@example.com",
    "pseudo": "danielM",
    "phone": "89012345",
    "profileImage": "https://randomuser.me/api/portraits/men/96.jpg"
  },
  "contact_19": {
    "uid": "contact_19",
    "name": "Evelyn Jackson",
    "email": "evelyn.jackson@example.com",
    "pseudo": "evelynJ",
    "phone": "90123456",
    "profileImage": "https://randomuser.me/api/portraits/women/27.jpg"
  },
  "contact_20": {
    "uid": "contact_20",
    "name": "Michael Martin",
    "email": "michael.martin@example.com",
    "pseudo": "mikeM",
    "phone": "01234567",
    "profileImage": "https://randomuser.me/api/portraits/men/38.jpg"
  },
  "contact_21": {
    "uid": "contact_21",
    "name": "Abigail Lee",
    "email": "abigail.lee@example.com",
    "pseudo": "abbyL",
    "phone": "12345678",
    "profileImage": "https://randomuser.me/api/portraits/women/49.jpg"
  },
  "contact_22": {
    "uid": "contact_22",
    "name": "Ethan Perez",
    "email": "ethan.perez@example.com",
    "pseudo": "ethanP",
    "phone": "23456789",
    "profileImage": "https://randomuser.me/api/portraits/men/60.jpg"
  },
  "contact_23": {
    "uid": "contact_23",
    "name": "Ella Thompson",
    "email": "ella.thompson@example.com",
    "pseudo": "ellaT",
    "phone": "34567890",
    "profileImage": "https://randomuser.me/api/portraits/women/71.jpg"
  },
  "contact_24": {
    "uid": "contact_24",
    "name": "Matthew White",
    "email": "matthew.white@example.com",
    "pseudo": "mattW",
    "phone": "45678901",
    "profileImage": "https://randomuser.me/api/portraits/men/82.jpg"
  },
  "contact_25": {
    "uid": "contact_25",
    "name": "Scarlett Harris",
    "email": "scarlett.harris@example.com",
    "pseudo": "scarlettH",
    "phone": "56789012",
    "profileImage": "https://randomuser.me/api/portraits/women/93.jpg"
  },
  "contact_26": {
    "uid": "contact_26",
    "name": "Jackson Clark",
    "email": "jackson.clark@example.com",
    "pseudo": "jackC",
    "phone": "67890123",
    "profileImage": "https://randomuser.me/api/portraits/men/14.jpg"
  },
  "contact_27": {
    "uid": "contact_27",
    "name": "Grace Lewis",
    "email": "grace.lewis@example.com",
    "pseudo": "graceL",
    "phone": "78901234",
    "profileImage": "https://randomuser.me/api/portraits/women/25.jpg"
  },
  "contact_28": {
    "uid": "contact_28",
    "name": "Sebastian Robinson",
    "email": "sebastian.robinson@example.com",
    "pseudo": "sebR",
    "phone": "89012345",
    "profileImage": "https://randomuser.me/api/portraits/men/36.jpg"
  },
  "contact_29": {
    "uid": "contact_29",
    "name": "Chloe Walker",
    "email": "chloe.walker@example.com",
    "pseudo": "chloeW",
    "phone": "90123456",
    "profileImage": "https://randomuser.me/api/portraits/women/47.jpg"
  },
  "contact_30": {
    "uid": "contact_30",
    "name": "David Young",
    "email": "david.young@example.com",
    "pseudo": "davidY",
    "phone": "01234567",
    "profileImage": "https://randomuser.me/api/portraits/men/58.jpg"
  }
};

async function seedContactsToFirebase() {
  try {
    console.log("Starting to seed contacts...");
    
    // Loop through each contact in the object
    for (const [contactId, contactData] of Object.entries(seedData)) {
      const contactRef = ref(db, `users/${contactId}`);
      await set(contactRef, contactData);
      console.log(`✓ Added ${contactData.name} (${contactId})`);
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log("✅ All contacts successfully seeded!");
    process.exit(0); // Exit the script after completion
  } catch (err) {
    console.error("❌ Error seeding contacts:", err);
    process.exit(1); // Exit with error code
  }
}

// Add error handling for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

seedContactsToFirebase();