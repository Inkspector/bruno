import Headers from '../Common/Headers/index';

const ScriptRequest = ({ request }) => {
  const args = Array.isArray(request?.data)
    ? request.data.map((value, index) => ({ name: String(index + 1), value }))
    : [];

  return (
    <>
      <Headers headers={args} title="Args" emptyLabel="No Args" />
      <Headers headers={request?.headers} title="Env" emptyLabel="No Env" />
    </>
  );
};

export default ScriptRequest;
