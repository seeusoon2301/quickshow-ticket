/**
 * Venues List - Refactored
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, MapPin, Users, Layers, Edit, Trash2, RefreshCw, MoreVertical, Building2, Phone, Mail, Globe, Eye } from 'lucide-react';
import { PageLoader, EmptyState, SearchInput, Select, Button, Card, StatCard, Badge, Pagination, Modal, Input, Textarea, ConfirmDialog } from '../../components/ui';
import * as venueService from '../../services/venueService';

export default function VenuesList() {
  const { authFetch } = useAuth();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', city: '' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [showMenu, setShowMenu] = useState(null);
  const [modal, setModal] = useState({ type: null, venue: null });
  const [form, setForm] = useState(venueService.DEFAULT_VENUE_FORM);
  const [saving, setSaving] = useState(false);

  const cities = ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Can Tho', 'Hai Phong', 'Nha Trang'];

  const fetchVenues = useCallback(async () => {
    try {
      setLoading(true);
      const data = await venueService.getVenues(authFetch, { ...filters, page: pagination.page });
      setVenues(data.data.venues);
      setPagination(p => ({ ...p, ...data.data.pagination }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, filters, pagination.page]);

  useEffect(() => { fetchVenues(); }, [fetchVenues]);

  const openModal = (type, venue = null) => {
    setModal({ type, venue });
    setForm(venue ? { ...venue, contact: venue.contact || {} } : venueService.DEFAULT_VENUE_FORM);
    setShowMenu(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.venue) {
        await venueService.updateVenue(authFetch, modal.venue._id, form);
        toast.success('Venue updated');
      } else {
        await venueService.createVenue(authFetch, form);
        toast.success('Venue created');
      }
      setModal({ type: null, venue: null });
      fetchVenues();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await venueService.deleteVenue(authFetch, modal.venue._id);
      toast.success('Venue deleted');
      setModal({ type: null, venue: null });
      fetchVenues();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading && venues.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Venues Management</h1>
          <p className="text-gray-400">Manage event venues and locations</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={fetchVenues}><RefreshCw size={20} /></Button>
          <Button onClick={() => openModal('form')}><Plus size={18} /> Add Venue</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Building2} iconColor="primary" value={venues.length} label="Total Venues" />
        <StatCard icon={Users} iconColor="blue" value={venues.reduce((sum, v) => sum + (v.total_capacity || 0), 0).toLocaleString()} label="Total Capacity" />
        <StatCard icon={Layers} iconColor="emerald" value={venues.reduce((sum, v) => sum + (v.zones?.length || 0), 0)} label="Total Zones" />
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search venues..." className="flex-1" />
          <Select value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}
            options={[{ value: '', label: 'All Cities' }, ...cities.map(c => ({ value: c, label: c }))]} />
        </div>
      </Card>

      {/* Venues Grid */}
      {venues.length === 0 ? (
        <Card><EmptyState icon={Building2} title="No venues found" /></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map(venue => (
            <VenueCard key={venue._id} venue={venue} showMenu={showMenu} setShowMenu={setShowMenu}
              onEdit={() => openModal('form', venue)} onDelete={() => openModal('delete', venue)} />
          ))}
        </div>
      )}

      <Pagination page={pagination.page} totalPages={pagination.pages} total={pagination.total}
        onPageChange={p => setPagination(prev => ({ ...prev, page: p }))} itemLabel="venues" />

      {/* Form Modal */}
      <Modal isOpen={modal.type === 'form'} onClose={() => setModal({ type: null, venue: null })}
        title={modal.venue ? 'Edit Venue' : 'Add Venue'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Select label="City *" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })}
              options={[{ value: '', label: 'Select city' }, ...cities.map(c => ({ value: c, label: c }))]} />
          </div>
          <Input label="Address *" required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capacity" type="number" value={form.total_capacity} onChange={e => setForm({ ...form, total_capacity: e.target.value })} />
            <Input label="Google Maps URL" value={form.google_maps_url} onChange={e => setForm({ ...form, google_maps_url: e.target.value })} />
          </div>
          <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
          
          <div className="grid grid-cols-3 gap-4">
            <Input label="Phone" value={form.contact?.phone || ''} onChange={e => setForm({ ...form, contact: { ...form.contact, phone: e.target.value } })} />
            <Input label="Email" value={form.contact?.email || ''} onChange={e => setForm({ ...form, contact: { ...form.contact, email: e.target.value } })} />
            <Input label="Website" value={form.contact?.website || ''} onChange={e => setForm({ ...form, contact: { ...form.contact, website: e.target.value } })} />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModal({ type: null, venue: null })} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{modal.venue ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog isOpen={modal.type === 'delete'} title="Delete Venue?"
        message={`Are you sure you want to delete ${modal.venue?.name}?`}
        confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setModal({ type: null, venue: null })} variant="danger" />
    </div>
  );
}

const VenueCard = ({ venue, showMenu, setShowMenu, onEdit, onDelete }) => (
  <Card className="overflow-hidden">
    <div className="h-40 bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
      <Building2 size={48} className="text-white/30" />
    </div>
    <div className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-white">{venue.name}</h3>
          <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
            <MapPin size={14} /> {venue.city}
          </div>
        </div>
        <div className="relative">
          <button onClick={() => setShowMenu(showMenu === venue._id ? null : venue._id)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
            <MoreVertical size={16} />
          </button>
          {showMenu === venue._id && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(null)} />
              <div className="absolute right-0 mt-1 w-40 bg-zinc-800 rounded-xl shadow-xl border border-white/10 z-20 overflow-hidden">
                <Link to={`/venues/${venue._id}/seats`} className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"><Layers size={14} /> Seat Chart</Link>
                <button onClick={onEdit} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"><Edit size={14} /> Edit</button>
                <button onClick={onDelete} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"><Trash2 size={14} /> Delete</button>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="mt-3 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1 text-gray-400">
          <Users size={14} /> {venue.total_capacity?.toLocaleString() || 0}
        </div>
        <div className="flex items-center gap-1 text-gray-400">
          <Layers size={14} /> {venue.zones?.length || 0} zones
        </div>
      </div>
    </div>
  </Card>
);
