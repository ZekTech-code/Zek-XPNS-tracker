import { useMemo } from 'react';
import { activeTransactions, displayMoney, formatDateFull, formatMoney, formatSignedMoney, getMetrics, getMonthKey, getWeekKey, groupTransactions, monthLabel, sortNewest, weekLabel } from '../../utils/finance.js';

function SummaryCards({ items, currency, hideBalance }) {
  const { dep, exp, bal } = getMetrics(items);
  const savRate = dep > 0 ? Math.max(0, Math.round(((dep - exp) / dep) * 100)) : 0;
  return (
    <div className="report-grid">
      <div className="report-card">
        <div className="report-card-label"><i className="fa-solid fa-arrow-up" style={{ color: 'var(--green)' }} /> Deposited</div>
        <div className="report-card-value green">{displayMoney(dep, currency, hideBalance)}</div>
      </div>
      <div className="report-card">
        <div className="report-card-label"><i className="fa-solid fa-arrow-down" style={{ color: 'var(--red)' }} /> Spent</div>
        <div className="report-card-value red">{displayMoney(exp, currency, hideBalance)}</div>
      </div>
      <div className="report-card">
        <div className="report-card-label"><i className="fa-solid fa-scale-balanced" style={{ color: 'var(--indigo)' }} /> Net Balance</div>
        <div className={`report-card-value ${bal >= 0 ? 'indigo' : 'red'}`}>{formatSignedMoney(bal, currency, hideBalance)}</div>
      </div>
      <div className="report-card">
        <div className="report-card-label"><i className="fa-solid fa-receipt" style={{ color: 'var(--amber)' }} /> Transactions</div>
        <div className="report-card-value indigo">{items.length}</div>
      </div>
      <div className="report-card">
        <div className="report-card-label"><i className="fa-solid fa-piggy-bank" style={{ color: 'var(--teal)' }} /> Savings Rate</div>
        <div className={`report-card-value ${savRate >= 50 ? 'green' : savRate >= 20 ? 'indigo' : 'red'}`}>{savRate}%</div>
      </div>
    </div>
  );
}

function ReportList({ items, currency }) {
  if (!items.length) return <div className="report-no-tx"><i className="fa-regular fa-folder-open" /><p>No transactions in this period.</p></div>;
  return (
    <div className="report-tx-list">
      {sortNewest(items).map((tx) => (
        <div key={tx.id} className="report-tx-item">
          <div className="report-tx-left">
            <div className={`report-tx-badge report-tx-badge--${tx.type}`}>
              <i className={`fa-solid ${tx.type === 'deposit' ? 'fa-arrow-up' : 'fa-arrow-down'}`} />
            </div>
            <div className="report-tx-info">
              <div className="report-tx-name">{tx.name}</div>
              <div className="report-tx-date">{formatDateFull(tx.date)}</div>
            </div>
          </div>
          <div className={`report-tx-amount report-tx-amount--${tx.type}`}>{tx.type === 'deposit' ? '+' : '-'}{formatMoney(tx.amount, currency)}</div>
        </div>
      ))}
    </div>
  );
}

function RecapCard({ title, icon, dep, exp, net, savRate, txCount, periodLabel, currency }) {
  const netColor = net >= 0 ? 'var(--green)' : 'var(--red)';
  const netSign  = net >= 0 ? '+' : '\u2212';
  const savColor = savRate >= 50 ? 'var(--green)' : savRate >= 20 ? 'var(--indigo)' : 'var(--red)';
  return (
    <div className="recap-card">
      <div className="recap-card-head">
        <div className="recap-card-icon">{icon}</div>
        <div className="recap-card-title">{title}</div>
        <div className="recap-period-label">{periodLabel}</div>
      </div>
      <div className="recap-net" style={{ color: netColor }}>{netSign}{formatMoney(Math.abs(net), currency)}</div>
      <div className="recap-net-label">{net >= 0 ? 'Net Surplus' : 'Net Deficit'}</div>
      <div className="recap-stats">
        <div className="recap-stat">
          <span className="recap-stat-dot" style={{ background: 'var(--green)' }} />
          <span className="recap-stat-label">Deposits</span>
          <span className="recap-stat-val green">{formatMoney(dep, currency)}</span>
        </div>
        <div className="recap-stat">
          <span className="recap-stat-dot" style={{ background: 'var(--red)' }} />
          <span className="recap-stat-label">Expenses</span>
          <span className="recap-stat-val red">{formatMoney(exp, currency)}</span>
        </div>
        <div className="recap-stat">
          <span className="recap-stat-dot" style={{ background: 'var(--indigo)' }} />
          <span className="recap-stat-label">Savings Rate</span>
          <span className="recap-stat-val" style={{ color: savColor }}>{savRate}%</span>
        </div>
        <div className="recap-stat">
          <span className="recap-stat-dot" style={{ background: 'var(--amber)' }} />
          <span className="recap-stat-label">Transactions</span>
          <span className="recap-stat-val indigo">{txCount}</span>
        </div>
      </div>
    </div>
  );
}

function RecapBanner({ transactions, currency }) {
  const now = new Date();
  const thisWeek = getWeekKey(now);
  const thisMonth = getMonthKey(now);
  const wTx = transactions.filter((t) => getWeekKey(t.date) === thisWeek);
  const mTx = transactions.filter((t) => getMonthKey(t.date) === thisMonth);
  let wDep = 0, wExp = 0, mDep = 0, mExp = 0;
  wTx.forEach((t) => (t.type === 'deposit' ? (wDep += t.amount) : (wExp += t.amount)));
  mTx.forEach((t) => (t.type === 'deposit' ? (mDep += t.amount) : (mExp += t.amount)));
  const wNet = wDep - wExp;
  const mNet = mDep - mExp;
  const wSav = wDep > 0 ? Math.max(0, Math.round(((wDep - wExp) / wDep) * 100)) : 0;
  const mSav = mDep > 0 ? Math.max(0, Math.round(((mDep - mExp) / mDep) * 100)) : 0;

  return (
    <div className="recap-banner">
      <div className="recap-banner-header">
        <div className="recap-banner-title">
          <i className="fa-solid fa-chart-line" style={{ color: 'var(--indigo)' }} />
          Weekly & Monthly Financial Recap
        </div>
        <div className="recap-banner-sub">Your at-a-glance performance summary</div>
      </div>
      <div className="recap-cards-row">
        <RecapCard
          title="This Week"
          icon={<i className="fa-solid fa-calendar-week" style={{ color: 'var(--indigo)' }} />}
          dep={wDep} exp={wExp} net={wNet} savRate={wSav} txCount={wTx.length}
          periodLabel={weekLabel(thisWeek)}
          currency={currency}
        />
        <RecapCard
          title="This Month"
          icon={<i className="fa-solid fa-calendar-days" style={{ color: 'var(--teal)' }} />}
          dep={mDep} exp={mExp} net={mNet} savRate={mSav} txCount={mTx.length}
          periodLabel={monthLabel(thisMonth)}
          currency={currency}
        />
      </div>
    </div>
  );
}

export default function ReportsView({ transactions, currency, hideBalance, reportPeriod, setReportPeriod, selectedPeriod, setSelectedPeriod }) {
  const activeTx = useMemo(() => activeTransactions(transactions), [transactions]);
  const grouped = useMemo(() => groupTransactions(activeTx, reportPeriod === 'weekly' ? getWeekKey : getMonthKey), [reportPeriod, activeTx]);
  const keys = Object.keys(grouped).sort().reverse();
  const selected = selectedPeriod || keys[0] || '';
  const items = selected ? grouped[selected] || [] : [];
  const {bal } = getMetrics(items);

  return (
    <div className="view active" id="view-reports">
      <div className="page-header">
        <div><h1 className="page-title">Reports</h1><p className="page-sub">Weekly & monthly summaries</p></div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <select id="reportPeriodSelect" className="currency-pill" style={{ minWidth: 180, height: 34, padding: '0 10px' }} value={selected} onChange={(event) => setSelectedPeriod(event.target.value)}>
            {keys.map((key) => <option key={key} value={key}>{reportPeriod === 'weekly' ? weekLabel(key) : monthLabel(key)}</option>)}
          </select>
          <div className="report-period-tabs">
            <button className={`filter-btn${reportPeriod === 'weekly' ? ' active' : ''}`} id="weeklyTab" onClick={() => { setReportPeriod('weekly'); setSelectedPeriod(''); }}>Weekly</button>
            <button className={`filter-btn${reportPeriod === 'monthly' ? ' active' : ''}`} id="monthlyTab" onClick={() => { setReportPeriod('monthly'); setSelectedPeriod(''); }}>Monthly</button>
          </div>
        </div>
      </div>
      <div id="reportsContent">
        {!transactions.length ? <div className="report-empty"><i className="fa-regular fa-chart-bar" /><br />Add transactions to generate reports.</div> : (
          <div className={`report-period-block${(reportPeriod === 'weekly' && selected === getWeekKey(new Date())) || (reportPeriod === 'monthly' && selected === getMonthKey(new Date())) ? ' report-period-block--current' : ''}`}>
            <div className="report-period-header">
              <div className="report-period-header-left">
                <div className="report-period-title">{reportPeriod === 'weekly' ? weekLabel(selected) : monthLabel(selected)}</div>
                <div className="report-period-subtitle">{items.length} transaction{items.length === 1 ? '' : 's'}</div>
              </div>
              <div className={`report-period-net ${bal >= 0 ? 'positive' : 'negative'}`}>{bal >= 0 ? '+' : '-'}{formatMoney(Math.abs(bal), currency)}</div>
            </div>
            <SummaryCards items={items} currency={currency} hideBalance={hideBalance} />
            <div className="report-tx-section">
              <div className="report-tx-section-title"><i className="fa-solid fa-list-ul" /> Transaction Log</div>
              <ReportList items={items} currency={currency} />
            </div>
          </div>
        )}
      </div>
      <RecapBanner transactions={activeTx} currency={currency} />
    </div>
  );
}