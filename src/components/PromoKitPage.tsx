import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Film,
  Monitor,
  Smartphone,
  Sparkles,
  UserCheck
} from 'lucide-react';

interface PromoCampaign {
  id: 'apresentadora' | 'institucional';
  label: string;
  badge: string;
  subtitle: string;
  scriptSummary: string;
  vertical: {
    src: string;
    poster: string;
    filename: string;
    meta: string;
  };
  horizontal: {
    src: string;
    poster: string;
    filename: string;
    meta: string;
  };
}

const CAMPAIGNS: PromoCampaign[] = [
  {
    id: 'apresentadora',
    label: 'Versão Apresentadora',
    badge: 'Alta Conversão',
    subtitle:
      'Apresentadora carismática conduzindo o cliente do gancho à contratação, ideal para anúncios de conversão no Instagram, TikTok, WhatsApp e YouTube.',
    scriptSummary:
      '1. Apresentadora com gancho direto (0% de comissão) · 2. Cardápio próprio no celular pronto em 1 minuto · 3. WhatsApp automático + PIX e InfinitePay · 4. Mesas QR Code, comandas e cupom térmico 80mm · 5. Chamada forte para começar grátis em maisquecardapio.to-ligado.com.',
    vertical: {
      src: '/promo/maisquecardapio-apresentadora-9x16.mp4',
      poster: '/promo/poster-apresentadora-9x16.jpg',
      filename: 'maisquecardapio-apresentadora-9x16.mp4',
      meta: '28 segundos · 30 fps · Apresentadora + trilha vibrante + zonas seguras Reels/TikTok'
    },
    horizontal: {
      src: '/promo/maisquecardapio-apresentadora-16x9.mp4',
      poster: '/promo/poster-apresentadora-16x9.jpg',
      filename: 'maisquecardapio-apresentadora-16x9.mp4',
      meta: '28 segundos · Full HD 30 fps · Apresentadora em enquadramento lateral + trilha inclusa'
    }
  },
  {
    id: 'institucional',
    label: 'Versão Institucional',
    badge: 'Clássico',
    subtitle:
      'Foco visual em gastronomia, operação de salão e delivery para campanhas institucionais, site e apresentações comerciais.',
    scriptSummary:
      '1. Gancho sobre comissão de até 27% · 2. Cardápio próprio 0% comissão · 3. WhatsApp automático + PIX e InfinitePay · 4. Mesas QR Code, comandas e cupom 80mm · 5. Oferta Gratuito R$ 0 / Premium R$ 49,90 + domínio final.',
    vertical: {
      src: '/promo/maisquecardapio-reels-9x16.mp4',
      poster: '/promo/poster-9x16.jpg',
      filename: 'maisquecardapio-reels-9x16.mp4',
      meta: '28 segundos · 30 fps · Zonas seguras para Instagram e TikTok'
    },
    horizontal: {
      src: '/promo/maisquecardapio-horizontal-16x9.mp4',
      poster: '/promo/poster-16x9.jpg',
      filename: 'maisquecardapio-horizontal-16x9.mp4',
      meta: '28 segundos · Full HD 30 fps · Trilha sonora inclusa'
    }
  }
];

const AD_CAPTIONS = [
  {
    id: 'reels',
    title: 'Instagram Reels / TikTok / Shorts',
    body: `Chega de entregar até 27% do seu faturamento em comissão de aplicativo. 🍔🔥\n\nCom o MaisQueCardapio você coloca seu próprio cardápio digital no ar em menos de 1 minuto:\n✅ 0% de comissão por pedido\n✅ Taxa de entrega automática por bairro e retirada no balcão\n✅ WhatsApp automático via QR Code avisando cada status do pedido\n✅ PIX e InfinitePay direto na sua conta\n✅ Mesas QR Code, comandas abertas e cupom térmico 80mm\n\nComece grátis hoje (R$ 0/mês) ou ative o Premium por R$ 49,90/mês sem fidelidade.\n\n👇 Crie sua loja agora:\nhttps://maisquecardapio.to-ligado.com`
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp Status / Lista de Transmissão',
    body: `Você tem hamburgueria, pizzaria, restaurante ou delivery? 🍕\n\nPare de perder dinheiro com comissão por pedido. Crie seu próprio link de pedidos com taxa por bairro, PIX direto na conta e avisos automáticos no WhatsApp.\n\nPlano Gratuito disponível para começar hoje mesmo!\nAcesse: https://maisquecardapio.to-ligado.com`
  },
  {
    id: 'ads',
    title: 'Tráfego Pago (Meta / Google Ads)',
    body: `Venda no delivery e no salão sem pagar comissão por pedido.\n\nMaisQueCardapio reúne cardápio próprio, entrega por bairro, PIX/InfinitePay, WhatsApp automático e mesas QR Code em um único painel leve e rápido.\n\nTeste a loja demo ao vivo e crie sua conta grátis em menos de 1 minuto:\nhttps://maisquecardapio.to-ligado.com`
  }
];

export const PromoKitSection: React.FC = () => {
  const [selectedCampaignId, setSelectedCampaignId] =
    useState<PromoCampaign['id']>('apresentadora');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeCampaign =
    CAMPAIGNS.find((c) => c.id === selectedCampaignId) || CAMPAIGNS[0];

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2200);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-400">
            <Film className="w-4 h-4 shrink-0" />
            <span>Kit de Divulgação Oficial · MP4 Full HD com Trilha Sonora</span>
          </div>
          <h2 className="font-display font-extrabold text-2xl sm:text-4xl tracking-tight text-white leading-tight">
            Vídeos publicitários prontos para postar e anunciar
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Escolha entre a versão com <strong className="text-zinc-200">apresentadora</strong> ou a{' '}
            <strong className="text-zinc-200">institucional</strong> nos dois formatos (9:16 e 16:9), finalizados com{' '}
            <span className="font-mono text-orange-400">maisquecardapio.to-ligado.com</span>.
          </p>
        </div>

        {/* Campaign Switcher */}
        <div className="grid grid-cols-2 sm:inline-flex gap-2 p-1.5 rounded-2xl border border-zinc-800 bg-zinc-950/80 shrink-0">
          {CAMPAIGNS.map((campaign) => {
            const isActive = campaign.id === activeCampaign.id;
            return (
              <button
                key={campaign.id}
                type="button"
                onClick={() => setSelectedCampaignId(campaign.id)}
                className={`px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-orange-500 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
              >
                {campaign.id === 'apresentadora' ? (
                  <UserCheck className="w-4 h-4 shrink-0" />
                ) : (
                  <Film className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">{campaign.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Campaign Description */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <span className="font-bold text-orange-400 mr-2">
            {activeCampaign.label} ({activeCampaign.badge}):
          </span>
          {activeCampaign.subtitle}
        </p>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Vertical 9:16 */}
        <section className="lg:col-span-5 rounded-3xl border border-zinc-800 bg-brand-surface p-5 sm:p-6 space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 mb-1">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Vertical 9:16 · 1080×1920</span>
            </div>
            <h3 className="font-display font-bold text-xl text-white">
              Reels, TikTok, Shorts e Status
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeCampaign.vertical.meta}
            </p>
          </div>

          <div className="mx-auto max-w-[300px] rounded-2xl overflow-hidden border border-zinc-800 bg-black shadow-2xl">
            <video
              key={activeCampaign.vertical.src}
              controls
              playsInline
              preload="metadata"
              poster={activeCampaign.vertical.poster}
              className="w-full aspect-[9/16] bg-black"
            >
              <source src={activeCampaign.vertical.src} type="video/mp4" />
              Seu navegador não suporta reprodução de vídeo MP4.
            </video>
          </div>

          <a
            href={activeCampaign.vertical.src}
            download={activeCampaign.vertical.filename}
            className="w-full py-3.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 shrink-0" />
            Baixar Vertical 9:16 ({activeCampaign.label})
          </a>
        </section>

        {/* Horizontal 16:9 */}
        <section className="lg:col-span-7 rounded-3xl border border-zinc-800 bg-brand-surface p-5 sm:p-6 space-y-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 mb-1">
              <Monitor className="w-3.5 h-3.5" />
              <span>Horizontal 16:9 · 1920×1080</span>
            </div>
            <h3 className="font-display font-bold text-xl text-white">
              YouTube, Site, Apresentações e Ads
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {activeCampaign.horizontal.meta}
            </p>
          </div>

          <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black shadow-2xl">
            <video
              key={activeCampaign.horizontal.src}
              controls
              playsInline
              preload="metadata"
              poster={activeCampaign.horizontal.poster}
              className="w-full aspect-video bg-black"
            >
              <source src={activeCampaign.horizontal.src} type="video/mp4" />
              Seu navegador não suporta reprodução de vídeo MP4.
            </video>
          </div>

          <a
            href={activeCampaign.horizontal.src}
            download={activeCampaign.horizontal.filename}
            className="w-full py-3.5 px-5 rounded-xl bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 shrink-0" />
            Baixar Horizontal 16:9 ({activeCampaign.label})
          </a>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-xs text-zinc-400 space-y-1.5">
            <p className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              Roteiro de 5 cenas ({activeCampaign.label}):
            </p>
            <p>{activeCampaign.scriptSummary}</p>
          </div>
        </section>
      </div>

      {/* Ready-to-post Captions */}
      <section className="space-y-4">
        <div>
          <h3 className="font-display font-bold text-xl text-white">
            Legendas prontas para acompanhar os vídeos
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Copie e cole direto nas suas postagens ou campanhas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {AD_CAPTIONS.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-zinc-800 bg-brand-surface p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <h4 className="font-bold text-sm text-orange-400">{item.title}</h4>
                <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed">
                  {item.body}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(item.id, item.body)}
                className="w-full py-2.5 px-3 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedId === item.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-zinc-400" />
                    Copiar Legenda
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
