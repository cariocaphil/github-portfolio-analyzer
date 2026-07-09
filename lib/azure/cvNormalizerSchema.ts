const optionalString = { type: "string" } as const;

const employmentEntrySchema = {
  type: "object",
  properties: {
    company: optionalString,
    role: optionalString,
    startDate: optionalString,
    endDate: optionalString,
    description: optionalString,
    location: optionalString,
  },
  required: ["company", "role", "startDate", "endDate", "description", "location"],
  additionalProperties: false,
} as const;

const educationEntrySchema = {
  type: "object",
  properties: {
    institution: optionalString,
    degree: optionalString,
    fieldOfStudy: optionalString,
    startDate: optionalString,
    endDate: optionalString,
  },
  required: ["institution", "degree", "fieldOfStudy", "startDate", "endDate"],
  additionalProperties: false,
} as const;

const certificationEntrySchema = {
  type: "object",
  properties: {
    name: optionalString,
    issuer: optionalString,
    date: optionalString,
  },
  required: ["name", "issuer", "date"],
  additionalProperties: false,
} as const;

const projectEntrySchema = {
  type: "object",
  properties: {
    name: optionalString,
    description: optionalString,
    link: optionalString,
    technologies: { type: "array", items: { type: "string" } },
  },
  required: ["name", "description", "link", "technologies"],
  additionalProperties: false,
} as const;

const languageEntrySchema = {
  type: "object",
  properties: {
    language: optionalString,
    proficiency: optionalString,
  },
  required: ["language", "proficiency"],
  additionalProperties: false,
} as const;

export const CV_NORMALIZATION_JSON_SCHEMA = {
  type: "object",
  properties: {
    personalInformation: {
      type: "object",
      properties: {
        confidence: { type: "number" },
        fullName: optionalString,
        email: optionalString,
        phone: optionalString,
        location: optionalString,
        websites: { type: "array", items: { type: "string" } },
      },
      required: ["confidence", "fullName", "email", "phone", "location", "websites"],
      additionalProperties: false,
    },
    executiveSummary: {
      type: "object",
      properties: {
        confidence: { type: "number" },
        text: optionalString,
      },
      required: ["confidence", "text"],
      additionalProperties: false,
    },
    skills: {
      type: "object",
      properties: {
        confidence: { type: "number" },
        entries: { type: "array", items: { type: "string" } },
      },
      required: ["confidence", "entries"],
      additionalProperties: false,
    },
    employmentHistory: {
      type: "object",
      properties: {
        confidence: { type: "number" },
        entries: { type: "array", items: employmentEntrySchema },
      },
      required: ["confidence", "entries"],
      additionalProperties: false,
    },
    education: {
      type: "object",
      properties: {
        confidence: { type: "number" },
        entries: { type: "array", items: educationEntrySchema },
      },
      required: ["confidence", "entries"],
      additionalProperties: false,
    },
    certifications: {
      type: "object",
      properties: {
        confidence: { type: "number" },
        entries: { type: "array", items: certificationEntrySchema },
      },
      required: ["confidence", "entries"],
      additionalProperties: false,
    },
    projects: {
      type: "object",
      properties: {
        confidence: { type: "number" },
        entries: { type: "array", items: projectEntrySchema },
      },
      required: ["confidence", "entries"],
      additionalProperties: false,
    },
    languages: {
      type: "object",
      properties: {
        confidence: { type: "number" },
        entries: { type: "array", items: languageEntrySchema },
      },
      required: ["confidence", "entries"],
      additionalProperties: false,
    },
  },
  required: [
    "personalInformation",
    "executiveSummary",
    "skills",
    "employmentHistory",
    "education",
    "certifications",
    "projects",
    "languages",
  ],
  additionalProperties: false,
} as const;

export type CvNormalizationModelResponse = {
  personalInformation: {
    confidence: number;
    fullName: string;
    email: string;
    phone: string;
    location: string;
    websites: string[];
  };
  executiveSummary: {
    confidence: number;
    text: string;
  };
  skills: {
    confidence: number;
    entries: string[];
  };
  employmentHistory: {
    confidence: number;
    entries: Array<{
      company: string;
      role: string;
      startDate: string;
      endDate: string;
      description: string;
      location: string;
    }>;
  };
  education: {
    confidence: number;
    entries: Array<{
      institution: string;
      degree: string;
      fieldOfStudy: string;
      startDate: string;
      endDate: string;
    }>;
  };
  certifications: {
    confidence: number;
    entries: Array<{
      name: string;
      issuer: string;
      date: string;
    }>;
  };
  projects: {
    confidence: number;
    entries: Array<{
      name: string;
      description: string;
      link: string;
      technologies: string[];
    }>;
  };
  languages: {
    confidence: number;
    entries: Array<{
      language: string;
      proficiency: string;
    }>;
  };
};
