'use client'

import { useEffect, useState } from 'react'
import MetricCard from '@/components/MetricCard'
import { fetchOverview, fetchKafkaLag } from '@/lib/api-client'
import { OverviewData, KafkaLagData } from '@/lib/types'

export default function PipelinePage() {
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [lag, setLag] = useState<KafkaLagData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [overviewData, lagData] = await Promise.all([
        fetchOverview(),
        fetchKafkaLag()
      ])
      setOverview(overviewData)
      setLag(lagData)
      setError(null)
    } catch (err) {
      setError('Failed to load pipeline data')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [])

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Pipeline Status</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <MetricCard
          title="Kafka Consumer Lag"
          value={lag?.totalLag ?? 0}
          subtitle={`Status: ${lag?.status ?? 'unknown'}`}
          color={lag?.totalLag && lag.totalLag > 1000 ? 'red' : 'green'}
        />
        <MetricCard
          title="Events/Min (Last 5m)"
          value={overview?.eventsLast5Minutes ? Math.round(overview.eventsLast5Minutes / 5) : 0}
          subtitle="Average processing rate"
          color="blue"
        />
        <MetricCard
          title="Total Events (5m)"
          value={overview?.eventsLast5Minutes ?? 0}
          subtitle="Recently processed"
          color="purple"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Pipeline Architecture</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-32 text-right font-medium text-gray-700 dark:text-gray-300">
              Producer
            </div>
            <div className="flex-shrink-0">→</div>
            <div className="flex-1 bg-blue-100 dark:bg-blue-900 rounded px-4 py-2">
              Go Ingestion API (Port 8080)
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-32 text-right font-medium text-gray-700 dark:text-gray-300">
              Ingest API
            </div>
            <div className="flex-shrink-0">→</div>
            <div className="flex-1 bg-green-100 dark:bg-green-900 rounded px-4 py-2">
              Kafka Topic: events.raw (6 partitions)
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-32 text-right font-medium text-gray-700 dark:text-gray-300">
              Kafka
            </div>
            <div className="flex-shrink-0">→</div>
            <div className="flex-1 bg-purple-100 dark:bg-purple-900 rounded px-4 py-2">
              Java Processor Service (Port 8081)
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-32 text-right font-medium text-gray-700 dark:text-gray-300">
              Processor
            </div>
            <div className="flex-shrink-0">→</div>
            <div className="flex-1 bg-indigo-100 dark:bg-indigo-900 rounded px-4 py-2">
              PostgreSQL Database
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0 w-32 text-right font-medium text-gray-700 dark:text-gray-300">
              Failed Events
            </div>
            <div className="flex-shrink-0">→</div>
            <div className="flex-1 bg-red-100 dark:bg-red-900 rounded px-4 py-2">
              Kafka Topic: events.dlq (3 partitions)
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Consumer Group Info</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Group ID</span>
            <span className="font-mono">{lag?.consumerGroup ?? 'event-processor'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Total Lag</span>
            <span className="font-mono">{lag?.totalLag ?? 0} messages</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Status</span>
            <span className={`font-semibold ${
              lag?.status === 'ok' ? 'text-green-600' : 
              lag?.status === 'warning' ? 'text-yellow-600' : 
              'text-gray-600'
            }`}>
              {lag?.status ?? 'unknown'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}



