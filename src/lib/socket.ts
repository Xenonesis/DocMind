import { Server } from 'socket.io';

export interface DocumentUpdate {
  documentId: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress?: number;
  message?: string;
  timestamp: string;
}

export interface QueryUpdate {
  queryId: string;
  status: 'processing' | 'completed' | 'error';
  progress?: number;
  message?: string;
  timestamp: string;
}

export interface AnalysisUpdate {
  analysisId: string;
  type: 'insight' | 'risk' | 'opportunity' | 'compliance';
  title: string;
  documentId: string;
  timestamp: string;
}

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join document processing room
    socket.on('join-document-room', (documentId: string) => {
      socket.join(`document-${documentId}`);
      console.log(`Client ${socket.id} joined document room: ${documentId}`);
    });

    // Leave document processing room
    socket.on('leave-document-room', (documentId: string) => {
      socket.leave(`document-${documentId}`);
      console.log(`Client ${socket.id} left document room: ${documentId}`);
    });

    // Join general updates room
    socket.on('join-updates', () => {
      socket.join('updates');
      console.log(`Client ${socket.id} joined updates room`);
    });

    // Handle document status updates
    socket.on('document-update', (update: DocumentUpdate) => {
      // Broadcast to document-specific room
      io.to(`document-${update.documentId}`).emit('document-update', update);
      
      // Also broadcast to general updates room
      io.to('updates').emit('document-update', update);
    });

    // Handle query status updates
    socket.on('query-update', (update: QueryUpdate) => {
      // Broadcast to general updates room
      io.to('updates').emit('query-update', update);
    });

    // Handle analysis updates
    socket.on('analysis-update', (update: AnalysisUpdate) => {
      // Broadcast to general updates room
      io.to('updates').emit('analysis-update', update);
    });

    // Handle progress updates
    socket.on('progress-update', (data: { 
      type: 'document' | 'query' | 'analysis';
      id: string;
      progress: number;
      message?: string;
    }) => {
      const update = {
        ...data,
        timestamp: new Date().toISOString()
      };
      
      if (data.type === 'document') {
        io.to(`document-${data.id}`).emit('progress-update', update);
      }
      
      io.to('updates').emit('progress-update', update);
    });

    // Handle system notifications
    socket.on('system-notification', (notification: {
      type: 'info' | 'warning' | 'error' | 'success';
      title: string;
      message: string;
      timestamp?: string;
    }) => {
      const fullNotification = {
        ...notification,
        timestamp: notification.timestamp || new Date().toISOString()
      };
      
      io.to('updates').emit('system-notification', fullNotification);
    });

    // Handle messages (legacy support)
    socket.on('message', (msg: { text: string; senderId: string }) => {
      socket.emit('message', {
        text: `Echo: ${msg.text}`,
        senderId: 'system',
        timestamp: new Date().toISOString(),
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    // Send welcome message
    socket.emit('message', {
      text: 'Welcome to DocuMind AI Real-time Updates!',
      senderId: 'system',
      timestamp: new Date().toISOString(),
    });

    // Send connection confirmation
    socket.emit('connected', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
      message: 'Successfully connected to real-time updates'
    });
  });
};

// Helper functions to emit updates from server-side
export const emitDocumentUpdate = (io: Server, update: DocumentUpdate) => {
  io.to(`document-${update.documentId}`).emit('document-update', update);
  io.to('updates').emit('document-update', update);
};

export const emitQueryUpdate = (io: Server, update: QueryUpdate) => {
  io.to('updates').emit('query-update', update);
};

export const emitAnalysisUpdate = (io: Server, update: AnalysisUpdate) => {
  io.to('updates').emit('analysis-update', update);
};

export const emitProgressUpdate = (io: Server, data: {
  type: 'document' | 'query' | 'analysis';
  id: string;
  progress: number;
  message?: string;
}) => {
  const update = {
    ...data,
    timestamp: new Date().toISOString()
  };
  
  if (data.type === 'document') {
    io.to(`document-${data.id}`).emit('progress-update', update);
  }
  
  io.to('updates').emit('progress-update', update);
};

export const emitSystemNotification = (io: Server, notification: {
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
}) => {
  const fullNotification = {
    ...notification,
    timestamp: new Date().toISOString()
  };
  
  io.to('updates').emit('system-notification', fullNotification);
};