import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  User, 
  AiProviderSetting, 
  Document, 
  Analysis, 
  Query as QueryType 
} from './firebase-types';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  AI_PROVIDER_SETTINGS: 'aiProviderSettings',
  DOCUMENTS: 'documents',
  ANALYSES: 'analyses',
  QUERIES: 'queries'
} as const;

// Helper function to convert Firestore timestamp to Date
export const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Helper function to convert Date to Firestore timestamp
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Generic CRUD operations
export class FirebaseService<T extends { id: string }> {
  constructor(private collectionName: string) {}

  async create(data: Omit<T, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${this.collectionName}:`, error);
      throw error;
    }
  }

  async getById(id: string): Promise<T | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt)
      } as unknown as T;
    }
    return null;
  }

  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
    try {
      const q = query(collection(db, this.collectionName), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: timestampToDate(data.createdAt),
          updatedAt: timestampToDate(data.updatedAt)
        } as unknown as T;
      });
    } catch (error) {
      console.error(`Error fetching documents from ${this.collectionName}:`, error);
      throw error;
    }
  }

  async getWhere(field: string, operator: any, value: any): Promise<T[]> {
    return this.getAll([where(field, operator, value)]);
  }
}

// Service instances
export const userService = new FirebaseService<User>(COLLECTIONS.USERS);
export const aiProviderService = new FirebaseService<AiProviderSetting>(COLLECTIONS.AI_PROVIDER_SETTINGS);
export const documentService = new FirebaseService<Document>(COLLECTIONS.DOCUMENTS);
export const analysisService = new FirebaseService<Analysis>(COLLECTIONS.ANALYSES);
export const queryService = new FirebaseService<QueryType>(COLLECTIONS.QUERIES);

// Specialized methods
export const getUserByEmail = async (email: string): Promise<User | null> => {
  const users = await userService.getWhere('email', '==', email);
  return users.length > 0 ? users[0] : null;
};

export const getAiProviderSettingsByUserId = async (userId: string): Promise<AiProviderSetting[]> => {
  return aiProviderService.getWhere('userId', '==', userId);
};

export const getDocumentsByStatus = async (status: string): Promise<Document[]> => {
  return documentService.getWhere('status', '==', status);
};

export const getAnalysesByDocumentId = async (documentId: string): Promise<Analysis[]> => {
  return analysisService.getWhere('documentId', '==', documentId);
};