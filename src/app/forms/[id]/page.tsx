'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formApi, type Form, type FormField } from '@/lib/api-client';

interface FormPageProps {
  params: Promise<{ id: string }>;
}

// Extended field type for matrix questions
interface MatrixField extends FormField {
  rows?: Array<{ id: string; label: string }>;
}

export default function FormPage({ params }: FormPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic form data based on schema
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  // Load form configuration from backend
  useEffect(() => {
    async function loadForm() {
      try {
        const formRes = await formApi.getPublicForm(id);
        setForm(formRes.data);

        // Initialize form data with default values
        const initialData: Record<string, unknown> = {};
        const schema = formRes.data.customProperties.formSchema;

        schema.fields.forEach((field) => {
          if (field.type === 'checkbox') {
            initialData[field.id] = [];
          } else if (field.type === 'rating') {
            initialData[field.id] = 0;
          } else if (field.type === 'nps') {
            initialData[field.id] = -1; // Not selected
          } else {
            initialData[field.id] = '';
          }
        });

        setFormData(initialData);
      } catch (err) {
        setError('Fehler beim Laden des Formulars');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadForm();
  }, [id]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form) return;

    // Validate required fields
    const schema = form.customProperties.formSchema;
    for (const field of schema.fields) {
      if (field.required) {
        const value = formData[field.id];

        if (field.type === 'checkbox' && Array.isArray(value) && value.length === 0) {
          setError(`Bitte füllen Sie das Feld aus: ${field.label}`);
          return;
        }

        if (field.type === 'nps' && value === -1) {
          setError(`Bitte füllen Sie das Feld aus: ${field.label}`);
          return;
        }

        if (field.type === 'rating' && value === 0) {
          setError(`Bitte füllen Sie das Feld aus: ${field.label}`);
          return;
        }

        if (!value || value === '') {
          setError(`Bitte füllen Sie das Feld aus: ${field.label}`);
          return;
        }
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      await formApi.submitForm({
        formId: id,
        responses: formData,
        metadata: {
          source: 'website',
          userAgent: navigator.userAgent,
        },
      });

      // Redirect to thank you page
      router.push(`/forms/${id}/danke`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Absenden');
    } finally {
      setSubmitting(false);
    }
  };

  // Render field based on type
  const renderField = (field: FormField | MatrixField) => {
    const value = formData[field.id];

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <input
            type={field.type}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            rows={3}
            required={field.required}
          />
        );

      case 'rating':
        return (
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setFormData({ ...formData, [field.id]: rating })}
                className={`w-12 h-12 rounded-lg font-semibold text-sm transition-all ${
                  value === rating
                    ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rating}
              </button>
            ))}
          </div>
        );

      case 'nps':
        return (
          <div>
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>0 = Überhaupt nicht wahrscheinlich</span>
              <span>10 = Äußerst wahrscheinlich</span>
            </div>
            <div className="grid grid-cols-11 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setFormData({ ...formData, [field.id]: score })}
                  className={`h-12 rounded-lg font-semibold text-sm transition-all ${
                    value === score
                      ? 'bg-green-600 text-white ring-2 ring-green-600 ring-offset-2'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>
        );

      case 'matrix': {
        const matrixField = field as MatrixField;
        return (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-sm font-semibold">Aspekt</th>
                  {matrixField.options?.map((opt) => (
                    <th key={opt.value} className="text-center py-2 px-2 text-xs">
                      {opt.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixField.rows?.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-2 text-sm">{row.label}</td>
                    {matrixField.options?.map((opt) => (
                      <td key={opt.value} className="text-center py-3 px-2">
                        <input
                          type="radio"
                          name={row.id}
                          value={opt.value}
                          checked={formData[row.id] === Number(opt.value)}
                          onChange={() =>
                            setFormData({ ...formData, [row.id]: Number(opt.value) })
                          }
                          className="w-5 h-5 accent-green-600 cursor-pointer"
                          required={matrixField.required}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  required={field.required}
                  className="mr-3 w-5 h-5 accent-green-600"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox': {
        const arrayValue = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded"
              >
                <input
                  type="checkbox"
                  checked={arrayValue.includes(option.value)}
                  onChange={(e) => {
                    const newValue = e.target.checked
                      ? [...arrayValue, option.value]
                      : arrayValue.filter((v) => v !== option.value);
                    setFormData({ ...formData, [field.id]: newValue });
                  }}
                  className="mr-3 w-5 h-5 accent-green-600"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );
      }

      default:
        return <div className="text-gray-500">Unsupported field type: {field.type}</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lädt...</p>
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Link href="/" className="text-green-600 hover:text-green-700">
            Zurück zur Startseite
          </Link>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const schema = form.customProperties.formSchema;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.name}</h1>
          {form.description && <p className="text-gray-600">{form.description}</p>}
        </div>

        {/* Info Box */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-green-800">
            <strong>Hinweis:</strong> Felder mit * sind Pflichtfelder
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Render all fields dynamically */}
          {schema.fields.map((field) => {
            // Check conditional logic
            if (field.conditionalLogic) {
              const condition = field.conditionalLogic.show;
              const dependentValue = formData[condition.field];

              if (condition.operator === 'equals' && !condition.value.includes(dependentValue as string)) {
                return null; // Hide field
              }
            }

            return (
              <div key={field.id} className="bg-white rounded-lg shadow-md p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label}
                  {field.required && ' *'}
                </label>
                {renderField(field)}
              </div>
            );
          })}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Wird gesendet...
              </span>
            ) : (
              schema.settings.submitButtonText || 'Absenden'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
