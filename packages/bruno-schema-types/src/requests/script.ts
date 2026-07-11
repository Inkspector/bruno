import type { KeyValue } from '../common';

export interface ScriptRequest {
  url: string;
  method: 'SCRIPT' | string;
  args: Array<Pick<KeyValue, 'uid' | 'value' | 'enabled'>>;
  env: Array<Pick<KeyValue, 'uid' | 'name' | 'value' | 'enabled'>>;
}
