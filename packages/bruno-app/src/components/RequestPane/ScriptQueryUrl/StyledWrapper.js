import styled from 'styled-components';

const Wrapper = styled.div`
  height: 2.1rem;

  border-radius: ${(props) => props.theme.border.radius.base};
  display: flex;
  align-items: stretch;
  overflow: hidden;

  .browse-button-container {
    display: flex;
    align-items: center;
    background-color: ${(props) => props.theme.requestTabPanel.url.bg};
    border-top-left-radius: ${(props) => props.theme.border.radius.base};
    border-bottom-left-radius: ${(props) => props.theme.border.radius.base};
    border: ${(props) => props.theme.requestTabPanel.url.border};
    border-right: none;
    padding: 0 10px;
  }

  .browse-button {
    background: transparent;
    border: none;
    color: ${(props) => props.theme.request.script || props.theme.colors.text.purple};
    cursor: pointer;
    font-weight: 500;
    padding: 0;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .browse-button:hover {
    text-decoration: underline;
  }

  .input-container {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    background-color: ${(props) => props.theme.requestTabPanel.url.bg};
    border-top-right-radius: ${(props) => props.theme.border.radius.base};
    border-bottom-right-radius: ${(props) => props.theme.border.radius.base};
    overflow: hidden;
    border: ${(props) => props.theme.requestTabPanel.url.border};
    border-left: none;
  }

  .input-container .cm-editor {
    width: 100%;
  }

  .browse-button + .input-container {
    border-left: 1px solid ${(props) => props.theme.requestTabPanel.url.border};
  }
`;

export default Wrapper;
