import React, { useCallback, useMemo, useRef } from 'react';
import find from 'lodash/find';
import { useDispatch, useSelector } from 'react-redux';
import { updateResponseFormat, updateResponsePaneTab } from 'providers/ReduxStore/slices/tabs';
import QueryResult, { RAW_FORMAT_OPTIONS } from '../QueryResult';
import QueryResultTypeSelector from '../QueryResult/QueryResultTypeSelector';
import Timeline from '../Timeline';
import Placeholder from '../Placeholder';
import Overlay from '../Overlay';
import ClearTimeline from '../ClearTimeline';
import ResponsePaneActions from '../ResponsePaneActions';
import ResponseSize from '../ResponseSize';
import ResponseTime from '../ResponseTime';
import ResponseStopWatch from '../ResponseStopWatch';
import ResponsiveTabs from 'ui/ResponsiveTabs';
import HeightBoundContainer from 'ui/HeightBoundContainer';
import StyledWrapper from '../StyledWrapper';
import ScriptArgs from './ScriptArgs';
import ScriptEnv from './ScriptEnv';
import ScriptStatus from './ScriptStatus';

const VALID_TABS = ['response', 'args', 'env', 'timeline'];

const ScriptResponsePane = ({ item, collection }) => {
  const dispatch = useDispatch();
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);
  const focusedTab = find(tabs, (tab) => tab.uid === activeTabUid);
  const rightContentRef = useRef(null);
  const response = item.response || {};
  const isLoading = ['queued', 'sending'].includes(item.requestState);
  const activePane = VALID_TABS.includes(focusedTab?.responsePaneTab) ? focusedTab.responsePaneTab : 'response';
  const selectedFormat = RAW_FORMAT_OPTIONS.some((option) => option.id === focusedTab?.responseFormat)
    ? focusedTab.responseFormat
    : 'raw';
  const requestTimeline = (collection.timeline || []).filter((entry) => entry.itemUid === item.uid);
  const args = item.requestSent?.data || [];
  const env = item.requestSent?.headers || {};
  const responseSize = typeof response.size === 'number'
    ? response.size
    : response.dataBuffer ? Buffer.from(response.dataBuffer, 'base64').length : 0;
  const isRunning = Boolean(response.stream?.running);
  const isError = Boolean(response.isError || response.error || (typeof response.status === 'number' && response.status !== 200));

  const allTabs = useMemo(() => [
    { key: 'response', label: 'Response', indicator: null },
    { key: 'args', label: 'Args', indicator: args.length ? <sup className="ml-1 font-medium">{args.length}</sup> : null },
    { key: 'env', label: 'Env', indicator: Object.keys(env).length ? <sup className="ml-1 font-medium">{Object.keys(env).length}</sup> : null },
    { key: 'timeline', label: 'Timeline', indicator: null }
  ], [args.length, env]);

  const selectTab = useCallback((responsePaneTab) => {
    dispatch(updateResponsePaneTab({ uid: item.uid, responsePaneTab }));
  }, [dispatch, item.uid]);

  const getTabPanel = () => {
    if (activePane === 'args') return <ScriptArgs args={args} item={item} />;
    if (activePane === 'env') return <ScriptEnv env={env} item={item} />;
    if (activePane === 'timeline') return <Timeline collection={collection} item={item} />;
    return (
      <QueryResult
        item={item}
        collection={collection}
        data={response.data}
        dataBuffer={response.dataBuffer}
        headers={response.headers}
        error={response.error}
        selectedFormat={selectedFormat}
        selectedTab="editor"
      />
    );
  };

  if (!item.response && !requestTimeline.length && !isLoading) {
    return <HeightBoundContainer><Placeholder /></HeightBoundContainer>;
  }

  const rightContent = item.response ? (
    <div ref={rightContentRef} className="flex justify-end items-center right-side-container gap-3">
      {activePane === 'response' && (
        <div className="result-view-tabs">
          <QueryResultTypeSelector
            formatOptions={RAW_FORMAT_OPTIONS}
            formatValue={selectedFormat}
            onFormatChange={(responseFormat) => dispatch(updateResponseFormat({ uid: item.uid, responseFormat }))}
            selectedTab="editor"
            isActiveTab={true}
            hidePreviewToggle={true}
          />
        </div>
      )}
      <div className="flex items-center response-pane-status">
        <ScriptStatus isError={isError} isRunning={isRunning} />
        {isRunning ? <ResponseStopWatch startMillis={response.duration} /> : <ResponseTime duration={response.duration} />}
        <ResponseSize size={responseSize} />
      </div>
      <div className="flex items-center response-pane-actions">
        {activePane === 'timeline'
          ? <ClearTimeline item={item} collection={collection} />
          : activePane === 'response' && !response.error
            ? <ResponsePaneActions item={item} collection={collection} responseSize={responseSize} selectedFormat={selectedFormat} selectedTab="editor" data={response.data} dataBuffer={response.dataBuffer} />
            : null}
      </div>
    </div>
  ) : null;

  return (
    <StyledWrapper className="flex flex-col h-full relative">
      <div className="px-4">
        <ResponsiveTabs tabs={allTabs} activeTab={activePane} onTabSelect={selectTab} rightContent={rightContent} rightContentRef={rightContentRef} rightContentExpandedWidth={135} />
      </div>
      <section className="response-pane-content">
        {isLoading && !item.response ? <Overlay item={item} collection={collection} /> : null}
        <div className="response-tab-content">{item.response || activePane === 'timeline' ? getTabPanel() : null}</div>
      </section>
    </StyledWrapper>
  );
};

export default ScriptResponsePane;
