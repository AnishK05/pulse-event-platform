'use client'

import { useEffect, useState } from 'react'
import Table from '@/components/Table'
import { fetchDlqSamples } from '@/lib/api-client'
import { DlqSample } from '@/lib/types'

export default function DlqPage() {
  const [samples, setSamples] = useState<DlqSample[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedRow, setExpandedRow] = useState<number | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchDlqSamples(20)
      setSamples(data)
      setError(null)
    } catch (err) {
      setError('Failed to load DLQ samples')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const toggleExpand = (index: number) => {
    setExpandedRow(expandedRow === index ? null : index)
  }

  if (loading && samples.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dead Letter Queue</h1>
        <button
          onClick={loadData}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {samples.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No DLQ messages found. This is good! 🎉</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Failed At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Tenant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {samples.map((sample, index) => (
                <>
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(sample.failedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                      {sample.tenantId || 'unknown'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        {sample.reason}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleExpand(index)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        {expandedRow === index ? 'Hide' : 'Show'} Details
                      </button>
                    </td>
                  </tr>
                  {expandedRow === index && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 bg-gray-50 dark:bg-gray-900">
                        <div className="text-sm">
                          <h4 className="font-semibold mb-2">Original Message:</h4>
                          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-x-auto">
                            {JSON.stringify(JSON.parse(sample.original || '{}'), null, 2)}
                          </pre>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">DLQ Information</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          The Dead Letter Queue contains events that failed processing due to validation errors,
          deserialization issues, or other processing failures.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total messages displayed: <span className="font-semibold">{samples.length}</span>
        </p>
      </div>
    </div>
  )
}



