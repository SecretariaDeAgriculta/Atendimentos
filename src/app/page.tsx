'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { AttendanceSheet } from '@/app/atendimento/components/attendance-sheet';
import { Loader2, Github, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.replace('/login');
        return;
      }
      
      const currentUser = session.user;
      setUser(currentUser);
      
      if (currentUser?.user_metadata?.requires_password_change) {
          router.replace('/reset-password');
      } else {
          setLoading(false);
      }
    };

    getSession();
    
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
            router.replace('/login');
        } else {
            const currentUser = session.user;
            setUser(currentUser);
            if (currentUser?.user_metadata?.requires_password_change) {
                router.replace('/reset-password');
            } else {
                setLoading(false);
            }
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="flex flex-col min-h-screen print:min-h-0">
      <div className="absolute top-4 right-4 print-hidden">
        <Button onClick={handleLogout} variant="outline">Sair</Button>
      </div>
      <div className="flex-grow">
        <AttendanceSheet user={user} />
      </div>
      <footer className="py-4 text-center text-sm text-muted-foreground print-hidden">
        Desenvolvido com{' '}
        <a
          href="https://firebase.google.com/studio"
          target="_blank"
          rel="noopener noreferrer"
          title="Firebase Studio"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Flame className="h-4 w-4 text-[hsl(var(--chart-1))]" />
        </a>
        {' '}por{' '}
        <a
          href="https://joaogustavovieiraboaventura.github.io/curriculo/"
          target="_blank"
          rel="noopener noreferrer"
          title="Currículo de João Gustavo no GitHub"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Github className="h-4 w-4" />
        </a>
      </footer>
    </main>
  );
}
