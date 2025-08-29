"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DollarSign, Loader2, Download, Eye } from "lucide-react"
import agentService, { AgentApiResponse, TokenUsageStatsResponse, PromptsSummaryResponse, PromptTokensResponse } from "@/lib/agentService"
import * as XLSX from 'xlsx'

// Mock data for demonstration
const mockLogs = [
  {
    id: 1,
    agentId: "agent-001",
    prompt: "Analyze customer sentiment from recent reviews",
    output:
      "Based on 150 reviews analyzed, overall sentiment is 78% positive with key themes around product quality and customer service.",
    inputTokens: 875,
    outputTokens: 375,
    model: "Gemini 2.0 Flash",
    timestamp: new Date("2024-01-15T10:30:00"),
  },
  {
    id: 2,
    agentId: "agent-002",
    prompt: "Generate product recommendations for user profile",
    output:
      "Recommended 5 products based on purchase history and preferences: wireless headphones, fitness tracker, smart home device, book series, and coffee subscription.",
    inputTokens: 623,
    outputTokens: 267,
    model: "GPT-4o",
    timestamp: new Date("2024-01-15T10:25:00"),
  },
  {
    id: 3,
    agentId: "agent-003",
    prompt: "Summarize quarterly financial report",
    output:
      "Q4 revenue increased 15% YoY to $2.3M. Key growth drivers: new product launches (+25%), international expansion (+40%), and improved retention rates.",
    inputTokens: 1470,
    outputTokens: 630,
    model: "Claude 3.5 Sonnet",
    timestamp: new Date("2024-01-15T10:20:00"),
  },
  {
    id: 4,
    agentId: "agent-001",
    prompt: "Process customer support tickets",
    output:
      "Processed 23 tickets: 15 resolved automatically, 5 escalated to human agents, 3 pending customer response. Average resolution time: 4.2 minutes.",
    inputTokens: 1176,
    outputTokens: 504,
    model: "Gemini 2.0 Flash",
    timestamp: new Date("2024-01-15T10:15:00"),
  },
  {
    id: 5,
    agentId: "agent-004",
    prompt: "Generate marketing copy for new campaign",
    output:
      "Created 3 headline variations, 2 email templates, and 5 social media posts focusing on sustainability and innovation themes.",
    inputTokens: 1365,
    outputTokens: 585,
    model: "GPT-4o",
    timestamp: new Date("2024-01-15T10:10:00"),
  },
]

// Model pricing per 1K tokens (prices as of January 2025)
const modelPricing = {
  // OpenAI Models (per 1K tokens)
  "GPT-4o": { input: 0.0025, output: 0.01 },
  "GPT-4o mini": { input: 0.00015, output: 0.0006 },
  "GPT-3.5 Turbo": { input: 0.0005, output: 0.0015 },
  "GPT-3.5 Turbo Instruct": { input: 0.0015, output: 0.002 },

  // Anthropic Claude Models (per 1K tokens)
  "Claude 3.5 Sonnet": { input: 0.003, output: 0.015 },
  "Claude 3.5 Haiku": { input: 0.001, output: 0.005 },
  "Claude 3 Opus": { input: 0.015, output: 0.075 },
  "Claude 3 Sonnet": { input: 0.003, output: 0.015 },
  "Claude 3 Haiku": { input: 0.00025, output: 0.00125 },

  // Google Gemini Models (per 1K tokens)
  "Gemini 2.5 Flash": { input: 0.00001875, output: 0.000075 },
  "Gemini 2.0 Flash": { input: 0.00001315, output: 0.0000526 },
  "Gemini 1.5 Pro": { input: 0.00125, output: 0.005 },
  "Gemini 1.5 Flash": { input: 0.000075, output: 0.0003 },
  "Gemini 1.0 Pro": { input: 0.0005, output: 0.0015 },

  // Meta Llama Models (via various providers - average pricing)
  "Llama 3.1 405B": { input: 0.0027, output: 0.0027 },
  "Llama 3.1 70B": { input: 0.00088, output: 0.00088 },
  "Llama 3.1 8B": { input: 0.00018, output: 0.00018 },
  "Llama 3 70B": { input: 0.00088, output: 0.00088 },
  "Llama 3 8B": { input: 0.00018, output: 0.00018 },
  "Llama 2 70B": { input: 0.0007, output: 0.0008 },
  "Llama 2 13B": { input: 0.00022, output: 0.00022 },
  "Llama 2 7B": { input: 0.00015, output: 0.00015 },

  // Mistral Models
  "Mistral Large": { input: 0.004, output: 0.012 },
  "Mistral Medium": { input: 0.0027, output: 0.0081 },
  "Mistral Small": { input: 0.001, output: 0.003 },
  "Mistral 7B": { input: 0.00015, output: 0.00015 },
  "Mixtral 8x7B": { input: 0.00024, output: 0.00024 },
  "Mixtral 8x22B": { input: 0.00065, output: 0.00065 },

  // Cohere Models
  "Command R+": { input: 0.003, output: 0.015 },
  "Command R": { input: 0.0005, output: 0.0015 },
  "Command": { input: 0.001, output: 0.002 },
  "Command Light": { input: 0.0003, output: 0.0006 },

  // Perplexity Models
  "Perplexity Llama 3.1 70B": { input: 0.001, output: 0.001 },
  "Perplexity Llama 3.1 8B": { input: 0.0002, output: 0.0002 },
  "Perplexity Mixtral 8x7B": { input: 0.0006, output: 0.0006 },

  // Together AI Models
  "Together Llama 3.1 405B": { input: 0.005, output: 0.005 },
  "Together Llama 3.1 70B": { input: 0.0009, output: 0.0009 },
  "Together Llama 3.1 8B": { input: 0.0002, output: 0.0002 },
  "Together Mixtral 8x22B": { input: 0.0012, output: 0.0012 },

  // Groq Models
  "Groq Llama 3.1 70B": { input: 0.00059, output: 0.00079 },
  "Groq Llama 3.1 8B": { input: 0.00005, output: 0.00008 },
  "Groq Mixtral 8x7B": { input: 0.00024, output: 0.00024 },
  "Groq Gemma 7B": { input: 0.00007, output: 0.00007 },

  // Fireworks AI Models
  "Fireworks Llama 3.1 405B": { input: 0.003, output: 0.003 },
  "Fireworks Llama 3.1 70B": { input: 0.0009, output: 0.0009 },
  "Fireworks Llama 3.1 8B": { input: 0.0002, output: 0.0002 },
  "Fireworks Mixtral 8x22B": { input: 0.0009, output: 0.0009 },

  // Replicate Models
  "Replicate Llama 3.1 405B": { input: 0.00095, output: 0.00095 },
  "Replicate Llama 3.1 70B": { input: 0.00065, output: 0.00065 },
  "Replicate Llama 3.1 8B": { input: 0.00005, output: 0.00005 },

  // xAI Models
  "Grok Beta": { input: 0.005, output: 0.015 },
  "Grok 2": { input: 0.002, output: 0.01 },

  // AI21 Models
  "Jurassic-2 Ultra": { input: 0.0188, output: 0.0188 },
  "Jurassic-2 Mid": { input: 0.0125, output: 0.0125 },
  "Jurassic-2 Light": { input: 0.0031, output: 0.0031 },

  // Amazon Bedrock Models
  "Amazon Titan Express": { input: 0.0002, output: 0.0006 },
  "Amazon Titan Lite": { input: 0.00015, output: 0.0002 },
}

// Agent types enum
enum AgentType {
  ENUM_HANDLING = "enum_agent",
  SCHEMA = "schema_agent", 
  SELECT_RELEVANT_COLUMN = "select_column_agent",
  SELECT_TABLE = "select_table_agent",
  SQL_QUERY = "sql_query_agent"
}

// Available models for agent selection
const availableAgentModels = [
  "Gemini-2.5-flash",
  "Claude 3.5 Sonnet", 
  "GPT-4o"
] as const

export default function TokenCostTable() {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>(AgentType.ENUM_HANDLING)
  const [agentModels, setAgentModels] = useState<Record<AgentType, string>>({
    [AgentType.ENUM_HANDLING]: "Gemini-2.5-flash",
    [AgentType.SCHEMA]: "Gemini-2.5-flash", 
    [AgentType.SELECT_RELEVANT_COLUMN]: "Gemini-2.5-flash",
    [AgentType.SELECT_TABLE]: "Gemini-2.5-flash",
    [AgentType.SQL_QUERY]: "Gemini-2.5-flash"
  })
  const [selectedModel, setSelectedModel] = useState<string>("Gemini 2.5 Flash")
  const [selectedPromptId, setSelectedPromptId] = useState<string>("")
  const [promptSearchInput, setPromptSearchInput] = useState<string>("")
  const [agentData, setAgentData] = useState<AgentApiResponse | null>(null)
  const [usageStats, setUsageStats] = useState<TokenUsageStatsResponse | null>(null)
  const [promptsSummary, setPromptsSummary] = useState<PromptsSummaryResponse | null>(null)
  const [promptTokens, setPromptTokens] = useState<PromptTokensResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [statsLoading, setStatsLoading] = useState<boolean>(true)
  const [promptsLoading, setPromptsLoading] = useState<boolean>(true)
  const [promptTokensLoading, setPromptTokensLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<string | null>(null)
  const [promptsError, setPromptsError] = useState<string | null>(null)
  const [promptTokensError, setPromptTokensError] = useState<string | null>(null)

  // Handler to update model for a specific agent
  const handleAgentModelChange = (agentType: AgentType, model: string) => {
    setAgentModels(prev => ({
      ...prev,
      [agentType]: model
    }))
  }

  useEffect(() => {
    const fetchData = async () => {
      // Fetch agent data
      try {
        setLoading(true)
        setError(null)
        const response = await agentService.getAgentData()
        setAgentData(response)
      } catch (err) {
        setError('Failed to fetch agent data')
        console.error('Error fetching agent data:', err)
      } finally {
        setLoading(false)
      }
    }

    const fetchUsageStats = async () => {
      // Fetch usage stats
      try {
        setStatsLoading(true)
        setStatsError(null)
        const statsResponse = await agentService.getTokenUsageStats()
        setUsageStats(statsResponse)
      } catch (err) {
        setStatsError('Failed to fetch usage stats')
        console.error('Error fetching usage stats:', err)
      } finally {
        setStatsLoading(false)
      }
    }

    const fetchPromptsSummary = async () => {
      // Fetch prompts summary
      try {
        setPromptsLoading(true)
        setPromptsError(null)
        const promptsResponse = await agentService.getPromptsSummary()
        setPromptsSummary(promptsResponse)
      } catch (err) {
        setPromptsError('Failed to fetch prompts summary')
        console.error('Error fetching prompts summary:', err)
      } finally {
        setPromptsLoading(false)
      }
    }

    fetchData()
    fetchUsageStats()
    fetchPromptsSummary()
  }, [])

  // Function to fetch prompt tokens data
  const fetchPromptTokens = async (promptId: string) => {
    if (!promptId) return
    
    try {
      setPromptTokensLoading(true)
      setPromptTokensError(null)
      const promptTokensResponse = await agentService.getPromptTokens(promptId)
      setPromptTokens(promptTokensResponse)
    } catch (err) {
      setPromptTokensError('Failed to fetch prompt tokens data')
      console.error('Error fetching prompt tokens:', err)
    } finally {
      setPromptTokensLoading(false)
    }
  }

  // Handler for prompt search
  const handlePromptSearch = () => {
    if (promptSearchInput.trim()) {
      setSelectedPromptId(promptSearchInput.trim())
      fetchPromptTokens(promptSearchInput.trim())
    }
  }

  // Handler for Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePromptSearch()
    }
  }

  // Fixed calculation: divide by 1000 since pricing is per 1K tokens
  const calculateCost = (inputTokens: number, outputTokens: number, model: string) => {
    const pricing = modelPricing[model as keyof typeof modelPricing]
    if (!pricing) {
      console.warn(`No pricing found for model: ${model}`)
      return { inputCost: 0, outputCost: 0, totalCost: 0 }
    }
    
    // Convert tokens to thousands of tokens and calculate cost
    const inputCost = (inputTokens / 1000) * pricing.input
    const outputCost = (outputTokens / 1000) * pricing.output
    const totalCost = inputCost + outputCost
    
    // Debug logging for GPT-4 to troubleshoot the $38 issue
    if (model === 'GPT-4' && totalCost > 1) {
      console.log('GPT-4 Cost Debug:', {
        inputTokens,
        outputTokens,
        inputPrice: pricing.input,
        outputPrice: pricing.output,
        inputCost,
        outputCost,
        totalCost
      })
    }
    
    return { inputCost, outputCost, totalCost }
  }

  const displayData = agentData?.data || mockLogs.map(log => ({
    agent_name: log.agentId,
    id: log.id.toString(),
    input_tokens: log.inputTokens,
    output_tokens: log.outputTokens,
    original_model: log.model,
    input_data: log.prompt,
    output_data: log.output,
    timestamp: log.timestamp.toISOString()
  }))

  const totalCost = useMemo(() => {
    return displayData.reduce((sum, log) => {
      const inputTokens = log.input_tokens || 0
      const outputTokens = log.output_tokens || 0
      return sum + calculateCost(inputTokens, outputTokens, selectedModel).totalCost
    }, 0)
  }, [selectedModel, displayData])

  // Calculate costs for usage stats from API
  const usageSummaryWithCosts = useMemo(() => {
    if (!usageStats) return null

    const calculatePeriodCosts = (inputTokens: number, outputTokens: number) => {
      const costs = calculateCost(inputTokens, outputTokens, selectedModel)
      return {
        inputCost: costs.inputCost,
        outputCost: costs.outputCost,
        totalCost: costs.totalCost
      }
    }

    return {
      today: {
        ...usageStats.today,
        ...calculatePeriodCosts(usageStats.today.input_tokens, usageStats.today.output_tokens)
      },
      last7Days: {
        ...usageStats.last_7_days,
        ...calculatePeriodCosts(usageStats.last_7_days.input_tokens, usageStats.last_7_days.output_tokens)
      },
      lastMonth: {
        ...usageStats.last_month,
        ...calculatePeriodCosts(usageStats.last_month.input_tokens, usageStats.last_month.output_tokens)
      },
      lifetime: {
        ...usageStats.overall,
        ...calculatePeriodCosts(usageStats.overall.input_tokens, usageStats.overall.output_tokens)
      }
    }
  }, [usageStats, selectedModel])

  // Get pricing info for selected model
  const selectedModelPricing = modelPricing[selectedModel as keyof typeof modelPricing]

  // Excel export function
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new()

    // Sheet 1: Prompts Summary
    if (promptsSummary && promptsSummary.data.length > 0) {
      const promptsData = promptsSummary.data.map(prompt => {
        const costs = calculateCost(prompt.input_tokens, prompt.output_tokens, selectedModel)
        return {
          'Prompt ID': prompt.prompt_id,
          'Input Tokens': prompt.input_tokens,
          'Output Tokens': prompt.output_tokens,
          'Total Tokens': prompt.total_tokens,
          [`Input Cost (${selectedModel})`]: `$${costs.inputCost.toFixed(4)}`,
          [`Output Cost (${selectedModel})`]: `$${costs.outputCost.toFixed(4)}`,
          [`Total Cost (${selectedModel})`]: `$${costs.totalCost.toFixed(4)}`,
          'Timestamp': prompt.timestamp ? new Date(prompt.timestamp).toLocaleString() : 'N/A'
        }
      })
      const promptsSheet = XLSX.utils.json_to_sheet(promptsData)
      XLSX.utils.book_append_sheet(workbook, promptsSheet, "Prompts Summary")
    }

    // Sheet 2: Agent Matrix by Prompt
    if (promptTokens && selectedPromptId) {
      const agentMatrixData = []
      
      // Add header row with prompt ID
      agentMatrixData.push({
        'Metric': `Analysis for Prompt: ${selectedPromptId}`,
        ...Object.keys(promptTokens.agents).reduce((acc, agentName) => {
          acc[agentName] = ''
          return acc
        }, {} as Record<string, string>),
        'Total': ''
      })

      // Input Tokens row
      const inputTokensRow: Record<string, string> = { 'Metric': 'Input Tokens' }
      Object.entries(promptTokens.agents).forEach(([agentName, data]) => {
        inputTokensRow[agentName] = data.input_tokens.toLocaleString()
      })
      inputTokensRow['Total'] = promptTokens.summary.total_input_tokens.toLocaleString()
      agentMatrixData.push(inputTokensRow)

      // Output Tokens row
      const outputTokensRow: Record<string, string> = { 'Metric': 'Output Tokens' }
      Object.entries(promptTokens.agents).forEach(([agentName, data]) => {
        outputTokensRow[agentName] = data.output_tokens.toLocaleString()
      })
      outputTokensRow['Total'] = promptTokens.summary.total_output_tokens.toLocaleString()
      agentMatrixData.push(outputTokensRow)

      // Total Tokens row
      const totalTokensRow: Record<string, string> = { 'Metric': 'Total Tokens' }
      Object.entries(promptTokens.agents).forEach(([agentName, data]) => {
        totalTokensRow[agentName] = data.total_tokens.toLocaleString()
      })
      totalTokensRow['Total'] = promptTokens.summary.total_tokens.toLocaleString()
      agentMatrixData.push(totalTokensRow)

      // Input Cost row
      const inputCostRow: Record<string, string> = { 'Metric': `Input Cost (${selectedModel})` }
      Object.entries(promptTokens.agents).forEach(([agentName, data]) => {
        const costs = calculateCost(data.input_tokens, data.output_tokens, selectedModel)
        inputCostRow[agentName] = `$${costs.inputCost.toFixed(4)}`
      })
      const totalInputCost = calculateCost(promptTokens.summary.total_input_tokens, promptTokens.summary.total_output_tokens, selectedModel)
      inputCostRow['Total'] = `$${totalInputCost.inputCost.toFixed(4)}`
      agentMatrixData.push(inputCostRow)

      // Output Cost row
      const outputCostRow: Record<string, string> = { 'Metric': `Output Cost (${selectedModel})` }
      Object.entries(promptTokens.agents).forEach(([agentName, data]) => {
        const costs = calculateCost(data.input_tokens, data.output_tokens, selectedModel)
        outputCostRow[agentName] = `$${costs.outputCost.toFixed(4)}`
      })
      outputCostRow['Total'] = `$${totalInputCost.outputCost.toFixed(4)}`
      agentMatrixData.push(outputCostRow)

      // Total Cost row
      const totalCostRow: Record<string, string> = { 'Metric': `Total Cost (${selectedModel})` }
      Object.entries(promptTokens.agents).forEach(([agentName, data]) => {
        const costs = calculateCost(data.input_tokens, data.output_tokens, selectedModel)
        totalCostRow[agentName] = `$${costs.totalCost.toFixed(4)}`
      })
      totalCostRow['Total'] = `$${totalInputCost.totalCost.toFixed(4)}`
      agentMatrixData.push(totalCostRow)

      const agentMatrixSheet = XLSX.utils.json_to_sheet(agentMatrixData)
      XLSX.utils.book_append_sheet(workbook, agentMatrixSheet, "Agent Matrix")
    }

    // Sheet 3: Usage Summary
    if (usageSummaryWithCosts) {
      const usageData = [
        {
          'Period': 'Today',
          'Input Tokens': usageSummaryWithCosts.today.input_tokens.toLocaleString(),
          'Output Tokens': usageSummaryWithCosts.today.output_tokens.toLocaleString(),
          'Total Requests': usageSummaryWithCosts.today.total_requests.toLocaleString(),
          [`Input Cost (${selectedModel})`]: `$${usageSummaryWithCosts.today.inputCost.toFixed(4)}`,
          [`Output Cost (${selectedModel})`]: `$${usageSummaryWithCosts.today.outputCost.toFixed(4)}`,
          'Total Cost': `$${usageSummaryWithCosts.today.totalCost.toFixed(4)}`
        },
        {
          'Period': 'Last 7 Days',
          'Input Tokens': usageSummaryWithCosts.last7Days.input_tokens.toLocaleString(),
          'Output Tokens': usageSummaryWithCosts.last7Days.output_tokens.toLocaleString(),
          'Total Requests': usageSummaryWithCosts.last7Days.total_requests.toLocaleString(),
          [`Input Cost (${selectedModel})`]: `$${usageSummaryWithCosts.last7Days.inputCost.toFixed(4)}`,
          [`Output Cost (${selectedModel})`]: `$${usageSummaryWithCosts.last7Days.outputCost.toFixed(4)}`,
          'Total Cost': `$${usageSummaryWithCosts.last7Days.totalCost.toFixed(4)}`
        },
        {
          'Period': 'Last Month',
          'Input Tokens': usageSummaryWithCosts.lastMonth.input_tokens.toLocaleString(),
          'Output Tokens': usageSummaryWithCosts.lastMonth.output_tokens.toLocaleString(),
          'Total Requests': usageSummaryWithCosts.lastMonth.total_requests.toLocaleString(),
          [`Input Cost (${selectedModel})`]: `$${usageSummaryWithCosts.lastMonth.inputCost.toFixed(4)}`,
          [`Output Cost (${selectedModel})`]: `$${usageSummaryWithCosts.lastMonth.outputCost.toFixed(4)}`,
          'Total Cost': `$${usageSummaryWithCosts.lastMonth.totalCost.toFixed(4)}`
        },
        {
          'Period': 'Lifetime',
          'Input Tokens': usageSummaryWithCosts.lifetime.input_tokens.toLocaleString(),
          'Output Tokens': usageSummaryWithCosts.lifetime.output_tokens.toLocaleString(),
          'Total Requests': usageSummaryWithCosts.lifetime.total_requests.toLocaleString(),
          [`Input Cost (${selectedModel})`]: `$${usageSummaryWithCosts.lifetime.inputCost.toFixed(4)}`,
          [`Output Cost (${selectedModel})`]: `$${usageSummaryWithCosts.lifetime.outputCost.toFixed(4)}`,
          'Total Cost': `$${usageSummaryWithCosts.lifetime.totalCost.toFixed(4)}`
        }
      ]
      const usageSheet = XLSX.utils.json_to_sheet(usageData)
      XLSX.utils.book_append_sheet(workbook, usageSheet, "Usage Summary")
    }

    // Sheet 4: Detailed Token Usage
    const detailedData = displayData.map(log => {
      const costs = calculateCost(log.input_tokens || 0, log.output_tokens || 0, selectedModel)
      return {
        'Agent Name': log.agent_name || 'N/A',
        'Input Tokens': (log.input_tokens || 0).toLocaleString(),
        'Output Tokens': (log.output_tokens || 0).toLocaleString(),
        'Total Tokens': ((log.input_tokens || 0) + (log.output_tokens || 0)).toLocaleString(),
        'Original Model': log.original_model || 'Unknown',
        [`Input Cost (${selectedModel})`]: `$${costs.inputCost.toFixed(4)}`,
        [`Output Cost (${selectedModel})`]: `$${costs.outputCost.toFixed(4)}`,
        [`Total Cost (${selectedModel})`]: `$${costs.totalCost.toFixed(4)}`,
        'Timestamp': log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'
      }
    })
    const detailedSheet = XLSX.utils.json_to_sheet(detailedData)
    XLSX.utils.book_append_sheet(workbook, detailedSheet, "Detailed Usage")

    // Generate filename with current date and selected model
    const currentDate = new Date().toISOString().split('T')[0]
    const filename = `Token_Cost_Analysis_${selectedModel.replace(/\s+/g, '_')}_${currentDate}.xlsx`

    // Save the file
    XLSX.writeFile(workbook, filename)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Token Cost Calculator</h1>
            <p className="text-muted-foreground">Calculate costs for different AI models</p>
          </div>
          <Button onClick={exportToExcel} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        </div>

        {/* Agent Selection Section */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {Object.values(AgentType).map((agentType) => (
                <div key={agentType} className="space-y-3">
                  <div className="text-center">
                    <Badge 
                      variant={selectedAgent === agentType ? "default" : "outline"}
                      className="cursor-pointer px-3 py-1"
                      onClick={() => setSelectedAgent(agentType)}
                    >
                      {agentType.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </div>
                  <Select 
                    value={agentModels[agentType]} 
                    onValueChange={(model) => handleAgentModelChange(agentType, model)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableAgentModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Model Cost Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Select Model for Cost Calculation</label>
                <Select value={selectedModel} onValueChange={setSelectedModel} defaultValue="Gemini 2.5 Flash">
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(modelPricing).map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedModelPricing && (
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    <div>Input: ${selectedModelPricing.input}/1K tokens (${(selectedModelPricing.input * 1000).toFixed(2)}/1M tokens)</div>
                    <div>Output: ${selectedModelPricing.output}/1K tokens (${(selectedModelPricing.output * 1000).toFixed(2)}/1M tokens)</div>
                    <div className="mt-2 p-2 bg-muted rounded text-xs">
                      <strong>Quick Check:</strong> 1000 tokens = ${selectedModelPricing.input} (input) or ${selectedModelPricing.output} (output)
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  Total Cost with {selectedModel}
                </p>
                <p className="text-3xl font-bold text-green-600">${totalCost.toFixed(4)}</p>
                {agentData?.total && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {agentData.total} records
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prompts Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Prompts Summary
              {promptsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {promptsError && <span className="text-sm text-red-500 font-normal">({promptsError})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {promptsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading prompts summary...</span>
              </div>
            ) : promptsSummary && promptsSummary.data.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Prompt ID</TableHead>
                      <TableHead className="text-right">Input Tokens</TableHead>
                      <TableHead className="text-right">Output Tokens</TableHead>
                      <TableHead className="text-right">Total Tokens</TableHead>
                      <TableHead className="text-right">Input Cost ({selectedModel})</TableHead>
                      <TableHead className="text-right">Output Cost ({selectedModel})</TableHead>
                      <TableHead className="text-right">Total Cost ({selectedModel})</TableHead>
                      <TableHead className="text-right">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {promptsSummary.data.map((prompt) => {
                      const costs = calculateCost(prompt.input_tokens, prompt.output_tokens, selectedModel)
                      return (
                        <TableRow key={prompt.prompt_id}>
                          <TableCell className="font-medium max-w-md truncate">
                            <span title={prompt.prompt_id}>{prompt.prompt_id}</span>
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {prompt.input_tokens.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {prompt.output_tokens.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono font-medium text-right">
                            {prompt.total_tokens.toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-right text-blue-600">
                            ${costs.inputCost.toFixed(4)}
                          </TableCell>
                          <TableCell className="font-mono text-right text-orange-600">
                            ${costs.outputCost.toFixed(4)}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-right text-green-600">
                            ${costs.totalCost.toFixed(4)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {prompt.timestamp ? new Date(prompt.timestamp).toLocaleString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
                {promptsSummary.total > promptsSummary.page_size && (
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    Showing {promptsSummary.data.length} of {promptsSummary.total} prompts
                    (Page {promptsSummary.page} of {promptsSummary.total_pages})
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No prompts summary available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agent Matrix Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Agent Matrix by Prompt
              {promptTokensLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {promptTokensError && <span className="text-sm text-red-500 font-normal">({promptTokensError})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Enter Prompt ID</label>
                <div className="flex gap-2 flex-1 max-w-md">
                  <Input
                    type="text"
                    value={promptSearchInput}
                    onChange={(e) => setPromptSearchInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter prompt ID to analyze"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handlePromptSearch}
                    disabled={!promptSearchInput.trim() || promptTokensLoading}
                  >
                    {promptTokensLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                  </Button>
                </div>
              </div>
              
              {selectedPromptId && (
                <div className="text-sm text-muted-foreground">
                  Analyzing prompt: <code className="bg-muted px-2 py-1 rounded">{selectedPromptId}</code>
                </div>
              )}

              {promptTokensLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading prompt analysis...</span>
                </div>
              ) : promptTokens ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        {Object.keys(promptTokens.agents).map((agentName) => (
                          <TableHead key={agentName} className="text-center">
                            <Badge variant="outline">{agentName}</Badge>
                          </TableHead>
                        ))}
                        <TableHead className="text-center font-bold">
                          <Badge variant="secondary">Total</Badge>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Input Tokens</TableCell>
                        {Object.entries(promptTokens.agents).map(([agentName, data]) => (
                          <TableCell key={`${agentName}-input`} className="font-mono text-center">
                            {data.input_tokens.toLocaleString()}
                          </TableCell>
                        ))}
                        <TableCell className="font-mono font-bold text-center">
                          {promptTokens.summary.total_input_tokens.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Output Tokens</TableCell>
                        {Object.entries(promptTokens.agents).map(([agentName, data]) => (
                          <TableCell key={`${agentName}-output`} className="font-mono text-center">
                            {data.output_tokens.toLocaleString()}
                          </TableCell>
                        ))}
                        <TableCell className="font-mono font-bold text-center">
                          {promptTokens.summary.total_output_tokens.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Total Tokens</TableCell>
                        {Object.entries(promptTokens.agents).map(([agentName, data]) => (
                          <TableCell key={`${agentName}-total`} className="font-mono text-center">
                            {data.total_tokens.toLocaleString()}
                          </TableCell>
                        ))}
                        <TableCell className="font-mono font-bold text-center">
                          {promptTokens.summary.total_tokens.toLocaleString()}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Input Cost ({selectedModel})</TableCell>
                        {Object.entries(promptTokens.agents).map(([agentName, data]) => {
                          const costs = calculateCost(data.input_tokens, data.output_tokens, selectedModel)
                          return (
                            <TableCell key={`${agentName}-input-cost`} className="font-mono text-center text-blue-600">
                              ${costs.inputCost.toFixed(4)}
                            </TableCell>
                          )
                        })}
                        <TableCell className="font-mono font-bold text-center text-blue-600">
                          ${calculateCost(promptTokens.summary.total_input_tokens, promptTokens.summary.total_output_tokens, selectedModel).inputCost.toFixed(4)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Output Cost ({selectedModel})</TableCell>
                        {Object.entries(promptTokens.agents).map(([agentName, data]) => {
                          const costs = calculateCost(data.input_tokens, data.output_tokens, selectedModel)
                          return (
                            <TableCell key={`${agentName}-output-cost`} className="font-mono text-center text-orange-600">
                              ${costs.outputCost.toFixed(4)}
                            </TableCell>
                          )
                        })}
                        <TableCell className="font-mono font-bold text-center text-orange-600">
                          ${calculateCost(promptTokens.summary.total_input_tokens, promptTokens.summary.total_output_tokens, selectedModel).outputCost.toFixed(4)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Total Cost ({selectedModel})</TableCell>
                        {Object.entries(promptTokens.agents).map(([agentName, data]) => {
                          const costs = calculateCost(data.input_tokens, data.output_tokens, selectedModel)
                          return (
                            <TableCell key={`${agentName}-total-cost`} className="font-mono text-center text-green-600 font-bold">
                              ${costs.totalCost.toFixed(4)}
                            </TableCell>
                          )
                        })}
                        <TableCell className="font-mono font-bold text-center text-green-600">
                          ${calculateCost(promptTokens.summary.total_input_tokens, promptTokens.summary.total_output_tokens, selectedModel).totalCost.toFixed(4)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : selectedPromptId ? (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for selected prompt
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a prompt ID to view agent breakdown
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Summary Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Usage Summary
              {statsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {statsError && <span className="text-sm text-red-500 font-normal">({statsError})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading usage statistics...</span>
              </div>
            ) : usageSummaryWithCosts ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Input Tokens</TableHead>
                      <TableHead className="text-right">Output Tokens</TableHead>
                      <TableHead className="text-right">Total Requests</TableHead>
                      <TableHead className="text-right">Input Cost ({selectedModel})</TableHead>
                      <TableHead className="text-right">Output Cost ({selectedModel})</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>

                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Today</TableCell>
                      <TableCell className="font-mono text-right">
                        {usageSummaryWithCosts.today.input_tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-right">
                        {usageSummaryWithCosts.today.output_tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-right">
                        {usageSummaryWithCosts.today.total_requests.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-right text-blue-600">
                        ${usageSummaryWithCosts.today.inputCost.toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono text-right text-orange-600">
                        ${usageSummaryWithCosts.today.outputCost.toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-right text-green-600">
                        ${usageSummaryWithCosts.today.totalCost.toFixed(4)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Last 7 Days</TableCell>
                      <TableCell className="font-mono text-right">
                        {usageSummaryWithCosts.last7Days.input_tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-right">
                        {usageSummaryWithCosts.last7Days.output_tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-right">
                        {usageSummaryWithCosts.last7Days.total_requests.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-right text-blue-600">
                        ${usageSummaryWithCosts.last7Days.inputCost.toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono text-right text-orange-600">
                        ${usageSummaryWithCosts.last7Days.outputCost.toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-right text-green-600">
                        ${usageSummaryWithCosts.last7Days.totalCost.toFixed(4)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Last Month</TableCell>
                      <TableCell className="font-mono text-right">
                        {usageSummaryWithCosts.lastMonth.input_tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-right">
                        {usageSummaryWithCosts.lastMonth.output_tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-right">
                        {usageSummaryWithCosts.lastMonth.total_requests.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-right text-blue-600">
                        ${usageSummaryWithCosts.lastMonth.inputCost.toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono text-right text-orange-600">
                        ${usageSummaryWithCosts.lastMonth.outputCost.toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-right text-green-600">
                        ${usageSummaryWithCosts.lastMonth.totalCost.toFixed(4)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Lifetime</TableCell>
                      <TableCell className="font-mono text-right">
                        {usageSummaryWithCosts.lifetime.input_tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-right">
                        {usageSummaryWithCosts.lifetime.output_tokens.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-right">
                        {usageSummaryWithCosts.lifetime.total_requests.toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono text-right text-blue-600">
                        ${usageSummaryWithCosts.lifetime.inputCost.toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono text-right text-orange-600">
                        ${usageSummaryWithCosts.lifetime.outputCost.toFixed(4)}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-right text-green-600">
                        ${usageSummaryWithCosts.lifetime.totalCost.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No usage statistics available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detailed Usage Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Detailed Token Usage & Cost Analysis
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {error && <span className="text-sm text-red-500 font-normal">({error})</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading agent data...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent Name</TableHead>
                      <TableHead>Prompt (Input Data)</TableHead>
                      <TableHead className="text-right">Input Tokens</TableHead>
                      <TableHead className="text-right">Output Tokens</TableHead>
                      <TableHead className="text-right">Total Tokens</TableHead>
                      <TableHead>Original Model</TableHead>
                      <TableHead className="text-right">Input Cost ({selectedModel})</TableHead>
                      <TableHead className="text-right">Output Cost ({selectedModel})</TableHead>
                      <TableHead className="text-right">Total Cost ({selectedModel})</TableHead>
                      <TableHead className="text-right">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayData?.map((log) => {
                      const costs = calculateCost(log.input_tokens || 0, log.output_tokens || 0, selectedModel)
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">{log.agent_name || 'N/A'}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="flex items-center gap-2">
                              <div className="truncate text-sm text-muted-foreground flex-1" title={log.input_data || 'No prompt available'}>
                                {log.input_data ? `${log.input_data.substring(0, 50)}...` : 'No prompt available'}
                              </div>
                              {log.input_data && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="min-w-6xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Full Prompt - {log.agent_name}</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4">
                                      <div className="bg-muted p-4 rounded-lg">
                                        <pre className="whitespace-pre-wrap text-sm font-mono break-words">
                                          {log.input_data}
                                        </pre>
                                      </div>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {(log.input_tokens || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono text-right">
                            {(log.output_tokens || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="font-mono font-medium text-right">
                            {((log.input_tokens || 0) + (log.output_tokens || 0)).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{log.original_model || 'Unknown'}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-right text-blue-600">
                            ${costs.inputCost.toFixed(4)}
                          </TableCell>
                          <TableCell className="font-mono text-right text-orange-600">
                            ${costs.outputCost.toFixed(4)}
                          </TableCell>
                          <TableCell className="font-mono font-bold text-right text-green-600">
                            ${costs.totalCost.toFixed(4)}
                          </TableCell>
                          <TableCell className="">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      )
                    }) || (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Input Tokens</p>
                <p className="text-2xl font-bold">
                  {displayData.reduce((sum, log) => sum + (log.input_tokens || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Total Output Tokens</p>
                <p className="text-2xl font-bold">
                  {displayData.reduce((sum, log) => sum + (log.output_tokens || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Average Cost per Request</p>
                <p className="text-2xl font-bold text-green-600">
                  ${displayData.length > 0 ? (totalCost / displayData.length).toFixed(4) : '0.0000'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}