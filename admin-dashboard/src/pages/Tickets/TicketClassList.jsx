/**
 * Ticket Class List - Refactored
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Edit2, Trash2, Ticket, DollarSign, Users, Calendar, Star, Tag } from 'lucide-react';
import { PageLoader, Button, Card, Badge, Modal, Input, Textarea, Select, ConfirmDialog } from '../../components/ui';
import * as ticketService from '../../services/ticketService';
import { formatCurrency, API_URL } from '../../services/api';

export default function TicketClassList() {
  const { concertId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [concert, setConcert] = useState(null);
  const [ticketClasses, setTicketClasses] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ type: null, ticket: null });
  const [form, setForm] = useState(ticketService.DEFAULT_TICKET_FORM);
  const [newBenefit, setNewBenefit] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [concertRes, ticketsRes] = await Promise.all([
        fetch(`${API_URL}/concerts/${concertId}`),
        ticketService.getTicketClasses(authFetch, concertId)
      ]);
      
      const concertData = await concertRes.json();
      if (concertData.success) {
        setConcert(concertData.data.concert);
        setZones(concertData.data.concert.venue?.zones || []);
      }
      
      setTicketClasses(ticketsRes.data.ticketClasses || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [authFetch, concertId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = (type, ticket = null) => {
    setModal({ type, ticket });
    if (ticket) {
      setForm({ ...ticket, open_time: ticket.open_time?.slice(0, 16), close_time: ticket.close_time?.slice(0, 16) });
    } else {
      setForm({ ...ticketService.DEFAULT_TICKET_FORM, concert: concertId });
    }
  };

  const applyPreset = (preset) => {
    setForm(f => ({ ...f, name: preset.name, description: preset.description, benefits: preset.benefits }));
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setForm(f => ({ ...f, benefits: [...(f.benefits || []), newBenefit.trim()] }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (index) => {
    setForm(f => ({ ...f, benefits: f.benefits.filter((_, i) => i !== index) }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.ticket) {
        await ticketService.updateTicketClass(authFetch, modal.ticket._id, form);
        toast.success('Ticket class updated');
      } else {
        await ticketService.createTicketClass(authFetch, form);
        toast.success('Ticket class created');
      }
      setModal({ type: null, ticket: null });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await ticketService.deleteTicketClass(authFetch, modal.ticket._id);
      toast.success('Ticket class deleted');
      setModal({ type: null, ticket: null });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/events" className="p-2 hover:bg-white/5 rounded-lg text-gray-400"><ArrowLeft size={20} /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Ticket Classes</h1>
          <p className="text-gray-400">{concert?.title}</p>
        </div>
        <Button onClick={() => openModal('form')}><Plus size={18} /> Add Ticket Class</Button>
      </div>

      {/* Ticket Classes Grid */}
      {ticketClasses.length === 0 ? (
        <Card className="text-center py-12">
          <Ticket size={48} className="mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No ticket classes yet</p>
          <Button onClick={() => openModal('form')} className="mt-4"><Plus size={16} /> Create First Ticket Class</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ticketClasses.map(tc => (
            <Card key={tc._id} className="relative">
              <div className="absolute top-4 right-4 flex gap-1">
                <button onClick={() => openModal('form', tc)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400"><Edit2 size={16} /></button>
                <button onClick={() => openModal('delete', tc)} className="p-2 hover:bg-red-500/10 rounded-lg text-red-400"><Trash2 size={16} /></button>
              </div>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/20 rounded-xl"><Ticket size={24} className="text-primary" /></div>
                <div>
                  <h3 className="font-semibold text-white">{tc.name}</h3>
                  <p className="text-sm text-gray-500">{tc.zone?.name || 'No zone'}</p>
                </div>
              </div>

              <div className="text-3xl font-bold text-white mb-4">{formatCurrency(tc.price)}</div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-gray-400">
                  <span className="flex items-center gap-2"><Users size={14} /> Quota</span>
                  <span className="text-white">{tc.sold || 0} / {tc.quota}</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, ((tc.sold || 0) / tc.quota) * 100)}%` }} />
                </div>
              </div>

              {tc.benefits?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-500 mb-2">Benefits</p>
                  <div className="flex flex-wrap gap-1">
                    {tc.benefits.slice(0, 3).map((b, i) => <Badge key={i} variant="gray" className="text-xs">{b}</Badge>)}
                    {tc.benefits.length > 3 && <Badge variant="gray" className="text-xs">+{tc.benefits.length - 3}</Badge>}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={modal.type === 'form'} onClose={() => setModal({ type: null, ticket: null })}
        title={modal.ticket ? 'Edit Ticket Class' : 'Add Ticket Class'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Presets */}
          {!modal.ticket && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {ticketService.TICKET_PRESETS.map(preset => (
                  <button key={preset.name} type="button" onClick={() => applyPreset(preset)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300">{preset.name}</button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Name *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="VIP, Regular, etc." />
            <Select label="Zone" value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })}
              options={[{ value: '', label: 'Select zone' }, ...zones.map(z => ({ value: z._id, label: z.name }))]} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Price *" type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
            <Input label="Quota *" type="number" required value={form.quota} onChange={e => setForm({ ...form, quota: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Sale Opens" type="datetime-local" value={form.open_time} onChange={e => setForm({ ...form, open_time: e.target.value })} />
            <Input label="Sale Closes" type="datetime-local" value={form.close_time} onChange={e => setForm({ ...form, close_time: e.target.value })} />
          </div>

          <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />

          {/* Benefits */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Benefits</label>
            <div className="flex gap-2 mb-2">
              <Input value={newBenefit} onChange={e => setNewBenefit(e.target.value)} placeholder="Add benefit..." className="flex-1"
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBenefit())} />
              <Button type="button" variant="outline" onClick={addBenefit}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.benefits?.map((b, i) => (
                <span key={i} className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg text-sm text-gray-300">
                  {b} <button type="button" onClick={() => removeBenefit(i)} className="text-gray-500 hover:text-red-400">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModal({ type: null, ticket: null })} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{modal.ticket ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={modal.type === 'delete'} title="Delete Ticket Class?"
        message={`Delete "${modal.ticket?.name}"? This cannot be undone.`}
        confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setModal({ type: null, ticket: null })} variant="danger" />
    </div>
  );
}
