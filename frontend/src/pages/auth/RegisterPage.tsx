import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, Check, Car } from "lucide-react";
import { authService } from "../../api/services/authService";
import { getApiErrorMessage } from "../../utils/apiError";
interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirm: string;
}

interface FormErrors {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  password_confirm?: string;
}

function getStrength(password: string) {
  const rules = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*]/.test(password),
  ];
  const score = rules.filter(Boolean).length;
  const levels = [
    { label: "Faible",  color: "bg-red-500",    text: "text-red-500"    },
    { label: "Moyen",   color: "bg-orange-500",  text: "text-orange-500" },
    { label: "Bien",    color: "bg-yellow-500",  text: "text-yellow-500" },
    { label: "Fort",    color: "bg-green-500",   text: "text-green-500"  },
  ];
  return { score, rules, ...(levels[score - 1] ?? levels[0]) };
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    password_confirm: "",
  });

  const [errors, setErrors]       = useState<FormErrors>({});
  const [globalError, setGlobalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);

  const strength = getStrength(form.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setGlobalError("");
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.last_name.trim())  newErrors.last_name  = "Le nom est requis.";
    if (!form.first_name.trim()) newErrors.first_name = "Le prénom est requis.";

    if (!form.email.trim()) {
      newErrors.email = "L'email est requis.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Email invalide.";
    }

    if (!form.password) {
      newErrors.password = "Le mot de passe est requis.";
    } else if (strength.score < 4) {
      newErrors.password = "Le mot de passe ne respecte pas toutes les règles.";
    }

    if (!form.password_confirm) {
      newErrors.password_confirm = "Veuillez confirmer votre mot de passe.";
    } else if (form.password !== form.password_confirm) {
      newErrors.password_confirm = "Les mots de passe ne correspondent pas.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  if (!validate()) return;

  setIsLoading(true);
  setGlobalError("");
  setErrors({});

  try {
    await authService.register({
      first_name:       form.first_name,
      last_name:        form.last_name,
      email:            form.email,
      password:         form.password,
      password_confirm: form.password_confirm,
    });

    navigate("/login", {
      state: { registered: true, email: form.email },
    });

  
  } catch (err: unknown) {
    console.error("Échec de l'inscription.");

    const axiosError = err as {
      response?: {
        status?: number;
        data?: Record<string, unknown>;
      };
    };

    const status = axiosError.response?.status;
    const data = axiosError.response?.data;

    if (status !== undefined && status >= 500) {
      setGlobalError(
        "Une erreur inattendue s'est produite. Veuillez réessayer dans quelques instants."
      );
      return;
    }

    if (data) {
      const fieldMap: Record<string, keyof FormErrors> = {
        email: "email",
        password: "password",
        password_confirm: "password_confirm",
        first_name: "first_name",
        last_name: "last_name",
      };

      const newErrors: FormErrors = {};
      let globalMsg = "";

      for (const [key, value] of Object.entries(data)) {
        const messages = Array.isArray(value)
          ? value.map(String)
          : typeof value === "string"
            ? [value]
            : [];

        if (messages.length === 0) {
          continue;
        }

        if (
          key === "non_field_errors" ||
          key === "detail" ||
          key === "error"
        ) {
          globalMsg = messages.join(" ");
        } else if (key in fieldMap) {
          newErrors[fieldMap[key]] = messages.join(" ");
        } else {
          globalMsg ||= messages.join(" ");
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
      }

      if (globalMsg) {
        setGlobalError(globalMsg);
      }

      if (
        Object.keys(newErrors).length > 0 ||
        globalMsg
      ) {
        return;
      }
    }

    setGlobalError(
      getApiErrorMessage(
        err,
        "Impossible de créer votre compte. Veuillez réessayer."
      )
    );
  } finally {
    setIsLoading(false);
  }

};



  const ruleList = [
    { ok: form.password.length >= 8,        label: "Au moins 8 caractères"            },
    { ok: /[A-Z]/.test(form.password),      label: "Une majuscule"                    },
    { ok: /[0-9]/.test(form.password),      label: "Un chiffre"                       },
    { ok: /[!@#$%^&*]/.test(form.password), label: "Un caractère spécial (!@#$%^&*)" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-red-700 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Car size={18} color="white" strokeWidth={2.2} />
            </div>
            <div className="text-left leading-tight">
              <strong className="text-lg font-bold text-gray-900 tracking-tight">K-JOU</strong>
              <span className="block text-[10px] text-gray-400 font-medium tracking-widest uppercase">Rent a Car</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Créer un compte</h1>
          <p className="text-sm text-gray-500 mt-1">Rejoignez K-JOU RENT A CAR</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8">

          {globalError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-6">
              <AlertCircle size={16} className="shrink-0" />
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Nom / Prénom */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Nom <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="DESMARAIS"
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg outline-none transition focus:ring-2 focus:ring-red-100 focus:border-red-600 ${errors.last_name ? "border-red-400" : "border-gray-200"}`}
                  />
                </div>
                {errors.last_name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.last_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                  Prénom <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Jean"
                    className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg outline-none transition focus:ring-2 focus:ring-red-100 focus:border-red-600 ${errors.first_name ? "border-red-400" : "border-gray-200"}`}
                  />
                </div>
                {errors.first_name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.first_name}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Adresse électronique <span className="text-red-600"></span>
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="exemple@email.com"
                  className={`w-full pl-9 pr-3 py-2 text-sm border rounded-lg outline-none transition focus:ring-2 focus:ring-red-100 focus:border-red-600 ${errors.email ? "border-red-400" : "border-gray-200"}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.email}</p>}
            </div>

            {/* Mot de passe */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Mot de passe <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2 text-sm border rounded-lg outline-none transition focus:ring-2 focus:ring-red-100 focus:border-red-600 ${errors.password ? "border-red-400" : "border-gray-200"}`}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              {/* Barre de progression */}
              {form.password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= strength.score ? strength.color : "bg-gray-200"}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      {ruleList.map((r, i) => (
                        <div key={i} className={`flex items-center gap-1.5 text-xs transition-colors ${r.ok ? "text-green-600" : "text-gray-400"}`}>
                          <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${r.ok ? "bg-green-500" : "bg-gray-200"}`}>
                            {r.ok && <Check size={8} color="white" />}
                          </div>
                          {r.label}
                        </div>
                      ))}
                    </div>
                    <span className={`text-xs font-medium ${strength.text}`}>{strength.label}</span>
                  </div>
                </div>
              )}

              {errors.password && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.password}</p>}
            </div>

            {/* Confirmer mot de passe */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                Confirmer le mot de passe <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirm ? "text" : "password"}
                  name="password_confirm"
                  value={form.password_confirm}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-9 pr-10 py-2 text-sm border rounded-lg outline-none transition focus:ring-2 focus:ring-red-100 focus:border-red-600 ${errors.password_confirm ? "border-red-400" : "border-gray-200"}`}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password_confirm && form.password === form.password_confirm && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><Check size={11} /> Les mots de passe correspondent.</p>
              )}
              {errors.password_confirm && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={11} />{errors.password_confirm}</p>}
            </div>

            {/* Info réservation */}
            <div className="flex gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
              <AlertCircle size={15} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Les informations de permis et d'identité seront demandées lors de votre première réservation.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg text-sm transition-all hover:shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Création en cours…
                </>
              ) : (
                <>
                  <Check size={15} />
                  Créer mon compte
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-500 mt-6 pt-5 border-t border-gray-100">
            Déjà un compte ?{" "}
            <Link to="/login" className="text-red-700 font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 K-JOU Rent a Car — Route Nationale #1, Vaudreuil, Cap-Haïtien
        </p>
      </div>
    </div>
  );
}