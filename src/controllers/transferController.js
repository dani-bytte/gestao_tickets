// controllers/transferController.js
const Ticket = require('@models/Ticket');
const TicketTransfer = require('@models/TransferRequest');
const logger = require('@config/logger');
const connectToMongoDB = require('@config/mongoConnection');

const requestTransfer = async (req, res) => {
  try {
    await connectToMongoDB();
    
    const { ticketId, progressPercentage, clientInfo } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket não encontrado' });
    }

    // Check if user owns the ticket
    if (ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    // Check if there's already a pending transfer
    const existingTransfer = await TicketTransfer.findOne({
      ticket: ticketId,
      status: 'pending'
    });

    if (existingTransfer) {
      return res.status(400).json({ error: 'Já existe uma solicitação de transferência pendente' });
    }

    const transfer = new TicketTransfer({
      ticket: ticketId,
      requestedBy: req.user._id,
      progressPercentage,
      clientInfo,
    });

    await transfer.save();
    logger.info(`Solicitação de transferência criada para ticket ${ticketId}`);
    
    res.status(201).json({ message: 'Solicitação de transferência criada' });
  } catch (error) {
    logger.error('Erro ao solicitar transferência:', error);
    res.status(500).json({ error: 'Erro ao solicitar transferência' });
  }
};
  
const approveTransfer = async (req, res) => {
  try {
    await connectToMongoDB();
    
    const { transferId, approved, transferToId, reason } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    const transfer = await TicketTransfer.findById(transferId);
    if (!transfer) {
      return res.status(404).json({ error: 'Solicitação não encontrada' });
    }

    if (transfer.status !== 'pending') {
      return res.status(400).json({ error: 'Solicitação já processada' });
    }

    transfer.status = approved ? 'approved' : 'rejected';
    transfer.approvedBy = req.user._id;
    transfer.approvedAt = new Date();
    transfer.reason = reason;

    if (approved) {
      const ticket = await Ticket.findById(transfer.ticket);
      ticket.createdBy = transferToId;
      transfer.transferTo = transferToId;
      await ticket.save();
    }

    await transfer.save();
    
    logger.info(`Transferência ${approved ? 'aprovada' : 'rejeitada'} para ticket ${transfer.ticket}`);
    res.json({ message: `Transferência ${approved ? 'aprovada' : 'rejeitada'}` });
  } catch (error) {
    logger.error('Erro ao processar transferência:', error);
    res.status(500).json({ error: 'Erro ao processar transferência' });
  }
};
  
const listTransferRequests = async (req, res) => {
  try {
    await connectToMongoDB();
    
    let query = {};
    
    if (req.user.role !== 'admin') {
      // Users can only see their own transfers
      query.$or = [
        { requestedBy: req.user._id },
        { transferTo: req.user._id }
      ];
    }

    const transfers = await TicketTransfer.find(query)
      .populate('ticket', 'ticket client email')
      .populate('requestedBy', 'username')
      .populate('transferTo', 'username')
      .populate('approvedBy', 'username')
      .lean();

    res.json(transfers);
  } catch (error) {
    logger.error('Erro ao listar transferências:', error);
    res.status(500).json({ error: 'Erro ao listar transferências' });
  }
};

module.exports = {
  requestTransfer,
  approveTransfer,
  listTransferRequests
};