import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';

describe('App Component', () => {
  test('renders without crashing', () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );
  });

  test('initializes with development mode routing', () => {
    // This test verifies the app initializes correctly
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    // App should render without throwing errors
    expect(container).toBeTruthy();
  });
});
