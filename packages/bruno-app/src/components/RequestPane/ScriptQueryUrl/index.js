import React, { useRef } from 'react';
import get from 'lodash/get';
import { useDispatch } from 'react-redux';
import { requestUrlChanged } from 'providers/ReduxStore/slices/collections';
import { browseFiles, cancelRequest } from 'providers/ReduxStore/slices/collections/actions';
import SendButton from 'components/RequestPane/SendButton';
import SingleLineEditor from 'components/SingleLineEditor';
import { useTheme } from 'providers/Theme';
import StyledWrapper from './StyledWrapper';
import { IconFolderSearch } from '@tabler/icons-react';

const ScriptQueryUrl = ({ item, collection, handleRun }) => {
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();
  const editorRef = useRef();
  const url = item.draft ? get(item, 'draft.request.url', '') : get(item, 'request.url', '');
  const loading = ['queued', 'sending'].includes(item.requestState);
  const setUrl = (value) => dispatch(requestUrlChanged({ collectionUid: collection.uid, itemUid: item.uid, url: value }));

  const chooseFile = async () => {
    const files = await dispatch(
      browseFiles(
        [
          { name: 'Scripts', extensions: ['sh', 'bat', 'cmd', 'ps1', 'py', 'js', 'exe'] },
          { name: 'All files', extensions: ['*'] }
        ],
        ['openFile']
      )
    );
    if (files?.[0]) setUrl(files[0]);
  };

  const handleCancelRequest = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch(cancelRequest(item.cancelTokenUid, item, collection));
  };

  return (
    <StyledWrapper data-testid="script-query-url-container">
      <div className="browse-button-container">
        <button type="button" className="browse-button" onClick={chooseFile} title="Browse for script file">
          <IconFolderSearch size={15} strokeWidth={1.5} />
        </button>
      </div>

      <div className="input-container">
        <SingleLineEditor
          ref={editorRef}
          value={url}
          placeholder="Path to script file"
          theme={storedTheme}
          onChange={(newValue) => setUrl(newValue)}
          onRun={handleRun}
          collection={collection}
          item={item}
        />
      </div>

      <SendButton
        className="send-button"
        isLoading={loading}
        onSend={handleRun}
        onCancel={handleCancelRequest}
        testId="run-script-btn"
      />
    </StyledWrapper>
  );
};

export default ScriptQueryUrl;
