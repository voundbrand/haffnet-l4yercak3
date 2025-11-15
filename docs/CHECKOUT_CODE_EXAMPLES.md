# Checkout Integration - Code Examples

## Universal Checkout Client (Use Anywhere)

This client works for **any frontend** - web, iOS, Android, etc.

### TypeScript/JavaScript Client

```typescript
// /src/lib/checkout-client.ts

export interface CheckoutPayload {
  trigger: string;
  inputData: {
    eventType: string;
    source: string;
    customerData?: {
      email: string;
      firstName: string;
      lastName: string;
      phone?: string;
      organization?: string;
      title?: string;
    };
    formResponses?: Record<string, any>;
    transactionData?: {
      productId: string;
      productName: string;
      price: number;
      currency: string;
      quantity?: number;
      addons?: Array<{
        id: string;
        name: string;
        price: number;
      }>;
    };
    metadata?: Record<string, any>;
  };
}

export interface CheckoutResult {
  success: boolean;
  transactionId: string;
  ticketId?: string;
  invoiceId?: string;
  contactId?: string;
  workflowId: string;
  behaviorResults: Array<{
    behaviorType: string;
    success: boolean;
    message?: string;
    data?: any;
  }>;
  message: string;
}

export class CheckoutClient {
  private apiBaseUrl: string;
  private apiKey: string;

  constructor(apiBaseUrl: string, apiKey: string) {
    this.apiBaseUrl = apiBaseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Trigger a checkout workflow
   */
  async triggerCheckout(payload: CheckoutPayload): Promise<CheckoutResult> {
    const response = await fetch(`${this.apiBaseUrl}/api/v1/workflows/trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Checkout failed: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Helper: Should skip payment step?
   */
  shouldSkipPayment(result: CheckoutResult): boolean {
    return result.behaviorResults.some(b =>
      b.data?.skipPaymentStep === true ||
      b.data?.actions?.some((a: any) => a.type === 'skip_payment_step')
    );
  }

  /**
   * Helper: Get payment provider
   */
  getPaymentProvider(result: CheckoutResult): string | null {
    const providerResult = result.behaviorResults.find(b =>
      b.behaviorType === 'payment-provider-selection'
    );
    return providerResult?.data?.provider || null;
  }

  /**
   * Helper: Get invoice URL
   */
  getInvoiceUrl(result: CheckoutResult): string | null {
    const invoiceResult = result.behaviorResults.find(b =>
      b.behaviorType === 'consolidated-invoice-generation'
    );
    return invoiceResult?.data?.pdfUrl || null;
  }

  /**
   * Helper: Get ticket IDs
   */
  getTicketIds(result: CheckoutResult): string[] {
    const ticketResult = result.behaviorResults.find(b =>
      b.behaviorType === 'ticket-generation'
    );
    return ticketResult?.data?.ticketIds || [];
  }
}

// Export singleton instance
export const checkoutClient = new CheckoutClient(
  process.env.NEXT_PUBLIC_API_URL || 'https://api.l4yercak3.com',
  process.env.NEXT_PUBLIC_API_KEY || ''
);
```

---

## React/Next.js Example (HaffNet)

### Basic Checkout Component

```typescript
// /src/components/checkout/SeminarCheckout.tsx
'use client';

import { useState } from 'react';
import { checkoutClient, CheckoutPayload } from '@/lib/checkout-client';

interface SeminarCheckoutProps {
  seminarId: string;
  seminarName: string;
  price: number;
}

type CheckoutStep = 'customer-info' | 'payment' | 'confirmation';

export function SeminarCheckout({ seminarId, seminarName, price }: SeminarCheckoutProps) {
  const [step, setStep] = useState<CheckoutStep>('customer-info');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  const handleCustomerInfoSubmit = async (data: {
    email: string;
    firstName: string;
    lastName: string;
    title?: string;
    organization?: string;
    phone?: string;
    specialty?: string;
    licenseNumber?: string;
  }) => {
    setLoading(true);
    setError(null);

    try {
      const payload: CheckoutPayload = {
        trigger: 'checkout_complete',
        inputData: {
          eventType: 'seminar_registration',
          source: 'haffnet_website',
          customerData: {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            title: data.title,
            organization: data.organization,
            phone: data.phone
          },
          formResponses: {
            specialty: data.specialty,
            licenseNumber: data.licenseNumber
          },
          transactionData: {
            productId: seminarId,
            productName: seminarName,
            price: price,
            currency: 'EUR',
            quantity: 1
          },
          metadata: {
            source: 'web',
            userAgent: navigator.userAgent,
            registeredAt: new Date().toISOString()
          }
        }
      };

      const result = await checkoutClient.triggerCheckout(payload);
      setCheckoutResult(result);

      // Check if backend says to skip payment
      if (checkoutClient.shouldSkipPayment(result)) {
        // Employer billing - skip to confirmation
        setStep('confirmation');
      } else {
        // Regular checkout - show payment
        setStep('payment');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentComplete = () => {
    setStep('confirmation');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className={step === 'customer-info' ? 'font-bold' : 'text-gray-500'}>
            1. Information
          </span>
          <span className={step === 'payment' ? 'font-bold' : 'text-gray-500'}>
            2. Payment
          </span>
          <span className={step === 'confirmation' ? 'font-bold' : 'text-gray-500'}>
            3. Confirmation
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className="h-2 bg-blue-600 rounded-full transition-all"
            style={{
              width: step === 'customer-info' ? '33%' :
                     step === 'payment' ? '66%' : '100%'
            }}
          />
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Steps */}
      {step === 'customer-info' && (
        <CustomerInfoForm
          onSubmit={handleCustomerInfoSubmit}
          loading={loading}
        />
      )}

      {step === 'payment' && (
        <PaymentStep
          amount={price}
          provider={checkoutResult ? checkoutClient.getPaymentProvider(checkoutResult) : 'stripe'}
          onComplete={handlePaymentComplete}
        />
      )}

      {step === 'confirmation' && (
        <ConfirmationStep
          result={checkoutResult}
          invoiceUrl={checkoutResult ? checkoutClient.getInvoiceUrl(checkoutResult) : null}
        />
      )}
    </div>
  );
}
```

### Customer Info Form

```typescript
// /src/components/checkout/CustomerInfoForm.tsx
'use client';

import { useState } from 'react';

interface CustomerInfoFormProps {
  onSubmit: (data: any) => void;
  loading?: boolean;
}

export function CustomerInfoForm({ onSubmit, loading }: CustomerInfoFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    title: '',
    organization: '',
    phone: '',
    specialty: '',
    licenseNumber: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Vorname *
          </label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Nachname *
          </label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Email *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="dr.mueller@charite.de"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Organisation
        </label>
        <input
          type="text"
          value={formData.organization}
          onChange={e => setFormData({ ...formData, organization: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
          placeholder="Charité Berlin"
        />
        <p className="text-sm text-gray-500 mt-1">
          Bei Arbeitgebern wie Charité erfolgt die Rechnung direkt an die Organisation
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Fachrichtung
        </label>
        <select
          value={formData.specialty}
          onChange={e => setFormData({ ...formData, specialty: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        >
          <option value="">Bitte wählen</option>
          <option value="Kardiologie">Kardiologie</option>
          <option value="Neurologie">Neurologie</option>
          <option value="Orthopädie">Orthopädie</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Approbationsnummer
        </label>
        <input
          type="text"
          value={formData.licenseNumber}
          onChange={e => setFormData({ ...formData, licenseNumber: e.target.value })}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Wird verarbeitet...' : 'Weiter'}
      </button>
    </form>
  );
}
```

### Confirmation Step

```typescript
// /src/components/checkout/ConfirmationStep.tsx

interface ConfirmationStepProps {
  result: any;
  invoiceUrl: string | null;
}

export function ConfirmationStep({ result, invoiceUrl }: ConfirmationStepProps) {
  const isEmployerBilling = result.behaviorResults.some(
    (b: any) => b.behaviorType === 'employer-detection' && b.data?.employerDetected
  );

  return (
    <div className="text-center space-y-6">
      <div className="text-6xl">✅</div>

      <h2 className="text-3xl font-bold">Anmeldung erfolgreich!</h2>

      {isEmployerBilling ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-lg font-medium mb-2">Arbeitgeberrechnung</p>
          <p className="text-gray-700">
            Die Rechnung wurde an Ihre Organisation gesendet.
            <br />
            Keine Zahlung erforderlich.
          </p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <p className="text-lg font-medium mb-2">Zahlung erfolgreich</p>
          <p className="text-gray-700">
            Ihre Zahlung wurde verarbeitet.
          </p>
        </div>
      )}

      <div className="space-y-3">
        <p className="text-gray-600">
          Transaktions-ID: <strong>{result.transactionId}</strong>
        </p>

        {invoiceUrl && (
          <a
            href={invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gray-100 px-6 py-2 rounded-lg hover:bg-gray-200"
          >
            📄 Rechnung herunterladen
          </a>
        )}

        <p className="text-sm text-gray-500">
          Eine Bestätigungs-E-Mail wurde an {result.behaviorResults.find((b: any) =>
            b.behaviorType === 'email-notification'
          )?.data?.emailsSent?.[0]} gesendet.
        </p>
      </div>
    </div>
  );
}
```

---

## React Native Example (iOS/Android)

```typescript
// /src/screens/CheckoutScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CheckoutClient } from '../lib/checkout-client';

const checkoutClient = new CheckoutClient(
  'https://api.l4yercak3.com',
  process.env.API_KEY || ''
);

export function CheckoutScreen({ route, navigation }: any) {
  const { seminarId, seminarName, price } = route.params;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    organization: ''
  });

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const result = await checkoutClient.triggerCheckout({
        trigger: 'checkout_complete',
        inputData: {
          eventType: 'seminar_registration',
          source: 'ios_app', // or 'android_app'
          customerData: formData,
          transactionData: {
            productId: seminarId,
            productName: seminarName,
            price: price,
            currency: 'EUR',
            quantity: 1
          }
        }
      });

      if (checkoutClient.shouldSkipPayment(result)) {
        // Employer billing - skip to confirmation
        navigation.navigate('Confirmation', { result });
      } else {
        // Show payment
        navigation.navigate('Payment', { result, amount: price });
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Checkout
      </Text>

      <TextInput
        placeholder="Vorname"
        value={formData.firstName}
        onChangeText={text => setFormData({ ...formData, firstName: text })}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 }}
      />

      <TextInput
        placeholder="Nachname"
        value={formData.lastName}
        onChangeText={text => setFormData({ ...formData, lastName: text })}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 }}
      />

      <TextInput
        placeholder="Email"
        value={formData.email}
        onChangeText={text => setFormData({ ...formData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5 }}
      />

      <TextInput
        placeholder="Organisation (optional)"
        value={formData.organization}
        onChangeText={text => setFormData({ ...formData, organization: text })}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 20, borderRadius: 5 }}
      />

      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#ccc' : '#007AFF',
          padding: 15,
          borderRadius: 5,
          alignItems: 'center'
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
            Weiter
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
```

---

## SwiftUI Example (Native iOS)

```swift
// CheckoutClient.swift
import Foundation

struct CheckoutPayload: Codable {
    let trigger: String
    let inputData: InputData

    struct InputData: Codable {
        let eventType: String
        let source: String
        let customerData: CustomerData
        let transactionData: TransactionData
    }

    struct CustomerData: Codable {
        let email: String
        let firstName: String
        let lastName: String
        let organization: String?
    }

    struct TransactionData: Codable {
        let productId: String
        let productName: String
        let price: Double
        let currency: String
        let quantity: Int
    }
}

struct CheckoutResult: Codable {
    let success: Bool
    let transactionId: String
    let behaviorResults: [BehaviorResult]

    struct BehaviorResult: Codable {
        let behaviorType: String
        let success: Bool
        let data: BehaviorData?
    }

    struct BehaviorData: Codable {
        let skipPaymentStep: Bool?
        let provider: String?
        let pdfUrl: String?
    }
}

class CheckoutClient {
    static let shared = CheckoutClient()

    private let apiBaseUrl = "https://api.l4yercak3.com"
    private let apiKey = ProcessInfo.processInfo.environment["API_KEY"] ?? ""

    func triggerCheckout(_ payload: CheckoutPayload) async throws -> CheckoutResult {
        var request = URLRequest(url: URL(string: "\(apiBaseUrl)/api/v1/workflows/trigger")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NSError(domain: "CheckoutError", code: -1, userInfo: [NSLocalizedDescriptionKey: "Checkout failed"])
        }

        return try JSONDecoder().decode(CheckoutResult.self, from: data)
    }

    func shouldSkipPayment(_ result: CheckoutResult) -> Bool {
        return result.behaviorResults.contains { behavior in
            behavior.data?.skipPaymentStep == true
        }
    }
}

// CheckoutView.swift
import SwiftUI

struct CheckoutView: View {
    let seminarId: String
    let seminarName: String
    let price: Double

    @State private var firstName = ""
    @State private var lastName = ""
    @State private var email = ""
    @State private var organization = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var showingConfirmation = false
    @State private var checkoutResult: CheckoutResult?

    var body: some View {
        Form {
            Section(header: Text("Persönliche Daten")) {
                TextField("Vorname", text: $firstName)
                TextField("Nachname", text: $lastName)
                TextField("Email", text: $email)
                    .keyboardType(.emailAddress)
                    .autocapitalization(.none)
            }

            Section(header: Text("Organisation (Optional)")) {
                TextField("Organisation", text: $organization)
            }

            Section {
                Button(action: submitCheckout) {
                    if isLoading {
                        ProgressView()
                    } else {
                        Text("Weiter")
                            .frame(maxWidth: .infinity)
                            .font(.headline)
                    }
                }
                .disabled(isLoading || firstName.isEmpty || lastName.isEmpty || email.isEmpty)
            }
        }
        .navigationTitle("Checkout")
        .alert("Fehler", isPresented: .constant(errorMessage != nil)) {
            Button("OK") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
        .sheet(isPresented: $showingConfirmation) {
            if let result = checkoutResult {
                ConfirmationView(result: result)
            }
        }
    }

    func submitCheckout() {
        isLoading = true

        Task {
            do {
                let payload = CheckoutPayload(
                    trigger: "checkout_complete",
                    inputData: .init(
                        eventType: "seminar_registration",
                        source: "ios_native_app",
                        customerData: .init(
                            email: email,
                            firstName: firstName,
                            lastName: lastName,
                            organization: organization.isEmpty ? nil : organization
                        ),
                        transactionData: .init(
                            productId: seminarId,
                            productName: seminarName,
                            price: price,
                            currency: "EUR",
                            quantity: 1
                        )
                    )
                )

                let result = try await CheckoutClient.shared.triggerCheckout(payload)
                checkoutResult = result

                if CheckoutClient.shared.shouldSkipPayment(result) {
                    // Employer billing - show confirmation
                    showingConfirmation = true
                } else {
                    // Show payment view
                    // (implement payment step)
                }
            } catch {
                errorMessage = error.localizedDescription
            }

            isLoading = false
        }
    }
}
```

---

## Key Takeaways

1. **Same API for all platforms** - Web, iOS, Android use identical payload structure
2. **Backend handles all logic** - No business logic duplication across platforms
3. **Simple frontend code** - Just collect data, send to API, display results
4. **Easy to maintain** - Change backend behaviors, all platforms automatically updated

The checkout client is **universal** - use it anywhere! 🚀
