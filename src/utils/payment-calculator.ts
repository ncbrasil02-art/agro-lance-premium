
export interface Installment {
  installment_number: number;
  amount: number;
  due_date: Date;
  status?: string;
  proof_url?: string;
}

/**
 * Parses a formula like "2+2+3+30" and generates installments.
 * Formula interpretation:
 * - Each part before the last one is a multiplier for a single month.
 * - The last part is the number of standard (1x bid) installments.
 * 
 * Example "2+2+3+30" with bid 40:
 * Month 1: 2 * 40 = 80
 * Month 2: 2 * 40 = 80
 * Month 3: 3 * 40 = 120
 * Month 4-33: 30 installments of 40.
 */
export function calculateInstallments(bidAmount: number, formula: string, startDate: Date = new Date()): Installment[] {
  if (!formula) return [{ installment_number: 1, amount: bidAmount, due_date: startDate }];

  const parts = formula.split('+').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
  if (parts.length === 0) return [{ installment_number: 1, amount: bidAmount, due_date: startDate }];

  const installments: Installment[] = [];
  let currentDate = new Date(startDate);

  // Handle initial special installments (all parts except the last one)
  for (let i = 0; i < parts.length - 1; i++) {
    installments.push({
      installment_number: i + 1,
      amount: bidAmount * parts[i],
      due_date: new Date(currentDate)
    });
    // Move to next month
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  // Handle the remaining standard installments (the last part)
  const remainingCount = parts[parts.length - 1];
  const startNumber = installments.length + 1;

  for (let i = 0; i < remainingCount; i++) {
    installments.push({
      installment_number: startNumber + i,
      amount: bidAmount,
      due_date: new Date(currentDate)
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return installments;
}

/**
 * Calculates the total number of physical months/slips
 */
export function getTotalInstallmentsCount(formula: string): number {
  if (!formula) return 1;
  const parts = formula.split('+').map(p => parseInt(p.trim())).filter(p => !isNaN(p));
  if (parts.length === 0) return 1;
  
  // Number of months is (parts.length - 1) + last part
  return (parts.length - 1) + parts[parts.length - 1];
}