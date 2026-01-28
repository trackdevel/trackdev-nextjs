// ============================================
// Profile Types
// Based on Profile.java entity
// ============================================

export type AttributeType = "STRING" | "ENUM" | "INTEGER" | "FLOAT";
export type AttributeTarget = "STUDENT" | "TASK" | "PULL_REQUEST";

export interface ProfileEnum {
  id: number;
  name: string;
  values: string[];
}

export interface ProfileAttribute {
  id: number;
  name: string;
  type: AttributeType;
  target: AttributeTarget;
  enumRefId?: number;
  enumRefName?: string;
  enumValues?: string[];
  defaultValue?: string;
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

export interface ProfileEnumRequest {
  id?: number;
  name: string;
  values: string[];
}

export interface ProfileAttributeRequest {
  id?: number;
  name: string;
  type: AttributeType;
  target: AttributeTarget;
  enumRefName?: string;
  defaultValue?: string;
}

export interface ProfileRequest {
  name: string;
  description?: string;
  enums?: ProfileEnumRequest[];
  attributes?: ProfileAttributeRequest[];
}
