import { stringifyYml } from '../utils';
const stringifyScriptRequest = (item: any): string => stringifyYml({
  info: { name: item.name || 'Untitled Script', type: 'script', ...(item.seq ? { seq: item.seq } : {}), ...(item.tags?.length ? { tags: item.tags } : {}) },
  script: { path: item.request?.url || '', args: item.request?.args || [], env: item.request?.env || [] },
  ...(item.request?.docs?.trim().length ? { docs: item.request.docs } : {})
});
export default stringifyScriptRequest;
