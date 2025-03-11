/**
 * Mock implementation of nodemailer for testing
 */

// Mock transporter object
export const mockTransporter = {
  sendMail: jest.fn().mockResolvedValue({
    messageId: 'mock-message-id',
    envelope: {
      from: 'test@example.com',
      to: ['recipient@example.com']
    },
    accepted: ['recipient@example.com'],
    rejected: [],
    pending: [],
    response: '250 Message accepted'
  }),
  verify: jest.fn().mockResolvedValue(true),
  close: jest.fn()
};

// Mock createTransport function
export const createTransport = jest.fn().mockReturnValue(mockTransporter);

// Helper functions to simulate different responses
export const mockSuccessfulEmailSend = (customResponse = {}) => {
  mockTransporter.sendMail.mockResolvedValueOnce({
    messageId: 'mock-message-id',
    envelope: {
      from: 'test@example.com',
      to: ['recipient@example.com']
    },
    accepted: ['recipient@example.com'],
    rejected: [],
    pending: [],
    response: '250 Message accepted',
    ...customResponse
  });
};

export const mockFailedEmailSend = (errorMessage = 'Failed to send email') => {
  mockTransporter.sendMail.mockRejectedValueOnce(new Error(errorMessage));
};

// Mock error classes
export class NodemailerError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NodemailerError';
  }
}

export class ConnectionError extends NodemailerError {
  constructor(message = 'Connection error') {
    super(message);
    this.name = 'ConnectionError';
  }
}

export class AuthenticationError extends NodemailerError {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class MessageError extends NodemailerError {
  constructor(message = 'Invalid message') {
    super(message);
    this.name = 'MessageError';
  }
}

// Default export for jest.mock
export default {
  createTransport,
  mockTransporter,
  mockSuccessfulEmailSend,
  mockFailedEmailSend,
  NodemailerError,
  ConnectionError,
  AuthenticationError,
  MessageError
};
