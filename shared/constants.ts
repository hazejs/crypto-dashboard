// Protocol constants shared by server and client — the single definition of
// the paths and message types that cross the wire.

export const API_PREFIX = '/api';
export const WS_PATH = '/ws';
export const SNAPSHOT_MESSAGE_TYPE = 'snapshot';

export const HISTORY_DEFAULT_MINUTES = 60;
export const HISTORY_MIN_MINUTES = 1;
export const HISTORY_MAX_MINUTES = 1440;
