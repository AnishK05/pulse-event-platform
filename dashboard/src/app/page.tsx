'use client'

import { useEffect, useState } from 'react'
import MetricCard from '@/components/MetricCard'
import { fetchOverview } from '@/lib/api-client'
import { OverviewData } from '@/lib/types'

export default function OverviewPage() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const overview = await fetchOverview()
      setData(overview)
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
          title="Events (Last Minute)"
          value={data?.eventsLastMinute ?? 0}
          subtitle="Real-time throughput"
          color="blue"
        />
        <MetricCard
          title="Events (Last 5 Minutes)"
          value={data?.eventsLast5Minutes ?? 0}
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



