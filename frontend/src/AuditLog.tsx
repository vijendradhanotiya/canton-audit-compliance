import React, { useState, useMemo, useEffect } from 'react';
import { useStreamQueries } from '@c7/react';
import { AuditEntry } from '@daml.js/canton-audit-compliance-0.1.0/lib/Main';

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    margin: '20px',
    padding: '20px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    backgroundColor: '#f9f9f9',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
  },
  title: {
    margin: 0,
    fontSize: '1.5em',
    color: '#333',
  },
  filters: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    alignItems: 'center',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  label: {
    marginBottom: '5px',
    fontSize: '0.9em',
    color: '#555',
    fontWeight: 'bold',
  },
  select: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    minWidth: '200px',
  },
  input: {
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    minWidth: '200px',
  },
  button: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
  logContainer: {
    maxHeight: '60vh',
    overflowY: 'auto',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    position: 'sticky',
    top: 0,
    backgroundColor: '#f2f2f2',
    textAlign: 'left',
    padding: '12px',
    borderBottom: '2px solid #ddd',
    fontWeight: 'bold',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #eee',
  },
  tr: {
    '&:hover': {
      backgroundColor: '#f5f5f5',
    },
  },
  noEntries: {
    padding: '20px',
    textAlign: 'center',
    color: '#777',
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    color: '#777',
  },
};

export const AuditLog: React.FC = () => {
  const { contracts: auditEntries, loading } = useStreamQueries(AuditEntry);
  
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('');
  const [actorFilter, setActorFilter] = useState<string>('');

  const [uniqueEventTypes, setUniqueEventTypes] = useState<string[]>([]);
  const [uniqueActors, setUniqueActors] = useState<string[]>([]);

  useEffect(() => {
    if (auditEntries.length > 0) {
      const types = new Set(auditEntries.map(e => e.payload.eventType));
      const actors = new Set(auditEntries.map(e => e.payload.actor));
      setUniqueEventTypes(Array.from(types).sort());
      setUniqueActors(Array.from(actors).sort());
    }
  }, [auditEntries]);


  const sortedAndFilteredEntries = useMemo(() => {
    return auditEntries
      .filter(entry => {
        const eventTypeMatch = eventTypeFilter === '' || entry.payload.eventType === eventTypeFilter;
        const actorMatch = actorFilter === '' || entry.payload.actor.toLowerCase().includes(actorFilter.toLowerCase());
        return eventTypeMatch && actorMatch;
      })
      .sort((a, b) => new Date(b.payload.timestamp).getTime() - new Date(a.payload.timestamp).getTime());
  }, [auditEntries, eventTypeFilter, actorFilter]);

  const handleClearFilters = () => {
    setEventTypeFilter('');
    setActorFilter('');
  };

  const renderLogEntries = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={4} style={styles.loading}>Loading audit log...</td>
        </tr>
      );
    }
    if (sortedAndFilteredEntries.length === 0) {
      return (
        <tr>
          <td colSpan={4} style={styles.noEntries}>No audit entries found.</td>
        </tr>
      );
    }
    return sortedAndFilteredEntries.map(entry => (
      <tr key={entry.contractId} style={styles.tr}>
        <td style={styles.td}>{new Date(entry.payload.timestamp).toLocaleString()}</td>
        <td style={styles.td}>{entry.payload.eventType}</td>
        <td style={styles.td}>{entry.payload.actor}</td>
        <td style={styles.td}>{entry.payload.eventDetails}</td>
      </tr>
    ));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Immutable Audit Log</h1>
        <span>Total Entries: {sortedAndFilteredEntries.length}</span>
      </div>

      <div style={styles.filters}>
        <div style={styles.filterGroup}>
          <label htmlFor="eventType" style={styles.label}>Event Type</label>
          <select
            id="eventType"
            value={eventTypeFilter}
            onChange={e => setEventTypeFilter(e.target.value)}
            style={styles.select}
          >
            <option value="">All Event Types</option>
            {uniqueEventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div style={styles.filterGroup}>
          <label htmlFor="actor" style={styles.label}>Actor</label>
          <input
            id="actor"
            type="text"
            placeholder="Filter by actor..."
            value={actorFilter}
            onChange={e => setActorFilter(e.target.value)}
            style={styles.input}
          />
        </div>
        <button onClick={handleClearFilters} style={styles.button}>Clear Filters</button>
      </div>

      <div style={styles.logContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={{...styles.th, width: '25%'}}>Timestamp</th>
              <th style={{...styles.th, width: '20%'}}>Event Type</th>
              <th style={{...styles.th, width: '20%'}}>Actor</th>
              <th style={{...styles.th, width: '35%'}}>Event Details</th>
            </tr>
          </thead>
          <tbody>
            {renderLogEntries()}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLog;