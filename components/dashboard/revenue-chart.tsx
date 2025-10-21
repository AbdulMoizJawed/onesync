"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

interface RevenueData {
  month: string
  revenue: number
  streams: number
}

interface RevenueChartProps {
  data?: RevenueData[]
}

export function RevenueChart({ data = [] }: RevenueChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-lg backdrop-blur-sm">
          <p className="text-white font-medium">{`${label}`}</p>
          <p className="text-green-400">
            {`Revenue: $${payload[0].value.toLocaleString()}`}
          </p>
          <p className="text-blue-400">
            {`Streams: ${payload[1] ? payload[1].value.toLocaleString() : 'N/A'}`}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="bg-gray-900/50 border-gray-800/50 backdrop-blur-sm animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-subtle-pulse"></div>
          Revenue & Streams Overview
        </CardTitle>
        <p className="text-gray-400 text-sm">Monthly performance across all platforms</p>
      </CardHeader>
      <CardContent>
        {(!data || data.length === 0) ? (
          <div className="h-80 flex flex-col items-center justify-center text-gray-500 text-sm p-4">
            <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4">
              <div className="w-8 h-8 text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20v-6M6 20V10M18 20V4"/>
                </svg>
              </div>
            </div>
            <p className="text-gray-400 mb-2 font-medium">Waiting for revenue data</p>
            <p className="text-gray-500 text-xs text-center max-w-md mb-3">
              Your revenue and streaming analytics will appear here once your music begins to generate activity.
            </p>
            <div className="flex items-center space-x-1 text-xs text-gray-600">
              <div className="w-2 h-2 bg-gray-700 rounded-full animate-pulse"></div>
              <span>Data updates daily</span>
            </div>
          </div>
        ) : (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="streamsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis 
                dataKey="month" 
                stroke="#9ca3af" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2, fill: "#10b981" }}
              />
              <Line
                type="monotone"
                dataKey="streams"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: "#3b82f6", strokeWidth: 2, fill: "#3b82f6" }}
              />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-sm text-gray-400">Revenue ($)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            <span className="text-sm text-gray-400">Streams</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
