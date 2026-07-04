import dayjs from 'dayjs';
import type { AppData, Client, Loan, LoanProduct, Repayment, Branch } from '../types';
import { buildSchedule, refreshRepaymentStatus, installmentAmount, round2 } from '../lib/loan';

const iso = (d: dayjs.Dayjs) => d.toISOString();
const today = dayjs();

const branches: Branch[] = [
  { id: 'br-1', name: 'Main — Quezon City', address: '128 Kalayaan Ave, Diliman, QC' },
  { id: 'br-2', name: 'Caloocan', address: '7 Samson Rd, Caloocan City' },
  { id: 'br-3', name: 'Pasig', address: '54 C. Raymundo Ave, Pasig City' },
];

const products: LoanProduct[] = [
  { id: 'p-sari', name: 'Sari-Sari Starter', monthlyRate: 0.03, termMonths: 4, minAmount: 3000, maxAmount: 25000, frequency: 'weekly', active: true },
  { id: 'p-micro', name: 'Micro-Business Loan', monthlyRate: 0.035, termMonths: 6, minAmount: 10000, maxAmount: 80000, frequency: 'biweekly', active: true },
  { id: 'p-agri', name: 'Agri-Livelihood', monthlyRate: 0.025, termMonths: 12, minAmount: 20000, maxAmount: 150000, frequency: 'monthly', active: true },
  { id: 'p-emer', name: 'Emergency Cash', monthlyRate: 0.05, termMonths: 3, minAmount: 2000, maxAmount: 15000, frequency: 'weekly', active: true },
];

const officers = ['Grace Domingo', 'Mark Villanueva', 'Liza Santos', 'Ronnie Cruz'];

const clientSeed: Omit<Client, 'id' | 'createdAt'>[] = [
  { firstName: 'Maria', lastName: 'Dela Cruz', phone: '0917 555 0132', email: 'maria.delacruz@gmail.com', address: '24 Mabini St', city: 'Quezon City', businessType: 'Sari-sari store', idType: "PhilID", idNumber: '1234-5678-9012', status: 'active', creditScore: 742, branch: 'br-1' },
  { firstName: 'Jose', lastName: 'Ramos', phone: '0918 222 4471', email: 'jose.ramos@gmail.com', address: '9 Rizal Ext', city: 'Caloocan', businessType: 'Tricycle operator', idType: "Driver's License", idNumber: 'D12-34-567890', status: 'active', creditScore: 688, branch: 'br-2' },
  { firstName: 'Elena', lastName: 'Bautista', phone: '0920 118 9930', email: 'elena.b@gmail.com', address: '77 Bonifacio Ave', city: 'Pasig', businessType: 'Carinderia', idType: 'SSS', idNumber: '34-1122334-5', status: 'active', creditScore: 715, branch: 'br-3' },
  { firstName: 'Roberto', lastName: 'Aquino', phone: '0921 774 2210', address: '5 Sampaguita St', city: 'Quezon City', businessType: 'Vegetable vendor', idType: "PhilID", idNumber: '2233-4455-6677', status: 'active', creditScore: 604, branch: 'br-1' },
  { firstName: 'Divina', lastName: 'Gonzales', phone: '0917 900 1188', email: 'divina.g@gmail.com', address: '31 Ilang-Ilang St', city: 'Pasig', businessType: 'Beauty parlor', idType: 'UMID', idNumber: '0111-2223334-5', status: 'active', creditScore: 771, branch: 'br-3' },
  { firstName: 'Fernando', lastName: 'Reyes', phone: '0999 445 6677', address: '18 Katipunan Rd', city: 'Quezon City', businessType: 'Farming (rice)', idType: "PhilID", idNumber: '3344-5566-7788', status: 'active', creditScore: 659, branch: 'br-1' },
  { firstName: 'Cristina', lastName: 'Flores', phone: '0916 233 1120', email: 'cristina.flores@gmail.com', address: '42 Aguinaldo St', city: 'Caloocan', businessType: 'RTW clothing', idType: 'Passport', idNumber: 'P1234567A', status: 'active', creditScore: 698, branch: 'br-2' },
  { firstName: 'Antonio', lastName: 'Mendoza', phone: '0905 667 8890', address: '63 Del Pilar St', city: 'Pasig', businessType: 'Repair shop', idType: 'SSS', idNumber: '02-9988776-1', status: 'active', creditScore: 552, branch: 'br-3' },
  { firstName: 'Rosario', lastName: 'Castillo', phone: '0927 100 3345', email: 'rosa.castillo@gmail.com', address: '8 Malvar St', city: 'Quezon City', businessType: 'Bakery', idType: "PhilID", idNumber: '4455-6677-8899', status: 'active', creditScore: 733, branch: 'br-1' },
  { firstName: 'Danilo', lastName: 'Navarro', phone: '0939 552 8811', address: '90 Quirino Hwy', city: 'Caloocan', businessType: 'Poultry raising', idType: "Driver's License", idNumber: 'N09-87-654321', status: 'inactive', creditScore: 611, branch: 'br-2' },
  { firstName: 'Teresita', lastName: 'Salvador', phone: '0918 334 5567', email: 'tess.salvador@gmail.com', address: '12 Luna St', city: 'Pasig', businessType: 'Water refilling station', idType: 'UMID', idNumber: '0222-3334445-6', status: 'active', creditScore: 705, branch: 'br-3' },
  { firstName: 'Ricardo', lastName: 'Domingo', phone: '0908 221 7789', address: '3 Bayani Rd', city: 'Quezon City', businessType: 'Fish vendor', idType: 'SSS', idNumber: '33-4455667-8', status: 'blacklisted', creditScore: 498, branch: 'br-1' },
  { firstName: 'Angelica', lastName: 'Torres', phone: '0917 660 2231', email: 'angelica.torres@gmail.com', address: '55 Dahlia St', city: 'Caloocan', businessType: 'Online reseller', idType: "PhilID", idNumber: '5566-7788-9900', status: 'active', creditScore: 724, branch: 'br-2' },
  { firstName: 'Manuel', lastName: 'Pascual', phone: '0995 447 1123', address: '21 Maharlika St', city: 'Pasig', businessType: 'Junk shop', idType: 'Passport', idNumber: 'P7654321B', status: 'active', creditScore: 641, branch: 'br-3' },
];

const clients: Client[] = clientSeed.map((c, i) => ({
  ...c,
  id: `c-${i + 1}`,
  createdAt: iso(today.subtract(120 - i * 6, 'day')),
}));

// Loan definitions: [clientIdx, productId, principal, purpose, monthsAgoDisbursed, status]
type LoanSpec = [number, string, number, string, number, Loan['status']];
const loanSpecs: LoanSpec[] = [
  [0, 'p-sari', 20000, 'Restock store inventory', 2, 'active'],
  [1, 'p-micro', 45000, 'Buy second tricycle unit', 3, 'active'],
  [2, 'p-sari', 15000, 'Kitchen equipment', 1, 'active'],
  [3, 'p-emer', 8000, 'Medical emergency', 1, 'overdue'],
  [4, 'p-agri', 90000, 'Seeds and fertilizer', 5, 'active'],
  [5, 'p-agri', 60000, 'Irrigation pump', 4, 'active'],
  [6, 'p-micro', 30000, 'Additional stock', 2, 'active'],
  [7, 'p-emer', 12000, 'Roof repair', 2, 'overdue'],
  [8, 'p-micro', 50000, 'New oven', 6, 'paid'],
  [10, 'p-micro', 40000, 'Delivery motorcycle', 3, 'active'],
  [12, 'p-sari', 18000, 'Product inventory', 1, 'active'],
  [13, 'p-emer', 10000, 'Tuition fees', 3, 'overdue'],
  [0, 'p-emer', 5000, 'Short-term cash', 8, 'paid'],
  [4, 'p-sari', 12000, 'Small store add-on', 10, 'paid'],
  [11, 'p-emer', 6000, 'Cash advance', 1, 'defaulted'],
];

const loans: Loan[] = [];
const repayments: Repayment[] = [];

loanSpecs.forEach((spec, idx) => {
  const [clientIdx, productId, principal, purpose, monthsAgo, status] = spec;
  const product = products.find((p) => p.id === productId)!;
  const disburse = today.subtract(monthsAgo, 'month');
  const loan: Loan = {
    id: `l-${idx + 1}`,
    clientId: clients[clientIdx].id,
    productId,
    principal,
    monthlyRate: product.monthlyRate,
    termMonths: product.termMonths,
    frequency: product.frequency,
    status,
    purpose,
    applicationDate: iso(disburse.subtract(5, 'day')),
    disbursementDate: iso(disburse),
    officer: officers[idx % officers.length],
  };
  loans.push(loan);

  // Build schedule and simulate payments up to "today" based on status.
  const schedule = buildSchedule(loan);
  const perInstallment = round2(installmentAmount(loan));
  schedule.forEach((r) => {
    const due = dayjs(r.dueDate);
    const isPast = due.isBefore(today, 'day');
    if (status === 'paid') {
      r.amountPaid = perInstallment;
      r.paidDate = iso(due.subtract(1, 'day'));
    } else if (status === 'defaulted') {
      // paid a couple then stopped
      if (r.installmentNo <= 1 && isPast) {
        r.amountPaid = perInstallment;
        r.paidDate = iso(due.subtract(1, 'day'));
      }
    } else if (status === 'overdue') {
      // paid on-time installments except the most recent past-due ones
      if (isPast && due.isAfter(today.subtract(20, 'day'))) {
        // recent past due -> unpaid
        r.amountPaid = 0;
      } else if (isPast) {
        r.amountPaid = perInstallment;
        r.paidDate = iso(due.subtract(1, 'day'));
      }
    } else {
      // active -> pay everything that's already due, on time
      if (isPast) {
        r.amountPaid = perInstallment;
        r.paidDate = iso(due.subtract(1, 'day'));
      }
    }
    const refreshed = refreshRepaymentStatus(r);
    r.status = refreshed.status;
    repayments.push(r);
  });
});

export const seedData: AppData = {
  clients,
  products,
  loans,
  repayments,
  branches,
};
