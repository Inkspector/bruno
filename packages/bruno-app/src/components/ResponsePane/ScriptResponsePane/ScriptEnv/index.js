import React, { useRef } from 'react';
import StyledWrapper from '../../ResponseHeaders/StyledWrapper';
import { usePersistedState } from 'hooks/usePersistedState';
import { useTrackScroll } from 'hooks/useTrackScroll';

const ScriptEnv = ({ env = {}, item }) => {
  const entries = typeof env === 'object' && env ? Object.entries(env) : [];
  const wrapperRef = useRef(null);
  const [scroll, setScroll] = usePersistedState({ key: `script-response-env-scroll-${item?.uid}`, default: 0 });
  useTrackScroll({ ref: wrapperRef, selector: '.response-tab-content', onChange: setScroll, initialValue: scroll });

  return (
    <StyledWrapper className="w-full" ref={wrapperRef}>
      <div className="table-wrapper">
        <table>
          <thead><tr><td>Name</td><td>Value</td></tr></thead>
          <tbody>
            {entries.map(([name, value]) => (
              <tr key={name}><td className="key">{name}</td><td className="value">{String(value)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </StyledWrapper>
  );
};

export default ScriptEnv;
