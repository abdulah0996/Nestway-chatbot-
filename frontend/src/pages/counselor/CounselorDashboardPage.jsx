import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CounselorDashboardPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/admin/inbox', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#071A33] text-white text-xs font-bold font-sans">
      Redirecting to WhatsApp CRM Inbox...
    </div>
  );
}
