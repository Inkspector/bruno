import React, { useRef } from 'react';
import get from 'lodash/get';
import { useDispatch } from 'react-redux';
import { requestUrlChanged } from 'providers/ReduxStore/slices/collections';
import { browseFiles, saveRequest, cancelRequest } from 'providers/ReduxStore/slices/collections/actions';
import SendButton from 'components/RequestPane/SendButton';

const ScriptQueryUrl = ({ item, collection, handleRun }) => {
  const dispatch = useDispatch();
  const inputRef = useRef();
  const url = item.draft ? get(item, 'draft.request.url', '') : get(item, 'request.url', '');
  const loading = ['queued', 'sending'].includes(item.requestState);
  const setUrl = (value) => dispatch(requestUrlChanged({ collectionUid: collection.uid, itemUid: item.uid, url: value }));
  const chooseFile = async () => {
    const files = await dispatch(browseFiles([{ name: 'Scripts', extensions: ['sh', 'bat', 'cmd', 'ps1', 'py', 'js', 'exe'] }, { name: 'All files', extensions: ['*'] }], ['openFile']));
    if (files?.[0]) setUrl(files[0]);
  };
  return (
    <div className="flex items-center w-full">
      <input ref={inputRef} className="textbox flex-grow" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Path to a script file" />
      <button type="button" className="btn btn-secondary ml-2" onClick={chooseFile}>Browse</button>
      <button type="button" className="btn btn-secondary ml-2" onClick={() => dispatch(saveRequest(item.uid, collection.uid))}>Save</button>
      <SendButton isLoading={loading} onSend={handleRun} onCancel={() => dispatch(cancelRequest(item.cancelTokenUid, item, collection))} testId="run-script-btn" />
    </div>
  );
};
export default ScriptQueryUrl;
