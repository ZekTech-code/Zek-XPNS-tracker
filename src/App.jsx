import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import LoadingScreen from './components/LoadingScreen.jsx';
import OfflineBanner from './components/OfflineBanner.jsx';
import { MobileBars, Sidebar } from './components/Navigation.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import TransactionModal from './components/TransactionModal.jsx';
import { activeTransactions, formatMoney, getGreeting, getMetrics, getRealName, validateEntry } from './utils/finance.js';
import { canSubmitTransaction, setupInactivityTracker } from './utils/security.js';

const DashboardView = lazy(() => import('./components/views/DashboardView.jsx'));
const HistoryView = lazy(() => import('./components/views/HistoryView.jsx'));
const ProfileView = lazy(() => import('./components/views/ProfileView.jsx'));
const ReportsView = lazy(() => import('./components/views/ReportsView.jsx'));
const LoginView = lazy(() => import('./components/views/LoginView.jsx'));

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const toastTypes = {
  deposit: { border: 'var(--green)', bg: 'var(--green-dim)', color: 'var(--green)', icon: 'fa-solid fa-arrow-up', title: 'Deposit Added' },
  expense: { border: 'var(--red)', bg: 'var(--red-dim)', color: 'var(--red)', icon: 'fa-solid fa-arrow-down', title: 'Expense Recorded' },
  warning: { border: 'var(--amber)', bg: 'var(--amber-dim)', color: 'var(--amber)', icon: 'fa-solid fa-circle-exclamation', title: 'Insufficient Funds' },
  error: { border: 'var(--red)', bg: 'var(--red-dim)', color: 'var(--red)', icon: 'fa-solid fa-triangle-exclamation', title: 'Error' },
  success: { border: 'var(--green)', bg: 'var(--green-dim)', color: 'var(--green)', icon: 'fa-solid fa-circle-check', title: 'Success' },
  delete: { border: 'var(--border-hi)', bg: 'var(--surface-2)', color: 'var(--text-muted)', icon: 'fa-solid fa-trash-can', title: 'Removed' },
};

async function bootstrapFirebase() {
  if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(() => {});
  const db = firebase.firestore();
  try {
    db.settings({ cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED, experimentalAutoDetectLongPolling: true, merge: true });
  } catch {
    // Firestore settings are immutable after first use.
  }
  return { firebase, auth, db };
}

export default function App() {
  const [services, setServices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState({ displayName: '', photoURL: null });
  const [transactions, setTransactions] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [activeFilter, setActiveFilter] = useState('all');
  const [historyFilter, setHistoryFilter] = useState('all');
  const [modalFilter, setModalFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [reportPeriod, setReportPeriod] = useState('weekly');
  const [selectedReportPeriod, setSelectedReportPeriod] = useState('');
  const [currency, setCurrencyState] = useState('NGN');
  const [hideBalance, setHideBalanceState] = useState(false);
  const [theme, setThemeState] = useState('dark');
  const [avatarColor, setAvatarColorState] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(window.innerWidth <= 1024);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncState, setSyncState] = useState('ok');
  const [desktopDropdownOpen, setDesktopDropdownOpen] = useState(false);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [depositForm, setDepositForm] = useState({ name: '', amount: '' });
  const [expenseForm, setExpenseForm] = useState({ name: '', amount: '' });
  const [formErrors, setFormErrors] = useState({ deposit: {}, expense: {} });
  const [toasts, setToasts] = useState([]);
  const [profileNameDraft, setProfileNameDraft] = useState('');
  const [profileNameError, setProfileNameError] = useState('');
  const listenerRef = useRef(null);
  const pendingSaveRef = useRef(false);

  const userName = useMemo(() => getRealName(currentUser, profile), [currentUser, profile]);
  const greeting = useMemo(() => `${getGreeting()}, ${userName.split(' ')[0]}`, [userName]);
  const initial = userName.trim()[0]?.toUpperCase() || 'U';

  const addToast = useCallback((message, type = 'delete') => {
    const cfg = toastTypes[type] || toastTypes.delete;
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, message, ...cfg }]);
    setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), type === 'warning' || type === 'error' ? 5000 : 3200);
  }, []);

  const savePreference = useCallback((key, value) => {
    if (!services || !currentUser) return;
    services.db.collection('users').doc(currentUser.uid).set({ preferences: { [key]: value } }, { merge: true }).catch(console.error);
  }, [currentUser, services]);

  const persistTransactions = useCallback((nextTransactions) => {
    if (!services || !currentUser) return;
    if (!navigator.onLine) {
      pendingSaveRef.current = true;
      setSyncState('error');
      return;
    }
    setSyncState('syncing');
    const serialized = nextTransactions.map((tx) => ({ ...tx, date: new Date(tx.date).toISOString() }));
    services.db.collection('users').doc(currentUser.uid).collection('transactions').doc('all').set({
      transactions: serialized,
      updatedAt: services.firebase.firestore.FieldValue.serverTimestamp(),
    }, { merge: true }).then(() => {
      pendingSaveRef.current = false;
      setSyncState('ok');
    }).catch((error) => {
      console.error('Firestore save error:', error);
      pendingSaveRef.current = true;
      setSyncState('error');
    });
  }, [currentUser, services]);

  useEffect(() => {
    bootstrapFirebase().then(setServices).catch((error) => {
      console.error(error);
      addToast('Unable to initialize Firebase. Check your connection and refresh.', 'error');
      setLoading(false);
    });
  }, [addToast]);

  useEffect(() => {
    if (!services) return undefined;
    const unsubscribe = services.auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      setCurrentUser(user);
      const docRef = services.db.collection('users').doc(user.uid);
      try {
        const snap = await docRef.get();
        const data = snap.exists ? snap.data() : {};
        const preferences = data.preferences || {};
        const nextProfile = { displayName: data.displayName || user.displayName || getRealName(user), photoURL: data.photoURL || null };
        setProfile(nextProfile);
        setProfileNameDraft(nextProfile.displayName);
        setCurrencyState(preferences.currency || 'NGN');
        setHideBalanceState(preferences.hideBalance === true);
        setThemeState(preferences.theme || 'dark');
        setAvatarColorState(preferences.avatarColor || null);
        setSidebarCollapsedState(preferences.isSidebarCollapsed !== undefined ? preferences.isSidebarCollapsed === true : window.innerWidth <= 1024);
        await docRef.set({ email: user.email, displayName: nextProfile.displayName, lastLogin: services.firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }).catch(() => {});
      } catch (error) {
        console.error('Error loading user profile:', error);
        const fallbackName = getRealName(user);
        setProfile({ displayName: fallbackName, photoURL: null });
        setProfileNameDraft(fallbackName);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [services]);

  useEffect(() => {
    if (!services || !currentUser) return undefined;
    if (listenerRef.current) listenerRef.current();
    listenerRef.current = services.db.collection('users').doc(currentUser.uid).collection('transactions').doc('all').onSnapshot({ includeMetadataChanges: true }, (doc) => {
      const incoming = doc.exists && doc.data().transactions ? doc.data().transactions.map((tx) => ({ ...tx, date: new Date(tx.date) })) : [];
      setTransactions(incoming);
      if (!navigator.onLine || doc.metadata.fromCache) setSyncState('offline_cached');
      else if (doc.metadata.hasPendingWrites) setSyncState('syncing');
      else setSyncState('ok');
    }, (error) => {
      console.error('Firestore listener error:', error);
      setSyncState(navigator.onLine ? 'error' : 'offline_cached');
    });
    return () => {
      if (listenerRef.current) listenerRef.current();
      listenerRef.current = null;
    };
  }, [currentUser, services]);

  useEffect(() => {
    const online = () => {
      setIsOnline(true);
      if (services?.db) services.db.enableNetwork().catch(() => {});
      if (pendingSaveRef.current) persistTransactions(transactions);
    };
    const offline = () => {
      setIsOnline(false);
      setSyncState('offline_cached');
      if (services?.db) services.db.disableNetwork().catch(() => {});
    };
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, [persistTransactions, services, transactions]);

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
  }, [theme]);

  useEffect(() => {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    el.className = `sync-status${syncState === 'syncing' ? ' syncing' : syncState === 'error' || syncState === 'offline_cached' ? ' error' : ''}`;
  }, [syncState, activeView]);

  useEffect(() => {
    const cleanup = setupInactivityTracker(() => {
      addToast('Session expired due to inactivity. Please sign in again.', 'warning');
      setTimeout(() => {
        const el = document.getElementById('view-profile');
        if (el) {
          confirmAction('Session Expired', 'Sign in again to continue.', () => {
            services?.auth.signOut();
          });
        } else {
          services?.auth.signOut();
        }
      }, 5000);
    });
    return cleanup;
  }, [addToast, services]);

  function setCurrency(value) {
    setCurrencyState(value);
    savePreference('currency', value);
  }

  function setHideBalance(value) {
    setHideBalanceState(value);
    savePreference('hideBalance', value);
  }

  function setTheme(value) {
    setThemeState(value);
    savePreference('theme', value);
  }

  function setAvatarColor(value) {
    setAvatarColorState(value);
    savePreference('avatarColor', value);
  }

  function setSidebarCollapsed(value) {
    setSidebarCollapsedState(value);
    savePreference('isSidebarCollapsed', value);
  }

  function updateForm(type, patch) {
    if (type === 'deposit') setDepositForm((form) => ({ ...form, ...patch }));
    else setExpenseForm((form) => ({ ...form, ...patch }));
    setFormErrors((errors) => ({ ...errors, [type]: {} }));
  }

  function submitTransaction(type) {
    if (!canSubmitTransaction()) {
      addToast('Please wait before submitting another transaction.', 'warning');
      return;
    }
    const form = type === 'deposit' ? depositForm : expenseForm;
    const result = validateEntry(form.name, form.amount);
    if (!result.valid) {
      setFormErrors((errors) => ({ ...errors, [type]: result.errors }));
      addToast('Please fix the errors above.', 'error');
      return;
    }

    if (type === 'expense') {
      const { bal } = getMetrics(transactions);
      if (result.amount > bal) {
        addToast(`Cannot record ${formatMoney(result.amount, currency)} \u2014 only ${formatMoney(bal, currency)} available.`, 'warning');
        return;
      }
    }

    const next = [...transactions, { id: Date.now(), type, name: result.name, amount: result.amount, date: new Date() }];
    setTransactions(next);
    persistTransactions(next);
    if (type === 'deposit') setDepositForm({ name: '', amount: '' });
    else setExpenseForm({ name: '', amount: '' });
    addToast(type === 'deposit' ? `${formatMoney(result.amount, currency)} deposited from <b>${result.name}</b>` : `${formatMoney(result.amount, currency)} expense recorded for <b>${result.name}</b>`, type);
  }

  function deleteTransaction(id) {
    const tx = transactions.find((item) => item.id === id);
    if (!tx) return;
    if (tx.type !== 'expense') {
      addToast('Deposits cannot be deleted.', 'error');
      return;
    }
    const next = transactions.map((item) =>
      item.id === id ? { ...item, deleted: true } : item
    );
    setTransactions(next);
    persistTransactions(next);
    addToast(`"${tx.name}" removed (balance unchanged)`, 'delete');
  }

  function confirmAction(title, desc, onConfirm) {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, title, message: desc, onConfirm: () => { onConfirm(); }, border: 'var(--amber)', bg: 'var(--amber-dim)', color: 'var(--amber)', icon: 'fa-solid fa-triangle-exclamation' }]);
  }

  function clearAll() {
    confirmAction('Clear all transactions?', 'Transactions will be hidden but balance remains unchanged.', () => {
      const next = transactions.map((tx) => ({ ...tx, deleted: true }));
      setTransactions(next);
      persistTransactions(next);
      addToast('All transactions hidden. Balance preserved.', 'delete');
    });
  }

  async function logout() {
    confirmAction('Sign out of XPNS?', 'Your data is safely synced to the cloud.', () => {
      if (listenerRef.current) listenerRef.current();
      services?.auth.signOut();
    });
  }

  async function saveProfileName() {
    const name = profileNameDraft.trim();
    if (!name) {
      setProfileNameError('Enter a display name.');
      return;
    }
    setProfileNameError('');
    setProfile((value) => ({ ...value, displayName: name }));
    await currentUser?.updateProfile?.({ displayName: name }).catch(() => {});
    await services?.db.collection('users').doc(currentUser.uid).set({ displayName: name }, { merge: true }).catch(console.error);
    addToast('Profile name updated.', 'success');
  }

  function uploadAvatar(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const photoURL = reader.result;
      setProfile((value) => ({ ...value, photoURL }));
      await services?.db.collection('users').doc(currentUser.uid).set({ photoURL }, { merge: true }).catch(console.error);
      addToast('Profile picture updated.', 'success');
    };
    reader.readAsDataURL(file);
  }

  function exportPDF() {
    const doc = new jsPDF();
    const { dep, exp, bal } = getMetrics(transactions);
    const fmtPDF = (n) => `${currency === 'NGN' ? 'NGN ' : '$'}${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text('XPNS.', 14, 20);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(112, 112, 160);
    doc.text('Premium Expense Report', 14, 25);
    doc.text(`User: ${userName}`, 140, 16);
    doc.text(`Email: ${currentUser?.email || 'N/A'}`, 140, 21);
    doc.text(`Exported: ${new Date().toLocaleString('en-NG')}`, 140, 26);
    doc.line(14, 30, 196, 30);
    doc.setTextColor(17, 17, 40);
    doc.setFont('Helvetica', 'bold');
    doc.text('Financial Summary', 14, 40);
    doc.setFont('Helvetica', 'normal');
    doc.text(`Deposits: ${fmtPDF(dep)}`, 14, 50);
    doc.text(`Expenses: ${fmtPDF(exp)}`, 14, 58);
    doc.text(`Net Balance: ${bal < 0 ? '-' : ''}${fmtPDF(bal)}`, 14, 66);
    doc.autoTable({
      startY: 76,
      head: [['Date', 'Type', 'Description', 'Amount']],
      body: [...activeTx].sort((a, b) => new Date(a.date) - new Date(b.date)).map((tx) => [new Date(tx.date).toLocaleString('en-NG'), tx.type.toUpperCase(), tx.name, `${tx.type === 'deposit' ? '+' : '-'}${fmtPDF(tx.amount)}`]),
      theme: 'striped',
      headStyles: { fillColor: [99, 102, 241], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { font: 'Helvetica', fontSize: 9, cellPadding: 3.5 },
    });
    doc.save(`xpns-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    addToast('PDF report downloaded.', 'success');
  }

  function handleAvatarAction(action) {
    setDesktopDropdownOpen(false);
    setMobileDropdownOpen(false);
    if (action === 'logout') logout();
    else setActiveView('profile');
  }

  const activeTx = useMemo(() => activeTransactions(transactions), [transactions]);

  const appState = {
    transactions,
    activeTx,
    currency,
    hideBalance,
    activeFilter,
    depositForm,
    expenseForm,
    formErrors,
    theme,
    userName: greeting,
  };

  const appActions = {
    setActiveFilter,
    updateForm,
    submitTransaction,
    deleteTransaction,
    toggleHideBalance: () => setHideBalance(!hideBalance),
    openModal: () => { setModalFilter(activeFilter); setModalOpen(true); },
  };

  return (
    <>
      <LoadingScreen loading={loading} />
      <OfflineBanner isOnline={isOnline} />
      <Suspense fallback={<div className="loading-fallback"><div className="spinner" /></div>}>
        {!currentUser && !loading && <LoginView />}
        {currentUser && !loading && (
          <div className={`app${sidebarCollapsed ? ' collapsed' : ''}`} id="appView">
            <Sidebar
              activeView={activeView}
              setActiveView={setActiveView}
              collapsed={sidebarCollapsed}
              setCollapsed={setSidebarCollapsed}
              theme={theme}
              toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              currency={currency}
              setCurrency={setCurrency}
              initial={initial}
              photoURL={profile.photoURL}
              dropdownOpen={desktopDropdownOpen}
              toggleDropdown={() => setDesktopDropdownOpen((open) => !open)}
              onAvatarAction={handleAvatarAction}
              onLogout={logout}
            />
            <MobileBars activeView={activeView} setActiveView={setActiveView} initial={initial} photoURL={profile.photoURL} dropdownOpen={mobileDropdownOpen} toggleDropdown={() => setMobileDropdownOpen((open) => !open)} onAvatarAction={handleAvatarAction} />
            <main className="main-content">
              {activeView === 'dashboard' && <DashboardView state={appState} actions={appActions} />}
              {activeView === 'history' && <HistoryView transactions={transactions} currency={currency} filter={historyFilter} setFilter={setHistoryFilter} search={search} setSearch={setSearch} onDelete={deleteTransaction} onExportPDF={exportPDF} />}
              {activeView === 'reports' && <ReportsView transactions={transactions} currency={currency} hideBalance={hideBalance} reportPeriod={reportPeriod} setReportPeriod={setReportPeriod} selectedPeriod={selectedReportPeriod} setSelectedPeriod={setSelectedReportPeriod} />}
              {activeView === 'profile' && <ProfileView user={currentUser} profile={profile} transactions={transactions} currency={currency} hideBalance={hideBalance} theme={theme} avatarColor={avatarColor} colorPickerOpen={colorPickerOpen} setColorPickerOpen={setColorPickerOpen} setAvatarColor={setAvatarColor} setCurrency={setCurrency} toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} toggleHideBalance={() => setHideBalance(!hideBalance)} onSaveName={saveProfileName} profileNameDraft={profileNameDraft} setProfileNameDraft={setProfileNameDraft} profileNameError={profileNameError} onAvatarUpload={uploadAvatar} onClearAll={clearAll} onExportPDF={exportPDF} onLogout={logout} />}
            </main>
            <TransactionModal open={modalOpen} filter={modalFilter} setFilter={setModalFilter} transactions={transactions} currency={currency} onClose={() => setModalOpen(false)} onDelete={deleteTransaction} />
          </div>
        )}
      </Suspense>
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts((items) => items.filter((item) => item.id !== id))} />
    </>
  );
}
