export const RequestStatus = {
  Pending: 0,
  Assigned: 1,
  PickedUp: 2,
  Completed: 3,
  Cancelled: 4
} as const;

export type RequestStatusType = typeof RequestStatus[keyof typeof RequestStatus];

export const ItemCondition = {
  Scrap: 0,
  Damaged: 1,
  Working: 2
} as const;

export type ItemConditionType = typeof ItemCondition[keyof typeof ItemCondition];

export interface PickUpRequest {
  id?: string;
  citizenId: string;
  recyclerId?: string;
  category: string;
  subCategory: string;
  brandAndModel?: string;
  itemDescription?: string;
  condition: ItemConditionType; 
  isPoweringOn: boolean;
  weightKg: number;
  estimatedValue: number;
  pickUpAddress: string;
  latitude: number;
  longitude: number;
  preferredPickUpTime: string;
  imageUrls?: string[];
  status?: RequestStatusType;
  createdAt?: string;
}