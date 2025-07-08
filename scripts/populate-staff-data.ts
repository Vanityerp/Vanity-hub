#!/usr/bin/env tsx

import { prisma } from '../lib/prisma'
import bcrypt from 'bcryptjs'

// Staff data from the provided list
const staffData = [
  { employeeNumber: "9100", name: "Mekdes Abebe", dateOfBirth: "01-01-1985", email: "mekdes@habeshasalon.com", phone: "55667788", role: "Stylist", location: "D-Ring Road", status: "Active", homeService: "Yes", qidNumber: "123456789123", passportNumber: "EP0412645", qidValidity: "01-09-2025", passportValidity: "02-05-28", medicalValidity: "02-06-25" },
  { employeeNumber: "9101", name: "Aster Bekele", dateOfBirth: "01-01-1986", email: "aster@habeshasalon.com", phone: "55667789", role: "Stylist", location: "D-Ring Road", status: "Active", homeService: "Yes", qidNumber: "123456789124", passportNumber: "EP0412646", qidValidity: "01-09-2025", passportValidity: "02-05-28", medicalValidity: "02-06-25" },
  { employeeNumber: "9102", name: "Gelila Tolosa", dateOfBirth: "01-01-1987", email: "gelila@habeshasalon.com", phone: "55667790", role: "Nail Artist", location: "D-Ring Road", status: "Active", homeService: "Yes", qidNumber: "123456789125", passportNumber: "EP0412647", qidValidity: "01-09-2026", passportValidity: "02-05-29", medicalValidity: "02-06-26" },
  { employeeNumber: "9103", name: "Samrawit Tola", dateOfBirth: "01-01-1988", email: "samri@habeshasalon.com", phone: "55667791", role: "Nail Artist", location: "D-Ring Road", status: "Active", homeService: "Yes", qidNumber: "123456789126", passportNumber: "EP0412648", qidValidity: "01-09-2027", passportValidity: "02-05-30", medicalValidity: "02-06-27" },
  { employeeNumber: "9104", name: "Tsigereda Tade", dateOfBirth: "01-01-1989", email: "Tsigereda@habeshasalon.com", phone: "55667792", role: "Stylist", location: "D-Ring Road", status: "Active", homeService: "Yes", qidNumber: "123456789127", passportNumber: "EP0412649", qidValidity: "01-09-2028", passportValidity: "02-05-31", medicalValidity: "02-06-28" },
  { employeeNumber: "9105", name: "Ruth Abebe", dateOfBirth: "01-01-1990", email: "Ruth@habeshasalon.com", phone: "55667793", role: "Beautician", location: "D-Ring Road", status: "Active", homeService: "No", qidNumber: "123456789128", passportNumber: "EP0412650", qidValidity: "01-09-2029", passportValidity: "02-05-32", medicalValidity: "02-06-29" },
  { employeeNumber: "9106", name: "Elsa Bekel", dateOfBirth: "01-01-1991", email: "Elsa@habeshasalon.com", phone: "55667794", role: "Sylist and Nail technician", location: "Muaither", status: "Active", homeService: "No", qidNumber: "123456789129", passportNumber: "EP0412651", qidValidity: "01-09-2030", passportValidity: "02-05-33", medicalValidity: "02-06-30" },
  { employeeNumber: "9107", name: "Titi Chala", dateOfBirth: "01-01-1992", email: "Titi@habeshasalon.com", phone: "55667795", role: "Beautician", location: "Muaither", status: "Active", homeService: "Yes", qidNumber: "123456789130", passportNumber: "EP0412652", qidValidity: "01-09-2031", passportValidity: "02-05-34", medicalValidity: "02-06-31" },
  { employeeNumber: "9108", name: "Yenu Tekle", dateOfBirth: "01-01-1993", email: "Yenu@habeshasalon.com", phone: "55667796", role: "Beautician", location: "Muaither", status: "Active", homeService: "No", qidNumber: "123456789131", passportNumber: "EP0412653", qidValidity: "01-09-2032", passportValidity: "02-05-35", medicalValidity: "02-06-32" },
  { employeeNumber: "9109", name: "Veda Zeleke", dateOfBirth: "01-01-1994", email: "Veda@habeshasalon.com", phone: "55667797", role: "Stylist", location: "Muaither", status: "Active", homeService: "Yes", qidNumber: "123456789132", passportNumber: "EP0412654", qidValidity: "01-09-2033", passportValidity: "02-05-36", medicalValidity: "02-06-33" },
  { employeeNumber: "9110", name: "Sara Raja", dateOfBirth: "01-01-1995", email: "sara@habeshasalon.com", phone: "55667798", role: "Beautician", location: "Muaither", status: "Active", homeService: "Yes", qidNumber: "123456789133", passportNumber: "EP0412655", qidValidity: "01-09-2034", passportValidity: "02-05-37", medicalValidity: "02-06-34" },
  { employeeNumber: "9111", name: "Luna Debebe", dateOfBirth: "01-01-1996", email: "Luna@habeshasalon.com", phone: "55667799", role: "Beautician", location: "Muaither", status: "On leave", homeService: "Yes", qidNumber: "123456789134", passportNumber: "EP0412656", qidValidity: "01-09-2035", passportValidity: "02-05-38", medicalValidity: "02-06-35" },
  { employeeNumber: "9112", name: "Sana Bula", dateOfBirth: "01-01-1997", email: "Sana@habeshasalon.com", phone: "55667800", role: "Beautician", location: "Muaither", status: "Active", homeService: "Yes", qidNumber: "123456789135", passportNumber: "EP0412657", qidValidity: "01-09-2036", passportValidity: "02-05-39", medicalValidity: "02-06-36" },
  { employeeNumber: "9113", name: "Lana James", dateOfBirth: "01-01-1998", email: "Lana@habeshasalon.com", phone: "55667801", role: "Beautician", location: "Muaither", status: "Active", homeService: "Yes", qidNumber: "123456789136", passportNumber: "EP0412658", qidValidity: "01-09-2037", passportValidity: "02-05-40", medicalValidity: "02-06-37" },
  { employeeNumber: "9114", name: "Weyni Kebede", dateOfBirth: "01-01-1999", email: "Weyni@habeshasalon.com", phone: "55667802", role: "Stylist", location: "Medinat Khalifa", status: "Active", homeService: "Yes", qidNumber: "123456789137", passportNumber: "EP0412659", qidValidity: "01-09-2038", passportValidity: "02-05-41", medicalValidity: "02-06-38" },
  { employeeNumber: "9115", name: "Tigi Abay", dateOfBirth: "01-01-2000", email: "tigi@habeshasalon.com", phone: "55667803", role: "Stylist", location: "Medinat Khalifa", status: "Active", homeService: "Yes", qidNumber: "123456789138", passportNumber: "EP0412660", qidValidity: "01-09-2039", passportValidity: "02-05-42", medicalValidity: "02-06-39" },
  { employeeNumber: "9116", name: "Beti Chala", dateOfBirth: "01-01-2001", email: "beti@habeshasalon.com", phone: "55667804", role: "Stylist", location: "Medinat Khalifa", status: "Active", homeService: "Yes", qidNumber: "123456789139", passportNumber: "EP0412661", qidValidity: "01-09-2040", passportValidity: "02-05-43", medicalValidity: "02-06-40" },
  { employeeNumber: "9117", name: "Biti Mesfin", dateOfBirth: "01-01-2002", email: "biti@habeshasalon.com", phone: "55667805", role: "Stylist", location: "Medinat Khalifa", status: "Active", homeService: "Yes", qidNumber: "123456789140", passportNumber: "EP0412662", qidValidity: "01-09-2041", passportValidity: "02-05-44", medicalValidity: "02-06-41" },
  { employeeNumber: "9118", name: "Siti Tedy", dateOfBirth: "01-01-2003", email: "siti@habeshasalon.com", phone: "55667806", role: "Stylist", location: "Medinat Khalifa", status: "Inactive", homeService: "Yes", qidNumber: "123456789141", passportNumber: "EP0412663", qidValidity: "01-09-2042", passportValidity: "02-05-45", medicalValidity: "02-06-42" },
  { employeeNumber: "9119", name: "Lala Tofa", dateOfBirth: "01-01-2004", email: "lala@habeshasalon.com", phone: "55667807", role: "Stylist", location: "Medinat Khalifa", status: "Active", homeService: "Yes", qidNumber: "123456789142", passportNumber: "EP0412664", qidValidity: "01-09-2043", passportValidity: "02-05-46", medicalValidity: "02-06-43" }
]

// Location mapping
const locationMapping: Record<string, string> = {
  "D-Ring Road": "loc1",
  "Muaither": "loc2", 
  "Medinat Khalifa": "loc3"
}

// Convert date format from DD-MM-YYYY to DateTime
function convertDateFormat(dateStr: string): Date {
  const [day, month, year] = dateStr.split('-')
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`)
}

// Convert status to enum value
function convertStatus(status: string): string {
  switch (status.toLowerCase()) {
    case 'active': return 'ACTIVE'
    case 'inactive': return 'INACTIVE'
    case 'on leave': return 'ON_LEAVE'
    default: return 'ACTIVE'
  }
}

async function populateStaffData() {
  console.log('👥 Populating staff data...')

  try {
    let createdCount = 0
    let skippedCount = 0

    for (const staff of staffData) {
      try {
        console.log(`\n📝 Processing ${staff.name} (${staff.employeeNumber})...`)

        // Create user account for staff member
        const hashedPassword = await bcrypt.hash('staff123', 10)
        const user = await prisma.user.create({
          data: {
            email: staff.email,
            password: hashedPassword,
            role: 'STAFF'
          }
        })

        console.log(`   ✅ Created user account for ${staff.email}`)

        // Create staff member record
        const staffMember = await prisma.staffMember.create({
          data: {
            userId: user.id,
            name: staff.name,
            phone: staff.phone,
            avatar: staff.name.split(' ').map(n => n[0]).join(''),
            color: '#' + Math.floor(Math.random()*16777215).toString(16), // Random color
            jobRole: staff.role,
            dateOfBirth: convertDateFormat(staff.dateOfBirth),
            homeService: staff.homeService === 'Yes',
            status: convertStatus(staff.status),
            employeeNumber: staff.employeeNumber,
            qidNumber: staff.qidNumber,
            passportNumber: staff.passportNumber,
            qidValidity: staff.qidValidity,
            passportValidity: staff.passportValidity,
            medicalValidity: staff.medicalValidity
          }
        })

        console.log(`   ✅ Created staff member: ${staff.name}`)

        // Assign to primary location
        const primaryLocationId = locationMapping[staff.location]
        if (primaryLocationId) {
          await prisma.staffLocation.create({
            data: {
              staffId: staffMember.id,
              locationId: primaryLocationId,
              isActive: true
            }
          })
          console.log(`   ✅ Assigned to primary location: ${staff.location}`)
        }

        // If home service is enabled, also assign to home location
        if (staff.homeService === 'Yes') {
          await prisma.staffLocation.create({
            data: {
              staffId: staffMember.id,
              locationId: 'home',
              isActive: true
            }
          })
          console.log(`   ✅ Assigned to home service`)
        }

        createdCount++

      } catch (error) {
        console.log(`   ❌ Error creating ${staff.name}: ${error}`)
        skippedCount++
      }
    }

    console.log(`\n✅ Staff population completed!`)
    console.log(`   Created: ${createdCount} staff members`)
    console.log(`   Skipped: ${skippedCount} staff members`)

    // Verify the results
    const totalStaff = await prisma.staffMember.count()
    const activeStaff = await prisma.staffMember.count({ where: { status: 'ACTIVE' } })
    const staffLocations = await prisma.staffLocation.count()

    console.log(`\n📊 Final Statistics:`)
    console.log(`   Total staff members: ${totalStaff}`)
    console.log(`   Active staff members: ${activeStaff}`)
    console.log(`   Staff-location assignments: ${staffLocations}`)

  } catch (error) {
    console.error('❌ Error populating staff data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateStaffData().catch(console.error)
