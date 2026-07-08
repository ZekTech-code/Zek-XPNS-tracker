import { useMemo } from 'react';
import { CashFlowChart, DonutChart, TopExpensesChart } from '../Charts.jsx';
import { MoneyForm, TransactionList } from '../Transactions.jsx';
import { displayMoney, formatMoney, formatSignedMoney, getMetrics, PREVIEW_LIMIT, sortNewest } from '../../utils/finance.js';

function BalanceBanner({ transactions, currency }) {
  if (!transactions.length) return null;
  const { dep, exp, bal } = getMetrics(transactions);
  const pct = dep > 0 ? Math.min(100, Math.round((exp / dep) * 100)) : 0;
  let status = 'Healthy';
  let color = 'var(--green)';
  let bg = 'var(--green-dim)';
  let icon = 'fa-solid fa-circle-check';
  let message = `${pct}% spent \u2014 ${formatMoney(bal, currency)} available`;

  if (bal < 0) {
    status = 'Overdrawn';
    color = 'var(--red)';
    bg = 'var(--red-dim)';
    icon = 'fa-solid fa-triangle-exclamation';
    message = `Expenses exceed deposits by ${formatMoney(Math.abs(bal), currency)}`;
  } else if (pct >= 90) {
    status = 'Critical';
    color = 'var(--amber)';
    bg = 'var(--amber-dim)';
    icon = 'fa-solid fa-triangle-exclamation';
    message = `${pct}% spent \u2014 ${formatMoney(bal, currency)} remaining`;
  } else if (pct >= 70) {
    status = 'Low Balance';
    color = 'var(--amber)';
    bg = 'var(--amber-dim)';
    icon = 'fa-solid fa-circle-exclamation';
    message = `${pct}% spent \u2014 ${formatMoney(bal, currency)} remaining`;
  }

  return (
    <div id="balanceBannerWrap">
      <div className="balance-banner" style={{ background: bg, borderColor: color }}>
        <span className="bb-icon" style={{ color, display: 'inline-flex', alignItems: 'center' }}><i className={icon} /></span>
        <div className="bb-text">
          <span className="bb-status" style={{ color }}>{status}</span>
          <span style={{ color: 'var(--text-muted)', marginLeft: 10, fontSize: '0.76rem' }}>{message}</span>
        </div>
        <div className="bb-bar-wrap"><div className="bb-bar" style={{ width: `${pct}%`, background: color }} /></div>
      </div>
    </div>
  );
}

export default function DashboardView({ state, actions }) {
  const { transactions, activeTx, currency, hideBalance, activeFilter, depositForm, expenseForm, formErrors, theme, userName } = state;
  const { dep, exp, bal } = useMemo(() => getMetrics(transactions), [transactions]);
  const depCount = useMemo(() => activeTx.reduce((c, tx) => c + (tx.type === 'deposit'), 0), [activeTx]);
  const expCount = useMemo(() => activeTx.reduce((c, tx) => c + (tx.type === 'expense'), 0), [activeTx]);
  const filtered = useMemo(() => {
    const list = activeFilter === 'all' ? activeTx : activeTx.filter((tx) => tx.type === activeFilter);
    return sortNewest(list).slice(0, PREVIEW_LIMIT);
  }, [activeFilter, activeTx]);

  return (
    <div className="view active" id="view-dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub" id="currentUserLabel">{userName}</p>
        </div>
      </div>

      <BalanceBanner transactions={transactions} currency={currency} />

      <div className="cards-row">
        <div className="card card--balance">
          <div className="card-top">
            <span className="card-label">Net Balance</span>
            <button id="toggleBalanceBtn" className="card-action" title="Toggle visibility" onClick={actions.toggleHideBalance}>
              <i className={`fa-regular ${hideBalance ? 'fa-eye-slash' : 'fa-eye'}`} id="balEyeIcon" />
            </button>
          </div>
          <div className="card-value" id="balanceDisplay" style={bal < 0 ? { color: 'var(--red)' } : undefined}>{formatSignedMoney(bal, currency, hideBalance)}</div>
          <div className="card-trend" id="balanceTrend">{transactions.length ? `${transactions.length} transaction${transactions.length === 1 ? '' : 's'}` : ''}</div>
        </div>
        <div className="card card--income">
          <div className="card-top">
            <span className="card-label">Total Deposits</span>
            <span className="card-badge badge--green"><i className="fa-solid fa-arrow-up" /></span>
          </div>
          <div className="card-value" id="depositDisplay">{displayMoney(dep, currency, hideBalance)}</div>
          <div className="card-trend">{depCount ? `${depCount} deposit${depCount === 1 ? '' : 's'}` : ''}</div>
        </div>
        <div className="card card--expense">
          <div className="card-top">
            <span className="card-label">Total Expenses</span>
            <span className="card-badge badge--red"><i className="fa-solid fa-arrow-down" /></span>
          </div>
          <div className="card-value" id="totalDisplay">{displayMoney(exp, currency, hideBalance)}</div>
          <div className="card-trend">{expCount ? `${expCount} expense${expCount === 1 ? '' : 's'}` : ''}</div>
        </div>
      </div>

      <div className="panels-row">
        <MoneyForm type="deposit" currency={currency} name={depositForm.name} amount={depositForm.amount} errors={formErrors.deposit} onNameChange={(name) => actions.updateForm('deposit', { name })} onAmountChange={(amount) => actions.updateForm('deposit', { amount })} onSubmit={() => actions.submitTransaction('deposit')} />
        <MoneyForm type="expense" currency={currency} name={expenseForm.name} amount={expenseForm.amount} errors={formErrors.expense} onNameChange={(name) => actions.updateForm('expense', { name })} onAmountChange={(amount) => actions.updateForm('expense', { amount })} onSubmit={() => actions.submitTransaction('expense')} />
      </div>

      {!hideBalance && <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Recent Transactions</h2>
          <div className="header-right">
            <div className="filters" id="mainFilters">
              {['all', 'deposit', 'expense'].map((filter) => <button key={filter} className={`filter-btn${activeFilter === filter ? ' active' : ''}`} onClick={() => actions.setActiveFilter(filter)}>{filter === 'all' ? 'All' : filter === 'deposit' ? 'Deposits' : 'Expenses'}</button>)}
            </div>
            <button className="text-btn" id="viewAllBtn" onClick={actions.openModal}>View all <i className="fa-solid fa-arrow-right" style={{ marginLeft: 4, fontSize: '0.85em' }} /></button>
          </div>
        </div>
        <TransactionList transactions={filtered} currency={currency} onDelete={actions.deleteTransaction} />
      </div>}

      <div className="charts-grid">
        <div className="section-card chart-card chart-card--wide">
          <div className="section-header"><h2 className="section-title">Cash Flow</h2><div className="legend-row"><span className="leg leg--bal">Balance</span><span className="leg leg--dep">Deposits</span><span className="leg leg--exp">Expenses</span></div></div>
          <CashFlowChart transactions={transactions} theme={theme} />
        </div>
        <div className="section-card chart-card"><div className="section-header"><h2 className="section-title">Top Expenses</h2></div><TopExpensesChart transactions={transactions} theme={theme} /></div>
        <div className="section-card chart-card"><div className="section-header"><h2 className="section-title">Deposit vs Expense</h2></div><DonutChart transactions={transactions} theme={theme} /></div>
      </div>
    </div>
  );
}