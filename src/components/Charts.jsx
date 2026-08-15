import {
  Chart as ChartJS,
  BarController,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { getMetrics, sortOldest } from '../utils/finance.js';

ChartJS.register(BarController, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function fmt(n, currency = 'NGN') {
  const sym = currency === 'NGN' ? '\u20A6' : '$';
  const locale = currency === 'NGN' ? 'en-NG' : 'en-US';
  return sym + Math.abs(Number(n) || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function chartColors(theme) {
  const light = theme === 'light';
  return {
    balance: light ? '#4f46e5' : '#6366f1',
    deposit: light ? '#059669' : '#34d399',
    expense: light ? '#dc2626' : '#f87171',
    grid: light ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)',
    tick: light ? '#9ca3af' : '#7070a0',
    ttBg: light ? '#fff' : '#13131e',
    ttBord: light ? '#dcdcec' : '#2a2a42',
    ttTitle: light ? '#111128' : '#eeeef5',
    ttBody: light ? '#6060a0' : '#7070a0',
  };
}

function tooltip(colors) {
  return {
    backgroundColor: colors.ttBg,
    borderColor: colors.ttBord,
    borderWidth: 1,
    titleColor: colors.ttTitle,
    bodyColor: colors.ttBody,
    titleFont: { family: "'Space Grotesk',sans-serif", size: 12, weight: '700' },
    bodyFont: { family: "'JetBrains Mono',monospace", size: 11 },
    padding: 10,
  };
}

export function CashFlowChart({ transactions, theme }) {
  const colors = chartColors(theme);
  if (!transactions.length) {
    return <div className="chart-empty" id="flowEmpty"><i className="fa-regular fa-chart-bar" /><br />Add transactions to see cash flow.</div>;
  }

  const sorted = sortOldest(transactions);
  const labels = [];
  const balD = [];
  const depD = [];
  const expD = [];
  let rBal = 0, rDep = 0, rExp = 0;
  sorted.forEach((tx) => {
    if (tx.type === 'deposit') { rBal += tx.amount; rDep += tx.amount; }
    else { rBal -= tx.amount; rExp += tx.amount; }
    labels.push(tx.name.length > 9 ? tx.name.slice(0, 9) + '\u2026' : tx.name);
    balD.push(+rBal.toFixed(2));
    depD.push(+rDep.toFixed(2));
    expD.push(+rExp.toFixed(2));
  });

  return (
    <div className="chart-wrap" id="flowWrap">
      <Bar
        id="flowChart"
        data={{
          labels,
          datasets: [
            { label: 'Balance', data: balD, backgroundColor: colors.balance + 'dd', borderColor: colors.balance, borderWidth: 1.5, borderRadius: 4 },
            { label: 'Deposits', data: depD, backgroundColor: colors.deposit + '88', borderColor: colors.deposit, borderWidth: 1.5, borderRadius: 4 },
            { label: 'Expenses', data: expD, backgroundColor: colors.expense + '88', borderColor: colors.expense, borderWidth: 1.5, borderRadius: 4 },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { ...tooltip(colors), callbacks: { label: (ctx) => ' ' + ctx.dataset.label + ': ' + fmt(ctx.parsed.y) } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { color: colors.tick, font: { family: "'Space Grotesk',sans-serif", size: 10 }, autoSkip: true, maxRotation: 35 } },
            y: { grid: { color: colors.grid }, ticks: { color: colors.tick, font: { family: "'JetBrains Mono',monospace", size: 10 }, callback: (v) => fmt(v) } },
          },
        }}
      />
    </div>
  );
}

export function TopExpensesChart({ transactions, theme }) {
  const colors = chartColors(theme);
  const expenses = transactions.filter((tx) => tx.type === 'expense');
  if (!expenses.length) {
    return <div className="chart-empty" id="barEmpty"><i className="fa-regular fa-chart-bar" /><br />Add expenses to see breakdown.</div>;
  }

  const grouped = expenses.reduce((acc, tx) => {
    acc[tx.name] = (acc[tx.name] || 0) + tx.amount;
    return acc;
  }, {});
  const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]).slice(0, 7);

  return (
    <div className="chart-wrap top-expenses-chart" id="barWrap">
      <Bar
        id="barChart"
        data={{
          labels: entries.map(([name]) => name.length > 10 ? name.slice(0, 10) + '\u2026' : name),
          datasets: [{
            label: 'Amount',
            data: entries.map(([, amount]) => +amount.toFixed(2)),
            backgroundColor: colors.expense + '88',
            borderColor: colors.expense,
            borderWidth: 1.5,
            borderRadius: 5,
            maxBarThickness: 50,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { ...tooltip(colors), callbacks: { label: (ctx) => ' ' + fmt(ctx.parsed.y) } },
          },
          scales: {
            x: { ticks: { color: colors.tick, font: { family: "'JetBrains Mono',monospace", size: 10 }, maxRotation: 30 }, grid: { display: false } },
            y: { ticks: { color: colors.tick, font: { family: "'JetBrains Mono',monospace", size: 10 }, callback: (v) => fmt(v) }, grid: { color: colors.grid } },
          },
        }}
      />
    </div>
  );
}

export function DonutChart({ transactions, theme }) {
  const colors = chartColors(theme);
  const { dep, exp } = getMetrics(transactions);
  if (!transactions.length || (!dep && !exp)) {
    return <div className="chart-empty" id="donutEmpty"><i className="fa-regular fa-circle-half-stroke" /><br />Add transactions to see split.</div>;
  }

  return (
    <div className="chart-wrap chart-wrap--donut" id="donutWrap">
      <Doughnut
        id="donutChart"
        data={{
          labels: ['Deposited', 'Expenses'],
          datasets: [{
            data: [+dep.toFixed(2), +exp.toFixed(2)],
            backgroundColor: [colors.deposit + 'bb', colors.expense + 'bb'],
            borderColor: [colors.deposit, colors.expense],
            borderWidth: 2,
            hoverOffset: 6,
          }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: '66%',
          plugins: {
            legend: { display: false },
            tooltip: { ...tooltip(colors), callbacks: { label: (ctx) => ' ' + ctx.label + ': ' + fmt(ctx.parsed) } },
          },
        }}
      />
    </div>
  );
}
