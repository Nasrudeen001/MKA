"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { supabase } from "@/lib/supabase"
import { formatOrdinal, OrdinalDisplay } from "@/lib/ordinal-utils.tsx"
import { ArrowLeft, Loader2, Settings, Calendar, Trophy, Database, Edit, Trash2, Plus } from "lucide-react"
import Link from "next/link"

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

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  const [settings, setSettings] = useState<EventSettings>({
    id: 0,
    event_name: "Annual Majlis Khudam-ul-Ahmadiyya Kenya Ijtemaa",
    khuddam_ordinal: 51,
    atfal_ordinal: 23,
    year: new Date().getFullYear(),
    venue: "Nairobi, Kenya",
    theme: "",
    start_date: "",
    end_date: "",
  })

  const [allEvents, setAllEvents] = useState<EventSettings[]>([])
  const [editingEvent, setEditingEvent] = useState<EventSettings | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deletingEvent, setDeletingEvent] = useState<EventSettings | null>(null)

  const router = useRouter()

  useEffect(() => {
    checkUser()
    fetchSettings()
  }, [])

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

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase.from("event_settings").select("*").order("id", { ascending: false })

      if (error) {
        if (error.message.includes("does not exist") || error.message.includes("schema cache")) {
          setError("Event settings table not found. Please run the setup script first.")
          return
        }
        throw error
      }

      if (data && data.length > 0) {
        setAllEvents(data)
        setSettings(data[0]) // Most recent event
      }
    } catch (error) {
      console.error("Error fetching settings:", error)
      setError("Failed to load event settings")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    try {
      const { error } = await supabase
        .from("event_settings")
        .upsert({
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()

      if (error) throw error

      setSuccess("Event settings saved successfully!")
      fetchSettings() // Refresh the list
      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (event: EventSettings) => {
    setSettings(event)
    setEditingEvent(event)
  }

  const handleDelete = (event: EventSettings) => {
    setDeletingEvent(event)
    setDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingEvent) return

    setDeleting(true)
    setError("")

    try {
      const { error } = await supabase.from("event_settings").delete().eq("id", deletingEvent.id)

      if (error) throw error

      setSuccess("Event deleted successfully!")
      setDeleteDialog(false)
      fetchSettings() // Refresh the list

      // If we deleted the current event, reset to a new one
      if (deletingEvent.id === settings.id) {
        setSettings({
          id: 0,
          event_name: "Annual Majlis Khudam-ul-Ahmadiyya Kenya Ijtemaa",
          khudam_ordinal: 51,
          atfal_ordinal: 23,
          year: new Date().getFullYear(),
          venue: "Nairobi, Kenya",
          theme: "",
          start_date: "",
          end_date: "",
        })
        setEditingEvent(null)
      }

      setTimeout(() => setSuccess(""), 3000)
    } catch (err: any) {
      setError(err.message || "Failed to delete event")
    } finally {
      setDeleting(false)
    }
  }

  const handleNewEvent = () => {
    setSettings({
      id: 0,
      event_name: "Annual Majlis Khudam-ul-Ahmadiyya Kenya Ijtemaa",
      khuddam_ordinal: 51,
      atfal_ordinal: 23,
      year: new Date().getFullYear(),
      venue: "Nairobi, Kenya",
      theme: "",
      start_date: "",
      end_date: "",
    })
    setEditingEvent(null)
  }

  const getFormattedEventName = (category: "Khudam" | "Atfal" | "Under 7") => {
    if (category === "Khudam") {
      return `${formatOrdinal(settings.khuddam_ordinal)} ${settings.event_name}`
    } else if (category === "Atfal") {
      return `${formatOrdinal(settings.atfal_ordinal)} Annual Majlis Atfal-ul-Ahmadiyya Kenya Ijtemaa`
    } else {
      return "Under 7 Children Program"
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
              <h1 className="text-xl font-bold text-gray-900 ml-4">Ijtemaa Period Settings</h1>
            </div>
            <Button onClick={handleNewEvent} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Event
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event List Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Event History</CardTitle>
                <CardDescription>Manage your past and current events</CardDescription>
              </CardHeader>
              <CardContent>
                {allEvents.length === 0 ? (
                  <p className="text-gray-500 text-sm">No events found</p>
                ) : (
                  <div className="space-y-2">
                    {allEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          settings.id === event.id ? "bg-green-50 border-green-200" : "hover:bg-gray-50"
                        }`}
                        onClick={() => handleEdit(event)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{event.year} Event</p>
                            <p className="text-xs text-gray-500">
                             <OrdinalDisplay number={event.khuddam_ordinal} size="small" /> Khudam |{" "}
                              <OrdinalDisplay number={event.atfal_ordinal} size="small" /> Atfal
                            </p>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(event)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(event)
                              }}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            {/* Database Error Alert */}
            {error && error.includes("setup script") && (
              <Alert variant="destructive" className="mb-6">
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>Database Setup Required:</strong> {error}
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

            {/* Success/Error Messages */}
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {error && !error.includes("setup script") && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Event Names Preview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Trophy className="h-5 w-5 mr-2" />
                    Event Names Preview
                    {editingEvent && (
                      <span className="ml-2 text-sm font-normal text-gray-500">(Editing {editingEvent.year})</span>
                    )}
                  </CardTitle>
                  <CardDescription>Preview how the event names will appear for each category</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg bg-blue-50">
                      <h3 className="font-semibold text-blue-800 mb-2">Khudam Event</h3>
                      <p className="text-lg font-bold text-blue-900 flex items-start">
                        <OrdinalDisplay number={settings.khuddam_ordinal} size="large" className="mr-2" />
                        <span className="ml-1">{settings.event_name}</span>
                      </p>
                      <p className="text-sm text-blue-700 mt-1">{settings.year}</p>
                    </div>
                    <div className="p-4 border rounded-lg bg-green-50">
                      <h3 className="font-semibold text-green-800 mb-2">Atfal Event</h3>
                      <p className="text-lg font-bold text-green-900 flex items-start">
                        <OrdinalDisplay number={settings.atfal_ordinal} size="large" className="mr-2" />
                        <span className="ml-1">Annual Majlis Atfal-ul-Ahmadiyya Kenya Ijtemaa</span>
                      </p>
                      <p className="text-sm text-green-700 mt-1">{settings.year}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Basic Event Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Basic Event Information
                  </CardTitle>
                  <CardDescription>Configure the main event details that apply to both categories</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="event-name">Base Event Name</Label>
                      <Input
                        id="event-name"
                        value={settings.event_name}
                        onChange={(e) => setSettings((prev) => ({ ...prev, event_name: e.target.value }))}
                        placeholder="Annual Majlis Khudam-ul-Ahmadiyya Kenya Ijtemaa"
                      />
                      <p className="text-xs text-gray-500">This will be used for Khudam events</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        type="number"
                        min="2020"
                        max="2050"
                        value={settings.year}
                        onChange={(e) => setSettings((prev) => ({ ...prev, year: Number.parseInt(e.target.value) }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="venue">Venue</Label>
                    <Input
                      id="venue"
                      value={settings.venue}
                      onChange={(e) => setSettings((prev) => ({ ...prev, venue: e.target.value }))}
                      placeholder="Nairobi, Kenya"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme">Event Theme (Optional)</Label>
                    <Textarea
                      id="theme"
                      value={settings.theme || ""}
                      onChange={(e) => setSettings((prev) => ({ ...prev, theme: e.target.value }))}
                      placeholder="Strengthening Faith Through Unity"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Ordinal Numbers */}
              <Card>
                <CardHeader>
                  <CardTitle>Ordinal Numbers</CardTitle>
                  <CardDescription>
                    Enter just the number - the suffix (st, nd, rd, th) will be added automatically
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="khudam-ordinal">Khudam Ordinal Number</Label>
                      <Input
                        id="khudam-ordinal"
                        type="number"
                        min="1"
                        max="999"
                        value={settings.khuddam_ordinal}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, khuddam_ordinal: Number.parseInt(e.target.value) || 1 }))
                        }
                        placeholder="51"
                      />
                      <p className="text-xs text-gray-500 flex items-center">
                        Preview: <OrdinalDisplay number={settings.khuddam_ordinal} className="ml-1" />
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="atfal-ordinal">Atfal Ordinal Number</Label>
                      <Input
                        id="atfal-ordinal"
                        type="number"
                        min="1"
                        max="999"
                        value={settings.atfal_ordinal}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, atfal_ordinal: Number.parseInt(e.target.value) || 1 }))
                        }
                        placeholder="23"
                      />
                      <p className="text-xs text-gray-500 flex items-center">
                        Preview: <OrdinalDisplay number={settings.atfal_ordinal} className="ml-1" />
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Event Dates
                  </CardTitle>
                  <CardDescription>Set the start and end dates for the Ijtemaa</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={settings.start_date}
                        onChange={(e) => setSettings((prev) => ({ ...prev, start_date: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={settings.end_date}
                        onChange={(e) => setSettings((prev) => ({ ...prev, end_date: e.target.value }))}
                      />
                    </div>
                  </div>

                  {settings.start_date && settings.end_date && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">
                        <strong>Event Duration:</strong>{" "}
                        {new Date(settings.start_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}{" "}
                        to{" "}
                        {new Date(settings.end_date).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      {editingEvent ? "Update Event" : "Save Event"}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the {deletingEvent?.year} event? This action cannot be undone.
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
                "Delete Event"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
