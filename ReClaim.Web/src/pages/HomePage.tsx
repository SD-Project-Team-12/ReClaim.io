import React, { useEffect, useState } from 'react';
import {type RecyclingRequestResponse } from '../types/recycling';
import { RequestCard } from '../components/Recycling/RequestCard';

export const HomePage: React.FC = () => {
  const [requests, setRequests] = useState<RecyclingRequestResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5150/api/RecyclingRequests/all')
      .then((res) => res.json())
      .then((data) => {
        setRequests(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Global Recycling Feed</h2>
      <p className="text-gray-600 mb-8">See what materials people are offering around you.</p>

      {loading ? (
        <p className="text-center text-gray-500">Loading requests...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
          {requests.length === 0 && <p>No recycling requests found yet.</p>}
        </div>
      )}
    </div>
  );
};