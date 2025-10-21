/**
 * Payment Method Validation Utilities
 * Industry-standard validation for various payment methods
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate email format (RFC 5322 compliant)
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' }
  }

  // RFC 5322 compliant email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' }
  }

  // Additional checks
  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long (max 254 characters)' }
  }

  const [localPart, domain] = email.split('@')
  if (localPart.length > 64) {
    return { isValid: false, error: 'Email local part is too long (max 64 characters)' }
  }

  return { isValid: true }
}

/**
 * Validate US bank routing number (ABA routing number)
 * Uses the ABA checksum algorithm
 */
export function validateRoutingNumber(routingNumber: string): ValidationResult {
  if (!routingNumber) {
    return { isValid: false, error: 'Routing number is required' }
  }

  // Remove any spaces or dashes
  const cleaned = routingNumber.replace(/[\s-]/g, '')

  // Must be exactly 9 digits
  if (!/^\d{9}$/.test(cleaned)) {
    return { isValid: false, error: 'Routing number must be exactly 9 digits' }
  }

  // ABA checksum validation
  const digits = cleaned.split('').map(Number)
  const checksum = (
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    (digits[2] + digits[5] + digits[8])
  ) % 10

  if (checksum !== 0) {
    return { isValid: false, error: 'Invalid routing number (failed checksum)' }
  }

  // First two digits should be 01-12, 21-32, 61-72, or 80
  const firstTwo = parseInt(cleaned.substring(0, 2))
  const validRanges = [
    [1, 12],   // Federal Reserve banks
    [21, 32],  // Thrift institutions
    [61, 72],  // Electronic transactions
    [80, 80]   // Traveler's checks
  ]

  const isValidRange = validRanges.some(([min, max]) => firstTwo >= min && firstTwo <= max)
  if (!isValidRange) {
    return { isValid: false, error: 'Invalid routing number (invalid bank code)' }
  }

  return { isValid: true }
}

/**
 * Validate bank account number
 * US bank accounts are typically 4-17 digits
 */
export function validateBankAccountNumber(accountNumber: string): ValidationResult {
  if (!accountNumber) {
    return { isValid: false, error: 'Account number is required' }
  }

  // Remove any spaces or dashes
  const cleaned = accountNumber.replace(/[\s-]/g, '')

  // Must be 4-17 digits (standard for US banks)
  if (!/^\d{4,17}$/.test(cleaned)) {
    return { isValid: false, error: 'Account number must be 4-17 digits' }
  }

  return { isValid: true }
}

/**
 * Validate account holder name
 */
export function validateAccountHolderName(name: string): ValidationResult {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Account holder name is required' }
  }

  const trimmed = name.trim()

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' }
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Name must be less than 100 characters' }
  }

  // Allow letters, spaces, hyphens, apostrophes, and periods
  if (!/^[a-zA-Z\s\-'.]+$/.test(trimmed)) {
    return { isValid: false, error: 'Name contains invalid characters' }
  }

  return { isValid: true }
}

/**
 * Validate bank name
 */
export function validateBankName(bankName: string): ValidationResult {
  if (!bankName || bankName.trim() === '') {
    return { isValid: false, error: 'Bank name is required' }
  }

  const trimmed = bankName.trim()

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Bank name must be at least 2 characters' }
  }

  if (trimmed.length > 100) {
    return { isValid: false, error: 'Bank name must be less than 100 characters' }
  }

  return { isValid: true }
}

/**
 * Validate Stripe Connect account ID
 * Format: acct_XXXXXXXXXXXXXXXXXXXX (minimum 20 characters after acct_)
 */
export function validateStripeAccountId(accountId: string): ValidationResult {
  if (!accountId || accountId.trim() === '') {
    return { isValid: false, error: 'Stripe account ID is required' }
  }

  const trimmed = accountId.trim()

  // Must start with "acct_"
  if (!trimmed.startsWith('acct_')) {
    return { isValid: false, error: 'Stripe account ID must start with "acct_"' }
  }

  // Must be at least 25 characters total (acct_ + 20 chars)
  if (trimmed.length < 25) {
    return { isValid: false, error: 'Invalid Stripe account ID format' }
  }

  // Should only contain alphanumeric characters after "acct_"
  const idPart = trimmed.substring(5)
  if (!/^[a-zA-Z0-9]+$/.test(idPart)) {
    return { isValid: false, error: 'Stripe account ID contains invalid characters' }
  }

  return { isValid: true }
}

/**
 * Validate PayPal email
 * PayPal uses standard email validation
 */
export function validatePayPalEmail(email: string): ValidationResult {
  const emailValidation = validateEmail(email)
  
  if (!emailValidation.isValid) {
    return emailValidation
  }

  // Additional PayPal-specific checks
  const domain = email.split('@')[1]?.toLowerCase()
  
  // Warn if using suspicious domains (these are still valid, just a warning)
  const suspiciousDomains = ['tempmail.com', 'guerrillamail.com', 'mailinator.com']
  if (suspiciousDomains.includes(domain)) {
    // Still valid, but could add a warning in the UI
    console.warn('PayPal email uses temporary email service')
  }

  return { isValid: true }
}

/**
 * Validate Wise (formerly TransferWise) email
 */
export function validateWiseEmail(email: string): ValidationResult {
  return validateEmail(email)
}

/**
 * Comprehensive payout method validation
 */
export interface PayoutMethodValidation {
  isValid: boolean
  errors: Record<string, string>
}

export function validatePayoutMethod(
  type: string,
  details: Record<string, any>
): PayoutMethodValidation {
  const errors: Record<string, string> = {}

  switch (type) {
    case 'paypal': {
      const emailValidation = validatePayPalEmail(details.email)
      if (!emailValidation.isValid) {
        errors.email = emailValidation.error || 'Invalid email'
      }
      break
    }

    case 'bank_transfer': {
      const nameValidation = validateAccountHolderName(details.account_holder_name)
      if (!nameValidation.isValid) {
        errors.account_holder_name = nameValidation.error || 'Invalid account holder name'
      }

      const accountValidation = validateBankAccountNumber(details.account_number)
      if (!accountValidation.isValid) {
        errors.account_number = accountValidation.error || 'Invalid account number'
      }

      const routingValidation = validateRoutingNumber(details.routing_number)
      if (!routingValidation.isValid) {
        errors.routing_number = routingValidation.error || 'Invalid routing number'
      }

      const bankNameValidation = validateBankName(details.bank_name)
      if (!bankNameValidation.isValid) {
        errors.bank_name = bankNameValidation.error || 'Invalid bank name'
      }
      break
    }

    case 'stripe': {
      const stripeValidation = validateStripeAccountId(details.account_id)
      if (!stripeValidation.isValid) {
        errors.account_id = stripeValidation.error || 'Invalid Stripe account ID'
      }
      break
    }

    case 'wise': {
      const wiseValidation = validateWiseEmail(details.email)
      if (!wiseValidation.isValid) {
        errors.email = wiseValidation.error || 'Invalid email'
      }
      break
    }

    default:
      errors.type = 'Invalid payout method type'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

/**
 * Sanitize sensitive payout details for display
 */
export function sanitizePayoutDetails(type: string, details: Record<string, any>): Record<string, any> {
  const sanitized = { ...details }

  switch (type) {
    case 'paypal':
    case 'wise':
      if (sanitized.email) {
        const [local, domain] = sanitized.email.split('@')
        if (local && domain) {
          const visibleChars = Math.min(2, local.length)
          sanitized.email = `${local.substring(0, visibleChars)}${'*'.repeat(Math.max(0, local.length - visibleChars))}@${domain}`
        }
      }
      break

    case 'bank_transfer':
      if (sanitized.account_number) {
        const num = sanitized.account_number.replace(/[\s-]/g, '')
        sanitized.account_number = `****${num.slice(-4)}`
      }
      if (sanitized.routing_number) {
        const routing = sanitized.routing_number.replace(/[\s-]/g, '')
        sanitized.routing_number = `****${routing.slice(-4)}`
      }
      break

    case 'stripe':
      if (sanitized.account_id) {
        const id = sanitized.account_id
        sanitized.account_id = `${id.substring(0, 10)}****${id.slice(-4)}`
      }
      break
  }

  return sanitized
}
