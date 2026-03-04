export const WasteType = {
  Plastic: 1,
  Metal: 2,
  Paper: 3,
  Glass: 4,
  Electronics: 5,
  DeadWaste: 6,
} as const;

export type WasteType = typeof WasteType[keyof typeof WasteType];

export interface RequestItemDto {
  id?: string;
  type: WasteType;
  estimatedWeightKg: number;
  photoUrl?: string;
  predictedValue: number;
}

export interface CreateRecyclingRequestDto {
  latitude: number;
  longitude: number;
  addressDetails: string;
  items: RequestItemDto[];
}

// এই নিচের ইন্টারফেসটি আপনার ফাইলে মিসিং ছিল, যার কারণে এররটি দিচ্ছিল!
export interface RecyclingRequestResponse {
  id: string;
  sellerId: string;
  status: number;
  createdAt: string;
  latitude: number;
  longitude: number;
  addressDetails: string;
  items: RequestItemDto[];
}