import type { BoxFile, RecordTypeOption } from "./types";

export const FILES: BoxFile[] = [
  {
    id: "scope",
    name: "Records Management DPP|Beta|GA Scope.boxnote",
    kind: "boxnote",
    updated: "Today",
    updatedBy: "Sandeep Repaka",
    size: "375 KB",
  },
  {
    id: "cod",
    name: "Testing doc gen for CoD.docx",
    kind: "docx",
    updated: "Yesterday",
    updatedBy: "Sandeep Repaka",
    size: "23.7 KB",
    version: "V2",
  },
  {
    id: "prd",
    name: "Records Manager PRD.docx",
    kind: "docx",
    updated: "Oct 1, 2026",
    updatedBy: "Sandeep Repaka",
    size: "69.3 KB",
    version: "V42",
    comments: 28,
  },
  {
    id: "pstrat",
    name: "Records Management P-Strat 2025 Final.pptx",
    kind: "pptx",
    updated: "Sep 14, 2026",
    updatedBy: "Sandeep Repaka",
    size: "40.7 MB",
    version: "V2",
  },
  {
    id: "strategy",
    name: "Records Management Strategy Alignment.boxnote",
    kind: "boxnote",
    updated: "Sep 9, 2026",
    updatedBy: "Nick Torrecillas",
    size: "23.8 KB",
  },
  {
    id: "validation",
    name: "Customer Validation Topics.boxnote",
    kind: "boxnote",
    updated: "Jul 14, 2026",
    updatedBy: "Sandeep Repaka",
    size: "815 B",
  },
  {
    id: "speaker",
    name: "Speaker Notes.boxnote",
    kind: "boxnote",
    updated: "Jul 10, 2026",
    updatedBy: "Sandeep Repaka",
    size: "31.7 KB",
  },
  {
    id: "competitors",
    name: "RM Competitor Screenshots.pptx",
    kind: "pptx",
    updated: "Jun 11, 2026",
    updatedBy: "Sandeep Repaka",
    size: "9.3 MB",
  },
  {
    id: "demos",
    name: "Screenshots demos.pptx",
    kind: "pptx",
    updated: "Jun 9, 2026",
    updatedBy: "Sandeep Repaka",
    size: "2.2 KB",
  },
  {
    id: "trashing",
    name: "Prevent Trashing Product Requirement Justification.boxnote",
    kind: "boxnote",
    updated: "Jun 9, 2026",
    updatedBy: "Sandeep Repaka",
    size: "16.2 KB",
  },
  {
    id: "conversations",
    name: "Records Management Customer Conversations.boxnote",
    kind: "boxnote",
    updated: "May 26, 2026",
    updatedBy: "Sandeep Repaka",
    size: "15.8 KB",
  },
  {
    id: "config",
    name: "Records Configuration Options.boxnote",
    kind: "boxnote",
    updated: "May 12, 2026",
    updatedBy: "Sandeep Repaka",
    size: "16.2 KB",
  },
  {
    id: "sample",
    name: "Sample.pdf",
    kind: "pdf",
    updated: "May 7, 2026",
    updatedBy: "Sandeep Repaka",
    size: "18.3 KB",
  },
  {
    id: "analysis",
    name: "Records Management Competitive Analysis.boxnote",
    kind: "boxnote",
    updated: "Apr 14, 2026",
    updatedBy: "Sandeep Repaka",
    size: "28.4 KB",
  },
];

export const INITIAL_SELECTION = ["strategy", "validation", "speaker"];

export interface PickerFolder {
  id: string;
  name: string;
  updatedBy: string;
  tone: "blue" | "yellow";
}

export const PICKER_FOLDERS: PickerFolder[] = [
  { id: "eng", name: "Box Engineering", updatedBy: "Trevor Juanitas", tone: "blue" },
  { id: "box", name: "Box", updatedBy: "Jody Striegel", tone: "blue" },
  { id: "pipelines", name: "Pipelines", updatedBy: "Derrick Weis", tone: "blue" },
  { id: "gtm", name: "1. GTM Portal", updatedBy: "Aaron Wood", tone: "blue" },
  { id: "pm", name: "Product Mgmt", updatedBy: "Fernando Cerenza", tone: "blue" },
  { id: "devops", name: "Dev & Ops", updatedBy: "Murali Kallem", tone: "blue" },
  { id: "rm", name: "Records Management", updatedBy: "Sandeep Repaka", tone: "yellow" },
];

const EXTRA_FILES: BoxFile[] = [
  {
    id: "eng-roadmap",
    name: "Platform roadmap.docx",
    kind: "docx",
    updated: "Today",
    updatedBy: "Trevor Juanitas",
    size: "1.2 MB",
    folderId: "eng",
  },
  {
    id: "box-brief",
    name: "Company brief.pptx",
    kind: "pptx",
    updated: "Today",
    updatedBy: "Jody Striegel",
    size: "4.4 MB",
    folderId: "box",
  },
  {
    id: "pipe-run",
    name: "Pipeline notes.boxnote",
    kind: "boxnote",
    updated: "Today",
    updatedBy: "Derrick Weis",
    size: "18 KB",
    folderId: "pipelines",
  },
  {
    id: "gtm-plan",
    name: "GTM launch plan.docx",
    kind: "docx",
    updated: "Today",
    updatedBy: "Aaron Wood",
    size: "880 KB",
    folderId: "gtm",
  },
  {
    id: "pm-spec",
    name: "Product spec.boxnote",
    kind: "boxnote",
    updated: "Today",
    updatedBy: "Fernando Cerenza",
    size: "42 KB",
    folderId: "pm",
  },
  {
    id: "ops-checklist",
    name: "Release checklist.pdf",
    kind: "pdf",
    updated: "Today",
    updatedBy: "Murali Kallem",
    size: "220 KB",
    folderId: "devops",
  },
];

export const LIBRARY: BoxFile[] = [
  ...FILES.map((file) => ({ ...file, folderId: file.folderId ?? "rm" })),
  ...EXTRA_FILES,
];

export const RECORD_GROUPS = [
  "All Groups",
  "Executive Records",
  "Finance Records",
  "Legal Records",
];

export const RECORD_TYPES: RecordTypeOption[] = [
  {
    id: "bmp",
    name: "Board Meeting Presentations",
    code: "BMP-001",
    prefix: "BMP",
    group: "Executive Records",
    description: "Official board presentation decks subject to SEC retention rules.",
    frozen: false,
    retention: "SEC Financial Retention",
    retentionLength: "7 years",
    restrictions: [
      "Editing will be disabled",
      "Deletion will be disabled",
      "Moving will be disabled",
    ],
  },
  {
    id: "exm",
    name: "Executive Memos",
    code: "EXM-001",
    prefix: "EXM",
    group: "Executive Records",
    description: "Internal executive correspondence and decision memos.",
    frozen: false,
    retention: "Executive Correspondence Retention",
    retentionLength: "7 years",
    restrictions: [
      "Editing will be disabled",
      "Deletion will be disabled",
      "Moving will be disabled",
    ],
  },
  {
    id: "inv",
    name: "Invoices",
    code: "INV-002",
    prefix: "INV",
    group: "Finance Records",
    description: "Financial documents including invoices, receipts, and accounting records.",
    frozen: false,
    retention: "Accounts Payable Retention",
    retentionLength: "7 years",
    restrictions: [
      "Editing will be disabled",
      "Deletion will be disabled",
      "Moving will be disabled",
    ],
  },
  {
    id: "con",
    name: "Contracts",
    code: "CON-003",
    prefix: "CON",
    group: "Legal Records",
    description: "Legal contracts, agreements, and binding documents.",
    frozen: false,
    retention: "Contract Retention",
    retentionLength: "10 years",
    restrictions: [
      "Editing will be disabled",
      "Deletion will be disabled",
      "Moving will be disabled",
    ],
  },
  {
    id: "brs",
    name: "Board Resolutions",
    code: "BRS-001",
    prefix: "BRS",
    group: "Executive Records",
    description: "Adopted board resolutions and the exhibits that support them.",
    frozen: true,
    retention: "Board Records Retention",
    retentionLength: "10 years",
    restrictions: [
      "Editing will be disabled",
      "Deletion will be disabled",
      "Moving will be disabled",
    ],
  },
];

export function nextRecordCode(
  prefix: string,
  existing: { code: string }[],
): string {
  const year = 2026;
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const used = existing
    .map((record) => record.code.match(pattern)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value));
  const next = (used.length ? Math.max(...used) : 0) + 1;
  return `${prefix}-${year}-${String(next).padStart(5, "0")}`;
}
