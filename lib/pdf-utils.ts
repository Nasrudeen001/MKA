import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

interface Participant {
  registration_number: string
  full_name: string
  date_of_birth: string | null
  age: number
  category: "Khuddam" | "Atfal" | "Under 7"
  phone_number: string
  date_of_arrival: string
  luggage_box_number: string | null
  regions: { name: string } | null
  majlis: { name: string } | null
  created_at: string
}

interface EventSettings {
  event_name: string
  khuddam_ordinal: number
  atfal_ordinal: number
  year: number
  venue: string
  theme: string | null
  start_date: string
  end_date: string
}

// Using ESM import for autotable. Call as autoTable(doc, options)

export async function generateParticipantsPDF(
  participants: Participant[],
  eventSettings: EventSettings | null,
  categoryFilter: string,
): Promise<void> {
  const doc = new jsPDF("l", "mm", "a4")
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  // Load and add logo with better error handling
  let logoLoaded = false
  try {
    const logoDataUrl = await loadImageAsDataUrl("/images/khudam-logo.png")
    if (logoDataUrl) {
      // Add logo (centered, 20mm from top)
      const logoSize = 25
      const logoX = (pageWidth - logoSize) / 2
      doc.addImage(logoDataUrl, "PNG", logoX, 15, logoSize, logoSize)
      logoLoaded = true
    }
  } catch (error) {
    console.warn("Could not load logo for PDF:", error)
  }

  // Adjust text positioning based on whether logo loaded
  const titleY = logoLoaded ? 50 : 25
  const eventTitleY = logoLoaded ? 60 : 35
  const dateY = logoLoaded ? 70 : 45
  const venueY = logoLoaded ? 78 : 53
  const categoryY = logoLoaded ? 88 : 63
  const themeY = logoLoaded ? 96 : 71

  // Organization name
  doc.setFont("times", "bold")
  doc.setFontSize(12)
  doc.text("MAJLIS KHUDAM-UL-AHMADIYYA KENYA", pageWidth / 2, titleY, { align: "center" })

  // Event title based on category
  let eventTitle = ""
  if (eventSettings) {
    if (categoryFilter === "Khudam") {
      const suffix = getOrdinalSuffix(eventSettings.khuddam_ordinal)
      eventTitle = `${eventSettings.khuddam_ordinal}${suffix} ${eventSettings.event_name}`
    } else if (categoryFilter === "Atfal") {
      const suffix = getOrdinalSuffix(eventSettings.atfal_ordinal)
      eventTitle = `${eventSettings.atfal_ordinal}${suffix} Annual Majlis Atfal-ul-Ahmadiyya Kenya Ijtemaa`
    } else if (categoryFilter === "Under 7") {
      eventTitle = "Under 7 Children Program"
    } else {
      // All categories
      const khudamSuffix = getOrdinalSuffix(eventSettings.khuddam_ordinal)
      const atfalSuffix = getOrdinalSuffix(eventSettings.atfal_ordinal)
      eventTitle = `${eventSettings.khuddam_ordinal}${khudamSuffix} ${eventSettings.event_name} & ${eventSettings.atfal_ordinal}${atfalSuffix} Atfal Ijtemaa & Under 7 Program`
    }
  } else {
    eventTitle = "MKA Kenya Ijtemaa"
  }

  doc.setFont("times", "bold")
  doc.setFontSize(12)
  doc.text(eventTitle, pageWidth / 2, eventTitleY, { align: "center" })

  // Event dates
  if (eventSettings) {
    const startDate = new Date(eventSettings.start_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
    const endDate = new Date(eventSettings.end_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    doc.setFont("times", "normal")
    doc.setFontSize(12)
    doc.text(`${startDate} - ${endDate}`, pageWidth / 2, dateY, { align: "center" })

    // Venue
    if (eventSettings.venue) {
      doc.text(eventSettings.venue, pageWidth / 2, venueY, { align: "center" })
    }
  }

  // Category filter info
  let categoryText = "All Participants"
  if (categoryFilter === "Khudam") {
    categoryText = "Khudam Participants (Ages 15-40)"
  } else if (categoryFilter === "Atfal") {
    categoryText = "Atfal Participants (Ages 7-15)"
  }

  doc.setFont("times", "bold")
  doc.setFontSize(12)
  doc.text(categoryText, pageWidth / 2, categoryY, { align: "center" })

  // Theme if available
  let finalStartY = categoryY + 10
  if (eventSettings?.theme) {
    doc.setFont("times", "italic")
    doc.setFontSize(12)
    doc.text(`"${eventSettings.theme}"`, pageWidth / 2, themeY, { align: "center" })
    finalStartY = themeY + 10
  }

  // Prepare table data
  const tableHeaders = [
    "Reg. No.",
    "Full Name",
    "Date of Birth",
    "Age",
    "Category",
    "Phone",
    "Region",
    "Majlis",
    "Arrival Date",
    "Luggage Box",
  ]

  const tableData = participants.map((participant) => [
    participant.registration_number,
    participant.full_name,
    participant?.date_of_birth ? new Date(participant.date_of_birth).toLocaleDateString() : "-",
    participant.age.toString(),
    participant.category,
    participant.phone_number || "-",
    participant.regions?.name || "-",
    participant.majlis?.name || "-",
    new Date(participant.date_of_arrival).toLocaleDateString(),
    participant.luggage_box_number || "-",
  ])

  // Add table
  autoTable(doc, {
    head: [tableHeaders],
    body: tableData,
    startY: finalStartY,
    styles: {
      font: "times",
      fontSize: 12,
      cellPadding: 2,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [0, 0, 0], // Black header
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245], // Light gray rows
    },
    // Use wrap widths so columns adjust to content and fit margins uniformly
    columnStyles: {
      0: { cellWidth: 24 }, // Reg. No.
      1: { cellWidth: 50 }, // Full Name
      2: { cellWidth: 24 }, // Date of Birth
      3: { cellWidth: 14 }, // Age
      4: { cellWidth: 24 }, // Category
      5: { cellWidth: 28 }, // Phone
      6: { cellWidth: 32 }, // Region
      7: { cellWidth: 32 }, // Majlis
      8: { cellWidth: 26 }, // Arrival Date
      9: { cellWidth: 24 }, // Luggage Box
    },
    tableWidth: "wrap",
    margin: { left: 10, right: 10 },
  })

  // Add footer with generation info
  const finalY = (doc as any).lastAutoTable?.finalY || finalStartY + 20
  const footerY = Math.max(finalY + 15, pageHeight - 30)

  doc.setFont("times", "normal")
  doc.setFontSize(12)
  doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 15, footerY)
  doc.text(`Total Participants: ${participants.length}`, 15, footerY + 6)

  // Add page numbers if multiple pages
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 25, pageHeight - 10)
  }

  // Generate filename
  const categoryPrefix = categoryFilter === "all" ? "All" : categoryFilter
  const dateStr = new Date().toISOString().split("T")[0]
  const filename = `MKA-Kenya-Ijtemaa-${categoryPrefix}-Participants-${dateStr}.pdf`

  // Save the PDF
  doc.save(filename)
}

// Helper function to load image as data URL
async function loadImageAsDataUrl(src: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = "anonymous"

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          resolve(null)
          return
        }

        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const dataUrl = canvas.toDataURL("image/png")
        resolve(dataUrl)
      } catch (error) {
        console.error("Error converting image to data URL:", error)
        resolve(null)
      }
    }

    img.onerror = () => {
      console.error("Error loading image:", src)
      resolve(null)
    }

    img.src = src
  })
}

function getOrdinalSuffix(num: number): string {
  const lastDigit = num % 10
  const lastTwoDigits = num % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
    return "th"
  }

  switch (lastDigit) {
    case 1:
      return "st"
    case 2:
      return "nd"
    case 3:
      return "rd"
    default:
      return "th"
  }
}
