import { describe, it, expect } from 'vitest';

describe('Utility Functions', () => {
  describe('String manipulation', () => {
    it('valida formato de email', () => {
      const validateEmail = (email: string) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
      };

      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
    });

    it('formata nomes corretamente', () => {
      const capitalizeFirstLetter = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      };

      expect(capitalizeFirstLetter('joão')).toBe('João');
      expect(capitalizeFirstLetter('MARIA')).toBe('Maria');
      expect(capitalizeFirstLetter('pedro')).toBe('Pedro');
    });
  });

  describe('Number formatting', () => {
    it('formata peso com 2 casas decimais', () => {
      const formatWeight = (weight: number) => {
        return `${weight.toFixed(2)} kg`;
      };

      expect(formatWeight(2.5)).toBe('2.50 kg');
      expect(formatWeight(10)).toBe('10.00 kg');
      expect(formatWeight(0.5)).toBe('0.50 kg');
    });

    it('formata valores monetários', () => {
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-PT', {
          style: 'currency',
          currency: 'EUR',
        }).format(value);
      };

      const result1 = formatCurrency(10);
      const result2 = formatCurrency(99.99);
      
      // Verifica se contém o valor e o símbolo da moeda
      expect(result1).toContain('10');
      expect(result1).toContain('€');
      expect(result2).toContain('99');
      expect(result2).toContain('€');
    });
  });

  describe('Date operations', () => {
    it('verifica se uma data é válida', () => {
      const isValidDate = (dateString: string) => {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
      };

      expect(isValidDate('2025-10-29T10:00:00Z')).toBe(true);
      expect(isValidDate('invalid-date')).toBe(false);
      expect(isValidDate('2025-13-32')).toBe(false);
    });
  });
});
