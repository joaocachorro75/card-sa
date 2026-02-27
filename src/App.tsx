import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, useSearchParams } from 'react-router-dom';
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
  Edit2
} from 'lucide-react';
import { cn, Product, Category, Neighborhood, CartItem } from './types';
import { GoogleGenAI } from "@google/genai";

// --- AI Insights Component ---

const AIInsights = ({ products, categories, settings }: { products: Product[], categories: Category[], settings: any }) => {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    if (!settings.ai_api_key) {
      alert('Por favor, configure sua chave API da IA nas configurações primeiro.');
      return;
    }

    if (settings.ai_provider !== 'gemini') {
      alert(`O provedor ${settings.ai_provider} ainda não está totalmente integrado. Por favor, use o Google Gemini por enquanto.`);
      return;
    }

    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: settings.ai_api_key });
      
      const prompt = `Como um consultor de negócios para lanchonetes, analise meu cardápio e dê 3 sugestões estratégicas.
      Categorias: ${categories.map(c => c.name).join(', ')}
      Produtos: ${products.map(p => `${p.name} (R$ ${p.price})`).join(', ')}
      
      Responda em formato Markdown curto e direto.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setInsights(response.text || 'Não foi possível gerar insights no momento.');
    } catch (error) {
      console.error(error);
      setInsights('Erro ao conectar com a IA. Verifique sua chave API.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-indigo-500 p-3 rounded-xl">
          <Sparkles className="text-white w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">IA Insights</h2>
          <p className="text-zinc-500 text-sm">Sugestões inteligentes para o seu negócio</p>
        </div>
      </div>

      {!insights ? (
        <div className="text-center py-12 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
          <ChefHat className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-zinc-700 mb-2">Pronto para otimizar seu cardápio?</h3>
          <p className="text-zinc-500 text-sm mb-6 max-w-sm mx-auto">Nossa IA analisa seus produtos e categorias para sugerir melhorias de preço, novos itens ou combos estratégicos.</p>
          <button 
            onClick={generateInsights}
            disabled={loading}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {loading ? 'Analisando...' : 'Gerar Insights Agora'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="prose prose-zinc max-w-none bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-600 font-bold mb-4">
              <Sparkles className="w-4 h-4" /> Sugestões da IA
            </div>
            <div className="text-zinc-800 leading-relaxed whitespace-pre-wrap">
              {insights}
            </div>
          </div>
          <button 
            onClick={() => setInsights('')}
            className="text-zinc-400 text-sm font-medium hover:text-zinc-600 transition-colors"
          >
            Limpar e gerar novamente
          </button>
        </div>
      )}
    </div>
  );
};

// --- Components ---

const ReservationForm = ({ tables, onClose, apiFetch }: { tables: any[], onClose: () => void, apiFetch: any }) => {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    table_id: '',
    reservation_time: '',
    guests: '1'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/reservations', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          table_id: formData.table_id ? parseInt(formData.table_id) : null,
          guests: parseInt(formData.guests)
        })
      });
      alert('Reserva solicitada com sucesso! Aguarde nossa confirmação.');
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao solicitar reserva.');
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
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-zinc-900">Reservar Mesa</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-6 h-6" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Seu Nome</label>
            <input required value={formData.customer_name} onChange={e => setFormData({...formData, customer_name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Telefone</label>
            <input required type="tel" value={formData.customer_phone} onChange={e => setFormData({...formData, customer_phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="(00) 00000-0000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Data e Hora</label>
              <input required type="datetime-local" value={formData.reservation_time} onChange={e => setFormData({...formData, reservation_time: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Pessoas</label>
              <input required type="number" min="1" value={formData.guests} onChange={e => setFormData({...formData, guests: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all disabled:opacity-50">
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
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
        alert(data.error);
      }
    } catch (e) {
      alert('Erro na autenticação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl p-8"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-zinc-100 rounded-full"><X className="w-6 h-6" /></button>
        <h2 className="text-2xl font-bold mb-6">{isLogin ? 'Entrar' : 'Criar Conta'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-zinc-700 mb-1">Nome</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Telefone</label>
            <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" placeholder="5511999999999" />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Senha</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all">
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-4 text-sm text-zinc-500 hover:text-zinc-900">
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
        setOrders(data);
        setLoading(false);
      });
  }, [customer.id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h2 className="text-xl font-bold">Minha Conta</h2>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-6 h-6" /></button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
            <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Dados</p>
            <p className="font-bold text-zinc-900">{customer.name}</p>
            <p className="text-zinc-500 text-sm">{customer.phone}</p>
          </div>
          
          <div>
            <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" /> Meus Pedidos
            </h3>
            {loading ? (
              <p className="text-zinc-400 text-sm">Carregando pedidos...</p>
            ) : orders.length === 0 ? (
              <p className="text-zinc-400 text-sm">Nenhum pedido encontrado.</p>
            ) : (
              <div className="space-y-3">
                {orders.map(order => (
                  <div key={order.id} className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-zinc-400">#{order.id}</span>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded-full",
                        order.status === 'pending' ? "bg-orange-100 text-orange-700" :
                        order.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
                        "bg-zinc-100 text-zinc-600"
                      )}>
                        {order.status === 'pending' ? 'Pendente' : 
                         order.status === 'completed' ? 'Concluído' : 
                         order.status === 'cancelled' ? 'Cancelado' : order.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-2">{new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                    <div className="text-sm text-zinc-800 whitespace-pre-wrap line-clamp-2 mb-2">{order.items_text}</div>
                    <p className="font-bold text-orange-600">R$ {order.total.toFixed(2)}</p>
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

const Navbar = ({ settings, slug, customer, onAuthClick, onLogout, onProfileClick }: { settings: any, slug?: string, customer?: any, onAuthClick?: () => void, onLogout?: () => void, onProfileClick?: () => void }) => (
  <nav className={cn(
    "sticky top-0 z-50 backdrop-blur-xl border-b px-4 py-3 flex justify-between items-center transition-all",
    settings.catalog_theme === 'dark' ? "bg-zinc-950/80 border-zinc-800" : 
    settings.catalog_theme === 'brand' ? "bg-brand-bg/80 border-zinc-800" : "bg-white/80 border-zinc-100"
  )}>
    <Link to={slug ? `/e/${slug}` : "/"} className="flex items-center gap-3">
      {settings.store_logo ? (
        <img src={settings.store_logo} alt={settings.store_name} className="h-9 w-auto object-contain rounded-lg" />
      ) : (
        <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-500/20">
          <ChefHat className="text-white w-5 h-5" />
        </div>
      )}
      <div className="flex flex-col">
        <span className="font-black text-lg tracking-tighter leading-none text-white">{settings.store_name || 'MaisQueCardapio'}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mt-0.5">Cardápio Digital</span>
      </div>
    </Link>
    <div className="flex gap-3 items-center">
      {customer ? (
        <div className="flex items-center gap-2">
          <button onClick={onProfileClick} className="flex items-center gap-2 hover:bg-zinc-800/50 p-1 pr-3 rounded-full transition-all group">
            <div className="bg-zinc-800 p-2 rounded-full group-hover:bg-zinc-700 transition-colors">
              <User className="w-4 h-4 text-zinc-400" />
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-zinc-400 hidden sm:inline">{customer.name.split(' ')[0]}</span>
          </button>
          <button onClick={onLogout} className="p-2 hover:bg-red-500/10 rounded-full text-zinc-500 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      ) : onAuthClick && (
        <button onClick={onAuthClick} className="text-xs font-black uppercase tracking-widest text-zinc-400 hover:text-white px-4 py-2 bg-zinc-900 rounded-xl border border-zinc-800 transition-all">Entrar</button>
      )}
      <Link to={slug ? `/e/${slug}/admin` : "/admin"} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-all">
        <Settings className="w-5 h-5" />
      </Link>
    </div>
  </nav>
);

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
  const [establishment, setEstablishment] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [tables, setTables] = useState<{id: number, number: number}[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'entrega'>('pix');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('mesa');

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
    fetch(`/api/public/establishments/${slug}`).then(res => res.json()).then(setEstablishment);
    apiFetch('/products').then(res => res.json()).then(setProducts);
    apiFetch('/categories').then(res => res.json()).then(setCategories);
    apiFetch('/neighborhoods').then(res => res.json()).then(setNeighborhoods);
    apiFetch('/tables').then(res => res.json()).then(setTables);
    apiFetch('/settings').then(res => res.json()).then(setSettings);

    const savedCustomer = localStorage.getItem(`customer_${slug}`);
    if (savedCustomer) setCustomer(JSON.parse(savedCustomer));
  }, [slug]);

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

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const deliveryFee = neighborhoods.find(n => n.id === selectedNeighborhood)?.delivery_fee || 0;
  const total = subtotal + deliveryFee;

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === null || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCheckout = async () => {
    const neighborhoodName = neighborhoods.find(n => n.id === selectedNeighborhood)?.name;
    const items_text = cart.map(item => `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`).join('\n');
    
    const message = `*Novo Pedido ${tableNumber ? `(Mesa ${tableNumber})` : '(Delivery)'}*\n\n` +
      `*Cliente:* ${customer ? customer.name : 'Cliente Web'}\n` +
      `*Telefone:* ${customer ? customer.phone : 'N/A'}\n\n` +
      items_text +
      `\n\n${!tableNumber ? `*Bairro:* ${neighborhoodName}\n*Taxa:* R$ ${deliveryFee.toFixed(2)}\n` : ''}` +
      `*Pagamento:* ${paymentMethod === 'pix' ? 'PIX' : 'Na Entrega'}\n` +
      `*Total: R$ ${total.toFixed(2)}*`;
    
    // Save order to DB
    await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        total,
        payment_method: paymentMethod,
        type: tableNumber ? 'table' : 'delivery',
        neighborhood_id: selectedNeighborhood,
        items_text: items_text,
        customer_name: customer ? customer.name : (tableNumber ? `Mesa ${tableNumber}` : 'Cliente Web'),
        customer_phone: customer ? customer.phone : null
      })
    });

    if (tableNumber) {
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
    }

    const targetWhatsApp = tableNumber ? settings.whatsapp_kitchen : settings.whatsapp_cashier;
    const whatsappUrl = `https://wa.me/${targetWhatsApp || '5511999999999'}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

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
        slug={slug} 
        customer={customer} 
        onAuthClick={() => setIsAuthModalOpen(true)} 
        onLogout={handleLogout}
        onProfileClick={() => setIsProfileModalOpen(true)}
      />
      
      {/* Banner */}
      {settings.catalog_banner && (
        <div className="w-full h-40 md:h-56 overflow-hidden relative">
          <img src={settings.catalog_banner} alt="Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>
      )}

      {/* Hero */}
      <div className={cn(
        "px-6 py-6 border-b transition-colors relative",
        settings.catalog_theme === 'dark' ? "bg-zinc-900 border-zinc-800" : 
        settings.catalog_theme === 'brand' ? "bg-brand-surface border-zinc-800" : "bg-white border-zinc-100"
      )}>
        <div className="flex justify-between items-center mb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">
              {tableNumber ? `Mesa ${tableNumber}` : settings.store_name || 'Cardápio Online'}
            </h1>
            <div className="flex items-center gap-3">
              <p className={cn(
                "flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest",
                settings.is_open === "1" ? "text-emerald-500" : "text-red-500"
              )}>
                <span className={cn("w-2 h-2 rounded-full animate-pulse", settings.is_open === "1" ? "bg-emerald-500" : "bg-red-500")} />
                {settings.is_open === "1" ? "Aberto Agora" : "Fechado"}
              </p>
              <span className="w-1 h-1 bg-zinc-700 rounded-full" />
              <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-1">
                <Clock className="w-3 h-3" /> 30-45 min
              </p>
            </div>
          </div>
          {settings.enable_reservations === "1" && !tableNumber && (
            <button 
              onClick={() => setIsReservationModalOpen(true)}
              className="bg-orange-500 text-white p-3 rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-105 transition-all active:scale-95"
            >
              <Calendar className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <MenuIcon className="w-4 h-4 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
          </div>
          <input 
            type="text"
            placeholder="O que você quer comer hoje?"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={cn(
              "w-full pl-12 pr-4 py-4 rounded-2xl outline-none border transition-all font-bold text-sm",
              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' 
                ? "bg-zinc-950 border-zinc-800 focus:border-orange-500 text-white" 
                : "bg-zinc-50 border-zinc-100 focus:border-orange-500 text-zinc-900"
            )}
          />
        </div>

        {settings.is_open === "0" && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs font-black uppercase tracking-tight">Pedidos desabilitados no momento.</p>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className={cn(
        "sticky top-[64px] z-40 border-b overflow-x-auto whitespace-nowrap px-4 py-4 flex gap-2 no-scrollbar backdrop-blur-xl transition-colors",
        settings.catalog_theme === 'dark' ? "bg-zinc-950/80 border-zinc-800" : 
        settings.catalog_theme === 'brand' ? "bg-brand-bg/80 border-zinc-800" : "bg-white/80 border-zinc-100"
      )}>
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
            selectedCategory === null 
              ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
              : settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand'
                ? "bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800"
                : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
          )}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
              selectedCategory === cat.id 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" 
                : settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand'
                  ? "bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products List (Compact) */}
      <div className="p-4 space-y-4 max-w-4xl mx-auto">
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="bg-zinc-900 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto border border-zinc-800">
              <X className="w-8 h-8 text-zinc-700" />
            </div>
            <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">Nenhum produto encontrado</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <motion.div
              layout
              key={product.id}
              onClick={() => product.is_available && settings.is_open === "1" && addToCart(product)}
              className={cn(
                "rounded-3xl p-4 border flex gap-4 transition-all active:scale-[0.98] cursor-pointer group",
                settings.catalog_theme === 'dark' ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" : 
                settings.catalog_theme === 'brand' ? "bg-brand-surface border-zinc-800 hover:border-zinc-700" : "bg-white border-zinc-100 hover:border-zinc-200 shadow-sm"
              )}
            >
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight mb-1 group-hover:text-orange-500 transition-colors">{product.name}</h3>
                  <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 font-medium">{product.description}</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-orange-500 font-black text-lg tracking-tighter">R$ {product.price.toFixed(2)}</span>
                  <div className={cn(
                    "p-2 rounded-xl transition-all",
                    product.is_available && settings.is_open === "1"
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                      : "bg-zinc-800 text-zinc-600"
                  )}>
                    <Plus className="w-4 h-4" />
                  </div>
                </div>
              </div>
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0">
                <img 
                  src={product.image_url || 'https://picsum.photos/seed/food/200/200'} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
                {!product.is_available && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="bg-white text-zinc-900 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">Esgotado</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>

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
      </AnimatePresence>

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
                settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "border-zinc-800" : "border-zinc-100"
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
                      settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "bg-zinc-800/50 border-zinc-700" : "bg-zinc-50 border-zinc-100"
                    )}>
                      <img src={item.image_url || 'https://picsum.photos/seed/food/100/100'} className="w-20 h-20 object-cover rounded-xl" />
                      <div className="flex-1">
                        <h4 className="font-bold uppercase tracking-tight">{item.name}</h4>
                        <p className="text-orange-500 font-black text-sm mb-2">R$ {item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-3">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-zinc-200 rounded-lg"><Minus className="w-4 h-4" /></button>
                          <span className="font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-zinc-200 rounded-lg"><Plus className="w-4 h-4" /></button>
                          <button onClick={() => removeFromCart(item.id)} className="ml-auto p-1 text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className={cn(
                  "p-6 border-t space-y-4",
                  settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "border-zinc-800 bg-zinc-900" : "border-zinc-100 bg-zinc-50"
                )}>
                  {!tableNumber && (
                    <div className="space-y-4">
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
                            <option key={n.id} value={n.id}>{n.name} - R$ {n.delivery_fee.toFixed(2)}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Pagamento</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button 
                            onClick={() => setPaymentMethod('pix')}
                            className={cn(
                              "p-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all",
                              paymentMethod === 'pix' ? "bg-orange-500 text-white border-orange-500" : 
                              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"
                            )}
                          >
                            PIX
                          </button>
                          <button 
                            onClick={() => setPaymentMethod('entrega')}
                            className={cn(
                              "p-3 rounded-xl border font-bold text-xs uppercase tracking-widest transition-all",
                              paymentMethod === 'entrega' ? "bg-orange-500 text-white border-orange-500" : 
                              settings.catalog_theme === 'dark' || settings.catalog_theme === 'brand' ? "bg-zinc-800 border-zinc-700 text-zinc-400" : "bg-white border-zinc-200 text-zinc-600"
                            )}
                          >
                            Entrega
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between text-sm font-bold opacity-60">
                      <span>Subtotal</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    {!tableNumber && (
                      <div className="flex justify-between text-sm font-bold opacity-60">
                        <span>Taxa de Entrega</span>
                        <span>R$ {deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-black uppercase tracking-tighter pt-2 border-t border-zinc-200/20">
                      <span>Total</span>
                      <span className="text-orange-500">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button 
                    onClick={handleCheckout}
                    disabled={(!tableNumber && !selectedNeighborhood) || settings.is_open === "0"}
                    className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50"
                  >
                    Finalizar Pedido
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      onLogin();
    } else {
      setError('Usuário ou senha incorretos');
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-brand-surface p-10 rounded-[40px] shadow-2xl w-full max-w-md border border-zinc-800"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="bg-brand-accent p-4 rounded-2xl mb-6 shadow-xl shadow-brand-accent/20">
            <ChefHat className="text-brand-bg w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Acesso <span className="text-brand-accent">Admin</span></h1>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mt-2">Entre com suas credenciais</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Usuário</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 p-4 rounded-2xl focus:ring-2 focus:ring-brand-accent outline-none text-white transition-all"
              placeholder="admin"
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
            className="w-full bg-brand-accent text-brand-bg py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/20"
          >
            Entrar no Painel
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const AdminDashboard = ({ slug }: { slug: string }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'tables' | 'delivery' | 'categories' | 'orders' | 'commands' | 'reservations' | 'ai' | 'help' | 'settings'>('orders');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tables, setTables] = useState<{id: number, number: number}[]>([]);
  const [commands, setCommands] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

  const apiFetch = (url: string, options: any = {}) => {
    return window.fetch(`/api/e${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'x-establishment-slug': slug,
        'Content-Type': 'application/json'
      }
    });
  };

  const printOrder = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const neighborhood = neighborhoods.find(n => n.id === order.neighborhood_id);
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Imprimir Pedido #${order.id}</title>
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
            <h2>${settings.store_name || 'MaisQueCardapio'}</h2>
            <p>Pedido #${order.id}</p>
            <p>${new Date(order.created_at).toLocaleString()}</p>
          </div>
          <div class="details">
            <p><strong>Cliente:</strong> ${order.customer_name || 'N/A'}</p>
            <p><strong>Tipo:</strong> ${order.type === 'table' ? 'Mesa' : 'Delivery'}</p>
            ${order.address ? `<p><strong>Endereço:</strong> ${order.address}</p>` : ''}
            ${neighborhood ? `<p><strong>Bairro:</strong> ${neighborhood.name}</p>` : ''}
          </div>
          <div class="items">
            ${order.items_text ? order.items_text.split('\n').map((line: string) => `<div class="item"><span>${line}</span></div>`).join('') : ''}
          </div>
          <div class="total">
            <span>TOTAL:</span>
            <span>R$ ${order.total.toFixed(2)}</span>
          </div>
          <p><strong>Pagamento:</strong> ${order.payment_method.toUpperCase()}</p>
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
  
  // Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isNeighborhoodModalOpen, setIsNeighborhoodModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [isPrintViewOpen, setIsPrintViewOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  useEffect(() => {
    if (isLoggedIn) {
      apiFetch('/products').then(res => res.json()).then(setProducts);
      apiFetch('/categories').then(res => res.json()).then(setCategories);
      apiFetch('/neighborhoods').then(res => res.json()).then(setNeighborhoods);
      apiFetch('/tables').then(res => res.json()).then(setTables);
      apiFetch('/commands').then(res => res.json()).then(setCommands);
      apiFetch('/reservations').then(res => res.json()).then(setReservations);
      apiFetch('/orders').then(res => res.json()).then(setOrders);
      apiFetch('/settings').then(res => res.json()).then(setSettings);
    }
  }, [isLoggedIn, slug]);

  if (!isLoggedIn) {
    return <AdminLogin onLogin={() => setIsLoggedIn(true)} />;
  }

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
    alert('Configurações salvas!');
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingProduct ? `/products/${editingProduct.id}` : '/products';
    const method = editingProduct ? 'PUT' : 'POST';
    
    const res = await apiFetch(url, {
      method,
      body: JSON.stringify({
        ...formData,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
        is_available: editingProduct ? editingProduct.is_available : true
      })
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error);
      return;
    }

    setIsProductModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', image_url: '', category_id: '' });
    apiFetch('/products').then(res => res.json()).then(setProducts);
  };

  const handleNeighborhoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/neighborhoods', {
      method: 'POST',
      body: JSON.stringify({
        ...neighborhoodData,
        delivery_fee: parseFloat(neighborhoodData.delivery_fee)
      })
    });
    setIsNeighborhoodModalOpen(false);
    setNeighborhoodData({ name: '', delivery_fee: '' });
    apiFetch('/neighborhoods').then(res => res.json()).then(setNeighborhoods);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
    setIsCategoryModalOpen(false);
    setCategoryData({ name: '' });
    apiFetch('/categories').then(res => res.json()).then(setCategories);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image_url: product.image_url,
      category_id: product.category_id.toString()
    });
    setIsProductModalOpen(true);
  };

  const toggleAvailability = async (product: Product) => {
    const updated = { ...product, is_available: !product.is_available };
    await apiFetch(`/products/${product.id}`, {
      method: 'PUT',
      body: JSON.stringify(updated)
    });
    setProducts(prev => prev.map(p => p.id === product.id ? updated : p));
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Tem certeza?')) return;
    await window.fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white selection:bg-brand-accent selection:text-brand-bg">
      <Navbar 
        settings={settings} 
        slug={slug} 
        onLogout={() => {
          setIsLoggedIn(false);
          localStorage.removeItem(`admin_auth_${slug}`);
        }} 
      />
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter">Painel <span className="text-brand-accent">Administrativo</span></h1>
            <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest mt-1">Gerencie seu cardápio e pedidos</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
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
                "flex-1 md:flex-none px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl",
                settings.is_open === "1" 
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-emerald-500/5" 
                  : "bg-red-500/10 text-red-500 border border-red-500/20 shadow-red-500/5"
              )}
            >
              <Power className="w-5 h-5" />
              {settings.is_open === "1" ? "Aberto" : "Fechado"}
            </button>
            <button 
              onClick={() => {
                setEditingProduct(null);
                setFormData({ name: '', description: '', price: '', image_url: '', category_id: categories[0]?.id.toString() || '' });
                setIsProductModalOpen(true);
              }}
              className="flex-1 md:flex-none bg-brand-accent text-brand-bg px-8 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/20"
            >
              <Plus className="w-5 h-5" /> Novo Produto
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Smartphone, label: "Produtos Ativos", value: products.filter(p => p.is_available).length, color: "blue" },
            { icon: LayoutDashboard, label: "Categorias", value: categories.length, color: "orange" },
            { icon: QrCode, label: "Mesas Ativas", value: tables.length, color: "emerald" }
          ].map((stat, i) => (
            <div key={i} className="bg-brand-surface p-8 rounded-3xl border border-zinc-800 shadow-sm group hover:border-brand-accent/30 transition-all">
              <div className={`bg-brand-accent/10 text-brand-accent p-4 rounded-2xl w-fit mb-6 group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">{stat.label}</h3>
              <p className="text-4xl font-black text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-8 border-b border-zinc-800 overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
          {[
            { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
            { id: 'reservations', label: 'Reservas', icon: Calendar },
            { id: 'products', label: 'Produtos', icon: MenuIcon },
            { id: 'categories', label: 'Categorias', icon: LayoutDashboard },
            { id: 'delivery', label: 'Delivery', icon: Bike },
            { id: 'tables', label: 'Mesas', icon: QrCode },
            { id: 'ai', label: 'IA Insights', icon: Sparkles },
            { id: 'settings', label: 'Configurações', icon: Settings }
          ].map(tab => {
            if (tab.id === 'reservations' && settings.enable_reservations !== "1") return null;
            if (tab.id === 'ai' && settings.enable_ai !== "1") return null;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-6 py-4 text-sm font-black uppercase tracking-widest flex items-center gap-3 transition-all border-b-2",
                  activeTab === tab.id 
                    ? "border-brand-accent text-brand-accent bg-brand-accent/5" 
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="font-bold text-lg text-zinc-900">Lista de Produtos</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Produto</th>
                    <th className="px-6 py-4 font-semibold">Categoria</th>
                    <th className="px-6 py-4 font-semibold">Preço</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 font-semibold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {products.map(product => (
                    <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={product.image_url} className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <span className="font-medium text-zinc-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-zinc-500">
                        {categories.find(c => c.id === product.category_id)?.name}
                      </td>
                      <td className="px-6 py-4 font-bold text-zinc-900">
                        R$ {product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleAvailability(product)}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold transition-all",
                            product.is_available ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          )}
                        >
                          {product.is_available ? 'Disponível' : 'Indisponível'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditProduct(product)}
                            className="p-2 text-zinc-400 hover:text-blue-500 transition-colors"
                          >
                            <Settings className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => deleteProduct(product.id)}
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
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-900">Gerenciamento de Mesas</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsPrintViewOpen(true)}
                  className="bg-zinc-100 text-zinc-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-zinc-200"
                >
                  <QrCode className="w-4 h-4" /> Imprimir Todos
                </button>
                <button 
                  onClick={() => setIsTableModalOpen(true)}
                  className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-orange-600"
                >
                  <Plus className="w-4 h-4" /> Adicionar Mesa
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tables.map((table) => {
                const tableUrl = `${window.location.origin}/?mesa=${table.number}`;
                return (
                  <div key={table.id} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col items-center gap-4 group relative">
                    <button 
                      onClick={async () => {
                        if (confirm(`Deletar Mesa ${table.number}?`)) {
                          await apiFetch(`/tables/${table.id}`, { method: 'DELETE' });
                          apiFetch('/tables').then(res => res.json()).then(setTables);
                        }
                      }}
                      className="absolute top-2 right-2 p-1 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-zinc-900 text-xl">Mesa {table.number}</span>
                    <div className="bg-white p-2 rounded-xl border border-zinc-100 shadow-inner group-hover:scale-105 transition-transform">
                      <QRCodeSVG value={tableUrl} size={120} />
                    </div>
                    <div className="flex flex-col gap-2 w-full">
                      <button 
                        onClick={() => window.open(tableUrl, '_blank')}
                        className="text-xs font-bold text-orange-500 hover:bg-orange-50 py-2 rounded-lg transition-colors border border-orange-100"
                      >
                        Abrir Cardápio
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-zinc-900">Taxas por Bairro</h2>
              <button 
                onClick={() => setIsNeighborhoodModalOpen(true)}
                className="text-orange-500 font-bold text-sm"
              >
                + Adicionar Bairro
              </button>
            </div>
            <div className="divide-y divide-zinc-100">
              {neighborhoods.map(n => (
                <div key={n.id} className="p-6 flex justify-between items-center hover:bg-zinc-50 transition-colors">
                  <div>
                    <h4 className="font-bold text-zinc-900">{n.name}</h4>
                    <p className="text-zinc-500 text-sm">Taxa de entrega</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-zinc-900">R$ {n.delivery_fee.toFixed(2)}</span>
                    <button 
                      onClick={async () => {
                        if (confirm('Deletar bairro?')) {
                          await apiFetch(`/neighborhoods/${n.id}`, { method: 'DELETE' });
                          apiFetch('/neighborhoods').then(res => res.json()).then(setNeighborhoods);
                        }
                      }}
                      className="p-2 text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
              <h2 className="font-bold text-lg text-zinc-900">Categorias</h2>
              <button 
                onClick={() => setIsCategoryModalOpen(true)}
                className="text-orange-500 font-bold text-sm"
              >
                + Nova Categoria
              </button>
            </div>
            <div className="divide-y divide-zinc-100">
              {categories.map(c => (
                <div key={c.id} className="p-6 flex justify-between items-center hover:bg-zinc-50 transition-colors">
                  <span className="font-bold text-zinc-900">{c.name}</span>
                  <button 
                    onClick={async () => {
                      if (confirm('Deletar categoria?')) {
                        await apiFetch(`/categories/${c.id}`, { method: 'DELETE' });
                        apiFetch('/categories').then(res => res.json()).then(setCategories);
                      }
                    }}
                    className="p-2 text-zinc-400 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-900">Histórico de Pedidos</h2>
              <p className="text-zinc-500 text-sm">Últimos 50 pedidos realizados</p>
            </div>
            {orders.length === 0 ? (
              <div className="p-12 text-center">
                <ShoppingCart className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                <p className="text-zinc-400">Nenhum pedido registrado ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Data</th>
                      <th className="px-6 py-4 font-semibold">Tipo</th>
                      <th className="px-6 py-4 font-semibold">Pagamento</th>
                      <th className="px-6 py-4 font-semibold">Total</th>
                      <th className="px-6 py-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {orders.map(order => (
                      <tr key={order.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-zinc-600">
                          {new Date(order.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                            order.type === 'table' ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                          )}>
                            {order.type === 'table' ? 'Mesa' : 'Delivery'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-zinc-600 uppercase">
                          {order.payment_method}
                        </td>
                        <td className="px-6 py-4 font-bold text-zinc-900">
                          R$ {order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <span className="bg-zinc-100 text-zinc-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">
                            {order.status}
                          </span>
                          <button 
                            onClick={() => printOrder(order)}
                            className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                            title="Imprimir Cupom"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'commands' && (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-900">Comandas Abertas</h2>
              <p className="text-zinc-500 text-sm">Pedidos ativos em mesas</p>
            </div>
            {commands.length === 0 ? (
              <div className="p-12 text-center">
                <ChefHat className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                <p className="text-zinc-400">Nenhuma comanda aberta no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                {commands.map(cmd => (
                  <div key={cmd.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <div className="flex justify-between items-start mb-2">
                      <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full">Mesa {cmd.table_number}</span>
                      <span className="text-zinc-400 text-xs">{new Date(cmd.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="font-bold text-zinc-900">Garçom: {cmd.waiter_name || 'Cliente'}</p>
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={async () => {
                          if (confirm('Fechar comanda?')) {
                            await apiFetch(`/commands/${cmd.id}`, {
                              method: 'PUT',
                              body: JSON.stringify({ status: 'closed' })
                            });
                            apiFetch('/commands').then(res => res.json()).then(setCommands);
                          }
                        }}
                        className="flex-1 bg-zinc-900 text-white py-2 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors"
                      >
                        Fechar Conta
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reservations' && settings.enable_reservations === "1" && (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
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

        {activeTab === 'ai' && settings.enable_ai === "1" && (
          <AIInsights products={products} categories={categories} settings={settings} />
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6">Configurações Gerais</h2>
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Nome da Loja</label>
                  <input 
                    value={settings.store_name || ''} 
                    onChange={e => setSettings({...settings, store_name: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">URL da Logo</label>
                  <input 
                    value={settings.store_logo || ''} 
                    onChange={e => setSettings({...settings, store_logo: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                    placeholder="https://exemplo.com/logo.png"
                  />
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
                      className="flex-1 bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
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
                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent text-sm"
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
                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent text-sm"
                      >
                        <option value="sans">Inter (Moderna)</option>
                        <option value="display">Outfit (Elegante)</option>
                        <option value="mono">JetBrains Mono (Tech)</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">URL do Banner (Topo)</label>
                      <input 
                        value={settings.catalog_banner || ''} 
                        onChange={e => setSettings({...settings, catalog_banner: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-brand-accent text-sm" 
                        placeholder="https://exemplo.com/banner.jpg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">WhatsApp Cozinha (Pedidos Mesa)</label>
                  <input 
                    value={settings.whatsapp_kitchen || ''} 
                    onChange={e => setSettings({...settings, whatsapp_kitchen: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                    placeholder="Ex: 5511999999999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">WhatsApp Caixa (Pedidos Delivery)</label>
                  <input 
                    value={settings.whatsapp_cashier || ''} 
                    onChange={e => setSettings({...settings, whatsapp_cashier: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                    placeholder="Ex: 5511999999999"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Chave PIX</label>
                  <input 
                    value={settings.pix_key || ''} 
                    onChange={e => setSettings({...settings, pix_key: e.target.value})}
                    className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                  />
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

                <div className="pt-6 border-t border-zinc-100 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-emerald-100 p-2 rounded-lg">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-bold text-zinc-900">Evolution API v2 (WhatsApp)</h3>
                  </div>
                  
                  <label className="flex items-center gap-3 cursor-pointer group mb-4">
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
                    <span className="text-sm font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors">Ativar Automação WhatsApp</span>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">API URL</label>
                      <input 
                        value={settings.evolution_api_url || ''} 
                        onChange={e => setSettings({...settings, evolution_api_url: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" 
                        placeholder="https://sua-api.com"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">API Key</label>
                      <input 
                        type="password"
                        value={settings.evolution_api_key || ''} 
                        onChange={e => setSettings({...settings, evolution_api_key: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Instância</label>
                      <input 
                        value={settings.evolution_instance || ''} 
                        onChange={e => setSettings({...settings, evolution_instance: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm" 
                        placeholder="Ex: Main"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h3 className="font-bold text-zinc-900">IA Insights (Opcional)</h3>
                  </div>
                  
                  <label className="flex items-center gap-3 cursor-pointer group mb-4">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={settings.enable_ai === "1"}
                        onChange={e => setSettings({...settings, enable_ai: e.target.checked ? "1" : "0"})}
                      />
                      <div className={cn(
                        "w-12 h-6 rounded-full transition-colors",
                        settings.enable_ai === "1" ? "bg-indigo-500" : "bg-zinc-200"
                      )} />
                      <div className={cn(
                        "absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform",
                        settings.enable_ai === "1" ? "translate-x-6" : "translate-x-0"
                      )} />
                    </div>
                    <span className="text-sm font-bold text-zinc-700 group-hover:text-zinc-900 transition-colors">Ativar Consultoria por IA</span>
                  </label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Provedor</label>
                      <select 
                        value={settings.ai_provider || 'gemini'} 
                        onChange={e => setSettings({...settings, ai_provider: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      >
                        <option value="gemini">Google Gemini</option>
                        <option value="openai">OpenAI (GPT)</option>
                        <option value="openrouter">OpenRouter</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Chave API Própria</label>
                      <input 
                        type="password"
                        value={settings.ai_api_key || ''} 
                        onChange={e => setSettings({...settings, ai_api_key: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm" 
                        placeholder="Insira sua chave"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">Nota: Atualmente otimizado para Gemini. Outros provedores requerem configuração de endpoint futura.</p>
                </div>
              </div>
              <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100">
                Salvar Alterações
              </button>
            </form>
          </div>
        )}

        {activeTab === 'help' && (
          <div className="bg-white rounded-3xl border border-zinc-100 shadow-sm p-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
              <HelpCircle className="text-orange-500" /> Manual do Sistema
            </h2>
            
            <div className="space-y-8 text-zinc-600">
              <section>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">1. Pedidos Online (Delivery)</h3>
                <p>Os clientes acessam o link principal da sua loja. Ao finalizar, eles escolhem o bairro (com taxa automática) e a forma de pagamento. O pedido é enviado formatado para o seu WhatsApp.</p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">2. Pedidos em Mesas (QR Code)</h3>
                <p>Cada mesa possui um QR Code exclusivo. Quando o cliente escaneia, o sistema já sabe em qual mesa ele está. O pedido chega no WhatsApp identificando o número da mesa.</p>
                <div className="mt-2 bg-orange-50 p-4 rounded-xl border border-orange-100">
                  <p className="text-sm text-orange-800 font-medium">Dica: Imprima os QR Codes da aba "Mesas" e cole-os nas mesas físicas.</p>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">3. Garçons e Comandas</h3>
                <p>Os garçons não precisam de um login complexo. Eles podem usar o próprio celular para escanear o QR Code da mesa e realizar o pedido em nome do cliente. Na aba "Comandas", o gerente pode visualizar o que está aberto em cada mesa.</p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">4. Gestão de Estoque</h3>
                <p>No painel de "Produtos", você pode desativar um item que acabou. Ele continuará aparecendo no cardápio, mas com uma tarja de "Esgotado" e o botão de compra desabilitado.</p>
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
                onClick={() => setIsCategoryModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-zinc-900">Nova Categoria</h2>
                  <button onClick={() => setIsCategoryModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleCategorySubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Nome da Categoria</label>
                    <input required value={categoryData.name} onChange={e => setCategoryData({...categoryData, name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all">Adicionar Categoria</button>
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
                className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-zinc-900">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
                  <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleProductSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Nome</label>
                      <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Descrição</label>
                      <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 h-24" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Preço (R$)</label>
                      <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-zinc-700 mb-1">Categoria</label>
                      <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500">
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-bold text-zinc-700 mb-1">URL da Imagem</label>
                      <input required value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all">Salvar Produto</button>
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
                className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-zinc-900">Novo Bairro</h2>
                  <button onClick={() => setIsNeighborhoodModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleNeighborhoodSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Nome do Bairro</label>
                    <input required value={neighborhoodData.name} onChange={e => setNeighborhoodData({...neighborhoodData, name: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Taxa de Entrega (R$)</label>
                    <input required type="number" step="0.01" value={neighborhoodData.delivery_fee} onChange={e => setNeighborhoodData({...neighborhoodData, delivery_fee: e.target.value})} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
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
                className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
              >
                <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-zinc-900">Nova Mesa</h2>
                  <button onClick={() => setIsTableModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                <form onSubmit={handleTableSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Número da Mesa</label>
                    <input required type="number" value={tableNumber} onChange={e => setTableNumber(e.target.value)} className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" />
                  </div>
                  <button type="submit" className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all">Adicionar Mesa</button>
                </form>
              </motion.div>
            </div>
          )}

          {isPrintViewOpen && (
            <div className="fixed inset-0 z-[150] bg-white overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8 print:hidden">
                  <h2 className="text-2xl font-bold">QR Codes das Mesas</h2>
                  <div className="flex gap-4">
                    <button onClick={() => window.print()} className="bg-zinc-900 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
                      <Download className="w-5 h-5" /> Imprimir
                    </button>
                    <button onClick={() => setIsPrintViewOpen(false)} className="bg-zinc-100 text-zinc-600 px-6 py-2 rounded-xl font-bold">
                      Fechar
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                  {tables.map(table => (
                    <div key={table.id} className="border-2 border-zinc-200 p-6 rounded-3xl flex flex-col items-center gap-4 text-center">
                      <div className="bg-orange-500 p-3 rounded-2xl mb-2">
                        <ChefHat className="text-white w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-zinc-900">MESA {table.number}</h3>
                        <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Escaneie para pedir</p>
                      </div>
                      <div className="p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                        <QRCodeSVG value={`${window.location.origin}/?mesa=${table.number}`} size={180} />
                      </div>
                      <p className="text-zinc-400 text-[10px] font-mono">{window.location.origin}/?mesa={table.number}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- App ---

// --- SaaS Components ---

const LandingPage = () => {
  const [formData, setFormData] = useState({ name: '', slug: '', owner_whatsapp: '', password: '' });
  const [loginData, setLoginData] = useState({ slug: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await window.fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = `/e/${data.slug}/admin`;
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Erro ao registrar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/e/${loginData.slug}/admin`;
  };

  return (
    <div className="min-h-screen bg-brand-bg text-white flex flex-col selection:bg-brand-accent selection:text-brand-bg scroll-smooth">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full sticky top-0 bg-brand-bg/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="bg-brand-accent p-2 rounded-xl shadow-lg shadow-brand-accent/20">
            <ChefHat className="text-brand-bg w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">MaisQueCardapio</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="#como-funciona" className="text-zinc-400 font-medium hover:text-white transition-colors hidden md:block">Como Funciona</a>
          <a href="#planos" className="text-zinc-400 font-medium hover:text-white transition-colors hidden md:block">Planos</a>
          <Link to="/e/demo" className="text-zinc-400 font-medium hover:text-white transition-colors">Ver Demo</Link>
          <button 
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-zinc-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-zinc-700 transition-all border border-zinc-700"
          >
            Entrar
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center px-6">
        {/* Hero Section */}
        <section className="py-20 md:py-32 flex flex-col items-center text-center max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-brand-accent/10 text-brand-accent px-4 py-2 rounded-full text-sm font-bold mb-8 border border-brand-accent/20"
          >
            <Sparkles className="w-4 h-4" /> A solução definitiva para seu restaurante
          </motion.div>
          <h1 className="text-6xl md:text-9xl font-black text-white mb-8 tracking-tighter leading-[0.85] uppercase">
            Seu cardápio <br />
            <span className="text-brand-accent">Digital & Inteligente</span>
          </h1>
          <p className="text-xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Transforme seu estabelecimento com QR Code na mesa, delivery automatizado e inteligência artificial. Simples, rápido e profissional.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <a href="#register" className="bg-brand-accent text-brand-bg px-10 py-5 rounded-2xl font-black uppercase tracking-wider hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/20 text-lg">
              Começar Agora
            </a>
            <Link to="/e/demo" className="bg-zinc-800 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-wider hover:bg-zinc-700 transition-all border border-zinc-700 text-lg">
              Ver Exemplo
            </Link>
          </div>
        </section>

        {/* Stats Section */}
        <section className="w-full max-w-7xl grid grid-cols-2 md:grid-cols-4 gap-8 py-20 border-y border-zinc-900 mb-32">
          {[
            { label: "Lojas Ativas", value: "500+" },
            { label: "Pedidos/Mês", value: "50k+" },
            { label: "Economia Garçom", value: "40%" },
            { label: "Aumento Vendas", value: "25%" }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</p>
              <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Features Grid */}
        <section id="features" className="max-w-7xl w-full mb-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Tudo que você <span className="text-brand-accent">precisa</span></h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Funcionalidades pensadas para o seu crescimento</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: QrCode, title: "QR Code na Mesa", desc: "Seus clientes pedem direto da mesa sem precisar de garçom para anotar." },
              { icon: Bike, title: "Delivery Integrado", desc: "Gestão completa de entregas com taxas personalizadas por bairro." },
              { icon: Sparkles, title: "IA de Sugestões", desc: "Nossa inteligência artificial sugere melhorias no seu cardápio para vender mais." },
              { icon: Smartphone, title: "WhatsApp Automático", desc: "Receba todos os pedidos detalhados direto no seu WhatsApp." },
              { icon: Calendar, title: "Reservas Online", desc: "Permita que seus clientes reservem mesas com antecedência de forma simples." },
              { icon: LayoutDashboard, title: "Painel Completo", desc: "Controle total de estoque, categorias, mesas e relatórios de vendas." }
            ].map((f, i) => (
              <div key={i} className="bg-brand-surface p-8 rounded-3xl border border-zinc-800 hover:border-brand-accent/50 transition-all group">
                <div className="bg-brand-accent/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <f.icon className="text-brand-accent w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-white uppercase tracking-tight">{f.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it Works */}
        <section id="como-funciona" className="max-w-7xl w-full mb-32 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-8">
                Como <br />
                <span className="text-brand-accent">Funciona?</span>
              </h2>
              <div className="space-y-12">
                {[
                  { step: "01", title: "Cadastre sua Loja", desc: "Crie sua conta e configure as informações básicas do seu estabelecimento em segundos." },
                  { step: "02", title: "Monte seu Cardápio", desc: "Adicione seus produtos, fotos e preços. Organize por categorias para facilitar a escolha." },
                  { step: "03", title: "Imprima os QR Codes", desc: "Gere os códigos das mesas e comece a receber pedidos direto no seu WhatsApp." }
                ].map((s, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-4xl font-black text-brand-accent/20 leading-none">{s.step}</span>
                    <div>
                      <h4 className="text-xl font-bold text-white mb-2 uppercase tracking-tight">{s.title}</h4>
                      <p className="text-zinc-400 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-brand-accent/20 blur-[120px] rounded-full" />
              <div className="relative bg-zinc-900 border border-zinc-800 rounded-[40px] p-4 shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
                <div className="text-center">
                  <div className="bg-brand-accent/10 p-6 rounded-full inline-block mb-4">
                    <Smartphone className="w-12 h-12 text-brand-accent" />
                  </div>
                  <p className="font-black uppercase tracking-widest text-zinc-500">Interface Intuitiva</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="planos" className="max-w-7xl w-full mb-32">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">Planos <span className="text-brand-accent">Sob Medida</span></h2>
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Escolha o melhor para o seu momento</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {[
              { 
                name: "Gratuito", 
                price: "R$ 0", 
                desc: "Ideal para quem está começando",
                features: ["Até 10 produtos", "QR Code na Mesa", "Pedidos via WhatsApp", "Painel Básico"],
                cta: "Começar Grátis",
                popular: false
              },
              { 
                name: "Premium", 
                price: "R$ 49,90", 
                desc: "Para quem quer profissionalismo total",
                features: ["Produtos Ilimitados", "IA de Insights", "Reservas de Mesa", "Automação WhatsApp", "Suporte Prioritário"],
                cta: "Assinar Premium",
                popular: true
              }
            ].map((plan, i) => (
              <div key={i} className={cn(
                "p-10 rounded-[40px] border flex flex-col relative overflow-hidden",
                plan.popular ? "bg-brand-accent text-brand-bg border-brand-accent shadow-2xl shadow-brand-accent/20" : "bg-brand-surface text-white border-zinc-800"
              )}>
                {plan.popular && (
                  <div className="absolute top-6 right-6 bg-brand-bg text-brand-accent px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Mais Popular
                  </div>
                )}
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-5xl font-black">{plan.price}</span>
                  <span className="text-sm font-bold opacity-60">/mês</span>
                </div>
                <p className="text-sm font-medium mb-8 opacity-80">{plan.desc}</p>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm font-bold">
                      <Check className={cn("w-4 h-4", plan.popular ? "text-brand-bg" : "text-brand-accent")} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={cn(
                  "w-full py-5 rounded-2xl font-black uppercase tracking-widest transition-all",
                  plan.popular ? "bg-brand-bg text-brand-accent hover:bg-zinc-900" : "bg-brand-accent text-brand-bg hover:bg-brand-accent-hover"
                )}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Registration Form */}
        <section id="register" className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-brand-surface p-12 rounded-[40px] border border-zinc-800 shadow-2xl relative overflow-hidden mb-32">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 blur-[100px] rounded-full -mr-32 -mt-32" />
          
          <div>
            <h2 className="text-4xl font-black mb-6 uppercase tracking-tighter leading-none">
              Pronto para <br />
              <span className="text-brand-accent">Evoluir?</span>
            </h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Crie sua conta em menos de 1 minuto e comece a vender hoje mesmo. Sem taxas de adesão, sem burocracia.
            </p>
            <ul className="space-y-4">
              {["Teste grátis por 7 dias", "Suporte prioritário", "Configuração instantânea"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-bold text-zinc-300">
                  <div className="bg-brand-accent/20 p-1 rounded-full">
                    <Check className="w-3 h-3 text-brand-accent" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-zinc-950 p-8 rounded-3xl border border-zinc-800 relative z-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Nome do Estabelecimento</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent text-white transition-all" 
                  placeholder="Ex: Burger do João"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">URL personalizada</label>
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-accent transition-all">
                  <span className="pl-4 text-zinc-500 text-sm font-bold">/e/</span>
                  <input 
                    required
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    className="w-full bg-transparent p-4 outline-none text-sm text-white" 
                    placeholder="joao-burger"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">WhatsApp</label>
                <input 
                  required
                  type="tel"
                  value={formData.owner_whatsapp}
                  onChange={e => setFormData({...formData, owner_whatsapp: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent text-white transition-all" 
                  placeholder="Ex: 5511999999999"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Senha</label>
                <input 
                  required
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent text-white transition-all" 
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-brand-accent text-brand-bg py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/20 disabled:opacity-50 mt-4"
              >
                {loading ? 'Criando...' : 'Criar Meu Cardápio'}
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="p-12 border-t border-zinc-900 bg-brand-bg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="bg-brand-accent/20 p-2 rounded-xl">
              <ChefHat className="text-brand-accent w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">MaisQueCardapio</span>
          </div>
          <p className="text-zinc-500 text-sm">© 2026 MaisQueCardapio. Inspirado em To-Ligado.com</p>
          <div className="flex gap-8">
            <Link to="/superadmin" className="text-zinc-500 hover:text-brand-accent text-sm font-bold uppercase tracking-widest transition-colors">Painel Mestre</Link>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-brand-surface w-full max-w-md rounded-[32px] shadow-2xl p-10 border border-zinc-800"
            >
              <button onClick={() => setIsLoginModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors"><X className="w-6 h-6" /></button>
              <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">Login <span className="text-brand-accent">Lojista</span></h2>
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase mb-2 tracking-widest">Slug da sua loja</label>
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-brand-accent transition-all">
                    <span className="pl-4 text-zinc-500 text-sm font-bold">/e/</span>
                    <input 
                      required
                      value={loginData.slug}
                      onChange={e => setLoginData({...loginData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      className="w-full bg-transparent p-4 outline-none text-sm text-white" 
                      placeholder="sua-loja"
                    />
                  </div>
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">Você será redirecionado para a página de login administrativa da sua loja.</p>
                <button type="submit" className="w-full bg-brand-accent text-brand-bg py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/20">
                  Ir para o Painel
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SuperAdmin = () => {
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isEstModalOpen, setIsEstModalOpen] = useState(false);
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
    enable_automation: false
  });
  const [estForm, setEstForm] = useState({
    plan_id: '',
    status: ''
  });

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
    }
  }, [isSuperLoggedIn, authToken]);

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
        enable_automation: planForm.enable_automation ? 1 : 0
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
      enable_automation: false
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
          className="bg-brand-surface p-8 rounded-[32px] border border-zinc-800 w-full max-md shadow-2xl"
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
            <button className="w-full bg-brand-accent text-brand-bg py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-accent-hover transition-all shadow-xl shadow-brand-accent/20">
              Acessar Painel
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen bg-brand-bg flex items-center justify-center text-white font-black uppercase tracking-widest">Carregando painel mestre...</div>;

  return (
    <div className="min-h-screen bg-brand-bg text-white">
      <nav className="bg-brand-bg/80 backdrop-blur-md border-b border-zinc-900 p-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-brand-accent p-2 rounded-xl">
              <ShieldCheck className="w-5 h-5 text-brand-bg" />
            </div>
            <span className="font-black uppercase tracking-tighter text-xl">SuperAdmin</span>
          </div>
          <button 
            onClick={() => { setIsSuperLoggedIn(false); }}
            className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all"
          >
            Sair
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-brand-surface p-6 rounded-3xl border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase font-black tracking-widest mb-1">Total Lojas</p>
            <p className="text-4xl font-black">{establishments.length}</p>
          </div>
          <div className="bg-brand-surface p-6 rounded-3xl border border-zinc-800">
            <p className="text-xs text-zinc-500 uppercase font-black tracking-widest mb-1">Planos Ativos</p>
            <p className="text-4xl font-black">{plans.length}</p>
          </div>
        </div>

        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Estabelecimentos</h2>
          </div>
          <div className="bg-brand-surface rounded-[32px] border border-zinc-800 overflow-hidden">
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

        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter">Planos</h2>
            <button 
              onClick={() => {
                setEditingPlan(null);
                setPlanForm({ name: '', price: '', max_products: '', enable_ai: false, enable_reservations: false, enable_automation: false });
                setIsPlanModalOpen(true);
              }}
              className="bg-brand-accent text-brand-bg px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand-accent/20"
            >
              <Plus className="w-4 h-4" /> Novo Plano
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.id} className="bg-brand-surface p-8 rounded-[32px] border border-zinc-800 flex flex-col group hover:border-brand-accent/50 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tight">{plan.name}</h3>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => {
                        setEditingPlan(plan);
                        setPlanForm({
                          name: plan.name,
                          price: plan.price.toString(),
                          max_products: plan.max_products.toString(),
                          enable_ai: plan.enable_ai === 1,
                          enable_reservations: plan.enable_reservations === 1,
                          enable_automation: plan.enable_automation === 1
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
                  <span className="text-4xl font-black">R$ {plan.price.toFixed(2)}</span>
                  <span className="text-zinc-500 text-sm font-bold ml-1">/mês</span>
                </div>
                <ul className="space-y-4 flex-1">
                  <li className="flex items-center gap-3 text-sm font-bold text-zinc-400">
                    <Check className="w-4 h-4 text-brand-accent" /> {plan.max_products} Produtos
                  </li>
                  {plan.enable_ai === 1 && <li className="flex items-center gap-3 text-sm font-bold text-zinc-400"><Sparkles className="w-4 h-4 text-brand-accent" /> IA Insights</li>}
                  {plan.enable_reservations === 1 && <li className="flex items-center gap-3 text-sm font-bold text-zinc-400"><Calendar className="w-4 h-4 text-brand-accent" /> Reservas</li>}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {isPlanModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPlanModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-brand-surface border border-zinc-800 p-10 rounded-[40px] shadow-2xl w-full max-w-md">
              <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h2>
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
                    <input type="checkbox" checked={planForm.enable_ai} onChange={e => setPlanForm({...planForm, enable_ai: e.target.checked})} className="w-5 h-5 accent-brand-accent" />
                    <span className="text-sm font-bold uppercase tracking-tight">IA Insights</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer group">
                    <input type="checkbox" checked={planForm.enable_reservations} onChange={e => setPlanForm({...planForm, enable_reservations: e.target.checked})} className="w-5 h-5 accent-brand-accent" />
                    <span className="text-sm font-bold uppercase tracking-tight">Reservas</span>
                  </label>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 bg-zinc-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest">Cancelar</button>
                  <button type="submit" className="flex-1 bg-brand-accent text-brand-bg py-5 rounded-2xl font-black uppercase tracking-widest">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
        {isEstModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEstModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-brand-surface border border-zinc-800 p-10 rounded-[40px] shadow-2xl w-full max-w-md">
              <h2 className="text-3xl font-black mb-8 uppercase tracking-tighter">Editar Loja</h2>
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
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsEstModalOpen(false)} className="flex-1 bg-zinc-800 text-white py-5 rounded-2xl font-black uppercase tracking-widest">Cancelar</button>
                  <button type="submit" className="flex-1 bg-brand-accent text-brand-bg py-5 rounded-2xl font-black uppercase tracking-widest">Salvar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
      <Route path="/admin" element={<AdminDashboard slug={slug!} />} />
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
