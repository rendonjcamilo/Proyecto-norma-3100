# Contributing to Norma 3100

Thank you for contributing to the Norma 3100 Compliance Management System! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Focus on code quality and user value
- Report security issues privately (do not open public issues)

## Getting Started

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/yourusername/Proyecto-Norma-3100.git
   cd Proyecto\ Norma\ 3100
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install dependencies**
   ```bash
   # Backend
   cd backend && npm install

   # Frontend
   cd frontend && npm install
   ```

4. **Start development environment**
   ```bash
   docker-compose up -d
   ```

## Development Workflow

### 1. Create Feature Branch

Branch naming convention:
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation
- `test/` - Tests
- `chore/` - Build, dependencies, etc.

```bash
git checkout -b feature/audit-trail-ui
```

### 2. Write Code

#### Backend (TypeScript)

```typescript
// src/modules/providers/CreateProviderService.ts
import { Pool } from 'pg';
import { logger } from '../../utils/logger.js';

export interface CreateProviderInput {
  rut: string;
  legalName: string;
  address: string;
  city: string;
  department: string;
}

export class CreateProviderService {
  constructor(private pool: Pool) {}

  async execute(input: CreateProviderInput): Promise<{
    id: string;
    message: string;
  }> {
    // Implementation
    logger.info('Provider created', { rut: input.rut });
    return { id: 'uuid', message: 'Provider created' };
  }
}
```

#### Frontend (React + TypeScript)

```typescript
// src/components/ProviderForm/ProviderForm.tsx
import React from 'react';

interface ProviderFormProps {
  onSubmit: (data: ProviderData) => void;
}

export const ProviderForm: React.FC<ProviderFormProps> = ({ onSubmit }) => {
  // Component implementation
  return <form>{/* JSX */}</form>;
};

export default ProviderForm;
```

### 3. Format & Lint

```bash
# Backend
cd backend
npm run lint:fix
npm run format

# Frontend
cd frontend
npm run lint:fix
npm run format
```

### 4. Write Tests

All new features must include tests.

```typescript
// Backend tests
describe('CreateProviderService', () => {
  it('should create a provider', async () => {
    const service = new CreateProviderService(pool);
    const result = await service.execute({
      rut: '1234567890',
      legalName: 'Test Provider',
      address: '123 Main St',
      city: 'Bogotá',
      department: 'Cundinamarca',
    });

    expect(result.id).toBeDefined();
  });
});
```

Run tests:
```bash
npm test
npm test:coverage
```

### 5. Commit Code

Commit message format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Examples:
```
feat(providers): add provider status filter to list view
fix(auth): correct JWT token refresh logic
docs(readme): update setup instructions
refactor(events): simplify event replay logic
test(cache): add cache manager unit tests
```

Commit guidelines:
- Use imperative mood ("add feature" not "added feature")
- Don't capitalize subject
- Keep subject under 50 characters
- Reference issues: "Closes #123"

```bash
git commit -m "feat(findings): implement finding severity levels

- Add severity enum (critical, major, minor)
- Update finding form with severity selector
- Add severity-based filtering to list view
- Update database schema with severity column

Closes #42"
```

### 6. Push to Your Branch

```bash
git push origin feature/your-feature-name
```

### 7. Create Pull Request

**PR Title:** Clear, concise description of changes

**PR Description Template:**
```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Changes
- Item 1
- Item 2

## Testing
Describe testing done:
- [ ] Unit tests added/updated
- [ ] Integration tests passed
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Linter passes
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No breaking changes

## Screenshots (if applicable)
```

## Code Standards

### Backend (Node.js/TypeScript)

**General Rules:**
- Strict TypeScript mode
- ESLint + Prettier enforced
- Function return types required
- No `any` type unless unavoidable

**Naming:**
- Classes: PascalCase (e.g., `CreateProviderService`)
- Functions: camelCase (e.g., `getProviders()`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_BATCH_SIZE`)

**Structure:**
```typescript
export class MyService {
  constructor(private dependency: Dependency) {}

  async doSomething(input: Input): Promise<Output> {
    // Validate input
    this.validateInput(input);

    // Perform operation
    const result = await this.operation(input);

    // Log
    logger.info('Operation completed', { result });

    return result;
  }

  private validateInput(input: Input): void {
    // Validation logic
  }
}
```

### Frontend (React/TypeScript)

**General Rules:**
- Functional components with hooks
- TypeScript strict mode
- Props interface defined per component

**Component Template:**
```typescript
interface ComponentProps {
  title: string;
  onSubmit: (data: Data) => void;
}

export const MyComponent: React.FC<ComponentProps> = ({ title, onSubmit }) => {
  const [state, setState] = React.useState<State | null>(null);

  React.useEffect(() => {
    // Effect
  }, []);

  const handleSubmit = (data: Data) => {
    onSubmit(data);
  };

  return (
    <div>
      <h1>{title}</h1>
      {/* JSX */}
    </div>
  );
};

export default MyComponent;
```

## Database Changes

If your PR modifies the database schema:

1. **Create a migration file**
   ```bash
   npm run migrate:create
   ```

2. **Write up and down migrations**
   ```sql
   -- UP: Add column
   ALTER TABLE providers ADD COLUMN tax_id VARCHAR(50);

   -- DOWN: Remove column
   ALTER TABLE providers DROP COLUMN tax_id;
   ```

3. **Test migration reversibility**
   ```bash
   npm run migrate:up
   npm run migrate:down
   npm run migrate:up
   ```

## Testing Requirements

### Coverage Targets
- Backend: ≥80% coverage
- Frontend: ≥70% coverage
- Critical paths: 100% coverage

### Test Command
```bash
npm test:coverage
```

## Documentation

### Update Documentation For:
- New features
- API changes
- Configuration updates
- Breaking changes

### Documentation Locations
- **README.md** - Overview and quick start
- **docs/** - Detailed documentation
- **Code comments** - Complex logic explanation
- **CHANGELOG.md** - Version history (managed automatically)

## Security

### Security Guidelines
- Never commit secrets or credentials
- Validate all user input
- Use parameterized queries
- Enable TypeScript strict mode
- Add security tests for auth/authorization

### Report Security Issues
- Do NOT open public issues
- Email: security@norma3100.dev
- Include: description, reproduction steps, impact

## Review Process

### Before Review
- [ ] Linter passes (`npm run lint`)
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] PR description complete
- [ ] Commits are atomic and well-message

### Review Checklist
Reviewers check:
- Code quality and standards compliance
- Test coverage and correctness
- Documentation accuracy
- Performance implications
- Security concerns

### After Approval
- Rebase on latest develop/main
- Squash commits if requested
- Merge PR

## Common Issues

### Tests Fail Locally
```bash
# Clean node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Run single test file
npm test -- MyService.test.ts
```

### Linting Issues
```bash
# Auto-fix most issues
npm run lint:fix

# Format all files
npm run format
```

### Database Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
npm run migrate:up
```

## Performance

### Performance Considerations
- Database queries should be indexed
- API responses should be <100ms
- Avoid N+1 queries
- Cache frequently accessed data
- Use pagination for large datasets

### Profiling
```bash
# Node.js profiling
node --prof src/index.ts
node --prof-process isolate-*.log > profile.txt
```

## Questions?

- Check existing issues/discussions
- Review code comments in related files
- Ask in pull request comments
- Contact the team

## Recognition

Contributors are recognized in:
- CHANGELOG.md (releases)
- GitHub contributors page
- Project acknowledgments

Thank you for contributing!

---

**Last Updated:** 2026-04-10
