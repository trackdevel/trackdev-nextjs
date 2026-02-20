// ============================================
// Profile Types
// Based on Profile.java entity
// ============================================

export type AttributeType = "STRING" | "ENUM" | "INTEGER" | "FLOAT";
export type AttributeTarget = "STUDENT" | "TASK" | "PULL_REQUEST";
export type AttributeAppliedBy = "STUDENT" | "PROFESSOR";

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
  enumRefId?: number;
  enumRefName?: string;
  enumValues?: string[];
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
  enumRefName?: string;
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
