/**
 * Seat Chart Designer - Refactored
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Plus, Trash2, Grid3X3, Download, Eye, Settings, Palette } from 'lucide-react';
import { PageLoader, Button, Card, StatCard, Modal, Input, Textarea, Select, ConfirmDialog, Badge } from '../../components/ui';
import * as venueService from '../../services/venueService';

const SEAT_TYPES = [
  { value: 'NORMAL', label: 'Normal', color: 'bg-blue-500' },
  { value: 'VIP', label: 'VIP', color: 'bg-purple-500' },
  { value: 'WHEELCHAIR', label: 'Wheelchair', color: 'bg-green-500' },
  { value: 'RESTRICTED', label: 'Restricted', color: 'bg-gray-500' },
];

export default function SeatChartDesigner() {
  const { venueId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const [venue, setVenue] = useState(null);
  const [zones, setZones] = useState([]);
  const [seats, setSeats] = useState({});
  const [selectedZone, setSelectedZone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ type: null, zone: null });
  const [zoneForm, setZoneForm] = useState({ name: '', capacity: 100, color: '#3B82F6', description: '' });
  const [generateForm, setGenerateForm] = useState({ rows: 5, seatsPerRow: 10, startRow: 'A' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await venueService.getVenueById(authFetch, venueId);
      setVenue(data.venue);
      setZones(data.zones || []);

      // Fetch seats for each zone
      const seatsData = {};
      for (const zone of data.zones || []) {
        const zoneSeats = await venueService.getZoneSeats(authFetch, venueId, zone._id);
        seatsData[zone._id] = zoneSeats.seatsByRow || {};
      }
      setSeats(seatsData);
    } catch (error) {
      toast.error('Failed to load venue data');
    } finally {
      setLoading(false);
    }
  }, [authFetch, venueId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openZoneModal = (zone = null) => {
    setModal({ type: 'zone', zone });
    setZoneForm(zone ? { name: zone.name, capacity: zone.capacity, color: zone.color || '#3B82F6', description: zone.description || '' }
      : { name: '', capacity: 100, color: '#3B82F6', description: '' });
  };

  const handleSaveZone = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.zone) {
        await venueService.updateZone(authFetch, venueId, modal.zone._id, zoneForm);
        toast.success('Zone updated');
      } else {
        await venueService.createZone(authFetch, venueId, zoneForm);
        toast.success('Zone created');
      }
      setModal({ type: null, zone: null });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!confirm('Delete this zone and all its seats?')) return;
    try {
      await venueService.deleteZone(authFetch, venueId, zoneId);
      toast.success('Zone deleted');
      if (selectedZone?._id === zoneId) setSelectedZone(null);
      fetchData();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleGenerateSeats = async (e) => {
    e.preventDefault();
    if (!selectedZone) { toast.error('Select a zone first'); return; }
    setSaving(true);
    try {
      await venueService.generateSeats(authFetch, venueId, selectedZone._id, generateForm);
      toast.success('Seats generated');
      setModal({ type: null, zone: null });
      fetchData();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const getTotalSeats = () => Object.values(seats).reduce((t, z) => 
    t + Object.values(z).reduce((s, r) => s + r.length, 0), 0);

  const exportLayout = () => {
    const layout = { venue: { id: venue._id, name: venue.name }, zones: zones.map(z => ({ ...z, seats: seats[z._id] || {} })) };
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${venue.name.replace(/\s+/g, '_')}_layout.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Layout exported');
  };

  if (loading) return <PageLoader />;
  if (!venue) return <div className="text-center py-12"><p className="text-gray-400">Venue not found</p></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/venues')} className="p-2 hover:bg-white/10 rounded-lg"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold text-white">Seat Chart Designer</h1>
            <p className="text-gray-400">{venue.name} - {venue.address}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportLayout}><Download size={18} /> Export</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Grid3X3} iconColor="primary" value={zones.length} label="Total Zones" />
        <StatCard icon={Grid3X3} iconColor="blue" value={getTotalSeats()} label="Total Seats" />
        <StatCard icon={Grid3X3} iconColor="emerald" value={venue.total_capacity?.toLocaleString() || 'N/A'} label="Venue Capacity" />
        <StatCard icon={Grid3X3} iconColor="yellow" value={venue.total_capacity ? `${Math.round((getTotalSeats() / venue.total_capacity) * 100)}%` : '0%'} label="Coverage" />
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Zone List */}
        <div className="col-span-4 space-y-4">
          <Card title="Zones">
            <Button onClick={() => openZoneModal()} className="w-full mb-4"><Plus size={16} /> Add Zone</Button>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {zones.map(zone => (
                <div key={zone._id} onClick={() => setSelectedZone(zone)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors border ${selectedZone?._id === zone._id ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: zone.color || '#3B82F6' }} />
                      <span className="font-medium text-white">{zone.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={e => { e.stopPropagation(); openZoneModal(zone); }} className="p-1 hover:bg-white/10 rounded"><Settings size={14} /></button>
                      <button onClick={e => { e.stopPropagation(); handleDeleteZone(zone._id); }} className="p-1 hover:bg-red-500/10 text-red-400 rounded"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-sm text-gray-400">
                    <span>Capacity: {zone.capacity}</span>
                    <span>Seats: {Object.values(seats[zone._id] || {}).reduce((s, r) => s + r.length, 0)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {selectedZone && (
            <Card title={`Generate Seats - ${selectedZone.name}`}>
              <form onSubmit={handleGenerateSeats} className="space-y-4">
                <Input label="Rows" type="number" min={1} max={26} value={generateForm.rows} onChange={e => setGenerateForm({ ...generateForm, rows: parseInt(e.target.value) })} />
                <Input label="Seats per Row" type="number" min={1} max={50} value={generateForm.seatsPerRow} onChange={e => setGenerateForm({ ...generateForm, seatsPerRow: parseInt(e.target.value) })} />
                <Input label="Start Row" maxLength={1} value={generateForm.startRow} onChange={e => setGenerateForm({ ...generateForm, startRow: e.target.value.toUpperCase() })} />
                <Button type="submit" loading={saving} className="w-full">Generate {generateForm.rows * generateForm.seatsPerRow} Seats</Button>
              </form>
            </Card>
          )}
        </div>

        {/* Seat Preview */}
        <div className="col-span-8">
          <Card title="Seat Layout Preview" className="min-h-96">
            {!selectedZone ? (
              <div className="flex items-center justify-center h-64 text-gray-500">Select a zone to view/edit seats</div>
            ) : !seats[selectedZone._id] || Object.keys(seats[selectedZone._id]).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Grid3X3 size={48} className="mb-4" />
                <p>No seats generated yet</p>
                <p className="text-sm">Use the form on the left to generate seats</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-auto">
                {Object.entries(seats[selectedZone._id]).sort(([a], [b]) => a.localeCompare(b)).map(([row, rowSeats]) => (
                  <div key={row} className="flex items-center gap-2">
                    <span className="w-8 text-center font-medium text-gray-400">{row}</span>
                    <div className="flex gap-1 flex-wrap">
                      {rowSeats.map(seat => (
                        <div key={seat._id} title={`${seat.row}${seat.number} - ${seat.type || 'NORMAL'}`}
                          className={`w-6 h-6 rounded text-xs flex items-center justify-center cursor-pointer transition-all hover:scale-110
                            ${seat.type === 'VIP' ? 'bg-purple-500' : seat.type === 'WHEELCHAIR' ? 'bg-green-500' : seat.type === 'RESTRICTED' ? 'bg-gray-600' : 'bg-blue-500'}`}>
                          {seat.number}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="flex gap-4 pt-4 border-t border-white/10">
                  {SEAT_TYPES.map(t => <div key={t.value} className="flex items-center gap-2"><div className={`w-4 h-4 rounded ${t.color}`} /><span className="text-xs text-gray-400">{t.label}</span></div>)}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Zone Modal */}
      <Modal isOpen={modal.type === 'zone'} onClose={() => setModal({ type: null, zone: null })} title={modal.zone ? 'Edit Zone' : 'Add Zone'}>
        <form onSubmit={handleSaveZone} className="space-y-4">
          <Input label="Zone Name *" required value={zoneForm.name} onChange={e => setZoneForm({ ...zoneForm, name: e.target.value })} />
          <Input label="Capacity" type="number" value={zoneForm.capacity} onChange={e => setZoneForm({ ...zoneForm, capacity: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {venueService.ZONE_COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => setZoneForm({ ...zoneForm, color: c.value })}
                  className={`w-8 h-8 rounded-lg transition-all ${zoneForm.color === c.value ? 'ring-2 ring-white scale-110' : ''}`} style={{ backgroundColor: c.value }} />
              ))}
            </div>
          </div>
          <Textarea label="Description" value={zoneForm.description} onChange={e => setZoneForm({ ...zoneForm, description: e.target.value })} rows={2} />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModal({ type: null, zone: null })} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{modal.zone ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
