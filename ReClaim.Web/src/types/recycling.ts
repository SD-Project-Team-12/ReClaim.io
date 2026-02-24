export enum WasteType {
  Plastic = 1,
  Metal = 2,
  Paper = 3,
  Glass = 4,
  Electronics = 5,
  DeadWaste = 6,
}

export interface RequestItemDto {
  type: WasteType;
  estimatedWeightKg: number;
  photoUrl?: string;
  predictedValue: number;
}

// এই ইন্টারফেসটি অবশ্যই 'export' হতে হবে
export interface CreateRecyclingRequestDto {
  latitude: number;
  longitude: number;
  addressDetails: string;
  items: RequestItemDto[];
}