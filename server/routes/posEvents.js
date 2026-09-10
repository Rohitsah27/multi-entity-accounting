import express from 'express';
import PosEvent from '../models/PosEvent.js';

const router = express.Router();

// GET all injected POS events, optionally filtered by orderId or entity
router.get('/', async (req, res) => {
  try {
    const { orderId, entity } = req.query;
    const filter = {};
    if (orderId) filter.orderId = orderId;
    if (entity) filter.entity = entity;

    const events = await PosEvent.find(filter).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST persist a newly injected POS event — rejected with 409 if already injected for this orderId and eventType
router.post('/', async (req, res) => {
  try {
    const { orderId, eventType } = req.body;
    if (!orderId || !eventType) {
      return res.status(400).json({ error: 'orderId and eventType are required' });
    }

    const existing = await PosEvent.findOne({ orderId, eventType });
    if (existing) {
      return res.status(409).json({ error: `${eventType} has already been injected for order ${orderId}`, event: existing });
    }

    const event = new PosEvent(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    if (error.code === 11000) {
      const existing = await PosEvent.findOne({ orderId: req.body.orderId, eventType: req.body.eventType });
      return res.status(409).json({ error: 'This stage has already been injected for this order', event: existing });
    }
    res.status(400).json({ error: error.message });
  }
});

// DELETE remove injected POS events for a specific orderId (or all)
router.delete('/:orderId?', async (req, res) => {
  try {
    const { orderId } = req.params;
    const filter = orderId ? { orderId } : {};
    const result = await PosEvent.deleteMany(filter);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
