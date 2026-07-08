import { formatDate, formatNumberWithCommas } from '../utils/finance.js';

export function TransactionList({ transactions, currency, onDelete, emptyText = 'No transactions yet.', full = false }) {
  return (
    <ul className={`tx-list${full ? ' tx-list--full' : ''}`}>
      {transactions.length === 0 ? (
        <li className="tx-empty"><i className="fa-regular fa-folder-open" /><br />{emptyText}</li>
      ) : (
        transactions.map((tx) => (
          <li className={`tx-item tx-item--${tx.type}`} key={tx.id}>
            <div className="tx-left">
              <div className={`tx-badge tx-badge--${tx.type}`}>
                <i className={`fa-solid ${tx.type === 'deposit' ? 'fa-arrow-up' : 'fa-arrow-down'}`} />
              </div>
              <div className="tx-info">
                <div className="tx-name">{tx.name}</div>
                <div className="tx-date">{formatDate(tx.date)}</div>
              </div>
            </div>
            <div className="tx-right">
              <span className={`tx-amount tx-amount--${tx.type}`}>
                {tx.type === 'deposit' ? '+' : '-'}{currency === 'NGN' ? '\u20A6' : '$'}{tx.amount.toLocaleString(currency === 'NGN' ? 'en-NG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              {tx.type === 'expense' && onDelete && (
                <button className="tx-delete" title="Delete" onClick={() => onDelete(tx.id)}>
                  <i className="fa-solid fa-trash-can" />
                </button>
              )}
            </div>
          </li>
        ))
      )}
    </ul>
  );
}

export function MoneyForm({ type, name, amount, errors, currency, onNameChange, onAmountChange, onSubmit }) {
  const isDeposit = type === 'deposit';
  const prefix = isDeposit ? 'dep' : 'exp';

  function handleAmountChange(value) {
    onAmountChange(formatNumberWithCommas(value));
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <div className={`panel-icon-wrap ${isDeposit ? 'green' : 'red'}`}><i className={`fa-solid ${isDeposit ? 'fa-plus' : 'fa-minus'}`} /></div>
        <h2 className="panel-title">{isDeposit ? 'Add Deposit' : 'Add Expense'}</h2>
      </div>
      <div className="form-grid">
        <div className="field-wrap">
          <label className="field-label">{isDeposit ? 'Source' : 'Description'}</label>
          <input
            type="text"
            id={`${prefix}Name`}
            className="input"
            placeholder={isDeposit ? 'e.g. Salary, Freelance' : 'e.g. Rent, Groceries'}
            autoComplete="off"
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.closest('.panel').querySelector(`#${prefix}Amount`)?.focus(); }}
          />
          <span className="field-error" id={`${prefix}NameErr`} style={{ display: errors.name ? 'block' : 'none' }}>{errors.name}</span>
        </div>
        <div className="field-wrap">
          <label className="field-label">Amount</label>
          <div className="input-prefix-wrap">
            <span className="input-prefix" id={`${prefix}Prefix`}>{currency === 'NGN' ? '\u20A6' : '$'}</span>
            <input
              type="text"
              id={`${prefix}Amount`}
              className="input input--prefixed"
              placeholder="0.00"
              inputMode="decimal"
              autoComplete="off"
              value={amount}
              onChange={(event) => handleAmountChange(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') onSubmit(); }}
            />
          </div>
          <span className="field-error" id={`${prefix}AmountErr`} style={{ display: errors.amount ? 'block' : 'none' }}>{errors.amount}</span>
        </div>
        <button className={`btn ${isDeposit ? 'btn--deposit' : 'btn--expense'}`} id={isDeposit ? 'addDepBtn' : 'addBtn'} onClick={onSubmit}>
          <i className={`fa-solid ${isDeposit ? 'fa-plus' : 'fa-minus'}`} /> {isDeposit ? 'Add Deposit' : 'Add Expense'}
        </button>
      </div>
    </div>
  );
}