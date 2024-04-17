'use client';

import { useFetchData } from '@/utils/fetchData';

const displayData = (data: any) => (data ? JSON.stringify(data, null, 2) : 'No data');

export default function Home() {
  const { data: dataSuccess, fetchData: testSuccess } = useFetchData('/api/test-success');
  const { error: testErrorError, fetchData: testError } = useFetchData('/api/test-error');
  const { data: dataParamSuccess, fetchData: testParamSuccess } = useFetchData(
    '/api/test-param-success/1337',
  );
  const { data: dataParamError, fetchData: testParamError } = useFetchData(
    'api/test-param-error/1337',
  );
  const { data: dataSuccessManual, fetchData: testSuccessManual } = useFetchData(
    '/api/test-success-manual',
  );
  const { data: dataErrorManual, fetchData: testErrorManual } =
    useFetchData('/api/test-error-manual');
  const { data: dataLocalVariablesUncaught, fetchData: testLocalVariablesUncaught } = useFetchData(
    '/api/test-local-variables-uncaught',
  );
  const { data: dataLocalVariablesCaught, fetchData: testLocalVariablesCaught } = useFetchData(
    '/api/test-local-variables-caught',
  );

  return (
    <main>
      <div>
        <h1>Layout (/)</h1>
        <button onClick={() => testSuccess()}>Test Success</button>
        <p>{displayData(dataSuccess)}</p>

        <button onClick={() => testError()}>Test Error</button>
        <p>{displayData(testErrorError)}</p>

        <button onClick={() => testParamSuccess()}>Test Param Success</button>
        <p>{displayData(dataParamSuccess)}</p>

        <button onClick={() => testParamError()}>Test Param Error</button>
        <p>{displayData(dataParamError)}</p>

        <button onClick={() => testSuccessManual()}>Test Success Manual</button>
        <p>{displayData(dataSuccessManual)}</p>

        <button onClick={() => testErrorManual()}>Test Error Manual</button>
        <p>{displayData(dataErrorManual)}</p>

        <button onClick={() => testLocalVariablesUncaught()}>Test Local Variables Uncaught</button>
        <p>{displayData(dataLocalVariablesUncaught)}</p>

        <button onClick={() => testLocalVariablesCaught()}>Test Local Variables Caught</button>
        <p>{displayData(dataLocalVariablesCaught)}</p>
      </div>
    </main>
  );
}
