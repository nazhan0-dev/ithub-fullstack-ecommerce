import { Suspense, useState } from "react";
import { Link, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Loader2 } from "lucide-react";
import logo from "../assets/logo.png";

// ข้อความบนแผงสีม่วง เปลี่ยนตามหน้า
const PANEL = {
  login: {
    title: "ยินดีต้อนรับกลับมา",
    desc: "เข้าสู่ระบบเพื่อดูตะกร้าและติดตามคำสั่งซื้อของคุณ",
  },
  register: {
    title: "ช้อปอุปกรณ์ไอทีที่ใช่ ในราคาที่ชอบ",
    desc: "สมัครสมาชิกฟรี เพื่อสั่งซื้อและติดตามคำสั่งซื้อได้ทุกเมื่อ",
  },
};

const spring = { type: "spring", stiffness: 260, damping: 30 };

// เก็บหน้าเดิมไว้ระหว่างเล่นแอนิเมชันตอนออก (ไม่ให้เปลี่ยนเป็นหน้าใหม่กลางทาง)
const FrozenOutlet = () => {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen;
};

// กรอบร่วมของหน้า Login / Register
// สลับหน้าแล้ว: แผงสีม่วงเลื่อนไปอีกฝั่ง + ฟอร์มเลื่อนเข้า/ออก
const AuthLayout = () => {
  const { pathname } = useLocation();
  const mode = pathname.startsWith("/register") ? "register" : "login";
  const isRegister = mode === "register";

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-8">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 ${
            isRegister ? "md:flex-row-reverse" : "md:flex-row"
          }`}
        >
          {/* แผงสีม่วง (เฉพาะจอใหญ่) */}
          <motion.div
            layout
            transition={spring}
            className="relative hidden min-h-[480px] flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground md:flex md:w-1/2"
          >
            <motion.div
              animate={{ x: isRegister ? -40 : 0, y: isRegister ? 30 : 0 }}
              transition={spring}
              className="absolute -right-20 -top-20 size-72 rounded-full bg-white/10"
            />
            <motion.div
              animate={{ x: isRegister ? 60 : 0, y: isRegister ? -20 : 0 }}
              transition={spring}
              className="absolute -bottom-24 -left-16 size-64 rounded-full bg-white/10"
            />

            <motion.div layout="position" transition={spring} className="relative">
              <Link to="/" className="block w-fit rounded-2xl bg-white px-4 py-2 shadow-sm">
                <img src={logo} alt="IT Hub" className="h-10 w-auto" />
              </Link>
            </motion.div>

            <div className="relative min-h-28">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  <h2 className="text-3xl font-extrabold leading-tight">{PANEL[mode].title}</h2>
                  <p className="text-white/80">{PANEL[mode].desc}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ฟอร์ม */}
          <motion.div layout transition={spring} className="w-full overflow-hidden p-8 sm:p-10 md:w-1/2">
            <AnimatePresence mode="wait" initial={false} custom={isRegister ? 1 : -1}>
              <motion.div
                key={mode}
                custom={isRegister ? 1 : -1}
                variants={{
                  enter: (dir) => ({ opacity: 0, x: 40 * dir }),
                  center: { opacity: 1, x: 0 },
                  exit: (dir) => ({ opacity: 0, x: -40 * dir }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <Suspense
                  fallback={
                    <div className="flex min-h-80 items-center justify-center text-muted-foreground">
                      <Loader2 className="animate-spin" />
                    </div>
                  }
                >
                  <FrozenOutlet />
                </Suspense>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </MotionConfig>
  );
};

export default AuthLayout;
