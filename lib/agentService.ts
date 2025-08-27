import apiClient from './api'

export interface AgentData {
  agent_name: string
  id: string
  input_tokens: number
  output_data: null | any
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
}

export default agentService