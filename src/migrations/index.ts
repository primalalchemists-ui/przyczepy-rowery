import * as migration_20260211_170046 from './20260211_170046';

export const migrations = [
  {
    up: migration_20260211_170046.up,
    down: migration_20260211_170046.down,
    name: '20260211_170046'
  },
];
