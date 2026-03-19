import useSWR from 'swr'
import type { Recording } from '@/lib/types/recording'

interface RecordingsResponse {
  data: Recording[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function useRecordings(params: {
  page?: number
  limit?: number
  status?: string
  search?: string
  userId?: string
  skill?: string
  sortBySentiment?: 'asc' | 'desc' | null
}) {
  const { page = 1, limit = 10, status = 'all', search = '', userId, skill, sortBySentiment } = params
  
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status !== 'all' && { status }),
    ...(search && { search }),
    ...(userId && { userId }),
    ...(skill && { skill }),
    ...(sortBySentiment && { sortBySentiment })
  })

  const { data, error, isLoading, mutate } = useSWR<RecordingsResponse>(
    `/api/recordings?${searchParams.toString()}`,
    fetcher
  )

  return {
    recordings: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate
  }
}

export async function updateRecording(id: string, data: Partial<Recording>) {
  const response = await fetch(`/api/recordings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}

export async function deleteRecording(id: string) {
  const response = await fetch(`/api/recordings/${id}`, {
    method: 'DELETE'
  })
  return response.json()
}

export async function createRecording(data: {
  user_identifier: string
  transcription: string
  duration_seconds?: number
  language?: string
  metadata?: Record<string, unknown>
}) {
  const response = await fetch('/api/recordings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}
