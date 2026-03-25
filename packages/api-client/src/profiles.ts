// ============================================
// Profiles API
// ============================================

import type {
  AttributeUsage,
  IdObject,
  ProfileBasic,
  ProfileComplete,
  ProfileRequest,
} from "@trackdev/types";
import { api } from "./client";

interface ProfilesResponse {
  profiles: ProfileBasic[];
}

export const profilesApi = {
  /**
   * Get all profiles owned by the current professor
   */
  getAll: async () => {
    const response = await api.get<ProfilesResponse>("/profiles");
    return response.profiles;
  },

  /**
   * Get profile by ID with full details (enums and attributes)
   */
  getById: (id: number) => api.get<ProfileComplete>(`/profiles/${id}`),

  /**
   * Create a new profile
   */
  create: (data: ProfileRequest) => api.post<IdObject>("/profiles", data),

  /**
   * Update a profile (including all enums and attributes)
   */
  update: (id: number, data: ProfileRequest) =>
    api.put<ProfileComplete>(`/profiles/${id}`, data),

  /**
   * Delete a profile
   */
  delete: (id: number) => api.delete<void>(`/profiles/${id}`),

  /**
   * Get usage information for a profile attribute (count + first 10 samples)
   */
  getAttributeUsage: (profileId: number, attributeId: number) =>
    api.get<AttributeUsage>(`/profiles/${profileId}/attributes/${attributeId}/usage`),

  /**
   * Delete an attribute from a profile, cascading to all its values
   */
  deleteAttribute: (profileId: number, attributeId: number) =>
    api.delete<void>(`/profiles/${profileId}/attributes/${attributeId}`),
};
