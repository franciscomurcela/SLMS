import { describe, it, expect } from 'vitest';
import Header from '../components/Header';

describe('Header Component', () => {
  it('importa o componente Header com sucesso', () => {
    // Verifica se o componente foi importado
    expect(Header).toBeDefined();
    expect(typeof Header).toBe('function');
  });

  it('componente Header é uma função React válida', () => {
    // Verifica se é um componente React válido
    expect(Header).toBeInstanceOf(Function);
  });
});
