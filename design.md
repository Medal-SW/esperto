# Esperto — Design System

Identidade visual e guia de design do Esperto, plataforma de ranking de jogos de palavras entre amigos.

## Personalidade da Marca

**Tom**: Competitivo mas divertido. Rivalidade saudável entre amigos, não esports.

**Palavras-chave**: desafio, diversão, ranking, inteligência, grupo de amigos.

**"Esperto"** = esperto, sagaz. O nome reflete o core: provar quem é o mais esperto do grupo.

---

## Logo e Ícone

### Wordmark

- Fonte: **Space Grotesk**, weight 700
- Cor: `--accent` (`#e94560`)
- Tamanhos de uso: 20px (topbar), 26px (login)

### Ícone (Logo Mark)

- **Cérebro com coroa** — une inteligência (cérebro) com competição (coroa)
- Arquivo: `frontend/public/icons/esperto-icon.svg`
- Versões necessárias:
  - SVG stroke (uso geral, inline)
  - 192x192 e 512x512 (PWA manifest)
  - 32x32 (favicon)
- Cor padrão: `--accent` sobre fundo `--bg-primary`

### Regras de uso

- Wordmark: sempre em Space Grotesk 700, nunca em Inter
- Ícone pode aparecer sozinho (favicon, mobile) ou ao lado do wordmark
- Nunca distorcer, rotacionar ou aplicar efeitos no ícone
- Manter área de respiro mínima de 8px ao redor

---

## Cores

### Cores da marca

| Token | Hex | Uso |
|-------|-----|-----|
| `--accent` | `#e94560` | Ações primárias, botões, brand, destaques |
| `--accent-soft` | `rgba(233,69,96,0.12)` | Backgrounds de estados ativos |
| `--secondary` | `#3b82f6` | Ações secundárias, links, info states, badges neutros |
| `--secondary-soft` | `rgba(59,130,246,0.12)` | Background de elementos secundários |

**Hierarquia quente/frio**: accent (quente) = ação primária, secondary (frio) = ação secundária. Usuário distingue prioridade instintivamente.

### Cores dos jogos

| Jogo | Token | Hex | Nota |
|------|-------|-----|------|
| Conexo | `--game-conexo` | `#a855f7` (roxo) | Antes era `#e94560`, mudou pra não conflitar com accent |
| Letroso | `--game-letroso` | `#22c55e` (verde) | |
| Expresso | `--game-expresso` | `#f59e0b` (âmbar) | |

Cores dos jogos são exclusivas pra contexto de jogo (dots, badges, gráficos). Nunca usar pra ações de UI.

### Cores semânticas

| Token | Uso |
|-------|-----|
| `--success` | Confirmações, ações positivas |
| `--danger` | Erros, ações destrutivas |

### Tema Dark (padrão)

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg-primary` | `#0f1923` | Fundo da página |
| `--bg-card` | `#1a2332` | Fundo de cards |
| `--bg-hover` | `#243447` | Hover states |
| `--bg-chrome` | `#141e2b` | Topbar, bottom nav |
| `--border` | `#2a3a4d` | Bordas, separadores |
| `--text-primary` | `#e8edf2` | Texto principal |
| `--text-secondary` | `#8b99a8` | Texto secundário |
| `--text-muted` | `#5a6a7a` | Texto desabilitado/hint |

### Tema Light

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg-primary` | `#f5f6f8` | Fundo da página |
| `--bg-card` | `#ffffff` | Fundo de cards |
| `--bg-hover` | `#ebedf0` | Hover states |
| `--bg-chrome` | `#ffffff` | Topbar, bottom nav |
| `--border` | `#dce0e5` | Bordas, separadores |
| `--text-primary` | `#1a1a2e` | Texto principal |
| `--text-secondary` | `#5a6070` | Texto secundário |
| `--text-muted` | `#8b909a` | Texto desabilitado/hint |

### Tema

- **Dark-first**: dark é o padrão, light disponível como opção
- Cores accent/secondary/jogos brilham mais em dark — prioridade visual
- Light theme existe pra acessibilidade e preferência pessoal

---

## Tipografia

### Fontes

| Contexto | Fonte | Fallback |
|----------|-------|----------|
| **Brand / wordmark** | Space Grotesk 700 | system-ui, sans-serif |
| **Corpo / UI** | Inter 400–700 | -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif |

### Escala tipográfica

| Nível | Tamanho | Weight | Uso |
|-------|---------|--------|-----|
| Display | 26px | 700 (Space Grotesk) | Brand na login |
| Title | 20px | 700 (Space Grotesk) | Brand na topbar |
| Heading | 18px | 700 | Títulos de seção |
| Subheading | 15px | 600 | Subtítulos, card headers |
| Body | 14px | 400–500 | Texto geral |
| Small | 13px | 500 | Labels, nav items, metadata |
| Caption | 12px | 600 | Labels uppercase, badges |
| Tiny | 11px | 500 | Hints, timestamps |
| Tab label | 10px | 500–600 | Bottom nav labels (mobile) |

### Regras

- Inter tem **tabular numbers** nativo — usar pra rankings, scores, tentativas (alinhamento perfeito)
- Labels uppercase: `text-transform: uppercase; letter-spacing: 0.05em; font-size: 12px; font-weight: 600`
- Nunca usar Space Grotesk pra corpo de texto — reservada pra brand

---

## Espaçamento

### Escala base 4

```
--space-1:  4px
--space-2:  8px
--space-3:  12px
--space-4:  16px
--space-6:  24px
--space-8:  32px
--space-12: 48px
--space-16: 64px
```

Todos espaçamentos (padding, margin, gap) devem usar valores desta escala.

### Densidade adaptativa

| Contexto | Padding | Gap | Font |
|----------|---------|-----|------|
| **Compacto** (ranking, histórico, tabelas) | 8–12px | 8px | 13px |
| **Confortável** (submit, login, forms) | 16–24px | 16px | 14–15px |

---

## Border Radius

### Escala

```
--radius-sm:  4px    → badges, tags, chips pequenos
--radius-md:  8px    → botões, inputs, items de lista
--radius-lg:  12px   → cards, modals, dropdowns
--radius-xl:  16px   → cards grandes, containers
--radius-full: 9999px → avatares, pills
```

---

## Elevação e Profundidade

### Modelo híbrido

- **Nível base** (cards, sections): separação por `border` + cor de fundo. Sem shadow.
- **Nível elevado** (modals, dropdowns, toasts): shadow pra comunicar "acima do conteúdo".

### Escala de shadow

```
--shadow-sm: 0 2px 8px rgba(0,0,0,0.15)     → tooltips, popovers
--shadow-md: 0 8px 24px rgba(0,0,0,0.25)     → dropdowns, modals
--shadow-lg: 0 16px 48px rgba(0,0,0,0.35)    → overlays fullscreen
```

Shadow em dark theme deve ser sutil — excesso parece mancha.

---

## Animações e Transições

### Timing

```
--duration-fast:   100ms   → hover, focus, toggle
--duration-normal: 200ms   → expand, collapse, fade
--duration-slow:   350ms   → page enter, modal open
```

### Easing

```
--easing-default: cubic-bezier(0.4, 0, 0.2, 1)     → transições padrão
--easing-spring:  cubic-bezier(0.34, 1.56, 0.64, 1) → celebrações, bounce
```

### Filosofia

- **Sutil**: feedback tátil nos momentos certos, sem exagero
- Hover states e fades: sempre
- Micro-interações em ações chave: registrar score, vitória, streak novo
- Celebrações (bounce, spring): apenas em conquistas
- Sem animação de página-pra-página (tap only, sem swipe)
- Respeitar `prefers-reduced-motion` — desabilitar animações não-essenciais

---

## Iconografia

### Sistema de ícones

- **Biblioteca**: [Lucide React](https://lucide.dev) — stroke 2px, rounded caps, grid 24x24
- Importar tree-shakeable: `import { Trophy } from 'lucide-react'`
- Tamanho padrão nav: 18px
- Tamanho padrão inline: 16px

### Badges de estado (SVG custom)

Ícones exclusivos, codados em SVG inline, pra estados especiais do app:

| Estado | Ícone | Cor | Background |
|--------|-------|-----|------------|
| Campeão do dia | Coroa | `--accent` | `--accent-soft` |
| Win streak ativo | Chama | `--game-expresso` | `rgba(245,158,11,0.12)` |
| Tríade completa | Raio | `--secondary` | `--secondary-soft` |
| Líder do ranking | Troféu | `--accent` | `--accent-soft` + borda accent |

Esses 4 ícones são exceção ao Lucide — SVG custom pra ter identidade única.

---

## Componentes — Diretrizes

### Cards

- Background: `--bg-card`
- Borda: `1px solid var(--border)`
- Radius: `--radius-lg` (12px) ou `--radius-xl` (16px) pra cards grandes
- Sem shadow (nível base)
- Hover: `background: var(--bg-hover)` quando interativo

### Botões

| Tipo | Background | Texto | Uso |
|------|-----------|-------|-----|
| Primário | `--accent` | `#fff` | Ação principal (1 por tela) |
| Secundário | `transparent` + border | `--text-secondary` | Ações alternativas |
| Ghost | `transparent` | `--text-secondary` | Ações terciárias, nav |
| Danger | `--danger` | `#fff` | Ações destrutivas |

- Radius: `--radius-md` (8px) padrão, `--radius-lg` (10px) pra botões grandes
- Padding: `12px 16px` padrão, `14px 24px` grande
- Hover: `opacity: 0.9` (primário), `background: var(--bg-hover)` (ghost)
- Disabled: `opacity: 0.5; cursor: not-allowed`

### Inputs

- Background: `--bg-primary`
- Borda: `1px solid var(--border)`
- Radius: `--radius-md` (8px) a `--radius-lg` (10px)
- Focus: `border-color: var(--accent)`
- Padding: `12px 14px`
- Font: 14px

### Toasts

- **Estilo**: outlined — borda colorida + fundo sutil + ícone do estado
- Radius: `--radius-lg` (12px)
- Shadow: `--shadow-sm`
- Posição: top-center (desktop), top (mobile)
- Duração: 3s (sucesso), 5s (erro), persistente (ação necessária)

| Tipo | Borda | Background | Ícone |
|------|-------|------------|-------|
| Sucesso | `--success` | `rgba(success, 0.08)` | Check circle |
| Erro | `--danger` | `rgba(danger, 0.08)` | X circle |
| Info | `--secondary` | `rgba(secondary, 0.08)` | Info |
| Warning | `--game-expresso` | `rgba(amber, 0.08)` | Alert triangle |

### Estados vazios

- Ícone SVG contextual (36px, cor `--text-muted`)
- Texto explicativo: o que vai aparecer ali
- **CTA**: botão/link direcionando pra ação (ex: "Registrar scores")
- Padding vertical: 32px
- Centralizado

---

## Mobile

### Abordagem

- **Tap only** — sem gestos custom (swipe, pull-to-refresh, long-press)
- Web app, não nativo — evitar conflito com gestos do browser/OS
- Bottom nav em telas < 768px, topbar nav em desktop

### Breakpoints

```
Mobile:  < 768px   → bottom nav, padding reduzido, stack vertical
Desktop: ≥ 768px   → topbar nav, layout mais largo
```

### Safe areas

- Bottom nav respeita `env(safe-area-inset-bottom)` pra notch/home indicator
- Conteúdo principal com `padding-bottom: 80px` em mobile (clearance do bottom nav)

---

## Acessibilidade

### Nível: Básico (WCAG AA contraste)

- **Contraste texto**: mínimo 4.5:1 sobre background
- **Contraste elementos UI**: mínimo 3:1 (bordas, ícones)
- **Focus visible**: outline visível em todos elementos interativos via teclado
- **Semântica HTML**: usar tags corretas (`button`, `nav`, `main`, `h1-h6`, `label`)
- **Cores não são único indicador**: estados sempre têm ícone/texto além de cor

### Não incluído (por ora)

- ARIA landmarks complexos
- Navegação completa por teclado
- Teste com leitores de tela
- Skip links

---

## Arquivos de referência

| Arquivo | Conteúdo |
|---------|----------|
| `frontend/src/styles/global.css` | CSS custom properties (todas variáveis) |
| `frontend/public/icons/esperto-icon.svg` | Ícone do app (cérebro + coroa) |
| `design.md` | Este documento |
