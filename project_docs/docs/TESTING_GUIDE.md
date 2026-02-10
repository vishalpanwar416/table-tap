# 🧪 Testing Infrastructure - Table Tap

## Overview
Comprehensive testing strategy using Jest for unit/integration tests and Playwright for end-to-end tests.

---

## 📋 Testing Stack

| Tool | Purpose | Level |
|------|---------|-------|
| **Jest** | Test runner | Unit + Integration |
| **React Testing Library** | Component testing | Unit + Integration |
| **Playwright** | Browser automation | E2E |
| **@testing-library/user-event** | User interaction simulation | Integration |
| **@testing-library/jest-dom** | Custom matchers | Unit |

---

## 🚀 Setup Instructions

### 1. Install Dependencies

Already installed via npm:
```bash
# Unit/Integration Testing
npm install --save-dev @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom

# E2E Testing
npm install --save-dev @playwright/test
npx playwright install
```

### 2. Configure Jest

Create `jest.config.js` in `table-tap-app/`:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
```

### 3. Update package.json Scripts

Add to `table-tap-app/package.json`:
```json
{
  "scripts": {
    "test": "react-scripts test",
    "test:ci": "CI=true react-scripts test --coverage",
    "test:watch": "react-scripts test --watch",
    "test:coverage": "react-scripts test --coverage --watchAll=false",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

## 📝 Writing Tests

### Unit Tests (Components)

**Example: Testing a Button Component**

```javascript
// src/components/Button.test.js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByText('Click me')).toBeDisabled();
  });
});
```

### Integration Tests (Pages)

**Example: Testing Login Flow**

```javascript
// src/modules/shared/components/auth/LoginPage.test.js
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import * as supabase from '../../../supabase';

// Mock Supabase
jest.mock('../../../supabase');

describe('LoginPage', () => {
  it('allows user to login with Google', async () => {
    const user = userEvent.setup();
    const mockSignIn = jest.fn().mockResolvedValue({ error: null });
    supabase.signInWithGoogle = mockSignIn;

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const googleButton = screen.getByText(/sign in with google/i);
    await user.click(googleButton);

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();
    const mockSignIn = jest.fn().mockResolvedValue({
      error: { message: 'Invalid credentials' }
    });
    supabase.signInWithGoogle = mockSignIn;

    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>
    );

    const googleButton = screen.getByText(/sign in with google/i);
    await user.click(googleButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});
```

### Service Tests (API)

**Example: Testing Payment Service**

```javascript
// src/modules/customer/api/paymentService.test.js
import { createRazorpayOrder, verifyPayment } from './paymentService';
import { supabase } from '../../../supabase';

jest.mock('../../../supabase');

describe('Payment Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRazorpayOrder', () => {
    it('creates order successfully', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: { orderId: 'order_123', amount: 1000 },
        error: null,
      });
      supabase.functions.invoke = mockInvoke;

      const result = await createRazorpayOrder(1000, 'INR');

      expect(mockInvoke).toHaveBeenCalledWith('get-payment-config', {
        body: { amount: 1000, currency: 'INR' },
      });
      expect(result.orderId).toBe('order_123');
    });

    it('throws error on failure', async () => {
      const mockInvoke = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Payment failed' },
      });
      supabase.functions.invoke = mockInvoke;

      await expect(createRazorpayOrder(1000, 'INR')).rejects.toThrow('Payment failed');
    });
  });
});
```

---

## 🎭 E2E Tests with Playwright

### Configuration

Create `playwright.config.js` in `table-tap-app/`:
```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Example E2E Test

Create `e2e/customer-ordering.spec.js`:
```javascript
import { test, expect } from '@playwright/test';

test.describe('Customer Ordering Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to customer app
    await page.goto('http://app.localhost:3000/restaurant/test-restaurant');
  });

  test('customer can browse menu and add items to cart', async ({ page }) => {
    // Wait for menu to load
    await expect(page.getByText('Menu')).toBeVisible();

    // Click on a food item
    await page.getByText('Margherita Pizza').click();

    // Add to cart
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    // Verify cart count
    await expect(page.getByTestId('cart-count')).toHaveText('1');
  });

  test('customer can complete checkout', async ({ page }) => {
    // Add item to cart
    await page.getByText('Margherita Pizza').click();
    await page.getByRole('button', { name: 'Add to Cart' }).click();

    // Go to cart
    await page.getByTestId('cart-button').click();

    // Fill customer details
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Phone').fill('9876543210');
    await page.getByLabel('Table Number').fill('5');

    // Proceed to payment
    await page.getByRole('button', { name: 'Proceed to Payment' }).click();

    // Verify payment page
    await expect(page).toHaveURL(/.*payment.*/);
  });

  test('customer can search for items', async ({ page }) => {
    // Use search
    await page.getByPlaceholder('Search menu...').fill('pizza');

    // Verify filtered results
    await expect(page.getByText('Margherita Pizza')).toBeVisible();
    await expect(page.getByText('Burger')).not.toBeVisible();
  });
});
```

---

## 🎯 Testing Best Practices

### 1. Test Structure (AAA Pattern)

```javascript
test('description', () => {
  // Arrange - Set up test data
  const user = { name: 'John', role: 'customer' };
  
  // Act - Perform action
  const result = getUserRole(user);
  
  // Assert - Verify result
  expect(result).toBe('customer');
});
```

### 2. Use Data-TestId for Stable Selectors

```jsx
// In component
<button data-testid="submit-button">Submit</button>

// In test
screen.getByTestId('submit-button');
```

### 3. Mock External Dependencies

```javascript
// Mock Supabase
jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}));
```

### 4. Test User Interactions, Not Implementation

```javascript
// ❌ Bad - Testing implementation
expect(component.state.isOpen).toBe(true);

// ✅ Good - Testing user-visible behavior
expect(screen.getByText('Modal Content')).toBeVisible();
```

---

## 📊 Coverage Goals

| Category | Target Coverage |
|----------|----------------|
| **Critical Paths** | 90%+ |
| **Business Logic** | 80%+ |
| **UI Components** | 70%+ |
| **Utilities** | 90%+ |
| **Overall** | 75%+ |

### Critical Paths to Test
1. ✅ User authentication (login/logout)
2. ✅ Order placement flow
3. ✅ Payment processing
4. ✅ Menu browsing and search
5. ✅ Cart management
6. ✅ Restaurant dashboard (order management)
7. ✅ Admin panel (restaurant CRUD)

---

## 🚀 Running Tests

### Unit/Integration Tests

```bash
# Run all tests
npm test

# Run tests in CI mode with coverage
npm run test:ci

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:ci
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Last Updated**: February 11, 2026  
**Contact**: tabletap416@gmail.com
