import { uuid, ensureString } from '../../../utils';

const parseScriptRequest = (item: any): any => ({
  uid: uuid(), type: 'script-request', seq: item.info?.seq || 1,
  name: ensureString(item.info?.name, 'Untitled Script'), tags: item.info?.tags || [],
  settings: item.settings || {}, app: null, fileContent: null, root: null, items: [], examples: [], filename: null, pathname: null,
  request: {
    method: 'SCRIPT', url: ensureString(item.script?.path), args: item.script?.args || [], env: item.script?.env || [],
    headers: [], params: [], body: { mode: 'none' }, auth: { mode: 'none' }, script: { req: null, res: null }, vars: { req: [], res: [] }, assertions: [], tests: null, docs: null
  }
});
export default parseScriptRequest;
