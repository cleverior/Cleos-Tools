# Cleos Tools - Code Review Report

**Date**: 2026-09-01  
**Branch**: main  
**Review Type**: Security, Bugs, Maintainability

---

## Executive Summary

Cleos Tools is a well-structured CLI for Vexanium BP wallet management. The codebase follows good patterns (modular services, config-driven, interactive UI). No critical security vulnerabilities found. Several medium/low issues identified for improvement.

---

## Security Findings

| Severity | Issue | File | Line | Description |
|----------|-------|------|------|-------------|
| **Low** | Command Injection Surface | `token.service.js` | 31-38 | User-provided `memo` passed to cleos without sanitization. Array args prevent shell injection, but memo could trigger cleos parsing edge cases. |
| **Medium** | Fragile Key Validation | `wallet.service.js` | 51 | `hasPrivateKey` checks stdout for "VEX" string. May break with cleos version changes or different key types. |

**Recommendations**:
- Add memo sanitization (remove control chars, limit length)
- Use regex to validate key pair format in stdout: `/\"[A-Z0-9]{50,}\",\s*\"[A-Z0-9]{50,}\"/`

---

## Bugs Found

| Severity | Issue | File | Line | Description |
|----------|-------|------|------|-------------|
| **Low** | Dead Code | `token.service.js` | 7-15 | Original `getTokens` function broken (returns only symbols). Superseded by `getTokensRobust` but left in code. |
| **Low** | Fragile Amount Parse | `index.js` | 659-661 | `parseFloat(token.amount)` where `token.amount` = "100.0000 VEX". Works due to JS parseFloat behavior but not explicit. |
| **Medium** | Inconsistent Error Patterns | Multiple | - | Services mix: return false, log.error + return false, throw. No unified error handling. |

**Fix Priority**: 
1. Remove dead `getTokens` function
2. Parse amount properly: `parseFloat(token.amount.split(' ')[0])`
3. Create shared error handling utility

---

## Maintainability Issues

| Issue | Impact | Files Affected |
|-------|--------|----------------|
| Duplicate config loads | Performance (minor) | All services call `config.load()` independently |
| Inconsistent service patterns | Code duplication | REX has `formatTx`; vote/reward/resource duplicate spinner logic |
| Scattered validation | Inconsistent rules | `validator.js` + inline validation in `index.js` |
| No JSDoc | Onboarding friction | All service files lack function documentation |

---

## Positive Observations

✅ Good separation of concerns (services/UI/utils/config)  
✅ Uses `spawnSync` with array args (prevents shell injection)  
✅ Auto-detects wallet status, passwords, voted BPs  
✅ Health checks before critical operations  
✅ Persistent config with sensible defaults  
✅ Activity logging for audit trail  
✅ ESC key handling in prompts  
✅ Color-coded, user-friendly output  

---

## Quick Wins (Can fix in < 1 hour each)

1. **Remove dead `getTokens` function** - `token.service.js` lines 7-15
2. **Fix amount parsing** - `index.js` line 659
3. **Add memo sanitization** - `token.service.js` before line 34
4. **Extract common spinner/error pattern** - Create `utils/cli.js` with `runCleos(cmd, args, opts)`
5. **Add JSDoc to service exports** - All `module.exports` in services

---

## Suggested Refactors (Medium effort)

1. **Unified Error Handling**: Create `utils/errors.js` with `handleError(result, context)` returning standardized result object
2. **Config Caching**: Add `config.get()` singleton or pass config object to services
3. **Input Validation Centralization**: Move all validation rules to `validator.js` with descriptive error messages
4. **Service Base Class**: Common pattern for services needing wallet unlock + cleos exec + spinner

---

## Files Modified in This Review

- `README.md` - Added Security Notes, Usage Caveats, Known Limitations sections
- `CLAUDE.md` - Created with full review summary for future reference
- `src/services/token.service.js` - Removed dead `getTokens` function, added `sanitizeMemo()` for memo sanitization
- `src/services/wallet.service.js` - Improved `hasPrivateKey()` regex validation for key pair format
- `index.js` - Fixed amount parsing to explicitly split amount from symbol

---

## Applied Fixes (Quick Wins)

✅ **Removed dead `getTokens` function** - `token.service.js` lines 7-15  
✅ **Fixed amount parsing** - `index.js` line 659, now uses `parseFloat(token.amount.split(' ')[0])`  
✅ **Added memo sanitization** - `token.service.js` new `sanitizeMemo()` function, strips control chars, limits to 256 chars  
✅ **Improved key validation** - `wallet.service.js` line 51, regex `/\"[A-Z0-9]{50,}\"/` matches valid key format  
✅ **Extracted common spinner/error pattern** - Created `src/utils/cli.js` with `runCleos()` and `runCleosJson()`  
✅ **Added JSDoc to service exports** - All `module.exports` in services now documented  
✅ **Unified Error Handling** - Created `src/utils/errors.js` with `handleResult()`, `wrapAsync()`  
✅ **Config Caching** - Added `config.get()` singleton + `config.clearCache()`  
✅ **Input Validation Centralization** - Extended `validator.js` with `isPrivateKey`, `isPublicKey`, `hasResourceAmount`, `isBroadcasterUrl`, `isWalletName`, fixed `parseAssetInput`  
✅ **Added unit tests** - `tests/validator.test.js` (55 passed), `tests/config.test.js` (8 passed)

---

## Remaining Next Steps (All Quick Wins Implemented)

✅ **Extract common spinner/error pattern** - `src/utils/cli.js` with `runCleos()` and `runCleosJson()`  
✅ **Add JSDoc to service exports** - All `module.exports` in services now documented  
✅ **Unified Error Handling** - `src/utils/errors.js` with `handleResult()`, `wrapAsync()`  
✅ **Config Caching** - `config.get()` singleton + `config.clearCache()`  
✅ **Input Validation Centralization** - `validator.js` extended with comprehensive validation  
✅ **Added unit tests** - `tests/validator.test.js` (55 passed), `tests/config.test.js` (8 passed)

---

### Suggested Refactors (Medium effort - Optional)

1. **Service Base Class**: Common pattern for services needing wallet unlock + cleos exec + spinner
2. **Integration test** with mock cleos
3. **TypeScript migration** for type safety