import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();

  const handleInputChange = (field: keyof LoginFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const success = await login({
        email: formData.email,
        password: formData.password
      });

      if (!success) {
        setError('Invalid email or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Sign in to access hospital management system
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>

          {/* Quick Login - Development Only */}
          {import.meta.env.DEV && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500 mb-3">
                🧪 Quick Test Login (Dev Only)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      email: 'admin@hopehospital.com',
                      password: 'Admin@Hope123'
                    });
                  }}
                  className="text-xs"
                >
                  🟢 Admin
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      email: 'reception1@hopehospital.com',
                      password: 'Reception@123'
                    });
                  }}
                  className="text-xs"
                >
                  🔵 Reception
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      email: 'lab@hopehospital.com',
                      password: 'Lab@Hope123'
                    });
                  }}
                  className="text-xs"
                >
                  🟡 Lab
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      email: 'pharmacy@hopehospital.com',
                      password: 'Pharma@Hope123'
                    });
                  }}
                  className="text-xs"
                >
                  🟠 Pharmacy
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      email: 'doctor1@hopehospital.com',
                      password: 'Doctor@Hope123'
                    });
                  }}
                  className="text-xs"
                >
                  🩺 Doctor
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFormData({
                      email: 'superadmin@yourapp.com',
                      password: 'SuperAdmin@123'
                    });
                  }}
                  className="text-xs"
                >
                  🔴 Super Admin
                </Button>
              </div>
              <p className="text-xs text-center text-gray-400 mt-2">
                Click button to auto-fill credentials
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;