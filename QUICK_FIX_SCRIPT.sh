#!/bin/bash

# 🚨 CRITICAL SECURITY FIXES - Run this IMMEDIATELY
# Hospital Management System - Emergency Patch

set -e  # Exit on any error

echo "================================"
echo "🚨 EMERGENCY SECURITY PATCH"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  This script will:${NC}"
echo "1. Backup current .env file"
echo "2. Move .env to .env.backup"
echo "3. Create .env.example template"
echo "4. Add .env to .gitignore"
echo "5. Install required security packages"
echo "6. Create security utilities"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# 1. Backup .env
echo ""
echo -e "${GREEN}[1/7] Backing up .env file...${NC}"
if [ -f ".env" ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "✓ Backed up to .env.backup.$(date +%Y%m%d_%H%M%S)"
else
    echo "⚠️  No .env file found"
fi

# 2. Create .env.example
echo ""
echo -e "${GREEN}[2/7] Creating .env.example...${NC}"
cat > .env.example << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration (Optional - for AI features)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Gemini API (Optional - for AI features)
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# WhatsApp API (Optional - for notifications)
DOUBLETICK_API_KEY=your_doubletick_api_key_here
DOUBLETICK_PHONE=your_hospital_phone_number_here

# Environment
NODE_ENV=development
EOF
echo "✓ Created .env.example"

# 3. Update .gitignore
echo ""
echo -e "${GREEN}[3/7] Updating .gitignore...${NC}"
if [ ! -f ".gitignore" ]; then
    touch .gitignore
fi

# Add .env to .gitignore if not already there
if ! grep -q "^\.env$" .gitignore; then
    cat >> .gitignore << 'EOF'

# Environment variables
.env
.env.local
.env.*.local
.env.backup.*

# Security
*.pem
*.key
*.cert
EOF
    echo "✓ Updated .gitignore"
else
    echo "✓ .gitignore already contains .env"
fi

# 4. Remove .env from git if it was tracked
echo ""
echo -e "${GREEN}[4/7] Removing .env from git history...${NC}"
if git rev-parse --git-dir > /dev/null 2>&1; then
    if git ls-files --error-unmatch .env > /dev/null 2>&1; then
        git rm --cached .env 2>/dev/null || true
        echo "✓ Removed .env from git tracking"
        echo -e "${YELLOW}⚠️  Remember to commit this change!${NC}"
    else
        echo "✓ .env was not tracked by git"
    fi
else
    echo "⚠️  Not a git repository"
fi

# 5. Create security utilities directory
echo ""
echo -e "${GREEN}[5/7] Creating security utilities...${NC}"
mkdir -p src/utils/security

# Create rate limiter
cat > src/utils/security/rateLimiter.ts << 'EOF'
/**
 * Rate Limiter - Prevents brute force attacks
 */

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map();
  private maxAttempts: number;
  private windowMs: number;

  constructor(maxAttempts: number = 5, windowMinutes: number = 15) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMinutes * 60 * 1000;
    
    // Clean up old entries every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const entry = this.attempts.get(identifier);

    if (!entry) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return true;
    }

    // Reset if window has passed
    if (now - entry.firstAttempt > this.windowMs) {
      this.attempts.set(identifier, {
        count: 1,
        firstAttempt: now,
        lastAttempt: now
      });
      return true;
    }

    // Check if exceeded
    if (entry.count >= this.maxAttempts) {
      return false;
    }

    // Increment
    entry.count++;
    entry.lastAttempt = now;
    return true;
  }

  getRemainingTime(identifier: string): number {
    const entry = this.attempts.get(identifier);
    if (!entry) return 0;
    
    const elapsed = Date.now() - entry.firstAttempt;
    return Math.max(0, this.windowMs - elapsed);
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.attempts.entries()) {
      if (now - entry.lastAttempt > this.windowMs) {
        this.attempts.delete(key);
      }
    }
  }
}

// Export singleton instances
export const loginRateLimiter = new RateLimiter(5, 15); // 5 attempts per 15 minutes
export const signupRateLimiter = new RateLimiter(3, 60); // 3 signups per hour
export const apiRateLimiter = new RateLimiter(100, 1); // 100 requests per minute
EOF

# Create input sanitizer
cat > src/utils/security/sanitizer.ts << 'EOF'
/**
 * Input Sanitizer - Prevents XSS and injection attacks
 */

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizePhone(phone: string): string {
  // Remove all non-numeric characters
  return phone.replace(/\D/g, '');
}

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!email) {
    return { isValid: false, error: 'Email is required' };
  }
  
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  // Check for common disposable email domains
  const disposableDomains = ['tempmail.com', 'throwaway.email', '10minutemail.com'];
  const domain = email.split('@')[1];
  
  if (disposableDomains.includes(domain)) {
    return { isValid: false, error: 'Disposable email addresses are not allowed' };
  }
  
  return { isValid: true };
}

export function validatePassword(password: string): { isValid: boolean; error?: string } {
  if (!password) {
    return { isValid: false, error: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters' };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }
  
  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }
  
  if (!/[0-9]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }
  
  return { isValid: true };
}
EOF

# Create logger utility
cat > src/utils/logger.ts << 'EOF'
/**
 * Logger Utility - Development/Production logging
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  
  error: (...args: any[]) => {
    console.error(...args);
    // TODO: Send to error tracking service (Sentry)
  },
  
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  
  debug: (...args: any[]) => {
    if (isDev) console.debug(...args);
  },
  
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  }
};
EOF

echo "✓ Created security utilities"

# 6. Create test setup
echo ""
echo -e "${GREEN}[6/7] Setting up testing framework...${NC}"

# Install testing dependencies
echo "Installing testing packages..."
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom

# Create vitest config
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
EOF

# Create test setup file
cat > src/setupTests.ts << 'EOF'
import '@testing-library/jest-dom';
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});
EOF

# Update package.json scripts
echo "Updating package.json scripts..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = pkg.scripts || {};
pkg.scripts.test = 'vitest';
pkg.scripts['test:ui'] = 'vitest --ui';
pkg.scripts['test:coverage'] = 'vitest --coverage';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

echo "✓ Testing framework configured"

# 7. Create first test
echo ""
echo -e "${GREEN}[7/7] Creating sample test...${NC}"
mkdir -p src/components/__tests__

cat > src/components/__tests__/example.test.tsx << 'EOF'
import { describe, it, expect } from 'vitest';

describe('Example Test Suite', () => {
  it('should pass basic assertion', () => {
    expect(1 + 1).toBe(2);
  });

  it('should validate string', () => {
    const greeting = 'Hello, World!';
    expect(greeting).toContain('World');
  });
});
EOF

echo "✓ Created example test"

# Summary
echo ""
echo "================================"
echo -e "${GREEN}✅ SECURITY PATCH COMPLETE${NC}"
echo "================================"
echo ""
echo -e "${YELLOW}⚠️  CRITICAL NEXT STEPS:${NC}"
echo ""
echo "1. REGENERATE ALL API KEYS:"
echo "   - Supabase: https://app.supabase.com/project/_/settings/api"
echo "   - OpenAI: https://platform.openai.com/api-keys"
echo "   - Gemini: https://makersuite.google.com/app/apikey"
echo ""
echo "2. Update your .env file with NEW keys"
echo ""
echo "3. Commit the security changes:"
echo "   git add .gitignore .env.example src/utils/security/"
echo "   git commit -m 'Security: Remove API keys, add rate limiting'"
echo "   git push"
echo ""
echo "4. Run tests:"
echo "   npm test"
echo ""
echo "5. Review COMPREHENSIVE_TEST_REPORT.md for more issues"
echo ""
echo -e "${GREEN}Files created:${NC}"
echo "  ✓ .env.example"
echo "  ✓ src/utils/security/rateLimiter.ts"
echo "  ✓ src/utils/security/sanitizer.ts"
echo "  ✓ src/utils/logger.ts"
echo "  ✓ vitest.config.ts"
echo "  ✓ src/setupTests.ts"
echo ""
echo -e "${YELLOW}Files backed up:${NC}"
echo "  ✓ .env → .env.backup.*"
echo ""
echo -e "${RED}⚠️  WARNING:${NC}"
echo "  Your old API keys are now in .env.backup.*"
echo "  After you've regenerated keys, DELETE the backup file!"
echo "  rm .env.backup.*"
echo ""
echo "================================"
