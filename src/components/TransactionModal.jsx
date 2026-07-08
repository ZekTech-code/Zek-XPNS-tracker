import { TransactionList } from './Transactions.jsx';
import { activeTransactions, sortNewest } from '../utils/finance.js';

export default function TransactionModal({ open, filter, setFilter, transactions, currency, onClose, onDelete }) {
  if (!open) return null;
  const activeTx = activeTransactions(transactions);
  const filtered = filter === 'all' ? activeTx : activeTx.filter((tx) => tx.type === filter);
  const label = filter === 'all' ? 'All' : `${filter.charAt(0).toUpperCase()}${filter.slice(1)}s`;

  return (
    <div className="modal-overlay" id="modalOverlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-header"><h2 className="modal-title" id="modalTitle">{label} ({filtered.length})</h2><button className="modal-close" id="modalClose" onClick={onClose}><i className="fa-solid fa-xmark" /></button></div>
        <div className="modal-filters">{['all', 'deposit', 'expense'].map((item) => <button key={item} className={`filter-btn${filter === item ? ' active' : ''}`} onClick={() => setFilter(item)}>{item === 'all' ? 'All' : item === 'deposit' ? 'Deposits' : 'Expenses'}</button>)}</div>
        <TransactionList transactions={sortNewest(filtered)} currency={currency} onDelete={onDelete} emptyText="Nothing here." full />
      </div>
    </div>
  );
}