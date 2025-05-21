import { StrictMode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
  <StrictMode>
  
  <QueryClientProvider client = {queryClient}>
    
  <AuthProvider>
    <App/>
    </AuthProvider>
  </QueryClientProvider>  
  
  </StrictMode>
</BrowserRouter>,
)
