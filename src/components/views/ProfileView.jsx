import { useMemo } from 'react';
import { activeTransactions, displayMoney, formatSignedMoney, getMetrics } from '../../utils/finance.js';

const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

export default function ProfileView({ user, profile, transactions, currency, hideBalance, theme, avatarColor, colorPickerOpen, setColorPickerOpen, setAvatarColor, setCurrency, toggleTheme, toggleHideBalance, onSaveName, profileNameDraft, setProfileNameDraft, profileNameError, onAvatarUpload, onClearAll, onExportPDF, onLogout }) {
  const activeTx = useMemo(() => activeTransactions(transactions), [transactions]);
  const { dep, exp, bal } = getMetrics(transactions);
  const activeExpenses = activeTx.filter((tx) => tx.type === 'expense');
  const avgExpense = activeExpenses.length ? activeExpenses.reduce((s, t) => s + t.amount, 0) / activeExpenses.length : 0;
  const savingsRate = dep > 0 ? Math.max(0, Math.round(((dep - exp) / dep) * 100)) : 0;
  const initial = (profile.displayName || user?.displayName || user?.email || 'U').trim()[0]?.toUpperCase() || 'U';
  const joinDate = user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Member';

  return (
    <div className="view active" id="view-profile">
      <div className="page-header"><div><h1 className="page-title">Profile</h1><p className="page-sub">Manage your account</p></div></div>
      <div className="profile-hero section-card">
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrap">
            {profile.photoURL ? <img className="profile-avatar" id="profileAvatar" src={profile.photoURL} alt="Profile" /> : <div className="profile-avatar" id="profileAvatar" style={avatarColor ? { background: avatarColor } : undefined}>{initial}</div>}
            <button className="avatar-edit-btn" id="avatarEditBtn" title="Change avatar color" onClick={() => setColorPickerOpen(!colorPickerOpen)}><i className="fa-solid fa-palette" /></button>
            <button className="avatar-upload-btn" id="avatarUploadBtn" title="Upload profile picture" onClick={() => document.getElementById('avatarFileInput')?.click()}><i className="fa-solid fa-camera" /></button>
            <input type="file" id="avatarFileInput" accept="image/*" style={{ display: 'none' }} onChange={onAvatarUpload} />
          </div>
          <div className="profile-info">
            <h2 className="profile-name" id="profileName">{profile.displayName || 'User'}</h2>
            <p className="profile-email" id="profileEmail">{user?.email || 'user@example.com'}</p>
            <div className="profile-badges">
              <span className="profile-badge" id="memberSinceBadge"><i className="fa-solid fa-calendar-check" /> {joinDate}</span>
              <span className="profile-badge profile-badge--green" id="txCountBadge"><i className="fa-solid fa-receipt" /> {transactions.length} transactions</span>
              <div className="sync-status" id="syncStatus"><i className="fa-solid fa-circle-check" /><span>Synced</span></div>
            </div>
          </div>
        </div>
        {colorPickerOpen && <div className="avatar-color-picker" id="avatarColorPicker"><p className="picker-label">Choose avatar color</p><div className="color-swatches">{colors.map((color) => <button key={color} className={`swatch${avatarColor === color ? ' active' : ''}`} data-color={color} style={{ background: color }} title={color} onClick={() => setAvatarColor(color)} />)}</div></div>}
      </div>

      <div className="section-card"><div className="section-header"><h2 className="section-title">Account Details</h2></div><div className="profile-form">
        <div className="field-wrap"><label className="field-label">Display Name</label><div className="input-action-row"><input type="text" id="profileNameInput" className="input" placeholder="Your display name" autoComplete="off" value={profileNameDraft} onChange={(event) => setProfileNameDraft(event.target.value)} /><button className="btn btn--save" id="saveNameBtn" onClick={onSaveName}><i className="fa-solid fa-check" /> Save</button></div><span className="field-error" id="profileNameErr" style={{ display: profileNameError ? 'block' : 'none' }}>{profileNameError}</span></div>
        <div className="field-wrap"><label className="field-label">Email</label><input type="text" className="input input--readonly" id="profileEmailInput" readOnly value={user?.email || ''} /></div>
        <div className="field-wrap"><label className="field-label">Member Since</label><input type="text" className="input input--readonly" id="profileJoinDate" readOnly value={joinDate} /></div>
      </div></div>

      <div className="section-card"><div className="section-header"><h2 className="section-title">Financial Summary</h2></div><div className="profile-stats-grid">
        <Stat cls="green" icon="fa-arrow-trend-up" label="Total Deposited" value={displayMoney(dep, currency, hideBalance)} />
        <Stat cls="red" icon="fa-arrow-trend-down" label="Total Spent" value={displayMoney(exp, currency, hideBalance)} />
        <Stat cls="indigo" icon="fa-wallet" label="Current Balance" value={formatSignedMoney(bal, currency, hideBalance)} />
        <Stat cls="amber" icon="fa-receipt" label="Total Transactions" value={transactions.length} />
        <Stat cls="violet" icon="fa-chart-simple" label="Avg. Expense" value={displayMoney(avgExpense, currency, hideBalance)} />
        <Stat cls="teal" icon="fa-piggy-bank" label="Savings Rate" value={`${savingsRate}%`} />
      </div></div>

      <div className="section-card"><div className="section-header"><h2 className="section-title">Preferences</h2></div><div className="pref-list">
        <PrefToggle name="Theme" desc="Switch between dark and light mode" on={theme === 'light'} onClick={toggleTheme} id="profileThemeToggle" />
        <PrefToggle name="Hide Balance" desc="Mask balance values for privacy" on={hideBalance} onClick={toggleHideBalance} id="profileHideBalance" />
        <div className="pref-row"><div className="pref-info"><div className="pref-name">Currency</div><div className="pref-desc">Display currency for all amounts</div></div><select id="profileCurrency" className="currency-pill" value={currency} onChange={(event) => setCurrency(event.target.value)}><option value="NGN">{'\u20A6'} NGN</option><option value="USD">$ USD</option></select></div>
      </div></div>

      <div className="section-card section-card--danger"><div className="section-header"><h2 className="section-title section-title--danger">Danger Zone</h2></div><div className="danger-actions">
        <DangerRow label="Export All Data" desc="Download all your transactions as CSV" buttonClass="btn btn--outline" icon="fa-file-pdf" buttonText="Export PDF" onClick={onExportPDF} />
        <DangerRow label="Clear All Transactions" desc="Permanently delete all your transaction data" buttonClass="btn btn--danger" icon="fa-trash" buttonText="Clear All" onClick={onClearAll} />
        <DangerRow label="Sign Out" desc="Log out of your account on this device" buttonClass="btn btn--danger" icon="fa-arrow-right-from-bracket" buttonText="Sign Out" onClick={onLogout} />
      </div></div>
    </div>
  );
}

function Stat({ cls, icon, label, value }) {
  return <div className={`stat-block stat-block--${cls}`}><div className="stat-icon"><i className={`fa-solid ${icon}`} /></div><div className="stat-body"><div className="stat-label">{label}</div><div className="stat-value">{value}</div></div></div>;
}

function PrefToggle({ name, desc, on, onClick, id }) {
  return <div className="pref-row"><div className="pref-info"><div className="pref-name">{name}</div><div className="pref-desc">{desc}</div></div><button className={`toggle-switch${on ? ' on' : ''}`} id={id} onClick={onClick}><span className="toggle-knob" /></button></div>;
}

function DangerRow({ label, desc, buttonClass, icon, buttonText, onClick }) {
  return <div className="danger-row"><div><div className="danger-label">{label}</div><div className="danger-desc">{desc}</div></div><button className={buttonClass} onClick={onClick}><i className={`fa-solid ${icon}`} /> {buttonText}</button></div>;
}