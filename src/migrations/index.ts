import * as migration_20260211_171629 from './20260211_171629';

export const migrations = [
  {
    up: migration_20260211_171629.up,
    down: migration_20260211_171629.down,
    name: '20260211_171629'
  },
];
