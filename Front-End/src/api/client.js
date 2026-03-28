import axios from 'axios'

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
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
