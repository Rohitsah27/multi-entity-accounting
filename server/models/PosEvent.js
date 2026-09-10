import mongoose from 'mongoose';

const posEventSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventType: {
    type: String,
    required: true
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  customer: String,
  pizzaItem: String,
  totalAmount: Number,
  franchiseShare: Number,
  corporateShare: Number,
  franchisePct: Number,
  paymentMethod: String,
  timestamp: String,
  status: {
    type: String,
    default: 'POSTED'
  },
  entity: String,
  entityName: String,
  counterparty: String,
  jeNumber: String,
  hubJeNumber: String,
  jeLines: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  hubJeLines: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  payload: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// A stage can only ever be injected once per orderId
posEventSchema.index({ orderId: 1, eventType: 1 }, { unique: true });

const PosEvent = mongoose.model('PosEvent', posEventSchema);

export default PosEvent;
