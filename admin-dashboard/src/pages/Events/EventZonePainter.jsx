/**
 * Event Zone Painter
 * 
 * This component allows admins to "paint" venue seats with ticket class colors.
 * The venue provides the physical seat layout (template), and this component
 * lets you assign seats to different ticket classes for each event.
 * 
 * Workflow:
 * 1. Select a ticket class (VIP, Standard, etc.)
 * 2. Click on seats to "paint" them with that ticket class color
 * 3. Seats can be reassigned to different ticket classes
 * 4. Unassigned seats appear gray
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Stage, Layer, Circle, Text, Rect, Group } from 'react-konva';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Save, Loader2, Plus, X, Palette, MousePointer,
  ZoomIn, ZoomOut, RotateCcw, Trash2, Edit2, Check
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import * as eventService from '../../services/eventService';

// Default colors for ticket classes
const DEFAULT_COLORS = [
  '#FFD700', // Gold - VIP
  '#4CAF50', // Green - Premium
  '#2196F3', // Blue - Standard
  '#9C27B0', // Purple - Economy
  '#FF5722', // Orange
  '#00BCD4', // Cyan
  '#E91E63', // Pink
  '#795548', // Brown
];

// Seat size and styling
const SEAT_RADIUS = 12;
const UNASSIGNED_COLOR = '#4B5563'; // Gray for unassigned seats

export default function EventZonePainter() {
  const { id: concertId } = useParams();
  const { authFetch } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [concert, setConcert] = useState(null);
  const [seats, setSeats] = useState([]);
  const [ticketClasses, setTicketClasses] = useState([]);
  const [selectedTicketClass, setSelectedTicketClass] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState(new Set());
  const [tool, setTool] = useState('paint'); // 'paint' | 'select'
  
  // Canvas state
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  
  // Ticket class form state
  const [showTicketClassForm, setShowTicketClassForm] = useState(false);
  const [editingTicketClass, setEditingTicketClass] = useState(null);
  const [ticketClassForm, setTicketClassForm] = useState({
    name: '',
    color: DEFAULT_COLORS[0],
    price: '',
    benefits: ''
  });

  // Load concert data, seats, and ticket classes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get concert details
        const concertRes = await eventService.getConcertById(authFetch, concertId);
        if (concertRes.success) {
          setConcert(concertRes.data.concert);
          setTicketClasses(concertRes.data.concert.ticketClasses || []);
        }
        
        // Get seats with assignments
        const seatsRes = await eventService.getConcertSeats(authFetch, concertId);
        if (seatsRes.success) {
          setSeats(seatsRes.data.seats || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load event data');
      } finally {
        setLoading(false);
      }
    };
    
    if (concertId) {
      fetchData();
    }
  }, [concertId, authFetch]);

  // Handle window resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setStageSize({
          width: rect.width,
          height: Math.max(500, window.innerHeight - 350)
        });
      }
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Get seat color based on assignment
  const getSeatColor = useCallback((seat) => {
    if (seat.status === 'SOLD') return '#EF4444'; // Red for sold
    if (seat.ticketClass) {
      const tc = ticketClasses.find(t => t._id === seat.ticketClass);
      return tc?.color || UNASSIGNED_COLOR;
    }
    return UNASSIGNED_COLOR;
  }, [ticketClasses]);

  // Handle seat click
  const handleSeatClick = useCallback((seat) => {
    if (seat.status === 'SOLD') {
      toast.error('Cannot modify sold seats');
      return;
    }

    if (tool === 'paint' && selectedTicketClass) {
      // Paint mode: assign seat to selected ticket class
      assignSeatToTicketClass(seat._id);
    } else if (tool === 'select') {
      // Select mode: toggle selection
      setSelectedSeats(prev => {
        const newSet = new Set(prev);
        if (newSet.has(seat._id)) {
          newSet.delete(seat._id);
        } else {
          newSet.add(seat._id);
        }
        return newSet;
      });
    }
  }, [tool, selectedTicketClass]);

  // Assign single seat to ticket class
  const assignSeatToTicketClass = async (seatId) => {
    if (!selectedTicketClass) return;
    
    try {
      const res = await eventService.assignSeatsToTicketClass(
        authFetch,
        concertId,
        selectedTicketClass._id,
        [seatId]
      );
      
      if (res.success) {
        // Update local state
        setSeats(prev => prev.map(s => 
          s._id === seatId ? { ...s, ticketClass: selectedTicketClass._id, status: 'AVAILABLE' } : s
        ));
      }
    } catch (error) {
      toast.error('Failed to assign seat');
    }
  };

  // Assign all selected seats to ticket class
  const assignSelectedSeats = async () => {
    if (!selectedTicketClass || selectedSeats.size === 0) {
      toast.error('Select a ticket class and seats first');
      return;
    }

    const seatIds = Array.from(selectedSeats);
    
    try {
      setSaving(true);
      const res = await eventService.assignSeatsToTicketClass(
        authFetch,
        concertId,
        selectedTicketClass._id,
        seatIds
      );
      
      if (res.success) {
        // Update local state
        setSeats(prev => prev.map(s => 
          selectedSeats.has(s._id) ? { ...s, ticketClass: selectedTicketClass._id, status: 'AVAILABLE' } : s
        ));
        setSelectedSeats(new Set());
        toast.success(`Assigned ${seatIds.length} seats to ${selectedTicketClass.name}`);
      }
    } catch (error) {
      toast.error('Failed to assign seats');
    } finally {
      setSaving(false);
    }
  };

  // Unassign selected seats
  const unassignSelectedSeats = async () => {
    if (selectedSeats.size === 0) {
      toast.error('Select seats first');
      return;
    }

    const seatIds = Array.from(selectedSeats);
    
    try {
      setSaving(true);
      const res = await eventService.unassignSeats(authFetch, concertId, seatIds);
      
      if (res.success) {
        // Update local state
        setSeats(prev => prev.map(s => 
          selectedSeats.has(s._id) ? { ...s, ticketClass: null, status: 'UNASSIGNED' } : s
        ));
        setSelectedSeats(new Set());
        toast.success(`Unassigned ${seatIds.length} seats`);
      }
    } catch (error) {
      toast.error('Failed to unassign seats');
    } finally {
      setSaving(false);
    }
  };

  // Ticket Class Management
  const handleAddTicketClass = async () => {
    if (!ticketClassForm.name || !ticketClassForm.price) {
      toast.error('Name and price are required');
      return;
    }

    try {
      setSaving(true);
      const res = await eventService.addTicketClass(authFetch, concertId, {
        name: ticketClassForm.name,
        color: ticketClassForm.color,
        price: parseFloat(ticketClassForm.price),
        benefits: ticketClassForm.benefits ? ticketClassForm.benefits.split('\n').filter(b => b.trim()) : []
      });

      if (res.success) {
        setTicketClasses(prev => [...prev, res.data.ticketClass]);
        resetTicketClassForm();
        toast.success('Ticket class added');
      }
    } catch (error) {
      toast.error('Failed to add ticket class');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateTicketClass = async () => {
    if (!editingTicketClass || !ticketClassForm.name || !ticketClassForm.price) {
      toast.error('Name and price are required');
      return;
    }

    try {
      setSaving(true);
      const res = await eventService.updateTicketClass(authFetch, concertId, editingTicketClass._id, {
        name: ticketClassForm.name,
        color: ticketClassForm.color,
        price: parseFloat(ticketClassForm.price),
        benefits: ticketClassForm.benefits ? ticketClassForm.benefits.split('\n').filter(b => b.trim()) : []
      });

      if (res.success) {
        setTicketClasses(prev => prev.map(tc => 
          tc._id === editingTicketClass._id ? res.data.ticketClass : tc
        ));
        resetTicketClassForm();
        toast.success('Ticket class updated');
      }
    } catch (error) {
      toast.error('Failed to update ticket class');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTicketClass = async (ticketClassId) => {
    if (!confirm('Delete this ticket class? Seats will be unassigned.')) return;

    try {
      const res = await eventService.deleteTicketClass(authFetch, concertId, ticketClassId);
      
      if (res.success) {
        setTicketClasses(prev => prev.filter(tc => tc._id !== ticketClassId));
        // Unassign seats that were using this ticket class
        setSeats(prev => prev.map(s => 
          s.ticketClass === ticketClassId ? { ...s, ticketClass: null, status: 'UNASSIGNED' } : s
        ));
        if (selectedTicketClass?._id === ticketClassId) {
          setSelectedTicketClass(null);
        }
        toast.success('Ticket class deleted');
      }
    } catch (error) {
      toast.error('Failed to delete ticket class');
    }
  };

  const editTicketClass = (tc) => {
    setEditingTicketClass(tc);
    setTicketClassForm({
      name: tc.name,
      color: tc.color,
      price: tc.price.toString(),
      benefits: tc.benefits?.join('\n') || ''
    });
    setShowTicketClassForm(true);
  };

  const resetTicketClassForm = () => {
    setShowTicketClassForm(false);
    setEditingTicketClass(null);
    setTicketClassForm({
      name: '',
      color: DEFAULT_COLORS[ticketClasses.length % DEFAULT_COLORS.length],
      price: '',
      benefits: ''
    });
  };

  // Zoom controls
  const handleZoom = (delta) => {
    setScale(prev => Math.max(0.3, Math.min(3, prev + delta)));
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Stage drag
  const handleDragEnd = (e) => {
    setPosition({
      x: e.target.x(),
      y: e.target.y()
    });
  };

  // Select all unassigned seats
  const selectAllUnassigned = () => {
    const unassigned = seats.filter(s => !s.ticketClass && s.status !== 'SOLD');
    setSelectedSeats(new Set(unassigned.map(s => s._id)));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedSeats(new Set());
  };

  // Calculate stats
  const stats = {
    total: seats.length,
    assigned: seats.filter(s => s.ticketClass).length,
    unassigned: seats.filter(s => !s.ticketClass && s.status !== 'SOLD').length,
    sold: seats.filter(s => s.status === 'SOLD').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  if (!concert) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Event not found</p>
        <Link to="/events" className="text-primary hover:underline mt-4 inline-block">Back to Events</Link>
      </div>
    );
  }

  if (!concert.venue) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">This event has no venue assigned.</p>
        <p className="text-gray-500 text-sm mb-4">Please assign a venue with a seat chart first.</p>
        <Link to={`/events/${concertId}/edit`} className="text-primary hover:underline">Edit Event</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/events" className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Zone Painter</h1>
            <p className="text-gray-400">{concert.title} @ {concert.venue?.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm">
          <span className="px-2 py-1 bg-white/5 rounded text-gray-400">
            Total: {stats.total}
          </span>
          <span className="px-2 py-1 bg-green-500/20 rounded text-green-400">
            Assigned: {stats.assigned}
          </span>
          <span className="px-2 py-1 bg-gray-500/20 rounded text-gray-400">
            Unassigned: {stats.unassigned}
          </span>
          <span className="px-2 py-1 bg-red-500/20 rounded text-red-400">
            Sold: {stats.sold}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Panel - Ticket Classes */}
        <div className="lg:col-span-1 space-y-4">
          <Card title="Ticket Classes" className="p-4">
            <div className="space-y-2">
              {ticketClasses.map(tc => {
                const seatCount = seats.filter(s => s.ticketClass === tc._id).length;
                const isSelected = selectedTicketClass?._id === tc._id;
                
                return (
                  <div
                    key={tc._id}
                    onClick={() => setSelectedTicketClass(isSelected ? null : tc)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border-2 ${
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-transparent bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-5 h-5 rounded-full border-2 border-white/30"
                          style={{ backgroundColor: tc.color }}
                        />
                        <span className="text-white font-medium">{tc.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); editTicketClass(tc); }}
                          className="p-1 hover:bg-white/10 rounded"
                        >
                          <Edit2 size={14} className="text-gray-400" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteTicketClass(tc._id); }}
                          className="p-1 hover:bg-red-500/20 rounded"
                        >
                          <Trash2 size={14} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-400">{seatCount} seats</span>
                      <span className="text-primary">{tc.price?.toLocaleString()}₫</span>
                    </div>
                  </div>
                );
              })}
              
              {ticketClasses.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-4">
                  No ticket classes yet. Add one to start painting seats.
                </p>
              )}
              
              <Button 
                variant="outline" 
                className="w-full mt-2"
                onClick={() => {
                  resetTicketClassForm();
                  setShowTicketClassForm(true);
                }}
              >
                <Plus size={16} /> Add Ticket Class
              </Button>
            </div>
          </Card>

          {/* Ticket Class Form */}
          {showTicketClassForm && (
            <Card title={editingTicketClass ? 'Edit Ticket Class' : 'New Ticket Class'} className="p-4">
              <div className="space-y-3">
                <Input
                  label="Name"
                  value={ticketClassForm.name}
                  onChange={(e) => setTicketClassForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., VIP, Standard"
                />
                <Input
                  label="Price (₫)"
                  type="number"
                  value={ticketClassForm.price}
                  onChange={(e) => setTicketClassForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="e.g., 500000"
                />
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {DEFAULT_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setTicketClassForm(f => ({ ...f, color }))}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          ticketClassForm.color === color 
                            ? 'border-white scale-110' 
                            : 'border-transparent hover:border-white/50'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Benefits (one per line)</label>
                  <textarea
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
                    rows={3}
                    value={ticketClassForm.benefits}
                    onChange={(e) => setTicketClassForm(f => ({ ...f, benefits: e.target.value }))}
                    placeholder="Free drink&#10;Priority entry&#10;Meet & greet"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={resetTicketClassForm}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={editingTicketClass ? handleUpdateTicketClass : handleAddTicketClass}
                    loading={saving}
                  >
                    <Check size={16} /> {editingTicketClass ? 'Update' : 'Add'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Tools */}
          <Card title="Tools" className="p-4">
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button
                  variant={tool === 'paint' ? 'primary' : 'outline'}
                  className="flex-1"
                  onClick={() => setTool('paint')}
                >
                  <Palette size={16} /> Paint
                </Button>
                <Button
                  variant={tool === 'select' ? 'primary' : 'outline'}
                  className="flex-1"
                  onClick={() => setTool('select')}
                >
                  <MousePointer size={16} /> Select
                </Button>
              </div>
              
              {tool === 'select' && selectedSeats.size > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <p className="text-sm text-gray-400">
                    {selectedSeats.size} seats selected
                  </p>
                  <Button
                    className="w-full"
                    disabled={!selectedTicketClass}
                    onClick={assignSelectedSeats}
                    loading={saving}
                  >
                    Assign to {selectedTicketClass?.name || 'Select class'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={unassignSelectedSeats}
                    loading={saving}
                  >
                    <Trash2 size={14} /> Unassign
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={clearSelection}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
              
              <button
                onClick={selectAllUnassigned}
                className="w-full text-sm text-primary hover:underline text-left"
              >
                Select all unassigned
              </button>
            </div>
          </Card>
        </div>

        {/* Right Panel - Seat Canvas */}
        <div className="lg:col-span-3">
          <Card className="p-0 overflow-hidden">
            {/* Canvas Toolbar */}
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleZoom(0.1)}>
                  <ZoomIn size={16} />
                </Button>
                <span className="text-sm text-gray-400 w-16 text-center">
                  {Math.round(scale * 100)}%
                </span>
                <Button variant="ghost" size="sm" onClick={() => handleZoom(-0.1)}>
                  <ZoomOut size={16} />
                </Button>
                <Button variant="ghost" size="sm" onClick={resetView}>
                  <RotateCcw size={16} />
                </Button>
              </div>
              
              <div className="flex items-center gap-4">
                {selectedTicketClass && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: selectedTicketClass.color }}
                    />
                    <span className="text-sm text-white">
                      Painting: {selectedTicketClass.name}
                    </span>
                  </div>
                )}
                
                {/* Legend */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-gray-500" />
                    <span className="text-gray-400">Unassigned</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gray-400">Sold</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div 
              ref={containerRef}
              className="bg-[#1a1a2e]"
              style={{ height: stageSize.height }}
            >
              {seats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <p>No seats in this venue</p>
                  <Link 
                    to={`/venues/${concert.venue._id}/seats`}
                    className="text-primary hover:underline mt-2"
                  >
                    Design seat chart
                  </Link>
                </div>
              ) : (
                <Stage
                  ref={stageRef}
                  width={stageSize.width}
                  height={stageSize.height}
                  scaleX={scale}
                  scaleY={scale}
                  x={position.x}
                  y={position.y}
                  draggable
                  onDragEnd={handleDragEnd}
                >
                  <Layer>
                    {/* Stage/Screen indicator */}
                    <Rect
                      x={stageSize.width / 2 / scale - 100}
                      y={20}
                      width={200}
                      height={30}
                      fill="#374151"
                      cornerRadius={5}
                    />
                    <Text
                      x={stageSize.width / 2 / scale - 100}
                      y={27}
                      width={200}
                      text="STAGE"
                      fontSize={14}
                      fill="#9CA3AF"
                      align="center"
                    />

                    {/* Seats */}
                    {seats.map(seat => {
                      const isSelected = selectedSeats.has(seat._id);
                      const color = getSeatColor(seat);
                      
                      return (
                        <Group
                          key={seat._id}
                          x={seat.x || 0}
                          y={(seat.y || 0) + 80}
                          onClick={() => handleSeatClick(seat)}
                          onTap={() => handleSeatClick(seat)}
                        >
                          {/* Selection ring */}
                          {isSelected && (
                            <Circle
                              radius={SEAT_RADIUS + 4}
                              stroke="#fff"
                              strokeWidth={2}
                              dash={[4, 4]}
                            />
                          )}
                          
                          {/* Seat circle */}
                          <Circle
                            radius={SEAT_RADIUS}
                            fill={color}
                            stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.2)'}
                            strokeWidth={isSelected ? 2 : 1}
                            shadowColor="black"
                            shadowBlur={3}
                            shadowOpacity={0.3}
                          />
                          
                          {/* Seat label */}
                          <Text
                            text={seat.label || `${seat.row}${seat.number}`}
                            fontSize={8}
                            fill="#fff"
                            align="center"
                            verticalAlign="middle"
                            offsetX={SEAT_RADIUS / 2}
                            offsetY={4}
                          />
                          
                          {/* Sold indicator */}
                          {seat.status === 'SOLD' && (
                            <Text
                              text="×"
                              fontSize={16}
                              fill="#fff"
                              align="center"
                              offsetX={5}
                              offsetY={8}
                            />
                          )}
                        </Group>
                      );
                    })}
                  </Layer>
                </Stage>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
