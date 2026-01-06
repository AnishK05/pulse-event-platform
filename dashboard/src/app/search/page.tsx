'use client'

import { useState } from 'react'
import { searchByEventId, searchByIdempotency } from '@/lib/api-client'
import { EventDetail } from '@/lib/types'

export default function SearchPage() {
  const [searchType, setSearchType] = useState<'eventId' | 'idempotency'>('eventId')
  const [tenantId, setTenantId] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [result, setResult] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!tenantId || !searchValue) {
      setError('Please fill in all fields')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      let data: EventDetail
      if (searchType === 'eventId') {
        data = await searchByEventId(tenantId, searchValue)
      } else {
        data = await searchByIdempotency(tenantId, searchValue)
      }
      
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Failed to search')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Search Events</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Search By</label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="eventId"
                  checked={searchType === 'eventId'}
                  onChange={(e) => setSearchType('eventId')}
                  className="form-radio"
                />
                <span className="ml-2">Event ID</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  value="idempotency"
                  checked={searchType === 'idempotency'}
                  onChange={(e) => setSearchType('idempotency')}
                  className="form-radio"
                />
                <span className="ml-2">Idempotency Key</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="tenantId" className="block text-sm font-medium mb-2">
              Tenant ID
            </label>
            <input
              id="tenantId"
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder="e.g., tenant_a"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="searchValue" className="block text-sm font-medium mb-2">
              {searchType === 'eventId' ? 'Event ID' : 'Idempotency Key'}
            </label>
            <input
              id="searchValue"
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchType === 'eventId' ? 'e.g., evt_123' : 'e.g., idem_abc'}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Event Details</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Event ID</span>
              <p className="font-mono font-semibold">{result.eventId}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Event Type</span>
              <p className="font-semibold">{result.eventType}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Tenant ID</span>
              <p className="font-mono">{result.tenantId}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
              <p className="font-semibold capitalize">{result.status}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Schema Version</span>
              <p>{result.schemaVersion}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Idempotency Key</span>
              <p className="font-mono text-sm">{result.idempotencyKey}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Occurred At</span>
              <p className="text-sm">{new Date(result.occurredAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Received At</span>
              <p className="text-sm">{new Date(result.receivedAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Processed At</span>
              <p className="text-sm">{new Date(result.processedAt).toLocaleString()}</p>
            </div>
          </div>

          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400 block mb-2">Payload</span>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(result.payload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}



