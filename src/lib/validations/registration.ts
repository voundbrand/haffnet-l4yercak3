import { z } from "zod";

/**
 * Registration form validation schema using Zod
 * Matches the RegistrationFormData interface from API types
 */
export const registrationSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name muss mindestens 2 Zeichen lang sein")
    .max(100, "Name darf maximal 100 Zeichen lang sein"),

  email: z
    .string()
    .email("Bitte geben Sie eine gültige E-Mail-Adresse ein")
    .min(1, "E-Mail-Adresse ist erforderlich"),

  medical_license: z
    .string()
    .min(5, "Arztnummer muss mindestens 5 Zeichen lang sein")
    .max(20, "Arztnummer darf maximal 20 Zeichen lang sein")
    .regex(/^[A-Z0-9]+$/, "Arztnummer darf nur Großbuchstaben und Zahlen enthalten"),

  specialty: z
    .string()
    .min(1, "Bitte wählen Sie eine Fachrichtung aus"),

  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[\d\s+()-]+$/.test(val),
      "Bitte geben Sie eine gültige Telefonnummer ein"
    ),

  employer_pays: z.boolean().default(false),

  employer_name: z.string().optional(),
}).refine(
  (data) => {
    // If employer pays, employer name is required
    if (data.employer_pays && !data.employer_name) {
      return false;
    }
    return true;
  },
  {
    message: "Name der Einrichtung ist erforderlich, wenn der Arbeitgeber zahlt",
    path: ["employer_name"],
  }
);

export type RegistrationFormValues = z.infer<typeof registrationSchema>;

// Specialty options for the select dropdown
export const specialtyOptions = [
  "Allgemeinmedizin",
  "Innere Medizin",
  "Chirurgie",
  "Anästhesiologie",
  "Radiologie",
  "Kardiologie",
  "Neurologie",
  "Psychiatrie",
  "Pädiatrie",
  "Gynäkologie",
  "Orthopädie",
  "Urologie",
  "HNO",
  "Augenheilkunde",
  "Dermatologie",
  "Onkologie",
  "Sonstige",
] as const;
