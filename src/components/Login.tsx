import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HospitalType } from '@/types/hospital';

interface LoginProps {
  onLogin: (credentials: { username: string; password: string; hospitalType: HospitalType }) => void;
  onBackToHome?: () => void;
  onHospitalSelect?: () => void;
  hospitalType?: HospitalType;
  hospitalName?: string;
  hospitalPrimaryColor?: string;
}

const Login = ({ 
  onLogin, 
  onBackToHome, 
  onHospitalSelect,
  hospitalType = 'hope',
  hospitalName = 'Hope Multi-Specialty Hospital',
  hospitalPrimaryColor = '#059669'
}: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ username, password, hospitalType });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {onBackToHome && (
        <Button
          onClick={onBackToHome}
          variant="ghost"
          className="absolute top-4 left-4 text-gray-600 hover:text-gray-900"
        >
          ← Back to Home
        </Button>
      )}
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center text-white text-xl font-bold"
               style={{ backgroundColor: hospitalPrimaryColor }}>
            {hospitalName.charAt(0)}
          </div>
          <CardTitle style={{ color: hospitalPrimaryColor }}>{hospitalName}</CardTitle>
          <CardDescription>Please sign in to continue</CardDescription>
          {onHospitalSelect && (
            <Button
              variant="link"
              size="sm"
              onClick={onHospitalSelect}
              className="text-xs text-muted-foreground underline"
            >
              Change Hospital
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full text-white hover:opacity-90"
              style={{ backgroundColor: hospitalPrimaryColor }}
            >
              Sign In to {hospitalName}
            </Button>
          </form>

        </CardContent>
      </Card>
    </div>
  );
};

export default Login;