'use client';

/**
 * Checkout Test Page
 *
 * Use this page to test checkout features:
 * - Create checkout session
 * - Select payment method
 * - Confirm payment
 * - View success/error states
 */

import { useState } from 'react';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const MOCK_PRODUCT_ID = 'prod_test_123';
const MOCK_ORG_ID = process.env.NEXT_PUBLIC_ORG_ID || 'org_test';

export default function TestCheckoutPage() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [lastResult, setLastResult] = useState<{
    type: 'success' | 'error';
    message: string;
    data?: any;
  } | null>(null);

  const handleSuccess = (ticketId: string) => {
    setLastResult({
      type: 'success',
      message: 'Checkout completed successfully!',
      data: { ticketId },
    });
    setShowCheckout(false);
  };

  const handleError = (error: string) => {
    setLastResult({
      type: 'error',
      message: error,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Checkout Test Page</h1>
          <p className="text-muted-foreground">
            Test checkout flow with different payment methods
          </p>
        </div>

        {/* Configuration Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Configuration</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Product ID:</span>
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {MOCK_PRODUCT_ID}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Organization ID:</span>
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                {MOCK_ORG_ID}
              </code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Backend API:</span>
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                {process.env.NEXT_PUBLIC_API_URL}
              </code>
            </div>
          </div>
        </Card>

        {/* Checkout Form Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Checkout Form</h2>
          {showCheckout ? (
            <>
              <CheckoutForm
                productId={MOCK_PRODUCT_ID}
                organizationId={MOCK_ORG_ID}
                onSuccess={handleSuccess}
                onError={handleError}
              />
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCheckout(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setShowCheckout(true)}>
              Start Checkout
            </Button>
          )}
        </Card>

        {/* Last Result Card */}
        {lastResult && (
          <Card className={`p-6 ${lastResult.type === 'error' ? 'border-destructive' : 'border-green-600'}`}>
            <h2 className="text-xl font-semibold mb-4">
              {lastResult.type === 'success' ? '✅ Success' : '❌ Error'}
            </h2>
            <p className="mb-4">{lastResult.message}</p>
            {lastResult.data && (
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(lastResult.data, null, 2)}
              </pre>
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => setLastResult(null)}
            >
              Clear
            </Button>
          </Card>
        )}

        {/* Test Checklist Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Checklist</h2>
          <div className="space-y-2 text-sm">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Checkout form collects customer information</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Payment method selection works (Free/Stripe/Invoice)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Free registration completes successfully</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Stripe redirect works (if configured)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Invoice method creates session</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Success message displays after completion</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded" />
              <span>Error messages display on failure</span>
            </label>
          </div>
        </Card>

        {/* Payment Methods Card */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Methods to Test</h2>
          <div className="space-y-3">
            <div className="border-l-4 border-green-600 pl-4">
              <h3 className="font-semibold">Free Registration</h3>
              <p className="text-sm text-muted-foreground">
                Should complete immediately without external redirect
              </p>
            </div>
            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="font-semibold">Stripe Payment</h3>
              <p className="text-sm text-muted-foreground">
                Should redirect to Stripe checkout page (requires Stripe config)
              </p>
            </div>
            <div className="border-l-4 border-purple-600 pl-4">
              <h3 className="font-semibold">Invoice</h3>
              <p className="text-sm text-muted-foreground">
                Should create session and send invoice by email
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
