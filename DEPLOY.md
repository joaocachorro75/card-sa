# MaisQueCardapio - Sistema de Gestão para Lanchonetes

Sistema completo para gestão de lanchonetes, restaurantes e food services.

## 🚀 Funcionalidades

- 📋 **Cardápio Digital** - Produtos e categorias personalizáveis
- 🛵 **Delivery** - Pedidos com taxas por bairro
- 🪑 **Mesas e Comandas** - Gestão de mesas e pedidos
- 📅 **Reservas** - Sistema de reservas online
- 👥 **Clientes** - Cadastro e histórico de clientes
- 💬 **WhatsApp Integration** - Notificações automáticas via Evolution API
- 🤖 **IA** - Integração com Gemini para assistência

## 📦 Deploy no EasyPanel

### 1. Criar Banco de Dados MySQL

No EasyPanel, crie um banco MySQL:
- Nome: `maisquecardapio`
- Usuário e senha: configure conforme desejado

### 2. Criar Container da Aplicação

**Configuração do Container:**
- **Dockerfile:** `Dockerfile.mysql`
- **Porta:** 3000

**Variáveis de Ambiente:**
```
DB_HOST=endereco-do-mysql
DB_USER=usuario-mysql
DB_PASSWORD=senha-mysql
DB_NAME=maisquecardapio
NODE_ENV=production
PORT=3000
```

### 3. Deploy

1. Conectar repositório GitHub
2. Selecionar o branch `main`
3. Configurar variáveis de ambiente
4. Deploy!

## 🔧 Desenvolvimento Local

### Com SQLite (padrão):
```bash
npm install
npm run dev
```

### Com MySQL:
```bash
cp .env.mysql.example .env
# Editar .env com suas credenciais
npm install
npm run dev:mysql
```

## 📡 API Endpoints

### Públicos
- `POST /api/public/register` - Registrar estabelecimento
- `GET /api/public/establishments/:slug` - Buscar estabelecimento
- `POST /api/public/customer/register` - Cadastrar cliente
- `POST /api/public/customer/login` - Login de cliente

### Superadmin
- `GET /api/superadmin/establishments` - Listar estabelecimentos
- `GET /api/superadmin/plans` - Listar planos

### Estabelecimento (requer header `X-Establishment-Slug`)
- `GET /api/e/products` - Listar produtos
- `POST /api/e/products` - Criar produto
- `GET /api/e/categories` - Listar categorias
- `GET /api/e/orders` - Listar pedidos
- `POST /api/e/orders` - Criar pedido
- `GET /api/e/tables` - Listar mesas
- `GET /api/e/settings` - Configurações
- `POST /api/e/settings` - Salvar configurações

## 🗄️ Estrutura do Banco

- `plans` - Planos de assinatura
- `establishments` - Estabelecimentos
- `categories` - Categorias de produtos
- `products` - Produtos do cardápio
- `neighborhoods` - Bairros de entrega
- `orders` - Pedidos
- `tables` - Mesas
- `commands` - Comandas
- `customers` - Clientes
- `reservations` - Reservas
- `settings` - Configurações por estabelecimento

## 🔐 Login Demo

- **Slug:** `demo`
- **Senha:** `admin123`

---

Desenvolvido por **To-Ligado.com**
