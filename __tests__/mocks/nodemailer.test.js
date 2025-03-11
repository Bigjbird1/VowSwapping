/**
 * Tests for nodemailer.js mock
 */

import nodemailerMock, {
  mockTransporter,
  mockSuccessfulEmailSend,
  mockFailedEmailSend,
  NodemailerError,
  ConnectionError,
  AuthenticationError,
  MessageError
} from './nodemailer';

describe('Nodemailer Mock', () => {
  describe('createTransport', () => {
    it('should return a mock transporter', () => {
      const transporter = nodemailerMock.createTransport({
        host: 'smtp.example.com',
        port: 587,
        auth: {
          user: 'user@example.com',
          pass: 'password'
        }
      });
      
      expect(transporter).toBe(mockTransporter);
      expect(nodemailerMock.createTransport).toHaveBeenCalled();
    });

    it('should accept different transport configurations', () => {
      // SMTP config
      nodemailerMock.createTransport({
        host: 'smtp.example.com',
        port: 587
      });
      
      // SES config
      nodemailerMock.createTransport({
        SES: { apiVersion: '2010-12-01' }
      });
      
      // Sendmail config
      nodemailerMock.createTransport({
        sendmail: true,
        path: '/usr/sbin/sendmail'
      });
      
      expect(nodemailerMock.createTransport).toHaveBeenCalledTimes(3);
    });
  });

  describe('mockTransporter', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
    });

    describe('sendMail', () => {
      it('should return a successful response by default', async () => {
        const mailOptions = {
          from: 'sender@example.com',
          to: 'recipient@example.com',
          subject: 'Test Email',
          text: 'Hello, world!'
        };
        
        const result = await mockTransporter.sendMail(mailOptions);
        
        expect(result.messageId).toBeDefined();
        expect(result.envelope).toBeDefined();
        expect(result.accepted).toContain('recipient@example.com');
        expect(result.rejected).toEqual([]);
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(mailOptions);
      });

      it('should allow customizing the response with mockSuccessfulEmailSend', async () => {
        const customResponse = {
          messageId: 'custom-id',
          envelope: {
            from: 'custom@example.com',
            to: ['custom-recipient@example.com']
          },
          accepted: ['custom-recipient@example.com']
        };
        
        mockSuccessfulEmailSend(customResponse);
        
        const result = await mockTransporter.sendMail({});
        
        expect(result.messageId).toBe('custom-id');
        expect(result.envelope.from).toBe('custom@example.com');
        expect(result.accepted).toContain('custom-recipient@example.com');
      });

      it('should allow simulating failures with mockFailedEmailSend', async () => {
        mockFailedEmailSend('SMTP connection error');
        
        await expect(mockTransporter.sendMail({}))
          .rejects.toThrow('SMTP connection error');
        
        // Second call should succeed (mock is reset)
        const result = await mockTransporter.sendMail({});
        expect(result.messageId).toBeDefined();
      });

      it('should pass mail options to the mock function', async () => {
        const mailOptions = {
          from: 'sender@example.com',
          to: 'recipient@example.com',
          cc: 'cc@example.com',
          bcc: 'bcc@example.com',
          subject: 'Important Message',
          text: 'Plain text content',
          html: '<p>HTML content</p>',
          attachments: [{ filename: 'test.pdf' }]
        };
        
        await mockTransporter.sendMail(mailOptions);
        
        expect(mockTransporter.sendMail).toHaveBeenCalledWith(mailOptions);
      });
    });

    describe('verify', () => {
      it('should return true by default', async () => {
        const result = await mockTransporter.verify();
        
        expect(result).toBe(true);
        expect(mockTransporter.verify).toHaveBeenCalled();
      });

      it('should allow mocking verification failure', async () => {
        mockTransporter.verify.mockRejectedValueOnce(
          new ConnectionError('Failed to connect to SMTP server')
        );
        
        await expect(mockTransporter.verify())
          .rejects.toThrow('Failed to connect to SMTP server');
        
        // Second call should succeed
        const result = await mockTransporter.verify();
        expect(result).toBe(true);
      });
    });

    describe('close', () => {
      it('should call the close method', () => {
        mockTransporter.close();
        
        expect(mockTransporter.close).toHaveBeenCalled();
      });
    });
  });

  describe('Helper Functions', () => {
    beforeEach(() => {
      // Reset mocks before each test
      jest.clearAllMocks();
    });

    describe('mockSuccessfulEmailSend', () => {
      it('should set a one-time success response', async () => {
        mockSuccessfulEmailSend({ messageId: 'success-id' });
        
        // First call should use the mocked response
        const result1 = await mockTransporter.sendMail({});
        expect(result1.messageId).toBe('success-id');
        
        // Second call should use the default response
        const result2 = await mockTransporter.sendMail({});
        expect(result2.messageId).toBe('mock-message-id');
      });

      it('should merge custom response with defaults', async () => {
        mockSuccessfulEmailSend({
          messageId: 'custom-id',
          // Only override messageId, keep other defaults
        });
        
        const result = await mockTransporter.sendMail({});
        
        expect(result.messageId).toBe('custom-id');
        expect(result.envelope).toBeDefined();
        expect(result.accepted).toBeDefined();
        expect(result.response).toBeDefined();
      });
    });

    describe('mockFailedEmailSend', () => {
      it('should set a one-time failure response', async () => {
        mockFailedEmailSend('Custom error message');
        
        // First call should fail
        await expect(mockTransporter.sendMail({}))
          .rejects.toThrow('Custom error message');
        
        // Second call should succeed
        const result = await mockTransporter.sendMail({});
        expect(result.messageId).toBeDefined();
      });

      it('should use default error message if not provided', async () => {
        mockFailedEmailSend();
        
        await expect(mockTransporter.sendMail({}))
          .rejects.toThrow('Failed to send email');
      });
    });
  });

  describe('Error Classes', () => {
    it('should create a base NodemailerError', () => {
      const error = new NodemailerError('Generic error');
      
      expect(error.name).toBe('NodemailerError');
      expect(error.message).toBe('Generic error');
      expect(error instanceof Error).toBe(true);
    });

    it('should create a ConnectionError', () => {
      const error = new ConnectionError();
      
      expect(error.name).toBe('ConnectionError');
      expect(error.message).toBe('Connection error');
      expect(error instanceof NodemailerError).toBe(true);
    });

    it('should create a ConnectionError with custom message', () => {
      const error = new ConnectionError('Failed to connect to SMTP server');
      
      expect(error.message).toBe('Failed to connect to SMTP server');
      expect(error instanceof NodemailerError).toBe(true);
    });

    it('should create an AuthenticationError', () => {
      const error = new AuthenticationError();
      
      expect(error.name).toBe('AuthenticationError');
      expect(error.message).toBe('Authentication failed');
      expect(error instanceof NodemailerError).toBe(true);
    });

    it('should create a MessageError', () => {
      const error = new MessageError();
      
      expect(error.name).toBe('MessageError');
      expect(error.message).toBe('Invalid message');
      expect(error instanceof NodemailerError).toBe(true);
    });
  });

  describe('Default Export', () => {
    it('should export createTransport', () => {
      expect(nodemailerMock.createTransport).toBeDefined();
    });

    it('should export mockTransporter', () => {
      expect(nodemailerMock.mockTransporter).toBe(mockTransporter);
    });

    it('should export helper functions', () => {
      expect(nodemailerMock.mockSuccessfulEmailSend).toBe(mockSuccessfulEmailSend);
      expect(nodemailerMock.mockFailedEmailSend).toBe(mockFailedEmailSend);
    });

    it('should export error classes', () => {
      expect(nodemailerMock.NodemailerError).toBe(NodemailerError);
      expect(nodemailerMock.ConnectionError).toBe(ConnectionError);
      expect(nodemailerMock.AuthenticationError).toBe(AuthenticationError);
      expect(nodemailerMock.MessageError).toBe(MessageError);
    });
  });
});
