import React, { useCallback, useRef, useMemo } from 'react';
import get from 'lodash/get';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from 'providers/Theme';
import { updateScriptRequestConfig } from 'providers/ReduxStore/slices/collections';
import { saveRequest, sendRequest } from 'providers/ReduxStore/slices/collections/actions';
import { updateTableColumnWidths } from 'providers/ReduxStore/slices/tabs';
import SingleLineEditor from 'components/SingleLineEditor';
import EditableTable from 'components/EditableTable';
import StyledWrapper from './StyledWrapper';
import { usePersistedState } from 'hooks/usePersistedState';
import { useTrackScroll } from 'hooks/useTrackScroll';

const ScriptArgs = ({ item, collection }) => {
  const dispatch = useDispatch();
  const { storedTheme } = useTheme();
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const args = item.draft ? get(item, 'draft.request.args', []) : get(item, 'request.args', []);
  const env = item.draft ? get(item, 'draft.request.env', []) : get(item, 'request.env', []);
  const wrapperRef = useRef(null);
  const [scroll, setScroll] = usePersistedState({ key: `request-script-args-scroll-${item.uid}`, default: 0 });
  useTrackScroll({ ref: wrapperRef, selector: '.flex-boundary', onChange: setScroll, initialValue: scroll });

  const focusedTab = tabs?.find((t) => t.uid === activeTabUid);
  const argsWidths = focusedTab?.tableColumnWidths?.['script-args'] || {};

  const handleColumnWidthsChange = (tableId, widths) => {
    dispatch(updateTableColumnWidths({ uid: activeTabUid, tableId, widths }));
  };

  const onSave = () => dispatch(saveRequest(item.uid, collection.uid));
  const handleRun = () => dispatch(sendRequest(item, collection.uid));

  const handleArgsChange = useCallback(
    (updatedRows) => {
      dispatch(
        updateScriptRequestConfig({
          collectionUid: collection.uid,
          itemUid: item.uid,
          args: updatedRows,
          env
        })
      );
    },
    [dispatch, collection.uid, item.uid, env]
  );

  const columns = [
    {
      key: 'value',
      name: 'Argument',
      placeholder: 'Argument',
      width: '100%',
      render: ({ value, onChange }) => (
        <SingleLineEditor
          value={value || ''}
          theme={storedTheme}
          onSave={onSave}
          onChange={(newValue) => onChange(newValue.replace(/[\r\n]/g, ''))}
          onRun={handleRun}
          collection={collection}
          item={item}
          placeholder={!value ? 'Argument' : ''}
        />
      )
    }
  ];

  return (
    <StyledWrapper className="w-full" ref={wrapperRef}>
      <EditableTable
        tableId="script-args"
        columns={columns}
        rows={args}
        onChange={handleArgsChange}
        defaultRow={{ value: '' }}
        showCheckbox={false}
        reorderable={true}
        initialScroll={scroll}
        columnWidths={argsWidths}
        onColumnWidthsChange={(widths) => handleColumnWidthsChange('script-args', widths)}
      />
    </StyledWrapper>
  );
};

export default ScriptArgs;
