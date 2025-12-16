
export interface Professional {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Availability {
  [date: string]: string[]; // e.g., "2024-07-30": ["09:00", "10:00"]
}

export interface ClientFile {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'document';
  uploadedAt: string;
}

export interface Appointment {
  id: string;
  clientId: string;
  professionalId: string;
  date: string;
  time: string;
}

export interface ChatMessage {
  id: string;
  sender: 'client' | 'professional';
  text: string;
  timestamp: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  appointments: Appointment[];
  files: ClientFile[];
  chatHistory: ChatMessage[];
}

export interface WhatsappConfig {
  url: string;
  token: string;
  instance: string;
}

export interface MessageTemplates {
  booking: string;
  confirmation: string;
  reminder: string;
  cancellation: string;
}

export type WebhookFormat = 'STANDARD_JSON' | 'EVOLUTION_API_TEXT';

export interface WebhookConfig {
  bookingUrl: string;
  cancellationUrl: string;
  headers: { [key: string]: string }; // Para API Key
  format: WebhookFormat;
}