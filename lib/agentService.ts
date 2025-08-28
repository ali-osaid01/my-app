import apiClient from './api'

export interface AgentData {
  agent_name: string
  id: string
  input_tokens: number
  output_data: null | string | object
  original_model: string
  input_data: string
  output_tokens: number
  timestamp: string
}

export interface AgentApiResponse {
  total: number
  page: number
  page_size: number
  total_pages: number
  data: AgentData[]
}

export interface UsageStatsPeriod {
  input_tokens: number
  output_tokens: number
  total_tokens: number
  total_requests: number
  start_date: string | null
  end_date: string
}

export interface TokenUsageStatsResponse {
  today: UsageStatsPeriod
  last_7_days: UsageStatsPeriod
  last_month: UsageStatsPeriod
  overall: UsageStatsPeriod
}

export interface PromptSummaryData {
  prompt_id: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  timestamp?: string
}

export interface PromptsSummaryResponse {
  total: number
  page: number
  page_size: number
  total_pages: number
  data: PromptSummaryData[]
}

export interface AgentTokenData {
  input_tokens: number
  output_tokens: number
  total_tokens: number
}

export interface PromptTokensResponse {
  prompt_id: string
  agents: Record<string, AgentTokenData>
  summary: {
    total_input_tokens: number
    total_output_tokens: number
    total_tokens: number
  }
}

export const agentService = {
  async getAgentData(page: number = 1, pageSize: number = 50): Promise<AgentApiResponse> {
    try {
      const response = await apiClient.get<AgentApiResponse>('/agent-logs', {
        params: {
          page,
          page_size: pageSize,
        },
      })
      return response.data
    } catch (error) {
      console.log('Failed to fetch agent data:', error)
      throw error
    }
  },

  async getTokenUsageStats(): Promise<TokenUsageStatsResponse> {
    try {
      const response = await apiClient.get<TokenUsageStatsResponse>('/token-usage-stats')
      return response.data
    } catch (error) {
      console.log('Failed to fetch token usage stats:', error)
      throw error
    }
  },

  async getPromptsSummary(page: number = 1, pageSize: number = 50): Promise<PromptsSummaryResponse> {
    try {
      const response = await apiClient.get<PromptsSummaryResponse>('/prompts-summary', {
        params: {
          page,
          page_size: pageSize,
        },
      })
      return response.data
    } catch (error) {
      console.log('Failed to fetch prompts summary:', error)
      throw error
    }
  },

  async getPromptTokens(promptId: string): Promise<PromptTokensResponse> {
    try {
      const response = await apiClient.get<PromptTokensResponse>(`/prompt-tokens/${promptId}`)
      return response.data
    } catch (error) {
      console.log('Failed to fetch prompt tokens:', error)
      throw error
    }
  },
}

export default agentService