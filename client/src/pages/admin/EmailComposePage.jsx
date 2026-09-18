import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../../services/api';

const AUDIENCES = [
  ['ALL_USERS', 'All registered users'],
  ['SELECTED_USERS', 'Selected users'],
  ['EXTERNAL', 'Outside emails only'],
  ['MIXED', 'Selected users + outside emails'],
];

export default function EmailComposePage() {
  const [audience, setAudience] = useState('ALL_USERS');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [ctaLabel, setCtaLabel] = useState('Open Updaterw');
  const [ctaUrl, setCtaUrl] = useState(window.location.origin);
  const [externalEmails, setExternalEmails] = useState('');
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [preview, setPreview] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get('/admin/emails').then(({ data }) => setHistory(data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      api.get('/admin/emails/recipients', { params: { q: query } })
        .then(({ data }) => setOptions(data.data || []))
        .catch(() => setOptions([]));
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  function payload() {
    return {
      audience,
      subject,
      message,
      ctaLabel,
      ctaUrl,
      userIds: selected.map((user) => user.id),
      externalEmails: externalEmails.split(/[,;\s]+/).filter(Boolean),
    };
  }

  async function runPreview() {
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/admin/emails/preview', payload());
      setPreview(data.data);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not preview email'));
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!window.confirm('Send this email now?')) return;
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/admin/emails/send', payload());
      setPreview(null);
      alert(`Sent to ${data.data.sent} recipients${data.data.failed ? `, ${data.data.failed} failed` : ''}.`);
      const historyRes = await api.get('/admin/emails');
      setHistory(historyRes.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not send email'));
    } finally {
      setBusy(false);
    }
  }

  function toggleUser(user) {
    setSelected((current) => (
      current.some((item) => item.id === user.id)
        ? current.filter((item) => item.id !== user.id)
        : [...current, user]
    ));
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,1fr)_340px] gap-8">
      <div>
        <h1 className="mt-0">Email members</h1>
        <p className="text-[var(--text-soft)]">Send announcements to everyone, selected members, or outside addresses. Preview before sending.</p>
        <label className="label">Audience</label>
        <select className="field mb-4" value={audience} onChange={(e) => setAudience(e.target.value)}>
          {AUDIENCES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        {(audience === 'SELECTED_USERS' || audience === 'MIXED') ? (
          <div className="mb-4">
            <label className="label">Choose users</label>
            <input className="field mb-2" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, username, email" />
            <div className="border border-[var(--border)] rounded-[8px] max-h-40 overflow-auto">
              {options.map((user) => (
                <label key={user.id} className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] text-sm">
                  <input type="checkbox" checked={selected.some((item) => item.id === user.id)} onChange={() => toggleUser(user)} />
                  <span>{user.fullName} · @{user.username} · {user.email}</span>
                </label>
              ))}
            </div>
            {selected.length ? <p className="text-xs text-[var(--text-soft)]">{selected.length} selected</p> : null}
          </div>
        ) : null}
        {(audience === 'EXTERNAL' || audience === 'MIXED' || audience === 'ALL_USERS') ? (
          <div className="mb-4">
            <label className="label">Outside emails</label>
            <textarea className="textarea" value={externalEmails} onChange={(e) => setExternalEmails(e.target.value)} placeholder="person@company.com, another@domain.com" />
          </div>
        ) : null}
        <label className="label">Subject</label>
        <input className="field mb-4" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <label className="label">Message</label>
        <textarea className="textarea mb-4" value={message} onChange={(e) => setMessage(e.target.value)} rows={8} />
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">Button label</label>
            <input className="field" value={ctaLabel} onChange={(e) => setCtaLabel(e.target.value)} />
          </div>
          <div>
            <label className="label">Button URL</label>
            <input className="field" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} />
          </div>
        </div>
        {error ? <p className="text-red-600 text-sm">{error}</p> : null}
        <div className="flex gap-2">
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={runPreview}>{busy ? 'Working…' : 'Preview'}</button>
          <button type="button" className="btn" disabled={busy} onClick={send}>Send email</button>
        </div>
        {preview ? (
          <div className="mt-8">
            <h2>Preview</h2>
            <p className="text-sm text-[var(--text-soft)]">{preview.recipientCount} recipients · {preview.audience}</p>
            <div className="border border-[var(--border)] rounded-[8px] overflow-hidden bg-white text-black" dangerouslySetInnerHTML={{ __html: preview.html || preview.htmlBody || '' }} />
          </div>
        ) : null}
      </div>
      <aside>
        <h3 className="mt-0">Recent emails</h3>
        <div className="grid gap-3">
          {history.map((item) => (
            <button
              key={item.id}
              type="button"
              className="text-left border border-[var(--border)] rounded-[8px] p-3"
              onClick={() => setPreview({ ...item, html: item.html || item.htmlBody })}
            >
              <b className="block">{item.subject}</b>
              <span className="text-xs text-[var(--text-soft)]">{item.status} · {item.recipientCount} recipients</span>
            </button>
          ))}
          {!history.length ? <p className="text-sm text-[var(--text-soft)]">No emails yet.</p> : null}
        </div>
      </aside>
    </div>
  );
}
