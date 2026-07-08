import type { ColorLabel, TimestampedEntity } from '../../../shared/types/api';

export type Tag = ColorLabel & TimestampedEntity;

export type TagRequest = {
  name: string;
  color: string;
};
