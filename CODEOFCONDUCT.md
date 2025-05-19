# AUSTA SuperApp Code of Conduct

We are committed to building a welcoming, inclusive, and respectful community around the AUSTA SuperApp project. This code of conduct outlines our expectations for all those who participate in our community, as well as the consequences for unacceptable behavior.

## Our Pledge

In the interest of fostering an open and welcoming environment, we as contributors and maintainers pledge to make participation in our project and our community a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

## Our Standards

### Expected Behavior

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community and the healthcare users we serve
- Showing empathy towards other community members
- Respecting the journey-centered architecture of the project
- Considering the impact of your contributions on all three user journeys (Health, Care, and Plan)
- Supporting cross-journey functionality, especially through the gamification engine
- Adhering to established design system patterns and component architecture
- Maintaining consistency across web and mobile platforms

### Unacceptable Behavior

- The use of sexualized language or imagery and unwelcome sexual attention or advances
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information, such as a physical or electronic address, without explicit permission
- Conduct which could reasonably be considered inappropriate in a professional setting
- Disregarding the privacy and security requirements of healthcare data
- Introducing code that violates the project's commitment to accessibility
- Breaking the established architecture patterns without proper discussion and approval
- Implementing features that work in isolation without considering cross-journey impacts
- Ignoring established dependency management and module resolution standards

## Our Responsibilities

Project maintainers are responsible for clarifying the standards of acceptable behavior and are expected to take appropriate and fair corrective action in response to any instances of unacceptable behavior.

Project maintainers have the right and responsibility to remove, edit, or reject comments, commits, code, wiki edits, issues, and other contributions that are not aligned to this Code of Conduct, or to ban temporarily or permanently any contributor for other behaviors that they deem inappropriate, threatening, offensive, or harmful.

Maintainers are also responsible for ensuring that the refactored architecture is properly maintained, with special attention to:
- Preserving the journey-centered approach across all services
- Maintaining proper module resolution and dependency management
- Ensuring cross-journey functionality through the gamification engine
- Supporting the shared design system across platforms

## Scope

This Code of Conduct applies both within project spaces and in public spaces when an individual is representing the project or its community. Examples of representing a project or community include using an official project e-mail address, posting via an official social media account, or acting as an appointed representative at an online or offline event. Representation of a project may be further defined and clarified by project maintainers.

## Journey-Specific Considerations

### Health Journey

Contributors working on the Health Journey should be particularly mindful of:
- Privacy concerns, medical accuracy, and the sensitivity of health data
- Integration with wearable devices and EHR systems via FHIR APIs
- Time-series data storage and analysis for health metrics
- Real-time processing of health data for anomalies and trends

All discussions and implementations must prioritize user privacy and data security.

### Care Journey

Contributors to the Care Journey should recognize:
- The critical nature of care access features
- Appointment scheduling and provider system integration
- Telemedicine session requirements and WebRTC connections
- Care plan tracking and adherence monitoring

Implementations should consider the potential impact on users seeking immediate care.

### Plan Journey

Contributors to the Plan Journey should be mindful of:
- Financial and insurance implications of their work
- Insurance coverage synchronization with external systems
- Claims submission validation and processing
- Regulatory compliance requirements

All related features and documentation must ensure accuracy and clarity.

### Gamification Engine

Contributors to the Gamification Engine should ensure that:
- Engagement mechanisms are ethical, inclusive, and supportive of positive health behaviors
- Event processing from all journeys follows standardized schemas
- Achievement and reward systems are fair and motivational
- Leaderboards and social features respect privacy preferences

Implementations must avoid exploiting psychological vulnerabilities.

## Design System Considerations

Contributors working on the design system should adhere to:
- The layered architecture with clear separation of concerns
- Proper package boundaries between the four workspace packages
- Accessibility standards across all components
- Cross-platform compatibility between web and mobile
- Journey-specific theming and styling guidelines

## Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team at conduct@austa-health.com.br. All complaints will be reviewed and investigated promptly and fairly, and will result in a response that is deemed necessary and appropriate to the circumstances. The project team is obligated to maintain confidentiality with regard to the reporter of an incident. Further details of specific enforcement policies may be posted separately.

Project maintainers who do not follow or enforce the Code of Conduct in good faith may face temporary or permanent repercussions as determined by other members of the project's leadership.

## Enforcement Guidelines

### 1. Correction

**Community Impact**: Use of inappropriate language or other behavior deemed unprofessional or unwelcome in the community.

**Consequence**: A private, written warning from community leaders, providing clarity around the nature of the violation and an explanation of why the behavior was inappropriate. A public apology may be requested.

### 2. Warning

**Community Impact**: A violation through a single incident or series of actions.

**Consequence**: A warning with consequences for continued behavior. No interaction with the people involved, including unsolicited interaction with those enforcing the Code of Conduct, for a specified period of time. This includes avoiding interactions in community spaces as well as external channels like social media. Violating these terms may lead to a temporary or permanent ban.

### 3. Temporary Ban

**Community Impact**: A serious violation of community standards, including sustained inappropriate behavior.

**Consequence**: A temporary ban from any sort of interaction or public communication with the community for a specified period of time. No public or private interaction with the people involved, including unsolicited interaction with those enforcing the Code of Conduct, is allowed during this period. Violating these terms may lead to a permanent ban.

### 4. Permanent Ban

**Community Impact**: Demonstrating a pattern of violation of community standards, including sustained inappropriate behavior, harassment of an individual, or aggression toward or disparagement of classes of individuals.

**Consequence**: A permanent ban from any sort of public interaction within the community.

## Reporting Process

1. **Contact**: Email conduct@austa-health.com.br with details of the incident
2. **Information to Include**: 
   - Your contact information
   - Names of individuals involved
   - Description of the incident
   - Date and time of the incident
   - Any supporting information or evidence
3. **Response Timeline**: The Code of Conduct committee will respond within 48 hours to acknowledge receipt
4. **Investigation**: The committee will investigate the incident and determine appropriate action
5. **Resolution**: You will be informed of the resolution once the investigation is complete

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant](https://www.contributor-covenant.org), version 2.0, available at <https://www.contributor-covenant.org/version/2/0/code_of_conduct.html>.

Community Impact Guidelines were inspired by [Mozilla's code of conduct enforcement ladder](https://github.com/mozilla/diversity).

## Contact Information

For questions or concerns about this Code of Conduct, please contact:
- Email: conduct@austa-health.com.br
- Slack: #code-of-conduct channel in the AUSTA workspace
- Project Governance Committee: governance@austa-health.com.br