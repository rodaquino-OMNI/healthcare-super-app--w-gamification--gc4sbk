/**
 * Brazilian Portuguese (pt-BR) translations for AUSTA SuperApp
 * 
 * Contains all text strings used throughout the application organized by
 * feature areas and the three core user journeys:
 * - Minha Saúde (My Health)
 * - Cuidar-me Agora (Care Now)
 * - Meu Plano & Benefícios (My Plan & Benefits)
 */

import { TranslationSchema } from '@austa/interfaces/common';

const translation: TranslationSchema = {
  common: {
    yes: 'Sim',
    no: 'Não',
    ok: 'OK',
    cancel: 'Cancelar',
    save: 'Salvar',
    delete: 'Excluir',
    edit: 'Editar',
    back: 'Voltar',
    next: 'Próximo',
    submit: 'Enviar',
    loading: 'Carregando...',
    search: 'Buscar',
    filter: 'Filtrar',
    sort: 'Ordenar',
    view: 'Visualizar',
    close: 'Fechar',
    confirm: 'Confirmar',
    error: 'Erro',
    success: 'Sucesso',
    warning: 'Aviso',
    info: 'Informação',
    required: 'Obrigatório',
    optional: 'Opcional',
    today: 'Hoje',
    yesterday: 'Ontem',
    tomorrow: 'Amanhã',
    days: {
      monday: 'Segunda-feira',
      tuesday: 'Terça-feira',
      wednesday: 'Quarta-feira',
      thursday: 'Quinta-feira',
      friday: 'Sexta-feira',
      saturday: 'Sábado',
      sunday: 'Domingo'
    },
    months: {
      january: 'Janeiro',
      february: 'Fevereiro',
      march: 'Março',
      april: 'Abril',
      may: 'Maio',
      june: 'Junho',
      july: 'Julho',
      august: 'Agosto',
      september: 'Setembro',
      october: 'Outubro',
      november: 'Novembro',
      december: 'Dezembro'
    }
  },
  auth: {
    login: 'Entrar',
    logout: 'Sair',
    register: 'Cadastrar',
    forgotPassword: 'Esqueci minha senha',
    resetPassword: 'Redefinir senha',
    username: 'Nome de usuário',
    password: 'Senha',
    email: 'E-mail',
    confirmPassword: 'Confirmar senha',
    newPassword: 'Nova senha',
    currentPassword: 'Senha atual',
    rememberMe: 'Lembrar-me',
    signIn: 'Entrar',
    signUp: 'Cadastrar',
    createAccount: 'Criar conta',
    alreadyHaveAccount: 'Já possui uma conta?',
    dontHaveAccount: 'Não possui uma conta?',
    passwordResetSent: 'Instruções para redefinição de senha foram enviadas para seu e-mail',
    mfa: {
      title: 'Autenticação de dois fatores',
      enterCode: 'Digite o código enviado para seu dispositivo',
      resendCode: 'Reenviar código',
      verifyCode: 'Verificar código'
    },
    biometric: {
      useFingerprint: 'Usar impressão digital',
      useFaceId: 'Usar Face ID',
      setupBiometric: 'Configurar autenticação biométrica'
    }
  },
  errors: {
    required: 'Este campo é obrigatório',
    invalid_email: 'Endereço de e-mail inválido',
    invalid_password: 'Senha inválida',
    password_mismatch: 'As senhas não coincidem',
    server_error: 'Ocorreu um erro no servidor',
    connection_error: 'Erro de conexão',
    unauthorized: 'Acesso não autorizado',
    not_found: 'Não encontrado',
    validation_error: 'Erro de validação',
    session_expired: 'Sua sessão expirou, faça login novamente',
    unknown_error: 'Ocorreu um erro desconhecido'
  },
  navigation: {
    home: 'Início',
    profile: 'Perfil',
    settings: 'Configurações',
    notifications: 'Notificações',
    achievements: 'Conquistas',
    logout: 'Sair'
  },
  journeys: {
    health: {
      title: 'Minha Saúde',
      dashboard: 'Painel de Saúde',
      metrics: {
        title: 'Métricas de Saúde',
        heartRate: 'Frequência Cardíaca',
        bloodPressure: 'Pressão Arterial',
        bloodGlucose: 'Glicemia',
        steps: 'Passos',
        sleep: 'Sono',
        weight: 'Peso',
        bmi: 'IMC',
        addMetric: 'Adicionar Métrica',
        viewDetails: 'Ver Detalhes',
        units: {
          bpm: 'bpm',
          mmHg: 'mmHg',
          mgdl: 'mg/dL',
          steps: 'passos',
          hours: 'horas',
          kg: 'kg',
          lbs: 'lbs'
        },
        status: {
          normal: 'Normal',
          elevated: 'Elevado',
          high: 'Alto',
          low: 'Baixo',
          critical: 'Crítico'
        }
      },
      goals: {
        title: 'Metas de Saúde',
        dailySteps: 'Passos Diários',
        weeklyExercise: 'Exercícios Semanais',
        sleepHours: 'Horas de Sono',
        weightTarget: 'Meta de Peso',
        addGoal: 'Adicionar Meta',
        editGoal: 'Editar Meta',
        progress: 'Progresso',
        completed: 'Concluída',
        inProgress: 'Em Andamento',
        notStarted: 'Não Iniciada'
      },
      history: {
        title: 'Histórico Médico',
        timeline: 'Linha do Tempo',
        events: 'Eventos Médicos',
        conditions: 'Condições',
        medications: 'Medicamentos',
        procedures: 'Procedimentos',
        vaccinations: 'Vacinas',
        allergies: 'Alergias',
        viewAll: 'Ver Todos'
      },
      devices: {
        title: 'Dispositivos Conectados',
        connect: 'Conectar Dispositivo',
        disconnect: 'Desconectar',
        sync: 'Sincronizar Agora',
        lastSync: 'Última Sincronização',
        connected: 'Conectado',
        disconnected: 'Desconectado',
        syncing: 'Sincronizando...',
        syncComplete: 'Sincronização Concluída',
        syncFailed: 'Falha na Sincronização'
      },
      components: {
        metricCard: {
          lastUpdated: 'Última atualização',
          trend: 'Tendência',
          increasing: 'Aumentando',
          decreasing: 'Diminuindo',
          stable: 'Estável'
        },
        goalCard: {
          target: 'Meta',
          current: 'Atual',
          remaining: 'Restante',
          dueDate: 'Data limite'
        },
        deviceCard: {
          battery: 'Bateria',
          lastSync: 'Última sincronização',
          syncNow: 'Sincronizar agora'
        },
        healthChart: {
          timeRanges: {
            day: 'Dia',
            week: 'Semana',
            month: 'Mês',
            year: 'Ano'
          },
          noData: 'Sem dados para exibir'
        }
      }
    },
    care: {
      title: 'Cuidar-me Agora',
      dashboard: 'Painel de Cuidados',
      appointments: {
        title: 'Consultas',
        upcoming: 'Próximas Consultas',
        past: 'Consultas Anteriores',
        book: 'Agendar Consulta',
        reschedule: 'Reagendar',
        cancel: 'Cancelar Consulta',
        details: 'Detalhes da Consulta',
        with: 'com',
        at: 'às',
        on: 'em',
        status: {
          scheduled: 'Agendada',
          confirmed: 'Confirmada',
          completed: 'Concluída',
          cancelled: 'Cancelada',
          noShow: 'Não Compareceu'
        },
        type: {
          inPerson: 'Presencial',
          telemedicine: 'Telemedicina',
          homeVisit: 'Visita Domiciliar'
        }
      },
      providers: {
        title: 'Profissionais de Saúde',
        search: 'Buscar Profissionais',
        specialty: 'Especialidade',
        location: 'Localização',
        availability: 'Disponibilidade',
        ratings: 'Avaliações',
        distance: 'Distância',
        viewProfile: 'Ver Perfil',
        bookAppointment: 'Agendar Consulta'
      },
      telemedicine: {
        title: 'Telemedicina',
        startSession: 'Iniciar Sessão',
        joinSession: 'Entrar na Sessão',
        endSession: 'Encerrar Sessão',
        connecting: 'Conectando...',
        connected: 'Conectado',
        disconnected: 'Desconectado',
        reconnecting: 'Reconectando...',
        waitingForProvider: 'Aguardando o profissional entrar na sessão...',
        providerJoined: 'O profissional entrou na sessão',
        connectionIssues: 'Problemas de conexão detectados',
        enableCamera: 'Ativar Câmera',
        disableCamera: 'Desativar Câmera',
        enableMic: 'Ativar Microfone',
        disableMic: 'Desativar Microfone',
        chat: 'Chat',
        shareScreen: 'Compartilhar Tela'
      },
      symptomChecker: {
        title: 'Verificador de Sintomas',
        selectSymptoms: 'Selecione os Sintomas',
        howLong: 'Há quanto tempo você tem esses sintomas?',
        severity: 'Qual a gravidade dos seus sintomas?',
        results: 'Resultados',
        possibleConditions: 'Condições Possíveis',
        recommendedActions: 'Ações Recomendadas',
        disclaimer: 'Isto não é um diagnóstico médico. Por favor, consulte um profissional de saúde.',
        emergency: 'Se for uma emergência, ligue imediatamente para os serviços de emergência.'
      },
      medications: {
        title: 'Medicamentos',
        current: 'Medicamentos Atuais',
        past: 'Medicamentos Anteriores',
        addMedication: 'Adicionar Medicamento',
        editMedication: 'Editar Medicamento',
        removeMedication: 'Remover Medicamento',
        dosage: 'Dosagem',
        frequency: 'Frequência',
        startDate: 'Data de Início',
        endDate: 'Data de Término',
        instructions: 'Instruções',
        refill: 'Reabastecer',
        refillReminder: 'Lembrete de Reabastecimento',
        setReminder: 'Definir Lembrete',
        takeMedication: 'Tomar Medicamento',
        medicationTaken: 'Medicamento Tomado',
        missedDose: 'Dose Perdida'
      },
      treatmentPlans: {
        title: 'Planos de Tratamento',
        active: 'Planos Ativos',
        completed: 'Planos Concluídos',
        viewPlan: 'Ver Plano',
        tasks: 'Tarefas',
        progress: 'Progresso',
        startDate: 'Data de Início',
        endDate: 'Data de Término',
        provider: 'Profissional',
        notes: 'Observações',
        completeTask: 'Concluir Tarefa',
        taskCompleted: 'Tarefa Concluída'
      },
      components: {
        appointmentCard: {
          time: 'Horário',
          provider: 'Profissional',
          location: 'Local',
          type: 'Tipo',
          actions: 'Ações'
        },
        providerCard: {
          specialty: 'Especialidade',
          rating: 'Avaliação',
          distance: 'Distância',
          availability: 'Próxima disponibilidade'
        },
        medicationCard: {
          dosage: 'Dosagem',
          frequency: 'Frequência',
          remaining: 'Restante',
          nextDose: 'Próxima dose'
        }
      }
    },
    plan: {
      title: 'Meu Plano & Benefícios',
      dashboard: 'Painel do Plano',
      coverage: {
        title: 'Informações de Cobertura',
        planDetails: 'Detalhes do Plano',
        planNumber: 'Número do Plano',
        memberSince: 'Membro Desde',
        renewalDate: 'Data de Renovação',
        coverageType: 'Tipo de Cobertura',
        network: 'Rede',
        deductible: 'Franquia',
        outOfPocketMax: 'Limite de Desembolso',
        copay: 'Copagamento',
        coinsurance: 'Cosseguro',
        covered: 'Coberto',
        notCovered: 'Não Coberto',
        inNetwork: 'Na Rede',
        outOfNetwork: 'Fora da Rede'
      },
      digitalCard: {
        title: 'Cartão Digital do Plano',
        front: 'Frente',
        back: 'Verso',
        memberName: 'Nome do Membro',
        memberId: 'ID do Membro',
        groupNumber: 'Número do Grupo',
        planType: 'Tipo de Plano',
        issueDate: 'Data de Emissão',
        customerService: 'Atendimento ao Cliente',
        share: 'Compartilhar Cartão',
        download: 'Baixar Cartão'
      },
      claims: {
        title: 'Solicitações',
        submit: 'Enviar Solicitação',
        history: 'Histórico de Solicitações',
        details: 'Detalhes da Solicitação',
        claimNumber: 'Número da Solicitação',
        serviceDate: 'Data do Serviço',
        provider: 'Prestador',
        serviceType: 'Tipo de Serviço',
        amount: 'Valor',
        status: {
          submitted: 'Enviada',
          inReview: 'Em Análise',
          approved: 'Aprovada',
          denied: 'Negada',
          moreinfoNeeded: 'Mais Informações Necessárias',
          paid: 'Paga',
          appealed: 'Recurso Enviado'
        },
        documents: 'Documentos',
        uploadDocuments: 'Enviar Documentos',
        additionalInfo: 'Informações Adicionais',
        processingTime: 'Tempo Estimado de Processamento',
        reimbursement: 'Reembolso Estimado'
      },
      costSimulator: {
        title: 'Simulador de Custos',
        selectProcedure: 'Selecionar Procedimento',
        selectProvider: 'Selecionar Prestador',
        estimatedCost: 'Custo Estimado',
        outOfPocket: 'Seu Desembolso Estimado',
        coveredAmount: 'Valor Coberto',
        disclaimer: 'Esta é apenas uma estimativa. Os custos reais podem variar.',
        calculate: 'Calcular',
        results: 'Resultados',
        breakdown: 'Detalhamento de Custos'
      },
      benefits: {
        title: 'Benefícios',
        available: 'Benefícios Disponíveis',
        used: 'Benefícios Utilizados',
        details: 'Detalhes do Benefício',
        eligibility: 'Elegibilidade',
        limitations: 'Limitações',
        howToUse: 'Como Utilizar',
        expirationDate: 'Data de Expiração',
        eligible: 'Elegível',
        notEligible: 'Não Elegível'
      },
      components: {
        coverageInfoCard: {
          planType: 'Tipo de plano',
          effectiveDate: 'Data de vigência',
          status: 'Status',
          network: 'Rede'
        },
        claimCard: {
          claimNumber: 'Número',
          serviceDate: 'Data do serviço',
          provider: 'Prestador',
          amount: 'Valor',
          status: 'Status'
        },
        benefitCard: {
          type: 'Tipo',
          coverage: 'Cobertura',
          used: 'Utilizado',
          remaining: 'Restante',
          expires: 'Expira em'
        }
      }
    }
  },
  gamification: {
    level: 'Nível {{level}}',
    xp: '{{value}} XP',
    nextLevel: 'Próximo Nível: {{xp}} XP necessários',
    achievements: {
      title: 'Conquistas',
      unlocked: 'Conquista Desbloqueada!',
      progress: 'Progresso: {{value}}/{{total}}',
      reward: 'Recompensa: {{reward}}',
      recent: 'Conquistas Recentes',
      all: 'Todas as Conquistas',
      locked: 'Conquistas Bloqueadas',
      completed: 'Conquistas Concluídas',
      categories: {
        health: 'Saúde',
        care: 'Cuidados',
        plan: 'Plano',
        general: 'Geral'
      },
      types: {
        streak: 'Sequência',
        milestone: 'Marco',
        collection: 'Coleção',
        challenge: 'Desafio',
        special: 'Especial'
      }
    },
    quests: {
      title: 'Missões',
      active: 'Missões Ativas',
      completed: 'Missões Concluídas',
      new: 'Nova Missão Disponível!',
      progress: 'Progresso: {{value}}/{{total}}',
      reward: 'Recompensa: {{reward}}',
      timeRemaining: 'Tempo Restante: {{time}}',
      startQuest: 'Iniciar Missão',
      completeQuest: 'Concluir Missão',
      difficulty: {
        easy: 'Fácil',
        medium: 'Médio',
        hard: 'Difícil'
      },
      journeySpecific: {
        health: 'Missão de Saúde',
        care: 'Missão de Cuidados',
        plan: 'Missão de Plano'
      }
    },
    rewards: {
      title: 'Recompensas',
      available: 'Recompensas Disponíveis',
      redeemed: 'Recompensas Resgatadas',
      redeem: 'Resgatar',
      pointsNeeded: '{{points}} pontos necessários',
      expiresOn: 'Expira em {{date}}',
      redeemSuccess: 'Recompensa resgatada com sucesso!',
      categories: {
        discount: 'Desconto',
        service: 'Serviço',
        product: 'Produto',
        digital: 'Digital'
      },
      tiers: {
        bronze: 'Bronze',
        silver: 'Prata',
        gold: 'Ouro',
        platinum: 'Platina'
      }
    },
    leaderboard: {
      title: 'Classificação',
      weekly: 'Semanal',
      monthly: 'Mensal',
      allTime: 'Todos os Tempos',
      rank: 'Posição',
      user: 'Usuário',
      score: 'Pontuação',
      yourRank: 'Sua Posição',
      categories: {
        overall: 'Geral',
        health: 'Saúde',
        care: 'Cuidados',
        plan: 'Plano'
      }
    },
    components: {
      achievementBadge: {
        locked: 'Bloqueado',
        unlocked: 'Desbloqueado',
        progress: 'Progresso'
      },
      levelIndicator: {
        currentLevel: 'Nível atual',
        nextLevel: 'Próximo nível',
        xpNeeded: 'XP necessário'
      },
      questCard: {
        expires: 'Expira em',
        difficulty: 'Dificuldade',
        reward: 'Recompensa'
      },
      rewardCard: {
        cost: 'Custo',
        category: 'Categoria',
        expires: 'Validade'
      },
      xpCounter: {
        total: 'XP Total',
        level: 'Nível',
        nextLevel: 'Próximo nível em'
      }
    },
    events: {
      healthMetricRecorded: 'Métrica de saúde registrada',
      healthGoalAchieved: 'Meta de saúde alcançada',
      appointmentCompleted: 'Consulta concluída',
      medicationTaken: 'Medicamento tomado',
      claimSubmitted: 'Solicitação enviada',
      deviceConnected: 'Dispositivo conectado',
      profileCompleted: 'Perfil completado',
      dailyLogin: 'Login diário',
      weeklyStreak: 'Sequência semanal',
      referralComplete: 'Indicação completa'
    }
  },
  profile: {
    title: 'Perfil',
    personalInfo: 'Informações Pessoais',
    name: 'Nome',
    email: 'E-mail',
    phone: 'Telefone',
    dateOfBirth: 'Data de Nascimento',
    gender: 'Gênero',
    address: 'Endereço',
    emergencyContact: 'Contato de Emergência',
    editProfile: 'Editar Perfil',
    changePassword: 'Alterar Senha',
    language: 'Idioma',
    theme: 'Tema',
    notifications: 'Notificações',
    privacy: 'Privacidade',
    deleteAccount: 'Excluir Conta',
    logoutAllDevices: 'Sair de todos os dispositivos'
  },
  notifications: {
    title: 'Notificações',
    all: 'Todas',
    unread: 'Não Lidas',
    markAsRead: 'Marcar como Lida',
    markAllAsRead: 'Marcar Todas como Lidas',
    delete: 'Excluir',
    deleteAll: 'Excluir Todas',
    noNotifications: 'Sem notificações',
    types: {
      achievement: 'Conquista',
      appointment: 'Consulta',
      medication: 'Medicamento',
      claim: 'Solicitação',
      system: 'Sistema'
    },
    journeySpecific: {
      health: {
        metricReminder: 'Lembrete de métrica',
        goalProgress: 'Progresso de meta',
        deviceSync: 'Sincronização de dispositivo'
      },
      care: {
        appointmentReminder: 'Lembrete de consulta',
        medicationReminder: 'Lembrete de medicamento',
        treatmentTask: 'Tarefa de tratamento'
      },
      plan: {
        claimUpdate: 'Atualização de solicitação',
        benefitExpiration: 'Expiração de benefício',
        coverageChange: 'Alteração de cobertura'
      }
    }
  },
  settings: {
    title: 'Configurações',
    account: 'Conta',
    appearance: 'Aparência',
    notifications: 'Notificações',
    privacy: 'Privacidade',
    language: 'Idioma',
    theme: {
      title: 'Tema',
      light: 'Claro',
      dark: 'Escuro',
      system: 'Padrão do Sistema'
    },
    notificationPreferences: {
      title: 'Preferências de Notificação',
      push: 'Notificações Push',
      email: 'Notificações por E-mail',
      sms: 'Notificações por SMS',
      inApp: 'Notificações no Aplicativo',
      journeySettings: {
        title: 'Configurações por Jornada',
        health: 'Notificações de Saúde',
        care: 'Notificações de Cuidados',
        plan: 'Notificações de Plano'
      }
    },
    privacySettings: {
      title: 'Configurações de Privacidade',
      dataSharing: 'Compartilhamento de Dados',
      analytics: 'Análises',
      marketing: 'Comunicações de Marketing',
      locationServices: 'Serviços de Localização'
    },
    accessibility: {
      title: 'Acessibilidade',
      fontSize: 'Tamanho da Fonte',
      contrast: 'Contraste',
      reduceMotion: 'Reduzir Movimento',
      screenReader: 'Suporte a Leitor de Tela'
    },
    about: {
      title: 'Sobre',
      version: 'Versão',
      termsOfService: 'Termos de Serviço',
      privacyPolicy: 'Política de Privacidade',
      licenses: 'Licenças',
      contact: 'Fale Conosco'
    }
  }
};

export default {
  translation
};