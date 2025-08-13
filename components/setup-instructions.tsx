"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Database, Key, Globe, Settings } from "lucide-react"

export default function SetupInstructions() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">MKA Kenya Ijtemaa Registration System</h1>
          <p className="text-gray-600">Setup required to get started</p>
        </div>

        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <Settings className="h-4 w-4" />
          <AlertDescription className="text-amber-800">
            <strong>Setup Required:</strong> This system requires Supabase configuration to function properly.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-green-600" />
                Step 1: Create Supabase Project
              </CardTitle>
              <CardDescription>Set up your Supabase backend</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>
                  Go to{" "}
                  <a
                    href="https://supabase.com"
                    className="text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    supabase.com
                  </a>{" "}
                  and create a new account
                </li>
                <li>Create a new project</li>
                <li>Wait for the project to be fully provisioned</li>
                <li>Go to Settings → API to find your project credentials</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2 text-blue-600" />
                Step 2: Configure Environment Variables
              </CardTitle>
              <CardDescription>Add these to your environment</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm">
                <div className="space-y-1">
                  <div>NEXT_PUBLIC_SUPABASE_URL=your_supabase_url</div>
                  <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key</div>
                  <div>SUPABASE_SERVICE_ROLE_KEY=your_service_role_key</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Replace the values with your actual Supabase project credentials from the API settings page.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2 text-purple-600" />
                Step 3: Run Database Setup
              </CardTitle>
              <CardDescription>Initialize your database schema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>In your Supabase dashboard, go to the SQL Editor</li>
                <li>
                  Run the SQL script provided in <Badge variant="outline">scripts/001-create-tables.sql</Badge>
                </li>
                <li>This will create all necessary tables, functions, and sample data</li>
                <li>Enable Row Level Security (RLS) if prompted</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-green-600" />
                Step 4: Authentication Setup
              </CardTitle>
              <CardDescription>Configure user authentication</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>In Supabase dashboard, go to Authentication → Settings</li>
                <li>Enable email authentication</li>
                <li>Create your first user account in Authentication → Users</li>
                <li>Or use the sign-up functionality once configured</li>
              </ol>
            </CardContent>
          </Card>

          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              <strong>Ready to go!</strong> Once you've completed these steps, refresh the page and you'll be able to
              use the full registration system.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}
