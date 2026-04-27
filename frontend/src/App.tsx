import React, { useState } from 'react';
import { DamlLedger } from '@c7/react';
import { AuditLog } from './AuditLog';
import './App.css';

// For demo purposes, we use localStorage. In a production app, use secure cookie storage.
const LS_KEY_PARTY = 'canton-audit-compliance.party';
const LS_KEY_TOKEN = 'canton-audit-compliance.token';

type Credentials = {
  party: string;
  token: string;
};

const App: React.FC = () => {
  const [credentials, setCredentials] = useState<Credentials | null>(() => {
    const party = localStorage.getItem(LS_KEY_PARTY);
    const token = localStorage.getItem(LS_KEY_TOKEN);
    return party && token ? { party, token } : null;
  });

  const handleLogin = (creds: Credentials) => {
    localStorage.setItem(LS_KEY_PARTY, creds.party);
    localStorage.setItem(LS_KEY_TOKEN, creds.token);
    setCredentials(creds);
  };

  const handleLogout = () => {
    localStorage.removeItem(LS_KEY_PARTY);
    localStorage.removeItem(LS_KEY_TOKEN);
    setCredentials(null);
  };

  if (!credentials) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <DamlLedger party={credentials.party} token={credentials.token}>
      <MainScreen party={credentials.party} onLogout={handleLogout} />
    </DamlLedger>
  );
};

type LoginScreenProps = {
  onLogin: (credentials: Credentials) => void;
};

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [party, setParty] = useState('');
  const [token, setToken] = useState('');

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    if (party.trim() && token.trim()) {
      onLogin({ party: party.trim(), token: token.trim() });
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>Canton Audit & Compliance</h1>
        <p>Please log in to view the audit trail.</p>
        <form onSubmit={login}>
          <div className="form-group">
            <label htmlFor="party">Party ID</label>
            <input
              id="party"
              type="text"
              className="input-field"
              placeholder="e.g., Regulator::1220..."
              value={party}
              onChange={(e) => setParty(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label htmlFor="token">Auth Token (JWT)</label>
            <input
              id="token"
              type="password"
              className="input-field"
              placeholder="Paste your ledger JWT here"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <button type="submit" className="button primary" disabled={!party || !token}>Log In</button>
        </form>
         <div className="login-info">
          <p>Generate a JWT using your Party ID. For local testing with `dpm sandbox`, you can use a tool like jwt.io to create a token with a payload like:</p>
          <code>{`{"ledgerId": "sandbox", "applicationId": "foobar", "actAs": ["your-party-id"]}`}</code>
        </div>
      </div>
    </div>
  );
};

type MainScreenProps = {
  party: string;
  onLogout: () => void;
};

const MainScreen: React.FC<MainScreenProps> = ({ party, onLogout }) => {
  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="header-title">Compliance Dashboard</h1>
          <div className="header-user-info">
            <span className="user-party" title={party}>
              Logged in as: <strong>{party.split('::')[0]}</strong>
            </span>
            <button onClick={onLogout} className="button secondary">Logout</button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <AuditLog />
      </main>
      <footer className="app-footer">
        <p>Canton Immutable Audit Trail</p>
      </footer>
    </div>
  );
};

export default App;