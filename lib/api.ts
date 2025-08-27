import axios from 'axios'
import type { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://python-ai-agent.yameenyousuf.com'
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://128.199.30.51:8002'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export default apiClient