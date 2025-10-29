// Exemplo de teste unitário para React
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

test('renderiza título principal', () => {
  render(<App />);
  expect(screen.getByText(/shipping/i)).toBeInTheDocument();
});
