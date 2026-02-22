import * as migration_20260211_171629 from './20260211_171629';
import * as migration_20260213_022149 from './20260213_022149';
import * as migration_20260219_000526 from './20260219_000526';
import * as migration_20260222_132854 from './20260222_132854';

export const migrations = [
  {
    up: migration_20260211_171629.up,
    down: migration_20260211_171629.down,
    name: '20260211_171629',
  },
  {
    up: migration_20260213_022149.up,
    down: migration_20260213_022149.down,
    name: '20260213_022149',
  },
  {
    up: migration_20260219_000526.up,
    down: migration_20260219_000526.down,
    name: '20260219_000526',
  },
  {
    up: migration_20260222_132854.up,
    down: migration_20260222_132854.down,
    name: '20260222_132854'
  },
];
