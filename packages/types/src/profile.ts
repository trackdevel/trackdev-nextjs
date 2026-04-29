// ============================================
// Profile Types
// Based on Profile.java entity
// ============================================

export type AttributeType =
  | "STRING"
  | "ENUM"
  | "INTEGER"
  | "FLOAT"
  | "LIST"
  | "TEXT"
  | "NUMERIC_TEXT"
  | "ENUM_PAIR";
export type AttributeTarget = "STUDENT" | "TASK" | "PULL_REQUEST";
export type AttributeAppliedBy = "STUDENT" | "PROFESSOR";
export type AttributeVisibility =
  | "PROFESSOR_ONLY"
  | "PROJECT_STUDENTS"
  | "ASSIGNED_STUDENT";

export interface EnumValueEntry {
  value: string;
  description?: string;
}

export interface ProfileEnum {
  id: number;
  name: string;
  values: EnumValueEntry[];
}

export interface ProfileAttribute {
  id: number;
  name: string;
  type: AttributeType;
  target: AttributeTarget;
  appliedBy: AttributeAppliedBy;
  visibility: AttributeVisibility;
  enumRefId?: number;
  enumRefName?: string;
  enumValues?: EnumValueEntry[];
  /** Second enum reference, only for ENUM_PAIR */
  enumRef2Id?: number;
  enumRef2Name?: string;
  enumValues2?: EnumValueEntry[];
  defaultValue?: string;
  minValue?: string;
  maxValue?: string;
}

export interface ProfileBasic {
  id: number;
  name: string;
  description?: string;
  ownerId: string;
}

export interface ProfileComplete extends ProfileBasic {
  enums: ProfileEnum[];
  attributes: ProfileAttribute[];
}

export interface ProfilesResponse {
  profiles: ProfileBasic[];
}

export interface EnumValueRequest {
  value: string;
  description?: string;
}

export interface ProfileEnumRequest {
  id?: number;
  name: string;
  values: EnumValueRequest[];
}

export interface ProfileAttributeRequest {
  id?: number;
  name: string;
  type: AttributeType;
  target: AttributeTarget;
  appliedBy?: AttributeAppliedBy;
  visibility?: AttributeVisibility;
  enumRefName?: string;
  /** Second enum reference name, required when type is ENUM_PAIR; must differ from enumRefName */
  enumRefName2?: string;
  defaultValue?: string;
  minValue?: string;
  maxValue?: string;
}

export interface ProfileRequest {
  name: string;
  description?: string;
  enums?: ProfileEnumRequest[];
  attributes?: ProfileAttributeRequest[];
}

// ============================================
// LIST Attribute Types
// ============================================

export interface ListItem {
  orderIndex: number;
  enumValue?: string;
  title: string;
  description?: string;
}

export interface StudentAttributeListValue {
  attributeId: number;
  attributeName: string;
  attributeType: "LIST";
  items: ListItem[];
  enumValues?: EnumValueEntry[];
}

export interface PullRequestAttributeListValue {
  attributeId: number;
  attributeName: string;
  attributeType: "LIST";
  items: ListItem[];
  enumValues?: EnumValueEntry[];
}

export interface SetListAttributeValuesRequest {
  items: { enumValue?: string; title: string; description?: string }[];
}

// ============================================
// Attribute Usage (for deletion confirmation)
// ============================================

export interface AttributeUsageSample {
  entityType: "TASK" | "STUDENT" | "PULL_REQUEST";
  entityName: string;
  value: string | null;
}

export interface AttributeUsage {
  totalCount: number;
  samples: AttributeUsageSample[];
}