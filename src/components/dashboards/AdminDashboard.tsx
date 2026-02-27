/**
 * Admin Dashboard - Full Hospital Access
 */

import { ProtectedSection } from '../ProtectedSection';
import { StatisticsCards } from '../StatisticsCards';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleDisplayName } from '@/utils/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, TestTube, Pill, DollarSign, Calendar } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.email?.split('@')[0] || 'Admin'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {getRoleDisplayName(user?.role as any)} Dashboard
        </p>
      </div>

      {/* Statistics - Admin sees everything */}
      <ProtectedSection module="dashboard" action="read">
        <StatisticsCards />
      </ProtectedSection>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProtectedSection module="patients">
          <QuickAccessCard
            icon={Users}
            title="Patient Management"
            description="Register & manage patients"
            href="/patients"
            color="bg-blue-500"
          />
        </ProtectedSection>

        <ProtectedSection module="opd">
          <QuickAccessCard
            icon={Calendar}
            title="OPD Management"
            description="Outpatient department"
            href="/opd"
            color="bg-green-500"
          />
        </ProtectedSection>

        <ProtectedSection module="ipd">
          <QuickAccessCard
            icon={Activity}
            title="IPD Management"
            description="Inpatient department"
            href="/ipd"
            color="bg-purple-500"
          />
        </ProtectedSection>

        <ProtectedSection module="lab">
          <QuickAccessCard
            icon={TestTube}
            title="Laboratory"
            description="Lab tests & reports"
            href="/lab"
            color="bg-yellow-500"
          />
        </ProtectedSection>

        <ProtectedSection module="pharmacy">
          <QuickAccessCard
            icon={Pill}
            title="Pharmacy"
            description="Medicine & inventory"
            href="/pharmacy"
            color="bg-orange-500"
          />
        </ProtectedSection>

        <ProtectedSection module="billing">
          <QuickAccessCard
            icon={DollarSign}
            title="Billing"
            description="Invoices & payments"
            href="/billing"
            color="bg-teal-500"
          />
        </ProtectedSection>
      </div>

      {/* Recent Activity - Admin only */}
      <ProtectedSection module="reports" action="read">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Recent hospital activity and updates will appear here
            </p>
          </CardContent>
        </Card>
      </ProtectedSection>
    </div>
  );
}

function QuickAccessCard({
  icon: Icon,
  title,
  description,
  href,
  color,
}: {
  icon: any;
  title: string;
  description: string;
  href: string;
  color: string;
}) {
  return (
    <a href={href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className={`${color} p-3 rounded-lg text-white`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}
