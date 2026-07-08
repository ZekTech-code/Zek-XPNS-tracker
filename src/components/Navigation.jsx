const navItems = [
  { view: 'dashboard', icon: 'fa-solid fa-house', label: 'Dashboard' },
  { view: 'history', icon: 'fa-solid fa-clock-rotate-left', label: 'History' },
  { view: 'reports', icon: 'fa-solid fa-chart-column', label: 'Reports' },
  { view: 'profile', icon: 'fa-solid fa-user-circle', label: 'Profile' },
];

function AvatarButton({ idPrefix, initial, photoURL, dropdownOpen, onToggle, onAction }) {
  return (
    <div className="user-avatar-container" id={`${idPrefix}AvatarContainer`}>
      <button className="avatar-btn" id={`${idPrefix}AvatarBtn`} aria-haspopup="true" aria-expanded={dropdownOpen} aria-label="User Menu" onClick={onToggle}>
        {photoURL ? <img className="header-avatar" src={photoURL} alt="User avatar" /> : <div className="user-avatar" id={`${idPrefix}UserAvatar`}>{initial}</div>}
      </button>
      <div className={`avatar-dropdown${dropdownOpen ? ' active' : ''}`} id={`${idPrefix}AvatarDropdown`} role="menu" aria-label="User profile options">
        <button className="dropdown-item" onClick={() => onAction('profile')} role="menuitem"><i className="fa-solid fa-user" />Profile</button>
        <button className="dropdown-item" onClick={() => onAction('settings')} role="menuitem"><i className="fa-solid fa-gear" />Account Settings</button>
        <hr className="dropdown-divider" />
        <button className="dropdown-item text-danger" onClick={() => onAction('logout')} role="menuitem"><i className="fa-solid fa-arrow-right-from-bracket" />Logout</button>
      </div>
    </div>
  );
}

export function Sidebar({ activeView, setActiveView, collapsed, setCollapsed, theme, toggleTheme, currency, setCurrency, initial, photoURL, dropdownOpen, toggleDropdown, onAvatarAction, onLogout }) {
  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} id="sidebar">
      <div className="sidebar-brand">
        <AvatarButton idPrefix="desktop" initial={initial} photoURL={photoURL} dropdownOpen={dropdownOpen} onToggle={toggleDropdown} onAction={onAvatarAction} />
        <button className="sidebar-toggle" id="sidebarToggle" title="Collapse sidebar" onClick={() => setCollapsed(!collapsed)}>
          <i className={`fa-solid ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'}`} />
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button key={item.view} className={`nav-item${activeView === item.view ? ' active' : ''}`} data-view={item.view} onClick={() => setActiveView(item.view)}>
            <i className={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-actions">
          <button className="icon-action" id="themeToggle" title="Toggle theme" onClick={toggleTheme}>
            <i className={`fa-solid ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`} id="themeIcon" />
          </button>
          <select id="currencySelectMain" className="currency-pill" title="Currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>
            <option value="NGN">{'\u20A6'} NGN</option>
            <option value="USD">$ USD</option>
          </select>
          <button className="icon-action danger" id="logoutBtn" title="Logout" onClick={onLogout}>
            <i className="fa-solid fa-arrow-right-from-bracket" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function MobileBars({ activeView, setActiveView, initial, photoURL, dropdownOpen, toggleDropdown, onAvatarAction }) {
  return (
    <>
      <div className="mobile-topbar">
        <AvatarButton idPrefix="mobile" initial={initial} photoURL={photoURL} dropdownOpen={dropdownOpen} onToggle={toggleDropdown} onAction={onAvatarAction} />
      </div>
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => (
          <button key={item.view} className={`mob-nav-item${activeView === item.view ? ' active' : ''}`} data-view={item.view} onClick={() => setActiveView(item.view)}>
            <i className={item.icon} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}