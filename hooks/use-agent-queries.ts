import { useQuery, useMutation, UseQueryOptions } from '@tanstack/react-query'
import agentService, { 
  AgentApiResponse, 
  TokenUsageStatsResponse, 
  PromptsSummaryResponse, 
  PromptTokensResponse 
} from '@/lib/agentService'

export const queryKeys = {
  all: ['agent'] as const,
  agentData: (page: number = 1, pageSize: number = 50) => 
    [...queryKeys.all, 'data', { page, pageSize }] as const,
  tokenUsageStats: () => [...queryKeys.all, 'tokenUsageStats'] as const,
  promptsSummary: (page: number = 1, pageSize: number = 50) => 
    [...queryKeys.all, 'promptsSummary', { page, pageSize }] as const,
  promptTokens: (promptId: string) => 
    [...queryKeys.all, 'promptTokens', promptId] as const,
}

export function useAgentData(
  page: number = 1, 
  pageSize: number = 50,
  options?: Omit<UseQueryOptions<AgentApiResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<AgentApiResponse, Error>({
    queryKey: queryKeys.agentData(page, pageSize),
    queryFn: () => agentService.getAgentData(page, pageSize),
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
    ...options,
  })
}

export function useTokenUsageStats(
  options?: Omit<UseQueryOptions<TokenUsageStatsResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<TokenUsageStatsResponse, Error>({
    queryKey: queryKeys.tokenUsageStats(),
    queryFn: () => agentService.getTokenUsageStats(),
    staleTime: 60000, // 1 minute
    gcTime: 120000, // 2 minutes
    ...options,
  })
}

export function usePromptsSummary(
  page: number = 1, 
  pageSize: number = 50,
  options?: Omit<UseQueryOptions<PromptsSummaryResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PromptsSummaryResponse, Error>({
    queryKey: queryKeys.promptsSummary(page, pageSize),
    queryFn: () => agentService.getPromptsSummary(page, pageSize),
    staleTime: 30000, // 30 seconds
    gcTime: 60000, // 1 minute
    ...options,
  })
}

export function usePromptTokens(
  promptId: string,
  options?: Omit<UseQueryOptions<PromptTokensResponse, Error>, 'queryKey' | 'queryFn' | 'enabled'>
) {
  return useQuery<PromptTokensResponse, Error>({
    queryKey: queryKeys.promptTokens(promptId),
    queryFn: () => agentService.getPromptTokens(promptId),
    enabled: !!promptId,
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    ...options,
  })
}