import React from 'react'
import SocialBtn from './SocialBtn'
import Link from 'next/link'
import { signInWithPopup } from 'firebase/auth'
import { firebaseAuth, googleProvider } from '@/lib/firebaseClient'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'

const OAuthBtn = ({path, text, account}: {path: string, text:string, account: string}) => {
  const { login } = useAuth();
  const router = useRouter();

  const handleGoogle = async () => {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const idToken = await result.user.getIdToken();

    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Google login failed');
    }

    login(data.token, data.user);
    router.push('/dashboard');
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className="flex gap-3 items-center justify-center">
          <h5>{account}</h5>
          <Link href={path}>
            <span className="text-base font-semibold text-[var(--secondry-text)] cursor-pointer">{text}</span>
          </Link>
        </div>

        <div className="flex w-[50vw] max-sm:w-full items-center mt-4">
          <div className="w-full border-t-2 border-zinc-600"></div>
          <span className="text-base whitespace-nowrap px-4 text-[#B9B9B9]">Or continue with</span>
          <div className="w-full border-t-2 border-zinc-600"></div>
        </div>

        <div className="flex w-[50vw] max-sm:w-full justify-center gap-4">
            <SocialBtn src="/images/google.svg" alt="google" name="Google" onClick={handleGoogle}/>
          </div>
    </div>
  )
}

export default OAuthBtn
