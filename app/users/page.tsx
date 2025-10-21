"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { AdminLayout } from "@/components/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import CustomLoader from "@/components/ui/custom-loader"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Users, 
  Search, 
  RefreshCw, 
  UserCheck, 
  UserX, 
  Mail,
  Calendar,
  AlertTriangle,
  Shield,
  Settings
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface User {
  id: string
  email: string
  full_name: string | null
  username: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
  bio: string | null
  role?: string
  last_sign_in_at?: string
}

export default function UsersAdminPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.username && user.username.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredUsers(filtered)
    }
  }, [users, searchTerm])

  const fetchUsers = async () => {
    if (!supabase) return
    
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching users:", error)
        setError("Failed to load users")
        return
      }

      setUsers(data || [])
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const getUserRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Admin</Badge>
      case 'moderator':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Moderator</Badge>
      case 'premium':
        return <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">Premium</Badge>
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">User</Badge>
    }
  }

  const getActivityStatus = (lastSignIn?: string) => {
    if (!lastSignIn) return <Badge variant="outline" className="text-gray-500">Never</Badge>
    
    const daysSinceLastSignIn = Math.floor((Date.now() - new Date(lastSignIn).getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceLastSignIn === 0) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Today</Badge>
    } else if (daysSinceLastSignIn <= 7) {
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">This Week</Badge>
    } else if (daysSinceLastSignIn <= 30) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">This Month</Badge>
    } else {
      return <Badge variant="outline" className="text-gray-500">Inactive</Badge>
    }
  }

  const getUserStats = () => {
    const totalUsers = users.length
    const activeUsers = users.filter(u => u.last_sign_in_at && 
      Math.floor((Date.now() - new Date(u.last_sign_in_at).getTime()) / (1000 * 60 * 60 * 24)) <= 30
    ).length
    const newUsersThisWeek = users.filter(u => 
      new Date(u.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length

    return { totalUsers, activeUsers, newUsersThisWeek }
  }

  const stats = getUserStats()

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Manage platform users and their accounts</p>
          </div>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUsers}</div>
              <p className="text-xs text-muted-foreground">Active this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New This Week</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.newUsersThisWeek}</div>
              <p className="text-xs text-muted-foreground">New registrations</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <CustomLoader size="lg" text="Loading users..." showText={true} />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                            <Users className="w-8 h-8 text-muted-foreground" />
                          </div>
                          <div>
                            <h3 className="font-semibold">No users found</h3>
                            <p className="text-sm text-muted-foreground">
                              {searchTerm ? "Try adjusting your search criteria" : "No users have registered yet"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {(user.full_name || user.username || user.email)[0]?.toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">
                                {user.full_name || user.username || "Unnamed User"}
                              </div>
                              {user.username && user.full_name && (
                                <div className="text-sm text-muted-foreground">@{user.username}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getUserRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          {getActivityStatus(user.last_sign_in_at)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDistanceToNow(new Date(user.created_at))} ago
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Shield className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
