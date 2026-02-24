# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

1. **Do NOT** open a public issue
2. Email the maintainers directly (if available)
3. Provide detailed information about the vulnerability
4. Allow time for the issue to be addressed before public disclosure

## Security Best Practices

### API Key Management

- Never commit API keys to the repository
- Use environment variables or CI/CD secrets
- Rotate API keys regularly
- Use masked variables in GitLab CI/CD

### Dependencies

- Keep dependencies up to date
- Run `npm audit` regularly
- Review security advisories

### Code Security

- Validate all inputs
- Sanitize outputs
- Use TypeScript for type safety
- Follow secure coding practices

## Disclosure Policy

- Security issues will be addressed promptly
- Fixes will be released as soon as possible
- Credit will be given to reporters (if desired)
