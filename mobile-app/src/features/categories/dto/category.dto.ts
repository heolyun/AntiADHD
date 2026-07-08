import type { ColorLabel, TimestampedEntity } from '../../../shared/types/api';

export type Category = ColorLabel & TimestampedEntity;

export type CategoryRequest = {
  name: string;
  color: string;
};
