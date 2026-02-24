import React, { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { WasteType, CreateRecyclingRequestDto } from "../../types/recycling";

export const CreateRequestForm = () => {
  const { getToken } = useAuth(); 
  const [addressDetails, setAddressDetails] = useState("");
  const [weight, setWeight] = useState<number>(1);
  const [wasteType, setWasteType] = useState<WasteType>(WasteType.Plastic);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const token = await getToken();
      
      
      const payload: CreateRecyclingRequestDto = {
        latitude: 23.8103, 
        longitude: 90.4125,
        addressDetails,
        items: [
          {
            type: wasteType,
            estimatedWeightKg: weight,
            predictedValue: 0, 
          }
        ]
      };


      const response = await fetch('http://localhost:5150/api/RecyclingRequests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send request');
      }

      setMessage({ text: 'Your recycling request has been submitted successfully!', isError: false });
      setAddressDetails('');
      setWeight(1);
        } catch (err: any) {
      setMessage({ text: err.message || 'Failed to connect to server', isError: true });
        } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-lg mt-10 border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Recyling Request Send</h2>
      
      {message && (
        <div className={`p-4 mb-6 text-sm rounded-lg ${
          message.isError 
            ? 'bg-red-50 text-red-700 border border-red-200' 
            : 'bg-green-50 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
          <input
            type="text"
            required
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2.5 border outline-none transition-colors"
            value={addressDetails}
            onChange={(e) => setAddressDetails(e.target.value)}
            placeholder="e.g. House 4B, Road 12, Banani..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">বর্জ্যের ধরন</label>
          <select
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2.5 border outline-none bg-white transition-colors"
            value={wasteType}
            onChange={(e) => setWasteType(Number(e.target.value) as WasteType)}
          >
            <option value={WasteType.Plastic}>Plastic</option>
            <option value={WasteType.Metal}>Metal (Metal)</option>
            <option value={WasteType.Paper}>Paper</option>
            <option value={WasteType.DeadWaste}>Dead Waste (Unused Waste)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Estimated Weight (kg)</label>
          <input
            type="number"
            min="0.1"
            step="0.1"
            required
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2.5 border outline-none transition-colors"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? 'Processing...' : 'Picup confirm'}
        </button>
      </form>
    </div>
  );
};