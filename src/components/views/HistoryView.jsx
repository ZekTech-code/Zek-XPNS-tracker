import { useMemo } from 'react';
import { TransactionList } from '../Transactions.jsx';
import { activeTransactions, sortNewest } from '../../utils/finance.js';

export default function HistoryView({ transactions, currency, filter, setFilter, search, setSearch, onDelete, onExportPDF }) {
  const activeTx = useMemo(() => activeTransactions(transactions), [transactions]);
  const { deposits, expenses, filtered } = useMemo(() => {
    const depositsList = activeTx.filter((tx) => tx.type === 'deposit');
    const expensesList = activeTx.filter((tx) => tx.type === 'expense');
    const term = search.trim().toLowerCase();
    const byType = filter === 'all' ? activeTx : activeTx.filter((tx) => tx.type === filter);
    const bySearch = term ? byType.filter((tx) => tx.name.toLowerCase().includes(term)) : byType;
    return { deposits: depositsList.length, expenses: expensesList.length, filtered: sortNewest(bySearch) };
  }, [filter, search, activeTx]);

  return (
    <div className="view active" id="view-history">
      <div className="page-header">
        <div><h1 className="page-title">History</h1><p className="page-sub">All your transactions</p></div>
        <button className="btn btn--export" id="exportPdfBtn" title="Export to PDF" onClick={onExportPDF}><i className="fa-solid fa-file-pdf" /> Export PDF</button>
      </div>

      <div className="cards-row cards-row--sm">
        <div className="card card--balance">
          <div className="card-top"><span className="card-label">Total Transactions</span></div>
          <div className="card-value" id="histTotal">{transactions.length}</div>
        </div>
        <div className="card card--income">
          <div className="card-top"><span className="card-label">Deposits</span></div>
          <div className="card-value" id="histDeposits">{deposits}</div>
        </div>
        <div className="card card--expense">
          <div className="card-top"><span className="card-label">Expenses</span></div>
          <div className="card-value" id="histExpenses">{expenses}</div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <h2 className="section-title">Transaction History</h2>
          <div className="header-right"><div className="filters" id="historyFilters">
            {['all', 'deposit', 'expense'].map((item) => <button key={item} className={`filter-btn${filter === item ? ' active' : ''}`} onClick={() => setFilter(item)}>{item === 'all' ? 'All' : item === 'deposit' ? 'Deposits' : 'Expenses'}</button>)}
          </div></div>
        </div>
        <div className="search-wrap"><i className="fa-solid fa-magnifying-glass search-icon" /><input type="text" id="searchInput" className="input input--search" placeholder="Search transactions�" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        <TransactionList transactions={filtered} currency={currency} onDelete={onDelete} emptyText="No transactions found." full />
      </div>
    </div>
  );
}