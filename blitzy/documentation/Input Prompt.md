# **AUSTA SuperApp**

## **1. Overview and Strategic Guidelines**

The AUSTA SuperApp will be a unified digital health platform that prioritizes the user experience through a **journey-centered approach with gamification at its core**. This revised specification streamlines the user experience into **three intuitive journeys** with a lean architecture that maintains high performance and scalability while significantly reducing implementation and maintenance complexity.

### **1.1 Design Principles**

- **Journey-focused**: Organization based on three natural user flows, not features or organizational structures

- **Gamification-first**: Engagement mechanics built into the platform core to drive adherence and outcomes

- **Technical simplicity**: Reduced technology stack to facilitate development and maintenance

- **Visual consistency**: Unified design system across all interfaces with distinct journey color coding

- **Performance priority**: Optimization for fast response times and fluid experience

- **Integrated accessibility**: WCAG 2.1 Level AA compliance from the start

### **1.2 Benchmark References**

The design and architecture were inspired by best practices from UX-leading companies and adapted for healthcare:

- **Nubank**: Simplicity of journeys and visual clarity

- **Airbnb**: Cohesive component system and seamless user experience

- **Spotify**: Personalization based on behavior and data usage

- **Apple**: Minimalism and consistency of interactions

- **Calm**: Approach to stress-free digital health experiences

- **Duolingo/Strava**: Engagement mechanics that drive consistent usage

## **2. Simplified Technology Stack**

### **2.1 Frontend**

TechnologyPurposeJustificationReact NativeCross-platform mobile developmentSingle codebase for iOS and Android, reducing duplication and required team sizeNext.jsReact framework for webSSR, SEO optimization, and code sharing with mobileTypeScriptProgramming languageType safety and better maintainabilityStyled ComponentsStylingConsistent CSS-in-JS across platforms, simplified theming by journeyReact QueryState/data managementSimplicity in caching, refetching, and synchronizationReanimatedAnimationsHigh-performance animations for gamification effects and transitionsVictory NativeData visualizationCross-platform charts and progress indicators for health metrics

### **2.2 Backend**

TechnologyPurposeJustificationNode.jsServer runtimeSame ecosystem as frontend (JavaScript)NestJSFrameworkModular architecture, TypeScript support, scalable structureGraphQLAPI layerFlexible queries, reduction of overfetching, strong typingApollo ServerGraphQL serverSeamless integration with React Query on the frontendPrismaORMStrongly typed and secure database interfaceSocket.ioReal-time communicationReal-time notifications and gamification eventsKafkaEvent streamingHigh-throughput event processing for gamification engine

### **2.3 Database**

TechnologyPurposeJustificationPostgreSQLMain databaseJSONB support for semi-structured data + robust SQLRedisCache and sessionsHigh performance for temporary data, leaderboards and achievement trackingTimescaleDBPostgreSQL extensionEfficient for time-series data (health metrics)

### **2.4 DevOps & Infrastructure**

TechnologyPurposeJustificationDockerContainerizationConsistent environment in development and productionAWSCloud providerManaged services that reduce operations needsGitHub ActionsCI/CDDirect integration with code repositoryTerraformIaCDeclarative and versioned infrastructureDatadogMonitoringUnified observability (logs, metrics, traces) with journey-specific dashboards

## **3. System Architecture**

### **3.1 Architecture Overview**

```markdown
┌─────────────────────────────────────────────────────────────┐
│                     Clients                                 │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│   │ iOS/Android  │  │ Progressive  │  │ Admin        │     │
│   │ App          │  │ Web App      │  │ Portal       │     │
│   └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────┬─────────────┬─────────────┘
                            │                 │
┌─────────────────────────────────┼─────────────┼─────────────┐
│                    API Gateway & CDN                        │
└─────────────────────────────────┬─────────────┬─────────────┘
                            │                 │
┌─────────────────────────────────┼─────────────┼─────────────┐
│                    Backend Services                         │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ Users    │  │ My Health │  │ Care Now │  │ My Plan  │    │
│  │ & Auth   │  │ Service   │  │ Service  │  │ Service  │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                             │
│             ┌──────────────┐    ┌────────────────┐         │
│             │ Gamification │    │ Notification   │         │
│             │ Engine       │    │ Service        │         │
│             └──────────────┘    └────────────────┘         │
│                                                             │
└─────────────────────────────────┬─────────────┬─────────────┘
                            │                 │
┌─────────────────────────────────┼─────────────┼─────────────┐
│                    Data Layer                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │PostgreSQL│  │TimescaleDB│ │ Redis    │  │S3 Storage│    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
└─────────────────────────────────────────────────────────────┘
```markdown

### **3.2 Main Components**

1. **Unified GraphQL API**: Single endpoint with operations organized by journey domain

2. **Centralized authentication**: OAuth/OIDC server with multiple method support

3. **Modular microservices**: Three core journey services with clear domain boundaries

4. **Gamification Engine**: Central service processing all engagement events and rewarding user actions

5. **Real-time communication**: Event and notification system via WebSockets for immediate feedback

6. **Shared Design System**: Common component library with journey-specific theming

### **3.3 Gamification Engine**

ComponentDescriptionEvent ProcessorProcesses user actions from all journeys and assigns points/achievementsRules EngineConfigurable conditions for unlocking achievements and levelingReward ManagerHandles distribution of digital and physical rewardsLeaderboard ServiceOptional social competition features with privacy controlsProgress TrackingVisualizes health journey progress through gamified indicatorsAnalytics IntegrationMeasures engagement impact on health outcomes

### **3.4 External Integrations**

SystemIntegration MethodPurposeEHR/Medical RecordsHL7 FHIR APIAccess to medical recordsPayment ProcessorsREST APIPayments and reimbursementsInsurance SystemsREST/SOAP APICoverage verification and claims processingPharmacy NetworksREST APIe-Prescriptions and medication deliveryWearable DevicesNative device APIs/BLEHealth monitoring with achievement triggersReward PartnersREST APIIntegration with partner benefits system

## **4. User-Centered UI/UX Approach**

### **4.1 Journey-Based Organization**

The app is structured around 3 main user journeys with distinctive visual identities:

1. **"Minha Saúde" (My Health)** - (#0ACF83)

   - 360° dashboard of health metrics and trends

   - Medical history timeline with contextual information

   - Preventive health insights and recommendations

   - Wearable device integration and metric tracking

   - Health goal progress with gamification indicators

2. **"Cuidar-me Agora" (Care Now)** - (#FF8C42)

   - Symptom checker and self-triage

   - Immediate appointment booking or telemedicine

   - Emergency access and alerts

   - Medication tracking and adherence tools

   - Treatment plan execution and progress tracking

3. **"Meu Plano & Benefícios" (My Plan & Benefits)** - (#3A86FF)

   - Coverage and co-payment information

   - Digital insurance card

   - Claims submission and tracking

   - Cost simulator for procedures

   - Benefits showcase including gamification rewards

### **4.2 Interface Design Principles**

1. **Meaningful micro-interactions**: Visual and tactile feedback on user actions with gamification elements

2. **Clear visual hierarchy**: Critical information highlighted, details accessible on demand

3. **Contextual navigation**: Actions related to the current task always visible

4. **Journey color-coding**: Consistent color scheme for each journey to reinforce mental model

5. **Minimalist design**: No unnecessary elements, focus on user needs

6. **Gamification integration**: Progress indicators, achievements, and rewards naturally woven into UI

7. **Accessible design**: Adequate contrast, adjustable sizes, screen reader support

### **4.3 Key Interface Components**

#### **Universal Home**

The home screen consolidates the three journeys with gamification elements prominently featured:

```markdown
┌───────────────────────────────────────────────────┐
│ AUSTA                                     [👤]  │
├───────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐ │
│ │ Level 12 - Health Champion          ⭐ 1,245 │ │
│ │ [================= 65% =============]       │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│  Como você está hoje, Maria?                    │
│                                                 │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│  │ Cuidar-me   │ │ Consulta    │ │ Meu Plano   ││
│  │ Agora       │ │ agendada    │ │ & Benefícios││
│  └─────────────┘ └─────────────┘ └─────────────┘│
│                                                 │
│  Minha Saúde                                    │
│  ┌─────────────────────────────────────────────┐│
│  │                                             ││
│  │  ❤️ 72 bpm    🩸 120/80    👟 6.540 passos  ││
│  │                                             ││
│  │  [🏆 Novo recorde de passos diários!]       ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Cuidados em andamento                          │
│  ┌─────────────────────────────────────────────┐│
│  │ 🏃‍♀️ Programa de atividade física           ││
│  │     Dia 12 de 30 - [====40%====]            ││
│  │                                             ││
│  │ 💊 Medicação: +15 XP na próxima dose (2h)   ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Próximos eventos                               │
│  ┌─────────────────────────────────────────────┐│
│  │ 📅 Consulta com Dr. Silva - Amanhã, 14:00   ││
│  │ 📋 Resultado do exame - Disponível hoje     ││
│  └─────────────────────────────────────────────┘│
│                                                 │
└───────────────────────────────────────────────────┘
```markdown

#### **Health Assistant with Gamification**

An AI-based assistant with gamification elements to drive engagement:

```markdown
┌───────────────────────────────────────────────────┐
│ AUSTA - Assistente                         [❌]  │
├───────────────────────────────────────────────────┤
│                                                 │
│  Olá Maria, como posso ajudar?                  │
│                                   [Nível 12 ⭐]  │
│  ┌─────────────────────────────────────────┐      │
│  │ Estou com dor de cabeça e tontura     │      │
│  │ desde ontem à noite                   │      │
│  └─────────────────────────────────────────┘      │
│                                                 │
│  Entendi. Vou fazer algumas perguntas para      │
│  entender melhor seus sintomas.                 │
│                                                 │
│  A dor é:                                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Leve     │ │ Moderada │ │ Intensa  │        │
│  └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│  Você está sentindo outros sintomas como        │
│  náusea, sensibilidade à luz ou febre?          │
│                                                 │
│  ┌──────────┐ ┌──────────┐                     │
│  │ Sim      │ │ Não      │                     │
│  └──────────┘ └──────────┘                     │
│                                                 │
│  [+5 XP por fornecer informações completas]     │
│                                                 │
│  [Você pode optar por consulta médica a         │
│   qualquer momento]                             │
│                                                 │
└───────────────────────────────────────────────────┘
```markdown

#### **Simplified Claims Flow with Progress Indicators**

Redesigned claim journey with gamification elements to reduce anxiety:

```markdown
┌───────────────────────────────────────────────────┐
│ Nova solicitação                          [❌]   │
├───────────────────────────────────────────────────┤
│                                                 │
│  1 ──── 2 ──── 3 [Etapa atual]                 │
│  Detalhes   Documentos   Revisão               │
│                                    [+20 XP]     │
│  Que tipo de procedimento você realizou?        │
│  ┌─────────────────────────────────────────────┐│
│  │ Consulta médica                     [✓]     ││
│  │ Exame                                       ││
│  │ Terapia                                     ││
│  │ Cirurgia                                    ││
│  │ Outro                                       ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Data do atendimento                            │
│  ┌─────────────────────────────────────────────┐│
│  │  12/04/2025                                 ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Nome do profissional                           │
│  ┌─────────────────────────────────────────────┐│
│  │  Dr. Paulo Santos                           ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  Valor pago                                     │
│  ┌─────────────────────────────────────────────┐│
│  │  R$ 350,00                                  ││
│  └─────────────────────────────────────────────┘│
│                                                 │
│  [Reembolso estimado: 1-3 dias úteis]           │
│  [Desafio: Complete 3 reembolsos em abril]      │
│                                                 │
│  [Voltar]                   [Próximo]           │
│                                                 │
└───────────────────────────────────────────────────┘
```markdown

### **4.4 Design System**

A unified design system maintained in Storybook with:

1. **Journey-specific tokens**:

   - Color palettes for each journey (My Health: green, Care Now: orange, My Plan: blue)

   - Typography, spacing, shadows, animations

   - CSS variables/tokens for consistent theming across platforms

2. **Gamification components**:

   - Progress rings, XP indicators, achievement badges

   - Reward animations and celebration effects

   - Level indicators and leaderboard elements

3. **Atomic components**:

   - Buttons, fields, selectors, cards, indicators

   - Standardized animations and transitions

4. **Compound patterns**:

   - Dialogs, forms, lists, tables, charts

   - Navigation and layout patterns

5. **Journey templates**:

   - Structures for each journey with consistent layouts

   - Loading and error states

   - Gamification integration points

6. **Voice and tone guides**:

   - Journey-specific communication principles

   - Gamification celebration language

   - Standardized error and confirmation messages

## **5. Data Architecture**

### **5.1 Simplified Data Model**

```markdown
┌────────────┐       ┌────────────┐       ┌────────────┐
│ User       │       │ Health     │       │ Plan       │
├────────────┤       │ Record     │       ├────────────┤
│ id         │       ├────────────┤       │ id         │
│ name       │─┐  │ id         │    ┌──│ userId     │
│ email      │ └─*│ userId     │    │  │ coverage   │
│ phone      │       │ metrics    │    │  │ validity   │
│ cpf        │       │ history    │    │  │ benefits   │
└────────────┘       └────────────┘    │  └────────────┘
        │                              │          │
        │                              │          │
┌────────────┐       ┌────────────┐    │   ┌────────────┐
│ Care       │       │ Claim      │    │   │ Game       │
│ Activity   │       ├────────────┤    │   │ Profile    │
├────────────┤       │ id         │    │   ├────────────┤
│ id         │       │ userId     │    │   │ userId     │
│ userId     │       │ planId     │────┘   │ level      │
│ type       │       │ type       │        │ xp         │
│ status     │       │ amount     │        │ badges     │
└────────────┘       └────────────┘        └────────────┘
                                                  │
                                                  │
                                           ┌────────────┐
                                           │ Quest      │
                                           ├────────────┤
                                           │ id         │
                                           │ profileId  │
                                           │ type       │
                                           │ progress   │
                                           │ reward     │
                                           └────────────┘
```markdown

### **5.2 Persistence Strategy**

1. **Journey-specific data**: PostgreSQL schemas organized by journey domain

2. **Gamification data**: Dedicated tables for player profiles, achievements, quests and rewards

3. **Temporal health data**: TimescaleDB for metrics and timestamped events

4. **Real-time gamification state**: Redis for leaderboards, streaks and active quests

5. **Media and documents**: Amazon S3 organized by journey paths

### **5.3 Synchronization Approach**

1. **Offline-first**: App functional even without permanent connection with local progression tracking

2. **Incremental synchronization**: Transfer only changes since last sync

3. **Conflict resolution**: Clear strategies for simultaneous edits with priority to health-critical data

4. **Local storage**: Secure cache on the device with encryption

5. **Background sync**: Real-time gamification updates when reconnected

## **6. Implementation and Development**

### **6.1 Development Methodology**

1. **Agile approach**: 2-week sprints with regular demos organized by journey

2. **Design Sprint**: For each major journey component

3. **Continuous Integration/Deployment**: Automatic deployment after tests

4. **Feature Flags**: Gradual release of features by journey

5. **A/B testing**: For gamification mechanics optimization

### **6.2 Journey Transition Plan**

1. **Phase 1**: Create journey scaffolds and core UI components

   - Create `/health`, `/care`, `/plan` route structures

   - Implement design tokens and theming

   - Deploy gamification engine foundation

2. **Phase 2**: Migrate and refactor features

   - Transition features to new journey structure

   - Set up analytics with journey tracking

   - Deploy redirects from old navigation structure

3. **Phase 3**: Gamification rollout

   - Implement core gamification mechanics

   - A/B test engagement patterns

   - Gather feedback and optimize reward structures

4. **Phase 4**: Complete transition

   - Remove legacy journeys

   - Finalize analytics transition

   - Full production deployment

### **6.3 Recommended Code Structure**

```markdown
/
├── apps/
│   ├── mobile/         # React Native app

│   ├── web/            # Next.js app

│   └── admin/          # Admin panel with gamification dashboard

├── packages/
│   ├── ui/             # Shared component library with journey themes

│   ├── api/            # GraphQL API layer

│   ├── schema/         # Shared schema (GraphQL, validation)

│   ├── gamification/   # Gamification components and hooks

│   ├── hooks/          # Reusable React hooks

│   └── utils/          # Shared utilities

├── services/
│   ├── auth/           # Authentication service

│   ├── health/         # My Health service

│   ├── care/           # Care Now service

│   ├── plan/           # My Plan service

│   ├── gamification/   # Gamification engine

│   └── notification/   # Notification service

└── scripts/           # Automation and deployment scripts

```markdown

### **6.4 Testing Strategy**

LevelToolsTarget CoverageUnitJest, React Testing Library80%IntegrationCypress, SupertestCritical flows by journeyE2EDetox (mobile), Cypress (web)Main journeys with gamification interactionsVisualStorybook, ChromaticAll UI components with journey themesAccessibilityAxe, Pa11y100% WCAG AAPerformanceLighthouse, Web VitalsMain metrics by journeyGamificationCustom test harnessReward rules validation

### **6.5 Quality Assurance**

1. **Linting and formatting**: ESLint, Prettier, StyleLint

2. **Static analysis**: SonarQube, TypeScript strict mode

3. **Code review**: Mandatory peer review with journey specialists

4. **Performance monitoring**: Real-time metrics by journey

5. **Usability testing**: Regular sessions with real users focusing on journey transitions

6. **Gamification impact**: Metrics to measure engagement effect on health outcomes

## **7. Security and Compliance**

### **7.1 Security Strategy**

1. **Authentication**: OAuth 2.0 with MFA and biometric support

2. **Authorization**: Journey-based permission model with granular RBAC

3. **Encryption**: At rest (AES-256) and in transit (TLS 1.3)

4. **API Security**: Rate limiting, input validation, CORS with journey-specific quotas

5. **Data sanitization**: XSS and injection prevention

6. **Gamification security**: Anti-cheating measures and reward validation

### **7.2 Data Protection**

1. **Journey data isolation**: Clear boundaries between health, care, and plan data

2. **Data minimization**: Collection only of necessary data with journey-specific justification

3. **Retention policies**: Different retention periods based on journey data type

4. **Gamification privacy**: Optional participation in social features

5. **Auditing**: Comprehensive access logs organized by journey domain

### **7.3 Regulatory Compliance**

1. **LGPD**: Journey-specific consent and privacy controls

2. **Healthcare sector standards**: HL7, FHIR, ANS and CFM compliance

3. **Accessibility**: WCAG 2.1 level AA across all journeys

4. **Security**: OWASP Top 10, mobile security

5. **Gamification compliance**: Alignment with healthcare incentive regulations

## **8. Deployment and Infrastructure**

### **8.1 Deployment Architecture**

```markdown
┌─────────────────────────────────────────────────────────────┐
│                   AWS Cloud                                │
│                                                           │
│  ┌──────────────┐                                          │
│  │   Route53   │◄──── DNS                                 │
│  └──────┬──────┘                                          │
│        │                                                  │
│  ┌─────▼──────┐      ┌──────────────┐                     │
│  │ CloudFront  │◄────►│     S3      │ Media/Static        │
│  └──────┬──────┘      └──────────────┘                     │
│        │                                                  │
│  ┌─────▼──────┐      ┌──────────────┐                     │
│  │    ALB      │◄────►│   WAF       │ Web Security        │
│  └──────┬──────┘      └──────────────┘                     │
│        │                                                  │
│  ┌─────▼──────┐                                          │
│  │   ECS/EKS   │ Containers by journey                   │
│  └──────┬──────┘                                          │
│        │                                                  │
│  ┌─────▼──────┐      ┌──────────────┐  ┌──────────────┐   │
│  │   RDS       │◄────►│ ElastiCache │  │ MSK (Kafka) │   │
│  └──────────────┘      └──────────────┘  └──────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────────┘
```markdown

### **8.2 Deployment Strategy**

1. **Journey-based environments**: Development, Staging, Production with journey-specific pipelines

2. **CI/CD**: Automated deployment via GitHub Actions -> AWS

3. **Blue/Green**: Zero-downtime deployments with journey-specific rollout

4. **Canary releases**: Gradual rollout of gamification features

5. **Monitoring**: Proactive alerts organized by journey and gamification metrics

### **8.3 Scalability**

1. **Journey-specific auto-scaling**: Independent scaling based on usage patterns

2. **Gamification engine scaling**: Horizontal scaling for event processing

3. **Regional distribution**: Global CDN for static content

4. **Caching strategy**: Journey-specific cache policies

5. **Database sharding**: Partition strategy aligned with journey domains

## **9. Success Metrics**

### **9.1 Technical Metrics**

- **Performance**: Load time < 2s per journey, API response < 200ms

- **Uptime**: 99.95% availability for all journeys, 99.9% for gamification engine

- **Code quality**: Technical debt < 5%, journey-specific test coverage > 80%

- **Gamification performance**: Event processing < 30ms, 5k events/second

### **9.2 Experience Metrics**

- **Task completion**: > 92% success rate by journey

- **Satisfaction**: NPS > 55, CSAT > 4.5/5 by journey

- **Engagement**: 30-day retention +12pp vs previous version

- **Gamification impact**: Average weekly active quests > 3

### **9.3 Business Metrics**

- **Plan adherence**: +15% improvement in treatment compliance

- **Digital adoption**: Increased usage across journeys

- **Operational efficiency**: Claim auto-adjudication +20pp

- **Health outcomes**: Measurable improvement in preventive care metrics

- **Cost reduction**: Decreased unnecessary in-person visits

## **10. Conclusion**

This revised technical specification creates a simplified, intuitive experience with three clear journeys enhanced by a powerful gamification engine. By aligning the entire platform around "Minha Saúde" (My Health), "Cuidar-me Agora" (Care Now), and "Meu Plano & Benefícios" (My Plan & Benefits), we create mental models that match how users naturally think about their healthcare.

The gamification-first approach transforms routine healthcare interactions into engaging experiences that drive better health behaviors and outcomes. By leveraging game mechanics like quests, achievements, and rewards, we can significantly increase user engagement while making the healthcare journey more enjoyable and less anxiety-inducing.