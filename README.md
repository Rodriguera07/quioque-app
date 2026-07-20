# Quiosque PDV

Aplicativo de Ponto de Venda (PDV) para quiosque, otimizado para celular, com dashboard estilo fintech (dark, grafite + azul neon + verde esmeralda). Construído com React Native + Expo (Managed Workflow) e TypeScript.

O cardápio é estático/mockado por enquanto (`src/data/menu.ts`) — pensado para futuramente virar editável.

## Stack

- **React Native + Expo** (SDK 57, managed workflow)
- **TypeScript**
- **Zustand** para estado global, com persistência local via `@react-native-async-storage/async-storage`
- **React Navigation** (native-stack)
- **StyleSheet** puro com um design system próprio em `src/theme`
- **@expo/vector-icons** (Ionicons)

## Pré-requisitos

- [Node.js](https://nodejs.org/) 18 ou superior
- npm (já vem com o Node)
- App **[Expo Go](https://expo.dev/go)** instalado no celular (Android ou iOS), para testar no dispositivo físico
- Opcional: Android Studio (emulador Android) ou Xcode (simulador iOS, apenas macOS)

## Instalação

```bash
git clone https://github.com/Rodriguera07/quioque-app.git
cd quioque-app
npm install
```

## Como rodar

```bash
npm start
```

Isso abre o Metro Bundler com um QR code no terminal. Escaneie o QR code com o app **Expo Go** (Android: dentro do próprio app; iOS: pela câmera) para abrir o aplicativo no celular.

Outras opções:

```bash
npm run android   # abre em um emulador Android (requer Android Studio configurado)
npm run ios       # abre em um simulador iOS (requer macOS + Xcode)
npm run web       # abre no navegador (útil para testes rápidos de UI)
```

## Login

O login é mockado (sem backend). Use:

- **Usuário:** `admin`
- **Senha:** `admin123`

## Funcionalidades

- **Login** do gerente/administrador
- **Dashboard**: faturamento do dia, mesas abertas/fechadas, itens mais vendidos em tempo real, grid de mesas ativas
- **Mesas**: abertura com número/nome + garçom, consumação com cardápio mockado (bebidas, porções, pratos, sobremesas), taxa de serviço de 10% opcional
- **Fechamento de mesa**: resumo (subtotal, taxa, total) e pagamento via PIX, Dinheiro, Débito ou Crédito
- **Relatórios**: filtro por período (semanal, quinzenal, mensal ou datas personalizadas), faturamento e itens mais vendidos do período
- **Encerrar Dia**: fecha o caixa do dia, mostra resumo final por forma de pagamento e reinicia a dashboard

## Estrutura do projeto

```
src/
  components/   Componentes de UI reutilizáveis (Button, Card, TableCard, ...)
  context/      Stores Zustand: useAuthStore (login) e usePosStore (mesas, vendas, relatórios)
  data/         Cardápio mockado
  navigation/   Configuração do React Navigation
  screens/      Telas do app (Login, Dashboard, Mesa, Relatórios, ...)
  theme/        Paleta de cores, tipografia e espaçamentos
  types/        Tipos TypeScript compartilhados
  utils/        Formatação, agregação de relatórios, helpers de alerta multiplataforma
```

## Observações

- Os dados (mesas, vendas do dia, histórico) ficam salvos localmente no dispositivo via AsyncStorage — não há backend/servidor.
- No modo web, os diálogos de confirmação usam `window.confirm`/`window.alert` no lugar do `Alert` nativo do React Native (que não tem efeito em `react-native-web`).
