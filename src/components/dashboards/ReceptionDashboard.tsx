/**
 * Reception Dashboard - Patient Management & Billing Focus
 */

import { useAuth } from '@/contexts/AuthContext';
import { getRoleDisplayName } from '@/utils/permissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, DollarSign, FileText, Plus } from 'lucide-react';

export default function ReceptionDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          Welcome, {user?.email?.split('@')[0] || 'Reception'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {getRoleDisplayName(user?.role as any)} Dashboard
        </p>
      </div>

      {/* Today's Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Patients Registered Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              +0 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Bills Generated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹0 collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Appointments Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-1">
              0 pending
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => (window.location.href = '/patients')}
          >
            <Plus className="h-6 w-6" />
            Register Patient
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => (window.location.href = '/opd')}
          >
            <Calendar className="h-6 w-6" />
            New OPD Visit
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => (window.location.href = '/billing')}
          >
            <DollarSign className="h-6 w-6" />
            Generate Bill
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col gap-2"
            onClick={() => (window.location.href = '/patients')}
          >
            <Users className="h-6 w-6" />
            Search Patient
          </Button>
        </CardContent>
      </Card>

      {/* Pending Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pending tasks</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
