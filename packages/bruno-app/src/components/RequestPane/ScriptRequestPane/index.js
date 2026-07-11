import React, { useMemo } from 'react';
import get from 'lodash/get';
import { useDispatch } from 'react-redux';
import { updateScriptRequestConfig } from 'providers/ReduxStore/slices/collections';
import { uuid } from 'utils/common';

const rowsToText = (rows = []) => rows.filter((row) => row.enabled !== false).map((row) => row.name ? `${row.name}=${row.value || ''}` : row.value || '').join('\n');
const textToRows = (value, named) => value.split('\n').filter((line) => line.trim()).map((line) => {
  const separator = named ? line.indexOf('=') : -1;
  return named
    ? { uid: uuid(), name: separator < 0 ? line.trim() : line.slice(0, separator).trim(), value: separator < 0 ? '' : line.slice(separator + 1), enabled: true }
    : { uid: uuid(), value: line, enabled: true };
});

const ScriptRequestPane = ({ item, collection }) => {
  const dispatch = useDispatch();
  const request = item.draft?.request || item.request;
  const update = (key, value, named) => dispatch(updateScriptRequestConfig({
    collectionUid: collection.uid, itemUid: item.uid,
    args: key === 'args' ? textToRows(value, named) : request.args || [],
    env: key === 'env' ? textToRows(value, named) : request.env || []
  }));
  const args = useMemo(() => rowsToText(get(request, 'args', [])), [request]);
  const env = useMemo(() => rowsToText(get(request, 'env', [])), [request]);
  return (
    <div className="p-4 overflow-auto h-full">
      <p className="text-sm text-muted mb-4">Arguments and environment variables support Bruno variables such as <code>{'{{baseUrl}}'}</code>.</p>
      <label className="block font-medium mb-2">Arguments <small className="font-normal text-muted">(one argument per line)</small></label>
      <textarea className="textbox w-full min-h-32" value={args} onChange={(e) => update('args', e.target.value, false)} placeholder="--verbose&#10;input.json" />
      <label className="block font-medium mb-2 mt-5">Environment variables <small className="font-normal text-muted">(NAME=value, one per line)</small></label>
      <textarea className="textbox w-full min-h-32" value={env} onChange={(e) => update('env', e.target.value, true)} placeholder="API_TOKEN={{token}}&#10;MODE=production" />
    </div>
  );
};

export default ScriptRequestPane;
