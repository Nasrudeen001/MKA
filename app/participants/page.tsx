"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { generateParticipantsPDF } from "@/lib/pdf-utils"
import {
  ArrowLeft,
  Search,
  Filter,
  FileText,
  Calendar,
  MapPin,
  Phone,
  Edit,
  Trash2,
  Send,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { formatOrdinal, OrdinalDisplay } from "@/lib/ordinal-utils"

interface Participant {
  id: number
  registration_number: string
  full_name: string
  date_of_birth: string
  age: number
  category: "Khuddam" | "Atfal" | "Under 7"
  phone_number: string
  date_of_arrival: string
  luggage_box_number: string | null
  regions: { id: number; name: string } | null
  majlis: { id: number; name: string } | null
  created_at: string
}

interface Region {
  id: number
  name: string
}

interface Majlis {
  id: number
  name: string
  region_id: number
}

interface EventSettings {
  id: number
  event_name: string
  khuddam_ordinal: number
  atfal_ordinal: number
  year: number
  venue: string
  theme: string | null
  start_date: string
  end_date: string
}

export default function ParticipantsPage() {
  const [user, setUser] = useState<any>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [filteredParticipants, setFilteredParticipants] = useState<Participant[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [majlis, setMajlis] = useState<Majlis[]>([])
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [regionFilter, setRegionFilter] = useState("all")
  const [majlisFilter, setMajlisFilter] = useState("all")
  const [filteredMajlisForFilter, setFilteredMajlisForFilter] = useState<Majlis[]>([])
  const [generatingPDF, setGeneratingPDF] = useState(false)

  // Edit dialog state
  const [editDialog, setEditDialog] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [editFormData, setEditFormData] = useState({
    full_name: "",
    date_of_birth: "",
    phone_number: "",
    region_id: "",
    majlis_id: "",
    date_of_arrival: "",
    luggage_box_number: "",
  })
  const [filteredMajlisEdit, setFilteredMajlisEdit] = useState<Majlis[]>([])
  const [updating, setUpdating] = useState(false)

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Share state
  const [sharing, setSharing] = useState<number | null>(null)

  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchParticipants()
    fetchRegions()
    fetchMajlis()
    fetchEventSettings()
  }, [])

  useEffect(() => {
    filterParticipants()
  }, [participants, searchTerm, categoryFilter, regionFilter, majlisFilter])

  useEffect(() => {
    // Filter majlis for edit form based on selected region
    if (editFormData.region_id) {
      const filtered = majlis.filter((majlis) => majlis.region_id === Number.parseInt(editFormData.region_id))
      setFilteredMajlisEdit(filtered)
      if (!filtered.find((j) => j.id === Number.parseInt(editFormData.majlis_id))) {
        setEditFormData((prev) => ({ ...prev, majlis_id: "" }))
      }
    } else {
      setFilteredMajlisEdit([])
    }
  }, [editFormData.region_id, majlis])

  useEffect(() => {
    // Filter majlis for filter dropdown based on selected region
    if (regionFilter !== "all") {
      const regionId = regions.find((r) => r.name === regionFilter)?.id
      if (regionId) {
        const filtered = majlis.filter((majlis) => majlis.region_id === regionId)
        setFilteredMajlisForFilter(filtered)
        // Reset majlis filter if current selection is not in the filtered list
        if (majlisFilter !== "all" && !filtered.find((j) => j.name === majlisFilter)) {
          setMajlisFilter("all")
        }
      } else {
        setFilteredMajlisForFilter([])
      }
    } else {
      setFilteredMajlisForFilter([])
      setMajlisFilter("all")
    }
  }, [regionFilter, majlis, regions])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
    } else {
      setUser(user)
    }
    setLoading(false)
  }

  const fetchEventSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("event_settings")
        .select("*")
        .order("id", { ascending: false })
        .limit(1)

      if (error) {
        // If table doesn't exist, just log and continue with null settings
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          console.log("Event settings table not found - using defaults")
          return
        }
        throw error
      }

      if (data && data.length > 0) {
        setEventSettings(data[0])
      }
    } catch (error) {
      console.error("Error fetching event settings:", error)
      // Don't show error to user, just use default behavior
    }
  }

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("participants")
        .select(`
          *,
          regions:regions!participants_region_id_fkey(id, name),
          majlis:majlis!participants_majlis_id_fkey(id, name)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setParticipants(data || [])
    } catch (error) {
      console.error("Error fetching participants:", error)
    }
  }

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase.from("regions").select("*").order("name")
      if (error) throw error
      setRegions(data || [])
    } catch (error) {
      console.error("Error fetching regions:", error)
    }
  }

  const fetchMajlis = async () => {
    try {
      const { data, error } = await supabase.from("majlis").select("*").order("name")
      if (error) throw error
      setMajlis(data || [])
    } catch (error) {
      console.error("Error fetching majlis:", error)
    }
  }

  const filterParticipants = () => {
    let filtered = participants

    if (searchTerm) {
      filtered = filtered.filter(
        (participant) =>
          participant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          participant.registration_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          participant.phone_number.includes(searchTerm),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((participant) => participant.category === categoryFilter)
    }

    if (regionFilter !== "all") {
      filtered = filtered.filter((participant) => participant.regions?.name === regionFilter)
    }

    if (majlisFilter !== "all") {
      filtered = filtered.filter((participant) => participant.majlis?.name === majlisFilter)
    }

    setFilteredParticipants(filtered)
  }

  const getFormattedEventName = (category: "Khuddam" | "Atfal" | "Under 7") => {
    if (!eventSettings) return "MKA Kenya Ijtemaa"
    if (category === "Khuddam") {
      return `${formatOrdinal(eventSettings.khuddam_ordinal)} ${eventSettings.event_name}`
    } else if (category === "Atfal") {
      return `${formatOrdinal(eventSettings.atfal_ordinal)} Annual Majlis Atfal-ul-Ahmadiyya Kenya Ijtemaa`
    } else {
      return "Under 7 Children Program"
    }
  }

  const formatDateRange = () => {
    if (!eventSettings) return ""
    const startDate = new Date(eventSettings.start_date)
    const endDate = new Date(eventSettings.end_date)

    return `${startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} - ${endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`
  }

  const handleEdit = (participant: Participant) => {
    setEditingParticipant(participant)
    setEditFormData({
      full_name: participant.full_name,
      date_of_birth: participant.date_of_birth || "",
      phone_number: participant.phone_number,
      region_id: participant.regions?.id?.toString() || "",
      majlis_id: participant.majlis?.id?.toString() || "",
      date_of_arrival: participant.date_of_arrival,
      luggage_box_number: participant.luggage_box_number || "",
    })
    setEditDialog(true)
  }

  const handleUpdate = async () => {
    if (!editingParticipant) return

    setUpdating(true)
    setError("")

    try {
      const { error } = await supabase
        .from("participants")
        .update({
          full_name: editFormData.full_name,
          date_of_birth: editFormData.date_of_birth,
          phone_number: editFormData.phone_number,
          region_id: Number.parseInt(editFormData.region_id),
          majlis_id: Number.parseInt(editFormData.majlis_id),
          date_of_arrival: editFormData.date_of_arrival,
          luggage_box_number: editFormData.luggage_box_number || null,
        })
        .eq("id", editingParticipant.id)

      if (error) throw error

      setSuccess("Participant updated successfully!")
      setEditDialog(false)
      fetchParticipants() // Refresh the list

      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to update participant")
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = (participant: Participant) => {
    setDeletingParticipant(participant)
    setDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingParticipant) return

    setDeleting(true)
    setError("")

    try {
      const { error } = await supabase.from("participants").delete().eq("id", deletingParticipant.id)

      if (error) throw error

      setSuccess("Participant deleted successfully!")
      setDeleteDialog(false)
      fetchParticipants() // Refresh the list

      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to delete participant")
    } finally {
      setDeleting(false)
    }
  }

  const generateIdCard = async (participant: Participant): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      // Set canvas size
      canvas.width = 500
      canvas.height = 340

      // Create and load the logo image
      const logoImg = new Image()
      logoImg.crossOrigin = "anonymous"
      logoImg.onload = () => {
        // Background
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Border
        ctx.strokeStyle = "#22c55e"
        ctx.lineWidth = 3
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10)

        // Header background
        ctx.fillStyle = "#22c55e"
        ctx.fillRect(10, 10, canvas.width - 20, 90)

        // Logo in header
        const logoSize = 60
        ctx.drawImage(logoImg, 20, 20, logoSize, logoSize)

        // Event name
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 16px Arial"
        ctx.textAlign = "left"
        ctx.fillText("Majlis Khudam-ul-Ahmadiyya Kenya", logoSize + 35, 35)

        ctx.font = "bold 14px Arial"
        ctx.fillText(getFormattedEventName(participant.category), logoSize + 35, 55)

        // Year and dates
        ctx.font = "12px Arial"
        ctx.fillText(`${eventSettings?.year || new Date().getFullYear()}`, logoSize + 35, 75)
        ctx.fillText(formatDateRange(), logoSize + 35, 90)

        // Venue
        if (eventSettings?.venue) {
          ctx.font = "10px Arial"
          ctx.textAlign = "right"
          ctx.fillText(eventSettings.venue, canvas.width - 20, 95)
        }

        // Content
        ctx.fillStyle = "#000000"
        ctx.textAlign = "left"
        ctx.font = "bold 24px Arial"
        ctx.fillText(`${participant.registration_number}`, 20, 130)

        ctx.font = "bold 18px Arial"
        ctx.fillText(`${participant.full_name}`, 20, 160)

        ctx.font = "14px Arial"
        ctx.fillText(`Age: ${participant.age} | Category: ${participant.category}`, 20, 185)
        ctx.fillText(`Region: ${participant.regions?.name || '-'}`, 20, 210)
        ctx.fillText(`Majlis: ${participant.majlis?.name || '-'}`, 20, 235)
        ctx.fillText(`Phone: ${participant.phone_number}`, 20, 260)
        ctx.fillText(`Arrival: ${new Date(participant.date_of_arrival).toLocaleDateString()}`, 20, 285)

        if (participant.luggage_box_number) {
          ctx.fillText(`Luggage Box: ${participant.luggage_box_number}`, 20, 310)
        }

        // Theme at bottom if available
        if (eventSettings?.theme) {
          ctx.font = "italic 11px Arial"
          ctx.textAlign = "center"
          ctx.fillStyle = "#666666"
          ctx.fillText(`"${eventSettings.theme}"`, canvas.width / 2, 330)
        }

        // Convert to blob and resolve
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            resolve(url)
          }
        }, "image/png")
      }

      logoImg.onerror = () => {
        // Fallback without logo if image fails to load
        // Background
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Border
        ctx.strokeStyle = "#22c55e"
        ctx.lineWidth = 3
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10)

        // Header background
        ctx.fillStyle = "#22c55e"
        ctx.fillRect(10, 10, canvas.width - 20, 70)

        // Event name without logo
        ctx.fillStyle = "#ffffff"
        ctx.font = "bold 16px Arial"
        ctx.textAlign = "center"
        ctx.fillText("Majlis Khudam-ul-Ahmadiyya Kenya", canvas.width / 2, 30)
        ctx.fillText(getFormattedEventName(participant.category), canvas.width / 2, 50)

        // Continue with rest of the card...
        ctx.font = "12px Arial"
        ctx.fillText(`${eventSettings?.year || new Date().getFullYear()}`, canvas.width / 2, 65)

        // Content
        ctx.fillStyle = "#000000"
        ctx.textAlign = "left"
        ctx.font = "bold 20px Arial"
        ctx.fillText(`${participant.registration_number}`, 20, 110)

        ctx.font = "bold 16px Arial"
        ctx.fillText(`${participant.full_name}`, 20, 135)

        ctx.font = "12px Arial"
        ctx.fillText(`Age: ${participant.age} | Category: ${participant.category}`, 20, 155)
        ctx.fillText(`Region: ${participant.regions?.name || '-'}`, 20, 175)
        ctx.fillText(`Majlis: ${participant.majlis?.name || '-'}`, 20, 195)
        ctx.fillText(`Phone: ${participant.phone_number}`, 20, 215)
        ctx.fillText(`Arrival: ${new Date(participant.date_of_arrival).toLocaleDateString()}`, 20, 235)

        if (participant.luggage_box_number) {
          ctx.fillText(`Luggage Box: ${participant.luggage_box_number}`, 20, 255)
        }

        // Theme at bottom if available
        if (eventSettings?.theme) {
          ctx.font = "italic 10px Arial"
          ctx.textAlign = "center"
          ctx.fillStyle = "#666666"
          ctx.fillText(`"${eventSettings.theme}"`, canvas.width / 2, 280)
        }

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob)
            resolve(url)
          }
        }, "image/png")
      }

      logoImg.src = "/images/khudam-logo.png"
    })
  }

  const handleShare = async (participant: Participant) => {
    setSharing(participant.id)
    setError("")

    try {
      // Prepare formal WhatsApp message
      const eventName = getFormattedEventName(participant.category)
      const lines = [
        `Welcome to ${eventName}.`,
        "",
        `Registration Number: ${participant.registration_number}`,
        `Name: ${participant.full_name}`,
        `Age: ${participant.age} (${participant.category})`,
        `Region: ${participant.regions?.name || "-"}`,
        `Majlis: ${participant.majlis?.name || "-"}`,
        `Arrival Date: ${new Date(participant.date_of_arrival).toLocaleDateString()}`,
      ]
      if (participant.luggage_box_number) {
        lines.push(`Luggage Box: ${participant.luggage_box_number}`)
      }
      if (eventSettings?.venue) {
        lines.push(`Venue: ${eventSettings.venue}`)
      }
      const datesLine = formatDateRange()
      if (datesLine) {
        lines.push(`Event Dates: ${datesLine}`)
      }
      lines.push("", "Thank you for registering.")
      const message = lines.join("\n")

      // Normalize phone number for WhatsApp (Kenya default: 254)
      const digits = (participant.phone_number || "").replace(/[^0-9]/g, "")
      let phone = digits
      if (!phone) {
        throw new Error("Phone number is missing or invalid")
      }
      if (phone.startsWith("0") && phone.length >= 10) {
        phone = `254${phone.slice(1)}`
      } else if (phone.startsWith("254")) {
        // already in E.164 without plus
      } else if (phone.length === 9 && (phone.startsWith("7") || phone.startsWith("1"))) {
        phone = `254${phone}`
      }

      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, "_blank")

      setSuccess("WhatsApp message prepared in a new tab.")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to prepare share message")
    } finally {
      setSharing(null)
    }
  }

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true)
    setError("")

    try {
      await generateParticipantsPDF(filteredParticipants, eventSettings, categoryFilter)
      setSuccess("PDF generated successfully!")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError("Failed to generate PDF")
    } finally {
      setGeneratingPDF(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-gray-900 ml-4">All Participants</h1>
            </div>
            <div className="hidden md:block">
              <Button onClick={handleDownloadPDF} variant="outline" size="sm" disabled={generatingPDF}>
                {generatingPDF ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Download PDF
                  </>
                )}
              </Button>
            </div>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M3 6.75A.75.75 0 0 1 3.75 6h16.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 6.75Zm0 5.25c0-.414.336-.75.75-.75h16.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75Zm.75 4.5a.75.75 0 0 0 0 1.5h16.5a.75.75 0 0 0 0-1.5H3.75Z" clipRule="evenodd" /></svg>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="space-y-4 mt-4">
                    <Button onClick={handleDownloadPDF} variant="outline" className="w-full" disabled={generatingPDF}>
                      {generatingPDF ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating PDF...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Download PDF
                        </>
                      )}
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Information Header */}
        {eventSettings && (
          <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-green-800 flex items-start justify-center">
                  <OrdinalDisplay number={eventSettings.khuddam_ordinal} size="large" className="mr-2" />
                  <span className="ml-1">{eventSettings.event_name}</span>
                  <span className="mx-2">&</span>
                  <OrdinalDisplay number={eventSettings.atfal_ordinal} size="large" className="mr-2" />
                  <span className="ml-1">Annual Majlis Atfal-ul-Ahmadiyya Kenya Ijtemaa</span>
                </h2>
                <p className="text-lg font-semibold text-gray-800">{formatDateRange()}</p>
                <div className="flex items-center justify-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{eventSettings.venue}</span>
                </div>
                {eventSettings.theme && <p className="text-sm text-gray-600 italic">"{eventSettings.theme}"</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Success/Error Messages */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters & Search
            </CardTitle>
            <CardDescription>
              Search and filter participants by name, registration number, category, or region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, ID, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Khuddam">Khuddam (15-40)</SelectItem>
                  <SelectItem value="Atfal">Atfal (7-15)</SelectItem>
                  <SelectItem value="Under 7">Under 7 (Under 7)</SelectItem>
                </SelectContent>
              </Select>

              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {regions.map((region) => (
                    <SelectItem key={region.id} value={region.name}>
                      {region.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={majlisFilter} onValueChange={setMajlisFilter} disabled={regionFilter === "all"}>
                <SelectTrigger>
                  <SelectValue placeholder={regionFilter === "all" ? "Select region first" : "All Majlis"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Majlis</SelectItem>
                  {filteredMajlisForFilter.map((majlis) => (
                    <SelectItem key={majlis.id} value={majlis.name}>
                      {majlis.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("all")
                  setRegionFilter("all")
                  setMajlisFilter("all")
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Showing {filteredParticipants.length} of {participants.length} participants
          </p>
        </div>

        {/* Participants Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Registration #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Arrival</TableHead>
                    <TableHead>Luggage</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        No participants found matching your criteria
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredParticipants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>
                          <Badge variant={
                            participant.category === "Khuddam" ? "default" : 
                            participant.category === "Atfal" ? "secondary" : 
                            "outline"
                          }>
                            {participant.registration_number}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{participant.full_name}</TableCell>
                        <TableCell>{participant.age}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{participant.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            {participant.phone_number}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {participant.regions?.name || "-"}
                            </div>
                            <div className="text-gray-500 text-xs">{participant.majlis?.name || "-"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(participant.date_of_arrival).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{participant.luggage_box_number || "-"}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(participant)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(participant)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShare(participant)}
                              disabled={sharing === participant.id}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            >
                              {sharing === participant.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Participant</DialogTitle>
            <DialogDescription>
              Update participant information for {editingParticipant?.registration_number}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.full_name}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dob">Date of Birth</Label>
                <Input
                  id="edit-dob"
                  type="date"
                  value={editFormData.date_of_birth}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, date_of_birth: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone_number}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, phone_number: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-region">Region</Label>
                <Select
                  value={editFormData.region_id}
                  onValueChange={(value) => setEditFormData((prev) => ({ ...prev, region_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map((region) => (
                      <SelectItem key={region.id} value={region.id.toString()}>
                        {region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-majlis">Majlis</Label>
                <Select
                  value={editFormData.majlis_id}
                  onValueChange={(value) => setEditFormData((prev) => ({ ...prev, majlis_id: value }))}
                  disabled={!editFormData.region_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select majlis" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMajlisEdit.map((majlis) => (
                      <SelectItem key={majlis.id} value={majlis.id.toString()}>
                        {majlis.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-arrival">Date of Arrival</Label>
                <Input
                  id="edit-arrival"
                  type="date"
                  value={editFormData.date_of_arrival}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, date_of_arrival: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-luggage">Luggage Box Number</Label>
                <Input
                  id="edit-luggage"
                  value={editFormData.luggage_box_number}
                  onChange={(e) => setEditFormData((prev) => ({ ...prev, luggage_box_number: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updating}>
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Participant"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Participant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingParticipant?.full_name} (
              {deletingParticipant?.registration_number})? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Participant"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
