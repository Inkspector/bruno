import StyledWrapper from '../../StatusCode/StyledWrapper';

const ScriptStatus = ({ isError, isRunning }) => (
  <StyledWrapper
    className={`response-status-code ${isError ? 'text-error' : 'text-ok'}`}
    data-testid="script-response-status"
  >
    {isRunning ? 'RUNNING' : isError ? 'Error' : 'OK'}
  </StyledWrapper>
);

export default ScriptStatus;
