import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect visitors to the main marketplace page
  redirect('/prompts');
}
