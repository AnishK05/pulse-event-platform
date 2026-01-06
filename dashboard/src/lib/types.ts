export interface OverviewData {
  eventsLastMinute: number
  eventsLast5Minutes: number
  topEventType: string
  status: string
  recentEvents?: EventDetail[]
}

export interface EventDetail {
  id: string
  tenantId: string
  eventId: string
  idempotencyKey: string
  eventType: string
  schemaVersion: number
  occurredAt: string
  receivedAt: string
  processedAt: string
  payload: Record<string, any>
  status: string
}

export interface DlqSample {
  failedAt: string
  reason: string
  original: string
  tenantId: string
}

export interface KafkaLagData {
  consumerGroup: string
  totalLag: number
  status: string
}

export interface EventTypeCount {
  eventType: string
  count: number
}



