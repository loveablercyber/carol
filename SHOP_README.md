# 🛍️ Loja Virtual - CarolSol Studio

Loja virtual profissional integrada ao site CarolSol Studio, especializada em venda de Mega Hair, Perucas e Acessórios Capilares. Desenvolvida com foco em conversão, SEO, performance, segurança e escalabilidade.

## 📋 Índice

- [Stack Tecnológica](#-stack-tecnológica)
- [Funcionalidades](#-funcionalidades)
- [Arquitetura](#-arquitetura)
- [Setup Local](#-setup-local)
- [Estrutura do Banco de Dados](#-estrutura-do-banco-de-dados)
- [APIs Disponíveis](#-apis-disponíveis)
- [Segurança](#-segurança)
- [SEO e Performance](#-seo-e-performance)
- [Deploy](#-deploy)

---

## 🚀 Stack Tecnológica

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Componentes**: shadcn/ui
- **SEO**: next/metadata
- **Responsividade**: Mobile-first

### Backend
- **Runtime**: Node.js
- **API**: REST com Next.js API Routes
- **ORM**: Prisma
- **Banco de Dados**: SQLite3 (pronto para migração para PostgreSQL/MySQL)
- **Validação**: Zod (planejado)
- **Autenticação**: NextAuth.js (planejado)

---

## ✨ Funcionalidades Implementadas

### 🛒 Catálogo de Produtos
- ✅ Listagem de produtos com paginação
- ✅ Filtros por categoria, tipo de cabelo, textura e faixa de preço
- ✅ Busca inteligente com debounce
- ✅ Ordenação por preço, nome e mais recentes
- ✅ Visualização em grid responsivo
- ✅ Exibição de avaliações e ratings
- ✅ Produtos em destaque

### 📦 Página do Produto
- ✅ Galeria de imagens com navegação
- ✅ Descrição detalhada
- ✅ Especificações técnicas
- ✅ Sistema de avaliações
- ✅ Controle de estoque em tempo real
- ✅ Adição ao carrinho com quantidade
- ✅ Produtos relacionados

### 🛍️ Carrinho de Compras
- ✅ Carrinho persistente com cookies
- ✅ Atualização dinâmica de quantidade
- ✅ Remoção de itens
- ✅ Cálculo automático de subtotal
- ✅ Validação de estoque
- ✅ Interface responsiva

### 📊 Gestão de Dados
- ✅ Sistema de categorias
- ✅ Gestão de produtos
- ✅ Sistema de avaliações
- ✅ Cupons de desconto
- ✅ Histórico de pedidos
- ✅ Endereços de clientes

### 🚚 Frete (Simulado)
- ✅ Cálculo de frete por CEP
- ✅ Opções PAC e SEDEX
- ✅ Prazos estimados
- ✅ Preços por região (simulado)
- ⏳ Integração real com Correios (planejado)

### 💳 Pagamentos (Planejado)
- ⏳ Integração Mercado Pago
- ⏳ Pix
- ⏳ Cartão de crédito com parcelamento
- ⏳ Webhooks de confirmação

### 👤 Área do Cliente (Planejado)
- ⏳ Cadastro e login
- ⏳ Histórico de pedidos
- ⏳ Status do pedido
- ⏳ Endereços salvos

### 🛠️ Painel Administrativo (Planejado)
- ⏳ CRUD de produtos
- ⏳ CRUD de categorias
- ⏳ Gestão de estoque
- ⏳ Gestão de cupons
- ⏳ Gestão de pedidos
- ⏳ Relatórios de vendas

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │  /shop   │  │/cart    │  │/product │  │/admin │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Routes (Next.js)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Products │  │  Cart   │  │ Orders  │  │Coupons │ │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘ │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Prisma ORM                           │
└────────────────────┬──────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   SQLite Database                         │
│  Products │ Orders │ Users │ Cart │ Reviews │ Coupons   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Setup Local

### Pré-requisitos
- Node.js 18+ ou Bun
- Git
- Editor de código (VS Code recomendado)

### Instalação

1. **Clone o repositório**
```bash
git clone <repositorio>
cd my-project
```

2. **Instale as dependências**
```bash
bun install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
DATABASE_URL="file:./db/custom.db"
NEXTAUTH_SECRET="sua-chave-secreta"
NEXTAUTH_URL="http://localhost:3000"
```

4. **Execute as migrations**
```bash
bun run db:push
```

5. **Popule o banco de dados (opcional)**
```bash
bun run scripts/seed-db.ts
```

6. **Inicie o servidor de desenvolvimento**
```bash
bun run dev
```

Acesse: http://localhost:3000/shop

---

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais

#### Categories
- `id`, `name`, `slug`, `description`, `image`
- `isActive`, `order`
- Relacionamento: 1-N com Products

#### Products
- `id`, `name`, `slug`, `description`, `shortDescription`
- `price`, `compareAtPrice`
- `weight`, `length`, `hairType`, `texture`, `color`
- `images` (JSON), `specs` (JSON)
- `isActive`, `inStock`, `stock`, `featured`
- `seoTitle`, `seoDescription`, `seoKeywords`
- Relacionamentos: N-1 com Category, 1-N com CartItem, OrderItem, Review

#### Cart
- `id`, `sessionId`, `userId`, `expiresAt`
- Relacionamentos: 1-N com CartItem

#### CartItem
- `id`, `cartId`, `productId`, `quantity`
- Relacionamentos: N-1 com Cart, Product

#### Orders
- `id`, `orderNumber`, `userId`, `customerName`, `customerEmail`, `customerPhone`
- `shippingAddress` (JSON), `status`, `paymentStatus`, `paymentMethod`, `paymentId`
- `subtotal`, `shippingCost`, `discount`, `couponCode`, `total`
- `trackingCode`, `estimatedDelivery`, `deliveredAt`, `notes`
- Relacionamentos: 1-N com OrderItem

#### OrderItem
- `id`, `orderId`, `productId`, `productName`, `productImage`, `price`, `quantity`
- Relacionamentos: N-1 com Order, Product

#### Reviews
- `id`, `productId`, `userId`, `author`, `rating`, `title`, `comment`
- `verified`, `isActive`
- Relacionamentos: N-1 with Product

#### Coupons
- `id`, `code`, `type`, `value`, `minPurchase`, `maxDiscount`
- `usageLimit`, `usageCount`, `validFrom`, `validTo`
- `isActive`, `applicableTo`

#### Addresses
- `id`, `userId`, `recipient`, `zipCode`, `street`, `number`
- `complement`, `neighborhood`, `city`, `state`, `isDefault`

### Enums

**OrderStatus**: `PENDING`, `PROCESSING`, `PAID`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED`

**PaymentStatus**: `PENDING`, `APPROVED`, `REJECTED`, `REFUNDED`

**CouponType**: `PERCENTAGE`, `FIXED_AMOUNT`, `FREE_SHIPPING`

---

## 🔌 APIs Disponíveis

### Produtos

#### GET `/api/shop/products`
Listar produtos com filtros e paginação

**Query Params:**
- `category`: ID da categoria
- `hairType`: HUMANO, SINTÉTICO, MISTO
- `texture`: LISO, CACHEADO, ONDULADO
- `minPrice`: Preço mínimo
- `maxPrice`: Preço máximo
- `search`: Termo de busca
- `featured`: true/false
- `sortBy`: createdAt, price-asc, price-desc, name
- `page`: Número da página (padrão: 1)
- `limit`: Itens por página (padrão: 12)

**Response:**
```json
{
  "products": [...],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 50,
    "totalPages": 5
  }
}
```

#### POST `/api/shop/products`
Criar novo produto (admin)

#### GET `/api/shop/products/[id]`
Buscar produto por ID ou slug

**Response:**
```json
{
  "product": {...},
  "relatedProducts": [...]
}
```

#### PUT `/api/shop/products/[id]`
Atualizar produto (admin)

#### DELETE `/api/shop/products/[id]`
Deletar produto (admin)

### Categorias

#### GET `/api/shop/categories`
Listar todas as categorias ativas

**Response:**
```json
{
  "categories": [
    {
      "id": "...",
      "name": "Mega Hair",
      "slug": "mega-hair",
      "productCount": 15
    }
  ]
}
```

#### POST `/api/shop/categories`
Criar nova categoria (admin)

### Carrinho

#### GET `/api/shop/cart`
Buscar carrinho atual

**Response:**
```json
{
  "cart": {
    "id": "...",
    "items": [...]
  },
  "totals": {
    "subtotal": 150.00,
    "itemCount": 3
  }
}
```

#### POST `/api/shop/cart`
Adicionar item ao carrinho

**Body:**
```json
{
  "productId": "...",
  "quantity": 1
}
```

#### DELETE `/api/shop/cart`
Remover item do carrinho

**Body:**
```json
{
  "itemId": "..."
}
```

### Frete

#### POST `/api/shop/shipping`
Calcular frete

**Body:**
```json
{
  "zipCode": "01310-100",
  "weight": 0.5,
  "dimensions": {
    "width": 15,
    "height": 10,
    "length": 20
  }
}
```

**Response:**
```json
{
  "shippingOptions": [
    {
      "code": "PAC",
      "name": "PAC - Encomenda Econômica",
      "price": 15.00,
      "deliveryDays": 5,
      "estimatedDelivery": "5 dias úteis"
    },
    {
      "code": "SEDEX",
      "name": "SEDEX - Entrega Expressa",
      "price": 37.50,
      "deliveryDays": 1,
      "estimatedDelivery": "1 dia útil"
    }
  ]
}
```

### Cupons

#### GET `/api/shop/coupons/[code]`
Validar cupom de desconto

**Response:**
```json
{
  "coupon": {
    "id": "...",
    "code": "BEMVINDO10",
    "type": "PERCENTAGE",
    "value": 10,
    "minPurchase": 100,
    "maxDiscount": 50
  }
}
```

### Pedidos

#### POST `/api/shop/orders`
Criar novo pedido (checkout)

**Body:**
```json
{
  "customerName": "Maria Silva",
  "customerEmail": "maria@email.com",
  "customerPhone": "11999999999",
  "shippingAddress": {
    "zipCode": "01310-100",
    "street": "Av. Paulista",
    "number": "1000",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "cost": 15.00
  },
  "paymentMethod": "MERCADO_PAGO_PIX",
  "couponCode": "BEMVINDO10"
}
```

**Response:**
```json
{
  "order": {
    "id": "...",
    "orderNumber": "CSO-1234567890",
    "total": 150.00,
    "status": "PENDING"
  }
}
```

#### GET `/api/shop/orders`
Listar pedidos (admin)

---

## 🔐 Segurança

### Implementado
- ✅ Validação de dados nas APIs
- ✅ Cookies httpOnly e secure em produção
- ✅ Prevenção de SQL Injection (via Prisma)
- ✅ Validação de estoque antes da compra
- ✅ Proteção contra carrinho vazio no checkout

### Planejado
- ⏳ Rate limit em rotas sensíveis
- ⏳ Autenticação JWT ou NextAuth
- ⏳ Proteção CSRF
- ⏳ Senhas com bcrypt
- ⏳ XSS protection headers

---

## 🎯 SEO e Performance

### Implementado
- ✅ URLs amigáveis (`/shop/products/[slug]`)
- ✅ Meta tags dinâmicas (planejado)
- ✅ Imagens lazy loading
- ✅ Carregamento otimizado de componentes
- ✅ Paginação de produtos
- ✅ Debounce em busca

### Planejado
- ⏳ Schema Markup (Product, Offer, Review)
- ⏳ Sitemap dinâmico
- ⏳ Open Graph tags
- ⏳ Imagens WebP
- ⏳ Cache estratégico
- ⏳ Lighthouse ≥ 90

---

## 🚀 Deploy

### Render (Planejado)

1. **Preparar ambiente de produção**
```bash
bun run build
```

2. **Variáveis de Ambiente**
```
DATABASE_URL=<production-db-url>
NODE_ENV=production
NEXTAUTH_SECRET=<secret>
NEXTAUTH_URL=https://seusite.com
```

3. **Deploy**
- Conectar repositório no Render
- Configurar build command: `bun run build`
- Configurar start command: `bun start`

### CI/CD (Planejado)
- GitHub Actions para automação
- Testes automáticos
- Backup automático do banco

---

## 📊 Scripts Disponíveis

```bash
# Instalar dependências
bun install

# Executar servidor de desenvolvimento
bun run dev

# Build para produção
bun run build

# Iniciar produção
bun run start

# Migrations
bun run db:push
bun run db:studio  # Prisma Studio

# Seed do banco de dados
bun run scripts/seed-db.ts

# Lint
bun run lint
```

---

## 📝 Dados de Exemplo

Após executar o script de seed, você terá:

- **5 categorias**: Mega Hair, Perucas, Lace Front, Apliques, Acessórios
- **8 produtos**: Produtos de exemplo com especificações
- **3 avaliações**: Avaliações de exemplo
- **1 cupom**: `BEMVINDO10` - 10% de desconto em compras acima de R$ 100

---

## 🤝 Suporte

Para dúvidas ou problemas:
- Documentação: `/docs`
- Issues: Abra uma issue no repositório

---

## 📄 Licença

Copyright © 2026 CarolSol Studio. Todos os direitos reservados.
