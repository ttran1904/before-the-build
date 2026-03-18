// Shared types for Before The Build

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  dimensions?: {
    width: number;
    height: number;
    length: number;
  };
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export type RoomType =
  | "kitchen"
  | "bathroom"
  | "bedroom"
  | "living_room"
  | "dining_room"
  | "garage"
  | "basement"
  | "outdoor"
  | "other";

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  rooms: Room[];
  budget?: number;
  status: "planning" | "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
}

export interface DesignSuggestion {
  id: string;
  roomId: string;
  style: string;
  description: string;
  estimatedCost: number;
  imageUrl?: string;
}
