# MaisQueCardapio

Plataforma completa de cardápio digital sem comissão por pedido, delivery por bairro, mesas com QR Code, comandas, reservas, pagamentos via PIX ou InfinitePay e notificações automáticas no WhatsApp.

## Desenvolvimento Local

**Pré-requisitos:** Node.js 20+

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure as variáveis de ambiente (opcional em ambiente local — caso `DB_HOST` não esteja definido, o servidor utiliza armazenamento em memória para desenvolvimento):
   ```bash
   cp .env.example .env
   ```
3. Inicie em modo de desenvolvimento:
   ```bash
   npm run dev
   ```

## Build e Produção

```bash
npm run build
npm start
```

Consulte [DEPLOY.md](./DEPLOY.md) para instruções de deploy com MySQL e Docker/EasyPanel.
