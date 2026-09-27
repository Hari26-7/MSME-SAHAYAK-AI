import { authService } from './services'

export const supabase = {
  auth: {
    signUp: async ({ email, password }: { email: string; password: string }) => {
      try {
        const res = await authService.register(email, password)
        return { data: { user: res.user }, error: null }
      } catch (err: any) {
        return { data: { user: null }, error: err }
      }
    }
  }
}
