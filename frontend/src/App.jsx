import { useEffect, useMemo, useState } from 'react';

const initialSampleLogs = [
  {
    actor: 'priya.nair@company.com',
    role: 'admin',
    action: 'DELETE_USER',
    resource: '/api/users/334',
    resourceType: 'USER',
    ipAddress: '192.168.1.45',
    region: 'ap-south-1',
    severity: 'HIGH',
    status: 'Unresolved',
    timestamp: '2025-06-14T08:32:11Z'
  }
];

const emptyFilters = {
  search: '',
  actor: '',
  role: '',
  action: '',
  resource: '',
  resourceType: '',
  ipAddress: '',
  region: '',
  severity: '',
  status: '',
  sortBy: 'timestamp',
  sortOrder: 'desc',
  page: 1,
  limit: 25
};

const severityOptions = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const statusOptions = ['', 'Unresolved', 'Resolved', 'Investigating'];
const sortFields = [
  { value: 'timestamp', label: 'Timestamp' },
  { value: 'severity', label: 'Severity' },
  { value: 'status', label: 'Status' },
  { value: 'actor', label: 'Actor' },
  { value: 'region', label: 'Region' },
  { value: 'resourceType', label: 'Resource Type' },
  { value: 'action', label: 'Action' }
];

const formatDate = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const badgeClassBySeverity = {
  LOW: 'badge badge-low',
  MEDIUM: 'badge badge-medium',
  HIGH: 'badge badge-high',
  CRITICAL: 'badge badge-critical'
};

function App() {
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, page: 1, limit: 25 });
  const [filters, setFilters] = useState(emptyFilters);
  const [draftUpload, setDraftUpload] = useState(JSON.stringify(initialSampleLogs, null, 2));
  const [uploadMessage, setUploadMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (value !== '' && value !== null && value !== undefined) {
        params.set(key, String(value));
      }
    }

    return params.toString();
  }, [filters]);

  useEffect(() => {
    const controller = new AbortController();

    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/logs?${queryString}`, { signal: controller.signal });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.message || 'Failed to load logs');
        }

        setLogs(payload.data || []);
        setMeta({
          total: payload.total ?? 0,
          totalPages: payload.totalPages ?? 1,
          page: payload.page ?? 1,
          limit: payload.limit ?? filters.limit
        });
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError(fetchError.message || 'Failed to load logs');
        }
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [queryString, refreshTick]);

  const updateFilter = (field, value) => {
    setFilters((current) => ({
      ...current,
      [field]: value,
      page: field === 'page' ? value : 1
    }));
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    try {
      setUploading(true);
      setUploadMessage('');
      setError('');

      const parsed = JSON.parse(draftUpload);

      const response = await fetch('/api/logs/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsed)
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.message || 'Upload failed');
      }

      setUploadMessage(`Uploaded ${payload.count ?? parsed.length} log records.`);
      setFilters((current) => ({ ...current, page: 1 }));
      setRefreshTick((value) => value + 1);
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSampleLoad = () => {
    setDraftUpload(JSON.stringify(initialSampleLogs, null, 2));
  };

  const canGoBack = filters.page > 1;
  const canGoForward = filters.page < meta.totalPages;

  return (
    <div className="app-shell">
      <div className="app-orb app-orb-left" />
      <div className="app-orb app-orb-right" />

      <main className="dashboard">
        <section className="hero card">
          <div>
            <p className="eyebrow">Audit review</p>
            <h1>Audit logs, made easy to read</h1>
            <p className="hero-copy">
              Upload a batch of logs, search the noisy stuff fast, and keep the view tidy with server-side
              filters, sorting, and pagination.
            </p>
            <div className="hero-tags">
              <span className="tag">Bulk upload</span>
              <span className="tag">Quick search</span>
              <span className="tag">Clean table view</span>
            </div>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-label">Records found</span>
              <strong>{meta.total}</strong>
            </div>
            <div className="stat">
              <span className="stat-label">Showing page</span>
              <strong>{meta.page} / {meta.totalPages}</strong>
            </div>
            <div className="stat">
              <span className="stat-label">Rows per page</span>
              <strong>{meta.limit}</strong>
            </div>
          </div>
        </section>

        <section className="grid two-up">
          <form className="card form-card" onSubmit={handleUpload}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Upload</p>
                <h2>Paste your log array here</h2>
              </div>
              <button type="button" className="ghost-button" onClick={handleSampleLoad}>
                Use sample data
              </button>
            </div>

            <p className="section-note">
              Drop in a JSON array. Each object should follow the same shape as the sample.
            </p>

            <label className="field">
              <span>Logs JSON</span>
              <textarea
                rows="12"
                value={draftUpload}
                onChange={(event) => setDraftUpload(event.target.value)}
                spellCheck="false"
              />
            </label>

            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={uploading}>
                {uploading ? 'Saving...' : 'Save logs'}
              </button>
              {uploadMessage ? <span className="success-text">{uploadMessage}</span> : null}
            </div>
            <p className="helper-text">The backend accepts up to 10,000 records in one request.</p>
          </form>

          <section className="card filter-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Search</p>
                <h2>Find the record you need</h2>
              </div>
            </div>

            <p className="section-note">
              Narrow the table by searching a person, action, service, region, or status.
            </p>

            <div className="filter-grid">
              <label className="field field-wide">
                <span>Search anything</span>
                <input
                  value={filters.search}
                  onChange={(event) => updateFilter('search', event.target.value)}
                  placeholder="Try actor, action, resource, or region"
                />
              </label>
              <label className="field">
                <span>Severity</span>
                <select value={filters.severity} onChange={(event) => updateFilter('severity', event.target.value)}>
                  {severityOptions.map((option) => (
                    <option key={option || 'all-severity'} value={option}>
                      {option || 'All severities'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Status</span>
                <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
                  {statusOptions.map((option) => (
                    <option key={option || 'all-status'} value={option}>
                      {option || 'All statuses'}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Actor</span>
                <input value={filters.actor} onChange={(event) => updateFilter('actor', event.target.value)} placeholder="priya.nair@company.com" />
              </label>
              <label className="field">
                <span>Role</span>
                <input value={filters.role} onChange={(event) => updateFilter('role', event.target.value)} placeholder="admin" />
              </label>
              <label className="field">
                <span>Action</span>
                <input value={filters.action} onChange={(event) => updateFilter('action', event.target.value)} placeholder="DELETE_USER" />
              </label>
              <label className="field">
                <span>Resource</span>
                <input value={filters.resource} onChange={(event) => updateFilter('resource', event.target.value)} placeholder="/api/users/334" />
              </label>
              <label className="field">
                <span>Resource type</span>
                <input value={filters.resourceType} onChange={(event) => updateFilter('resourceType', event.target.value)} placeholder="USER" />
              </label>
              <label className="field">
                <span>IP address</span>
                <input value={filters.ipAddress} onChange={(event) => updateFilter('ipAddress', event.target.value)} placeholder="192.168.1.45" />
              </label>
              <label className="field">
                <span>Region</span>
                <input value={filters.region} onChange={(event) => updateFilter('region', event.target.value)} placeholder="ap-south-1" />
              </label>
              <label className="field">
                <span>Sort by</span>
                <select value={filters.sortBy} onChange={(event) => updateFilter('sortBy', event.target.value)}>
                  {sortFields.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Order</span>
                <select value={filters.sortOrder} onChange={(event) => updateFilter('sortOrder', event.target.value)}>
                  <option value="desc">Newest first</option>
                  <option value="asc">Oldest first</option>
                </select>
              </label>
              <label className="field">
                <span>Rows per page</span>
                <select value={filters.limit} onChange={(event) => updateFilter('limit', Number(event.target.value))}>
                  {[10, 25, 50, 100].map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
        </section>

        <section className="card table-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Results</p>
              <h2>What the server returned</h2>
            </div>
            <div className="inline-controls">
              <button className="ghost-button" type="button" onClick={() => setFilters(emptyFilters)}>
                Clear filters
              </button>
            </div>
          </div>

          <p className="table-note">
            Showing {logs.length} of {meta.total} records on page {meta.page}.
          </p>

          {error ? <p className="error-text">{error}</p> : null}
          {loading ? <p className="helper-text">Loading records from the server...</p> : null}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Type</th>
                  <th>IP</th>
                  <th>Region</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="10" className="empty-state">
                      No records match these filters. Try clearing one field or changing the search text.
                    </td>
                  </tr>
                ) : null}

                {logs.map((log) => (
                  <tr key={`${log._id || log.actor}-${log.timestamp}`}>
                    <td>{log.actor}</td>
                    <td>{log.role}</td>
                    <td>{log.action}</td>
                    <td className="resource-cell">{log.resource}</td>
                    <td>{log.resourceType}</td>
                    <td>{log.ipAddress}</td>
                    <td>{log.region}</td>
                    <td>
                      <span className={badgeClassBySeverity[log.severity] || 'badge'}>{log.severity}</span>
                    </td>
                    <td>{log.status}</td>
                    <td>{formatDate(log.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pager">
            <button className="ghost-button" type="button" disabled={!canGoBack} onClick={() => updateFilter('page', filters.page - 1)}>
              Back
            </button>
            <span>
              Page {meta.page} of {meta.totalPages}
            </span>
            <button className="ghost-button" type="button" disabled={!canGoForward} onClick={() => updateFilter('page', filters.page + 1)}>
              Forward
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;