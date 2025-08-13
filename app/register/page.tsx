"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import { ArrowLeft, Loader2, UserPlus, CheckCircle, Database } from "lucide-react"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface Region {
  id: number
  name: string
}

interface Majlis {
  id: number
  name: string
  region_id: number
}

export default function RegisterPage() {
  const [user, setUser] = useState<any>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [majlis, setMajlis] = useState<Majlis[]>([])
  const [filteredMajlis, setFilteredMajlis] = useState<Majlis[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [dbError, setDbError] = useState("")
  const [registrationNumber, setRegistrationNumber] = useState("")

  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    age: "",
    category: "",
    phoneNumber: "",
    regionId: "",
    majlisId: "",
    dateOfArrival: "",
    luggageBoxNumber: "",
  })

  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchRegions()
      fetchMajlis()
    }
  }, [user])

  useEffect(() => {
    // Update category based on date of birth
    if (formData.dateOfBirth) {
      const today = new Date()
      const birthDate = new Date(formData.dateOfBirth)
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      
      if (age < 7) {
        setFormData((prev) => ({ ...prev, category: "Under 7", age: age.toString() }))
      } else if (age >= 7 && age <= 15) {
        setFormData((prev) => ({ ...prev, category: "Atfal", age: age.toString() }))
      } else if (age >= 15 && age <= 40) {
        setFormData((prev) => ({ ...prev, category: "Khuddam", age: age.toString() }))
      } else {
        setFormData((prev) => ({ ...prev, category: "", age: age.toString() }))
      }
    }
  }, [formData.dateOfBirth])

  

  useEffect(() => {
    // Filter majlis based on selected region
    if (formData.regionId) {
      const filtered = majlis.filter((majlis) => majlis.region_id === Number.parseInt(formData.regionId))
      setFilteredMajlis(filtered)
      setFormData((prev) => ({ ...prev, majlisId: "" })) // Reset majlis selection
    } else {
      setFilteredMajlis([])
    }
  }, [formData.regionId, majlis])

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

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase.from("regions").select("*").order("name")

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          setDbError("Database tables not found. Please run the setup script first.")
          return
        }
        throw error
      }
      setRegions(data || [])
    } catch (error) {
      console.error("Error fetching regions:", error)
    }
  }

  const fetchMajlis = async () => {
    try {
      const { data, error } = await supabase.from("majlis").select("*").order("name")

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          setDbError("Database tables not found. Please run the setup script first.")
          return
        }
        throw error
      }
      setMajlis(data || [])
    } catch (error) {
      console.error("Error fetching majlis:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      // Generate registration number
      const { data: regData, error: regError } = await supabase.rpc("generate_registration_number", {
        participant_category: formData.category,
      })

      if (regError) throw regError

      // Insert participant
      const { data, error } = await supabase
        .from("participants")
        .insert({
          registration_number: regData,
          full_name: formData.fullName,
          date_of_birth: formData.dateOfBirth,
          age: Number.parseInt(formData.age),
          category: formData.category as "Khuddam" | "Atfal" | "Under 7",
          phone_number: formData.phoneNumber || "", // Allow empty string
          region_id: Number.parseInt(formData.regionId),
          majlis_id: Number.parseInt(formData.majlisId),
          date_of_arrival: formData.dateOfArrival,
          luggage_box_number: formData.luggageBoxNumber || null,
          created_by: user.id,
        })
        .select()

      if (error) throw error

      setRegistrationNumber(regData)
      setSuccess(true)

      // Reset form
      setFormData({
        fullName: "",
        age: "",
        category: "",
        phoneNumber: "",
        regionId: "",
        majlisId: "",
        dateOfArrival: "",
        luggageBoxNumber: "",
      })
    } catch (err: any) {
      setError(err.message || "An error occurred during registration")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold text-green-800">Registration Successful!</CardTitle>
            <CardDescription>Participant has been registered successfully</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Registration Number:</p>
              <Badge variant="default" className="text-lg px-4 py-2">
                {registrationNumber}
              </Badge>
            </div>
            <div className="flex flex-col space-y-2">
              <Button onClick={() => setSuccess(false)} className="bg-green-600 hover:bg-green-700">
                Register Another Participant
              </Button>
              <Link href="/dashboard">
                <Button variant="outline" className="w-full bg-transparent">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
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
              <h1 className="text-xl font-bold text-gray-900 ml-4">Register New Participant</h1>
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
                    <Link href="/dashboard"><Button variant="ghost" className="w-full justify-start">Dashboard</Button></Link>
                    <Link href="/participants"><Button variant="ghost" className="w-full justify-start">Participants</Button></Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Database Error Alert */}
        {dbError && (
          <Alert variant="destructive" className="mb-6">
            <Database className="h-4 w-4" />
            <AlertDescription>
              <strong>Database Setup Required:</strong> {dbError}
              <br />
              <br />
              <strong>To fix this:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Go to your Supabase dashboard</li>
                <li>Navigate to SQL Editor</li>
                <li>Run the SQL script from scripts/002-add-event-settings.sql</li>
                <li>Refresh this page</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="h-5 w-5 mr-2" />
              Participant Registration Form
            </CardTitle>
            <CardDescription>
              Fill in all required information to register a new participant for MKA Kenya Ijtemaa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter full name"
                    required
                    disabled={!!dbError}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                    required
                    disabled={!!dbError}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  readOnly
                  disabled
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <div className="flex items-center space-x-4">
                  {formData.category && (
                    <Badge variant={
                      formData.category === "Khuddam" ? "default" : 
                      formData.category === "Atfal" ? "secondary" : 
                      "outline"
                    }>
                      {formData.category} ({
                        formData.category === "Khuddam" ? "15-40 years" : 
                        formData.category === "Atfal" ? "7-15 years" : 
                        "Under 7 years"
                      })
                    </Badge>
                  )}
                  {formData.age && !formData.category && (
                    <span className="text-sm text-red-600">Age must be between 1-40 years</span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                  placeholder="Enter phone number (optional)"
                  disabled={!!dbError}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="region">Region *</Label>
                  <Select
                    value={formData.regionId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, regionId: value }))}
                    disabled={!!dbError}
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
                  <Label htmlFor="jamaat">Jamaat *</Label>
                  <Select
                    value={formData.majlisId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, majlisId: value }))}
                    disabled={!formData.regionId || !!dbError}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.regionId ? "Select jamaat" : "Select region first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredMajlis.map((m) => (
                        <SelectItem key={m.id} value={m.id.toString()}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateOfArrival">Date of Arrival *</Label>
                  <Input
                    id="dateOfArrival"
                    type="date"
                    value={formData.dateOfArrival}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateOfArrival: e.target.value }))}
                    required
                    disabled={!!dbError}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="luggageBoxNumber">Luggage Box Number (Optional)</Label>
                  <Input
                    id="luggageBoxNumber"
                    value={formData.luggageBoxNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, luggageBoxNumber: e.target.value }))}
                    placeholder="Enter luggage box number (optional)"
                    disabled={!!dbError}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={submitting || !formData.category || !!dbError}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register Participant
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
