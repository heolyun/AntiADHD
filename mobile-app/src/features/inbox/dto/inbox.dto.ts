import type { TimestampedEntity } from '../../../shared/types/api';

export type InboxPriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type InboxStatus = 'INBOX' | 'PLANNED' | 'DONE';

export type InboxItem = TimestampedEntity & {
  id: number;
  title: string;
  description: string | null;
  estimatedMinutes: number | null;
  priority: InboxPriority;
  status: InboxStatus;
};

export type InboxItemRequest = {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  priority?: InboxPriority;
  status?: InboxStatus;
};
