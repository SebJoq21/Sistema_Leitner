import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { loginSchema, type LoginFormValues } from '@/schemas';
import { useAuth } from './AuthContext';

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    try {
      if (mode === 'login') {
        await signIn(values.email, values.password);
        toast.success('Sesión iniciada');
      } else {
        await signUp(values.email, values.password);
        toast.success('Cuenta creada. Revisa tu email si Supabase lo exige.');
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error de autenticación');
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <CardTitle>{mode === 'login' ? 'Entrar a Leitner' : 'Crear cuenta'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <Input label="Email" type="email" placeholder="tu@email.com" error={errors.email?.message} {...register('email')} />
          <Input label="Contraseña" type="password" placeholder="••••••••" error={errors.password?.message} {...register('password')} />
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando…' : mode === 'login' ? 'Entrar' : 'Registrarme'}
          </Button>
          <button
            type="button"
            className="text-xs text-indigo-600 hover:underline"
            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
          >
            {mode === 'login' ? '¿Sin cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
