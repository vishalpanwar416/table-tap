import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Use absolute path import from your project
import { firebaseConfig } from '../../src/config/firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createAdminUser() {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      'admin@example.com',  // CHANGE THIS
      'TempPass123!'        // CHANGE THIS
    );
    
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      email: 'admin@example.com',
      isAdmin: true,
      createdAt: new Date()
    });
    
    console.log('✅ Admin user created!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();