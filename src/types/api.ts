// API & connectivity types (ISP domain)

export interface Customer {
  id: number
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  postal_code?: string
  country?: string
  plan_id?: number
  radius_username?: string
  radius_password?: string
  status: CustomerStatus
  connection_status?: ConnectionStatus
  last_login?: string
  data_usage?: DataUsage
  billing_address?: BillingAddress
  notes?: string
  created_at: string
  updated_at: string
}

export type CustomerStatus = 'active' | 'inactive' | 'suspended' | 'pending'
export type ConnectionStatus = 'online' | 'offline' | 'limited' | 'blocked'

export interface DataUsage {
  current_month_mb: number
  last_month_mb: number
  total_mb: number
  last_updated: string
}

export interface BillingAddress {
  street: string
  city: string
  postal_code: string
  country: string
}

export interface Plan {
  id: number
  name: string
  description?: string
  price: number
  currency: string
  bandwidth_up: number
  bandwidth_down: number
  data_limit?: number
  duration_days?: number
  radius_group?: string
  status: PlanStatus
  plan_type: PlanType
  features?: PlanFeature[]
  priority?: number
  burst_limit_up?: number
  burst_limit_down?: number
  created_at: string
  updated_at: string
}

export type PlanStatus = 'active' | 'inactive' | 'deprecated'
export type PlanType = 'residential' | 'business' | 'premium' | 'trial'

export interface PlanFeature {
  name: string
  description?: string
  enabled: boolean
}

export interface CustomerPlan {
  id: number
  customer_id: number
  plan_id: number
  start_date: string
  end_date?: string
  price: number
  currency: string
  status: CustomerPlanStatus
  auto_renew: boolean
  payment_method?: PaymentMethod
  discount_percentage?: number
  promo_code?: string
  installation_date?: string
  cancellation_reason?: string
  notes?: string
  created_at: string
  updated_at: string
  customer?: Customer
  plan?: Plan
}

export type CustomerPlanStatus = 'active' | 'expired' | 'suspended' | 'pending' | 'cancelled'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'credit_card' | 'paypal' | 'crypto'
