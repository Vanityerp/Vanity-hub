"use client"

/**
 * Cross-Location Conflict Prevention Test Suite
 * Tests the appointment conflict prevention system across different location types
 */

import { parseISO, addMinutes, format } from "date-fns"
import { staffAvailabilityService } from "@/lib/services/staff-availability"
import { addAppointment, getAllAppointments, clearAllAppointments } from "@/lib/appointment-service"
import { bufferTimeConfigService } from "@/lib/services/buffer-time-config"

export interface TestResult {
  testName: string
  passed: boolean
  message: string
  details?: any
}

export class CrossLocationConflictTest {
  private testResults: TestResult[] = []

  /**
   * Run all cross-location conflict prevention tests
   */
  async runAllTests(): Promise<TestResult[]> {
    this.testResults = []
    
    console.log("🧪 Starting Cross-Location Conflict Prevention Tests...")

    // Clear existing appointments for clean testing
    clearAllAppointments()

    // Run individual tests
    await this.testBasicConflictPrevention()
    await this.testHomeServiceToPhysicalLocationConflict()
    await this.testPhysicalLocationToHomeServiceConflict()
    await this.testMultipleLocationConflicts()
    await this.testBufferTimeConflicts()
    await this.testAppointmentUpdateConflicts()
    await this.testConcurrentBookingAttempts()
    await this.testDifferentStaffSameTime()

    // Summary
    const passedTests = this.testResults.filter(r => r.passed).length
    const totalTests = this.testResults.length
    
    console.log(`✅ Tests completed: ${passedTests}/${totalTests} passed`)
    
    return this.testResults
  }

  /**
   * Test basic conflict prevention between locations
   */
  private async testBasicConflictPrevention(): Promise<void> {
    const testName = "Basic Conflict Prevention"
    
    try {
      const staffId = "aster"
      const appointmentTime = new Date()
      appointmentTime.setHours(14, 30, 0, 0) // 2:30 PM
      
      // Create appointment at physical location
      const physicalAppointment = {
        id: "test-physical-1",
        staffId,
        staffName: "Test Staff",
        date: appointmentTime.toISOString(),
        duration: 60,
        location: "d-ring-road",
        clientId: "test-client-1",
        clientName: "Test Client",
        service: "Haircut",
        serviceId: "haircut",
        status: "confirmed" as const
      }

      addAppointment(physicalAppointment)

      // Try to book same staff at home service location at same time
      const conflictCheck = await staffAvailabilityService.checkStaffAvailability({
        staffId,
        timeSlot: {
          start: appointmentTime,
          end: addMinutes(appointmentTime, 60)
        },
        locationId: "home"
      })

      if (!conflictCheck.isAvailable && conflictCheck.conflictingAppointments.length > 0) {
        this.addTestResult(testName, true, "Successfully prevented double-booking across locations")
      } else {
        this.addTestResult(testName, false, "Failed to detect conflict between physical and home service locations")
      }

    } catch (error) {
      this.addTestResult(testName, false, `Test failed with error: ${error}`)
    }
  }

  /**
   * Test conflict when home service appointment exists and physical location booking is attempted
   */
  private async testHomeServiceToPhysicalLocationConflict(): Promise<void> {
    const testName = "Home Service to Physical Location Conflict"
    
    try {
      clearAllAppointments()
      
      const staffId = "aster"
      const appointmentTime = new Date()
      appointmentTime.setHours(15, 0, 0, 0) // 3:00 PM
      
      // Create appointment at home service location
      const homeAppointment = {
        id: "test-home-1",
        staffId,
        staffName: "Test Staff",
        date: appointmentTime.toISOString(),
        duration: 90,
        location: "home",
        clientId: "test-client-2",
        clientName: "Test Client 2",
        service: "Hair Color",
        serviceId: "hair-color",
        status: "confirmed" as const
      }

      addAppointment(homeAppointment)

      // Try to book same staff at physical location during home service
      const conflictTime = addMinutes(appointmentTime, 30) // 30 minutes into home service
      const conflictCheck = await staffAvailabilityService.checkStaffAvailability({
        staffId,
        timeSlot: {
          start: conflictTime,
          end: addMinutes(conflictTime, 60)
        },
        locationId: "d-ring-road"
      })

      if (!conflictCheck.isAvailable) {
        this.addTestResult(testName, true, "Successfully prevented physical location booking during home service")
      } else {
        this.addTestResult(testName, false, "Failed to detect conflict when home service appointment exists")
      }

    } catch (error) {
      this.addTestResult(testName, false, `Test failed with error: ${error}`)
    }
  }

  /**
   * Test conflict when physical location appointment exists and home service booking is attempted
   */
  private async testPhysicalLocationToHomeServiceConflict(): Promise<void> {
    const testName = "Physical Location to Home Service Conflict"
    
    try {
      clearAllAppointments()
      
      const staffId = "aster"
      const appointmentTime = new Date()
      appointmentTime.setHours(16, 0, 0, 0) // 4:00 PM
      
      // Create appointment at physical location
      const physicalAppointment = {
        id: "test-physical-2",
        staffId,
        staffName: "Test Staff",
        date: appointmentTime.toISOString(),
        duration: 120,
        location: "d-ring-road",
        clientId: "test-client-3",
        clientName: "Test Client 3",
        service: "Full Service",
        serviceId: "full-service",
        status: "confirmed" as const
      }

      addAppointment(physicalAppointment)

      // Try to book same staff for home service during physical appointment
      const conflictTime = addMinutes(appointmentTime, 45) // 45 minutes into physical appointment
      const conflictCheck = await staffAvailabilityService.checkStaffAvailability({
        staffId,
        timeSlot: {
          start: conflictTime,
          end: addMinutes(conflictTime, 60)
        },
        locationId: "home"
      })

      if (!conflictCheck.isAvailable) {
        this.addTestResult(testName, true, "Successfully prevented home service booking during physical appointment")
      } else {
        this.addTestResult(testName, false, "Failed to detect conflict when physical appointment exists")
      }

    } catch (error) {
      this.addTestResult(testName, false, `Test failed with error: ${error}`)
    }
  }

  /**
   * Test conflicts across multiple locations
   */
  private async testMultipleLocationConflicts(): Promise<void> {
    const testName = "Multiple Location Conflicts"
    
    try {
      clearAllAppointments()
      
      const staffId = "aster"
      const baseTime = new Date()
      baseTime.setHours(10, 0, 0, 0) // 10:00 AM
      
      // Create appointments at different times and locations
      const appointments = [
        {
          id: "test-multi-1",
          staffId,
          staffName: "Test Staff",
          date: baseTime.toISOString(),
          duration: 60,
          location: "d-ring-road",
          clientId: "client-1",
          clientName: "Client 1",
          service: "Service 1",
          serviceId: "service-1",
          status: "confirmed" as const
        },
        {
          id: "test-multi-2",
          staffId,
          staffName: "Test Staff",
          date: addMinutes(baseTime, 120).toISOString(), // 12:00 PM
          duration: 90,
          location: "home",
          clientId: "client-2",
          clientName: "Client 2",
          service: "Service 2",
          serviceId: "service-2",
          status: "confirmed" as const
        }
      ]

      appointments.forEach(apt => addAppointment(apt))

      // Try to book during first appointment (should fail)
      const conflict1Check = await staffAvailabilityService.checkStaffAvailability({
        staffId,
        timeSlot: {
          start: addMinutes(baseTime, 30),
          end: addMinutes(baseTime, 90)
        },
        locationId: "home"
      })

      // Try to book during second appointment (should fail)
      const conflict2Check = await staffAvailabilityService.checkStaffAvailability({
        staffId,
        timeSlot: {
          start: addMinutes(baseTime, 150), // 12:30 PM
          end: addMinutes(baseTime, 210)
        },
        locationId: "d-ring-road"
      })

      // Try to book in available slot (should succeed)
      const availableCheck = await staffAvailabilityService.checkStaffAvailability({
        staffId,
        timeSlot: {
          start: addMinutes(baseTime, 240), // 2:00 PM
          end: addMinutes(baseTime, 300)
        },
        locationId: "home"
      })

      const allTestsPassed = !conflict1Check.isAvailable && !conflict2Check.isAvailable && availableCheck.isAvailable

      if (allTestsPassed) {
        this.addTestResult(testName, true, "Successfully handled multiple location conflicts")
      } else {
        this.addTestResult(testName, false, "Failed to properly handle multiple location conflicts")
      }

    } catch (error) {
      this.addTestResult(testName, false, `Test failed with error: ${error}`)
    }
  }

  /**
   * Test buffer time conflicts
   */
  private async testBufferTimeConflicts(): Promise<void> {
    const testName = "Buffer Time Conflicts"
    
    try {
      clearAllAppointments()
      
      // Enable buffer times
      bufferTimeConfigService.setEnforcement(true, false)
      bufferTimeConfigService.updateSettings({
        globalBeforeMinutes: 15,
        globalAfterMinutes: 15
      })

      const staffId = "aster"
      const appointmentTime = new Date()
      appointmentTime.setHours(14, 0, 0, 0) // 2:00 PM
      
      // Create appointment
      const appointment = {
        id: "test-buffer-1",
        staffId,
        staffName: "Test Staff",
        date: appointmentTime.toISOString(),
        duration: 60,
        location: "d-ring-road",
        clientId: "test-client-buffer",
        clientName: "Test Client Buffer",
        service: "Test Service",
        serviceId: "test-service",
        status: "confirmed" as const
      }

      addAppointment(appointment)

      // Try to book 10 minutes after (should fail due to 15-minute buffer)
      const bufferConflictCheck = await staffAvailabilityService.checkStaffAvailability({
        staffId,
        timeSlot: {
          start: addMinutes(appointmentTime, 70), // 10 minutes after appointment ends
          end: addMinutes(appointmentTime, 130)
        },
        locationId: "home"
      })

      // Try to book 20 minutes after (should succeed)
      const bufferSuccessCheck = await staffAvailabilityService.checkStaffAvailability({
        staffId,
        timeSlot: {
          start: addMinutes(appointmentTime, 80), // 20 minutes after appointment ends
          end: addMinutes(appointmentTime, 140)
        },
        locationId: "home"
      })

      if (!bufferConflictCheck.isAvailable && bufferSuccessCheck.isAvailable) {
        this.addTestResult(testName, true, "Buffer time conflicts working correctly")
      } else {
        this.addTestResult(testName, false, "Buffer time conflicts not working properly")
      }

      // Reset buffer times
      bufferTimeConfigService.setEnforcement(false)

    } catch (error) {
      this.addTestResult(testName, false, `Test failed with error: ${error}`)
    }
  }

  /**
   * Test appointment update conflicts
   */
  private async testAppointmentUpdateConflicts(): Promise<void> {
    const testName = "Appointment Update Conflicts"
    
    try {
      clearAllAppointments()
      
      const staffId = "aster"
      const time1 = new Date()
      time1.setHours(10, 0, 0, 0)
      const time2 = new Date()
      time2.setHours(12, 0, 0, 0)
      
      // Create two appointments
      const apt1 = {
        id: "update-test-1",
        staffId,
        staffName: "Test Staff",
        date: time1.toISOString(),
        duration: 60,
        location: "d-ring-road",
        clientId: "client-update-1",
        clientName: "Client Update 1",
        service: "Service 1",
        serviceId: "service-1",
        status: "confirmed" as const
      }

      const apt2 = {
        id: "update-test-2",
        staffId,
        staffName: "Test Staff",
        date: time2.toISOString(),
        duration: 60,
        location: "home",
        clientId: "client-update-2",
        clientName: "Client Update 2",
        service: "Service 2",
        serviceId: "service-2",
        status: "confirmed" as const
      }

      addAppointment(apt1)
      addAppointment(apt2)

      // Try to update first appointment to conflict with second (should fail)
      const updateConflictCheck = await staffAvailabilityService.checkStaffAvailability({
        staffId,
        timeSlot: {
          start: time2,
          end: addMinutes(time2, 60)
        },
        excludeAppointmentId: "update-test-1"
      })

      if (!updateConflictCheck.isAvailable) {
        this.addTestResult(testName, true, "Appointment update conflict detection working")
      } else {
        this.addTestResult(testName, false, "Failed to detect appointment update conflicts")
      }

    } catch (error) {
      this.addTestResult(testName, false, `Test failed with error: ${error}`)
    }
  }

  /**
   * Test concurrent booking attempts
   */
  private async testConcurrentBookingAttempts(): Promise<void> {
    const testName = "Concurrent Booking Attempts"
    
    try {
      clearAllAppointments()
      
      const staffId = "aster"
      const appointmentTime = new Date()
      appointmentTime.setHours(15, 30, 0, 0)
      
      // Simulate concurrent booking attempts
      const bookingPromises = [
        staffAvailabilityService.checkStaffAvailability({
          staffId,
          timeSlot: {
            start: appointmentTime,
            end: addMinutes(appointmentTime, 60)
          },
          locationId: "d-ring-road"
        }),
        staffAvailabilityService.checkStaffAvailability({
          staffId,
          timeSlot: {
            start: appointmentTime,
            end: addMinutes(appointmentTime, 60)
          },
          locationId: "home"
        })
      ]

      const results = await Promise.all(bookingPromises)
      
      // Both should initially show available (no appointments exist yet)
      if (results.every(r => r.isAvailable)) {
        this.addTestResult(testName, true, "Concurrent availability checks handled correctly")
      } else {
        this.addTestResult(testName, false, "Concurrent availability checks failed")
      }

    } catch (error) {
      this.addTestResult(testName, false, `Test failed with error: ${error}`)
    }
  }

  /**
   * Test different staff members at same time (should not conflict)
   */
  private async testDifferentStaffSameTime(): Promise<void> {
    const testName = "Different Staff Same Time"
    
    try {
      clearAllAppointments()
      
      const appointmentTime = new Date()
      appointmentTime.setHours(11, 0, 0, 0)
      
      // Create appointment for one staff member
      const appointment = {
        id: "different-staff-1",
        staffId: "aster",
        staffName: "Test Staff",
        date: appointmentTime.toISOString(),
        duration: 60,
        location: "d-ring-road",
        clientId: "client-diff-1",
        clientName: "Client Diff 1",
        service: "Service 1",
        serviceId: "service-1",
        status: "confirmed" as const
      }

      addAppointment(appointment)

      // Check availability for different staff member at same time
      const differentStaffCheck = await staffAvailabilityService.checkStaffAvailability({
        staffId: "yasmin", // Different staff member
        timeSlot: {
          start: appointmentTime,
          end: addMinutes(appointmentTime, 60)
        },
        locationId: "home"
      })

      if (differentStaffCheck.isAvailable) {
        this.addTestResult(testName, true, "Different staff members can be booked at same time")
      } else {
        this.addTestResult(testName, false, "Different staff members incorrectly blocked")
      }

    } catch (error) {
      this.addTestResult(testName, false, `Test failed with error: ${error}`)
    }
  }

  /**
   * Add a test result
   */
  private addTestResult(testName: string, passed: boolean, message: string, details?: any): void {
    this.testResults.push({
      testName,
      passed,
      message,
      details
    })
    
    const status = passed ? "✅" : "❌"
    console.log(`${status} ${testName}: ${message}`)
  }

  /**
   * Get test results summary
   */
  getTestSummary(): { total: number; passed: number; failed: number; passRate: number } {
    const total = this.testResults.length
    const passed = this.testResults.filter(r => r.passed).length
    const failed = total - passed
    const passRate = total > 0 ? (passed / total) * 100 : 0

    return { total, passed, failed, passRate }
  }
}

// Export test runner function
export async function runCrossLocationConflictTests(): Promise<TestResult[]> {
  const testRunner = new CrossLocationConflictTest()
  return await testRunner.runAllTests()
}
