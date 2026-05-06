import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [lead, setLead] = useState(null);
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLead();
    fetchNotes();
  }, [id]);

  const fetchLead = async () => {
    try {
      const response = await api.get(`/leads/${id}`);
      setLead(response.data);
    } catch (error) {
      console.error('Error fetching lead:', error);
    }
  };

  const fetchNotes = async () => {
    try {
      const response = await api.get(`/leads/${id}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const response = await api.post(`/leads/${id}/notes`, { content: newNote });
      setNotes([response.data, ...notes]);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (window.confirm('Delete this note?')) {
      try {
        await api.delete(`/notes/${noteId}`);
        setNotes(notes.filter(note => note._id !== noteId));
      } catch (error) {
        console.error('Error deleting note:', error);
      }
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const updatedLead = { ...lead, status: newStatus };
      await api.put(`/leads/${id}`, updatedLead);
      setLead(updatedLead);
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status.replace(' ', '')}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '2rem', color: 'white' }}>Loading...</div>;

  return (
    <div>
      <div className="nav">
        <a href="/"> Dashboard</a>
        <a href="/leads"> Leads</a>
        <a href="/leads/new"> New Lead</a>
        <button onClick={handleLogout}> Logout ({user?.name})</button>
      </div>

      <div className="container">
        {lead && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h1>{lead.name}</h1>
              <div>
                <button onClick={() => navigate(`/leads/${id}/edit`)} style={{ marginRight: '0.5rem' }}> Edit Lead</button>
                <button onClick={() => navigate('/leads')}>← Back to Leads</button>
              </div>
            </div>

            <div className="card">
              <h3>📌 Lead Information</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr><td style={{ padding: '0.75rem', fontWeight: 'bold', width: '200px' }}>Company:</td><td>{lead.company}</td></tr>
                  <tr><td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Email:</td><td><a href={`mailto:${lead.email}`} style={{ color: '#667eea' }}>{lead.email}</a></td></tr>
                  <tr><td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Phone:</td><td>{lead.phone || 'N/A'}</td></tr>
                  <tr><td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Lead Source:</td><td>{lead.source}</td></tr>
                  <tr><td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Salesperson:</td><td>{lead.salesperson}</td></tr>
                  <tr><td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Deal Value:</td><td><strong style={{ color: '#48bb78', fontSize: '1.1rem' }}>${lead.deal_value?.toLocaleString() || 0}</strong></td></tr>
                  <tr><td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Created:</td><td>{new Date(lead.created_date).toLocaleDateString()}</td></tr>
                  <tr>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold' }}>Status:</td>
                    <td>
                      <select 
                        value={lead.status} 
                        onChange={(e) => handleStatusUpdate(e.target.value)}
                        style={{ marginRight: '0.5rem', padding: '0.3rem 0.6rem', borderRadius: '8px', border: '2px solid #e2e8f0' }}
                      >
                        <option value="New"> New</option>
                        <option value="Contacted"> Contacted</option>
                        <option value="Qualified"> Qualified</option>
                        <option value="Proposal Sent"> Proposal Sent</option>
                        <option value="Won"> Won</option>
                        <option value="Lost"> Lost</option>
                      </select>
                      <span className={getStatusClass(lead.status)}>
                        Current: {lead.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3> Notes</h3>
              <form onSubmit={handleAddNote} style={{ marginBottom: '1.5rem' }}>
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this lead..."
                  rows="3"
                  style={{ width: '100%', padding: '0.75rem', marginBottom: '0.75rem', borderRadius: '12px', border: '2px solid #e2e8f0', fontFamily: 'inherit' }}
                />
                <button type="submit"> Add Note</button>
              </form>

              {notes.length === 0 ? (
                <p style={{ color: '#718096', textAlign: 'center', padding: '1rem' }}>No notes yet. Add your first note above!</p>
              ) : (
                notes.map(note => (
                  <div key={note._id} style={{ borderBottom: '1px solid #e2e8f0', padding: '1rem 0' }}>
                    <p style={{ margin: '0 0 0.5rem 0', lineHeight: '1.5' }}>{note.content}</p>
                    <small style={{ color: '#a0aec0' }}>
                      By <strong>{note.created_by}</strong> on {new Date(note.created_date).toLocaleString()}
                    </small>
                    <button 
                      onClick={() => handleDeleteNote(note._id)}
                      className="danger"
                      style={{ float: 'right', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LeadDetail;