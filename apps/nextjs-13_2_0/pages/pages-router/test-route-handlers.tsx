import type { GetServerSideProps, NextPage } from 'next';
import React from 'react';
import { useFetchData } from '@/utils/fetchData';

const displayData = (data: any) => (data ? JSON.stringify(data, null, 2) : 'No data');

/***************************************************************
 * IMPORTANT: when running the pages-router, you have to set `appDir: false` in next.config.js
 ****************************************************************/

const Page: NextPage<{ propFromServerSide: string }> = ({ propFromServerSide }) => {
  const { data: dataParamSuccess, fetchData: testParamSuccess } = useFetchData(
    '/api/pages-router/test-param-success/1337',
  );
  const { data: dataParamError, fetchData: testParamError } = useFetchData(
    '/api/pages-router/test-param-error/1337',
  );

  return (
    <>
      <p>{`Prop from 'getServerSideProps': ${propFromServerSide}`}</p>

      <button onClick={() => testParamSuccess()}>Test Param Success</button>
      <p>{displayData(dataParamSuccess)}</p>

      <button onClick={() => testParamError()}>Test Param Error</button>
      <p>{displayData(dataParamError)}</p>
    </>
  );
};

export default Page;

export const getServerSideProps = (async () => {
  return { props: { propFromServerSide: 'success' } };
}) satisfies GetServerSideProps<{ propFromServerSide: string }>;
