import Link from 'next/link';

export default function Home() {
  return (
    <main>
      <ul>
        <li>
          <Link href={'/test-route-handlers'}>Test Route Handlers</Link>
        </li>
      </ul>
    </main>
  );
}
