import "server-only";

import type { Locale } from "@/i18n/config";
import type { ApplicationStatus, ContactRole } from "@/lib/constants";
import type { CompanyDetail } from "@/server/companies/queries";

// Sample companies for the dev-only UI preview (no session, no database).
// Sized like a real account a few weeks into a job search, so screens are
// designed against realistic density. Real users type these fields
// themselves; the sample follows the UI language.

/** [English, Spanish] */
type Text = readonly [string, string];

/** jobUrl defaults to a LinkedIn posting; a string overrides it, null means no link. */
type SampleApplication = readonly [
  role: Text,
  status: ApplicationStatus,
  hoursAgo: number,
  jobUrl?: string | null,
];

type SampleContact = {
  name: string;
  role: ContactRole | null;
  email?: string;
  phone?: string;
  linkedin?: string;
  notes?: Text;
};

type SampleCompany = {
  name: string;
  website: string;
  industry: Text;
  location: Text;
  notes?: Text;
  addedDaysAgo: number;
  applications: SampleApplication[];
  contacts: SampleContact[];
};

const SAMPLE: SampleCompany[] = [
  {
    name: "Acme Labs",
    website: "https://acme.com",
    industry: ["Fintech", "Fintech"],
    location: ["Remote · New York", "Remoto · Nueva York"],
    notes: [
      "Series B, React + Node stack. Hiring two juniors this quarter.",
      "Serie B, stack React + Node. Contratan a dos juniors este trimestre.",
    ],
    addedDaysAgo: 13,
    applications: [
      [["Frontend Developer", "Desarrollador frontend"], "interview", 48],
      [
        ["Junior Full-stack Engineer", "Ingeniero full-stack junior"],
        "applied",
        96,
      ],
    ],
    contacts: [
      {
        name: "Ana García",
        role: "recruiter",
        email: "ana@acme.com",
        phone: "+1 212 555 0148",
        linkedin: "https://linkedin.com/in/ana",
        notes: [
          "Prefers email. Said feedback comes within a week.",
          "Prefiere email. Dijo que el feedback llega en una semana.",
        ],
      },
      { name: "Tom Becker", role: "interviewer", email: "tom@acme.com" },
      {
        name: "Lucía Ferrer",
        role: "referral",
        linkedin: "https://linkedin.com/in/luciaferrer",
        phone: "+34 611 204 388",
        notes: [
          "Former classmate, works on the payments team.",
          "Compañera de clase, trabaja en el equipo de pagos.",
        ],
      },
    ],
  },
  {
    name: "Stripe",
    website: "https://stripe.com",
    industry: ["Payments", "Pagos"],
    location: ["Dublin", "Dublín"],
    notes: [
      "Offer received. Compare with the Revolut process before answering.",
      "Oferta recibida. Comparar con el proceso de Revolut antes de responder.",
    ],
    addedDaysAgo: 30,
    applications: [
      [
        [
          "Software Engineer, New Grad",
          "Ingeniero de software, recién graduado",
        ],
        "offer",
        20,
      ],
      [
        ["Backend Engineer, Billing", "Ingeniero backend, Billing"],
        "rejected",
        300,
        "https://stripe.com/jobs",
      ],
    ],
    contacts: [
      {
        name: "Priya Shah",
        role: "referral",
        email: "priya@stripe.com",
        linkedin: "https://linkedin.com/in/priyashah",
        notes: [
          "Referred me internally. Thank her after the decision.",
          "Me refirió internamente. Darle las gracias tras decidir.",
        ],
      },
      {
        name: "Conor Walsh",
        role: "recruiter",
        email: "conor@stripe.com",
        phone: "+353 1 555 0192",
      },
      {
        name: "Mei Lin",
        role: "interviewer",
        linkedin: "https://linkedin.com/in/meilin",
      },
      { name: "David Okafor", role: "interviewer" },
    ],
  },
  {
    name: "Linear",
    website: "https://linear.app",
    industry: ["Productivity", "Productividad"],
    location: ["Remote", "Remoto"],
    addedDaysAgo: 25,
    applications: [
      [["Product Engineer", "Ingeniero de producto"], "rejected", 150],
    ],
    contacts: [
      {
        name: "Sara Nilsson",
        role: "recruiter",
        email: "sara@linear.app",
        notes: [
          "Open to re-applying in six months.",
          "Abierta a que vuelva a aplicar en seis meses.",
        ],
      },
    ],
  },
  {
    name: "Revolut",
    website: "https://revolut.com",
    industry: ["Fintech", "Fintech"],
    location: ["Hybrid · Madrid", "Híbrido · Madrid"],
    notes: [
      "Fast process: three rounds in two weeks. Take-home in TypeScript.",
      "Proceso rápido: tres rondas en dos semanas. Prueba técnica en TypeScript.",
    ],
    addedDaysAgo: 18,
    applications: [
      [["Frontend Engineer", "Ingeniero frontend"], "interview", 6],
      [
        ["React Native Developer", "Desarrollador React Native"],
        "on_hold",
        200,
      ],
    ],
    contacts: [
      {
        name: "Javier Ortega",
        role: "recruiter",
        email: "javier.ortega@revolut.com",
        phone: "+34 622 918 004",
        linkedin: "https://linkedin.com/in/javierortega",
      },
      {
        name: "Elena Popescu",
        role: "interviewer",
        notes: [
          "Ran the system design round. Asked a lot about caching.",
          "Hizo la ronda de diseño de sistemas. Preguntó mucho de caché.",
        ],
      },
    ],
  },
  {
    name: "Vercel",
    website: "https://vercel.com",
    industry: ["Developer tools", "Herramientas para desarrolladores"],
    location: ["Remote · Europe", "Remoto · Europa"],
    addedDaysAgo: 9,
    applications: [
      [["Developer Advocate", "Developer advocate"], "applied", 30],
      [
        ["Frontend Engineer, Dashboard", "Ingeniero frontend, Dashboard"],
        "saved",
        70,
      ],
    ],
    contacts: [
      {
        name: "Noah Fischer",
        role: "referral",
        linkedin: "https://linkedin.com/in/noahfischer",
        notes: [
          "Met him at the Next.js meetup in Berlin.",
          "Lo conocí en el meetup de Next.js en Berlín.",
        ],
      },
    ],
  },
  {
    name: "Notion",
    website: "https://notion.so",
    industry: ["Productivity", "Productividad"],
    location: ["Hybrid · Dublin", "Híbrido · Dublín"],
    addedDaysAgo: 6,
    applications: [
      [
        ["Software Engineer, Editor", "Ingeniero de software, Editor"],
        "saved",
        120,
      ],
    ],
    contacts: [],
  },
  {
    name: "Glovo",
    website: "https://glovoapp.com",
    industry: ["Delivery", "Reparto a domicilio"],
    location: ["On-site · Barcelona", "Presencial · Barcelona"],
    notes: [
      "Big frontend team. Ask about on-call before the final round.",
      "Equipo frontend grande. Preguntar por las guardias antes de la ronda final.",
    ],
    addedDaysAgo: 21,
    applications: [
      [
        [
          "Frontend Engineer, Courier app",
          "Ingeniero frontend, app de repartidores",
        ],
        "interview",
        26,
      ],
      [
        ["Junior Web Developer", "Desarrollador web junior"],
        "rejected",
        400,
        null,
      ],
      [
        ["Frontend Engineer, Partners", "Ingeniero frontend, Partners"],
        "applied",
        110,
      ],
    ],
    contacts: [
      {
        name: "Marta Puig",
        role: "recruiter",
        email: "marta.puig@glovoapp.com",
        phone: "+34 933 555 120",
        linkedin: "https://linkedin.com/in/martapuig",
      },
      {
        name: "Óscar Lima",
        role: "interviewer",
        email: "oscar.lima@glovoapp.com",
      },
      {
        name: "Irene Vidal",
        role: "other",
        notes: [
          "Engineering manager. Hiring decision is hers.",
          "Engineering manager. La decisión de contratar es suya.",
        ],
      },
    ],
  },
  {
    name: "Cabify",
    website: "https://cabify.com",
    industry: ["Mobility", "Movilidad"],
    location: ["Hybrid · Madrid", "Híbrido · Madrid"],
    addedDaysAgo: 15,
    applications: [
      [["Fullstack Developer", "Desarrollador fullstack"], "applied", 160],
    ],
    contacts: [
      {
        name: "Pablo Serrano",
        role: "recruiter",
        email: "pablo.serrano@cabify.com",
      },
    ],
  },
  {
    name: "Typeform",
    website: "https://typeform.com",
    industry: ["SaaS", "SaaS"],
    location: ["Remote · Spain", "Remoto · España"],
    notes: [
      "Good culture reviews. Salary band published in the offer.",
      "Buenas opiniones de cultura. Banda salarial publicada en la oferta.",
    ],
    addedDaysAgo: 11,
    applications: [
      [
        ["Frontend Developer, Growth", "Desarrollador frontend, Growth"],
        "interview",
        72,
      ],
    ],
    contacts: [
      {
        name: "Laura Méndez",
        role: "recruiter",
        email: "laura.mendez@typeform.com",
        linkedin: "https://linkedin.com/in/lauramendez",
      },
      { name: "Ben Carter", role: "interviewer" },
    ],
  },
  {
    name: "Factorial",
    website: "https://factorialhr.com",
    industry: ["HR software", "Software de RR. HH."],
    location: ["On-site · Barcelona", "Presencial · Barcelona"],
    addedDaysAgo: 4,
    applications: [
      [["Junior Frontend Engineer", "Ingeniero frontend junior"], "saved", 50],
    ],
    contacts: [],
  },
  {
    name: "Spotify",
    website: "https://spotify.com",
    industry: ["Music streaming", "Streaming de música"],
    location: ["Hybrid · Stockholm", "Híbrido · Estocolmo"],
    addedDaysAgo: 40,
    applications: [[["Web Engineer", "Ingeniero web"], "rejected", 700]],
    contacts: [
      {
        name: "Erik Lund",
        role: "recruiter",
        email: "erik.lund@spotify.com",
        notes: [
          "Rejected after the take-home. Asked for feedback.",
          "Descartado tras la prueba técnica. Le pedí feedback.",
        ],
      },
    ],
  },
  {
    name: "Wallapop",
    website: "https://wallapop.com",
    industry: ["Marketplace", "Marketplace"],
    location: ["Hybrid · Barcelona", "Híbrido · Barcelona"],
    addedDaysAgo: 2,
    applications: [],
    contacts: [],
  },
];

const USER_ID = "00000000-0000-4000-8000-0000000000ff";
const HOUR = 3_600_000;

/** Stable UUIDs so detail URLs keep working between reloads. */
const sampleId = (group: number, n: number) =>
  `00000000-0000-4000-8000-${String(group * 100_000 + n).padStart(12, "0")}`;

export function previewCompanies(locale: Locale): CompanyDetail[] {
  const pick = (text: Text) => (locale === "es" ? text[1] : text[0]);
  const ago = (hours: number) =>
    new Date(Date.now() - hours * HOUR).toISOString();
  let appN = 0;
  let contactN = 0;

  return SAMPLE.map((sample, index) => {
    const id = sampleId(0, index + 1);
    const created = ago(sample.addedDaysAgo * 24);
    const applications = sample.applications.map(
      ([role, status, hours, jobUrl]) => {
        const n = ++appN;
        return {
          id: sampleId(1, n),
          role_title: pick(role),
          status,
          status_changed_at: ago(hours),
          job_url:
            jobUrl === undefined
              ? `https://www.linkedin.com/jobs/view/${4_100_000_000 + n * 7919}`
              : jobUrl,
        };
      },
    );
    const lastHours = Math.min(
      sample.addedDaysAgo * 24,
      ...sample.applications.map(([, , hours]) => hours),
    );

    return {
      id,
      user_id: USER_ID,
      name: sample.name,
      website: sample.website,
      industry: pick(sample.industry),
      location: pick(sample.location),
      notes: sample.notes ? pick(sample.notes) : null,
      created_at: created,
      updated_at: ago(lastHours),
      applications,
      contacts: sample.contacts.map((contact, i) => {
        // Contacts come in over the following days, not all at once.
        const added = ago(sample.addedDaysAgo * 24 - (i + 1) * 30);
        return {
          id: sampleId(2, ++contactN),
          company_id: id,
          full_name: contact.name,
          contact_role: contact.role,
          email: contact.email ?? null,
          phone: contact.phone ?? null,
          linkedin_url: contact.linkedin ?? null,
          notes: contact.notes ? pick(contact.notes) : null,
          created_at: added,
          updated_at: added,
        };
      }),
    };
  });
}
