/**
 * Event Form - Create/Edit Event - Refactored
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Loader2, Plus, X, Upload } from 'lucide-react';
import { Card, Button, Input, Select, Textarea } from '../../components/ui';
import * as eventService from '../../services/eventService';
import { API_URL } from '../../services/api';

export default function EventForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [venues, setVenues] = useState([]);
  const [artistsList, setArtistsList] = useState([]);

  const [form, setForm] = useState({
    title: '', description: '', category: 'MUSIC',
    startDate: '', startTime: '', endDate: '', endTime: '',
    venue: '', status: 'DRAFT', thumbnail: '', artists: [],
  });

  // Fetch venues and artists
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [venuesRes, artistsRes] = await Promise.all([
          fetch(`${API_URL}/venues`), fetch(`${API_URL}/artists`)
        ]);
        const [venuesData, artistsData] = await Promise.all([venuesRes.json(), artistsRes.json()]);
        if (venuesData.success) setVenues(venuesData.data.venues || []);
        if (artistsData.success) setArtistsList(artistsData.data.artists || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  // Fetch event if editing
  useEffect(() => {
    if (!isEdit || !id) return;
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/concerts/${id}`);
        const data = await res.json();
        if (data.success) {
          const c = data.data.concert;
          const start = new Date(c.start_time);
          const end = c.end_time ? new Date(c.end_time) : null;
          setForm({
            title: c.title, description: c.description || '', category: c.category || 'MUSIC',
            startDate: start.toISOString().split('T')[0], startTime: start.toTimeString().slice(0, 5),
            endDate: end ? end.toISOString().split('T')[0] : '', endTime: end ? end.toTimeString().slice(0, 5) : '',
            venue: c.venue?._id || '', status: c.status, thumbnail: c.thumbnail || '',
            artists: c.artists?.map(a => a._id) || [],
          });
        }
      } catch (error) {
        toast.error('Failed to load event');
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        title: form.title, description: form.description, category: form.category,
        start_time: new Date(`${form.startDate}T${form.startTime}`).toISOString(),
        end_time: form.endDate ? new Date(`${form.endDate}T${form.endTime}`).toISOString() : null,
        venue: form.venue || null, status: form.status, thumbnail: form.thumbnail, artists: form.artists,
      };
      
      if (isEdit) {
        await eventService.updateConcert(authFetch, id, payload);
        toast.success('Event updated');
      } else {
        await eventService.createConcert(authFetch, payload);
        toast.success('Event created');
      }
      navigate('/events');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleArtist = (artistId) => {
    setForm(f => ({
      ...f,
      artists: f.artists.includes(artistId) ? f.artists.filter(id => id !== artistId) : [...f.artists, artistId]
    }));
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/events" className="p-2 hover:bg-white/5 rounded-lg text-gray-400"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{isEdit ? 'Edit Event' : 'Create Event'}</h1>
          <p className="text-gray-400">{isEdit ? 'Update event details' : 'Add a new event'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Basic Information">
            <div className="space-y-4">
              <Input label="Event Title *" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Enter event title" />
              <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Event description..." />
              <div className="grid grid-cols-2 gap-4">
                <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  options={[{ value: 'MUSIC', label: 'Concert' }, { value: 'THEATER', label: 'Theater & Art' }, { value: 'SPORT', label: 'Sports' }, { value: 'OTHER', label: 'Other' }]} />
                <Select label="Venue" value={form.venue} onChange={e => setForm({ ...form, venue: e.target.value })}
                  options={[{ value: '', label: 'Select venue...' }, ...venues.map(v => ({ value: v._id, label: v.name }))]} />
              </div>
            </div>
          </Card>

          <Card title="Date & Time">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date *" type="date" required value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
              <Input label="Start Time *" type="time" required value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} />
              <Input label="End Date" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
              <Input label="End Time" type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </Card>

          <Card title="Artists">
            <div className="flex flex-wrap gap-2">
              {artistsList.map(artist => (
                <button key={artist._id} type="button" onClick={() => toggleArtist(artist._id)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${form.artists.includes(artist._id) ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  {artist.name}
                </button>
              ))}
              {artistsList.length === 0 && <p className="text-gray-500 text-sm">No artists available</p>}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Status">
            <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              options={Object.entries(eventService.STATUS_CONFIG).map(([v, c]) => ({ value: v, label: c.label }))} />
          </Card>

          <Card title="Thumbnail">
            <div className="space-y-3">
              {form.thumbnail && <img src={form.thumbnail} alt="Preview" className="w-full h-40 object-cover rounded-lg" />}
              <Input placeholder="Image URL" value={form.thumbnail} onChange={e => setForm({ ...form, thumbnail: e.target.value })} />
            </div>
          </Card>

          <div className="flex gap-3">
            <Link to="/events" className="flex-1"><Button type="button" variant="outline" className="w-full">Cancel</Button></Link>
            <Button type="submit" loading={saving} className="flex-1"><Save size={16} /> {isEdit ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
