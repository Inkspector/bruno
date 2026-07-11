import React, { useState, useCallback, useRef } from 'react';
import get from 'lodash/get';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from 'providers/Theme';
import { setScriptEnv } from 'providers/ReduxStore/slices/collections';
import { sendRequest, saveRequest } from 'providers/ReduxStore/slices/collections/actions';
import { updateTableColumnWidths } from 'providers/ReduxStore/slices/tabs';
import SingleLineEditor from 'components/SingleLineEditor';
import EditableTable from 'components/EditableTable';
import StyledWrapper from './StyledWrapper';
import { headerNameRegex, headerValueRegex } from 'utils/common/regex';
import { usePersistedState } from 'hooks/usePersistedState';
import { useTrackScroll } from 'hooks/useTrackScroll';

const ScriptEnv = ({ item, collection }) => {
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const headers = item.draft ? get(item, 'draft.request.env') : get(item, 'request.env');
  const wrapperRef = useRef(null);
  const [scroll, setScroll] = usePersistedState({ key: `request-headers-scroll-${item.uid}`, default: 0 });
  useTrackScroll({ ref: wrapperRef, selector: '.flex-boundary', onChange: setScroll, initialValue: scroll });

  // Get column widths from Redux
  const focusedTab = tabs?.find((t) => t.uid === activeTabUid);
  const headersWidths = focusedTab?.tableColumnWidths?.['request-headers'] || {};

  const handleColumnWidthsChange = (tableId, widths) => {
    dispatch(updateTableColumnWidths({ uid: activeTabUid, tableId, widths }));
  };

  const onSave = () => dispatch(saveRequest(item.uid, collection.uid));
  const handleRun = () => dispatch(sendRequest(item, collection.uid));

  const handleHeadersChange = useCallback((updatedHeaders) => {
    dispatch(setScriptEnv({
      collectionUid: collection.uid,
      itemUid: item.uid,
      env: updatedHeaders
    }));
  }, [dispatch, collection.uid, item.uid]);

  const getRowError = useCallback((row, index, key) => {
    if (key === 'name') {
      if (!row.name || row.name.trim() === '') return null;
      if (!headerNameRegex.test(row.name)) {
        return 'Env name cannot contain spaces or newlines';
      }
    }
    if (key === 'value') {
      if (!row.value) return null;
      if (!headerValueRegex.test(row.value)) {
        return 'Env value cannot contain newlines';
      }
    }
    return null;
  }, []);

  const columns = [
    {
      key: 'name',
      name: 'Name',
      isKeyField: true,
      placeholder: 'Name',
      width: '30%',
      render: ({ value, onChange }) => (
        <SingleLineEditor
          value={value || ''}
          theme={storedTheme}
          onSave={onSave}
          onChange={(newValue) => onChange(newValue.replace(/[\r\n]/g, ''))}
          onRun={handleRun}
          collection={collection}
          item={item}
          placeholder={!value ? 'Name' : ''}
        />
      )
    },
    {
      key: 'value',
      name: 'Value',
      placeholder: 'Value',
      render: ({ value, onChange }) => (
        <SingleLineEditor
          value={value || ''}
          theme={storedTheme}
          onSave={onSave}
          onChange={onChange}
          onRun={handleRun}
          collection={collection}
          item={item}
          placeholder={!value ? 'Value' : ''}
        />
      )
    }
  ];

  const defaultRow = {
    name: '',
    value: ''
  };

  return (
    <StyledWrapper className="w-full" ref={wrapperRef}>
      <EditableTable
        tableId="script-env"
        columns={columns}
        rows={headers || []}
        onChange={handleHeadersChange}
        defaultRow={defaultRow}
        getRowError={getRowError}
        reorderable={true}
        initialScroll={scroll}
        columnWidths={headersWidths}
        onColumnWidthsChange={(widths) => handleColumnWidthsChange('script-env', widths)}
      />
    </StyledWrapper>
  );
};

export default ScriptEnv;
