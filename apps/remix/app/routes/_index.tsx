import type { MetaFunction } from '@remix-run/node';
import { Link } from '@remix-run/react';

export const meta: MetaFunction = () => {
  return [{ title: 'New Remix App' }, { name: 'description', content: 'Welcome to Remix!' }];
};

export default function Index() {
  return (
    <main>
      <ul>
        <li>
          <Link to={'/test-success'}>Test Success</Link>
          <Link to={'/test-error'}>Test Error</Link>
          <Link to={'/test-param-success/1337'}>Test Param Success</Link>
          <Link to={'/test-param-error/1337'}>Test Param Error</Link>
          <Link to={'/test-success-manual'}>Test Success Manual</Link>
          <Link to={'/test-error-manual'}>Test Error Manual</Link>
          <Link to={'/test-local-variables-uncaught'}>Test Local Variables Uncaught</Link>
          <Link to={'/test-local-variables-caught'}>Test Local Variables Caught</Link>
        </li>
      </ul>
    </main>
  );
}
