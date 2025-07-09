import dynamic from 'next/dynamic';

// Dynamically import the converter component with no SSR
const FileConverter = dynamic(
  () => import('./converter/new-page'),
  { ssr: false }
);

export default function Home() {
  return <FileConverter />;
}
