import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ItemCondition, type PickUpRequest } from "../../../types/pickup";
import { submitPickUpRequest } from "../../../api/pickupApi";

interface RequestFormProps {
  onSuccess?: () => void;
}

export default function RequestPickUp({ onSuccess }: RequestFormProps) {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [estimate, setEstimate] = useState(0);

    const [formData, setFormData] = useState<Partial<PickUpRequest>>({
        category: "Computing",
        subCategory: "General", // Give it a default value instead of ""
        brandAndModel: "",
        itemDescription: "No description provided",
        condition: ItemCondition.Working,
        weightKg: 1,
        isPoweringOn: false,
        pickUpAddress: "",
        preferredPickUpTime: new Date().toISOString().slice(0, 16),
        latitude: 23.8103,
        longitude: 90.4125,
    });

    useEffect(() => {
        let base = formData.category === "Computing" ? 200 : 100;
        let currentEstimate = (formData.weightKg || 1) * base;
        if (formData.isPoweringOn) currentEstimate += 500;
        setEstimate(currentEstimate);
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = await getToken();
            const response = await submitPickUpRequest(formData, token);

            if (response.ok) {
                alert("Success!");
                if (onSuccess) onSuccess(); // 2. Call the trigger here!
            }
        } catch (err) {
            alert("Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Request E-Waste Pickup</h2>
            <p className="text-gray-500 mb-8 text-sm">Fill in the details to get an instant valuation.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                        <select
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 transition"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="Computing">Computing (Laptops, PCs)</option>
                            <option value="Mobile">Mobile (Phones, Tablets)</option>
                            <option value="Appliances">Large Appliances</option>
                        </select>
                    </div>

                    {/* Condition */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Condition</label>
                        <select
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg"
                            value={formData.condition}
                            onChange={(e) => setFormData({ ...formData, condition: Number(e.target.value) as any })}
                        >
                            <option value={ItemCondition.Working}>Working</option>
                            <option value={ItemCondition.Damaged}>Damaged / Broken</option>
                            <option value={ItemCondition.Scrap}>Dead / Scrap</option>
                        </select>
                    </div>
                </div>

                {/* Brand & Weight */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Brand/Model</label>
                        <input
                            type="text"
                            placeholder="e.g. Dell XPS 13"
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg"
                            onChange={(e) => setFormData({ ...formData, brandAndModel: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Weight (Kg)</label>
                        <input
                            type="number"
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg"
                            value={formData.weightKg}
                            onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
                        />
                    </div>
                </div>

                {/* Address */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Pick-up Address</label>
                    <textarea
                        rows={3}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg"
                        placeholder="House #, Road #, Area..."
                        onChange={(e) => setFormData({ ...formData, pickUpAddress: e.target.value })}
                        required
                    />
                </div>

                {/* Price Card */}
                <div className="bg-green-600 p-5 rounded-xl text-white shadow-inner">
                    <span className="text-xs uppercase tracking-wider opacity-80">Instant Market Estimate</span>
                    <div className="text-4xl font-black mt-1">৳ {estimate.toLocaleString()}</div>
                    <p className="text-[10px] mt-2 opacity-70 italic">
                        * This estimate is generated via heuristic analysis and may vary upon inspection.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition-all transform active:scale-[0.98] disabled:opacity-50"
                >
                    {loading ? "Processing..." : "Submit ReClaim Request"}
                </button>
            </form>
        </div>
    );
}