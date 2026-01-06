import { OverviewData, EventDetail, DlqSample, KafkaLagData } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8081/admin'

async function fetchApi<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`)
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Not found')
    }
    throw new Error(`API error: ${response.statusText}`)
  }
  
  return response.json()
}

export async function fetchOverview(): Promise<OverviewData> {
  return fetchApi<OverviewData>('/overview')
}

export async function fetchTopEventTypes(sinceMinutes: number = 1440) {
  return fetchApi(`/top-event-types?sinceMinutes=${sinceMinutes}`)
}

export async function searchByEventId(tenant: string, eventId: string): Promise<EventDetail> {
  return fetchApi<EventDetail>(`/event/search?tenant=${encodeURIComponent(tenant)}&eventId=${encodeURIComponent(eventId)}`)
}

export async function searchByIdempotency(tenant: string, idempotencyKey: string): Promise<EventDetail> {
  return fetchApi<EventDetail>(`/event/by-idempotency?tenant=${encodeURIComponent(tenant)}&idempotencyKey=${encodeURIComponent(idempotencyKey)}`)
}

export async function fetchDlqSamples(limit: number = 20): Promise<DlqSample[]> {
  return fetchApi<DlqSample[]>(`/dlq/sample?limit=${limit}`)
}

export async function fetchKafkaLag(): Promise<KafkaLagData> {
  return fetchApi<KafkaLagData>('/kafka/lag')
}

export async function fetchHealth() {
  return fetchApi('/health')
}



