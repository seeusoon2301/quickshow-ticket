/**
 * Artists List - Refactored
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Plus, Music, Edit, Trash2, RefreshCw, MoreVertical, Instagram, Facebook, Twitter, Globe } from 'lucide-react';
import { PageLoader, EmptyState, SearchInput, Select, Button, Card, Badge, Pagination, Modal, Input, Textarea, ConfirmDialog } from '../../components/ui';
import * as artistService from '../../services/artistService';

export default function ArtistsList() {
  const { authFetch } = useAuth();
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', genre: '' });
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [showMenu, setShowMenu] = useState(null);
  const [modal, setModal] = useState({ type: null, artist: null });
  const [form, setForm] = useState(artistService.DEFAULT_ARTIST_FORM);
  const [saving, setSaving] = useState(false);

  const fetchArtists = useCallback(async () => {
    try {
      setLoading(true);
      const data = await artistService.getArtists(authFetch, { ...filters, page: pagination.page, limit: 12 });
      setArtists(data.data.artists);
      setPagination(p => ({ ...p, ...data.data.pagination }));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [authFetch, filters, pagination.page]);

  useEffect(() => { fetchArtists(); }, [fetchArtists]);

  const openModal = (type, artist = null) => {
    setModal({ type, artist });
    setForm(artist ? { ...artist, genres: artist.genres || [], social_links: artist.social_links || {} } : artistService.DEFAULT_ARTIST_FORM);
    setShowMenu(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal.artist) {
        await artistService.updateArtist(authFetch, modal.artist._id, form);
        toast.success('Artist updated');
      } else {
        await artistService.createArtist(authFetch, form);
        toast.success('Artist created');
      }
      setModal({ type: null, artist: null });
      fetchArtists();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await artistService.deleteArtist(authFetch, modal.artist._id);
      toast.success('Artist deleted');
      setModal({ type: null, artist: null });
      fetchArtists();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleGenre = (genre) => {
    setForm(f => ({
      ...f,
      genres: f.genres.includes(genre) ? f.genres.filter(g => g !== genre) : [...f.genres, genre]
    }));
  };

  if (loading && artists.length === 0) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Artists Management</h1>
          <p className="text-gray-400">Manage artists and bands</p>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={fetchArtists}><RefreshCw size={20} /></Button>
          <Button onClick={() => openModal('form')}><Plus size={18} /> Add Artist</Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-4">
          <SearchInput value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search artists..." className="flex-1" />
          <Select value={filters.genre} onChange={e => setFilters(f => ({ ...f, genre: e.target.value }))}
            options={[{ value: '', label: 'All Genres' }, ...artistService.GENRES.map(g => ({ value: g, label: g }))]} />
        </div>
      </Card>

      {/* Artists Grid */}
      {artists.length === 0 ? (
        <Card><EmptyState icon={Music} title="No artists found" /></Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {artists.map(artist => (
            <ArtistCard key={artist._id} artist={artist} showMenu={showMenu} setShowMenu={setShowMenu}
              onEdit={() => openModal('form', artist)} onDelete={() => openModal('delete', artist)} />
          ))}
        </div>
      )}

      <Pagination page={pagination.page} totalPages={pagination.pages} total={pagination.total}
        onPageChange={p => setPagination(prev => ({ ...prev, page: p }))} itemLabel="artists" />

      {/* Form Modal */}
      <Modal isOpen={modal.type === 'form'} onClose={() => setModal({ type: null, artist: null })}
        title={modal.artist ? 'Edit Artist' : 'Add Artist'} size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name *" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input label="Image URL" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
          </div>
          <Textarea label="Bio" value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} />
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Genres</label>
            <div className="flex flex-wrap gap-2">
              {artistService.GENRES.map(genre => (
                <button key={genre} type="button" onClick={() => toggleGenre(genre)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${form.genres?.includes(genre) ? 'bg-primary text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
                  {genre}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Social Links</label>
            <div className="grid grid-cols-2 gap-4">
              <Input placeholder="Instagram URL" value={form.social_links?.instagram || ''}
                onChange={e => setForm({ ...form, social_links: { ...form.social_links, instagram: e.target.value } })} />
              <Input placeholder="Facebook URL" value={form.social_links?.facebook || ''}
                onChange={e => setForm({ ...form, social_links: { ...form.social_links, facebook: e.target.value } })} />
              <Input placeholder="Twitter URL" value={form.social_links?.twitter || ''}
                onChange={e => setForm({ ...form, social_links: { ...form.social_links, twitter: e.target.value } })} />
              <Input placeholder="Website" value={form.website || ''}
                onChange={e => setForm({ ...form, website: e.target.value })} />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setModal({ type: null, artist: null })} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{modal.artist ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog isOpen={modal.type === 'delete'} title="Delete Artist?"
        message={`Are you sure you want to delete ${modal.artist?.name}?`}
        confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setModal({ type: null, artist: null })} variant="danger" />
    </div>
  );
}

const ArtistCard = ({ artist, showMenu, setShowMenu, onEdit, onDelete }) => (
  <Card className="overflow-hidden group">
    <div className="relative aspect-square">
      <img src={artistService.getArtistAvatar(artist)} alt={artist.name} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="font-semibold text-white">{artist.name}</h3>
        <div className="flex flex-wrap gap-1 mt-1">
          {artist.genres?.slice(0, 2).map(g => <Badge key={g} variant="gray" className="text-xs">{g}</Badge>)}
        </div>
      </div>
      <div className="absolute top-2 right-2">
        <button onClick={() => setShowMenu(showMenu === artist._id ? null : artist._id)} 
          className="p-2 bg-black/50 hover:bg-black/70 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical size={16} />
        </button>
        {showMenu === artist._id && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(null)} />
            <div className="absolute right-0 mt-1 w-36 bg-zinc-800 rounded-xl shadow-xl border border-white/10 z-20 overflow-hidden">
              <button onClick={onEdit} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5"><Edit size={14} /> Edit</button>
              <button onClick={onDelete} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"><Trash2 size={14} /> Delete</button>
            </div>
          </>
        )}
      </div>
    </div>
    {/* Social Links */}
    <div className="p-3 flex justify-center gap-3 border-t border-white/5">
      {artist.social_links?.instagram && <a href={artist.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-400"><Instagram size={18} /></a>}
      {artist.social_links?.facebook && <a href={artist.social_links.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400"><Facebook size={18} /></a>}
      {artist.social_links?.twitter && <a href={artist.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-sky-400"><Twitter size={18} /></a>}
      {artist.website && <a href={artist.website} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white"><Globe size={18} /></a>}
    </div>
  </Card>
);
