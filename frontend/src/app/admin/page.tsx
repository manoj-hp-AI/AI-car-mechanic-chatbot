import { Metadata } from 'next';
import { Navbar } from '@/components/layout/Navbar';
import { AuthModal } from '@/components/auth/AuthModal';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Operations Dashboard | AutoFix AI',
  description: 'Privacy-safe operational metrics, diagnostic volume, and repair dispatch analytics.',
};

export default function AdminPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flex: 1 }}>
        <AdminDashboard />
      </div>
      <AuthModal />
    </main>
  );
}
