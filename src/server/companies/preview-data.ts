import "server-only";

import type { Locale } from "@/i18n/config";
import type { CompanyDetail } from "@/server/companies/queries";

// Sample companies for the dev-only UI preview (no session, no database).
// Real users type these fields themselves; the sample follows the UI language.
const TEXT = {
  en: {
    acmeLocation: "Remote · New York",
    acmeNotes: "Series B, React + Node stack. Hiring two juniors this quarter.",
    acmeRole1: "Frontend Developer",
    acmeRole2: "Junior Full-stack Engineer",
    stripeIndustry: "Payments",
    stripeLocation: "Dublin",
    stripeRole: "Software Engineer, New Grad",
    linearIndustry: "Productivity",
    linearLocation: "Remote",
    linearRole: "Product Engineer",
  },
  es: {
    acmeLocation: "Remoto · Nueva York",
    acmeNotes:
      "Serie B, stack React + Node. Contratan a dos juniors este trimestre.",
    acmeRole1: "Desarrollador frontend",
    acmeRole2: "Ingeniero full-stack junior",
    stripeIndustry: "Pagos",
    stripeLocation: "Dublín",
    stripeRole: "Ingeniero de software, recién graduado",
    linearIndustry: "Productividad",
    linearLocation: "Remoto",
    linearRole: "Ingeniero de producto",
  },
} satisfies Record<Locale, Record<string, string>>;

const created = "2026-11-12T10:00:00.000Z";
const recent = (hours: number) =>
  new Date(Date.now() - hours * 3_600_000).toISOString();

const contact = (
  id: string,
  companyId: string,
  fullName: string,
  role: CompanyDetail["contacts"][number]["contact_role"],
  email: string | null,
  linkedin: string | null,
) => ({
  id,
  company_id: companyId,
  full_name: fullName,
  contact_role: role,
  email,
  phone: null,
  linkedin_url: linkedin,
  notes: null,
  created_at: created,
  updated_at: recent(20),
});

export function previewCompanies(locale: Locale): CompanyDetail[] {
  const t = TEXT[locale];
  const acme = "00000000-0000-4000-8000-000000000001";
  const stripe = "00000000-0000-4000-8000-000000000002";
  const linear = "00000000-0000-4000-8000-000000000003";

  return [
    {
      id: acme,
      user_id: "00000000-0000-4000-8000-0000000000ff",
      name: "Acme Labs",
      website: "https://acme.com",
      industry: "Fintech",
      location: t.acmeLocation,
      notes: t.acmeNotes,
      created_at: created,
      updated_at: recent(2),
      applications: [
        {
          id: "00000000-0000-4000-8000-000000000101",
          role_title: t.acmeRole1,
          status: "interview",
          status_changed_at: recent(48),
        },
        {
          id: "00000000-0000-4000-8000-000000000102",
          role_title: t.acmeRole2,
          status: "applied",
          status_changed_at: recent(96),
        },
      ],
      contacts: [
        contact(
          "00000000-0000-4000-8000-000000000201",
          acme,
          "Ana García",
          "recruiter",
          "ana@acme.com",
          "https://linkedin.com/in/ana",
        ),
        contact(
          "00000000-0000-4000-8000-000000000202",
          acme,
          "Tom Becker",
          "interviewer",
          null,
          null,
        ),
      ],
    },
    {
      id: stripe,
      user_id: "00000000-0000-4000-8000-0000000000ff",
      name: "Stripe",
      website: "https://stripe.com",
      industry: t.stripeIndustry,
      location: t.stripeLocation,
      notes: null,
      created_at: created,
      updated_at: recent(24),
      applications: [
        {
          id: "00000000-0000-4000-8000-000000000103",
          role_title: t.stripeRole,
          status: "offer",
          status_changed_at: recent(24),
        },
      ],
      contacts: [
        contact(
          "00000000-0000-4000-8000-000000000203",
          stripe,
          "Priya Shah",
          "referral",
          "priya@stripe.com",
          null,
        ),
      ],
    },
    {
      id: linear,
      user_id: "00000000-0000-4000-8000-0000000000ff",
      name: "Linear",
      website: "https://linear.app",
      industry: t.linearIndustry,
      location: t.linearLocation,
      notes: null,
      created_at: created,
      updated_at: recent(150),
      applications: [
        {
          id: "00000000-0000-4000-8000-000000000104",
          role_title: t.linearRole,
          status: "rejected",
          status_changed_at: recent(150),
        },
      ],
      contacts: [],
    },
  ];
}
