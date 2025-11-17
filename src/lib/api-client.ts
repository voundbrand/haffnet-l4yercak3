/**
 * API Client for L4yerCak3 Backend
 *
 * Handles all API requests to the L4yerCak3 backend with proper
 * authentication and error handling.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

if (!API_URL || !API_KEY) {
  throw new Error('Missing API configuration. Check .env.local file.');
}

/**
 * Base fetch wrapper with authentication
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  // Debug logging for client-side
  if (typeof window !== 'undefined') {
    console.log('Client-side API request:', {
      endpoint,
      url,
      hasApiUrl: !!API_URL,
      hasApiKey: !!API_KEY,
    });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      if (isJson) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API Error: ${response.status}`);
      } else {
        // Get text for debugging
        const errorText = await response.text();
        console.error('API Error Response (non-JSON):', errorText.substring(0, 500));
        throw new Error(`API Error: ${response.status} - ${response.statusText}`);
      }
    }

    if (!isJson) {
      const text = await response.text();
      console.error('Expected JSON but got:', text.substring(0, 500));
      throw new Error('API returned non-JSON response');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Failed:', {
      url,
      method: options.method || 'GET',
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
}

/**
 * Event API
 */
export const eventApi = {
  /**
   * Get all published events
   */
  async getEvents(params?: {
    subtype?: string;
    status?: string;
    upcoming?: boolean;
    startDate?: number;
    endDate?: number;
    limit?: number;
    offset?: number;
  }) {
    const queryParams = new URLSearchParams();

    if (params?.subtype) queryParams.set('subtype', params.subtype);
    if (params?.status) queryParams.set('status', params.status);

    // If upcoming=true, filter events starting after now
    if (params?.upcoming) {
      queryParams.set('startDate', String(Date.now()));
    }

    // Allow manual startDate/endDate overrides
    if (params?.startDate) queryParams.set('startDate', String(params.startDate));
    if (params?.endDate) queryParams.set('endDate', String(params.endDate));

    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.offset) queryParams.set('offset', String(params.offset));

    const query = queryParams.toString();
    const endpoint = `/events${query ? `?${query}` : ''}`;

    // API returns { events: Event[], total: number }
    return apiFetch<{
      events: Event[];
      total: number;
    }>(endpoint);
  },

  /**
   * Get single event by ID
   */
  async getEvent(eventId: string) {
    // API returns the event object directly
    return apiFetch<Event>(`/events/${eventId}`);
  },

  /**
   * Get products (registration categories) for an event
   */
  async getEventProducts(eventId: string) {
    // API returns { products: Product[], count: number }
    return apiFetch<{
      products: Product[];
      count: number;
    }>(`/events/${eventId}/products`);
  },
};

/**
 * Form API
 */
export const formApi = {
  /**
   * Get published form by ID (public endpoint)
   */
  async getPublicForm(formId: string) {
    return apiFetch<{
      status: string;
      data: Form;
    }>(`/forms/public/${formId}`);
  },
};

/**
 * Workflow API
 */
export const workflowApi = {
  /**
   * Trigger event registration workflow (v2.0)
   *
   * Uses /workflows/trigger endpoint which supports Bearer token authentication.
   * Payload format is v2.0 compliant (formId, products array, etc.)
   */
  async submitRegistration(data: RegistrationInput) {
    return apiFetch<RegistrationResponse>('/workflows/trigger', {
      method: 'POST',
      body: JSON.stringify({
        trigger: 'event_registration_complete',
        inputData: data,
      }),
    });
  },
};

/**
 * Ticket API
 */
export const ticketApi = {
  /**
   * Get ticket details by ID
   */
  async getTicket(ticketId: string) {
    return apiFetch<{
      status: string;
      data: Ticket;
    }>(`/tickets/${ticketId}`);
  },

  /**
   * Verify ticket QR code (public endpoint)
   */
  async verifyTicket(ticketId: string) {
    return apiFetch<{
      status: string;
      data: {
        valid: boolean;
        ticketNumber: string;
        holderName: string;
        eventName: string;
        category: string;
        checkedIn: boolean;
        checkedInAt: number | null;
        warning?: string;
      };
    }>(`/tickets/${ticketId}/verify`);
  },
};

/**
 * Transaction API
 */
export const transactionApi = {
  /**
   * Get transaction details by ID
   */
  async getTransaction(transactionId: string) {
    return apiFetch<{
      status: string;
      data: Transaction;
    }>(`/transactions/${transactionId}`);
  },

  /**
   * Get ticket by transaction ID
   */
  async getTicketByTransaction(transactionId: string) {
    return apiFetch<{
      status: string;
      data: Ticket;
    }>(`/transactions/${transactionId}/ticket`);
  },
};

/**
 * TypeScript Types
 */

export interface Event {
  id: string;
  name: string;
  description?: string;
  subtype: string;
  status: string;

  // Top-level properties from flattened API response
  startDate?: number;
  endDate?: number;
  location?: string;
  capacity?: number; // Max capacity from backend
  registrations?: number; // Current registrations count
  agenda?: any[];

  // Legacy support for customProperties (may not exist in API response)
  customProperties?: {
    startDate?: number;
    endDate?: number;
    location?: string;
    venue?: string;
    timezone?: string;
    maxCapacity?: number;
    currentRegistrations?: number;
    spotsRemaining?: number;
    capacity?: number;
    address?: {
      street: string;
      city: string;
      postalCode: string;
      country: string;
    };
    registration?: {
      enabled: boolean;
      openDate: number;
      closeDate: number;
      isOpen?: boolean;
    };
    agenda?: any;
    metadata?: any;
  };

  createdAt?: number;
  updatedAt?: number;

  // Deprecated - use top-level fields instead
  maxCapacity?: number;
  currentRegistrations?: number;
  registrationOpen?: boolean;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  type: string;
  subtype: string;
  status: string;
  customProperties: {
    price: number;
    currency: string;
    sold: number;
    categoryCode: string;
    categoryLabel: string;
    invoiceConfig?: {
      employerSourceField: string;
      employerMapping: Record<string, string>;
      defaultPaymentTerms: string;
    };
    addons: Array<{
      id: string;
      name: string;
      description?: string;
      pricePerUnit: number;
      currency?: string;
      maxQuantity?: number;
      available?: boolean;
      displayInCart?: boolean;
      icon?: string;
      formFieldMapping?: Record<string, any>;
      taxable?: boolean;
    }>;
  };
}

export interface Form {
  _id: string;
  type: 'form';
  subtype: string;
  name: string;
  description: string;
  status: string;
  customProperties: {
    eventId: string;
    formSchema: {
      version: string;
      fields: FormField[];
      settings: {
        allowMultipleSubmissions: boolean;
        showProgressBar: boolean;
        submitButtonText: string;
        successMessage: string;
        redirectUrl: string | null;
      };
    };
  };
}

export interface FormField {
  id: string;
  type: string;
  label: string;
  required: boolean;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  conditionalLogic?: {
    show: {
      field: string;
      operator: string;
      value: string[];
    };
  };
}

export interface RegistrationInput {
  eventId: string;
  eventType?: string;

  // NEW v2.0: Form ID now required
  formId: string;

  // CHANGED v2.0: Products array instead of single productId
  products: Array<{
    productId: string;
    quantity: number;
  }>;

  customerData: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    salutation: string;
    title?: string;
    organization?: string;
  };

  formResponses: {
    attendee_category: string;

    // Personal info (Phase 1)
    salutation: string;
    title?: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    profession?: string;
    organization?: string;
    position?: string;
    department?: string;

    // Address
    street?: string;
    city?: string;
    postal_code?: string;
    country?: string;

    // Event logistics (Phase 2)
    arrival_time?: string;
    activity_day2?: string;
    bbq_attendance?: boolean;
    accommodation_needs?: string;
    special_requests?: string;
    support_activities?: string[]; // Only for Orga category

    // Requirements
    dietary_requirements?: string;
    accessibility_needs?: string;

    // Billing (structured fields for CRM integration)
    billing_street?: string;
    billing_city?: string;
    billing_postal_code?: string;
    billing_country?: string;

    // Add-ons
    ucra_participants?: number;

    // Comments & Consent
    comments?: string;
    consent_privacy: boolean;
    consent_photos?: boolean;
    newsletter_signup?: boolean;
  };

  transactionData: {
    currency: string;
    breakdown: {
      basePrice: number;
      addons?: Array<{
        id: string;
        name: string;
        quantity: number;
        pricePerUnit: number;
        total: number;
      }>;
      subtotal: number;
      tax?: number;
      total: number;
    };
  };

  // NEW v2.0: Optional CRM organization ID override
  crmOrganizationId?: string;

  paymentMethod?: {
    type: 'stripe' | 'paypal' | 'invoice';
    paymentIntentId?: string;
    paypalOrderId?: string;
    invoiceDetails?: {
      billingEmail: string;
      billingName: string;
      billingAddress: object;
    };
  };

  metadata?: {
    source: string;
    ipAddress?: string;
    userAgent?: string;
    referrer?: string;
    sessionId?: string;
  };
}

export interface RegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    contactId: string;
    ticketId: string;
    ticketNumber: string;
    qrCode: string;
    transactionId: string;
    invoiceId?: string;
    invoiceNumber?: string;
    billingMethod: 'employer_invoice' | 'customer_payment' | 'free';
    confirmationEmailSent: boolean;
    // Legacy fields for backward compatibility
    eventId?: string;
    eventName?: string;
    confirmationUrl?: string;
  };
  error?: string;
  code?: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

export interface Ticket {
  _id: string;
  type: 'ticket';
  subtype: string;
  name: string;
  status: string;
  customProperties: {
    productId: string;
    holderName: string;
    holderEmail: string;
    holderPhone?: string;
    eventId: string;
    eventName: string;
    eventDate: number;
    category: string;
    categoryLabel: string;
    addons: {
      ucraBoatTrip?: {
        selected: boolean;
        participants: number;
      };
    };
    registrationData: Record<string, any>;
    ticketNumber: string;
    qrCode: string;
    purchaseDate: number;
    pricePaid: number;
    currency: string;
    billingMethod: string;
    transactionId?: string;
    // Logistics fields
    salutation?: string;
    title?: string;
    profession?: string;
    arrivalTime?: string;
    activityDay2?: string;
    bbqAttendance?: boolean;
    accommodationNeeds?: string;
    ucraParticipants?: number;
    dietaryRequirements?: string;
    specialRequests?: string;
    billingAddress?: string;
  };
}

export interface Transaction {
  _id: string;
  type: 'transaction';
  subtype: string;
  name: string;
  status: string;
  customProperties: {
    // Product context
    productId: string;
    productName: string;
    productDescription: string;
    productSubtype: string;

    // Event context
    eventId: string;
    eventName: string;
    eventLocation: string;
    eventStartDate: number;
    eventEndDate: number;

    // Links
    ticketId?: string;
    checkoutSessionId?: string;

    // Customer (ticket holder)
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerId: string;

    // Payer (who pays - may differ in B2B)
    payerType: 'individual' | 'organization';
    payerId: string;
    crmOrganizationId?: string;
    employerId?: string;
    employerName?: string;

    // Financial
    amountInCents: number;
    currency: string;
    quantity: number;
    taxRatePercent: number;

    // Payment
    paymentMethod: string;
    paymentStatus: string;
    paymentIntentId?: string;

    // Metadata
    purchaseDate: number;
  };
}

/**
 * Error Types
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public errors?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
