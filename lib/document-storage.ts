"use client"

import { v4 as uuidv4 } from 'uuid'
// DEPRECATED: Mock staff data removed - now using real staff data from database
import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns'

// Storage keys
const STORAGE_KEYS = {
  STAFF_DOCUMENTS: 'vanity_staff_documents',
  DOCUMENT_TYPES: 'vanity_document_types',
  DOCUMENT_HISTORY: 'vanity_document_history',
}

// Document status enum
export enum DocumentStatus {
  VALID = 'Valid',
  EXPIRING_SOON = 'Expiring Soon',
  EXPIRED = 'Expired',
}

// Document type interface
export interface DocumentType {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  defaultExpiryDays?: number; // Default expiry period in days
}

// Staff document interface
export interface StaffDocument {
  id: string;
  staffId: string;
  staffName: string;
  documentType: string; // Document type ID
  documentTypeName: string; // Document type name
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  status: DocumentStatus;
  documentFile?: string; // File URL or base64 data
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  uploadedAt: string;
  updatedAt: string;
}

// Document history entry interface
export interface DocumentHistoryEntry {
  id: string;
  documentId: string;
  staffId: string;
  action: 'created' | 'updated' | 'renewed' | 'expired';
  timestamp: string;
  details?: string;
  previousValues?: Partial<StaffDocument>;
}

// Mock document types
const mockDocumentTypes: DocumentType[] = [
  {
    id: 'dt-001',
    name: 'Passport',
    description: 'International travel document',
    required: true,
    defaultExpiryDays: 3650, // 10 years
  },
  {
    id: 'dt-002',
    name: 'Residence Permit',
    description: 'Legal residence authorization',
    required: true,
    defaultExpiryDays: 730, // 2 years
  },
  {
    id: 'dt-003',
    name: 'Medical Certificate',
    description: 'Health fitness certification',
    required: true,
    defaultExpiryDays: 365, // 1 year
  },
  {
    id: 'dt-004',
    name: 'Health Card',
    description: 'Healthcare access card',
    required: true,
    defaultExpiryDays: 365, // 1 year
  },
  {
    id: 'dt-005',
    name: 'Employment Contract',
    description: 'Work agreement document',
    required: true,
    defaultExpiryDays: 730, // 2 years
  },
  {
    id: 'dt-006',
    name: 'Professional License',
    description: 'Professional qualification proof',
    required: false,
    defaultExpiryDays: 730, // 2 years
  },
  {
    id: 'dt-007',
    name: 'Training Certificate',
    description: 'Proof of completed training',
    required: false,
    defaultExpiryDays: 1095, // 3 years
  },
];

// Helper function to get data from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const storedValue = localStorage.getItem(key);
    return storedValue ? JSON.parse(storedValue) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving ${key} from localStorage:`, error);
    return defaultValue;
  }
}

// Helper function to save data to localStorage
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
  }
}

// Helper function to calculate document status based on expiry date
export function calculateDocumentStatus(expiryDate: string): DocumentStatus {
  const today = new Date();
  const expiry = new Date(expiryDate);
  
  if (isBefore(expiry, today)) {
    return DocumentStatus.EXPIRED;
  }
  
  const daysUntilExpiry = differenceInDays(expiry, today);
  if (daysUntilExpiry <= 30) {
    return DocumentStatus.EXPIRING_SOON;
  }
  
  return DocumentStatus.VALID;
}

// Document Storage Service
export const DocumentStorage = {
  // Get all document types
  getDocumentTypes: (): DocumentType[] => getFromStorage<DocumentType[]>(STORAGE_KEYS.DOCUMENT_TYPES, mockDocumentTypes),

  // Save all document types
  saveDocumentTypes: (documentTypes: DocumentType[]) => saveToStorage(STORAGE_KEYS.DOCUMENT_TYPES, documentTypes),

  // Add a new document type
  addDocumentType: (documentType: Omit<DocumentType, 'id'>): DocumentType => {
    const documentTypes = DocumentStorage.getDocumentTypes();
    const newDocumentType = {
      id: `dt-${uuidv4().substring(0, 8)}`,
      ...documentType
    };
    documentTypes.push(newDocumentType);
    saveToStorage(STORAGE_KEYS.DOCUMENT_TYPES, documentTypes);
    return newDocumentType;
  },

  // Update a document type
  updateDocumentType: (documentType: DocumentType): void => {
    const documentTypes = DocumentStorage.getDocumentTypes();
    const index = documentTypes.findIndex(dt => dt.id === documentType.id);
    if (index !== -1) {
      documentTypes[index] = documentType;
      saveToStorage(STORAGE_KEYS.DOCUMENT_TYPES, documentTypes);
    }
  },

  // Delete a document type
  deleteDocumentType: (id: string): void => {
    const documentTypes = DocumentStorage.getDocumentTypes();
    const filteredDocumentTypes = documentTypes.filter(dt => dt.id !== id);
    saveToStorage(STORAGE_KEYS.DOCUMENT_TYPES, filteredDocumentTypes);
  },

  // Get all staff documents
  getStaffDocuments: (): StaffDocument[] => getFromStorage<StaffDocument[]>(STORAGE_KEYS.STAFF_DOCUMENTS, []),

  // Save all staff documents
  saveStaffDocuments: (documents: StaffDocument[]) => saveToStorage(STORAGE_KEYS.STAFF_DOCUMENTS, documents),

  // Add a new staff document
  addStaffDocument: (document: Omit<StaffDocument, 'id' | 'status' | 'uploadedAt' | 'updatedAt'>): StaffDocument => {
    const documents = DocumentStorage.getStaffDocuments();
    const status = calculateDocumentStatus(document.expiryDate);
    const now = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss');
    
    const newDocument: StaffDocument = {
      id: `doc-${uuidv4().substring(0, 8)}`,
      status,
      uploadedAt: now,
      updatedAt: now,
      ...document
    };
    
    documents.push(newDocument);
    saveToStorage(STORAGE_KEYS.STAFF_DOCUMENTS, documents);
    
    // Add to history
    DocumentStorage.addDocumentHistory({
      documentId: newDocument.id,
      staffId: newDocument.staffId,
      action: 'created',
      details: `Document ${newDocument.documentTypeName} created`
    });
    
    return newDocument;
  },

  // Update a staff document
  updateStaffDocument: (document: StaffDocument): void => {
    const documents = DocumentStorage.getStaffDocuments();
    const index = documents.findIndex(d => d.id === document.id);
    
    if (index !== -1) {
      const oldDocument = documents[index];
      const status = calculateDocumentStatus(document.expiryDate);
      
      const updatedDocument = {
        ...document,
        status,
        updatedAt: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss')
      };
      
      documents[index] = updatedDocument;
      saveToStorage(STORAGE_KEYS.STAFF_DOCUMENTS, documents);
      
      // Add to history
      DocumentStorage.addDocumentHistory({
        documentId: document.id,
        staffId: document.staffId,
        action: 'updated',
        details: `Document ${document.documentTypeName} updated`,
        previousValues: oldDocument
      });
    }
  },

  // Delete a staff document
  deleteStaffDocument: (id: string): void => {
    const documents = DocumentStorage.getStaffDocuments();
    const documentToDelete = documents.find(d => d.id === id);
    
    if (documentToDelete) {
      const filteredDocuments = documents.filter(d => d.id !== id);
      saveToStorage(STORAGE_KEYS.STAFF_DOCUMENTS, filteredDocuments);
      
      // Add to history
      DocumentStorage.addDocumentHistory({
        documentId: id,
        staffId: documentToDelete.staffId,
        action: 'expired',
        details: `Document ${documentToDelete.documentTypeName} deleted`,
        previousValues: documentToDelete
      });
    }
  },

  // Get document history
  getDocumentHistory: (): DocumentHistoryEntry[] => getFromStorage<DocumentHistoryEntry[]>(STORAGE_KEYS.DOCUMENT_HISTORY, []),

  // Add document history entry
  addDocumentHistory: (entry: Omit<DocumentHistoryEntry, 'id' | 'timestamp'>): DocumentHistoryEntry => {
    const history = DocumentStorage.getDocumentHistory();
    const newEntry: DocumentHistoryEntry = {
      id: `hist-${uuidv4().substring(0, 8)}`,
      timestamp: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss'),
      ...entry
    };
    
    history.push(newEntry);
    saveToStorage(STORAGE_KEYS.DOCUMENT_HISTORY, history);
    return newEntry;
  },

  // Get documents for a specific staff member
  getStaffDocumentsByStaffId: (staffId: string): StaffDocument[] => {
    const documents = DocumentStorage.getStaffDocuments();
    return documents.filter(d => d.staffId === staffId);
  },

  // Get expiring documents (within the next X days)
  getExpiringDocuments: (days: number = 30): StaffDocument[] => {
    const documents = DocumentStorage.getStaffDocuments();
    const today = new Date();
    const futureDate = addDays(today, days);
    
    return documents.filter(doc => {
      const expiryDate = new Date(doc.expiryDate);
      return isAfter(expiryDate, today) && isBefore(expiryDate, futureDate);
    });
  },

  // Get expired documents
  getExpiredDocuments: (): StaffDocument[] => {
    const documents = DocumentStorage.getStaffDocuments();
    const today = new Date();

    return documents.filter(doc => {
      const expiryDate = new Date(doc.expiryDate);
      return isBefore(expiryDate, today);
    });
  },

  // Get documents by status
  getDocumentsByStatus: (status: DocumentStatus): StaffDocument[] => {
    const documents = DocumentStorage.getStaffDocuments();
    return documents.filter(doc => doc.status === status);
  },

  // Update document statuses (should be called periodically)
  updateDocumentStatuses: (): void => {
    const documents = DocumentStorage.getStaffDocuments();
    let updated = false;
    
    documents.forEach((doc, index) => {
      const newStatus = calculateDocumentStatus(doc.expiryDate);
      if (doc.status !== newStatus) {
        documents[index] = {
          ...doc,
          status: newStatus,
          updatedAt: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss')
        };
        updated = true;
        
        // Add to history if expired
        if (newStatus === DocumentStatus.EXPIRED) {
          DocumentStorage.addDocumentHistory({
            documentId: doc.id,
            staffId: doc.staffId,
            action: 'expired',
            details: `Document ${doc.documentTypeName} expired`
          });
        }
      }
    });
    
    if (updated) {
      saveToStorage(STORAGE_KEYS.STAFF_DOCUMENTS, documents);
    }
  }
};
