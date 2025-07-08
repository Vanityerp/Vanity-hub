"use client"

import { v4 as uuidv4 } from 'uuid'
import { format, addDays, isAfter, isBefore, differenceInDays } from 'date-fns'

// Storage keys
const STORAGE_KEYS = {
  COMPANY_DOCUMENTS: 'vanity_company_documents',
  COMPANY_DOCUMENT_TYPES: 'vanity_company_document_types',
  COMPANY_DOCUMENT_HISTORY: 'vanity_company_document_history',
}

// Document status enum
export enum CompanyDocumentStatus {
  VALID = 'Valid',
  EXPIRING_SOON = 'Expiring Soon',
  EXPIRED = 'Expired',
}

// Company document type interface
export interface CompanyDocumentType {
  id: string;
  name: string;
  description?: string;
  category: 'license' | 'certification' | 'insurance' | 'contract' | 'permit' | 'other';
  required: boolean;
  defaultExpiryDays?: number; // Default expiry period in days
}

// Company document interface
export interface CompanyDocument {
  id: string;
  documentType: string; // Document type ID
  documentTypeName: string; // Document type name
  documentName: string; // Custom name for this document
  documentNumber: string;
  issueDate: string;
  expiryDate: string;
  status: CompanyDocumentStatus;
  documentFile?: string; // File URL or base64 data
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  uploadedAt: string;
  updatedAt: string;
  uploadedBy: string; // User who uploaded the document
  version: number; // Version control
  notes?: string;
}

// Company document history entry interface
export interface CompanyDocumentHistoryEntry {
  id: string;
  documentId: string;
  action: 'created' | 'updated' | 'renewed' | 'expired' | 'version_updated';
  timestamp: string;
  details?: string;
  uploadedBy: string;
  previousValues?: Partial<CompanyDocument>;
}

// Helper function to calculate document status based on expiry date
const calculateDocumentStatus = (expiryDate: string): CompanyDocumentStatus => {
  const today = new Date()
  const expiry = new Date(expiryDate)
  const daysUntilExpiry = differenceInDays(expiry, today)

  if (daysUntilExpiry < 0) {
    return CompanyDocumentStatus.EXPIRED
  } else if (daysUntilExpiry <= 30) {
    return CompanyDocumentStatus.EXPIRING_SOON
  } else {
    return CompanyDocumentStatus.VALID
  }
}

// Helper functions for localStorage
const getFromStorage = <T>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error)
    return defaultValue
  }
}

const saveToStorage = <T>(key: string, value: T): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error saving to localStorage key ${key}:`, error)
  }
}

// Mock company document types
const mockCompanyDocumentTypes: CompanyDocumentType[] = [
  {
    id: 'cdt-business-license',
    name: 'Business License',
    description: 'Official business operating license',
    category: 'license',
    required: true,
    defaultExpiryDays: 365,
  },
  {
    id: 'cdt-health-permit',
    name: 'Health Department Permit',
    description: 'Health and safety permit for salon operations',
    category: 'permit',
    required: true,
    defaultExpiryDays: 365,
  },
  {
    id: 'cdt-liability-insurance',
    name: 'Liability Insurance',
    description: 'General liability insurance policy',
    category: 'insurance',
    required: true,
    defaultExpiryDays: 365,
  },
  {
    id: 'cdt-workers-comp',
    name: 'Workers Compensation Insurance',
    description: 'Workers compensation insurance policy',
    category: 'insurance',
    required: true,
    defaultExpiryDays: 365,
  },
  {
    id: 'cdt-fire-permit',
    name: 'Fire Department Permit',
    description: 'Fire safety permit and inspection certificate',
    category: 'permit',
    required: true,
    defaultExpiryDays: 365,
  },
  {
    id: 'cdt-cosmetology-license',
    name: 'Cosmetology Establishment License',
    description: 'State cosmetology establishment license',
    category: 'license',
    required: true,
    defaultExpiryDays: 730, // 2 years
  },
  {
    id: 'cdt-vendor-contract',
    name: 'Vendor Contract',
    description: 'Contracts with suppliers and vendors',
    category: 'contract',
    required: false,
    defaultExpiryDays: 365,
  },
  {
    id: 'cdt-lease-agreement',
    name: 'Lease Agreement',
    description: 'Property lease agreement',
    category: 'contract',
    required: true,
    defaultExpiryDays: 365,
  },
]

// Company Document Storage Service
export const CompanyDocumentStorage = {
  // Get all company document types
  getDocumentTypes: (): CompanyDocumentType[] => getFromStorage<CompanyDocumentType[]>(STORAGE_KEYS.COMPANY_DOCUMENT_TYPES, mockCompanyDocumentTypes),

  // Save all company document types
  saveDocumentTypes: (documentTypes: CompanyDocumentType[]) => saveToStorage(STORAGE_KEYS.COMPANY_DOCUMENT_TYPES, documentTypes),

  // Add a new company document type
  addDocumentType: (documentType: Omit<CompanyDocumentType, 'id'>): CompanyDocumentType => {
    const documentTypes = CompanyDocumentStorage.getDocumentTypes();
    const newDocumentType = {
      id: `cdt-${uuidv4().substring(0, 8)}`,
      ...documentType
    };
    documentTypes.push(newDocumentType);
    saveToStorage(STORAGE_KEYS.COMPANY_DOCUMENT_TYPES, documentTypes);
    return newDocumentType;
  },

  // Update a company document type
  updateDocumentType: (documentType: CompanyDocumentType): void => {
    const documentTypes = CompanyDocumentStorage.getDocumentTypes();
    const index = documentTypes.findIndex(dt => dt.id === documentType.id);
    if (index !== -1) {
      documentTypes[index] = documentType;
      saveToStorage(STORAGE_KEYS.COMPANY_DOCUMENT_TYPES, documentTypes);
    }
  },

  // Delete a company document type
  deleteDocumentType: (id: string): void => {
    const documentTypes = CompanyDocumentStorage.getDocumentTypes();
    const filteredTypes = documentTypes.filter(dt => dt.id !== id);
    saveToStorage(STORAGE_KEYS.COMPANY_DOCUMENT_TYPES, filteredTypes);
  },

  // Get all company documents
  getCompanyDocuments: (): CompanyDocument[] => getFromStorage<CompanyDocument[]>(STORAGE_KEYS.COMPANY_DOCUMENTS, []),

  // Save all company documents
  saveCompanyDocuments: (documents: CompanyDocument[]) => saveToStorage(STORAGE_KEYS.COMPANY_DOCUMENTS, documents),

  // Add a new company document
  addCompanyDocument: (document: Omit<CompanyDocument, 'id' | 'status' | 'uploadedAt' | 'updatedAt' | 'version'>): CompanyDocument => {
    const documents = CompanyDocumentStorage.getCompanyDocuments();
    const status = calculateDocumentStatus(document.expiryDate);
    const now = format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss');
    
    const newDocument: CompanyDocument = {
      id: `cdoc-${uuidv4().substring(0, 8)}`,
      status,
      uploadedAt: now,
      updatedAt: now,
      version: 1,
      ...document
    };
    
    documents.push(newDocument);
    saveToStorage(STORAGE_KEYS.COMPANY_DOCUMENTS, documents);
    
    // Add to history
    CompanyDocumentStorage.addDocumentHistory({
      documentId: newDocument.id,
      action: 'created',
      details: `Document ${newDocument.documentName} created`,
      uploadedBy: newDocument.uploadedBy
    });
    
    return newDocument;
  },

  // Update a company document
  updateCompanyDocument: (document: CompanyDocument): void => {
    const documents = CompanyDocumentStorage.getCompanyDocuments();
    const index = documents.findIndex(d => d.id === document.id);
    
    if (index !== -1) {
      const oldDocument = documents[index];
      const status = calculateDocumentStatus(document.expiryDate);
      
      const updatedDocument = {
        ...document,
        status,
        updatedAt: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss'),
        version: oldDocument.version + 1
      };
      
      documents[index] = updatedDocument;
      saveToStorage(STORAGE_KEYS.COMPANY_DOCUMENTS, documents);
      
      // Add to history
      CompanyDocumentStorage.addDocumentHistory({
        documentId: document.id,
        action: 'updated',
        details: `Document ${document.documentName} updated`,
        uploadedBy: document.uploadedBy,
        previousValues: oldDocument
      });
    }
  },

  // Delete a company document
  deleteCompanyDocument: (id: string): void => {
    const documents = CompanyDocumentStorage.getCompanyDocuments();
    const filteredDocuments = documents.filter(d => d.id !== id);
    saveToStorage(STORAGE_KEYS.COMPANY_DOCUMENTS, filteredDocuments);
  },

  // Get company document history
  getDocumentHistory: (): CompanyDocumentHistoryEntry[] => getFromStorage<CompanyDocumentHistoryEntry[]>(STORAGE_KEYS.COMPANY_DOCUMENT_HISTORY, []),

  // Add company document history entry
  addDocumentHistory: (entry: Omit<CompanyDocumentHistoryEntry, 'id' | 'timestamp'>): CompanyDocumentHistoryEntry => {
    const history = CompanyDocumentStorage.getDocumentHistory();
    const newEntry: CompanyDocumentHistoryEntry = {
      id: `chist-${uuidv4().substring(0, 8)}`,
      timestamp: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ss'),
      ...entry
    };
    
    history.push(newEntry);
    saveToStorage(STORAGE_KEYS.COMPANY_DOCUMENT_HISTORY, history);
    return newEntry;
  },

  // Get documents by status
  getDocumentsByStatus: (status: CompanyDocumentStatus): CompanyDocument[] => {
    const documents = CompanyDocumentStorage.getCompanyDocuments();
    return documents.filter(doc => doc.status === status);
  },

  // Get documents by category
  getDocumentsByCategory: (category: string): CompanyDocument[] => {
    const documents = CompanyDocumentStorage.getCompanyDocuments();
    const documentTypes = CompanyDocumentStorage.getDocumentTypes();
    
    return documents.filter(doc => {
      const docType = documentTypes.find(dt => dt.id === doc.documentType);
      return docType?.category === category;
    });
  },

  // Get expiry summary
  getExpirySummary: () => {
    const documents = CompanyDocumentStorage.getCompanyDocuments();
    const expired = documents.filter(doc => doc.status === CompanyDocumentStatus.EXPIRED);
    const expiringSoon = documents.filter(doc => doc.status === CompanyDocumentStatus.EXPIRING_SOON);
    
    return {
      expired: expired.length,
      expiringSoon: expiringSoon.length,
      total: documents.length,
      expiredDocuments: expired,
      expiringSoonDocuments: expiringSoon
    };
  },

  // Update document statuses (should be called periodically)
  updateDocumentStatuses: (): void => {
    const documents = CompanyDocumentStorage.getCompanyDocuments();
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
        if (newStatus === CompanyDocumentStatus.EXPIRED) {
          CompanyDocumentStorage.addDocumentHistory({
            documentId: doc.id,
            action: 'expired',
            details: `Document ${doc.documentName} expired`,
            uploadedBy: 'system'
          });
        }
      }
    });
    
    if (updated) {
      saveToStorage(STORAGE_KEYS.COMPANY_DOCUMENTS, documents);
    }
  }
};
