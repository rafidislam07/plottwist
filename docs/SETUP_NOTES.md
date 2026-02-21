# PlotTwist – Setup Notes

## Initial Project Setup

- Created with Next.js (TypeScript, Tailwind, ESLint, App Router, src/ directory)
- Using Node v24.13.1
- Using SSH for GitHub authentication
- CI configured with GitHub Actions
  - Runs lint + build on push and PR
- Resolved npm audit issues:
  - Remaining vulnerabilities were dev-only
  - Did NOT run `npm audit fix --force` to avoid breaking changes
  - Confirmed production deps were clean using:
    npm audit --omit=dev

## Lessons Learned

- Always run `pwd` before destructive commands.
- Reinstall dependencies after changing Node versions.
- Commit package-lock.json to ensure consistent installs.
- Use SSH for smoother Git workflow.