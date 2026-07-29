import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const API = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

API.interceptors.request.use((config) => {
  const userId = localStorage.getItem('userId') || 'default';
  config.headers['X-User-Id'] = userId;
  return config;
})

// ── Category Classifier ───────────────────────────────────────────────────────
export const predictTransaction = (text) =>
  API.post('/predict', { text }).then(r => r.data)

// ── Transactions ──────────────────────────────────────────────────────────────
export const addTransaction = (data) =>
  API.post('/transaction/add', data).then(r => r.data)

export const getTransactions = (limit = 50, offset = 0) =>
  API.get('/transactions', { params: { limit, offset } }).then(r => r.data)

export const getTransaction = (id) =>
  API.get(`/transaction/${id}`).then(r => r.data)

export const updateTransaction = (id, category) =>
  API.put(`/transaction/${id}`, { category }).then(r => r.data)

export const deleteTransaction = (id) =>
  API.delete(`/transaction/${id}`).then(r => r.data)

// ── Summary & Income Check ────────────────────────────────────────────────────
export const getSummary = () =>
  API.get('/summary').then(r => r.data)

export const checkHasIncome = () =>
  API.get('/has-income').then(r => r.data)

// ── Health Check ──────────────────────────────────────────────────────────────
export const healthCheck = () =>
  API.get('/').then(r => r.data)
