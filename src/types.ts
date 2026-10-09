export type FileKind = "boxnote" | "docx" | "pptx" | "pdf";

export interface BoxFile {
  id: string;
  name: string;
  kind: FileKind;
  updated: string;
  updatedBy: string;
  size: string;
  version?: string;
  comments?: number;
  folderId?: string;
}

export interface RecordTypeOption {
  id: string;
  name: string;
  code: string;
  prefix: string;
  group: string;
  description: string;
  frozen: boolean;
  retention: string;
  retentionLength: string;
  restrictions: string[];
}

export interface CompoundRecord {
  id: string;
  code: string;
  typeId: string;
  typeName: string;
  prefix: string;
  status: "open" | "closed";
  locked: boolean;
  declaredAt: string;
  closerName: string;
  fileIds: string[];
  snapshotFileIds: string[];
  attestation?: { name: string; at: string; note: string };
  finiteStartedAt?: string;
}
