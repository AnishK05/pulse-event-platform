'use client'

import { useEffect, useState } from 'react'
import MetricCard from '@/components/MetricCard'
import LiveActivityChart from '@/components/LiveActivityChart'
import EventTypesChart from '@/components/EventTypesChart'
import ThroughputGaugeChart from '@/components/ThroughputGaugeChart'
import { fetchOverview, fetchTopEventTypes } from '@/lib/api-client'
import { OverviewData, EventTypeCount } from '@/lib/types'

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [eventTypes, setEventTypes] = useState<EventTypeCount[]>([])
  const [timelineData, setTimelineData] = useState<Array<{ time: string; events: number }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [overview, topEvents] = await Promise.all([
        fetchOverview(),
        fetchTopEventTypes(60).catch(() => []) // Last 60 minutes
      ])
      
      setData(overview)
      setEventTypes(topEvents as EventTypeCount[])
      
      // Generate timeline data from recent activity
      // Simulate time series data based on available metrics
      const now = new Date()
      const timeline = Array.from({ length: 12 }, (_, i) => {
        const time = new Date(now.getTime() - (11 - i) * 5 * 60 * 1000) // 5-minute intervals
        const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        
        // Simulate data - in production, this should come from API
        let events = 0
        if (i >= 10) {
          // Use real data for most recent intervals
          events = i === 11 ? Math.round(overview.eventsLast5Minutes / 5) : Math.round(overview.eventsLast30Minutes / 30)
        } else {
          // Simulate historical data with some variation
          const base = Math.round(overview.eventsLast30Minutes / 30)
          events = Math.max(0, base + Math.round((Math.random() - 0.5) * base * 0.5))
        }
        
        return { time: timeStr, events }
      })
      
      setTimelineData(timeline)
      setError(null)
    } catch (err) {
      setError('Failed to load overview data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Overview</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Events (Last 5 Minutes)"
          value={data?.eventsLast5Minutes ?? 0}
          subtitle="Real-time throughput"
          color="blue"
        />
        <MetricCard
          title="Events (Last 30 Minutes)"
          value={data?.eventsLast30Minutes ?? 0}
          subtitle="Recent activity"
          color="green"
        />
        <MetricCard
          title="Top Event Type"
          value={data?.topEventType ?? 'none'}
          subtitle="Most frequent today"
          color="purple"
        />
        <MetricCard
          title="System Status"
          value={data?.status ?? 'unknown'}
          subtitle="Overall health"
          color={data?.status === 'healthy' ? 'green' : 'red'}
        />
      </div>

      {/* Charts Section */}
      <div className="mt-8">
        <LiveActivityChart data={timelineData} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ThroughputGaugeChart 
          eventsLast5Minutes={data?.eventsLast5Minutes ?? 0}
          eventsLast30Minutes={data?.eventsLast30Minutes ?? 0}
        />
        {eventTypes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Top Event Types</h2>
            <div className="space-y-2">
              {eventTypes.slice(0, 5).map((event, index) => (
                <div key={event.eventType} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      index === 0 ? 'bg-blue-100 text-blue-600' :
                      index === 1 ? 'bg-green-100 text-green-600' :
                      index === 2 ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-sm">{event.eventType}</span>
                  </div>
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">{event.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {eventTypes.length > 0 && (
        <div className="mt-6">
          <EventTypesChart data={eventTypes.slice(0, 10)} />
        </div>
      )}

      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">System Information</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Ingestion API</span>
            <span className="font-mono">localhost:8080</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Processor API</span>
            <span className="font-mono">localhost:8081</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Kafka</span>
            <span className="font-mono">localhost:9092</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">PostgreSQL</span>
            <span className="font-mono">localhost:5432</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Redis</span>
            <span className="font-mono">localhost:6379</span>
          </div>
        </div>
      </div>

      {data?.recentEvents && data.recentEvents.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Events</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {data.recentEvents.map((event) => (
              <div key={event.id} className="border border-gray-200 dark:border-gray-700 rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">{event.eventType}</span>
                  <span className="text-xs text-gray-500">{new Date(event.receivedAt).toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 space-x-3">
                  <span>Tenant: <span className="font-mono">{event.tenantId}</span></span>
                  <span>ID: <span className="font-mono">{event.eventId}</span></span>
                </div>
                <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded overflow-x-auto">
                  {JSON.stringify({
                    tenant_id: event.tenantId,
                    received_at: event.receivedAt,
                    request_id: event.id,
                    idempotency_key: event.idempotencyKey,
                    event: {
                      event_id: event.eventId,
                      event_type: event.eventType,
                      schema_version: event.schemaVersion,
                      occurred_at: event.occurredAt,
                      payload: event.payload
                    }
                  }, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}



