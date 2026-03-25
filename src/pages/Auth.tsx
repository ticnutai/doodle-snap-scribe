import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success("ברוך הבא!");
      } else {
        const { error, data } = await signUp(email, password);
        if (error) throw error;
        if (data?.session) {
          toast.success("נרשמת בהצלחה! ברוך הבא!");
        } else {
          toast.success("נרשמת בהצלחה! בדוק את המייל לאישור.");
        }
      }
    } catch (err: any) {
      toast.error(err.message || "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gold-gradient gold-shadow mb-4">
            <Camera className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-bold text-foreground">
            Screen<span className="text-accent">Craft</span>
          </h1>
          <p className="text-muted-foreground mt-2">מערכת צילום מסך מתקדמת</p>
        </div>

        {/* Form Card */}
        <div className="border-2 border-accent rounded-2xl p-6 bg-background gold-shadow">
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isLogin
                  ? "gold-gradient text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              התחברות
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                !isLogin
                  ? "gold-gradient text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              הרשמה
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="כתובת מייל"
                required
                className="pr-10 border-accent/30 text-right"
                dir="ltr"
              />
            </div>

            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="סיסמה"
                required
                minLength={6}
                className="pr-10 pl-10 border-accent/30 text-right"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full gold-gradient text-primary-foreground border-0 h-11 font-semibold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isLogin ? (
                "התחבר"
              ) : (
                "הירשם"
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
