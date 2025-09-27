import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Save a fare calculation to Firestore
export const saveFareCalculation = async (calculationData, userId) => {
  try {
    const docRef = await addDoc(collection(db, 'fareCalculations'), {
      ...calculationData,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Fare calculation saved with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving fare calculation: ', error);
    throw error;
  }
};

// Get fare calculations for a specific user
export const getUserFareCalculations = async (userId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, 'fareCalculations'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const calculations = [];
    
    querySnapshot.forEach((doc) => {
      calculations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return calculations;
  } catch (error) {
    console.error('Error getting fare calculations: ', error);
    throw error;
  }
};

// Get all recent fare calculations (for admin purposes)
export const getAllFareCalculations = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, 'fareCalculations'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const calculations = [];
    
    querySnapshot.forEach((doc) => {
      calculations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return calculations;
  } catch (error) {
    console.error('Error getting all fare calculations: ', error);
    throw error;
  }
};

// Save user settings to Firestore
export const saveUserSettings = async (settings, userId) => {
  try {
    const docRef = await addDoc(collection(db, 'userSettings'), {
      ...settings,
      userId: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('User settings saved with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error saving user settings: ', error);
    throw error;
  }
};

// Get user settings from Firestore
export const getUserSettings = async (userId) => {
  try {
    const q = query(
      collection(db, 'userSettings'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user settings: ', error);
    throw error;
  }
};

// Delete a fare calculation from Firestore
export const deleteFareCalculation = async (calculationId) => {
  try {
    await deleteDoc(doc(db, 'fareCalculations', calculationId));
    console.log('Fare calculation deleted with ID: ', calculationId);
    return true;
  } catch (error) {
    console.error('Error deleting fare calculation: ', error);
    throw error;
  }
};

// PENDING USER APPROVAL FUNCTIONS

// Create a pending user approval request
export const createPendingUser = async (userData) => {
  try {
    const docRef = await addDoc(collection(db, 'pendingUsers'), {
      ...userData,
      status: 'pending',
      requestedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log('Pending user created with ID: ', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating pending user: ', error);
    throw error;
  }
};

// Get all pending user requests
export const getPendingUsers = async () => {
  try {
    const q = query(
      collection(db, 'pendingUsers'),
      where('status', '==', 'pending'),
      orderBy('requestedAt', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const pendingUsers = [];
    
    querySnapshot.forEach((doc) => {
      pendingUsers.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return pendingUsers;
  } catch (error) {
    console.error('Error getting pending users: ', error);
    throw error;
  }
};

// Approve a pending user
export const approveUser = async (pendingUserId, approvedBy) => {
  try {
    const pendingUserRef = doc(db, 'pendingUsers', pendingUserId);
    await updateDoc(pendingUserRef, {
      status: 'approved',
      approvedAt: serverTimestamp(),
      approvedBy: approvedBy,
      updatedAt: serverTimestamp()
    });
    console.log('User approved with ID: ', pendingUserId);
    return true;
  } catch (error) {
    console.error('Error approving user: ', error);
    throw error;
  }
};

// Reject a pending user
export const rejectUser = async (pendingUserId, rejectedBy, reason = '') => {
  try {
    const pendingUserRef = doc(db, 'pendingUsers', pendingUserId);
    await updateDoc(pendingUserRef, {
      status: 'rejected',
      rejectedAt: serverTimestamp(),
      rejectedBy: rejectedBy,
      rejectionReason: reason,
      updatedAt: serverTimestamp()
    });
    console.log('User rejected with ID: ', pendingUserId);
    return true;
  } catch (error) {
    console.error('Error rejecting user: ', error);
    throw error;
  }
};

// Check if a user is approved
export const checkUserApprovalStatus = async (userId) => {
  try {
    const q = query(
      collection(db, 'pendingUsers'),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return { status: 'not_found', message: 'User not found in pending users' };
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    return {
      status: userData.status,
      message: userData.status === 'approved' ? 'User is approved' : 
               userData.status === 'rejected' ? 'User access has been rejected' : 
               'User approval is pending'
    };
  } catch (error) {
    console.error('Error checking user approval status: ', error);
    throw error;
  }
};