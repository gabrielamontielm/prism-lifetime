/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'owner' | 'editor' | 'contributor' | 'viewer';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
  shareToken?: string;
  createdAt: number;
}

export interface Tag {
  id: string;
  label: string;
  color?: string;
  isCustom: boolean;
}

export type ContributionStatus = 'pending' | 'published' | 'declined';

export interface Contribution {
  id: string;
  eventId: string;
  authorId: string;
  authorName: string;
  text: string;
  photos: string[];
  status: ContributionStatus;
  createdAt: number;
  approvedAt?: number;
  approvedBy?: string;
}

export interface EventLocation {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

export interface LifeEvent {
  id: string;
  ownerId: string;
  shareToken?: string;
  title: string;
  description: string;
  date: string; // ISO format or just year/month/day
  primaryPhoto: string;
  additionalPhotos: string[];
  tags: string[];
  participants: string[]; // Array of UIDs
  location?: EventLocation;
  status?: 'published' | 'archived';
  createdAt: number;
  updatedAt: number;
}
