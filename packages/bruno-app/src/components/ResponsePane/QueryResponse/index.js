import React, { useEffect, useState } from 'react';
import QueryResult from '../QueryResult';
import { RAW_FORMAT_OPTIONS, useInitialResponseFormat, useResponsePreviewFormatOptions } from '../QueryResult/index';
import QueryResultTypeSelector from '../QueryResult/QueryResultTypeSelector/index';
import StyledWrapper from './StyledWrapper';
import classnames from 'classnames';

const QueryResponse = ({
  item,
  collection,
  data,
  dataBuffer,
  disableRunEventListener,
  headers,
  error,
  hideResultTypeSelector,
  docKey,
  rawOnly = false
}) => {
  const { initialFormat, initialTab } = useInitialResponseFormat(dataBuffer, headers);
  const previewFormatOptions = useResponsePreviewFormatOptions(dataBuffer, headers);
  const [selectedFormat, setSelectedFormat] = useState('raw');
  const [selectedTab, setSelectedTab] = useState('editor');
  const [filter, setFilter] = useState('');
  const [filterExpanded, setFilterExpanded] = useState(false);

  useEffect(() => {
    if (initialFormat !== null && initialTab !== null) {
      setSelectedFormat(rawOnly ? 'raw' : initialFormat);
      setSelectedTab(rawOnly ? 'editor' : initialTab);
    }
  }, [initialFormat, initialTab, rawOnly]);
  return (
    <StyledWrapper>
      {!hideResultTypeSelector && (
        <div className="flex items-center justify-end p-2 result-type-selector">

          <QueryResultTypeSelector
            formatOptions={rawOnly ? RAW_FORMAT_OPTIONS : previewFormatOptions}
            formatValue={selectedFormat}
            onFormatChange={(newFormat) => {
              setSelectedFormat(newFormat);
            }}
            onPreviewTabSelect={() => {
              setSelectedTab((prev) => prev === 'editor' ? 'preview' : 'editor');
            }}
            selectedTab={selectedTab}
            isActiveTab={true}
            hidePreviewToggle={rawOnly}
          />
        </div>
      )}
      <div className={classnames('flex-1 result-content', selectedTab === 'editor' ? 'px-2 py-1' : '')}>
        <QueryResult
          item={item}
          collection={collection}
          data={data}
          dataBuffer={dataBuffer}
          disableRunEventListener={disableRunEventListener}
          headers={headers}
          error={error}
          selectedFormat={selectedFormat}
          selectedTab={selectedTab}
          filter={filter}
          filterExpanded={filterExpanded}
          onFilterChange={setFilter}
          onFilterExpandChange={setFilterExpanded}
          docKey={docKey}
        />
      </div>
    </StyledWrapper>
  );
};

export default QueryResponse;
