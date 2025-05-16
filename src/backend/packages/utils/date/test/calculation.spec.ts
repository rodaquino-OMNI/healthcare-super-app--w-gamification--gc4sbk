/**
 * @file calculation.spec.ts
 * @description Tests for date calculation utility re-exports
 */

import { expect } from 'chai';
import * as calculationModule from '../calculation';

describe('Date Calculation Re-exports', () => {
  describe('calculateAge', () => {
    it('should be exported correctly', () => {
      expect(calculationModule.calculateAge).to.be.a('function');
    });

    it('should calculate age correctly from Date object', () => {
      const birthdate = new Date();
      birthdate.setFullYear(birthdate.getFullYear() - 30); // 30 years ago
      
      const referenceDate = new Date();
      
      expect(calculationModule.calculateAge(birthdate, referenceDate)).to.equal(30);
    });

    it('should calculate age correctly from string date', () => {
      const today = new Date();
      const year = today.getFullYear() - 25; // 25 years ago
      const month = today.getMonth() + 1;
      const day = today.getDate();
      
      const birthdate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      expect(calculationModule.calculateAge(birthdate)).to.equal(25);
    });

    it('should throw error for invalid birthdate', () => {
      expect(() => calculationModule.calculateAge('invalid date')).to.throw('Invalid birthdate provided');
    });

    it('should throw error for future birthdate', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1); // 1 year in the future
      
      expect(() => calculationModule.calculateAge(futureDate)).to.throw('Birthdate cannot be in the future');
    });
  });

  describe('getTimeAgo', () => {
    it('should be exported correctly', () => {
      expect(calculationModule.getTimeAgo).to.be.a('function');
    });

    it('should return empty string for invalid date', () => {
      expect(calculationModule.getTimeAgo('invalid date')).to.equal('');
    });

    it('should format time ago in Portuguese (pt-BR)', () => {
      const now = new Date();
      
      // Just now
      const justNow = new Date(now.getTime() - 5 * 1000); // 5 seconds ago
      expect(calculationModule.getTimeAgo(justNow, 'pt-BR')).to.equal('agora mesmo');
      
      // Seconds
      const seconds = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
      expect(calculationModule.getTimeAgo(seconds, 'pt-BR')).to.include('segundos atrás');
      
      // Minutes
      const oneMinute = new Date(now.getTime() - 60 * 1000); // 1 minute ago
      expect(calculationModule.getTimeAgo(oneMinute, 'pt-BR')).to.equal('1 minuto atrás');
      
      const minutes = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
      expect(calculationModule.getTimeAgo(minutes, 'pt-BR')).to.equal('5 minutos atrás');
      
      // Hours
      const oneHour = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      expect(calculationModule.getTimeAgo(oneHour, 'pt-BR')).to.equal('1 hora atrás');
      
      const hours = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
      expect(calculationModule.getTimeAgo(hours, 'pt-BR')).to.equal('5 horas atrás');
      
      // Future date
      const future = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour in the future
      expect(calculationModule.getTimeAgo(future, 'pt-BR')).to.equal('no futuro');
    });

    it('should format time ago in English (en-US)', () => {
      const now = new Date();
      
      // Just now
      const justNow = new Date(now.getTime() - 5 * 1000); // 5 seconds ago
      expect(calculationModule.getTimeAgo(justNow, 'en-US')).to.equal('just now');
      
      // Seconds
      const seconds = new Date(now.getTime() - 30 * 1000); // 30 seconds ago
      expect(calculationModule.getTimeAgo(seconds, 'en-US')).to.include('seconds ago');
      
      // Minutes
      const oneMinute = new Date(now.getTime() - 60 * 1000); // 1 minute ago
      expect(calculationModule.getTimeAgo(oneMinute, 'en-US')).to.equal('1 minute ago');
      
      const minutes = new Date(now.getTime() - 5 * 60 * 1000); // 5 minutes ago
      expect(calculationModule.getTimeAgo(minutes, 'en-US')).to.equal('5 minutes ago');
      
      // Hours
      const oneHour = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
      expect(calculationModule.getTimeAgo(oneHour, 'en-US')).to.equal('1 hour ago');
      
      const hours = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
      expect(calculationModule.getTimeAgo(hours, 'en-US')).to.equal('5 hours ago');
      
      // Future date
      const future = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour in the future
      expect(calculationModule.getTimeAgo(future, 'en-US')).to.equal('in the future');
    });

    it('should handle days, weeks, months and years correctly', () => {
      const now = new Date();
      
      // Days
      const oneDay = new Date(now);
      oneDay.setDate(oneDay.getDate() - 1); // 1 day ago
      expect(calculationModule.getTimeAgo(oneDay, 'en-US')).to.equal('1 day ago');
      
      const days = new Date(now);
      days.setDate(days.getDate() - 5); // 5 days ago
      expect(calculationModule.getTimeAgo(days, 'en-US')).to.equal('5 days ago');
      
      // Weeks
      const oneWeek = new Date(now);
      oneWeek.setDate(oneWeek.getDate() - 7); // 1 week ago
      expect(calculationModule.getTimeAgo(oneWeek, 'en-US')).to.equal('1 week ago');
      
      const weeks = new Date(now);
      weeks.setDate(weeks.getDate() - 21); // 3 weeks ago
      expect(calculationModule.getTimeAgo(weeks, 'en-US')).to.equal('3 weeks ago');
      
      // Months
      const oneMonth = new Date(now);
      oneMonth.setMonth(oneMonth.getMonth() - 1); // 1 month ago
      expect(calculationModule.getTimeAgo(oneMonth, 'en-US')).to.equal('1 month ago');
      
      const months = new Date(now);
      months.setMonth(months.getMonth() - 6); // 6 months ago
      expect(calculationModule.getTimeAgo(months, 'en-US')).to.equal('6 months ago');
      
      // Years
      const oneYear = new Date(now);
      oneYear.setFullYear(oneYear.getFullYear() - 1); // 1 year ago
      expect(calculationModule.getTimeAgo(oneYear, 'en-US')).to.equal('1 year ago');
      
      const years = new Date(now);
      years.setFullYear(years.getFullYear() - 5); // 5 years ago
      expect(calculationModule.getTimeAgo(years, 'en-US')).to.equal('5 years ago');
    });
  });
});