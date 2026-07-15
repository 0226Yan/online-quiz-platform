import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Navbar from '../components/Navbar';
import Spinner from '../components/Spinner';
import api from '../api/api';

const questionSchema = z.object({
  text: z.string().min(1, 'Question text is required').max(500),
  option0: z.string().min(1, 'Option A is required'),
  option1: z.string().min(1, 'Option B is required'),
  option2: z.string().min(1, 'Option C is required'),
  option3: z.string().min(1, 'Option D is required'),
  correctIndex: z.coerce.number().int().min(0).max(3),
  timeLimit: z.coerce.number().int().min(5).max(120),
});

const defaultValues = { text: '', option0: '', option1: '', option2: '', option3: '', correctIndex: 0, timeLimit: 30 };

const AdminPage = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null); // { kind: 'success' | 'error', message }
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [showBulk, setShowBulk] = useState(false);

  // Surface a transient toast at the top of the page. Auto-dismisses after 4s.
  const showToast = (kind, message) => {
    setToast({ kind, message });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 4000);
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(questionSchema),
    defaultValues,
  });

  const fetchQuestions = () => {
    setLoading(true);
    api.get('/admin/questions')
      .then((res) => setQuestions(res.data.data.questions))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(fetchQuestions, []);

  const openCreate = () => {
    setEditTarget(null);
    reset(defaultValues);
    setShowModal(true);
  };

  const openEdit = (q) => {
    setEditTarget(q);
    reset({
      text: q.text,
      option0: q.options[0],
      option1: q.options[1],
      option2: q.options[2],
      option3: q.options[3],
      correctIndex: q.correctIndex,
      timeLimit: q.timeLimit,
    });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    const payload = {
      text: data.text,
      options: [data.option0, data.option1, data.option2, data.option3],
      correctIndex: data.correctIndex,
      timeLimit: data.timeLimit,
    };
    try {
      if (editTarget) {
        await api.put(`/admin/questions/${editTarget._id}`, payload);
        showToast('success', 'Question updated.');
      } else {
        await api.post('/admin/questions', payload);
        showToast('success', 'Question created.');
      }
      setShowModal(false);
      fetchQuestions();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Save failed');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/questions/${deleteTarget._id}`);
      setDeleteTarget(null);
      showToast('success', 'Question deleted.');
      fetchQuestions();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Delete failed');
      setDeleteTarget(null);
    }
  };

  const toggleQuestion = async (id) => {
    try {
      await api.patch(`/admin/questions/${id}/toggle`);
      fetchQuestions();
    } catch (err) {
      showToast('error', err.response?.data?.error || 'Toggle failed');
    }
  };

  const handleBulkImport = async () => {
    setBulkError('');
    setBulkSuccess('');
    let parsed;
    try {
      parsed = JSON.parse(bulkText);
    } catch (parseErr) {
      setBulkError('Invalid JSON. Please check your input.');
      return;
    }
    try {
      const res = await api.post('/admin/questions/bulk-import', { questions: parsed });
      const { imported, skipped, skippedReason } = res.data.data;
      const skipMsg = skipped > 0 ? ` (${skipped} skipped — ${skippedReason})` : '';
      setBulkSuccess(`Imported ${imported} questions successfully.${skipMsg}`);
      setBulkText('');
      fetchQuestions();
    } catch (err) {
      setBulkError(err.response?.data?.error || 'Import failed');
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="flex-between mb-2">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>⚙️ Admin — Questions</h1>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-outline" onClick={() => setShowBulk(!showBulk)}>
              {showBulk ? 'Hide Bulk Import' : '📥 Bulk Import'}
            </button>
            <button className="btn-primary" onClick={openCreate}>+ New Question</button>
          </div>
        </div>

        {toast && (
          <div className={`banner banner-${toast.kind}`} role="status">
            <span>{toast.message}</span>
            <button className="banner-close" onClick={() => setToast(null)} aria-label="Dismiss">✕</button>
          </div>
        )}

        {showBulk && (
          <div className="card mb-2">
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Bulk Import (JSON Array)</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              Paste a JSON array. Each object: <code>{'{"text":"...","options":["A","B","C","D"],"correctIndex":0,"timeLimit":30}'}</code>
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={6}
              placeholder='[{"text":"What is 2+2?","options":["1","2","3","4"],"correctIndex":3,"timeLimit":20}]'
              style={{ fontFamily: 'monospace', fontSize: '0.82rem', marginBottom: '0.75rem' }}
            />
            {bulkError && <div className="banner banner-error" role="alert">{bulkError}</div>}
            {bulkSuccess && <div className="banner banner-success" role="status">{bulkSuccess}</div>}
            <button className="btn-primary" onClick={handleBulkImport} disabled={!bulkText.trim()}>
              Import
            </button>
          </div>
        )}

        {error && <div className="banner banner-error" role="alert">{error}</div>}
        {loading && <Spinner label="Loading questions…" />}

        {!loading && questions.length === 0 && (
          <div className="card text-center">
            <p className="text-muted">No questions yet. Create one or use bulk import.</p>
          </div>
        )}

        {!loading && questions.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Question</th>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ ...tdStyle, maxWidth: 320 }}>
                      <div style={{ fontWeight: 500, marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {q.text}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Correct: {q.options[q.correctIndex]}
                      </div>
                    </td>
                    <td style={tdStyle}>{q.timeLimit}s</td>
                    <td style={tdStyle}>
                      <span className={`badge ${q.isActive ? 'badge-green' : 'badge-red'}`}>
                        {q.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        <button
                          className="btn-outline"
                          style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                          onClick={() => openEdit(q)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn-outline"
                          style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                          onClick={() => toggleQuestion(q._id)}
                        >
                          {q.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          className="btn-danger"
                          style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                          onClick={() => setDeleteTarget(q)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', zIndex: 50,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between mb-2">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {editTarget ? 'Edit Question' : 'New Question'}
              </h2>
              <button className="btn-outline" style={{ padding: '0.3rem 0.7rem' }} onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group">
                <label>Question Text</label>
                <textarea rows={3} {...register('text')} />
                {errors.text && <p className="error-msg">{errors.text.message}</p>}
              </div>

              {['A', 'B', 'C', 'D'].map((letter, i) => (
                <div className="form-group" key={i}>
                  <label>Option {letter}</label>
                  <input type="text" {...register(`option${i}`)} />
                  {errors[`option${i}`] && <p className="error-msg">{errors[`option${i}`].message}</p>}
                </div>
              ))}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Correct Answer</label>
                  <select {...register('correctIndex')}>
                    <option value={0}>A</option>
                    <option value={1}>B</option>
                    <option value={2}>C</option>
                    <option value={3}>D</option>
                  </select>
                  {errors.correctIndex && <p className="error-msg">{errors.correctIndex.message}</p>}
                </div>
                <div className="form-group">
                  <label>Time Limit (seconds)</label>
                  <input type="number" min={5} max={120} {...register('timeLimit')} />
                  {errors.timeLimit && <p className="error-msg">{errors.timeLimit.message}</p>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editTarget ? 'Save Changes' : 'Create Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '1rem', zIndex: 60,
        }}>
          <div className="card" style={{ width: '100%', maxWidth: 420 }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Delete this question?
            </h2>
            <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: '1rem' }}>
              “{deleteTarget.text}”
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '1.25rem' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-outline" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const thStyle = { padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' };
const tdStyle = { padding: '0.75rem 1rem', fontSize: '0.9rem', verticalAlign: 'middle' };

export default AdminPage;
