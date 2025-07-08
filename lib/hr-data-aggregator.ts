import { format, startOfDay, endOfDay, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns"
import type { DateRange } from "react-day-picker"

// Types for HR data aggregation
export interface StaffDocument {
  id: string
  staffId: string
  staffName: string
  documentType: string
  documentName: string
  uploadDate: string
  expiryDate?: string
  status: 'valid' | 'expired' | 'expiring_soon'
  fileSize: number
  category: string
}

export interface StaffPerformanceReview {
  id: string
  staffId: string
  staffName: string
  reviewDate: string
  reviewPeriod: string
  overallRating: number
  goals: string[]
  achievements: string[]
  areasForImprovement: string[]
  nextReviewDate: string
  reviewerId: string
  reviewerName: string
}

export interface TrainingRecord {
  id: string
  staffId: string
  staffName: string
  trainingTitle: string
  trainingType: 'internal' | 'external' | 'online'
  startDate: string
  endDate: string
  status: 'completed' | 'in_progress' | 'scheduled' | 'cancelled'
  certificateIssued: boolean
  cost: number
  provider: string
}

export interface StaffBenefit {
  id: string
  staffId: string
  staffName: string
  benefitType: string
  benefitName: string
  startDate: string
  endDate?: string
  monthlyValue: number
  annualValue: number
  status: 'active' | 'inactive' | 'pending'
}

export interface HRSummary {
  totalStaff: number
  activeStaff: number
  inactiveStaff: number
  documentsExpiringSoon: number
  overdueReviews: number
  completedTrainings: number
  totalBenefitsCost: number
}

// Staff documents aggregation
export function aggregateStaffDocuments(
  staffList: any[],
  dateRange?: DateRange,
  location?: string
): StaffDocument[] {
  if (!staffList || !Array.isArray(staffList)) {
    return []
  }

  const mockDocuments: StaffDocument[] = []

  staffList.forEach((staff, index) => {
    const idDigits = staff.id.replace(/\D/g, '')
    const rawSeed = idDigits ? parseInt(idDigits) : index + 1
    // Limit seed to reasonable range (1-1000) to prevent date overflow
    const seed = (rawSeed % 1000) + 1


    
    // Generate mock documents for each staff member
    const documentTypes = [
      { type: 'passport', category: 'Identity', expiryMonths: 24 },
      { type: 'visa', category: 'Legal', expiryMonths: 12 },
      { type: 'id_card', category: 'Identity', expiryMonths: 60 },
      { type: 'medical_certificate', category: 'Health', expiryMonths: 12 },
      { type: 'contract', category: 'Employment', expiryMonths: 24 },
      { type: 'training_certificate', category: 'Training', expiryMonths: 36 }
    ]

    documentTypes.forEach((docType, docIndex) => {
      const uploadDate = new Date(Date.now() - (seed + docIndex) * 30 * 24 * 60 * 60 * 1000)
      const expiryDate = new Date(uploadDate.getTime() + docType.expiryMonths * 30 * 24 * 60 * 60 * 1000)

      // Validate dates before formatting
      if (isNaN(uploadDate.getTime()) || isNaN(expiryDate.getTime())) {
        console.error('Invalid date generated for staff:', staff.id, 'seed:', seed, 'docIndex:', docIndex)
        return // Skip this document if dates are invalid
      }

      const now = new Date()
      const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))

      let status: 'valid' | 'expired' | 'expiring_soon' = 'valid'
      if (daysUntilExpiry < 0) {
        status = 'expired'
      } else if (daysUntilExpiry < 30) {
        status = 'expiring_soon'
      }

      mockDocuments.push({
        id: `doc_${staff.id}_${docIndex}`,
        staffId: staff.id,
        staffName: staff.name,
        documentType: docType.type,
        documentName: `${staff.name}_${docType.type}.pdf`,
        uploadDate: format(uploadDate, 'yyyy-MM-dd'),
        expiryDate: format(expiryDate, 'yyyy-MM-dd'),
        status,
        fileSize: 1024 + (seed * 100) % 2048, // 1-3MB range
        category: docType.category
      })
    })
  })

  // Filter by date range if provided
  if (dateRange?.from && dateRange?.to) {
    return mockDocuments.filter(doc => {
      const docDate = new Date(doc.uploadDate)
      return docDate >= startOfDay(dateRange.from!) && docDate <= endOfDay(dateRange.to!)
    })
  }

  return mockDocuments
}

// Performance reviews aggregation
export function aggregatePerformanceReviews(
  staffList: any[],
  dateRange?: DateRange,
  location?: string
): StaffPerformanceReview[] {
  if (!staffList || !Array.isArray(staffList)) {
    return []
  }

  const mockReviews: StaffPerformanceReview[] = []

  staffList.forEach((staff, index) => {
    const idDigits = staff.id.replace(/\D/g, '')
    const rawSeed = idDigits ? parseInt(idDigits) : index + 1
    // Limit seed to reasonable range (1-1000) to prevent date overflow
    const seed = (rawSeed % 1000) + 1
    
    // Generate 1-2 reviews per staff member
    const reviewCount = 1 + (seed % 2)
    
    for (let i = 0; i < reviewCount; i++) {
      const reviewDate = new Date(Date.now() - (seed + i) * 90 * 24 * 60 * 60 * 1000) // Every 3 months
      const nextReviewDate = new Date(reviewDate.getTime() + 180 * 24 * 60 * 60 * 1000) // 6 months later

      // Validate dates before formatting
      if (isNaN(reviewDate.getTime()) || isNaN(nextReviewDate.getTime())) {
        console.error('Invalid review date generated for staff:', staff.id, 'seed:', seed, 'i:', i)
        continue // Skip this review record if dates are invalid
      }

      const periodStartDate = new Date(reviewDate.getTime() - 180 * 24 * 60 * 60 * 1000)
      if (isNaN(periodStartDate.getTime())) {
        console.error('Invalid period start date generated for staff:', staff.id)
        continue
      }

      mockReviews.push({
        id: `review_${staff.id}_${i}`,
        staffId: staff.id,
        staffName: staff.name,
        reviewDate: format(reviewDate, 'yyyy-MM-dd'),
        reviewPeriod: `${format(periodStartDate, 'MMM yyyy')} - ${format(reviewDate, 'MMM yyyy')}`,
        overallRating: 3.5 + (seed * 0.1) % 1.5, // 3.5-5.0 range
        goals: [
          'Improve customer service skills',
          'Increase sales performance',
          'Complete advanced training'
        ],
        achievements: [
          'Exceeded monthly targets',
          'Received positive customer feedback',
          'Mentored new team members'
        ],
        areasForImprovement: [
          'Time management',
          'Technical skills',
          'Communication'
        ],
        nextReviewDate: format(nextReviewDate, 'yyyy-MM-dd'),
        reviewerId: 'manager_001',
        reviewerName: 'Sarah Johnson'
      })
    }
  })

  // Filter by date range if provided
  if (dateRange?.from && dateRange?.to) {
    return mockReviews.filter(review => {
      const reviewDate = new Date(review.reviewDate)
      return reviewDate >= startOfDay(dateRange.from!) && reviewDate <= endOfDay(dateRange.to!)
    })
  }

  return mockReviews
}

// Training records aggregation
export function aggregateTrainingRecords(
  staffList: any[],
  dateRange?: DateRange,
  location?: string
): TrainingRecord[] {
  if (!staffList || !Array.isArray(staffList)) {
    return []
  }

  const mockTrainings: TrainingRecord[] = []

  const trainingTypes = [
    { title: 'Customer Service Excellence', type: 'internal', cost: 200 },
    { title: 'Hair Styling Advanced Techniques', type: 'external', cost: 500 },
    { title: 'Safety and Hygiene Training', type: 'online', cost: 100 },
    { title: 'Sales and Upselling', type: 'internal', cost: 150 },
    { title: 'Color Theory Masterclass', type: 'external', cost: 750 }
  ]

  staffList.forEach((staff, index) => {
    const idDigits = staff.id.replace(/\D/g, '')
    const rawSeed = idDigits ? parseInt(idDigits) : index + 1
    // Limit seed to reasonable range (1-1000) to prevent date overflow
    const seed = (rawSeed % 1000) + 1
    
    // Generate 2-4 training records per staff member
    const trainingCount = 2 + (seed % 3)
    
    for (let i = 0; i < trainingCount; i++) {
      const training = trainingTypes[i % trainingTypes.length]
      const startDate = new Date(Date.now() - (seed + i) * 60 * 24 * 60 * 60 * 1000)
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000) // 1 week duration

      // Validate dates before formatting
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error('Invalid training date generated for staff:', staff.id, 'seed:', seed, 'i:', i)
        continue // Skip this training record if dates are invalid
      }

      const statuses: TrainingRecord['status'][] = ['completed', 'in_progress', 'scheduled']
      const status = statuses[seed % statuses.length]

      mockTrainings.push({
        id: `training_${staff.id}_${i}`,
        staffId: staff.id,
        staffName: staff.name,
        trainingTitle: training.title,
        trainingType: training.type as 'internal' | 'external' | 'online',
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        status,
        certificateIssued: status === 'completed',
        cost: training.cost,
        provider: training.type === 'external' ? 'Professional Beauty Academy' : 'Vanity Training Center'
      })
    }
  })

  // Filter by date range if provided
  if (dateRange?.from && dateRange?.to) {
    return mockTrainings.filter(training => {
      const trainingDate = new Date(training.startDate)
      return trainingDate >= startOfDay(dateRange.from!) && trainingDate <= endOfDay(dateRange.to!)
    })
  }

  return mockTrainings
}

// Staff benefits aggregation
export function aggregateStaffBenefits(
  staffList: any[],
  dateRange?: DateRange,
  location?: string
): StaffBenefit[] {
  if (!staffList || !Array.isArray(staffList)) {
    return []
  }

  const mockBenefits: StaffBenefit[] = []

  const benefitTypes = [
    { type: 'health_insurance', name: 'Health Insurance', monthlyValue: 300 },
    { type: 'accommodation', name: 'Accommodation Allowance', monthlyValue: 800 },
    { type: 'transportation', name: 'Transportation Allowance', monthlyValue: 200 },
    { type: 'meal_allowance', name: 'Meal Allowance', monthlyValue: 150 },
    { type: 'phone_allowance', name: 'Phone Allowance', monthlyValue: 50 }
  ]

  staffList.forEach((staff, index) => {
    const idDigits = staff.id.replace(/\D/g, '')
    const rawSeed = idDigits ? parseInt(idDigits) : index + 1
    // Limit seed to reasonable range (1-1000) to prevent date overflow
    const seed = (rawSeed % 1000) + 1
    
    // Each staff member gets 3-5 benefits
    const benefitCount = 3 + (seed % 3)
    
    for (let i = 0; i < benefitCount; i++) {
      const benefit = benefitTypes[i % benefitTypes.length]
      const startDate = new Date(Date.now() - (seed + i) * 30 * 24 * 60 * 60 * 1000)

      // Validate date before formatting
      if (isNaN(startDate.getTime())) {
        console.error('Invalid benefit start date generated for staff:', staff.id, 'seed:', seed, 'i:', i)
        continue // Skip this benefit record if date is invalid
      }

      mockBenefits.push({
        id: `benefit_${staff.id}_${i}`,
        staffId: staff.id,
        staffName: staff.name,
        benefitType: benefit.type,
        benefitName: benefit.name,
        startDate: format(startDate, 'yyyy-MM-dd'),
        monthlyValue: benefit.monthlyValue,
        annualValue: benefit.monthlyValue * 12,
        status: 'active'
      })
    }
  })

  return mockBenefits
}

// HR summary aggregation
export function aggregateHRSummary(
  staffList: any[],
  documents: StaffDocument[],
  reviews: StaffPerformanceReview[],
  trainings: TrainingRecord[],
  benefits: StaffBenefit[]
): HRSummary {
  const totalStaff = staffList?.length || 0
  const activeStaff = staffList?.filter(s => s.status === 'active')?.length || 0
  const inactiveStaff = totalStaff - activeStaff

  const documentsExpiringSoon = documents?.filter(d => d.status === 'expiring_soon')?.length || 0
  
  // Mock overdue reviews calculation
  const overdueReviews = Math.floor(totalStaff * 0.1) // 10% have overdue reviews

  const completedTrainings = trainings?.filter(t => t.status === 'completed')?.length || 0
  
  const totalBenefitsCost = benefits?.reduce((sum, b) => sum + b.monthlyValue, 0) || 0

  return {
    totalStaff,
    activeStaff,
    inactiveStaff,
    documentsExpiringSoon,
    overdueReviews,
    completedTrainings,
    totalBenefitsCost
  }
}
