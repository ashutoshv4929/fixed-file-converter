import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/_/file-converter');
  return null;
}
