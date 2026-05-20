"use client";

import { useApp } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";

/* ─── Constants ──────────────────────────────────────────────────── */
const VEN_GREEN = "#288F3C";
const VEN_GREEN_DARK = "#1C6B2B";
const VEN_RED = "#C8102E";
const VEN_RED_DARK = "#9B0B22";

/* ─── Framer Motion Variants ─────────────────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 36, scale: 0.96 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const shakeVariants = {
  shake: {
    x: [0, -6, 6, -5, 5, -3, 3, 0],
    transition: { duration: 0.45, ease: "easeInOut" },
  },
  rest: { x: 0 },
};

const errorVariants = {
  hidden: { opacity: 0, height: 0, marginBottom: 0 },
  visible: {
    opacity: 1, height: "auto", marginBottom: "1rem",
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0, height: 0, marginBottom: 0,
    transition: { duration: 0.2 },
  },
};

const eyeVariants = {
  visible: { opacity: 1, scale: 1, transition: { duration: 0.15 } },
  hidden: { opacity: 0, scale: 0.6, transition: { duration: 0.1 } },
};

/* ─── Snake / Worm Background ────────────────────────────────────── */
const ORBIT_IMAGES = [
  "/fondologin1.jpg",
  "/fondologin2.jpg",
  "/fondologin3.jpg",
  "/fondologin4.jpg",
  "/fondologin5.jpg",
];

const TILE_COUNT = 26;    // total tiles in the snake
const TILE_SIZE = 62;    // px
const TILE_GAP = 4;     // px, spacing between tiles
const RX = 330;   // ellipse horizontal radius (px)
const RY = 265;   // ellipse vertical radius  (px)
const RPM = 0.55;  // revolutions per minute (speed)

// CSS filter to render any image as green monochrome
const GREEN_FILTER =
  "grayscale(1) sepia(1) hue-rotate(90deg) saturate(5) brightness(0.72)";

function SnakeBackground() {
  const containerRef = useRef(null);
  const angleRef = useRef(0);
  const rafRef = useRef(null);
  const lastTimeRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const tiles = container.querySelectorAll(".snake-tile");
    const degsPerSecond = RPM * 6; // 1 rpm = 6 deg/s

    function frame(now) {
      if (lastTimeRef.current == null) lastTimeRef.current = now;
      const delta = (now - lastTimeRef.current) / 1000; // seconds
      lastTimeRef.current = now;

      angleRef.current = (angleRef.current + degsPerSecond * delta) % 360;

      tiles.forEach((tile, i) => {
        // Each tile is offset by an angular "gap" so they form a snake
        const tileOffset = (TILE_SIZE + TILE_GAP);
        // Arc length between tiles → convert to degrees
        // Approx perimeter of ellipse using Ramanujan's formula
        const perim = Math.PI * (3 * (RX + RY) - Math.sqrt((3 * RX + RY) * (RX + 3 * RY)));
        const degsPerTile = (tileOffset / perim) * 360;

        const angle = (angleRef.current + degsPerTile * i) * (Math.PI / 180);
        const x = RX * Math.cos(angle);
        const y = RY * Math.sin(angle);

        tile.style.transform = `translate(${x - TILE_SIZE / 2}px, ${y - TILE_SIZE / 2}px)`;
      });

      rafRef.current = requestAnimationFrame(frame);
    }

    rafRef.current = requestAnimationFrame(frame);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {/* Orbit container — centered, zero-size, tiles positioned absolutely */}
      <div ref={containerRef} style={{ position: "relative", width: 0, height: 0 }}>
        {Array.from({ length: TILE_COUNT }).map((_, i) => (
          <div
            key={i}
            className="snake-tile"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: TILE_SIZE,
              height: TILE_SIZE,
              borderRadius: "10px",
              overflow: "hidden",
              boxShadow: `0 2px 10px rgba(40,143,60,0.35)`,
              border: "1.5px solid rgba(40,143,60,0.5)",
              willChange: "transform",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ORBIT_IMAGES[i % ORBIT_IMAGES.length]}
              alt=""
              draggable={false}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                filter: GREEN_FILTER,
                display: "block",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Shimmer Bar ─────────────────────────────────────────────────── */
function ShimmerBar() {
  return (
    <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden rounded-t-[20px]">
      <div
        className="h-full w-full"
        style={{
          background: `linear-gradient(90deg, ${VEN_RED} 0%, ${VEN_GREEN} 50%, ${VEN_RED} 100%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)",
          animation: "shimmer 2.5s linear infinite",
        }}
      />
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────────────── */
export default function Home() {
  const { user, login } = useApp();
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [shaking, setShaking] = useState(false);
  const emailRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ mode: "onTouched" });

  const emailValue = watch("email", "");
  const passwordValue = watch("password", "");

  /* Redirect if user is already logged in */
  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  /* Auto-focus first field */
  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  const onSubmit = async ({ email, password, remember }) => {
    setLoading(true);
    setServerError("");

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      if (remember) localStorage.setItem("ven911_remember", "true");
      router.push("/dashboard");
    } else {
      setServerError(res.error || "Credenciales incorrectas. Intenta de nuevo.");
      triggerShake();
    }
  };

  /* Field ring colour: red on error, green on filled & valid */
  const ringColor = (fieldName, value) => {
    if (errors[fieldName])
      return "focus:ring-[#C8102E] focus:border-[#C8102E] border-red-300";
    if (value)
      return "focus:ring-[#288F3C] focus:border-[#288F3C]";
    return "focus:ring-[#C8102E] focus:border-[#C8102E]";
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* ── Background: dark navy gradient ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #0D1B2A 0%, #0E2318 35%, #1A2E45 65%, #0D1B2A 100%)",
        }}
      />

      {/* ── Snake / Worm Photo Orbit ── */}
      <SnakeBackground />

      {/* ── Subtle vignette so the card stands out ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* ── Login Card ── */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-md mx-4"
      >
        <motion.form
          animate={shaking ? "shake" : "rest"}
          variants={shakeVariants}
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          style={{
            background: "rgba(255,255,255,0.94)",
            borderRadius: "20px",
            boxShadow:
              "0 8px 40px rgba(0,0,0,0.45), 0 2px 12px rgba(40,143,60,0.18)",
            backdropFilter: "blur(14px)",
          }}
          className="relative px-8 py-10 overflow-hidden"
        >
          {/* Shimmer bar */}
          <ShimmerBar />

          {/* ── Header ── */}
          <div className="text-center mb-8 select-none">
            <motion.div
              className="inline-block cursor-pointer"
              whileHover={{ scale: 1.06, rotate: 1 }}
              transition={{ type: "spring", stiffness: 280, damping: 16 }}
            >
              <Image
                src="/logo.png"
                alt="Logo VEN 911"
                width={60}
                height={60}
                className="mx-auto mb-4"
                priority
              />
            </motion.div>

            <div className="flex items-center justify-center gap-2 mb-1">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <ShieldCheck
                  className="w-5 h-5"
                  style={{ color: VEN_RED }}
                  aria-hidden="true"
                />
              </motion.div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Portal VEN 911
              </h1>
            </div>

            <p className="text-sm text-gray-500 mt-0.5">
              Centro de Comando, Control y Telecomunicaciones
            </p>

            {/* Divider */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-red-300" />
              <div
                className="h-2 w-2 rounded-full opacity-70"
                style={{ background: VEN_GREEN }}
              />
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-red-300" />
            </div>
          </div>

          {/* ── Server Error Banner ── */}
          <AnimatePresence mode="wait">
            {serverError && (
              <motion.div
                key="server-error"
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm overflow-hidden"
                style={{
                  background: "rgba(200,16,46,0.08)",
                  border: "1px solid rgba(200,16,46,0.25)",
                  color: VEN_RED_DARK,
                }}
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{serverError}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Fields ── */}
          <div className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Correo Electrónico
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                inputMode="email"
                placeholder={emailValue ? "" : "usuario@ven911.gob.ve"}
                className={[
                  "w-full px-4 py-2.5 text-sm border rounded-xl outline-none",
                  "transition-all duration-200 bg-white text-gray-900",
                  "placeholder-gray-400 focus:ring-2",
                  ringColor("email", emailValue),
                  errors.email ? "border-red-300" : "border-gray-200",
                ].join(" ")}
                {...register("email", {
                  required: "El correo es obligatorio",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Ingresa un correo válido",
                  },
                })}
                ref={(el) => {
                  register("email").ref(el);
                  emailRef.current = el;
                }}
              />
              <AnimatePresence>
                {errors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1.5 text-xs font-medium"
                    style={{ color: VEN_RED }}
                    role="alert"
                  >
                    {errors.email.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder={passwordValue ? "" : "••••••••"}
                  className={[
                    "w-full px-4 py-2.5 pr-11 text-sm border rounded-xl outline-none",
                    "transition-all duration-200 bg-white text-gray-900",
                    "placeholder-gray-400 focus:ring-2",
                    ringColor("password", passwordValue),
                    errors.password ? "border-red-300" : "border-gray-200",
                  ].join(" ")}
                  {...register("password", {
                    required: "La contraseña es obligatoria",
                    minLength: { value: 6, message: "Mínimo 6 caracteres" },
                  })}
                />

                {/* Eye toggle */}
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-150 focus:outline-none"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {showPassword ? (
                      <motion.span
                        key="eye-off"
                        variants={eyeVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="block"
                      >
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="eye-on"
                        variants={eyeVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        className="block"
                      >
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </div>
              <AnimatePresence>
                {errors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="mt-1.5 text-xs font-medium"
                    style={{ color: VEN_RED }}
                    role="alert"
                  >
                    {errors.password.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Remember me + Forgot password ── */}
          <div className="mt-5 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none group">
              <input
                id="login-remember"
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                style={{ accentColor: VEN_GREEN }}
                {...register("remember")}
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors duration-150">
                Recordarme
              </span>
            </label>

            <button
              type="button"
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: VEN_GREEN_DARK }}
              onMouseEnter={(e) => (e.currentTarget.style.color = VEN_GREEN)}
              onMouseLeave={(e) => (e.currentTarget.style.color = VEN_GREEN_DARK)}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          {/* ── Submit Button ── */}
          <div className="mt-7 relative group">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.015 } : {}}
              whileTap={!loading ? { scale: 0.985 } : {}}
              title="Accede a tu portal"
              className="relative w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold text-white overflow-hidden transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? `linear-gradient(90deg, ${VEN_RED_DARK}, ${VEN_RED})`
                  : `linear-gradient(90deg, ${VEN_RED} 0%, ${VEN_GREEN_DARK} 50%, ${VEN_GREEN} 100%)`,
                boxShadow: `0 4px 20px rgba(200,16,46,0.35)`,
                // eslint-disable-next-line no-unused-vars
                "--tw-ring-color": VEN_RED,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 6px 28px rgba(40,143,60,0.45)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(200,16,46,0.35)";
              }}
              aria-label="Ingresar al portal"
            >
              {/* Shimmer overlay on hover */}
              <span
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                }}
                aria-hidden="true"
              />

              <AnimatePresence mode="wait" initial={false}>
                {loading ? (
                  <motion.span
                    key="spinner"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    Autenticando…
                  </motion.span>
                ) : (
                  <motion.span
                    key="label"
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                  >
                    Ingresar al Portal
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Tooltip */}
            <span
              className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: "rgba(13,27,42,0.88)" }}
              role="tooltip"
            >
              Accede a tu portal
            </span>
          </div>

          {/* ── Footer ── */}
          <p className="mt-8 text-center text-xs text-gray-400 select-none">
            © {new Date().getFullYear()} VEN 911 Lara
          </p>
        </motion.form>
      </motion.div>
    </div>
  );
}
