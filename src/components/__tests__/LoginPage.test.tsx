import { describe, it, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import LoginPage from '@/components/LoginPage'
import { AuthProvider } from '@/contexts/AuthContext'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TooltipProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

// Mock du hook useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    login: vi.fn().mockReturnValue(true),
    logout: vi.fn(),
    user: null,
    isAuthenticated: false,
  }),
}))

describe('LoginPage', () => {
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(ui, { wrapper: TestWrapper })
  }

  it('renders login form correctly', () => {
    renderWithProviders(<LoginPage />)
    
    expect(screen.getByText('Connexion')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /se connecter/i })).toBeInTheDocument()
  })

  it('allows user to type in email field', async () => {
    const user = userEvent.setup()
    renderWithProviders(<LoginPage />)
    
    const emailInput = screen.getByRole('textbox', { name: /email/i })
    
    await user.type(emailInput, 'test@example.com')
    
    expect(emailInput).toHaveValue('test@example.com')
  })

  it('displays demonstration buttons for different user roles', () => {
    renderWithProviders(<LoginPage />)
    
    expect(screen.getByText('Employé')).toBeInTheDocument()
    expect(screen.getByText('Chef de cellule')).toBeInTheDocument()
    expect(screen.getByText('Chef de service')).toBeInTheDocument()
    expect(screen.getByText('RH')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })
})