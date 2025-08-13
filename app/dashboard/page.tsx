"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { supabase } from "@/lib/supabase"
import { formatOrdinal, OrdinalDisplay } from "@/lib/ordinal-utils.tsx"
import { Users, UserPlus, Settings, LogOut, Calendar, MapPin, Database, Trophy, Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Link from "next/link"
import { useTheme } from "@/lib/theme-context"

interface DashboardStats {
  totalParticipants: number
  khuddam: number
  atfal: number
  under7: number
  regions: number
  regionsWithParticipants: number
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

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalParticipants: 0,
    khudam: 0,
    atfal: 0,
    under7: 0,
    regions: 0,
    regionsWithParticipants: 0,
  })
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null)
  const [recentParticipants, setRecentParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState("")
  const router = useRouter()
  const { theme, colors } = useTheme()

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchStats()
      fetchRecentParticipants()
      fetchEventSettings()
    }
  }, [user])

  const checkUser = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
      } else {
        setUser(user)
      }
    } catch (error) {
      console.error("Auth error:", error)
      router.push("/login")
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

  const fetchStats = async () => {
    try {
      // Test if tables exist by trying to query them
      const { data: testData, error: testError } = await supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
        .limit(1)

      if (testError) {
        if (testError.message.includes("does not exist") || testError.message.includes("schema cache")) {
          setDbError("Database tables not found. Please run the setup script first.")
          return
        }
        throw testError
      }

      // Get total participants
      const { count: totalCount } = await supabase.from("participants").select("*", { count: "exact", head: true })

      // Get Khuddam count
      const { count: khudamCount } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("category", "Khuddam")

      // Get Atfal count
      const { count: atfalCount } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("category", "Atfal")

      // Get Under 7 count
      const { count: under7Count } = await supabase
        .from("participants")
        .select("*", { count: "exact", head: true })
        .eq("category", "Under 7")

      // Get total regions count
      const { count: regionsCount } = await supabase.from("regions").select("*", { count: "exact", head: true })

      // Get regions with participants count
      const { data: regionsWithParticipantsData } = await supabase
        .from("participants")
        .select("region_id")
        .not("region_id", "is", null)

      const uniqueRegions = new Set(regionsWithParticipantsData?.map((p) => p.region_id) || [])

      setStats({
        totalParticipants: totalCount || 0,
        khudam: khudamCount || 0,
        atfal: atfalCount || 0,
        under7: under7Count || 0,
        regions: regionsCount || 0,
        regionsWithParticipants: uniqueRegions.size,
      })
    } catch (error: any) {
      console.error("Error fetching stats:", error)
      if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
        setDbError("Database tables not found. Please run the setup script first.")
      }
    }
  }

  const fetchRecentParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("participants")
        .select(`
          *,
          regions(name),
                      majlis(name)
        `)
        .order("created_at", { ascending: false })
        .limit(5)

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          setDbError("Database tables not found. Please run the setup script first.")
          return
        }
        throw error
      }
      setRecentParticipants(data || [])
    } catch (error: any) {
      console.error("Error fetching recent participants:", error)
      if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
        setDbError("Database tables not found. Please run the setup script first.")
      }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const getFormattedEventName = (category: "Khudam" | "Atfal" | "Under 7") => {
    if (!eventSettings) return ""
    if (category === "Khudam") {
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
      month: "long",
      day: "numeric",
    })} - ${endDate.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/images/khudam-logo.png" alt="MKA Kenya Logo" className="h-8 w-8 mr-3 object-contain" />
              <h1 className="text-xl font-bold" style={{ color: colors.foreground }}>
                MKA Kenya Ijtemaa
              </h1>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user?.email}</span>
              <Link href="/profile">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Trophy className="h-4 w-4 mr-2" />
                  Event Settings
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64">
                  <div className="space-y-4 mt-4">
                    <div className="text-sm text-gray-600">{user?.email}</div>
                    <Link href="/dashboard">
                      <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="ghost" className="w-full justify-start">Register</Button>
                    </Link>
                    <Link href="/participants">
                      <Button variant="ghost" className="w-full justify-start">Participants</Button>
                    </Link>
                    <Link href="/settings">
                      <Button variant="ghost" className="w-full justify-start">Event Settings</Button>
                    </Link>
                    <Link href="/profile">
                      <Button variant="ghost" className="w-full justify-start">Profile</Button>
                    </Link>
                    <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" /> Logout
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
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold text-green-800 mb-1 flex items-start justify-center">
                      <OrdinalDisplay number={eventSettings.khuddam_ordinal} size="large" className="mr-2" />
                      <span className="ml-1">{eventSettings.event_name}</span>
                    </h2>
                    <p className="text-sm text-green-600">{eventSettings.year}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm">
                    <h2 className="text-xl font-bold text-blue-800 mb-1 flex items-start justify-center">
                      <OrdinalDisplay number={eventSettings.atfal_ordinal} size="large" className="mr-2" />
                      <span className="ml-1">Annual Majlis Atfal-ul-Ahmadiyya Kenya Ijtemaa</span>
                    </h2>
                    <p className="text-sm text-blue-600">{eventSettings.year}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-1">
                  <p className="text-lg font-semibold text-gray-800">{formatDateRange()}</p>
                  <div className="flex items-center justify-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>{eventSettings.venue}</span>
                  </div>
                  {eventSettings.theme && <p className="text-sm text-gray-600 italic">"{eventSettings.theme}"</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
                <li>Run the SQL script from scripts/001-create-tables.sql</li>
                <li>Run the SQL script from scripts/002-add-event-settings.sql</li>
                <li>Refresh this page</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalParticipants}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Khuddam (15-40)</CardTitle>
              <Badge variant="secondary">K</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.khudam}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Atfal (7-15)</CardTitle>
              <Badge variant="secondary">A</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.atfal}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under 7</CardTitle>
              <Badge variant="outline">U</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.under7}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regions</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.regionsWithParticipants}</div>
              <p className="text-xs text-muted-foreground">
                {stats.regionsWithParticipants} of {stats.regions} regions with participants
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 sm:justify-center">
          <Link href="/register">
            <Button className="bg-green-600 hover:bg-green-700" disabled={!!dbError}>
              <UserPlus className="h-4 w-4 mr-2" />
              Register New Participant
            </Button>
          </Link>
          <Link href="/participants">
            <Button variant="outline" disabled={!!dbError}>
              <Users className="h-4 w-4 mr-2" />
              View All Participants
            </Button>
          </Link>
        </div>

        {/* Recent Participants */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Registrations</CardTitle>
            <CardDescription>Latest participants registered in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {dbError ? (
              <div className="text-center py-8">
                <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Database setup required to view participants</p>
              </div>
            ) : recentParticipants.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No participants registered yet</p>
            ) : (
              <div className="space-y-4">
                {recentParticipants.map((participant) => (
                  <div key={participant.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={
                          participant.category === "Khudam" ? "default" : 
                          participant.category === "Atfal" ? "secondary" : 
                          "outline"
                        }>
                          {participant.registration_number}
                        </Badge>
                        <span className="font-medium">{participant.full_name}</span>
                        <span className="text-sm text-gray-500">Age {participant.age}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {participant.regions?.name} - {participant.majlis?.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        {new Date(participant.date_of_arrival).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
