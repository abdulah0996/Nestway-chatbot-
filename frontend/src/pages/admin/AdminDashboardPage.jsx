import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import AdminSettingsView from '../../components/admin/AdminSettingsView';
import OverviewView from '../../components/dashboard/OverviewView';
import LeadsView from '../../components/crm/LeadsView';
import AllCounselorsView from '../../components/admin/AllCounselorsView';
import ReportsView from '../../components/reports/ReportsView';
import MeetingsView from '../../components/meetings/MeetingsView';
import NewAppointmentView from '../../components/meetings/NewAppointmentView';
import AdminWhatsAppInboxView from '../../components/admin/AdminWhatsAppInboxView';
import ApplicationsView from '../../components/applications/ApplicationsView';
import DocumentsWorkspaceView from '../../components/documents/DocumentsWorkspaceView';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { dashboardAPI, leadAPI, meetingAPI } from '../../services/api';

export default function AdminDashboardPage() {
  const { tab, subtab } = useParams();
  const navigate = useNavigate();

  // Default to 'dashboard' (Analytics Dashboard) as requested
  const [activeTab, setActiveTab] = useState(tab || 'dashboard');
  const [stats, setStats] = useState({});
  const [leads, setLeads] = useState([]);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    }
  }, [tab]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 5000);
    window.addEventListener('focus', fetchData);
    window.addEventListener('appointments-updated', fetchData);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', fetchData);
      window.removeEventListener('appointments-updated', fetchData);
    };
  }, [tab]);

  const fetchData = async () => {
    try {
      const [sRes, lRes, mRes] = await Promise.all([
        dashboardAPI.getStats(),
        leadAPI.getLeads(),
        meetingAPI.getMeetings()
      ]);
      if (sRes.success) setStats(sRes.data);
      if (lRes.success) setLeads(lRes.data || []);
      if (mRes.success) setMeetings(mRes.data || []);
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    navigate(`/admin/${newTab}`);
  };

  const isNewAppointmentScreen =
    (activeTab === 'appointments' && (subtab === 'new' || subtab === 'create')) ||
    activeTab === 'new-appointment' ||
    tab === 'new-appointment';

  const currentSidebarTab =
    isNewAppointmentScreen ? 'appointments' : activeTab;

  return (
    <DashboardLayout activeTab={currentSidebarTab} setActiveTab={handleTabChange}>
      <ErrorBoundary title="Admin View Error" onReset={fetchData}>
        {/* New Appointment Creation Screen */}
        {isNewAppointmentScreen && <NewAppointmentView />}

        {/* 1. Analytics Dashboard */}
        {!isNewAppointmentScreen && activeTab === 'dashboard' && (
          <OverviewView
            stats={stats}
            leads={leads}
            meetings={meetings}
            onNavigate={handleTabChange}
            userName="Administrator"
          />
        )}

        {/* 2. WhatsApp CRM Inbox */}
        {!isNewAppointmentScreen &&
          (activeTab === 'inbox' || activeTab === 'whatsapp-inbox' || activeTab === 'conversations') && (
            <AdminWhatsAppInboxView />
          )}

        {/* 3. Leads CRM */}
        {!isNewAppointmentScreen && activeTab === 'leads' && <LeadsView />}

        {/* 4. Counselors Directory */}
        {!isNewAppointmentScreen && activeTab === 'counselors' && <AllCounselorsView />}

        {/* 5. Appointments / Meetings Roster */}
        {!isNewAppointmentScreen && (activeTab === 'appointments' || activeTab === 'meetings') && (
          <MeetingsView />
        )}

        {/* 6. Applications Module */}
        {!isNewAppointmentScreen && activeTab === 'applications' && <ApplicationsView />}

        {/* 7. Documents Module */}
        {!isNewAppointmentScreen && activeTab === 'documents' && <DocumentsWorkspaceView />}

        {/* 8. Reports */}
        {!isNewAppointmentScreen && activeTab === 'reports' && <ReportsView />}

        {/* 9. Settings */}
        {!isNewAppointmentScreen && activeTab === 'settings' && <AdminSettingsView />}
      </ErrorBoundary>
    </DashboardLayout>
  );
}

