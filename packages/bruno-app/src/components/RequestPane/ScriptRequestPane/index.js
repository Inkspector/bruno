import React, { useMemo, useCallback, useRef } from 'react';
import { find } from 'lodash';
import { updateRequestPaneTab } from 'providers/ReduxStore/slices/tabs';
import { useDispatch, useSelector } from 'react-redux';
import HeightBoundContainer from 'ui/HeightBoundContainer';
import ResponsiveTabs from 'ui/ResponsiveTabs';
import { getPropertyFromDraftOrRequest } from 'utils/collections/index';
import StyledWrapper from './StyledWrapper';
import ScriptArgs from './ScriptArgs';
import ScriptEnv from './ScriptEnv';
import Documentation from 'components/Documentation/index';
import StatusDot from 'components/StatusDot/index';

const ScriptRequestPane = ({ item, collection, handleRun }) => {
  const dispatch = useDispatch();
  const tabs = useSelector((state) => state.tabs.tabs);
  const activeTabUid = useSelector((state) => state.tabs.activeTabUid);

  const rightContentRef = useRef(null);

  const focusedTab = find(tabs, (t) => t.uid === activeTabUid);
  const requestPaneTab = ['args', 'env', 'docs'].includes(focusedTab?.requestPaneTab)
    ? focusedTab.requestPaneTab
    : 'args';

  const selectTab = useCallback(
    (tab) => {
      dispatch(updateRequestPaneTab({
        uid: item.uid,
        requestPaneTab: tab
      }));
    },
    [dispatch, item.uid]
  );

  const env = getPropertyFromDraftOrRequest(item, 'request.env') || [];
  const args = getPropertyFromDraftOrRequest(item, 'request.args') || [];
  const docs = getPropertyFromDraftOrRequest(item, 'request.docs');
  const activeEnvLength = env.filter((envItem) => envItem.enabled).length;
  const activeArgsLength = args.filter((arg) => typeof arg === 'string' ? arg.trim().length > 0 : Boolean(arg)).length;

  const allTabs = useMemo(() => {
    return [
      {
        key: 'args',
        label: 'Args',
        indicator: activeArgsLength > 0 ? <sup className="ml-[.125rem] font-medium">{activeArgsLength}</sup> : null
      },
      {
        key: 'env',
        label: 'Env',
        indicator: activeEnvLength > 0 ? <sup className="ml-[.125rem] font-medium">{activeEnvLength}</sup> : null
      },
      {
        key: 'docs',
        label: 'Docs',
        indicator: docs && docs.length > 0 ? <StatusDot type="default" /> : null
      }
    ];
  }, [activeEnvLength, activeArgsLength, docs]);

  const tabPanel = useMemo(() => {
    switch (requestPaneTab) {
      case 'args': {
        return <ScriptArgs item={item} collection={collection} />;
      }
      case 'env': {
        return <ScriptEnv item={item} collection={collection} addHeaderText="Set Env" />;
      }
      case 'docs': {
        return <Documentation item={item} collection={collection} />;
      }
      default: {
        return <ScriptArgs item={item} collection={collection} />;
      }
    }
  }, [requestPaneTab, item, collection, handleRun, docs]);

  if (!activeTabUid || !focusedTab?.uid || !requestPaneTab) {
    return <div className="pb-4 px-4">An error occurred!</div>;
  }

  let rightContent = null;

  return (
    <StyledWrapper className="flex flex-col h-full relative">
      <ResponsiveTabs
        tabs={allTabs}
        activeTab={requestPaneTab}
        onTabSelect={selectTab}
        rightContent={rightContent}
        rightContentRef={rightContent ? rightContentRef : null}
      />

      <section className="flex w-full flex-1 h-full mt-4">
        <HeightBoundContainer>{tabPanel}</HeightBoundContainer>
      </section>
    </StyledWrapper>
  );
};

export default ScriptRequestPane;
