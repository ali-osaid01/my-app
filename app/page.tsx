"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DollarSign, Loader2 } from "lucide-react"
import agentService, { AgentApiResponse } from "@/lib/agentService"

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

export default function TokenCostTable() {
  const [selectedModel, setSelectedModel] = useState<string>("Gemini 2.5 Flash")
  const [agentData, setAgentData] = useState<AgentApiResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAgentData = async () => {
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

    fetchAgentData()
  }, [])

  // Fixed calculation: divide by 1000 since pricing is per 1K tokens
  const calculateCost = (inputTokens: number, outputTokens: number, model: string) => {
    const pricing = modelPricing[model as keyof typeof modelPricing]
    if (!pricing) {
      console.warn(`No pricing found for model: ${model}`)
      return 0
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
    
    return totalCost
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
      return sum + calculateCost(inputTokens, outputTokens, selectedModel)
    }, 0)
  }, [selectedModel, displayData])

  // Get pricing info for selected model
  const selectedModelPricing = modelPricing[selectedModel as keyof typeof modelPricing]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Token Cost Calculator</h1>
            <p className="text-muted-foreground">Calculate costs for different AI models</p>
          </div>
        </div>

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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Token Usage & Cost Analysis
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
                      <TableHead className="text-right">Input Tokens</TableHead>
                      <TableHead className="text-right">Output Tokens</TableHead>
                      <TableHead className="text-right">Total Tokens</TableHead>
                      <TableHead>Original Model</TableHead>
                      <TableHead className="text-right">Cost ({selectedModel})</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayData?.map((log) => {
                      const cost = calculateCost(log.input_tokens || 0, log.output_tokens || 0, selectedModel)
                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <Badge variant="outline">{log.agent_name || 'N/A'}</Badge>
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
                          <TableCell className="font-mono font-bold text-right text-green-600" title={`Input: ${((log.input_tokens || 0) / 1000 * (selectedModelPricing?.input || 0)).toFixed(4)} + Output: ${((log.output_tokens || 0) / 1000 * (selectedModelPricing?.output || 0)).toFixed(4)}`}>
                            ${cost.toFixed(4)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      )
                    }) || (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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