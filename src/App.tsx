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
  Printer
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

const Navbar = ({ settings, slug }: { settings: any, slug?: string }) => (
  <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 px-4 py-3 flex justify-between items-center shadow-sm">
    <Link to={slug ? `/e/${slug}` : "/"} className="flex items-center gap-2">
      {settings.store_logo ? (
        <img src={settings.store_logo} alt={settings.store_name} className="h-8 w-auto object-contain" />
      ) : (
        <div className="bg-primary p-2 rounded-xl">
          <ChefHat className="text-white w-5 h-5" />
        </div>
      )}
      <span className="font-bold text-xl tracking-tight text-zinc-900">{settings.store_name || 'MaisQueCardapio'}</span>
    </Link>
    <div className="flex gap-4">
      <Link to={slug ? `/e/${slug}/admin` : "/admin"} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
        <Settings className="w-5 h-5 text-zinc-600" />
      </Link>
    </div>
  </nav>
);

const FloatingCart = ({ count, onClick }: { count: number; onClick: () => void }) => (
  <motion.button
    initial={{ scale: 0, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className="fixed bottom-6 right-6 z-50 bg-orange-500 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 group"
  >
    <ShoppingCart className="w-6 h-6" />
    {count > 0 && (
      <span className="bg-white text-orange-500 font-bold text-xs px-2 py-1 rounded-full min-w-[20px]">
        {count}
      </span>
    )}
  </motion.button>
);

// --- Pages ---

const OnlineMenu = ({ slug }: { slug: string }) => {
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
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
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
    apiFetch('/products').then(res => res.json()).then(setProducts);
    apiFetch('/categories').then(res => res.json()).then(setCategories);
    apiFetch('/neighborhoods').then(res => res.json()).then(setNeighborhoods);
    apiFetch('/tables').then(res => res.json()).then(setTables);
    apiFetch('/settings').then(res => res.json()).then(setSettings);
  }, [slug]);

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
  const filteredProducts = selectedCategory 
    ? products.filter(p => p.category_id === selectedCategory)
    : products;

  const handleCheckout = async () => {
    const neighborhoodName = neighborhoods.find(n => n.id === selectedNeighborhood)?.name;
    const items_text = cart.map(item => `${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`).join('\n');
    
    const message = `*Novo Pedido ${tableNumber ? `(Mesa ${tableNumber})` : '(Delivery)'}*\n\n` +
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
        customer_name: tableNumber ? `Mesa ${tableNumber}` : 'Cliente Web'
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
    <div className="min-h-screen bg-zinc-50 pb-24">
      <style>{`
        :root {
          --primary-color: ${settings.primary_color || '#f97316'};
        }
        .bg-primary { background-color: var(--primary-color) !important; }
        .text-primary { color: var(--primary-color) !important; }
        .border-primary { border-color: var(--primary-color) !important; }
        .ring-primary:focus { --tw-ring-color: var(--primary-color); }
        .bg-orange-500 { background-color: var(--primary-color) !important; }
        .text-orange-500 { color: var(--primary-color) !important; }
        .border-orange-500 { border-color: var(--primary-color) !important; }
      `}</style>
      <Navbar settings={settings} />
      
      {/* Hero */}
      <div className="bg-white px-4 py-8 border-b border-zinc-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">
              {tableNumber ? `Mesa ${tableNumber}` : 'Cardápio Online'}
            </h1>
            <p className="text-zinc-500 flex items-center gap-2">
              <Clock className="w-4 h-4" /> 
              {settings.is_open === "1" ? "Aberto agora • Entrega em 30-45 min" : "Fechado no momento"}
            </p>
          </div>
          {settings.enable_reservations === "1" && !tableNumber && (
            <button 
              onClick={() => setIsReservationModalOpen(true)}
              className="bg-zinc-900 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Reservar
            </button>
          )}
        </div>
        {settings.is_open === "0" && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">Estamos fechados no momento. Você pode visualizar o cardápio, mas os pedidos estão desabilitados.</p>
          </div>
        )}
      </div>

      {/* Categories */}
      <div className="sticky top-[64px] z-40 bg-white/80 backdrop-blur-md border-b border-zinc-100 overflow-x-auto whitespace-nowrap px-4 py-3 flex gap-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory(null)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            selectedCategory === null ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
          )}
        >
          Todos
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              selectedCategory === cat.id ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => (
          <motion.div
            layout
            key={product.id}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-zinc-100 flex flex-col"
          >
            <div className="relative h-48 overflow-hidden">
              <img 
                src={product.image_url} 
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              {!product.is_available && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <span className="text-white font-bold uppercase tracking-widest text-sm">Esgotado</span>
                </div>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-zinc-900 text-lg">{product.name}</h3>
                <span className="text-orange-600 font-bold">R$ {product.price.toFixed(2)}</span>
              </div>
              <p className="text-zinc-500 text-sm mb-4 flex-1">{product.description}</p>
              <button
                disabled={!product.is_available || settings.is_open === "0"}
                onClick={() => addToCart(product)}
                className="w-full bg-zinc-900 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" /> Adicionar
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <FloatingCart count={cart.reduce((a, b) => a + b.quantity, 0)} onClick={() => setIsCartOpen(true)} />

      <AnimatePresence>
        {isReservationModalOpen && (
          <ReservationForm 
            tables={tables} 
            onClose={() => setIsReservationModalOpen(false)} 
            apiFetch={apiFetch}
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
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-4 border-b border-zinc-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Seu Carrinho
                </h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-zinc-100 rounded-full">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                    <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                    <p>Carrinho vazio</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-4 bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                      <img src={item.image_url} className="w-20 h-20 rounded-xl object-cover" referrerPolicy="no-referrer" />
                      <div className="flex-1">
                        <h4 className="font-bold text-zinc-900">{item.name}</h4>
                        <p className="text-orange-600 font-bold text-sm">R$ {item.price.toFixed(2)}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="p-1 bg-white border border-zinc-200 rounded-lg"><Minus className="w-4 h-4" /></button>
                          <span className="font-bold text-sm">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="p-1 bg-white border border-zinc-200 rounded-lg"><Plus className="w-4 h-4" /></button>
                          <button onClick={() => removeFromCart(item.id)} className="ml-auto text-zinc-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-4 border-t border-zinc-100 bg-zinc-50 space-y-4">
                  {!tableNumber && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Bairro para Entrega</label>
                      <select 
                        value={selectedNeighborhood || ''} 
                        onChange={(e) => setSelectedNeighborhood(Number(e.target.value))}
                        className="w-full bg-white border border-zinc-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                      >
                        <option value="">Selecione seu bairro</option>
                        {neighborhoods.map(n => (
                          <option key={n.id} value={n.id}>{n.name} (+ R$ {n.delivery_fee.toFixed(2)})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Forma de Pagamento</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setPaymentMethod('pix')}
                        className={cn(
                          "p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all",
                          paymentMethod === 'pix' ? "bg-orange-50 border-orange-500 text-orange-700" : "bg-white border-zinc-200 text-zinc-600"
                        )}
                      >
                        <Smartphone className="w-4 h-4" /> PIX
                      </button>
                      <button 
                        onClick={() => setPaymentMethod('entrega')}
                        className={cn(
                          "p-3 rounded-xl border text-sm font-medium flex items-center justify-center gap-2 transition-all",
                          paymentMethod === 'entrega' ? "bg-orange-50 border-orange-500 text-orange-700" : "bg-white border-zinc-200 text-zinc-600"
                        )}
                      >
                        <CreditCard className="w-4 h-4" /> Entrega
                      </button>
                    </div>
                    {paymentMethod === 'pix' && settings.pix_key && (
                      <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                        <p className="text-[10px] text-emerald-800 font-bold uppercase mb-1">Chave PIX:</p>
                        <p className="text-xs text-emerald-900 font-mono break-all">{settings.pix_key}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-zinc-500">Subtotal</span>
                      <span className="text-zinc-900">R$ {subtotal.toFixed(2)}</span>
                    </div>
                    {!tableNumber && (
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-500">Taxa de Entrega</span>
                        <span className="text-zinc-900">R$ {deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold mt-2 pt-2 border-t border-zinc-200">
                      <span className="text-zinc-900">Total</span>
                      <span className="text-orange-600">R$ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    disabled={!tableNumber && !selectedNeighborhood}
                    onClick={handleCheckout}
                    className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all disabled:opacity-50"
                  >
                    Finalizar Pedido <ChevronRight className="w-5 h-5" />
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
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-orange-500 p-4 rounded-2xl mb-4">
            <ChefHat className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">Acesso Administrativo</h1>
          <p className="text-zinc-500 text-sm">Entre com suas credenciais</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Usuário</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="admin"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button 
            type="submit"
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
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
  const [activeTab, setActiveTab] = useState<'products' | 'tables' | 'delivery' | 'categories' | 'orders' | 'commands' | 'reservations' | 'ai' | 'help' | 'settings'>('products');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [tables, setTables] = useState<{id: number, number: number}[]>([]);
  const [commands, setCommands] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});

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
    
    await apiFetch(url, {
      method,
      body: JSON.stringify({
        ...formData,
        price: parseFloat(formData.price),
        category_id: parseInt(formData.category_id),
        is_available: editingProduct ? editingProduct.is_available : true
      })
    });

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
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <Navbar settings={settings} />
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">Painel Administrativo</h1>
            <p className="text-zinc-500">Gerencie seu cardápio e pedidos</p>
          </div>
          <div className="flex items-center gap-4">
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
                "px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg",
                settings.is_open === "1" 
                  ? "bg-emerald-500 text-white shadow-emerald-100" 
                  : "bg-red-500 text-white shadow-red-100"
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
              className="bg-orange-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all shadow-lg shadow-orange-100"
            >
              <Plus className="w-5 h-5" /> Novo Produto
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-xl w-fit mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-zinc-500 text-sm font-medium">Produtos Ativos</h3>
            <p className="text-2xl font-bold text-zinc-900">{products.filter(p => p.is_available).length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <div className="bg-orange-50 text-orange-600 p-3 rounded-xl w-fit mb-4">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h3 className="text-zinc-500 text-sm font-medium">Categorias</h3>
            <p className="text-2xl font-bold text-zinc-900">{categories.length}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl w-fit mb-4">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-zinc-500 text-sm font-medium">Mesas Ativas</h3>
            <p className="text-2xl font-bold text-zinc-900">10</p>
          </div>
        </div>

        <div className="flex gap-4 mb-8 border-b border-zinc-100 overflow-x-auto no-scrollbar whitespace-nowrap pb-1">
          <button 
            onClick={() => setActiveTab('products')}
            className={cn("pb-4 px-2 font-medium transition-all text-sm md:text-base", activeTab === 'products' ? "text-orange-500 border-b-2 border-orange-500" : "text-zinc-400")}
          >
            Produtos
          </button>
          <button 
            onClick={() => setActiveTab('tables')}
            className={cn("pb-4 px-2 font-medium transition-all text-sm md:text-base", activeTab === 'tables' ? "text-orange-500 border-b-2 border-orange-500" : "text-zinc-400")}
          >
            Mesas & QR Codes
          </button>
          <button 
            onClick={() => setActiveTab('delivery')}
            className={cn("pb-4 px-2 font-medium transition-all text-sm md:text-base", activeTab === 'delivery' ? "text-orange-500 border-b-2 border-orange-500" : "text-zinc-400")}
          >
            Taxas de Entrega
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={cn("pb-4 px-2 font-medium transition-all text-sm md:text-base", activeTab === 'categories' ? "text-orange-500 border-b-2 border-orange-500" : "text-zinc-400")}
          >
            Categorias
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={cn("pb-4 px-2 font-medium transition-all text-sm md:text-base", activeTab === 'orders' ? "text-orange-500 border-b-2 border-orange-500" : "text-zinc-400")}
          >
            Pedidos
          </button>
          <button 
            onClick={() => setActiveTab('commands')}
            className={cn("pb-4 px-2 font-medium transition-all text-sm md:text-base", activeTab === 'commands' ? "text-orange-500 border-b-2 border-orange-500" : "text-zinc-400")}
          >
            Comandas
          </button>
          {settings.enable_reservations === "1" && (
            <button 
              onClick={() => setActiveTab('reservations')}
              className={cn("pb-4 px-2 font-medium transition-all text-sm md:text-base", activeTab === 'reservations' ? "text-orange-500 border-b-2 border-orange-500" : "text-zinc-400")}
            >
              Reservas
            </button>
          )}
          {settings.enable_ai === "1" && (
            <button 
              onClick={() => setActiveTab('ai')}
              className={cn("pb-4 px-2 font-medium transition-all text-sm md:text-base", activeTab === 'ai' ? "text-orange-500 border-b-2 border-orange-500" : "text-zinc-400")}
            >
              IA Insights
            </button>
          )}
          <button 
            onClick={() => setActiveTab('help')}
            className={cn("pb-4 px-2 font-medium transition-all text-sm md:text-base", activeTab === 'help' ? "text-orange-500 border-b-2 border-orange-500" : "text-zinc-400")}
          >
            Manual de Uso
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={cn("pb-4 px-2 font-medium transition-all text-sm md:text-base", activeTab === 'settings' ? "text-orange-500 border-b-2 border-orange-500" : "text-zinc-400")}
          >
            Configurações
          </button>
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
  const [formData, setFormData] = useState({ name: '', slug: '', owner_email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/public/register', {
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

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-2 rounded-xl">
            <ChefHat className="text-white w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-zinc-900">MaisQueCardapio</span>
        </div>
        <Link to="/e/demo" className="text-zinc-600 font-medium hover:text-zinc-900">Ver Demo</Link>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-black text-zinc-900 mb-6 tracking-tight leading-tight">
            Seu cardápio digital <span className="text-orange-500">profissional</span> em minutos.
          </h1>
          <p className="text-xl text-zinc-600 mb-12 max-w-2xl mx-auto">
            Gestão de pedidos, QR Code na mesa, delivery por bairro e inteligência artificial para o seu restaurante. Tudo em um só lugar.
          </p>

          <div className="bg-white p-8 rounded-3xl shadow-xl border border-zinc-100 w-full max-w-md mx-auto text-left">
            <h2 className="text-2xl font-bold mb-6">Comece agora gratuitamente</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Nome do Estabelecimento</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                  placeholder="Ex: Burger do João"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Slug (URL personalizada)</label>
                <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500">
                  <span className="pl-3 text-zinc-400 text-sm">/e/</span>
                  <input 
                    required
                    value={formData.slug}
                    onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                    className="w-full bg-transparent p-3 outline-none text-sm" 
                    placeholder="joao-burger"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">E-mail</label>
                <input 
                  required
                  type="email"
                  value={formData.owner_email}
                  onChange={e => setFormData({...formData, owner_email: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-700 mb-1">Senha</label>
                <input 
                  required
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-orange-500" 
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Meu Cardápio'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

const SuperAdmin = () => {
  const [establishments, setEstablishments] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/superadmin/establishments').then(res => res.json()),
      fetch('/api/superadmin/plans').then(res => res.json())
    ]).then(([ests, plans]) => {
      setEstablishments(ests);
      setPlans(plans);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8">Carregando painel mestre...</div>;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-black tracking-tight">SuperAdmin <span className="text-orange-500">MaisQueCardapio</span></h1>
            <p className="text-zinc-400">Gestão global da plataforma</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700">
              <p className="text-xs text-zinc-500 uppercase font-bold">Total Lojas</p>
              <p className="text-2xl font-bold">{establishments.length}</p>
            </div>
            <div className="bg-zinc-800 p-4 rounded-2xl border border-zinc-700">
              <p className="text-xs text-zinc-500 uppercase font-bold">Planos Ativos</p>
              <p className="text-2xl font-bold">{plans.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="bg-zinc-800 rounded-3xl border border-zinc-700 overflow-hidden">
            <div className="p-6 border-b border-zinc-700 flex justify-between items-center">
              <h2 className="text-xl font-bold">Estabelecimentos</h2>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-zinc-500 text-xs uppercase border-b border-zinc-700">
                  <th className="px-6 py-4">Nome</th>
                  <th className="px-6 py-4">Slug</th>
                  <th className="px-6 py-4">Dono</th>
                  <th className="px-6 py-4">Plano</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-700">
                {establishments.map(est => (
                  <tr key={est.id} className="hover:bg-zinc-750 transition-colors">
                    <td className="px-6 py-4 font-bold">{est.name}</td>
                    <td className="px-6 py-4 text-zinc-400">/e/{est.slug}</td>
                    <td className="px-6 py-4 text-sm">{est.owner_email}</td>
                    <td className="px-6 py-4">
                      <span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded-lg text-[10px] font-bold uppercase border border-orange-500/20">
                        {est.plan_name}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-lg text-[10px] font-bold uppercase border border-emerald-500/20">
                        {est.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/e/${est.slug}/admin`} className="text-zinc-400 hover:text-white transition-colors">Acessar</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    fetch(`/api/public/establishments/${slug}`)
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
