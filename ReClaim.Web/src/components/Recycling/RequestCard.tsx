import React from 'react';
import { type RecyclingRequestResponse, WasteType } from '../../types/recycling';

const wasteTypeNames: Record<WasteType, string> = {
  [WasteType.Plastic]: 'Plastic',
  [WasteType.Metal]: 'Metal',
  [WasteType.Paper]: 'Paper',
  [WasteType.Glass]: 'Glass',
  [WasteType.Electronics]: 'Electronics',
  [WasteType.DeadWaste]: 'Dead Waste',
};

export const RequestCard: React.FC<{ request: RecyclingRequestResponse }> = ({ request }) => {
  const mainItem = request.items[0]; // আপাতত প্রথম আইটেম দেখাচ্ছি

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded">
          {wasteTypeNames[mainItem?.type] || 'Unknown'}
        </span>
        <span className="text-sm text-gray-500">
          {new Date(request.createdAt).toLocaleDateString()}
        </span>
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-1">
        {mainItem?.estimatedWeightKg} kg Available
      </h3>
      <p className="text-gray-600 text-sm mb-3">📍 {request.addressDetails}</p>
      
      <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
        <span className="text-xs text-gray-400">Status: {request.status === 0 ? 'Pending' : 'Accepted'}</span>
        <button className="text-green-600 text-sm font-semibold hover:underline">
          View Details →
        </button>
      </div>
    </div>
  );
};