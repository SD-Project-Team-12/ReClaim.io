import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { CreateRequestForm } from '../components/Recycling/CreateRequestForm';
import {type RecyclingRequestResponse } from '../types/recycling';
import { RequestCard } from '../components/Recycling/RequestCard';

export const DashboardPage: React.FC = () => {
  const { getToken } = useAuth();
  const [myRequests, setMyRequests] = useState<RecyclingRequestResponse[]>([]);

  const fetchMyRequests = async () => {
    try {
      const token = await getToken();
      const res = await fetch('http://localhost:5150/api/RecyclingRequests/my-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyRequests(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  return (
    <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-10">
      {/* বাম পাশ: নতুন রিকোয়েস্ট তৈরি */}
      <div className="lg:w-1/3">
        <CreateRequestForm />
        <button 
          onClick={fetchMyRequests} 
          className="mt-4 text-sm text-green-600 underline w-full text-center"
        >
          Refresh List
        </button>
      </div>

      {/* ডান পাশ: নিজের রিকোয়েস্টের লিস্ট */}
      <div className="lg:w-2/3 mt-10 lg:mt-0">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">My Postings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myRequests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
          {myRequests.length === 0 && (
            <div className="col-span-2 text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
              <p className="text-gray-500">You haven't posted anything yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};