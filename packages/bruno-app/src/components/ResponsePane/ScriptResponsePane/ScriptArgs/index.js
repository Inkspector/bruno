import React, { useRef } from 'react';
import StyledWrapper from '../../ResponseHeaders/StyledWrapper';
import { usePersistedState } from 'hooks/usePersistedState';
import { useTrackScroll } from 'hooks/useTrackScroll';

const ScriptArgs = ({ args = [], item }) => {
  const wrapperRef = useRef(null);
  const [scroll, setScroll] = usePersistedState({ key: `script-response-args-scroll-${item?.uid}`, default: 0 });
  useTrackScroll({ ref: wrapperRef, selector: '.response-tab-content', onChange: setScroll, initialValue: scroll });

  return (
    <StyledWrapper className="w-full" ref={wrapperRef}>
      <div className="table-wrapper">
        <table>
          <thead><tr><td>Index</td><td>Value</td></tr></thead>
          <tbody>
            {args.map((value, index) => (
              <tr key={index}><td className="key">{index + 1}</td><td className="value">{String(value)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </StyledWrapper>
  );
};

export default ScriptArgs;
