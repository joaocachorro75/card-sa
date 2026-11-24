import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChefHat,
  Check,
  X,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Bike,
  Store,
  QrCode,
  Printer,
  MessageCircle,
  Plus,
  Minus,
  ChevronDown,
  LayoutDashboard,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { cn } from '../types';
import kitchenPassImg from '../assets/images/landing_kitchen_pass_1795532828157.jpg';
import tableQrImg from '../assets/images/landing_table_qr_1795532826077.jpg';

interface PublicPlan {
  id: number;
  name: string;
  price: number;
  max_products: number;
  enable_reservations: number;
  enable_automation: number;
  enable_tables?: number;
}

const DEFAULT_PUBLIC_PLANS: PublicPlan[] = [
  { id: 1, name: 'Gratuito', price: 0, max_products: 10, enable_reservations: 0, enable_automation: 1, enable_tables: 0 },
  { id: 2, name: 'Premium', price: 49.9, max_products: 100, enable_reservations: 1, enable_automation: 1, enable_tables: 1 }
];

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });

const formatBRLFull = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const toSlug = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const DEMO_PREVIEW_ITEMS = [
  { id: 'burger', name: 'X-Burger Clássico', desc: 'Blend 180g, cheddar e molho da casa', price: 28.9, image: '/assets/demo/x-burger.jpg' },
  { id: 'bacon', name: 'X-Bacon Especial', desc: 'Bacon crocante, cheddar duplo e brioche', price: 32.9, image: '/assets/demo/x-bacon.jpg' },
  { id: 'refri', name: 'Refrigerante Lata 350ml', desc: 'Servido bem gelado', price: 6.0, image: '/assets/demo/refrigerante.jpg' }
];

const ADMIN_FLOW_STEPS = [
  {
    key: 'pending',
    label: 'Pendente',
    nextLabel: 'Confirmar Pedido',
    waMessage: 'Olá Mariana! Recebemos seu pedido #104 na Brasa Burger. Em instantes vamos confirmar na cozinha.'
  },
  {
    key: 'confirmed',
    label: 'Confirmado',
    nextLabel: 'Iniciar Preparo',
    waMessage: 'Pedido #104 confirmado! Seu pagamento InfinitePay já foi aprovado e seu pedido entrou na fila.'
  },
  {
    key: 'preparing',
    label: 'Em Preparo',
    nextLabel: 'Saiu para Entrega',
    waMessage: 'Sua chapa está quente! O pedido #104 já está em preparo na cozinha. Previsão: 25 min.'
  },
  {
    key: 'delivering',
    label: 'Saiu para Entrega',
    nextLabel: 'Reiniciar Demo',
    waMessage: 'Boa notícia, Mariana! Seu pedido #104 acabou de sair para entrega no bairro Centro.'
  }
] as const;

const FAQ_ITEMS = [
  {
    q: 'O MaisQueCardapio cobra alguma porcentagem ou comissão sobre as vendas?',
    a: 'Nunca. Toda venda feita pelo seu cardápio digital, delivery, balcão ou mesa é 100% sua. No Plano Gratuito você não paga mensalidade e no Plano Premium paga apenas o valor fixo mensal, independente de vender R$ 5 mil ou R$ 100 mil.'
  },
  {
    q: 'Como funciona o WhatsApp automático? Precisa pagar ferramenta externa?',
    a: 'A integração via QR Code (Evolution API) já está inclusa em todos os planos, inclusive no Gratuito. Basta abrir a aba Configurações no seu painel, escanear o QR Code com o WhatsApp da sua loja e o sistema passa a enviar atualizações automáticas de pedido e status.'
  },
  {
    q: 'O dinheiro dos pagamentos via PIX e InfinitePay cai direto na minha conta?',
    a: 'Sim. Você configura sua própria chave PIX ou sua conta InfinitePay no painel da loja. O MaisQueCardapio não retém nem intermedia o dinheiro dos seus clientes.'
  },
  {
    q: 'Consigo imprimir os pedidos na impressora térmica da cozinha?',
    a: 'Sim. No Plano Premium você imprime cupons de pedido e fechamento de comanda formatados em largura 80mm diretamente pelo painel da loja em qualquer impressora térmica conectada ao computador ou celular.'
  },
  {
    q: 'O Plano Gratuito expira depois de 7 ou 14 dias?',
    a: 'Não. O Plano Gratuito não tem prazo de expiração nem pede cartão de crédito. Você já opera com até 10 produtos, delivery por bairro, balcão, base de clientes, PIX/InfinitePay e WhatsApp automático. Quando quiser liberar mesas QR Code, comandas, impressão de cupom, reservas e até 100 produtos, faz o upgrade no próprio painel.'
  },
  {
    q: 'Quanto tempo leva para colocar meu cardápio no ar e começar a vender?',
    a: 'Menos de 5 minutos. Assim que preencher o cadastro abaixo, seu endereço exclusivo (/e/sua-loja) e seu painel administrativo são criados na hora. Você cadastra seus produtos, bairros de entrega e já pode colocar o link na bio do Instagram e no WhatsApp.'
  }
];

export const LandingPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', slug: '', owner_whatsapp: '', password: '' });
  const [slugTouched, setSlugTouched] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>('free');
  const [plans, setPlans] = useState<PublicPlan[]>(DEFAULT_PUBLIC_PLANS);
  const [loginData, setLoginData] = useState({ slug: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<{ slug: string; whatsapp: string; password: string; plan: 'free' | 'premium' } | null>(null);

  // Interactive Hero Preview State
  const [heroTab, setHeroTab] = useState<'menu' | 'table' | 'admin'>('menu');
  const [previewOrderMode, setPreviewOrderMode] = useState<'delivery' | 'pickup'>('delivery');
  const [previewPayment, setPreviewPayment] = useState<'pix' | 'infinitepay'>('infinitepay');
  const [previewQuantities, setPreviewQuantities] = useState<Record<string, number>>({
    burger: 2,
    bacon: 0,
    refri: 1
  });

  // Interactive Table Comanda Preview State
  const [tableTabItems, setTableTabItems] = useState([
    { name: '2x X-Burger Clássico', total: 57.8 },
    { name: '2x Refrigerante Lata', total: 12.0 }
  ]);
  const [tableBillRequested, setTableBillRequested] = useState(false);

  // Interactive Admin + WhatsApp Preview State
  const [adminStepIdx, setAdminStepIdx] = useState(1);

  // Interactive Commission Savings Calculator State
  const [monthlyRevenue, setMonthlyRevenue] = useState(18000);
  const [commissionRate, setCommissionRate] = useState(23);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const storeNameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    window
      .fetch('/api/public/plans')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPlans(data);
        }
      })
      .catch(() => {});
  }, []);

  const freePlan = plans.find((p) => p.id === 1 || p.price === 0) || DEFAULT_PUBLIC_PLANS[0];
  const premiumPlan = plans.find((p) => p.id === 2 || p.price > 0) || DEFAULT_PUBLIC_PLANS[1];

  const handleSelectPlan = (plan: 'free' | 'premium') => {
    setSelectedPlan(plan);
    setRegisterError('');
    const registerEl = document.getElementById('register');
    if (registerEl) {
      registerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      storeNameInputRef.current?.focus();
    }, 350);
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : toSlug(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    const cleanSlug = toSlug(formData.slug);
    const cleanPhone = formData.owner_whatsapp.replace(/\D/g, '');
    if (cleanSlug.length < 2) {
      setRegisterError('Informe uma URL personalizada com pelo menos 2 caracteres.');
      return;
    }
    if (cleanPhone.length < 10) {
      setRegisterError('Informe um WhatsApp válido com DDD (ex: 11999999999).');
      return;
    }
    if (formData.password.length < 4) {
      setRegisterError('A senha precisa ter pelo menos 4 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await window.fetch('/api/public/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, slug: cleanSlug, owner_whatsapp: cleanPhone })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem(`admin_auth_${data.slug}`, 'true');
        setRegistrationSuccess({
          slug: data.slug,
          whatsapp: data.whatsapp || cleanPhone,
          password: formData.password,
          plan: selectedPlan
        });
      } else {
        setRegisterError(data.error || 'Não foi possível concluir o cadastro.');
      }
    } catch {
      setRegisterError('Erro de conexão ao registrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const res = await window.fetch('/api/public/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsapp: loginData.slug, password: loginData.password })
      });
      const data = await res.json();
      if (res.ok && data.slug) {
        window.location.href = `/e/${data.slug}/admin`;
      } else {
        setLoginError(data.error || 'WhatsApp ou senha inválidos.');
      }
    } catch {
      setLoginError('Erro ao conectar ao servidor.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Calculations for Hero Demo Cart
  const previewSubtotal = DEMO_PREVIEW_ITEMS.reduce(
    (sum, item) => sum + item.price * (previewQuantities[item.id] || 0),
    0
  );
  const previewDeliveryFee = previewOrderMode === 'delivery' && previewSubtotal > 0 ? 6.0 : 0;
  const previewTotal = previewSubtotal + previewDeliveryFee;
  const previewItemCount = (Object.values(previewQuantities) as number[]).reduce((s, q) => s + q, 0);

  // Calculations for Savings Calculator
  const marketplaceMonthlyCost = (monthlyRevenue * commissionRate) / 100;
  const monthlySavings = Math.max(0, marketplaceMonthlyCost - premiumPlan.price);
  const annualSavings = monthlySavings * 12;
  const extraOrdersEquivalent = Math.round(monthlySavings / 55);

  // Table preview total
  const tableTabTotal = tableTabItems.reduce((sum, i) => sum + i.total, 0);

  const currentAdminStep = ADMIN_FLOW_STEPS[adminStepIdx];

  const capabilities = [
    {
      num: '01.',
      title: 'Cardápio próprio com Delivery por Bairro',
      scope: 'Gratuito e Premium',
      span: 'md:col-span-7',
      desc: 'Seu cliente acessa /e/sua-loja direto pelo WhatsApp ou Instagram, escolhe itens com foto, informa endereço e o sistema calcula a taxa do bairro automaticamente — sem cobrar um centavo de comissão.'
    },
    {
      num: '02.',
      title: 'PIX da Loja e InfinitePay direto na conta',
      scope: 'Gratuito e Premium',
      span: 'md:col-span-5',
      desc: 'Receba via PIX copia e cola, na entrega/balcão ou checkout InfinitePay com confirmação automática. O valor vai direto para sua conta bancária.'
    },
    {
      num: '03.',
      title: 'WhatsApp Automático via QR Code',
      scope: 'Incluso em todos os planos',
      span: 'md:col-span-5',
      desc: 'Conecte o WhatsApp da loja escaneando o QR Code (Evolution API) e avise seu cliente a cada mudança de status — reduzindo drasticamente mensagens no atendimento.'
    },
    {
      num: '04.',
      title: 'Base de Clientes e Histórico de Pedidos',
      scope: 'Gratuito e Premium',
      span: 'md:col-span-7',
      desc: 'Cada pedido alimenta automaticamente sua lista própria de clientes com nome, WhatsApp, endereço, recorrência e valor gasto para você fidelizar sem depender de aplicativos terceiros.'
    },
    {
      num: '05.',
      title: 'Pedidos na Mesa (QR Code), Comandas e Cupom 80mm',
      scope: 'Exclusivo Premium',
      span: 'md:col-span-6',
      desc: 'Gere QR Codes individuais por mesa, permita que o cliente adicione itens à comanda ou peça a conta pelo celular e imprima cupons de preparo na térmica 80mm.'
    },
    {
      num: '06.',
      title: 'Reservas Online e Identidade da Marca',
      scope: 'Exclusivo Premium (Reservas)',
      span: 'md:col-span-6',
      desc: 'Personalize logo, foto de capa, paleta de cores e controle reservas de mesa com data, horário e convidados direto no painel administrativo.'
    }
  ];

  const comparisonRows = [
    {
      feature: 'Comissão sobre pedidos',
      free: '0% (Zero)',
      premium: '0% (Zero)'
    },
    {
      feature: 'Limite de produtos no cardápio',
      free: `Até ${freePlan.max_products} produtos`,
      premium: `Até ${premiumPlan.max_products} produtos`
    },
    {
      feature: 'Delivery com taxa por bairro e Retirada no Balcão',
      free: true,
      premium: true
    },
    {
      feature: 'WhatsApp automático via QR Code (Evolution API)',
      free: freePlan.enable_automation === 1,
      premium: premiumPlan.enable_automation === 1
    },
    {
      feature: 'Pagamentos via PIX, Entrega/Balcão e InfinitePay',
      free: true,
      premium: true
    },
    {
      feature: 'Base de Clientes (CRM) com histórico e link WhatsApp',
      free: true,
      premium: true
    },
    {
      feature: 'Identidade visual própria (logo, capa, cores e temas)',
      free: true,
      premium: true
    },
    {
      feature: 'Pedidos na Mesa (QR Code), Comandas Abertas e Cupom 80mm',
      free: (freePlan.enable_tables ?? 0) === 1,
      premium: (premiumPlan.enable_tables ?? 1) === 1
    },
    {
      feature: 'Reservas online de mesas e horários',
      free: false,
      premium: premiumPlan.enable_reservations === 1
    }
  ];

  const restaurantCases = [
    {
      metric: 'R$ 3.840/mês',
      metricLabel: 'economizados em comissões',
      quote: 'Colocamos o link do MaisQueCardapio na bio e em um cartão dentro de toda embalagem. Em 60 dias metade dos clientes recorrentes já pedia direto com a gente via PIX.',
      owner: 'Rodrigo Almeida',
      business: 'Brasa 019 Hamburgueria · Campinas, SP'
    },
    {
      metric: '-68%',
      metricLabel: 'menos mensagens "cadê meu pedido?"',
      quote: 'Conectar nosso WhatsApp pelo QR Code resolveu o maior gargalo da sexta-feira à noite. O cliente recebe o aviso assim que vai para a chapa e quando sai para entrega.',
      owner: 'Camila Ferreira',
      business: 'Forneria Bela Vista · Belo Horizonte, MG'
    },
    {
      metric: '30 seg',
      metricLabel: 'para conferir e fechar uma mesa',
      quote: 'Antes a gente perdia tempo somando papelzinho no salão. Agora cada mesa pede pelo QR Code direto na comanda aberta e quando pedem a conta já imprimimos o resumo em 80mm.',
      owner: 'Eduardo Nogueira',
      business: 'Pátio Grill & Chopp · Curitiba, PR'
    }
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100 flex flex-col selection:bg-orange-500 selection:text-zinc-950 scroll-smooth">
      {/* Top Bar — 3 Zonas Limpas */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#09090B]/92 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-6">
          <a href="#" className="flex items-center gap-2.5 min-w-0 shrink-0">
            <div className="bg-orange-500 p-1.5 sm:p-2 rounded-xl shrink-0">
              <ChefHat className="text-zinc-950 w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="font-display font-bold text-base sm:text-xl tracking-tight text-white truncate">
              MaisQueCardapio
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-7">
            <a href="#economia" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap shrink-0">
              Calculadora
            </a>
            <a href="#recursos" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap shrink-0">
              Recursos
            </a>
            <a href="#planos" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap shrink-0">
              Planos
            </a>
            <a href="#duvidas" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors whitespace-nowrap shrink-0">
              Dúvidas
            </a>
            <Link to="/e/demo" className="text-sm font-medium text-orange-400 hover:text-orange-300 transition-colors whitespace-nowrap shrink-0">
              Ver Loja Demo
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <button
              type="button"
              onClick={() => {
                setLoginError('');
                setIsLoginModalOpen(true);
              }}
              className="text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white px-2 sm:px-3 py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => handleSelectPlan('free')}
              className="bg-orange-500 text-zinc-950 px-3.5 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-orange-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Criar Cardápio Grátis
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO — Proposta Irresistível + Demo Interativa de 3 Modos */}
        <section className="relative overflow-hidden border-b border-zinc-900">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-40 right-0 w-[620px] h-[520px] bg-orange-500/10 blur-[140px] rounded-full"
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-14 lg:pt-16 lg:pb-24 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Hero Left */}
            <div className="lg:col-span-6 space-y-6">
              <p className="text-sm font-semibold text-orange-400 tracking-normal">
                Sistema completo para hamburguerias, pizzarias, restaurantes e bares
              </p>

              <h1
                className="font-display font-extrabold tracking-tight text-white leading-[1.06] [text-wrap:balance]"
                style={{ fontSize: 'clamp(2.25rem, 4.4vw, 3.85rem)' }}
              >
                Venda no delivery e no salão sem pagar comissão por pedido.
              </h1>

              <p className="text-base sm:text-lg text-zinc-400 leading-relaxed max-w-xl">
                Coloque seu cardápio próprio no ar em minutos com taxa de entrega por bairro, PIX e InfinitePay direto na sua conta, WhatsApp automático via QR Code e controle completo de mesas e comandas.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleSelectPlan('free')}
                  className="bg-orange-500 text-zinc-950 px-6 py-4 rounded-xl font-bold text-sm sm:text-base hover:bg-orange-400 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Criar meu cardápio grátis
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
                <Link
                  to="/e/demo"
                  className="px-6 py-4 rounded-xl border border-zinc-800 bg-[#121216] text-zinc-100 font-semibold text-sm sm:text-base hover:border-zinc-600 hover:bg-zinc-900 transition-colors flex items-center justify-center gap-2"
                >
                  Testar loja demo ao vivo
                  <ExternalLink className="w-4 h-4 shrink-0 text-orange-400" />
                </Link>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-5 border-t border-zinc-800/80 max-w-lg">
                <div>
                  <p className="font-display font-bold text-lg sm:text-2xl text-white tabular-nums">0%</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Comissão por pedido</p>
                </div>
                <div className="border-l border-zinc-800 pl-3 sm:pl-5">
                  <p className="font-display font-bold text-lg sm:text-2xl text-white tabular-nums">R$ 0</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Para começar hoje</p>
                </div>
                <div className="border-l border-zinc-800 pl-3 sm:pl-5">
                  <p className="font-display font-bold text-lg sm:text-2xl text-white tabular-nums">1 min</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Para entrar no ar</p>
                </div>
              </div>
            </div>

            {/* Hero Right — Interactive Live Platform Preview */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-zinc-800 bg-[#111114] overflow-hidden shadow-2xl">
                {/* Preview Mode Switcher */}
                <div className="px-3 sm:px-4 py-3 border-b border-zinc-800 bg-[#16161B] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setHeroTab('menu')}
                      className={cn(
                        'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                        heroTab === 'menu' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                      )}
                    >
                      Cardápio
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroTab('table')}
                      className={cn(
                        'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                        heroTab === 'table' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                      )}
                    >
                      Mesa & Comanda
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroTab('admin')}
                      className={cn(
                        'flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                        heroTab === 'admin' ? 'bg-orange-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
                      )}
                    >
                      Painel & WhatsApp
                    </button>
                  </div>
                  <span className="hidden sm:inline font-mono text-[11px] text-zinc-500">
                    /e/brasa-burger
                  </span>
                </div>

                {/* TAB 1: Interactive Storefront & Cart */}
                {heroTab === 'menu' && (
                  <div className="bg-zinc-50 text-zinc-900">
                    <div className="relative h-28 sm:h-32 overflow-hidden">
                      <img
                        src="/assets/demo/banner-demo.jpg"
                        alt="Capa da loja demo"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2 text-white">
                        <div>
                          <p className="font-display font-bold text-base sm:text-lg leading-tight">Brasa Burger Demo</p>
                          <p className="text-xs text-zinc-200">Aberto agora · 30–40 min · Taxa por bairro</p>
                        </div>
                        <span className="text-xs font-semibold text-emerald-300 shrink-0">
                          Aberto
                        </span>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Delivery vs Pickup + Payment */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="inline-flex bg-zinc-200/80 p-1 rounded-lg text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => setPreviewOrderMode('delivery')}
                            className={cn(
                              'px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer',
                              previewOrderMode === 'delivery' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
                            )}
                          >
                            <Bike className="w-3.5 h-3.5 text-orange-600" /> Delivery
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewOrderMode('pickup')}
                            className={cn(
                              'px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors cursor-pointer',
                              previewOrderMode === 'pickup' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
                            )}
                          >
                            <Store className="w-3.5 h-3.5 text-orange-600" /> Balcão
                          </button>
                        </div>

                        <div className="inline-flex bg-zinc-200/80 p-1 rounded-lg text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => setPreviewPayment('pix')}
                            className={cn(
                              'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                              previewPayment === 'pix' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
                            )}
                          >
                            PIX
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewPayment('infinitepay')}
                            className={cn(
                              'px-2.5 py-1 rounded-md transition-colors cursor-pointer',
                              previewPayment === 'infinitepay' ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-600'
                            )}
                          >
                            InfinitePay
                          </button>
                        </div>
                      </div>

                      {/* Real interactive product rows */}
                      <div className="space-y-2">
                        {DEMO_PREVIEW_ITEMS.map((item) => {
                          const qty = previewQuantities[item.id] || 0;
                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-xl border border-zinc-200 p-2.5 flex items-center gap-3"
                            >
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-14 h-14 rounded-lg object-cover shrink-0"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm text-zinc-900 truncate">{item.name}</p>
                                <p className="text-xs text-zinc-500 truncate">{item.desc}</p>
                                <p className="text-sm font-extrabold text-orange-600 tabular-nums mt-0.5">
                                  R$ {formatBRLFull(item.price)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  aria-label={`Remover ${item.name}`}
                                  onClick={() =>
                                    setPreviewQuantities((prev) => ({
                                      ...prev,
                                      [item.id]: Math.max(0, (prev[item.id] || 0) - 1)
                                    }))
                                  }
                                  className="w-7 h-7 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-700 cursor-pointer"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-5 text-center text-xs font-bold tabular-nums text-zinc-900">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  aria-label={`Adicionar ${item.name}`}
                                  onClick={() =>
                                    setPreviewQuantities((prev) => ({
                                      ...prev,
                                      [item.id]: (prev[item.id] || 0) + 1
                                    }))
                                  }
                                  className="w-7 h-7 rounded-lg bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Live Checkout Bar */}
                      <div className="bg-zinc-950 text-white rounded-xl p-3.5 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[11px] text-zinc-400 truncate">
                            {previewOrderMode === 'delivery' ? 'Entrega Bairro Centro (R$ 6,00)' : 'Retirada sem taxa'} ·{' '}
                            {previewPayment === 'pix' ? 'PIX da Loja' : 'Link InfinitePay'}
                          </p>
                          <p className="text-base font-extrabold tabular-nums text-white">
                            Total R$ {formatBRLFull(previewTotal)}
                            <span className="text-xs font-medium text-zinc-400 ml-2">
                              ({previewItemCount} {previewItemCount === 1 ? 'item' : 'itens'})
                            </span>
                          </p>
                        </div>
                        <Link
                          to="/e/demo"
                          className="bg-orange-500 hover:bg-orange-400 text-zinc-950 px-3.5 py-2 rounded-lg text-xs font-bold shrink-0 transition-colors"
                        >
                          Abrir Demo
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: Interactive Table QR & Open Comanda */}
                {heroTab === 'table' && (
                  <div className="bg-zinc-50 text-zinc-900 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3 pb-3 border-b border-zinc-200">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-orange-500/15 text-orange-600 p-2 rounded-xl">
                          <QrCode className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-zinc-900">Mesa 04 · Comanda Aberta</p>
                          <p className="text-xs text-zinc-500">Cliente escaneou o QR Code na mesa</p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700">
                        {tableBillRequested ? 'Conta Solicitada' : 'Em Consumo'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {tableTabItems.map((entry, idx) => (
                        <div
                          key={`${entry.name}-${idx}`}
                          className="bg-white rounded-xl border border-zinc-200 px-3.5 py-2.5 flex items-center justify-between text-sm"
                        >
                          <span className="font-medium text-zinc-800">{entry.name}</span>
                          <span className="font-bold text-zinc-900 tabular-nums">R$ {formatBRLFull(entry.total)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="bg-white rounded-xl border border-zinc-200 p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-zinc-500">Consumo acumulado da mesa</p>
                        <p className="text-xl font-extrabold text-zinc-900 tabular-nums">
                          R$ {formatBRLFull(tableTabTotal)}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-zinc-500">
                        {tableTabItems.length} lançamentos
                      </span>
                    </div>

                    {tableBillRequested ? (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Pedido de fechamento enviado ao caixa e garçom!</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setTableBillRequested(false)}
                          className="text-xs font-bold text-emerald-700 hover:underline shrink-0 cursor-pointer"
                        >
                          Resetar
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            setTableTabItems((prev) => [
                              ...prev,
                              { name: '1x X-Bacon Especial', total: 32.9 }
                            ])
                          }
                          className="py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" /> Adicionar à Comanda
                        </button>
                        <button
                          type="button"
                          onClick={() => setTableBillRequested(true)}
                          className="py-3 px-4 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Receipt className="w-4 h-4" /> Pedir a Conta
                        </button>
                      </div>
                    )}

                    <p className="text-xs text-zinc-500 text-center">
                      Clique nos botões acima para testar como o cliente usa o QR Code na mesa.
                    </p>
                  </div>
                )}

                {/* TAB 3: Interactive Admin Queue + Live Evolution WhatsApp */}
                {heroTab === 'admin' && (
                  <div className="bg-zinc-50 text-zinc-900 p-4 sm:p-5 space-y-4">
                    <div className="bg-white rounded-xl border border-zinc-200 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <LayoutDashboard className="w-4 h-4 text-orange-600" />
                          <span className="font-bold text-sm text-zinc-900 tabular-nums">Pedido #104 · Mariana Silva</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-700">Pago (InfinitePay)</span>
                      </div>
                      <p className="text-xs text-zinc-600">
                        2x X-Burger Clássico, 1x Refrigerante Lata · Delivery Centro · <strong className="tabular-nums text-zinc-900">R$ 69,80</strong>
                      </p>
                      <div className="pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
                        <div className="text-xs">
                          <span className="text-zinc-500">Status atual: </span>
                          <strong className="text-orange-600">{currentAdminStep.label}</strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAdminStepIdx((prev) => (prev + 1) % ADMIN_FLOW_STEPS.length)}
                            className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            {currentAdminStep.nextLabel}
                          </button>
                          <span className="p-1.5 rounded-lg bg-zinc-100 text-zinc-600" title="Cupom térmico 80mm">
                            <Printer className="w-4 h-4" />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Automatic WhatsApp Message Bubble Preview */}
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-emerald-900 inline-flex items-center gap-1.5">
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          WhatsApp automático disparado ao cliente
                        </span>
                        <span className="text-emerald-700 font-mono text-[11px]">Evolution API</span>
                      </div>
                      <div className="bg-white rounded-xl border border-emerald-200/80 p-3 text-xs text-zinc-800 leading-relaxed">
                        {currentAdminStep.waMessage}
                      </div>
                      <p className="text-[11px] text-emerald-800/80">
                        Toque em &ldquo;{currentAdminStep.nextLabel}&rdquo; acima para ver a mensagem atualizar automaticamente.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* INTERACTIVE ROI CALCULATOR — O Argumento Mais Forte para Contratar */}
        <section id="economia" className="py-16 lg:py-24 border-b border-zinc-900 bg-[#0C0C0F]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <p className="text-sm font-semibold text-orange-400 mb-2">
                Calculadora de economia real
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white [text-wrap:balance]">
                Quanto você perde por mês pagando comissão em apps de entrega?
              </h2>
              <p className="text-zinc-400 text-base mt-3 leading-relaxed">
                Simule seu faturamento mensal no delivery e veja quanto fica no seu caixa usando seu próprio link de pedidos sem taxas por venda.
              </p>
            </div>

            <div className="rounded-3xl border border-zinc-800 bg-[#111114] p-5 sm:p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Controls */}
              <div className="lg:col-span-6 space-y-7">
                <div>
                  <div className="flex items-baseline justify-between gap-4 mb-3">
                    <label htmlFor="revenue-slider" className="text-sm font-semibold text-zinc-300">
                      Seu faturamento mensal no delivery
                    </label>
                    <span className="font-display font-extrabold text-2xl sm:text-3xl text-white tabular-nums">
                      R$ {formatBRL(monthlyRevenue)}
                    </span>
                  </div>
                  <input
                    id="revenue-slider"
                    type="range"
                    min={4000}
                    max={80000}
                    step={1000}
                    value={monthlyRevenue}
                    onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                    className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 font-mono tabular-nums mt-2">
                    <span>R$ 4.000</span>
                    <span>R$ 25.000</span>
                    <span>R$ 50.000</span>
                    <span>R$ 80.000</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-zinc-300 mb-3">
                    Taxa média paga nos aplicativos de entrega
                  </p>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      { rate: 12, label: '12% (Plano Básico)' },
                      { rate: 23, label: '23% (Entrega Parceira)' },
                      { rate: 27, label: '27% (Taxa Cheia)' }
                    ].map((opt) => (
                      <button
                        key={opt.rate}
                        type="button"
                        onClick={() => setCommissionRate(opt.rate)}
                        className={cn(
                          'p-3 rounded-xl border text-left transition-colors cursor-pointer',
                          commissionRate === opt.rate
                            ? 'bg-orange-500/15 border-orange-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        )}
                      >
                        <p className="font-display font-bold text-lg tabular-nums">{opt.rate}%</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">{opt.label.split(' ')[1]} {opt.label.split(' ')[2] || ''}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Output */}
              <div className="lg:col-span-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 border-b border-zinc-800">
                  <div>
                    <p className="text-xs text-zinc-400">Custo em apps ({commissionRate}%)</p>
                    <p className="font-display font-bold text-xl sm:text-2xl text-red-400 tabular-nums mt-1">
                      R$ {formatBRLFull(marketplaceMonthlyCost)}/mês
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">MaisQueCardapio Premium</p>
                    <p className="font-display font-bold text-xl sm:text-2xl text-white tabular-nums mt-1">
                      R$ {formatBRLFull(premiumPlan.price)}/mês
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-emerald-400">
                    Economia líquida que volta para o seu caixa
                  </p>
                  <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-1">
                    <p className="font-display font-extrabold text-3xl sm:text-5xl text-emerald-400 tabular-nums tracking-tight">
                      R$ {formatBRLFull(monthlySavings)}
                    </p>
                    <span className="text-sm text-zinc-400">por mês</span>
                  </div>
                  <p className="text-sm text-zinc-300 mt-2 tabular-nums">
                    Em 12 meses são <strong className="text-white">R$ {formatBRLFull(annualSavings)}</strong> economizados — equivalente a cerca de <strong className="text-white">{extraOrdersEquivalent} pedidos extras</strong> de lucro limpo todo mês.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan('free')}
                  className="w-full py-3.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-sm sm:text-base transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Parar de pagar comissão — Criar minha loja
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CORE CAPABILITIES — Editorial Photo + Asymmetric Bento */}
        <section id="recursos" className="py-16 lg:py-24 border-b border-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-5 space-y-4">
                <p className="text-sm font-semibold text-orange-400">
                  Operação pensada para o horário de pico
                </p>
                <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-white [text-wrap:balance]">
                  Do clique do cliente à impressão na cozinha, tudo no mesmo painel.
                </h2>
                <p className="text-zinc-400 text-base leading-relaxed">
                  Chega de anotar pedido solto no WhatsApp, errar taxa de entrega ou somar comanda no papel. Centralize delivery, balcão, mesas QR Code, clientes e pagamentos em um único sistema leve e rápido.
                </p>
              </div>
              <div className="lg:col-span-7">
                <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-[#111114]">
                  <img
                    src={kitchenPassImg}
                    alt="Cozinha de hamburgueria artesanal operando pedidos em horário de pico"
                    className="w-full aspect-video object-cover"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-5">
              {capabilities.map((cap) => (
                <div
                  key={cap.num}
                  className={cn(
                    'rounded-2xl border border-zinc-800/90 bg-[#111114] p-6 sm:p-8 flex flex-col justify-between gap-4 hover:border-zinc-700 transition-colors',
                    cap.span
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-sm font-bold text-orange-400 tabular-nums">{cap.num}</span>
                    <span className="text-xs font-medium text-zinc-400">{cap.scope}</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {cap.title}
                    </h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">{cap.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROOF OF IMPACT — Salão & Resultados Concretos */}
        <section id="salao" className="py-16 lg:py-24 border-b border-zinc-900 bg-[#0C0C0F]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              <div className="lg:col-span-5">
                <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-[#111114]">
                  <img
                    src={tableQrImg}
                    alt="Mesa de restaurante com atendimento digital via QR Code"
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <div className="p-4 sm:p-5 border-t border-zinc-800 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-white">Salão sem espera</p>
                      <p className="text-xs text-zinc-400">QR Code individual por mesa, comanda aberta e pedido de conta.</p>
                    </div>
                    <Link
                      to="/e/demo?mesa=1"
                      className="text-xs font-bold text-orange-400 hover:text-orange-300 whitespace-nowrap shrink-0"
                    >
                      Testar Mesa 1 →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 space-y-6">
                <div>
                  <p className="text-sm font-semibold text-orange-400 mb-2">
                    Impacto na rotina de quem já migrou
                  </p>
                  <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-white [text-wrap:balance]">
                    Mais margem no delivery e menos caos no salão.
                  </h2>
                </div>

                <div className="divide-y divide-zinc-800 border-t border-b border-zinc-800">
                  {restaurantCases.map((item) => (
                    <div key={item.owner} className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6 items-start">
                      <div className="sm:col-span-4">
                        <p className="font-display font-extrabold text-2xl sm:text-3xl text-orange-400 tabular-nums">
                          {item.metric}
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">{item.metricLabel}</p>
                      </div>
                      <div className="sm:col-span-8 space-y-2">
                        <p className="text-sm text-zinc-200 leading-relaxed">&ldquo;{item.quote}&rdquo;</p>
                        <p className="text-xs text-zinc-500">
                          <strong className="text-zinc-300">{item.owner}</strong> · {item.business}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PLANS & FULL FEATURE COMPARISON */}
        <section id="planos" className="py-16 lg:py-24 border-b border-zinc-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10 sm:mb-14">
              <p className="text-sm font-semibold text-orange-400 mb-2">
                Planos transparentes · Sem fidelidade
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white [text-wrap:balance]">
                Comece grátis hoje. Evolua para o Premium quando quiser.
              </h2>
              <p className="text-zinc-400 text-base mt-3 leading-relaxed">
                O Plano Gratuito não expira e já inclui delivery por bairro, retirada no balcão, base de clientes e WhatsApp automático. O Premium libera mesas QR Code, comandas abertas, cupom 80mm, reservas e até {premiumPlan.max_products} produtos.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 sm:mb-14">
              {/* Plano Gratuito */}
              <div className="rounded-3xl border border-zinc-800 bg-[#111114] p-6 sm:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <h3 className="font-display text-2xl font-bold text-white">{freePlan.name}</h3>
                    <span className="text-xs font-medium text-zinc-400">Para começar a vender direto</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="font-display text-4xl sm:text-5xl font-extrabold text-white tabular-nums">
                      R$ {formatBRL(freePlan.price)}
                    </span>
                    <span className="text-sm text-zinc-400">/mês · 0% de comissão</span>
                  </div>
                  <p className="text-sm text-zinc-400 mb-8">
                    Ideal para validar seu canal próprio de delivery e balcão com WhatsApp automático sem custo fixo.
                  </p>

                  <ul className="space-y-3.5 mb-8">
                    <li className="flex items-start gap-3 text-sm text-zinc-200">
                      <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span>Até <strong>{freePlan.max_products} produtos</strong> cadastrados no cardápio</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-200">
                      <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span>Delivery com taxa automática por bairro e Retirada no Balcão</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-200">
                      <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span><strong>WhatsApp Automático (Evolution QR Code)</strong> para avisos de pedido e status</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-200">
                      <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span>Pagamentos via PIX da loja, na entrega e InfinitePay + Base de Clientes</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-200">
                      <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span>Personalização visual (logo, capa, temas e cores)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-500">
                      <X className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                      <span>Mesas QR Code, comandas abertas e impressão de cupom 80mm (Premium)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-500">
                      <X className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                      <span>Reservas online de mesas (Premium)</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan('free')}
                  className="w-full py-4 rounded-xl border border-zinc-700 bg-zinc-900 text-white font-bold text-sm hover:bg-zinc-800 hover:border-zinc-600 transition-colors cursor-pointer"
                >
                  Começar Grátis Agora
                </button>
              </div>

              {/* Plano Premium */}
              <div className="rounded-3xl border-2 border-orange-500 bg-[#111114] p-6 sm:p-10 flex flex-col justify-between">
                <div>
                  <div className="flex items-baseline justify-between gap-4 mb-2">
                    <h3 className="font-display text-2xl font-bold text-white">{premiumPlan.name}</h3>
                    <span className="text-xs font-semibold text-orange-400">Para operação completa</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="font-display text-4xl sm:text-5xl font-extrabold text-white tabular-nums">
                      R$ {formatBRL(premiumPlan.price)}
                    </span>
                    <span className="text-sm text-zinc-400">/mês · 0% de comissão</span>
                  </div>
                  <p className="text-sm text-zinc-400 mb-8">
                    Delivery, balcão e salão completos com catálogo expandido, QR Code por mesa, comandas e impressão térmica.
                  </p>

                  <ul className="space-y-3.5 mb-8">
                    <li className="flex items-start gap-3 text-sm text-zinc-100">
                      <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span>Até <strong>{premiumPlan.max_products} produtos</strong> cadastrados no cardápio</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-100">
                      <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span>Tudo do Plano Gratuito (delivery, balcão, WhatsApp automático, PIX, InfinitePay e Clientes)</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-100">
                      <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span><strong>Pedidos na Mesa (QR Code), Comandas Abertas e Cupom Térmico 80mm</strong></span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-100">
                      {premiumPlan.enable_reservations === 1 ? (
                        <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                      )}
                      <span><strong>Reservas Online de Mesas</strong> com data, horário e controle de convidados</span>
                    </li>
                    <li className="flex items-start gap-3 text-sm text-zinc-100">
                      <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                      <span>Ativação imediata por PIX ou InfinitePay (1, 3 ou 12 meses), sem fidelidade</span>
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectPlan('premium')}
                  className="w-full py-4 rounded-xl bg-orange-500 text-zinc-950 font-bold text-sm hover:bg-orange-400 transition-colors cursor-pointer"
                >
                  Criar Loja e Ativar Premium
                </button>
              </div>
            </div>

            {/* Detailed Comparison Matrix */}
            <div className="rounded-2xl border border-zinc-800 bg-[#111114] overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-900/40">
                <h3 className="font-display font-bold text-base text-white">
                  Comparativo completo por recurso
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs font-semibold text-zinc-400">
                      <th className="py-3.5 px-4 sm:px-6">Recurso</th>
                      <th className="py-3.5 px-3 sm:px-6 text-center w-28 sm:w-44">{freePlan.name}</th>
                      <th className="py-3.5 px-3 sm:px-6 text-center w-28 sm:w-44 text-orange-400">{premiumPlan.name}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70 text-xs sm:text-sm">
                    {comparisonRows.map((row) => (
                      <tr key={row.feature} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 text-zinc-300 font-medium">{row.feature}</td>
                        <td className="py-3.5 px-3 sm:px-6 text-center">
                          {typeof row.free === 'string' ? (
                            <span className="font-semibold text-zinc-200 tabular-nums">{row.free}</span>
                          ) : row.free ? (
                            <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-zinc-600 mx-auto" />
                          )}
                        </td>
                        <td className="py-3.5 px-3 sm:px-6 text-center">
                          {typeof row.premium === 'string' ? (
                            <span className="font-bold text-orange-400 tabular-nums">{row.premium}</span>
                          ) : row.premium ? (
                            <Check className="w-4 h-4 text-orange-400 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-zinc-600 mx-auto" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ ACCORDION — Quebra de Objeções */}
        <section id="duvidas" className="py-16 lg:py-24 border-b border-zinc-900 bg-[#0C0C0F]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="mb-10">
              <p className="text-sm font-semibold text-orange-400 mb-2">
                Dúvidas frequentes
              </p>
              <h2 className="font-display font-bold text-3xl sm:text-4xl tracking-tight text-white [text-wrap:balance]">
                Respostas diretas antes de criar sua loja.
              </h2>
            </div>

            <div className="divide-y divide-zinc-800 border-t border-b border-zinc-800">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaq === idx;
                return (
                  <div key={item.q}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full py-5 flex items-center justify-between gap-4 text-left cursor-pointer group"
                    >
                      <span className="font-semibold text-base text-white group-hover:text-orange-400 transition-colors">
                        {item.q}
                      </span>
                      <ChevronDown
                        className={cn(
                          'w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-200',
                          isOpen && 'rotate-180 text-orange-400'
                        )}
                      />
                    </button>
                    {isOpen && (
                      <p className="pb-5 text-sm sm:text-base text-zinc-400 leading-relaxed pr-8">
                        {item.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* INSTANT STORE REGISTRATION */}
        <section id="register" className="py-16 lg:py-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="rounded-3xl border border-zinc-800 bg-[#111114] p-5 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-5 space-y-6">
                <p className="text-sm font-semibold text-orange-400">
                  Cadastro instantâneo
                </p>
                <h2 className="font-display font-bold text-2xl sm:text-4xl tracking-tight text-white leading-tight [text-wrap:balance]">
                  Coloque seu cardápio no ar em menos de 1 minuto.
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
                  Crie seu link exclusivo e entre no painel imediatamente para cadastrar produtos, configurar taxas de entrega e conectar seu WhatsApp.
                </p>

                <ul className="space-y-3.5 pt-2">
                  <li className="flex items-start gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <span>Sem cartão de crédito e sem bloqueio surpresa no Plano Gratuito</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <span>Endereço exclusivo <span className="font-mono text-zinc-100">/e/{formData.slug || 'sua-loja'}</span> pronto na hora</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                    <span>Upgrade ou renovação do Premium por PIX ou InfinitePay direto no painel</span>
                  </li>
                </ul>
              </div>

              <div className="lg:col-span-7 bg-[#09090B] rounded-2xl border border-zinc-800 p-4 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-2">
                      Escolha seu plano inicial
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedPlan('free')}
                        className={cn(
                          'p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                          selectedPlan === 'free'
                            ? 'bg-orange-500/15 border-orange-500 text-white'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        )}
                      >
                        <p className="text-xs font-semibold text-orange-400">{freePlan.name}</p>
                        <p className="text-sm font-bold mt-0.5 tabular-nums">
                          R$ {formatBRL(freePlan.price)}/mês · {freePlan.max_products} itens
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlan('premium')}
                        className={cn(
                          'p-3.5 rounded-xl border text-left transition-all cursor-pointer',
                          selectedPlan === 'premium'
                            ? 'bg-orange-500 text-zinc-950 border-orange-500'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        )}
                      >
                        <p className={cn('text-xs font-semibold', selectedPlan === 'premium' ? 'text-zinc-900' : 'text-orange-400')}>
                          {premiumPlan.name}
                        </p>
                        <p className="text-sm font-bold mt-0.5 tabular-nums">
                          R$ {formatBRL(premiumPlan.price)}/mês · {premiumPlan.max_products} itens
                        </p>
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mt-2">
                      {selectedPlan === 'premium'
                        ? 'Após criar a conta, você vai direto para a aba Assinatura para ativar via PIX ou InfinitePay.'
                        : 'Sua loja já nasce ativa no Plano Gratuito imediatamente, sem cobrança.'}
                    </p>
                  </div>

                  {registerError && (
                    <div className="bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{registerError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-2">
                        Nome do Estabelecimento
                      </label>
                      <input
                        ref={storeNameInputRef}
                        required
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm text-white placeholder:text-zinc-600 transition-all"
                        placeholder="Ex: Burger do João"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-2">
                        Link do seu Cardápio
                      </label>
                      <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-orange-500 transition-all">
                        <span className="pl-3.5 text-zinc-500 text-xs font-mono shrink-0">/e/</span>
                        <input
                          required
                          value={formData.slug}
                          onChange={(e) => {
                            setSlugTouched(true);
                            setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') });
                          }}
                          className="w-full bg-transparent px-2 py-3.5 outline-none text-sm text-white placeholder:text-zinc-600 font-mono"
                          placeholder="joao-burger"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-2">
                        WhatsApp do Responsável (com DDD)
                      </label>
                      <input
                        required
                        type="tel"
                        value={formData.owner_whatsapp}
                        onChange={(e) => setFormData({ ...formData, owner_whatsapp: e.target.value.replace(/\D/g, '') })}
                        className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm text-white placeholder:text-zinc-600 transition-all font-mono"
                        placeholder="11999999999"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-2">
                        Senha de Acesso ao Painel
                      </label>
                      <input
                        required
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 px-4 py-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm text-white placeholder:text-zinc-600 transition-all"
                        placeholder="Mínimo 4 caracteres"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 text-zinc-950 py-4 rounded-xl font-bold text-sm sm:text-base hover:bg-orange-400 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {loading
                      ? 'Criando sua loja...'
                      : selectedPlan === 'premium'
                        ? 'Criar Conta e Ativar Premium'
                        : 'Criar Meu Cardápio Gratuito'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* QUIET FOOTER */}
      <footer className="border-t border-zinc-900 bg-[#09090B] py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <div className="bg-orange-500/15 p-2 rounded-xl">
              <ChefHat className="text-orange-400 w-4 h-4" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight text-white">MaisQueCardapio</span>
          </div>

          <div className="text-zinc-500 text-xs sm:text-sm space-y-1">
            <p>© 2026 MaisQueCardapio. Sistema de cardápio digital, mesas e delivery sem comissão.</p>
            <p>
              Desenvolvido por{' '}
              <a
                href="https://to-ligado.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline font-semibold"
              >
                To-Ligado.com
              </a>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs font-medium">
            <a href="#economia" className="text-zinc-400 hover:text-white transition-colors">Calculadora</a>
            <a href="#recursos" className="text-zinc-400 hover:text-white transition-colors">Recursos</a>
            <a href="#planos" className="text-zinc-400 hover:text-white transition-colors">Planos</a>
            <Link to="/e/demo" className="text-zinc-400 hover:text-white transition-colors">Demo</Link>
            <Link to="/superadmin" className="text-zinc-500 hover:text-orange-400 transition-colors">Painel Mestre</Link>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="relative bg-[#111114] w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-6 sm:p-10 border border-zinc-800"
            >
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="absolute top-6 right-6 p-2 hover:bg-zinc-800 rounded-full text-zinc-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="font-display text-2xl font-bold mb-6 tracking-tight text-white">
                Entrar no <span className="text-orange-400">Painel da Loja</span>
              </h2>
              {loginError && (
                <div className="mb-5 bg-red-500/10 border border-red-500/40 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    WhatsApp cadastrado (com DDD)
                  </label>
                  <input
                    required
                    type="text"
                    value={loginData.slug}
                    onChange={(e) => setLoginData({ ...loginData, slug: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm text-white font-mono"
                    placeholder="11999999999"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-2">
                    Senha
                  </label>
                  <input
                    required
                    type="password"
                    value={loginData.password || ''}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-orange-500 text-sm text-white"
                    placeholder="Sua senha"
                  />
                </div>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Você será direcionado automaticamente para o painel administrativo da sua loja.
                </p>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-orange-500 text-zinc-950 py-4 rounded-xl font-bold text-sm hover:bg-orange-400 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {loginLoading ? 'Entrando...' : 'Entrar no Painel'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REGISTRATION SUCCESS MODAL */}
      <AnimatePresence>
        {registrationSuccess && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="relative bg-[#111114] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl p-6 sm:p-10 border border-orange-500/40"
            >
              <div className="text-center mb-7">
                <div className="bg-orange-500/15 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <Check className="w-8 h-8 text-orange-400" />
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2 tracking-tight text-white">
                  Sua loja está <span className="text-orange-400">no ar</span>
                </h2>
                <p className="text-sm text-zinc-400">Salve seus dados de acesso ao painel administrativo:</p>
              </div>

              <div className="bg-zinc-950 rounded-2xl p-5 mb-6 border border-zinc-800">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2.5 border-b border-zinc-800 gap-3">
                    <span className="text-zinc-500 text-xs font-medium shrink-0">Link do Cardápio</span>
                    <span className="text-orange-400 font-mono text-xs truncate">
                      {typeof window !== 'undefined' ? window.location.origin : ''}/e/{registrationSuccess.slug}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-zinc-800">
                    <span className="text-zinc-500 text-xs font-medium">WhatsApp</span>
                    <span className="text-white font-mono text-sm tabular-nums">{registrationSuccess.whatsapp}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-zinc-500 text-xs font-medium">Senha</span>
                    <span className="text-white font-mono text-sm">{registrationSuccess.password}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const origin = typeof window !== 'undefined' ? window.location.origin : '';
                    navigator.clipboard.writeText(
                      `URL: ${origin}/e/${registrationSuccess.slug}\nWhatsApp: ${registrationSuccess.whatsapp}\nSenha: ${registrationSuccess.password}`
                    );
                    setCopiedCreds(true);
                    setTimeout(() => setCopiedCreds(false), 2500);
                  }}
                  className="flex-1 bg-zinc-800 text-white py-3.5 rounded-xl font-semibold text-sm hover:bg-zinc-700 transition-colors border border-zinc-700 cursor-pointer"
                >
                  {copiedCreds ? 'Dados Copiados!' : 'Copiar Dados'}
                </button>
                <Link
                  to={
                    registrationSuccess.plan === 'premium'
                      ? `/e/${registrationSuccess.slug}/admin/assinatura`
                      : `/e/${registrationSuccess.slug}/admin`
                  }
                  className="flex-1 bg-orange-500 text-zinc-950 py-3.5 rounded-xl font-bold text-sm text-center hover:bg-orange-400 transition-colors"
                >
                  {registrationSuccess.plan === 'premium' ? 'Pagar e Ativar Premium' : 'Acessar Painel Agora'}
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
