import BodyBlock from '../Common/Body/index';

const ScriptResponse = ({ collection, response, item }) => {
  const data = response?.data ?? '';
  const dataBuffer = response?.dataBuffer || Buffer.from(data).toString('base64');

  return (
    <BodyBlock
      collection={collection}
      data={data}
      dataBuffer={dataBuffer}
      headers={{ 'content-type': 'text/plain; charset=utf-8' }}
      error={response?.error}
      item={item}
      type="script-response"
      label="Output"
      rawOnly={true}
    />
  );
};

export default ScriptResponse;
