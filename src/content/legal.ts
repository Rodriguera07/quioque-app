export interface LegalSection {
  title: string;
  body: string;
}

export interface LegalDoc {
  title: string;
  updatedAt: string;
  intro: string;
  sections: LegalSection[];
}

export const PRIVACY_POLICY: LegalDoc = {
  title: 'Política de Privacidade',
  updatedAt: '1 de agosto de 2026',
  intro:
    'Esta política explica quais dados o Trailer Mar Azul coleta, para que servem, por quanto tempo ficam guardados e quais direitos você tem sobre eles, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).',
  sections: [
    {
      title: '1. Dados que coletamos',
      body:
        'Dados de cadastro: nome, e-mail e senha (a senha nunca fica visível para nós — é protegida pelo Firebase Authentication). ' +
        'Dados de uso do estabelecimento: mesas abertas e fechadas, itens lançados, valores, formas de pagamento e horários de atendimento, cadastrados por você ou pela sua equipe durante o uso do app. ' +
        'Dados técnicos: registros de auditoria (login, logout, ações realizadas) e, se você permitir, o token do seu aparelho para envio de notificações.',
    },
    {
      title: '2. Finalidade do tratamento',
      body:
        'Usamos esses dados exclusivamente para operar o sistema: autenticar seu acesso, controlar mesas e vendas em tempo real, gerar relatórios financeiros do seu negócio, notificar administradores sobre eventos do estabelecimento e manter um histórico de auditoria para sua própria segurança.',
    },
    {
      title: '3. Com quem compartilhamos',
      body:
        'Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing. Os dados ficam armazenados na infraestrutura do Google Firebase (nosso operador de dados), que segue padrões internacionais de segurança da informação.',
    },
    {
      title: '4. Por quanto tempo guardamos',
      body:
        'Dados de conta (nome, e-mail) ficam armazenados enquanto sua conta estiver ativa. Registros de vendas e mesas fechadas são mantidos mesmo após a exclusão de uma conta individual, pois compõem o histórico financeiro do estabelecimento e podem ser exigidos por obrigações legais e fiscais (art. 16 da LGPD).',
    },
    {
      title: '5. Seus direitos como titular dos dados',
      body:
        'Você pode, a qualquer momento: confirmar quais dados temos sobre você; acessar e corrigir seus dados de perfil; solicitar a exclusão da sua conta e dos seus dados pessoais; revogar autorizações dadas (ex.: notificações); e pedir esclarecimentos sobre este tratamento. A exclusão da própria conta pode ser feita diretamente pelo app, em Menu → Configurações → Excluir Minha Conta.',
    },
    {
      title: '6. Segurança',
      body:
        'As conexões entre o app e nossos servidores são criptografadas (HTTPS/TLS). Senhas nunca são armazenadas em texto simples — o gerenciamento de credenciais é feito pelo Firebase Authentication.',
    },
    {
      title: '7. Contato',
      body:
        'Dúvidas sobre esta política ou sobre o tratamento dos seus dados podem ser encaminhadas ao administrador do estabelecimento que gerencia sua conta neste app.',
    },
  ],
};

export const TERMS_OF_USE: LegalDoc = {
  title: 'Termo de Uso',
  updatedAt: '1 de agosto de 2026',
  intro:
    'Ao criar uma conta ou usar o Trailer Mar Azul, você concorda com as condições descritas abaixo. Leia com atenção antes de continuar.',
  sections: [
    {
      title: '1. Sobre o serviço',
      body:
        'O Trailer Mar Azul é um sistema de gestão de comandas e vendas voltado a quiosques, bares e estabelecimentos similares, permitindo abrir mesas, lançar itens de um cardápio, controlar pagamentos e acompanhar relatórios do dia a dia do negócio.',
    },
    {
      title: '2. Cadastro e responsabilidade pela conta',
      body:
        'Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas com o seu login. Avise imediatamente o administrador do estabelecimento em caso de suspeita de uso indevido da sua conta.',
    },
    {
      title: '3. Papéis de acesso',
      body:
        'Contas do tipo "Administrador" têm acesso a relatórios financeiros, gestão de usuários e log de auditoria da equipe; contas do tipo "Equipe" têm acesso operacional (mesas, itens, pagamentos). O administrador do estabelecimento é responsável por conceder e revogar o acesso da sua equipe.',
    },
    {
      title: '4. Uso permitido',
      body:
        'O app deve ser usado apenas para fins lícitos de gestão do seu próprio negócio. É proibido tentar acessar dados de outra organização, burlar mecanismos de segurança ou usar o serviço de forma que prejudique seu funcionamento para outros usuários.',
    },
    {
      title: '5. Disponibilidade',
      body:
        'O serviço depende de conexão com a internet e de serviços de terceiros (Google Firebase). Fazemos o possível para manter o app disponível, mas não garantimos operação ininterrupta e não nos responsabilizamos por indisponibilidades causadas por esses serviços de terceiros ou pela conexão do usuário.',
    },
    {
      title: '6. Limitação de responsabilidade',
      body:
        'O app é uma ferramenta de apoio à gestão do seu estabelecimento. A conferência de valores, fechamento de caixa e obrigações fiscais do seu negócio continuam sendo de sua responsabilidade.',
    },
    {
      title: '7. Encerramento de conta',
      body:
        'Você pode excluir sua própria conta a qualquer momento em Menu → Configurações → Excluir Minha Conta. O histórico de vendas e mesas do estabelecimento é preservado mesmo após a exclusão de uma conta individual, conforme descrito na nossa Política de Privacidade.',
    },
    {
      title: '8. Alterações destes termos',
      body:
        'Este termo pode ser atualizado periodicamente para refletir mudanças no app ou na legislação aplicável. Alterações relevantes serão comunicadas dentro do próprio aplicativo.',
    },
    {
      title: '9. Lei aplicável',
      body:
        'Este termo é regido pelas leis da República Federativa do Brasil, incluindo a Lei Geral de Proteção de Dados (Lei 13.709/2018) e o Código de Defesa do Consumidor, quando aplicável.',
    },
  ],
};
