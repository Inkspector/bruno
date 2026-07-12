import React, { useState } from 'react';
import classnames from 'classnames';
import QueryResponse from 'components/ResponsePane/QueryResponse';
import RunnerTimeline from 'components/ResponsePane/RunnerTimeline';
import ResponseTime from 'components/ResponsePane/ResponseTime';
import ResponseSize from 'components/ResponsePane/ResponseSize';
import ScriptArgs from 'components/ResponsePane/ScriptResponsePane/ScriptArgs';
import ScriptEnv from 'components/ResponsePane/ScriptResponsePane/ScriptEnv';
import ScriptStatus from 'components/ResponsePane/ScriptResponsePane/ScriptStatus';
import StyledWrapper from '../ResponsePane/StyledWrapper';

const ScriptResponsePane = ({ item, collection }) => {
  const [selectedTab, setSelectedTab] = useState('response');
  const { requestSent = {}, responseReceived = {} } = item;
  const args = requestSent.data || [];
  const env = requestSent.headers || {};
  const isError = Boolean(responseReceived.isError || item.error || responseReceived.status !== 200);
  const tabClassName = (tab) => classnames(`tab select-none ${tab}`, { active: tab === selectedTab });

  const content = (() => {
    if (selectedTab === 'args') return <ScriptArgs args={args} item={item} />;
    if (selectedTab === 'env') return <ScriptEnv env={env} item={item} />;
    if (selectedTab === 'timeline') {
      return <RunnerTimeline request={requestSent} response={responseReceived} item={item} collection={collection} />;
    }
    return (
      <QueryResponse
        item={{ ...item, response: responseReceived }}
        collection={collection}
        data={responseReceived.data}
        dataBuffer={responseReceived.dataBuffer}
        headers={responseReceived.headers}
        error={item.error}
        disableRunEventListener={true}
        rawOnly={true}
      />
    );
  })();

  return (
    <StyledWrapper className="flex flex-col h-full relative overflow-auto">
      <div className="flex items-center tabs overflow-visible" role="tablist">
        {['response', 'args', 'env', 'timeline'].map((tab) => (
          <div key={tab} className={tabClassName(tab)} role="tab" onClick={() => setSelectedTab(tab)}>
            {tab === 'response' ? 'Response' : tab === 'args' ? 'Args' : tab === 'env' ? 'Env' : 'Timeline'}
          </div>
        ))}
        <div className="flex flex-grow justify-end items-center">
          <ScriptStatus isError={isError} />
          <ResponseTime duration={responseReceived.duration} />
          <ResponseSize size={responseReceived.size || 0} />
        </div>
      </div>
      <section className="flex flex-col pt-3 flex-grow overflow-auto">
        <div className="flex-1">{content}</div>
      </section>
    </StyledWrapper>
  );
};

export default ScriptResponsePane;
