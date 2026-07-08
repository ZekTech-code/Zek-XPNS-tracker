export const PREVIEW_LIMIT = 6;

export function getCurrencySymbol(currency) {
  return currency === 'NGN' ? '\u20A6' : '$';
}

export function formatMoney(value, currency = 'NGN') {
  const symbol = getCurrencySymbol(currency);
  const locale = currency === 'NGN' ? 'en-NG' : 'en-US';
  return symbol + Math.abs(Number(value) || 0).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const MASK = '\u2022\u2022\u2022\u2022';

export function displayMoney(value, currency, hideBalance) {
  return hideBalance ? MASK : formatMoney(value, currency);
}

export function formatSignedMoney(value, currency, hideBalance) {
  if (hideBalance) return MASK;
  return (value < 0 ? '-' : '') + formatMoney(value, currency);
}

export function formatDate(value) {
  return new Date(value).toLocaleString('en-NG', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateFull(value) {
  return new Date(value).toLocaleString('en-NG', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getMetrics(transactions) {
  return transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'deposit') acc.dep += tx.amount;
      else acc.exp += tx.amount;
      acc.bal = acc.dep - acc.exp;
      return acc;
    },
    { dep: 0, exp: 0, bal: 0 },
  );
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getRealName(user, profile = {}) {
  const fromProfile = (profile.displayName || '').trim();
  if (fromProfile) return fromProfile;
  const displayName = (user?.displayName || '').trim();
  if (displayName) return displayName;
  const email = (user?.email || '').toLowerCase();
  if (email.includes('@')) {
    return email.split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }
  return 'User';
}

export function validateEntry(name, rawAmount) {
  const errors = {};
  const cleanName = name.trim();
  const amountText = rawAmount.trim().replace(/,/g, '');

  if (!cleanName) errors.name = 'Enter a name.';
  if (!amountText) errors.amount = 'Enter an amount.';
  else if (!/^\d*\.?\d+$/.test(amountText)) errors.amount = 'Numbers only.';
  else if (parseFloat(amountText) <= 0) errors.amount = 'Must be greater than 0.';

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    name: cleanName,
    amount: parseFloat(amountText || '0'),
  };
}

export function formatNumberWithCommas(value) {
  let clean = String(value).replace(/[^\d.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) clean = parts[0] + '.' + parts.slice(1).join('');

  let integerPart = parts[0];
  const decimalPart = parts[1];
  if (integerPart) {
    if (integerPart.length > 1 && integerPart.startsWith('0')) {
      integerPart = integerPart.replace(/^0+/, '') || '0';
    }
    integerPart = parseInt(integerPart, 10).toLocaleString('en-US');
  }

  if (clean.includes('.')) return integerPart + '.' + (decimalPart !== undefined ? decimalPart : '');
  return integerPart;
}

export function getWeekKey(dateInput) {
  const date = new Date(dateInput);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export function getMonthKey(dateInput) {
  const date = new Date(dateInput);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function groupTransactions(transactions, keyFn) {
  return transactions.reduce((groups, tx) => {
    const key = keyFn(tx.date);
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
    return groups;
  }, {});
}

export function weekLabel(isoDate) {
  const start = new Date(`${isoDate}T00:00:00`);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-NG', opts)} - ${end.toLocaleDateString('en-NG', opts)}`;
}

export function monthLabel(key) {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-NG', {
    month: 'long',
    year: 'numeric',
  });
}

export function sortNewest(transactions) {
  return [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function sortOldest(transactions) {
  return [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
}

export function activeTransactions(transactions) {
  return transactions.filter((tx) => !tx.deleted);
}

export function getMetricsWithDeleted(transactions) {
  const metrics = getMetrics(transactions);
  const deleted = transactions.filter((tx) => tx.deleted);
  const totalDeleted = deleted.reduce((sum, tx) => sum + tx.amount, 0);
  return { ...metrics, deletedCount: deleted.length, totalDeleted };
}