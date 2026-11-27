import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Settings, 
  ChevronRight, 
  MapPin, 
  Clock, 
  Smartphone, 
  CreditCard,
  ChefHat,
  LayoutDashboard,
  QrCode,
  Menu as MenuIcon,
  X,
  Store,
  Bike,
  HelpCircle,
  Download,
  LogOut,
  Calendar,
  Sparkles,
  Power,
  AlertCircle,
  Printer,
  Package,
  User,
  Check,
  ShieldCheck,
  Edit2,
  Copy,
  CheckCircle,
  XCircle,
  Clock3,
  Truck,
  Home as HomeIcon,
  RefreshCw,
  Filter,
  Search,
  DollarSign,
  TrendingUp,
  Eye,
  MessageCircle,
  ExternalLink,
  Bell,
  Wifi,
  WifiOff,
  Sliders,
  ClipboardList,
  Lock,
  Users
} from 'lucide-react';
import { cn, Product, Category, Neighborhood, CartItem, Order, OrderStatus, PaymentStatus, CustomerData, DashboardMetrics } from './types';
import { LandingPage } from './components/LandingPage';
import { PromoKitSection } from './components/PromoKitPage';
import { useSeoMeta } from './utils/seo';

// --- Components ---

const ReservationForm = ({ tables, onClose, apiFetch }: { tables: any[], onClose: () => void, apiFetch: any }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    table_id: '',
    reservation_time: '',
    guests: '2'
  });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await apiFetch('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          table_id: formData.table_id ? parseInt(formData.table_id) : null,
          guests: parseInt(formData.guests)
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setStatusMsg({ type: 'error', text: err.error || 'Erro ao solicitar reserva.' });
        return;
      }
      setStatusMsg({ type: 'success', text: 'Reserva solicitada com sucesso! Aguarde nossa confirmação.' });
      setTimeout(() => onClose(), 1400);
    } catch (error) {
      console.error(error);
      setStatusMsg({ type: 'error', text: 'Erro ao solicitar reserva. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white text-zinc-900 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
      >
        <div className="p-5 sm:p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-zinc-900">Reservar Mesa</h2>
          <button onClick={onClose} aria-label="Fechar" className="p-2 hover:bg-zinc-100 text-zinc-500 rounded-full"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {statusMsg && (
            <div className={cn(
              "p-3 rounded-xl text-sm font-medium border",
              statusMsg.type === 'success' ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"
            )}>
              {statusMsg.text}
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Seu Nome</label>
            <input required value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="Como podemos te chamar?" />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">WhatsApp / Telefone</label>
            <input required type="tel" value={formData.customer_phone} onChange={e => setFormData({...formData, customer_phone: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="(11) 99999-9999" />
          </div>
          {tables.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Mesa de Preferência (opcional)</label>
              <select value={formData.table_id} onChange={e => setFormData({...formData, table_id: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Qualquer mesa disponível</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>Mesa {t.number}</option>
                ))}
              </select>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Data e Hora</label>
              <input required type="datetime-local" value={formData.reservation_time} onChange={e => setFormData({...formData, reservation_time: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Pessoas</label>
              <input required type="number" min="1" value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50">
            {loading ? 'Solicitando...' : 'Solicitar Reserva'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const CustomerAuth = ({ establishmentId, onLogin, onClose }: { establishmentId: number, onLogin: (customer: any) => void, onClose: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    const endpoint = isLogin ? '/api/public/customer/login' : '/api/public/customer/register';
    try {
      const res = await window.fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, establishment_id: establishmentId })
      });
      const data = await res.json();
      if (res.ok) {
        onLogin(data);
        onClose();
      } else {
        setErrorMsg(data.error || 'Verifique os dados informados.');
      }
    } catch (e) {
      setErrorMsg('Erro de conexão ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white text-zinc-900 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-6 sm:p-8"
      >
        <button onClick={onClose} aria-label="Fechar" className="absolute top-4 right-4 p-2 hover:bg-zinc-100 text-zinc-500 rounded-full"><X className="w-6 h-6" /></button>
        <h2 className="text-2xl font-bold text-zinc-900 mb-2">{isLogin ? 'Entrar na sua conta' : 'Criar conta de cliente'}</h2>
        <p className="text-sm text-zinc-500 mb-6">Acompanhe seus pedidos com mais rapidez.</p>
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Nome</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="Seu nome" />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Telefone / WhatsApp</label>
            <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="5511999999999" />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Senha</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-bold hover:bg-zinc-800 transition-all">
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>
        <button type="button" onClick={() => { setIsLogin(!isLogin); setErrorMsg(null); }} className="w-full mt-4 text-sm text-zinc-600 hover:text-zinc-900 font-medium">
          {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre aqui'}
        </button>
      </motion.div>
    </div>
  );
};

const CustomerProfile = ({ customer, onClose }: { customer: any, onClose: () => void }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.fetch(`/api/public/customer/${customer.id}/orders`)
      .then(res => res.json())
      .then(data => {
        setOrders(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [customer.id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white text-zinc-900 w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-900">Minha Conta</h2>
          <button onClick={onClose} aria-label="Fechar" className="p-2 hover:bg-zinc-100 text-zinc-500 rounded-full"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
            <p className="text-xs text-zinc-500 font-semibold mb-1">Seus dados</p>
            <p className="font-bold text-zinc-900">{customer.name}</p>
            <p className="text-zinc-500 text-sm">{customer.phone}</p>
          </div>
          
          <div>
            <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Meus Pedidos
            </h3>
            {loading ? (
              <p className="text-zinc-500 text-sm">Carregando pedidos...</p>
            ) : orders.length === 0 ? (
              <p className="text-zinc-500 text-sm">Nenhum pedido encontrado.</p>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-2 text-xs text-zinc-500">
                      <span className="font-bold text-zinc-700 tabular-nums">Pedido #{order.id}</span>
                      <span className={cn(
                        "font-semibold",
                        order.status === 'pending' ? "text-orange-600" :
                        order.status === 'completed' ? "text-emerald-600" :
                        "text-zinc-600"
                      )}>
                        {order.status === 'pending' ? 'Pendente' : 
                         order.status === 'completed' ? 'Concluído' : 
                         order.status === 'cancelled' ? 'Cancelado' : order.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">{new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                    <div className="text-sm text-zinc-800 whitespace-pre-wrap line-clamp-2 mb-2">{order.items_text}</div>
                    <p className="font-bold text-orange-600 tabular-nums">R$ {(parseFloat(order.total) || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Status Colors Helper ---
const statusColors: Record<string, string> = {
  'pendente': 'bg-yellow-500',
  'aguardando_pagamento': 'bg-yellow-500',
  'confirmado': 'bg-blue-500',
  'em_preparo': 'bg-orange-500',
  'saiu_para_entrega': 'bg-purple-500',
  'entregue': 'bg-green-500',
  'cancelado': 'bg-red-500',
  // English versions for compatibility
  'pending': 'bg-yellow-500',
  'confirmed': 'bg-blue-500',
  'preparing': 'bg-orange-500',
  'delivering': 'bg-purple-500',
  'completed': 'bg-green-500',
  'cancelled': 'bg-red-500'
};

const statusLabels: Record<string, string> = {
  'pendente': 'Pendente',
  'aguardando_pagamento': 'Aguardando Pagamento',
  'confirmado': 'Confirmado',
  'em_preparo': 'Em Preparo',
  'saiu_para_entrega': 'Saiu para Entrega',
  'entregue': 'Entregue',
  'cancelado': 'Cancelado',
  // English versions for compatibility
  'pending': 'Pendente',
  'confirmed': 'Confirmado',
  'preparing': 'Em Preparo',
  'delivering': 'Saiu para Entrega',
  'completed': 'Entregue',
  'cancelled': 'Cancelado'
};

// --- OrderTracking Component ---
const Navbar = ({ settings, storeName, slug, customer, onAuthClick, onLogout, onProfileClick }: { settings: any, storeName?: string, slug?: string, customer?: any, onAuthClick?: () => void, onLogout?: () => void, onProfileClick?: () => void }) => {
  const isDark = settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand';
  const displayName = settings.store_name || storeName || 'MaisQueCardapio';

  return (
    <header className={cn(
      "sticky top-0 z-50 backdrop-blur-xl border-b transition-colors",
      settings.catalog_theme === 'dark' ? "bg-zinc-950/90 border-zinc-800" : 
      settings.catalog_theme === 'brand' ? "bg-brand-bg/90 border-zinc-800" : "bg-white/95 border-zinc-200"
    )}>
      <div className="max-w-5xl mx-auto px-3.5 sm:px-4 py-3 flex justify-between items-center gap-2 sm:gap-4">
        <Link to={slug ? `/e/${slug}` : "/"} className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {settings.store_logo ? (
            <img src={settings.store_logo} alt={displayName} referrerPolicy="no-referrer" className="h-9 w-9 object-cover rounded-xl shrink-0 border border-zinc-200/40" />
          ) : (
            <div className="bg-orange-500 p-2 rounded-xl shadow-sm shrink-0">
              <ChefHat className="text-white w-5 h-5" />
            </div>
          )}
          <span className={cn(
            "font-extrabold text-base sm:text-lg tracking-tight leading-none truncate",
            isDark ? "text-white" : "text-zinc-900"
          )}>
            {displayName}
          </span>
        </Link>
        <div className="flex gap-2 items-center shrink-0">
          {customer ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={onProfileClick}
                className={cn(
                  "flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-colors whitespace-nowrap shrink-0",
                  isDark
                    ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800"
                    : "bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200"
                )}
              >
                <User className="w-4 h-4" />
                <span className="text-xs font-semibold hidden sm:inline">{customer.name.split(' ')[0]}</span>
              </button>
              <button
                onClick={onLogout}
                title="Sair da conta"
                aria-label="Sair da conta"
                className={cn(
                  "p-2 rounded-xl border transition-colors",
                  isDark
                    ? "border-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                    : "border-zinc-200 text-zinc-500 hover:text-red-600 hover:bg-red-50"
                )}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : onAuthClick && (
            <button
              onClick={onAuthClick}
              className={cn(
                "text-xs font-semibold px-3 sm:px-4 py-2 rounded-xl border transition-colors whitespace-nowrap shrink-0",
                isDark
                  ? "bg-zinc-900 border-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-800"
                  : "bg-zinc-100 border-zinc-200 text-zinc-800 hover:bg-zinc-200"
              )}
            >
              Entrar
            </button>
          )}
          <Link
            to={slug ? `/e/${slug}/admin` : "/admin"}
            title="Painel da loja"
            aria-label="Painel da loja"
            className={cn(
              "p-2 rounded-xl border transition-colors shrink-0",
              isDark
                ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800"
                : "bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200"
            )}
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};

const FloatingCart = ({ count, total, onClick }: { count: number; total: number; onClick: () => void }) => (
  <AnimatePresence>
    {count > 0 && (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80"
      >
        <button
          onClick={onClick}
          className="w-full bg-orange-500 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between group hover:bg-orange-600 transition-all active:scale-95"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Ver Carrinho</span>
              <span className="text-sm font-black">{count} {count === 1 ? 'item' : 'itens'}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Total</span>
            <span className="text-lg font-black tracking-tighter">R$ {total.toFixed(2)}</span>
          </div>
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- Pages ---

const OnlineMenu = ({ slug }: { slug: string }) => {
  const navigate = useNavigate();
  const [establishment, setEstablishment] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [tables, setTables] = useState<{id: number, number: number}[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<number | null>(null);
  const [orderMode, setOrderMode] = useState<'delivery' | 'pickup'>('delivery');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'entrega' | 'infinitepay' | 'comanda'>('pix');
  const storeInfinitePayEnabled = settings.infinitepay_enabled === '1' && Boolean((settings.infinitepay_handle || '').trim());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const rawTableNumber = searchParams.get('mesa');
  const tableNumber = establishment?.enable_tables === 0 ? null : rawTableNumber;
  const [addedProductId, setAddedProductId] = useState<number | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const [tableSummary, setTableSummary] = useState<any>(null);
  const [isTableComandaOpen, setIsTableComandaOpen] = useState(false);
  const [requestingBill, setRequestingBill] = useState(false);
  const [billRequestFeedback, setBillRequestFeedback] = useState('');
  
  // Checkout form state
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    address: '',
    address_number: '',
    address_complement: '',
    address_reference: '',
    notes: ''
  });

  const storeSeoName = settings.store_name || establishment?.name || slug;
  const storeSeoImage =
    settings.cover_url || settings.banner_url || settings.logo_url || '/og-image.jpg';
  useSeoMeta({
    title: `${storeSeoName} – Cardápio Digital Online | MaisQueCardapio`,
    description: `Peça online no cardápio digital de ${storeSeoName}. Delivery rápido, retirada no balcão e pagamento via PIX ou InfinitePay sem taxas extras.`,
    canonicalPath: `/e/${slug}`,
    ogType: 'restaurant',
    image: storeSeoImage,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: storeSeoName,
      url: typeof window !== 'undefined' ? `${window.location.origin}/e/${slug}` : `/e/${slug}`,
      servesCuisine: 'Lanches, Delivery e Restaurante',
      hasMenu: typeof window !== 'undefined' ? `${window.location.origin}/e/${slug}` : `/e/${slug}`,
      acceptsReservations: establishment?.enable_reservations === 1 ? 'True' : 'False'
    }
  });

  const apiFetch = (url: string, options: any = {}) => {
    return fetch(`/api/e${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'x-establishment-slug': slug,
        'Content-Type': 'application/json'
      }
    });
  };

  const fetchTableSummary = async (mesa: string) => {
    try {
      const res = await fetch(`/api/public/tables/${encodeURIComponent(mesa)}/summary`, {
        headers: { 'x-establishment-slug': slug }
      });
      if (res.ok) {
        const data = await res.json();
        setTableSummary(data);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetch(`/api/public/establishments/${slug}`).then(res => res.json()).then(setEstablishment);
    apiFetch('/products').then(res => res.json()).then(data => setProducts(Array.isArray(data) ? data : []));
    apiFetch('/categories').then(res => res.json()).then(data => setCategories(Array.isArray(data) ? data : []));
    apiFetch('/neighborhoods').then(res => res.json()).then(data => setNeighborhoods(Array.isArray(data) ? data : []));
    apiFetch('/tables').then(res => res.json()).then(data => setTables(Array.isArray(data) ? data : []));
    apiFetch('/settings').then(res => res.json()).then(data => setSettings(data || {}));

    const savedCustomer = localStorage.getItem(`customer_${slug}`);
    if (savedCustomer) setCustomer(JSON.parse(savedCustomer));
  }, [slug]);

  useEffect(() => {
    if (tableNumber) {
      setPaymentMethod('comanda');
      fetchTableSummary(tableNumber);
    } else {
      setPaymentMethod(prev => (prev === 'comanda' ? 'pix' : prev));
      setTableSummary(null);
    }
  }, [tableNumber, slug]);

  const handleRequestTableBill = async () => {
    if (!tableNumber) return;
    setRequestingBill(true);
    setBillRequestFeedback('');
    try {
      const res = await fetch(`/api/public/tables/${encodeURIComponent(tableNumber)}/request-bill`, {
        method: 'POST',
        headers: { 'x-establishment-slug': slug, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok) {
        setTableSummary(data);
        setBillRequestFeedback(data.message || `Conta solicitada! Um atendente irá até a Mesa ${tableNumber}.`);
      } else {
        setBillRequestFeedback(data.error || 'Não foi possível solicitar a conta.');
      }
    } catch {
      setBillRequestFeedback('Erro de comunicação ao solicitar a conta.');
    } finally {
      setRequestingBill(false);
    }
  };

  const handleCustomerLogin = (data: any) => {
    setCustomer(data);
    localStorage.setItem(`customer_${slug}`, JSON.stringify(data));
  };

  const handleLogout = () => {
    setCustomer(null);
    localStorage.removeItem(`customer_${slug}`);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId(prev => (prev === product.id ? null : prev));
    }, 900);
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const subtotal = cart.reduce((acc, item) => acc + (parseFloat(String(item.price)) || 0) * item.quantity, 0);
  const deliveryFee = !tableNumber && orderMode === 'delivery'
    ? parseFloat(String(neighborhoods.find(n => n.id === selectedNeighborhood)?.delivery_fee || 0))
    : 0;
  const total = subtotal + deliveryFee;

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = String(p.name || '').toLowerCase().includes(q) || 
                          String(p.description || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = async () => {
    // For delivery orders, open checkout modal
    if (!tableNumber) {
      setIsCheckoutModalOpen(true);
      return;
    }
    
    // For table orders, create directly
    const items_text = cart.map(item => `${item.quantity}x ${item.name} - R$ ${((parseFloat(String(item.price)) || 0) * item.quantity).toFixed(2)}`).join('\n');
    
    try {
      const res = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          total,
          payment_method: paymentMethod,
          type: 'table',
          items_text: items_text,
          customer_name: `Mesa ${tableNumber}`,
          customer_phone: null,
          notes: checkoutData.notes?.trim() || null
        })
      });
      
      const order = await res.json();
      if (!res.ok) {
        alert(order.error || 'Erro ao finalizar pedido.');
        return;
      }
      
      // Create command for table
      const table = tables.find(t => t.number === parseInt(tableNumber));
      if (table) {
        await apiFetch('/commands', {
          method: 'POST',
          body: JSON.stringify({
            table_id: table.id,
            waiter_name: 'Cliente (Online)'
          })
        });
      }
      
      // Clear cart and redirect
      setCart([]);
      setCheckoutData(prev => ({ ...prev, notes: '' }));
      navigate(`/e/${slug}/pedido/${order.id}`);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      alert('Erro ao finalizar pedido. Tente novamente.');
    }
  };

  const handleConfirmCheckout = async () => {
    if (!selectedNeighborhood) {
      alert('Selecione o bairro para entrega');
      return;
    }
    
    setCheckoutLoading(true);
    
    const items_text = cart.map(item => `${item.quantity}x ${item.name} - R$ ${((parseFloat(String(item.price)) || 0) * item.quantity).toFixed(2)}`).join('\n');
    
    try {
      const res = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: checkoutData.customer_name,
          customer_phone: checkoutData.customer_phone,
          customer_email: checkoutData.customer_email,
          address: checkoutData.address,
          address_number: checkoutData.address_number,
          address_complement: checkoutData.address_complement,
          address_reference: checkoutData.address_reference,
          neighborhood_id: selectedNeighborhood,
          total,
          delivery_fee: deliveryFee,
          payment_method: paymentMethod,
          items_text: items_text,
          type: 'delivery'
        })
      });
      
      const order = await res.json();
      if (!res.ok) {
        alert(order.error || 'Erro ao finalizar pedido.');
        return;
      }
      
      // Clear cart and redirect to tracking page
      setCart([]);
      setIsCheckoutModalOpen(false);
      setIsCartOpen(false);
      navigate(`/e/${slug}/pedido/${order.id}`);
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      alert('Erro ao finalizar pedido. Tente novamente.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const isDarkTheme = settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand';
  const storeTitle = settings.store_name || establishment?.name || 'Cardápio Online';
  const showBanner = Boolean(settings.catalog_banner) && !brokenImages['banner'];

  return (
    <div className={cn(
      "min-h-screen pb-32 transition-colors duration-300",
      settings.catalog_theme === 'dark' ? "bg-zinc-950 text-white" : 
      settings.catalog_theme === 'brand' ? "bg-brand-bg text-white" : "bg-zinc-50 text-zinc-900"
    )}>
      <style>{`
        :root {
          --primary-color: ${settings.primary_color || '#f97316'};
          --font-family: ${
            settings.catalog_font === 'display' ? '"Outfit", sans-serif' : 
            settings.catalog_font === 'mono' ? '"JetBrains Mono", monospace' : '"Inter", sans-serif'
          };
        }
        body { font-family: var(--font-family); }
        .bg-primary { background-color: var(--primary-color) !important; }
        .text-primary { color: var(--primary-color) !important; }
        .border-primary { border-color: var(--primary-color) !important; }
        .ring-primary:focus { --tw-ring-color: var(--primary-color); }
        .bg-orange-500 { background-color: var(--primary-color) !important; }
        .text-orange-500 { color: var(--primary-color) !important; }
        .border-orange-500 { border-color: var(--primary-color) !important; }
      `}</style>
      <Navbar 
        settings={settings} 
        storeName={establishment?.name}
        slug={slug} 
        customer={customer} 
        onAuthClick={() => setIsAuthModalOpen(true)} 
        onLogout={handleLogout}
        onProfileClick={() => setIsProfileModalOpen(true)}
      />
      
      {/* Store Banner */}
      {showBanner && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <div className="w-full h-44 sm:h-60 rounded-2xl overflow-hidden relative shadow-sm">
            <img
              src={settings.catalog_banner}
              alt={`Capa ${storeTitle}`}
              referrerPolicy="no-referrer"
              onError={() => setBrokenImages(prev => ({ ...prev, banner: true }))}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-white/80">
                  {tableNumber ? `Atendimento na Mesa ${tableNumber}` : 'Cardápio Digital · Delivery e Balcão'}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">{storeTitle}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Store Info & Search Header */}
      <div className="max-w-5xl mx-auto px-4 pt-5 pb-3">
        <div className={cn(
          "rounded-2xl border p-5 sm:p-6 transition-colors",
          settings.catalog_theme === 'dark' ? "bg-zinc-900 border-zinc-800" : 
          settings.catalog_theme === 'brand' ? "bg-brand-surface border-zinc-800" : "bg-white border-zinc-200/80 shadow-sm"
        )}>
          <div className="flex flex-wrap justify-between items-start gap-3 sm:gap-4 mb-5">
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className={cn(
                  "text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight break-words",
                  isDarkTheme ? "text-white" : "text-zinc-900"
                )}>
                  {storeTitle}
                </h1>
                {tableNumber && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-orange-500 text-white whitespace-nowrap shrink-0">
                    Mesa {tableNumber}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium">
                <span className={cn(
                  "inline-flex items-center gap-1.5 font-semibold",
                  settings.is_open === "1" ? "text-emerald-600" : "text-red-500"
                )}>
                  {settings.is_open === "1" ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                  {settings.is_open === "1" ? "Aberto agora" : "Fechado no momento"}
                </span>
                <span aria-hidden="true" className={isDarkTheme ? "text-zinc-700" : "text-zinc-300"}>·</span>
                <span className={cn("inline-flex items-center gap-1.5", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
                  <Clock className="w-3.5 h-3.5" /> Preparo 30–45 min
                </span>
                {!tableNumber && (
                  <>
                    <span aria-hidden="true" className={isDarkTheme ? "text-zinc-700" : "text-zinc-300"}>·</span>
                    <span className={cn("inline-flex items-center gap-1.5", isDarkTheme ? "text-zinc-400" : "text-zinc-600")}>
                      <Store className="w-3.5 h-3.5" /> Delivery e Balcão
                    </span>
                  </>
                )}
              </div>
            </div>
            {tableNumber && tableSummary && (tableSummary.has_open_command || tableSummary.orders_count > 0) && (
              <button
                type="button"
                onClick={() => {
                  fetchTableSummary(tableNumber);
                  setIsTableComandaOpen(true);
                }}
                className="w-full sm:w-auto justify-center bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 px-3.5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer"
              >
                <ClipboardList className="w-4 h-4 text-orange-400" />
                <span>Comanda: R$ {(Number(tableSummary.total) || 0).toFixed(2)}</span>
              </button>
            )}
            {settings.enable_reservations === "1" && !tableNumber && (
              <button 
                onClick={() => setIsReservationModalOpen(true)}
                className="w-full sm:w-auto justify-center bg-orange-500 text-white px-4 py-2.5 rounded-xl shadow-sm hover:opacity-95 transition-all active:scale-95 flex items-center gap-2 text-xs font-bold whitespace-nowrap shrink-0"
                title="Reservar mesa"
              >
                <Calendar className="w-4 h-4" />
                <span>Reservar mesa</span>
              </button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-zinc-400 group-focus-within:text-orange-500 transition-colors" />
            </div>
            <input 
              type="text"
              placeholder="Buscar prato, lanche ou bebida..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={cn(
                "w-full pl-10 pr-10 py-3 rounded-xl outline-none border transition-all text-sm font-medium",
                isDarkTheme 
                  ? "bg-zinc-950 border-zinc-800 focus:border-orange-500 text-white placeholder:text-zinc-500" 
                  : "bg-zinc-50 border-zinc-200 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400"
              )}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Limpar busca"
                className="absolute inset-y-0 right-3 flex items-center text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {settings.is_open === "0" && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl flex items-center gap-3 text-red-500">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-xs font-semibold">Os pedidos online estão temporariamente pausados.</p>
            </div>
          )}
          {rawTableNumber && establishment?.enable_tables === 0 && (
            <div className="mt-4 bg-amber-500/10 border border-amber-500/25 p-3.5 rounded-xl flex items-center gap-3 text-amber-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <p className="text-xs font-semibold">
                Pedidos na mesa via QR Code são exclusivos do Plano Premium. Você pode fazer seu pedido normalmente por Delivery ou Retirada no Balcão.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Categories */}
      <div className={cn(
        "sticky top-[61px] z-40 border-y backdrop-blur-xl transition-colors",
        settings.catalog_theme === 'dark' ? "bg-zinc-950/90 border-zinc-800" : 
        settings.catalog_theme === 'brand' ? "bg-brand-bg/90 border-zinc-800" : "bg-white/95 border-zinc-200"
      )}>
        <div className="max-w-5xl mx-auto px-4 py-3 overflow-x-auto whitespace-nowrap flex items-center gap-2 no-scrollbar">
          <button
            onClick={() => setSelectedCategory(null)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0",
              selectedCategory === null 
                ? "bg-orange-500 text-white shadow-sm" 
                : isDarkTheme
                  ? "bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            )}
          >
            Todos ({products.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0",
                selectedCategory === cat.id 
                  ? "bg-orange-500 text-white shadow-sm" 
                  : isDarkTheme
                    ? "bg-zinc-900 text-zinc-300 hover:text-white border border-zinc-800"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto border",
              isDarkTheme ? "bg-zinc-900 border-zinc-800 text-zinc-500" : "bg-white border-zinc-200 text-zinc-400"
            )}>
              <Search className="w-6 h-6" />
            </div>
            <p className={cn("font-semibold text-sm", isDarkTheme ? "text-zinc-300" : "text-zinc-700")}>
              Nenhum produto encontrado
            </p>
            {(searchQuery || selectedCategory !== null) && (
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                className="text-xs font-semibold text-orange-500 hover:underline"
              >
                Limpar filtros e mostrar tudo
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map(product => {
              const catName = categories.find(c => c.id === product.category_id)?.name;
              const qtyInCart = cart.find(i => i.id === product.id)?.quantity || 0;
              const imgFailed = !product.image_url || brokenImages[`prod_${product.id}`];
              const canOrder = Boolean(product.is_available) && settings.is_open === "1";

              return (
                <motion.div
                  layout
                  key={product.id}
                  onClick={() => canOrder && addToCart(product)}
                  className={cn(
                    "rounded-2xl p-3.5 sm:p-4 border flex gap-3 sm:gap-4 transition-all group",
                    canOrder ? "cursor-pointer active:scale-[0.99] hover:-translate-y-0.5" : "opacity-75 cursor-not-allowed",
                    settings.catalog_theme === 'dark' ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" : 
                    settings.catalog_theme === 'brand' ? "bg-brand-surface border-zinc-800 hover:border-zinc-700" : "bg-white border-zinc-200/80 hover:border-zinc-300 shadow-sm"
                  )}
                >
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      {catName && (
                        <p className={cn("text-[11px] font-medium mb-0.5", isDarkTheme ? "text-zinc-400" : "text-zinc-500")}>
                          {catName}
                        </p>
                      )}
                      <h3 className={cn(
                        "text-sm sm:text-base font-bold leading-snug mb-1 group-hover:text-orange-500 transition-colors",
                        isDarkTheme ? "text-white" : "text-zinc-900"
                      )}>
                        {product.name}
                      </h3>
                      <p className={cn(
                        "text-xs leading-relaxed line-clamp-2",
                        isDarkTheme ? "text-zinc-400" : "text-zinc-500"
                      )}>
                        {product.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 sm:mt-4">
                      <span className="text-orange-500 font-extrabold text-base sm:text-lg tabular-nums">
                        R$ {(parseFloat(product.price) || 0).toFixed(2)}
                      </span>
                      <div className={cn(
                        "px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-1.5 whitespace-nowrap shrink-0",
                        addedProductId === product.id
                          ? "bg-emerald-600 text-white"
                          : canOrder
                            ? "bg-orange-500 text-white shadow-sm"
                            : !product.is_available
                              ? isDarkTheme ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-red-50 text-red-600 border border-red-200"
                              : isDarkTheme ? "bg-zinc-800 text-zinc-500" : "bg-zinc-100 text-zinc-400"
                      )}>
                        {addedProductId === product.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Adicionado
                          </>
                        ) : !product.is_available ? (
                          <span>Indisponível</span>
                        ) : settings.is_open !== "1" ? (
                          <span>Loja fechada</span>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            {qtyInCart > 0 ? `Na sacola (${qtyInCart})` : 'Adicionar'}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={cn(
                    "relative w-22 h-22 sm:w-32 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 border self-center sm:self-auto",
                    isDarkTheme ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200/70"
                  )}>
                    {product.image_url && !imgFailed ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        onError={() => setBrokenImages(prev => ({ ...prev, [`prod_${product.id}`]: true }))}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 p-2 text-center">
                        <ChefHat className="w-7 h-7 mb-1 opacity-60" />
                        <span className="text-[10px] font-medium leading-tight line-clamp-2">{product.name}</span>
                      </div>
                    )}
                    {!product.is_available && (
                      <div className="absolute inset-0 bg-black/65 backdrop-blur-[2px] flex items-center justify-center">
                        <span className="bg-white text-zinc-900 px-2 py-1 rounded-md text-[10px] font-bold">Indisponível</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <footer className={cn(
        "max-w-5xl mx-auto px-4 pt-6 pb-28 text-center text-xs",
        isDarkTheme ? "text-zinc-500" : "text-zinc-400"
      )}>
        <span>Desenvolvido por </span>
        <a
          href="https://to-ligado.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-orange-500 hover:underline"
        >
          To-Ligado.com
        </a>
      </footer>

      <FloatingCart 
        count={cart.reduce((a, b) => a + b.quantity, 0)} 
        total={total}
        onClick={() => setIsCartOpen(true)} 
      />

      <AnimatePresence>
        {isReservationModalOpen && (
          <ReservationForm 
            tables={tables} 
            onClose={() => setIsReservationModalOpen(false)} 
            apiFetch={apiFetch}
          />
        )}
        {isAuthModalOpen && establishment && (
          <CustomerAuth 
            establishmentId={establishment.id} 
            onLogin={handleCustomerLogin} 
            onClose={() => setIsAuthModalOpen(false)} 
          />
        )}
        {isProfileModalOpen && customer && (
          <CustomerProfile 
            customer={customer} 
            onClose={() => setIsProfileModalOpen(false)} 
          />
        )}
        {isTableComandaOpen && tableNumber && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTableComandaOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className={cn(
                "relative w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl p-6 space-y-5",
                isDarkTheme ? "bg-zinc-900 text-white border border-zinc-800" : "bg-white text-zinc-900"
              )}
            >
              <div className="flex items-center justify-between border-b border-zinc-200/20 pb-4">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-orange-500" />
                    Comanda · Mesa {tableNumber}
                  </h2>
                  <p className="text-xs text-zinc-400">Resumo do seu consumo até agora</p>
                </div>
                <button type="button" onClick={() => setIsTableComandaOpen(false)} className="p-2 rounded-full hover:bg-zinc-500/10">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!tableSummary || tableSummary.orders.length === 0 ? (
                <p className="text-sm text-zinc-400 text-center py-6">Nenhum pedido lançado na comanda ainda.</p>
              ) : (
                <div className="space-y-3">
                  {tableSummary.orders.map((ord: any) => (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setIsTableComandaOpen(false);
                        navigate(`/e/${slug}/pedido/${ord.id}`);
                      }}
                      className={cn(
                        "p-3.5 rounded-2xl border cursor-pointer transition-colors",
                        isDarkTheme ? "bg-zinc-800/60 border-zinc-700 hover:border-orange-500/50" : "bg-zinc-50 border-zinc-200 hover:border-orange-300"
                      )}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-xs uppercase text-orange-500">Pedido #{ord.id}</span>
                        <span className="font-bold text-sm">R$ {(Number(ord.total) || 0).toFixed(2)}</span>
                      </div>
                      <p className="text-xs opacity-80 whitespace-pre-line">{ord.items_text}</p>
                      <div className="mt-2 flex items-center justify-between text-[11px] opacity-60">
                        <span>{ord.payment_status === 'paid' || ord.payment_status === 'pago' ? 'Pago' : 'Na comanda'}</span>
                        <span>Ver status →</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-zinc-200/20 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold opacity-70">Total acumulado</span>
                  <span className="text-2xl font-black text-orange-500">
                    R$ {(Number(tableSummary?.total) || 0).toFixed(2)}
                  </span>
                </div>
                {tableSummary?.unpaid_total !== undefined && tableSummary.unpaid_total !== tableSummary.total && (
                  <div className="flex justify-between items-center text-xs opacity-75">
                    <span>Saldo em aberto</span>
                    <span className="font-bold">R$ {(Number(tableSummary.unpaid_total) || 0).toFixed(2)}</span>
                  </div>
                )}

                {billRequestFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 text-xs font-bold">
                    {billRequestFeedback}
                  </div>
                )}

                {tableSummary?.bill_requested_at ? (
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-bold flex items-center gap-2">
                    <Bell className="w-4 h-4 shrink-0" />
                    Conta solicitada! Um atendente irá até a Mesa {tableNumber} para receber e encerrar a comanda.
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={requestingBill || !tableSummary || tableSummary.orders_count === 0}
                    onClick={handleRequestTableBill}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    <Bell className="w-4 h-4" />
                    {requestingBill ? 'Avisando o caixa...' : 'Pedir a Conta'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={cn(
                "fixed right-0 top-0 h-full w-full max-w-md z-[70] shadow-2xl flex flex-col",
                settings.catalog_theme === 'dark' ? "bg-zinc-900 text-white" : 
                settings.catalog_theme === 'brand' ? "bg-brand-surface text-white" : "bg-white text-zinc-900"
              )}
            >
              <div className={cn(
                "p-4 border-b flex justify-between items-center",
                isDarkTheme ? "border-zinc-800" : "border-zinc-100"
              )}>
                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Seu Carrinho
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-zinc-100/10 rounded-full"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-4">
                    <ShoppingCart className="w-16 h-16 opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-xs">Seu carrinho está vazio</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className={cn(
                      "p-4 rounded-2xl border flex gap-4",
                      isDarkTheme ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                    )}>
                      {item.image_url && !brokenImages[`cart_${item.id}`] ? (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          onError={() => setBrokenImages(prev => ({ ...prev, [`cart_${item.id}`]: true }))}
                          className="w-20 h-20 object-cover rounded-xl shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-zinc-200/70 flex items-center justify-center text-zinc-500 shrink-0">
                          <ChefHat className="w-6 h-6" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold uppercase tracking-tight">{item.name}</h4>
                        <p className="text-orange-500 font-black text-sm mb-2 tabular-nums">R$ {(parseFloat(item.price) || 0).toFixed(2)}</p>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-zinc-200/50 rounded-lg"><Minus className="w-4 h-4" /></button>
                          <span className="font-bold tabular-nums">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-zinc-200/50 rounded-lg"><Plus className="w-4 h-4" /></button>
                          <button onClick={() => removeFromCart(item.id)} className="ml-auto p-1 text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className={cn(
                  "p-4 sm:p-6 border-t space-y-4",
                  settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "border-zinc-800 bg-zinc-900" : "border-zinc-100 bg-zinc-50"
                )}>
                  {!tableNumber && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Como deseja receber?</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setOrderMode('delivery')}
                            className={cn(
                              "p-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                              orderMode === 'delivery' ? "bg-orange-500 text-white border-orange-500" :
                              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"
                            )}
                          >
                            <Bike className="w-4 h-4" />
                            Delivery
                          </button>
                          <button
                            type="button"
                            onClick={() => setOrderMode('pickup')}
                            className={cn(
                              "p-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                              orderMode === 'pickup' ? "bg-orange-500 text-white border-orange-500" :
                              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"
                            )}
                          >
                            <Store className="w-4 h-4" />
                            Balcão
                          </button>
                        </div>
                      </div>
                      {orderMode === 'delivery' ? (
                        <div>
                          <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Bairro para Entrega</label>
                          <select 
                            value={selectedNeighborhood || ''} 
                            onChange={e => setSelectedNeighborhood(parseInt(e.target.value))}
                            className={cn(
                              "w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm",
                              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "bg-zinc-800 border-zinc-700" : "bg-white border-zinc-200"
                            )}
                          >
                            <option value="">Selecione o bairro</option>
                            {neighborhoods.map(n => (
                              <option key={n.id} value={n.id}>{n.name} - R$ {(parseFloat(n.delivery_fee) || 0).toFixed(2)}</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div className={cn(
                          "p-3 rounded-xl border text-xs font-medium",
                          settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "bg-zinc-800/60 border-zinc-700 text-zinc-300" : "bg-orange-50 border-orange-200 text-orange-800"
                        )}>
                          Retirada direta no balcão da loja — sem taxa de entrega.
                        </div>
                      )}
                      <div>
                        <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Pagamento</label>
                        <div className={cn("grid gap-2", storeInfinitePayEnabled ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
                          <button 
                            type="button"
                            onClick={() => setPaymentMethod('pix')}
                            className={cn(
                              "p-2.5 sm:p-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all",
                              paymentMethod === 'pix' ? "bg-orange-500 text-white border-orange-500" : 
                              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"
                            )}
                          >
                            PIX
                          </button>
                          <button 
                            type="button"
                            onClick={() => setPaymentMethod('entrega')}
                            className={cn(
                              "p-2.5 sm:p-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all",
                              paymentMethod === 'entrega' ? "bg-orange-500 text-white border-orange-500" : 
                              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"
                            )}
                          >
                            {orderMode === 'pickup' ? 'No Balcão' : 'Entrega'}
                          </button>
                          {storeInfinitePayEnabled && (
                            <button 
                              type="button"
                              onClick={() => setPaymentMethod('infinitepay')}
                              className={cn(
                                "col-span-2 sm:col-span-1 p-2.5 sm:p-3 rounded-xl border font-bold text-[11px] uppercase tracking-wider transition-all",
                                paymentMethod === 'infinitepay' ? "bg-emerald-600 text-white border-emerald-600" : 
                                settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"
                              )}
                            >
                              InfinitePay
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {tableNumber && (
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest">
                        Pagamento na Mesa {tableNumber}
                      </label>
                      <div className={cn("grid gap-2", storeInfinitePayEnabled ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('comanda')}
                          className={cn(
                            "p-2.5 sm:p-3 rounded-xl border font-bold text-[11px] uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5",
                            paymentMethod === 'comanda'
                              ? "bg-orange-500 text-white border-orange-500"
                              : settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand'
                                ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                                : "bg-white border-zinc-200 text-zinc-600"
                          )}
                        >
                          <span>Comanda</span>
                          <span className="text-[9px] font-medium opacity-80 normal-case">Pagar no final</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('pix')}
                          className={cn(
                            "p-2.5 sm:p-3 rounded-xl border font-bold text-[11px] uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5",
                            paymentMethod === 'pix'
                              ? "bg-orange-500 text-white border-orange-500"
                              : settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand'
                                ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                                : "bg-white border-zinc-200 text-zinc-600"
                          )}
                        >
                          <span>Pagar Agora</span>
                          <span className="text-[9px] font-medium opacity-80 normal-case">PIX</span>
                        </button>
                        {storeInfinitePayEnabled && (
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('infinitepay')}
                            className={cn(
                              "col-span-2 sm:col-span-1 p-2.5 sm:p-3 rounded-xl border font-bold text-[11px] uppercase tracking-wider transition-all flex flex-col items-center justify-center gap-0.5",
                              paymentMethod === 'infinitepay'
                                ? "bg-emerald-600 text-white border-emerald-600"
                                : settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand'
                                  ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                                  : "bg-white border-zinc-200 text-zinc-600"
                            )}
                          >
                            <span>InfinitePay</span>
                            <span className="text-[9px] font-medium opacity-80 normal-case">Cartão / PIX</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {tableNumber && (
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest opacity-50 mb-1.5">
                        Observações para a cozinha (opcional)
                      </label>
                      <input
                        type="text"
                        value={checkoutData.notes}
                        onChange={(e) => setCheckoutData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Ex: sem cebola, ponto da carne..."
                        className={cn(
                          "w-full border p-3 rounded-xl text-xs outline-none focus:ring-2 focus:ring-orange-500",
                          settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand'
                            ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                            : "bg-white border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                        )}
                      />
                    </div>
                  )}
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm font-bold opacity-60">
                      <span>Subtotal</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    {!tableNumber && (
                      <div className="flex justify-between text-sm font-bold opacity-60">
                        <span>{orderMode === 'pickup' ? 'Retirada no Balcão' : 'Taxa de Entrega'}</span>
                        <span>{orderMode === 'pickup' ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-black uppercase tracking-tighter pt-2 border-t border-zinc-200/20">
                      <span>Total</span>
                      <span className="text-orange-500">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    disabled={(!tableNumber && orderMode === 'delivery' && !selectedNeighborhood) || settings.is_open === "0"}
                    className="w-full bg-orange-500 text-white py-4 sm:py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50"
                  >
                    {tableNumber && paymentMethod === 'comanda' ? 'Adicionar à Comanda' : 'Finalizar Pedido'}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutModalOpen(false)}
              className="fixed inset-0 bg-black/60 z-[80] backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            >
              <div className={cn(
                "w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl",
                settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                  ? "bg-zinc-900 text-white" 
                  : "bg-white text-zinc-900"
              )}>
                <div className={cn(
                  "p-6 border-t-0 border-b flex justify-between items-center sticky top-0 bg-inherit z-10",
                  isDarkTheme ? "border-zinc-800" : "border-zinc-100"
                )}>
                  <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> Finalizar Pedido
                  </h2>
                  <button onClick={() => setIsCheckoutModalOpen(false)} className="p-2 hover:bg-zinc-100/10 rounded-full">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  if (orderMode === 'delivery' && !selectedNeighborhood) {
                    alert('Selecione o bairro para entrega');
                    return;
                  }
                  if (!checkoutData.customer_name || !checkoutData.customer_phone) {
                    alert('Preencha nome e telefone');
                    return;
                  }
                  
                  setCheckoutLoading(true);
                  
                  const items_text = cart.map(item => 
                    `${item.quantity}x ${item.name} - R$ ${((parseFloat(String(item.price)) || 0) * item.quantity).toFixed(2)}`
                  ).join('\n');
                  
                  try {
                    const res = await apiFetch('/orders', {
                      method: 'POST',
                      body: JSON.stringify({
                        customer_name: checkoutData.customer_name,
                        customer_phone: checkoutData.customer_phone.replace(/\D/g, ''),
                        customer_email: checkoutData.customer_email,
                        address: orderMode === 'delivery' ? checkoutData.address : null,
                        address_number: orderMode === 'delivery' ? checkoutData.address_number : null,
                        address_complement: orderMode === 'delivery' ? checkoutData.address_complement : null,
                        address_reference: orderMode === 'delivery' ? checkoutData.address_reference : null,
                        neighborhood_id: orderMode === 'delivery' ? selectedNeighborhood : null,
                        total,
                        delivery_fee: deliveryFee,
                        payment_method: paymentMethod,
                        items_text: items_text,
                        notes: checkoutData.notes?.trim() || null,
                        type: orderMode === 'pickup' ? 'pickup' : 'delivery'
                      })
                    });
                    
                    const order = await res.json();
                    if (!res.ok) {
                      alert(order.error || 'Erro ao finalizar pedido.');
                      return;
                    }
                    
                    setCart([]);
                    setCheckoutData(prev => ({ ...prev, notes: '' }));
                    setIsCheckoutModalOpen(false);
                    navigate(`/e/${slug}/pedido/${order.id}`);
                  } catch (error) {
                    console.error('Erro ao criar pedido:', error);
                    alert('Erro ao finalizar pedido. Tente novamente.');
                  } finally {
                    setCheckoutLoading(false);
                  }
                }} className="p-6 space-y-6">
                  {/* Tipo de Recebimento */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderMode('delivery')}
                      className={cn(
                        "p-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                        orderMode === 'delivery'
                          ? "bg-orange-500 text-white border-orange-500"
                          : settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand'
                            ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                            : "bg-zinc-50 border-zinc-200 text-zinc-600"
                      )}
                    >
                      <Bike className="w-4 h-4" />
                      Delivery
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderMode('pickup')}
                      className={cn(
                        "p-3 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                        orderMode === 'pickup'
                          ? "bg-orange-500 text-white border-orange-500"
                          : settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand'
                            ? "bg-zinc-800 border-zinc-700 text-zinc-400"
                            : "bg-zinc-50 border-zinc-200 text-zinc-600"
                      )}
                    >
                      <Store className="w-4 h-4" />
                      Retirar no Balcão
                    </button>
                  </div>

                  {/* Dados Pessoais */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-widest flex items-center gap-2">
                      <User className="w-4 h-4" /> Seus Dados
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">Nome completo *</label>
                        <input
                          required
                          value={checkoutData.customer_name}
                          onChange={e => setCheckoutData({...checkoutData, customer_name: e.target.value})}
                          className={cn(
                            "w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm",
                            settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                              ? "bg-zinc-800 border-zinc-700" 
                              : "bg-zinc-50 border-zinc-200"
                          )}
                          placeholder="Seu nome"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">WhatsApp *</label>
                        <input
                          required
                          type="tel"
                          value={checkoutData.customer_phone}
                          onChange={e => setCheckoutData({...checkoutData, customer_phone: e.target.value})}
                          className={cn(
                            "w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm",
                            settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                              ? "bg-zinc-800 border-zinc-700" 
                              : "bg-zinc-50 border-zinc-200"
                          )}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">E-mail</label>
                        <input
                          type="email"
                          value={checkoutData.customer_email}
                          onChange={e => setCheckoutData({...checkoutData, customer_email: e.target.value})}
                          className={cn(
                            "w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm",
                            settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                              ? "bg-zinc-800 border-zinc-700" 
                              : "bg-zinc-50 border-zinc-200"
                          )}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Endereço de Entrega (somente Delivery) */}
                  {orderMode === 'delivery' ? (
                    <div className="space-y-4">
                      <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-widest flex items-center gap-2">
                        <MapPin className="w-4 h-4" /> Endereço de Entrega
                      </h3>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-3 sm:col-span-2">
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">Rua/Avenida</label>
                          <input
                            value={checkoutData.address}
                            onChange={e => setCheckoutData({...checkoutData, address: e.target.value})}
                            className={cn(
                              "w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm",
                              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                                ? "bg-zinc-800 border-zinc-700" 
                                : "bg-zinc-50 border-zinc-200"
                            )}
                            placeholder="Nome da rua"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">Número</label>
                          <input
                            value={checkoutData.address_number}
                            onChange={e => setCheckoutData({...checkoutData, address_number: e.target.value})}
                            className={cn(
                              "w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm",
                              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                                ? "bg-zinc-800 border-zinc-700" 
                                : "bg-zinc-50 border-zinc-200"
                            )}
                            placeholder="123"
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-1">
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">Complemento</label>
                          <input
                            value={checkoutData.address_complement}
                            onChange={e => setCheckoutData({...checkoutData, address_complement: e.target.value})}
                            className={cn(
                              "w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm",
                              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                                ? "bg-zinc-800 border-zinc-700" 
                                : "bg-zinc-50 border-zinc-200"
                            )}
                            placeholder="Apto, Bloco..."
                          />
                        </div>
                        <div className="col-span-3 sm:col-span-2">
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">Ponto de Referência</label>
                          <input
                            value={checkoutData.address_reference}
                            onChange={e => setCheckoutData({...checkoutData, address_reference: e.target.value})}
                            className={cn(
                              "w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm",
                              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                                ? "bg-zinc-800 border-zinc-700" 
                                : "bg-zinc-50 border-zinc-200"
                            )}
                            placeholder="Próximo ao..."
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 tracking-widest">Bairro *</label>
                          <select
                            required
                            value={selectedNeighborhood || ''}
                            onChange={e => setSelectedNeighborhood(parseInt(e.target.value))}
                            className={cn(
                              "w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-orange-500 font-bold text-sm",
                              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                                ? "bg-zinc-800 border-zinc-700" 
                                : "bg-zinc-50 border-zinc-200"
                            )}
                          >
                            <option value="">Selecione o bairro</option>
                            {neighborhoods.map(n => (
                              <option key={n.id} value={n.id}>{n.name} - R$ {(parseFloat(n.delivery_fee) || 0).toFixed(2)}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={cn(
                      "p-4 rounded-2xl border flex items-center gap-3",
                      settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand'
                        ? "bg-zinc-800/50 border-zinc-700 text-zinc-200"
                        : "bg-orange-50 border-orange-200 text-orange-900"
                    )}>
                      <Store className="w-5 h-5 text-orange-500 shrink-0" />
                      <div>
                        <p className="text-sm font-bold">Retirada no Balcão</p>
                        <p className="text-xs opacity-75">Você retira seu pedido diretamente no estabelecimento, sem taxa de entrega.</p>
                      </div>
                    </div>
                  )}

                  {/* Pagamento */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-widest flex items-center gap-2">
                      <CreditCard className="w-4 h-4" /> Forma de Pagamento
                    </h3>
                    <div className={cn("grid gap-3", storeInfinitePayEnabled ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2")}>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={cn(
                          "p-4 rounded-xl border font-bold text-sm uppercase tracking-widest transition-all flex flex-col items-center gap-2",
                          paymentMethod === 'pix' 
                            ? "bg-orange-500 text-white border-orange-500" 
                            : settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                              ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600" 
                              : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300"
                        )}
                      >
                        <QrCode className="w-6 h-6" />
                        PIX
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('entrega')}
                        className={cn(
                          "p-4 rounded-xl border font-bold text-sm uppercase tracking-widest transition-all flex flex-col items-center gap-2",
                          paymentMethod === 'entrega' 
                            ? "bg-orange-500 text-white border-orange-500" 
                            : settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                              ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600" 
                              : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300"
                        )}
                      >
                        <CreditCard className="w-6 h-6" />
                        {orderMode === 'pickup' ? 'No Balcão' : 'Na Entrega'}
                      </button>
                      {storeInfinitePayEnabled && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('infinitepay')}
                          className={cn(
                            "p-4 rounded-xl border font-bold text-sm uppercase tracking-widest transition-all flex flex-col items-center gap-1.5",
                            paymentMethod === 'infinitepay' 
                              ? "bg-emerald-600 text-white border-emerald-600" 
                              : settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                                ? "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600" 
                                : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300"
                          )}
                        >
                          <CreditCard className="w-6 h-6" />
                          <span>InfinitePay</span>
                          <span className="text-[10px] font-medium normal-case opacity-80">Cartão ou PIX</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest opacity-60 mb-2">
                      Observações do Pedido (opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={checkoutData.notes}
                      onChange={e => setCheckoutData({ ...checkoutData, notes: e.target.value })}
                      placeholder="Ex: tirar cebola, molho à parte, troco para R$ 100..."
                      className={cn(
                        "w-full border p-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 resize-none",
                        settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand'
                          ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                          : "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400"
                      )}
                    />
                  </div>

                  {/* Resumo do Pedido */}
                  <div className={cn(
                    "space-y-3 p-4 rounded-2xl border",
                    settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand'
                      ? "bg-zinc-800/50 border-zinc-700"
                      : "bg-zinc-50 border-zinc-200"
                  )}>
                    <h3 className="font-bold opacity-60 uppercase text-xs tracking-widest">Resumo do Pedido</h3>
                    <div className="text-xs opacity-75 whitespace-pre-wrap">
                      {cart.map(item => `${item.quantity}x ${item.name}`).join('\n')}
                    </div>
                    <div className={cn(
                      "space-y-2 pt-3 border-t",
                      settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "border-zinc-700" : "border-zinc-200"
                    )}>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">Subtotal</span>
                        <span>R$ {subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-500">{orderMode === 'pickup' ? 'Retirada no Balcão' : 'Taxa de Entrega'}</span>
                        <span>{orderMode === 'pickup' ? 'Grátis' : `R$ ${deliveryFee.toFixed(2)}`}</span>
                      </div>
                      <div className="flex justify-between text-xl font-black pt-2 border-t border-zinc-600">
                        <span>Total</span>
                        <span className="text-orange-500">R$ {total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Botão Confirmar */}
                  <button
                    type="submit"
                    disabled={checkoutLoading || (orderMode === 'delivery' && !selectedNeighborhood)}
                    className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? 'Processando...' : 'Confirmar Pedido'}
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminLogin = ({ onLogin, slug }: { onLogin: () => void, slug: string }) => {
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Login via WhatsApp + senha
      const res = await window.fetch('/api/public/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp, password })
      });
      
      const data = await res.json();
      
      if (res.ok && data.slug === slug) {
        onLogin();
      } else if (res.ok && data.slug !== slug) {
        setError('Este WhatsApp pertence a outro estabelecimento');
      } else {
        setError(data.error || 'Credenciais inválidas');
      }
    } catch (e) {
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-surface p-6 sm:p-10 rounded-3xl sm:rounded-[40px] shadow-2xl w-full max-w-md border border-zinc-800"
      >
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <div className="bg-brand-accent p-4 rounded-2xl mb-5 sm:mb-6 shadow-xl shadow-brand-accent/20">
            <ChefHat className="text-brand-bg w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter text-center">Acesso <span className="text-brand-accent">Admin</span></h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mt-2 text-center">Entre com suas credenciais</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">WhatsApp</label>
            <input 
              type="tel" 
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none text-white transition-all"
              placeholder="11999999999"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none text-white transition-all"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-accent text-brand-bg py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/20 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar no Painel'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- Subscription Tab Component ---
const SubscriptionTab = ({ apiFetch }: { apiFetch: any, settings?: any }) => {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonths, setSelectedMonths] = useState<number>(1);
  const [generatingPix, setGeneratingPix] = useState(false);
  const [generatingIp, setGeneratingIp] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [ipData, setIpData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const res = await apiFetch('/subscription/status');
      const data = await res.json();
      setSubscription(data);
    } catch (error) {
      console.error('Erro ao buscar assinatura:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePix = async (months = selectedMonths) => {
    setGeneratingPix(true);
    setErrorMsg('');
    setIpData(null);
    try {
      const res = await apiFetch('/subscription/generate-pix', {
        method: 'POST',
        body: JSON.stringify({ plan_id: 2, months })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Erro ao gerar PIX. Verifique as configurações da plataforma.');
      } else {
        setPixData(data);
      }
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      setErrorMsg('Erro ao gerar PIX. Tente novamente.');
    } finally {
      setGeneratingPix(false);
    }
  };

  const handleGenerateInfinitePay = async (months = selectedMonths) => {
    setGeneratingIp(true);
    setErrorMsg('');
    setPixData(null);
    try {
      const res = await apiFetch('/subscription/infinitepay-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan_id: 2, months })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Erro ao gerar link InfinitePay.');
      } else {
        setIpData(data);
      }
    } catch (error) {
      console.error('Erro ao gerar checkout InfinitePay:', error);
      setErrorMsg('Erro ao comunicar com InfinitePay. Tente novamente.');
    } finally {
      setGeneratingIp(false);
    }
  };

  const handleCopy = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm p-8">
        <p className="text-zinc-500">Carregando assinatura...</p>
      </div>
    );
  }

  const isPremium = subscription?.plan?.id === 2;
  const paidUntil = subscription?.paid_until ? new Date(subscription.paid_until) : null;
  const isExpired = paidUntil && paidUntil < new Date();
  const paymentOptions = subscription?.payment_options || { pix_enabled: true, infinitepay_enabled: false, support_whatsapp: '' };
  const supportPhone = (pixData?.support_whatsapp || paymentOptions.support_whatsapp || '').replace(/\D/g, '');
  const waReceiptUrl = supportPhone
    ? `https://wa.me/${supportPhone}?text=${encodeURIComponent(
        `💰 *Comprovante de Pagamento - Mensalidade*\n\n📋 Plano: ${pixData?.plan_name || 'Premium'}\n💵 Valor: R$ ${pixData?.amount?.toFixed(2) || '49.90'}\n📅 Referente a: ${pixData?.months || selectedMonths} mês(es)\n\nSegue o comprovante de pagamento.`
      )}`
    : '';

  const baseMonthlyPrice = subscription?.plan?.id === 2 && subscription?.plan?.price > 0 ? subscription.plan.price : 49.90;

  return (
    <div className="space-y-6 text-zinc-900">
      {/* Status da Assinatura */}
      <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">Sua Assinatura</h2>
            <p className="text-zinc-500 text-sm">Gerencie seu plano e pagamentos</p>
          </div>
          <div className={`px-4 py-2 rounded-full font-bold text-sm ${isPremium ? 'bg-purple-100 text-purple-700' : 'bg-zinc-100 text-zinc-600'}`}>
            {subscription?.plan?.name || 'Gratuito'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-zinc-50 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Plano Atual</p>
            <p className="text-xl font-bold text-zinc-900">{subscription?.plan?.name || 'Gratuito'}</p>
          </div>
          <div className="bg-zinc-50 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Status</p>
            <p className={`text-xl font-bold ${isExpired ? 'text-red-500' : 'text-green-500'}`}>
              {isExpired ? 'Expirado' : subscription?.status || 'Ativo'}
            </p>
          </div>
          <div className="bg-zinc-50 rounded-xl p-4">
            <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Válido Até</p>
            <p className="text-xl font-bold text-zinc-900">
              {paidUntil ? paidUntil.toLocaleDateString('pt-BR') : 'N/A'}
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-zinc-50 rounded-xl">
          <p className="text-xs text-zinc-500 uppercase font-bold mb-3">Recursos do Plano</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-green-500 font-bold">✓</span>
              <span className="text-sm">{subscription?.plan?.maxProducts || 10} produtos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={subscription?.plan?.features?.automation !== false ? 'text-green-500 font-bold' : 'text-zinc-400'}>
                {subscription?.plan?.features?.automation !== false ? '✓' : '✕'}
              </span>
              <span className="text-sm">WhatsApp QR Code</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={subscription?.plan?.features?.tables ? 'text-green-500 font-bold' : 'text-zinc-400'}>
                {subscription?.plan?.features?.tables ? '✓' : '✕'}
              </span>
              <span className={cn("text-sm", !subscription?.plan?.features?.tables && "text-zinc-400")}>
                Mesas QR, Comandas e Cupom {!subscription?.plan?.features?.tables && '(Premium)'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className={subscription?.plan?.features?.reservations ? 'text-green-500 font-bold' : 'text-zinc-400'}>
                {subscription?.plan?.features?.reservations ? '✓' : '✕'}
              </span>
              <span className={cn("text-sm", !subscription?.plan?.features?.reservations && "text-zinc-400")}>
                Reservas {!subscription?.plan?.features?.reservations && '(Premium)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pagamento da Mensalidade */}
      {!isPremium || isExpired ? (
        <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-8">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-orange-500" />
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900">Pagar / Renovar Mensalidade</h3>
            </div>
            {(pixData || ipData) && (
              <button
                type="button"
                onClick={() => { setPixData(null); setIpData(null); setErrorMsg(''); }}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-900 underline"
              >
                Escolher outro período / forma
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!pixData && !ipData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 3, 12].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMonths(m)}
                    className={cn(
                      "p-4 rounded-xl border text-left transition-all",
                      selectedMonths === m
                        ? "border-orange-500 bg-orange-50 ring-2 ring-orange-200"
                        : "border-zinc-200 hover:border-zinc-300 bg-zinc-50"
                    )}
                  >
                    <p className="font-bold text-zinc-900">{m === 1 ? '1 Mês' : `${m} Meses`}</p>
                    <p className="text-sm font-bold text-orange-600">R$ {(baseMonthlyPrice * m).toFixed(2)}</p>
                  </button>
                ))}
              </div>

              {!paymentOptions.pix_enabled && !paymentOptions.infinitepay_enabled ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm">
                  Nenhuma forma de pagamento está configurada no momento pelo SuperAdmin.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  {paymentOptions.pix_enabled && (
                    <button
                      type="button"
                      onClick={() => handleGeneratePix(selectedMonths)}
                      disabled={generatingPix || generatingIp}
                      className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-center"
                    >
                      <QrCode className="w-5 h-5 shrink-0" />
                      <span>{generatingPix ? 'Gerando PIX...' : `Pagar com PIX - R$ ${(baseMonthlyPrice * selectedMonths).toFixed(2)}`}</span>
                    </button>
                  )}
                  {paymentOptions.infinitepay_enabled && (
                    <button
                      type="button"
                      onClick={() => handleGenerateInfinitePay(selectedMonths)}
                      disabled={generatingIp || generatingPix}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 sm:px-6 py-4 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-center"
                    >
                      <CreditCard className="w-5 h-5 shrink-0" />
                      <span>{generatingIp ? 'Gerando Checkout...' : 'Pagar com InfinitePay (Cartão/PIX)'}</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : ipData ? (
            <div className="space-y-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-6 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="text-lg font-bold text-zinc-900">Link de Checkout InfinitePay Gerado!</h4>
              <p className="text-sm text-zinc-600 break-words">
                NSU: <span className="font-mono font-bold">{ipData.order_nsu}</span> • Valor: <strong>R$ {Number(ipData.amount || 0).toFixed(2)}</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={ipData.checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-5 h-5 shrink-0" />
                  Abrir Checkout InfinitePay
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(ipData.checkout_url)}
                  className="bg-white border border-emerald-300 text-emerald-800 py-3.5 sm:py-4 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Link Copiado!' : 'Copiar Link'}
                </button>
              </div>
              <p className="text-xs text-zinc-500">Assim que o pagamento for aprovado na InfinitePay, sua assinatura será ativada automaticamente.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-xl border border-zinc-200">
                  <QRCodeSVG value={pixData.pix_code} size={200} />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-zinc-500 text-center">Ou copie o código PIX:</p>
                <div className="bg-zinc-100 p-3 rounded-xl">
                  <p className="text-xs text-zinc-600 break-all font-mono text-center">{pixData.pix_code.substring(0, 60)}...</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(pixData.pix_code)}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copiado!' : 'Copiar Código PIX'}
                </button>
              </div>

              {waReceiptUrl && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-zinc-200" />
                    <span className="text-xs text-zinc-500">após pagar</span>
                    <div className="flex-1 h-px bg-zinc-200" />
                  </div>
                  <a
                    href={waReceiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Enviar Comprovante pelo WhatsApp
                  </a>
                </>
              )}

              <p className="text-xs text-zinc-500 text-center">
                Após o pagamento, aguarde a confirmação do administrador ou utilize a InfinitePay para liberação automática.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-800 mb-2">Assinatura Ativa!</h3>
          <p className="text-green-600">Sua assinatura Premium está ativa até {paidUntil?.toLocaleDateString('pt-BR')}</p>
        </div>
      )}
    </div>
  );
};

const AdminDashboard = ({ slug }: { slug: string }) => {
  useSeoMeta({
    title: `Painel Administrativo (${slug}) | MaisQueCardapio`,
    description: 'Painel administrativo do estabelecimento no MaisQueCardapio.',
    canonicalPath: `/e/${slug}/admin`,
    robots: 'noindex, nofollow'
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'tables' | 'delivery' | 'categories' | 'orders' | 'customers' | 'commands' | 'reservations' | 'help' | 'settings' | 'subscription'>('orders');
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // Verifica se já está logado no localStorage
    return localStorage.getItem(`admin_auth_${slug}`) === 'true';
  });
  const [tables, setTables] = useState<{id: number, number: number}[]>([]);
  const [commands, setCommands] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerFilter, setCustomerFilter] = useState<'all' | 'recurring'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '', address: '', address_number: '', neighborhood_id: '' });
  const [customerFormError, setCustomerFormError] = useState('');
  const [settings, setSettings] = useState<any>({});
  const [evolutionStatus, setEvolutionStatus] = useState<any>(null);
  const [evoQr, setEvoQr] = useState<any>(null);
  const [evoInstanceInput, setEvoInstanceInput] = useState('');
  const [evoLoading, setEvoLoading] = useState(false);
  const [evoFeedback, setEvoFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCustomEvo, setShowCustomEvo] = useState(false);
  const [settingsSavedMsg, setSettingsSavedMsg] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [planStatus, setPlanStatus] = useState<any>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshingLive, setRefreshingLive] = useState(false);
  const [copiedStoreLink, setCopiedStoreLink] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');
  const [productSearch, setProductSearch] = useState('');
  const [productAvailabilityFilter, setProductAvailabilityFilter] = useState<'all' | 'available' | 'unavailable'>('all');
  const [togglingProductId, setTogglingProductId] = useState<number | null>(null);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem(`admin_auth_${slug}`, 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem(`admin_auth_${slug}`);
  };

  const apiFetch = (url: string, options: any = {}) => {
    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    return window.fetch(`/api/e${url}`, {
      ...options,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
        'x-establishment-slug': slug,
      }
    });
  };

  const printOrder = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const neighborhood = neighborhoods.find(n => n.id === order.neighborhood_id);
    const esc = (val: unknown) =>
      String(val ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Pedido #${esc(order.id)}</title>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              font-size: 12px; 
              width: 80mm; 
              margin: 0; 
              padding: 10px;
            }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .header h2 { margin: 0; font-size: 16px; }
            .details { margin-bottom: 10px; }
            .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { font-weight: bold; font-size: 14px; display: flex; justify-content: space-between; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
            @media print {
              @page { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${esc(settings.store_name || 'MaisQueCardapio')}</h2>
            <p>Pedido #${esc(order.id)}</p>
            <p>${esc(new Date(order.created_at).toLocaleString('pt-BR'))}</p>
          </div>
          <div class="details">
            <p><strong>Cliente:</strong> ${esc(order.customer_name || 'N/A')}</p>
            <p><strong>Tipo:</strong> ${order.type === 'table' ? 'Mesa' : order.type === 'pickup' ? 'Balcão / Retirada' : 'Delivery'}</p>
            ${order.address ? `<p><strong>Endereço:</strong> ${esc(order.address)}</p>` : ''}
            ${neighborhood ? `<p><strong>Bairro:</strong> ${esc(neighborhood.name)}</p>` : ''}
          </div>
          <div class="items">
            ${order.items_text ? String(order.items_text).split('\n').map((line: string) => `<div class="item"><span>${esc(line)}</span></div>`).join('') : ''}
            ${order.notes ? `<p style="margin-top:8px;padding-top:6px;border-top:1px dotted #999;"><strong>OBS:</strong> ${esc(order.notes)}</p>` : ''}
          </div>
          <div class="total">
            <span>TOTAL:</span>
            <span>R$ ${(parseFloat(order.total) || 0).toFixed(2)}</span>
          </div>
          <p><strong>Pagamento:</strong> ${esc(String(order.payment_method || '').toUpperCase())}</p>
          <div class="footer">
            <p>Obrigado pela preferência!</p>
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const printCommandReceipt = (cmd: any, relatedOrders: any[], cmdTotal: number) => {
    const printWindow = window.open('', '_blank', 'width=320,height=640');
    if (!printWindow) return;
    const titleLabel = cmd.table_number ? `Mesa ${cmd.table_number}` : `Balcão (${cmd.waiter_name || 'Cliente'})`;
    printWindow.document.write(`
      <html>
        <head>
          <title>Comanda ${titleLabel}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 80mm; margin: 0; padding: 10px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .header h2 { margin: 0; font-size: 16px; }
            .order-block { border-bottom: 1px dotted #999; padding: 6px 0; }
            .total { font-weight: bold; font-size: 15px; display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px; }
            .footer { text-align: center; margin-top: 16px; font-size: 10px; }
            @media print { @page { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${settings.store_name || 'MaisQueCardapio'}</h2>
            <p><strong>COMANDA: ${titleLabel}</strong></p>
            <p>Aberta em: ${new Date(cmd.created_at).toLocaleString('pt-BR')}</p>
          </div>
          ${relatedOrders.length === 0 ? '<p>Nenhum pedido lançado.</p>' : relatedOrders.map(o => `
            <div class="order-block">
              <div><strong>Pedido #${o.id}</strong> - R$ ${(parseFloat(o.total) || 0).toFixed(2)}</div>
              <div>${(o.items_text || '').replace(/\n/g, '<br/>')}</div>
            </div>
          `).join('')}
          <div class="total">
            <span>TOTAL GERAL:</span>
            <span>R$ ${cmdTotal.toFixed(2)}</span>
          </div>
          <div class="footer"><p>Conferência de Comanda</p></div>
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  
  // Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isNeighborhoodModalOpen, setIsNeighborhoodModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryFormError, setCategoryFormError] = useState('');
  const [productFormError, setProductFormError] = useState('');
  const [productSubmitting, setProductSubmitting] = useState(false);
  const [showInlineCategoryInput, setShowInlineCategoryInput] = useState(false);
  const [inlineCategoryName, setInlineCategoryName] = useState('');
  const [inlineCategoryLoading, setInlineCategoryLoading] = useState(false);

  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'pickup' | 'table' | 'delivery'>('all');
  const [isCounterOrderModalOpen, setIsCounterOrderModalOpen] = useState(false);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [counterMode, setCounterMode] = useState<'pickup' | 'table'>('pickup');
  const [counterTableId, setCounterTableId] = useState('');
  const [counterCustomer, setCounterCustomer] = useState('');
  const [counterPhone, setCounterPhone] = useState('');
  const [counterPayment, setCounterPayment] = useState<'balcao' | 'pix' | 'infinitepay' | 'comanda'>('balcao');
  const [counterMarkPaid, setCounterMarkPaid] = useState(true);
  const [counterItems, setCounterItems] = useState<Record<number, number>>({});
  const [counterSubmitting, setCounterSubmitting] = useState(false);
  const [commandForm, setCommandForm] = useState({ mode: 'table' as 'table' | 'pickup', table_id: '', waiter_name: '' });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    category_id: ''
  });

  const [neighborhoodData, setNeighborhoodData] = useState({
    name: '',
    delivery_fee: ''
  });

  const [categoryData, setCategoryData] = useState({
    name: ''
  });

  const [tableNumber, setTableNumber] = useState('');

  const fetchEvolutionStatus = async () => {
    try {
      const res = await apiFetch('/evolution/status');
      if (res.ok) {
        const data = await res.json();
        setEvolutionStatus(data);
        if (data.instance && !evoInstanceInput) {
          setEvoInstanceInput(data.instance);
        }
        if (data.connected) {
          setEvoQr(null);
        }
      }
    } catch (e) {
      console.error('Erro ao buscar status Evolution:', e);
    }
  };

  const refreshLiveOperations = async () => {
    setRefreshingLive(true);
    try {
      const [ordersRes, commandsRes, metricsRes] = await Promise.all([
        apiFetch('/orders'),
        apiFetch('/commands'),
        apiFetch('/dashboard/metrics')
      ]);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        if (Array.isArray(data)) setOrders(data);
      }
      if (commandsRes.ok) {
        const data = await commandsRes.json();
        if (Array.isArray(data)) setCommands(data);
      }
      if (metricsRes.ok) {
        const data = await metricsRes.json();
        setMetrics(data);
      }
    } catch {
      // ignore transient polling error
    } finally {
      setRefreshingLive(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      apiFetch('/products').then(res => res.json()).then(setProducts);
      apiFetch('/categories').then(res => res.json()).then(setCategories);
      apiFetch('/neighborhoods').then(res => res.json()).then(setNeighborhoods);
      apiFetch('/tables').then(res => res.json()).then(setTables);
      apiFetch('/commands').then(res => res.json()).then(setCommands);
      apiFetch('/reservations').then(res => res.json()).then(setReservations);
      apiFetch('/orders').then(res => res.json()).then(setOrders);
      apiFetch('/dashboard/metrics').then(res => res.ok ? res.json() : null).then(setMetrics).catch(() => {});
      apiFetch('/customers').then(res => res.ok ? res.json() : []).then(data => setCustomers(Array.isArray(data) ? data : [])).catch(() => {});
      apiFetch('/settings').then(res => res.json()).then((s) => {
        setSettings(s);
        setEvoInstanceInput(s.evolution_instance || `cardapio-${slug}`);
        if (s.evolution_api_url) setShowCustomEvo(true);
      });
      apiFetch('/subscription/status').then(res => res.ok ? res.json() : null).then(setPlanStatus).catch(() => {});
      fetchEvolutionStatus();
    }
  }, [isLoggedIn, slug]);

  useEffect(() => {
    if (!isLoggedIn || !autoRefresh) return;
    const interval = setInterval(() => {
      refreshLiveOperations();
    }, 15000);
    return () => clearInterval(interval);
  }, [isLoggedIn, autoRefresh, slug]);

  useEffect(() => {
    if (!isLoggedIn || !evoQr || evolutionStatus?.connected) return;
    const interval = setInterval(() => {
      fetchEvolutionStatus();
    }, 4000);
    return () => clearInterval(interval);
  }, [isLoggedIn, evoQr, evolutionStatus?.connected, slug]);

  if (!isLoggedIn) {
    return <AdminLogin onLogin={handleLogin} slug={slug} />;
  }

  const hasTablesAndPrint = planStatus
    ? Boolean(planStatus.plan?.features?.tables ?? (planStatus.plan?.id !== 1 && Number(planStatus.plan?.price || 0) > 0))
    : true;

  const handleConnectEvolution = async () => {
    setEvoLoading(true);
    setEvoFeedback(null);
    try {
      const res = await apiFetch('/evolution/connect', {
        method: 'POST',
        body: JSON.stringify({ instanceName: evoInstanceInput || `cardapio-${slug}` })
      });
      const data = await res.json();
      if (!res.ok) {
        setEvoFeedback({ type: 'error', text: data.error || 'Erro ao conectar instância.' });
      } else {
        setSettings((prev: any) => ({ ...prev, evolution_instance: data.instance, evolution_enabled: '1' }));
        if (data.connected) {
          setEvoQr(null);
          setEvoFeedback({ type: 'success', text: `Instância "${data.instance}" já está conectada!` });
        } else {
          setEvoQr(data);
          setEvoFeedback({ type: 'success', text: 'Escaneie o QR Code abaixo no WhatsApp do seu celular.' });
        }
        fetchEvolutionStatus();
      }
    } catch {
      setEvoFeedback({ type: 'error', text: 'Erro de conexão com o servidor.' });
    } finally {
      setEvoLoading(false);
    }
  };

  const handleDisconnectEvolution = async () => {
    setEvoLoading(true);
    setEvoFeedback(null);
    try {
      const res = await apiFetch('/evolution/disconnect', { method: 'POST' });
      if (res.ok) {
        setEvoQr(null);
        setSettings((prev: any) => ({ ...prev, evolution_enabled: '0' }));
        setEvoFeedback({ type: 'success', text: 'Instância desconectada.' });
        fetchEvolutionStatus();
      }
    } finally {
      setEvoLoading(false);
    }
  };

  const handleTestEvolution = async () => {
    setEvoLoading(true);
    setEvoFeedback(null);
    try {
      const res = await apiFetch('/evolution/test', {
        method: 'POST',
        body: JSON.stringify({ phone: settings.whatsapp_cashier || '' })
      });
      const data = await res.json();
      if (res.ok) {
        setEvoFeedback({ type: 'success', text: data.message || 'Mensagem de teste enviada!' });
      } else {
        setEvoFeedback({ type: 'error', text: data.error || 'Falha ao enviar teste.' });
      }
    } finally {
      setEvoLoading(false);
    }
  };

  const handleTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiFetch('/tables', {
      method: 'POST',
      body: JSON.stringify({ number: parseInt(tableNumber) })
    });
    if (res.ok) {
      setIsTableModalOpen(false);
      setTableNumber('');
      apiFetch('/tables').then(res => res.json()).then(setTables);
    } else {
      alert('Mesa já existe ou erro ao adicionar');
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/settings', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
    const refreshed = await apiFetch('/settings').then(r => r.json());
    setSettings(refreshed);
    setSettingsSavedMsg(true);
    setTimeout(() => setSettingsSavedMsg(false), 3000);
    fetchEvolutionStatus();
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProductFormError('');

    const cleanName = formData.name.trim();
    const parsedPrice = parseFloat(String(formData.price).replace(',', '.'));
    if (!cleanName) {
      setProductFormError('Informe o nome do produto.');
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setProductFormError('Informe um preço válido (ex: 29.90).');
      return;
    }

    const effectiveCategoryId = formData.category_id || (categories[0]?.id ? String(categories[0].id) : '');
    const parsedCatId = effectiveCategoryId ? parseInt(effectiveCategoryId, 10) : null;

    setProductSubmitting(true);
    try {
      const url = editingProduct ? `/products/${editingProduct.id}` : '/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({
          ...formData,
          name: cleanName,
          description: formData.description.trim(),
          price: parsedPrice,
          category_id: parsedCatId && Number.isFinite(parsedCatId) ? parsedCatId : null,
          is_available: editingProduct ? editingProduct.is_available : true
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProductFormError(data.error || 'Não foi possível salvar o produto.');
        return;
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductFormError('');
      setShowInlineCategoryInput(false);
      setInlineCategoryName('');
      setFormData({ name: '', description: '', price: '', image_url: '', category_id: '' });
      apiFetch('/products').then(r => r.json()).then(setProducts);
    } catch {
      setProductFormError('Erro de conexão ao salvar produto. Tente novamente.');
    } finally {
      setProductSubmitting(false);
    }
  };

  const handleNeighborhoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedFee = parseFloat(String(neighborhoodData.delivery_fee).replace(',', '.'));
    await apiFetch('/neighborhoods', {
      method: 'POST',
      body: JSON.stringify({
        name: neighborhoodData.name.trim(),
        delivery_fee: Number.isFinite(parsedFee) ? parsedFee : 0
      })
    });
    setIsNeighborhoodModalOpen(false);
    setNeighborhoodData({ name: '', delivery_fee: '' });
    apiFetch('/neighborhoods').then(res => res.json()).then(setNeighborhoods);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryFormError('');
    const cleanName = categoryData.name.trim();
    if (!cleanName) {
      setCategoryFormError('Informe o nome da categoria.');
      return;
    }

    try {
      const url = editingCategory ? `/categories/${editingCategory.id}` : '/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({ name: cleanName })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCategoryFormError(data.error || 'Erro ao salvar categoria.');
        return;
      }

      const updatedCats = await apiFetch('/categories').then(r => r.json());
      if (Array.isArray(updatedCats)) {
        setCategories(updatedCats);
      }
      if (!editingCategory && data.id) {
        setFormData(prev => ({ ...prev, category_id: String(data.id) }));
      }
      setIsCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryData({ name: '' });
    } catch {
      setCategoryFormError('Erro de conexão ao salvar categoria.');
    }
  };

  const handleInlineCreateCategory = async () => {
    const cleanName = inlineCategoryName.trim();
    if (!cleanName) {
      setProductFormError('Digite o nome da nova categoria antes de criar.');
      return;
    }
    setProductFormError('');
    setInlineCategoryLoading(true);
    try {
      const res = await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: cleanName })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setProductFormError(data.error || 'Erro ao criar categoria.');
        return;
      }
      const updatedCats = await apiFetch('/categories').then(r => r.json());
      if (Array.isArray(updatedCats)) {
        setCategories(updatedCats);
      }
      if (data.id) {
        setFormData(prev => ({ ...prev, category_id: String(data.id) }));
      }
      setInlineCategoryName('');
      setShowInlineCategoryInput(false);
    } catch {
      setProductFormError('Erro de conexão ao criar categoria.');
    } finally {
      setInlineCategoryLoading(false);
    }
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setProductFormError('');
    setShowInlineCategoryInput(categories.length === 0);
    setInlineCategoryName('');
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      category_id: categories[0]?.id ? String(categories[0].id) : ''
    });
    setIsProductModalOpen(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductFormError('');
    setShowInlineCategoryInput(false);
    setInlineCategoryName('');
    setFormData({
      name: product.name || '',
      description: product.description || '',
      price: product.price != null ? String(product.price) : '',
      image_url: product.image_url || '',
      category_id: product.category_id != null ? String(product.category_id) : (categories[0]?.id ? String(categories[0].id) : '')
    });
    setIsProductModalOpen(true);
  };

  const toggleAvailability = async (product: Product) => {
    const nextAvailable = !product.is_available;
    const updated = { ...product, is_available: nextAvailable };
    setTogglingProductId(product.id);
    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
    try {
      const res = await apiFetch(`/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated)
      });
      if (!res.ok) {
        setProducts(prev => prev.map(p => p.id === product.id ? product : p));
      }
    } catch {
      setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    } finally {
      setTogglingProductId(null);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Tem certeza?')) return;
    await apiFetch(`/products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white selection:bg-brand-accent selection:text-brand-bg">
      <Navbar 
        settings={settings} 
        slug={slug} 
        onLogout={handleLogout} 
      />
      <div className="max-w-7xl mx-auto px-3.5 py-4 sm:p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-5 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">Painel <span className="text-brand-accent">Administrativo</span></h1>
            <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest mt-1">Gerencie seu cardápio e pedidos</p>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto">
            <Link
              to={`/e/${slug}/admin/assinatura`}
              className="px-2.5 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl font-black text-[11px] sm:text-sm uppercase tracking-normal sm:tracking-widest flex items-center justify-center gap-1.5 sm:gap-2.5 transition-all shadow-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-purple-500/5 hover:bg-purple-500/20 min-w-0"
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate">Assinatura</span>
            </Link>
            <button 
              onClick={async () => {
                const newStatus = settings.is_open === "1" ? "0" : "1";
                const updatedSettings = { ...settings, is_open: newStatus };
                await apiFetch('/settings', {
                  method: 'POST',
                  body: JSON.stringify(updatedSettings)
                });
                setSettings(updatedSettings);
              }}
              className={cn(
                "px-2.5 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl font-black text-[11px] sm:text-sm uppercase tracking-normal sm:tracking-widest flex items-center justify-center gap-1.5 sm:gap-2.5 transition-all shadow-xl min-w-0",
                settings.is_open === "1" 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-emerald-500/5" 
                  : "bg-red-500/10 text-red-500 border border-red-500/20 shadow-red-500/5"
              )}
            >
              <Power className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate">{settings.is_open === "1" ? "Aberto" : "Fechado"}</span>
            </button>
            <button 
              type="button"
              onClick={openNewProductModal}
              className="col-span-2 sm:col-span-1 bg-brand-accent text-brand-bg px-3.5 sm:px-6 py-3 sm:py-3.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-normal sm:tracking-widest flex items-center justify-center gap-2 sm:gap-2.5 hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> Novo Produto
            </button>
          </div>
        </div>

        {/* Barra Rápida de Link do Cardápio & Sincronização ao Vivo */}
        <div className="mb-6 rounded-2xl border border-zinc-800 bg-brand-surface px-3.5 sm:px-4 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-zinc-400 shrink-0">Link do cardápio:</span>
            <span className="font-mono text-xs sm:text-sm text-brand-accent truncate max-w-full">
              {typeof window !== 'undefined' ? `${window.location.origin}/e/${slug}` : `/e/${slug}`}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                const url = typeof window !== 'undefined' ? `${window.location.origin}/e/${slug}` : `/e/${slug}`;
                navigator.clipboard?.writeText(url);
                setCopiedStoreLink(true);
                setTimeout(() => setCopiedStoreLink(false), 2200);
              }}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-[11px] sm:text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0"
            >
              {copiedStoreLink ? <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Copy className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
              <span className="truncate">{copiedStoreLink ? 'Copiado!' : 'Copiar Link'}</span>
            </button>
            <Link
              to={`/e/${slug}`}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-[11px] sm:text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors min-w-0"
            >
              <ExternalLink className="w-3.5 h-3.5 text-brand-accent shrink-0" />
              <span className="truncate">Abrir Cardápio</span>
            </Link>
            <button
              type="button"
              onClick={() => setAutoRefresh(prev => !prev)}
              className={cn(
                "px-2.5 sm:px-3 py-2 rounded-xl border text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer min-w-0",
                autoRefresh
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400"
              )}
              title="Atualiza pedidos, comandas e faturamento automaticamente a cada 15 segundos"
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{autoRefresh ? 'Ao vivo (15s)' : 'Auto pausado'}</span>
            </button>
            <button
              type="button"
              onClick={refreshLiveOperations}
              disabled={refreshingLive}
              className="px-2.5 sm:px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-[11px] sm:text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer min-w-0"
            >
              <RefreshCw className={cn("w-3.5 h-3.5 shrink-0", refreshingLive && "animate-spin")} />
              <span className="truncate">Atualizar</span>
            </button>
          </div>
        </div>

        {/* Alerta imediato quando alguma mesa solicitou a conta */}
        {commands.some(c => c.bill_requested_at) && (
          <div className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-amber-300 text-sm font-semibold">
              <Bell className="w-4 h-4 shrink-0" />
              <span>
                {commands.filter(c => c.bill_requested_at).length === 1
                  ? 'Uma mesa acabou de pedir a conta!'
                  : `${commands.filter(c => c.bill_requested_at).length} mesas pediram a conta!`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('commands')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto"
            >
              Ver Comandas Abertas
            </button>
          </div>
        )}

        {/* KPIs Financeiros e Operacionais ao Vivo */}
        {(() => {
          const activeQueueCount = orders.filter(o =>
            !['completed', 'entregue', 'cancelled', 'cancelado'].includes(String(o.status || ''))
          ).length;
          const todayTotalVal = metrics?.todayTotal ?? 0;
          const todayOrdersVal = metrics?.todayOrders ?? 0;
          const monthTotalVal = metrics?.monthTotal ?? 0;
          const monthOrdersVal = metrics?.monthOrders ?? 0;
          const avgTicketVal = metrics?.avgTicket ?? 0;
          const fmtMoney = (v: number) =>
            v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 sm:mb-10">
              <div className="bg-brand-surface p-5 sm:p-6 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-zinc-400 text-xs font-semibold">Vendas Hoje</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                  R$ {fmtMoney(todayTotalVal)}
                </p>
                <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                  {todayOrdersVal} {todayOrdersVal === 1 ? 'pedido hoje' : 'pedidos hoje'}
                </p>
              </div>

              <div className="bg-brand-surface p-5 sm:p-6 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-zinc-400 text-xs font-semibold">Faturamento do Mês</span>
                  <TrendingUp className="w-4 h-4 text-brand-accent" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                  R$ {fmtMoney(monthTotalVal)}
                </p>
                <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                  {monthOrdersVal} {monthOrdersVal === 1 ? 'pedido no mês' : 'pedidos no mês'}
                </p>
              </div>

              <div className="bg-brand-surface p-5 sm:p-6 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-zinc-400 text-xs font-semibold">Ticket Médio (Pagos)</span>
                  <CreditCard className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                  R$ {fmtMoney(avgTicketVal)}
                </p>
                <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                  {customers.length} {customers.length === 1 ? 'cliente na base' : 'clientes na base'}
                </p>
              </div>

              <div className="bg-brand-surface p-5 sm:p-6 rounded-2xl border border-zinc-800">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-zinc-400 text-xs font-semibold">Operação Agora</span>
                  <ShoppingCart className="w-4 h-4 text-orange-400" />
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                  {activeQueueCount} na fila
                </p>
                <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                  {products.filter(p => p.is_available).length} produtos ativos · {hasTablesAndPrint ? `${commands.length} comandas` : 'Mesas (Premium)'}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Primeiros Passos — Guia de Configuração Inicial para Lojas Novas */}
        {products.length === 0 && (
          <div className="mb-8 rounded-2xl border border-orange-500/35 bg-orange-500/10 p-5 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="font-display font-bold text-lg sm:text-xl text-white">
                  Primeiros passos para começar a vender
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 mt-0.5">
                  Configure suas categorias, cadastre seus primeiros produtos e defina os bairros de entrega.
                </p>
              </div>
              <span className="text-xs font-semibold text-orange-300 tabular-nums shrink-0">
                {[categories.length > 0, products.length > 0, neighborhoods.length > 0].filter(Boolean).length} de 3 concluídos
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-4 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-white">1. Categorias do Cardápio</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {categories.length > 0
                        ? `${categories.length} ${categories.length === 1 ? 'categoria cadastrada' : 'categorias cadastradas'}.`
                        : 'Crie categorias como Lanches, Pizzas ou Bebidas.'}
                    </p>
                  </div>
                  {categories.length > 0 && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryData({ name: '' });
                    setCategoryFormError('');
                    setIsCategoryModalOpen(true);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  + Nova Categoria
                </button>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-4 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-white">2. Primeiro Produto</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      Adicione nome, preço, foto e escolha ou crie a categoria direto no formulário.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openNewProductModal}
                  className="w-full py-2.5 px-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-xs font-bold text-zinc-950 transition-colors cursor-pointer"
                >
                  + Cadastrar Primeiro Produto
                </button>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950/90 p-4 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-white">3. Taxas por Bairro</p>
                    <p className="text-xs text-zinc-400 mt-1">
                      {neighborhoods.length > 0
                        ? `${neighborhoods.length} ${neighborhoods.length === 1 ? 'bairro configurado' : 'bairros configurados'}.`
                        : 'Defina os bairros atendidos e o valor da entrega.'}
                    </p>
                  </div>
                  {neighborhoods.length > 0 && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
                </div>
                <button
                  type="button"
                  onClick={() => setIsNeighborhoodModalOpen(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-white transition-colors cursor-pointer"
                >
                  + Adicionar Bairro
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-1 sm:gap-2 mb-8 border-b border-zinc-800 overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
          {[
            { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
            { id: 'customers', label: customers.length > 0 ? `Clientes (${customers.length})` : 'Clientes', icon: Users },
            { id: 'commands', label: commands.length > 0 ? `Comandas (${commands.length})` : 'Comandas', icon: ClipboardList },
            { id: 'reservations', label: 'Reservas', icon: Calendar },
            { id: 'products', label: 'Produtos', icon: MenuIcon },
            { id: 'categories', label: 'Categorias', icon: LayoutDashboard },
            { id: 'delivery', label: 'Delivery', icon: Bike },
            { id: 'tables', label: 'Mesas', icon: QrCode },
            { id: 'subscription', label: 'Assinatura', icon: CreditCard },
            { id: 'settings', label: 'Configurações', icon: Settings }
          ].map(tab => {
            if (tab.id === 'reservations' && settings.enable_reservations !== "1") return null;
            
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'customers') {
                    apiFetch('/customers').then(res => res.ok ? res.json() : []).then(data => setCustomers(Array.isArray(data) ? data : [])).catch(() => {});
                  }
                }}
                className={cn(
                  "px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-black uppercase tracking-wider sm:tracking-widest flex items-center gap-2 sm:gap-3 transition-all border-b-2 shrink-0",
                  activeTab === tab.id 
                    ? "border-brand-accent text-brand-accent bg-brand-accent/5" 
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                )}
              >
                <tab.icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'products' && (() => {
          const pq = productSearch.trim().toLowerCase();
          const availableCount = products.filter(p => Boolean(p.is_available)).length;
          const unavailableCount = products.length - availableCount;
          const filteredAdminProducts = products.filter(p => {
            if (productAvailabilityFilter === 'available' && !p.is_available) return false;
            if (productAvailabilityFilter === 'unavailable' && p.is_available) return false;
            if (!pq) return true;
            const catName = categories.find(c => c.id === p.category_id)?.name || '';
            return (
              String(p.name || '').toLowerCase().includes(pq) ||
              String(catName).toLowerCase().includes(pq)
            );
          });

          return (
          <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-zinc-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-bold text-lg text-zinc-900">Lista de Produtos</h2>
                  <p className="text-xs text-zinc-500">
                    {availableCount} {availableCount === 1 ? 'disponível' : 'disponíveis'} · {unavailableCount} {unavailableCount === 1 ? 'indisponível' : 'indisponíveis'} · alterne com 1 toque
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryData({ name: '' });
                      setCategoryFormError('');
                      setIsCategoryModalOpen(true);
                    }}
                    className="justify-center px-3 sm:px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 shrink-0" /> Nova Categoria
                  </button>
                  <button
                    type="button"
                    onClick={openNewProductModal}
                    className="justify-center px-3 sm:px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 shrink-0" /> Novo Produto
                  </button>
                </div>
              </div>

              {products.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      placeholder="Buscar produto ou categoria para pausar/ativar..."
                      className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 sm:flex items-center gap-1.5">
                    {[
                      { id: 'all', label: `Todos (${products.length})` },
                      { id: 'available', label: `Ativos (${availableCount})` },
                      { id: 'unavailable', label: `Pausados (${unavailableCount})` }
                    ].map(f => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setProductAvailabilityFilter(f.id as any)}
                        className={cn(
                          "px-2.5 sm:px-3 py-2 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors cursor-pointer text-center truncate",
                          productAvailabilityFilter === f.id
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {products.length === 0 ? (
              <div className="p-10 sm:p-14 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                  <ChefHat className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-900 text-base">Nenhum produto cadastrado ainda</p>
                  <p className="text-zinc-500 text-sm max-w-md mx-auto">
                    Cadastre seu primeiro item agora — você pode selecionar uma categoria ou criar uma nova direto no formulário.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={openNewProductModal}
                    className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> Cadastrar Primeiro Produto
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('categories')}
                    className="px-5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Gerenciar Categorias
                  </button>
                </div>
              </div>
            ) : filteredAdminProducts.length === 0 ? (
              <div className="p-10 text-center space-y-2">
                <p className="font-bold text-zinc-900 text-sm">Nenhum produto encontrado neste filtro.</p>
                <button
                  type="button"
                  onClick={() => { setProductSearch(''); setProductAvailabilityFilter('all'); }}
                  className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  Limpar busca e filtros
                </button>
              </div>
            ) : (
            <>
              {/* Mobile Card View — Switch Disponível/Indisponível visível sem rolar tabela */}
              <div className="divide-y divide-zinc-100 md:hidden">
                {filteredAdminProducts.map(product => {
                  const catName = categories.find(c => c.id === product.category_id)?.name;
                  const isAvailable = Boolean(product.is_available);
                  return (
                    <div key={product.id} className={cn("p-4 space-y-3 transition-colors", !isAvailable && "bg-zinc-50/80")}>
                      <div className="flex items-start gap-3">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className={cn("w-14 h-14 rounded-xl object-cover shrink-0 bg-zinc-100", !isAvailable && "opacity-60 grayscale")} referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-14 h-14 rounded-xl bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0">
                            <ChefHat className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className={cn("font-bold text-sm leading-snug truncate", isAvailable ? "text-zinc-900" : "text-zinc-500")}>
                            {product.name}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {catName || 'Sem categoria'}
                          </p>
                          <p className="text-sm font-extrabold text-zinc-900 tabular-nums mt-0.5">
                            R$ {(parseFloat(String(product.price)) || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-100">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isAvailable}
                          disabled={togglingProductId === product.id}
                          onClick={() => toggleAvailability(product)}
                          className={cn(
                            "inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-60",
                            isAvailable
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                              : "bg-red-50 border-red-200 text-red-700"
                          )}
                        >
                          <span className={cn(
                            "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                            isAvailable ? "bg-emerald-500" : "bg-red-400"
                          )}>
                            <span className={cn(
                              "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                              isAvailable ? "translate-x-4.5" : "translate-x-1"
                            )} />
                          </span>
                          <span>{isAvailable ? 'Disponível' : 'Indisponível'}</span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openEditProduct(product)}
                            className="p-2 rounded-lg text-zinc-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Editar produto"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteProduct(product.id)}
                            className="p-2 rounded-lg text-zinc-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Remover produto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Produto</th>
                      <th className="px-6 py-4 font-semibold">Categoria</th>
                      <th className="px-6 py-4 font-semibold">Preço</th>
                      <th className="px-6 py-4 font-semibold">Disponibilidade</th>
                      <th className="px-6 py-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredAdminProducts.map(product => {
                      const isAvailable = Boolean(product.is_available);
                      return (
                      <tr key={product.id} className={cn("hover:bg-zinc-50 transition-colors", !isAvailable && "bg-zinc-50/70")}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.image_url ? (
                              <img src={product.image_url} alt={product.name} className={cn("w-12 h-12 rounded-lg object-cover shrink-0 bg-zinc-100", !isAvailable && "opacity-60 grayscale")} referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center shrink-0">
                                <ChefHat className="w-5 h-5" />
                              </div>
                            )}
                            <span className={cn("font-medium", isAvailable ? "text-zinc-900" : "text-zinc-500")}>{product.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-zinc-500">
                          {categories.find(c => c.id === product.category_id)?.name || <span className="text-zinc-400 italic">Sem categoria</span>}
                        </td>
                        <td className="px-6 py-4 font-bold text-zinc-900 tabular-nums">
                          R$ {(parseFloat(String(product.price)) || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isAvailable}
                            disabled={togglingProductId === product.id}
                            onClick={() => toggleAvailability(product)}
                            className={cn(
                              "inline-flex items-center gap-2.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer disabled:opacity-60",
                              isAvailable
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                            )}
                            title={isAvailable ? "Clique para marcar como Indisponível" : "Clique para marcar como Disponível"}
                          >
                            <span className={cn(
                              "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
                              isAvailable ? "bg-emerald-500" : "bg-red-400"
                            )}>
                              <span className={cn(
                                "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                                isAvailable ? "translate-x-4.5" : "translate-x-1"
                              )} />
                            </span>
                            <span>{isAvailable ? 'Disponível' : 'Indisponível'}</span>
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => openEditProduct(product)}
                              className="p-2 text-zinc-400 hover:text-blue-500 transition-colors cursor-pointer"
                              title="Editar produto"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteProduct(product.id)}
                              className="p-2 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                              title="Remover produto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
            )}
          </div>
          );
        })()}

        {activeTab === 'tables' && (
          !hasTablesAndPrint ? (
            <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">Pedidos na Mesa (QR Code) são exclusivos do Plano Premium</h2>
              <p className="text-sm text-zinc-500 max-w-lg mx-auto">
                No Plano Gratuito você já conta com Delivery por bairro, Retirada no Balcão e WhatsApp Automático (QR Code). Faça o upgrade para o Plano Premium para liberar QR Codes de mesas, comandas abertas e impressão de cupom.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                Ver Plano Premium na Assinatura
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <h2 className="text-xl font-bold text-white">Gerenciamento de Mesas</h2>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <button 
                    onClick={() => setIsPrintViewOpen(true)}
                    className="flex-1 sm:flex-none justify-center bg-zinc-100 text-zinc-700 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-zinc-200"
                  >
                    <QrCode className="w-4 h-4 shrink-0" /> Imprimir Todos
                  </button>
                  <button 
                    onClick={() => setIsTableModalOpen(true)}
                    className="flex-1 sm:flex-none justify-center bg-orange-500 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-orange-600"
                  >
                    <Plus className="w-4 h-4 shrink-0" /> Adicionar Mesa
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tables.map((table) => {
                  const tableUrl = `${window.location.origin}/e/${slug}?mesa=${table.number}`;
                  return (
                    <div key={table.id} className="bg-white text-zinc-900 p-5 sm:p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col items-center gap-4 group relative">
                      <button 
                        onClick={async () => {
                          if (confirm(`Deletar Mesa ${table.number}?`)) {
                            await apiFetch(`/tables/${table.id}`, { method: 'DELETE' });
                            apiFetch('/tables').then(res => res.json()).then(setTables);
                          }
                        }}
                        className="absolute top-2 right-2 p-1.5 text-zinc-400 hover:text-red-500 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <span className="font-bold text-zinc-900 text-xl">Mesa {table.number}</span>
                      <div className="bg-white p-2 rounded-xl border border-zinc-100 shadow-inner group-hover:scale-105 transition-transform">
                        <QRCodeSVG value={tableUrl} size={120} />
                      </div>
                      <div className="flex flex-col gap-2 w-full">
                        <Link 
                          to={`/e/${slug}?mesa=${table.number}`}
                          className="text-xs font-bold text-orange-500 hover:bg-orange-50 py-2 rounded-lg transition-colors border border-orange-100 text-center"
                        >
                          Abrir Cardápio
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        )}

        {activeTab === 'delivery' && (
          <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-zinc-100 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="font-bold text-lg text-zinc-900">Taxas por Bairro</h2>
                <p className="text-xs text-zinc-500">Configure os bairros atendidos no delivery e a taxa de cada região</p>
              </div>
              <button 
                type="button"
                onClick={() => setIsNeighborhoodModalOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Adicionar Bairro
              </button>
            </div>
            {neighborhoods.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Bike className="w-10 h-10 text-zinc-300 mx-auto" />
                <p className="font-bold text-zinc-900">Nenhum bairro cadastrado</p>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Cadastre pelo menos um bairro para permitir pedidos de delivery no seu cardápio.
                </p>
                <button
                  type="button"
                  onClick={() => setIsNeighborhoodModalOpen(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Cadastrar Primeiro Bairro
                </button>
              </div>
            ) : (
            <div className="divide-y divide-zinc-100">
              {neighborhoods.map(n => (
                <div key={n.id} className="p-4 sm:p-6 flex justify-between items-center gap-3 hover:bg-zinc-50 transition-colors">
                  <div className="min-w-0">
                    <h4 className="font-bold text-zinc-900 truncate">{n.name}</h4>
                    <p className="text-zinc-500 text-sm">Taxa de entrega</p>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <span className="font-bold text-zinc-900 tabular-nums">R$ {(parseFloat(String(n.delivery_fee)) || 0).toFixed(2)}</span>
                    <button 
                      onClick={async () => {
                        if (confirm('Deletar bairro?')) {
                          await apiFetch(`/neighborhoods/${n.id}`, { method: 'DELETE' });
                          apiFetch('/neighborhoods').then(res => res.json()).then(setNeighborhoods);
                        }
                      }}
                      className="p-2 text-zinc-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-zinc-100 flex flex-wrap justify-between items-center gap-3">
              <div>
                <h2 className="font-bold text-lg text-zinc-900">Categorias do Cardápio</h2>
                <p className="text-xs text-zinc-500">Organize seus produtos em seções como Lanches, Pizzas, Bebidas e Sobremesas</p>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryData({ name: '' });
                  setCategoryFormError('');
                  setIsCategoryModalOpen(true);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Nova Categoria
              </button>
            </div>
            {categories.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <LayoutDashboard className="w-10 h-10 text-zinc-300 mx-auto" />
                <p className="font-bold text-zinc-900">Nenhuma categoria cadastrada</p>
                <p className="text-sm text-zinc-500 max-w-md mx-auto">
                  Crie categorias para agrupar os itens do seu cardápio e facilitar a escolha dos clientes.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCategory(null);
                    setCategoryData({ name: '' });
                    setCategoryFormError('');
                    setIsCategoryModalOpen(true);
                  }}
                  className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Criar Primeira Categoria
                </button>
              </div>
            ) : (
            <div className="divide-y divide-zinc-100">
              {categories.map(c => {
                const countInCat = products.filter(p => p.category_id === c.id).length;
                return (
                <div key={c.id} className="p-4 sm:p-6 flex justify-between items-center gap-3 hover:bg-zinc-50 transition-colors">
                  <div className="min-w-0">
                    <span className="font-bold text-zinc-900 block truncate">{c.name}</span>
                    <span className="text-xs text-zinc-500 tabular-nums">
                      {countInCat} {countInCat === 1 ? 'produto' : 'produtos'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(c);
                        setCategoryData({ name: c.name });
                        setCategoryFormError('');
                        setIsCategoryModalOpen(true);
                      }}
                      className="p-2 text-zinc-400 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Renomear categoria"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      type="button"
                      onClick={async () => {
                        if (confirm(`Deletar a categoria "${c.name}"? Os produtos dela continuarão salvos.`)) {
                          await apiFetch(`/categories/${c.id}`, { method: 'DELETE' });
                          apiFetch('/categories').then(res => res.json()).then(setCategories);
                          apiFetch('/products').then(res => res.json()).then(setProducts);
                        }
                      }}
                      className="p-2 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                      title="Excluir categoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (() => {
          const normalizeStatus = (s: string) =>
            s === 'pendente' ? 'pending'
            : s === 'confirmado' ? 'confirmed'
            : s === 'em_preparo' ? 'preparing'
            : s === 'saiu_para_entrega' ? 'delivering'
            : s === 'entregue' ? 'completed'
            : s === 'cancelado' ? 'cancelled'
            : (s || 'pending');

          const getNextStatusAction = (order: any) => {
            const st = normalizeStatus(order.status);
            if (st === 'pending' || st === 'aguardando_pagamento') return { next: 'confirmed', label: 'Confirmar' };
            if (st === 'confirmed') return { next: 'preparing', label: 'Preparar' };
            if (st === 'preparing') return { next: 'delivering', label: order.type === 'pickup' ? 'Pronto' : 'Enviar' };
            if (st === 'delivering') return { next: 'completed', label: order.type === 'pickup' ? 'Retirado' : 'Entregue' };
            return null;
          };

          const q = orderSearch.trim().toLowerCase();
          const filteredOrders = orders.filter(o => {
            if (orderTypeFilter !== 'all' && (o.type || 'delivery') !== orderTypeFilter) return false;
            const st = normalizeStatus(o.status);
            if (orderStatusFilter === 'active' && (st === 'completed' || st === 'cancelled')) return false;
            if (orderStatusFilter === 'completed' && st !== 'completed') return false;
            if (orderStatusFilter === 'cancelled' && st !== 'cancelled') return false;
            if (!q) return true;
            return (
              String(o.id).includes(q) ||
              String(o.customer_name || '').toLowerCase().includes(q) ||
              String(o.customer_phone || '').toLowerCase().includes(q) ||
              String(o.items_text || '').toLowerCase().includes(q)
            );
          });

          const updateOrderStatus = async (orderId: number, newStatus: string) => {
            await apiFetch(`/orders/${orderId}/status`, {
              method: 'PUT',
              body: JSON.stringify({ status: newStatus })
            });
            refreshLiveOperations();
          };

          return (
          <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-zinc-100 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Fila & Histórico de Pedidos</h2>
                  <p className="text-zinc-500 text-sm">Avance status com 1 clique, imprima cupons ou chame o cliente no WhatsApp</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCounterMode('pickup');
                    setCounterTableId(tables[0]?.id?.toString() || '');
                    setCounterCustomer('');
                    setCounterPhone('');
                    setCounterItems({});
                    setIsCounterOrderModalOpen(true);
                  }}
                  className="w-full sm:w-auto justify-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  {hasTablesAndPrint ? 'Novo Pedido Balcão / Mesa' : 'Novo Pedido Balcão'}
                </button>
              </div>

              <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)}
                    placeholder="Buscar por #pedido, cliente, WhatsApp ou item..."
                    className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'pickup', label: 'Balcão' },
                    ...(hasTablesAndPrint ? [{ id: 'table', label: 'Mesa' }] : []),
                    { id: 'delivery', label: 'Delivery' }
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setOrderTypeFilter(f.id as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                        orderTypeFilter === f.id
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                  <span className="hidden sm:inline text-zinc-300 px-1">|</span>
                  {[
                    { id: 'all', label: 'Qualquer status' },
                    { id: 'active', label: 'Em andamento' },
                    { id: 'completed', label: 'Concluídos' },
                    { id: 'cancelled', label: 'Cancelados' }
                  ].map(sf => (
                    <button
                      key={sf.id}
                      type="button"
                      onClick={() => setOrderStatusFilter(sf.id as any)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                        orderStatusFilter === sf.id
                          ? "bg-orange-500 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      )}
                    >
                      {sf.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 text-center">
                <ShoppingCart className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">Nenhum pedido encontrado neste filtro.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Pedido / Cliente</th>
                      <th className="px-4 py-4 font-semibold">Tipo</th>
                      <th className="px-4 py-4 font-semibold">Pagamento</th>
                      <th className="px-4 py-4 font-semibold">Total</th>
                      <th className="px-5 py-4 font-semibold">Status & Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredOrders.map(order => {
                      const nextStep = getNextStatusAction(order);
                      const phoneDigits = String(order.customer_phone || '').replace(/\D/g, '');
                      const waNumber = phoneDigits.startsWith('55') ? phoneDigits : (phoneDigits.length >= 10 ? `55${phoneDigits}` : '');
                      return (
                      <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-5 py-4 text-sm text-zinc-600">
                          <div className="font-bold text-zinc-900 tabular-nums">#{order.id} · {order.customer_name || 'Cliente'}</div>
                          <div className="text-xs text-zinc-400 tabular-nums">{new Date(order.created_at).toLocaleString('pt-BR')}</div>
                          {order.items_text && (
                            <div className="text-xs text-zinc-500 mt-1 line-clamp-2 max-w-xs">{order.items_text}</div>
                          )}
                          {order.notes && (
                            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1.5 max-w-xs">
                              <strong>Obs:</strong> {order.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase whitespace-nowrap",
                            order.type === 'table'
                              ? "bg-blue-100 text-blue-700"
                              : order.type === 'pickup'
                                ? "bg-amber-100 text-amber-800"
                                : "bg-purple-100 text-purple-700"
                          )}>
                            {order.type === 'table' ? 'Mesa' : order.type === 'pickup' ? 'Balcão' : 'Delivery'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={cn(
                              "px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase",
                              order.payment_method === 'infinitepay' ? "bg-emerald-100 text-emerald-700" :
                              order.payment_method === 'comanda' ? "bg-orange-100 text-orange-700" : "bg-zinc-100 text-zinc-700"
                            )}>
                              {order.payment_method === 'comanda' ? 'Comanda' : order.payment_method}
                            </span>
                            <span className={cn(
                              "text-[10px] font-bold uppercase",
                              (order.payment_status === 'pago' || order.payment_status === 'paid') ? "text-emerald-600" :
                              order.payment_status === 'pagamento_em_analise' ? "text-blue-600" :
                              order.payment_status === 'pending_comanda' ? "text-orange-600" : "text-zinc-400"
                            )}>
                              {(order.payment_status === 'pago' || order.payment_status === 'paid') ? 'Pago' :
                               order.payment_status === 'pagamento_em_analise' ? 'Em análise' :
                               order.payment_status === 'pending_comanda' ? 'Na comanda' :
                               order.payment_status === 'pending_delivery' ? (order.type === 'pickup' ? 'No balcão' : 'Na entrega') : 'Aguardando'}
                            </span>
                            {order.payment_status !== 'pago' && order.payment_status !== 'paid' && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await apiFetch(`/orders/${order.id}/confirm-payment`, {
                                    method: 'PUT',
                                    body: JSON.stringify({ notes: 'Confirmado manualmente no painel' })
                                  });
                                  refreshLiveOperations();
                                }}
                                className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                              >
                                Marcar como Pago
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-bold text-zinc-900 tabular-nums whitespace-nowrap">
                          R$ {(parseFloat(order.total) || 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-2">
                            {nextStep && (
                              <button
                                type="button"
                                onClick={() => updateOrderStatus(order.id, nextStep.next)}
                                className="px-2.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                                title={`Avançar para ${nextStep.label}`}
                              >
                                {nextStep.label}
                              </button>
                            )}
                            <select
                              value={normalizeStatus(order.status)}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="bg-zinc-100 text-zinc-900 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500"
                            >
                              <option value="pending">Pendente</option>
                              <option value="confirmed">Confirmado</option>
                              <option value="preparing">Em Preparo</option>
                              <option value="delivering">{order.type === 'pickup' ? 'Pronto p/ Retirar' : 'Em Entrega'}</option>
                              <option value="completed">{order.type === 'pickup' ? 'Retirado' : 'Entregue'}</option>
                              <option value="cancelled">Cancelado</option>
                            </select>
                            {waNumber && (
                              <a
                                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Olá ${order.customer_name || ''}! Sobre o seu pedido #${order.id}: `)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                title="Falar com o cliente no WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}
                            {hasTablesAndPrint ? (
                              <button
                                onClick={() => printOrder(order)}
                                className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                                title="Imprimir Cupom"
                              >
                                <Printer className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveTab('subscription')}
                                className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold flex items-center gap-1 hover:bg-amber-100 transition-colors cursor-pointer"
                                title="Impressão de cupom exclusiva do Plano Premium"
                              >
                                <Lock className="w-3 h-3" /> Cupom
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          );
        })()}

        {activeTab === 'customers' && (() => {
          const query = customerSearch.trim().toLowerCase();
          const filteredCustomers = customers.filter(c => {
            if (customerFilter === 'recurring' && (Number(c.total_orders) || 0) < 2) return false;
            if (!query) return true;
            return (
              String(c.name || '').toLowerCase().includes(query) ||
              String(c.phone || '').toLowerCase().includes(query) ||
              String(c.neighborhood_name || '').toLowerCase().includes(query) ||
              String(c.address || '').toLowerCase().includes(query)
            );
          });
          const recurringCount = customers.filter(c => (Number(c.total_orders) || 0) >= 2).length;
          const totalRevenueCustomers = customers.reduce((sum, c) => sum + (parseFloat(c.total_spent) || 0), 0);

          return (
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white text-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-100 shadow-sm">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase">Total de Clientes</p>
                  <p className="text-2xl sm:text-3xl font-black text-zinc-900 mt-1">{customers.length}</p>
                </div>
                <div className="bg-white text-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-100 shadow-sm">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase">Recorrentes (2+)</p>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{recurringCount}</p>
                </div>
                <div className="col-span-2 sm:col-span-1 bg-white text-zinc-900 p-4 sm:p-5 rounded-2xl border border-zinc-100 shadow-sm">
                  <p className="text-[11px] font-bold text-zinc-500 uppercase">Total Movimentado</p>
                  <p className="text-2xl sm:text-3xl font-black text-orange-600 mt-1">R$ {totalRevenueCustomers.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-zinc-100 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900">Base de Clientes</h2>
                      <p className="text-zinc-500 text-sm">Clientes cadastrados automaticamente a cada pedido ou cadastro no cardápio</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerForm({ name: '', phone: '', email: '', address: '', address_number: '', neighborhood_id: '' });
                        setCustomerFormError('');
                        setIsCustomerModalOpen(true);
                      }}
                      className="w-full sm:w-auto justify-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      Novo Cliente
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                        placeholder="Buscar por nome, WhatsApp, bairro ou endereço..."
                        className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setCustomerFilter('all')}
                        className={cn(
                          "flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                          customerFilter === 'all' ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        )}
                      >
                        Todos ({customers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerFilter('recurring')}
                        className={cn(
                          "flex-1 sm:flex-none px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer",
                          customerFilter === 'recurring' ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        )}
                      >
                        Recorrentes ({recurringCount})
                      </button>
                    </div>
                  </div>
                </div>

                {filteredCustomers.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">Nenhum cliente encontrado.</p>
                    <p className="text-zinc-400 text-xs mt-1">Os clientes são salvos automaticamente quando fazem pedidos pelo cardápio.</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-zinc-100">
                      {filteredCustomers.map((c, idx) => {
                        const phoneDigits = String(c.phone || '').replace(/\D/g, '');
                        const waNumber = phoneDigits.startsWith('55') ? phoneDigits : (phoneDigits.length >= 10 ? `55${phoneDigits}` : phoneDigits);
                        return (
                          <div key={c.id || `${c.phone}-${idx}`} className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-bold text-zinc-900 truncate">{c.name || 'Cliente'}</p>
                                <p className="text-xs text-zinc-500 font-mono">{c.phone || 'Sem telefone'}</p>
                                {(c.neighborhood_name || c.address) && (
                                  <p className="text-xs text-zinc-500 mt-1 break-words">
                                    {[c.address && `${c.address}${c.address_number ? `, ${c.address_number}` : ''}`, c.neighborhood_name].filter(Boolean).join(' · ')}
                                  </p>
                                )}
                              </div>
                              <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold shrink-0">
                                {c.total_orders || 0} {Number(c.total_orders) === 1 ? 'pedido' : 'pedidos'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-zinc-500 bg-zinc-50 px-3 py-2 rounded-xl">
                              <span>Total gasto: <strong className="text-zinc-900">R$ {(parseFloat(c.total_spent) || 0).toFixed(2)}</strong></span>
                              <span>{c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('pt-BR') : 'Novo'}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {waNumber && (
                                <a
                                  href={`https://wa.me/${waNumber}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 min-w-0 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 shrink-0" /> WhatsApp
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedCustomer(c)}
                                className="flex-1 min-w-0 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5 shrink-0" /> Histórico
                              </button>
                              {c.id && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm(`Remover cliente ${c.name}?`)) {
                                      await apiFetch(`/customers/${c.id}`, { method: 'DELETE' });
                                      apiFetch('/customers').then(r => r.json()).then(setCustomers);
                                    }
                                  }}
                                  className="p-2 text-zinc-400 hover:text-red-500 border border-zinc-200 rounded-xl shrink-0"
                                  title="Excluir cliente"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-4 font-semibold">Cliente</th>
                            <th className="px-6 py-4 font-semibold">Endereço / Bairro</th>
                            <th className="px-6 py-4 font-semibold">Pedidos</th>
                            <th className="px-6 py-4 font-semibold">Total Gasto</th>
                            <th className="px-6 py-4 font-semibold">Último Pedido</th>
                            <th className="px-6 py-4 font-semibold text-right">Ações</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100">
                          {filteredCustomers.map((c, idx) => {
                            const phoneDigits = String(c.phone || '').replace(/\D/g, '');
                            const waNumber = phoneDigits.startsWith('55') ? phoneDigits : (phoneDigits.length >= 10 ? `55${phoneDigits}` : phoneDigits);
                            return (
                              <tr key={c.id || `${c.phone}-${idx}`} className="hover:bg-zinc-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="font-bold text-zinc-900">{c.name || 'Cliente'}</div>
                                  <div className="text-xs text-zinc-500 font-mono">{c.phone || 'Sem telefone'}</div>
                                  {c.email && <div className="text-xs text-zinc-400">{c.email}</div>}
                                </td>
                                <td className="px-6 py-4 text-sm text-zinc-600 max-w-xs">
                                  {c.address || c.neighborhood_name ? (
                                    <div>
                                      {c.address && <div className="truncate">{c.address}{c.address_number ? `, ${c.address_number}` : ''}</div>}
                                      {c.neighborhood_name && <div className="text-xs text-zinc-400">{c.neighborhood_name}</div>}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-zinc-400">Balcão / Não informado</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-bold">
                                    {c.total_orders || 0}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-zinc-900">
                                  R$ {(parseFloat(c.total_spent) || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-xs text-zinc-500">
                                  {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('pt-BR') : '—'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end items-center gap-2">
                                    {waNumber && (
                                      <a
                                        href={`https://wa.me/${waNumber}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1"
                                        title="Abrir WhatsApp"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedCustomer(c)}
                                      className="px-2.5 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200 text-xs font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Eye className="w-3.5 h-3.5" /> Histórico
                                    </button>
                                    {c.id && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (confirm(`Remover cliente ${c.name}?`)) {
                                            await apiFetch(`/customers/${c.id}`, { method: 'DELETE' });
                                            apiFetch('/customers').then(r => r.json()).then(setCustomers);
                                          }
                                        }}
                                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                                        title="Excluir cliente"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

        {activeTab === 'commands' && (
          !hasTablesAndPrint ? (
            <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm p-10 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-900">Comandas Abertas são exclusivas do Plano Premium</h2>
              <p className="text-sm text-zinc-500 max-w-lg mx-auto">
                No Plano Gratuito você já gerencia pedidos online de Delivery, Retirada no Balcão e notificações automáticas no WhatsApp. Faça o upgrade para o Plano Premium para abrir e fechar comandas por mesa, usar QR Code nas mesas e imprimir cupons.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('subscription')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold text-sm transition-colors cursor-pointer"
              >
                Fazer Upgrade para o Premium
              </button>
            </div>
          ) : (
          <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-zinc-100 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Comandas Abertas</h2>
                <p className="text-zinc-500 text-sm">Controle de contas abertas por mesa ou balcão</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCommandForm({ mode: tables.length > 0 ? 'table' : 'pickup', table_id: tables[0]?.id?.toString() || '', waiter_name: '' });
                    setIsCommandModalOpen(true);
                  }}
                  className="flex-1 sm:flex-none justify-center bg-zinc-100 hover:bg-zinc-200 text-zinc-900 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" /> Abrir Comanda
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCounterMode(tables.length > 0 ? 'table' : 'pickup');
                    setCounterTableId(tables[0]?.id?.toString() || '');
                    setCounterCustomer('');
                    setCounterPhone('');
                    setCounterItems({});
                    setIsCounterOrderModalOpen(true);
                  }}
                  className="flex-1 sm:flex-none justify-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 shrink-0" /> Lançar Pedido Balcão / Mesa
                </button>
              </div>
            </div>
            {commands.length === 0 ? (
              <div className="p-12 text-center">
                <ClipboardList className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">Nenhuma comanda aberta no momento.</p>
                <p className="text-zinc-400 text-xs mt-1">Comandas são abertas automaticamente ao pedir pelo QR Code da mesa ou pelo botão acima.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 sm:p-6">
                {commands.map(cmd => {
                  const cmdCreatedAt = new Date(cmd.created_at).getTime() - 60000;
                  const relatedOrders = orders.filter(o => {
                    const orderTime = new Date(o.created_at).getTime();
                    if (orderTime < cmdCreatedAt) return false;
                    if (cmd.table_number) {
                      return o.type === 'table' && o.customer_name === `Mesa ${cmd.table_number}`;
                    }
                    return o.type === 'pickup' && cmd.waiter_name && o.customer_name === cmd.waiter_name;
                  });
                  const cmdTotal = relatedOrders.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);

                  return (
                    <div
                      key={cmd.id}
                      className={cn(
                        "p-4 sm:p-5 rounded-2xl border flex flex-col justify-between gap-4",
                        cmd.bill_requested_at
                          ? "bg-amber-50/70 border-amber-400 shadow-sm"
                          : "bg-zinc-50 border-zinc-200"
                      )}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={cn(
                              "text-xs font-bold px-2.5 py-1 rounded-full",
                              cmd.table_number ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"
                            )}>
                              {cmd.table_number ? `Mesa ${cmd.table_number}` : 'Balcão'}
                            </span>
                            {cmd.bill_requested_at && (
                              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500 text-white flex items-center gap-1 animate-pulse">
                                <Bell className="w-3 h-3" /> Conta Solicitada
                              </span>
                            )}
                          </div>
                          <span className="text-zinc-400 text-xs font-mono">
                            {new Date(cmd.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="font-bold text-zinc-900">{cmd.waiter_name || 'Cliente'}</p>
                        <div className="mt-3 pt-3 border-t border-zinc-200 text-xs text-zinc-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Pedidos vinculados:</span>
                            <strong>{relatedOrders.length}</strong>
                          </div>
                          <div className="flex justify-between text-sm font-bold text-zinc-900">
                            <span>Consumo acumulado:</span>
                            <span className="text-orange-600">R$ {cmdTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] sm:flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (cmd.table_id) {
                              setCounterMode('table');
                              setCounterTableId(String(cmd.table_id));
                              setCounterPayment('comanda');
                              setCounterMarkPaid(false);
                            } else {
                              setCounterMode('pickup');
                              setCounterPayment('balcao');
                            }
                            setCounterCustomer(cmd.waiter_name || '');
                            setCounterItems({});
                            setIsCounterOrderModalOpen(true);
                          }}
                          className="sm:flex-1 min-w-0 bg-white border border-zinc-300 text-zinc-800 px-2.5 sm:px-3 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold hover:bg-zinc-100 transition-colors cursor-pointer text-center truncate"
                        >
                          + Pedido
                        </button>
                        <button
                          type="button"
                          onClick={() => printCommandReceipt(cmd, relatedOrders, cmdTotal)}
                          title="Imprimir cupom da comanda"
                          className="px-3 bg-white border border-zinc-300 text-zinc-700 py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button 
                          type="button"
                          onClick={async () => {
                            const label = cmd.table_number ? `Mesa ${cmd.table_number}` : (cmd.waiter_name || 'Balcão');
                            const hasUnpaid = relatedOrders.some(o => o.payment_status !== 'paid' && o.payment_status !== 'pago');
                            if (hasUnpaid && !confirm(`Fechar a conta de ${label} (R$ ${cmdTotal.toFixed(2)}) e marcar os pedidos vinculados como pagos?`)) {
                              return;
                            }
                            await apiFetch(`/commands/${cmd.id}`, {
                              method: 'PUT',
                              body: JSON.stringify({
                                status: 'closed',
                                order_ids: relatedOrders.map(o => o.id),
                                mark_orders_paid: true
                              })
                            });
                            apiFetch('/commands').then(res => res.json()).then(setCommands);
                            apiFetch('/orders').then(res => res.json()).then(setOrders);
                          }}
                          className="sm:flex-1 min-w-0 bg-zinc-900 text-white px-2.5 sm:px-3 py-2.5 rounded-xl text-[11px] sm:text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer text-center truncate"
                        >
                          Fechar Conta
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          )
        )}

        {activeTab === 'reservations' && settings.enable_reservations === "1" && (
          <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Reservas de Mesas</h2>
                <p className="text-zinc-500 text-sm">Gerencie as solicitações de reserva</p>
              </div>
            </div>
            {reservations.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                <p className="text-zinc-400">Nenhuma reserva encontrada.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Cliente</th>
                      <th className="px-6 py-4 font-semibold">Data/Hora</th>
                      <th className="px-6 py-4 font-semibold">Pessoas</th>
                      <th className="px-6 py-4 font-semibold">Mesa</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {reservations.map(res => (
                      <tr key={res.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-900">{res.customer_name}</div>
                          <div className="text-xs text-zinc-500">{res.customer_phone}</div>
                        </td>
                        <td className="px-6 py-4 text-zinc-600 text-sm">
                          {new Date(res.reservation_time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-zinc-600 text-sm">
                          {res.guests} pessoas
                        </td>
                        <td className="px-6 py-4 text-zinc-600 text-sm">
                          {res.table_number ? `Mesa ${res.table_number}` : 'A definir'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold",
                            res.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" :
                            res.status === 'cancelled' ? "bg-red-100 text-red-700" :
                            "bg-orange-100 text-orange-700"
                          )}>
                            {res.status === 'confirmed' ? 'Confirmada' :
                             res.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {res.status === 'pending' && (
                              <button 
                                onClick={async () => {
                                  await apiFetch(`/reservations/${res.id}`, {
                                    method: 'PUT',
                                    body: JSON.stringify({ status: 'confirmed' })
                                  });
                                  apiFetch('/reservations').then(r => r.json()).then(setReservations);
                                }}
                                className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                Confirmar
                              </button>
                            )}
                            <button 
                              onClick={async () => {
                                if (confirm('Deletar reserva?')) {
                                  await apiFetch(`/reservations/${res.id}`, { method: 'DELETE' });
                                  apiFetch('/reservations').then(r => r.json()).then(setReservations);
                                }
                              }}
                              className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white text-zinc-900 rounded-2xl border border-zinc-100 shadow-sm p-5 sm:p-8 max-w-2xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-6">Configurações Gerais</h2>
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Nome da Loja</label>
                  <input 
                    value={settings.store_name || ''} 
                    onChange={e => setSettings({...settings, store_name: e.target.value})}
                    className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
                {uploadFeedback && (
                  <div className={cn(
                    "p-3 rounded-xl text-sm font-medium border",
                    uploadFeedback.type === 'success'
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  )}>
                    {uploadFeedback.text}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Logomarca</label>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="file"
                      accept="image/*"
                      disabled={logoUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setUploadFeedback({ type: 'error', text: 'Logomarca muito grande. Máximo permitido: 5MB.' });
                            return;
                          }
                          setLogoUploading(true);
                          setUploadFeedback(null);
                          const formDataUpload = new FormData();
                          formDataUpload.append('logo', file);
                          try {
                            const res = await apiFetch('/upload/logo', {
                              method: 'POST',
                              body: formDataUpload
                            });
                            const data = await res.json();
                            if (res.ok && data.logo_url) {
                              setSettings((prev: any) => ({ ...prev, store_logo: data.logo_url }));
                              setUploadFeedback({ type: 'success', text: 'Logomarca enviada! Clique em "Salvar Alterações" para publicar.' });
                            } else {
                              setUploadFeedback({ type: 'error', text: data.error || 'Erro ao fazer upload da logomarca.' });
                            }
                          } catch {
                            setUploadFeedback({ type: 'error', text: 'Erro de conexão ao enviar a logomarca.' });
                          } finally {
                            setLogoUploading(false);
                          }
                        }
                      }}
                      className="w-full bg-zinc-50 text-zinc-700 border border-zinc-200 p-2.5 sm:p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm file:mr-2 sm:file:mr-4 file:py-1 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 disabled:opacity-50"
                    />
                    {logoUploading && <p className="text-xs text-zinc-500">Enviando logomarca...</p>}
                    {settings.store_logo && (
                      <div className="flex items-center gap-3">
                        <img src={settings.store_logo} alt="Logo atual" className="h-12 w-12 object-cover rounded-lg border border-zinc-200" />
                        <button type="button" onClick={() => setSettings({...settings, store_logo: ''})} className="text-xs font-semibold text-red-500 hover:underline">Remover logomarca</button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Cor Primária</label>
                  <div className="flex gap-3 items-center">
                    <input 
                      type="color"
                      value={settings.primary_color || '#f97316'} 
                      onChange={e => setSettings({...settings, primary_color: e.target.value})}
                      className="w-12 h-12 rounded-lg border border-zinc-200 cursor-pointer" 
                    />
                    <input 
                      value={settings.primary_color || '#f97316'} 
                      onChange={e => setSettings({...settings, primary_color: e.target.value})}
                      className="flex-1 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100">
                  <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                    <LayoutDashboard className="w-4 h-4 text-brand-accent" /> Personalização do Cardápio
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tema do Cardápio</label>
                      <select 
                        value={settings.catalog_theme || 'light'} 
                        onChange={e => setSettings({...settings, catalog_theme: e.target.value})}
                        className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent text-sm"
                      >
                        <option value="light">Claro (Padrão)</option>
                        <option value="dark">Escuro (Premium)</option>
                        <option value="brand">Marca (Cores da Loja)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Fonte do Cardápio</label>
                      <select 
                        value={settings.catalog_font || 'sans'} 
                        onChange={e => setSettings({...settings, catalog_font: e.target.value})}
                        className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent text-sm"
                      >
                        <option value="sans">Inter (Moderna)</option>
                        <option value="display">Outfit (Elegante)</option>
                        <option value="mono">JetBrains Mono (Tech)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-3">
                      <label className="block text-xs font-bold text-zinc-500 uppercase">Capa / Banner da Loja (Topo)</label>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={bannerUploading}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) {
                            setUploadFeedback({ type: 'error', text: 'Imagem de capa muito grande. Máximo permitido: 5MB.' });
                            return;
                          }
                          setBannerUploading(true);
                          setUploadFeedback(null);
                          const formDataUpload = new FormData();
                          formDataUpload.append('banner', file);
                          try {
                            const res = await apiFetch('/upload/banner', {
                              method: 'POST',
                              body: formDataUpload
                            });
                            const data = await res.json();
                            if (res.ok && data.banner_url) {
                              setSettings((prev: any) => ({ ...prev, catalog_banner: data.banner_url }));
                              setUploadFeedback({ type: 'success', text: 'Capa enviada! Clique em "Salvar Alterações" para aplicar na loja.' });
                            } else {
                              setUploadFeedback({ type: 'error', text: data.error || 'Erro ao fazer upload da capa.' });
                            }
                          } catch {
                            setUploadFeedback({ type: 'error', text: 'Erro de conexão ao enviar a capa.' });
                          } finally {
                            setBannerUploading(false);
                          }
                        }}
                        className="w-full bg-zinc-50 text-zinc-700 border border-zinc-200 p-2.5 sm:p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm file:mr-2 sm:file:mr-4 file:py-1 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 disabled:opacity-50"
                      />
                      {bannerUploading && <p className="text-xs text-zinc-500">Enviando imagem de capa...</p>}
                      {settings.catalog_banner && (
                        <div className="space-y-2">
                          <img
                            src={settings.catalog_banner}
                            alt="Prévia da capa"
                            className="w-full h-32 object-cover rounded-xl border border-zinc-200"
                          />
                          <button
                            type="button"
                            onClick={() => setSettings({ ...settings, catalog_banner: '' })}
                            className="text-xs font-semibold text-red-500 hover:underline"
                          >
                            Remover capa
                          </button>
                        </div>
                      )}
                      <div>
                        <label className="block text-[11px] font-medium text-zinc-500 mb-1">Ou informe o link externo da imagem</label>
                        <input 
                          value={settings.catalog_banner || ''} 
                          onChange={e => setSettings({...settings, catalog_banner: e.target.value})}
                          className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent text-sm" 
                          placeholder="https://exemplo.com/banner.jpg"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">WhatsApp Cozinha (Pedidos Mesa)</label>
                  <input 
                    value={settings.whatsapp_kitchen || ''} 
                    onChange={e => setSettings({...settings, whatsapp_kitchen: e.target.value})}
                    className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                    placeholder="Ex: 5511999999999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">WhatsApp Caixa (Pedidos Delivery)</label>
                  <input 
                    value={settings.whatsapp_cashier || ''} 
                    onChange={e => setSettings({...settings, whatsapp_cashier: e.target.value})}
                    className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                    placeholder="Ex: 5511999999999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Chave PIX</label>
                  <input 
                    value={settings.pix_key || ''} 
                    onChange={e => setSettings({...settings, pix_key: e.target.value})}
                    className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                  />
                </div>

                <div className="pt-6 border-t border-zinc-100 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                      <CreditCard className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-900">Pagamentos Online (InfinitePay)</h3>
                      <p className="text-xs text-zinc-500">Permita que clientes paguem pedidos por Cartão ou PIX com confirmação automática</p>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={settings.infinitepay_enabled === '1'}
                        onChange={e => setSettings({ ...settings, infinitepay_enabled: e.target.checked ? '1' : '0' })}
                      />
                      <div className={cn(
                        "w-12 h-6 rounded-full transition-colors",
                        settings.infinitepay_enabled === '1' ? "bg-emerald-500" : "bg-zinc-200"
                      )} />
                      <div className={cn(
                        "absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        settings.infinitepay_enabled === '1' ? "translate-x-6" : "translate-x-0"
                      )} />
                    </div>
                    <span className="text-sm font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors">
                      Ativar Checkout InfinitePay para clientes da loja
                    </span>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">InfiniteTag / Handle (sem $)</label>
                      <input
                        value={settings.infinitepay_handle || ''}
                        onChange={e => setSettings({ ...settings, infinitepay_handle: e.target.value.replace(/^\$/, '') })}
                        className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        placeholder="ex: sua-loja"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                        API Key InfinitePay (opcional) {settings.has_infinitepay_api_key === '1' && <span className="text-emerald-600 ml-1">✓ Salva</span>}
                      </label>
                      <input
                        type="password"
                        value={settings.infinitepay_api_key || ''}
                        onChange={e => setSettings({ ...settings, infinitepay_api_key: e.target.value })}
                        className="w-full bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                        placeholder={settings.has_infinitepay_api_key === '1' ? '•••••••• (em branco para manter)' : 'inchk_...'}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Webhook de confirmação automática: <code className="bg-zinc-100 text-zinc-800 px-1.5 py-0.5 rounded font-mono break-all">{typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/infinitepay` : '/api/webhook/infinitepay'}</code>
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-100">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={settings.enable_reservations === "1"}
                        onChange={e => setSettings({...settings, enable_reservations: e.target.checked ? "1" : "0"})}
                      />
                      <div className={cn(
                        "w-12 h-6 rounded-full transition-colors",
                        settings.enable_reservations === "1" ? "bg-orange-500" : "bg-zinc-200"
                      )} />
                      <div className={cn(
                        "absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        settings.enable_reservations === "1" ? "translate-x-6" : "translate-x-0"
                      )} />
                    </div>
                    <span className="text-sm font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors">Habilitar Reservas de Mesa</span>
                  </label>
                </div>

                <div className="pt-6 border-t border-zinc-100 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-emerald-100 p-2 rounded-lg">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-900">Notificações WhatsApp (Evolution API v2)</h3>
                        <p className="text-xs text-zinc-500">Conecte seu WhatsApp por QR Code para enviar alertas automáticos de pedidos</p>
                      </div>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5",
                      evolutionStatus?.connected
                        ? "bg-emerald-100 text-emerald-700"
                        : evoQr
                        ? "bg-amber-100 text-amber-700"
                        : "bg-zinc-100 text-zinc-600"
                    )}>
                      {evolutionStatus?.connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                      {evolutionStatus?.connected ? 'Conectado' : evoQr ? 'Aguardando QR Code' : 'Desconectado'}
                    </span>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={settings.evolution_enabled === "1"}
                        onChange={e => setSettings({...settings, evolution_enabled: e.target.checked ? "1" : "0"})}
                      />
                      <div className={cn(
                        "w-12 h-6 rounded-full transition-colors",
                        settings.evolution_enabled === "1" ? "bg-emerald-500" : "bg-zinc-200"
                      )} />
                      <div className={cn(
                        "absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        settings.evolution_enabled === "1" ? "translate-x-6" : "translate-x-0"
                      )} />
                    </div>
                    <span className="text-sm font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors">Ativar Notificações Automáticas via WhatsApp</span>
                  </label>

                  <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Nome da Instância</label>
                        <input
                          value={evoInstanceInput}
                          onChange={e => setEvoInstanceInput(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '-'))}
                          className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono"
                          placeholder={`cardapio-${slug}`}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:flex gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={handleConnectEvolution}
                          disabled={evoLoading}
                          className="w-full sm:w-auto justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-normal sm:tracking-wider flex items-center gap-2 disabled:opacity-50 transition-colors text-center"
                        >
                          <QrCode className="w-4 h-4 shrink-0" />
                          <span>{evoLoading ? 'Processando...' : evolutionStatus?.connected ? 'Reconectar / Status' : 'Criar / Gerar QR Code'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={fetchEvolutionStatus}
                          disabled={evoLoading}
                          className="w-full sm:w-auto justify-center bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 px-3 py-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 shrink-0" /> Atualizar
                        </button>
                      </div>
                    </div>

                    {!evolutionStatus?.global_configured && !settings.evolution_api_url && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-xs font-medium">
                        O servidor Evolution API Global ainda não foi configurado pelo SuperAdmin. Caso tenha um servidor próprio, configure abaixo.
                      </div>
                    )}

                    {evoFeedback && (
                      <div className={cn(
                        "px-4 py-3 rounded-xl text-xs font-bold",
                        evoFeedback.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                      )}>
                        {evoFeedback.text}
                      </div>
                    )}

                    {evoQr && !evolutionStatus?.connected && (
                      <div className="bg-white text-zinc-900 border border-emerald-200 rounded-2xl p-6 flex flex-col items-center gap-4 text-center">
                        <p className="text-sm font-bold text-zinc-800">Escaneie no WhatsApp (Aparelhos Conectados &gt; Conectar um aparelho)</p>
                        {evoQr.qrcode_base64 ? (
                          <img
                            src={evoQr.qrcode_base64.startsWith('data:') ? evoQr.qrcode_base64 : `data:image/png;base64,${evoQr.qrcode_base64}`}
                            alt="QR Code WhatsApp"
                            className="w-56 h-56 rounded-xl border border-zinc-200 object-contain"
                          />
                        ) : evoQr.code ? (
                          <div className="p-3 bg-white rounded-xl border border-zinc-200">
                            <QRCodeSVG value={evoQr.code} size={210} />
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500">Aguardando QR Code da Evolution API...</p>
                        )}
                        {evoQr.pairing_code && (
                          <div className="bg-zinc-100 text-zinc-900 px-4 py-2 rounded-xl text-xs">
                            Código de pareamento: <strong className="font-mono text-sm tracking-widest">{evoQr.pairing_code}</strong>
                          </div>
                        )}
                        <p className="text-xs text-zinc-400">Verificando conexão automaticamente a cada 4 segundos...</p>
                      </div>
                    )}

                    {evolutionStatus?.connected && (
                      <div className="grid grid-cols-1 sm:flex sm:flex-wrap gap-2 pt-2">
                        <button
                          type="button"
                          onClick={handleTestEvolution}
                          disabled={evoLoading}
                          className="w-full sm:w-auto justify-center bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0" /> Testar Envio WhatsApp
                        </button>
                        <button
                          type="button"
                          onClick={handleDisconnectEvolution}
                          disabled={evoLoading}
                          className="w-full sm:w-auto justify-center bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2.5 rounded-xl font-bold text-xs transition-colors text-center"
                        >
                          Desconectar Instância
                        </button>
                      </div>
                    )}

                    <div className="pt-2 border-t border-zinc-200">
                      <button
                        type="button"
                        onClick={() => setShowCustomEvo(!showCustomEvo)}
                        className="text-xs font-bold text-zinc-500 hover:text-zinc-800 flex items-center gap-1"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        {showCustomEvo ? 'Ocultar servidor Evolution próprio' : 'Usar servidor Evolution próprio (opcional)'}
                      </button>

                      {showCustomEvo && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">API URL Própria</label>
                            <input 
                              value={settings.evolution_api_url || ''} 
                              onChange={e => setSettings({...settings, evolution_api_url: e.target.value})}
                              className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" 
                              placeholder="https://sua-api.com"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">API Key Própria</label>
                            <input 
                              type="password"
                              value={settings.evolution_api_key || ''} 
                              onChange={e => setSettings({...settings, evolution_api_key: e.target.value})}
                              className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" 
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-zinc-500 uppercase mb-1">Instância Salva</label>
                            <input 
                              value={settings.evolution_instance || ''} 
                              onChange={e => setSettings({...settings, evolution_instance: e.target.value})}
                              className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 border border-zinc-200 p-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" 
                              placeholder={`cardapio-${slug}`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {settingsSavedMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Configurações salvas com sucesso!
                </div>
              )}
              <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100">
                Salvar Alterações
              </button>
            </form>
          </div>
        )}

        {activeTab === 'subscription' && (
          <SubscriptionTab apiFetch={apiFetch} settings={settings} />
        )}

        {activeTab === 'help' && (
          <div className="bg-white text-zinc-900 rounded-3xl border border-zinc-100 shadow-sm p-5 sm:p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <HelpCircle className="text-orange-500" /> Manual do Sistema
            </h2>
            
            <div className="space-y-8 text-zinc-600">
              <section>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">1. Pedidos Online (Delivery, Balcão e WhatsApp Automático)</h3>
                <p>Os clientes acessam o link principal da sua loja e escolhem Delivery (com taxa automática por bairro) ou Retirada no Balcão. Em qualquer plano, você pode conectar seu WhatsApp via QR Code (Evolution API) em Configurações para avisar clientes, cozinha e caixa automaticamente.</p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">2. Pedidos em Mesas (QR Code) — Plano Premium</h3>
                <p>No Plano Premium, cada mesa possui um QR Code exclusivo. Quando o cliente escaneia, o sistema já identifica o número da mesa, abre a comanda e permite imprimir o cupom do pedido.</p>
                <div className="mt-2 bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <p className="text-sm text-orange-800 font-medium">Dica: Imprima os QR Codes da aba "Mesas" e cole-os nas mesas físicas.</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">3. Garçons e Comandas Abertas — Plano Premium</h3>
                <p>No Plano Premium, garçons podem escanear o QR Code da mesa ou lançar pedidos direto no painel, acumulando o consumo em "Comandas" até o fechamento da conta.</p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">4. Gestão de Disponibilidade</h3>
                <p>No painel de "Produtos", basta tocar no interruptor Disponível/Indisponível para pausar um item que acabou. Ele continuará aparecendo no cardápio, mas com o aviso de "Indisponível" e sem permitir compra.</p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">5. Configurações de Entrega</h3>
                <p>Na aba "Taxas de Entrega", você define os bairros que atende. Se um bairro não estiver na lista, o cliente não conseguirá finalizar o pedido de delivery, garantindo que você só receba pedidos de áreas atendidas.</p>
              </section>
            </div>
          </div>
        )}
        <AnimatePresence>
          {isCategoryModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                  setCategoryFormError('');
                }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white text-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-zinc-900">
                    {editingCategory ? 'Renomear Categoria' : 'Nova Categoria'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryModalOpen(false);
                      setEditingCategory(null);
                      setCategoryFormError('');
                    }}
                    className="p-2 hover:bg-zinc-100 rounded-full cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
                  {categoryFormError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{categoryFormError}</span>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Nome da Categoria</label>
                    <input
                      required
                      autoFocus
                      placeholder="Ex: Lanches, Pizzas, Bebidas, Sobremesas"
                      value={categoryData.name}
                      onChange={e => setCategoryData({...categoryData, name: e.target.value})}
                      className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all cursor-pointer">
                    {editingCategory ? 'Salvar Alteração' : 'Adicionar Categoria'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
          {isProductModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsProductModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white text-zinc-900 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
              >
                <div className="p-5 sm:p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white z-10">
                  <h2 className="text-xl font-bold text-zinc-900">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                  <button type="button" onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full cursor-pointer"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleProductSubmit} className="p-5 sm:p-6 space-y-4">
                  {productFormError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{productFormError}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Nome *</label>
                      <input required placeholder="Ex: X-Burger Especial" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Descrição (opcional)</label>
                      <textarea placeholder="Ex: Pão brioche, hambúrguer 180g, cheddar e molho da casa" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 h-20" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Preço (R$) *</label>
                      <input required type="number" step="0.01" min="0" placeholder="29.90" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <label className="block text-sm font-bold text-zinc-700">Categoria</label>
                        <button
                          type="button"
                          onClick={() => setShowInlineCategoryInput(prev => !prev)}
                          className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                        >
                          {showInlineCategoryInput ? 'Fechar' : '+ Nova categoria'}
                        </button>
                      </div>
                      {categories.length > 0 ? (
                        <select
                          value={formData.category_id}
                          onChange={e => setFormData({...formData, category_id: e.target.value})}
                          className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                          Nenhuma categoria ainda. Crie abaixo em 1 clique!
                        </div>
                      )}
                    </div>

                    {(showInlineCategoryInput || categories.length === 0) && (
                      <div className="sm:col-span-2 p-3.5 rounded-2xl bg-orange-50/80 border border-orange-200 space-y-2">
                        <p className="text-xs font-bold text-orange-900">
                          {categories.length === 0
                            ? 'Crie sua primeira categoria agora (já será selecionada automaticamente):'
                            : 'Criar nova categoria sem sair daqui:'}
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={inlineCategoryName}
                            onChange={e => setInlineCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleInlineCreateCategory();
                              }
                            }}
                            placeholder="Ex: Lanches, Pizzas, Bebidas..."
                            className="flex-1 bg-white text-zinc-900 border border-orange-200 px-3 py-2.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            type="button"
                            disabled={inlineCategoryLoading}
                            onClick={handleInlineCreateCategory}
                            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shrink-0 disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            {inlineCategoryLoading ? 'Criando...' : 'Criar'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Imagem do Produto (opcional)</label>
                      <div className="flex gap-2">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                setProductFormError('Imagem muito grande. Máximo 5MB.');
                                return;
                              }
                              const formDataUpload = new FormData();
                              formDataUpload.append('image', file);
                              try {
                                const res = await apiFetch('/upload/product', {
                                  method: 'POST',
                                  body: formDataUpload
                                });
                                const data = await res.json();
                                if (data.image_url) {
                                  setFormData(prev => ({...prev, image_url: data.image_url}));
                                }
                              } catch {
                                setProductFormError('Erro ao fazer upload da imagem.');
                              }
                            }
                          }}
                          className="w-full flex-1 bg-zinc-50 border border-zinc-200 p-2.5 sm:p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-xs sm:text-sm file:mr-2 sm:file:mr-4 file:py-1 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs sm:file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                      </div>
                      {formData.image_url && (
                        <div className="mt-2">
                          <img src={formData.image_url} alt="Preview" className="w-20 h-20 object-cover rounded-xl" />
                          <button type="button" onClick={() => setFormData({...formData, image_url: ''})} className="text-xs text-red-500 mt-1 cursor-pointer">Remover imagem</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={productSubmitting}
                    className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {productSubmitting ? 'Salvando...' : editingProduct ? 'Salvar Alterações' : 'Salvar Produto'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {isNeighborhoodModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsNeighborhoodModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white text-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-zinc-900">Novo Bairro</h2>
                  <button onClick={() => setIsNeighborhoodModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleNeighborhoodSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Nome do Bairro</label>
                    <input required value={neighborhoodData.name} onChange={e => setNeighborhoodData({...neighborhoodData, name: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Taxa de Entrega (R$)</label>
                    <input required type="number" step="0.01" value={neighborhoodData.delivery_fee} onChange={e => setNeighborhoodData({...neighborhoodData, delivery_fee: e.target.value})} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all">Adicionar Bairro</button>
                </form>
              </motion.div>
            </div>
          )}

          {isTableModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsTableModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white text-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-zinc-900">Nova Mesa</h2>
                  <button onClick={() => setIsTableModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleTableSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Número da Mesa</label>
                    <input required type="number" value={tableNumber} onChange={e => setTableNumber(e.target.value)} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all">Adicionar Mesa</button>
                </form>
              </motion.div>
            </div>
          )}

          {isPrintViewOpen && (
            <div className="fixed inset-0 z-[150] bg-white text-zinc-900 overflow-y-auto p-4 sm:p-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-8 print:hidden">
                  <h2 className="text-xl sm:text-2xl font-bold">QR Codes das Mesas</h2>
                  <div className="flex flex-wrap gap-2 sm:gap-4 w-full sm:w-auto">
                    <button onClick={() => window.print()} className="flex-1 sm:flex-none justify-center bg-zinc-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2">
                      <Download className="w-4 h-4 sm:w-5 sm:h-5" /> Imprimir
                    </button>
                    <button onClick={() => setIsPrintViewOpen(false)} className="flex-1 sm:flex-none justify-center bg-zinc-100 text-zinc-600 px-5 py-2.5 rounded-xl font-bold text-sm">
                      Fechar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
                  {tables.map(table => (
                    <div key={table.id} className="border-2 border-zinc-200 p-5 sm:p-6 rounded-3xl flex flex-col items-center gap-4 text-center">
                      <div className="bg-orange-500 p-3 rounded-2xl mb-2">
                        <ChefHat className="text-white w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-zinc-900">MESA {table.number}</h3>
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Escaneie para pedir</p>
                      </div>
                      <div className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                        <QRCodeSVG value={`${window.location.origin}/e/${slug}?mesa=${table.number}`} size={180} />
                      </div>
                      <p className="text-zinc-400 text-[10px] font-mono break-all">{window.location.origin}/e/{slug}?mesa=${table.number}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isCommandModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsCommandModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
                className="relative bg-white text-zinc-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-zinc-900">Abrir Nova Comanda</h2>
                  <button type="button" onClick={() => setIsCommandModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    await apiFetch('/commands', {
                      method: 'POST',
                      body: JSON.stringify({
                        table_id: commandForm.mode === 'table' && commandForm.table_id ? parseInt(commandForm.table_id) : null,
                        waiter_name: commandForm.waiter_name || (commandForm.mode === 'pickup' ? 'Balcão' : 'Atendimento')
                      })
                    });
                    setIsCommandModalOpen(false);
                    apiFetch('/commands').then(res => res.json()).then(setCommands);
                  }}
                  className="p-6 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCommandForm({ ...commandForm, mode: 'table' })}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-bold uppercase transition-colors",
                        commandForm.mode === 'table' ? "bg-orange-500 text-white border-orange-500" : "bg-zinc-50 border-zinc-200 text-zinc-600"
                      )}
                    >
                      Mesa
                    </button>
                    <button
                      type="button"
                      onClick={() => setCommandForm({ ...commandForm, mode: 'pickup' })}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-bold uppercase transition-colors",
                        commandForm.mode === 'pickup' ? "bg-orange-500 text-white border-orange-500" : "bg-zinc-50 border-zinc-200 text-zinc-600"
                      )}
                    >
                      Balcão
                    </button>
                  </div>
                  {commandForm.mode === 'table' && (
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Mesa</label>
                      <select
                        required
                        value={commandForm.table_id}
                        onChange={e => setCommandForm({ ...commandForm, table_id: e.target.value })}
                        className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">Selecione a mesa</option>
                        {tables.map(t => (
                          <option key={t.id} value={t.id}>Mesa {t.number}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Cliente ou Garçom</label>
                    <input
                      value={commandForm.waiter_name}
                      onChange={e => setCommandForm({ ...commandForm, waiter_name: e.target.value })}
                      className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder={commandForm.mode === 'pickup' ? 'Ex: Balcão - Maria' : 'Ex: Garçom João'}
                    />
                  </div>
                  <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-colors">
                    Abrir Comanda
                  </button>
                </form>
              </motion.div>
            </div>
          )}

          {isCounterOrderModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsCounterOrderModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
                className="relative bg-white text-zinc-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
              >
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white z-10">
                  <div>
                    <h2 className="text-xl font-bold text-zinc-900">Novo Pedido Balcão / Mesa</h2>
                    <p className="text-xs text-zinc-500">Lance pedidos presenciais diretamente pelo caixa</p>
                  </div>
                  <button type="button" onClick={() => setIsCounterOrderModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const selectedList = products
                      .filter(p => (counterItems[p.id] || 0) > 0)
                      .map(p => ({ product: p, qty: counterItems[p.id] }));
                    if (selectedList.length === 0) return;

                    const orderTotal = selectedList.reduce((acc, item) => acc + (parseFloat(String(item.product.price)) || 0) * item.qty, 0);
                    const itemsText = selectedList.map(item => `${item.qty}x ${item.product.name} - R$ ${((parseFloat(String(item.product.price)) || 0) * item.qty).toFixed(2)}`).join('\n');
                    const chosenTable = counterMode === 'table' ? tables.find(t => String(t.id) === String(counterTableId)) : null;

                    setCounterSubmitting(true);
                    try {
                      const res = await apiFetch('/orders', {
                        method: 'POST',
                        body: JSON.stringify({
                          customer_name: counterMode === 'table' && chosenTable ? `Mesa ${chosenTable.number}` : (counterCustomer || 'Balcão'),
                          customer_phone: counterPhone ? counterPhone.replace(/\D/g, '') : null,
                          total: orderTotal,
                          delivery_fee: 0,
                          payment_method: counterPayment,
                          items_text: itemsText,
                          type: counterMode === 'table' ? 'table' : 'pickup'
                        })
                      });
                      const createdOrder = await res.json();
                      if (res.ok && createdOrder?.id) {
                        if (counterMarkPaid && counterPayment !== 'infinitepay') {
                          await apiFetch(`/orders/${createdOrder.id}/confirm-payment`, {
                            method: 'PUT',
                            body: JSON.stringify({ notes: 'Pago no balcão/caixa' })
                          });
                        }
                        if (counterMode === 'table' && chosenTable) {
                          const hasOpenCmd = commands.some(c => Number(c.table_id) === Number(chosenTable.id));
                          if (!hasOpenCmd) {
                            await apiFetch('/commands', {
                              method: 'POST',
                              body: JSON.stringify({ table_id: chosenTable.id, waiter_name: counterCustomer || 'Caixa / Balcão' })
                            });
                          }
                        }
                        setIsCounterOrderModalOpen(false);
                        setCounterItems({});
                        apiFetch('/orders').then(r => r.json()).then(setOrders);
                        apiFetch('/commands').then(r => r.json()).then(setCommands);
                        apiFetch('/customers').then(r => r.ok ? r.json() : []).then(data => setCustomers(Array.isArray(data) ? data : [])).catch(() => {});
                      }
                    } finally {
                      setCounterSubmitting(false);
                    }
                  }}
                  className="p-6 space-y-5"
                >
                  {hasTablesAndPrint ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCounterMode('pickup')}
                        className={cn(
                          "p-3 rounded-xl border text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors",
                          counterMode === 'pickup' ? "bg-orange-500 text-white border-orange-500" : "bg-zinc-50 border-zinc-200 text-zinc-600"
                        )}
                      >
                        <Store className="w-4 h-4" /> Balcão / Retirada
                      </button>
                      <button
                        type="button"
                        onClick={() => setCounterMode('table')}
                        className={cn(
                          "p-3 rounded-xl border text-xs font-bold uppercase flex items-center justify-center gap-2 transition-colors",
                          counterMode === 'table' ? "bg-orange-500 text-white border-orange-500" : "bg-zinc-50 border-zinc-200 text-zinc-600"
                        )}
                      >
                        <QrCode className="w-4 h-4" /> Mesa
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-xs font-semibold text-orange-800 flex items-center justify-between gap-2">
                      <span>Lançamento presencial no Balcão / Retirada</span>
                      <span className="text-[11px] text-amber-700">Pedidos na Mesa: Premium</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {counterMode === 'table' ? (
                      <div>
                        <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">Mesa *</label>
                        <select
                          required
                          value={counterTableId}
                          onChange={e => setCounterTableId(e.target.value)}
                          className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="">Selecione a mesa</option>
                          {tables.map(t => (
                            <option key={t.id} value={t.id}>Mesa {t.number}</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">Nome do Cliente</label>
                        <input
                          value={counterCustomer}
                          onChange={e => setCounterCustomer(e.target.value)}
                          className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder="Ex: Carlos (Balcão)"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">WhatsApp (opcional)</label>
                      <input
                        value={counterPhone}
                        onChange={e => setCounterPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                        placeholder="11999999999"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-600 uppercase mb-2">Selecione os Produtos</label>
                    <div className="border border-zinc-200 rounded-2xl divide-y divide-zinc-100 max-h-60 overflow-y-auto">
                      {products.filter(p => p.is_available).map(product => {
                        const qty = counterItems[product.id] || 0;
                        return (
                          <div key={product.id} className="p-3 flex items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-sm text-zinc-900">{product.name}</p>
                              <p className="text-xs text-orange-600 font-bold">R$ {(parseFloat(String(product.price)) || 0).toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setCounterItems(prev => ({ ...prev, [product.id]: Math.max(0, (prev[product.id] || 0) - 1) }))}
                                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center font-bold"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-sm font-bold">{qty}</span>
                              <button
                                type="button"
                                onClick={() => setCounterItems(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }))}
                                className="w-8 h-8 rounded-lg bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center font-bold"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    <div>
                      <label className="block text-xs font-bold text-zinc-600 uppercase mb-1">Pagamento</label>
                      <select
                        value={counterPayment}
                        onChange={e => {
                          const val = e.target.value as any;
                          setCounterPayment(val);
                          if (val === 'comanda') setCounterMarkPaid(false);
                        }}
                        className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {counterMode === 'table' && <option value="comanda">Adicionar à Comanda (pagar ao fechar)</option>}
                        <option value="balcao">Dinheiro / Cartão no Balcão</option>
                        <option value="pix">PIX</option>
                        {settings.infinitepay_enabled === '1' && <option value="infinitepay">Link InfinitePay</option>}
                      </select>
                    </div>
                    {counterPayment !== 'infinitepay' && counterPayment !== 'comanda' && (
                      <label className="flex items-center gap-2.5 text-sm font-medium text-zinc-700 pt-5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={counterMarkPaid}
                          onChange={e => setCounterMarkPaid(e.target.checked)}
                          className="w-4 h-4 accent-orange-500"
                        />
                        Já recebido no caixa
                      </label>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-zinc-200">
                    <div>
                      <span className="text-xs text-zinc-500 uppercase font-bold block">Total do Pedido</span>
                      <span className="text-2xl font-black text-orange-600">
                        R$ {products.reduce((acc, p) => acc + (parseFloat(String(p.price)) || 0) * (counterItems[p.id] || 0), 0).toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="submit"
                      disabled={counterSubmitting || Object.values(counterItems).every(q => q === 0)}
                      className="w-full sm:w-auto justify-center bg-orange-500 hover:bg-orange-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                    >
                      {counterSubmitting ? 'Lançando...' : 'Confirmar Lançamento'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {selectedCustomer && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedCustomer(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
                className="relative bg-white text-zinc-900 w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
              >
                <div className="p-5 sm:p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white z-10">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-zinc-900 truncate">{selectedCustomer.name || 'Cliente'}</h2>
                    <p className="text-xs text-zinc-500 font-mono">{selectedCustomer.phone}</p>
                  </div>
                  <button type="button" onClick={() => setSelectedCustomer(null)} className="p-2 hover:bg-zinc-100 rounded-full shrink-0"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 sm:p-6 space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100">
                      <p className="text-[11px] font-bold text-zinc-500 uppercase">Pedidos</p>
                      <p className="text-xl font-black text-zinc-900">{selectedCustomer.total_orders || 0}</p>
                    </div>
                    <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100">
                      <p className="text-[11px] font-bold text-zinc-500 uppercase">Total Gasto</p>
                      <p className="text-xl font-black text-orange-600">R$ {(parseFloat(selectedCustomer.total_spent) || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  {(selectedCustomer.address || selectedCustomer.neighborhood_name || selectedCustomer.email) && (
                    <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-1.5 text-sm">
                      {selectedCustomer.email && <p className="text-zinc-600"><strong className="text-zinc-900">E-mail:</strong> {selectedCustomer.email}</p>}
                      {selectedCustomer.address && (
                        <p className="text-zinc-600 break-words">
                          <strong className="text-zinc-900">Endereço:</strong> {selectedCustomer.address}{selectedCustomer.address_number ? `, ${selectedCustomer.address_number}` : ''}
                          {selectedCustomer.address_complement ? ` (${selectedCustomer.address_complement})` : ''}
                        </p>
                      )}
                      {selectedCustomer.neighborhood_name && <p className="text-zinc-600"><strong className="text-zinc-900">Bairro:</strong> {selectedCustomer.neighborhood_name}</p>}
                      {selectedCustomer.address_reference && <p className="text-zinc-600"><strong className="text-zinc-900">Referência:</strong> {selectedCustomer.address_reference}</p>}
                    </div>
                  )}

                  {(() => {
                    const phoneDigits = String(selectedCustomer.phone || '').replace(/\D/g, '');
                    const waNumber = phoneDigits.startsWith('55') ? phoneDigits : (phoneDigits.length >= 10 ? `55${phoneDigits}` : phoneDigits);
                    return waNumber ? (
                      <a
                        href={`https://wa.me/${waNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> Conversar no WhatsApp
                      </a>
                    ) : null;
                  })()}

                  <div>
                    <h3 className="font-bold text-zinc-900 text-sm uppercase tracking-wider mb-3">Últimos Pedidos</h3>
                    {(!selectedCustomer.recent_orders || selectedCustomer.recent_orders.length === 0) ? (
                      <p className="text-sm text-zinc-400">Nenhum pedido registrado para este cliente ainda.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {selectedCustomer.recent_orders.map((ord: any) => (
                          <div key={ord.id} className="p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-zinc-900">Pedido #{ord.id} · {ord.type === 'table' ? 'Mesa' : ord.type === 'pickup' ? 'Balcão' : 'Delivery'}</span>
                              <span className="text-zinc-500">{new Date(ord.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            {ord.items_text && <p className="text-xs text-zinc-600 whitespace-pre-wrap">{ord.items_text}</p>}
                            <div className="flex justify-between items-center pt-1 text-xs">
                              <span className="uppercase font-bold text-zinc-500">{ord.payment_method}</span>
                              <span className="font-black text-orange-600">R$ {(parseFloat(ord.total) || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {isCustomerModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsCustomerModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
                className="relative bg-white text-zinc-900 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
              >
                <div className="p-5 sm:p-6 border-b border-zinc-100 flex justify-between items-center sticky top-0 bg-white z-10">
                  <h2 className="text-xl font-bold text-zinc-900">Novo Cliente</h2>
                  <button type="button" onClick={() => setIsCustomerModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setCustomerFormError('');
                    const res = await apiFetch('/customers', {
                      method: 'POST',
                      body: JSON.stringify(customerForm)
                    });
                    const data = await res.json();
                    if (!res.ok) {
                      setCustomerFormError(data.error || 'Erro ao cadastrar cliente.');
                      return;
                    }
                    setIsCustomerModalOpen(false);
                    apiFetch('/customers').then(r => r.json()).then(setCustomers);
                  }}
                  className="p-5 sm:p-6 space-y-4"
                >
                  {customerFormError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
                      {customerFormError}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Nome *</label>
                    <input required value={customerForm.name} onChange={e => setCustomerForm({ ...customerForm, name: e.target.value })} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="Nome do cliente" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">WhatsApp / Telefone *</label>
                    <input required value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value.replace(/\D/g, '') })} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="11999999999" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">E-mail (opcional)</label>
                    <input type="email" value={customerForm.email} onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="cliente@email.com" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Endereço (opcional)</label>
                      <input value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="Rua / Avenida" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Número</label>
                      <input value={customerForm.address_number} onChange={e => setCustomerForm({ ...customerForm, address_number: e.target.value })} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="123" />
                    </div>
                  </div>
                  {neighborhoods.length > 0 && (
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Bairro (opcional)</label>
                      <select value={customerForm.neighborhood_id} onChange={e => setCustomerForm({ ...customerForm, neighborhood_id: e.target.value })} className="w-full bg-zinc-50 text-zinc-900 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                        <option value="">Selecione...</option>
                        {neighborhoods.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                      </select>
                    </div>
                  )}
                  <button type="submit" className="w-full bg-orange-500 text-white py-3.5 rounded-xl font-bold hover:bg-orange-600 transition-colors">
                    Salvar Cliente
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- App ---

// --- SaaS Components ---

// LandingPage imported from ./components/LandingPage

const SuperAdmin = () => {
  useSeoMeta({
    title: 'SuperAdmin | MaisQueCardapio',
    description: 'Gerenciamento administrativo da plataforma MaisQueCardapio.',
    canonicalPath: '/superadmin',
    robots: 'noindex, nofollow'
  });
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isEstModalOpen, setIsEstModalOpen] = useState(false);
  const [isNewEstModalOpen, setIsNewEstModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editingEst, setEditingEst] = useState<any>(null);
  const [isSuperLoggedIn, setIsSuperLoggedIn] = useState(false);
  const [superUsername, setSuperUsername] = useState('');
  const [superPassword, setSuperPassword] = useState('');
  const [authToken, setAuthToken] = useState<string>('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [planForm, setPlanForm] = useState({
    name: '',
    price: '',
    max_products: '',
    enable_ai: false,
    enable_reservations: false,
    enable_automation: true,
    enable_tables: false
  });
  const [estForm, setEstForm] = useState({
    plan_id: '',
    status: ''
  });
  const [newEstForm, setNewEstForm] = useState({
    name: '',
    slug: '',
    owner_whatsapp: '',
    password: '',
    plan_id: '',
    status: 'active'
  });
  const [payments, setPayments] = useState<any[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'pending' | 'confirmed' | 'rejected' | 'all'>('pending');
  const [superTab, setSuperTab] = useState<'overview' | 'payments' | 'plans' | 'settings' | 'divulgacao'>('overview');
  const [platformSettings, setPlatformSettings] = useState<any>({
    contractor_payment_mode: 'both',
    platform_pix_key: '',
    platform_pix_name: 'MaisQueCardapio',
    platform_support_whatsapp: '',
    infinitepay_enabled: '0',
    infinitepay_handle: '',
    infinitepay_api_key: '',
    has_infinitepay_api_key: false,
    evolution_global_url: '',
    evolution_global_key: '',
    has_evolution_global_key: false,
    evolution_allow_tenant_instances: '1',
    superadmin_evolution_instance: 'superadmin-maisquecardapio',
    superadmin_notify_whatsapp: '',
    superadmin_notify_new_signup: '1',
    superadmin_notify_payment: '1',
    superadmin_notify_renewal: '1',
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [saEvoStatus, setSaEvoStatus] = useState<any>(null);
  const [saEvoQr, setSaEvoQr] = useState<any>(null);
  const [saEvoLoading, setSaEvoLoading] = useState(false);
  const [saEvoFeedback, setSaEvoFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [renewalLoading, setRenewalLoading] = useState(false);
  const [renewalResult, setRenewalResult] = useState<any>(null);
  const [paymentActionMsg, setPaymentActionMsg] = useState<string | null>(null);

  const fetchPayments = async (token: string, status = paymentStatusFilter) => {
    setPaymentsLoading(true);
    try {
      const res = await window.fetch(`/api/superadmin/payments?status=${status}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erro ao buscar pagamentos:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const fetchPlatformSettings = async (token: string) => {
    try {
      const res = await window.fetch('/api/superadmin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPlatformSettings((prev: any) => ({
          ...prev,
          ...data,
          evolution_global_key: '',
          infinitepay_api_key: ''
        }));
      }
    } catch (err) {
      console.error('Erro ao carregar configurações globais:', err);
    }
  };

  const fetchSaEvolutionStatus = async (token = authToken) => {
    if (!token) return;
    try {
      const res = await window.fetch('/api/superadmin/evolution/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSaEvoStatus(data);
        if (data.connected) setSaEvoQr(null);
      }
    } catch (err) {
      console.error('Erro ao buscar status Evolution SuperAdmin:', err);
    }
  };

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    setSettingsFeedback(null);
    try {
      const res = await window.fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(platformSettings)
      });
      const data = await res.json();
      if (res.ok) {
        setSettingsFeedback({ type: 'success', text: data.message || 'Configurações globais salvas!' });
        await fetchPlatformSettings(authToken);
        await fetchSaEvolutionStatus(authToken);
      } else {
        setSettingsFeedback({ type: 'error', text: data.error || 'Erro ao salvar configurações.' });
      }
    } catch {
      setSettingsFeedback({ type: 'error', text: 'Erro de comunicação com o servidor.' });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleConnectSaEvolution = async () => {
    setSaEvoLoading(true);
    setSaEvoFeedback(null);
    try {
      // Salvar configurações antes se usuário acabou de digitar
      await window.fetch('/api/superadmin/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(platformSettings)
      });

      const res = await window.fetch('/api/superadmin/evolution/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ instanceName: platformSettings.superadmin_evolution_instance || 'superadmin-maisquecardapio' })
      });
      const data = await res.json();
      if (!res.ok) {
        setSaEvoFeedback({ type: 'error', text: data.error || 'Erro ao conectar instância SuperAdmin.' });
      } else {
        if (data.connected) {
          setSaEvoQr(null);
          setSaEvoFeedback({ type: 'success', text: `Instância "${data.instance}" conectada!` });
        } else {
          setSaEvoQr(data);
          setSaEvoFeedback({ type: 'success', text: 'QR Code gerado! Escaneie com seu WhatsApp.' });
        }
        await fetchSaEvolutionStatus(authToken);
      }
    } catch {
      setSaEvoFeedback({ type: 'error', text: 'Erro ao conectar Evolution API.' });
    } finally {
      setSaEvoLoading(false);
    }
  };

  const handleDisconnectSaEvolution = async () => {
    setSaEvoLoading(true);
    setSaEvoFeedback(null);
    try {
      await window.fetch('/api/superadmin/evolution/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      setSaEvoQr(null);
      setSaEvoFeedback({ type: 'success', text: 'Instância SuperAdmin desconectada.' });
      await fetchSaEvolutionStatus(authToken);
    } finally {
      setSaEvoLoading(false);
    }
  };

  const handleTestSaEvolution = async () => {
    setSaEvoLoading(true);
    setSaEvoFeedback(null);
    try {
      const res = await window.fetch('/api/superadmin/evolution/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone: platformSettings.superadmin_notify_whatsapp })
      });
      const data = await res.json();
      if (res.ok) {
        setSaEvoFeedback({ type: 'success', text: data.message || 'Notificação de teste enviada!' });
      } else {
        setSaEvoFeedback({ type: 'error', text: data.error || 'Erro ao enviar notificação de teste.' });
      }
    } finally {
      setSaEvoLoading(false);
    }
  };

  const handleCheckRenewalsNow = async () => {
    setRenewalLoading(true);
    setRenewalResult(null);
    try {
      const res = await window.fetch('/api/superadmin/cron/check-renewals', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      setRenewalResult(data);
    } catch {
      setRenewalResult({ error: 'Erro ao verificar renovações' });
    } finally {
      setRenewalLoading(false);
    }
  };

  const handleConfirmPayment = async (paymentId: number) => {
    try {
      const res = await window.fetch(`/api/superadmin/payments/${paymentId}/confirm`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setPaymentActionMsg(`Pagamento #${paymentId} confirmado e cliente notificado!`);
        fetchPayments(authToken, paymentStatusFilter);
        fetchData(authToken);
      } else {
        setPaymentActionMsg(data.error || 'Erro ao confirmar pagamento');
      }
    } catch {
      setPaymentActionMsg('Erro ao confirmar pagamento');
    }
  };

  const handleRejectPayment = async (paymentId: number) => {
    try {
      const res = await window.fetch(`/api/superadmin/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (data.success) {
        setPaymentActionMsg(`Pagamento #${paymentId} marcado como rejeitado.`);
        fetchPayments(authToken, paymentStatusFilter);
      } else {
        setPaymentActionMsg(data.error || 'Erro ao rejeitar pagamento');
      }
    } catch {
      setPaymentActionMsg('Erro ao rejeitar pagamento');
    }
  };

  const fetchData = async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const [estsRes, plansRes] = await Promise.all([
        window.fetch('/api/superadmin/establishments', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        window.fetch('/api/superadmin/plans', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      if (!estsRes.ok || !plansRes.ok) {
        throw new Error('Falha ao carregar dados. Verifique suas permissões.');
      }
      
      const ests = await estsRes.json();
      const plansData = await plansRes.json();
      
      setEstablishments(ests);
      setPlans(plansData);
    } catch (err: any) {
      console.error('Erro ao buscar dados:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperLoggedIn && authToken) {
      fetchData(authToken);
      fetchPayments(authToken, paymentStatusFilter);
      fetchPlatformSettings(authToken);
      fetchSaEvolutionStatus(authToken);
    }
  }, [isSuperLoggedIn, authToken]);

  useEffect(() => {
    if (isSuperLoggedIn && authToken) {
      fetchPayments(authToken, paymentStatusFilter);
    }
  }, [paymentStatusFilter]);

  useEffect(() => {
    if (!isSuperLoggedIn || !authToken || !saEvoQr || saEvoStatus?.connected) return;
    const interval = setInterval(() => {
      fetchSaEvolutionStatus(authToken);
    }, 4000);
    return () => clearInterval(interval);
  }, [isSuperLoggedIn, authToken, saEvoQr, saEvoStatus?.connected]);

  const handleSuperLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    
    try {
      const res = await window.fetch('/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: superUsername, password: superPassword })
      });
      
      const data = await res.json();
      
      if (res.ok && data.token) {
        setAuthToken(data.token);
        setIsSuperLoggedIn(true);
      } else {
        setLoginError(data.error || 'Credenciais inválidas');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setLoginError('Erro de conexão. Tente novamente.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingPlan ? `/api/superadmin/plans/${editingPlan.id}` : '/api/superadmin/plans';
    const method = editingPlan ? 'PUT' : 'POST';
    
    await window.fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        ...planForm,
        price: parseFloat(planForm.price),
        max_products: parseInt(planForm.max_products),
        enable_ai: planForm.enable_ai ? 1 : 0,
        enable_reservations: planForm.enable_reservations ? 1 : 0,
        enable_automation: planForm.enable_automation ? 1 : 0,
        enable_tables: planForm.enable_tables ? 1 : 0
      })
    });

    setIsPlanModalOpen(false);
    setEditingPlan(null);
    setPlanForm({
      name: '',
      price: '',
      max_products: '',
      enable_ai: false,
      enable_reservations: false,
      enable_automation: true,
      enable_tables: false
    });
    fetchData(authToken);
  };

  const deletePlan = async (id: number) => {
    if (!confirm('Deletar plano?')) return;
    await window.fetch(`/api/superadmin/plans/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    fetchData(authToken);
  };

  const handleEstSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await window.fetch(`/api/superadmin/establishments/${editingEst.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        plan_id: parseInt(estForm.plan_id),
        status: estForm.status
      })
    });
    setIsEstModalOpen(false);
    fetchData(authToken);
  };

  const handleNewEstSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await window.fetch('/api/superadmin/establishments', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(newEstForm)
    });
    if (res.ok) {
      setIsNewEstModalOpen(false);
      fetchData(authToken);
    } else {
      const data = await res.json();
      alert(data.error || 'Erro ao criar estabelecimento');
    }
  };

  const deleteEst = async (id: number) => {
    if (!confirm('Deletar estabelecimento permanentemente?')) return;
    await window.fetch(`/api/superadmin/establishments/${id}`, { 
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    fetchData(authToken);
  };

  if (!isSuperLoggedIn) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-surface p-8 rounded-[32px] border border-zinc-800 w-full max-w-md shadow-2xl"
        >
          <div className="flex flex-col items-center mb-8">
            <div className="bg-brand-accent p-3 rounded-2xl mb-4 shadow-lg shadow-brand-accent/20">
              <ShieldCheck className="w-8 h-8 text-brand-bg" />
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-white">SuperAdmin</h1>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Acesso Restrito</p>
          </div>
          <form onSubmit={handleSuperLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Usuário</label>
              <input 
                type="text" 
                value={superUsername} 
                onChange={e => setSuperUsername(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent text-white transition-all" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Senha</label>
              <input 
                type="password" 
                value={superPassword} 
                onChange={e => setSuperPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent text-white transition-all" 
              />
            </div>
            {loginError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-2xl text-sm font-bold">
                {loginError}
              </div>
            )}
            <button 
              type="submit"
              disabled={loginLoading}
              className="w-full bg-brand-accent text-brand-bg py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loginLoading ? 'Entrando...' : 'Acessar Painel'}
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white font-black uppercase tracking-widest">Carregando painel mestre...</div>;

  if (error) return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
      <div className="text-red-500 font-black uppercase tracking-widest mb-4">Erro: {error}</div>
      <button 
        onClick={() => fetchData(authToken)}
        className="bg-brand-accent text-brand-bg px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs"
      >
        Tentar Novamente
      </button>
    </div>
  );

  const infinitePayWebhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhook/infinitepay` : '/api/webhook/infinitepay';

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      <nav className="bg-brand-bg/80 backdrop-blur-md border-b border-zinc-900 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-brand-accent p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-brand-bg" />
            </div>
            <span className="font-black uppercase tracking-tighter text-xl">SuperAdmin</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            {[
              { id: 'overview', label: 'Clientes' },
              { id: 'payments', label: 'Pagamentos' },
              { id: 'plans', label: 'Planos' },
              { id: 'divulgacao', label: 'Divulgação' },
              { id: 'settings', label: 'Configurações Globais' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSuperTab(tab.id as any)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-normal sm:tracking-widest transition-all",
                  superTab === tab.id
                    ? "bg-brand-accent text-brand-bg"
                    : "bg-zinc-900 text-zinc-400 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button 
            onClick={() => { setIsSuperLoggedIn(false); }}
            className="px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-black uppercase tracking-normal sm:tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
          >
            Sair
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 sm:space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-brand-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-800">
            <p className="text-[11px] sm:text-xs text-zinc-500 uppercase font-black tracking-widest mb-1">Total Lojas</p>
            <p className="text-2xl sm:text-4xl font-black">{establishments.length}</p>
          </div>
          <div className="bg-brand-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-800">
            <p className="text-[11px] sm:text-xs text-zinc-500 uppercase font-black tracking-widest mb-1">Planos Ativos</p>
            <p className="text-2xl sm:text-4xl font-black">{plans.length}</p>
          </div>
          <div className="bg-brand-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-800">
            <p className="text-[11px] sm:text-xs text-zinc-500 uppercase font-black tracking-widest mb-1">Pagamentos Listados</p>
            <p className="text-2xl sm:text-4xl font-black text-orange-500">{payments.length}</p>
          </div>
          <div className="bg-brand-surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-zinc-800">
            <p className="text-[11px] sm:text-xs text-zinc-500 uppercase font-black tracking-widest mb-1">WhatsApp SuperAdmin</p>
            <p className={cn("text-sm sm:text-lg font-black mt-2", saEvoStatus?.connected ? "text-emerald-400" : "text-zinc-400")}>
              {saEvoStatus?.connected ? 'Conectado' : 'Desconectado'}
            </p>
          </div>
        </div>

        {superTab === 'divulgacao' && (
          <PromoKitSection />
        )}

        {(superTab === 'overview' || superTab === 'payments') && (
          <section>
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter flex items-center gap-2.5 sm:gap-3">
                <DollarSign className="text-orange-500 shrink-0" /> Pagamentos de Contratantes
              </h2>
              <div className="flex flex-wrap gap-2">
                {(['pending', 'confirmed', 'rejected', 'all'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setPaymentStatusFilter(st)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-xs font-bold uppercase",
                      paymentStatusFilter === st ? "bg-orange-500 text-white" : "bg-zinc-900 text-zinc-400 hover:text-white"
                    )}
                  >
                    {st === 'pending' ? 'Pendentes' : st === 'confirmed' ? 'Confirmados' : st === 'rejected' ? 'Rejeitados' : 'Todos'}
                  </button>
                ))}
              </div>
            </div>

            {paymentActionMsg && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-2xl text-sm font-bold">
                {paymentActionMsg}
              </div>
            )}

            {paymentsLoading ? (
              <div className="bg-brand-surface rounded-3xl border border-zinc-800 p-8 text-zinc-400">Carregando pagamentos...</div>
            ) : payments.length === 0 ? (
              <div className="bg-brand-surface rounded-3xl border border-zinc-800 p-8 text-zinc-500 text-sm">Nenhum pagamento encontrado para o filtro selecionado.</div>
            ) : (
              <div className="bg-brand-surface rounded-[32px] border border-zinc-800 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Estabelecimento</th>
                      <th className="px-6 py-4">Método</th>
                      <th className="px-6 py-4">Valor</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {payments.map(pay => (
                      <tr key={pay.id} className="hover:bg-zinc-900/50 transition-colors">
                        <td className="px-6 py-4 font-bold">#{pay.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-bold">{pay.establishment_name || establishments.find(e => e.id === pay.establishment_id)?.name || `ID: ${pay.establishment_id}`}</div>
                          {pay.external_id && <div className="text-xs text-zinc-500 font-mono">{pay.external_id}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase",
                            pay.payment_method === 'infinitepay' ? "bg-emerald-500/15 text-emerald-400" : "bg-orange-500/15 text-orange-400"
                          )}>
                            {pay.payment_method === 'infinitepay' ? 'InfinitePay' : 'PIX'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-orange-500 font-bold">R$ {parseFloat(pay.amount).toFixed(2)}</td>
                        <td className="px-6 py-4 text-xs font-bold uppercase text-zinc-300">{pay.status}</td>
                        <td className="px-6 py-4 text-zinc-500">{pay.created_at ? new Date(pay.created_at).toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="px-6 py-4 text-right">
                          {pay.status === 'pending' ? (
                            <div className="flex gap-2 justify-end">
                              <button 
                                onClick={() => handleConfirmPayment(pay.id)}
                                className="px-4 py-2 bg-green-500/10 text-green-500 rounded-xl font-bold text-xs hover:bg-green-500/20 transition-colors"
                              >
                                Confirmar
                              </button>
                              <button 
                                onClick={() => handleRejectPayment(pay.id)}
                                className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl font-bold text-xs hover:bg-red-500/20 transition-colors"
                              >
                                Rejeitar
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-zinc-500">{pay.confirmed_by || '-'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {superTab === 'overview' && (
          <section>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Estabelecimentos</h2>
              <button 
                onClick={() => {
                  setEditingEst(null);
                  setNewEstForm({ name: '', slug: '', owner_whatsapp: '', password: '', plan_id: '', status: 'active' });
                  setIsNewEstModalOpen(true);
                }}
                className="w-full sm:w-auto justify-center bg-brand-accent text-brand-bg px-5 sm:px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-accent/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4 shrink-0" /> Novo Estabelecimento
              </button>
            </div>
            <div className="bg-brand-surface rounded-[32px] border border-zinc-800 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800">
                    <th className="px-6 py-4">Nome</th>
                    <th className="px-6 py-4">Slug</th>
                    <th className="px-6 py-4">Plano</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {establishments.map(est => (
                    <tr key={est.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4 font-bold uppercase tracking-tight">{est.name}</td>
                      <td className="px-6 py-4 text-zinc-500 text-sm">/e/{est.slug}</td>
                      <td className="px-6 py-4">
                        <span className="bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-brand-accent/20">
                          {est.plan_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          est.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                        )}>
                          {est.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-3 justify-end items-center">
                          <button 
                            onClick={() => {
                              setEditingEst(est);
                              setEstForm({ plan_id: est.plan_id.toString(), status: est.status });
                              setIsEstModalOpen(true);
                            }}
                            className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteEst(est.id)} className="p-2 bg-zinc-800 rounded-xl hover:bg-red-500/20 text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {(superTab === 'overview' || superTab === 'plans') && (
          <section>
            <div className="flex flex-wrap justify-between items-center gap-3 mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Planos</h2>
              <button 
                onClick={() => {
                  setEditingPlan(null);
                  setPlanForm({ name: '', price: '', max_products: '', enable_ai: false, enable_reservations: false, enable_automation: true, enable_tables: false });
                  setIsPlanModalOpen(true);
                }}
                className="w-full sm:w-auto justify-center bg-brand-accent text-brand-bg px-5 sm:px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-accent/20 flex items-center gap-2"
              >
                <Plus className="w-4 h-4 shrink-0" /> Novo Plano
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {plans.map(plan => (
                <div key={plan.id} className="bg-brand-surface p-6 sm:p-8 rounded-3xl sm:rounded-[32px] border border-zinc-800 flex flex-col group hover:border-brand-accent/50 transition-all">
                  <div className="flex justify-between items-start gap-3 mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tight">{plan.name}</h3>
                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                      <button 
                        onClick={() => {
                          setEditingPlan(plan);
                          setPlanForm({
                            name: plan.name,
                            price: plan.price.toString(),
                            max_products: plan.max_products.toString(),
                            enable_ai: plan.enable_ai === 1,
                            enable_reservations: plan.enable_reservations === 1,
                            enable_automation: (plan.enable_automation ?? 1) === 1,
                            enable_tables: (plan.enable_tables ?? (parseFloat(plan.price) > 0 || plan.id !== 1 ? 1 : 0)) === 1
                          });
                          setIsPlanModalOpen(true);
                        }}
                        className="p-2 bg-zinc-800 rounded-xl hover:bg-zinc-700"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button onClick={() => deletePlan(plan.id)} className="p-2 bg-zinc-800 rounded-xl hover:bg-red-500/20 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mb-8">
                    <span className="text-4xl font-black">R$ {(parseFloat(plan.price) || 0).toFixed(2)}</span>
                    <span className="text-zinc-500 text-sm font-bold ml-1">/mês</span>
                  </div>
                  <ul className="space-y-4 flex-1">
                    <li className="flex items-center gap-3 text-sm font-bold text-zinc-400">
                      <Check className="w-4 h-4 text-brand-accent" /> {plan.max_products} Produtos
                    </li>
                    {(plan.enable_automation ?? 1) === 1 && (
                      <li className="flex items-center gap-3 text-sm font-bold text-zinc-400">
                        <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp Automático (QR Code)
                      </li>
                    )}
                    {(plan.enable_tables ?? (parseFloat(plan.price) > 0 || plan.id !== 1 ? 1 : 0)) === 1 && (
                      <li className="flex items-center gap-3 text-sm font-bold text-zinc-400">
                        <QrCode className="w-4 h-4 text-brand-accent" /> Mesas QR, Comandas e Cupom
                      </li>
                    )}
                    {plan.enable_reservations === 1 && (
                      <li className="flex items-center gap-3 text-sm font-bold text-zinc-400">
                        <Calendar className="w-4 h-4 text-brand-accent" /> Reservas
                      </li>
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}

        {superTab === 'settings' && (
          <section className="space-y-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter">Configurações Globais do Sistema</h2>
              <p className="text-zinc-400 text-sm mt-1">Configure recebimento de mensalidades (PIX e InfinitePay), chave geral da Evolution API para os contratantes e sua instância de notificações.</p>
            </div>

            <form onSubmit={handleSavePlatformSettings} className="space-y-8">
              {/* Card 1: Forma de Pagamento de Contratantes */}
              <div className="bg-brand-surface p-5 sm:p-8 rounded-3xl sm:rounded-[32px] border border-zinc-800 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-500/20 p-3 rounded-2xl">
                    <CreditCard className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Forma de Pagamento de Contratantes</h3>
                    <p className="text-xs text-zinc-400">Defina como as lanchonetes pagam a assinatura da plataforma</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black text-zinc-400 uppercase mb-2 tracking-widest">Modo de Pagamento Ativo</label>
                    <select
                      value={platformSettings.contractor_payment_mode || 'both'}
                      onChange={e => setPlatformSettings({ ...platformSettings, contractor_payment_mode: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent text-white"
                    >
                      <option value="both">PIX + InfinitePay (Ambos)</option>
                      <option value="pix">Somente PIX</option>
                      <option value="infinitepay">Somente InfinitePay</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-zinc-400 uppercase mb-2 tracking-widest">WhatsApp Suporte / Comprovantes</label>
                    <input
                      value={platformSettings.platform_support_whatsapp || ''}
                      onChange={e => setPlatformSettings({ ...platformSettings, platform_support_whatsapp: e.target.value.replace(/\D/g, '') })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent text-white"
                      placeholder="5511999999999"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-zinc-400 uppercase mb-2 tracking-widest">Chave PIX da Plataforma</label>
                    <input
                      value={platformSettings.platform_pix_key || ''}
                      onChange={e => setPlatformSettings({ ...platformSettings, platform_pix_key: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent text-white"
                      placeholder="CPF, CNPJ, E-mail ou Chave Aleatória"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-zinc-400 uppercase mb-2 tracking-widest">Nome do Recebedor PIX</label>
                    <input
                      value={platformSettings.platform_pix_name || ''}
                      onChange={e => setPlatformSettings({ ...platformSettings, platform_pix_name: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent text-white"
                      placeholder="MaisQueCardapio"
                    />
                  </div>
                </div>

                <div className="pt-5 border-t border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h4 className="font-black text-emerald-400 uppercase text-sm">Integração InfinitePay</h4>
                      <p className="text-xs text-zinc-400">Checkout automático por Cartão ou PIX com liberação imediata via Webhook</p>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={platformSettings.infinitepay_enabled === '1'}
                        onChange={e => setPlatformSettings({ ...platformSettings, infinitepay_enabled: e.target.checked ? '1' : '0' })}
                        className="w-5 h-5 accent-emerald-500"
                      />
                      <span className="text-sm font-bold">Habilitar InfinitePay</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black text-zinc-400 uppercase mb-2 tracking-widest">InfiniteTag (sem $)</label>
                      <input
                        value={platformSettings.infinitepay_handle || ''}
                        onChange={e => setPlatformSettings({ ...platformSettings, infinitepay_handle: e.target.value.replace(/^\$/, '') })}
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                        placeholder="sualoja"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-zinc-400 uppercase mb-2 tracking-widest">
                        API Key InfinitePay (opcional) {platformSettings.has_infinitepay_api_key && <span className="text-emerald-400 ml-2">✓ Salva</span>}
                      </label>
                      <input
                        type="password"
                        value={platformSettings.infinitepay_api_key || ''}
                        onChange={e => setPlatformSettings({ ...platformSettings, infinitepay_api_key: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                        placeholder={platformSettings.has_infinitepay_api_key ? '•••••••• (deixe em branco para manter)' : 'inchk_...'}
                      />
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest">URL de Webhook InfinitePay</p>
                      <p className="text-xs font-mono text-zinc-300 break-all">{infinitePayWebhookUrl}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(infinitePayWebhookUrl)}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar Webhook
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 2: Evolution API Global */}
              <div className="bg-brand-surface p-5 sm:p-8 rounded-3xl sm:rounded-[32px] border border-zinc-800 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-500/20 p-3 rounded-2xl">
                    <Smartphone className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Evolution API v2 Global</h3>
                    <p className="text-xs text-zinc-400">Chave mestre para que os contratantes criem suas próprias instâncias via QR Code no painel do cardápio</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black text-zinc-400 uppercase mb-2 tracking-widest">URL Global da Evolution API</label>
                    <input
                      value={platformSettings.evolution_global_url || ''}
                      onChange={e => setPlatformSettings({ ...platformSettings, evolution_global_url: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                      placeholder="https://evolution.seudominio.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-zinc-400 uppercase mb-2 tracking-widest">
                      API Key Global {platformSettings.has_evolution_global_key && <span className="text-emerald-400 ml-2">✓ Chave salva</span>}
                    </label>
                    <input
                      type="password"
                      value={platformSettings.evolution_global_key || ''}
                      onChange={e => setPlatformSettings({ ...platformSettings, evolution_global_key: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                      placeholder={platformSettings.has_evolution_global_key ? '•••••••• (deixe em branco para manter)' : 'Global API Key da Evolution'}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={platformSettings.evolution_allow_tenant_instances !== '0'}
                    onChange={e => setPlatformSettings({ ...platformSettings, evolution_allow_tenant_instances: e.target.checked ? '1' : '0' })}
                    className="w-5 h-5 accent-emerald-500"
                  />
                  <span className="text-sm font-bold">Permitir que contratantes criem instâncias e conectem por QR Code no painel da loja</span>
                </label>
              </div>

              {/* Card 3: Instância do SuperAdmin e Alertas */}
              <div className="bg-brand-surface p-5 sm:p-8 rounded-3xl sm:rounded-[32px] border border-zinc-800 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/20 p-3 rounded-2xl">
                      <Bell className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">Instância SuperAdmin & Notificações</h3>
                      <p className="text-xs text-zinc-400">Receba no seu WhatsApp novas contratações, pagamentos e envie lembretes automáticos de renovação</p>
                    </div>
                  </div>
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-black uppercase",
                    saEvoStatus?.connected ? "bg-emerald-500/20 text-emerald-400" : saEvoQr ? "bg-amber-500/20 text-amber-400" : "bg-zinc-800 text-zinc-400"
                  )}>
                    {saEvoStatus?.connected ? 'Conectado' : saEvoQr ? 'Aguardando QR Code' : 'Desconectado'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black text-zinc-400 uppercase mb-2 tracking-widest">Nome da Instância SuperAdmin</label>
                    <input
                      value={platformSettings.superadmin_evolution_instance || ''}
                      onChange={e => setPlatformSettings({ ...platformSettings, superadmin_evolution_instance: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '-') })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-white font-mono"
                      placeholder="superadmin-maisquecardapio"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-zinc-400 uppercase mb-2 tracking-widest">WhatsApp do SuperAdmin (para alertas)</label>
                    <input
                      value={platformSettings.superadmin_notify_whatsapp || ''}
                      onChange={e => setPlatformSettings({ ...platformSettings, superadmin_notify_whatsapp: e.target.value.replace(/\D/g, '') })}
                      className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-white"
                      placeholder="5511999999999"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.superadmin_notify_new_signup !== '0'}
                      onChange={e => setPlatformSettings({ ...platformSettings, superadmin_notify_new_signup: e.target.checked ? '1' : '0' })}
                      className="w-4 h-4 accent-indigo-500"
                    />
                    <span className="text-xs font-bold uppercase">Alertar Novas Contratações</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.superadmin_notify_payment !== '0'}
                      onChange={e => setPlatformSettings({ ...platformSettings, superadmin_notify_payment: e.target.checked ? '1' : '0' })}
                      className="w-4 h-4 accent-indigo-500"
                    />
                    <span className="text-xs font-bold uppercase">Alertar Pagamentos</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={platformSettings.superadmin_notify_renewal !== '0'}
                      onChange={e => setPlatformSettings({ ...platformSettings, superadmin_notify_renewal: e.target.checked ? '1' : '0' })}
                      className="w-4 h-4 accent-indigo-500"
                    />
                    <span className="text-xs font-bold uppercase">Lembretes de Renovação</span>
                  </label>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleConnectSaEvolution}
                    disabled={saEvoLoading}
                    className="w-full sm:w-auto justify-center bg-emerald-500 hover:bg-emerald-600 text-zinc-950 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                  >
                    <QrCode className="w-4 h-4 shrink-0" />
                    {saEvoLoading ? 'Conectando...' : saEvoStatus?.connected ? 'Verificar / Reconectar' : 'Conectar Instância via QR Code'}
                  </button>
                  <button
                    type="button"
                    onClick={() => fetchSaEvolutionStatus(authToken)}
                    disabled={saEvoLoading}
                    className="flex-1 sm:flex-none justify-center bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4 shrink-0" /> Atualizar Status
                  </button>
                  {saEvoStatus?.connected && (
                    <>
                      <button
                        type="button"
                        onClick={handleTestSaEvolution}
                        disabled={saEvoLoading}
                        className="flex-1 sm:flex-none justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4 shrink-0" /> Testar Notificação
                      </button>
                      <button
                        type="button"
                        onClick={handleDisconnectSaEvolution}
                        disabled={saEvoLoading}
                        className="flex-1 sm:flex-none justify-center bg-red-500/15 hover:bg-red-500/25 text-red-400 px-4 py-3 rounded-2xl font-bold text-xs"
                      >
                        Desconectar
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={handleCheckRenewalsNow}
                    disabled={renewalLoading}
                    className="w-full sm:w-auto justify-center bg-zinc-800 hover:bg-zinc-700 text-orange-400 px-4 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 ml-0 sm:ml-auto"
                  >
                    <Clock className="w-4 h-4 shrink-0" /> {renewalLoading ? 'Verificando...' : 'Verificar Renovações Agora'}
                  </button>
                </div>

                {saEvoFeedback && (
                  <div className={cn(
                    "px-4 py-3 rounded-2xl text-xs font-bold",
                    saEvoFeedback.type === 'success' ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"
                  )}>
                    {saEvoFeedback.text}
                  </div>
                )}

                {renewalResult && (
                  <div className="bg-zinc-950 border border-zinc-800 px-4 py-3 rounded-2xl text-xs text-zinc-300">
                    {renewalResult.error
                      ? `Erro: ${renewalResult.error}`
                      : `Verificação concluída — 7 dias: ${renewalResult.expiring7days || 0}, 3 dias: ${renewalResult.expiring3days || 0}, expiradas: ${renewalResult.expired || 0}`}
                  </div>
                )}

                {saEvoQr && !saEvoStatus?.connected && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center gap-4 text-center">
                    <p className="text-sm font-bold text-zinc-200">Escaneie com o WhatsApp da Plataforma</p>
                    <div className="bg-white p-4 rounded-2xl">
                      {saEvoQr.qrcode_base64 ? (
                        <img
                          src={saEvoQr.qrcode_base64.startsWith('data:') ? saEvoQr.qrcode_base64 : `data:image/png;base64,${saEvoQr.qrcode_base64}`}
                          alt="QR Code SuperAdmin"
                          className="w-56 h-56 object-contain"
                        />
                      ) : saEvoQr.code ? (
                        <QRCodeSVG value={saEvoQr.code} size={210} />
                      ) : (
                        <p className="text-zinc-600 text-xs">Aguardando QR Code...</p>
                      )}
                    </div>
                    {saEvoQr.pairing_code && (
                      <div className="bg-zinc-900 px-4 py-2 rounded-xl text-xs">
                        Código de pareamento: <strong className="font-mono text-sm tracking-widest text-white">{saEvoQr.pairing_code}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {settingsFeedback && (
                <div className={cn(
                  "px-5 py-4 rounded-2xl text-sm font-bold",
                  settingsFeedback.type === 'success' ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"
                )}>
                  {settingsFeedback.text}
                </div>
              )}

              <button
                type="submit"
                disabled={settingsSaving}
                className="w-full bg-brand-accent text-brand-bg py-4 sm:py-5 px-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-wider sm:tracking-widest hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/20 disabled:opacity-50"
              >
                {settingsSaving ? 'Salvando...' : 'Salvar Todas as Configurações Globais'}
              </button>
            </form>
          </section>
        )}
      </main>

      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPlanModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-brand-surface border border-zinc-800 p-6 sm:p-10 rounded-3xl sm:rounded-[40px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 uppercase tracking-tighter">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h2>
              <form onSubmit={handlePlanSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Nome</label>
                  <input required value={planForm.name} onChange={e => setPlanForm({...planForm, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Preço</label>
                    <input required type="number" step="0.01" value={planForm.price} onChange={e => setPlanForm({...planForm, price: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent" />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Produtos</label>
                    <input required type="number" value={planForm.max_products} onChange={e => setPlanForm({...planForm, max_products: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent" />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer group">
                    <input type="checkbox" checked={planForm.enable_automation} onChange={e => setPlanForm({...planForm, enable_automation: e.target.checked})} className="w-5 h-5 accent-brand-accent" />
                    <span className="text-sm font-bold uppercase tracking-tight">WhatsApp Automático (QR Code)</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer group">
                    <input type="checkbox" checked={planForm.enable_tables} onChange={e => setPlanForm({...planForm, enable_tables: e.target.checked})} className="w-5 h-5 accent-brand-accent" />
                    <span className="text-sm font-bold uppercase tracking-tight">Mesas QR, Comandas e Cupom</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer group">
                    <input type="checkbox" checked={planForm.enable_reservations} onChange={e => setPlanForm({...planForm, enable_reservations: e.target.checked})} className="w-5 h-5 accent-brand-accent" />
                    <span className="text-sm font-bold uppercase tracking-tight">Reservas Online</span>
                  </label>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 bg-zinc-800 text-white py-3.5 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest">Cancelar</button>
                  <button type="submit" className="flex-1 bg-brand-accent text-brand-bg py-3.5 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isEstModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEstModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-brand-surface border border-zinc-800 p-6 sm:p-10 rounded-3xl sm:rounded-[40px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 uppercase tracking-tighter">Editar Loja</h2>
              <form onSubmit={handleEstSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Plano</label>
                  <select value={estForm.plan_id} onChange={e => setEstForm({...estForm, plan_id: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent">
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Status</label>
                  <select value={estForm.status} onChange={e => setEstForm({...estForm, status: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent">
                    <option value="active">Ativo</option>
                    <option value="suspended">Suspenso</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button type="button" onClick={() => setIsEstModalOpen(false)} className="flex-1 bg-zinc-800 text-white py-3.5 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest">Cancelar</button>
                  <button type="submit" className="flex-1 bg-brand-accent text-brand-bg py-3.5 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isNewEstModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsNewEstModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-brand-surface border border-zinc-800 p-6 sm:p-10 rounded-3xl sm:rounded-[40px] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl sm:text-3xl font-black mb-6 sm:mb-8 uppercase tracking-tighter">Nova Loja</h2>
              <form onSubmit={handleNewEstSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Nome da Loja</label>
                  <input required value={newEstForm.name} onChange={e => setNewEstForm({...newEstForm, name: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent" placeholder="Restaurante Exemplo" />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Slug (URL)</label>
                  <input required value={newEstForm.slug} onChange={e => setNewEstForm({...newEstForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent" placeholder="restaurante-exemplo" />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">WhatsApp (com DDD)</label>
                  <input required value={newEstForm.owner_whatsapp} onChange={e => setNewEstForm({...newEstForm, owner_whatsapp: e.target.value.replace(/\D/g, '')})} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent" placeholder="5511999999999" />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Senha</label>
                  <input required type="password" value={newEstForm.password} onChange={e => setNewEstForm({...newEstForm, password: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent" placeholder="Senha de acesso" />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Plano</label>
                  <select required value={newEstForm.plan_id} onChange={e => setNewEstForm({...newEstForm, plan_id: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent">
                    <option value="">Selecione...</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Status</label>
                  <select value={newEstForm.status} onChange={e => setNewEstForm({...newEstForm, status: e.target.value})} className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent">
                    <option value="active">Ativo</option>
                    <option value="suspended">Suspenso</option>
                    <option value="pending">Pendente</option>
                  </select>
                </div>
                <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-4">
                  <button type="button" onClick={() => setIsNewEstModalOpen(false)} className="flex-1 bg-zinc-800 text-white py-3.5 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest">Cancelar</button>
                  <button type="submit" className="flex-1 bg-brand-accent text-brand-bg py-3.5 sm:py-5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest">Criar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Order Tracking Component ---
const OrderTracking = ({ slug }: { slug: string }) => {
  const { id } = useParams();
  useSeoMeta({
    title: `Acompanhar Pedido #${id || ''} | MaisQueCardapio`,
    description: 'Acompanhe o status do seu pedido em tempo real.',
    canonicalPath: `/e/${slug}/pedido/${id || ''}`,
    robots: 'noindex, nofollow'
  });
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [generatingIp, setGeneratingIp] = useState(false);
  const [ipError, setIpError] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [requestingBill, setRequestingBill] = useState(false);
  const [billMessage, setBillMessage] = useState('');

  const apiFetch = (url: string, options: any = {}) => {
    return fetch(`/api/public${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'x-establishment-slug': slug,
        'Content-Type': 'application/json'
      }
    });
  };

  const fetchOrder = async () => {
    try {
      const res = await apiFetch(`/orders/id/${id}`);
      const data = await res.json();
      setOrder(data);
    } catch (error) {
      console.error('Erro ao buscar pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 10000); // Atualiza a cada 10s
    return () => clearInterval(interval);
  }, [id]);

  const handleCopyPix = () => {
    if (order?.pix_code) {
      navigator.clipboard.writeText(order.pix_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyInfinitePay = () => {
    if (order?.infinitepay_checkout_url) {
      navigator.clipboard.writeText(order.infinitepay_checkout_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGenerateInfinitePay = async () => {
    setGeneratingIp(true);
    setIpError('');
    try {
      const res = await apiFetch(`/orders/${id}/infinitepay-checkout`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setIpError(data.error || 'Não foi possível gerar o link InfinitePay.');
      } else {
        setOrder((prev: any) => ({
          ...prev,
          infinitepay_checkout_url: data.checkout_url,
          infinitepay_order_nsu: data.order_nsu,
        }));
      }
    } catch {
      setIpError('Erro de comunicação ao gerar checkout InfinitePay.');
    } finally {
      setGeneratingIp(false);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, envie uma imagem');
      return;
    }
    
    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem muito grande. Máximo 5MB');
      return;
    }
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setProofPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Converter para base64
    const reader2 = new FileReader();
    reader2.onload = (event) => {
      setProofImage(event.target?.result as string);
    };
    reader2.readAsDataURL(file);
  };

  const handleConfirmPayment = async () => {
    if (!proofImage && !confirm('Tem certeza que deseja confirmar sem enviar comprovante?')) {
      return;
    }
    
    setConfirming(true);
    try {
      const res = await apiFetch(`/orders/${id}/confirm-payment`, { 
        method: 'POST',
        body: JSON.stringify({ proof_image: proofImage })
      });
      const data = await res.json();
      if (data.success) {
        fetchOrder();
        alert('Comprovante enviado! Aguarde a confirmação do estabelecimento.');
        setProofImage(null);
        setProofPreview(null);
      } else {
        alert(data.error || 'Erro ao confirmar pagamento');
      }
    } catch (error) {
      alert('Erro ao confirmar pagamento');
    } finally {
      setConfirming(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    'pending': { label: 'Pendente', color: 'bg-yellow-500', icon: Clock3 },
    'pendente': { label: 'Pendente', color: 'bg-yellow-500', icon: Clock3 },
    'confirmed': { label: 'Confirmado', color: 'bg-blue-500', icon: CheckCircle },
    'confirmado': { label: 'Confirmado', color: 'bg-blue-500', icon: CheckCircle },
    'preparing': { label: 'Em Preparo', color: 'bg-orange-500', icon: ChefHat },
    'delivering': { label: order?.type === 'pickup' ? 'Pronto p/ Retirada' : 'Saiu para Entrega', color: 'bg-purple-500', icon: order?.type === 'pickup' ? Store : Truck },
    'completed': { label: order?.type === 'pickup' ? 'Retirado' : 'Entregue', color: 'bg-green-500', icon: CheckCircle },
    'cancelled': { label: 'Cancelado', color: 'bg-red-500', icon: XCircle }
  };

  const paymentStatusConfig: Record<string, { label: string; color: string }> = {
    'pending': { label: 'Aguardando', color: 'text-yellow-500' },
    'pendente': { label: 'Aguardando', color: 'text-yellow-500' },
    'aguardando_pagamento': { label: 'Aguardando PIX', color: 'text-yellow-500' },
    'pagamento_em_analise': { label: 'Pagamento em Análise', color: 'text-blue-500' },
    'pago': { label: 'Pago', color: 'text-green-500' },
    'paid': { label: 'Pago', color: 'text-green-500' },
    'pagamento_rejeitado': { label: 'Pagamento Rejeitado', color: 'text-red-500' },
    'pending_delivery': { label: 'Na Entrega', color: 'text-purple-500' },
    'pending_comanda': { label: 'Na Comanda (pagar ao final)', color: 'text-orange-400' }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-400">Carregando pedido...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <XCircle className="w-16 h-16 text-red-500" />
        <div className="text-zinc-400">Pedido não encontrado</div>
        <button onClick={() => navigate(`/e/${slug}`)} className="text-orange-500 font-bold">Voltar ao cardápio</button>
      </div>
    );
  }

  const currentStatus = statusConfig[order.status] || statusConfig['pending'];
  const currentPaymentStatus = paymentStatusConfig[order.payment_status] || paymentStatusConfig['pending'];
  const tableMatch = order?.type === 'table' ? String(order.customer_name || '').match(/Mesa\s+(\d+)/i) : null;
  const orderTableNumber = tableMatch ? tableMatch[1] : null;
  const menuReturnUrl = orderTableNumber ? `/e/${slug}?mesa=${orderTableNumber}` : `/e/${slug}`;
  const isComandaOrder = order.payment_method === 'comanda' || order.payment_status === 'pending_comanda';
  const showPixPayment = !isComandaOrder && order.payment_method === 'pix' && (order.payment_status === 'pending' || order.payment_status === 'aguardando_pagamento');
  const showInfinitePayPayment = !isComandaOrder && order.payment_method === 'infinitepay' && order.payment_status !== 'pago' && order.payment_status !== 'paid';

  const handleRequestBill = async () => {
    if (!orderTableNumber) return;
    setRequestingBill(true);
    setBillMessage('');
    try {
      const res = await apiFetch(`/tables/${encodeURIComponent(orderTableNumber)}/request-bill`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setBillMessage(data.message || `Conta solicitada! Um atendente irá até a Mesa ${orderTableNumber}.`);
      } else {
        setBillMessage(data.error || 'Não foi possível solicitar a conta.');
      }
    } catch {
      setBillMessage('Erro de comunicação ao solicitar a conta.');
    } finally {
      setRequestingBill(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-8">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(menuReturnUrl)} className="text-zinc-400 hover:text-white" title="Voltar ao cardápio">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="font-black text-lg">Pedido #{order.id}</h1>
          <button onClick={fetchOrder} className="text-zinc-400 hover:text-white">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Status Principal */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="flex items-center gap-4 mb-4">
            <div className={`${currentStatus.color} p-4 rounded-2xl`}>
              <currentStatus.icon className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold">Status</p>
              <p className="text-xl font-black">{currentStatus.label}</p>
            </div>
          </div>

          {/* Payment Status */}
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-xl">
            <span className="text-sm text-zinc-400">Pagamento</span>
            <span className={`font-bold ${currentPaymentStatus.color}`}>{currentPaymentStatus.label}</span>
          </div>
        </div>

        {/* Comanda na Mesa Section */}
        {(isComandaOrder || orderTableNumber) && (
          <div className="bg-zinc-900 rounded-2xl p-6 border border-orange-500/30 space-y-4">
            <div className="flex items-center gap-2 text-orange-400">
              <ClipboardList className="w-5 h-5" />
              <span className="font-bold uppercase text-sm">
                {isComandaOrder ? `Adicionado à Comanda · Mesa ${orderTableNumber || ''}` : `Atendimento na Mesa ${orderTableNumber}`}
              </span>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {isComandaOrder && order.payment_status !== 'paid' && order.payment_status !== 'pago'
                ? 'Seu pedido foi enviado para a cozinha e lançado na comanda da mesa. Você pode continuar pedindo e pagar tudo junto no final.'
                : 'Continue pedindo novos itens pelo cardápio da mesa ou solicite a conta quando quiser encerrar.'}
            </p>

            {billMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                {billMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => navigate(menuReturnUrl)}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Pedir Mais Itens
              </button>
              {orderTableNumber && (
                <button
                  type="button"
                  disabled={requestingBill}
                  onClick={handleRequestBill}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-amber-400" />
                  {requestingBill ? 'Avisando...' : 'Pedir a Conta'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* InfinitePay Payment Section */}
        {showInfinitePayPayment && (
          <div className="bg-zinc-900 rounded-2xl p-6 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CreditCard className="w-5 h-5" />
                <span className="font-bold uppercase text-sm">Pagar com InfinitePay</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400">{order.infinitepay_order_nsu || `ORDER-${order.id}`}</span>
            </div>

            <p className="text-sm text-zinc-300">
              Pague seu pedido de <strong>R$ {(parseFloat(String(order.total)) || 0).toFixed(2)}</strong> com Cartão de Crédito ou PIX pelo checkout seguro da InfinitePay.
            </p>

            {ipError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-xs font-medium">
                {ipError}
              </div>
            )}

            {order.infinitepay_checkout_url ? (
              <div className="space-y-3">
                <a
                  href={order.infinitepay_checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 sm:py-4 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-900/30 text-center"
                >
                  <ExternalLink className="w-5 h-5 shrink-0" />
                  Abrir Checkout InfinitePay
                </a>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleCopyInfinitePay}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Link Copiado!' : 'Copiar Link'}
                  </button>
                  <button
                    type="button"
                    onClick={fetchOrder}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Atualizar Status
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerateInfinitePay}
                disabled={generatingIp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 px-5 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                {generatingIp ? 'Gerando Link...' : 'Gerar Link InfinitePay'}
              </button>
            )}

            <p className="text-xs text-zinc-500 text-center">
              Assim que o pagamento for aprovado na InfinitePay, seu pedido será confirmado automaticamente.
            </p>
          </div>
        )}

        {/* PIX Payment Section */}
        {showPixPayment && (
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 text-orange-500">
              <QrCode className="w-5 h-5" />
              <span className="font-bold uppercase text-sm">Pague com PIX</span>
            </div>

            {order.pix_qrcode && (
              <div className="bg-white p-4 rounded-xl flex justify-center">
                <QRCodeSVG value={order.pix_code} size={200} />
              </div>
            )}

            {order.pix_code && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 text-center">Ou copie o código PIX:</p>
                <div className="bg-zinc-800 p-3 rounded-xl">
                  <p className="text-xs text-zinc-400 break-all font-mono">{order.pix_code.substring(0, 50)}...</p>
                </div>
                <button
                  onClick={handleCopyPix}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copied ? 'Copiado!' : 'Copiar Código PIX'}
                </button>
              </div>
            )}

            <div className="pt-4 border-t border-zinc-800 space-y-3">
              {/* Botão Enviar Comprovante pelo WhatsApp */}
              <button
                onClick={() => {
                  const adminPhone = order.admin_whatsapp || '5511999999999';
                  const message = `📸 *Comprovante de Pagamento*\n\nPedido #${order.id}\nValor: R$ ${parseFloat(order.total).toFixed(2)}\n\nEnvie a imagem do comprovante PIX abaixo:`;
                  const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
                  window.open(whatsappUrl, '_blank');
                }}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3.5 sm:py-4 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors text-center"
              >
                <MessageCircle className="w-5 h-5 shrink-0" />
                Enviar Comprovante pelo WhatsApp
              </button>
              
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-700" />
                <span className="text-xs text-zinc-500">ou</span>
                <div className="flex-1 h-px bg-zinc-700" />
              </div>
              
              <button
                onClick={handleConfirmPayment}
                disabled={confirming}
                className="w-full bg-zinc-700 hover:bg-zinc-600 text-white py-3.5 sm:py-4 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider disabled:opacity-50 transition-colors"
              >
                {confirming ? 'Confirmando...' : 'Já paguei!'}
              </button>
              <p className="text-xs text-zinc-500 text-center">Envie o comprovante pelo WhatsApp para confirmação mais rápida</p>
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-zinc-900 rounded-2xl p-5 sm:p-6 border border-zinc-800 space-y-4">
          <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-widest">Detalhes do Pedido</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500 shrink-0">Tipo</span>
              <span className="font-semibold text-right">
                {order.type === 'table' ? 'Mesa' : order.type === 'pickup' ? 'Balcão / Retirada' : 'Delivery'}
              </span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-zinc-500 shrink-0">Cliente</span>
              <span className="text-right break-words">{order.customer_name}</span>
            </div>
            {order.customer_phone && (
              <div className="flex justify-between gap-3">
                <span className="text-zinc-500 shrink-0">Telefone</span>
                <span className="text-right">{order.customer_phone}</span>
              </div>
            )}
            {order.address && (
              <div className="flex justify-between gap-3">
                <span className="text-zinc-500 shrink-0">Endereço</span>
                <span className="text-right break-words">{order.address}{order.address_number ? `, ${order.address_number}` : ''}</span>
              </div>
            )}
            {order.neighborhood_name && (
              <div className="flex justify-between">
                <span className="text-zinc-500">Bairro</span>
                <span>{order.neighborhood_name}</span>
              </div>
            )}
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <p className="text-xs text-zinc-500 uppercase font-bold mb-2">Itens</p>
            <div className="whitespace-pre-wrap text-sm bg-zinc-800/50 p-3 rounded-xl">{order.items_text}</div>
          </div>

          <div className="border-t border-zinc-800 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-500">Subtotal</span>
              <span>R$ {(parseFloat(order.total) - parseFloat(order.delivery_fee || 0)).toFixed(2)}</span>
            </div>
            {parseFloat(order.delivery_fee || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Taxa de Entrega</span>
                <span>R$ {parseFloat(order.delivery_fee).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-black pt-2">
              <span>Total</span>
              <span className="text-orange-500">R$ {parseFloat(order.total).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* History */}
        {order.history && order.history.length > 0 && (
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
            <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-widest">Histórico</h3>
            <div className="space-y-3">
              {order.history.map((h: any, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${i === 0 ? 'bg-orange-500' : 'bg-zinc-600'}`} />
                  <div>
                    <p className="text-sm">{h.status}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(h.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Help */}
        <div className="text-center">
          <p className="text-xs text-zinc-500">Dúvidas? Entre em contato pelo WhatsApp</p>
        </div>
      </div>
    </div>
  );
};

// --- Customer Orders Component ---
const CustomerOrders = ({ slug }: { slug: string }) => {
  useSeoMeta({
    title: `Meus Pedidos (${slug}) | MaisQueCardapio`,
    description: 'Consulte o histórico dos seus pedidos.',
    canonicalPath: `/e/${slug}/meus-pedidos`,
    robots: 'noindex, nofollow'
  });
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const apiFetch = (url: string, options: any = {}) => {
    return fetch(`/api/public${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'x-establishment-slug': slug,
        'Content-Type': 'application/json'
      }
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setLoading(true);
    try {
      const res = await apiFetch(`/orders/${phone.replace(/\D/g, '')}`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
      setSearched(true);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    'pending': { label: 'Pendente', color: 'bg-yellow-500' },
    'confirmed': { label: 'Confirmado', color: 'bg-blue-500' },
    'preparing': { label: 'Em Preparo', color: 'bg-orange-500' },
    'delivering': { label: 'Saiu para Entrega', color: 'bg-purple-500' },
    'completed': { label: 'Entregue', color: 'bg-green-500' },
    'cancelled': { label: 'Cancelado', color: 'bg-red-500' }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-8">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(`/e/${slug}`)} className="text-zinc-400 hover:text-white">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="font-black text-lg">Meus Pedidos</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <Package className="w-5 h-5" />
            <span className="font-bold uppercase text-sm">Consultar Pedidos</span>
          </div>
          <p className="text-xs text-zinc-500">Digite seu telefone para ver seus pedidos</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="Seu telefone"
              className="w-full sm:flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500"
            />
            <button
              type="submit"
              disabled={loading || !phone}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold disabled:opacity-50 transition-colors shrink-0"
            >
              {loading ? '...' : 'Buscar'}
            </button>
          </div>
        </form>

        {/* Orders List */}
        {searched && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">Nenhum pedido encontrado para este telefone</p>
              </div>
            ) : (
              orders.map(order => {
                const status = statusConfig[order.status] || statusConfig['pending'];
                return (
                  <button
                    key={order.id}
                    onClick={() => navigate(`/e/${slug}/pedido/${order.id}`)}
                    className="w-full bg-zinc-900 rounded-2xl p-4 border border-zinc-800 text-left hover:border-zinc-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold">Pedido #{order.id}</p>
                        <p className="text-xs text-zinc-500">
                          {new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`${status.color} text-white text-xs px-2 py-1 rounded-full font-bold`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 line-clamp-2 mb-2">{order.items_text}</div>
                    <p className="text-orange-500 font-bold">R$ {parseFloat(order.total).toFixed(2)}</p>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Subscription Page Component ---
const SubscriptionPage = ({ slug }: { slug: string }) => {
  useSeoMeta({
    title: `Assinatura Premium (${slug}) | MaisQueCardapio`,
    description: 'Gerencie sua assinatura no MaisQueCardapio.',
    canonicalPath: `/e/${slug}/admin/assinatura`,
    robots: 'noindex, nofollow'
  });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pixLoading, setPixLoading] = useState(false);
  const [ipLoading, setIpLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [ipData, setIpData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const apiFetch = (url: string, options: any = {}) => {
    return fetch(`/api/e${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'x-establishment-slug': slug,
        'Content-Type': 'application/json'
      }
    });
  };

  useEffect(() => {
    apiFetch('/subscription/status')
      .then(res => res.json())
      .then(data => {
        setSubscription(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleGeneratePix = async (months: number = 1) => {
    setPixLoading(true);
    setErrorMsg('');
    setIpData(null);
    try {
      const res = await apiFetch('/subscription/generate-pix', {
        method: 'POST',
        body: JSON.stringify({ plan_id: 2, months })
      });
      const data = await res.json();
      if (data.success) {
        setPixData(data);
      } else {
        setErrorMsg(data.error || 'Erro ao gerar PIX');
      }
    } catch {
      setErrorMsg('Erro ao gerar PIX');
    } finally {
      setPixLoading(false);
    }
  };

  const handleGenerateInfinitePay = async (months: number = 1) => {
    setIpLoading(true);
    setErrorMsg('');
    setPixData(null);
    try {
      const res = await apiFetch('/subscription/infinitepay-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan_id: 2, months })
      });
      const data = await res.json();
      if (data.success) {
        setIpData(data);
      } else {
        setErrorMsg(data.error || 'Erro ao gerar link InfinitePay');
      }
    } catch {
      setErrorMsg('Erro ao comunicar com InfinitePay');
    } finally {
      setIpLoading(false);
    }
  };

  const handleCopy = (value: string) => {
    if (value) {
      navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Carregando...
      </div>
    );
  }

  const returnedStatus = searchParams.get('status');
  const paymentOptions = subscription?.payment_options || { pix_enabled: true, infinitepay_enabled: false, support_whatsapp: '' };
  const supportPhone = (pixData?.support_whatsapp || paymentOptions.support_whatsapp || '').replace(/\D/g, '');
  const waReceiptUrl = supportPhone
    ? `https://wa.me/${supportPhone}?text=${encodeURIComponent(
        `💰 *Comprovante de Pagamento - Mensalidade*\n\n📋 Pedido: #${pixData?.payment_id}\n🏪 Plano: ${pixData?.plan_name || 'Premium'}\n💵 Valor: R$ ${pixData?.amount?.toFixed(2)}\n\nSegue o comprovante de pagamento.`
      )}`
    : '';

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-8">
      {/* Header */}
      <div className="bg-zinc-900 border-b border-zinc-800 p-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button onClick={() => navigate(`/e/${slug}/admin`)} className="text-zinc-400 hover:text-white">
            <ChevronRight className="w-6 h-6 rotate-180" />
          </button>
          <h1 className="font-black text-lg">Assinatura</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {returnedStatus === 'returned' && (
          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 text-sm text-emerald-300 font-bold">
            Retorno do checkout InfinitePay recebido! Caso já tenha concluído o pagamento, seu plano será ativado automaticamente pelo webhook.
          </div>
        )}

        {/* Status Atual */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-3 rounded-xl">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold">Plano Atual</p>
              <p className="text-xl font-black">{subscription?.plan?.name || 'Gratuito'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
            <div>
              <p className="text-xs text-zinc-500">Status</p>
              <p className={`font-bold ${subscription?.status === 'active' ? 'text-green-500' : 'text-yellow-500'}`}>
                {subscription?.status === 'active' ? 'Ativo' : 'Pendente'}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Válido até</p>
              <p className="font-bold">
                {subscription?.paid_until 
                  ? new Date(subscription.paid_until).toLocaleDateString('pt-BR')
                  : subscription?.trial_ends_at 
                    ? new Date(subscription.trial_ends_at).toLocaleDateString('pt-BR')
                    : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Pagamento Pendente */}
        {subscription?.pending_payment && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 space-y-2">
            <p className="text-yellow-500 font-bold text-sm">
              ⚠️ Você tem um pagamento pendente de R$ {parseFloat(subscription.pending_payment.amount).toFixed(2)}
            </p>
            {subscription.pending_payment.checkout_url && (
              <a
                href={subscription.pending_payment.checkout_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 underline"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Retomar pagamento na InfinitePay
              </a>
            )}
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-2xl p-4 text-sm text-red-300 font-bold">
            {errorMsg}
          </div>
        )}

        {ipData ? (
          <div className="bg-zinc-900 rounded-2xl p-6 border border-emerald-500/40 space-y-4 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="font-black text-lg">Checkout InfinitePay</h3>
            <p className="text-xs text-zinc-400 font-mono">NSU: {ipData.order_nsu} • R$ {Number(ipData.amount || 0).toFixed(2)}</p>
            <a
              href={ipData.checkout_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <ExternalLink className="w-5 h-5" /> Ir para InfinitePay
            </a>
            <button
              type="button"
              onClick={() => handleCopy(ipData.checkout_url)}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Link Copiado!' : 'Copiar Link de Pagamento'}
            </button>
            <button
              type="button"
              onClick={() => setIpData(null)}
              className="text-xs text-zinc-400 hover:text-white underline"
            >
              Voltar às opções
            </button>
          </div>
        ) : pixData ? (
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-500">
                <QrCode className="w-5 h-5" />
                <span className="font-bold uppercase text-sm">Pague com PIX</span>
              </div>
              <button type="button" onClick={() => setPixData(null)} className="text-xs text-zinc-400 hover:text-white underline">
                Voltar
              </button>
            </div>

            <div className="bg-white p-4 rounded-xl flex justify-center">
              <QRCodeSVG value={pixData.pix_code} size={200} />
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-500 text-center">Ou copie o código PIX:</p>
              <div className="bg-zinc-800 p-3 rounded-xl">
                <p className="text-xs text-zinc-400 break-all font-mono">{pixData.pix_code.substring(0, 60)}...</p>
              </div>
              <button
                onClick={() => handleCopy(pixData.pix_code)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? 'Copiado!' : 'Copiar Código PIX'}
              </button>
            </div>

            {waReceiptUrl && (
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <a
                  href={waReceiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  Enviar Comprovante pelo WhatsApp
                </a>
                <p className="text-xs text-zinc-500 text-center">Envie o comprovante para confirmação mais rápida</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
            <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-widest">Pagar Mensalidade</h3>

            {!paymentOptions.pix_enabled && !paymentOptions.infinitepay_enabled ? (
              <p className="text-xs text-amber-400">Nenhuma forma de pagamento configurada no SuperAdmin no momento.</p>
            ) : (
              <div className="space-y-3">
                {[
                  { months: 1, label: 'Premium - 1 mês', price: 'R$ 49,90' },
                  { months: 3, label: 'Premium - 3 meses', price: 'R$ 149,70' },
                  { months: 12, label: 'Premium - 12 meses', price: 'R$ 598,80' },
                ].map((opt) => (
                  <div key={opt.months} className="p-4 bg-zinc-800 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold">{opt.label}</p>
                        <p className="text-xs text-zinc-400">{opt.price}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {paymentOptions.pix_enabled && (
                        <button
                          onClick={() => handleGeneratePix(opt.months)}
                          disabled={pixLoading || ipLoading}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs disabled:opacity-50 transition-colors"
                        >
                          {pixLoading ? '...' : 'PIX'}
                        </button>
                      )}
                      {paymentOptions.infinitepay_enabled && (
                        <button
                          onClick={() => handleGenerateInfinitePay(opt.months)}
                          disabled={ipLoading || pixLoading}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs disabled:opacity-50 transition-colors"
                        >
                          {ipLoading ? '...' : 'InfinitePay'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Benefícios */}
        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800 space-y-4">
          <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-widest">Benefícios do Premium</h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Até 100 produtos
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Sistema de reservas
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              IA para insights
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Notificações WhatsApp via QR Code
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

const EstablishmentApp = () => {
  const { slug } = useParams();
  const [establishment, setEstablishment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.fetch(`/api/public/establishments/${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          window.location.href = '/';
        } else {
          setEstablishment(data);
          setLoading(false);
        }
      });
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando cardápio...</div>;

  return (
    <Routes>
      <Route path="/" element={<OnlineMenu slug={slug!} />} />
      <Route path="/pedido/:id" element={<OrderTracking slug={slug!} />} />
      <Route path="/meus-pedidos" element={<CustomerOrders slug={slug!} />} />
      <Route path="/admin" element={<AdminDashboard slug={slug!} />} />
      <Route path="/admin/assinatura" element={<SubscriptionPage slug={slug!} />} />
    </Routes>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/superadmin" element={<SuperAdmin />} />
        <Route path="/e/:slug/*" element={<EstablishmentApp />} />
      </Routes>
    </Router>
  );
}
